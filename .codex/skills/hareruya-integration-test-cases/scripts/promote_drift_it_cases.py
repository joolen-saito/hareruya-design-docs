#!/usr/bin/env python3
"""Promote reviewed drift files while preserving existing emitted rows."""

from __future__ import annotations

import argparse
import csv
import importlib.util
import re
import sys
from collections import Counter
from io import StringIO
from pathlib import Path


DRIFT_TARGETS = {
    "m05_06_admin_order_order_bulk_manual_mail_it_cases.md": 160,
    "m05_11_admin_order_order_edit_it_cases.md": 140,
    "m05_14_admin_order_order_status_change_it_cases.md": 160,
    "m05_26_admin_order_order_shipping_result_csv_import_it_cases.md": 180,
}

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

REPORT_COLUMNS = [
    "出力ファイル",
    "判定",
    "理由",
    "現在件数",
    "目標件数",
    "追加件数",
    "走査候補数",
    "追加P1",
    "追加P2",
    "追加P3",
    "追加IFID",
    "除外理由",
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


def read_rows(path: Path) -> tuple[list[str], list[list[str]], str]:
    text = path.read_text(encoding="utf-8")
    match = re.search(r"```tsv\n(.*?)\n```", text, re.S)
    if not match:
        raise RuntimeError(f"missing TSV block: {path}")
    parsed = list(csv.reader(StringIO(match.group(1)), delimiter="\t"))
    if not parsed:
        raise RuntimeError(f"empty TSV block: {path}")
    return parsed[0], parsed[1:], text


def write_tsv(header: list[str], rows: list[list[str]]) -> str:
    buf = StringIO()
    writer = csv.writer(buf, delimiter="\t", lineterminator="\n", quoting=csv.QUOTE_MINIMAL)
    writer.writerow(header)
    writer.writerows(rows)
    return buf.getvalue().rstrip("\n")


def include_candidate(row: list[str]) -> tuple[bool, str]:
    ifid = row[2]
    priority = row[4]
    if ifid == "IT-21":
        return True, "keep_terminal_locale"
    if priority == "P3":
        return False, "drop_p3"
    if ifid in KEEP_IFIDS:
        return True, "keep"
    if ifid in REVIEW_IFIDS:
        return True, "review"
    if ifid in DROP_IFIDS and priority == "P1":
        return True, "review_drop_p1"
    if ifid in DROP_IFIDS:
        return False, "drop_low_value"
    if priority == "P1":
        return True, "review_unclassified_p1"
    return False, "drop_unclassified"


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
    renumbered: list[list[str]] = []
    for offset, row in enumerate(appended_rows):
        new_row = list(row)
        new_row[1] = f"{prefix}-{start + offset:03d}"
        renumbered.append(new_row)
    return renumbered


def identity_mismatches(existing_rows: list[list[str]], generated_rows: list[list[str]]) -> list[int]:
    mismatches: list[int] = []
    for idx, (existing, generated) in enumerate(zip(existing_rows, generated_rows), start=1):
        if existing[1:6] != generated[1:6]:
            mismatches.append(idx)
    return mismatches


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
    gen = load_generator(repo)
    viewpoints = gen.read_viewpoints(repo / "integration_test/integration-test-viewpoints.md")
    html_by_output = {f"{gen.output_stem(path)}_it_cases.md": path for path in gen.discover_html(repo)}
    report_rows: list[list[str]] = []
    summary: Counter = Counter()

    for output_name, target in DRIFT_TARGETS.items():
        output_path = repo / "integration_test" / output_name
        header, existing_rows, text = read_rows(output_path)
        html_path = html_by_output[output_name]
        doc = gen.read_html(html_path)
        generated_rows, _, _ = gen.make_rows(doc, viewpoints, len(viewpoints))
        mismatches = identity_mismatches(existing_rows, generated_rows)

        appended: list[list[str]] = []
        exclude_reasons: Counter = Counter()
        scanned = 0
        status = "skip"
        detail = ""

        if mismatches:
            status = "skip_identity_drift"
            detail = "既存行と現行候補のテストID/I-FID/観点/優先度/項目名が不一致"
        elif len(existing_rows) >= target:
            status = "skip_current_ge_target"
            detail = "既存件数が目標以上"
        else:
            for row in generated_rows[len(existing_rows) :]:
                ok, reason = include_candidate(row)
                scanned += 1
                if ok:
                    appended.append(row)
                else:
                    exclude_reasons[reason] += 1
                if len(existing_rows) + len(appended) >= target:
                    break
            if len(existing_rows) + len(appended) < target:
                status = "skip_insufficient_candidates"
                detail = "フィルタ後候補が目標件数に不足"
            else:
                status = "dry_run_promote" if dry_run else "promote"
                detail = "既存1-90行を保持し、P3原則除外・IT-21例外採用で追記"
                if not dry_run:
                    appended = renumber_appended(existing_rows, appended)
                    next_text = re.sub(
                        r"```tsv\n.*?\n```",
                        f"```tsv\n{write_tsv(header, existing_rows + appended)}\n```",
                        text,
                        count=1,
                        flags=re.S,
                    )
                    output_path.write_text(next_text, encoding="utf-8")

        priority_counts = Counter(row[4] for row in appended)
        ifid_counts = Counter(row[2] for row in appended)
        summary[status] += 1
        if status in {"promote", "dry_run_promote"}:
            summary["added_rows"] += len(appended)
            summary["added_P1"] += priority_counts["P1"]
            summary["added_P2"] += priority_counts["P2"]
            summary["added_P3"] += priority_counts["P3"]
        report_rows.append(
            [
                output_name,
                status,
                detail,
                str(len(existing_rows)),
                str(target),
                str(len(appended) if status in {"promote", "dry_run_promote"} else 0),
                str(scanned),
                str(priority_counts["P1"] if status in {"promote", "dry_run_promote"} else 0),
                str(priority_counts["P2"] if status in {"promote", "dry_run_promote"} else 0),
                str(priority_counts["P3"] if status in {"promote", "dry_run_promote"} else 0),
                ",".join(f"{key}:{value}" for key, value in sorted(ifid_counts.items())),
                ",".join(f"{key}:{value}" for key, value in sorted(exclude_reasons.items())),
            ]
        )

    aggregate_rows = None if dry_run else write_aggregate(repo)
    return report_rows, summary, aggregate_rows


def write_report(repo: Path, rows: list[list[str]], summary: Counter, aggregate_rows: int | None, dry_run: bool) -> None:
    report_path = repo / "integration_test/unexpanded_drift_promotion_report.tsv"
    with report_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f, delimiter="\t", lineterminator="\n")
        writer.writerow(REPORT_COLUMNS)
        writer.writerows(rows)

    lines = [
        "# drift 4件 昇格結果",
        "",
        f"- dry_run: {dry_run}",
        f"- promote: {summary['promote']}",
        f"- dry_run_promote: {summary['dry_run_promote']}",
        f"- skip_identity_drift: {summary['skip_identity_drift']}",
        f"- skip_current_ge_target: {summary['skip_current_ge_target']}",
        f"- skip_insufficient_candidates: {summary['skip_insufficient_candidates']}",
        f"- 追加行数: {summary['added_rows']}",
        f"- 追加P1/P2/P3: {summary['added_P1']} / {summary['added_P2']} / {summary['added_P3']}",
    ]
    if aggregate_rows is not None:
        lines.append(f"- all_it_cases.tsv データ行: {aggregate_rows}")
    lines.extend(["", "詳細は `integration_test/unexpanded_drift_promotion_report.tsv` を参照。", ""])
    (repo / "integration_test/unexpanded_drift_promotion_summary.md").write_text("\n".join(lines), encoding="utf-8")


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
        f"skip_identity_drift={summary['skip_identity_drift']} "
        f"skip_insufficient_candidates={summary['skip_insufficient_candidates']} "
        f"added_rows={summary['added_rows']}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
