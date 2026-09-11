#!/usr/bin/env python3
"""Build standalone grouped HTML 基本設計仕様書 for functions whose 機能グループ has
no Excel-derived basic-design HTML (ログイン・管理画面TOP・API デッキビルダー 等)。

These functions have no Excel basic design to merge into, so the reverse 詳細設計書 IS
the content. We render each group's Markdown docs into one styled HTML page (reusing the
function-spec converter's CSS / Markdown rendering), with a sidebar listing the functions.

Run: python3 .cursor/skills/function-spec-html-render/scripts/build_orphan_group_html.py
"""
from __future__ import annotations

import html
import importlib.util
import re
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parents[4]
CONVERTER_PATH = Path(__file__).resolve().parent / "convert_function_spec_html.py"
TODO = ROOT / "functions" / "todo-list.md"
FUNCTIONS_DIR = ROOT / "functions"
OUTPUT_DIR = ROOT / "excel_to_html" / "output"

# 出力ファイル名 -> (見出し, 対象機能No接頭辞のリスト)
# 2026-08-21 利用者決定: カスタマイズ区分「標準」はHTML設計書の生成自体が不要。
# 0215（M01 パスワード認証・二段階認証）と 0216（M02 トップページ各ブロック）は
# 構成機能が全て標準のため、書ごと生成しない。
GROUPS: dict[str, tuple[str, list[str]]] = {
    "0309_基本設計仕様書(フロント_デッキ検索).html": ("フロント デッキ検索", ["F09"]),
    "0508_基本設計仕様書(API_コンテンツ).html": ("API コンテンツ", ["A08"]),
    "0515_基本設計仕様書(API_デッキビルダー).html": ("API デッキビルダー", ["A15"]),
    "0417_基本設計仕様書(バッチ_その他).html": ("バッチ その他", ["B17"]),
}

MD_LINK_RE = re.compile(r"\[md\]\(([^)]+)\)")


def load_converter():
    spec = importlib.util.spec_from_file_location("convert_function_spec_html", CONVERTER_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)  # type: ignore[union-attr]
    return module


def feature_prefix(feature_no: str) -> str:
    match = re.match(r"([A-Z]\d{2})-", feature_no.strip().upper())
    return match.group(1) if match else ""


def parse_rows() -> list[tuple[str, str, Path]]:
    """Return (feature_no, feature_name, md_path) for rows that have an md link."""
    rows: list[tuple[str, str, Path]] = []
    for line in TODO.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|"):
            continue
        cells = [c.strip() for c in line.split("|")]
        # cells[0] は先頭空, [1]=TODO [2]=区分 [3]=分類 [4]=機能名 [5]=機能No [6]=区分 [7]=内容 [8]=詳細設計書
        if len(cells) < 9:
            continue
        feature_no = cells[5]
        if not re.match(r"[A-Z]\d{2}-", feature_no):
            continue
        link = MD_LINK_RE.search(cells[8])
        if not link:
            continue
        md_path = (FUNCTIONS_DIR / link.group(1)).resolve()
        rows.append((feature_no, cells[4], md_path))
    return rows


def build_group_html(converter, title: str, members: list[tuple[str, str, Path]]) -> str:
    sidebar_links: list[str] = []
    sections: list[str] = []
    for feature_no, feature_name, md_path in members:
        if not md_path.exists():
            continue
        markdown = converter.build_combined_markdown(md_path, [])
        doc_title, body_md = converter.extract_title_and_body(markdown, md_path.stem)
        slug = re.sub(r"[^0-9a-zA-Z]+", "-", feature_no.lower()).strip("-")
        headings: list[tuple[int, str, str]] = []
        body_html = converter.markdown_to_html(
            body_md,
            headings,
            slug_prefix=f"{slug}-",
            kind=converter.function_kind(source=md_path, feature_no=feature_no),
            customization=converter.customization_kind(source=md_path),
            common_titles=converter.common_spec_titles(md_path),
        )
        source_rel = md_path.relative_to(ROOT).as_posix()
        label = f"{html.escape(feature_no)} {html.escape(feature_name)}"
        sidebar_links.append(f'<a class="lv1" href="#{slug}">{label}</a>')
        # この文書は excel_to_html/output へ直接書き出すので、根拠リンクの接頭辞は空。
        superseded = converter.render_superseded_notice(md_path, href_prefix="")
        sections.append(
            f'<section class="doc-section" id="{slug}">\n'
            f'  <header class="page-header">\n'
            f'    <p class="crumb">Source:<br>{html.escape(source_rel, quote=False)}</p>\n'
            f"    <h1>{label} ／ {converter.render_inline(doc_title)}</h1>\n"
            f"  </header>\n"
            + (f"  {superseded}\n" if superseded else "")
            + f"  {body_html}\n"
            f"</section>"
        )

    sidebar = '<nav class="toc">' + "\n".join(sidebar_links) + "</nav>"
    html_title = html.escape(f"{title} - 基本設計仕様書（詳細設計）", quote=False)
    body = "\n".join(sections)
    return f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html_title}</title>
  <style>
{converter.CSS}
    {converter.superseded_specs.SUPERSEDED_CSS}
    {converter.phase2_specs.PHASE2_CSS}
  </style>
</head>
<body>
  <div class="page">
    <aside class="sidebar">
      <p class="sidebar-title">{html.escape(title, quote=False)}</p>
      {sidebar}
    </aside>
    <main class="doc-content">
      <header class="page-header">
        <h1>{html.escape(title, quote=False)} 基本設計仕様書（詳細設計）</h1>
        <p class="crumb">専用の基本設計（Excel）シートが無い機能群の現行仕様をまとめたページです。各機能の正本は Markdown です。</p>
      </header>
      {body}
      <footer>このページは機能仕様書Markdownから自動生成されています。編集は元のMarkdownに対して行ってください。</footer>
    </main>
  </div>
</body>
</html>
"""


INDEX_START = "<!-- orphan-groups:start -->"
INDEX_END = "<!-- orphan-groups:end -->"


def update_index(filenames: list[str]) -> None:
    """Idempotently register the generated grouped HTMLs in output/index.html."""
    index_path = OUTPUT_DIR / "index.html"
    if not index_path.exists():
        return
    document = index_path.read_text(encoding="utf-8")
    document = re.sub(re.escape(INDEX_START) + r".*?" + re.escape(INDEX_END), "", document, flags=re.DOTALL)
    items = []
    for filename in filenames:
        code = filename[:4]
        title = filename[:-5] if filename.endswith(".html") else filename
        href = quote(filename)
        items.append(
            f'        <li><a href="{href}"><span class="doc-code">{html.escape(code)}</span>'
            f'<span class="doc-title">{html.escape(title)}</span></a></li>'
        )
    block = (
        f"{INDEX_START}\n"
        '    <section class="index-section">\n'
        f"      <h2>追加（専用基本設計シート無し機能群） <span>{len(filenames)}件</span></h2>\n"
        '      <ul class="doc-list">\n'
        + "\n".join(items)
        + "\n      </ul>\n    </section>\n    "
        f"{INDEX_END}\n"
    )
    document = document.replace("  </main>", block + "  </main>", 1)
    index_path.write_text(document, encoding="utf-8")


def main() -> int:
    converter = load_converter()
    rows = parse_rows()
    written: list[str] = []
    for filename, (title, prefixes) in GROUPS.items():
        members = [r for r in rows if feature_prefix(r[0]) in prefixes]
        members.sort(key=lambda r: r[0])
        if not members:
            print(f"skip {filename}: no member rows")
            continue
        out = OUTPUT_DIR / filename
        out.write_text(build_group_html(converter, title, members), encoding="utf-8")
        written.append(filename)
        print(f"wrote {filename} ({len(members)} functions)")
    update_index(written)
    print(f"done: {len(written)} grouped HTML files; index.html updated")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
