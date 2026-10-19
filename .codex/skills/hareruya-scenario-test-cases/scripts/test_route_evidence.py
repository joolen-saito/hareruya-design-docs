"""Semantic regressions for adopted business routes (no generated files are changed)."""
import json
import unittest
from pathlib import Path

import generate_scenarios as g
import validate_scenarios as v


REPO = Path(__file__).resolve().parents[4]


class SourceRoutes(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        g.reset_generation_state()
        candidates=[]
        for path,title,business,text in g.discover_flows(REPO,None):
            for pattern in g.parse_patterns(text):
                pattern.source_path=str(path)
                candidates.append((path,title,business,text,pattern))
        cls.items=g.dedupe_patterns(candidates)
        cls.routes={(str(path.name),p.number,p.name):g.routes_for_pattern(b,p) for path,_t,b,_s,p in cls.items}

    def routes_for(self, source, number, name=None):
        return next(value for (f,n,t),value in self.routes.items() if f==source and n==number and (name is None or name==t))

    @staticmethod
    def rnums(route):
        return {g.row_r_number(r) for r in route.rows}

    def test_member_rejection_stops_before_registration_and_points(self):
        rejection=next(r for r in self.routes_for('08_イベント管理.md','3') if '会員登録拒否' in r.title)
        self.assertTrue({'168','174','180','186'}.isdisjoint(self.rnums(rejection)))
        self.assertEqual(dict(rejection.inputs)['登録意思'],'拒否')
        self.assertIn('終了',rejection.final_state)

    def test_payout_and_return_do_not_mix(self):
        routes=self.routes_for('14_ネット買取.md','2')
        payout=next(r for r in routes if '売却承諾' in r.title)
        returned=next(r for r in routes if '売却拒否' in r.title)
        self.assertTrue({'181','189'}.isdisjoint(self.rnums(payout)))
        self.assertTrue({'159','163','167','172','177'}.isdisjoint(self.rnums(returned)))
        self.assertIn('入庫待ち',payout.final_state)
        self.assertIn('振込結果',payout.final_state)
        self.assertIn('受領',returned.final_state)

    def test_splinks_failure_hands_off_without_claiming_refund(self):
        failed=next(r for r in self.routes_for('16_通販受注管理.md','8') if '減額不能' in r.title)
        self.assertEqual(dict(failed.inputs)['減額後金額'],'3,000円（減額未実施）')
        self.assertIn('依頼元部署へ引き継',failed.final_state)
        self.assertIn('未実施',failed.final_state)

    def test_business_time_preparation_has_clock_and_separate_steps(self):
        before,after=self.routes_for('16_通販受注管理.md','3')
        self.assertIn('14:00',dict(before.inputs)['業務確認日時'])
        self.assertIn('16:00',dict(after.inputs)['業務確認日時'])
        self.assertIn('業務時計',after.preparation)
        self.assertNotIn('188',self.rnums(before))
        self.assertIn('188',self.rnums(after))

    def test_registered_mail_branches_keep_disjunction_separate(self):
        routes=self.routes_for('14_ネット買取.md','3')
        self.assertEqual(len(routes),3)
        for route in routes[1:]:
            self.assertTrue({'204','208','212','218','222'}.isdisjoint(self.rnums(route)))
        self.assertEqual(dict(routes[2].inputs)['本人確認状態'],'未確認')

    def test_point_refund_has_no_bank_transfer_steps(self):
        routes=self.routes_for('16_通販受注管理.md','9')
        self.assertNotIn('395',self.rnums(routes[0]))
        for route in routes[1:]:
            self.assertTrue({'368','375','380'}.isdisjoint(self.rnums(route)))
            self.assertIn('395',self.rnums(route))

    def test_tobe_deck_decisions_cannot_disagree(self):
        routes=self.routes_for('10_商品登録・編集_tobe.md','4')
        self.assertEqual(len(routes),2)
        for route in routes:
            nums=self.rnums(route)
            self.assertTrue({'172','176','181'}.isdisjoint(nums))
            self.assertEqual('155' in nums,'190' in nums)
            self.assertNotEqual('190' in nums,'195' in nums)

    def test_store_buy_cancel_does_not_pay_or_receive(self):
        route=next(r for r in self.routes_for('06_店頭買取.md','1') if '全品キャンセルで' in r.title)
        self.assertEqual(self.rnums(route),{'22','28','34','40','46','52'})

    def test_inventory_quantity_only_routes_do_not_reclassify(self):
        routes=self.routes_for('12_在庫管理.md','2')
        for route in routes[:3]:
            self.assertNotIn('303',self.rnums(route))
        self.assertIn('303',self.rnums(routes[3]))

    def test_identity_loop_preserves_initial_review(self):
        for route in self.routes_for('14_ネット買取.md','1'):
            self.assertTrue({'50','55'}.issubset(self.rnums(route)))

    def test_cash_detail_after_source_gap_is_preserved(self):
        p=next(p for path,_t,_b,_s,p in self.items if path.name=='06_店頭買取.md' and p.number=='1')
        row=next(r for r in p.rows if g.row_r_number(r)=='59')
        self.assertIn('経理払い出し待ち',g.full_text(row))

    def test_inventory_eight_operations_are_independent(self):
        routes=self.routes_for('12_在庫管理.md','1')
        self.assertEqual(len(routes),8)
        self.assertEqual(self.rnums(routes[1]),{'69','75','84'})
        self.assertEqual(self.rnums(routes[3]),{'137','144','150','159'})
        self.assertEqual([g.row_r_number(r) for r in routes[3].rows],['137','144','150','159'])
        self.assertEqual(self.rnums(routes[7]),{'55','58','62'})

    def test_inventory_counts_separate_low_and_other(self):
        low,other,*_=self.routes_for('12_在庫管理.md','10')
        self.assertTrue({'645','649','655'}.isdisjoint(self.rnums(low)))
        self.assertTrue({'621','625','630','636','642'}.isdisjoint(self.rnums(other)))

    def test_new_evidence_quotes_exist_in_raw_sources(self):
        for (source,number,_name),routes in self.routes.items():
            raw=(REPO/'scenario_test/markdown'/source).read_text()
            for route in routes:
                if route.evidence:
                    quote=route.evidence.split('「',1)[1].rsplit('」',1)[0]
                    self.assertIn(quote,raw,(source,number,route.route_id))

    def test_original_ids_are_valid_and_unique(self):
        ids=json.loads((Path(__file__).parent.parent/'references/route-id-baseline.json').read_text())
        self.assertGreaterEqual(len(ids),90)
        self.assertEqual(len(set(ids.values())),len(ids))
        self.assertEqual(ids['通販受注管理 / パターン8 / SPLINKS返金処理|R01'],'SCN-TSUHAN-SPLINKS返金処-011')
        self.assertEqual(ids['ネット買取 / パターン2 / ネット買取処理（カード受け取り後から振込までの業務）|R02'],'SCN-ONLINE-KAITORI-ネット買取処理カード-004')
        for value in ids.values():
            self.assertRegex(value,r'^SCN-.+-\d{3}$')

    def test_observable_oracle_accepts_concrete_results_and_rejects_vague(self):
        for valid in ("同じ受注番号の数量がCSVと一致すること。", "商品コードと数量が一致する。", "同じ申込IDの申込状況がキャンセル済みになること。", "対象商品コードと数量が記録されること。 実施保留条件: 外部環境が必要。"):
            self.assertTrue(v.observable_assertion(valid),valid)
        for invalid in ("作業が完了すること。", "設計書の通り。", "確認する。", "正常に進むこと。", "注文を確認する。"):
            self.assertFalse(v.observable_assertion(invalid),invalid)


if __name__ == '__main__':
    unittest.main()
