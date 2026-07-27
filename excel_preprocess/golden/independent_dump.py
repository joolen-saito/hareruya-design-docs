#!/usr/bin/env python3
"""golden expected/*.json を作るための「独立ダンプスクリプト」。

**重要: これは `excel_preprocess/` パッケージを一切importしない。** 抽出器
(`excel_preprocess/ooxml.py` 他)と同じ土俵の zipfile + xml.etree.ElementTree
直読みだが、コードは独立に書き下ろした別実装である(dataclassではなく素の
dict、走査順序・関数分割も抽出器と異なる)。目的はゴールデン期待値を
「抽出器の出力コピー」で作ってしまう自己承認(仕様§5「expected/*.jsonは
ツール出力をコピーして作らない」)を避けること。

出力JSONのフィールド形は `excel_blocks/<fid>.json` と同じスキーマ
(T2_EXCEL_PREPROCESS_SPEC.md §1)にそろえてあるので、
`excel-preprocess verify --mode golden` でそのまま突合できる。

使い方:
  python3 independent_dump.py \
      --xlsx <original.xlsx> --sheet-index <0-based> \
      --row-start 1 --row-end 949 --col-start 1 --col-end 65 \
      --fid <fid> --function-no <M03-11> \
      --out expected/<case-id>.json
"""
from __future__ import annotations

import argparse
import colorsys
import hashlib
import json
import re
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
RNS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"


def tag(name: str) -> str:
    return "{%s}%s" % (MAIN, name)


def col_to_num(letters: str) -> int:
    n = 0
    for ch in letters:
        n = n * 26 + (ord(ch) - 64)
    return n


def num_to_col(n: int) -> str:
    s = ""
    while n > 0:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s


def split_ref(ref: str) -> tuple[str, int]:
    m = re.match(r"^([A-Z]+)(\d+)$", ref)
    return m.group(1), int(m.group(2))


def range_bounds(ref: str) -> tuple[int, int, int, int]:
    if ":" in ref:
        a, b = ref.split(":")
        ca, ra = split_ref(a)
        cb, rb = split_ref(b)
        return min(ra, rb), min(col_to_num(ca), col_to_num(cb)), max(ra, rb), max(col_to_num(ca), col_to_num(cb))
    c, r = split_ref(ref)
    return r, col_to_num(c), r, col_to_num(c)


def bool_flag(el) -> bool:
    """OOXMLの真偽値要素 (<b/>, <strike/>, <i/>) を判定する。val="0"/"false" は偽。"""
    if el is None:
        return False
    v = el.get("val")
    return v not in ("0", "false") if v is not None else True


def underline_flag(el) -> bool:
    """<u> はスタイル値(single/double/...)を持ち、val="none" が「下線なし」の
    明示指定に当たる(bool_flagのval="0"と同じ「要素は存在するが否定」パターン)。"""
    if el is None:
        return False
    return el.get("val") != "none"


# ---------------------------------------------------------------------------
# package-level readers
# ---------------------------------------------------------------------------


class Zip:
    def __init__(self, path: Path):
        self.z = zipfile.ZipFile(path)
        self._cache: dict[str, bytes] = {}

    def raw(self, part: str) -> bytes:
        if part not in self._cache:
            self._cache[part] = self.z.read(part)
        return self._cache[part]

    def xml(self, part: str) -> ET.Element:
        return ET.fromstring(self.raw(part))

    def has(self, part: str) -> bool:
        return part in self.z.namelist()

    def part_hash(self, part: str) -> str:
        return hashlib.sha256(self.raw(part)).hexdigest()


def find_sheet_part(z: Zip, sheet_index: int) -> tuple[str, str, str]:
    """workbook.xml + rels から (sheet_name, sheet_part, sheet_state) を返す。"""
    wb = z.xml("xl/workbook.xml")
    rels = z.xml("xl/_rels/workbook.xml.rels")
    rid_target = {}
    for rel in rels:
        rid_target[rel.get("Id")] = rel.get("Target")
    sheets = wb.find(tag("sheets"))
    sh = list(sheets)[sheet_index]
    rid = sh.get("{%s}id" % RNS)
    target = rid_target[rid]
    if target.startswith("/"):
        part = target.lstrip("/")
    elif target.startswith("xl/"):
        part = target
    else:
        part = "xl/" + target
    return sh.get("name"), part, sh.get("state", "visible")


def read_shared_strings(z: Zip) -> list[list[dict]]:
    """[[{text, strike, bold, italic, space_preserve}, ...], ...] — si単位のrunリスト。"""
    if not z.has("xl/sharedStrings.xml"):
        return []
    root = z.xml("xl/sharedStrings.xml")
    out = []
    for si in root.findall(tag("si")):
        runs = si.findall(tag("r"))
        if runs:
            entry = []
            for run in runs:
                t = run.find(tag("t"))
                text = t.text if (t is not None and t.text) else ""
                preserve = t is not None and t.get("{http://www.w3.org/XML/1998/namespace}space") == "preserve"
                rpr = run.find(tag("rPr"))
                entry.append(
                    {
                        "text": text,
                        "space_preserve": preserve,
                        "explicit_strike": bool_flag(rpr.find(tag("strike"))) if rpr is not None else None,
                        "explicit_bold": bool_flag(rpr.find(tag("b"))) if rpr is not None else None,
                        "explicit_italic": bool_flag(rpr.find(tag("i"))) if rpr is not None else None,
                        "explicit_underline": underline_flag(rpr.find(tag("u"))) if rpr is not None else None,
                    }
                )
                if rpr is None:
                    entry[-1]["explicit_strike"] = None
                    entry[-1]["explicit_bold"] = None
                    entry[-1]["explicit_italic"] = None
                    entry[-1]["explicit_underline"] = None
            out.append(entry)
        else:
            t = si.find(tag("t"))
            text = t.text if (t is not None and t.text) else ""
            preserve = t is not None and t.get("{http://www.w3.org/XML/1998/namespace}space") == "preserve"
            out.append(
                [
                    {
                        "text": text,
                        "space_preserve": preserve,
                        "explicit_strike": None,
                        "explicit_bold": None,
                        "explicit_italic": None,
                        "explicit_underline": None,
                    }
                ]
            )
    return out


THEME_SLOT_ORDER = ["lt1", "dk1", "lt2", "dk2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"]


def read_theme(z: Zip) -> list[str]:
    theme_part = None
    for name in z.z.namelist():
        if name.startswith("xl/theme/") and name.endswith(".xml"):
            theme_part = name
            break
    if theme_part is None:
        return ["000000"] * 12
    root = z.xml(theme_part)
    a_ns = "http://schemas.openxmlformats.org/drawingml/2006/main"
    scheme = root.find(f".//{{{a_ns}}}clrScheme")
    declared_order = ["dk1", "lt1", "dk2", "lt2", "accent1", "accent2", "accent3", "accent4", "accent5", "accent6", "hlink", "folHlink"]
    values = {}
    for name in declared_order:
        el = scheme.find(f"{{{a_ns}}}{name}") if scheme is not None else None
        val = "000000"
        if el is not None:
            srgb = el.find(f"{{{a_ns}}}srgbClr")
            sysc = el.find(f"{{{a_ns}}}sysClr")
            if srgb is not None:
                val = srgb.get("val")
            elif sysc is not None:
                val = sysc.get("lastClr", "000000")
        values[name] = val
    return [values[name] for name in THEME_SLOT_ORDER]


def tint_hex(hexval: str, tint: float) -> str:
    r, g, b = int(hexval[0:2], 16) / 255, int(hexval[2:4], 16) / 255, int(hexval[4:6], 16) / 255
    h, l, s = colorsys.rgb_to_hls(r, g, b)
    l = l * (1.0 + tint) if tint < 0 else l * (1.0 - tint) + tint
    l = min(1.0, max(0.0, l))
    r2, g2, b2 = colorsys.hls_to_rgb(h, l, s)
    return "{:02X}{:02X}{:02X}".format(round(r2 * 255), round(g2 * 255), round(b2 * 255))


INDEXED_TABLE = {0: "000000", 1: "FFFFFF", 2: "FF0000", 3: "00FF00", 4: "0000FF", 5: "FFFF00", 6: "FF00FF", 7: "00FFFF", 8: "000000", 9: "FFFFFF", 64: None, 65: None}


def resolve_color_el(el, theme_colors: list[str]) -> dict | None:
    if el is None:
        return None
    if el.get("auto") == "1":
        return {"kind": "auto", "hex": None}
    if el.get("rgb"):
        hx = el.get("rgb")[-6:]
        return {"kind": "rgb", "hex": f"#{hx.upper()}"}
    if el.get("theme") is not None:
        idx = int(el.get("theme"))
        base = theme_colors[idx] if 0 <= idx < len(theme_colors) else "000000"
        t = float(el.get("tint", "0") or 0)
        hx = tint_hex(base, t) if t else base
        return {"kind": "theme", "hex": f"#{hx.upper()}"}
    if el.get("indexed") is not None:
        idx = int(el.get("indexed"))
        base = INDEXED_TABLE.get(idx)
        return {"kind": "indexed", "hex": (f"#{base.upper()}" if base else None)}
    return {"kind": "none", "hex": None}


BUILTIN_FMT = {
    0: "General", 1: "0", 2: "0.00", 3: "#,##0", 4: "#,##0.00", 9: "0%", 10: "0.00%",
    11: "0.00E+00", 12: "# ?/?", 13: "# ??/??", 14: "mm-dd-yy", 15: "d-mmm-yy",
    16: "d-mmm", 17: "mmm-yy", 18: "h:mm AM/PM", 19: "h:mm:ss AM/PM", 20: "h:mm",
    21: "h:mm:ss", 22: "m/d/yy h:mm", 37: "#,##0 ;(#,##0)", 38: "#,##0 ;[Red](#,##0)",
    39: "#,##0.00;(#,##0.00)", 40: "#,##0.00;[Red](#,##0.00)", 45: "mm:ss",
    46: "[h]:mm:ss", 47: "mmss.0", 48: "##0.0E+0", 49: "@",
}


def read_style_sheet(z: Zip) -> dict:
    root = z.xml("xl/styles.xml")
    numfmts = dict(BUILTIN_FMT)
    nf_el = root.find(tag("numFmts"))
    if nf_el is not None:
        for nf in nf_el.findall(tag("numFmt")):
            numfmts[int(nf.get("numFmtId"))] = nf.get("formatCode")

    fonts = []
    for f in root.find(tag("fonts")).findall(tag("font")):
        sz = f.find(tag("sz"))
        nm = f.find(tag("name"))
        col = f.find(tag("color"))
        fonts.append(
            {
                "bold": bool_flag(f.find(tag("b"))),
                "strike": bool_flag(f.find(tag("strike"))),
                "italic": bool_flag(f.find(tag("i"))),
                "underline": underline_flag(f.find(tag("u"))),
                "size": float(sz.get("val")) if sz is not None else None,
                "color_el": col,
                "name": nm.get("val") if nm is not None else None,
            }
        )

    fills = []
    for fl in root.find(tag("fills")).findall(tag("fill")):
        pf = fl.find(tag("patternFill"))
        if pf is None:
            fills.append({"pattern": None, "fg": None, "bg": None})
            continue
        fills.append({"pattern": pf.get("patternType"), "fg": pf.find(tag("fgColor")), "bg": pf.find(tag("bgColor"))})

    borders = []
    for b in root.find(tag("borders")).findall(tag("border")):
        def side(name):
            el = b.find(tag(name))
            if el is None or el.get("style") is None:
                return {"style": None, "color_el": None}
            return {"style": el.get("style"), "color_el": el.find(tag("color"))}

        borders.append(
            {
                "left": side("left"), "right": side("right"), "top": side("top"),
                "bottom": side("bottom"), "diagonal": side("diagonal"),
                "diagonal_up": b.get("diagonalUp") == "1", "diagonal_down": b.get("diagonalDown") == "1",
            }
        )

    xfs = []
    for xf in root.find(tag("cellXfs")).findall(tag("xf")):
        align = xf.find(tag("alignment"))
        prot = xf.find(tag("protection"))
        xfs.append(
            {
                "numFmtId": int(xf.get("numFmtId", 0)),
                "fontId": int(xf.get("fontId", 0)),
                "fillId": int(xf.get("fillId", 0)),
                "borderId": int(xf.get("borderId", 0)),
                "quotePrefix": xf.get("quotePrefix") == "1",
                "alignment": {
                    "horizontal": align.get("horizontal") if align is not None else None,
                    "vertical": align.get("vertical") if align is not None else None,
                    "wrap_text": (align.get("wrapText") == "1") if align is not None else False,
                    "text_rotation": int(align.get("textRotation")) if (align is not None and align.get("textRotation")) else None,
                    "indent": int(align.get("indent")) if (align is not None and align.get("indent")) else None,
                    "shrink_to_fit": (align.get("shrinkToFit") == "1") if align is not None else False,
                },
                "protection": {
                    "locked": (prot.get("locked") != "0") if prot is not None else True,
                    "hidden": (prot.get("hidden") == "1") if prot is not None else False,
                },
            }
        )
    return {"numfmts": numfmts, "fonts": fonts, "fills": fills, "borders": borders, "xfs": xfs}


def normalize_xf(styles: dict, xf_id: int, theme_colors: list[str]) -> dict:
    xf = styles["xfs"][xf_id] if 0 <= xf_id < len(styles["xfs"]) else styles["xfs"][0]
    font = styles["fonts"][xf["fontId"]]
    fill = styles["fills"][xf["fillId"]]
    border = styles["borders"][xf["borderId"]]

    def side_norm(s):
        if s["style"] is None:
            return {"style": None, "color": None}
        return {"style": s["style"], "color": resolve_color_el(s["color_el"], theme_colors)}

    fill_norm = {"pattern_type": None, "fg_color": None, "bg_color": None}
    if fill["pattern"] not in (None, "none"):
        fill_norm = {
            "pattern_type": fill["pattern"],
            "fg_color": resolve_color_el(fill["fg"], theme_colors),
            "bg_color": resolve_color_el(fill["bg"], theme_colors),
        }

    return {
        "num_fmt_id": xf["numFmtId"],
        "num_fmt_code": styles["numfmts"].get(xf["numFmtId"]),
        "font": {
            "bold": font["bold"],
            "strike": font["strike"],
            "italic": font["italic"],
            "underline": font["underline"],
            "size": font["size"],
            "color": resolve_color_el(font["color_el"], theme_colors),
            "name": font["name"],
        },
        "fill": fill_norm,
        "border": {
            "left": side_norm(border["left"]), "right": side_norm(border["right"]),
            "top": side_norm(border["top"]), "bottom": side_norm(border["bottom"]),
            "diagonal": side_norm(border["diagonal"]),
            "diagonal_up": border["diagonal_up"], "diagonal_down": border["diagonal_down"],
        },
        "alignment": xf["alignment"],
        "protection": xf["protection"],
        "quote_prefix": xf["quotePrefix"],
    }


def fingerprint(normalized: dict) -> str:
    blob = json.dumps(normalized, sort_keys=True, ensure_ascii=True)
    return hashlib.sha256(blob.encode("utf-8")).hexdigest()


def dump_block(
    xlsx_path: Path, sheet_index: int, row_start: int, row_end: int, col_start: int, col_end: int,
    fid: str, function_no: str, boundary_evidence: list[str],
) -> dict:
    z = Zip(xlsx_path)
    sheet_name, sheet_part, sheet_state = find_sheet_part(z, sheet_index)
    shared = read_shared_strings(z)
    styles = read_style_sheet(z)
    theme_colors = read_theme(z)

    sheet_root = z.xml(sheet_part)
    sheet_data = sheet_root.find(tag("sheetData"))

    raw_rows: dict[int, ET.Element] = {}
    for row_el in sheet_data.findall(tag("row")):
        raw_rows[int(row_el.get("r"))] = row_el

    fmt_pr = sheet_root.find(tag("sheetFormatPr"))
    default_col_width = None
    if fmt_pr is not None and fmt_pr.get("defaultColWidth"):
        default_col_width = float(fmt_pr.get("defaultColWidth"))

    # merges intersecting range; require full containment
    merges_el = sheet_root.find(tag("mergeCells"))
    merges_in_range = []
    merge_state = {}
    if merges_el is not None:
        for mc in merges_el.findall(tag("mergeCell")):
            r1, c1, r2, c2 = range_bounds(mc.get("ref"))
            intersects = not (r2 < row_start or r1 > row_end or c2 < col_start or c1 > col_end)
            if not intersects:
                continue
            fully_in = row_start <= r1 and r2 <= row_end and col_start <= c1 and c2 <= col_end
            if not fully_in:
                raise SystemExit(f"merge {mc.get('ref')} crosses block boundary — golden dump aborted")
            ref_str = f"{num_to_col(c1)}{r1}:{num_to_col(c2)}{r2}"
            merges_in_range.append(ref_str)
            anchor = f"{num_to_col(c1)}{r1}"
            for rr in range(r1, r2 + 1):
                for cc in range(c1, c2 + 1):
                    a = f"{num_to_col(cc)}{rr}"
                    merge_state[a] = "merged-anchor" if a == anchor else "merged-covered"

    used_xf_ids: set[int] = set()
    cells_out: dict[str, dict] = {}
    for r in range(row_start, row_end + 1):
        row_el = raw_rows.get(r)
        cell_els = {}
        if row_el is not None:
            for c_el in row_el.findall(tag("c")):
                cell_els[c_el.get("r")] = c_el
        for c in range(col_start, col_end + 1):
            addr = f"{num_to_col(c)}{r}"
            c_el = cell_els.get(addr)
            cells_out[addr] = _dump_cell(addr, c_el, shared, styles, theme_colors, used_xf_ids, merge_state.get(addr))

    rows_out = {}
    for r in range(row_start, row_end + 1):
        row_el = raw_rows.get(r)
        if row_el is None:
            rows_out[str(r)] = {"height": None, "hidden": False, "outline_level": 0, "custom_height": False, "present_in_xml": False}
        else:
            ht = row_el.get("ht")
            rows_out[str(r)] = {
                "height": float(ht) if ht is not None else None,
                "hidden": row_el.get("hidden") == "1",
                "outline_level": int(row_el.get("outlineLevel", 0)),
                "custom_height": row_el.get("customHeight") == "1",
                "present_in_xml": True,
            }

    cols_el = sheet_root.find(tag("cols"))
    col_defs = []
    if cols_el is not None:
        for cd in cols_el.findall(tag("col")):
            w = cd.get("width")
            col_defs.append(
                {
                    "min": int(cd.get("min")), "max": int(cd.get("max")),
                    "width": float(w) if w is not None else None,
                    "hidden": cd.get("hidden") == "1", "outline_level": int(cd.get("outlineLevel", 0)),
                    "custom_width": cd.get("customWidth") == "1",
                }
            )
    columns_out = {}
    for c in range(col_start, col_end + 1):
        letters = num_to_col(c)
        match = next((cd for cd in col_defs if cd["min"] <= c <= cd["max"]), None)
        if match is None:
            columns_out[letters] = {"width": default_col_width, "hidden": False, "outline_level": 0, "custom_width": False}
        else:
            columns_out[letters] = {"width": match["width"], "hidden": match["hidden"], "outline_level": match["outline_level"], "custom_width": match["custom_width"]}

    styles_out = {}
    for xf_id in sorted(used_xf_ids):
        norm = normalize_xf(styles, xf_id, theme_colors)
        styles_out[fingerprint(norm)] = {"normalized_xf": norm}

    drawing_residuals = _dump_drawing_residuals(z, sheet_root, sheet_part, row_start, row_end, col_start, col_end)
    cond_fmt_residuals = _dump_cond_fmt(sheet_root, row_start, row_end, col_start, col_end)

    model = {
        "schema_version": "1.0",
        "fid": fid,
        "function_no": function_no,
        "source": {
            "workbook_file": xlsx_path.name,
            "workbook_no": xlsx_path.name[:4],
            "sha256": hashlib.sha256(xlsx_path.read_bytes()).hexdigest(),
            "sheet_name": sheet_name,
            "sheet_index": sheet_index,
            "sheet_state": sheet_state,
            "sheet_part": sheet_part,
        },
        "block": {
            "row_start": row_start, "row_end": row_end, "col_start": col_start, "col_end": col_end,
            "boundary_evidence": boundary_evidence,
        },
        "rows": rows_out,
        "columns": columns_out,
        "cells": cells_out,
        "merged_ranges": sorted(merges_in_range),
        "styles": styles_out,
        "drawing_residuals": drawing_residuals,
        "conditional_formatting_residuals": cond_fmt_residuals,
    }
    model_hash = hashlib.sha256(json.dumps(model, sort_keys=True, ensure_ascii=True).encode("utf-8")).hexdigest()
    source_parts_sha256 = {}
    for part in ("xl/styles.xml", "xl/sharedStrings.xml", sheet_part):
        if z.has(part):
            source_parts_sha256[part] = z.part_hash(part)
    model["integrity"] = {"model_sha256": model_hash, "source_parts_sha256": source_parts_sha256}
    return model


def _dump_cell(addr, c_el, shared, styles, theme_colors, used_xf_ids, merge_flag) -> dict:
    if c_el is None:
        return {
            "address": addr, "present_in_xml": False, "type": "blank", "value_lexical": None,
            "formula": None, "formula_type": None, "style": None, "format_classes": [], "rich_text_runs": [],
        }
    t = c_el.get("t")
    s_attr = c_el.get("s")
    xf_id = int(s_attr) if s_attr is not None else 0
    used_xf_ids.add(xf_id)
    norm = normalize_xf(styles, xf_id, theme_colors)
    fp = fingerprint(norm)
    cell_strike = norm["font"]["strike"]
    cell_bold = norm["font"]["bold"]

    v_el = c_el.find(tag("v"))
    v_text = v_el.text if v_el is not None else None
    f_el = c_el.find(tag("f"))
    formula = f_el.text if f_el is not None else None
    formula_type = f_el.get("t") if f_el is not None else None

    runs_out = []
    value_lexical = None
    cell_type = "blank"

    if t == "s" and v_text is not None:
        idx = int(v_text)
        for run in shared[idx]:
            eff_strike = run["explicit_strike"] if run["explicit_strike"] is not None else cell_strike
            eff_bold = run["explicit_bold"] if run["explicit_bold"] is not None else cell_bold
            runs_out.append(
                {
                    "text": run["text"], "space_preserve": run["space_preserve"],
                    "explicit_bold": run["explicit_bold"], "explicit_strike": run["explicit_strike"],
                    "explicit_italic": run["explicit_italic"], "explicit_underline": run["explicit_underline"],
                    "effective_bold": bool(eff_bold), "effective_strike": bool(eff_strike),
                    "strike_from_cell": run["explicit_strike"] is None and cell_strike,
                    "bold_from_cell": run["explicit_bold"] is None and cell_bold,
                }
            )
        value_lexical = "".join(r["text"] for r in shared[idx])
        cell_type = "s"
    elif t == "inlineStr":
        is_el = c_el.find(tag("is"))
        sub_runs = is_el.findall(tag("r")) if is_el is not None else []
        if sub_runs:
            for run in sub_runs:
                tt = run.find(tag("t"))
                text = tt.text if (tt is not None and tt.text) else ""
                preserve = tt is not None and tt.get("{http://www.w3.org/XML/1998/namespace}space") == "preserve"
                rpr = run.find(tag("rPr"))
                exp_strike = bool_flag(rpr.find(tag("strike"))) if rpr is not None else None
                exp_bold = bool_flag(rpr.find(tag("b"))) if rpr is not None else None
                exp_italic = bool_flag(rpr.find(tag("i"))) if rpr is not None else None
                exp_underline = underline_flag(rpr.find(tag("u"))) if rpr is not None else None
                eff_strike = exp_strike if exp_strike is not None else cell_strike
                eff_bold = exp_bold if exp_bold is not None else cell_bold
                runs_out.append(
                    {
                        "text": text, "space_preserve": preserve, "explicit_bold": exp_bold, "explicit_strike": exp_strike,
                        "explicit_italic": exp_italic, "explicit_underline": exp_underline,
                        "effective_bold": bool(eff_bold), "effective_strike": bool(eff_strike),
                        "strike_from_cell": exp_strike is None and cell_strike, "bold_from_cell": exp_bold is None and cell_bold,
                    }
                )
            value_lexical = "".join(r["text"] for r in runs_out)
        elif is_el is not None:
            tt = is_el.find(tag("t"))
            text = tt.text if (tt is not None and tt.text) else ""
            preserve = tt is not None and tt.get("{http://www.w3.org/XML/1998/namespace}space") == "preserve"
            runs_out.append(
                {
                    "text": text, "space_preserve": preserve, "explicit_bold": None, "explicit_strike": None,
                    "explicit_italic": None, "explicit_underline": None,
                    "effective_bold": bool(cell_bold), "effective_strike": bool(cell_strike),
                    "strike_from_cell": cell_strike, "bold_from_cell": cell_bold,
                }
            )
            value_lexical = text
        else:
            value_lexical = ""
        cell_type = "inlineStr"
    elif t == "str" and v_text is not None:
        runs_out.append(
            {
                "text": v_text, "space_preserve": False, "explicit_bold": None, "explicit_strike": None,
                "explicit_italic": None, "explicit_underline": None,
                "effective_bold": bool(cell_bold), "effective_strike": bool(cell_strike),
                "strike_from_cell": cell_strike, "bold_from_cell": cell_bold,
            }
        )
        value_lexical = v_text
        cell_type = "str"
    elif t in (None, "n"):
        if v_text is not None:
            value_lexical = v_text
            cell_type = "n"
        else:
            cell_type = "blank"
    elif t == "b":
        value_lexical = v_text
        cell_type = "b"
    elif t == "e":
        value_lexical = v_text
        cell_type = "e"
    else:
        value_lexical = v_text
        cell_type = t or "blank"

    format_classes = []
    if cell_strike or any(r["effective_strike"] for r in runs_out):
        format_classes.append("cell-strike")
    if cell_bold or any(r["effective_bold"] for r in runs_out):
        format_classes.append("cell-bold")
    if norm["fill"]["pattern_type"] and norm["fill"]["fg_color"] and norm["fill"]["fg_color"].get("hex"):
        format_classes.append(f"cell-fill:{norm['fill']['fg_color']['hex']}")
    plain = "".join(r["text"] for r in runs_out)
    if "★" in plain:
        format_classes.append("customization-marker")
    if merge_flag:
        format_classes.append(merge_flag)

    return {
        "address": addr, "present_in_xml": True, "type": cell_type, "value_lexical": value_lexical,
        "formula": formula, "formula_type": formula_type,
        "style": {"xf_id": xf_id, "fingerprint": fp}, "format_classes": format_classes, "rich_text_runs": runs_out,
    }


def _dump_drawing_residuals(z: Zip, sheet_root, sheet_part, row_start, row_end, col_start, col_end) -> list[dict]:
    drawing_el = sheet_root.find(tag("drawing"))
    if drawing_el is None:
        return []
    rid = drawing_el.get("{%s}id" % RNS)
    sheet_file = sheet_part.rsplit("/", 1)[-1]
    rels_part = f"xl/worksheets/_rels/{sheet_file}.rels"
    if not z.has(rels_part):
        return []
    rels_root = z.xml(rels_part)
    target = None
    for rel in rels_root:
        if rel.get("Id") == rid:
            target = rel.get("Target")
            break
    if target is None:
        return []
    import posixpath

    if target.startswith("/"):
        drawing_part = target.lstrip("/")
    else:
        drawing_part = posixpath.normpath(posixpath.join("xl/worksheets", target))
    if not z.has(drawing_part):
        return []
    xdr_ns = "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"
    root = z.xml(drawing_part)
    out = []
    for anchor_tag in ("twoCellAnchor", "oneCellAnchor", "absoluteAnchor"):
        for anchor in root.findall(f"{{{xdr_ns}}}{anchor_tag}"):
            frm = anchor.find(f"{{{xdr_ns}}}from")
            if frm is None:
                continue
            col_el = frm.find(f"{{{xdr_ns}}}col")
            row_el = frm.find(f"{{{xdr_ns}}}row")
            if col_el is None or row_el is None:
                continue
            r1 = int(row_el.text) + 1
            c1 = int(col_el.text) + 1
            if row_start <= r1 <= row_end and col_start <= c1 <= col_end:
                out.append({"anchor_cell": f"{num_to_col(c1)}{r1}", "anchor_type": anchor_tag, "drawing_part": drawing_part})
    return out


def _dump_cond_fmt(sheet_root, row_start, row_end, col_start, col_end) -> list[dict]:
    out = []
    for cf in sheet_root.findall(tag("conditionalFormatting")):
        sqref = cf.get("sqref", "")
        types = [r.get("type", "") for r in cf.findall(tag("cfRule"))]
        for ref in sqref.split():
            r1, c1, r2, c2 = range_bounds(ref)
            if not (r2 < row_start or r1 > row_end or c2 < col_start or c1 > col_end):
                out.append({"sqref": ref, "rule_types": types})
    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--xlsx", required=True)
    ap.add_argument("--sheet-index", type=int, required=True)
    ap.add_argument("--row-start", type=int, required=True)
    ap.add_argument("--row-end", type=int, required=True)
    ap.add_argument("--col-start", type=int, required=True)
    ap.add_argument("--col-end", type=int, required=True)
    ap.add_argument("--fid", required=True)
    ap.add_argument("--function-no", required=True)
    ap.add_argument("--evidence", action="append", default=[])
    ap.add_argument("--out", required=True)
    args = ap.parse_args()

    model = dump_block(
        Path(args.xlsx), args.sheet_index, args.row_start, args.row_end, args.col_start, args.col_end,
        args.fid, args.function_no, args.evidence,
    )
    Path(args.out).write_text(json.dumps(model, sort_keys=True, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"wrote {args.out} ({len(model['cells'])} cells)")


if __name__ == "__main__":
    main()
