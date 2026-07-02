#!/usr/bin/env python3
"""Classify unexpanded integration-test candidates by integration-test value."""

from __future__ import annotations

import argparse
import csv
import re
from collections import Counter, defaultdict
from pathlib import Path


KEEP_IFIDS = {
    "IT-05",
    "IT-06",
    "IT-07",
    "IT-08",
    "IT-10",
    "IT-11",
    "IT-15",
    "IT-16",
    "IT-21",
    "IT-24",
    "IT-27",
    "IT-28",
    "IT-30",
    "IT-33",
}
REVIEW_IFIDS = {"IT-01", "IT-12", "IT-20", "IT-23", "IT-26"}
DROP_IFIDS = {"IT-02", "IT-14", "IT-25"}
LOCALE_PATH_RE = re.compile(r"(^|[_/-])(en|ja)([_./-]|$)")


def is_locale_related(row: dict[str, str]) -> bool:
    path_text = f"{row['出力ファイル']} {row['元設計HTML']}".lower()
    return bool(LOCALE_PATH_RE.search(path_text)) or "英語" in row["機能名"] or "日本語" in row["機能名"]


def classify(row: dict[str, str]) -> tuple[str, str]:
    ifid = row["I/FID"]
    priority = row["優先度"]
    if ifid == "IT-21":
        return "昇格対象", "端末/画面サイズ差分は結合観点として保持"
    if priority == "P3":
        if is_locale_related(row):
            return "個別レビュー", "日英別HTML/twig差分の可能性があるため不要候補に落とさない"
        return "結合テスト不要候補", "P3は原則として結合テスト昇格対象外"
    if ifid in KEEP_IFIDS:
        return "昇格対象", "DB/CSV/帳票/ファイル/メール/セキュリティ/外部連携系"
    if ifid in REVIEW_IFIDS:
        return "個別レビュー", "エラー/監査/DB詳細など機能重要度で判断"
    if ifid in DROP_IFIDS and priority == "P1":
        return "個別レビュー", "低価値寄りIFIDだがP1のため個別確認"
    if ifid in DROP_IFIDS:
        if is_locale_related(row):
            return "個別レビュー", "日英別HTML/twig差分の可能性があるため不要候補に落とさない"
        return "結合テスト不要候補", "単純表示/UI詳細/単純0件系で結合テスト価値が低い"
    if priority == "P1":
        return "個別レビュー", "未分類IFIDだがP1のため個別確認"
    if is_locale_related(row):
        return "個別レビュー", "日英別HTML/twig差分の可能性があるため不要候補に落とさない"
    return "結合テスト不要候補", "未分類かつP2以下で結合テスト価値が低い"


def write_summary(repo: Path, rows: list[dict[str, str]]) -> None:
    by_status = Counter(row["精査区分"] for row in rows)
    by_status_priority: dict[str, Counter] = defaultdict(Counter)
    by_status_section: dict[str, Counter] = defaultdict(Counter)
    by_status_ifid: dict[str, Counter] = defaultdict(Counter)
    for row in rows:
        status = row["精査区分"]
        by_status_priority[status][row["優先度"]] += 1
        by_status_section[status][row["区分"]] += 1
        by_status_ifid[status][row["I/FID"]] += 1

    lines = [
        "# 未展開候補 精査サマリ",
        "",
        "- 端末/画面サイズ差分（IT-21）は昇格対象に分類する。",
        "- ロケール差分はIT-21ではなく、日英別HTML/twigを持つ機能単位で判定し、不要候補に落とさず個別レビュー以上に残す。",
        "- P3は原則として結合テスト不要候補。ただしIT-21は例外。",
        "- IT-02/IT-25は原則不要寄り。ただしP1は個別レビューに残す。",
        "",
        "## 全体",
        "",
        "| 精査区分 | 件数 | P1 | P2 | P3 |",
        "|----------|-----:|---:|---:|---:|",
    ]
    for status in ["昇格対象", "個別レビュー", "結合テスト不要候補"]:
        pri = by_status_priority[status]
        lines.append(f"| {status} | {by_status[status]} | {pri['P1']} | {pri['P2']} | {pri['P3']} |")

    lines.extend(["", "## 区分別", "", "| 精査区分 | 区分 | 件数 |", "|----------|------|-----:|"])
    for status in ["昇格対象", "個別レビュー", "結合テスト不要候補"]:
        for section, count in by_status_section[status].most_common():
            lines.append(f"| {status} | {section} | {count} |")

    lines.extend(["", "## IFID上位", ""])
    for status in ["昇格対象", "個別レビュー", "結合テスト不要候補"]:
        lines.extend([f"### {status}", "", "| I/FID | 件数 |", "|-------|-----:|"])
        for ifid, count in by_status_ifid[status].most_common(20):
            lines.append(f"| {ifid} | {count} |")
        lines.append("")

    lines.extend(
        [
            "## 昇格対象が多い機能",
            "",
            "| 昇格対象 | 個別レビュー | 不要候補 | 区分 | 機能No | 機能名 | 出力ファイル |",
            "|---------:|-------------:|---------:|------|--------|--------|--------------|",
        ]
    )
    by_file: dict[str, Counter] = defaultdict(Counter)
    meta: dict[str, dict[str, str]] = {}
    for row in rows:
        name = row["出力ファイル"]
        by_file[name][row["精査区分"]] += 1
        meta[name] = row
    ranked = sorted(by_file.items(), key=lambda item: (item[1]["昇格対象"], item[1]["個別レビュー"]), reverse=True)
    for name, counts in ranked[:40]:
        row = meta[name]
        lines.append(
            f"| {counts['昇格対象']} | {counts['個別レビュー']} | {counts['結合テスト不要候補']} | "
            f"{row['区分']} | {row['機能No']} | {row['機能名']} | `{name}` |"
        )

    (repo / "integration_test/unexpanded_it_candidates_triage_summary.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, default=Path("."))
    args = parser.parse_args()
    repo = args.repo.resolve()
    source = repo / "integration_test/unexpanded_it_candidates.tsv"
    rows = list(csv.DictReader(source.open(encoding="utf-8"), delimiter="\t"))
    if not rows:
        raise RuntimeError(f"no rows in {source}")
    output_rows: list[dict[str, str]] = []
    for row in rows:
        status, reason = classify(row)
        next_row = dict(row)
        next_row["精査区分"] = status
        next_row["精査理由"] = reason
        output_rows.append(next_row)

    out = repo / "integration_test/unexpanded_it_candidates_triage.tsv"
    with out.open("w", encoding="utf-8", newline="") as f:
        fieldnames = list(output_rows[0].keys())
        writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter="\t", lineterminator="\n")
        writer.writeheader()
        writer.writerows(output_rows)
    write_summary(repo, output_rows)
    counts = Counter(row["精査区分"] for row in output_rows)
    print(
        f"promote={counts['昇格対象']} review={counts['個別レビュー']} "
        f"close_candidate={counts['結合テスト不要候補']} output={out}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
