#!/usr/bin/env python3
"""業務経路の合否に、途中工程とデータ連鎖の必須判定が含まれるか検査する。"""
from __future__ import annotations

import csv
import hashlib
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "scenario_test/coverage/business_goal_review"


def main():
    csv.field_size_limit(10**7)
    aggregate = ROOT / "scenario_test/test_items/all_scenario_test_items.tsv"
    with aggregate.open(newline="") as handle:
        items = list(csv.DictReader(handle, delimiter="\t"))
    groups = defaultdict(list)
    for item in items:
        sid = re.search(r"元シナリオ: (\S+)", item["前提条件"])[1]
        groups[sid].append(item)
    records = []
    hold_only = []
    for sid, rows in groups.items():
        route = next(r for r in rows if r["テスト観点"] == "業務経路")
        required = [r for r in rows if re.match(
            r"^(?:正常系|代替系|異常系) (?:#\d+:|工程#\d+ 判定:|DL-|別業務 )", r["テスト項目名"])]
        assert required, f"必須判定がない: {sid}"
        ids = [r["テストID"] for r in required]
        marker = re.search(r"必須判定ID: (.*?)(?= / 経路成立の判定記録:|\n|$)", route["確認対象"])
        assert marker and marker[1].split(" / ") == ids, f"必須判定の欠落・余分な分岐: {sid}"
        assert f"必須判定{len(ids)}件がすべて合格" in route["期待結果／レスポンス"], sid
        held = []
        for child in required:
            assert f"{child['テストID']}: {child['期待結果／レスポンス']}" in route["操作手順/実行方法"], child["テストID"]
            if re.search(r"実施区分: 実施(?:保留|不可)", child["前提条件"]):
                held.append(child["テストID"])
        if held:
            assert re.search(r"実施区分: 実施(?:保留|不可)", route["前提条件"]), f"保留必須判定の経路合格化: {sid}"
        classification = re.search(r"実施区分: (.*?)(?= / - |\n|$)", route["前提条件"])[1]
        records.append({
            "業務": route["機能名"].split(" — ")[0], "シナリオID": sid,
            "経路テストID": route["テストID"], "必須判定数": len(ids),
            "必須判定ID": " / ".join(ids), "準備保留の必須判定数": len(held),
            "準備保留の必須判定ID": " / ".join(held), "経路実施区分": classification,
            "経路合格条件": route["期待結果／レスポンス"],
            "実機実施結果": "未実施",
        })
        for child in rows:
            if "保留として記録されること" in child["期待結果／レスポンス"]:
                hold_only.append(child["テストID"])
    assert not hold_only, f"保留記録を業務期待結果にしている: {hold_only}"
    OUT.mkdir(parents=True, exist_ok=True)
    with (OUT / "route_acceptance.tsv").open("w", newline="") as handle:
        writer = csv.DictWriter(handle, records[0].keys(), delimiter="\t", lineterminator="\n")
        writer.writeheader()
        writer.writerows(records)
    summary = {
        "scenario_count": len(records), "item_count": len(items),
        "required_assertions": sum(r["必須判定数"] for r in records),
        "required_held_assertions": sum(r["準備保留の必須判定数"] for r in records),
        "route_readiness": dict(Counter(r["経路実施区分"] for r in records)),
        "hold_record_as_business_expectation": len(hold_only),
        "aggregate_sha256": hashlib.sha256(aggregate.read_bytes()).hexdigest(),
        "runtime_business_tests_executed": False,
        "meaning": "必須判定の展開と保留継承を検査。業務上の仕様の完全性・実機合格を保証する検査ではない。",
    }
    (OUT / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n")
    repairs = json.loads((ROOT / "scenario_test/coverage/execution_repairs/repair_summary.json").read_text())
    lines = [
        "# 品質と業務成立を判断するためのテストケース修正", "",
        "更新日: 2026-10-09", "",
        "ゴールは、システムが業務に必要な品質を満たし、実際の業務が開始から完了まで回ることを、テスト結果から判断できるケースにすることである。",
        "[目的と完了基準](../../システムテストの目的と完了基準.md)を正本として定めた。", "",
        "## 反映した修正", "",
        f"- 全{len(records)}経路の合否を、合計{summary['required_assertions']:,}件の必須判定に対応付けた。工程・具体値の照合・データ連鎖・別業務の判定を経路全体の手順内に展開した。",
        "- 最後の操作だけで経路を合格にしない。不合格・未実施・保留・証跡不足を経路全体の判定へ反映する。",
        "- 別データパターン・排他的な分岐は別案件で実施し、代表案件の必須判定に混ぜない。",
        "- データ連鎖38項目と別業務引き継ぎ1項目で、保留を記録することを期待結果にしていた記載を改め、本来の業務上の期待結果を保持した。",
        "- 外部原本等が不足する16工程でも、原典にある業務成果を期待結果へ復元した。準備不足は実施区分・解除条件へ記載する。未取得の原本や未定義の業務ルールを確定済みとは扱わない。", "",
        "## 現在の状態", "",
        f"テスト項目は{len(items):,}件。{repairs['held_items']}項目が準備・判定根拠等の確定待ちで、業務成立の確認に保留がある経路は{repairs['scenarios_with_held_items']}件。これらの経路はテストケースの完成基準に未達である。",
        "以前の546項目に加え、必須判定の保留を継承していなかった経路全体5項目を保留へ修正した。件数増加は同じ準備不足の親経路への反映である。",
        "実機の業務テストは未実施。以下の検査合格は業務の合格結果を表さない。", "",
        "## 確認する資料", "",
        "- [業務成立の必須判定一覧](route_acceptance.tsv) / [検査集計](summary.json)",
        "- [業務別実施用TSV](../../exec/README.md) / [実施手順](../../exec/実施手順.md)",
        "- [準備不足の解除条件と修正結果](../execution_repairs/README.md)",
        "- [検証記録](validation.json)", "",
        "構造検査: `python3 scenario_test/tools/audit_route_acceptance.py`。必須判定の欠落、別分岐の混入、準備保留の経路への継承漏れ、保留記録の業務期待結果への置換を検出する。", "",
    ]
    (OUT / "README.md").write_text("\n".join(lines))
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
