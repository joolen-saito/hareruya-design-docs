#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import re
from io import StringIO
from pathlib import Path


GENERATED_MARKER = "<!-- generated-by: hareruya-scenario-test-items -->"
EXPECTED_HEADER = [
    "シナリオID",
    "テストID",
    "フロー種別",
    "テスト観点",
    "優先度",
    "テスト項目名",
    "前提条件",
    "入力データ/対象",
    "操作手順/実行方法",
    "期待結果",
]
FORBIDDEN = (
    "UI標準",
    "設計書に記載のとおり",
    "設計どおり",
    "要確認",
    "UNRESOLVED",
    "何らか",
    "必要に応じ",
    "適宜",
    "...",
)


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8", errors="ignore")


def tsv_block(text: str) -> str | None:
    m = re.search(r"```tsv\n(.*?)\n```", text, re.S)
    return m.group(1) if m else None


def parse_tsv(block: str) -> list[list[str]]:
    return list(csv.reader(StringIO(block), delimiter="\t"))


def validate_file(repo: Path, path: Path) -> list[str]:
    text = read(path)
    errors: list[str] = []
    if GENERATED_MARKER not in text:
        errors.append("missing generated marker")
    for phrase in FORBIDDEN:
        if phrase in text:
            errors.append(f"forbidden phrase: {phrase}")
    block = tsv_block(text)
    if block is None:
        return errors + ["missing tsv block"]
    rows = parse_tsv(block)
    if not rows:
        return errors + ["empty tsv block"]
    if rows[0] != EXPECTED_HEADER:
        errors.append("invalid tsv header")
    seen_ids: set[str] = set()
    seen_exec: set[tuple[str, str, str, str]] = set()
    flow_types: set[str] = set()
    for idx, row in enumerate(rows[1:], 2):
        if len(row) != len(EXPECTED_HEADER):
            errors.append(f"row {idx}: expected 10 columns, got {len(row)}")
            continue
        sid, tid, flow_type, viewpoint, priority, item_name, precondition, input_data, steps, expected = row
        if not sid.startswith("SCN-"):
            errors.append(f"row {idx}: invalid scenario id")
        if not tid.startswith("STI-"):
            errors.append(f"row {idx}: invalid test id")
        if tid in seen_ids:
            errors.append(f"row {idx}: duplicate test id {tid}")
        seen_ids.add(tid)
        if flow_type not in {"正常系", "代替系", "異常系"}:
            errors.append(f"row {idx}: invalid flow type {flow_type}")
        flow_types.add(flow_type)
        if priority not in {"P1", "P2", "P3"}:
            errors.append(f"row {idx}: invalid priority {priority}")
        for label, value in (("テスト観点", viewpoint), ("テスト項目名", item_name), ("前提条件", precondition), ("入力データ/対象", input_data), ("操作手順/実行方法", steps), ("期待結果", expected)):
            if not value.strip():
                errors.append(f"row {idx}: empty {label}")
        key = (
            re.sub(r"\s+", " ", precondition).strip(),
            re.sub(r"\s+", " ", input_data).strip(),
            re.sub(r"\s+", " ", steps).strip(),
            re.sub(r"\s+", " ", expected).strip(),
        )
        if key in seen_exec:
            errors.append(f"row {idx}: duplicate execution tuple")
        seen_exec.add(key)
    if "正常系" not in flow_types:
        errors.append("missing normal test items")
    if not ({"代替系", "異常系"} & flow_types):
        errors.append("missing alternative/error test items")
    return errors


def validate_aggregate(repo: Path) -> list[str]:
    path = repo / "scenario_test" / "test_items" / "all_scenario_test_items.tsv"
    if not path.exists():
        return ["missing aggregate TSV"]
    rows = parse_tsv(read(path))
    errors: list[str] = []
    if not rows or rows[0] != EXPECTED_HEADER:
        errors.append("aggregate invalid header")
    for idx, row in enumerate(rows[1:], 2):
        if len(row) != len(EXPECTED_HEADER):
            errors.append(f"aggregate row {idx}: expected 10 columns, got {len(row)}")
        if any("\n" in cell for cell in row):
            errors.append(f"aggregate row {idx}: contains cell newline")
    return errors


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default=".")
    args = parser.parse_args()
    repo = Path(args.repo).resolve()
    files = sorted((repo / "scenario_test" / "test_items").glob("STI-*.md"))
    if not files:
        print("no test item files found")
        return 1
    failed = 0
    for path in files:
        errors = validate_file(repo, path)
        if errors:
            failed += 1
            print(f"NG {path.relative_to(repo)}")
            for error in errors:
                print(f"  - {error}")
        else:
            print(f"OK {path.relative_to(repo)}")
    for error in validate_aggregate(repo):
        failed += 1
        print("NG scenario_test/test_items/all_scenario_test_items.tsv")
        print(f"  - {error}")
    print(f"checked={len(files)} failed={failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
