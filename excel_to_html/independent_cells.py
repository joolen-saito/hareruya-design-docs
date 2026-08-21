"""正本Excelのセル事実を、convert.py とは独立に読み出す。

なぜ独立なのか（2026-08-19 codex R1「検証の不備」指摘への対応）:
`verify.py` のセル値カバレッジは期待値を `convert.collect_cell_style_models()` /
`cell_text_runs()` / `apply_strike_exclusion()` から作っていた。変換器と検証器が同じ
取り消し線モデルを共有していたため、**変換器が取り消し線を誤判定すると検証器も同じ誤りを
して検出できない**（共倒れ）。加えて判定が「正規化文字列がHTML本文のどこかに在るか」
だけで、セル座標も出現回数も見ていなかった。

このモジュールは OOXML（styles.xml / sharedStrings.xml / 各シートXML）を独自に読み、
convert.py の関数を一切呼ばずに次を返す。verify.py はこれと変換器側モデルを突き合わせ、
食い違いを不合格にする。

参照: .cursor/skills/output-exclusion-policy/SKILL.md（規約の正本）
"""

from __future__ import annotations

import re
import zipfile
from dataclasses import dataclass, field
from pathlib import Path
from xml.etree import ElementTree as ET

NS_MAIN = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
NS_REL = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS_PKG = "http://schemas.openxmlformats.org/package/2006/relationships"

_ADDR_RE = re.compile(r"^([A-Z]+)([0-9]+)$")


def _tag(namespace: str, name: str) -> str:
    return f"{{{namespace}}}{name}"


def _explicit_flag(element: ET.Element | None) -> bool | None:
    """Return an OOXML boolean property: True/False when present, None when absent.

    `<strike/>` と `<strike val="1"/>` は真、`<strike val="0"/>` は**偽の明示**（親からの
    継承を打ち消す）。要素そのものが無い場合だけ None＝継承とする。
    """
    if element is None:
        return None
    value = element.get("val")
    if value is None:
        return True
    return value not in ("0", "false", "False")


@dataclass
class CellFacts:
    """One cell's independently-derived text facts."""

    sheet: str
    ref: str
    runs: list[tuple[str, bool]] = field(default_factory=list)  # (text, struck)
    is_string: bool = False
    cell_font_struck: bool = False
    has_value: bool = False  # 数値・日付・数式セル: 表示文字列は持たないが値は在る
    merged_hidden: bool = False  # 結合範囲の非先頭セル（Excel上も表示されない残留値）

    @property
    def raw_text(self) -> str:
        return "".join(text for text, _ in self.runs)

    @property
    def kept_text(self) -> str:
        """Text that survives the strike-exclusion policy."""
        return "".join(text for text, struck in self.runs if not struck)

    @property
    def struck_text(self) -> str:
        return "".join(text for text, struck in self.runs if struck)

    @property
    def any_struck(self) -> bool:
        return any(struck for _, struck in self.runs)

    @property
    def fully_struck(self) -> bool:
        return bool(self.raw_text.strip()) and not self.kept_text.strip()

    @property
    def partially_struck(self) -> bool:
        return self.any_struck and not self.fully_struck


def _parse_runs(container: ET.Element) -> list[tuple[str, bool | None]]:
    """Return (text, explicit strike) per run for an <si>/<is> element."""
    runs: list[tuple[str, bool | None]] = []
    r_elements = container.findall(_tag(NS_MAIN, "r"))
    if not r_elements:
        t_element = container.find(_tag(NS_MAIN, "t"))
        text = (t_element.text or "") if t_element is not None else ""
        return [(text, None)]
    for r_element in r_elements:
        t_element = r_element.find(_tag(NS_MAIN, "t"))
        text = (t_element.text or "") if t_element is not None else ""
        rpr = r_element.find(_tag(NS_MAIN, "rPr"))
        strike = (
            _explicit_flag(rpr.find(_tag(NS_MAIN, "strike"))) if rpr is not None else None
        )
        runs.append((text, strike))
    return runs


def _font_strike_flags(styles_xml: bytes) -> tuple[list[bool], list[int]]:
    """Return (strike per font id, font id per cellXfs index)."""
    root = ET.fromstring(styles_xml)
    strikes: list[bool] = []
    fonts = root.find(_tag(NS_MAIN, "fonts"))
    if fonts is not None:
        for font in fonts.findall(_tag(NS_MAIN, "font")):
            strikes.append(bool(_explicit_flag(font.find(_tag(NS_MAIN, "strike")))))
    xf_fonts: list[int] = []
    cell_xfs = root.find(_tag(NS_MAIN, "cellXfs"))
    if cell_xfs is not None:
        for xf in cell_xfs.findall(_tag(NS_MAIN, "xf")):
            try:
                xf_fonts.append(int(xf.get("fontId", "0")))
            except (TypeError, ValueError):
                xf_fonts.append(0)
    return strikes, xf_fonts


def _sheet_parts(archive: zipfile.ZipFile) -> dict[str, str]:
    """Map sheet title -> zip part name, via workbook.xml and its rels."""
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    targets = {
        rel.get("Id"): rel.get("Target") or ""
        for rel in rels.findall(_tag(NS_PKG, "Relationship"))
    }
    parts: dict[str, str] = {}
    sheets = workbook.find(_tag(NS_MAIN, "sheets"))
    if sheets is None:
        return parts
    for sheet in sheets.findall(_tag(NS_MAIN, "sheet")):
        title = sheet.get("name") or ""
        target = targets.get(sheet.get(_tag(NS_REL, "id")) or "", "")
        if not target:
            continue
        if target.startswith("/"):
            part = target.lstrip("/")
        else:
            part = "xl/" + target.replace("../", "")
        parts[title] = part
    return parts


def read_cell_facts(
    workbook_path: Path, sheet_titles: set[str] | None = None
) -> dict[str, dict[str, CellFacts]]:
    """Return {sheet title: {A1 ref: CellFacts}} read straight from the package."""
    facts: dict[str, dict[str, CellFacts]] = {}
    with zipfile.ZipFile(workbook_path) as archive:
        names = set(archive.namelist())
        if "xl/styles.xml" in names:
            font_strikes, xf_fonts = _font_strike_flags(archive.read("xl/styles.xml"))
        else:
            font_strikes, xf_fonts = [], []
        shared: list[list[tuple[str, bool | None]]] = []
        if "xl/sharedStrings.xml" in names:
            shared_root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            shared = [_parse_runs(si) for si in shared_root.findall(_tag(NS_MAIN, "si"))]
        for title, part in _sheet_parts(archive).items():
            if sheet_titles is not None and title not in sheet_titles:
                continue
            if part not in names:
                continue
            facts[title] = _read_sheet(
                archive.read(part), title, shared, font_strikes, xf_fonts
            )
    return facts


def _column_index(letters: str) -> int:
    index = 0
    for char in letters:
        index = index * 26 + (ord(char) - ord("A") + 1)
    return index


def _merged_bounds(root: ET.Element) -> list[tuple[int, int, int, int]]:
    """Return (min_col, min_row, max_col, max_row) for every merged range."""
    bounds: list[tuple[int, int, int, int]] = []
    for merge in root.iter(_tag(NS_MAIN, "mergeCell")):
        ref = merge.get("ref") or ""
        if ":" not in ref:
            continue
        start, end = ref.split(":", 1)
        start_match, end_match = _ADDR_RE.match(start), _ADDR_RE.match(end)
        if not start_match or not end_match:
            continue
        bounds.append(
            (
                _column_index(start_match.group(1)),
                int(start_match.group(2)),
                _column_index(end_match.group(1)),
                int(end_match.group(2)),
            )
        )
    return bounds


def _read_sheet(
    sheet_xml: bytes,
    title: str,
    shared: list[list[tuple[str, bool | None]]],
    font_strikes: list[bool],
    xf_fonts: list[int],
) -> dict[str, CellFacts]:
    root = ET.fromstring(sheet_xml)
    merges = _merged_bounds(root)

    def hidden_by_merge(column: int, row: int) -> bool:
        """True for a cell inside a merged range that is not its top-left master.

        結合範囲の非先頭セルはExcel上に表示されない。XMLには過去の入力が残ることが
        あり（例: 0501 スマレジ連携処理!O136 に旧「説明」が残留）、変換器はこれを
        描画しない。期待値からも外さないと欠落と誤判定する。
        """
        for min_col, min_row, max_col, max_row in merges:
            if min_col <= column <= max_col and min_row <= row <= max_row:
                return not (column == min_col and row == min_row)
        return False
    out: dict[str, CellFacts] = {}
    sheet_data = root.find(_tag(NS_MAIN, "sheetData"))
    if sheet_data is None:
        return out
    for row in sheet_data.findall(_tag(NS_MAIN, "row")):
        for cell in row.findall(_tag(NS_MAIN, "c")):
            ref = cell.get("r") or ""
            address = _ADDR_RE.match(ref)
            if not address:
                continue
            merged_hidden = hidden_by_merge(
                _column_index(address.group(1)), int(address.group(2))
            )
            style_index = cell.get("s")
            font_id = 0
            if style_index is not None:
                try:
                    index = int(style_index)
                    font_id = xf_fonts[index] if index < len(xf_fonts) else 0
                except (TypeError, ValueError):
                    font_id = 0
            cell_struck = font_strikes[font_id] if font_id < len(font_strikes) else False

            cell_type = cell.get("t")
            raw_runs: list[tuple[str, bool | None]] | None = None
            if cell_type == "s":
                value = cell.find(_tag(NS_MAIN, "v"))
                try:
                    raw_runs = shared[int(value.text or "0")] if value is not None else []
                except (TypeError, ValueError, IndexError):
                    raw_runs = []
            elif cell_type == "inlineStr":
                inline = cell.find(_tag(NS_MAIN, "is"))
                raw_runs = _parse_runs(inline) if inline is not None else []
            elif cell_type == "str":
                value = cell.find(_tag(NS_MAIN, "v"))
                raw_runs = [((value.text or ""), None)] if value is not None else []

            if raw_runs is None:
                # 数値・日付・空セル: 表示文字列は書式に依存するのでここでは持たない。
                # 取り消し線はセルフォントだけで決まる。
                has_value = (
                    cell.find(_tag(NS_MAIN, "v")) is not None
                    or cell.find(_tag(NS_MAIN, "f")) is not None
                )
                out[ref] = CellFacts(
                    sheet=title, ref=ref, runs=[], is_string=False,
                    cell_font_struck=cell_struck, has_value=has_value,
                    merged_hidden=merged_hidden,
                )
                continue

            resolved = [
                (text, cell_struck if strike is None else strike)
                for text, strike in raw_runs
                if text != ""
            ]
            out[ref] = CellFacts(
                sheet=title,
                ref=ref,
                runs=resolved,
                is_string=True,
                cell_font_struck=cell_struck,
                has_value=bool(resolved),
                merged_hidden=merged_hidden,
            )
    return out


def book_number(stem: str) -> str:
    """Return the 4-digit workbook number that prefixes a filename stem."""
    match = re.match(r"(\d{4})", stem)
    return match.group(1) if match else stem[:4]
