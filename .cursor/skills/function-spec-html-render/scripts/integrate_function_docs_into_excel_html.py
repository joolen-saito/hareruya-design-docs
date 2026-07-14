#!/usr/bin/env python3
"""Embed function Markdown documents into matching Excel-derived HTML sheets."""

from __future__ import annotations

import difflib
import html
import importlib.util
import os
import re
import sys
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import phase2_specs  # noqa: E402  フェーズ2対応（フェーズ1では実装しない）仕様のバナー
import superseded_specs  # noqa: E402  Excel基本設計により廃止された仕様のバナー

ROOT = Path(__file__).resolve().parents[4]
TODO = ROOT / "functions" / "todo-list.md"
EXCEL_OUTPUT = ROOT / "excel_to_html" / "output"
PREVIEW_ROOT = ROOT / "function_spec_html_preview"
CONVERTER_PATH = Path(__file__).with_name("convert_function_spec_html.py")
REPORT = ROOT / "functions" / "function-doc-excel-integration-report.md"

CSS_BEGIN = "/* function-design-embed:start */"
CSS_END = "/* function-design-embed:end */"
BLOCK_BEGIN_PREFIX = "<!-- function-design-embed:start"
BLOCK_END_PREFIX = "<!-- function-design-embed:end"
OLD_MYPAGE_BEGIN = "<!-- mypage-design-embed:start -->"
OLD_MYPAGE_END = "<!-- mypage-design-embed:end -->"

SECTION_RE = re.compile(r'<section class="sheet-panel(?: is-active)?" id="(?P<id>[^"]+)">')
NEXT_SECTION_RE = re.compile(r'\n\s*<section class="sheet-panel(?: is-active)?" id="[^"]+">')
FEATURE_NO_RE = re.compile(r"<dt>機能No</dt><dd>(?P<value>.*?)</dd>", re.DOTALL)
FEATURE_NAME_RE = re.compile(r"<dt>機能名</dt><dd>(?P<value>.*?)</dd>", re.DOTALL)
SHEET_HEADING_RE = re.compile(r'<div class="sheet-heading">\s*<h2>(?P<value>.*?)</h2>', re.DOTALL)
MD_LINK_RE = re.compile(r"\[md\]\(([^)]+)\)")

EMBED_CSS = f"""
    {CSS_BEGIN}
    .function-design-embed {{
      margin-top: 36px;
      padding-top: 24px;
      border-top: 2px solid var(--clay);
    }}

    .function-design-header {{
      margin-bottom: 18px;
    }}

    .function-design-header h3 {{
      margin: 0 0 6px;
      color: var(--text);
      font-size: 20px;
    }}

    .function-design-header h4 {{
      margin: 0;
      color: var(--olive);
      font-size: 16px;
    }}

    .function-design-source {{
      margin: 0 0 8px;
      color: var(--muted);
      font-size: 12px;
      overflow-wrap: anywhere;
    }}

    .function-design-note {{
      margin: 6px 0 0;
      padding: 6px 10px;
      border-left: 3px solid #f0ad4e;
      background: rgba(240, 173, 78, 0.10);
      color: var(--muted);
      font-size: 12px;
      border-radius: 3px;
    }}

    .function-design-body h1,
    .function-design-body h2 {{
      margin: 28px 0 12px;
      padding-bottom: 7px;
      border-bottom: 1px solid var(--line);
      font-size: 18px;
    }}

    .function-design-body h3 {{
      margin: 22px 0 10px;
      color: var(--olive);
      font-size: 16px;
    }}

    .function-design-body h4 {{
      margin: 18px 0 8px;
      color: var(--muted);
      font-size: 14px;
    }}

    .function-design-body p {{
      margin: 9px 0;
    }}

    .function-design-body ul,
    .function-design-body ol {{
      margin: 9px 0;
      padding-left: 26px;
    }}

    .function-design-body li {{
      margin: 3px 0;
    }}

    .function-design-body code {{
      padding: 1px 5px;
      border-radius: 5px;
      background: var(--band);
      font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
      font-size: 90%;
    }}

    .function-design-body pre {{
      overflow-x: auto;
      padding: 12px 14px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      white-space: pre-wrap;
    }}

    .function-design-body pre code {{
      padding: 0;
      background: transparent;
    }}

    .function-design-body .table-wrap {{
      overflow-x: auto;
      margin: 14px 0 22px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
    }}

    .function-design-body table {{
      width: 100%;
      min-width: 760px;
      border-collapse: collapse;
      font-size: 13px;
    }}

    .function-design-body th,
    .function-design-body td {{
      border: 1px solid var(--line-soft);
      padding: 7px 9px;
      text-align: left;
      vertical-align: top;
    }}

    .function-design-body th {{
      background: var(--band);
      font-weight: 700;
      white-space: nowrap;
    }}

    .function-design-body tbody tr:nth-child(even) {{
      background: #fffaf0;
    }}

    {superseded_specs.SUPERSEDED_CSS}

    {phase2_specs.PHASE2_CSS}
    {CSS_END}
""".strip("\n")


@dataclass(frozen=True)
class TodoRow:
    line_no: int
    division: str
    category: str
    feature_name: str
    feature_no: str
    source: Path


@dataclass(frozen=True)
class SheetRef:
    html_path: Path
    section_id: str
    start: int
    end: int
    feature_no: str
    feature_name: str
    heading: str


def main() -> int:
    converter = load_converter()
    rows = parse_todo_rows()
    sheet_index, sheets = build_sheet_index()

    assignments, missing = assign_sheets(rows, sheets)
    parent_assignments, unplaceable = assign_parent_sheets(missing, sheets)

    matched: list[tuple[TodoRow, SheetRef, str]] = []
    for row, sheet in assignments:
        key = block_key(row)
        matched.append((row, sheet, render_block(converter, row, key)))
    for row, sheet in parent_assignments:
        key = block_key(row)
        note = (
            f"※ この機能には専用の画面シートが無いため、親機能シート「{sheet.heading}」の末尾に"
            f"統合した詳細設計書です。"
        )
        matched.append((row, sheet, render_block(converter, row, key, note=note)))

    grouped: dict[Path, list[tuple[TodoRow, SheetRef, str]]] = defaultdict(list)
    for item in matched:
        grouped[item[1].html_path].append(item)

    for html_path, items in sorted(grouped.items()):
        integrate_html(html_path, items)

    write_report(matched, unplaceable, parent_assignments)
    print(f"embedded: {len(matched)} (direct {len(assignments)}, parent-appended {len(parent_assignments)})")
    print(f"unplaceable (no prefix sheet in any HTML): {len(unplaceable)}")
    print(f"updated html files: {len(grouped)}")
    print(f"report: {REPORT}")
    return 0 if matched else 1


def load_converter():
    spec = importlib.util.spec_from_file_location("convert_function_spec_html", CONVERTER_PATH)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Cannot load converter: {CONVERTER_PATH}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def parse_todo_rows() -> list[TodoRow]:
    rows: list[TodoRow] = []
    for line_no, line in enumerate(TODO.read_text(encoding="utf-8").splitlines(), 1):
        if not line.startswith("|") or line.startswith("| ---") or line.startswith("| TODO"):
            continue
        cols = [col.strip() for col in line.strip("|").split("|")]
        if len(cols) < 8:
            continue
        feature_no = cols[4].strip()
        if not feature_no:
            continue
        link = MD_LINK_RE.search(cols[7])
        if link is None:
            continue
        source = (TODO.parent / link.group(1)).resolve()
        if not source.exists():
            continue
        rows.append(
            TodoRow(
                line_no=line_no,
                division=cols[1],
                category=cols[2],
                feature_name=cols[3],
                feature_no=feature_no,
                source=source,
            )
        )
    return rows


def build_sheet_index() -> tuple[dict[str, list[SheetRef]], list[SheetRef]]:
    index: dict[str, list[SheetRef]] = defaultdict(list)
    sheets: list[SheetRef] = []
    for html_path in sorted(EXCEL_OUTPUT.glob("*.html")):
        if html_path.name == "index.html":
            continue
        document = strip_existing_embeds(html_path.read_text(encoding="utf-8"))
        starts = list(SECTION_RE.finditer(document))
        for pos, match in enumerate(starts):
            end = starts[pos + 1].start() if pos + 1 < len(starts) else len(document)
            section = document[match.start() : end]
            feature_no = extract_kv(FEATURE_NO_RE, section)
            if not feature_no:
                continue
            feature_name = extract_kv(FEATURE_NAME_RE, section)
            sheet = SheetRef(
                html_path=html_path,
                section_id=match.group("id"),
                start=match.start(),
                end=end,
                feature_no=feature_no,
                feature_name=feature_name,
                heading=extract_kv(SHEET_HEADING_RE, section),
            )
            index[normalize_feature_no(feature_no)].append(sheet)
            sheets.append(sheet)
    return index, sheets


def extract_kv(pattern: re.Pattern[str], section: str) -> str:
    match = pattern.search(section)
    if match is None:
        return ""
    value = re.sub(r"<.*?>", "", match.group("value"))
    return html.unescape(value).strip()


def resolve_sheet(row: TodoRow, sheet_index: dict[str, list[SheetRef]], sheets: list[SheetRef]) -> SheetRef | None:
    candidates = sheet_index.get(normalize_feature_no(row.feature_no), [])
    if not candidates:
        row_name = normalize_text(row.feature_name)
        row_prefix = feature_prefix(row.feature_no)
        name_matches = [
            sheet
            for sheet in sheets
            if row_prefix == feature_prefix(sheet.feature_no)
            and text_matches(row_name, normalize_text(sheet.feature_name), normalize_text(sheet.heading))
        ]
        if name_matches:
            return sorted(name_matches, key=lambda sheet: (sheet.html_path.name, sheet.section_id))[0]
        return None
    if len(candidates) == 1:
        return candidates[0]

    row_name = normalize_text(row.feature_name)
    exact = [candidate for candidate in candidates if normalize_text(candidate.feature_name) == row_name]
    if exact:
        return exact[0]
    contains = [
        candidate
        for candidate in candidates
        if text_matches(row_name, normalize_text(candidate.feature_name), normalize_text(candidate.heading))
    ]
    if contains:
        return contains[0]
    return candidates[0]


NAME_MATCH_THRESHOLD = 0.55


def _name_score(row_name: str, sheet: SheetRef) -> float:
    """Similarity of a todo row name against a sheet's name/heading.

    Returns 1.0 for substring containment (either direction), otherwise the
    best difflib ratio across the sheet's feature_name and heading. Inputs are
    already normalized (spacing/decoration stripped) so wording variants such
    as 「割引率一覧表示」 と 「販売割引率一覧」 line up.
    """
    best = 0.0
    for target in (normalize_text(sheet.feature_name), normalize_text(sheet.heading)):
        if not target or not row_name:
            continue
        if row_name in target or target in row_name:
            return 1.0
        best = max(best, difflib.SequenceMatcher(None, row_name, target).ratio())
    return best


def assign_sheets(
    rows: list[TodoRow], sheets: list[SheetRef]
) -> tuple[list[tuple[TodoRow, SheetRef]], list[TodoRow]]:
    """Match todo rows to sheets with fuzzy, collision-aware claiming.

    Priority: (A) exact 機能No + exact/substring name, (B) same 機能No with the
    best available name, (C) fuzzy name within the same 機能No prefix. Each sheet
    is claimed at most once, so 機能名 の表記ゆれ や 機能No の誤記 が別機能のシート
    を奪わない。閾値未満の行は未マッチとして残す（親シート追記は呼び出し側で扱う）。
    """
    by_no: dict[str, list[SheetRef]] = defaultdict(list)
    by_prefix: dict[str, list[SheetRef]] = defaultdict(list)
    for sheet in sheets:
        by_no[normalize_feature_no(sheet.feature_no)].append(sheet)
        by_prefix[feature_prefix(sheet.feature_no)].append(sheet)

    claimed: set[SheetRef] = set()
    assigned: dict[int, SheetRef] = {}

    def best_unclaimed(candidates: list[SheetRef], row_name: str, require: float) -> SheetRef | None:
        best_sheet: SheetRef | None = None
        best = -1.0
        for sheet in candidates:
            if sheet in claimed:
                continue
            score = _name_score(row_name, sheet)
            if score > best:
                best, best_sheet = score, sheet
        return best_sheet if best_sheet is not None and best >= require else None

    indexed = list(enumerate(rows))

    # Phase A: exact 機能No + exact/substring name.
    for i, row in indexed:
        rn = normalize_text(row.feature_name)
        for sheet in by_no.get(normalize_feature_no(row.feature_no), []):
            if sheet in claimed:
                continue
            if normalize_text(sheet.feature_name) == rn or (rn and rn in normalize_text(sheet.heading)):
                assigned[i] = sheet
                claimed.add(sheet)
                break

    # Phase B: same 機能No, best available name (handles plain duplicates).
    for i, row in indexed:
        if i in assigned:
            continue
        sheet = best_unclaimed(by_no.get(normalize_feature_no(row.feature_no), []), normalize_text(row.feature_name), 0.0)
        if sheet is not None:
            assigned[i] = sheet
            claimed.add(sheet)

    # Phase C: fuzzy name within the same prefix (handles 機能No 誤記・表記ゆれ).
    for i, row in indexed:
        if i in assigned:
            continue
        sheet = best_unclaimed(by_prefix.get(feature_prefix(row.feature_no), []), normalize_text(row.feature_name), NAME_MATCH_THRESHOLD)
        if sheet is not None:
            assigned[i] = sheet
            claimed.add(sheet)

    matched = [(row, assigned[i]) for i, row in indexed if i in assigned]
    matched.extend(assign_duplicate_feature_no_sheets(rows, sheets, claimed))
    missing = [row for i, row in indexed if i not in assigned]
    return matched, missing


def assign_duplicate_feature_no_sheets(
    rows: list[TodoRow], sheets: list[SheetRef], claimed: set[SheetRef]
) -> list[tuple[TodoRow, SheetRef]]:
    """Append a feature document to additional sheets with the same 機能No.

    Some Excel specs split one TODO-level feature across multiple sheets, such as
    「一覧」 and 「登録・編集」. The reverse-design skill keeps the TODO row as the
    canonical feature unit unless a separate Markdown exists, so unclaimed sheets
    with the same 機能No should still receive the closest matching feature doc.
    """
    rows_by_no: dict[str, list[TodoRow]] = defaultdict(list)
    for row in rows:
        rows_by_no[normalize_feature_no(row.feature_no)].append(row)

    additional: list[tuple[TodoRow, SheetRef]] = []
    for sheet in sheets:
        if sheet in claimed:
            continue
        candidates = rows_by_no.get(normalize_feature_no(sheet.feature_no), [])
        if not candidates:
            continue
        best_row = max(candidates, key=lambda row: _name_score(normalize_text(row.feature_name), sheet))
        additional.append((best_row, sheet))
        claimed.add(sheet)
    return additional


# 機能No接頭辞では辿れない特別な親シート対応（Excel側の機能No表記が異なる等）。
# 値は対象HTMLファイル名に含まれる識別子。当該HTML内で機能名が最も近いシートへ追記する。
PARENT_OVERRIDES = {
    # MTGバイヤー（O01-*）。0601のシートは機能No=M06-01でO01接頭辞では辿れないため明示対応。
    "O01-01": "0601",
    "O01-02": "0601",
    "O01-03": "0601",
}


def assign_parent_sheets(
    missing_rows: list[TodoRow], sheets: list[SheetRef]
) -> tuple[list[tuple[TodoRow, SheetRef]], list[TodoRow]]:
    """Route still-unmatched rows to a parent (related screen) sheet.

    専用シートが無い機能（CSV出力の細分・一括処理・API・標準機能で対応シート未作成
    のものなど）を、同じ機能No接頭辞（＝同じ機能グループ／基本設計仕様書）のシートへ
    追記する。親シートは「機能名が最も近いシート」、閾値未満なら「その接頭辞で機能Noが
    最小のシート（グループの主画面）」とする。接頭辞のシートがどのHTMLにも無い行は配置
    不能として残す（対応する基本設計HTMLが存在しない M01 ログイン・M02 TOP など）。
    """
    by_prefix: dict[str, list[SheetRef]] = defaultdict(list)
    for sheet in sheets:
        by_prefix[feature_prefix(sheet.feature_no)].append(sheet)

    parent_matched: list[tuple[TodoRow, SheetRef]] = []
    unplaceable: list[TodoRow] = []
    for row in missing_rows:
        override = PARENT_OVERRIDES.get(normalize_feature_no(row.feature_no))
        if override:
            override_sheets = [sheet for sheet in sheets if override in sheet.html_path.name]
            if override_sheets:
                row_name = normalize_text(row.feature_name)
                parent_matched.append((row, max(override_sheets, key=lambda sheet: _name_score(row_name, sheet))))
                continue
        candidates = by_prefix.get(feature_prefix(row.feature_no), [])
        if not candidates:
            unplaceable.append(row)
            continue
        row_name = normalize_text(row.feature_name)
        best_sheet = max(candidates, key=lambda sheet: _name_score(row_name, sheet))
        if _name_score(row_name, best_sheet) < NAME_MATCH_THRESHOLD:
            best_sheet = sorted(
                candidates,
                key=lambda sheet: (normalize_feature_no(sheet.feature_no), sheet.html_path.name, sheet.section_id),
            )[0]
        parent_matched.append((row, best_sheet))
    return parent_matched, unplaceable


def render_block(converter, row: TodoRow, key: str, note: str | None = None) -> str:
    markdown = converter.build_combined_markdown(row.source, [])
    title, body_markdown = converter.extract_title_and_body(markdown, row.source.stem)
    headings: list[tuple[int, str, str]] = []
    body_html = converter.markdown_to_html(body_markdown, headings, slug_prefix=f"function-design-{key}-")

    preview = PREVIEW_ROOT / row.source.parent.name / row.source.with_suffix(".html").name
    preview.parent.mkdir(parents=True, exist_ok=True)
    preview.write_text(converter.render_document(markdown, row.source, []), encoding="utf-8")

    source_rel = row.source.relative_to(ROOT).as_posix()
    source_label = html.escape(source_rel, quote=False)
    title_html = converter.render_inline(title)
    body = indent(body_html, 10)
    note_html = (
        f'\n          <p class="function-design-note">{html.escape(note, quote=False)}</p>'
        if note
        else ""
    )
    # Excel基本設計により廃止された記述、およびフェーズ2対応の記述は、消さずに残したうえで
    # 「実装不要」であることを明示する。後段注入ではなく描画に含める
    #（strip_existing_embeds が毎回ブロックを作り直すため、注入では integrate のたびに消える）。
    notices = [
        phase2_specs.render_notice(source_rel, superseded_specs.HREF_FROM_EXCEL_OUTPUT),
        superseded_specs.render_notice(source_rel, superseded_specs.HREF_FROM_EXCEL_OUTPUT),
    ]
    superseded_html = "".join(f"\n        {n}" for n in notices if n)
    return f"""      {BLOCK_BEGIN_PREFIX} {key} -->
      <section class="function-design-embed" id="function-design-{html.escape(key, quote=True)}" data-source="{html.escape(source_rel, quote=True)}">
        <header class="function-design-header">
          <p class="function-design-source">Source:<br>{source_label}</p>
          <h3>詳細設計書</h3>
          <h4>{html.escape(row.feature_no, quote=False)} {html.escape(row.feature_name, quote=False)} / {title_html}</h4>{note_html}
        </header>{superseded_html}
        <div class="function-design-body">
{body}
        </div>
      </section>
      {BLOCK_END_PREFIX} {key} -->"""


def integrate_html(html_path: Path, items: list[tuple[TodoRow, SheetRef, str]]) -> None:
    document = html_path.read_text(encoding="utf-8")
    document = strip_existing_embeds(document)
    document = ensure_css(document)

    # Rebuild the sheet index after stripping existing blocks because offsets changed.
    current_refs = {
        (ref.section_id, normalize_feature_no(ref.feature_no)): ref
        for refs in build_sheet_index_for_document(html_path, document).values()
        for ref in refs
    }

    inserts: list[tuple[int, str]] = []
    for row, original_ref, block in items:
        ref = current_refs.get((original_ref.section_id, normalize_feature_no(original_ref.feature_no)))
        if ref is None:
            continue
        section = document[ref.start : ref.end]
        close = section.rfind("</section>")
        if close == -1:
            continue
        inserts.append((ref.start + close, block + "\n"))

    for offset, block in sorted(inserts, reverse=True):
        document = document[:offset] + block + document[offset:]
    html_path.write_text(document, encoding="utf-8")


def body_limit(document: str) -> int:
    """シートパネルが及ぶ範囲の終端。

    最後のパネルの終端を文書末尾にすると、範囲が「実装差分追補」節（`</main>` 直前の
    `<section class="endpoint-supplement">`）まで届く。挿入位置は範囲内の最後の
    `</section>` なので、最後のシートの詳細設計書が追補節の中へ埋め込まれてしまう。
    本文の終わり（追補節の開始、無ければ `</main>`）で必ず打ち切る。
    """
    limits = [
        i for i in (document.find("<!-- endpoint-supplement:start -->"), document.find("</main>"))
        if i != -1
    ]
    return min(limits) if limits else len(document)


def build_sheet_index_for_document(html_path: Path, document: str) -> dict[str, list[SheetRef]]:
    index: dict[str, list[SheetRef]] = defaultdict(list)
    starts = list(SECTION_RE.finditer(document))
    limit = body_limit(document)
    for pos, match in enumerate(starts):
        end = starts[pos + 1].start() if pos + 1 < len(starts) else max(limit, match.end())
        section = document[match.start() : end]
        feature_no = extract_kv(FEATURE_NO_RE, section)
        if not feature_no:
            continue
        feature_name = extract_kv(FEATURE_NAME_RE, section)
        index[normalize_feature_no(feature_no)].append(
            SheetRef(
                html_path=html_path,
                section_id=match.group("id"),
                start=match.start(),
                end=end,
                feature_no=feature_no,
                feature_name=feature_name,
                heading=extract_kv(SHEET_HEADING_RE, section),
            )
        )
    return index


def strip_existing_embeds(document: str) -> str:
    document = re.sub(
        r"\n?\s*" + re.escape(BLOCK_BEGIN_PREFIX) + r".*?" + re.escape(BLOCK_END_PREFIX) + r"[^\n]*\n?",
        "\n",
        document,
        flags=re.DOTALL,
    )
    document = re.sub(
        r"\n?\s*" + re.escape(OLD_MYPAGE_BEGIN) + r".*?" + re.escape(OLD_MYPAGE_END) + r"\n?",
        "\n",
        document,
        flags=re.DOTALL,
    )
    # CSSブロックは手前の改行・インデントごと落として改行1つに畳む。残骸を残すと
    # ensure_css が毎回入れ直すぶんだけ空行が増え、逆に消しすぎると直前の行に貼り付く。
    document = re.sub(
        r"\n?[ \t]*" + re.escape(CSS_BEGIN) + r".*?" + re.escape(CSS_END) + r"[ \t]*\n?",
        "\n",
        document,
        flags=re.DOTALL,
    )
    return document


def ensure_css(document: str) -> str:
    """埋め込み用CSSを `</style>` の直前へ置く。

    挿入位置と前後の空白を毎回同じ形に正規化する。strip との組み合わせで
    「実行のたびに位置がずれる／空行が増える」ことがないようにするため、
    直前の空白は落として組み直す。
    """
    style_end = document.find("</style>")
    if style_end == -1:
        return document
    return document[:style_end].rstrip() + "\n" + EMBED_CSS + "\n" + document[style_end:]


def write_report(
    matched: list[tuple[TodoRow, SheetRef, str]],
    missing: list[TodoRow],
    parent_assignments: list[tuple[TodoRow, SheetRef]] | None = None,
) -> None:
    parent_keys = {(row.feature_no, row.source) for row, _sheet in (parent_assignments or [])}
    lines = [
        "# Function Doc Excel Integration Report",
        "",
        "## Integrated",
        "",
    ]
    by_html: dict[Path, list[tuple[TodoRow, SheetRef, str]]] = defaultdict(list)
    for item in matched:
        by_html[item[1].html_path].append(item)
    for html_path, items in sorted(by_html.items()):
        lines.append(f"### `{html_path.relative_to(ROOT)}`")
        for row, ref, _block in sorted(items, key=lambda item: (item[0].feature_no, item[0].source.name)):
            tag = " [親シート追記]" if (row.feature_no, row.source) in parent_keys else ""
            lines.append(
                f"- {row.feature_no} {row.feature_name} -> `{ref.section_id}` "
                f"from `{row.source.relative_to(ROOT)}`{tag}"
            )
        lines.append("")

    lines.extend(["## Parent-Sheet Appended (専用シート無し → 親機能シート末尾へ統合)", ""])
    if parent_assignments:
        for row, sheet in sorted(parent_assignments, key=lambda item: (item[0].feature_no, item[1].html_path.name)):
            lines.append(
                f"- {row.feature_no} {row.feature_name} -> `{sheet.html_path.relative_to(ROOT)}` "
                f"シート「{sheet.heading}」(`{sheet.section_id}`) from `{row.source.relative_to(ROOT)}`"
            )
    else:
        lines.append("- None")
    lines.append("")

    lines.extend(["## Unplaceable (対応する接頭辞のシートがどのHTMLにも無い)", ""])
    if missing:
        for row in missing:
            lines.append(
                f"- line {row.line_no}: {row.feature_no} {row.division} / {row.category} / "
                f"{row.feature_name} from `{row.source.relative_to(ROOT)}`"
            )
    else:
        lines.append("- None")
    REPORT.write_text("\n".join(lines) + "\n", encoding="utf-8")


def block_key(row: TodoRow) -> str:
    return re.sub(r"[^0-9a-zA-Z_-]+", "-", f"{row.feature_no.lower()}-{row.source.stem}").strip("-")


def normalize_feature_no(value: str) -> str:
    return value.strip().upper()


def feature_prefix(value: str) -> str:
    match = re.match(r"([A-Z]\d{2})-", normalize_feature_no(value))
    return match.group(1) if match else ""


def normalize_text(value: str) -> str:
    value = re.sub(r"\s+", "", value).replace("～", "~").strip()
    return re.sub(r"[・/（）()［］\[\]　_-]", "", value)


def text_matches(row_name: str, *targets: str) -> bool:
    if not row_name:
        return False
    return any(row_name in target or target in row_name for target in targets if target)


def indent(text: str, spaces: int) -> str:
    prefix = " " * spaces
    return "\n".join(prefix + line if line else line for line in text.splitlines())


if __name__ == "__main__":
    raise SystemExit(main())
