#!/usr/bin/env python3
"""Normalize function Markdown filenames from functions/todo-list.md."""

from __future__ import annotations

import re
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]
TODO = ROOT / "functions" / "todo-list.md"
REPORT = ROOT / "functions" / "function-doc-name-normalization-report.md"
SEARCH_DIRS = (
    ROOT / ".cursor",
    ROOT / "functions",
)

DIVISION_SLUG = {
    "フロント": "front",
    "管理画面": "admin",
    "バッチ": "batch",
    "API": "api",
    "その他": "other",
}

CATEGORY_SLUG = {
    "トップ": "top",
    "グローバルナビ": "global_nav",
    "商品": "product",
    "カート": "cart",
    "ネット買取管理": "online_purchase",
    "店頭買取管理": "store_purchase",
    "会員": "member",
    "イベント": "event",
    "ログイン": "login",
    "TOPページ": "home",
    "商品管理": "product",
    "受注管理": "order",
    "在庫管理": "stock",
    "会員管理": "customer",
    "カード管理": "card",
    "基本情報設定": "base_setting",
    "店舗設定": "shop_setting",
    "コンテンツ管理": "content",
    "デッキ管理": "deck",
    "分析集計": "analytics",
    "システム情報設定（設定）": "system_setting",
    "イベント管理": "event",
    "買取管理": "purchase",
    "インフラ": "infra",
    "その他": "other",
    "データ管理": "data",
    "デッキビルダー": "deck_builder",
    "MTGバイヤー": "mtg_buyer",
    "（基本設定）": "base_setting",
}

MD_LINK_RE = re.compile(r"\[md\]\(([^)]+)\)")
MD_PATH_RE = re.compile(r"`(functions/[^`]+?\.md)`")
TEXT_SUFFIXES = {".md", ".py", ".txt", ".html"}


@dataclass(frozen=True)
class Row:
    line_no: int
    division: str
    category: str
    feature: str
    feature_no: str
    detail: str
    source: Path


def main() -> int:
    rows = parse_rows()
    rows_by_source: dict[Path, list[Row]] = defaultdict(list)
    for row in rows:
        rows_by_source[row.source].append(row)

    renames: dict[Path, Path] = {}
    skipped: list[tuple[Path, list[Row], str]] = []
    for source, source_rows in sorted(rows_by_source.items()):
        existing = source.exists()
        numbered_rows = [row for row in source_rows if row.feature_no.strip()]
        if not existing:
            skipped.append((source, source_rows, "source file not found"))
            continue
        if len(source_rows) != 1:
            skipped.append((source, source_rows, "one Markdown is shared by multiple TODO rows"))
            continue
        if not numbered_rows:
            skipped.append((source, source_rows, "feature number is blank"))
            continue

        row = source_rows[0]
        target = source.with_name(normalized_name(row, source))
        if source != target:
            if target.exists():
                skipped.append((source, source_rows, f"target already exists: {target}"))
                continue
            renames[source] = target

    for source, target in renames.items():
        target.parent.mkdir(parents=True, exist_ok=True)
        source.rename(target)

    path_map = {source: target for source, target in renames.items()}
    update_todo(rows_by_source, path_map)
    update_text_references(path_map)
    write_report(renames, skipped)

    print(f"renamed: {len(renames)}")
    print(f"skipped: {len(skipped)}")
    print(f"report: {REPORT}")
    return 0


def parse_rows() -> list[Row]:
    rows: list[Row] = []
    for line_no, line in enumerate(TODO.read_text(encoding="utf-8").splitlines(), 1):
        if not line.startswith("|") or line.startswith("| ---") or line.startswith("| TODO"):
            continue
        cols = [col.strip() for col in line.strip("|").split("|")]
        if len(cols) < 8:
            continue
        detail = cols[7]
        source = resolve_source(detail)
        if source is None:
            continue
        rows.append(
            Row(
                line_no=line_no,
                division=cols[1],
                category=cols[2],
                feature=cols[3],
                feature_no=cols[4],
                detail=detail,
                source=source,
            )
        )
    return rows


def resolve_source(detail: str) -> Path | None:
    link_match = MD_LINK_RE.search(detail)
    if link_match:
        link = link_match.group(1)
        if link.startswith("../design/functions/"):
            rel = link.removeprefix("../design/functions/")
            return resolve_functions_path(rel)
        if not link.startswith("../") and not link.startswith("/"):
            return (TODO.parent / link).resolve()

    path_match = MD_PATH_RE.search(detail)
    if path_match:
        return (ROOT / path_match.group(1)).resolve()

    return None


def resolve_functions_path(rel: str) -> Path:
    candidate = ROOT / "functions" / rel
    if candidate.exists():
        return candidate.resolve()
    if "/" not in rel:
        for directory in ("ec-cube-enterprise", "pf-eccube3", "pf-api"):
            candidate = ROOT / "functions" / directory / rel
            if candidate.exists():
                return candidate.resolve()
    return (ROOT / "functions" / rel).resolve()


def normalized_name(row: Row, source: Path) -> str:
    feature_no = row.feature_no.strip().lower()
    division = DIVISION_SLUG.get(row.division, slugify(row.division))
    category = CATEGORY_SLUG.get(row.category, slugify(row.category))
    stem = strip_existing_division_prefix(source.stem, division)
    return f"{feature_no}_{division}_{category}_{stem}.md"


def strip_existing_division_prefix(stem: str, division_slug: str) -> str:
    prefixes = {
        "front": "front_",
        "admin": "admin_",
        "batch": "batch_",
        "api": "api_",
        "other": "other_",
    }
    prefix = prefixes.get(division_slug)
    if prefix and stem.startswith(prefix):
        return stem[len(prefix) :]
    return stem


def slugify(value: str) -> str:
    text = value.strip().lower()
    text = re.sub(r"[^0-9a-zA-Z]+", "_", text)
    return text.strip("_") or "unknown"


def update_todo(rows_by_source: dict[Path, list[Row]], path_map: dict[Path, Path]) -> None:
    text = TODO.read_text(encoding="utf-8")
    for source, source_rows in sorted(rows_by_source.items(), key=lambda item: len(str(item[0])), reverse=True):
        target = path_map.get(source, source)
        rel = target.relative_to(TODO.parent).as_posix()
        old_paths = todo_reference_variants(source)
        for old in old_paths:
            text = text.replace(f"[md]({old})", f"[md]({rel})")
            text = text.replace(f"`{old}`", f"[md]({rel})")
        # Keep existing html target convention, but align the basename with the Markdown stem.
        html_name = target.with_suffix(".html").name
        for row in source_rows:
            html_match = re.search(r"\[html\]\(([^)]+)\)", row.detail)
            if html_match:
                old_html = html_match.group(1)
                new_html = re.sub(r"[^/]+\.html$", html_name, old_html)
                text = text.replace(f"[html]({old_html})", f"[html]({new_html})")
    TODO.write_text(text, encoding="utf-8")


def todo_reference_variants(source: Path) -> set[str]:
    rel_from_functions = source.relative_to(TODO.parent).as_posix()
    rel_from_root = source.relative_to(ROOT).as_posix()
    variants = {
        rel_from_functions,
        rel_from_root,
        f"../design/functions/{rel_from_functions}",
        f"../design/functions/{source.name}",
    }
    return variants


def update_text_references(path_map: dict[Path, Path]) -> None:
    replacements: dict[str, str] = {}
    for source, target in path_map.items():
        replacements[str(source)] = str(target)
        replacements[source.relative_to(ROOT).as_posix()] = target.relative_to(ROOT).as_posix()
        replacements[source.name] = target.name

    for directory in SEARCH_DIRS:
        for path in directory.rglob("*"):
            if not path.is_file() or path.suffix not in TEXT_SUFFIXES:
                continue
            if path == TODO or path == REPORT:
                continue
            try:
                text = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                continue
            updated = text
            for old, new in sorted(replacements.items(), key=lambda item: len(item[0]), reverse=True):
                updated = updated.replace(old, new)
            if updated != text:
                path.write_text(updated, encoding="utf-8")


def write_report(renames: dict[Path, Path], skipped: list[tuple[Path, list[Row], str]]) -> None:
    lines = [
        "# Function Doc Name Normalization Report",
        "",
        "## Applied Renames",
        "",
    ]
    if renames:
        for source, target in sorted(renames.items()):
            lines.append(f"- `{source.relative_to(ROOT)}` -> `{target.relative_to(ROOT)}`")
    else:
        lines.append("- None")

    lines.extend(["", "## Skipped", ""])
    if skipped:
        for source, rows, reason in skipped:
            lines.append(f"- `{relative_or_absolute(source)}`: {reason}")
            for row in rows:
                lines.append(
                    f"  - line {row.line_no}: {row.feature_no or '(blank)'} "
                    f"{row.division} / {row.category} / {row.feature or '(blank)'}"
                )
    else:
        lines.append("- None")

    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")


def relative_or_absolute(path: Path) -> str:
    try:
        return str(path.relative_to(ROOT))
    except ValueError:
        return str(path)


if __name__ == "__main__":
    raise SystemExit(main())
