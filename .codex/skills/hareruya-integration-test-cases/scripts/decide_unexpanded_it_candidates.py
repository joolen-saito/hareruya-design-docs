#!/usr/bin/env python3
"""Make adoption decisions for triaged unexpanded integration-test candidates."""

from __future__ import annotations

import argparse
import csv
import importlib.util
import re
import sys
from collections import Counter, defaultdict
from io import StringIO
from pathlib import Path


LOCALE_PATH_RE = re.compile(r"(^|[_/-])(en|ja)([_./-]|$)")


def is_locale_related(row: dict[str, str]) -> bool:
    path_text = f"{row['出力ファイル']} {row['元設計HTML']}".lower()
    return bool(LOCALE_PATH_RE.search(path_text)) or "英語" in row["機能名"] or "日本語" in row["機能名"]


def decide(row: dict[str, str]) -> tuple[str, str]:
    triage = row["精査区分"]
    priority = row["優先度"]
    if triage == "昇格対象":
        return "採用", "昇格対象として分類済み"
    if is_locale_related(row):
        return "採用", "日英別HTML/twig差分の可能性があるため含める"
    if triage == "個別レビュー" and priority == "P1":
        return "採用", "P1は結合テストで落とさない"
    if triage == "個別レビュー" and row["I/FID"] in {"IT-09", "IT-32"}:
        return "採用", "API/外部取得・受信検証は結合観点として含める"
    if triage == "個別レビュー":
        return "不採用", "P2/P3の非ロケールUI・表示詳細は既存ケースまたは手動確認で扱う"
    return "不採用", "結合テスト不要候補としてクローズ"


def current_output_names(repo: Path) -> set[str]:
    script = repo / ".codex/skills/hareruya-integration-test-cases/scripts/generate_it_cases.py"
    spec = importlib.util.spec_from_file_location("hareruya_generate_it_cases", script)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"failed to load generator: {script}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return {f"{module.output_stem(path)}_it_cases.md" for path in module.discover_html(repo)}


def execution_identity_from_values(premise: str, input_data: str, steps: str, expected: str) -> tuple[str, str, str, str]:
    return (
        re.sub(r"\s+", " ", premise).strip(),
        re.sub(r"\s+", " ", input_data).strip(),
        re.sub(r"\s+", " ", steps).strip(),
        re.sub(r"\s+", " ", expected).strip(),
    )


def load_existing_identities(repo: Path) -> dict[str, set[tuple[str, str, str, str]]]:
    valid_outputs = current_output_names(repo)
    identities: dict[str, set[tuple[str, str, str, str]]] = defaultdict(set)
    for path in (repo / "integration_test").glob("*_it_cases.md"):
        if path.name not in valid_outputs:
            continue
        text = path.read_text(encoding="utf-8")
        match = re.search(r"```tsv\n(.*?)\n```", text, re.S)
        if not match:
            continue
        rows = list(csv.reader(StringIO(match.group(1)), delimiter="\t"))
        for row in rows[1:]:
            if len(row) >= 10:
                identities[path.name].add(execution_identity_from_values(row[6], row[7], row[8], row[9]))
    return identities


def write_summary(repo: Path, rows: list[dict[str, str]]) -> None:
    by_decision = Counter(row["採否"] for row in rows)
    by_decision_priority: dict[str, Counter] = defaultdict(Counter)
    by_decision_section: dict[str, Counter] = defaultdict(Counter)
    by_decision_ifid: dict[str, Counter] = defaultdict(Counter)
    for row in rows:
        decision = row["採否"]
        by_decision_priority[decision][row["優先度"]] += 1
        by_decision_section[decision][row["区分"]] += 1
        by_decision_ifid[decision][row["I/FID"]] += 1

    lines = [
        "# 未展開候補 採否判断サマリ",
        "",
        "## 判断基準",
        "",
        "- 昇格対象は採用。",
        "- P1は原則採用。",
        "- 日英別HTML/twig差分の可能性がある機能は、優先度に関わらず採用。",
        "- API/外部取得・受信検証は採用。",
        "- 非ロケールのP2/P3 UI詳細・単純表示・重複粒度は不採用。",
        "",
        "## 全体",
        "",
        "| 採否 | 件数 | P1 | P2 | P3 |",
        "|------|-----:|---:|---:|---:|",
    ]
    for decision in ["反映済み", "採用", "不採用"]:
        pri = by_decision_priority[decision]
        lines.append(f"| {decision} | {by_decision[decision]} | {pri['P1']} | {pri['P2']} | {pri['P3']} |")

    lines.extend(["", "## 区分別", "", "| 採否 | 区分 | 件数 |", "|------|------|-----:|"])
    for decision in ["反映済み", "採用", "不採用"]:
        for section, count in by_decision_section[decision].most_common():
            lines.append(f"| {decision} | {section} | {count} |")

    lines.extend(["", "## IFID上位", ""])
    for decision in ["反映済み", "採用", "不採用"]:
        lines.extend([f"### {decision}", "", "| I/FID | 件数 |", "|-------|-----:|"])
        for ifid, count in by_decision_ifid[decision].most_common(20):
            lines.append(f"| {ifid} | {count} |")
        lines.append("")

    lines.extend(
        [
            "## 採用候補が多い機能",
            "",
            "| 採用 | 不採用 | 区分 | 機能No | 機能名 | 出力ファイル |",
            "|-----:|-------:|------|--------|--------|--------------|",
        ]
    )
    by_file: dict[str, Counter] = defaultdict(Counter)
    meta: dict[str, dict[str, str]] = {}
    for row in rows:
        name = row["出力ファイル"]
        by_file[name][row["採否"]] += 1
        meta[name] = row
    ranked = sorted(by_file.items(), key=lambda item: item[1]["採用"], reverse=True)
    for name, counts in ranked[:50]:
        row = meta[name]
        lines.append(
            f"| {counts['採用']} | {counts['不採用']} | {row['区分']} | {row['機能No']} | {row['機能名']} | `{name}` |"
        )

    (repo / "integration_test/unexpanded_it_candidates_adoption_summary.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, default=Path("."))
    args = parser.parse_args()
    repo = args.repo.resolve()
    source = repo / "integration_test/unexpanded_it_candidates_triage.tsv"
    rows = list(csv.DictReader(source.open(encoding="utf-8"), delimiter="\t"))
    existing_identities = load_existing_identities(repo)
    output_rows: list[dict[str, str]] = []
    for row in rows:
        row_identity = execution_identity_from_values(
            row["前提条件"],
            row["入力データ/リクエスト内容"],
            row["操作手順/実行方法"],
            row["期待結果／レスポンス"],
        )
        if row_identity in existing_identities.get(row["出力ファイル"], set()):
            decision, reason = "反映済み", "同一前提条件・入力データ・操作手順・期待結果が既存テストケースに存在する"
        else:
            decision, reason = decide(row)
        next_row = dict(row)
        next_row["採否"] = decision
        next_row["採否理由"] = reason
        output_rows.append(next_row)

    out = repo / "integration_test/unexpanded_it_candidates_adoption.tsv"
    with out.open("w", encoding="utf-8", newline="") as f:
        fieldnames = list(output_rows[0].keys())
        writer = csv.DictWriter(f, fieldnames=fieldnames, delimiter="\t", lineterminator="\n")
        writer.writeheader()
        writer.writerows(output_rows)
    write_summary(repo, output_rows)
    counts = Counter(row["採否"] for row in output_rows)
    print(f"adopt={counts['採用']} reject={counts['不採用']} output={out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
