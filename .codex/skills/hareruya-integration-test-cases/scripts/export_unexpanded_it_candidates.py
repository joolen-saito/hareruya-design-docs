#!/usr/bin/env python3
"""Export integration-test viewpoint candidates omitted by the per-file cap.

This report is intentionally derived from generate_it_cases.py so that the
"candidate" set uses the same HTML discovery, context flags, viewpoint matching,
priority ordering, and prospective row wording as the generated IT case files.
"""

from __future__ import annotations

import argparse
import csv
import importlib.util
import sys
from collections import Counter, defaultdict
from io import StringIO
from pathlib import Path


OUTPUT_COLUMNS = [
    "区分",
    "分類",
    "機能No",
    "機能名",
    "カスタマイズ区分",
    "出力ファイル",
    "元設計HTML",
    "候補順位",
    "未展開理由",
    "候補テストID",
    "I/FID",
    "テスト観点",
    "優先度",
    "テスト項目名",
    "前提条件",
    "入力データ/リクエスト内容",
    "操作手順/実行方法",
    "期待結果／レスポンス",
    "観点No",
    "観点分類",
    "大項目",
    "中項目",
    "小項目",
    "観点",
    "検出フラグ",
]


def load_generator(repo: Path):
    script = repo / ".codex/skills/hareruya-integration-test-cases/scripts/generate_it_cases.py"
    spec = importlib.util.spec_from_file_location("hareruya_generate_it_cases", script)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"failed to load generator: {script}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def parse_todo_metadata(repo: Path, gen) -> dict[str, dict[str, str]]:
    todo = repo / "functions/todo-list.md"
    metadata: dict[str, dict[str, str]] = {}
    if not todo.exists():
        return metadata
    for line in todo.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|") or line.startswith("| ---") or line.startswith("| TODO"):
            continue
        if "[html]" not in line:
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) < 8:
            continue
        html_match = gen.re.search(r"\[html\]\(([^)]+)\)", line)
        if not html_match:
            continue
        html_path = (todo.parent / html_match.group(1)).resolve()
        stem = gen.output_stem(html_path)
        metadata.setdefault(
            f"{stem}_it_cases.md",
            {
                "区分": cells[1],
                "分類": cells[2],
                "機能名": cells[3],
                "機能No": cells[4],
                "カスタマイズ区分": cells[5],
            },
        )
    return metadata


def flag_label(flags: dict[str, bool]) -> str:
    return ",".join(key for key, enabled in flags.items() if enabled)


def read_generated_rows(path: Path) -> list[list[str]]:
    if not path.exists():
        return []
    text = path.read_text(encoding="utf-8")
    match = gen_re_search(r"```tsv\n(.*?)\n```", text)
    if not match:
        return []
    rows = list(csv.reader(StringIO(match.group(1)), delimiter="\t"))
    return rows[1:] if rows else []


def gen_re_search(pattern: str, text: str):
    # Kept separate so the reporting script does not depend on a global generator
    # module just to parse existing Markdown fences.
    import re

    return re.search(pattern, text, re.S)


def candidate_rows(repo: Path, max_cases_per_file: int) -> tuple[list[list[str]], Counter, list[dict[str, object]]]:
    gen = load_generator(repo)
    viewpoints = gen.read_viewpoints(repo / "integration_test/integration-test-viewpoints.md")
    metadata = parse_todo_metadata(repo, gen)

    rows: list[list[str]] = []
    summary_counter: Counter = Counter()
    file_summaries: list[dict[str, object]] = []

    for html_path in gen.discover_html(repo):
        doc = gen.read_html(html_path)
        all_case_rows, ordered, flags = gen.make_rows(doc, viewpoints, len(viewpoints))
        output_name = f"{gen.output_stem(html_path)}_it_cases.md"
        meta = metadata.get(output_name, {})
        rel_html = html_path.relative_to(repo).as_posix()
        flags_text = flag_label(flags)
        existing_rows = read_generated_rows(repo / "integration_test" / output_name)
        generated_count = len(existing_rows) if existing_rows else min(len(ordered), max_cases_per_file)
        omitted_pairs = list(zip(ordered[generated_count:], all_case_rows[generated_count:]))
        if existing_rows and existing_rows != all_case_rows[: len(existing_rows)]:
            summary_counter["files_different_from_recomputed"] += 1

        summary_counter["functions"] += 1
        summary_counter["candidate_viewpoints"] += len(ordered)
        summary_counter["generated_cases"] += generated_count
        summary_counter["unexpanded_candidates"] += len(omitted_pairs)
        if omitted_pairs:
            summary_counter["functions_with_unexpanded"] += 1

        file_summaries.append(
            {
                "区分": meta.get("区分", ""),
                "分類": meta.get("分類", ""),
                "機能No": meta.get("機能No", ""),
                "機能名": meta.get("機能名", doc.title),
                "出力ファイル": output_name,
                "候補数": len(ordered),
                "出力済み": generated_count,
                "未展開": len(omitted_pairs),
                "P1": 0,
                "P2": 0,
                "P3": 0,
                "検出フラグ": flags_text,
            }
        )
        file_summary = file_summaries[-1]

        for zero_based_rank, (vp, case_row) in enumerate(omitted_pairs, start=generated_count):
            rank = zero_based_rank + 1
            priority = case_row[4]
            summary_counter[f"unexpanded_{priority}"] += 1
            file_summary[priority] = int(file_summary[priority]) + 1
            rows.append(
                [
                    meta.get("区分", ""),
                    meta.get("分類", ""),
                    meta.get("機能No", ""),
                    meta.get("機能名", doc.title),
                    meta.get("カスタマイズ区分", ""),
                    output_name,
                    rel_html,
                    str(rank),
                    f"既存出力済み件数={generated_count} の優先順位外",
                    case_row[1],
                    case_row[2],
                    case_row[3],
                    case_row[4],
                    case_row[5],
                    case_row[6],
                    case_row[7],
                    case_row[8],
                    case_row[9],
                    vp.no,
                    vp.category,
                    vp.large,
                    vp.middle,
                    vp.small,
                    vp.text,
                    flags_text,
                ]
            )
    return rows, summary_counter, file_summaries


def write_tsv(path: Path, header: list[str], rows: list[list[str]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f, delimiter="\t", lineterminator="\n")
        writer.writerow(header)
        writer.writerows(rows)


def write_summary(path: Path, summary_counter: Counter, file_summaries: list[dict[str, object]], max_cases_per_file: int) -> None:
    by_section: dict[str, Counter] = defaultdict(Counter)
    for item in file_summaries:
        section = str(item.get("区分") or "(未設定)")
        by_section[section]["functions"] += 1
        by_section[section]["candidate_viewpoints"] += int(item["候補数"])
        by_section[section]["generated_cases"] += int(item["出力済み"])
        by_section[section]["unexpanded_candidates"] += int(item["未展開"])
        by_section[section]["unexpanded_P1"] += int(item["P1"])
        by_section[section]["unexpanded_P2"] += int(item["P2"])
        by_section[section]["unexpanded_P3"] += int(item["P3"])
        if int(item["未展開"]):
            by_section[section]["functions_with_unexpanded"] += 1

    top = sorted(file_summaries, key=lambda item: int(item["未展開"]), reverse=True)[:30]
    top_p1 = sorted(file_summaries, key=lambda item: int(item["P1"]), reverse=True)[:30]
    lines = [
        "# 未展開候補サマリ",
        "",
        f"- 生成上限: `{max_cases_per_file}` 件/ファイル",
        "- 候補順位は既存ジェネレータのスコア順であり、P1/P2/P3の優先度順ではない",
        "- 出力済みケース数は現行ジェネレータロジックによる再計算値",
        f"- 対象機能数: {summary_counter['functions']}",
        f"- 候補観点数: {summary_counter['candidate_viewpoints']}",
        f"- 出力済みケース数: {summary_counter['generated_cases']}",
        f"- 未展開候補数: {summary_counter['unexpanded_candidates']}",
        f"- 未展開P1/P2/P3: {summary_counter['unexpanded_P1']} / {summary_counter['unexpanded_P2']} / {summary_counter['unexpanded_P3']}",
        f"- 未展開あり機能数: {summary_counter['functions_with_unexpanded']}",
        f"- 既存Markdownと現行ジェネレータ再計算の差分あり機能数: {summary_counter['files_different_from_recomputed']}",
        "",
        "## 区分別",
        "",
        "| 区分 | 機能数 | 候補観点数 | 出力済み | 未展開 | P1 | P2 | P3 | 未展開あり機能数 |",
        "|------|-------:|-----------:|---------:|-------:|---:|---:|---:|-----------------:|",
    ]
    for section in sorted(by_section):
        c = by_section[section]
        lines.append(
            f"| {section} | {c['functions']} | {c['candidate_viewpoints']} | {c['generated_cases']} | {c['unexpanded_candidates']} | {c['unexpanded_P1']} | {c['unexpanded_P2']} | {c['unexpanded_P3']} | {c['functions_with_unexpanded']} |"
        )

    lines.extend(
        [
            "",
            "## 未展開が多い機能",
            "",
            "| 未展開 | 候補数 | 出力済み | 区分 | 機能No | 機能名 | 出力ファイル |",
            "|-------:|-------:|---------:|------|--------|--------|--------------|",
        ]
    )
    for item in top:
        lines.append(
            f"| {item['未展開']} | {item['候補数']} | {item['出力済み']} | {item['区分']} | {item['機能No']} | {item['機能名']} | `{item['出力ファイル']}` |"
        )
    lines.extend(
        [
            "",
            "## 未展開P1が多い機能",
            "",
            "| P1 | P2 | P3 | 未展開 | 区分 | 機能No | 機能名 | 出力ファイル |",
            "|---:|---:|---:|-------:|------|--------|--------|--------------|",
        ]
    )
    for item in top_p1:
        if int(item["P1"]) == 0:
            continue
        lines.append(
            f"| {item['P1']} | {item['P2']} | {item['P3']} | {item['未展開']} | {item['区分']} | {item['機能No']} | {item['機能名']} | `{item['出力ファイル']}` |"
        )
    lines.append("")
    path.write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, default=Path("."))
    parser.add_argument("--max-cases-per-file", type=int, default=90)
    parser.add_argument("--output", type=Path, default=Path("integration_test/unexpanded_it_candidates.tsv"))
    parser.add_argument("--summary", type=Path, default=Path("integration_test/unexpanded_it_candidates_summary.md"))
    args = parser.parse_args()

    repo = args.repo.resolve()
    rows, summary_counter, file_summaries = candidate_rows(repo, args.max_cases_per_file)
    output = args.output if args.output.is_absolute() else repo / args.output
    summary = args.summary if args.summary.is_absolute() else repo / args.summary
    write_tsv(output, OUTPUT_COLUMNS, rows)
    write_summary(summary, summary_counter, file_summaries, args.max_cases_per_file)
    print(
        "functions={functions} candidates={candidate_viewpoints} generated={generated_cases} "
        "unexpanded={unexpanded_candidates} output={output} summary={summary}".format(
            output=output.relative_to(repo),
            summary=summary.relative_to(repo),
            **summary_counter,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
