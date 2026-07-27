"""機能ブロック特定アルゴリズム(仕様§2)。

「機能No」ラベル→同一行の値という構造マッチでFIDを探す(本文中の文字列一致では
ない、仕様§2.1)。非表示シートも対象に含める(convert.pyは表示シートのみで
あり、その仕様は継承しない)。

範囲決定(§2.2)は、同一シート内でラベル行を行順に並べ、隣接ラベル行の間で
連続分割する(前関数の終了行の直後から次関数の開始行の直前まで)。これにより
「空行・区切り帯を省いて行番号を詰める」ことを避けつつ、決定的な境界を得る。
detect() の出力はあくまで人手承認(manifest.json)向けの候補であり正本ではない
(仕様§2.3)。

曖昧時は AmbiguousBlockBoundaryError(exit1)。
"""
from __future__ import annotations

import glob
import re
import unicodedata
from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional

from . import ooxml
from .canonical import BlockRange
from .errors import AmbiguousBlockBoundaryError

FID_RE = re.compile(r"^[A-Za-z]\d{2}-\d{2}$")
LABEL_TEXT = "機能No"


def normalize_label(text: Optional[str]) -> str:
    """前後空白・全半角・改行を正規化する(仕様§2.1手順3)。"""
    if text is None:
        return ""
    t = unicodedata.normalize("NFKC", text)
    t = re.sub(r"\s+", "", t)
    return t.strip()


def normalize_fid(text: Optional[str]) -> str:
    return normalize_label(text).upper()


@dataclass
class FunctionMarker:
    row: int
    label_addr: str
    value_addr: str
    fid: str  # normalized e.g. "M03-11"


@dataclass
class LabelHit:
    book_path: Path
    book_no: str
    sheet: ooxml.SheetRef
    marker: FunctionMarker


def _row_cell_texts(reader: ooxml.WorkbookReader, sheet_xml: ooxml.SheetXml, row_num: int) -> list[tuple[str, str]]:
    """(address, resolved_text) for every text-bearing cell in a row."""
    row = sheet_xml.rows.get(row_num)
    if row is None:
        return []
    out = []
    for addr, cell in row.cells.items():
        if cell.type_attr in ("s", "inlineStr", "str"):
            runs, _ = reader.resolve_cell_text(cell)
            text = "".join(r.text for r in runs)
            if text:
                out.append((addr, text))
    return out


def find_function_markers_in_sheet(reader: ooxml.WorkbookReader, sheet: ooxml.SheetRef) -> list[FunctionMarker]:
    """シート内の全ての「機能No」ラベル→FID値マーカーを行順に返す。

    同一行内に複数のFID候補値がある場合(仕様§2.3「同一機能Noラベルに複数の
    一致値がある」)は AmbiguousBlockBoundaryError を送出する。
    """
    sheet_xml = reader.sheet_xml(sheet)
    markers: list[FunctionMarker] = []
    for row_num in sorted(sheet_xml.rows.keys()):
        texts = _row_cell_texts(reader, sheet_xml, row_num)
        label_addrs = [addr for addr, t in texts if normalize_label(t) == LABEL_TEXT]
        if not label_addrs:
            continue
        for label_addr in label_addrs:
            candidates = [
                (addr, normalize_fid(t))
                for addr, t in texts
                if addr != label_addr and FID_RE.match(normalize_fid(t))
            ]
            if not candidates:
                continue
            distinct_values = {fid for _, fid in candidates}
            if len(distinct_values) > 1:
                raise AmbiguousBlockBoundaryError(
                    f"multiple distinct FID values in one row: sheet={sheet.name} "
                    f"row={row_num} label={label_addr} candidates={candidates}"
                )
            value_addr, fid = candidates[0]
            markers.append(FunctionMarker(row=row_num, label_addr=label_addr, value_addr=value_addr, fid=fid))
    return markers


def scan_all_books_for_fid(input_dir: Path, fid_normalized: str) -> list[LabelHit]:
    """全ブック・全シート(非表示含む)を機能Noラベルで走査しfidに一致する候補を返す。"""
    hits: list[LabelHit] = []
    for book_path in sorted(Path(input_dir).glob("*.xlsx")):
        book_no = book_path.name[:4]
        reader = ooxml.WorkbookReader(book_path)
        for sheet in reader.sheets:
            try:
                markers = find_function_markers_in_sheet(reader, sheet)
            except AmbiguousBlockBoundaryError:
                raise
            for m in markers:
                if m.fid == fid_normalized:
                    hits.append(LabelHit(book_path=book_path, book_no=book_no, sheet=sheet, marker=m))
    return hits


def _sheet_max_row_col(sheet_xml: ooxml.SheetXml) -> tuple[int, int]:
    max_row = max(sheet_xml.rows.keys()) if sheet_xml.rows else 1
    max_col = 1
    for row in sheet_xml.rows.values():
        for cell in row.cells.values():
            max_col = max(max_col, cell.col)
    if sheet_xml.dimension_ref:
        try:
            r1, c1, r2, c2 = ooxml.parse_range(sheet_xml.dimension_ref)
            max_row = max(max_row, r2)
            max_col = max(max_col, c2)
        except ValueError:
            pass
    return max_row, max_col


def detect_block_for_fid(
    reader: ooxml.WorkbookReader, sheet: ooxml.SheetRef, fid_normalized: str
) -> tuple[BlockRange, list[str]]:
    """1シート内での対象fidの境界を決定する(仕様§2.2)。

    同一シートに複数の機能マーカーがある場合、行順で隣接マーカー間を連続分割する
    (前関数の終了行の直後 〜 次関数の開始行の直前)。空行・区切り帯を含めたまま
    保持し、行番号を詰めない。
    """
    sheet_xml = reader.sheet_xml(sheet)
    markers = find_function_markers_in_sheet(reader, sheet)
    target_markers = [m for m in markers if m.fid == fid_normalized]
    if not target_markers:
        raise AmbiguousBlockBoundaryError(f"fid {fid_normalized} not found in sheet {sheet.name}")
    if len(target_markers) > 1:
        raise AmbiguousBlockBoundaryError(
            f"fid {fid_normalized} labelled more than once in sheet {sheet.name}: "
            f"{[m.label_addr for m in target_markers]}"
        )
    target = target_markers[0]
    idx = markers.index(target)
    max_row, max_col = _sheet_max_row_col(sheet_xml)

    # 連続分割: 各マーカー自身の行を「そのブロックの開始行」とする(先頭のみ
    # 例外で1行目から)。前マーカーの「終了行」は次マーカーの直前行として
    # 定義されるため、ブロックiの開始行は必然的に markers[i].row と一致する
    # (row_end(i-1) = markers[i].row - 1 なので row_start(i) = markers[i].row)。
    # 旧実装は誤って `markers[idx-1].row + 1` を使っており、2件目以降の
    # ブロックが前関数の本文行と重複するバグがあった(全39ブック・643シートは
    # 「1シート=1機能」のみでidx>0分岐が一度も実行されず、合成最小xlsxによる
    # 単体テストで初めて検出・修正した。codex D2レビューBlocker②への対応)。
    row_start = markers[idx].row if idx > 0 else 1
    row_end = markers[idx + 1].row - 1 if idx + 1 < len(markers) else max_row
    if row_end < row_start:
        row_end = row_start

    block = BlockRange(row_start=row_start, row_end=row_end, col_start=1, col_end=max_col)
    evidence = [
        f"{sheet.name}:{target.label_addr}",
        f"{sheet.name}:{target.value_addr}",
    ]
    return block, evidence


@dataclass
class DetectionResult:
    fid: str
    book_path: Path
    book_no: str
    sheet: ooxml.SheetRef
    block: BlockRange
    evidence: list[str]
    workbook_sha256: str


def detect(input_dir: Path, fid_normalized: str) -> DetectionResult:
    """仕様§2.1-2.2に基づく検出。候補が複数ブック/シートに渡る場合は exit1。

    戻り値は人手承認(manifest.json)向けの「検出レポート」であり、これ単体を
    抽出の正本にはしない(仕様§2.3)。
    """
    hits = scan_all_books_for_fid(input_dir, fid_normalized)
    if not hits:
        raise AmbiguousBlockBoundaryError(f"fid {fid_normalized} not found in any book under {input_dir}")
    distinct_book_sheet = {(h.book_no, h.sheet.part) for h in hits}
    if len(distinct_book_sheet) > 1:
        raise AmbiguousBlockBoundaryError(
            f"fid {fid_normalized} found in multiple book/sheet pairs: {sorted(distinct_book_sheet)}"
        )
    hit = hits[0]
    reader = ooxml.WorkbookReader(hit.book_path)
    block, evidence = detect_block_for_fid(reader, hit.sheet, fid_normalized)
    return DetectionResult(
        fid=fid_normalized,
        book_path=hit.book_path,
        book_no=hit.book_no,
        sheet=hit.sheet,
        block=block,
        evidence=evidence,
        workbook_sha256=reader.sha256,
    )
