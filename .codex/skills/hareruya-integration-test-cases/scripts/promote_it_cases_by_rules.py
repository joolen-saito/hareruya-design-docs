#!/usr/bin/env python3
"""Promote omitted integration-test candidates using the promotion rule caps."""

from __future__ import annotations

import argparse
import csv
import importlib.util
import re
import sys
from collections import Counter
from io import StringIO
from pathlib import Path


REPORT_COLUMNS = [
    "出力ファイル",
    "元設計HTML",
    "区分",
    "分類",
    "機能No",
    "機能名",
    "判定",
    "理由",
    "現在件数",
    "候補数",
    "目標上限",
    "追加件数",
    "追加P1",
    "追加P2",
    "追加P3",
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
    for line in todo.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|") or line.startswith("| ---") or line.startswith("| TODO"):
            continue
        if "[html]" not in line:
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) < 8:
            continue
        match = gen.re.search(r"\[html\]\(([^)]+)\)", line)
        if not match:
            continue
        html_path = (todo.parent / match.group(1)).resolve()
        metadata.setdefault(
            f"{gen.output_stem(html_path)}_it_cases.md",
            {
                "区分": cells[1],
                "分類": cells[2],
                "機能名": cells[3],
                "機能No": cells[4],
                "カスタマイズ区分": cells[5],
            },
        )
    return metadata


def read_generated_rows(path: Path) -> list[list[str]]:
    if not path.exists():
        return []
    match = re.search(r"```tsv\n(.*?)\n```", path.read_text(encoding="utf-8"), re.S)
    if not match:
        return []
    rows = list(csv.reader(StringIO(match.group(1)), delimiter="\t"))
    return rows[1:] if rows else []


def execution_key(row: list[str]) -> tuple[str, str, str, str]:
    return (
        re.sub(r"\s+", " ", row[6]).strip(),
        re.sub(r"\s+", " ", row[7]).strip(),
        re.sub(r"\s+", " ", row[8]).strip(),
        re.sub(r"\s+", " ", row[9]).strip(),
    )


def dedupe_execution_rows(rows: list[list[str]]) -> list[list[str]]:
    out: list[list[str]] = []
    seen: set[tuple[str, str, str, str]] = set()
    for row in rows:
        key = execution_key(row)
        if key in seen:
            continue
        seen.add(key)
        out.append(row)
    return out


def single_line_cell(value: str) -> str:
    return re.sub(r"\s*\r?\n\s*", " / ", value).strip()


def single_line_rows(rows: list[list[str]]) -> list[list[str]]:
    return [[single_line_cell(cell) for cell in row] for row in rows]


def write_aggregate(repo: Path) -> int:
    gen = load_generator(repo)
    valid_outputs = {f"{gen.output_stem(path)}_it_cases.md" for path in gen.discover_html(repo)}
    header: list[str] | None = None
    all_rows: list[list[str]] = []
    for path in sorted((repo / "integration_test").glob("*_it_cases.md")):
        if path.name not in valid_outputs:
            continue
        match = re.search(r"```tsv\n(.*?)\n```", path.read_text(encoding="utf-8"), re.S)
        if not match:
            continue
        rows = list(csv.reader(StringIO(match.group(1)), delimiter="\t"))
        if not rows:
            continue
        if header is None:
            header = rows[0]
        elif rows[0] != header:
            raise RuntimeError(f"header mismatch: {path}")
        all_rows.extend(rows[1:])
    if header is None:
        raise RuntimeError("no generated IT case Markdown found")
    all_rows = single_line_rows(dedupe_execution_rows(all_rows))
    with (repo / "integration_test/all_it_cases.tsv").open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f, delimiter="\t", lineterminator="\n")
        writer.writerow(header)
        writer.writerows(all_rows)
    return len(all_rows)


def flag_label(flags: dict[str, bool]) -> str:
    return ",".join(key for key, enabled in flags.items() if enabled)


def text_blob(output_name: str, html_path: Path, meta: dict[str, str], flags: dict[str, bool]) -> str:
    return " ".join(
        [
            output_name.lower(),
            html_path.as_posix().lower(),
            meta.get("区分", "").lower(),
            meta.get("分類", "").lower(),
            meta.get("機能名", "").lower(),
            flag_label(flags).lower(),
        ]
    )


def target_cap(output_name: str, html_path: Path, meta: dict[str, str], flags: dict[str, bool]) -> tuple[int, str]:
    blob = text_blob(output_name, html_path, meta, flags)
    if any(word in blob for word in ["csv", "import", "export", "file", "upload", "download", "ファイル", "取込", "出力"]):
        return 180, "CSV/ファイル系"
    if any(word in blob for word in ["pdf", "print", "slip", "帳票", "印刷", "納品書", "ピッキング"]):
        return 180, "帳票/印刷系"
    if flags.get("external") or flags.get("mail") or flags.get("batch"):
        return 160, "外部連携/メール/バッチ複合"
    if meta.get("区分") == "管理画面" and (flags.get("create") or flags.get("update") or flags.get("delete")):
        return 140, "管理画面DB更新系"
    if flags.get("search") or any(word in blob for word in ["detail", "edit", "search", "list", "詳細", "編集", "検索", "一覧"]):
        return 120, "通常検索/詳細/編集"
    return 90, "単純表示/ナビ系"


def promote(repo: Path, dry_run: bool = False) -> tuple[list[list[str]], Counter]:
    gen = load_generator(repo)
    viewpoints = gen.read_viewpoints(repo / "integration_test/integration-test-viewpoints.md")
    metadata = parse_todo_metadata(repo, gen)
    report_rows: list[list[str]] = []
    summary: Counter = Counter()

    for html_path in gen.discover_html(repo):
        doc = gen.read_html(html_path)
        all_case_rows, ordered, flags = gen.make_rows(doc, viewpoints, len(viewpoints))
        output_name = f"{gen.output_stem(html_path)}_it_cases.md"
        output_path = repo / "integration_test" / output_name
        meta = metadata.get(output_name, {})
        current_rows = read_generated_rows(output_path)
        current_count = len(current_rows)
        cap, reason = target_cap(output_name, html_path, meta, flags)
        candidate_count = len(ordered)
        target_count = min(candidate_count, cap)
        added_rows = all_case_rows[current_count:target_count] if current_count < target_count else []
        priority_counts = Counter(row[4] for row in added_rows)

        status = "skip"
        detail = reason
        if not output_path.exists():
            status = "skip_missing_output"
            detail = "既存テストケースファイルがないため新規作成しない"
        elif current_rows and current_rows != all_case_rows[:current_count]:
            status = "skip_drift"
            detail = "既存Markdownと現行ジェネレータ再計算が不一致"
        elif target_count <= current_count:
            status = "skip_current_ge_target"
            detail = reason
        elif any(row[4] == "P3" for row in added_rows):
            status = "skip_p3_in_addition"
            detail = "追加範囲にP3を含むため個別レビュー待ち"
        else:
            status = "promote" if not dry_run else "dry_run_promote"
            detail = reason
            if not dry_run:
                body, _ = gen.render_markdown(repo, doc, viewpoints, target_count)
                output_path.write_text(body, encoding="utf-8")

        summary[status] += 1
        summary["added_rows"] += len(added_rows) if status in {"promote", "dry_run_promote"} else 0
        summary["added_P1"] += priority_counts["P1"] if status in {"promote", "dry_run_promote"} else 0
        summary["added_P2"] += priority_counts["P2"] if status in {"promote", "dry_run_promote"} else 0
        summary["added_P3"] += priority_counts["P3"] if status in {"promote", "dry_run_promote"} else 0
        report_rows.append(
            [
                output_name,
                html_path.relative_to(repo).as_posix(),
                meta.get("区分", ""),
                meta.get("分類", ""),
                meta.get("機能No", ""),
                meta.get("機能名", doc.title),
                status,
                detail,
                str(current_count),
                str(candidate_count),
                str(target_count),
                str(len(added_rows) if status in {"promote", "dry_run_promote"} else 0),
                str(priority_counts["P1"] if status in {"promote", "dry_run_promote"} else 0),
                str(priority_counts["P2"] if status in {"promote", "dry_run_promote"} else 0),
                str(priority_counts["P3"] if status in {"promote", "dry_run_promote"} else 0),
                flag_label(flags),
            ]
        )
    return report_rows, summary


def write_report(repo: Path, rows: list[list[str]], summary: Counter, aggregate_rows: int | None, dry_run: bool) -> None:
    report_path = repo / "integration_test/unexpanded_promotion_rollout_report.tsv"
    with report_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f, delimiter="\t", lineterminator="\n")
        writer.writerow(REPORT_COLUMNS)
        writer.writerows(rows)

    lines = [
        "# 未展開候補 昇格ロールアウト結果",
        "",
        f"- dry_run: {dry_run}",
        f"- promote: {summary['promote']}",
        f"- dry_run_promote: {summary['dry_run_promote']}",
        f"- skip_current_ge_target: {summary['skip_current_ge_target']}",
        f"- skip_missing_output: {summary['skip_missing_output']}",
        f"- skip_drift: {summary['skip_drift']}",
        f"- skip_p3_in_addition: {summary['skip_p3_in_addition']}",
        f"- 追加行数: {summary['added_rows']}",
        f"- 追加P1/P2/P3: {summary['added_P1']} / {summary['added_P2']} / {summary['added_P3']}",
    ]
    if aggregate_rows is not None:
        lines.append(f"- all_it_cases.tsv データ行: {aggregate_rows}")
    lines.extend(
        [
            "",
            "詳細は `integration_test/unexpanded_promotion_rollout_report.tsv` を参照。",
            "",
        ]
    )
    (repo / "integration_test/unexpanded_promotion_rollout_summary.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, default=Path("."))
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    repo = args.repo.resolve()
    rows, summary = promote(repo, dry_run=args.dry_run)
    aggregate_rows = None if args.dry_run else write_aggregate(repo)
    write_report(repo, rows, summary, aggregate_rows, args.dry_run)
    print(
        f"promote={summary['promote']} dry_run_promote={summary['dry_run_promote']} "
        f"skip_current_ge_target={summary['skip_current_ge_target']} skip_missing_output={summary['skip_missing_output']} "
        f"skip_drift={summary['skip_drift']} "
        f"skip_p3_in_addition={summary['skip_p3_in_addition']} added_rows={summary['added_rows']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
