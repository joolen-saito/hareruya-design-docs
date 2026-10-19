"""監査で見つかった、操作欠落・値の逆戻り・誤った期待値を再発させない。"""
import unittest
from unittest.mock import patch
from dataclasses import replace

import generate_test_items as g
from business_assertions import assertions_for
from test_business_assertions import scenario


class ExecutionRepairTests(unittest.TestCase):
    def acceptance_item(self, suffix, title, expected, classification="準備確認後に実施", viewpoint="データ更新"):
        return g.TestItem("業務", f"STI-TEST-001-{suffix}", "-", viewpoint, "P1", title,
                          f"- 実施区分: {classification}", "DP-N001", "【操作】\n操作\n【操作後確認】\n確認",
                          expected, f"確認場所: 受注詳細\n合格条件: {expected}", "正常系", "SCN-TEST-001")

    def test_route_requires_intermediate_results_not_only_last_action(self):
        route = self.acceptance_item("001", "正常系 経路全体", "最後の削除が完了すること。", viewpoint="業務経路")
        paid = self.acceptance_item("002", "正常系 #1: 入金", "入金額が2,000円であること。")
        delivered = self.acceptance_item("003", "正常系 工程#2 判定: 引渡し", "顧客が商品2点を受領できること。")
        actual = g.apply_route_acceptance(scenario(), [route, paid, delivered])[0]
        self.assertIn("必須判定2件がすべて合格", actual.expected)
        for child in [paid, delivered]:
            self.assertIn(child.test_id, actual.precondition)
            self.assertIn(child.expected, actual.steps)
        self.assertIn("証跡不足", actual.steps)

    def test_route_does_not_require_exclusive_branch_or_different_data_pattern(self):
        route = self.acceptance_item("001", "正常系 経路全体", "完了できること。", viewpoint="業務経路")
        normal = self.acceptance_item("002", "正常系 #1: 支払完了", "支払済みであること。")
        branch = self.acceptance_item("003", "異常系 E1 #1: 支払不能", "未払いであること。", "実施保留")
        variation = self.acceptance_item("004", "正常系 DP-N002: 数量差分", "数量が異なること。", "実施保留", "業務データ差分")
        actual = g.apply_route_acceptance(scenario(), [route, normal, branch, variation])[0]
        self.assertIn("必須判定1件", actual.expected)
        self.assertNotIn(branch.test_id, actual.precondition)
        self.assertNotIn(variation.test_id, actual.precondition)
        self.assertNotEqual("保留", g.execution_class(actual))

    def test_held_lineage_prevents_route_pass_without_becoming_success_criterion(self):
        route = self.acceptance_item("001", "正常系 経路全体", "完了できること。", viewpoint="業務経路")
        child = self.acceptance_item("002", "正常系 DL-01: 値の一致", "産出値と消費値が一致する状態であること。", "実施保留", "データ連鎖")
        actual = g.apply_route_acceptance(scenario(), [route, child])[0]
        self.assertEqual("保留", g.execution_class(actual))
        self.assertIn(child.test_id, actual.precondition)
        self.assertIn(child.expected, actual.steps)
        self.assertNotIn("保留として記録", actual.expected)

    def test_filename_quote_does_not_discard_export_and_delivery(self):
        operation = '商品CSVを出力し「日付 価格ソート用」と命名してトレードチームへ共有する'
        self.assertEqual(operation, g.action_from_operation(operation))

    def test_wrapper_with_nested_button_names_keeps_full_action(self):
        operation = '商品管理で「「CSV出力」を押してファイルを保存する」を行う'
        self.assertEqual('「CSV出力」を押してファイルを保存する', g.action_from_operation(operation))

    def test_variation_identity_and_date_remain_in_later_steps(self):
        source = scenario(seed={"受注番号": "ST-ORDER-001", "商品コード": "ST-CARD-001", "確認日": "2026-10-05"}, normal_rows=[
            {"#": "1", "操作": "受注番号=ST-ORDER-001、確認日=2026-10-05で照合する"},
            {"#": "2", "操作": "ST-ORDER-001を更新し確認日=2026-10-05を保存する"}])
        pattern = g.DataPattern("DP-N002", "正常系 業務データ差分", "正常系#1", "期限差分", "期限超過", "受注番号=ST-ORDER-DIFF / 確認日=2026-10-15", "期限超過を確認できること。")
        bound = g.bind_pattern(source, pattern)
        self.assertIn("ST-ORDER-DIFF", bound.normal_rows[1]["操作"])
        self.assertIn("2026-10-15", bound.normal_rows[1]["操作"])
        self.assertEqual("ST-ORDER-001", source.seed["受注番号"])

    def test_quantity_rebind_does_not_rewrite_source_line_numbers(self):
        actual = g.rebind_values("数量=3 / source.md:3243 / M03-03", {"数量": "3"}, {"数量": "2"})
        self.assertEqual("数量=2 / source.md:3243 / M03-03", actual)

    def test_rebind_with_old_id_as_prefix_replaces_only_once(self):
        actual = g.rebind_values("受注番号=ST-001 / ST-001", {"受注番号": "ST-001"}, {"受注番号": "ST-001-A"})
        self.assertEqual("受注番号=ST-001-A / ST-001-A", actual)

    def test_shipping_shortage_uses_two_received_units_without_receiving_return(self):
        source = scenario(title="在庫移動", route_condition="出荷指示数量=3、ピック数量=2、受入数量=2", seed={"数量": "3"})
        values = assertions_for(source, "「入庫として入庫承認する」", "M04-09")
        self.assertEqual(1, len(values))
        self.assertIn("実入庫数2点", values[0].expected)
        self.assertIn("200円", values[0].expected)

    def test_receiving_shortage_returns_only_the_missing_unit(self):
        source = scenario(title="在庫移動", route_condition="出荷指示数量=3、ピック数量=3、受入数量=2", seed={"数量": "3"})
        values = assertions_for(source, "「入庫として入庫承認する」", "M04-09")
        self.assertEqual(2, len(values))
        self.assertIn("実入庫数2点", values[0].expected)
        self.assertIn("出庫元在庫が1点・総原価100円", values[1].expected)

    def test_buy_payment_preserves_parent_assessed_amount(self):
        source = scenario(business="ネット買取", seed={"査定金額": "12,000円", "送料": "500円"})
        value = assertions_for(source, "「振込依頼として申請する」", "M07-03")[0]
        self.assertIn("12,500円", value.expected)
        self.assertNotIn("3,000円", value.preparation + value.expected)

    def test_old_implementation_difference_cannot_replace_design_expectation(self):
        _, condition = g.feasibility_label(g.Feasibility("要注意", "既知の実装差"), "管理画面")
        self.assertIn("期待値は業務フロー・HTML設計書に固定", condition)
        self.assertNotIn("期待値に採用", condition)

    def test_shipping_import_guide_is_a_screen_not_csv_schema(self):
        from test_business_assertions import REPO
        self.assertEqual("m05-26_admin_order_order_shipping_result_csv_import.md", g._function_doc(REPO, "M05-26").name)

    def test_reviewed_expected_keeps_specific_split_quantities(self):
        expected = "同じ分割IDにA6・B3が登録され、承認待ちで分割先在庫は未加算であること。"
        with patch.object(g, "reviewed_contract", return_value={"contract_id": "reviewed"}):
            self.assertEqual(expected, g.observable_expected(scenario(), "M04-10", "分割先を登録する", expected))

    def test_shipping_oracles_accept_multiple_features(self):
        values = assertions_for(scenario(), "集荷完了した受注のCSVを登録する", "M05-26,M05-11")
        self.assertIn("出荷実績の同一受注への反映", [a.name for a in values])
        self.assertIn("出荷完了メールの宛先と履歴", [a.name for a in values])

    def test_seed_explanation_does_not_become_a_created_identifier(self):
        source = scenario(seed={"実ID対応表": "未採番→登録後に記録", "採番記録手順": "登録後に保存"})
        self.assertEqual({}, g.first_created_keys(source))

    def test_accounting_payment_does_not_expect_cash_register_transaction(self):
        from business_assertions import resolve_link_identity
        self.assertIsNone(resolve_link_identity("#18 出金", "#17 【経理】振込実行", "店頭買取"))

    def test_expanded_alternative_names_the_external_service(self):
        import execution_repairs_orders as orders
        source = scenario(business="通販受注管理", route_kind="主要代替", route_condition="減額可能",
                          branch_rows=[{"分岐ID": "A1", "入力/対象": "減額可能"}],
                          normal_rows=[{"#": "1", "担当者": "通販担当", "操作": '外部システム/ツール上で「SPLINKSで1,000円を減額する」を実施する（EC-CUBE操作なし・業務結果を観測）',
                                        "入力/対象": "同じ決済ID", "期待結果": "決済残額が一致すること。"}])
        operations = orders.branch_operations(source, "A1", None)
        self.assertIsNotNone(operations)
        self.assertNotIn("外部システム/ツール上", "\n".join(operations))
        self.assertIn("SPLINKS", operations[1])
        self.assertIn("1,000円", operations[1])


if __name__ == "__main__":
    unittest.main()
