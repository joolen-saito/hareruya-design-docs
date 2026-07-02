#!/usr/bin/env python3
"""Promote adopted unexpanded candidates."""

from __future__ import annotations

import argparse
import csv
import importlib.util
import re
import sys
from collections import Counter, defaultdict
from io import StringIO
from pathlib import Path


REPORT_COLUMNS = [
    "出力ファイル",
    "判定",
    "理由",
    "現在件数",
    "反映後件数",
    "採用候補数",
    "追加件数",
    "追加P1",
    "追加P2",
    "追加P3",
    "追加IFID",
]


def read_rows(path: Path) -> tuple[list[str], list[list[str]], str]:
    text = path.read_text(encoding="utf-8")
    match = re.search(r"```tsv\n(.*?)\n```", text, re.S)
    if not match:
        raise RuntimeError(f"missing TSV block: {path}")
    parsed = list(csv.reader(StringIO(match.group(1)), delimiter="\t"))
    if not parsed:
        raise RuntimeError(f"empty TSV block: {path}")
    return parsed[0], parsed[1:], text


def current_output_names(repo: Path) -> set[str]:
    script = repo / ".codex/skills/hareruya-integration-test-cases/scripts/generate_it_cases.py"
    spec = importlib.util.spec_from_file_location("hareruya_generate_it_cases", script)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"failed to load generator: {script}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return {f"{module.output_stem(path)}_it_cases.md" for path in module.discover_html(repo)}


def write_tsv(header: list[str], rows: list[list[str]]) -> str:
    buf = StringIO()
    writer = csv.writer(buf, delimiter="\t", lineterminator="\n", quoting=csv.QUOTE_MINIMAL)
    writer.writerow(header)
    writer.writerows(rows)
    return buf.getvalue().rstrip("\n")


def load_adopted(repo: Path) -> dict[str, list[dict[str, str]]]:
    adoption = repo / "integration_test/unexpanded_it_candidates_adoption.tsv"
    by_file: dict[str, list[dict[str, str]]] = defaultdict(list)
    with adoption.open(encoding="utf-8") as f:
        for row in csv.DictReader(f, delimiter="\t"):
            if row["採否"] == "採用":
                by_file[row["出力ファイル"]].append(row)
    for rows in by_file.values():
        rows.sort(key=lambda row: int(row["候補順位"]))
    return by_file


def candidate_to_case_row(candidate: dict[str, str], function_name: str) -> list[str]:
    return [
        function_name,
        candidate["候補テストID"],
        candidate["I/FID"],
        candidate["テスト観点"],
        candidate["優先度"],
        candidate["テスト項目名"],
        candidate["前提条件"],
        candidate["入力データ/リクエスト内容"],
        candidate["操作手順/実行方法"],
        candidate["期待結果／レスポンス"],
    ]


def identity(row: list[str]) -> tuple[str, str, str, str]:
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
        row_identity = identity(row)
        if row_identity in seen:
            continue
        seen.add(row_identity)
        out.append(row)
    return out


def single_line_cell(value: str) -> str:
    return re.sub(r"\s*\r?\n\s*", " / ", value).strip()


def single_line_rows(rows: list[list[str]]) -> list[list[str]]:
    return [[single_line_cell(cell) for cell in row] for row in rows]


def renumber_appended(existing_rows: list[list[str]], appended_rows: list[list[str]]) -> list[list[str]]:
    if not appended_rows:
        return []
    if not existing_rows:
        raise RuntimeError("cannot renumber without existing rows")
    match = re.match(r"^(.*)-(\d{3})$", existing_rows[-1][1])
    if not match:
        raise RuntimeError(f"unexpected test ID format: {existing_rows[-1][1]}")
    prefix = match.group(1)
    start = int(match.group(2)) + 1
    out: list[list[str]] = []
    for offset, row in enumerate(appended_rows):
        next_row = list(row)
        next_row[1] = f"{prefix}-{start + offset:03d}"
        out.append(next_row)
    return out


def write_aggregate(repo: Path) -> int:
    valid_outputs = current_output_names(repo)
    header: list[str] | None = None
    all_rows: list[list[str]] = []
    for path in sorted((repo / "integration_test").glob("*_it_cases.md")):
        if path.name not in valid_outputs:
            continue
        file_header, rows, _ = read_rows(path)
        if header is None:
            header = file_header
        elif file_header != header:
            raise RuntimeError(f"header mismatch: {path}")
        all_rows.extend(rows)
    if header is None:
        raise RuntimeError("no generated IT case Markdown found")
    all_rows = single_line_rows(dedupe_execution_rows(all_rows))
    with (repo / "integration_test/all_it_cases.tsv").open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f, delimiter="\t", lineterminator="\n")
        writer.writerow(header)
        writer.writerows(all_rows)
    return len(all_rows)


def promote(repo: Path, dry_run: bool) -> tuple[list[list[str]], Counter, int | None]:
    adopted = load_adopted(repo)
    report_rows: list[list[str]] = []
    summary: Counter = Counter()

    for output_name in sorted(adopted):
        output_path = repo / "integration_test" / output_name
        if not output_path.exists():
            summary["skip_missing_output"] += 1
            continue
        header, existing_rows, text = read_rows(output_path)
        current = len(existing_rows)
        file_adopted = adopted.get(output_name, [])
        function_name = existing_rows[0][0] if existing_rows else ""
        existing_identities = {identity(row) for row in existing_rows}
        planned_identities = set(existing_identities)
        appended: list[list[str]] = []
        for candidate in file_adopted:
            row = candidate_to_case_row(candidate, function_name)
            row_identity = identity(row)
            if row_identity in planned_identities:
                continue
            appended.append(row)
            planned_identities.add(row_identity)

        status = "skip"
        reason = ""
        if not appended:
            status = "skip_no_adopted_candidate"
            reason = "追加可能な採用候補なし"
        else:
            status = "dry_run_promote" if dry_run else "promote"
            reason = "採用候補のみを追記"
            if not dry_run:
                appended = renumber_appended(existing_rows, appended)
                next_text = re.sub(
                    r"```tsv\n.*?\n```",
                    lambda _match: f"```tsv\n{write_tsv(header, existing_rows + appended)}\n```",
                    text,
                    count=1,
                    flags=re.S,
                )
                output_path.write_text(next_text, encoding="utf-8")

        priorities = Counter(row[4] for row in appended)
        ifids = Counter(row[2] for row in appended)
        summary[status] += 1
        if status in {"promote", "dry_run_promote"}:
            summary["added_rows"] += len(appended)
            summary["added_P1"] += priorities["P1"]
            summary["added_P2"] += priorities["P2"]
            summary["added_P3"] += priorities["P3"]
        report_rows.append(
            [
                output_name,
                status,
                reason,
                str(current),
                str(current + len(appended) if status in {"promote", "dry_run_promote"} else current),
                str(len(file_adopted)),
                str(len(appended) if status in {"promote", "dry_run_promote"} else 0),
                str(priorities["P1"] if status in {"promote", "dry_run_promote"} else 0),
                str(priorities["P2"] if status in {"promote", "dry_run_promote"} else 0),
                str(priorities["P3"] if status in {"promote", "dry_run_promote"} else 0),
                ",".join(f"{key}:{value}" for key, value in sorted(ifids.items())),
            ]
        )

    aggregate_rows = None if dry_run else write_aggregate(repo)
    return report_rows, summary, aggregate_rows


def write_report(repo: Path, rows: list[list[str]], summary: Counter, aggregate_rows: int | None, dry_run: bool) -> None:
    report_path = repo / "integration_test/unexpanded_adopted_promotion_report.tsv"
    with report_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f, delimiter="\t", lineterminator="\n")
        writer.writerow(REPORT_COLUMNS)
        writer.writerows(rows)

    lines = [
        "# 採用候補 段階反映結果",
        "",
        f"- dry_run: {dry_run}",
        f"- promote: {summary['promote']}",
        f"- dry_run_promote: {summary['dry_run_promote']}",
        f"- skip_missing_output: {summary['skip_missing_output']}",
        f"- skip_no_adopted_candidate: {summary['skip_no_adopted_candidate']}",
        f"- 追加行数: {summary['added_rows']}",
        f"- 追加P1/P2/P3: {summary['added_P1']} / {summary['added_P2']} / {summary['added_P3']}",
    ]
    if aggregate_rows is not None:
        lines.append(f"- all_it_cases.tsv データ行: {aggregate_rows}")
    lines.extend(["", "詳細は `integration_test/unexpanded_adopted_promotion_report.tsv` を参照。", ""])
    (repo / "integration_test/unexpanded_adopted_promotion_summary.md").write_text("\n".join(lines), encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", type=Path, default=Path("."))
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    repo = args.repo.resolve()
    rows, summary, aggregate_rows = promote(repo, args.dry_run)
    write_report(repo, rows, summary, aggregate_rows, args.dry_run)
    print(
        f"promote={summary['promote']} dry_run_promote={summary['dry_run_promote']} "
        f"skip_missing_output={summary['skip_missing_output']} "
        f"skip_no_adopted_candidate={summary['skip_no_adopted_candidate']} "
        f"added_rows={summary['added_rows']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
