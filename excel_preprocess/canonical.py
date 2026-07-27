"""機能ブロックのcanonical model構築(仕様§1 JSONスキーマ・§3.3 format_classes)。

`ooxml.WorkbookReader` + 行/列範囲(manifestで承認済み)から、`excel_blocks/<fid>.json`
と同じ形の辞書を組み立てる。抽出(extractor.py)と検証(verify.py の source/
reconstruct モード)の両方がこの同一ロジックを呼ぶことで、"どちらから見ても
同じcanonical modelになる" という差分0の定義(仕様§4)を成立させる。
"""
from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass
from typing import Any, Optional

from . import ooxml
from .style_model import StyleResolver
from .errors import MergeBoundaryCrossedError, SourceReadError


@dataclass(frozen=True)
class BlockRange:
    row_start: int
    row_end: int
    col_start: int
    col_end: int

    def contains(self, row: int, col: int) -> bool:
        return self.row_start <= row <= self.row_end and self.col_start <= col <= self.col_end


def _range_intersects(a: tuple[int, int, int, int], b: BlockRange) -> bool:
    r1, c1, r2, c2 = a
    return not (r2 < b.row_start or r1 > b.row_end or c2 < b.col_start or c1 > b.col_end)


def _range_fully_inside(a: tuple[int, int, int, int], b: BlockRange) -> bool:
    r1, c1, r2, c2 = a
    return b.row_start <= r1 and r2 <= b.row_end and b.col_start <= c1 and c2 <= b.col_end


def _run_to_json(run: ooxml.Run, cell_strike: bool, cell_bold: bool) -> dict:
    effective_strike = run.explicit_strike if run.explicit_strike is not None else cell_strike
    effective_bold = run.explicit_bold if run.explicit_bold is not None else cell_bold
    return {
        "text": run.text,
        "space_preserve": run.space_preserve,
        "explicit_bold": run.explicit_bold,
        "explicit_strike": run.explicit_strike,
        "explicit_italic": run.explicit_italic,
        "explicit_underline": run.explicit_underline,
        "effective_bold": bool(effective_bold),
        "effective_strike": bool(effective_strike),
        "strike_from_cell": run.explicit_strike is None and cell_strike,
        "bold_from_cell": run.explicit_bold is None and cell_bold,
    }


def _cell_type(cell: Optional[ooxml.CellXml]) -> str:
    """セルの実効型を判定する。

    OOXMLでは数値セルは通常 t= を省略する(既定値が "n")が、openpyxl 等の
    書き出し実装は値が無くても `t="n"` を明示することがある(reconstructモード
    で実際に観測)。`t="n"` かつ `<v>` が無いセルは「型だけの空セル」であり、
    見た目上は t= 省略の場合と等価なので "blank" とみなす。
    "s"(共有文字列)は shared_index(=<v>の内容)が無ければ同様に blank とする。
    それ以外の明示型(inlineStr/b/e/str/d)はXMLに構造が現れる時点で内容ありと
    みなし、そのまま返す。
    """
    if cell is None:
        return "blank"
    if cell.type_attr == "n" or cell.type_attr is None:
        return "n" if cell.value_raw is not None else "blank"
    if cell.type_attr == "s" and cell.shared_index is None:
        return "blank"
    return cell.type_attr


def _cell_json(
    address: str,
    cell: Optional[ooxml.CellXml],
    reader: ooxml.WorkbookReader,
    resolver: StyleResolver,
    merge_state: dict[str, str],
) -> dict:
    present = cell is not None
    cell_type = _cell_type(cell)
    style_json: Optional[dict] = None
    format_classes: list[str] = []
    rich_runs: list[dict] = []
    value_lexical: Optional[str] = None
    formula: Optional[str] = None
    formula_type: Optional[str] = None

    xf_id = cell.style_idx if (cell is not None and cell.style_idx is not None) else (0 if present else None)
    cell_strike = False
    cell_bold = False
    if xf_id is not None:
        cell_strike = resolver.font_strike(xf_id)
        cell_bold = resolver.font_bold(xf_id)
        style_json = {"xf_id": xf_id, "fingerprint": resolver.fingerprint(xf_id)}

    if present:
        formula = cell.formula
        formula_type = cell.formula_type
        if cell_type in ("s", "inlineStr", "str"):
            runs, _is_rich = reader.resolve_cell_text(cell)
            rich_runs = [_run_to_json(r, cell_strike, cell_bold) for r in runs]
            value_lexical = "".join(r.text for r in runs)
        elif cell_type in ("n", "b", "e", "d"):
            value_lexical = cell.value_raw
        else:
            value_lexical = cell.value_raw

    if cell_strike or any(r["effective_strike"] for r in rich_runs):
        format_classes.append("cell-strike")
    if cell_bold or any(r["effective_bold"] for r in rich_runs):
        format_classes.append("cell-bold")
    if xf_id is not None:
        fill_hex = resolver.fill_color_hex(xf_id)
        if fill_hex:
            format_classes.append(f"cell-fill:{fill_hex}")
    plain_text = "".join(r["text"] for r in rich_runs)
    if "★" in plain_text:
        format_classes.append("customization-marker")
    merge_flag = merge_state.get(address)
    if merge_flag:
        format_classes.append(merge_flag)

    return {
        "address": address,
        "present_in_xml": present,
        "type": cell_type,
        "value_lexical": value_lexical,
        "formula": formula,
        "formula_type": formula_type,
        "style": style_json,
        "format_classes": format_classes,
        "rich_text_runs": rich_runs,
    }


def _drawing_residuals(
    reader: ooxml.WorkbookReader, sheet: ooxml.SheetRef, sheet_xml: ooxml.SheetXml, block: BlockRange
) -> list[dict]:
    """図形/画像の「存在・アンカー」のみを記録する(未保証要素、仕様冒頭・§4)。"""
    residuals: list[dict] = []
    if sheet_xml.drawing_rid is None:
        return residuals
    rels = reader.sheet_rels(sheet)
    target = rels.get(sheet_xml.drawing_rid)
    if not target:
        return residuals
    drawing_part = ooxml.resolve_opc_target(sheet.part, target)
    if not reader.has_part(drawing_part):
        return residuals
    try:
        import xml.etree.ElementTree as ET

        root = ET.fromstring(reader.read_part(drawing_part))
    except Exception:  # noqa: BLE001 - drawing parse failure is non-fatal (unsupported/未保証)
        return residuals
    xdr_ns = "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"
    for anchor_tag in ("twoCellAnchor", "oneCellAnchor", "absoluteAnchor"):
        for anchor in root.findall(f"{{{xdr_ns}}}{anchor_tag}"):
            from_el = anchor.find(f"{{{xdr_ns}}}from")
            if from_el is None:
                continue
            col_el = from_el.find(f"{{{xdr_ns}}}col")
            row_el = from_el.find(f"{{{xdr_ns}}}row")
            if col_el is None or row_el is None:
                continue
            col0 = int(col_el.text)
            row0 = int(row_el.text)
            row1 = row0 + 1  # anchors are 0-based; convert to 1-based cell row
            col1 = col0 + 1
            if block.contains(row1, col1):
                addr = ooxml.make_address(ooxml.col_index_to_letters(col1), row1)
                residuals.append(
                    {
                        "anchor_cell": addr,
                        "anchor_type": anchor_tag,
                        "drawing_part": drawing_part,
                    }
                )
    return residuals


def build_block_model(
    reader: ooxml.WorkbookReader,
    sheet: ooxml.SheetRef,
    block: BlockRange,
    fid: str,
    function_no: str,
    boundary_evidence: list[str],
) -> dict:
    sheet_xml = reader.sheet_xml(sheet)
    styles = reader.styles()
    theme_colors = reader.theme_colors()
    resolver = StyleResolver(styles, theme_colors)

    # -- merges intersecting the block; full containment required (仕様§1/§6) --
    merges_in_block: list[str] = []
    merge_state: dict[str, str] = {}
    for m in sheet_xml.merges:
        if not _range_intersects(m, block):
            continue
        if not _range_fully_inside(m, block):
            r1, c1, r2, c2 = m
            ref = f"{ooxml.col_index_to_letters(c1)}{r1}:{ooxml.col_index_to_letters(c2)}{r2}"
            raise MergeBoundaryCrossedError(
                f"merge {ref} crosses block boundary "
                f"rows={block.row_start}-{block.row_end} cols={block.col_start}-{block.col_end} "
                f"(fid={fid}, sheet={sheet.name})"
            )
        r1, c1, r2, c2 = m
        ref = f"{ooxml.col_index_to_letters(c1)}{r1}:{ooxml.col_index_to_letters(c2)}{r2}"
        merges_in_block.append(ref)
        anchor_addr = f"{ooxml.col_index_to_letters(c1)}{r1}"
        for rr in range(r1, r2 + 1):
            for cc in range(c1, c2 + 1):
                addr = f"{ooxml.col_index_to_letters(cc)}{rr}"
                merge_state[addr] = "merged-anchor" if addr == anchor_addr else "merged-covered"

    # -- cells: full rectangle, every address --
    cells_json: dict[str, dict] = {}
    used_xf_ids: set[int] = set()
    for row_num in range(block.row_start, block.row_end + 1):
        row_xml = sheet_xml.rows.get(row_num)
        for col_num in range(block.col_start, block.col_end + 1):
            addr = f"{ooxml.col_index_to_letters(col_num)}{row_num}"
            cell = row_xml.cells.get(addr) if row_xml else None
            cell_json = _cell_json(addr, cell, reader, resolver, merge_state)
            cells_json[addr] = cell_json
            if cell_json["style"] is not None:
                used_xf_ids.add(cell_json["style"]["xf_id"])

    # -- rows / columns metadata --
    rows_json: dict[str, dict] = {}
    for row_num in range(block.row_start, block.row_end + 1):
        row_xml = sheet_xml.rows.get(row_num)
        if row_xml is None:
            rows_json[str(row_num)] = {
                "height": None,
                "hidden": False,
                "outline_level": 0,
                "custom_height": False,
                "present_in_xml": False,
            }
        else:
            rows_json[str(row_num)] = {
                "height": row_xml.height,
                "hidden": row_xml.hidden,
                "outline_level": row_xml.outline_level,
                "custom_height": row_xml.custom_height,
                "present_in_xml": True,
            }

    columns_json: dict[str, dict] = {}
    for col_num in range(block.col_start, block.col_end + 1):
        letters = ooxml.col_index_to_letters(col_num)
        match = None
        for col_def in sheet_xml.cols:
            if col_def.min_col <= col_num <= col_def.max_col:
                match = col_def
                break
        if match is None:
            columns_json[letters] = {
                "width": sheet_xml.default_col_width,
                "hidden": False,
                "outline_level": 0,
                "custom_width": False,
            }
        else:
            columns_json[letters] = {
                "width": match.width,
                "hidden": match.hidden,
                "outline_level": match.outline_level,
                "custom_width": match.custom_width,
            }

    # -- styles table (only fingerprints actually used in this block) --
    styles_table: dict[str, dict] = {}
    for xf_id in sorted(used_xf_ids):
        fp = resolver.fingerprint(xf_id)
        styles_table[fp] = {"normalized_xf": resolver.normalized_xf(xf_id)}

    drawing_residuals = _drawing_residuals(reader, sheet, sheet_xml, block)

    # -- conditional formatting residuals (presence + range only) --
    cond_fmt_residuals = []
    for sqref, types in sheet_xml.conditional_formats:
        for ref in sqref.split():
            try:
                rng = ooxml.parse_range(ref)
            except ValueError:
                continue
            if _range_intersects(rng, block):
                cond_fmt_residuals.append({"sqref": ref, "rule_types": types})

    model: dict[str, Any] = {
        "schema_version": "1.0",
        "fid": fid,
        "function_no": function_no,
        "source": {
            "workbook_file": reader.path.name,
            "workbook_no": reader.path.name[:4],
            "sha256": reader.sha256,
            "sheet_name": sheet.name,
            "sheet_index": sheet.index,
            "sheet_state": sheet.state,
            "sheet_part": sheet.part,
        },
        "block": {
            "row_start": block.row_start,
            "row_end": block.row_end,
            "col_start": block.col_start,
            "col_end": block.col_end,
            "boundary_evidence": boundary_evidence,
        },
        "rows": rows_json,
        "columns": columns_json,
        "cells": cells_json,
        "merged_ranges": sorted(merges_in_block),
        "styles": styles_table,
        "drawing_residuals": drawing_residuals,
        "conditional_formatting_residuals": cond_fmt_residuals,
    }

    model_bytes = json.dumps(model, sort_keys=True, ensure_ascii=True).encode("utf-8")
    model_sha256 = hashlib.sha256(model_bytes).hexdigest()

    source_parts_sha256 = {}
    for part in ("xl/styles.xml", "xl/sharedStrings.xml", sheet.part):
        if reader.has_part(part):
            source_parts_sha256[part] = reader.part_sha256(part)

    model["integrity"] = {
        "model_sha256": model_sha256,
        "source_parts_sha256": source_parts_sha256,
    }
    return model


def load_workbook_reader(path) -> ooxml.WorkbookReader:
    try:
        return ooxml.WorkbookReader(path)
    except Exception as exc:  # noqa: BLE001
        raise SourceReadError(f"failed to open workbook {path}: {exc}") from exc
