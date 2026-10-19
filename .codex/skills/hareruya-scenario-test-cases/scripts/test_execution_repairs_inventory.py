"""Regression tests for the inventory execution contracts, without output mutation."""
import html
import json
from pathlib import Path
import re
import unittest
from types import SimpleNamespace

import execution_repairs_inventory as repair
import generate_scenarios as g
import source_contract_adapter as adapter

ROOT = Path(__file__).resolve().parents[4]

class InventoryExecutionRepairsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        repair.configure(ROOT)
        cls.data = repair.DATA
        cls.specs = cls.data['scenario_repairs']
        cls.by_n = {int(sid.rsplit('-', 1)[1]): spec for sid, spec in cls.specs.items()}
        cls.contracts = {c['contract_id']: c for c in cls.data['step_resolutions']}
        cls.scenarios = {s.sid: s for s in g.generate(ROOT, '在庫管理', 8) if s.business_title == '在庫管理'}

    def contract(self, n, original_index):
        return self.contracts[next(x['contract_id'] for x in self.by_n[n]['steps'] if x['original_index'] == original_index)]

    def test_every_original_step_is_preserved_once_and_contract_matches(self):
        self.assertEqual(set(self.specs), set(self.scenarios))
        self.assertEqual(len(self.specs), 42)
        for sid, spec in self.specs.items():
            with self.subTest(sid=sid):
                indices = [v['original_index'] for v in spec['steps'] if v['original_index'] is not None]
                self.assertEqual(sorted(indices), list(range(1, spec['original_step_count']+1)))
                scenario = self.scenarios[sid]
                pattern = g.scenario_route_pattern(scenario)
                rows = g.normal_flow_rows(pattern)
                self.assertEqual(len(rows), len(spec['steps']))
                for row, step in zip(rows, spec['steps']):
                    contract = adapter.find('在庫管理', pattern, row, g.business_action_from_row(row, pattern.name))
                    self.assertEqual(contract['contract_id'], step['contract_id'])
                self.assertIs(repair.prepare_scenario(scenario, g), scenario)
                self.assertEqual(len(g.normal_flow_rows(g.scenario_route_pattern(scenario))), len(rows))

    def test_all_citations_quote_the_declared_physical_line(self):
        sources = {}
        for c in self.contracts.values():
            for e in c['evidence']:
                if e['file'] not in sources:
                    sources[e['file']] = (ROOT/e['file']).read_text().splitlines()
                raw = sources[e['file']][e['line']-1]
                plain = html.unescape(re.sub(r'<[^>]*>', '', raw)).strip() if e['file'].endswith('.html') else raw.strip()
                self.assertTrue(e['quote'])
                self.assertEqual(e['quote'], plain, (c['contract_id'], e['file'], e['line']))

    def test_shipment_pick_and_shortage_precede_approval(self):
        for n in [2,3,4,5]:
            order = [s['original_index'] for s in self.by_n[n]['steps']]
            self.assertLess(order.index(9), order.index(4))
            if n == 3:
                self.assertLess(order.index(10), order.index(4))
            self.assertNotIn('M04-27', {f for s in self.by_n[n]['steps'] for f in s['function_ids']})
            self.assertIn('移動指示ID,送り状No.', self.contract(n,6)['operation'])
        self.assertIn('6点/600円', self.contract(3,15)['expected_result'])
        self.assertIn('8点/800円', self.contract(4,15)['expected_result'])

    def test_actual_pre_states_and_stock_conservation(self):
        self.assertEqual(self.by_n[1]['seed']['開始在庫数'], '0')
        self.assertIn('0点/0円→3点/300円', self.contract(1,4)['expected_result'])
        for n in [27,28,31,32]:
            self.assertEqual(self.by_n[n]['seed']['開始総原価'], '3000')
            final = self.by_n[n]['final_state']
            for value in ['7点/2100円', 'A10点/1000円', 'B7点/700円', '900円']:
                self.assertIn(value, final)
            # Opening balances 3000+400+400 equal closing balances 2100+1000+700.
            self.assertEqual(3000 + 400 + 400, 2100 + 1000 + 700)
            self.assertIn('この工程では登録ボタンを押さない', self.contract(n,1)['operation'])
        for n in [29,30]:
            self.assertEqual(self.by_n[n]['seed']['開始在庫数'], '0')
            self.assertIn('準備では作成しない', ' '.join(self.by_n[n]['preparation']))
            self.assertIn('3点/総原価900円', self.by_n[n]['final_state'])
            self.assertEqual(1000+1000,400+700+900)

    def test_count_registration_is_not_repeated_and_approval_is_explicit(self):
        for n in [19,39]:
            self.assertIn('数量CSV登録/反映を行わない', self.contract(n,2)['operation'])
            self.assertIn('同じ計画へ数量CSV登録', self.contract(n,4)['operation'])
            self.assertIn('差異-1', self.contract(n,5)['expected_result'])
        for n in [14,18,34]:
            appended=[a for a in self.by_n[n]['steps'] if a['original_index'] is None]
            self.assertTrue(any('M04-32' in a['function_ids'] for a in appended))

    def test_blockers_are_scoped_and_unsafe_lending_assumption_rejected(self):
        for sid, spec in self.specs.items():
            s=SimpleNamespace(sid=sid,business='在庫管理',repo=ROOT)
            full=repair.preparation(s,route=True)
            for b in spec.get('blocker_steps', []):
                self.assertTrue(b['steps'])
                for n in range(1,len(spec['steps'])+1):
                    individual=repair.preparation(s,row_no=n,route=False)
                    self.assertEqual(any('実施保留条件: '+b['reason']==r for r in individual), n in b['steps'])
                self.assertIn('実施保留条件: '+b['reason'], full)
        self.assertIn('仮', self.by_n[26]['seed']['貸出店'])
        self.assertNotIn('非販売運用', self.by_n[26]['seed']['貸出店'])
        self.assertEqual(self.contract(26,2)['disposition'], 'unresolved')
        self.assertEqual(repair.preparation(SimpleNamespace(business='通販受注管理')), [])

    def test_all_memory_rendering_keeps_concrete_contract_results(self):
        for sid,s in self.scenarios.items():
            output=g.render_scenario(s,ROOT)
            for entry in self.specs[sid]['steps']:
                c=self.contracts[entry['contract_id']]
                self.assertIn(c['expected_result'],output,(sid,c['contract_id']))
            self.assertNotIn('UNRESOLVED_FUNCTION_SPEC',output)
            self.assertIn('採番記録手順',output)

    def test_subflow_scope_uses_only_transfer_child_steps(self):
        for n in [7,8,9]:
            targets=[c for c in self.contracts.values() if any(o['scenario_id'].endswith(f'-{n:03d}') for o in c['occurrences']) and c.get('subflow_targets')]
            for c in targets:
                for target in c['subflow_targets']:
                    if target['scenario_id'].endswith('-002'):
                        self.assertEqual(target['target_steps'], list(range(3,15)))

    def test_bound_data_patterns_keep_their_own_card_and_quantity(self):
        sid=next(sid for sid in self.specs if sid.endswith('-016'))
        seed={**self.specs[sid]['seed'], '商品コード':'ST-DP-RARE',
              '対象カード':'スタンダード範囲のR・買取価格あり', '依頼先':'トレードチーム'}
        s=SimpleNamespace(sid=sid,business='在庫管理',repo=ROOT,seed=seed)
        value='\n'.join(repair.preparation(s,row_no=5))
        self.assertIn('商品コード=ST-DP-RARE',value)
        self.assertIn('Rare',value)
        self.assertIn('買取価格=10',value)
        self.assertNotIn('買取価格=0',value)
        sid=next(sid for sid in self.specs if sid.endswith('-018'))
        s=SimpleNamespace(sid=sid,business='在庫管理',repo=ROOT,
                          seed={**self.specs[sid]['seed'],'別担当者の入力数量':'2'})
        value='\n'.join(repair.preparation(s,row_no=3))
        self.assertIn('元ファイル数量=3、別担当者の入力数量=2、現物数量=3',value)

    def test_isolated_stock_items_do_not_claim_workbook_execution(self):
        sid=next(sid for sid in self.specs if sid.endswith('-003'))
        s=SimpleNamespace(sid=sid,business='在庫管理',repo=ROOT)
        self.assertEqual(repair.prerequisite_steps(s,5),[3,4])
        value='\n'.join(repair.preparation(s,row_no=5))
        self.assertIn('外部ファイル変換を完了したとは扱わず',value)
        s=SimpleNamespace(sid='SCN-TSUHAN-在庫移動準備業務-900',business='通販受注管理')
        value='\n'.join(repair.preparation(s))
        self.assertIn('商品B2点',value)
        self.assertIn('出庫承認済み・移動指示未作成',value)
        self.assertNotIn('注文',value)

    def test_surplus_transport_is_not_larger_than_counted_stock_by_assumption(self):
        self.assertEqual(self.by_n[6]['seed']['棚卸数量'],'2')
        self.assertIn('未定義',self.by_n[6]['seed']['配送閾値'])
        self.assertNotEqual(self.by_n[6]['seed']['移動数量'],'3')
        order=[a['original_index'] for a in self.by_n[6]['steps']]
        self.assertLess(order.index(5),order.index(4))
        self.assertIn('固定3点の入力はしない',self.contract(6,6)['operation'])
        self.assertIn('商品コード・言語・状態・数量3点',self.contract(900,2)['expected_result'])

if __name__ == '__main__':
    unittest.main()
