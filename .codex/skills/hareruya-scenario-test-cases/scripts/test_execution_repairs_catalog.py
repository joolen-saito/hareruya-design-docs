"""誤った画面・承認前の公開・異なる顧客IDの混在を防ぐ回帰検査。"""
import html
import json
import re
import unittest
from pathlib import Path
from types import SimpleNamespace

import generate_scenarios as g
import execution_repairs_catalog as repairs
import source_contract_adapter as adapter

REPO = Path(__file__).resolve().parents[4]


class CatalogExecutionRepairTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.scenarios = g.generate(REPO, None, 8)
        cls.data = json.loads((REPO / "scenario_test/coverage/execution_repairs/catalog_contracts.json").read_text())

    def scenario(self, code, number):
        return next(s for s in self.scenarios if s.sid.startswith("SCN-" + code + "-") and s.sid.endswith(f"-{number:03}"))

    def contracts(self, code, number):
        s = self.scenario(code, number)
        p = g.scenario_route_pattern(s)
        return [adapter.find(s.business_title, p, row, g.business_action_from_row(row, p.name)) for row in g.normal_flow_rows(p)]

    def test_every_contract_applies_once(self):
        actual = []
        for s in self.scenarios:
            if s.sid not in self.data["scope"]:
                continue
            p = g.scenario_route_pattern(s)
            for row in g.normal_flow_rows(p):
                contract = adapter.find(s.business_title, p, row, g.business_action_from_row(row, p.name))
                if contract and contract["contract_id"].startswith("CAT-EXEC-"):
                    actual.append(contract["contract_id"])
        expected = [c["contract_id"] for c in self.data["step_resolutions"]]
        self.assertCountEqual(expected, actual)
        self.assertEqual(len(actual), len(set(actual)))

    def test_source_quotes_exist(self):
        for c in self.data["step_resolutions"]:
            for e in c["source_evidence"] + c["evidence"]:
                raw = (REPO / e["file"]).read_text().splitlines()[e["line"] - 1]
                clean = re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]*>", "", raw)).strip())
                normalize = lambda value: re.sub(r"\s+", "", value)
                self.assertIn(normalize(e["quote"]), [normalize(raw), normalize(clean)], (c["contract_id"], e["file"], e["line"]))

    def test_ids_preserved(self):
        self.assertEqual(len(self.data["scope"]), 39)
        self.assertTrue(set(self.data["scope"]).issubset({s.sid for s in self.scenarios}))

    def test_goods_and_card_import_do_not_mix(self):
        self.assertIn("M03-26", self.contracts("PRODUCT", 8)[-1]["function_ids"])
        self.assertNotIn("M03-27", self.contracts("PRODUCT", 8)[-1]["function_ids"])
        self.assertIn("M03-27", self.contracts("PRODUCT", 12)[-1]["function_ids"])
        self.assertNotIn("M03-26", self.contracts("PRODUCT", 12)[-1]["function_ids"])

    def test_stock_approval_before_publish(self):
        contracts = self.contracts("PRODUCT", 4)
        self.assertIn("M04-21", contracts[6]["function_ids"])
        self.assertIn("未承認", contracts[6]["expected_result"])
        self.assertIn("M04-32", contracts[7]["function_ids"])
        self.assertIn("別", contracts[7]["operation"])
        self.assertIn("900", contracts[7]["expected_result"])
        self.assertEqual(len(contracts), 9)

    def test_normal_price_does_not_invoke_sale_import(self):
        for n in (2, 3, 4, 5, 6):
            last = self.contracts("PRICE", n)[-1]
            self.assertIn("M03-30", last["function_ids"])
            self.assertNotIn("M03-31", last["function_ids"])
            self.assertIn("1200", last["expected_result"])

    def test_sale_import_order_and_values(self):
        c = self.contracts("PRICE", 1)[3]
        self.assertIn("M03-31", c["function_ids"])
        self.assertNotIn("M03-34", c["function_ids"])
        self.assertIn("先に", c["operation"])
        self.assertIn("800", c["expected_result"])

    def test_nonmember_is_not_precreated_or_online_enrolled(self):
        for n in (7, 9):
            s = self.scenario("EVENT", n)
            first = self.contracts("EVENT", n)[0]
            self.assertIn("非会員", first["operation"])
            self.assertEqual(first["kind"], "physical")
            self.assertIn("未採番", repairs.seed(s, {}, g)["会員番号"])

    def test_customer_event_entry_uses_front(self):
        for n in (3, 4, 5, 8):
            c = self.contracts("EVENT", n)[0]
            self.assertIn("F07-04", c["function_ids"])
            self.assertNotIn("M13-06", c["function_ids"])

    def test_deck_admin_publish_does_not_use_owner_api(self):
        for n in (2, 7):
            c = self.contracts("DECK", n)[-1]
            self.assertEqual(c["function_ids"], ["M15-01", "M15-05"])
            self.assertIn("実デッキID", c["operation"])

    def test_event_schedule_screen_and_pdf_path(self):
        self.assertIn("M13-03", self.contracts("EVENT", 1)[2]["function_ids"])
        c = self.contracts("EVENT", 11)[0]
        self.assertIn("PDF保存", c["operation"])
        self.assertTrue(any("EntryController.php" in e["file"] for e in c["evidence"]))

    def test_external_originals_are_not_reported_as_executable(self):
        for code, n, i in (("SHIIRE", 2, 2), ("SHIIRE", 3, 0), ("EVENT", 5, 5), ("PRODUCT", 7, 1)):
            c = self.contracts(code, n)[i]
            self.assertEqual(c["disposition"], "unresolved")
            self.assertTrue(c["reason"])

    def test_unresolved_contract_keeps_the_business_result(self):
        for c in self.data["step_resolutions"]:
            self.assertNotIn("この工程は原本/運用定義の取得まで実行結果を確定しない", c["expected_result"])
            if c["disposition"] == "unresolved":
                self.assertTrue(c["reason"])
                self.assertNotIn("保留として記録", c["expected_result"])

    def test_preparation_accepts_sti_scenario_doc(self):
        s = SimpleNamespace(sid=self.scenario("EVENT", 7).sid, business="イベント管理")
        text = " ".join(repairs.preparation(s, row_no=5))
        self.assertIn("fixtureは作成しない", text)
        self.assertIn("前工程", text)

    def test_after_event_deck_registration_remains_within_deadline(self):
        for n, index in ((6, 4), (7, 4), (10, 3)):
            scenario = self.scenario("EVENT", n)
            self.assertIn("23:59", repairs.seed(scenario, {}, g)["デッキ登録締切"])
            contract = self.contracts("EVENT", n)[index]
            self.assertEqual(contract["function_ids"], ["F07-03", "F06-16", "F06-17"])
            self.assertIn("大会終了後", contract["operation"])
            self.assertIn("オンライン申込していない", contract["operation"])

    def test_card_image_mapping_actor_and_predecessor(self):
        cs = self.contracts("PRODUCT", 2)
        self.assertEqual(cs[2]["actor"], "ITチーム")
        self.assertNotIn("工程1で登録済みの英名", cs[4]["operation"])
        self.assertIn("M14-08", cs[4]["operation"])

    def test_origin_resolution_only_for_verified_producers(self):
        self.assertIn("デザイン室", repairs.resolve_link_origin("バナー画像", "", "イベント管理"))
        self.assertIn("F06-16", repairs.resolve_link_origin("デッキリスト", "", "イベント管理"))
        self.assertIsNone(repairs.resolve_link_origin("仕入れ統合作成ファイル", "", "仕入れ業務"))
        self.assertIsNone(repairs.resolve_link_origin("並び順ファイル", "", "価格管理"))


if __name__ == "__main__":
    unittest.main()
