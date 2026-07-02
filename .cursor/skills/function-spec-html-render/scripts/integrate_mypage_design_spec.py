#!/usr/bin/env python3
"""Generate the mypage function spec preview and embed it into sheet-8."""

from __future__ import annotations

import html
import importlib.util
import re
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]
SOURCE = ROOT / "functions" / "pf-eccube3" / "f06-05_front_member_mypage_index.md"
PREVIEW = ROOT / "function_spec_html_preview" / "pf-eccube3" / "f06-05_front_member_mypage_index.html"
TARGET = ROOT / "excel_to_html" / "output" / "0306_基本設計仕様書(フロント_会員).html"
CONVERTER_PATH = Path(__file__).with_name("convert_function_spec_html.py")

BEGIN = "<!-- mypage-design-embed:start -->"
END = "<!-- mypage-design-embed:end -->"
SHEET_RE = re.compile(r'<section class="sheet-panel(?: is-active)?" id="sheet-8">')
NEXT_SHEET_RE = re.compile(r'\n\s*<section class="sheet-panel(?: is-active)?" id="sheet-\d+">')


EMBED_CSS = """
    <style>
      .mypage-design-embed {
        margin-top: 36px;
        padding-top: 24px;
        border-top: 2px solid var(--clay);
      }

      .mypage-design-header {
        margin-bottom: 18px;
      }

      .mypage-design-header h3 {
        margin: 0 0 6px;
        color: var(--text);
        font-size: 20px;
      }

      .mypage-design-header h4 {
        margin: 0;
        color: var(--olive);
        font-size: 16px;
      }

      .mypage-design-source {
        margin: 0 0 8px;
        color: var(--muted);
        font-size: 12px;
        overflow-wrap: anywhere;
      }

      .mypage-design-body h2 {
        margin: 28px 0 12px;
        padding-bottom: 7px;
        border-bottom: 1px solid var(--line);
        font-size: 18px;
      }

      .mypage-design-body h3 {
        margin: 22px 0 10px;
        color: var(--olive);
        font-size: 16px;
      }

      .mypage-design-body h4 {
        margin: 18px 0 8px;
        color: var(--muted);
        font-size: 14px;
      }

      .mypage-design-body p {
        margin: 9px 0;
      }

      .mypage-design-body ul,
      .mypage-design-body ol {
        margin: 9px 0;
        padding-left: 26px;
      }

      .mypage-design-body li {
        margin: 3px 0;
      }

      .mypage-design-body code {
        padding: 1px 5px;
        border-radius: 5px;
        background: var(--band);
        font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
        font-size: 90%;
      }

      .mypage-design-body pre {
        overflow-x: auto;
        padding: 12px 14px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
        white-space: pre-wrap;
      }

      .mypage-design-body pre code {
        padding: 0;
        background: transparent;
      }

      .mypage-design-body .table-wrap {
        overflow-x: auto;
        margin: 14px 0 22px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
      }

      .mypage-design-body table {
        width: 100%;
        min-width: 760px;
        border-collapse: collapse;
        font-size: 13px;
      }

      .mypage-design-body th,
      .mypage-design-body td {
        border: 1px solid var(--line-soft);
        padding: 7px 9px;
        text-align: left;
        vertical-align: top;
      }

      .mypage-design-body th {
        background: var(--band);
        font-weight: 700;
        white-space: nowrap;
      }

      .mypage-design-body tbody tr:nth-child(even) {
        background: #fffaf0;
      }
    </style>
""".strip()


def main() -> int:
    if not SOURCE.exists():
        print(f"ERROR: source not found: {SOURCE}", file=sys.stderr)
        return 1
    if not TARGET.exists():
        print(f"ERROR: target not found: {TARGET}", file=sys.stderr)
        return 1

    converter = load_converter()
    markdown = converter.build_combined_markdown(SOURCE, [])

    PREVIEW.parent.mkdir(parents=True, exist_ok=True)
    PREVIEW.write_text(converter.render_document(markdown, SOURCE, []), encoding="utf-8")

    title, body_markdown = converter.extract_title_and_body(markdown, SOURCE.stem)
    headings: list[tuple[int, str, str]] = []
    body_html = converter.markdown_to_html(
        body_markdown,
        headings,
        slug_prefix="mypage-design-",
    )
    block = render_embed_block(converter, title, body_html)

    target_html = TARGET.read_text(encoding="utf-8")
    updated = insert_into_sheet_8(remove_existing_blocks(target_html), block)
    TARGET.write_text(updated, encoding="utf-8")

    print(f"created: {PREVIEW}")
    print(f"updated: {TARGET}")
    return 0


def load_converter():
    spec = importlib.util.spec_from_file_location("convert_function_spec_html", CONVERTER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load converter: {CONVERTER_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def render_embed_block(converter, title: str, body_html: str) -> str:
    source_label = html.escape(str(SOURCE), quote=False)
    title_html = converter.render_inline(title)
    indented_body = indent(body_html, 8)
    return f"""{BEGIN}
        <section class="mypage-design-embed" id="mypage-design-front-mypage-index" data-source="{html.escape(str(SOURCE), quote=True)}">
{indent(EMBED_CSS, 10)}
          <header class="mypage-design-header">
            <p class="mypage-design-source">Source:<br>{source_label}</p>
            <h3>マイページ設計書</h3>
            <h4>{title_html}</h4>
          </header>
          <div class="mypage-design-body">
{indented_body}
          </div>
        </section>
{END}"""


def remove_existing_blocks(document: str) -> str:
    pattern = re.compile(
        r"\n?\s*" + re.escape(BEGIN) + r".*?" + re.escape(END) + r"\n?",
        flags=re.DOTALL,
    )
    return pattern.sub("\n", document)


def insert_into_sheet_8(document: str, block: str) -> str:
    sheet_match = SHEET_RE.search(document)
    if sheet_match is None:
        raise RuntimeError("sheet-8 panel not found")

    next_match = NEXT_SHEET_RE.search(document, sheet_match.end())
    if next_match is None:
        raise RuntimeError("next sheet panel after sheet-8 not found")

    sheet_body = document[sheet_match.end() : next_match.start()]
    close_index = sheet_body.rfind("</section>")
    if close_index == -1:
        raise RuntimeError("sheet-8 closing section not found")

    insert_at = sheet_match.end() + close_index
    return document[:insert_at] + block + "\n      " + document[insert_at:]


def indent(text: str, spaces: int) -> str:
    prefix = " " * spaces
    return "\n".join(prefix + line if line else line for line in text.splitlines())


if __name__ == "__main__":
    raise SystemExit(main())
