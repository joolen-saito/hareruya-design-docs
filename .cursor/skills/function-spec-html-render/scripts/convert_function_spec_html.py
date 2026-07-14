#!/usr/bin/env python3
"""Convert function-spec Markdown into a read-only HTML preview.

The converter intentionally preserves source content. It only changes
presentation, including rendering embedded or attached screen-item definitions
as tables.
"""

from __future__ import annotations

import argparse
import csv
import html
import io
import re
import sys
from pathlib import Path
from typing import Iterable

sys.path.insert(0, str(Path(__file__).resolve().parent))
import phase2_specs  # noqa: E402  フェーズ2対応（フェーズ1では実装しない）仕様のバナー
import superseded_specs  # noqa: E402  Excel基本設計により廃止された仕様のバナー


CODE_TOKEN = "\x00CODE{}\x00"
LINK_RE = re.compile(r"\[([^\]]*)\]\(([^)]+)\)")
CODE_SPAN_RE = re.compile(r"`([^`]+)`")
TABLE_SEP_RE = re.compile(r"^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$")
HEADING_RE = re.compile(r"^(#{1,6})\s+(.*?)\s*#*\s*$")
ORDERED_RE = re.compile(r"^(\s*)(\d+)\.\s+(.*)$")
UNORDERED_RE = re.compile(r"^(\s*)[-*+]\s+(.*)$")
HR_RE = re.compile(r"^\s*(?:-{3,}|\*{3,}|_{3,})\s*$")
# Block-level raw HTML used in the Markdown source for collapsible sections
# (e.g. the "Excel設計書からの抽出" block). Such lines are passed through
# verbatim so the browser renders a real <details> instead of escaped text.
RAW_HTML_BLOCK_RE = re.compile(
    r"^\s*(</?details>|<summary\b[^>]*>.*?</summary>)\s*$", re.IGNORECASE
)
SCREEN_ITEM_HEADER_TERMS = (
    "識別ID",
    "ラベル",
    "書式・制限",
    "必須",
    "初期値",
    "画面部品の説明",
)


CSS = """
:root {
  --bg: #ffffff;
  --panel: #fffdf8;
  --text: #2b2a26;
  --muted: #7a756a;
  --line: #d6cdbd;
  --line-soft: #ebe2d3;
  --band: #f3ede1;
  --clay: #c25a37;
  --clay-soft: #f4e6dd;
  --olive: #5f7048;
  --olive-soft: #e9ecdf;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Yu Gothic", Meiryo, sans-serif;
  font-size: 14px;
  line-height: 1.7;
}
.page {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  gap: 32px;
  max-width: 1480px;
  margin: 0 auto;
  padding: 28px 28px 64px;
}
.sidebar {
  position: sticky;
  top: 24px;
  align-self: start;
  max-height: calc(100vh - 48px);
  overflow-y: auto;
  padding-right: 12px;
  border-right: 1px solid var(--line-soft);
}
.sidebar-title {
  margin: 0 0 10px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: .06em;
  text-transform: uppercase;
}
.toc a {
  display: block;
  padding: 4px 0 4px 12px;
  border-left: 2px solid var(--line-soft);
  color: var(--muted);
  text-decoration: none;
}
.toc a:hover { color: var(--clay); border-left-color: var(--clay); }
.toc .lv3 { padding-left: 24px; font-size: 13px; }
.doc-content { min-width: 0; }
header.page-header {
  margin-bottom: 24px;
  padding-bottom: 18px;
  border-bottom: 1px solid var(--line);
}
.crumb {
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 13px;
}
h1 { margin: 0; font-size: 28px; line-height: 1.3; }
h2 {
  margin: 34px 0 12px;
  padding-bottom: 7px;
  border-bottom: 2px solid var(--clay);
  font-size: 21px;
}
h3 { margin: 26px 0 10px; font-size: 17px; color: var(--olive); }
h4 { margin: 20px 0 8px; font-size: 15px; color: var(--muted); }
p { margin: 9px 0; }
a { color: var(--clay); }
code {
  padding: 1px 5px;
  border-radius: 5px;
  background: var(--band);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 90%;
}
pre {
  overflow-x: auto;
  padding: 12px 14px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
}
pre code { padding: 0; background: transparent; }
hr { margin: 26px 0; border: 0; border-top: 1px solid var(--line); }
ul, ol { margin: 9px 0; padding-left: 26px; }
li { margin: 3px 0; }
.table-wrap {
  overflow-x: auto;
  margin: 14px 0 22px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--panel);
}
table {
  width: 100%;
  min-width: 760px;
  border-collapse: collapse;
  font-size: 13px;
}
th, td {
  border: 1px solid var(--line-soft);
  padding: 7px 9px;
  text-align: left;
  vertical-align: top;
}
th {
  position: sticky;
  top: 0;
  background: var(--band);
  font-weight: 700;
  white-space: nowrap;
}
tbody tr:nth-child(even) { background: #fffaf0; }
.screen-item-table table { min-width: 1120px; }
.section-row td {
  background: var(--olive-soft);
  color: var(--olive);
  font-weight: 700;
}
.tabbed-note {
  white-space: pre-wrap;
  overflow-x: auto;
  padding: 10px 12px;
  border-left: 3px solid var(--olive);
  background: var(--panel);
}
details {
  margin: 34px 0 12px;
}
details > summary {
  cursor: pointer;
  padding-bottom: 7px;
  border-bottom: 2px solid var(--clay);
  font-size: 21px;
  font-weight: 700;
  list-style: revert;
}
details[open] > summary { margin-bottom: 12px; }
footer {
  margin-top: 48px;
  padding-top: 16px;
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 12px;
}
@media (max-width: 900px) {
  .page { display: block; padding: 20px 16px 48px; }
  .sidebar {
    position: static;
    max-height: none;
    margin-bottom: 24px;
    padding-right: 0;
    border-right: 0;
    border-bottom: 1px solid var(--line-soft);
    padding-bottom: 16px;
  }
  h1 { font-size: 23px; }
}
""".strip()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument(
        "--screen-source",
        action="append",
        default=[],
        type=Path,
        help=(
            "Optional screen-item definition Markdown to integrate into the "
            "same HTML. Repeat to attach multiple files."
        ),
    )
    args = parser.parse_args()

    source = args.source.resolve()
    output = args.output.resolve()
    if not validate_markdown_path(source, "source"):
        return 1

    screen_sources = [path.resolve() for path in args.screen_source]
    for screen_source in screen_sources:
        if not validate_markdown_path(screen_source, "screen-source"):
            return 1

    markdown = build_combined_markdown(source, screen_sources)
    document = render_document(markdown, source, screen_sources)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(document, encoding="utf-8")
    print(f"created: {output}")
    return 0


def validate_markdown_path(path: Path, label: str) -> bool:
    if not path.exists():
        print(f"ERROR: {label} not found: {path}", file=sys.stderr)
        return False
    if path.suffix.lower() != ".md":
        print(f"ERROR: {label} must be Markdown: {path}", file=sys.stderr)
        return False
    return True


def build_combined_markdown(source: Path, screen_sources: list[Path]) -> str:
    markdown = source.read_text(encoding="utf-8")
    if not screen_sources:
        return markdown

    additions = []
    for screen_source in screen_sources:
        screen_text = screen_source.read_text(encoding="utf-8")
        screen_title, screen_body = split_markdown_title(screen_text, screen_source.stem)
        additions.append(
            "\n".join(
                [
                    "---",
                    "",
                    f"## 画面項目定義: {screen_title}",
                    "",
                    f"_Source: `{screen_source}`_",
                    "",
                    screen_body.strip(),
                ]
            )
        )
    return markdown.rstrip() + "\n\n" + "\n\n".join(additions) + "\n"


def split_markdown_title(markdown: str, fallback: str) -> tuple[str, str]:
    lines = markdown.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    title = fallback
    for index, line in enumerate(lines):
        if not line.strip():
            continue
        match = re.match(r"^#\s+(.*?)\s*#*\s*$", line)
        if match:
            title = match.group(1).strip()
            del lines[index]
        break
    return title, "\n".join(lines)


def extract_title_and_body(markdown: str, fallback: str) -> tuple[str, str]:
    body_lines = markdown.replace("\r\n", "\n").replace("\r", "\n").split("\n")
    title = fallback
    for index, line in enumerate(body_lines):
        if not line.strip():
            continue
        match = re.match(r"^#\s+(.*?)\s*#*\s*$", line)
        if match:
            title = match.group(1).strip()
            del body_lines[index]
        break
    return title, "\n".join(body_lines)


def render_document(markdown: str, source: Path, screen_sources: list[Path] | None = None) -> str:
    screen_sources = screen_sources or []
    title, body_markdown = extract_title_and_body(markdown, source.stem)

    headings: list[tuple[int, str, str]] = []
    body_html = markdown_to_html(body_markdown, headings)
    toc = render_toc(headings)
    source_paths = [source] + screen_sources
    source_label = "<br>".join(html.escape(str(path), quote=False) for path in source_paths)
    title_html = render_inline(title)
    html_title = html.escape(f"{title} - 機能仕様書", quote=False)
    superseded = render_superseded_notice(source)

    return f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{html_title}</title>
  <style>
{CSS}
    {superseded_specs.SUPERSEDED_CSS}
    {phase2_specs.PHASE2_CSS}
  </style>
</head>
<body>
  <div class="page">
    <aside class="sidebar">
      <p class="sidebar-title">On this page</p>
      {toc}
    </aside>
    <main class="doc-content">
      <header class="page-header">
        <p class="crumb">Source:<br>{source_label}</p>
        <h1>{title_html}</h1>
      </header>
      {superseded}
      {body_html}
      <footer>このページは機能仕様書Markdownから自動生成されています。編集は元のMarkdownに対して行ってください。</footer>
    </main>
  </div>
</body>
</html>
"""


def render_superseded_notice(source: Path, href_prefix: str = superseded_specs.HREF_FROM_PREVIEW) -> str:
    """実装不要であることを示すバナー（フェーズ2対応、およびExcel基本設計による廃止）。

    既定の href_prefix は単体プレビュー（`function_spec_html_preview/<repo>/x.html`）用。
    excel_to_html/output へ直接書き出す文書（orphan group）は空文字を渡す。
    台帳外の md では空文字を返すので、呼び出し側で分岐する必要はない。
    """
    try:
        key = superseded_specs.doc_key(source)
    except ValueError:
        return ""  # リポジトリ外の md（テスト等）は対象外
    return "\n      ".join(
        n for n in (
            phase2_specs.render_notice(key, href_prefix),
            superseded_specs.render_notice(key, href_prefix),
        ) if n
    )


def render_toc(headings: Iterable[tuple[int, str, str]]) -> str:
    links = []
    for level, text, slug in headings:
        cls = f"lv{level}"
        links.append(
            f'<a class="{cls}" href="#{html.escape(slug, quote=True)}">'
            f"{html.escape(text, quote=False)}</a>"
        )
    return '<nav class="toc">' + "\n".join(links) + "</nav>" if links else ""


def markdown_to_html(
    md_text: str, headings: list[tuple[int, str, str]], slug_prefix: str = ""
) -> str:
    lines = md_text.split("\n")
    out: list[str] = []
    used_slugs: set[str] = set()
    i = 0
    while i < len(lines):
        line = lines[i]

        if re.match(r"^\s*```", line):
            block, i = parse_code_block(lines, i)
            out.append(block)
            continue

        if line.strip() == "":
            i += 1
            continue

        if is_screen_item_header(lines, i):
            block, i = parse_screen_item_table(lines, i)
            out.append(block)
            continue

        if HR_RE.match(line) and not line.strip().startswith("|"):
            out.append("<hr>")
            i += 1
            continue

        match = HEADING_RE.match(line)
        if match:
            level = len(match.group(1))
            raw_text = match.group(2).strip()
            slug = slugify(raw_text, used_slugs)
            if slug_prefix:
                slug = f"{slug_prefix}{slug}"
            if 2 <= level <= 3:
                headings.append((level, raw_text, slug))
            out.append(f'<h{level} id="{html.escape(slug, quote=True)}">{render_inline(raw_text)}</h{level}>')
            i += 1
            continue

        if "|" in line and i + 1 < len(lines) and TABLE_SEP_RE.match(lines[i + 1]):
            block, i = parse_markdown_table(lines, i)
            out.append(block)
            continue

        if UNORDERED_RE.match(line) or ORDERED_RE.match(line):
            block, i = parse_list(lines, i)
            out.append(block)
            continue

        if "\t" in line and not is_screen_item_header(lines, i):
            block, i = parse_tabbed_note(lines, i)
            out.append(block)
            continue

        if RAW_HTML_BLOCK_RE.match(line):
            out.append(line.strip())
            i += 1
            continue

        paragraph = [line]
        i += 1
        while i < len(lines):
            nxt = lines[i]
            if is_special_start(lines, i):
                break
            paragraph.append(nxt)
            i += 1
        text = " ".join(part.strip() for part in paragraph)
        out.append(f"<p>{render_inline(text)}</p>")

    return "\n".join(out)


def is_special_start(lines: list[str], i: int) -> bool:
    line = lines[i]
    if line.strip() == "":
        return True
    if re.match(r"^\s*```", line) or HEADING_RE.match(line):
        return True
    if is_screen_item_header(lines, i):
        return True
    if UNORDERED_RE.match(line) or ORDERED_RE.match(line):
        return True
    if HR_RE.match(line) and not line.strip().startswith("|"):
        return True
    if RAW_HTML_BLOCK_RE.match(line):
        return True
    return "|" in line and i + 1 < len(lines) and TABLE_SEP_RE.match(lines[i + 1])


def parse_code_block(lines: list[str], i: int) -> tuple[str, int]:
    lang = lines[i].strip()[3:].strip().lower()
    i += 1
    buf = []
    while i < len(lines) and not re.match(r"^\s*```\s*$", lines[i]):
        buf.append(lines[i])
        i += 1
    if i < len(lines):
        i += 1
    if lang in {"csv", "tsv"}:
        delimiter = "\t" if lang == "tsv" else ","
        return render_delimited_table("\n".join(buf), delimiter), i
    code = html.escape("\n".join(buf), quote=False)
    lang_attr = f' class="language-{html.escape(lang, quote=True)}"' if lang else ""
    return f"<pre><code{lang_attr}>{code}</code></pre>", i


def parse_markdown_table(lines: list[str], i: int) -> tuple[str, int]:
    header = split_md_row(lines[i])
    i += 2
    rows = []
    while i < len(lines) and "|" in lines[i] and lines[i].strip():
        rows.append(split_md_row(lines[i]))
        i += 1
    return render_table(header, rows), i


def parse_list(lines: list[str], i: int) -> tuple[str, int]:
    ordered = bool(ORDERED_RE.match(lines[i]))
    tag = "ol" if ordered else "ul"
    items = []
    while i < len(lines):
        match = ORDERED_RE.match(lines[i]) if ordered else UNORDERED_RE.match(lines[i])
        if not match:
            break
        content = match.group(3) if ordered else match.group(2)
        items.append(f"<li>{render_inline(content)}</li>")
        i += 1
    return f"<{tag}>{''.join(items)}</{tag}>", i


def parse_tabbed_note(lines: list[str], i: int) -> tuple[str, int]:
    buf = []
    while i < len(lines) and lines[i].strip() and "\t" in lines[i] and not is_screen_item_header(lines, i):
        buf.append(lines[i].rstrip())
        i += 1
    text = html.escape("\n".join(buf), quote=False)
    return f'<pre class="tabbed-note">{text}</pre>', i


def parse_screen_item_table(lines: list[str], i: int) -> tuple[str, int]:
    start = i
    buf = []
    quote_open = False
    while i < len(lines):
        current = lines[i]
        if i > start and not quote_open and "\t" not in current:
            break
        buf.append(current)
        quote_open = quote_open ^ has_odd_unescaped_quotes(current)
        i += 1

    rows = list(csv.reader(io.StringIO("\n".join(buf)), delimiter="\t"))
    rows = [[cell.strip() for cell in row] for row in rows]
    if not rows:
        return "", i

    header_indices = [idx for idx, value in enumerate(rows[0]) if value.strip()]
    header = [rows[0][idx].strip() for idx in header_indices]
    table_rows = []
    for raw_row in rows[1:]:
        values = [raw_row[idx].strip() if idx < len(raw_row) else "" for idx in header_indices]
        if not any(values):
            continue
        table_rows.append(values)
    return render_table(header, table_rows, class_name="screen-item-table"), i


def render_table(header: list[str], rows: list[list[str]], class_name: str = "") -> str:
    class_attr = f" {class_name}" if class_name else ""
    thead = "".join(f"<th>{render_cell(cell)}</th>" for cell in header)
    body_rows = []
    for row in rows:
        normalized = row[: len(header)] + [""] * max(0, len(header) - len(row))
        non_empty = [cell for cell in normalized if cell.strip()]
        if len(non_empty) == 1 and not looks_like_item_id(non_empty[0]):
            body_rows.append(
                f'<tr class="section-row"><td colspan="{len(header)}">{render_cell(non_empty[0])}</td></tr>'
            )
            continue
        cells = "".join(f"<td>{render_cell(cell)}</td>" for cell in normalized)
        body_rows.append(f"<tr>{cells}</tr>")
    return (
        f'<div class="table-wrap{class_attr}"><table><thead><tr>{thead}</tr></thead>'
        f"<tbody>{''.join(body_rows)}</tbody></table></div>"
    )


def render_delimited_table(text: str, delimiter: str) -> str:
    rows = list(csv.reader(io.StringIO(text), delimiter=delimiter))
    rows = [[cell.strip() for cell in row] for row in rows if any(cell.strip() for cell in row)]
    if not rows:
        return "<pre><code></code></pre>"
    header = rows[0]
    body = rows[1:]
    header_text = " ".join(header)
    class_name = "screen-item-table" if "識別ID" in header_text or "No." in header_text or "No" in header_text else ""
    return render_table(header, body, class_name=class_name)


def render_cell(text: str) -> str:
    # 表セルもインライン Markdown（コードスパン・リンク）を本文と同様にレンダリングする。
    # render_inline が html.escape を内包するため、ここでは改行のみ <br> に変換する。
    return render_inline(text).replace("\n", "<br>")


def split_md_row(line: str) -> list[str]:
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    return [cell.strip() for cell in line.split("|")]


def is_screen_item_header(lines: list[str], i: int) -> bool:
    line = lines[i]
    if "\t" not in line:
        return False
    candidate = line
    if i + 1 < len(lines):
        candidate += "\n" + lines[i + 1]
    return all(term in candidate for term in SCREEN_ITEM_HEADER_TERMS)


def has_odd_unescaped_quotes(line: str) -> bool:
    count = 0
    i = 0
    while i < len(line):
        if line[i] == '"':
            if i + 1 < len(line) and line[i + 1] == '"':
                i += 2
                continue
            count += 1
        i += 1
    return bool(count % 2)


def looks_like_item_id(value: str) -> bool:
    return bool(re.match(r"^\d+(?:-\d+)*$", value.strip()))


def render_inline(text: str) -> str:
    codes: list[str] = []

    def stash(match: re.Match[str]) -> str:
        codes.append(match.group(1))
        return CODE_TOKEN.format(len(codes) - 1)

    text = CODE_SPAN_RE.sub(stash, text)
    text = html.escape(text, quote=False)

    def link(match: re.Match[str]) -> str:
        label = match.group(1)
        href = match.group(2).strip()
        if href.lower().endswith(".md"):
            href = Path(href).with_suffix(".html").name
        return f'<a href="{html.escape(href, quote=True)}">{label}</a>'

    text = LINK_RE.sub(link, text)

    def restore(match: re.Match[str]) -> str:
        return f"<code>{html.escape(codes[int(match.group(1))], quote=False)}</code>"

    return re.sub(r"\x00CODE(\d+)\x00", restore, text)


def slugify(text: str, used: set[str]) -> str:
    base = re.sub(r"[^0-9A-Za-z぀-ヿ一-鿿]+", "-", text).strip("-") or "sec"
    slug = base
    counter = 2
    while slug in used:
        slug = f"{base}-{counter}"
        counter += 1
    used.add(slug)
    return slug


if __name__ == "__main__":
    raise SystemExit(main())
