#!/usr/bin/env python3
"""現在の机上台帳から、実施を保留する工程と解除条件を再集約する。"""
import csv
import json
import sys
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE = ROOT / "scenario_test"
sys.path.insert(0, str(ROOT / ".codex/skills/hareruya-scenario-test-cases/scripts"))
import execution_repairs

def main():
    contracts = execution_repairs.contracts(ROOT)
    grouped = {}
    with (BASE / "exec/feasibility/feasibility_by_step.tsv").open(newline="") as handle:
        for row in csv.DictReader(handle, delimiter="\t"):
            if not row["判定"].startswith("判定不能"):
                continue
            key = (row["業務"], row["業務行動"], row["根拠"])
            grouped.setdefault(key, []).append(row["シナリオID"] + "#" + row["工程#"])
    lines = ["# テスト実施前に確定が必要な事項", "", "<!-- generated-by: build_detail_supplement_list.py -->", "",
             "現在のHTMLと業務フローによる補完後も実行手段・設計差・受け渡し範囲が未確定の工程。設計書不存在とは断定しない。", "",
             f"対象: {len(grouped)}種類 / {sum(map(len, grouped.values()))}工程。データ連鎖の照合キー不足は各STIの連鎖項目にも別途表示する。", "",
             "| 業務 | 工程 | 保留理由・必要な確定事項 | 調査出典 | 該当SCN・工程 |", "|---|---|---|---|---|"]
    for (business, action, reason), targets in sorted(grouped.items()):
        matches = [c for c in contracts if c["business"] == business and c["source_action"] == action]
        evidence = " / ".join(dict.fromkeys(e["file"] + ":" + str(e["line"]) for c in matches for e in c["evidence"])) or "当該SCNの出典と業務工程を参照"
        cells = [business, action, reason, evidence, " / ".join(targets)]
        lines.append("| " + " | ".join(c.replace("|", "／").replace("\n", " ") for c in cells) + " |")
    lines.append("")
    (BASE / "scenario/14_テスト手順詳細化依頼リスト.md").write_text("\n".join(lines))
    print(f"残件: {len(grouped)}種類 / {sum(map(len, grouped.values()))}工程")

if __name__ == "__main__":
    main()
