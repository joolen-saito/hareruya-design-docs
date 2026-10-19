"""参照切れを生んだ旧委譲検索・補完経路の再発防止。"""
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / ".codex/skills/hareruya-scenario-test-cases/scripts"))
import delegation_contracts as delegation
import source_contract_adapter as adapter


class DelegationTests(unittest.TestCase):
    def test_active_cases_not_legacy_glob(self):
        cases = delegation.case_index(ROOT)["A05-04"]
        matching = [r for r in cases if delegation.matches(r, "duplicate")]
        self.assertTrue(any(r["テストID"].endswith("-028") for r in matching))

    def test_displaying_duplicate_label_is_not_duplicate_execution(self):
        cases = delegation.case_index(ROOT)["M05-26"]
        row = next(r for r in cases if r["テストID"].endswith("-040"))
        self.assertFalse(delegation.matches(row, "duplicate"))

    def test_one_feature_does_not_cover_another_feature(self):
        rows = delegation.delegation_rows(ROOT, ["A05-04", "M05-26"])
        missing = [r for r in rows if "重複実行" in r[0] and "M05-26" in r[0]]
        self.assertEqual(missing[0][2], "-")

    def test_tbd_case_is_not_execution_complete(self):
        rows = delegation.delegation_rows(ROOT, ["A05-04"])
        self.assertTrue(any("実行準備未確定" in r[3] for r in rows if r[2] != "-"))

    def test_continuation_fix_keeps_source_row_match(self):
        from types import SimpleNamespace
        adapter.configure(ROOT)
        original = next(c for c in adapter.CONTRACTS if c["source_evidence"])
        evidence = original["source_evidence"][0]
        pattern = SimpleNamespace(source_path=evidence["file"])
        row = f"- **{evidence['source_row']}**: 継続行を復元した内容"
        self.assertEqual(adapter.find(original["business"], pattern, row, original["source_action"] + " 継続行追記"), original)
        other_pattern = SimpleNamespace(source_path="scenario_test/markdown/無関係.md")
        self.assertIsNone(adapter.find(original["business"], other_pattern, row, original["source_action"] + " 継続行追記"))


if __name__ == "__main__":
    unittest.main()
