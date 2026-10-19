#!/usr/bin/env python3
"""Regression checks for semantic coverage, including failure-to-prove cases."""
import re
import tempfile
import unittest
from dataclasses import replace
from pathlib import Path
from unittest.mock import patch

import generate_test_items as g
from business_assertions import assertions_for, resolve_link_identity


REPO = Path(__file__).resolve().parents[4]


def scenario(**changes):
    value = g.ScenarioDoc(
        repo=REPO, path=Path("scenario_test/scenario/SCN-TEST-001.md"),
        sid="SCN-TEST-001", title="業務経路", business="通販受注管理",
        classification="正常系", route_id="R01", route_kind="正常代表",
        route_condition="依頼した受注を処理する", final_state="受注が登録されること。",
        priority="P1", business_trigger="依頼受付", main_actor="通販チーム",
        systems="EC-CUBE", trace_source="業務フロー パターン1",
        seed={"受注番号": "ST-ORDER-001", "商品コード": "ST-CARD-001"},
        normal_rows=[{"#": "1", "担当者": "通販チーム", "操作": "受注登録で「受注を登録する」を行う", "期待結果": "受注が登録されること。"}],
        branch_rows=[], normal_features=["M05-11"], screen_features={},
        data_patterns=[g.DataPattern("DP-N001", "正常系 代表", "正常系#1", "代表", "新規", "受注番号=ST-ORDER-001", "受注詳細")],
        expected_features=["M05-11"], linked_features=["M05-11"],
    )
    return replace(value, **changes)


def link(**changes):
    value = {"連鎖ID": "DL-01", "産出工程": "#1 注文", "産出データ/帳票": "#2 受注",
             "消費工程": "#3 受注マスター", "期待（データのつながり）": "同一受注を参照する",
             "照合キー": "受注番号=ST-ORDER-001", "判定": "連鎖あり"}
    value.update(changes)
    return value


class BusinessCoverageTests(unittest.TestCase):
    def test_lineage_is_not_just_a_heading(self):
        item = g.data_link_items(scenario(data_links=[link()]), 10)[0]
        self.assertEqual("STI-TEST-001-010", item.test_id)
        self.assertIn("産出した", item.expected)
        self.assertIn("参照した値", item.expected)
        self.assertIn("受注番号・商品・数量", item.expected)
        self.assertIn("consumer原本", item.steps)
        self.assertIn("comparison.tsv", item.observation)

    def test_unknown_key_does_not_pass_from_single_seed(self):
        item = g.data_link_items(scenario(data_links=[link(**{
            "照合キー": "照合キーは原典未定義（シードID単一データ環境で同一性を担保）",
            "産出データ/帳票": "#2 外部マクロ作業ファイル"
        })]), 2)[0]
        self.assertIn("実施保留", item.precondition)
        self.assertNotIn("保留として記録", item.expected)
        self.assertIn("一致する状態", item.expected)
        self.assertEqual("保留", g.execution_class(item))
        self.assertIn("未確定理由:", item.precondition)
        self.assertIn("必要な判断:", item.precondition)
        self.assertIn("調査済出典:", item.observation)

    def test_terminal_is_output_assertion_not_handoff_assertion(self):
        item = g.data_link_items(scenario(data_links=[link(**{
            "消費工程": "終端（消費先の記載なし）", "判定": "終端（消費先の記載なし・完了条件で観測）"
        })]), 2)[0]
        self.assertIn("成果物", item.expected)
        self.assertNotIn("参照した値", item.expected)
        self.assertIn("後続工程への受け渡しは未判定", item.precondition)

    def test_missing_producer_stays_blocked_even_with_known_key(self):
        item = g.data_link_items(scenario(data_links=[link(**{
            "産出工程": "起点（産出元の記載なし）", "判定": "産出元記載なし起点"
        })]), 2)[0]
        self.assertIn("実施保留", item.precondition)
        self.assertIn("産出元", item.steps)

    def test_transfer_csv_uses_actual_csv_key_not_product_code(self):
        item = g.data_link_items(scenario(data_links=[link(**{
            "産出データ/帳票": "#106 在庫移動実績入力用CSV", "照合キー": "商品コード=ST-CARD-001"
        })]), 2)[0]
        self.assertIn("照合キー 移動指示ID", item.expected)
        self.assertNotIn("照合キー 商品コード", item.expected)
        self.assertIn("CSVに商品コード列を追加しない", item.steps)

    def test_failed_refund_is_not_given_successful_reduction_expectation(self):
        assertions = assertions_for(scenario(route_condition="減額不能"), "SPLINKSで「SPLINKS返金対応として決済処理」を行う", "-")
        self.assertEqual(1, len(assertions))
        self.assertIn("3,000円のまま", assertions[0].expected)
        self.assertNotIn("2,000円", assertions[0].expected)

    def test_full_cancellation_does_not_use_partial_refund_amount(self):
        assertions = assertions_for(scenario(title="SPLINKS返金処理（請求キャンセル）"), "SPLINKSで「SPLINKS返金対応として請求をキャンセルする」を行う", "-")
        self.assertIn("請求残額が0円", assertions[0].expected)
        self.assertNotIn("2,000円", assertions[0].expected)

    def test_external_result_preserves_source_business_outcome(self):
        expected = g.observable_expected(scenario(), "-", "現場作業として「返送作業」を実施する", "顧客が返送対象カード3枚を受領できること。")
        self.assertEqual("顧客が返送対象カード3枚を受領できること。", expected)
        self.assertNotIn("操作対象のサービス", expected)

    def test_detail_screen_does_not_imply_transfer_csv_import(self):
        assertions = assertions_for(scenario(), "在庫移動指示詳細で「内容を確認する」を行う", "M04-25")
        self.assertFalse(assertions)

    def test_recovered_card_key_uses_real_html_column(self):
        key, fields, prep, source = resolve_link_identity("#16 カード登録CSV", "#15 CSV作成")
        self.assertIn("カード詳細ID", key)
        html = (REPO / source.split("#", 1)[0]).read_text()
        self.assertIn('id="sheet-8"', html)
        self.assertIn("カード詳細ID", html)
        self.assertNotIn("・言語", fields)

    def test_unlisted_feasibility_is_not_assumed_executable(self):
        status, reason = g.feasibility_label(g.Feasibility("台帳未収載", "なし"), "管理画面")
        self.assertIn("実施保留", status)
        self.assertIn("実施可否台帳", reason)

    def test_each_normal_business_variation_gets_its_own_comparison(self):
        base = scenario()
        variant = g.DataPattern("DP-N002", "正常系 業務データ差分", "正常系#1", "非会員注文 / 原典本文 R10", "非会員として購入する", "会員番号=なし・数量=2", "数量2点の受注がゲスト注文として登録されること。")
        rows = g.normal_variation_items(replace(base, data_patterns=base.data_patterns + [variant]), 30)
        self.assertEqual(1, len(rows))
        self.assertEqual("STI-TEST-001-030", rows[0].test_id)
        self.assertEqual(variant.observation, rows[0].expected)
        self.assertIn("非会員として購入する", rows[0].steps)
        self.assertIn("差分実行ID: DP-N002", rows[0].steps)
        self.assertIn("variation-comparison.tsv", rows[0].observation)

    def test_subflow_limits_steps_and_reuses_parent_identity(self):
        with tempfile.TemporaryDirectory() as temp:
            repo = Path(temp)
            path = repo / "scenario_test/scenario/SCN-CHILD-001_child.md"
            path.parent.mkdir(parents=True)
            path.touch()
            parent = scenario(repo=repo)
            child = scenario(repo=repo, sid="SCN-CHILD-001", path=path,
                             seed={"商品コード": "CHILD-CARD"}, normal_rows=[
                                 {"#": "1", "操作": "範囲外の更新"},
                                 {"#": "2", "操作": "CHILD-CARDを移動登録", "期待結果": "移動登録されること。"}])
            contract = {"contract_id": "SC-TEST", "kind": "subflow", "matching_keys": ["商品コード", "数量", "在庫移動ID"],
                        "parameter_values": {"数量": "3"}, "runtime_keys": {"在庫移動ID": "登録で採番された実IDを保存"},
                        "subflow_targets": [{"scenario_id": child.sid, "target_steps": [2], "condition": "商品登録済み"}]}
            with patch.object(g, "reviewed_contract", side_effect=lambda s, op: contract if op == "call" else None), patch.object(g, "parse_scenario", return_value=child):
                lines, blockers, refs = g.expand_subflow(parent, "call")
            content = "\n".join(lines)
            self.assertEqual([], blockers)
            self.assertIn("ST-CARD-001を移動登録", content)
            self.assertNotIn("範囲外の更新", content)
            self.assertNotIn("CHILD-CARD", content)
            self.assertIn("初回採番工程", content)
            self.assertIn("数量=3", content)
            self.assertIn("実ID記録契機 在庫移動ID", content)

    def test_subflow_cycle_stays_blocked(self):
        contract = {"contract_id": "SC-CYCLE", "kind": "subflow"}
        with patch.object(g, "reviewed_contract", return_value=contract):
            _, blockers, _ = g.expand_subflow(scenario(), "call", ("SC-CYCLE",))
        self.assertIn("循環", blockers[0])

    def test_subflow_alias_uses_parent_value_and_explicit_floor_override(self):
        parent = scenario(seed={"査定金額": "12,000円", "移動元店舗・区分": "旧値"})
        contract = {"parameter_values": {"査定額": "1,200円"}, "parameter_aliases": {"査定額": "査定金額"},
                    "parameter_overrides": {"移動元店舗・区分": "テスト本店3F／EC-CUBE"}}
        bound = g.subflow_seed(parent, contract)
        self.assertEqual("12,000円", bound["査定額"])
        self.assertEqual("テスト本店3F／EC-CUBE", bound["移動元店舗・区分"])

    def test_subflow_conditions_are_exclusive_and_keep_the_selected_range(self):
        with tempfile.TemporaryDirectory() as temp:
            repo = Path(temp)
            path = repo / "scenario_test/scenario/SCN-CHILD-001_child.md"
            path.parent.mkdir(parents=True)
            path.touch()
            child = scenario(repo=repo, sid="SCN-CHILD-001", path=path)
            contract = {"contract_id": "SC-CONDITION", "kind": "subflow", "matching_keys": ["商品コード"],
                        "subflow_selection": "evaluate_condition_per_target",
                        "subflow_targets": [{"scenario_id": child.sid, "target_steps": [1], "condition": "新弾の場合"},
                                            {"scenario_id": child.sid, "target_steps": [1], "condition": "新弾以外の場合"}]}
            with patch.object(g, "reviewed_contract", side_effect=lambda s, op: contract if op == "call" else None), patch.object(g, "parse_scenario", return_value=child):
                lines, blockers, _ = g.expand_subflow(scenario(repo=repo), "call")
            content = "\n".join(lines)
            self.assertEqual([], blockers)
            self.assertIn("一つの案件で両方を直列実行しない", content)
            self.assertEqual(2, content.count("【条件付き範囲開始】"))
            self.assertEqual(2, content.count("【条件付き範囲終了】"))

    def test_split_csv_uses_split_quantity_column(self):
        key, fields, _, source = resolve_link_identity("#47 インポートCSV", "#46 インポートファイル作成", "在庫管理")
        self.assertIn("在庫分割ID", key)
        self.assertEqual("商品コード・分割先分割在庫数", fields)
        self.assertIn("sheet-18", source)

    def test_compound_features_preserve_the_entire_actual_sequence(self):
        self.assertEqual("F04-01,F04-02,F04-04", g.feature_from_cell("購入（F04-01・F04-02・F04-04）"))

    def test_purchase_assigned_order_does_not_create_a_fixture_order_first(self):
        source = scenario(seed={"受注番号": "購入完了で採番された実受注番号を記録", "商品コード": "ST-CARD"},
                          normal_features=["F04-01,F04-02,F04-04"], normal_rows=[
                              {"#": "1", "操作": "商品をカートへ入れ、注文を確定して実受注番号を記録する。", "期待結果": "注文が登録されること。"},
                              {"#": "2", "操作": "受注詳細で同じ受注を確認する。"}])
        route = g.route_steps(source)
        self.assertNotIn("/fixture/order/generate", route)
        self.assertNotIn("操作前に対象キーで対象データを開き", route)
        self.assertIn("初回採番", route)
        later = "\n".join(g.preparation_lines(source, "M05-01", source.normal_rows[1]["操作"], "2"))
        self.assertIn("先行工程", later)
        self.assertIn("作り直さない", later)

    def test_registration_assigned_move_id_is_not_required_before_registration(self):
        source = scenario(seed={"在庫移動ID": "新規登録後の実IDを記録", "商品コード": "ST-CARD"},
                          normal_features=["M04-09"], normal_rows=[{"#": "1", "操作": "移動を新規登録し採番されたIDを記録する。"}])
        prep = "\n".join(g.preparation_lines(source, "M04-09", source.normal_rows[0]["操作"], "1"))
        self.assertNotIn("操作前に対象キーで対象データを開き", prep)
        self.assertIn("未採番", prep)

    def test_existing_order_preparation_keeps_the_same_purchased_order(self):
        preparation = "\n".join(g.fixture_lines(scenario()))
        self.assertNotIn("/fixture/", preparation)
        self.assertIn("M05-01", preparation)
        self.assertIn("受注番号・会員・明細・配送・決済・処理状態", preparation)

    def test_source_csv_value_comparison_is_not_reduced_to_file_existence(self):
        source = "購入した実受注番号が各CSVへ引き継がれ、商品・数量・配送先が購入時の記録と一致すること。"
        result = g.observable_expected(scenario(), "M05-01,M05-05,M05-03", "通販配送CSVをダウンロードする", source)
        self.assertIn("商品・数量・配送先", result)
        self.assertNotIn("含む出力物", result)

    def test_actual_dispatch_does_not_use_an_earlier_example_timestamp(self):
        results = assertions_for(scenario(), "集荷完了した同じ実受注番号・実出荷日・送り状No.のCSVを登録する。", "M05-26")
        self.assertIn("集荷完了を記録した実出荷日時", results[0].expected)
        self.assertNotIn("16:00", results[0].expected + results[0].preparation)

    def test_cross_route_link_does_not_require_product_columns_in_bank_records(self):
        item = g.data_link_items(scenario(data_links=[link(**{
            "産出データ/帳票": "同一受注の対象記録", "消費工程": "#6 銀行振込",
            "期待（データのつながり）": "工程1の実受注番号と工程6の対象が同一であり、実受注番号・支払総額・振込名義・入金日を工程間の実行記録で照合できること。 出典: 原典R39"
        })]), 2)[0]
        self.assertIn("振込名義・入金日", item.expected)
        self.assertNotIn("商品コード・数量", item.expected)
        self.assertIn("作成前の項目には存在や一致を要求せず", item.steps)


if __name__ == "__main__":
    unittest.main()
