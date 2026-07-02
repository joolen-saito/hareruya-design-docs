#!/usr/bin/env python3
"""Audit Playwright coverage for Hareruya standard functions."""

from __future__ import annotations

import argparse
import csv
import re
from dataclasses import dataclass
from pathlib import Path


TODO_RE = re.compile(r"^\|\s*-\s*\[[ xX]\]\s*\|")
MD_LINK_RE = re.compile(r"\[md\]\(([^)]+)\)")


@dataclass(frozen=True)
class FunctionRow:
    area: str
    category: str
    name: str
    function_id: str
    customization: str
    md_path: str
    normalized: str


def split_markdown_row(line: str) -> list[str]:
    return [cell.strip() for cell in line.strip().strip("|").split("|")]


def normalize_function_id(function_id: str) -> str:
    return function_id.strip().lower().replace("-", "_")


def read_standard_functions(repo: Path) -> list[FunctionRow]:
    rows: list[FunctionRow] = []
    todo = repo / "functions" / "todo-list.md"
    for line in todo.read_text(encoding="utf-8").splitlines():
      if not TODO_RE.match(line):
          continue
      cells = split_markdown_row(line)
      if len(cells) < 8:
          continue
      customization = cells[5]
      if customization != "標準":
          continue
      md_match = MD_LINK_RE.search(cells[7])
      rows.append(
          FunctionRow(
              area=cells[1],
              category=cells[2],
              name=cells[3],
              function_id=cells[4],
              customization=customization,
              md_path=md_match.group(1) if md_match else "",
              normalized=normalize_function_id(cells[4]),
          )
      )
    return rows


def find_one(root: Path, pattern: str) -> str:
    matches = sorted(root.glob(pattern))
    return str(matches[0]) if matches else ""


def find_many(root: Path, pattern: str) -> list[str]:
    return [str(path) for path in sorted(root.glob(pattern))]


def status_for(row: FunctionRow, repo: Path) -> dict[str, str]:
    n = row.normalized
    e2e_cases = find_one(repo, f"integration_test/e2e/{n}_*_e2e_cases.md")
    it_cases = find_one(repo, f"integration_test/{n}_*_it_cases.md")

    if n == "m01_01":
        specs = [str(repo / "e2e/spec/admin/login.spec.ts")]
        pages = [str(repo / "e2e/pages/admin/login.page.ts")]
    elif n == "m01_02":
        specs = [str(repo / "e2e/spec/admin/two_factor_auth.spec.ts")]
        pages = [str(repo / "e2e/pages/admin/two_factor_auth.page.ts")]
    else:
        specs = find_many(repo, f"e2e/spec/**/*{n}_*.spec.ts")
        pages = find_many(repo, f"e2e/pages/**/*{n}_*.page.ts")

    missing = []
    if not it_cases:
        missing.append("it_cases")
    if not e2e_cases:
        missing.append("e2e_cases")
    if not specs or not Path(specs[0]).exists():
        missing.append("spec")
    if not pages or not Path(pages[0]).exists():
        missing.append("page")

    return {
        "area": row.area,
        "category": row.category,
        "function_id": row.function_id,
        "normalized": n,
        "name": row.name,
        "md_path": row.md_path,
        "it_cases": rel(repo, it_cases),
        "e2e_cases": rel(repo, e2e_cases),
        "spec": rel(repo, specs[0]) if specs else "",
        "page": rel(repo, pages[0]) if pages else "",
        "status": "ok" if not missing else "missing:" + ",".join(missing),
    }


def rel(repo: Path, value: str) -> str:
    if not value:
        return ""
    try:
        return str(Path(value).resolve().relative_to(repo.resolve()))
    except ValueError:
        return value


def write_reports(repo: Path, records: list[dict[str, str]]) -> None:
    out_dir = repo / "e2e" / "reports"
    out_dir.mkdir(parents=True, exist_ok=True)
    tsv_path = out_dir / "standard-playwright-coverage.tsv"
    md_path = out_dir / "standard-playwright-coverage.md"

    fields = [
        "area",
        "category",
        "function_id",
        "normalized",
        "name",
        "status",
        "it_cases",
        "e2e_cases",
        "spec",
        "page",
        "md_path",
    ]
    with tsv_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fields, delimiter="\t")
        writer.writeheader()
        writer.writerows(records)

    total = len(records)
    ok = sum(1 for r in records if r["status"] == "ok")
    missing = total - ok
    lines = [
        "# Standard Playwright Coverage",
        "",
        f"- total standard functions: {total}",
        f"- complete: {ok}",
        f"- incomplete: {missing}",
        "",
        "| Function | Name | Status | E2E cases | Spec | Page |",
        "|---|---|---|---|---|---|",
    ]
    for r in records:
        lines.append(
            "| {function_id} | {name} | {status} | {e2e_cases} | {spec} | {page} |".format(
                **{k: escape_md(v) for k, v in r.items()}
            )
        )
    md_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def escape_md(value: str) -> str:
    return value.replace("|", "\\|") if value else ""


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default=".", help="Repository root")
    args = parser.parse_args()

    repo = Path(args.repo).resolve()
    rows = read_standard_functions(repo)
    records = [status_for(row, repo) for row in rows]
    records.sort(key=lambda r: r["normalized"])
    write_reports(repo, records)

    missing = [r for r in records if r["status"] != "ok"]
    print(f"standard functions: {len(records)}")
    print(f"complete: {len(records) - len(missing)}")
    print(f"incomplete: {len(missing)}")
    if missing:
        print("first incomplete:")
        for r in missing[:20]:
            print(f"- {r['function_id']} {r['name']}: {r['status']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
