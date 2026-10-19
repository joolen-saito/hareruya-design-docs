#!/usr/bin/env python3
"""原典へ戻った人手レビューと共通準備調査を、全SCN/STIの実施可否台帳に集約する。

構造検証の成功から「実施可能」を導出しない。実機確認は別の証跡を必要とする。
"""
from __future__ import annotations

import csv
import hashlib
import html
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEST = ROOT / "scenario_test/coverage/executability_review_2026-10-09"
CATEGORY_LABELS = {
    "procedure": "操作手順・画面・担当者",
    "oracle": "期待値",
    "coverage": "業務工程の欠落",
    "preparation": "準備データ・開始条件",
    "data_preparation": "準備データ・開始条件",
    "source_conflict": "根拠資料の不一致",
    "design_gap": "根拠仕様の不足",
}


def read_tsv(path):
    with path.open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle, delimiter="\t"))


def write_tsv(name, rows, columns):
    with (DEST / name).open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=columns, delimiter="\t", lineterminator="\n")
        writer.writeheader()
        writer.writerows(rows)


def text(value):
    if isinstance(value, list):
        return " / ".join(text(x) for x in value)
    if isinstance(value, dict):
        return json.dumps(value, ensure_ascii=False)
    return str(value or "")


def source_label(ref):
    if not isinstance(ref, dict):
        return text(ref)
    start = ref.get("line", ref.get("line_start", ""))
    end = ref.get("end_line", ref.get("line_end", start))
    return f"{ref.get('file', '')}:{start}" + (f"-{end}" if end != start else "")


def source_labels(refs):
    return " / ".join(dict.fromkeys(source_label(r) for r in refs))


def validate_reviews(reviews, by_scn):
    """各STIがレビューに実在し、引用が指定した原典行にあることを確認する。"""
    sources = {}
    seen = set()
    quote_count = 0

    def norm(value):
        return re.sub(r"\s+", "", html.unescape(re.sub(r"<[^>]+>", "", value)))

    for sid, review in reviews.items():
        reviewed = set(review.get("checked_test_ids", []))
        if not reviewed:
            reviewed = {r["test_id"] for r in review.get("test_item_reviews", [])}
        assert reviewed == {r["テストID"] for r in by_scn[sid]}, f"個別項目レビューの不足: {sid}"
        refs = list(review["checked_sources"])
        refs += [ref for f in review.get("findings", []) for ref in f.get("source_refs", [])]
        for ref in refs:
            if not isinstance(ref, dict) or not ref.get("file"):
                continue
            key = json.dumps(ref, sort_keys=True, ensure_ascii=False)
            if key in seen:
                continue
            seen.add(key)
            path = (ROOT / ref["file"]).resolve()
            assert path.exists(), f"出典ファイル不存在: {path}"
            if path not in sources:
                sources[path] = path.read_text().splitlines()
            start = int(ref.get("line", ref.get("line_start", 1)))
            end = int(ref.get("end_line", ref.get("line_end", start)))
            assert 1 <= start <= end <= len(sources[path]), f"出典行範囲が不正: {source_label(ref)}"
            if ref.get("quote"):
                excerpt = norm("\n".join(sources[path][start - 1:end]))
                assert all(norm(part) in excerpt for part in ref["quote"].split(" / ") if norm(part)), f"引用行不一致: {source_label(ref)}"
                quote_count += 1
    return quote_count, sources


def main():
    csv.field_size_limit(10**7)
    aggregate = ROOT / "scenario_test/test_items/all_scenario_test_items.tsv"
    items = read_tsv(aggregate)
    common = json.loads((DEST / "common_review.json").read_text())
    assert hashlib.sha256(aggregate.read_bytes()).hexdigest() == common["baseline_aggregate_sha256"], "レビュー後に項目が変更された。再確認が必要"
    baseline_files = read_tsv(DEST / "reviewed_files_sha256.tsv")
    for record in baseline_files:
        path = ROOT / record["ファイル"]
        assert hashlib.sha256(path.read_bytes()).hexdigest() == record["SHA256"], f"レビュー対象の内容が変更された: {path}"
    source_snapshot = DEST / "reviewed_sources_sha256.tsv"
    if source_snapshot.exists():
        for record in read_tsv(source_snapshot):
            path = ROOT / record["ファイル"]
            assert path.is_file() and hashlib.sha256(path.read_bytes()).hexdigest() == record["SHA256"], f"引用元の内容が変更された。レビュー更新が必要: {path}"
    by_scn = defaultdict(list)
    by_id = {}
    for row in items:
        sid = re.search(r"元シナリオ: (\S+)", row["前提条件"])[1]
        assert row["テストID"] not in by_id
        by_id[row["テストID"]] = row
        by_scn[sid].append(row)
    reviews = {}
    for filename in ("inventory_review.json", "orders_review.json", "catalog_review.json"):
        obj = json.loads((DEST / filename).read_text())
        for row in obj["scenarios"]:
            sid = row["scenario_id"]
            assert sid not in reviews, f"レビュー重複: {sid}"
            assert row.get("checked_sources"), f"出典未記録: {sid}"
            reviews[sid] = row
    assert set(reviews) == set(by_scn), f"レビュー対象差分: {set(reviews) ^ set(by_scn)}"
    quote_count, reviewed_sources = validate_reviews(reviews, by_scn)
    findings = {}
    scenario_findings = defaultdict(set)
    direct_findings = defaultdict(set)
    for sid, review in reviews.items():
        for finding in review.get("findings", []):
            if finding.get("kind", "new") != "new":
                continue
            fid = finding["id"]
            if fid not in findings:
                findings[fid] = {**finding, "scenario_ids": set(), "test_ids": set()}
                findings[fid]["detail"] = []
                findings[fid]["recommendation"] = []
                findings[fid]["source_refs"] = []
            for key in ("detail", "recommendation"):
                value = finding.get(key)
                if value and value not in findings[fid][key]:
                    findings[fid][key].append(value)
            for ref in finding.get("source_refs", []):
                if ref not in findings[fid]["source_refs"]:
                    findings[fid]["source_refs"].append(ref)
            findings[fid]["scenario_ids"].add(sid)
            scenario_findings[sid].add(fid)
            tids = finding.get("test_ids", [])
            assert tids, f"影響するSTIが未特定: {fid}/{sid}"
            for tid in tids:
                assert tid in by_id, f"実在しないSTI: {fid}/{tid}"
                assert tid in {r["テストID"] for r in by_scn[sid]}, f"別SCNのSTI: {fid}/{tid}"
                direct_findings[tid].add(fid)
                findings[fid]["test_ids"].add(tid)
    common_by_item = defaultdict(list)
    common_by_scn = defaultdict(list)
    for finding in common["common_findings"]:
        for tid in finding["item_ids"]:
            assert tid in by_id
            common_by_item[tid].append(finding)
        for sid in finding["scenario_ids"]:
            assert sid in reviews
            common_by_scn[sid].append(finding)
    feasibility = {r["シナリオID"]: r for r in read_tsv(ROOT / "scenario_test/exec/feasibility/feasibility_by_scenario.tsv")}
    lineage = read_tsv(ROOT / "scenario_test/coverage/lineage_resolution_review.tsv")
    lineage_by_scn = defaultdict(list)
    for row in lineage:
        for sid in by_scn:
            if sid in row["対象SCN/連鎖ID"]:
                lineage_by_scn[sid].append(row["成果物"])
    scenario_rows = []
    item_rows = []

    def correction_status(ids, common_blockers):
        categories = {findings[fid].get("category") for fid in ids}
        if common_blockers or categories & {"procedure", "oracle", "coverage"}:
            return "手順・期待値の修正が必要"
        if categories & {"source_conflict", "design_gap"}:
            return "根拠仕様の確定待ち"
        if categories & {"preparation", "data_preparation"}:
            return "準備手順・データの具体化が必要"
        assert not ids, f"未分類の指摘: {ids}"
        return None

    for sid, rows in by_scn.items():
        review = reviews[sid]
        fatal_common = [f["finding_id"] for f in common_by_scn[sid] if f.get("blocking")]
        status = correction_status(scenario_findings[sid], fatal_common)
        if status:
            pass
        elif "判定不能" in feasibility[sid]["判定"] or lineage_by_scn[sid]:
            status = "仕様・データ契約の確定待ち"
        elif "要確認" in feasibility[sid]["判定"] or "要注意" in feasibility[sid]["判定"]:
            status = "既存実装指摘の影響確認・実施準備待ち"
        else:
            status = "実施準備・実機確認待ち"
        scenario_rows.append({
            "シナリオID": sid, "業務": rows[0]["機能名"].split(" — ")[0], "項目数": len(rows),
            "今回判定": status, "領域レビュー判定": review["status"],
            "新規指摘": ";".join(sorted(scenario_findings[sid])),
            "領域レビューの既知保留・準備未確認": ";".join(f["id"] for f in review.get("findings", []) if f.get("kind") != "new"),
            "共通準備の確定阻害": ";".join(fatal_common),
            "共通準備の確認対象": ";".join(f["finding_id"] for f in common_by_scn[sid] if not f.get("blocking")),
            "既存机上判定": feasibility[sid]["判定"], "既存連鎖残件": text(lineage_by_scn[sid]),
            "確認出典": source_labels(review["checked_sources"]), "実機実行": "未実施",
        })
        for row in rows:
            tid = row["テストID"]
            direct = set(direct_findings[tid])
            route = row["テスト観点"] == "業務経路"
            inherited = scenario_findings[sid] - direct if route else set()
            blocked_common = [f["finding_id"] for f in common_by_item[tid] if f.get("blocking")]
            old_class = re.search(r"実施区分: ([^/\n]+)", row["前提条件"])
            old_class = old_class[1].strip() if old_class else "未分類"
            # 独立分岐・データ差分項目の不備を、経路本文の確定不備に数えない。
            item_status = correction_status(direct, blocked_common)
            if item_status:
                pass
            elif old_class.startswith(("実施保留", "実施不可")):
                item_status = "既存保留条件の解除待ち"
            elif inherited:
                item_status = "関連項目の影響確認待ち"
            else:
                item_status = "実施準備・実機確認待ち"
            item_rows.append({
                "テストID": tid, "シナリオID": sid, "業務": rows[0]["機能名"].split(" — ")[0],
                "テスト観点": row["テスト観点"], "今回判定": item_status, "元の実施区分": old_class,
                "直接の指摘": ";".join(sorted(direct)), "関連項目の指摘（影響未確定）": ";".join(sorted(inherited)),
                "共通準備の確定阻害": ";".join(blocked_common),
                "共通準備の確認対象": ";".join(f["finding_id"] for f in common_by_item[tid] if not f.get("blocking")),
                "実機実行": "未実施",
            })
    finding_rows = []
    for fid, f in sorted(findings.items()):
        finding_rows.append({"指摘ID": fid, "優先度": f.get("severity", "P1"), "分類": CATEGORY_LABELS[f["category"]],
                             "指摘": f["title"], "理由": text(f.get("detail")), "修正案": text(f.get("recommendation")),
                             "対象SCN": ";".join(sorted(f["scenario_ids"])), "直接対象STI": ";".join(sorted(f["test_ids"])),
                             "根拠": source_labels(f.get("source_refs", [])), "対応状態": "未修正（検証結果）"})
    for f in common["common_findings"]:
        finding_rows.append({"指摘ID": f["finding_id"], "優先度": f["severity"], "分類": "共通準備・判定方法",
                             "指摘": f["title"], "理由": f["impact"], "修正案": f["recommendation"],
                             "対象SCN": ";".join(f["scenario_ids"]), "直接対象STI": ";".join(f["item_ids"]),
                             "根拠": text(f["evidence"]), "対応状態": "未修正（検証結果）"})
    write_tsv("by_scenario.tsv", scenario_rows, list(scenario_rows[0]))
    write_tsv("by_test_item.tsv", item_rows, list(item_rows[0]))
    write_tsv("findings.tsv", finding_rows, list(finding_rows[0]))
    index = [
        "# 実施可能性検証：全指摘一覧", "",
        f"業務別{len(findings)}種類・共通{len(common['common_findings'])}種類。各行の対象範囲は重複します。実機の失敗件数ではありません。詳細な理由・修正案・対象ID・根拠は[詳細TSV](findings.tsv)、判定方法は[検証報告](README.md)を参照してください。", "",
        "| ID | 分類 | 指摘 | SCN数 | 直接対象STI数 |",
        "|---|---|---|---:|---:|",
    ]
    for row in finding_rows:
        index.append(f"| {row['指摘ID']} | {row['分類']} | {row['指摘']} | {len(row['対象SCN'].split(';'))} | {len(row['直接対象STI'].split(';'))} |")
    index += [
        "", "## 原典引用と修正案", "",
        "- 在庫：[レビュー](inventory_review.json) / [未適用の修正案](inventory_repairs.json)",
        "- 受注・店頭受取・買取：[レビュー](orders_review.json) / [未適用の修正案](orders_repairs.json)",
        "- 商品・価格・仕入れ・イベント・デッキ：[レビュー](catalog_review.json) / [未適用の修正案](catalog_repairs.json)",
        "- 共通準備：[レビュー](common_review.json)", "",
    ]
    (DEST / "findings.md").write_text("\n".join(index))
    summary = {"date": "2026-10-09", "scenario_count": len(scenario_rows), "item_count": len(item_rows),
               "scenario_status": dict(Counter(r["今回判定"] for r in scenario_rows)),
               "item_status": dict(Counter(r["今回判定"] for r in item_rows)),
               "business_findings": len(findings), "common_findings": len(common["common_findings"]),
               "unique_direct_items_with_business_findings": sum(bool(v) for v in direct_findings.values()),
               "business_finding_categories": dict(Counter(CATEGORY_LABELS[f["category"]] for f in findings.values())),
               "verified_quote_records": quote_count,
               "unchanged_reviewed_files": len(baseline_files),
               "runtime_test_executed": False, "baseline_aggregate_sha256": common["baseline_aggregate_sha256"],
               "review_scope": "全129SCNの設計ウォークスルーと全1552STIへの指摘・既存保留・準備条件の対応付け。実機実行は別。",
               "result": "現行ケース全件をそのまま実施できるとは判定できない。"}
    (DEST / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n")
    with (DEST / "reviewed_sources_sha256.tsv").open("w", encoding="utf-8", newline="") as handle:
        writer = csv.writer(handle, delimiter="\t", lineterminator="\n")
        writer.writerow(["ファイル", "SHA256"])
        for path in sorted(reviewed_sources):
            writer.writerow([str(path), hashlib.sha256(path.read_bytes()).hexdigest()])
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
