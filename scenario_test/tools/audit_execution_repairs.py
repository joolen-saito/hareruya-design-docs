#!/usr/bin/env python3
"""修正前の全項目と現在の項目を工程・分岐・連鎖単位で対応付ける。

対応付けは実機合格を表さない。統合された追加判定は、人が新期待値を
確認できるよう旧期待値と現行の対応工程を同じ表に残す。
"""
from __future__ import annotations
import csv
import io
import json
import re
import zipfile
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "scenario_test/coverage/execution_repairs"


def read_tsv(path):
    with path.open(encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f, delimiter="\t"))


def write_tsv(name, rows, fields):
    with (OUT / name).open("w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fields, delimiter="\t", lineterminator="\n")
        w.writeheader()
        w.writerows(rows)


def sid(row):
    return re.search(r"元シナリオ: (\S+)", row["前提条件"])[1]


def descriptor(row):
    title = row["テスト項目名"]
    vp = row["テスト観点"]
    if vp == "業務経路":
        return ("route",)
    if vp == "データ連鎖":
        return ("lineage", title.split(" — ", 1)[-1].strip())
    if vp == "別業務引き継ぎ":
        return ("subflow",)
    pattern = re.search(r"データパターンID: (DP-[A-Z]\d+)", row["前提条件"])
    pid = pattern[1] if pattern else ""
    if vp in {"業務データ差分", "境界値"}:
        return ("pattern", pid)
    if pid.startswith(("DP-A", "DP-E")):
        return ("branch", pid)
    number = re.search(r"#(\d+)", title)
    if number:
        if "判定:" in title:
            return ("assertion", int(number[1]), title.split("判定:", 1)[1].strip())
        return ("step", int(number[1]))
    return ("other", vp, title)


def old_to_new_steps(old, inventory, catalog):
    mapping = {}
    for row in old:
        s = sid(row)
        d = descriptor(row)
        if d[0] in {"step", "assertion"}:
            mapping.setdefault(s, {})[d[1]] = [d[1]]
    for s, record in inventory["scenario_repairs"].items():
        mapping[s] = defaultdict(list)
        for n, step in enumerate(record["steps"], 1):
            if step.get("original_index"):
                mapping[s][step["original_index"]].append(n)
    for s, values in mapping.items():
        if s in inventory["scenario_repairs"]:
            continue
        dropped = set(catalog.get("route_changes", {}).get(s, {}).get("drop_steps", []))
        inserted = [c["original_step"] for c in catalog["step_resolutions"] if c.get("scenario_id") == s and c.get("insert_after")]
        for n in list(values):
            values[n] = [] if n in dropped else [n - sum(i < n for i in dropped) + sum(i < n for i in inserted)]
    s = "SCN-ORDER-店頭支払店内PC支店-008"
    if s in mapping:
        mapping[s][11] = []
    return mapping


def main():
    csv.field_size_limit(10**7)
    with zipfile.ZipFile(OUT / "before_repairs.zip") as archive:
        source = archive.read("scenario_test/test_items/all_scenario_test_items.tsv").decode()
        old = list(csv.DictReader(io.StringIO(source), delimiter="\t"))
        old_contracts = json.loads(archive.read("scenario_test/coverage/source_contracts.json"))["step_resolutions"]
    new = read_tsv(ROOT / "scenario_test/test_items/all_scenario_test_items.tsv")
    inventory = json.loads((OUT / "inventory_contracts.json").read_text())
    catalog = json.loads((OUT / "catalog_contracts.json").read_text())
    step_map = old_to_new_steps(old, inventory, catalog)
    decisions = json.loads((OUT / "item_migration_decisions.json").read_text())
    grouped = defaultdict(list)
    for row in new:
        grouped[sid(row)].append(row)
    assert set(grouped) == {sid(r) for r in old}, "修正前後のSCN集合が異なる"
    mapping, unmatched = [], []
    for row in old:
        s, d = sid(row), descriptor(row)
        keys = [d]
        if d[0] in {"step", "assertion"}:
            keys = [(d[0], number, *d[2:]) for number in step_map.get(s, {}).get(d[1], [d[1]])]
        candidates = [r for r in grouped[s] if descriptor(r) in keys]
        status = "同一観点へ対応"
        reason = "経路/工程/データパターン/連鎖IDで対応。テストIDの連番だけでは同一性を判定しない。"
        if not keys:
            status = "誤手順を整理"
            reason = ("当日非会員の受付前にオンライン申込一覧を要求する工程を削除し、実際の受付経路へ修正。"
                      if s.startswith("SCN-EVENT") else "期限切れキャンセル後に入金済みとして番号札を再削除する重複工程を削除。")
        elif not candidates and d[0] == "assertion":
            numbers = [k[1] for k in keys]
            candidates = [r for r in grouped[s] if descriptor(r) in [("step", n) for n in numbers]]
            if candidates:
                status = "工程期待値へ統合・要照合"
                reason = "独立追加判定の専用行は生成されなくなったため、旧期待値と下記の工程期待値を意味で照合する。対応だけで観測点維持済みとは数えない。"
        elif not candidates and d[0] == "subflow":
            cid = re.search(r"別業務 (SC-\d+):", row["テスト項目名"])
            record = next((c for c in old_contracts if cid and c["contract_id"] == cid[1]), {})
            numbers = [descriptor(r)[1] for r in old if sid(r) == s and descriptor(r)[0] == "step"
                       and record.get("operation") and record["operation"] in r["テスト項目名"]]
            if not numbers:
                numbers = [int(o["step"]) for o in record.get("occurrences", []) if o["scenario_id"] == s]
            target_numbers = [n for old_n in numbers for n in step_map[s].get(old_n, [old_n])]
            candidates = [r for r in grouped[s] if descriptor(r) in [("step", n) for n in target_numbers]]
            if candidates:
                status = "別業務参照を実操作へ展開"
                reason = "在庫フロア間移動の参照を、同じ元工程に紐づく現行画面の具体操作へ置換。工程と対象実IDの照合を保持。"
        decision = decisions.get(row["テストID"])
        if decision and decision.get("target_ids"):
            wanted = set(decision["target_ids"])
            candidates = [r for r in grouped[s] if r["テストID"] in wanted]
            assert {r["テストID"] for r in candidates} == wanted, "統合先IDが存在しない: " + row["テストID"]
            status, reason = decision["status"], decision["reason"] + " 根拠: " + " / ".join(decision["evidence"])
        elif not candidates and decision:
            status, reason = decision["status"], decision["reason"] + " 根拠: " + " / ".join(decision["evidence"])
        elif keys and not candidates:
            status = "未対応"
            unmatched.append(row["テストID"])
        mapping.append({"旧テストID": row["テストID"], "シナリオID": s, "対応状態": status,
                        "新テストID": ";".join(r["テストID"] for r in candidates), "対応根拠": reason,
                        "旧観点": row["テスト観点"], "旧項目名": row["テスト項目名"],
                        "旧期待結果": row["期待結果／レスポンス"],
                        "新期待結果": "\n---\n".join(r["期待結果／レスポンス"] for r in candidates)})
    write_tsv("item_migration.tsv", mapping, list(mapping[0]))
    readiness = []
    for row in new:
        match = re.search(r"実施区分: (.+?)(?= / - |\n|$)", row["前提条件"])
        classification = match[1] if match else "区分未設定"
        blockers = list(dict.fromkeys(re.findall(r"(?:実施保留(?:条件)?|解除条件):\s*(.+?)(?= / - |\n|$)", row["前提条件"])))
        readiness.append({"テストID": row["テストID"], "シナリオID": sid(row), "業務": row["機能名"].split(" — ")[0],
                          "テスト観点": row["テスト観点"], "実施区分": classification,
                          "保留": "あり" if "保留" in classification or "不可" in classification else "なし",
                          "準備・解除条件": " / ".join(blockers), "実機実施結果": "未実施"})
    write_tsv("item_readiness.tsv", readiness, list(readiness[0]))
    cases = defaultdict(list)
    for row in readiness:
        cases[row["シナリオID"]].append(row)
    by_scenario = []
    for s, rows in sorted(cases.items()):
        held = [r for r in rows if r["保留"] == "あり"]
        route = next(r for r in rows if r["テスト観点"] == "業務経路")
        by_scenario.append({"シナリオID": s, "業務": rows[0]["業務"], "項目数": len(rows),
                            "保留項目数": len(held), "経路実施区分": route["実施区分"],
                            "保留テストID": ";".join(r["テストID"] for r in held), "実機実施結果": "未実施"})
    write_tsv("scenario_readiness.tsv", by_scenario, list(by_scenario[0]))
    previous_findings = read_tsv(ROOT / "scenario_test/coverage/executability_review_2026-10-09/findings.tsv")
    responses = defaultdict(list)
    for filename in ("common_response_ledger.json", "inventory_remediation.json", "orders_response_ledger.json", "catalog_response_ledger.json"):
        ledger = json.loads((OUT / filename).read_text())
        for finding in ledger["findings"]:
            responses[finding.get("id", finding.get("finding_id"))].append((filename, finding))
    finding_rows = []
    for finding in previous_findings:
        fid = finding["指摘ID"]
        assert responses[fid], "未対応の監査指摘: " + fid
        entries = responses[fid]
        finding_rows.append({"指摘ID": fid, "指摘": finding["指摘"],
                             "対応状態": " / ".join(dict.fromkeys(entry["status"] for _, entry in entries)),
                             "対応内容": " / ".join(dict.fromkeys(entry.get("resolution", entry.get("response", "担当台帳参照")) for _, entry in entries)),
                             "対応記録": " / ".join(dict.fromkeys(filename for filename, _ in entries)),
                             "旧対象STI": finding["直接対象STI"],
                             "実施判定": "最新のitem_readiness.tsvで確認。修正済みという記録は、外部資料取得・実機実施の完了を意味しない。"})
    write_tsv("finding_responses.tsv", finding_rows, list(finding_rows[0]))
    summary = {"before_scenarios": len({sid(r) for r in old}), "after_scenarios": len(grouped),
               "before_items": len(old), "after_items": len(new),
               "migration": dict(Counter(r["対応状態"] for r in mapping)), "unmatched_old_ids": unmatched,
               "readiness": dict(Counter(r["実施区分"] for r in readiness)),
               "held_items": sum(r["保留"] == "あり" for r in readiness),
               "scenarios_with_held_items": sum(r["保留項目数"] > 0 for r in by_scenario),
               "before_by_business": dict(Counter(r["機能名"].split(" — ")[0] for r in old)),
               "after_by_business": dict(Counter(r["業務"] for r in readiness)),
               "runtime_business_tests_executed": False}
    summary["previous_findings_with_response"] = len(finding_rows)
    (OUT / "repair_summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return bool(unmatched)


if __name__ == "__main__":
    raise SystemExit(main())
