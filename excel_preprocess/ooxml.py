"""OOXML(.xlsx)の直接読取層。

仕様(T2_EXCEL_PREPROCESS_SPEC.md §3.2)通り、書式・rich-text・strike の正本は
`.xlsx` を `zipfile` + `xml.etree.ElementTree` で直接読む。openpyxl はここでは
一切使わない(補助的な利用は `reconstruct.py` の書き戻し側のみに限定する)。

このモジュールは:
  - workbook.xml / workbook.xml.rels からシート一覧・関係を解決する
  - styles.xml から fonts/fills/borders/numFmts/cellXfs を生データのまま抽出する
  - sharedStrings.xml / inlineStr の run(strike・bold・xml:space)を保存する
  - sheetN.xml から行・列・セル・結合・非表示行・drawing/conditionalFormattingの
    有無を読む
  - `xl/theme/themeN.xml` のテーマ色を解決する

`data_only=True` 相当(キャッシュ値のみを正とする挙動)は行わない。数式は
`<f>` を、キャッシュ値は `<v>`/`<is>` を両方保存する。
"""
from __future__ import annotations

import colorsys
import hashlib
import re
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Optional
import xml.etree.ElementTree as ET

NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
    "xml": "http://www.w3.org/XML/1998/namespace",
}
R_ID = "{%s}id" % NS["r"]
XML_SPACE = "{%s}space" % NS["xml"]


def _q(tag: str) -> str:
    return f"{{{NS['main']}}}{tag}"


def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def resolve_opc_target(source_part: str, target: str) -> str:
    """OPC(OOXML)のrelationship Targetを、参照元パートから解決する。

    `Target` が `/` で始まる場合はパッケージルートからの絶対パス、そうで
    なければ参照元パートの「ディレクトリ」からの相対パスとして解決する
    (ECMA-376 Part 2)。openpyxlが書き出すファイルは worksheet の Target を
    `/xl/worksheets/sheet1.xml` のように絶対形式で出すため、単純な
    `f"xl/{target}"` 連結では壊れる。
    """
    import posixpath

    if target.startswith("/"):
        return target.lstrip("/")
    base_dir = posixpath.dirname(source_part)
    return posixpath.normpath(posixpath.join(base_dir, target))


def col_letters_to_index(letters: str) -> int:
    """'A' -> 1, 'Z' -> 26, 'AA' -> 27 ..."""
    idx = 0
    for ch in letters:
        idx = idx * 26 + (ord(ch.upper()) - ord("A") + 1)
    return idx


def col_index_to_letters(idx: int) -> str:
    letters = ""
    while idx > 0:
        idx, rem = divmod(idx - 1, 26)
        letters = chr(rem + ord("A")) + letters
    return letters


_ADDR_RE = re.compile(r"^([A-Z]+)(\d+)$")


def split_address(addr: str) -> tuple[str, int]:
    m = _ADDR_RE.match(addr)
    if not m:
        raise ValueError(f"invalid cell address: {addr!r}")
    return m.group(1), int(m.group(2))


def make_address(col_letters: str, row: int) -> str:
    return f"{col_letters}{row}"


def _ooxml_bool_element(el) -> bool:
    """OOXMLの真偽値要素(`<b/>`, `<strike/>`, `<i/>` 等)を判定する。

    これらは「要素が存在すれば真」ではない。`val` 属性が省略されていれば真、
    `val="0"`/`val="false"` なら偽(要素自体は存在する)。単純な
    `el is not None` 判定は `<strike val="0"/>` を誤って真と扱うバグになる
    (openpyxlが書き出すファイルで実際に観測)。
    """
    if el is None:
        return False
    val = el.get("val")
    if val is None:
        return True
    return val not in ("0", "false")


_RANGE_RE = re.compile(r"^([A-Z]+)(\d+):([A-Z]+)(\d+)$")


def parse_range(ref: str) -> tuple[int, int, int, int]:
    """'A1:B2' -> (min_row, min_col, max_row, max_col)."""
    m = _RANGE_RE.match(ref)
    if m:
        c1, r1, c2, r2 = m.groups()
        col1, col2 = col_letters_to_index(c1), col_letters_to_index(c2)
        row1, row2 = int(r1), int(r2)
        return min(row1, row2), min(col1, col2), max(row1, row2), max(col1, col2)
    col, row = split_address(ref)
    ci = col_letters_to_index(col)
    return row, ci, row, ci


# ---------------------------------------------------------------------------
# Run / rich text
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class Run:
    text: str
    space_preserve: bool
    explicit_bold: Optional[bool]  # None = no run-level rPr override -> inherits cell font
    explicit_strike: Optional[bool]
    explicit_italic: Optional[bool]
    explicit_underline: Optional[bool]
    explicit_color: Optional[dict]  # resolved color spec (raw, unresolved-to-hex) or None


def _text_space_preserve(t_el) -> bool:
    if t_el is None:
        return False
    return t_el.get(XML_SPACE) == "preserve"


def _parse_rpr_color(rpr) -> Optional[dict]:
    if rpr is None:
        return None
    color_el = rpr.find(_q("color"))
    if color_el is None:
        return None
    return _raw_color_spec(color_el)


def _raw_color_spec(color_el) -> dict:
    spec: dict[str, Any] = {}
    if color_el.get("rgb") is not None:
        spec["rgb"] = color_el.get("rgb")
    if color_el.get("theme") is not None:
        spec["theme"] = int(color_el.get("theme"))
    if color_el.get("indexed") is not None:
        spec["indexed"] = int(color_el.get("indexed"))
    if color_el.get("tint") is not None:
        spec["tint"] = float(color_el.get("tint"))
    if color_el.get("auto") is not None:
        spec["auto"] = color_el.get("auto") == "1"
    return spec


def parse_rich_text(si_or_is_el) -> list[Run]:
    """<si>/<is> 要素から run 単位のリストを返す。

    run(<r>)が無い場合は素の<t>を1つのrunとして返し、explicit_*はNone
    (=セル書式へ継承)とする。仕様§3.2 手順4-7に対応。
    """
    runs: list[Run] = []
    r_elements = si_or_is_el.findall(_q("r"))
    if r_elements:
        for r in r_elements:
            t_el = r.find(_q("t"))
            text = t_el.text if t_el is not None and t_el.text is not None else ""
            space_preserve = _text_space_preserve(t_el)
            rpr = r.find(_q("rPr"))
            bold = None
            strike = None
            italic = None
            underline = None
            color = None
            if rpr is not None:
                bold = _ooxml_bool_element(rpr.find(_q("b")))
                strike = _ooxml_bool_element(rpr.find(_q("strike")))
                italic = _ooxml_bool_element(rpr.find(_q("i")))
                u_el = rpr.find(_q("u"))
                # <u> は真偽値ではなく val="single"/"double"/...のスタイル値を
                # 持つが、val="none" は「下線なし」の明示指定でありstrike/boldの
                # val="0"と同じ「要素は存在するが否定」パターンに当たる。
                underline = u_el is not None and u_el.get("val") != "none"
                color = _parse_rpr_color(rpr)
            runs.append(
                Run(
                    text=text,
                    space_preserve=space_preserve,
                    explicit_bold=bold,
                    explicit_strike=strike,
                    explicit_italic=italic,
                    explicit_underline=underline,
                    explicit_color=color,
                )
            )
        return runs
    # plain <t> only (no runs) -> single run inheriting from cell font entirely.
    t_el = si_or_is_el.find(_q("t"))
    text = t_el.text if t_el is not None and t_el.text is not None else ""
    space_preserve = _text_space_preserve(t_el)
    runs.append(
        Run(
            text=text,
            space_preserve=space_preserve,
            explicit_bold=None,
            explicit_strike=None,
            explicit_italic=None,
            explicit_underline=None,
            explicit_color=None,
        )
    )
    return runs


# ---------------------------------------------------------------------------
# Styles (fonts / fills / borders / numFmts / cellXfs) - raw parse
# ---------------------------------------------------------------------------


BUILTIN_NUMFMTS: dict[int, str] = {
    0: "General",
    1: "0",
    2: "0.00",
    3: "#,##0",
    4: "#,##0.00",
    9: "0%",
    10: "0.00%",
    11: "0.00E+00",
    12: "# ?/?",
    13: "# ??/??",
    14: "mm-dd-yy",
    15: "d-mmm-yy",
    16: "d-mmm",
    17: "mmm-yy",
    18: "h:mm AM/PM",
    19: "h:mm:ss AM/PM",
    20: "h:mm",
    21: "h:mm:ss",
    22: "m/d/yy h:mm",
    37: "#,##0 ;(#,##0)",
    38: "#,##0 ;[Red](#,##0)",
    39: "#,##0.00;(#,##0.00)",
    40: "#,##0.00;[Red](#,##0.00)",
    45: "mm:ss",
    46: "[h]:mm:ss",
    47: "mmss.0",
    48: "##0.0E+0",
    49: "@",
}

# ECMA-376 quirk: <color theme="n"> indexes into clrScheme with dk1/lt1 and
# dk2/lt2 swapped relative to declaration order.
THEME_COLOR_ORDER = (
    "lt1",
    "dk1",
    "lt2",
    "dk2",
    "accent1",
    "accent2",
    "accent3",
    "accent4",
    "accent5",
    "accent6",
    "hlink",
    "folHlink",
)

# Standard OOXML indexed color palette (0-63), abbreviated to the entries
# that actually occur in legacy files; unknown indices resolve to None.
INDEXED_COLORS = {
    0: "000000",
    1: "FFFFFF",
    2: "FF0000",
    3: "00FF00",
    4: "0000FF",
    5: "FFFF00",
    6: "FF00FF",
    7: "00FFFF",
    8: "000000",
    9: "FFFFFF",
    64: None,  # system foreground
    65: None,  # system background
}


@dataclass
class FontSpec:
    bold: bool
    strike: bool
    italic: bool
    underline: bool
    size: Optional[float]
    color: Optional[dict]
    name: Optional[str]


@dataclass
class FillSpec:
    pattern_type: Optional[str]
    fg_color: Optional[dict]
    bg_color: Optional[dict]


@dataclass
class BorderSideSpec:
    style: Optional[str]
    color: Optional[dict]


@dataclass
class BorderSpec:
    left: BorderSideSpec
    right: BorderSideSpec
    top: BorderSideSpec
    bottom: BorderSideSpec
    diagonal: BorderSideSpec
    diagonal_up: bool
    diagonal_down: bool


@dataclass
class AlignmentSpec:
    horizontal: Optional[str]
    vertical: Optional[str]
    wrap_text: bool
    text_rotation: Optional[int]
    indent: Optional[int]
    shrink_to_fit: bool


@dataclass
class ProtectionSpec:
    locked: bool
    hidden: bool


@dataclass
class CellXfSpec:
    num_fmt_id: int
    font_id: int
    fill_id: int
    border_id: int
    apply_number_format: bool
    apply_font: bool
    apply_fill: bool
    apply_border: bool
    apply_alignment: bool
    apply_protection: bool
    alignment: Optional[AlignmentSpec]
    protection: Optional[ProtectionSpec]
    quote_prefix: bool


@dataclass
class StylesTable:
    fonts: list[FontSpec]
    fills: list[FillSpec]
    borders: list[BorderSpec]
    num_fmts: dict[int, str]  # merged builtin + custom
    cell_xfs: list[CellXfSpec]


def _border_side(el) -> BorderSideSpec:
    if el is None:
        return BorderSideSpec(style=None, color=None)
    style = el.get("style")
    color_el = el.find(_q("color"))
    color = _raw_color_spec(color_el) if color_el is not None else None
    return BorderSideSpec(style=style, color=color)


def parse_styles(styles_xml: bytes) -> StylesTable:
    root = ET.fromstring(styles_xml)

    num_fmts = dict(BUILTIN_NUMFMTS)
    num_fmts_el = root.find(_q("numFmts"))
    if num_fmts_el is not None:
        for nf in num_fmts_el.findall(_q("numFmt")):
            num_fmts[int(nf.get("numFmtId"))] = nf.get("formatCode")

    fonts: list[FontSpec] = []
    fonts_el = root.find(_q("fonts"))
    if fonts_el is not None:
        for f in fonts_el.findall(_q("font")):
            sz_el = f.find(_q("sz"))
            name_el = f.find(_q("name"))
            color_el = f.find(_q("color"))
            u_el = f.find(_q("u"))
            fonts.append(
                FontSpec(
                    bold=_ooxml_bool_element(f.find(_q("b"))),
                    strike=_ooxml_bool_element(f.find(_q("strike"))),
                    italic=_ooxml_bool_element(f.find(_q("i"))),
                    underline=(u_el is not None and u_el.get("val") != "none"),
                    size=float(sz_el.get("val")) if sz_el is not None else None,
                    color=_raw_color_spec(color_el) if color_el is not None else None,
                    name=name_el.get("val") if name_el is not None else None,
                )
            )

    fills: list[FillSpec] = []
    fills_el = root.find(_q("fills"))
    if fills_el is not None:
        for fl in fills_el.findall(_q("fill")):
            pf = fl.find(_q("patternFill"))
            if pf is None:
                fills.append(FillSpec(pattern_type=None, fg_color=None, bg_color=None))
                continue
            fg_el = pf.find(_q("fgColor"))
            bg_el = pf.find(_q("bgColor"))
            fills.append(
                FillSpec(
                    pattern_type=pf.get("patternType"),
                    fg_color=_raw_color_spec(fg_el) if fg_el is not None else None,
                    bg_color=_raw_color_spec(bg_el) if bg_el is not None else None,
                )
            )

    borders: list[BorderSpec] = []
    borders_el = root.find(_q("borders"))
    if borders_el is not None:
        for b in borders_el.findall(_q("border")):
            borders.append(
                BorderSpec(
                    left=_border_side(b.find(_q("left"))),
                    right=_border_side(b.find(_q("right"))),
                    top=_border_side(b.find(_q("top"))),
                    bottom=_border_side(b.find(_q("bottom"))),
                    diagonal=_border_side(b.find(_q("diagonal"))),
                    diagonal_up=b.get("diagonalUp") == "1",
                    diagonal_down=b.get("diagonalDown") == "1",
                )
            )

    cell_xfs: list[CellXfSpec] = []
    cell_xfs_el = root.find(_q("cellXfs"))
    if cell_xfs_el is not None:
        for xf in cell_xfs_el.findall(_q("xf")):
            align_el = xf.find(_q("alignment"))
            alignment = None
            if align_el is not None:
                alignment = AlignmentSpec(
                    horizontal=align_el.get("horizontal"),
                    vertical=align_el.get("vertical"),
                    wrap_text=align_el.get("wrapText") == "1",
                    text_rotation=(
                        int(align_el.get("textRotation"))
                        if align_el.get("textRotation") is not None
                        else None
                    ),
                    indent=(
                        int(align_el.get("indent")) if align_el.get("indent") is not None else None
                    ),
                    shrink_to_fit=align_el.get("shrinkToFit") == "1",
                )
            prot_el = xf.find(_q("protection"))
            protection = None
            if prot_el is not None:
                protection = ProtectionSpec(
                    locked=prot_el.get("locked") != "0",
                    hidden=prot_el.get("hidden") == "1",
                )
            cell_xfs.append(
                CellXfSpec(
                    num_fmt_id=int(xf.get("numFmtId", 0)),
                    font_id=int(xf.get("fontId", 0)),
                    fill_id=int(xf.get("fillId", 0)),
                    border_id=int(xf.get("borderId", 0)),
                    apply_number_format=xf.get("applyNumberFormat") == "1",
                    apply_font=xf.get("applyFont") == "1",
                    apply_fill=xf.get("applyFill") == "1",
                    apply_border=xf.get("applyBorder") == "1",
                    apply_alignment=xf.get("applyAlignment") == "1",
                    apply_protection=xf.get("applyProtection") == "1",
                    alignment=alignment,
                    protection=protection,
                    quote_prefix=xf.get("quotePrefix") == "1",
                )
            )

    return StylesTable(fonts=fonts, fills=fills, borders=borders, num_fmts=num_fmts, cell_xfs=cell_xfs)


# ---------------------------------------------------------------------------
# Theme colors
# ---------------------------------------------------------------------------


def parse_theme_colors(theme_xml: Optional[bytes]) -> list[str]:
    """Return 12 base hex colors in THEME_COLOR_ORDER order (no '#' prefix)."""
    if theme_xml is None:
        return ["000000"] * 12
    root = ET.fromstring(theme_xml)
    theme_ns = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}
    clr_scheme = root.find(".//a:clrScheme", theme_ns)
    order = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"]
    raw = {}
    if clr_scheme is not None:
        for name in order:
            el = clr_scheme.find(f"a:{name}", theme_ns)
            if el is None:
                raw[name] = "000000"
                continue
            srgb = el.find("a:srgbClr", theme_ns)
            sys_clr = el.find("a:sysClr", theme_ns)
            if srgb is not None:
                raw[name] = srgb.get("val")
            elif sys_clr is not None:
                raw[name] = sys_clr.get("lastClr", "000000")
            else:
                raw[name] = "000000"
    else:
        raw = {name: "000000" for name in order}
    # THEME_COLOR_ORDER already reflects the dk1/lt1 swap quirk.
    return [raw.get(name, "000000") for name in THEME_COLOR_ORDER]


def _apply_tint(rgb_hex: str, tint: float) -> str:
    r = int(rgb_hex[0:2], 16) / 255.0
    g = int(rgb_hex[2:4], 16) / 255.0
    b = int(rgb_hex[4:6], 16) / 255.0
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    if tint < 0:
        l = l * (1.0 + tint)
    else:
        l = l * (1.0 - tint) + (1.0 - (1.0 - tint))
    r2, g2, b2 = colorsys.hls_to_rgb(h, min(max(l, 0.0), 1.0), s)
    return "{:02X}{:02X}{:02X}".format(round(r2 * 255), round(g2 * 255), round(b2 * 255))


def resolve_color(spec: Optional[dict], theme_colors: list[str]) -> dict:
    """Resolve a raw color spec (from _raw_color_spec) to a normalized dict.

    Returns {"kind": "rgb"|"theme"|"indexed"|"auto"|"none", "hex": "#RRGGBB"|None, "raw": spec}.
    """
    if not spec:
        return {"kind": "none", "hex": None, "raw": spec}
    if spec.get("auto"):
        return {"kind": "auto", "hex": None, "raw": spec}
    if "rgb" in spec:
        rgb = spec["rgb"]
        # ARGB -> keep as-is (8 hex chars) if alpha present, else 6.
        hex_val = rgb[-6:] if len(rgb) >= 6 else rgb
        return {"kind": "rgb", "hex": f"#{hex_val.upper()}", "raw": spec}
    if "theme" in spec:
        idx = spec["theme"]
        base = theme_colors[idx] if 0 <= idx < len(theme_colors) else "000000"
        tint = spec.get("tint", 0.0)
        hex_val = _apply_tint(base, tint) if tint else base
        return {"kind": "theme", "hex": f"#{hex_val.upper()}", "raw": spec}
    if "indexed" in spec:
        idx = spec["indexed"]
        base = INDEXED_COLORS.get(idx)
        return {"kind": "indexed", "hex": (f"#{base.upper()}" if base else None), "raw": spec}
    return {"kind": "none", "hex": None, "raw": spec}


# ---------------------------------------------------------------------------
# Shared strings
# ---------------------------------------------------------------------------


@dataclass
class SharedStringEntry:
    runs: list[Run]

    @property
    def plain_text(self) -> str:
        return "".join(r.text for r in self.runs)


def parse_shared_strings(shared_strings_xml: Optional[bytes]) -> list[SharedStringEntry]:
    if shared_strings_xml is None:
        return []
    root = ET.fromstring(shared_strings_xml)
    out: list[SharedStringEntry] = []
    for si in root.findall(_q("si")):
        out.append(SharedStringEntry(runs=parse_rich_text(si)))
    return out


# ---------------------------------------------------------------------------
# Sheet XML
# ---------------------------------------------------------------------------


@dataclass
class CellXml:
    address: str
    row: int
    col: int
    type_attr: Optional[str]  # raw t= attribute value or None
    style_idx: Optional[int]  # raw s= attribute (index into cellXfs) or None(=0)
    value_raw: Optional[str]  # raw <v> text
    formula: Optional[str]
    formula_type: Optional[str]  # t= on <f> (normal/shared/array/dataTable) or None
    inline_runs: Optional[list[Run]]  # for t="inlineStr"
    shared_index: Optional[int]  # for t="s"


@dataclass
class RowXml:
    number: int
    height: Optional[float]
    custom_height: bool
    hidden: bool
    outline_level: int
    cells: dict[str, CellXml]


@dataclass
class ColXml:
    min_col: int
    max_col: int
    width: Optional[float]
    hidden: bool
    outline_level: int
    custom_width: bool


@dataclass
class SheetXml:
    dimension_ref: Optional[str]
    rows: dict[int, RowXml]
    cols: list[ColXml]
    merges: list[tuple[int, int, int, int]]  # min_row, min_col, max_row, max_col
    drawing_rid: Optional[str]
    legacy_drawing_rid: Optional[str]
    conditional_formats: list[tuple[str, list[str]]]  # (sqref, [type,...]) presence only
    sheet_views_show: Optional[bool]  # tabSelected/sheetView presence (not authoritative visibility)
    default_row_height: Optional[float]
    default_col_width: Optional[float]


def _cell_from_el(c_el) -> CellXml:
    addr = c_el.get("r")
    col_letters, row = split_address(addr)
    col = col_letters_to_index(col_letters)
    type_attr = c_el.get("t")
    style_idx = c_el.get("s")
    style_idx_int = int(style_idx) if style_idx is not None else None
    v_el = c_el.find(_q("v"))
    value_raw = v_el.text if v_el is not None else None
    f_el = c_el.find(_q("f"))
    formula = f_el.text if f_el is not None else None
    formula_type = f_el.get("t") if f_el is not None else None
    inline_runs = None
    shared_index = None
    if type_attr == "inlineStr":
        is_el = c_el.find(_q("is"))
        inline_runs = parse_rich_text(is_el) if is_el is not None else []
    elif type_attr == "s":
        shared_index = int(value_raw) if value_raw is not None else None
    return CellXml(
        address=addr,
        row=row,
        col=col,
        type_attr=type_attr,
        style_idx=style_idx_int,
        value_raw=value_raw,
        formula=formula,
        formula_type=formula_type,
        inline_runs=inline_runs,
        shared_index=shared_index,
    )


def parse_sheet_xml(sheet_xml_bytes: bytes) -> SheetXml:
    root = ET.fromstring(sheet_xml_bytes)
    dim_el = root.find(_q("dimension"))
    dimension_ref = dim_el.get("ref") if dim_el is not None else None

    rows: dict[int, RowXml] = {}
    sheet_data = root.find(_q("sheetData"))
    if sheet_data is not None:
        for row_el in sheet_data.findall(_q("row")):
            rnum = int(row_el.get("r"))
            ht = row_el.get("ht")
            cells: dict[str, CellXml] = {}
            for c_el in row_el.findall(_q("c")):
                cell = _cell_from_el(c_el)
                cells[cell.address] = cell
            rows[rnum] = RowXml(
                number=rnum,
                height=float(ht) if ht is not None else None,
                custom_height=row_el.get("customHeight") == "1",
                hidden=row_el.get("hidden") == "1",
                outline_level=int(row_el.get("outlineLevel", 0)),
                cells=cells,
            )

    cols: list[ColXml] = []
    cols_el = root.find(_q("cols"))
    if cols_el is not None:
        for col_el in cols_el.findall(_q("col")):
            width = col_el.get("width")
            cols.append(
                ColXml(
                    min_col=int(col_el.get("min")),
                    max_col=int(col_el.get("max")),
                    width=float(width) if width is not None else None,
                    hidden=col_el.get("hidden") == "1",
                    outline_level=int(col_el.get("outlineLevel", 0)),
                    custom_width=col_el.get("customWidth") == "1",
                )
            )

    merges: list[tuple[int, int, int, int]] = []
    merge_cells_el = root.find(_q("mergeCells"))
    if merge_cells_el is not None:
        for mc in merge_cells_el.findall(_q("mergeCell")):
            merges.append(parse_range(mc.get("ref")))

    drawing_el = root.find(_q("drawing"))
    drawing_rid = drawing_el.get(R_ID) if drawing_el is not None else None
    legacy_drawing_el = root.find(_q("legacyDrawing"))
    legacy_drawing_rid = legacy_drawing_el.get(R_ID) if legacy_drawing_el is not None else None

    cond_fmts: list[tuple[str, list[str]]] = []
    for cf_el in root.findall(_q("conditionalFormatting")):
        sqref = cf_el.get("sqref", "")
        types = [r.get("type", "") for r in cf_el.findall(_q("cfRule"))]
        cond_fmts.append((sqref, types))

    fmt_pr_el = root.find(_q("sheetFormatPr"))
    default_row_height = None
    default_col_width = None
    if fmt_pr_el is not None:
        drh = fmt_pr_el.get("defaultRowHeight")
        dcw = fmt_pr_el.get("defaultColWidth")
        default_row_height = float(drh) if drh is not None else None
        default_col_width = float(dcw) if dcw is not None else None

    return SheetXml(
        dimension_ref=dimension_ref,
        rows=rows,
        cols=cols,
        merges=merges,
        drawing_rid=drawing_rid,
        legacy_drawing_rid=legacy_drawing_rid,
        conditional_formats=cond_fmts,
        sheet_views_show=None,
        default_row_height=default_row_height,
        default_col_width=default_col_width,
    )


# ---------------------------------------------------------------------------
# Workbook-level: sheets list, rels
# ---------------------------------------------------------------------------


@dataclass
class SheetRef:
    index: int  # 0-based order in <sheets>
    name: str
    sheet_id: str
    rid: str
    state: str  # visible/hidden/veryHidden
    part: str  # e.g. xl/worksheets/sheet26.xml


class WorkbookReader:
    """1冊の .xlsx を直接XML読取するリーダー。zipは開いたまま保持する。"""

    def __init__(self, path: Path):
        self.path = Path(path)
        self.sha256 = sha256_file(self.path)
        self._zf = zipfile.ZipFile(self.path)
        self._part_cache: dict[str, bytes] = {}
        self._part_sha_cache: dict[str, str] = {}
        self.sheets: list[SheetRef] = self._load_sheets()
        self._shared_strings: Optional[list[SharedStringEntry]] = None
        self._styles: Optional[StylesTable] = None
        self._theme_colors: Optional[list[str]] = None
        self._sheet_xml_cache: dict[str, SheetXml] = {}
        self._sheet_rels_cache: dict[str, dict[str, str]] = {}

    # -- low level -----------------------------------------------------
    def read_part(self, part: str) -> bytes:
        if part not in self._part_cache:
            self._part_cache[part] = self._zf.read(part)
        return self._part_cache[part]

    def has_part(self, part: str) -> bool:
        return part in self._zf.namelist()

    def part_sha256(self, part: str) -> str:
        if part not in self._part_sha_cache:
            self._part_sha_cache[part] = sha256_bytes(self.read_part(part))
        return self._part_sha_cache[part]

    # -- workbook.xml / rels --------------------------------------------
    def _load_sheets(self) -> list[SheetRef]:
        wb_root = ET.fromstring(self.read_part("xl/workbook.xml"))
        rels_root = ET.fromstring(self.read_part("xl/_rels/workbook.xml.rels"))
        rid_to_target = {rel.get("Id"): rel.get("Target") for rel in rels_root}
        sheets_el = wb_root.find(_q("sheets"))
        out: list[SheetRef] = []
        for idx, sh in enumerate(sheets_el):
            rid = sh.get(R_ID)
            target = rid_to_target.get(rid, "")
            part = resolve_opc_target("xl/workbook.xml", target)
            out.append(
                SheetRef(
                    index=idx,
                    name=sh.get("name"),
                    sheet_id=sh.get("sheetId"),
                    rid=rid,
                    state=sh.get("state", "visible"),
                    part=part,
                )
            )
        return out

    def sheet_by_name(self, name: str) -> list[SheetRef]:
        return [s for s in self.sheets if s.name == name]

    def sheet_by_index(self, index: int) -> SheetRef:
        return self.sheets[index]

    # -- shared strings / styles / theme --------------------------------
    def shared_strings(self) -> list[SharedStringEntry]:
        if self._shared_strings is None:
            data = self.read_part("xl/sharedStrings.xml") if self.has_part("xl/sharedStrings.xml") else None
            self._shared_strings = parse_shared_strings(data)
        return self._shared_strings

    def styles(self) -> StylesTable:
        if self._styles is None:
            self._styles = parse_styles(self.read_part("xl/styles.xml"))
        return self._styles

    def theme_colors(self) -> list[str]:
        if self._theme_colors is None:
            theme_part = None
            for name in self._zf.namelist():
                if name.startswith("xl/theme/") and name.endswith(".xml"):
                    theme_part = name
                    break
            data = self.read_part(theme_part) if theme_part else None
            self._theme_colors = parse_theme_colors(data)
        return self._theme_colors

    # -- sheet XML --------------------------------------------------------
    def sheet_xml(self, sheet: SheetRef) -> SheetXml:
        if sheet.part not in self._sheet_xml_cache:
            self._sheet_xml_cache[sheet.part] = parse_sheet_xml(self.read_part(sheet.part))
        return self._sheet_xml_cache[sheet.part]

    def sheet_rels(self, sheet: SheetRef) -> dict[str, str]:
        """rId -> Target for a worksheet's own _rels file (e.g. drawing)."""
        if sheet.part not in self._sheet_rels_cache:
            sheet_file = sheet.part.rsplit("/", 1)[-1]
            rels_part = f"xl/worksheets/_rels/{sheet_file}.rels"
            if self.has_part(rels_part):
                root = ET.fromstring(self.read_part(rels_part))
                self._sheet_rels_cache[sheet.part] = {
                    rel.get("Id"): rel.get("Target") for rel in root
                }
            else:
                self._sheet_rels_cache[sheet.part] = {}
        return self._sheet_rels_cache[sheet.part]

    def resolve_cell_text(self, cell: CellXml) -> tuple[list[Run], bool]:
        """Return (runs, is_rich) for a cell, following t= attribute.

        is_rich indicates whether run-level rPr entries exist (matters for
        distinguishing an explicit single plain run from a true absence of
        text). Numeric/boolean/error cells return ([], False).
        """
        if cell.type_attr == "s" and cell.shared_index is not None:
            strings = self.shared_strings()
            if 0 <= cell.shared_index < len(strings):
                entry = strings[cell.shared_index]
                return entry.runs, True
            return [], False
        if cell.type_attr == "inlineStr":
            return cell.inline_runs or [], True
        if cell.type_attr == "str" and cell.value_raw is not None:
            # formula cached string result: no rich formatting, single run.
            return [
                Run(
                    text=cell.value_raw,
                    space_preserve=False,
                    explicit_bold=None,
                    explicit_strike=None,
                    explicit_italic=None,
                    explicit_underline=None,
                    explicit_color=None,
                )
            ], False
        return [], False
