#!/usr/bin/env python3
"""Convert Excel workbooks in an input folder to readable, self-contained HTML files."""

from __future__ import annotations

import argparse
import base64
import csv
import html
import math
import os
import posixpath
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from collections import Counter, defaultdict
from datetime import date, datetime, time
from pathlib import Path
from typing import Any
from urllib.parse import quote

try:
    from openpyxl import load_workbook
    from openpyxl.cell.cell import MergedCell
    from openpyxl.cell.rich_text import CellRichText, TextBlock
    from openpyxl.utils import column_index_from_string, get_column_letter
except ImportError as exc:
    raise SystemExit(
        "openpyxl is required. Run this tool with: uv run python convert.py"
    ) from exc


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_INPUT_DIR = BASE_DIR / "input"
DEFAULT_OUTPUT_DIR = BASE_DIR / "output"
SUPPORTED_SUFFIXES = {".xlsx", ".xlsm", ".xltx", ".xltm"}
IMAGE_MIME_TYPES = {
    "gif": "image/gif",
    "jpeg": "image/jpeg",
    "jpg": "image/jpeg",
    "png": "image/png",
    "svg": "image/svg+xml",
}
EMU_PER_PX = 9525  # 914400 EMU/inch / 96 px/inch

# Cell texts that act as list bullets/markers in the design sheets.
BULLET_MARKERS = {
    "・", "･", "●", "○", "◯", "◆", "■", "□", "▶", "▷", "‣", "•",
    "–", "—", "-", "※", "★", "☆", "*", "＊", "✓", "✔", "》", "≫",
}

# Labels that make up the document-control header on each screen sheet. These
# become a clean key/value card instead of a table.
META_LABELS = {
    "ドキュメント名", "プロジェクト名", "セクション", "作成者", "作成日",
    "更新者", "更新日", "機能No", "機能名", "概要",
}

# Heading keywords that mark a functional-spec section. When a flowing-text
# heading contains one of these, it is rendered as a prominent, anchored
# section so the function spec stands apart from the screen-item table.
SPEC_HEADINGS = (
    "機能について", "機能仕様", "機能概要", "機能説明",
    "処理概要", "処理仕様", "処理内容", "動作仕様",
)

# DrawingML namespaces for reading textbox/shape text that openpyxl ignores.
NS_XDR = "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"
NS_A = "http://schemas.openxmlformats.org/drawingml/2006/main"
NS_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS_PR = "http://schemas.openxmlformats.org/package/2006/relationships"
NS_S = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"


def spec_heading_match(text: str) -> bool:
    """True when a heading line names a functional-spec section."""
    stripped = text.strip()
    return any(keyword in stripped for keyword in SPEC_HEADINGS)


def slugify_id(text: str, fallback: str) -> str:
    """Build an HTML-id-safe anchor from heading text."""
    slug = re.sub(r"[^0-9A-Za-z぀-ヿ一-鿿]+", "-", text.strip()).strip("-")
    return slug or fallback


_UNSET = object()
_CELL_ADDR_RE = re.compile(r"([A-Z]+)(\d+)")


# --- OOXML direct-read strike/bold model (ported from excel_preprocess/ooxml.py).
#     styles.xml / sharedStrings.xml / inlineStr の rPr strike を直接読み、run 単位・
#     セル継承で取り消し線を堅牢に判定する。openpyxl の font.strike には依存しない。
#     ooxml.py の parse_rich_text は <strike> 不在時に explicit=False を返す契約不一致が
#     あるため、ここでは <strike> 要素の有無で None/True/False を区別する（None=セル継承）。


def _ooxml_bool_val(el: Any) -> bool:
    """Read an OOXML boolean element (`<b/>`, `<strike/>`) that is present.

    `val` 省略なら真、`val="0"`/`val="false"` なら偽。要素の存在だけで真とはしない。
    """
    val = el.get("val")
    if val is None:
        return True
    return val not in ("0", "false")


def _ooxml_explicit(el: Any) -> bool | None:
    """None when the element is absent (inherit), else its boolean value."""
    if el is None:
        return None
    return _ooxml_bool_val(el)


def _parse_ooxml_runs(container: Any) -> list[dict[str, Any]]:
    """Return run dicts for an <si>/<is> element with explicit strike/bold (None=inherit)."""
    runs: list[dict[str, Any]] = []
    r_elements = container.findall(f"{{{NS_S}}}r")
    if r_elements:
        for r in r_elements:
            t_el = r.find(f"{{{NS_S}}}t")
            text = t_el.text if (t_el is not None and t_el.text is not None) else ""
            rpr = r.find(f"{{{NS_S}}}rPr")
            e_strike: bool | None = None
            e_bold: bool | None = None
            if rpr is not None:
                e_strike = _ooxml_explicit(rpr.find(f"{{{NS_S}}}strike"))
                e_bold = _ooxml_explicit(rpr.find(f"{{{NS_S}}}b"))
            runs.append({"text": text, "e_strike": e_strike, "e_bold": e_bold})
        return runs
    t_el = container.find(f"{{{NS_S}}}t")
    text = t_el.text if (t_el is not None and t_el.text is not None) else ""
    runs.append({"text": text, "e_strike": None, "e_bold": None})
    return runs


def _parse_styles_font_flags(
    styles_xml: bytes,
) -> tuple[list[bool], list[bool], list[int]]:
    """Return (font_strike[], font_bold[], cellxf_font_id[]) from styles.xml."""
    root = ET.fromstring(styles_xml)
    font_strike: list[bool] = []
    font_bold: list[bool] = []
    fonts_el = root.find(f"{{{NS_S}}}fonts")
    if fonts_el is not None:
        for font in fonts_el.findall(f"{{{NS_S}}}font"):
            # font-level: absent element = no strike/bold (not inherited).
            font_strike.append(_ooxml_explicit(font.find(f"{{{NS_S}}}strike")) or False)
            font_bold.append(_ooxml_explicit(font.find(f"{{{NS_S}}}b")) or False)
    cellxf_font: list[int] = []
    cell_xfs_el = root.find(f"{{{NS_S}}}cellXfs")
    if cell_xfs_el is not None:
        for xf in cell_xfs_el.findall(f"{{{NS_S}}}xf"):
            try:
                cellxf_font.append(int(xf.get("fontId", 0)))
            except (TypeError, ValueError):
                cellxf_font.append(0)
    return font_strike, font_bold, cellxf_font


def _parse_sheet_cell_model(
    sheet_xml: bytes,
    shared: list[list[dict[str, Any]]],
    font_strike: list[bool],
    font_bold: list[bool],
    cellxf_font: list[int],
) -> dict[tuple[int, int], dict[str, Any]]:
    """Return {(row,col): {runs, is_string, cell_strike, cell_bold, formula}} for a sheet."""
    root = ET.fromstring(sheet_xml)
    out: dict[tuple[int, int], dict[str, Any]] = {}
    sheet_data = root.find(f"{{{NS_S}}}sheetData")
    if sheet_data is None:
        return out
    for row_el in sheet_data.findall(f"{{{NS_S}}}row"):
        for c in row_el.findall(f"{{{NS_S}}}c"):
            addr = c.get("r") or ""
            match = _CELL_ADDR_RE.match(addr)
            if not match:
                continue
            col = column_index_from_string(match.group(1))
            row = int(match.group(2))
            type_attr = c.get("t")
            style_idx = c.get("s")
            font_id = 0
            if style_idx is not None:
                try:
                    idx = int(style_idx)
                    font_id = cellxf_font[idx] if idx < len(cellxf_font) else 0
                except (TypeError, ValueError):
                    font_id = 0
            cell_strike = font_strike[font_id] if font_id < len(font_strike) else False
            cell_bold = font_bold[font_id] if font_id < len(font_bold) else False

            raw_runs: list[dict[str, Any]] | None = None
            is_string = False
            if type_attr == "s":
                v_el = c.find(f"{{{NS_S}}}v")
                if v_el is not None and v_el.text is not None:
                    try:
                        s_idx = int(v_el.text)
                    except (TypeError, ValueError):
                        s_idx = -1
                    if 0 <= s_idx < len(shared):
                        raw_runs = shared[s_idx]
                        is_string = True
            elif type_attr == "inlineStr":
                is_el = c.find(f"{{{NS_S}}}is")
                if is_el is not None:
                    raw_runs = _parse_ooxml_runs(is_el)
                    is_string = True

            runs: list[dict[str, Any]] = []
            if raw_runs is not None:
                for rr in raw_runs:
                    es = rr["e_strike"]
                    eb = rr["e_bold"]
                    runs.append(
                        {
                            "text": rr["text"],
                            "strike": cell_strike if es is None else es,
                            "bold": cell_bold if eb is None else eb,
                        }
                    )
            f_el = c.find(f"{{{NS_S}}}f")
            formula = f"={f_el.text}" if (f_el is not None and f_el.text) else None
            out[(row, col)] = {
                "runs": runs,
                "is_string": is_string,
                "cell_strike": cell_strike,
                "cell_bold": cell_bold,
                "formula": formula,
            }
    return out


def collect_cell_style_models(
    workbook_path: Path,
    sheet_titles: set[str] | None = None,
) -> dict[str, dict[tuple[int, int], dict[str, Any]]]:
    """Return per-sheet OOXML cell models keyed by sheet title.

    Reads styles.xml / sharedStrings.xml / each sheet XML directly so that
    run-level strike (with `<strike val="0">` = false and cell-font inheritance)
    is detected robustly, independent of openpyxl's font.strike.
    """
    models: dict[str, dict[tuple[int, int], dict[str, Any]]] = {}
    with zipfile.ZipFile(workbook_path) as archive:
        names = set(archive.namelist())
        if "xl/styles.xml" in names:
            font_strike, font_bold, cellxf_font = _parse_styles_font_flags(
                archive.read("xl/styles.xml")
            )
        else:
            font_strike, font_bold, cellxf_font = [], [], []
        shared: list[list[dict[str, Any]]] = []
        if "xl/sharedStrings.xml" in names:
            ss_root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            for si in ss_root.findall(f"{{{NS_S}}}si"):
                shared.append(_parse_ooxml_runs(si))
        title_to_part = _map_titles_to_sheet_parts(archive)
        for title, part in title_to_part.items():
            if sheet_titles is not None and title not in sheet_titles:
                continue
            if part not in names:
                continue
            models[title] = _parse_sheet_cell_model(
                archive.read(part), shared, font_strike, font_bold, cellxf_font
            )
    return models


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Convert all Excel workbooks in a folder to readable tabbed HTML files."
    )
    parser.add_argument(
        "--input-dir",
        default=DEFAULT_INPUT_DIR,
        type=Path,
        help=f"Input folder. Default: {DEFAULT_INPUT_DIR}",
    )
    parser.add_argument(
        "--output-dir",
        default=DEFAULT_OUTPUT_DIR,
        type=Path,
        help=f"Output folder. Default: {DEFAULT_OUTPUT_DIR}",
    )
    args = parser.parse_args()

    input_dir = args.input_dir.resolve()
    output_dir = args.output_dir.resolve()
    if not input_dir.exists():
        print(f"Input folder does not exist: {input_dir}", file=sys.stderr)
        return 1

    workbooks = sorted(
        path
        for path in input_dir.iterdir()
        if path.is_file() and path.suffix.lower() in SUPPORTED_SUFFIXES
    )
    if not workbooks:
        print(f"No supported Excel files found in: {input_dir}", file=sys.stderr)
        return 1

    output_dir.mkdir(parents=True, exist_ok=True)
    shape_residual_rows: list[dict[str, Any]] = []
    pin_ledger_rows: list[dict[str, Any]] = []
    connector_ledger_rows: list[dict[str, Any]] = []
    for workbook_path in workbooks:
        output_path = output_dir / f"{workbook_path.stem}.html"
        shape_rows, pin_rows, connector_rows = convert_workbook(workbook_path, output_path)
        shape_residual_rows.extend(shape_rows)
        pin_ledger_rows.extend(pin_rows)
        connector_ledger_rows.extend(connector_rows)
        print(f"Converted: {workbook_path.name} -> {output_path}")
    shape_residual_path = output_dir / "shape_textbox_sheets.csv"
    write_shape_textbox_residuals(shape_residual_path, shape_residual_rows)
    label = "excluded" if not RENDER_SHAPE_TEXT_SECTION else "remaining"
    print(
        "Created shape textbox ledger: "
        f"{shape_residual_path} ({len(shape_residual_rows)} {label})"
    )
    pin_ledger_path = output_dir / "pin_ledger_sheets.csv"
    write_pin_ledger_rows(pin_ledger_path, pin_ledger_rows)
    pin_label = "excluded" if not RENDER_PIN_LEDGER_SECTION else "rendered"
    print(
        "Created pin ledger: "
        f"{pin_ledger_path} ({len(pin_ledger_rows)} {pin_label})"
    )
    connector_ledger_path = output_dir / "connector_ledger_sheets.csv"
    write_connector_ledger_rows(connector_ledger_path, connector_ledger_rows)
    connector_label = "excluded" if not RENDER_CONNECTOR_LEDGER_SECTION else "rendered"
    print(
        "Created connector ledger: "
        f"{connector_ledger_path} ({len(connector_ledger_rows)} {connector_label})"
    )
    index_path = output_dir / "index.html"
    index_path.write_text(render_index_document(workbooks), encoding="utf-8")
    print(f"Created index: {index_path}")

    return 0


def workbook_number(stem: str) -> str:
    """Return the 4-digit workbook number that prefixes a filename stem."""
    match = re.match(r"(\d{4})", stem)
    return match.group(1) if match else stem[:4]


def convert_workbook(
    workbook_path: Path, output_path: Path
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], list[dict[str, Any]]]:
    """Convert one workbook and return (shape ledger, pin ledger, connector ledger) rows."""
    # data_only=False keeps formula bodies as the source spec; a second
    # data_only=True load supplies cached display values for formula cells.
    workbook = load_workbook(workbook_path, data_only=False, rich_text=True)
    cached_workbook = load_workbook(workbook_path, data_only=True, rich_text=True)
    visible_sheets = visible_worksheets(workbook)
    visible_titles = {sheet.title for sheet in visible_sheets}
    book_no = workbook_number(workbook_path.stem)
    warnings: list[str] = []
    sheets_html = []

    # openpyxl skips textbox/shape text, so pull it straight from the package.
    (
        shapes_by_title,
        pins_by_title,
        images_by_title,
        diagrams_by_title,
        shape_warnings,
    ) = collect_workbook_shapes(workbook_path, sheet_titles=visible_titles)
    warnings.extend(shape_warnings)
    # Direct-XML cell style model (run-level strike / cell inheritance / formula).
    cell_models = collect_cell_style_models(workbook_path, sheet_titles=visible_titles)

    rendered_shape_keys: dict[str, set[tuple[int, str]]] = {}
    pin_ledger_rows: list[dict[str, Any]] = []
    connector_ledger_rows: list[dict[str, Any]] = []
    for index, worksheet in enumerate(visible_sheets):
        sheet_id = f"sheet-{index + 1}"
        shapes = shapes_by_title.get(worksheet.title, [])
        pins = pins_by_title.get(worksheet.title, [])
        images = images_by_title.get(worksheet.title, [])
        diagram = diagrams_by_title.get(worksheet.title)
        cached_ws = (
            cached_workbook[worksheet.title]
            if worksheet.title in cached_workbook.sheetnames
            else None
        )
        sheet_result = render_sheet(
            worksheet,
            sheet_id,
            shapes,
            pins,
            images,
            diagram,
            book_no=book_no,
            cell_model=cell_models.get(worksheet.title),
            cached_ws=cached_ws,
        )
        sheets_html.append(sheet_result["html"])
        warnings.extend(sheet_result["warnings"])
        rendered_shape_keys[worksheet.title] = sheet_result.get("rendered_shapes", set())
        for entry in sheet_result.get("connector_ledger_rows", []):
            connector_ledger_rows.append(
                {
                    "file_name": workbook_path.name,
                    "sheet_name": worksheet.title,
                    "sheet_id": sheet_id,
                    "connector_id": entry["connector_id"],
                    "cellref": entry["cellref"],
                    "reason": entry["reason"],
                    "state": entry["state"],
                    "exclusion": (
                        CONNECTOR_LEDGER_EXCLUSION_REASON
                        if not RENDER_CONNECTOR_LEDGER_SECTION
                        else "HTMLへ出力"
                    ),
                }
            )
        for entry in sheet_result.get("pin_ledger_rows", []):
            pin_ledger_rows.append(
                {
                    "file_name": workbook_path.name,
                    "sheet_name": worksheet.title,
                    "sheet_id": sheet_id,
                    "pin": entry["pin"],
                    "pin_no": entry["pin_no"],
                    "cellref": entry["anchor_ref"],
                    "image_assignment": entry["image_assignment"],
                    "status": entry["status"],
                    "item_candidates": entry["item_candidates"],
                    "item_candidate_count": entry["item_candidate_count"],
                    "duplicates": entry["duplicates"],
                    "reason": (
                        PIN_LEDGER_EXCLUSION_REASON
                        if not RENDER_PIN_LEDGER_SECTION
                        else "HTMLへ出力"
                    ),
                }
            )

    document = render_document(
        title=workbook_path.stem,
        sheet_names=[sheet.title for sheet in visible_sheets],
        sheets_html=sheets_html,
        warnings=warnings,
    )
    output_path.write_text(document, encoding="utf-8")
    return (
        shape_textbox_residual_rows(
            workbook_path.name, visible_sheets, shapes_by_title, rendered_shape_keys
        ),
        pin_ledger_rows,
        connector_ledger_rows,
    )


def shape_textbox_residual_rows(
    file_name: str,
    visible_sheets: list[Any],
    shapes_by_title: dict[str, list[dict[str, Any]]],
    rendered_shape_keys: dict[str, set[tuple[int, str]]] | None = None,
) -> list[dict[str, Any]]:
    """Return DrawingML shape/textbox entries not emitted into a shape section.

    Diffs the collected DrawingML shapes against the shapes the renderer emitted
    into each sheet's shape-block (tracked by 1-based order + cell ref). Under
    the output-exclusion policy (RENDER_SHAPE_TEXT_SECTION=False) no shape is
    emitted, so this is the full ledger of shapes deliberately kept out of the
    HTML — every extracted shape stays visible here instead of vanishing
    silently. With the section switched back on it returns to being a residual
    worklist (header row only when conversion is complete).
    """
    rendered_shape_keys = rendered_shape_keys or {}
    rows: list[dict[str, Any]] = []
    for worksheet in visible_sheets:
        title = getattr(worksheet, "title", "")
        shapes = shapes_by_title.get(title, [])
        rendered = rendered_shape_keys.get(title, set())
        for index, shape in enumerate(shapes, start=1):
            cellref = str(shape.get("cellref", ""))
            if (index, cellref) in rendered:
                continue
            reason = (
                SHAPE_TEXT_EXCLUSION_REASON
                if not RENDER_SHAPE_TEXT_SECTION
                else "shape-blockへ未出力"
            )
            if shape.get("struck"):
                reason += "／取り消し線の文章を除去"
            rows.append(
                {
                    "file_name": file_name,
                    "sheet_name": title,
                    "shape_index": index,
                    # 原本のまま（取り消し線を含む）記録する。出力用テキストではない。
                    "text": str(shape.get("text_source") or shape.get("text", "")),
                    "cellref": cellref,
                    "reason": reason,
                }
            )
    return rows


def write_shape_textbox_residuals(path: Path, rows: list[dict[str, Any]]) -> None:
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(
            file,
            fieldnames=[
                "file_name",
                "sheet_name",
                "shape_index",
                "cellref",
                "text",
                "reason",
            ],
        )
        writer.writeheader()
        writer.writerows(rows)


PIN_LEDGER_FIELDS = [
    "file_name",
    "sheet_name",
    "sheet_id",
    "pin",
    "pin_no",
    "cellref",
    "image_assignment",
    "status",
    "item_candidates",
    "item_candidate_count",
    "duplicates",
    "reason",
]


CONNECTOR_LEDGER_FIELDS = [
    "file_name",
    "sheet_name",
    "sheet_id",
    "connector_id",
    "cellref",
    "reason",
    "state",
    "exclusion",
]


def write_connector_ledger_rows(path: Path, rows: list[dict[str, Any]]) -> None:
    """Write the connector ledger the HTML no longer carries (output-exclusion policy)."""
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=CONNECTOR_LEDGER_FIELDS)
        writer.writeheader()
        writer.writerows(rows)


def write_pin_ledger_rows(path: Path, rows: list[dict[str, Any]]) -> None:
    """Write the pin ledger the HTML no longer carries (output-exclusion policy)."""
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=PIN_LEDGER_FIELDS)
        writer.writeheader()
        writer.writerows(rows)


def visible_worksheets(workbook: Any) -> list[Any]:
    """Return worksheets to render: Excel-visible, excluding 画面遷移図 sheets.

    除外は Excel の表示状態で判定し（非表示/veryHidden は除外）、加えて「画面遷移図」を
    含むシート名のみを唯一の名前例外として除外する（ユーザー決定 2026-07-25・skill/spec
    改訂反映）。画面遷移図専用シートを取り込むと後続シートの序数(sheet-<N>)が全て +1 シフト
    し、functions/superseded_specs.json の item-sheet-<N>-* ハードコード参照や既存相互リンクが
    破綻するため。残置シート内に埋め込まれた図形ノード＋cxnSp 領域は従来どおり遷移図ステージ
    化される。convert と verify の双方が本関数を使うため、ここで一元的に判定して整合させる。
    """
    return [
        worksheet
        for worksheet in workbook.worksheets
        if getattr(worksheet, "sheet_state", "visible") == "visible"
        and "画面遷移図" not in (worksheet.title or "")
    ]


def render_document(
    title: str, sheet_names: list[str], sheets_html: list[str], warnings: list[str]
) -> str:
    current_attr = ' aria-current="page"'
    sheet_links = "\n".join(
        (
            f'<li><a href="#sheet-{index + 1}" data-sheet="sheet-{index + 1}"'
            f"{current_attr if index == 0 else ''}>"
            f"{escape_text(name)}</a></li>"
        )
        for index, name in enumerate(sheet_names)
    )
    warnings_html = render_warnings(warnings)

    return f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{escape_text(title)}</title>
  <style>
{BASE_CSS}
  </style>
</head>
<body>
  <div class="page">
    <aside class="sidebar">
      <nav class="artifact-map" aria-label="シート一覧">
        <details class="artifact-map-root" open>
          <summary class="artifact-map-title">Excel HTML Export</summary>
          <div class="artifact-map-rail">
            <div class="artifact-map-group">
              <p class="artifact-map-label">{escape_text(title)}</p>
              <div class="artifact-map-body">
                <ul>
{indent(sheet_links, 18)}
                </ul>
              </div>
            </div>
          </div>
        </details>
      </nav>
      <button type="button" class="ref-toggle" id="ref-toggle" aria-pressed="false">参照ID表示</button>
    </aside>
    <main class="doc-content">
{indent(chr(10).join(sheets_html), 6)}
{indent(warnings_html, 6)}
    </main>
  </div>
  <script>
{BASE_JS}
  </script>
</body>
</html>
"""


INDEX_GROUPS = (
    ("02", "管理画面"),
    ("03", "フロント"),
    ("04", "バッチ"),
    ("05", "API"),
    ("06", "その他"),
)


def workbook_group(stem: str) -> str:
    """Return a display group for a workbook stem."""
    for prefix, label in INDEX_GROUPS:
        if stem.startswith(prefix):
            return label
    return "未分類"


def render_index_document(workbooks: list[Path]) -> str:
    """Build a self-contained index page linking to generated workbook HTML."""
    groups: dict[str, list[Path]] = {label: [] for _, label in INDEX_GROUPS}
    groups["未分類"] = []
    for workbook in workbooks:
        groups[workbook_group(workbook.stem)].append(workbook)

    group_sections: list[str] = []
    for _prefix, label in INDEX_GROUPS + (("", "未分類"),):
        items = groups.get(label, [])
        if not items:
            continue
        links = "\n".join(
            (
                f'<li><a href="{quote(workbook.stem + ".html", safe="")}">'
                f'<span class="doc-code">{escape_text(workbook.stem[:4])}</span>'
                f'<span class="doc-title">{escape_text(workbook.stem)}</span>'
                "</a></li>"
            )
            for workbook in items
        )
        group_sections.append(
            f"""<section class="index-section">
  <h2>{escape_text(label)} <span>{len(items)}件</span></h2>
  <ul class="doc-list">
{indent(links, 4)}
  </ul>
</section>"""
        )

    return f"""<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>設計書HTML一覧</title>
  <style>
{INDEX_CSS}
  </style>
</head>
<body>
  <main class="index-page">
    <header class="index-header">
      <p class="eyebrow">Excel HTML Export</p>
      <h1>設計書HTML一覧</h1>
      <p class="summary">{len(workbooks)}件の変換済みHTML</p>
    </header>
{indent(chr(10).join(group_sections), 4)}
  </main>
</body>
</html>
"""


def _drawing_rels(
    archive: zipfile.ZipFile, drawing_part: str, names: set[str]
) -> dict[str, str]:
    """Map a drawing's relationship ids to absolute media part paths."""
    base = drawing_part.split("/")[-1]
    rels = f"xl/drawings/_rels/{base}.rels"
    if rels not in names:
        return {}
    out: dict[str, str] = {}
    rels_xml = ET.fromstring(archive.read(rels))
    for rel in rels_xml.findall(f"{{{NS_PR}}}Relationship"):
        rid = rel.get("Id")
        target = rel.get("Target", "")
        if rid and target:
            out[rid] = _resolve_package_target("xl/drawings", target)
    return out


def _resolve_package_target(base_dir: str, target: str) -> str:
    """Resolve an OOXML relationship target to a zip package path."""
    if target.startswith("/"):
        return posixpath.normpath(target.lstrip("/"))
    return posixpath.normpath(posixpath.join(base_dir, target))


def collect_workbook_shapes(
    workbook_path: Path,
    sheet_titles: set[str] | None = None,
) -> tuple[
    dict[str, list[dict[str, Any]]],
    dict[str, list[dict[str, Any]]],
    dict[str, list[dict[str, Any]]],
    dict[str, dict[str, Any]],
    list[str],
]:
    """Extract textbox/shape text, pin geometry, images, and diagrams per sheet.

    openpyxl exposes cell values but not the text inside floating textboxes and
    shapes (screen-transition diagrams, callout numbers, flow-chart notes). We
    open the .xlsx as a zip, map each worksheet to its drawing part, and pull the
    shape text out so it can be rendered alongside the cell content. The same
    drawing is parsed for absolute-EMU geometry, and images are read straight
    from the drawing's <pic> elements (box + bytes from the same source) so that
    numbered callouts can be overlaid at exact positions — openpyxl's image list
    is not relied on for geometry because its ordering/count can diverge from the
    DrawingML <pic> elements.

    Returns (shapes_by_title, pins_by_title, images_by_title, diagrams_by_title,
    warnings) where each image is {box, src, from, caption, order}.
    """
    shapes_by_title: dict[str, list[dict[str, Any]]] = {}
    pins_by_title: dict[str, list[dict[str, Any]]] = {}
    images_by_title: dict[str, list[dict[str, Any]]] = {}
    diagrams_by_title: dict[str, dict[str, Any]] = {}
    warnings: list[str] = []
    try:
        with zipfile.ZipFile(workbook_path) as archive:
            names = set(archive.namelist())
            title_to_sheet = _map_titles_to_sheet_parts(archive)
            for title, sheet_part in title_to_sheet.items():
                if sheet_titles is not None and title not in sheet_titles:
                    continue
                drawing_part = _sheet_drawing_part(archive, sheet_part, names)
                if drawing_part is None or drawing_part not in names:
                    continue
                data = archive.read(drawing_part)
                try:
                    shapes = _parse_drawing_shapes(data)
                except Exception as exc:  # pragma: no cover - malformed drawing.
                    warnings.append(f"{title}: 図形テキストを読めませんでした: {exc}")
                    shapes = []
                if shapes:
                    shapes_by_title[title] = shapes
                try:
                    pins, raw_images, diagram = _parse_drawing_geometry(data)
                except Exception as exc:  # pragma: no cover - malformed drawing.
                    warnings.append(f"{title}: 図形座標を読めませんでした: {exc}")
                    continue
                if pins:
                    pins_by_title[title] = pins
                if diagram["nodes"] or diagram["connectors"]:
                    diagrams_by_title[title] = diagram
                rels = _drawing_rels(archive, drawing_part, names)
                images: list[dict[str, Any]] = []
                for order, raw in enumerate(raw_images, start=1):
                    target = rels.get(raw.get("embed", ""))
                    if not target or target not in names:
                        continue
                    ext = target.rsplit(".", 1)[-1].lower()
                    mime = IMAGE_MIME_TYPES.get(ext, "image/png")
                    encoded = base64.b64encode(archive.read(target)).decode("ascii")
                    row, col = raw["from"]
                    images.append(
                        {
                            "box": raw["box"],
                            "src": f"data:{mime};base64,{encoded}",
                            "from": (row, col),
                            "order": order,
                            "sheet": title,
                            "caption": (
                                f"{title} / {get_column_letter(col)}{row} / image {order}"
                            ),
                        }
                    )
                if images:
                    images_by_title[title] = images
    except Exception as exc:  # pragma: no cover - not a readable zip.
        warnings.append(f"図形テキストの抽出に失敗しました: {exc}")
    return shapes_by_title, pins_by_title, images_by_title, diagrams_by_title, warnings


def assign_pins_to_images(
    pins: list[dict[str, Any]], images: list[dict[str, Any]]
) -> None:
    """Attach each callout pin to its nearest screen image.

    Mutates each image dict, adding an "overlay" list of {text, no, left, top}
    (percent coords, clamped to 0..100). A pin is assigned to the box with the
    smallest edge-distance; pins sitting just outside an image (callouts placed
    in the margin) still attach and clamp to the edge. Pins farther than half the
    box's larger side are left unassigned (genuinely unrelated to any image).
    """
    for image in images:
        image.setdefault("overlay", [])
    boxed = [im for im in images if im.get("box") and im["box"][2] > 0 and im["box"][3] > 0]
    for pin in pins:
        # Default annotation so the pin ledger can report every callout's fate.
        pin.setdefault("assigned_image_order", None)
        pin.setdefault("clamped", False)
        cx, cy = pin["center"]
        best = None
        best_dist = None
        for image in boxed:
            x, y, w, h = image["box"]
            ddx = max(x - cx, 0.0, cx - (x + w))
            ddy = max(y - cy, 0.0, cy - (y + h))
            dist = (ddx * ddx + ddy * ddy) ** 0.5
            if best_dist is None or dist < best_dist:
                best, best_dist = image, dist
        if best is None:
            continue
        x, y, w, h = best["box"]
        if best_dist > 0.5 * max(w, h):
            continue
        pin["assigned_image_order"] = best.get("order")
        pin["clamped"] = not (x <= cx <= x + w and y <= cy <= y + h)
        left = min(100.0, max(0.0, (cx - x) / w * 100))
        top = min(100.0, max(0.0, (cy - y) / h * 100))
        best["overlay"].append(
            {
                "text": pin["text"],
                "no": normalize_pin_id(pin["text"]),
                "left": left,
                "top": top,
                "from": pin.get("from"),
            }
        )


def _image_box(image: dict[str, Any]) -> tuple[float, float, float, float] | None:
    """Return a positive image box as floats, or None when geometry is absent."""
    box = image.get("box")
    if not box or len(box) < 4:
        return None
    try:
        x, y, w, h = (float(box[0]), float(box[1]), float(box[2]), float(box[3]))
    except (TypeError, ValueError):
        return None
    if w <= 0 or h <= 0:
        return None
    return x, y, w, h


def _boxes_overlap(
    a: tuple[float, float, float, float],
    b: tuple[float, float, float, float],
) -> bool:
    """True when two positive boxes have an area intersection."""
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    return ax < bx + bw and bx < ax + aw and ay < by + bh and by < ay + ah


def _boxes_are_screen_sequence(
    a: tuple[float, float, float, float],
    b: tuple[float, float, float, float],
) -> bool:
    """True when two non-overlapping images look like one vertical screen flow."""
    ax, ay, aw, ah = a
    bx, by, bw, bh = b
    horizontal_overlap = min(ax + aw, bx + bw) - max(ax, bx)
    if horizontal_overlap <= 0:
        return False
    min_width = max(1.0, min(aw, bw))
    if horizontal_overlap / min_width < 0.20:
        return False

    if ay <= by:
        vertical_gap = by - (ay + ah)
    else:
        vertical_gap = ay - (by + bh)
    if vertical_gap < 0:
        return False

    # Excel screen captures are sometimes split into separate images with
    # sizeable blank rows between them. Keep those pieces together when they
    # still share a horizontal band and the gap is not wider than the screen.
    return vertical_gap <= max(aw, bw) * 1.5


def _image_order(
    image: dict[str, Any],
    fallback: int = 0,
) -> int:
    try:
        return int(image.get("order", fallback))
    except (TypeError, ValueError):
        return fallback


def _image_anchor(image: dict[str, Any]) -> tuple[int, int]:
    source = image.get("from") or (1, 1)
    try:
        return int(source[0]), int(source[1])
    except (TypeError, ValueError, IndexError):
        return 1, 1


def image_sheet_key(image: dict[str, Any]) -> str:
    """Return the source sheet name for DrawingML images when known."""
    return str(image.get("sheet") or "")


def group_overlapping_images(
    images: list[dict[str, Any]],
) -> list[list[dict[str, Any]]]:
    """Group related DrawingML images into paint-order layer groups.

    Overlapping boxes are always grouped. Images that do not overlap but look
    like consecutive pieces of one screen image are also grouped so split label
    images stay in their Excel-relative positions. Later DrawingML images remain
    later inside each group so browser paint order matches Excel's stacking.
    """
    if not images:
        return []

    parent = list(range(len(images)))

    def find(index: int) -> int:
        while parent[index] != index:
            parent[index] = parent[parent[index]]
            index = parent[index]
        return index

    def union(left: int, right: int) -> None:
        left_root = find(left)
        right_root = find(right)
        if left_root != right_root:
            parent[right_root] = left_root

    boxes = [_image_box(image) for image in images]
    for left in range(len(images)):
        left_box = boxes[left]
        if left_box is None:
            continue
        for right in range(left + 1, len(images)):
            right_box = boxes[right]
            if right_box is None:
                continue
            left_sheet = image_sheet_key(images[left])
            same_sheet = bool(left_sheet) and left_sheet == image_sheet_key(images[right])
            left_row, _left_col = _image_anchor(images[left])
            right_row, _right_col = _image_anchor(images[right])
            if _boxes_overlap(left_box, right_box) or (
                same_sheet and _boxes_are_screen_sequence(left_box, right_box)
                and abs(left_row - right_row) <= 24
            ):
                union(left, right)

    by_root: dict[int, list[dict[str, Any]]] = defaultdict(list)
    original_index = {id(image): index for index, image in enumerate(images)}
    for index, image in enumerate(images):
        by_root[find(index)].append(image)

    def layer_key(image: dict[str, Any]) -> tuple[int, int, int, int]:
        row, col = _image_anchor(image)
        index = original_index.get(id(image), 0)
        return _image_order(image, index + 1), row, col, index

    def group_key(group: list[dict[str, Any]]) -> tuple[int, int, int, int]:
        rows_cols = [_image_anchor(image) for image in group]
        orders = [_image_order(image, original_index.get(id(image), 0) + 1) for image in group]
        indexes = [original_index.get(id(image), 0) for image in group]
        return (
            min(row for row, _col in rows_cols),
            min(col for _row, col in rows_cols),
            min(orders),
            min(indexes),
        )

    grouped = [sorted(group, key=layer_key) for group in by_root.values()]
    return sorted(grouped, key=group_key)


def _union_image_box(
    images: list[dict[str, Any]],
) -> tuple[float, float, float, float] | None:
    boxes = [_image_box(image) for image in images]
    boxes = [box for box in boxes if box is not None]
    if not boxes:
        return None
    left = min(box[0] for box in boxes)
    top = min(box[1] for box in boxes)
    right = max(box[0] + box[2] for box in boxes)
    bottom = max(box[1] + box[3] for box in boxes)
    return left, top, right - left, bottom - top


def build_image_render_rows(
    image_rows: dict[int, list[dict[str, Any]]],
) -> dict[int, list[dict[str, Any]]]:
    """Convert row-anchored images into row-anchored render items.

    Overlapping images become one layer-stage item anchored at the earliest
    source row. Non-overlapping images remain the original single-image dicts.
    """
    flat_images = [image for row in sorted(image_rows) for image in image_rows[row]]
    render_rows: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for group in group_overlapping_images(flat_images):
        if len(group) > 1:
            rows_cols = [_image_anchor(image) for image in group]
            row = min(row for row, _col in rows_cols)
            col = min(col for _row, col in rows_cols)
            render_rows[row].append(
                {
                    "layers": group,
                    "from": (row, col),
                    "box": _union_image_box(group),
                    "order": min(_image_order(image) for image in group),
                }
            )
        else:
            image = group[0]
            row, _col = _image_anchor(image)
            render_rows[row].append(image)

    def render_item_key(item: dict[str, Any]) -> tuple[int, int, int]:
        row, col = _image_anchor(item)
        return row, col, _image_order(item)

    return {
        row: sorted(items, key=render_item_key)
        for row, items in sorted(render_rows.items())
    }


def diagram_should_render(
    diagram: dict[str, Any] | None,
    images: list[dict[str, Any]] | None = None,
) -> bool:
    """True for shape/connector diagrams that should be shown as a figure."""
    if not diagram:
        return False
    nodes = [node for node in diagram.get("nodes", []) if node.get("text")]
    connectors = diagram.get("connectors", [])
    if not nodes or not connectors:
        return False
    # Screen-image sheets can still contain an independent DrawingML flow. Only
    # render that case when connector endpoints resolve to real text nodes, so
    # loose callout shapes do not become a bogus diagram.
    if images:
        return bool(build_transition_graph(diagram)["edges"])
    return True


def diagram_anchor_row(diagram: dict[str, Any] | None) -> int:
    """Place a diagram near the first anchored shape/connector row."""
    if not diagram:
        return 1
    rows: list[int] = []
    for item in diagram.get("connectors", []):
        source = item.get("from")
        if source:
            try:
                rows.append(int(source[0]))
            except (TypeError, ValueError, IndexError):
                pass
    if not rows:
        for item in diagram.get("nodes", []):
            source = item.get("from")
            if source:
                try:
                    rows.append(int(source[0]))
                except (TypeError, ValueError, IndexError):
                    pass
    return min(rows) if rows else 1


def diagram_bounds(diagram: dict[str, Any]) -> tuple[float, float, float, float] | None:
    boxes = []
    for key in ("nodes", "connectors"):
        for item in diagram.get(key, []):
            box = item.get("box")
            if not box or len(box) < 4:
                continue
            try:
                x, y, w, h = (float(box[0]), float(box[1]), float(box[2]), float(box[3]))
            except (TypeError, ValueError):
                continue
            if w < 0:
                x, w = x + w, abs(w)
            if h < 0:
                y, h = y + h, abs(h)
            boxes.append((x, y, w, h))
    if not boxes:
        return None
    left = min(x for x, _y, _w, _h in boxes)
    top = min(y for _x, y, _w, _h in boxes)
    right = max(x + w for x, _y, w, _h in boxes)
    bottom = max(y + h for _x, y, _w, h in boxes)
    return left, top, right - left, bottom - top


def _map_titles_to_sheet_parts(archive: zipfile.ZipFile) -> dict[str, str]:
    """Map each sheet title to its xl/worksheets/sheetN.xml part."""
    workbook_xml = ET.fromstring(archive.read("xl/workbook.xml"))
    rels_xml = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    rid_to_target: dict[str, str] = {}
    for rel in rels_xml.findall(f"{{{NS_PR}}}Relationship"):
        target = rel.get("Target", "")
        rid_to_target[rel.get("Id", "")] = target.split("/")[-1]
    titles: dict[str, str] = {}
    for sheet in workbook_xml.iter(f"{{{NS_S}}}sheet"):
        name = sheet.get("name")
        rid = sheet.get(f"{{{NS_R}}}id")
        part = rid_to_target.get(rid or "")
        if name and part:
            titles[name] = f"xl/worksheets/{part}"
    return titles


def _sheet_drawing_part(
    archive: zipfile.ZipFile, sheet_part: str, names: set[str]
) -> str | None:
    """Resolve the drawing part referenced by a worksheet, via its rels file."""
    base = sheet_part.split("/")[-1]
    rels = f"xl/worksheets/_rels/{base}.rels"
    if rels not in names:
        return None
    rels_xml = ET.fromstring(archive.read(rels))
    for rel in rels_xml.findall(f"{{{NS_PR}}}Relationship"):
        target = rel.get("Target", "")
        if "drawings/drawing" in target:
            filename = target.split("/")[-1]
            return f"xl/drawings/{filename}"
    return None


def _parse_drawing_shapes(data: bytes) -> list[dict[str, Any]]:
    """Return [{row, col, cellref, text}] for every non-empty shape in a drawing."""
    root = ET.fromstring(data)
    shapes: list[dict[str, Any]] = []
    for tag in ("twoCellAnchor", "oneCellAnchor", "absoluteAnchor"):
        for anchor in root.iter(f"{{{NS_XDR}}}{tag}"):
            row, col = _anchor_from_position(anchor)
            for shape in anchor.iter(f"{{{NS_XDR}}}sp"):
                source_text = _shape_text(shape, include_struck=True)
                if not source_text:
                    continue
                # text=出力に使う文字列（取り消し線除去後）/ text_source=原本のまま。
                # 取り消し線で空になった図形も台帳へは残し、抽出漏れと区別できるようにする。
                text = _shape_text(shape)
                shapes.append(
                    {
                        "row": row,
                        "col": col,
                        "cellref": f"{get_column_letter(col)}{row}",
                        "text": text,
                        "text_source": source_text,
                        "struck_text": _shape_struck_text(shape),
                        "struck": text != source_text,
                    }
                )
    shapes.sort(key=lambda item: (item["row"], item["col"]))
    return shapes


def _anchor_from_position(anchor: Any) -> tuple[int, int]:
    """Read the 0-based <xdr:from> marker and return 1-based (row, col)."""
    marker = anchor.find(f"{{{NS_XDR}}}from")
    if marker is None:
        return 1, 1
    row_el = marker.find(f"{{{NS_XDR}}}row")
    col_el = marker.find(f"{{{NS_XDR}}}col")
    row = int(row_el.text) + 1 if row_el is not None and row_el.text else 1
    col = int(col_el.text) + 1 if col_el is not None and col_el.text else 1
    return row, col


def _shape_text(shape: Any, include_struck: bool | None = None) -> str:
    """Concatenate a shape's paragraphs, one line per <a:p>.

    Runs struck through in DrawingML (`a:rPr/@strike` = sngStrike/dblStrike) are
    dropped under the strike-exclusion policy, mirroring the cell-level rule; a
    fully struck shape therefore yields an empty string and stops being a pin or
    a diagram node label (its geometry is still kept as a background object).
    Pass ``include_struck=True`` for the unfiltered source text (ledgers/audits).
    """
    if include_struck is None:
        include_struck = RENDER_STRUCK_TEXT
    paragraphs: list[str] = []
    for paragraph in shape.iter(f"{{{NS_A}}}p"):
        # ElementTree has no parent pointers: map each <a:t> back to the <a:r> /
        # <a:fld> that carries its run properties.
        holders = {child: parent for parent in paragraph.iter() for child in parent}
        texts: list[str] = []
        for run in paragraph.iter(f"{{{NS_A}}}t"):
            if not include_struck and _drawingml_run_struck(holders.get(run)):
                continue
            texts.append(run.text or "")
        paragraphs.append("".join(texts))
    return "\n".join(paragraphs).strip()


def _shape_struck_text(shape: Any) -> str:
    """Return only the struck-through text of a shape (removed by the policy)."""
    parts: list[str] = []
    for paragraph in shape.iter(f"{{{NS_A}}}p"):
        holders = {child: parent for parent in paragraph.iter() for child in parent}
        for run in paragraph.iter(f"{{{NS_A}}}t"):
            if _drawingml_run_struck(holders.get(run)):
                parts.append(run.text or "")
    return "".join(parts).strip()


def _drawingml_run_struck(holder: Any) -> bool:
    """True when the <a:r>/<a:fld> holding a text node is struck through."""
    if holder is None:
        return False
    rpr = holder.find(f"{{{NS_A}}}rPr")
    if rpr is None:
        return False
    return (rpr.get("strike") or "") in STRUCK_DRAWINGML_VALUES


def _shape_object_info(shape: Any, nv_tag: str) -> tuple[str | None, str]:
    """Return DrawingML object id/name for shapes and connectors."""
    nv = shape.find(f"{{{NS_XDR}}}{nv_tag}")
    cnv = nv.find(f"{{{NS_XDR}}}cNvPr") if nv is not None else None
    if cnv is None:
        return None, ""
    return cnv.get("id"), cnv.get("name", "")


def _preset_geometry(sp_pr: Any) -> str:
    geom = sp_pr.find(f"{{{NS_A}}}prstGeom") if sp_pr is not None else None
    return geom.get("prst", "") if geom is not None else ""


def _solid_color(parent: Any) -> str | None:
    """Return #RRGGBB from a DrawingML solidFill, when one is explicit."""
    if parent is None:
        return None
    solid = parent.find(f"{{{NS_A}}}solidFill")
    if solid is None:
        return None
    rgb = solid.find(f"{{{NS_A}}}srgbClr")
    if rgb is not None:
        value = rgb.get("val")
        if value:
            return f"#{value[-6:].upper()}"
    scheme = solid.find(f"{{{NS_A}}}schemeClr")
    if scheme is not None:
        value = scheme.get("val", "")
        return {
            "accent1": "#4472C4",
            "accent2": "#ED7D31",
            "accent3": "#A5A5A5",
            "accent4": "#FFC000",
            "accent5": "#5B9BD5",
            "accent6": "#70AD47",
            "tx1": "#2B2A26",
            "bg1": "#FFFFFF",
        }.get(value)
    return None


def _line_style(sp_pr: Any) -> dict[str, Any]:
    line = sp_pr.find(f"{{{NS_A}}}ln") if sp_pr is not None else None
    width = 1.5
    if line is not None and line.get("w"):
        try:
            width = max(1.0, int(line.get("w", "0")) / EMU_PER_PX)
        except ValueError:
            width = 1.5
    return {
        "color": _solid_color(line) or "#5F7048",
        "width": width,
    }


def _shape_style(sp_pr: Any) -> dict[str, Any]:
    return {
        "fill": _solid_color(sp_pr) or "#FFFFFF",
        "line": _line_style(sp_pr),
    }


def _absolute_box(
    xf: dict[str, tuple[int, int]],
    stack: list[dict[str, Any]],
) -> tuple[float, float, float, float]:
    """Return a shape/connector box in absolute sheet EMUs."""
    ax, ay = _apply_groups(stack, xf["off"][0], xf["off"][1])
    sx, sy = _group_scale(stack)
    return ax, ay, xf["ext"][0] * sx, xf["ext"][1] * sy


def _connector_connections(shape: Any) -> dict[str, Any]:
    """Read connector start/end shape ids and connection-site indexes."""
    nv = shape.find(f"{{{NS_XDR}}}nvCxnSpPr")
    cxn = nv.find(f"{{{NS_XDR}}}cNvCxnSpPr") if nv is not None else None
    start = cxn.find(f"{{{NS_A}}}stCxn") if cxn is not None else None
    end = cxn.find(f"{{{NS_A}}}endCxn") if cxn is not None else None
    return {
        "start_id": start.get("id") if start is not None else None,
        "start_idx": start.get("idx") if start is not None else None,
        "end_id": end.get("id") if end is not None else None,
        "end_idx": end.get("idx") if end is not None else None,
    }


def _connector_arrows(sp_pr: Any) -> dict[str, bool]:
    line = sp_pr.find(f"{{{NS_A}}}ln") if sp_pr is not None else None
    head = line.find(f"{{{NS_A}}}headEnd") if line is not None else None
    tail = line.find(f"{{{NS_A}}}tailEnd") if line is not None else None
    return {
        "head": bool(head is not None and head.get("type")),
        "tail": bool(tail is not None and tail.get("type")),
    }


# --- Pin overlay: recover numbered callouts and overlay them on the screen
#     image, then cross-link them to the item-definition table No. column. ---

PIN_MATCH_RATIO = 0.6  # min share of pins that must match table No. to overlay

# 出力除外規約（2026-08-12 ユーザー決定）: 「図形・テキストボックス内テキスト」全件表は
# HTML設計書へ出力しない。DrawingMLからの抽出自体は従来どおり続け、番号pinの画像復元・
# 画面遷移図の再構成・番号pin対応台帳では引き続き使う。非出力にした図形は
# output/shape_textbox_sheets.csv へ全件記録し、黙って落ちないようにする
# （Markdown由来の除外節は function-spec-html-render 側の convert_function_spec_html.py が担当）。
RENDER_SHAPE_TEXT_SECTION = False
SHAPE_TEXT_EXCLUSION_REASON = "出力除外規約（図形・テキストボックス内テキスト非出力）"

# 出力除外規約（2026-08-19 ユーザー決定）: 「番号pin対応台帳」はHTML設計書へ出力しない。
# 抽出・画像への番号pin復元・項目定義No.との相互リンクは従来どおり行い、pinごとの対応状況
# （matched / ambiguous / missing_item / unassigned・画像割当・重複）は
# output/pin_ledger_sheets.csv へ全件記録して、黙って落ちたのか除外したのかを機械で区別できる
# 状態に保つ。True へ戻すと従来どおり各シート末尾へ台帳テーブルを出力する。
RENDER_PIN_LEDGER_SECTION = False
PIN_LEDGER_EXCLUSION_REASON = "出力除外規約（番号pin対応台帳非出力）"

# 出力除外規約（2026-08-20 ユーザー決定）: 「コネクタ解決台帳」はHTML設計書へ出力しない。
# 連結不能コネクタの抽出・hard/soft の判定・検証は従来どおり行い、記録は
# output/connector_ledger_sheets.csv が受け持つ。True へ戻すと従来どおり各シートへ出力する。
RENDER_CONNECTOR_LEDGER_SECTION = False
CONNECTOR_LEDGER_EXCLUSION_REASON = "出力除外規約（コネクタ解決台帳非出力）"

# 出力除外規約（2026-08-12 ユーザー決定）: 正本Excelで取り消し線が引かれた文章はHTML設計書へ
# 出力しない。セル（run単位・セル継承）でも、DrawingMLの図形・テキストボックス内テキスト
# （a:rPr@strike=sngStrike/dblStrike）でも同じ扱いにする。取り消し線部分を除いた残りは
# そのまま出力し、除去の結果テキストが空になったセル・図形は出力対象から外れる。
# True へ戻すと従来どおり `cell-strike` 付きで表示する。
RENDER_STRUCK_TEXT = False
STRUCK_DRAWINGML_VALUES = {"sngStrike", "dblStrike"}

# 幾何推定で端点を埋めたコネクタ（明示 stCxn/endCxn が片方欠落し、最近傍ノードで補完
# したもの）の扱い。既定 False では geometry_inferred を soft 台帳記録＋遷移一覧に「推定」
# フラグを付けて描画するのみで検証は失敗させない（正当な幾何配置遷移図を大量に赤化しない
# ため）。True にすると geometry_inferred を hard へ格上げし exit 1 にできる。
# codex 推奨は「端点欠落=hard」だが、生成器として不確実性を忠実表現しつつ既定は非破壊と
# するコーディネータ判断。環境変数 STRICT_INFERRED_CONNECTORS=1/true で上書き可。
STRICT_INFERRED_CONNECTORS = os.environ.get(
    "STRICT_INFERRED_CONNECTORS", ""
).strip().lower() in ("1", "true", "yes")


def normalize_pin_id(text: str) -> str:
    """Reduce a pin/No. label to a comparable id: keep only [0-9A-Za-z-].

    Handles both hierarchical pins like "(2-13-1)" -> "2-13-1" and plain
    integers like "（1）" -> "1". Returns "" for symbol-only text.
    """
    return re.sub(r"[^0-9A-Za-z\-]", "", (text or "").strip())


def is_number_pin_id(no: str) -> bool:
    """True for DrawingML callout numbers that belong on screen images."""
    return bool(re.fullmatch(r"\d+(?:-\d+)*", no or ""))


def _xfrm(pr: Any) -> dict[str, tuple[int, int]] | None:
    """Read a:xfrm off/ext (and chOff/chExt for groups) as integer EMU pairs."""
    if pr is None:
        return None
    xf = pr.find(f"{{{NS_A}}}xfrm")
    if xf is None:
        return None

    def pair(el: Any, ax: str, ay: str) -> tuple[int, int] | None:
        if el is None:
            return None
        try:
            return int(el.get(ax)), int(el.get(ay))
        except (TypeError, ValueError):
            return None

    off = pair(xf.find(f"{{{NS_A}}}off"), "x", "y")
    ext = pair(xf.find(f"{{{NS_A}}}ext"), "cx", "cy")
    if off is None or ext is None:
        return None
    choff = pair(xf.find(f"{{{NS_A}}}chOff"), "x", "y") or off
    chext = pair(xf.find(f"{{{NS_A}}}chExt"), "cx", "cy") or ext
    return {
        "off": off,
        "ext": ext,
        "choff": choff,
        "chext": chext,
        "flip_h": xf.get("flipH") == "1",
        "flip_v": xf.get("flipV") == "1",
    }


def _apply_groups(stack: list[dict[str, Any]], x: float, y: float) -> tuple[float, float]:
    """Map a child-space point to absolute sheet EMU through nested groups.

    abs = grp.off + (child - grp.chOff) * grp.ext / grp.chExt, applied
    innermost-first (stack tail = innermost).
    """
    for g in reversed(stack):
        chx, chy = g["chext"]
        x = g["off"][0] + (x - g["choff"][0]) * (g["ext"][0] / chx if chx else 1)
        y = g["off"][1] + (y - g["choff"][1]) * (g["ext"][1] / chy if chy else 1)
    return x, y


def _group_scale(stack: list[dict[str, Any]]) -> tuple[float, float]:
    """Cumulative size-scaling factor through nested groups (x, y)."""
    sx = sy = 1.0
    for g in stack:
        chx, chy = g["chext"]
        sx *= g["ext"][0] / chx if chx else 1
        sy *= g["ext"][1] / chy if chy else 1
    return sx, sy


def _walk_drawing(
    element: Any,
    stack: list[dict[str, Any]],
    anchor_from: tuple[int, int],
    pins: list[dict[str, Any]],
    images: list[dict[str, Any]],
    diagram: dict[str, Any],
) -> None:
    """DFS an anchor subtree, accumulating absolute-EMU drawing geometry."""
    all_ids: set[str] = diagram.setdefault("all_ids", set())
    for child in element:
        tag = child.tag.split("}")[-1]
        # Record the DrawingML object id of every shape/connector/picture/group so
        # a connector endpoint referencing any of them (e.g. an arrow into a pic or
        # a grpSp) is recognised as existing — only a reference to an id absent from
        # the whole drawing counts as a dangling (hard/unresolved) connector.
        if tag in ("grpSp", "pic", "sp", "cxnSp"):
            nv_tag = {
                "grpSp": "nvGrpSpPr",
                "pic": "nvPicPr",
                "sp": "nvSpPr",
                "cxnSp": "nvCxnSpPr",
            }[tag]
            oid, _oname = _shape_object_info(child, nv_tag)
            if oid is not None:
                all_ids.add(str(oid))
        if tag == "grpSp":
            g = _xfrm(child.find(f"{{{NS_XDR}}}grpSpPr"))
            _walk_drawing(
                child,
                stack + [g] if g else stack,
                anchor_from,
                pins,
                images,
                diagram,
            )
        elif tag == "pic":
            xf = _xfrm(child.find(f"{{{NS_XDR}}}spPr"))
            if xf is not None:
                ax, ay, w, h = _absolute_box(xf, stack)
                blip = child.find(f".//{{{NS_A}}}blip")
                embed = blip.get(f"{{{NS_R}}}embed") if blip is not None else None
                images.append(
                    {
                        "box": (ax, ay, w, h),
                        "from": anchor_from,
                        "embed": embed,
                    }
                )
        elif tag == "sp":
            text = _shape_text(child)
            sp_pr = child.find(f"{{{NS_XDR}}}spPr")
            xf = _xfrm(sp_pr)
            if xf is not None:
                ax, ay, w, h = _absolute_box(xf, stack)
                object_id, name = _shape_object_info(child, "nvSpPr")
                diagram_object = {
                    "id": object_id,
                    "name": name,
                    "text": text,
                    "box": (ax, ay, w, h),
                    "from": anchor_from,
                    "geom": _preset_geometry(sp_pr),
                    "style": _shape_style(sp_pr),
                }
                diagram["objects"].append(diagram_object)
                if text:
                    cx = ax + w / 2
                    cy = ay + h / 2
                    pins.append({"text": text, "center": (cx, cy), "from": anchor_from})
                    diagram["nodes"].append(
                        {
                            "id": object_id,
                            "name": name,
                            "text": text,
                            "box": (ax, ay, w, h),
                            "from": anchor_from,
                            "geom": _preset_geometry(sp_pr),
                            "style": _shape_style(sp_pr),
                        }
                    )
        elif tag == "cxnSp":
            sp_pr = child.find(f"{{{NS_XDR}}}spPr")
            xf = _xfrm(sp_pr)
            if xf is not None:
                ax, ay, w, h = _absolute_box(xf, stack)
                object_id, name = _shape_object_info(child, "nvCxnSpPr")
                diagram["connectors"].append(
                    {
                        "id": object_id,
                        "name": name,
                        "box": (ax, ay, w, h),
                        "from": anchor_from,
                        "geom": _preset_geometry(sp_pr),
                        "style": _line_style(sp_pr),
                        "connections": _connector_connections(child),
                        "arrows": _connector_arrows(sp_pr),
                        "flip_h": bool(xf.get("flip_h")),
                        "flip_v": bool(xf.get("flip_v")),
                    }
                )
        else:
            _walk_drawing(child, stack, anchor_from, pins, images, diagram)


def _parse_drawing_geometry(
    data: bytes,
) -> tuple[list[dict[str, Any]], list[dict[str, Any]], dict[str, Any]]:
    """Return pins, images, and diagram geometry for one drawing part.

    pins:   [{text, center:(x,y), from:(row,col)}]
    images: [{box:(x,y,cx,cy), from:(row,col)}]  (in document order)
    diagram: {nodes:[...], connectors:[...]} for vector-like shape diagrams
    """
    root = ET.fromstring(data)
    pins: list[dict[str, Any]] = []
    images: list[dict[str, Any]] = []
    diagram: dict[str, Any] = {
        "nodes": [],
        "connectors": [],
        "objects": [],
        "all_ids": set(),
    }
    for tag in ("twoCellAnchor", "oneCellAnchor", "absoluteAnchor"):
        for anchor in root.iter(f"{{{NS_XDR}}}{tag}"):
            anchor_from = _anchor_from_position(anchor)
            _walk_drawing(anchor, [], anchor_from, pins, images, diagram)
    return pins, images, diagram


def render_sheet(
    worksheet: Any,
    sheet_id: str,
    shapes: list[dict[str, Any]] | None = None,
    pins: list[dict[str, Any]] | None = None,
    images: list[dict[str, Any]] | None = None,
    diagram: dict[str, Any] | None = None,
    book_no: str = "",
    cell_model: dict[tuple[int, int], dict[str, Any]] | None = None,
    cached_ws: Any = None,
) -> dict[str, Any]:
    warnings: list[str] = []
    pins = pins or []
    images = images or []
    cell_model = cell_model or {}
    sheet_title = worksheet.title
    if getattr(worksheet, "_charts", None):
        warnings.append(f"{worksheet.title}: グラフはHTMLへ変換していません。")
    if worksheet.conditional_formatting:
        warnings.append(f"{worksheet.title}: 条件付き書式はHTMLへ変換していません。")
    if worksheet.print_area:
        warnings.append(f"{worksheet.title}: 印刷範囲はHTMLへ変換していません。")

    _anchor_bounds, cover_to_anchor = build_merged_maps(worksheet)
    max_row = worksheet.max_row or 1
    max_column = worksheet.max_column or 1
    # Prefer images parsed straight from DrawingML (box + bytes from the same
    # <pic>); fall back to openpyxl only when the drawing yielded none.
    if images:
        image_rows: dict[int, list[dict[str, Any]]] = defaultdict(list)
        for img in images:
            image_rows[img["from"][0]].append(dict(img))
        image_rows = dict(image_rows)
    else:
        image_rows, image_warnings = collect_images_by_anchor_row(worksheet)
        warnings.extend(image_warnings)
    if image_rows:
        max_row = max(max_row, max(image_rows))
    actual_images = [img for row in sorted(image_rows) for img in image_rows[row]]
    diagram_rows: dict[int, list[dict[str, Any]]] = {}
    if diagram_should_render(diagram, actual_images):
        diagram_rows[diagram_anchor_row(diagram)] = [diagram]
        max_row = max(max_row, max(diagram_rows))

    # Collect every non-empty cell, grouped per row. Spreadsheet spacer rows and
    # padding columns simply never appear here, so the Excel grid disappears.
    lines: dict[int, list[dict[str, Any]]] = {}
    for row_index in range(1, max_row + 1):
        cells: list[dict[str, Any]] = []
        for col_index in range(1, max_column + 1):
            if (row_index, col_index) in cover_to_anchor:
                continue
            cell = worksheet.cell(row=row_index, column=col_index)
            if isinstance(cell, MergedCell):
                continue
            xml_cell = cell_model.get((row_index, col_index))
            # Formula cells: keep the formula body (source spec) and display the
            # cached value loaded separately with data_only=True.
            value_override: Any = _UNSET
            formula: str | None = None
            if getattr(cell, "data_type", None) == "f":
                formula = (
                    cell.value
                    if isinstance(cell.value, str)
                    else (xml_cell.get("formula") if xml_cell else None)
                )
                cached_value = (
                    cached_ws.cell(row=row_index, column=col_index).value
                    if cached_ws is not None
                    else None
                )
                # Preserve the formula spec even when the workbook was never
                # recalculated (no cached value): fall back to the formula body as
                # display text so the cell is never dropped and data-excel-formula
                # is always emitted.
                if cached_value not in (None, ""):
                    value_override = cached_value
                elif formula is not None:
                    value_override = formula
                else:
                    value_override = cached_value
            # 取り消し線の文章はここで落とす。セル値・表・番号No.・メタ情報の全てが
            # このrunsから作られるので、除去はこの1箇所で全経路に効く。
            runs = apply_strike_exclusion(cell_text_runs(cell, xml_cell, value_override))
            text = "".join(run["text"] for run in runs)
            if not text.strip():
                continue
            addr = f"{get_column_letter(col_index)}{row_index}"
            cells.append(
                {
                    "col": col_index,
                    "row": row_index,
                    "addr": addr,
                    "ref": f"{book_no}:{sheet_title}!{addr}",
                    "book": book_no,
                    "sheet": sheet_title,
                    "formula": formula,
                    "text": text,
                    "runs": runs,
                    "bold": any(run.get("bold") for run in runs)
                    or (
                        bool(xml_cell.get("cell_bold"))
                        if xml_cell
                        else bool(cell.font.bold)
                    ),
                    "strike": any(run.get("strike") for run in runs),
                    "fill": solid_fill(cell),
                }
            )
        if cells:
            lines[row_index] = cells

    ordered = sorted(lines)

    # 1) Document-control header -> key/value card (never a table).
    meta_pairs, meta_rows, meta_remainders = extract_metadata(lines, ordered, image_rows)
    for row in meta_rows:
        if row in meta_remainders:
            lines[row] = meta_remainders[row]
        else:
            lines.pop(row, None)
    body_rows = [r for r in ordered if r in lines]

    # 2) Genuine aligned data grids (screen item definitions, CSV formats…) stay
    #    tables; everything else becomes flowing document text.
    table_map = detect_tables(body_rows, lines)
    doc_rows = [r for r in body_rows if r not in table_map]
    lead_levels = rank_leads(doc_rows, lines)

    # Item-definition No. column (leftmost) -> identifiers and labels. Used both
    # to cross-link table rows with overlaid pins and to decide whether a sheet's
    # callout numbering actually corresponds to a screen-item table.
    tables_rows: dict[int, list[int]] = {}
    for row in body_rows:
        info = table_map.get(row)
        if info is not None:
            tables_rows.setdefault(info["id"], []).append(row)
    valid_nos: set[str] = set()
    no_to_name: dict[str, str] = {}
    # No. -> list of item-definition source refs. The *number of item candidates*
    # (not the number of pins) decides matched/ambiguous in the pin ledger.
    no_to_item_refs: dict[str, list[str]] = defaultdict(list)
    for table_id, rows_in_table in tables_rows.items():
        cols = table_map[rows_in_table[0]]["cols"]
        for row in rows_in_table[1:]:  # skip the header row
            if is_table_group_row(lines[row], cols):
                continue
            buckets = distribute_row_cells(lines[row], cols)
            values = [join_cell_text(bucket) for bucket in buckets]
            no = normalize_pin_id(values[0]) if values else ""
            if is_number_pin_id(no):
                valid_nos.add(no)
                item_ref = ""
                if buckets and buckets[0]:
                    item_ref = buckets[0][0].get("ref", "")
                no_to_item_refs[no].append(item_ref)
                if no not in no_to_name and len(values) >= 2 and values[1]:
                    no_to_name[no] = values[1]

    # Assign every numbered callout to its nearest screen image, then decide
    # whether this sheet is a screen-item sheet (callouts correspond to the No.
    # column) versus a flow diagram. Eligible sheets overlay ALL assigned pins so
    # none are dropped; pins whose No. matches the table are cross-linked, the
    # rest render as plain markers.
    flat_images = [img for row in sorted(image_rows) for img in image_rows[row]]
    number_pins = [
        pin for pin in pins if is_number_pin_id(normalize_pin_id(pin["text"]))
    ]
    assign_pins_to_images(number_pins, flat_images)
    assigned = [o for img in flat_images for o in img.get("overlay", [])]
    normalized_pins = [
        p for p in number_pins if normalize_pin_id(p["text"])
    ]
    matched = [o for o in assigned if o["no"] in valid_nos]
    overlay_eligible = (
        bool(flat_images)
        and bool(normalized_pins)
        and len(matched) >= PIN_MATCH_RATIO * len(normalized_pins)
    )
    overlaid_texts: set[str] = set()
    if overlay_eligible:
        for img in flat_images:
            for o in img.get("overlay", []):
                o["linked"] = o["no"] in valid_nos
                overlaid_texts.add(o["text"])
    else:
        for img in flat_images:
            img["overlay"] = []
    image_render_rows = build_image_render_rows(image_rows)

    # Every callout whose No. matches the item table gets its identifier row id,
    # so `#item-<sheet>-<no>` citations stay stable regardless of where the
    # callout is drawn.
    callout_nos = {normalize_pin_id(p["text"]) for p in number_pins} & valid_nos
    # 出力除外規約で図形テキスト全件表を出さないため、`pin-<sheet>-<no>` を実際に持つのは
    # 画像上に復元された番号pinだけになる。項目表からの逆リンクはその範囲に限定して、
    # 存在しないpinへのデッドリンクを作らない。
    pin_link_nos = {
        overlay["no"]
        for img in flat_images
        for overlay in img.get("overlay", [])
        if overlay.get("linked")
    }
    used_item_ids: set[str] = set()
    used_pin_ids: set[str] = set()

    # Flag functional-spec headings (機能について / 処理概要 …) so they render as
    # prominent anchored sections, separate from the screen-item table.
    spec_anchors: dict[int, str] = {}
    spec_nav: list[tuple[str, str]] = []
    for row in doc_rows:
        joined = join_cell_text(lines[row])
        if spec_heading_match(joined) and len(joined) <= 40:
            anchor = f"{sheet_id}-spec-{len(spec_anchors) + 1}"
            spec_anchors[row] = anchor
            spec_nav.append((anchor, joined))

    # 3) Emit blocks in original order, dropping images in at their anchor row.
    parts: list[str] = []
    if meta_pairs:
        parts.append(render_info_card(meta_pairs))

    # 図形テキストは抽出のみ行い、全件表としてはHTMLへ出さない（出力除外規約）。
    all_shapes = list(shapes or [])
    jump_bar = render_jump_bar(spec_nav)
    if jump_bar:
        parts.append(jump_bar)

    walk_rows = sorted(set(body_rows) | set(image_render_rows) | set(diagram_rows))
    doc_buf: list[tuple[int, list[dict[str, Any]]]] = []
    table_buf: list[list[dict[str, Any]]] = []
    table_state: dict[str, Any] = {"cols": [], "id": None}

    def flush_doc() -> None:
        if doc_buf:
            parts.append(render_doc_flow(list(doc_buf), lead_levels, spec_anchors))
            doc_buf.clear()

    def flush_table() -> None:
        if table_buf:
            parts.append(
                render_table(
                    list(table_buf),
                    table_state["cols"],
                    sheet_id,
                    callout_nos,
                    used_item_ids,
                    pin_link_nos,
                )
            )
            table_buf.clear()
            table_state["cols"] = []
            table_state["id"] = None

    for row_index in walk_rows:
        cells = lines.get(row_index)
        if cells is not None:
            info = table_map.get(row_index)
            if info is not None:
                flush_doc()
                if table_state["id"] is not None and info["id"] != table_state["id"]:
                    flush_table()
                table_buf.append(cells)
                table_state["cols"] = info["cols"]
                table_state["id"] = info["id"]
            else:
                flush_table()
                doc_buf.append((row_index, cells))
        if row_index in image_render_rows:
            flush_doc()
            flush_table()
            parts.append(
                render_image_block(
                    image_render_rows[row_index],
                    sheet_id,
                    no_to_name,
                    used_pin_ids,
                    book_no=book_no,
                    sheet_title=sheet_title,
                )
            )
        if row_index in diagram_rows:
            flush_doc()
            flush_table()
            parts.append(
                render_diagram_block(
                    diagram_rows[row_index],
                    sheet_id,
                    book_no=book_no,
                    sheet_title=sheet_title,
                )
            )
    flush_doc()
    flush_table()

    # 出力除外規約により全件表は出さないので、HTMLへ出た図形は無い（＝全件が
    # shape_textbox_sheets.csv の非出力記録へ回る）。RENDER_SHAPE_TEXT_SECTION を
    # True へ戻せば従来の全件表出力に復帰できる。
    rendered_shapes: set[tuple[int, str]] = set()
    if RENDER_SHAPE_TEXT_SECTION and all_shapes:
        shape_anchor = f"{sheet_id}-shapes"
        parts.append(
            render_shape_section(
                all_shapes,
                shape_anchor,
                sheet_id,
                callout_nos,
                used_pin_ids,
                diagram=diagram,
                book_no=book_no,
                sheet_title=sheet_title,
            )
        )
        rendered_shapes = {
            (index, str(shape.get("cellref", "")))
            for index, shape in enumerate(all_shapes, start=1)
            if str(shape.get("text", "")).strip()
        }

    # 番号pin対応台帳: 60%閾値は可読表示の判定に留め、未一致・未割当を含む全pinを
    # ここへ記録する（未対応を黙ってinventory外へ落とさない）。出力除外規約により既定では
    # HTMLへ出さず、記録は output/pin_ledger_sheets.csv が受け持つ。
    pin_ledger_rows = pin_ledger_entries(
        number_pins, no_to_item_refs, no_to_name, book_no, sheet_title
    )
    if RENDER_PIN_LEDGER_SECTION:
        pin_ledger = render_pin_ledger(pin_ledger_rows)
        if pin_ledger:
            parts.append(pin_ledger)

    # コネクタ解決台帳: 図の表示可否と分離し、connectorが1本でもあれば必ず記録する
    # （画像シートで diagram_should_render=False でも握り潰さない）。出力除外規約により
    # 既定ではHTMLへ出さず、記録は output/connector_ledger_sheets.csv が受け持つ。
    connector_ledger_rows: list[dict[str, Any]] = []
    if diagram and diagram.get("connectors"):
        unresolved = build_transition_graph(diagram)["unresolved"]
        connector_ledger_rows = connector_ledger_entries(unresolved, book_no, sheet_title)
        if RENDER_CONNECTOR_LEDGER_SECTION:
            connector_ledger = render_connector_ledger(unresolved, book_no, sheet_title)
            if connector_ledger:
                parts.append(connector_ledger)

    if not parts:
        parts.append('<p class="doc-empty">（内容のある行はありません）</p>')

    active_class = " is-active" if sheet_id == "sheet-1" else ""
    body_html = indent("\n".join(parts), 4)
    return {
        "html": f"""<section class="sheet-panel{active_class}" id="{sheet_id}">
  <div class="sheet-heading">
    <h2>{escape_text(worksheet.title)}</h2>
  </div>
  <div class="sheet-doc">
{body_html}
  </div>
</section>""",
        "warnings": warnings,
        "rendered_shapes": rendered_shapes,
        "pin_ledger_rows": pin_ledger_rows,
        "connector_ledger_rows": connector_ledger_rows,
    }


def pin_ledger_entries(
    number_pins: list[dict[str, Any]],
    no_to_item_refs: dict[str, list[str]],
    no_to_name: dict[str, str],
    book_no: str,
    sheet_title: str,
) -> list[dict[str, Any]]:
    """Record every numbered callout with its anchor, image assignment and status.

    The PIN_MATCH_RATIO threshold only gates the readable overlay; here every pin
    (matched / ambiguous / missing_item / unassigned) is recorded so no callout is
    silently dropped from the inventory. `ambiguous` is decided by the number of
    *item-definition candidates* for the No. (not by duplicate pins); duplicate
    pins sharing one No. are reported separately in their own field.

    出力除外規約で台帳テーブルをHTMLへ出さないため、この戻り値が pin の対応状況を追える
    唯一の記録になる（output/pin_ledger_sheets.csv へ全件書き出す）。
    """
    if not number_pins:
        return []
    pin_counts: Counter[str] = Counter()
    for pin in number_pins:
        pin_counts[normalize_pin_id(pin["text"])] += 1
    entries: list[dict[str, Any]] = []
    for pin in number_pins:
        no = normalize_pin_id(pin["text"])
        source = pin.get("from") or (1, 1)
        try:
            anchor_ref = (
                f"{book_no}:{sheet_title}!"
                f"{get_column_letter(int(source[1]))}{int(source[0])}"
            )
        except (TypeError, ValueError, IndexError):
            anchor_ref = f"{book_no}:{sheet_title}!?"
        image_order = pin.get("assigned_image_order")
        if image_order is None:
            image_cell = "未割当"
        else:
            image_cell = f"image {image_order}" + (
                "（枠外クランプ）" if pin.get("clamped") else ""
            )
        candidates = no_to_item_refs.get(no, [])
        if len(candidates) > 1:
            status = "ambiguous"
        elif len(candidates) == 1:
            status = "matched"
        elif image_order is None:
            status = "unassigned"
        else:
            status = "missing_item"
        if candidates:
            name = no_to_name.get(no, "")
            item_cell = "; ".join(c for c in candidates if c) or f"No.{no} {name}".strip()
        else:
            item_cell = ""
        dup = pin_counts[no]
        entries.append(
            {
                "pin": str(pin["text"]),
                "pin_no": no,
                "anchor_ref": anchor_ref,
                "image_assignment": image_cell,
                "status": status,
                "item_candidates": item_cell,
                "item_candidate_count": len(candidates),
                "duplicates": dup,
            }
        )
    return entries


def render_pin_ledger(entries: list[dict[str, Any]]) -> str:
    """Render the pin ledger table (only when RENDER_PIN_LEDGER_SECTION is True)."""
    if not entries:
        return ""
    rows: list[str] = []
    for entry in entries:
        dup = int(entry["duplicates"])
        dup_cell = f"×{dup}" if dup > 1 else ""
        rows.append(
            f'<tr data-excel-ref="{escape_attr(entry["anchor_ref"])}" '
            f'data-pin-no="{escape_attr(entry["pin_no"])}" '
            f'data-pin-status="{escape_attr(entry["status"])}" '
            f'data-item-candidates="{entry["item_candidate_count"]}" '
            f'data-pin-duplicates="{dup}">'
            f"<td>{escape_text(entry['pin'])}</td>"
            f"<td>{escape_text(entry['anchor_ref'])}</td>"
            f"<td>{escape_text(entry['image_assignment'])}</td>"
            f"<td>{escape_text(entry['status'])}</td>"
            f"<td>{escape_text(entry['item_candidates'])}</td>"
            f"<td>{escape_text(dup_cell)}</td></tr>"
        )
    body = "\n".join(rows)
    return f"""<details class="pin-ledger" data-pin-count="{len(entries)}">
  <summary>番号pin対応台帳（{len(entries)}件）</summary>
  <div class="item-table-wrap">
    <table class="item-table">
      <thead><tr><th>pin</th><th>アンカー</th><th>画像割当</th><th>対応状態</th><th>項目定義候補</th><th>pin重複</th></tr></thead>
      <tbody>
{indent(body, 8)}
      </tbody>
    </table>
  </div>
</details>"""


def solid_fill(cell: Any) -> str | None:
    """Return the cell's solid background colour, or None for the default fill."""
    fill = getattr(cell, "fill", None)
    if fill is None or getattr(fill, "patternType", None) != "solid":
        return None
    color = getattr(fill, "fgColor", None)
    rgb = getattr(color, "rgb", None) if color is not None else None
    if not isinstance(rgb, str):
        return None
    if rgb == "00000000" or rgb.upper().endswith("FFFFFF"):
        return None
    return rgb


def extract_metadata(
    lines: dict[int, list[dict[str, Any]]],
    ordered: list[int],
    image_rows: dict[int, Any],
) -> tuple[
    list[tuple[dict[str, Any], dict[str, Any] | None]],
    set[int],
    dict[int, list[dict[str, Any]]],
]:
    """Pull the contiguous label/value header at the top into key/value pairs."""
    limit = min(image_rows) if image_rows else 1 << 30
    pairs: list[tuple[dict[str, Any], dict[str, Any] | None]] = []
    meta_rows: set[int] = set()
    remainders: dict[int, list[dict[str, Any]]] = {}
    for row_index in ordered:
        if row_index >= limit or row_index > 12:
            break
        cells = lines[row_index]
        if not any(cell["text"] in META_LABELS for cell in cells):
            break  # the header block is contiguous at the very top of the sheet
        consumed: set[int] = set()
        for index, cell in enumerate(cells):
            if cell["text"] in META_LABELS:
                consumed.add(index)
                value = None
                nxt = cells[index + 1] if index + 1 < len(cells) else None
                if nxt is not None and nxt["text"] not in META_LABELS:
                    value = nxt
                    consumed.add(index + 1)
                pairs.append((cell, value))
        meta_rows.add(row_index)
        leftover = [cell for index, cell in enumerate(cells) if index not in consumed]
        if leftover:
            remainders[row_index] = leftover
    return pairs, meta_rows, remainders


def detect_tables(
    body_rows: list[int], lines: dict[int, list[dict[str, Any]]]
) -> dict[int, dict[str, Any]]:
    """Find runs of rows that align into >=3 shared columns -> real tables."""
    table_map: dict[int, dict[str, Any]] = {}
    count = len(body_rows)
    index = 0
    table_id = 0
    while index < count:
        if len(lines[body_rows[index]]) < 3:
            index += 1
            continue
        end = index
        while end < count and len(lines[body_rows[end]]) >= 3:
            end += 1
        run = body_rows[index:end]
        if len(run) >= 2:
            freq: dict[int, int] = {}
            for row in run:
                for cell in lines[row]:
                    freq[cell["col"]] = freq.get(cell["col"], 0) + 1
            cols = sorted(col for col, hits in freq.items() if hits >= len(run) / 2)
            # Sparse optional columns can be declared in the header but populated
            # only on some rows (for example "画面部品の説明"). Keep the leading
            # table row's columns so those cells do not collapse into the
            # previous bucket during rendering.
            cols = sorted(set(cols).union(cell["col"] for cell in lines[run[0]]))
            avg_cells = sum(len(lines[row]) for row in run) / len(run)
            if len(cols) >= 3 and avg_cells >= 0.6 * len(cols):
                col_set = set(cols)
                start = index
                while start - 1 >= 0:
                    cells = lines[body_rows[start - 1]]
                    if len(cells) >= 2 and all(c["col"] in col_set for c in cells):
                        start -= 1
                    else:
                        break
                if (
                    start - 2 >= 0
                    and is_table_group_row(lines[body_rows[start - 1]], cols)
                    and is_table_header_row(lines[body_rows[start - 2]], cols)
                ):
                    start -= 2
                table_id_for_run = table_id
                if (
                    start - 1 >= 0
                    and is_table_group_row(lines[body_rows[start - 1]], cols)
                ):
                    previous_info = table_map.get(body_rows[start - 2]) if start - 2 >= 0 else None
                    if previous_info is not None and previous_info["cols"] == cols:
                        start -= 1
                        table_id_for_run = previous_info["id"]
                stop = end
                while stop < count:
                    cells = lines[body_rows[stop]]
                    if len(cells) >= 2 and all(c["col"] in col_set for c in cells):
                        stop += 1
                    else:
                        break
                candidate_rows = body_rows[start:stop]
                if is_text_flow_table_candidate(candidate_rows, lines, cols):
                    index = end
                    continue
                for row in body_rows[start:stop]:
                    table_map[row] = {"id": table_id_for_run, "cols": cols}
                if table_id_for_run == table_id:
                    table_id += 1
                index = stop
                continue
        index = end
    add_identifier_table_runs(body_rows, lines, table_map, table_id)
    return table_map


def add_identifier_table_runs(
    body_rows: list[int],
    lines: dict[int, list[dict[str, Any]]],
    table_map: dict[int, dict[str, Any]],
    next_table_id: int,
) -> None:
    """Recover short/fragmented identifier tables starting at an ID header.

    Some sheets place an image anchor or a section row immediately after the
    first data row, so the generic contiguous-run detector starts at the later
    long run and leaves the header, section row, and first data row as prose.
    """
    for pos, row in enumerate(body_rows):
        header_cells = lines[row]
        header_cols = [cell["col"] for cell in header_cells]
        if not is_table_header_row(header_cells, header_cols):
            continue
        # Even when the header is already part of a detected run, re-scan forward:
        # trailing section-label + item rows that follow a gap (e.g. 8-1 却下理由 が
        # レイアウト図 の直前に取り残される) must be recovered into the same table
        # instead of falling back to document-flow prose.
        col_set = set(header_cols)
        candidate_rows = [row]
        data_rows = 0
        existing_table_id = None
        scan = pos + 1
        while scan < len(body_rows):
            scan_row = body_rows[scan]
            cells = lines[scan_row]
            mapped = table_map.get(scan_row)
            if mapped is not None:
                if mapped["cols"] == header_cols:
                    existing_table_id = mapped["id"]
                    candidate_rows.append(scan_row)
                    scan += 1
                    continue
                # A continuation table wrongly split off with a data row used as its
                # header (e.g. 都道府県別送料設定 の 5-1 が別表のヘッダ扱い)。その行が
                # 項目ID行で、列がこのIDヘッダ表の列の部分集合なら同じ表へ吸収する。
                if (
                    set(mapped["cols"]) <= col_set
                    and is_number_pin_id(normalize_pin_id(cells[0]["text"]))
                ):
                    candidate_rows.append(scan_row)
                    data_rows += 1
                    scan += 1
                    continue
                break
            if is_table_group_row(cells, header_cols):
                candidate_rows.append(scan_row)
                scan += 1
                continue
            if (
                len(cells) >= 2
                and all(cell["col"] in col_set for cell in cells)
                and is_number_pin_id(normalize_pin_id(cells[0]["text"]))
            ):
                candidate_rows.append(scan_row)
                data_rows += 1
                scan += 1
                continue
            break
        if data_rows == 0 and existing_table_id is None:
            continue
        table_id_for_run = (
            existing_table_id if existing_table_id is not None else next_table_id
        )
        if existing_table_id is None:
            next_table_id += 1
        for candidate_row in candidate_rows:
            table_map[candidate_row] = {"id": table_id_for_run, "cols": header_cols}


def is_table_header_row(cells: list[dict[str, Any]], cols: list[int]) -> bool:
    """True when a row looks like a table header for the detected columns."""
    if len(cells) < 3:
        return False
    if cells[0]["col"] != cols[0]:
        return False
    if cells[0]["text"] not in {"識別ID", "No", "No.", "NO", "ID"}:
        return False
    col_set = set(cols)
    return all(cell["col"] in col_set for cell in cells)


def is_layout_heading_text(text: str) -> bool:
    """True for document-flow layout diagram headings, not table section rows."""
    return text.strip().startswith("レイアウト図")


def is_table_group_row(cells: list[dict[str, Any]], cols: list[int]) -> bool:
    """True for a single-cell section label inside a table."""
    return (
        len(cells) == 1
        and bool(cols)
        and cells[0]["col"] == cols[0]
        and not is_layout_heading_text(cells[0]["text"])
    )


def is_text_flow_table_candidate(
    rows: list[int], lines: dict[int, list[dict[str, Any]]], cols: list[int]
) -> bool:
    """Avoid turning spec prose laid out across columns into a data table."""
    if not rows:
        return False
    if is_table_header_row(lines[rows[0]], cols):
        return False
    marker_rows = 0
    for row in rows:
        first_text = lines[row][0]["text"].strip()
        if first_text in BULLET_MARKERS or first_text == "★":
            marker_rows += 1
    if lines[rows[0]][0]["text"].strip() == "★":
        return True
    return marker_rows >= 2 and marker_rows >= len(rows) / 2


def rank_leads(
    doc_rows: list[int], lines: dict[int, list[dict[str, Any]]]
) -> dict[int, int]:
    """Map each distinct leading column to an indent level (0 = outermost)."""
    leads = sorted({lines[row][0]["col"] for row in doc_rows})
    return {col: level for level, col in enumerate(leads)}


def render_info_card(
    pairs: list[tuple[dict[str, Any], dict[str, Any] | None]]
) -> str:
    rows = "\n".join(
        f'  <div class="kv"><dt>{render_cell_text(label)}</dt>'
        f"<dd>{render_cell_text(value) if value is not None else '—'}</dd></div>"
        for label, value in pairs
    )
    return f'<dl class="doc-card">\n{rows}\n</dl>'


def render_doc_flow(
    doc_buf: list[tuple[int, list[dict[str, Any]]]],
    lead_levels: dict[int, int],
    spec_anchors: dict[int, str] | None = None,
) -> str:
    spec_anchors = spec_anchors or {}
    items: list[str] = []
    for idx, (row_index, cells) in enumerate(doc_buf):
        lead = cells[0]["col"]
        level = min(lead_levels.get(lead, 0), 6)
        first_text = cells[0]["text"]
        first_html = render_cell_text(cells[0])
        joined = join_cell_text(cells)
        joined_html = join_cell_html(cells)
        anchor = spec_anchors.get(row_index)

        if first_text in BULLET_MARKERS and len(cells) >= 2:
            items.append(
                f'<div class="doc-bullet" style="--lv:{level}">'
                f'<span class="doc-marker">{first_html}</span>'
                f'<span>{join_cell_html(cells[1:])}</span></div>'
            )
            continue

        if anchor is not None or any(cell["fill"] for cell in cells):
            spec_cls = " doc-h-spec" if anchor is not None else ""
            id_attr = f' id="{escape_attr(anchor)}"' if anchor is not None else ""
            badge = '<span class="spec-badge">機能仕様</span>' if anchor is not None else ""
            items.append(
                f'<h3 class="doc-h doc-h-section{spec_cls}"{id_attr} style="--lv:{level}">'
                f"{badge}{joined_html}</h3>"
            )
            continue

        if len(cells) == 1:
            nxt = doc_buf[idx + 1] if idx + 1 < len(doc_buf) else None
            deeper = (
                nxt is not None
                and lead_levels.get(nxt[1][0]["col"], 0) > level
            )
            is_heading = cells[0]["bold"] or (
                deeper and len(first_text) <= 24 and not first_text.endswith(("。", "、"))
            )
            if is_heading:
                items.append(
                    f'<h4 class="doc-h doc-h-sub" style="--lv:{level}">'
                    f"{first_html}</h4>"
                )
            else:
                items.append(
                    f'<p class="doc-p" style="--lv:{level}">'
                    f"{first_html}</p>"
                )
            continue

        if cells[0]["bold"]:
            items.append(
                f'<p class="doc-p" style="--lv:{level}">'
                f'<span class="doc-label">{first_html}</span>'
                f"{join_cell_html(cells[1:])}</p>"
            )
        else:
            items.append(
                f'<p class="doc-p" style="--lv:{level}">{joined_html}</p>'
            )

    return '<div class="doc-flow">\n' + indent("\n".join(items), 2) + "\n</div>"


def distribute_row_cells(
    cells: list[dict[str, Any]], cols: list[int]
) -> list[list[dict[str, Any]]]:
    """Bucket a row's original cells into the table's columns."""
    cols = sorted(cols)
    col_set = set(cols)
    buckets: dict[int, list[dict[str, Any]]] = {col: [] for col in cols}
    for cell in cells:
        col = cell["col"]
        if col in col_set:
            target = col
        else:
            lower = [c for c in cols if c <= col]
            target = lower[-1] if lower else cols[0]
        buckets[target].append(cell)
    return [buckets[col] for col in cols]


def distribute_row(cells: list[dict[str, Any]], cols: list[int]) -> list[str]:
    """Bucket a row's cells into the table's columns (shared by render paths)."""
    return [join_cell_text(bucket) for bucket in distribute_row_cells(cells, cols)]


def render_table(
    rows: list[list[dict[str, Any]]],
    cols: list[int],
    sheet_id: str | None = None,
    link_nos: set[str] | None = None,
    used_item_ids: set[str] | None = None,
    pin_link_nos: set[str] | None = None,
) -> str:
    cols = sorted(cols)
    link_nos = link_nos or set()
    used_item_ids = used_item_ids if used_item_ids is not None else set()
    # 逆リンクを張ってよいNo.（実際に `pin-<sheet>-<no>` が出力されるもの）。
    # 未指定なら link_nos と同じ＝従来動作。
    pin_link_nos = link_nos if pin_link_nos is None else pin_link_nos

    def distribute(cells: list[dict[str, Any]]) -> list[str]:
        return distribute_row(cells, cols)

    def distribute_html(cells: list[dict[str, Any]]) -> list[str]:
        return [join_cell_html(bucket) for bucket in distribute_row_cells(cells, cols)]

    # When a table is fragmented (a flowing-text row splits it), a continuation
    # segment's first row is real data, not a header. Detect that by its No.
    # matching a pin id, so it keeps its row id/link instead of becoming a <th>.
    first_no = normalize_pin_id(distribute(rows[0])[0]) if rows else ""
    header_is_data = bool(sheet_id) and first_no in link_nos
    if header_is_data:
        head_cells = ""
        body_source = rows
    else:
        header_cells = distribute_html(rows[0])
        head_cells = "".join(
            f"<th>{cell_html}</th>" for cell_html in header_cells
        )
        body_source = rows[1:]

    def render_body_row(cells: list[dict[str, Any]]) -> str:
        if is_table_group_row(cells, cols):
            return (
                f'<tr class="item-table-section"><td colspan="{len(cols)}">'
                f'{render_cell_text(cells[0])}</td></tr>'
            )
        values_text = distribute(cells)
        values_html = distribute_html(cells)
        no = normalize_pin_id(values_text[0]) if values_text else ""
        # Cross-link this row to its overlaid pin when the No. matches a pin and
        # the row id is still free (first occurrence wins for anchor uniqueness).
        row_id = ""
        first_cell = ""
        if sheet_id and no and no in link_nos:
            item_id = f"item-{sheet_id}-{no}"
            if item_id not in used_item_ids:
                used_item_ids.add(item_id)
                row_id = f' id="{escape_attr(item_id)}"'
            head = values_html[0]
            if no in pin_link_nos:
                first_cell = (
                    f'<td><a class="item-no" href="#pin-{escape_attr(sheet_id)}-'
                    f'{escape_attr(no)}">{head}</a></td>'
                )
            else:
                first_cell = f"<td>{head}</td>"
        else:
            first_cell = f"<td>{values_html[0] if values_html else ''}</td>"
        rest = "".join(f"<td>{cell_html}</td>" for cell_html in values_html[1:])
        return f"<tr{row_id}>{first_cell}{rest}</tr>"

    body_rows = "\n".join(render_body_row(cells) for cells in body_source)
    thead = f"""<thead>
      <tr>{head_cells}</tr>
    </thead>
    """ if head_cells else ""
    return f"""<div class="item-table-wrap">
  <table class="item-table">
    {thead}<tbody>
{indent(body_rows, 6)}
    </tbody>
  </table>
</div>"""


def render_jump_bar(
    spec_nav: list[tuple[str, str]],
    shape_anchor: str | None = None,
    shape_count: int = 0,
) -> str:
    """A small in-sheet nav to the functional-spec sections (and shape text when kept).

    `shape_anchor` stays None under the output-exclusion policy, so no link to a
    shape section that is not rendered is emitted.
    """
    links: list[str] = []
    for anchor, text in spec_nav:
        links.append(f'<a href="#{escape_attr(anchor)}">{escape_text(text)}</a>')
    if shape_anchor is not None:
        links.append(
            f'<a href="#{escape_attr(shape_anchor)}">'
            f"図形・テキストボックス内テキスト（{shape_count}件）</a>"
        )
    if not links:
        return ""
    return (
        '<nav class="sheet-jump" aria-label="シート内ジャンプ">\n'
        + indent("\n".join(links), 2)
        + "\n</nav>"
    )


def render_shape_section(
    shapes: list[dict[str, Any]],
    anchor: str,
    sheet_id: str | None = None,
    link_nos: set[str] | None = None,
    used_pin_ids: set[str] | None = None,
    diagram: dict[str, Any] | None = None,
    book_no: str = "",
    sheet_title: str = "",
) -> str:
    """Render textbox/shape text (dropped by openpyxl) as a labelled table.

    Callouts whose No. matches the item table are cross-linked to their row
    (and carry the pin anchor when not already overlaid on an image), so even
    callouts that could not be placed on a screen image stay linked.
    """
    link_nos = link_nos or set()
    used_pin_ids = used_pin_ids if used_pin_ids is not None else set()

    def render_row(index: int, shape: dict[str, Any]) -> str:
        # data-shape-ref stays the plain cell address (verify/back-compat); the
        # full book:sheet!cell citation is carried by data-excel-ref (skill L35).
        excel_ref = f"{book_no}:{sheet_title}!{shape['cellref']}"
        row_attrs = (
            f'data-shape-index="{index}" '
            f'data-shape-ref="{escape_attr(shape["cellref"])}" '
            f'data-excel-book="{escape_attr(book_no)}" '
            f'data-excel-sheet="{escape_attr(sheet_title)}" '
            f'data-excel-ref="{escape_attr(excel_ref)}"'
        )
        if is_object_shape_text(shape.get("text", "")):
            return render_object_shape(shape, diagram, row_attrs)
        ref = f'<td class="shape-ref">{escape_text(shape["cellref"])}</td>'
        no = normalize_pin_id(shape["text"])
        if sheet_id and no and no in link_nos:
            pin_id = f"pin-{sheet_id}-{no}"
            id_attr = ""
            if pin_id not in used_pin_ids:
                used_pin_ids.add(pin_id)
                id_attr = f' id="{escape_attr(pin_id)}"'
            text_cell = (
                f'<td><a class="item-no" href="#item-{escape_attr(sheet_id)}-'
                f'{escape_attr(no)}">{escape_multiline(shape["text"])}</a></td>'
            )
            return f"<tr {row_attrs}{id_attr}>{ref}{text_cell}</tr>"
        return f"<tr {row_attrs}>{ref}<td>{escape_multiline(shape['text'])}</td></tr>"

    # 取り消し線で出力テキストが空になった図形は行にしない（原本は台帳側に残る）。
    rendered = [
        (index, shape)
        for index, shape in enumerate(shapes, start=1)
        if str(shape.get("text", "")).strip()
    ]
    body_rows = "\n".join(render_row(index, shape) for index, shape in rendered)
    return f"""<section class="shape-block" id="{escape_attr(anchor)}">
  <h3 class="shape-title">図形・テキストボックス内テキスト（{len(rendered)}件）</h3>
  <p class="shape-note">画面遷移図・フロー図・画面イメージ上の注釈など、図形内の文字を読み順（位置）で抽出したものです。</p>
  <div class="item-table-wrap">
    <table class="item-table shape-table">
      <thead>
        <tr><th>位置</th><th>テキスト</th></tr>
      </thead>
      <tbody>
{indent(body_rows, 8)}
      </tbody>
    </table>
  </div>
</section>"""


def is_object_shape_text(text: str) -> bool:
    target = (
        "スマレジには正確な在庫数を持たない仕様となったため、ECCUBE→スマレジへの連携はなしとする。\n"
        "スマレジで商品が売れたことによる在庫の減少や返品による在庫の増加はスマレジ→ECCUBEに連携する必要がある。"
    )
    return text == target


def render_object_shape(
    shape: dict[str, Any],
    diagram: dict[str, Any] | None,
    row_attrs: str = "",
) -> str:
    node = find_shape_diagram_node(shape, diagram)
    ref = escape_text(shape["cellref"])
    text = escape_multiline(shape["text"])
    stage_style = ""
    box_style = ""
    if node is not None:
        box = node.get("box") or (0, 0, 0, 0)
        style = node.get("style") or {}
        fill = style.get("fill") or "#4F81BD"
        line = style.get("line") or {}
        stroke = line.get("color") or "#385D8A"
        stroke_w = max(1.0, float(line.get("width") or 1.0))
        width = max(320.0, float(box[2]) / EMU_PER_PX)
        height = max(72.0, float(box[3]) / EMU_PER_PX)
        box_style = (
            f"width:{width:.0f}px;height:{height:.0f}px;"
            f"--shape-fill:{fill};--shape-stroke:{stroke};--shape-stroke-w:{stroke_w:.1f}px;"
            "display:flex;align-items:center;justify-content:center;"
        )
        stage_style = f"width:{width:.0f}px;height:{height:.0f}px"
    return (
        f'<tr class="shape-object-row" {row_attrs}>'
        f'<td class="shape-ref">{ref}</td>'
        f'<td><div class="shape-object-stage" style="{escape_attr(stage_style)}">'
        f'<div class="shape-object-box" style="{escape_attr(box_style)}">{text}</div>'
        "</div></td>"
        "</tr>"
    )


def find_shape_diagram_node(
    shape: dict[str, Any], diagram: dict[str, Any] | None
) -> dict[str, Any] | None:
    if not diagram:
        return None
    target_text = shape.get("text", "")
    target_cellref = shape.get("cellref")
    for node in diagram.get("nodes", []):
        if node.get("text") == target_text:
            node_from = node.get("from")
            cellref = None
            if node_from:
                try:
                    row, col = int(node_from[0]), int(node_from[1])
                    cellref = f"{get_column_letter(col)}{row}"
                except (TypeError, ValueError, IndexError):
                    cellref = None
            if cellref == target_cellref:
                return node
    return None


def collect_images_by_anchor_row(
    worksheet: Any, image_boxes: list[dict[str, Any]] | None = None
) -> tuple[dict[int, list[dict[str, Any]]], list[str]]:
    image_rows: dict[int, list[dict[str, Any]]] = defaultdict(list)
    warnings: list[str] = []
    # openpyxl enumerates worksheet._images in the same order as the DrawingML
    # <pic> elements, so the parsed EMU boxes line up positionally.
    image_boxes = image_boxes or []
    for index, image in enumerate(getattr(worksheet, "_images", []) or [], start=1):
        try:
            anchor_row, anchor_col = image_anchor_position(image)
            image_format = (getattr(image, "format", "png") or "png").lower()
            mime_type = IMAGE_MIME_TYPES.get(image_format, "image/png")
            image_data = image._data()
            encoded = base64.b64encode(image_data).decode("ascii")
            cell_ref = f"{get_column_letter(anchor_col)}{anchor_row}"
            box = image_boxes[index - 1]["box"] if index - 1 < len(image_boxes) else None
            image_rows[anchor_row].append(
                {
                    "src": f"data:{mime_type};base64,{encoded}",
                    "caption": f"{worksheet.title} / {cell_ref} / image {index}",
                    "width": str(getattr(image, "width", "")),
                    "height": str(getattr(image, "height", "")),
                    "box": box,
                    "order": index,
                }
            )
        except Exception as exc:  # pragma: no cover - depends on workbook internals.
            warnings.append(f"{worksheet.title}: 画像{index}をHTMLへ変換できませんでした: {exc}")
    return dict(image_rows), warnings


def image_anchor_position(image: Any) -> tuple[int, int]:
    anchor = getattr(image, "anchor", "A1")
    if isinstance(anchor, str):
        letters = "".join(ch for ch in anchor if ch.isalpha()) or "A"
        digits = "".join(ch for ch in anchor if ch.isdigit()) or "1"
        col = 0
        for char in letters.upper():
            col = col * 26 + ord(char) - ord("A") + 1
        return int(digits), col

    marker = getattr(anchor, "_from", None)
    if marker is not None:
        return int(marker.row) + 1, int(marker.col) + 1
    return 1, 1


def _image_excel_ref(image: dict[str, Any], book_no: str, sheet_title: str) -> str:
    """Return the book:sheet!cell citation for a DrawingML image anchor."""
    sheet = str(image.get("sheet") or sheet_title)
    source = image.get("from") or (1, 1)
    try:
        return f"{book_no}:{sheet}!{get_column_letter(int(source[1]))}{int(source[0])}"
    except (TypeError, ValueError, IndexError):
        return f"{book_no}:{sheet}!?"


def _image_ref_attrs(image: dict[str, Any], book_no: str, sheet_title: str) -> str:
    """data-excel-ref / order attributes for an image figure."""
    ref = _image_excel_ref(image, book_no, sheet_title)
    order = _image_order(image)
    return (
        f' data-excel-book="{escape_attr(book_no)}"'
        f' data-excel-sheet="{escape_attr(str(image.get("sheet") or sheet_title))}"'
        f' data-excel-ref="{escape_attr(ref)}" data-image-order="{order}"'
    )


def render_image_block(
    images: list[dict[str, Any]],
    sheet_id: str | None = None,
    no_to_name: dict[str, str] | None = None,
    used_pin_ids: set[str] | None = None,
    book_no: str = "",
    sheet_title: str = "",
) -> str:
    no_to_name = no_to_name or {}
    figures = []
    for image in images:
        caption = image.get("caption", "")
        image_alt = caption
        if image.get("layers"):
            figures.append(
                render_image_layer_figure(
                    image, sheet_id, no_to_name, used_pin_ids, book_no, sheet_title
                )
            )
            continue

        ref_attrs = _image_ref_attrs(image, book_no, sheet_title)
        # Width comes from the EMU box when available (openpyxl fallback supplies
        # pixel width/height instead); height stays auto to preserve aspect.
        box = image.get("box")
        if box and box[2]:
            width_attr = f' width="{round(box[2] / EMU_PER_PX)}"'
        elif image.get("width"):
            width_attr = f' width="{escape_attr(image["width"])}"'
        else:
            width_attr = ""
        img_tag = (
            f'<img src="{escape_attr(image["src"])}" '
            f'alt="{escape_attr(image_alt)}"{width_attr}>'
        )
        overlay = image.get("overlay") or []
        if overlay and sheet_id:
            pins_html = render_image_pins(
                overlay, sheet_id, no_to_name, used_pin_ids, book_no, sheet_title
            )
            figures.append(
                f"""<figure class="sheet-image wf-frame"{ref_attrs}>
  <div class="wf-stage">
    {img_tag}
{indent(pins_html, 4)}
  </div>
  <figcaption>{escape_text(image_alt)}</figcaption>
</figure>"""
            )
        else:
            figures.append(
                f"""<figure class="sheet-image"{ref_attrs}>
  {img_tag}
  <figcaption>{escape_text(image_alt)}</figcaption>
</figure>"""
            )
    return '<div class="image-block">\n' + indent("\n".join(figures), 2) + "\n</div>"


def _image_layers_are_stack(
    layers: list[dict[str, Any]],
    box: tuple[float, float, float, float],
) -> bool:
    """True when a layer group is a weakly-overlapping vertical sequence.

    Such groups (e.g. モーダルを縦に並べたキャプチャ) are stacked in the frame so
    every image is visible. Genuinely overlapping layers (screen + modal, or any
    group carrying numbered pins) keep their Excel-coordinate positioning.
    """
    if len(layers) < 2:
        return False
    if image_layer_overlay(layers, box):  # numbered pins require positioning
        return False
    boxes = [b for b in (_image_box(image) for image in layers) if b is not None]
    if len(boxes) < 2:
        return False
    for i in range(len(boxes)):
        ax, ay, aw, ah = boxes[i]
        for j in range(i + 1, len(boxes)):
            bx, by, bw, bh = boxes[j]
            overlap_w = max(0.0, min(ax + aw, bx + bw) - max(ax, bx))
            overlap_h = max(0.0, min(ay + ah, by + bh) - max(ay, by))
            inter = overlap_w * overlap_h
            denom = min(aw * ah, bw * bh) or 1.0
            if inter / denom >= 0.5:  # a pair overlaps a lot → keep absolute layers
                return False
    return True


def render_image_layer_figure(
    item: dict[str, Any],
    sheet_id: str | None = None,
    no_to_name: dict[str, str] | None = None,
    used_pin_ids: set[str] | None = None,
    book_no: str = "",
    sheet_title: str = "",
) -> str:
    """Render overlapping Excel images as one responsive DrawingML stage."""
    no_to_name = no_to_name or {}
    layers = list(item.get("layers") or [])
    box = item.get("box") or _union_image_box(layers)
    if not layers or box is None:
        return ""
    ref_attrs = _image_ref_attrs(item, book_no, sheet_title)

    # 画像が「弱い重なりの縦並び（モーダル等を縦に並べたキャプチャ）」の場合、Excel座標で
    # 絶対配置すると互いに覆って読めない。ピンが無く相互の重なりが小さい群は、結合した枠の
    # 中に縦積みで全画像を見せる。逆に画面＋モーダルのように本当に重なる群（番号ピン付き等）
    # は従来どおり座標配置を維持する。
    if _image_layers_are_stack(layers, box):
        stack_tags = [
            f'<img class="image-stack-img" src="{escape_attr(image["src"])}" '
            f'alt="{escape_attr(image.get("caption", ""))}" '
            f'data-excel-ref="{escape_attr(_image_excel_ref(image, book_no, sheet_title))}" '
            f'data-image-order="{_image_order(image)}">'
            for image in layers
            if _image_box(image) is not None
        ]
        caption = (
            f"画像レイヤー（{len(layers)}枚）: "
            + " + ".join(str(image.get("caption", "")) for image in layers)
        )
        return f"""<figure class="sheet-image wf-frame image-layer-frame" data-image-layer-count="{len(layers)}"{ref_attrs}>
  <div class="image-stack">
{indent(chr(10).join(stack_tags), 4)}
  </div>
  <figcaption>{escape_text(caption)}</figcaption>
</figure>"""

    stage_x, stage_y, stage_w, stage_h = box
    stage_w_px = max(1, round(stage_w / EMU_PER_PX))
    stage_h_px = max(1, round(stage_h / EMU_PER_PX))
    stage_style = f"width:{stage_w_px}px;aspect-ratio:{stage_w_px} / {stage_h_px}"
    layer_tags: list[str] = []
    for z_index, image in enumerate(layers, start=1):
        image_box = _image_box(image)
        if image_box is None:
            continue
        x, y, w, h = image_box
        style = (
            f"left:{(x - stage_x) / stage_w * 100:.4f}%;"
            f"top:{(y - stage_y) / stage_h * 100:.4f}%;"
            f"width:{w / stage_w * 100:.4f}%;"
            f"height:{h / stage_h * 100:.4f}%;"
            f"z-index:{z_index}"
        )
        layer_tags.append(
            f'<img class="image-layer-img" src="{escape_attr(image["src"])}" '
            f'alt="{escape_attr(image["caption"])}" '
            f'data-excel-ref="{escape_attr(_image_excel_ref(image, book_no, sheet_title))}" '
            f'data-image-order="{_image_order(image)}" style="{style}">'
        )

    overlay = image_layer_overlay(layers, box)
    pins_html = ""
    if overlay and sheet_id:
        pins_html = render_image_pins(
            overlay, sheet_id, no_to_name, used_pin_ids, book_no, sheet_title
        )
    contents = "\n".join(layer_tags + ([pins_html] if pins_html else []))
    caption = (
        f"画像レイヤー（{len(layers)}枚）: "
        + " + ".join(str(image.get("caption", "")) for image in layers)
    )
    return f"""<figure class="sheet-image wf-frame image-layer-frame" data-image-layer-count="{len(layers)}"{ref_attrs}>
  <div class="wf-stage image-layer-stage" style="{escape_attr(stage_style)}">
{indent(contents, 4)}
  </div>
  <figcaption>{escape_text(caption)}</figcaption>
</figure>"""


def image_layer_overlay(
    layers: list[dict[str, Any]],
    stage_box: tuple[float, float, float, float],
) -> list[dict[str, Any]]:
    """Convert per-image pin percentages into stage percentages."""
    stage_x, stage_y, stage_w, stage_h = stage_box
    if stage_w <= 0 or stage_h <= 0:
        return []
    overlay: list[dict[str, Any]] = []
    for image in layers:
        image_box = _image_box(image)
        if image_box is None:
            continue
        x, y, w, h = image_box
        for pin in image.get("overlay") or []:
            absolute_x = x + pin["left"] / 100 * w
            absolute_y = y + pin["top"] / 100 * h
            converted = dict(pin)
            converted["left"] = min(
                100.0, max(0.0, (absolute_x - stage_x) / stage_w * 100)
            )
            converted["top"] = min(
                100.0, max(0.0, (absolute_y - stage_y) / stage_h * 100)
            )
            overlay.append(converted)
    return overlay


def render_image_pins(
    overlay: list[dict[str, Any]],
    sheet_id: str,
    no_to_name: dict[str, str],
    used_pin_ids: set[str] | None = None,
    book_no: str = "",
    sheet_title: str = "",
) -> str:
    """Absolutely-positioned numbered pins; linked ones jump to the table row.

    Pins whose No. matches the item table render as anchors cross-linked to the
    row (and back); pins without a table match still render as plain markers so
    no callout from the Excel image is dropped.
    """
    used_pin_ids = used_pin_ids if used_pin_ids is not None else set()
    pins_html: list[str] = []
    for pin in overlay:
        no = pin["no"]
        style = f'style="left:{pin["left"]:.2f}%;top:{pin["top"]:.2f}%"'
        text = escape_text(pin["text"])
        source = pin.get("from")
        ref_attrs = f' data-pin-no="{escape_attr(no)}"'
        if source:
            try:
                pin_ref = (
                    f"{book_no}:{sheet_title}!"
                    f"{get_column_letter(int(source[1]))}{int(source[0])}"
                )
                ref_attrs += f' data-excel-ref="{escape_attr(pin_ref)}"'
            except (TypeError, ValueError, IndexError):
                pass
        if pin.get("linked"):
            name = no_to_name.get(no, "")
            label = f"No.{no} {name}".strip()
            pin_id = f"pin-{sheet_id}-{no}"
            id_attr = ""
            if pin_id not in used_pin_ids:
                used_pin_ids.add(pin_id)
                id_attr = f' id="{escape_attr(pin_id)}"'
            pins_html.append(
                f'<a class="wf-pin"{id_attr}{ref_attrs} href="#item-{escape_attr(sheet_id)}-'
                f'{escape_attr(no)}" {style} '
                f'title="{escape_attr(label)}" aria-label="{escape_attr(label)}">'
                f"{escape_text(no) or text}</a>"
            )
        else:
            label = escape_attr(pin["text"])
            pins_html.append(
                f'<span class="wf-pin wf-pin-plain"{ref_attrs} {style} '
                f'title="{label}" aria-label="{label}">{escape_text(no) or text}</span>'
            )
    return "\n".join(pins_html)


def render_diagram_block(
    diagrams: list[dict[str, Any]],
    sheet_id: str,
    book_no: str = "",
    sheet_title: str = "",
) -> str:
    figures = [
        render_diagram_figure(diagram, sheet_id, index, book_no, sheet_title)
        for index, diagram in enumerate(diagrams, start=1)
    ]
    figures = [figure for figure in figures if figure]
    if not figures:
        return ""
    return '<div class="diagram-block">\n' + indent("\n".join(figures), 2) + "\n</div>"


def stage_is_degenerate(width: float, height: float) -> bool:
    """True when an Excel-coordinate diagram is too elongated/sparse to read.

    Such drawings (extreme aspect ratio or huge spans) are reconstructed from
    the transition graph instead of the source coordinates. Tuned so 0202's
    崩れた図（約 1051x22184・854x15088）が該当し、正常図（約 2011x3049・
    1036x2190）や 0201 の小図は非該当のまま Excel 座標を保つ。
    """
    w = max(1.0, float(width))
    h = max(1.0, float(height))
    longer = max(w, h)
    shorter = max(1.0, min(w, h))
    ratio = longer / shorter
    return ratio >= 6 or (longer > 6000 and ratio >= 3)


def render_diagram_figure(
    diagram: dict[str, Any],
    sheet_id: str,
    index: int,
    book_no: str = "",
    sheet_title: str = "",
) -> str:
    graph = build_transition_graph(diagram)
    render_objects = diagram_render_objects(diagram)
    if not graph["nodes"] and not render_objects:
        return ""
    marker_id = f"diagram-arrow-{sheet_id}-{index}"
    table = render_transition_table(
        graph["edges"], graph["nodes_by_id"], book_no, sheet_title
    )
    connector_count = len(diagram.get("connectors", []))
    node_count = len(graph["nodes"])
    edge_count = len(graph["edges"])
    caption = (
        f"画面遷移図をExcel図形座標で再構成"
        f"（画面 {node_count}件 / 遷移 {edge_count}件 / 元コネクタ {connector_count}件）"
    )
    connectors = diagram.get("connectors", [])
    objects_by_id = {
        str(item.get("id")): item
        for item in render_objects
        if item.get("id") is not None
    }
    excel_bounds = diagram_stage_bounds(
        diagram_objects_for_connectors(render_objects, connectors),
        connectors,
        objects_by_id,
    )
    # Prefer the source Excel geometry, but only when it is not degenerate.
    # Extremely elongated/sparse drawings (e.g. 多数フローを縦積みした図) render
    # unreadably at 1:1 Excel coordinates; those are reconstructed from the
    # transition graph below so they stay human-readable.
    if excel_bounds is not None and not stage_is_degenerate(excel_bounds[2], excel_bounds[3]):
        original_stage = render_original_diagram_stage(
            render_objects, connectors, marker_id, book_no, sheet_title
        )
        if original_stage:
            figure = f"""<figure class="diagram-frame" data-diagram-layout="excel" data-diagram-connectors="{connector_count}" data-diagram-nodes="{node_count}" data-transition-edges="{edge_count}">
  <div class="diagram-viewport">
{indent(original_stage, 4)}
  </div>
  <figcaption>{escape_text(caption)}</figcaption>
{indent(table, 2)}
</figure>"""
            compact_map = render_transition_map(
                graph, sheet_id, index, book_no, sheet_title
            )
            return figure + ("\n" + compact_map if compact_map else "")

    # Reconstruct from the transition graph. Used when the source geometry is
    # unavailable, or when the Excel layout is degenerate (extreme aspect ratio).
    layout = layout_transition_graph(graph)
    edges = "\n".join(render_transition_edge(edge, layout, marker_id) for edge in graph["edges"])
    nodes = "\n".join(
        render_transition_node(node, layout["nodes"][node["id"]], book_no, sheet_title)
        for node in graph["nodes"]
    )
    stage_style = f"width:{layout['width']}px;height:{layout['height']}px"
    fallback_caption = (
        f"画面遷移図を接続関係から再構成"
        f"（画面 {node_count}件 / 遷移 {edge_count}件 / 元コネクタ {connector_count}件）"
    )
    return f"""<figure class="diagram-frame" data-diagram-layout="graph" data-diagram-connectors="{connector_count}" data-diagram-nodes="{node_count}" data-transition-edges="{edge_count}">
  <div class="diagram-viewport">
    <div class="diagram-stage transition-stage" style="{escape_attr(stage_style)}">
      <svg class="diagram-lines" viewBox="0 0 {layout['width']} {layout['height']}" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <marker id="{escape_attr(marker_id)}" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto" markerUnits="strokeWidth">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#5F7048"></path>
          </marker>
        </defs>
{indent(edges, 8)}
      </svg>
{indent(nodes, 6)}
    </div>
  </div>
  <figcaption>{escape_text(fallback_caption)}</figcaption>
{indent(table, 2)}
</figure>"""


def hard_unresolved_count(unresolved: list[dict[str, Any]]) -> int:
    """Number of genuinely unresolvable (dangling) connectors (verification exit 1)."""
    return sum(1 for item in unresolved if item.get("state") == "hard")


def connector_ledger_entries(
    unresolved: list[dict[str, Any]],
    book_no: str = "",
    sheet_title: str = "",
) -> list[dict[str, Any]]:
    """Return one record per unresolved connector (the ledger the HTML no longer shows)."""
    rows: list[dict[str, Any]] = []
    for item in unresolved:
        ref = _connector_excel_ref(item, book_no, sheet_title)
        if not ref:
            ref = f"{book_no}:{sheet_title}!{item.get('anchor') or '?'}"
        rows.append(
            {
                "connector_id": str(item.get("id") or "?"),
                "cellref": ref,
                "reason": str(item.get("reason") or ""),
                "state": str(item.get("state") or ""),
            }
        )
    return rows


def render_connector_ledger(
    unresolved: list[dict[str, Any]],
    book_no: str = "",
    sheet_title: str = "",
) -> str:
    """Inventory every cxnSp that did not become a directed transition edge.

    連結不能コネクタを黙って遷移図から消さず、object id・アンカー・理由・状態を全件
    記録する。`state="hard"`（stCxn/endCxn が存在しない図形を参照＝解決できない）は
    data-connector-unresolved に数え、1件でも verify.py が非ゼロ終了する。`state="soft"`
    （装飾線・自己ループ・無方向・非テキスト端点）は inventory へ残すが失敗にはしない。
    """
    if not unresolved:
        return ""
    hard = hard_unresolved_count(unresolved)

    def row(item: dict[str, Any]) -> str:
        # Full-form book:sheet!cell citation (bare A1 is not citable across books).
        ref = _connector_excel_ref(item, book_no, sheet_title)
        if not ref:
            ref = f"{book_no}:{sheet_title}!{item.get('anchor') or '?'}"
        ref_attr = f' data-excel-ref="{escape_attr(ref)}"' if ref else ""
        return (
            f'<tr data-connector-state="{escape_attr(item.get("state") or "")}"{ref_attr}>'
            f"<td>{escape_text(item.get('id') or '?')}</td>"
            f"<td>{escape_text(ref)}</td>"
            f"<td>{escape_text(item.get('reason') or '')}</td>"
            f"<td>{escape_text(item.get('state') or '')}</td>"
            "</tr>"
        )

    rows = "\n".join(row(item) for item in unresolved)
    return f"""<details class="connector-ledger" data-connector-unresolved="{hard}" data-connector-noted="{len(unresolved)}">
  <summary>コネクタ解決台帳（記録 {len(unresolved)}件 / 未解決 {hard}件）</summary>
  <div class="item-table-wrap">
    <table class="item-table">
      <thead><tr><th>connector id</th><th>アンカー</th><th>理由</th><th>状態</th></tr></thead>
      <tbody>
{indent(rows, 8)}
      </tbody>
    </table>
  </div>
</details>"""


def diagram_render_objects(diagram: dict[str, Any]) -> list[dict[str, Any]]:
    """Return visible non-pin diagram objects in original DrawingML order."""
    objects: list[dict[str, Any]] = []
    for order, item in enumerate(diagram.get("objects") or diagram.get("nodes", [])):
        text = str(item.get("text") or "").strip()
        if text and is_number_pin_id(normalize_pin_id(text)):
            continue
        out = dict(item)
        out["order"] = order
        objects.append(out)
    return objects


def render_original_diagram_stage(
    objects: list[dict[str, Any]],
    connectors: list[dict[str, Any]],
    marker_id: str,
    book_no: str = "",
    sheet_title: str = "",
) -> str:
    """Render a DrawingML diagram using the source Excel geometry."""
    objects_by_id = {
        str(item.get("id")): item
        for item in objects
        if item.get("id") is not None
    }
    render_objects = diagram_objects_for_connectors(objects, connectors)
    bounds = diagram_stage_bounds(render_objects, connectors, objects_by_id)
    if bounds is None:
        return ""
    stage_left, stage_top, width, height = bounds
    object_html = "\n".join(
        render_diagram_node(item, stage_left, stage_top, book_no, sheet_title)
        for item in render_objects
    )
    connector_routes = diagram_connector_routes(
        connectors,
        stage_left,
        stage_top,
        objects_by_id,
    )
    connector_html = "\n".join(
        render_diagram_connector(connector, points, marker_id)
        for connector, points in zip(connectors, connector_routes, strict=False)
    )
    stage_style = f"width:{width:.0f}px;height:{height:.0f}px"
    return f"""<div class="diagram-stage diagram-stage-excel" style="{escape_attr(stage_style)}">
  <svg class="diagram-lines" viewBox="0 0 {width:.0f} {height:.0f}" preserveAspectRatio="none" aria-hidden="true">
    <defs>
      <marker id="{escape_attr(marker_id)}" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto" markerUnits="strokeWidth">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="#5F7048"></path>
      </marker>
    </defs>
{indent(connector_html, 4)}
  </svg>
{indent(object_html, 2)}
</div>"""


def diagram_objects_for_connectors(
    objects: list[dict[str, Any]],
    connectors: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Limit rendered objects to the connector-owned diagram region."""
    connected_ids: set[str] = set()
    connector_froms = {connector.get("from") for connector in connectors}
    connector_boxes = [
        tuple(float(value) for value in connector["box"])
        for connector in connectors
        if connector.get("box")
    ]
    for connector in connectors:
        con = connector.get("connections") or {}
        for key in ("start_id", "end_id"):
            value = con.get(key)
            if value is not None:
                connected_ids.add(str(value))

    selected: list[dict[str, Any]] = []
    for item in objects:
        object_id = str(item.get("id") or "")
        text = str(item.get("text") or "").strip()
        if object_id in connected_ids:
            selected.append(item)
            continue
        if not text:
            continue
        if item.get("from") in connector_froms:
            selected.append(item)
            continue
        if any(_boxes_near(item.get("box"), box) for box in connector_boxes):
            selected.append(item)
    return selected


def _boxes_near(
    left_box: Any,
    right_box: tuple[float, float, float, float],
) -> bool:
    if not left_box:
        return False
    try:
        lx, ly, lw, lh = (float(value) for value in left_box)
    except (TypeError, ValueError):
        return False
    rx, ry, rw, rh = right_box
    margin = 36 * EMU_PER_PX
    return not (
        lx + lw < rx - margin
        or rx + rw < lx - margin
        or ly + lh < ry - margin
        or ry + rh < ly - margin
    )


def diagram_stage_bounds(
    nodes: list[dict[str, Any]],
    connectors: list[dict[str, Any]],
    objects_by_id: dict[str, dict[str, Any]] | None = None,
) -> tuple[float, float, float, float] | None:
    boxes: list[tuple[float, float, float, float]] = []
    for item in nodes:
        box = item.get("box")
        if not box:
            continue
        try:
            x, y, w, h = (float(box[0]), float(box[1]), float(box[2]), float(box[3]))
        except (TypeError, ValueError, IndexError):
            continue
        boxes.append((x, y, w, h))
    for connector in connectors:
        points = diagram_connector_points_emu(connector, objects_by_id or {})
        if points:
            xs = [point[0] for point in points]
            ys = [point[1] for point in points]
            boxes.append((min(xs), min(ys), max(xs) - min(xs), max(ys) - min(ys)))
            continue
        box = connector.get("box")
        if not box:
            continue
        try:
            x, y, w, h = (float(box[0]), float(box[1]), float(box[2]), float(box[3]))
        except (TypeError, ValueError, IndexError):
            continue
        boxes.append((x, y, w, h))
    if not boxes:
        return None
    margin = 18 * EMU_PER_PX
    left = min(x for x, _y, _w, _h in boxes) - margin
    top = min(y for _x, y, _w, _h in boxes) - margin
    right = max(x + w for x, _y, w, _h in boxes) + margin
    bottom = max(y + h for _x, y, _w, h in boxes) + margin
    return (
        left,
        top,
        max(180.0, (right - left) / EMU_PER_PX),
        max(120.0, (bottom - top) / EMU_PER_PX),
    )


def build_transition_graph(diagram: dict[str, Any]) -> dict[str, Any]:
    """Build a stable screen-transition graph from DrawingML node connections."""
    nodes_by_id: dict[str, dict[str, Any]] = {}
    for order, node in enumerate(diagram.get("nodes", [])):
        node_id = str(node.get("id") or "")
        text = str(node.get("text") or "").strip()
        if not node_id or not text:
            continue
        if is_number_pin_id(normalize_pin_id(text)):
            continue
        nodes_by_id[node_id] = {
            "id": node_id,
            "text": text,
            "box": node.get("box"),
            "from": node.get("from"),
            "order": order,
        }

    # Excel draws each screen as an empty "wrapper" box (which connectors attach to
    # via stCxn/endCxn) overlapping a separate text label box. Connectors therefore
    # reference the empty boxes, not the text nodes. Map every shape's box (incl. the
    # empty wrappers in diagram["objects"]) so we can resolve a connector endpoint to
    # the text node whose box it overlaps. This ties each arrow to its real screen.
    shape_box_by_id: dict[str, Any] = {
        str(obj.get("id")): obj.get("box")
        for obj in diagram.get("objects", [])
        if obj.get("id") is not None and obj.get("box")
    }

    def resolve_endpoint(raw_id: Any) -> str:
        endpoint_id = str(raw_id or "")
        if endpoint_id in nodes_by_id:
            return endpoint_id
        box = shape_box_by_id.get(endpoint_id)
        if box:
            return _overlapping_text_node_id(box, nodes_by_id)
        return ""

    # Complete DrawingML id inventory (sp/cxnSp/pic/grpSp) for the dangling test.
    # Fall back to the sp-only objects list when the full set is unavailable.
    all_object_ids: set[str] = set(diagram.get("all_ids") or set()) or {
        str(obj.get("id"))
        for obj in diagram.get("objects", [])
        if obj.get("id") is not None
    }

    edge_keys: set[tuple[str, str]] = set()
    edges: list[dict[str, str]] = []
    # Full connector inventory of every cxnSp that did NOT become a directed
    # transition edge, each with object id / anchor / reason. `state="hard"` marks
    # a genuinely unresolvable connector (a stCxn/endCxn referencing a shape id
    # that does not exist in the drawing = 解決できない → exit 1). `state="soft"`
    # marks connectors that resolve to real shapes but form no transition
    # (decorative line with no connection ids, self-loop, undirected, or an
    # endpoint that lands on a non-text shape); these are recorded, never silently
    # dropped, but do not by themselves fail verification.
    unresolved: list[dict[str, Any]] = []

    def record(connector: dict[str, Any], reason: str, state: str) -> None:
        source = connector.get("from") or (1, 1)
        try:
            anchor = f"{get_column_letter(int(source[1]))}{int(source[0])}"
        except (TypeError, ValueError, IndexError):
            anchor = "?"
        unresolved.append(
            {
                "id": connector.get("id"),
                "anchor": anchor,
                "from": connector.get("from"),
                "reason": reason,
                "state": state,
                "connections": connector.get("connections") or {},
            }
        )

    for connector in diagram.get("connectors", []):
        con = connector.get("connections") or {}
        raw_start = con.get("start_id")
        raw_end = con.get("end_id")
        start = resolve_endpoint(raw_start)
        end = resolve_endpoint(raw_end)
        # Endpoints resolved purely from explicit stCxn/endCxn ids are facts.
        explicit_resolved = start in nodes_by_id and end in nodes_by_id

        # Fill only the missing side by nearest-node geometry. A near-tie (non
        # unique) geometry guess is treated as ambiguous: no edge is inferred and
        # the connector is recorded (never silently guessed into a fact).
        inferred = False
        if not explicit_resolved:
            points = connector_points_emu(connector)
            if len(points) >= 2:
                if start not in nodes_by_id:
                    gid, gambiguous = nearest_node_id_detail(points[0], nodes_by_id)
                    if gid and gambiguous:
                        record(connector, "ambiguous_geometry", "soft")
                        continue
                    if gid:
                        start = gid
                        inferred = True
                if end not in nodes_by_id:
                    gid, gambiguous = nearest_node_id_detail(points[-1], nodes_by_id)
                    if gid and gambiguous:
                        record(connector, "ambiguous_geometry", "soft")
                        continue
                    if gid:
                        end = gid
                        inferred = True

        if start in nodes_by_id and end in nodes_by_id and start != end:
            arrows = connector.get("arrows") or {}
            if arrows.get("tail"):
                source, target = start, end
            elif arrows.get("head"):
                source, target = end, start
            else:
                # Resolved endpoints but no arrowhead: undirected, recorded only.
                record(connector, "undirected", "soft")
                continue
            key = (source, target)
            if key in edge_keys:
                continue
            edge_keys.add(key)
            resolution = "geometry_inferred" if inferred else "resolved"
            edges.append(
                {
                    "source": source,
                    "target": target,
                    "connector": connector,
                    "resolution": resolution,
                    "inferred": inferred,
                }
            )
            # A geometry-inferred edge is still drawn (skill L37-38 permits
            # geometry-placed arrows) but is NOT presented as a confirmed
            # transition: it is flagged in the transition list and recorded in the
            # connector ledger. STRICT_INFERRED_CONNECTORS escalates it to hard.
            if inferred:
                record(
                    connector,
                    "geometry_inferred",
                    "hard" if STRICT_INFERRED_CONNECTORS else "soft",
                )
            continue

        # Not a directed edge — classify why so nothing is silently dropped.
        if raw_start is None and raw_end is None:
            record(connector, "no_connection", "soft")
        elif start in nodes_by_id and end in nodes_by_id and start == end:
            record(connector, "self_loop", "soft")
        else:
            dangling = (
                raw_start is not None and str(raw_start) not in all_object_ids
            ) or (raw_end is not None and str(raw_end) not in all_object_ids)
            if dangling:
                # A connection id points at a shape absent from the drawing:
                # genuinely 解決できない → hard (verification exit 1).
                record(connector, "dangling_reference", "hard")
            else:
                # Endpoint resolves to an existing but non-text/decorative shape.
                record(connector, "non_text_endpoint", "soft")

    # Collapse duplicate screen boxes into one logical node. Excel diagrams often
    # draw a single screen as many overlapping/repeated shapes (e.g. 0202 では
    # 20種類の画面が117個のシェイプで描かれる)。テキスト単位で統合しないと自動
    # レイアウトが重複ノードで巨大化して読めなくなるため、同名ノードを1つに畳む。
    text_rep: dict[str, str] = {}
    for node in nodes_by_id.values():
        text_rep.setdefault(_collapse_text_key(node["text"]), node["id"])
    id_to_rep = {
        node_id: text_rep[_collapse_text_key(node["text"])]
        for node_id, node in nodes_by_id.items()
    }

    collapsed_by_id = {rep_id: nodes_by_id[rep_id] for rep_id in set(text_rep.values())}
    collapsed_edge_keys: set[tuple[str, str]] = set()
    collapsed_edges: list[dict[str, str]] = []
    for edge in edges:
        source = id_to_rep.get(edge["source"], edge["source"])
        target = id_to_rep.get(edge["target"], edge["target"])
        if source == target or source not in collapsed_by_id or target not in collapsed_by_id:
            continue
        key = (source, target)
        if key in collapsed_edge_keys:
            continue
        collapsed_edge_keys.add(key)
        collapsed_edges.append(
            {
                "source": source,
                "target": target,
                "connector": edge.get("connector"),
                "resolution": edge.get("resolution", "resolved"),
                "inferred": edge.get("inferred", False),
            }
        )

    connected = {edge["source"] for edge in collapsed_edges} | {edge["target"] for edge in collapsed_edges}
    nodes = [
        node
        for node in collapsed_by_id.values()
        if node["id"] in connected or not collapsed_edges
    ]
    nodes.sort(key=transition_node_sort_key)
    return {
        "nodes": nodes,
        "nodes_by_id": collapsed_by_id,
        "edges": collapsed_edges,
        "unresolved": unresolved,
    }


def _collapse_text_key(text: str) -> str:
    """Normalize a node label so duplicate screen boxes merge into one node."""
    return re.sub(r"\s+", "", str(text or ""))


def _overlapping_text_node_id(box: Any, nodes_by_id: dict[str, dict[str, Any]]) -> str:
    """Return the text node whose box overlaps `box` the most (else "").

    Connectors attach to empty wrapper boxes; this maps such a box to the
    overlapping screen-label node so the arrow ties to its real screen.
    """
    try:
        bx, by, bw, bh = (float(box[0]), float(box[1]), float(box[2]), float(box[3]))
    except (TypeError, ValueError, IndexError):
        return ""
    best_id = ""
    best_overlap = 0.0
    for node_id, node in nodes_by_id.items():
        nbox = node.get("box")
        if not nbox:
            continue
        try:
            nx, ny, nw, nh = (float(nbox[0]), float(nbox[1]), float(nbox[2]), float(nbox[3]))
        except (TypeError, ValueError, IndexError):
            continue
        overlap_w = max(0.0, min(bx + bw, nx + nw) - max(bx, nx))
        overlap_h = max(0.0, min(by + bh, ny + nh) - max(by, ny))
        area = overlap_w * overlap_h
        if area > best_overlap:
            best_overlap = area
            best_id = node_id
    return best_id


def connector_endpoint_node_ids(
    connector: dict[str, Any],
    nodes_by_id: dict[str, dict[str, Any]],
) -> tuple[str, str]:
    """Resolve connector endpoints by geometry when DrawingML IDs miss text nodes."""
    points = connector_points_emu(connector)
    if len(points) < 2:
        return "", ""
    return (
        nearest_node_id(points[0], nodes_by_id),
        nearest_node_id(points[-1], nodes_by_id),
    )


def nearest_node_id(
    point: tuple[float, float],
    nodes_by_id: dict[str, dict[str, Any]],
) -> str:
    node_id, _ambiguous = nearest_node_id_detail(point, nodes_by_id)
    return node_id


def nearest_node_id_detail(
    point: tuple[float, float],
    nodes_by_id: dict[str, dict[str, Any]],
) -> tuple[str, bool]:
    """Return (nearest-node-id, ambiguous) for a point, within the box limit.

    ambiguous is True when a second candidate lies at a near-identical distance
    (a tie), so the geometry guess is not unique. Returns ("", False) when no node
    falls inside the distance limit. Callers must not adopt an ambiguous guess as a
    confirmed transition.
    """
    px, py = point
    scored: list[tuple[float, str]] = []
    for node_id, node in nodes_by_id.items():
        box = node.get("box")
        if not box:
            continue
        try:
            x, y, w, h = (float(box[0]), float(box[1]), float(box[2]), float(box[3]))
        except (TypeError, ValueError, IndexError):
            continue
        dx = max(x - px, 0.0, px - (x + w))
        dy = max(y - py, 0.0, py - (y + h))
        dist = (dx * dx + dy * dy) ** 0.5
        if dist > max(w, h) * 1.5:
            continue
        scored.append((dist, node_id))
    if not scored:
        return "", False
    scored.sort(key=lambda item: (item[0], item[1]))
    best_dist, best_id = scored[0]
    # Near-tie within 15% (plus a 1px slack for exact ties at distance 0).
    ambiguous = len(scored) >= 2 and scored[1][0] <= best_dist * 1.15 + EMU_PER_PX
    return best_id, ambiguous


def connector_points_emu(connector: dict[str, Any]) -> list[tuple[float, float]]:
    """Return connector polyline points in absolute EMU coordinates."""
    return diagram_connector_points_emu(connector)


def transition_node_sort_key(node: dict[str, Any]) -> tuple[float, float, int, str]:
    box = node.get("box") or (0, 0, 0, 0)
    try:
        x, y = float(box[0]), float(box[1])
    except (TypeError, ValueError, IndexError):
        x = y = 0.0
    return y, x, int(node.get("order", 0)), str(node.get("text", ""))


def layout_transition_graph(graph: dict[str, Any]) -> dict[str, Any]:
    """Lay out a directed graph in deterministic columns, independent of Excel shape geometry."""
    nodes = graph["nodes"]
    edges = graph["edges"]
    ids = [node["id"] for node in nodes]
    out: dict[str, list[str]] = {node_id: [] for node_id in ids}
    indeg: dict[str, int] = {node_id: 0 for node_id in ids}
    for edge in edges:
        source = edge["source"]
        target = edge["target"]
        if source not in out or target not in indeg:
            continue
        out[source].append(target)
        indeg[target] += 1

    id_to_node = {node["id"]: node for node in nodes}
    roots = [node_id for node_id in ids if out[node_id] and indeg[node_id] == 0]
    if not roots and ids:
        roots = [min(ids, key=lambda node_id: transition_node_sort_key(id_to_node[node_id]))]

    rank: dict[str, int] = {node_id: 0 for node_id in ids}
    remaining = dict(indeg)
    queue = list(roots)
    seen: set[str] = set()
    while queue:
        current = queue.pop(0)
        seen.add(current)
        for target in out.get(current, []):
            rank[target] = max(rank[target], rank[current] + 1)
            remaining[target] = max(0, remaining[target] - 1)
            if remaining[target] == 0 and target not in seen and target not in queue:
                queue.append(target)

    for node_id in ids:
        if node_id not in seen and indeg[node_id] == 0:
            rank[node_id] = 0
        elif node_id not in seen:
            preds = [edge["source"] for edge in edges if edge["target"] == node_id and edge["source"] in seen]
            rank[node_id] = max((rank[pred] + 1 for pred in preds), default=rank[node_id])

    columns: dict[int, list[dict[str, Any]]] = defaultdict(list)
    for node in nodes:
        columns[rank[node["id"]]].append(node)
    for col_nodes in columns.values():
        col_nodes.sort(key=transition_node_sort_key)

    node_w = 180
    x_gap = 96
    y_gap = 18
    margin = 24
    positions: dict[str, dict[str, float]] = {}
    max_bottom = margin
    for col in sorted(columns):
        y = margin
        x = margin + col * (node_w + x_gap)
        for node in columns[col]:
            height = transition_node_height(node["text"])
            positions[node["id"]] = {"x": x, "y": y, "w": node_w, "h": height}
            y += height + y_gap
        max_bottom = max(max_bottom, y - y_gap + margin)

    width = margin * 2 + (max(columns.keys(), default=0) + 1) * node_w + max(columns.keys(), default=0) * x_gap
    height = max(180, int(max_bottom))
    return {"nodes": positions, "width": int(width), "height": height}


def transition_node_height(text: str) -> int:
    lines = 0
    for line in text.splitlines() or [text]:
        lines += max(1, (len(line) + 9) // 10)
    return max(54, 22 + lines * 18)


def _node_excel_ref(node: dict[str, Any], book_no: str, sheet_title: str) -> str:
    """Return the book:sheet!cell citation for a diagram node's anchor."""
    source = node.get("from")
    if not source:
        return ""
    try:
        return (
            f"{book_no}:{sheet_title}!"
            f"{get_column_letter(int(source[1]))}{int(source[0])}"
        )
    except (TypeError, ValueError, IndexError):
        return ""


def _connector_excel_ref(
    connector: dict[str, Any], book_no: str, sheet_title: str
) -> str:
    """Return the book:sheet!cell citation for a connector's anchor cell."""
    source = connector.get("from")
    if not source:
        return ""
    try:
        return (
            f"{book_no}:{sheet_title}!"
            f"{get_column_letter(int(source[1]))}{int(source[0])}"
        )
    except (TypeError, ValueError, IndexError):
        return ""


def render_transition_node(
    node: dict[str, Any],
    pos: dict[str, float],
    book_no: str = "",
    sheet_title: str = "",
) -> str:
    css = (
        f"left:{pos['x']:.0f}px;top:{pos['y']:.0f}px;"
        f"width:{pos['w']:.0f}px;height:{pos['h']:.0f}px"
    )
    ref = _node_excel_ref(node, book_no, sheet_title)
    ref_attr = f' data-excel-ref="{escape_attr(ref)}"' if ref else ""
    return (
        f'<div class="diagram-node transition-node" style="{escape_attr(css)}"{ref_attr}>'
        f"{escape_multiline(node['text'])}</div>"
    )


def render_transition_edge(
    edge: dict[str, str],
    layout: dict[str, Any],
    marker_id: str,
) -> str:
    source = layout["nodes"].get(edge["source"])
    target = layout["nodes"].get(edge["target"])
    if not source or not target:
        return ""
    x1 = source["x"] + source["w"]
    y1 = source["y"] + source["h"] / 2
    x2 = target["x"]
    y2 = target["y"] + target["h"] / 2
    if x2 <= x1:
        x1 = source["x"] + source["w"] / 2
        y1 = source["y"] + source["h"]
        x2 = target["x"] + target["w"] / 2
        y2 = target["y"]
    mid = (x1 + x2) / 2
    d = f"M {x1:.1f} {y1:.1f} C {mid:.1f} {y1:.1f} {mid:.1f} {y2:.1f} {x2:.1f} {y2:.1f}"
    return (
        f'<path d="{escape_attr(d)}" fill="none" stroke="#5F7048" '
        f'stroke-width="1.8" stroke-linecap="round" marker-end="url(#{escape_attr(marker_id)})"></path>'
    )


def render_transition_table(
    edges: list[dict[str, str]],
    nodes_by_id: dict[str, dict[str, Any]],
    book_no: str = "",
    sheet_title: str = "",
) -> str:
    if not edges:
        return ""

    def row(edge: dict[str, str]) -> str:
        src = nodes_by_id[edge["source"]]
        tgt = nodes_by_id[edge["target"]]
        src_ref = _node_excel_ref(src, book_no, sheet_title)
        tgt_ref = _node_excel_ref(tgt, book_no, sheet_title)
        connector = edge.get("connector") or {}
        connector_id = connector.get("id")
        connector_ref = _connector_excel_ref(connector, book_no, sheet_title)
        src_attr = f' data-excel-ref="{escape_attr(src_ref)}"' if src_ref else ""
        tgt_attr = f' data-excel-ref="{escape_attr(tgt_ref)}"' if tgt_ref else ""
        con_attr = f' data-excel-ref="{escape_attr(connector_ref)}"' if connector_ref else ""
        inferred = bool(edge.get("inferred"))
        # Geometry-inferred edges are visibly flagged as 推定 so an oracle never
        # mistakes a nearest-node guess for a confirmed (explicit-cxn) transition.
        inferred_attr = ' data-transition-inferred="1"' if inferred else ""
        badge = '<span class="inferred-badge">推定</span>' if inferred else ""
        connector_text = "" if connector_id is None else str(connector_id)
        connector_display = f"{connector_text}（{connector_ref}）" if connector_ref else connector_text
        return (
            f'<tr data-connector-id="{escape_attr(connector_text)}"{inferred_attr}>'
            f"<td{src_attr}>{escape_multiline(src['text'])}</td>"
            f"<td{tgt_attr}>{badge}{escape_multiline(tgt['text'])}</td>"
            f"<td{con_attr}>{escape_text(connector_display)}</td>"
            "</tr>"
        )

    rows = "\n".join(
        row(edge)
        for edge in edges
        if edge["source"] in nodes_by_id and edge["target"] in nodes_by_id
    )
    inferred_count = sum(1 for edge in edges if edge.get("inferred"))
    note = (
        f"（うち推定 {inferred_count}件：明示接続でなく最近傍幾何で補完）"
        if inferred_count
        else ""
    )
    return f"""<details class="transition-list">
  <summary>遷移一覧（{len(edges)}件）{escape_text(note)}</summary>
  <div class="item-table-wrap">
    <table class="item-table">
      <thead><tr><th>遷移元</th><th>遷移先</th><th>connector</th></tr></thead>
      <tbody>
{indent(rows, 8)}
      </tbody>
    </table>
  </div>
</details>"""


def render_transition_map(
    graph: dict[str, Any],
    sheet_id: str,
    index: int,
    book_no: str = "",
    sheet_title: str = "",
) -> str:
    """Render a compact relationship map as a supplement for large Excel diagrams."""
    if len(graph["nodes"]) < 8 or len(graph["edges"]) < 6:
        return ""
    layout = layout_transition_graph(graph)
    marker_id = f"diagram-map-arrow-{sheet_id}-{index}"
    edges = "\n".join(
        render_transition_edge(edge, layout, marker_id) for edge in graph["edges"]
    )
    nodes = "\n".join(
        render_transition_node(node, layout["nodes"][node["id"]], book_no, sheet_title)
        for node in graph["nodes"]
    )
    stage_style = f"width:{layout['width']}px;height:{layout['height']}px"
    return f"""<details class="transition-map" open>
  <summary>接続関係整理図</summary>
  <div class="diagram-viewport">
    <div class="diagram-stage transition-stage" style="{escape_attr(stage_style)}">
      <svg class="diagram-lines" viewBox="0 0 {layout['width']} {layout['height']}" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <marker id="{escape_attr(marker_id)}" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto" markerUnits="strokeWidth">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#5F7048"></path>
          </marker>
        </defs>
{indent(edges, 8)}
      </svg>
{indent(nodes, 6)}
    </div>
  </div>
</details>"""


def render_diagram_node(
    node: dict[str, Any],
    stage_left: float,
    stage_top: float,
    book_no: str = "",
    sheet_title: str = "",
) -> str:
    box = node.get("box")
    if not box:
        return ""
    x, y, w, h = (float(box[0]), float(box[1]), float(box[2]), float(box[3]))
    x_px = (x - stage_left) / EMU_PER_PX
    y_px = (y - stage_top) / EMU_PER_PX
    w_px = max(12.0, w / EMU_PER_PX)
    h_px = max(12.0, h / EMU_PER_PX)
    style = node.get("style") or {}
    line = style.get("line") or {}
    fill = style.get("fill") or "#FFFFFF"
    stroke = line.get("color") or "#5F7048"
    stroke_w = max(1.0, float(line.get("width") or 1.0))
    css = (
        f"left:{x_px:.1f}px;top:{y_px:.1f}px;"
        f"width:{w_px:.1f}px;height:{h_px:.1f}px;"
        f"--diagram-fill:{fill};--diagram-stroke:{stroke};"
        f"--diagram-stroke-w:{stroke_w:.1f}px"
    )
    geom = str(node.get("geom") or "rect")
    cls = "diagram-node"
    if geom in {"roundRect", "ellipse"}:
        cls += f" diagram-node-{geom}"
    ref_attr = ""
    source = node.get("from")
    if source:
        try:
            node_ref = (
                f"{book_no}:{sheet_title}!"
                f"{get_column_letter(int(source[1]))}{int(source[0])}"
            )
            ref_attr = f' data-excel-ref="{escape_attr(node_ref)}"'
        except (TypeError, ValueError, IndexError):
            ref_attr = ""
    return (
        f'<div class="{escape_attr(cls)}" style="{escape_attr(css)}"{ref_attr}>'
        f"{escape_multiline(node.get('text', ''))}</div>"
    )


def render_diagram_connector(
    connector: dict[str, Any],
    points: list[tuple[float, float]],
    marker_id: str,
) -> str:
    if len(points) < 2:
        return ""
    d = "M " + " L ".join(f"{x:.1f} {y:.1f}" for x, y in points)
    style = connector.get("style") or {}
    stroke = style.get("color") or "#5F7048"
    stroke_w = max(1.0, float(style.get("width") or 1.0))
    arrows = connector.get("arrows") or {}
    marker_start = f' marker-start="url(#{escape_attr(marker_id)})"' if arrows.get("head") else ""
    marker_end = f' marker-end="url(#{escape_attr(marker_id)})"' if arrows.get("tail") else ""
    return (
        f'<path d="{escape_attr(d)}" fill="none" stroke="{escape_attr(stroke)}" '
        f'stroke-width="{stroke_w:.1f}" stroke-linecap="round" '
        f'stroke-linejoin="round"{marker_start}{marker_end}></path>'
    )


def diagram_connector_routes(
    connectors: list[dict[str, Any]],
    stage_left: float,
    stage_top: float,
    objects_by_id: dict[str, dict[str, Any]] | None = None,
) -> list[list[tuple[float, float]]]:
    routes = [
        diagram_connector_points(connector, stage_left, stage_top, objects_by_id or {})
        for connector in connectors
    ]
    return separate_fanout_routes(connectors, routes)


def separate_fanout_routes(
    connectors: list[dict[str, Any]],
    routes: list[list[tuple[float, float]]],
) -> list[list[tuple[float, float]]]:
    """Spread connectors that leave the same connection site.

    Excel diagrams often fan many arrows out of one node through one shared
    trunk. Keeping that trunk exactly makes the HTML hard to read, so add a
    short local lane near the source while keeping the first and last points
    attached to their shapes.
    """
    groups: dict[tuple[int, int, int, int], list[int]] = {}
    for idx, (connector, points) in enumerate(zip(connectors, routes, strict=False)):
        if len(points) < 3:
            continue
        con = connector.get("connections") or {}
        direction = connection_site_direction(con.get("start_idx"))
        if direction == (0, 0):
            continue
        sx, sy = points[0]
        groups.setdefault(
            (round(sx), round(sy), direction[0], direction[1]),
            [],
        ).append(idx)

    adjusted = [list(points) for points in routes]
    for indexes in groups.values():
        if len(indexes) < 2:
            continue
        ordered = sorted(indexes, key=lambda item: route_sort_key(routes[item]))
        center = (len(ordered) - 1) / 2
        for lane, route_index in enumerate(ordered):
            offset = (lane - center) * 12.0
            if abs(offset) < 0.1:
                continue
            connector = connectors[route_index]
            direction = connection_site_direction(
                (connector.get("connections") or {}).get("start_idx")
            )
            adjusted[route_index] = add_fanout_lane(adjusted[route_index], direction, offset)
    return adjusted


def route_sort_key(points: list[tuple[float, float]]) -> tuple[float, float]:
    if not points:
        return (0.0, 0.0)
    end = points[-1]
    return (end[1], end[0])


def add_fanout_lane(
    points: list[tuple[float, float]],
    direction: tuple[int, int],
    offset: float,
) -> list[tuple[float, float]]:
    if len(points) < 3:
        return points
    sx, sy = points[0]
    lane = 24.0
    rest = list(points[1:])
    if direction[0] != 0:
        stub = (sx + direction[0] * lane, sy)
        lane_start = (stub[0], sy + offset)
        rest[0] = (rest[0][0], sy + offset)
        return simplify_polyline([points[0], stub, lane_start, *rest])
    if direction[1] != 0:
        stub = (sx, sy + direction[1] * lane)
        lane_start = (sx + offset, stub[1])
        rest[0] = (sx + offset, rest[0][1])
        return simplify_polyline([points[0], stub, lane_start, *rest])
    return points


def simplify_polyline(points: list[tuple[float, float]]) -> list[tuple[float, float]]:
    simplified: list[tuple[float, float]] = []
    for point in points:
        if simplified and distance_points(simplified[-1], point) < 0.5:
            continue
        simplified.append(point)
    return simplified


def simplify_polyline_emu(points: list[tuple[float, float]]) -> list[tuple[float, float]]:
    simplified: list[tuple[float, float]] = []
    for point in points:
        if simplified and distance_points(simplified[-1], point) < EMU_PER_PX:
            continue
        simplified.append(point)
    return simplified


def distance_points(
    first: tuple[float, float],
    second: tuple[float, float],
) -> float:
    return math.hypot(first[0] - second[0], first[1] - second[1])


def diagram_connector_points(
    connector: dict[str, Any],
    stage_left: float,
    stage_top: float,
    objects_by_id: dict[str, dict[str, Any]] | None = None,
) -> list[tuple[float, float]]:
    return [
        ((x - stage_left) / EMU_PER_PX, (y - stage_top) / EMU_PER_PX)
        for x, y in diagram_connector_points_emu(connector, objects_by_id or {})
    ]


def diagram_connector_points_emu(
    connector: dict[str, Any],
    objects_by_id: dict[str, dict[str, Any]] | None = None,
) -> list[tuple[float, float]]:
    """Return connector polyline points in absolute EMU coordinates."""
    objects_by_id = objects_by_id or {}
    box = connector.get("box")
    if not box:
        return []
    x, y, w, h = (float(box[0]), float(box[1]), float(box[2]), float(box[3]))
    w = max(0.0, w)
    h = max(0.0, h)
    geom = connector.get("geom") or "line"

    if geom in {"line", "straightConnector1"}:
        points = [(0.0, 0.0), (w, h)]
    elif geom == "bentConnector2":
        points = [(0.0, 0.0), (w, 0.0), (w, h)]
    elif geom == "bentConnector4":
        mid = w / 2
        points = [(0.0, 0.0), (mid, 0.0), (mid, h), (w, h)]
    else:
        points = [(0.0, 0.0), (0.0, h), (w, h)]

    if connector.get("flip_h"):
        points = [(w - px, py) for px, py in points]
    if connector.get("flip_v"):
        points = [(px, h - py) for px, py in points]
    absolute_points = [(x + px, y + py) for px, py in points]

    con = connector.get("connections") or {}
    start = diagram_connection_point_emu(
        objects_by_id.get(str(con.get("start_id") or "")),
        con.get("start_idx"),
    )
    end = diagram_connection_point_emu(
        objects_by_id.get(str(con.get("end_id") or "")),
        con.get("end_idx"),
    )
    if start is None or end is None:
        return absolute_points
    if geom in {"line", "straightConnector1"}:
        return [start, end]
    return orthogonal_connector_points(start, end, con.get("start_idx"), con.get("end_idx"))


def excel_bend_connector_points(
    start: tuple[float, float],
    end: tuple[float, float],
    excel_points: list[tuple[float, float]],
    start_idx: Any,
    end_idx: Any,
) -> list[tuple[float, float]]:
    """Keep Excel's bend geometry while snapping endpoints to connection sites."""
    if len(excel_points) < 3:
        return orthogonal_connector_points(start, end, start_idx, end_idx)
    middle = list(excel_points[1:-1])
    if not middle:
        return orthogonal_connector_points(start, end, start_idx, end_idx)

    if len(middle) == 1:
        mx, my = middle[0]
        start_dir = connection_site_direction(start_idx)
        end_dir = connection_site_direction(end_idx)
        if start_dir[0] != 0 or end_dir[0] != 0:
            return simplify_polyline_emu([start, (mx, start[1]), (mx, end[1]), end])
        return simplify_polyline_emu([start, (start[0], my), (end[0], my), end])

    start_dir = connection_site_direction(start_idx)
    end_dir = connection_site_direction(end_idx)
    if start_dir[0] != 0:
        middle[0] = (middle[0][0], start[1])
    elif start_dir[1] != 0:
        middle[0] = (start[0], middle[0][1])

    if end_dir[0] != 0:
        middle[-1] = (middle[-1][0], end[1])
    elif end_dir[1] != 0:
        middle[-1] = (end[0], middle[-1][1])

    points = [start, *middle, end]
    return simplify_polyline_emu(points)


def orthogonal_connector_points(
    start: tuple[float, float],
    end: tuple[float, float],
    start_idx: Any,
    end_idx: Any,
) -> list[tuple[float, float]]:
    """Route an Excel elbow connector through shape connection sites."""
    sx, sy = start
    ex, ey = end
    if abs(sx - ex) < 1.0 or abs(sy - ey) < 1.0:
        return [start, end]
    start_dir = connection_site_direction(start_idx)
    end_dir = connection_site_direction(end_idx)
    if start_dir[0] == 0 and end_dir[0] != 0:
        elbow = (sx, ey)
        return [start, elbow, end]
    if start_dir[0] != 0 and end_dir[0] == 0:
        elbow = (ex, sy)
        return [start, elbow, end]
    if start_dir[1] == 0 and end_dir[1] == 0:
        mid_x = (sx + ex) / 2
        return [start, (mid_x, sy), (mid_x, ey), end]
    mid_y = (sy + ey) / 2
    return [start, (sx, mid_y), (ex, mid_y), end]


def connection_site_direction(idx: Any) -> tuple[int, int]:
    try:
        site = int(idx)
    except (TypeError, ValueError):
        site = -1
    if site == 0:
        return (0, -1)
    if site == 1:
        return (-1, 0)
    if site == 2:
        return (0, 1)
    if site == 3:
        return (1, 0)
    return (0, 0)


def diagram_connection_point(
    obj: dict[str, Any] | None,
    idx: Any,
    stage_left: float,
    stage_top: float,
) -> tuple[float, float] | None:
    """Return a DrawingML connection site on a shape as stage pixels."""
    if not obj or not obj.get("box"):
        return None
    try:
        x, y, w, h = (float(value) for value in obj["box"])
    except (TypeError, ValueError):
        return None
    left = (x - stage_left) / EMU_PER_PX
    top = (y - stage_top) / EMU_PER_PX
    width = w / EMU_PER_PX
    height = h / EMU_PER_PX
    try:
        site = int(idx)
    except (TypeError, ValueError):
        site = -1
    # Preset shapes used in these design docs follow Excel's common connection
    # site order: top, left, bottom, right.
    if site == 0:
        return left + width / 2, top
    if site == 1:
        return left, top + height / 2
    if site == 2:
        return left + width / 2, top + height
    if site == 3:
        return left + width, top + height / 2
    return left + width / 2, top + height / 2


def diagram_connection_point_emu(
    obj: dict[str, Any] | None,
    idx: Any,
) -> tuple[float, float] | None:
    """Return a DrawingML connection site on a shape as absolute EMUs."""
    if not obj or not obj.get("box"):
        return None
    try:
        x, y, w, h = (float(value) for value in obj["box"])
    except (TypeError, ValueError):
        return None
    try:
        site = int(idx)
    except (TypeError, ValueError):
        site = -1
    if site == 0:
        return x + w / 2, y
    if site == 1:
        return x, y + h / 2
    if site == 2:
        return x + w / 2, y + h
    if site == 3:
        return x + w, y + h / 2
    return x + w / 2, y + h / 2


def build_merged_maps(
    worksheet: Any,
) -> tuple[
    dict[tuple[int, int], tuple[int, int, int, int]],
    dict[tuple[int, int], tuple[int, int]],
]:
    """Map each merge anchor to its original bounds, and each covered cell to its anchor."""
    anchor_bounds: dict[tuple[int, int], tuple[int, int, int, int]] = {}
    cover_to_anchor: dict[tuple[int, int], tuple[int, int]] = {}
    for merged_range in worksheet.merged_cells.ranges:
        min_col, min_row, max_col, max_row = merged_range.bounds
        anchor_bounds[(min_row, min_col)] = (min_row, min_col, max_row, max_col)
        for row_index in range(min_row, max_row + 1):
            for col_index in range(min_col, max_col + 1):
                if (row_index, col_index) != (min_row, min_col):
                    cover_to_anchor[(row_index, col_index)] = (min_row, min_col)
    return anchor_bounds, cover_to_anchor


def format_cell_value(value: Any, number_format: str | None = None) -> str:
    if value is None:
        return ""
    if isinstance(value, CellRichText):
        parts: list[str] = []
        for part in value:
            if isinstance(part, TextBlock):
                parts.append(format_cell_value(part.text, number_format))
            else:
                parts.append(str(part))
        return "".join(parts)
    if isinstance(value, datetime):
        formatted = format_excel_date(value, number_format)
        if formatted is not None:
            return formatted
        if value.time() == time(0, 0):
            return value.strftime("%Y-%m-%d")
        return value.strftime("%Y-%m-%d %H:%M:%S")
    if isinstance(value, date):
        formatted = format_excel_date(value, number_format)
        if formatted is not None:
            return formatted
        return value.strftime("%Y-%m-%d")
    if isinstance(value, time):
        return value.strftime("%H:%M:%S")
    return str(value)


def format_excel_date(value: date | datetime, number_format: str | None) -> str | None:
    """Return Excel-like display text for date formats used as item identifiers."""
    fmt = (number_format or "").lower().replace("\\", "").strip()
    month = value.month
    day = value.day
    if fmt in {"m-d", "m/d", "m.d"}:
        sep = fmt[1]
        return f"{month}{sep}{day}"
    if fmt in {"mm-dd", "mm/dd", "mm.dd"}:
        sep = fmt[2]
        return f"{month:02d}{sep}{day:02d}"
    return None


def cell_text_runs(
    cell: Any,
    xml_cell: dict[str, Any] | None = None,
    value: Any = _UNSET,
) -> list[dict[str, Any]]:
    """Return display text split into runs that preserve Excel strike style.

    When ``xml_cell`` (an OOXML direct-read cell model) is supplied, strike/bold
    come from the XML run/cell-font model (canonical, run-level, cell inheritance,
    `<strike val="0">`=false); otherwise it falls back to openpyxl's font flags so
    existing callers (e.g. verify.py) keep their behaviour. ``value`` overrides
    ``cell.value`` for formula cells whose cached display value is loaded
    separately with data_only=True.
    """
    number_format = getattr(cell, "number_format", None)
    # Canonical path: OOXML string cells use their XML run-level strike/bold.
    # Do NOT trim here — the raw run text (including xml:space="preserve" leading/
    # trailing whitespace) is the source spec and must survive verbatim, exactly
    # like formula bodies. Whether the cell is dropped as "empty" is decided by
    # the caller on the joined text, not by mutating the cell's own characters.
    if xml_cell is not None and xml_cell.get("is_string") and xml_cell.get("runs"):
        return [
            {
                "text": run["text"],
                "strike": bool(run.get("strike")),
                "bold": bool(run.get("bold")),
            }
            for run in xml_cell["runs"]
            if run["text"] != ""
        ]

    value = cell.value if value is _UNSET else value
    if xml_cell is not None:
        cell_strike = bool(xml_cell.get("cell_strike"))
        cell_bold = bool(xml_cell.get("cell_bold"))
    else:
        cell_strike = bool(getattr(cell.font, "strike", False))
        cell_bold = bool(getattr(cell.font, "bold", False))
    runs: list[dict[str, Any]] = []
    if isinstance(value, CellRichText):
        for part in value:
            if isinstance(part, TextBlock):
                text = format_cell_value(part.text, number_format)
                font = part.font
                strike = bool(getattr(font, "strike", False)) or cell_strike
                bold = (
                    bool(getattr(font, "b", False))
                    or bool(getattr(font, "bold", False))
                    or cell_bold
                )
            else:
                text = str(part)
                strike = cell_strike
                bold = cell_bold
            runs.append({"text": text, "strike": strike, "bold": bold})
    else:
        text = format_cell_value(value, number_format)
        runs.append({"text": text, "strike": cell_strike, "bold": cell_bold})
    return trim_text_runs(runs)


def apply_strike_exclusion(runs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Drop struck runs from a cell's text (出力除外規約).

    Partially struck cells keep their surviving runs (re-trimmed so the removal
    does not leave stray leading/trailing whitespace); a fully struck cell
    collapses to no runs, and the caller then drops the cell as empty. Detection
    itself is untouched — `cell_text_runs` still reports the strike flags, which
    is what verify.py compares against.
    """
    if RENDER_STRUCK_TEXT:
        return runs
    kept = [run for run in runs if not run.get("strike")]
    if len(kept) == len(runs):
        return runs
    return trim_text_runs(kept)


def struck_run_texts(runs: list[dict[str, Any]]) -> list[str]:
    """Texts removed by the strike-exclusion policy (for ledgers/diagnostics)."""
    return [run["text"] for run in runs if run.get("strike") and run.get("text")]


def trim_text_runs(runs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Mirror the previous cell text .strip() behavior without losing run style."""
    copied = [dict(run) for run in runs if run.get("text")]
    while copied and not copied[0]["text"].strip():
        copied.pop(0)
    while copied and not copied[-1]["text"].strip():
        copied.pop()
    if not copied:
        return []
    copied[0]["text"] = copied[0]["text"].lstrip()
    copied[-1]["text"] = copied[-1]["text"].rstrip()
    return [run for run in copied if run["text"]]


def render_warnings(warnings: list[str]) -> str:
    if not warnings:
        return ""
    items = "\n".join(f"<li>{escape_text(message)}</li>" for message in warnings)
    return f"""<section class="conversion-warnings">
  <h2>未変換要素</h2>
  <ul>
{indent(items, 4)}
  </ul>
</section>"""


def escape_text(value: Any) -> str:
    return html.escape(str(value), quote=False)


def escape_attr(value: Any) -> str:
    return html.escape(str(value), quote=True)


def escape_cell_text(value: str) -> str:
    return html.escape(value, quote=False)


def escape_multiline(value: Any) -> str:
    """Escape text and turn in-cell line breaks into <br> for HTML display."""
    return escape_text(value).replace("\n", "<br>")


def render_cell_text(cell: dict[str, Any] | None) -> str:
    if cell is None:
        return ""
    runs = cell.get("runs") or [
        {"text": cell.get("text", ""), "strike": cell.get("strike", False)}
    ]
    rendered: list[str] = []
    for run in runs:
        text = escape_multiline(run.get("text", ""))
        if not text:
            continue
        if run.get("strike"):
            text = f'<span class="cell-strike">{text}</span>'
        rendered.append(text)
    inner = "".join(rendered)
    ref = cell.get("ref")
    if not ref:
        return inner
    # Wrap each source cell so its real Excel coordinate is machine-citable via
    # data-excel-ref. The visible reference chip is rendered from this attribute
    # by CSS (::after), so it never pollutes the readable text nor is it
    # permanently hidden (shown on hover and via the 参照ID toggle).
    formula_attr = (
        f' data-excel-formula="{escape_attr(cell["formula"])}"'
        if cell.get("formula")
        else ""
    )
    return (
        f'<span class="src-cell" data-excel-book="{escape_attr(cell.get("book", ""))}"'
        f' data-excel-sheet="{escape_attr(cell.get("sheet", ""))}"'
        f' data-excel-ref="{escape_attr(ref)}"{formula_attr}>{inner}</span>'
    )


def join_cell_text(cells: list[dict[str, Any]], sep: str = "　") -> str:
    return sep.join(cell["text"] for cell in cells)


def join_cell_html(cells: list[dict[str, Any]], sep: str = "　") -> str:
    return escape_text(sep).join(render_cell_text(cell) for cell in cells)


def indent(text: str, spaces: int) -> str:
    prefix = " " * spaces
    return "\n".join(prefix + line if line else line for line in text.splitlines())


BASE_CSS = """    :root {
      color-scheme: light;
      /* 標準配色（2アクセント）: 暖色ニュートラル + clay / olive */
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
      --accent: var(--clay);
      --accent-soft: var(--clay-soft);
      /* 既存コンポーネントCSS互換のための旧トークン名エイリアス */
      --page-bg: var(--bg);
      --surface: var(--panel);
      --surface-soft: var(--band);
      --border: var(--line);
      --border-strong: #c4b8a2;
      --heading-bg: var(--band);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--page-bg);
      color: var(--text);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Yu Gothic", "Meiryo", sans-serif;
      font-size: 14px;
      line-height: 1.55;
    }

    .sheet-panel {
      display: none;
    }

    .sheet-panel.is-active {
      display: block;
    }

    .sheet-heading {
      margin-bottom: 14px;
    }

    .sheet-heading h2 {
      margin: 0;
      font-size: 18px;
      line-height: 1.3;
    }

    /* Document body ---------------------------------------------------- */
    .sheet-doc {
      max-width: 1040px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .doc-empty {
      color: var(--muted);
    }

    /* Document-control header card */
    .doc-card {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 1px;
      margin: 0;
      background: var(--border);
      border: 1px solid var(--border);
      border-radius: 10px;
      overflow: hidden;
    }

    .doc-card .kv {
      display: flex;
      gap: 10px;
      padding: 9px 14px;
      background: var(--surface);
    }

    .doc-card dt {
      flex: 0 0 6.5em;
      color: var(--muted);
      font-weight: 600;
    }

    .doc-card dd {
      margin: 0;
      overflow-wrap: anywhere;
    }

    /* Flowing text: headings, paragraphs, bullets */
    .doc-flow {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
      padding: 14px 18px;
    }

    .doc-flow > * {
      margin: 0;
      padding-left: calc(var(--lv, 0) * 1.5em);
    }

    .doc-flow > * + * {
      margin-top: 6px;
    }

    .doc-h {
      line-height: 1.35;
      overflow-wrap: anywhere;
    }

    .doc-h-section {
      margin-top: 4px;
      padding-top: 8px;
      padding-bottom: 6px;
      font-size: 15px;
      font-weight: 700;
      color: var(--text);
      border-bottom: 2px solid var(--accent);
    }

    .doc-flow > .doc-h-section + * {
      margin-top: 8px;
    }

    /* Functional-spec section headings stand apart from the item table. */
    .doc-h-spec {
      scroll-margin-top: 90px;
      padding: 8px 12px;
      background: var(--heading-bg);
      border-bottom: none;
      border-left: 4px solid var(--accent);
      border-radius: 6px;
    }

    .spec-badge {
      display: inline-block;
      margin-right: 8px;
      padding: 1px 8px;
      background: var(--accent);
      color: #ffffff;
      font-size: 11px;
      font-weight: 700;
      border-radius: 999px;
      vertical-align: middle;
    }

    /* In-sheet jump nav to spec sections / shape text. */
    .sheet-jump {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      padding: 10px 12px;
      background: var(--surface-soft);
      border: 1px solid var(--border);
      border-radius: 10px;
    }

    .sheet-jump a {
      padding: 3px 10px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 999px;
      color: var(--accent);
      font-size: 12px;
      text-decoration: none;
    }

    .sheet-jump a:hover {
      border-color: var(--accent);
    }

    .doc-h-sub {
      font-size: 14px;
      font-weight: 700;
      color: var(--text);
    }

    .doc-p {
      overflow-wrap: anywhere;
    }

    .doc-label {
      font-weight: 700;
      margin-right: 0.6em;
    }

    .cell-strike {
      text-decoration: line-through;
      text-decoration-thickness: 1px;
    }

    /* 実Excel座標の参照chip。data-excel-ref から CSS で生成し、可読テキストを
       汚さない。ホバーで表示され、参照ID表示トグルで全件を恒常表示にできる。
       CSS で恒久非表示にはしない。 */
    .src-cell {
      position: relative;
    }
    .src-cell:hover::after,
    body.show-refs .src-cell::after {
      content: attr(data-excel-ref);
      position: absolute;
      left: 0;
      bottom: 100%;
      z-index: 30;
      background: var(--olive);
      color: #fff;
      font-size: 10px;
      line-height: 1.4;
      padding: 1px 5px;
      border-radius: 4px;
      white-space: nowrap;
      pointer-events: none;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    }
    body.show-refs .src-cell {
      outline: 1px dotted var(--line);
      outline-offset: 1px;
    }
    .ref-toggle {
      margin: 8px 0 0;
      padding: 4px 10px;
      font-size: 11px;
      color: var(--muted);
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 6px;
      cursor: pointer;
    }
    .ref-toggle[aria-pressed="true"] {
      color: #fff;
      background: var(--olive);
      border-color: var(--olive);
    }

    .pin-ledger,
    .connector-ledger {
      margin: 10px 0;
      font-size: 12px;
    }
    .pin-ledger > summary,
    .connector-ledger > summary {
      cursor: pointer;
      color: var(--muted);
      font-weight: 600;
    }
    .connector-ledger[data-connector-unresolved]:not([data-connector-unresolved="0"]) > summary {
      color: var(--clay);
    }
    .inferred-badge {
      display: inline-block;
      margin-right: 4px;
      padding: 0 5px;
      font-size: 10px;
      font-weight: 700;
      color: #fff;
      background: var(--clay);
      border-radius: 4px;
      vertical-align: middle;
    }

    .doc-bullet {
      display: flex;
      gap: 0.5em;
      overflow-wrap: anywhere;
    }

    .doc-marker {
      flex: 0 0 auto;
      color: var(--accent);
    }

    /* Real data grids (screen item definitions, CSV formats, …) */
    .item-table-wrap {
      overflow-x: auto;
      border: 1px solid var(--border);
      border-radius: 10px;
    }

    .item-table {
      border-collapse: separate;
      border-spacing: 0;
      width: 100%;
      background: var(--surface);
      font-size: 13px;
    }

    .item-table th,
    .item-table td {
      border: 0;
      border-right: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      padding: 7px 10px;
      text-align: left;
      vertical-align: top;
      overflow-wrap: anywhere;
      background-clip: padding-box;
    }

    .item-table tr > :first-child {
      border-left: 1px solid var(--border);
    }

    .item-table thead tr:first-child > *,
    .item-table > tbody:first-child tr:first-child > * {
      border-top: 1px solid var(--border);
    }

    .item-table thead th {
      position: sticky;
      top: 0;
      background: var(--heading-bg);
      color: var(--text);
      font-weight: 700;
      border-bottom-color: var(--border-strong);
      white-space: nowrap;
    }

    .item-table tbody tr:nth-child(even) td {
      background: #faf5ec;
    }

    .item-table .item-table-section td {
      background: var(--olive-soft) !important;
      color: var(--text);
      font-weight: 700;
    }

    /* Textbox/shape text recovered from DrawingML */
    .shape-block {
      scroll-margin-top: 90px;
      padding: 14px 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-left: 4px solid var(--accent);
      border-radius: 10px;
    }

    .shape-title {
      margin: 0 0 4px;
      font-size: 15px;
      font-weight: 700;
      color: var(--text);
    }

    .shape-note {
      margin: 0 0 10px;
      color: var(--muted);
      font-size: 12px;
    }

    .shape-table .shape-ref {
      white-space: nowrap;
      color: var(--muted);
      font-variant-numeric: tabular-nums;
      width: 1%;
    }

    .shape-object-row td {
      background: transparent;
      padding-top: 6px;
      padding-bottom: 6px;
    }

    .shape-object-stage {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: top;
      max-width: 100%;
    }

    .shape-object-box {
      box-sizing: border-box;
      padding: 18px 24px;
      border-radius: 22px;
      border: var(--shape-stroke-w, 1px) solid var(--shape-stroke, #385D8A);
      background: var(--shape-fill, #4F81BD);
      color: #fff;
      font-size: 14px;
      font-weight: 600;
      line-height: 1.65;
      text-align: center;
      white-space: normal;
      word-break: break-word;
      box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.14);
    }

    /* DrawingML shape diagrams: screen transitions / flow charts */
    .diagram-block {
      display: block;
    }

    .diagram-frame {
      max-width: 100%;
      margin: 0;
      padding: 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
    }

    .diagram-viewport {
      max-width: 100%;
      overflow-x: auto;
      padding-bottom: 4px;
    }

    .diagram-stage {
      position: relative;
      min-width: 640px;
      background: #ffffff;
      background-image:
        linear-gradient(to right, rgba(214, 205, 189, 0.26) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(214, 205, 189, 0.26) 1px, transparent 1px);
      background-size: 24px 24px;
      border: 1px solid var(--line-soft);
    }

    .diagram-lines {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      overflow: visible;
      pointer-events: none;
    }

    .diagram-node {
      position: absolute;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 4px 8px;
      background: var(--diagram-fill, #ffffff);
      border: var(--diagram-stroke-w, 1.5px) solid var(--diagram-stroke, var(--olive));
      color: var(--text);
      font-size: 12px;
      font-weight: 600;
      line-height: 1.25;
      text-align: center;
      overflow-wrap: anywhere;
      white-space: normal;
    }

    .diagram-node-roundRect {
      border-radius: 8px;
    }

    .diagram-node-ellipse {
      border-radius: 999px;
    }

    .transition-stage {
      background-image:
        linear-gradient(to right, rgba(214, 205, 189, 0.18) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(214, 205, 189, 0.18) 1px, transparent 1px);
    }

    .transition-node {
      border-radius: 8px;
      border-color: var(--olive);
      background: #ffffff;
      box-shadow: 0 1px 2px rgba(43, 42, 38, 0.10);
    }

    .transition-list {
      margin-top: 10px;
    }

    .transition-map {
      margin-top: 10px;
      padding: 10px 12px 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
    }

    .transition-map > summary {
      cursor: pointer;
      color: var(--accent);
      font-size: 13px;
      font-weight: 700;
      margin-bottom: 8px;
    }

    .transition-list > summary {
      cursor: pointer;
      color: var(--accent);
      font-size: 13px;
      font-weight: 700;
    }

    .transition-list .item-table-wrap {
      margin-top: 8px;
    }

    .diagram-frame figcaption {
      margin-top: 8px;
      color: var(--muted);
      font-size: 12px;
    }

    /* Images */
    .image-block {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .sheet-image {
      display: inline-flex;
      flex-direction: column;
      gap: 8px;
      max-width: min(100%, 860px);
      margin: 0;
      padding: 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 10px;
    }

    .sheet-image img {
      display: block;
      max-width: 100%;
      height: auto;
      object-fit: contain;
    }

    .sheet-image figcaption {
      color: var(--muted);
      font-size: 12px;
    }

    .conversion-warnings {
      margin-top: 20px;
      padding: 16px;
      background: #fff8e6;
      border: 1px solid #f1d08a;
      border-radius: 8px;
    }

    .conversion-warnings h2 {
      margin: 0 0 8px;
      font-size: 15px;
    }

    .conversion-warnings ul {
      margin: 0;
      padding-left: 20px;
    }

    /* レイアウト図のピン番号オーバーレイ（画面イメージ⇄項目定義の相互リンク） */
    .wf-frame {
      border: 4px solid var(--border-strong);
      border-radius: 12px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, .08);
      padding: 12px;
    }

    .wf-stage {
      position: relative;
      display: inline-block;
      max-width: 100%;
    }

    .wf-stage img {
      display: block;
      max-width: 100%;
      height: auto;
    }

    .image-layer-stage {
      display: block;
      max-width: 100%;
      overflow: visible;
    }

    .image-layer-stage .image-layer-img {
      position: absolute;
      display: block;
      max-width: none;
      object-fit: fill;
    }

    .image-stack {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }

    .image-stack .image-stack-img {
      display: block;
      max-width: 100%;
      height: auto;
    }

    .wf-pin {
      position: absolute;
      z-index: 1000;
      transform: translate(-50%, -50%);
      min-width: 1.6em;
      padding: 1px 6px;
      border-radius: 999px;
      background: var(--clay);
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      line-height: 1.4;
      text-align: center;
      text-decoration: none;
      box-shadow: 0 0 0 2px #fff;
      white-space: nowrap;
    }

    .wf-pin:hover {
      background: var(--olive);
    }

    .wf-pin-plain {
      background: var(--olive);
      cursor: default;
    }

    .wf-pin:target {
      background: var(--olive);
      box-shadow: 0 0 0 3px var(--olive-soft), 0 0 0 5px var(--olive);
    }

    .item-no {
      color: var(--accent);
      font-weight: 700;
      text-decoration: none;
    }

    .item-table tr:target td {
      background: var(--clay-soft) !important;
    }

    .item-table tr:target {
      outline: 2px solid var(--clay);
    }

    .wf-pin,
    .item-table tr[id] {
      scroll-margin-top: 90px;
    }

    /* === html-sidebar-color スキル: ページシェル（サイドバー位置） === */
    /* doc-shell */
    *, *::before, *::after { box-sizing: border-box; }
    .page { display: grid; grid-template-columns: minmax(220px, 280px) minmax(0, 1fr); gap: 30px; max-width: 1800px; margin: 0 auto; padding: 30px 28px 64px; }
    .sidebar { position: sticky; top: 20px; align-self: start; max-height: calc(100vh - 40px); overflow-y: auto; overscroll-behavior: contain; padding: 0 12px 0 0; }
    main.doc-content, .doc-content { min-width: 0; max-width: none; margin: 0; padding: 0; }
    main:not(.doc-content) { max-width: none; margin: 0; padding: 0; }
    @media (max-width: 900px) {
      .page { display: block; padding: 16px; }
      .sidebar { position: static; max-height: none; overflow: visible; margin-bottom: 16px; }
    }

    /* === html-sidebar スキル: 成果物マップ（サイドバー） === */
    .artifact-map { margin: 0 0 20px; padding-bottom: 18px; border-bottom: 1px solid var(--line-soft, #EBE2D3); }
    .artifact-map-root { margin: 0; padding: 0; border: none; }
    .artifact-map-title { margin: 0 0 10px; padding: 0; color: var(--muted); font-size: 11px; font-weight: 600; letter-spacing: 0.06em; border: none; }
    .artifact-map-root:not([open]) > summary.artifact-map-title { margin-bottom: 0; }
    .artifact-map-root > summary.artifact-map-title { cursor: pointer; list-style: none; display: flex; align-items: center; gap: 7px; }
    .artifact-map-root > summary.artifact-map-title::-webkit-details-marker { display: none; }
    .artifact-map-rail { margin: 0; padding: 0 0 0 12px; border-left: 1px solid var(--line-soft, #EBE2D3); }
    .artifact-map summary.artifact-map-title::before,
    .artifact-map details > summary::before { content: ""; display: block; flex: none; width: 6px; height: 6px; background: var(--muted); clip-path: polygon(0 18%, 100% 50%, 0 82%); transform: rotate(0deg); transform-origin: center; transition: transform 0.15s ease; }
    .artifact-map-root[open] > summary.artifact-map-title::before,
    .artifact-map details[open] > summary::before { transform: rotate(90deg); }
    .artifact-map-group { margin: 0 0 16px; padding: 0; border: none; }
    .artifact-map-group:last-child { margin-bottom: 0; }
    .artifact-map-label { margin: 0 0 4px; padding: 0; color: var(--text); font-size: 13px; font-weight: 600; line-height: 1.45; border: none; }
    .artifact-map-body { margin: 0; padding: 0; border: none; }
    .artifact-map-body > ul { margin: 0; padding: 0; list-style: none; }
    .artifact-map-body li { margin: 6px 0; font-size: 13px; line-height: 1.45; }
    .artifact-map-body > details { margin: 6px 0 0; padding: 0; border: none; }
    .artifact-map details > summary { cursor: pointer; margin: 0 0 4px; padding: 0; color: var(--muted); font-size: 13px; font-weight: 500; list-style: none; display: flex; align-items: center; gap: 7px; }
    .artifact-map details > summary::-webkit-details-marker { display: none; }
    .artifact-map-body > details > ul { margin: 0; padding: 0 0 0 18px; list-style: none; }
    .artifact-map details li { margin: 6px 0; }
    .artifact-map a { display: block; position: relative; padding: 0; color: var(--muted); font-weight: 400; text-decoration: none; }
    .artifact-map a:hover { color: var(--text); }
    .artifact-map a[aria-current="page"] { color: var(--accent); font-weight: 600; }
    .artifact-map-body > ul a[aria-current="page"]::before { content: ""; position: absolute; left: -13px; top: 0.15em; bottom: 0.15em; width: 2px; background: var(--accent); }
    .artifact-map details ul a[aria-current="page"]::before { content: ""; position: absolute; left: -31px; top: 0.15em; bottom: 0.15em; width: 2px; background: var(--accent); }
    .sidebar-title { margin: 0 0 14px; padding: 0; color: var(--text); font-size: 11px; font-weight: 600; letter-spacing: 0.06em; }"""


INDEX_CSS = """    :root {
      color-scheme: light;
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

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", "Yu Gothic", "Meiryo", sans-serif;
      font-size: 14px;
      line-height: 1.55;
    }

    .index-page {
      max-width: 1120px;
      margin: 0 auto;
      padding: 34px 24px 64px;
    }

    .index-header {
      margin-bottom: 26px;
      padding-bottom: 18px;
      border-bottom: 1px solid var(--line);
    }

    .eyebrow {
      margin: 0 0 6px;
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    h1 {
      margin: 0;
      font-size: 28px;
      line-height: 1.25;
    }

    .summary {
      margin: 8px 0 0;
      color: var(--muted);
    }

    .index-section {
      margin: 0 0 28px;
    }

    .index-section h2 {
      display: flex;
      align-items: baseline;
      gap: 10px;
      margin: 0 0 10px;
      padding-bottom: 6px;
      border-bottom: 2px solid var(--clay);
      font-size: 18px;
      line-height: 1.35;
    }

    .index-section h2 span {
      color: var(--muted);
      font-size: 13px;
      font-weight: 600;
    }

    .doc-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .doc-list a {
      display: grid;
      grid-template-columns: 58px minmax(0, 1fr);
      gap: 10px;
      min-height: 46px;
      padding: 10px 12px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: var(--panel);
      color: var(--text);
      text-decoration: none;
    }

    .doc-list a:hover {
      border-color: var(--clay);
      background: var(--clay-soft);
    }

    .doc-code {
      color: var(--olive);
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }

    .doc-title {
      min-width: 0;
      overflow-wrap: anywhere;
    }

    @media (max-width: 720px) {
      .index-page {
        padding: 22px 16px 44px;
      }

      h1 {
        font-size: 23px;
      }

      .doc-list {
        grid-template-columns: 1fr;
      }
    }"""


BASE_JS = """    const sheetLinks = document.querySelectorAll(".artifact-map a[data-sheet]");
    sheetLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        event.preventDefault();
        const target = link.dataset.sheet;
        sheetLinks.forEach((item) => {
          if (item === link) {
            item.setAttribute("aria-current", "page");
          } else {
            item.removeAttribute("aria-current");
          }
        });
        document.querySelectorAll(".sheet-panel").forEach((panel) => {
          panel.classList.toggle("is-active", panel.id === target);
        });
      });
    });

    const refToggle = document.getElementById("ref-toggle");
    if (refToggle) {
      refToggle.addEventListener("click", () => {
        const on = document.body.classList.toggle("show-refs");
        refToggle.setAttribute("aria-pressed", on ? "true" : "false");
      });
    }"""


if __name__ == "__main__":
    raise SystemExit(main())
