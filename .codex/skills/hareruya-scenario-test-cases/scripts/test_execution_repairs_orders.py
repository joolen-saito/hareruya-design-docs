"""初回採番・期限・二重入庫・異常枝の実行矛盾を防ぐ回帰。"""
import html
import json
import re
import sys
import unittest
from datetime import date
from pathlib import Path
from types import SimpleNamespace

import execution_repairs_orders as repairs
import generate_scenarios as g
import source_contract_adapter as adapter

REPO = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(REPO / "scenario_test/tools"))
from prepare_orders_order_date import recipe


class OrdersExecutionRepairTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.all = g.generate(REPO, None, 40)
        cls.scenarios = [s for s in cls.all if s.business_title in repairs.BUSINESSES]
        cls.data = json.loads((REPO / "scenario_test/coverage/execution_repairs/orders_contracts.json").read_text())

    def scenario(self, code, number):
        return next(s for s in self.scenarios if s.sid.startswith("SCN-" + code + "-") and s.sid.endswith(f"-{number:03}"))

    def contract(self, cid):
        return next(c for c in self.data["step_resolutions"] if c["contract_id"] == cid)

    def test_all_48_scenarios_render_without_unbound_values(self):
        self.assertEqual(len(self.scenarios),48)
        for s in self.scenarios:
            text = g.render_scenario(s, REPO)
            self.assertNotIn("{{", text, s.sid)

    def test_source_quotes_exist_at_cited_lines(self):
        normalize = lambda value: re.sub(r"\s+", "", re.sub(r"<[^>]*>", "", html.unescape(value)))
        for c in self.data["step_resolutions"]:
            for e in c.get("evidence", []):
                raw = " ".join((REPO/e["file"]).read_text().splitlines()[e["line"]-1:e.get("end_line",e["line"])])
                self.assertIn(normalize(e["quote"]), normalize(raw), (c["contract_id"],e))

    def test_pickup_all_deadlines_relative_to_run_date(self):
        for s in [x for x in self.scenarios if x.business_title == "店頭受取受注管理"]:
            for as_of in ("2026-10-09","2027-01-01"):
                v = repairs.pickup_dates(s.sid,as_of)
                n = int(s.sid[-3:]); days=14 if "スムーズ" in s.sid else 1 if "店内PC" in s.sid else 7
                deadline=date.fromisoformat(v["受取期限"][:10]); ordered=date.fromisoformat(v["注文日"])
                self.assertEqual((deadline-ordered).days,days-1)
                self.assertEqual(deadline < date.fromisoformat(as_of),n in (2,4,6,8))

    def test_order_date_changes_existing_record_only_and_restores(self):
        r=recipe(self.scenario("ORDER",4).sid,12,"ORD-123","2026-10-09")
        self.assertFalse(r["runtime_executed"])
        self.assertIn("id = 12 AND order_no = 'ORD-123'",r["sql"][1])
        self.assertIn("before_order_date",r["sql"][1])
        self.assertIn("AS restore_sql",r["sql"][1])
        self.assertIn("AND order_date = %L",r["sql"][1])
        self.assertNotIn("INSERT",r["sql"][1])
        self.assertIn("0件なら",r["restoration"])
        for oid, ono in ((0,"ORD-1"),(12,"' OR 1=1 --"),(12,"$(env)")):
            with self.assertRaises(ValueError):recipe(self.scenario("ORDER",4).sid,oid,ono,"2026-10-09")

    def test_purchase_has_no_initial_order_and_correct_payment(self):
        for code,n in (("TSUHAN",1),("TSUHAN",2),("TSUHAN",901),("ORDER",1),("ORDER",3)):
            v=g.execution_seed(self.scenario(code,n))
            self.assertEqual(v["注文開始状態"],"未注文・未採番")
            self.assertIn("未決済",v["決済状態"])
        self.assertEqual(g.execution_seed(self.scenario("TSUHAN",1))["支払方法"],"銀行振込")
        self.assertEqual(g.execution_seed(self.scenario("TSUHAN",2))["支払方法"],"クレジットカード")

    def test_pickup_customer_traverses_cart(self):
        for cid in ("SC-026","SC-031","SC-036","SC-038"):
            c=self.contract(cid)
            self.assertEqual(c["function_ids"],["F03-02","F04-01","F04-02","F04-04"])
            self.assertIn("カートへ追加",c["operation"])

    def test_otc_print_and_single_inventory_entry(self):
        self.assertIn("印刷済み",self.contract("ORDER-EXEC-002")["operation"])
        c=self.contract("SC-019")
        self.assertIn("入庫済み",c["operation"])
        self.assertNotIn("M04-32",c["function_ids"])
        self.assertIn("13",c["expected_result"])
        self.assertIn("5,200",c["expected_result"])
        self.assertIn("15",c["expected_result"])
        self.assertIn("CSV",self.contract("ORDER-EXEC-004")["operation"])

    def test_partial_purchase_and_high_price_have_consistent_amounts(self):
        v=g.execution_seed(self.scenario("KAITORI",2))
        self.assertEqual((v["買取成立数量"],v["査定単価"],v["査定金額"]),("2","400円","800円"))
        v=g.execution_seed(self.scenario("KAITORI",5))
        self.assertEqual((v["数量"],v["査定単価"],v["査定金額"]),("3","500円","1,500円"))

    def test_network_amount_aliases_are_equal(self):
        v=g.execution_seed(self.scenario("ONLINE-KAITORI",4))
        self.assertEqual(v["査定金額"],v["査定額"])
        self.assertEqual(v["査定金額"],v["買取額"])

    def test_shipping_import_and_refund_screens(self):
        for cid in ("ORDER-EXEC-011","ORDER-EXEC-012","ORDER-EXEC-013","ORDER-EXEC-014","ORDER-EXEC-018"):
            c=self.contract(cid)
            self.assertIn("M05-26",c["function_ids"])
            self.assertNotIn("M05-24",c["function_ids"])
        self.assertEqual(self.contract("ORDER-EXEC-010")["function_ids"],["M08-01","M08-05","M08-06"])
        v=g.execution_seed(self.scenario("TSUHAN",13))
        self.assertGreaterEqual(v["出荷日"][:10],v["発売日"])

    def test_pc_cancel_deletes_ticket_once(self):
        s=self.scenario("ORDER",8)
        self.assertFalse(any("入金済みにした店頭注文番号" in g.full_text(r) for r in s.route.rows))
        self.assertRegex(g.execution_seed(s)["店頭注文番号札"],r"^[A-Za-z0-9]+$")

    def test_delete_preserves_current_smooth_and_normal_states(self):
        c=self.contract("ORDER-EXEC-SMAREGI-DELETE")
        for state in ("出荷完了","引き渡し済み","キャンセル"):
            self.assertIn(state,c["operation"])
        self.assertIn("0405",c["reason"])

    def test_incomplete_assessment_stops_before_consent(self):
        s=SimpleNamespace(sid="SCN-ONLINE-KAITORI-ネット買取処理カード-007",business="ネット買取",route_kind="例外経路",branch_rows=[{"分岐ID":"E1"}])
        operations=repairs.branch_operations(s,"E1",None)
        self.assertIn("査定未完了",operations[0])
        self.assertIn("進まない",operations[-1])

    def test_preparation_contains_real_date_tool_and_restoration(self):
        s=self.scenario("ORDER",4)
        doc=SimpleNamespace(sid=s.sid,business=s.business_title,seed=g.execution_seed(s))
        text=" ".join(repairs.preparation(doc,row_no=5))
        self.assertIn("prepare_orders_order_date.py",text)
        self.assertIn("restore_sql",text)
        self.assertNotIn("試験時計を",text)
        self.assertNotIn("/fixture/",text)

    def test_external_refund_failure_is_blocked_until_reproducible(self):
        s=self.scenario("TSUHAN",16)
        doc=SimpleNamespace(sid=s.sid,business=s.business_title,seed=g.execution_seed(s),normal_rows=[])
        self.assertIn("実施保留: SPLINKS", " ".join(repairs.preparation(doc,route=True)))

    def test_origin_is_resolved_only_for_documented_input_acquisition(self):
        self.assertIn("F05-06",repairs.resolve_link_origin("会員*1","起点","ネット買取"))
        self.assertIn("原本取得手段が未確定",repairs.resolve_link_origin("スタック用紙","起点","店頭受取受注管理"))
        self.assertIsNone(repairs.resolve_link_origin("並び順ファイル","起点","店頭買取"))

    def test_same_order_901_preserves_two_items_through_purchase_and_pack(self):
        s=self.scenario("TSUHAN",901)
        v=g.execution_seed(s)
        self.assertEqual((v["数量"],v["商品代金"]),("2","2,000円"))
        p=g.scenario_route_pattern(s)
        for number in (1,4,5):
            row=g.normal_flow_rows(p)[number-1]
            c=adapter.find(s.business_title,p,row,g.business_action_from_row(row,p.name))
            expected=repairs.repair_text(s,c["expected_result"],g)
            self.assertIn("2点",expected)
            self.assertNotIn("3点",expected)

    def test_manual_inventory_starts_with_existing_accepted_assessment(self):
        s=self.scenario("KAITORI",7)
        v=g.execution_seed(s)
        self.assertEqual(v["買取ステータス"],"入庫待ち")
        self.assertNotIn("未採番",v["査定ID"])
        text=" ".join(repairs.preparation(SimpleNamespace(sid=s.sid,business=s.business_title,seed=v,normal_rows=[])))
        self.assertIn("次の自動入庫前",text)
        self.assertIn("そのデータを再入庫せず",text)

    def test_inventory_dispatch_900_does_not_create_customer_order(self):
        s=SimpleNamespace(sid="SCN-TSUHAN-在庫移動準備業務-900",business="通販受注管理")
        v={"商品A":"ST-STOCK-PREP-A","移動A数量":"3","商品B":"ST-STOCK-PREP-B","移動B数量":"2"}
        self.assertEqual(repairs.seed(s,v),v)
        self.assertEqual(repairs.preparation(s),[])

    def test_nonmember_delta_overrides_registered_representative_seed(self):
        s=self.scenario("KAITORI",1)
        patterns=g.data_patterns_for(s,g.execution_seed(s))
        p=next(p for p in patterns if "非会員" in p.purpose)
        self.assertIn("顧客区分=非会員",p.input_data)
        self.assertIn("会員番号=未登録",p.input_data)
        self.assertNotIn("会員番号=ST-MEMBER",p.input_data)
        self.assertIn("ログインを行わず",p.precondition_delta)


if __name__=="__main__":unittest.main()
