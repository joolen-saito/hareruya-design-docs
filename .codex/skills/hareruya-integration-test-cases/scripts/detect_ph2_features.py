#!/usr/bin/env python3
"""Detect Ph2 (phase-2 and later) features from Excel design workbooks.

The "…はPh2で対応するため、Ph1では実装しない" notes are authored as DrawingML
shape/textboxes in the Excel design books under ``excel_to_html/input/*.xlsx``.
Some of these shape notes never reach the generated function HTML (e.g. F02-05),
so grepping HTML / generated test cases is not reliable. This script reads the
drawing XML directly (shape-level concatenated text + anchor cell + sheet name)
and reports every Ph2 marker, so the exclusion lists in the test generators can
be kept in sync with the source of truth.

Usage:
    python3 .codex/skills/hareruya-integration-test-cases/scripts/detect_ph2_features.py --repo .
"""

from __future__ import annotations

import argparse
import glob
import os
import re
import zipfile
from xml.etree import ElementTree as ET

NS_XDR = "http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing"
NS_A = "http://schemas.openxmlformats.org/drawingml/2006/main"
NS_R = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
NS_S = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"

# 表記ゆれを含む Ph2 判別パターン（半角/全角・大文字小文字・「〜にて/で対応」「フェーズ2以降」等）。
PH2_RE = re.compile(r"[Pp][Hh]2|フェーズ2|フェーズ２|フェーズⅡ|2次|二次")


def col_letter(n: str) -> str:
    num = int(n)
    out = ""
    while True:
        out = chr(65 + num % 26) + out
        num = num // 26 - 1
        if num < 0:
            break
    return out


def sheet_drawing_map(z: zipfile.ZipFile) -> dict[str, str]:
    """drawingN.xml -> sheet display name."""
    wb = ET.fromstring(z.read("xl/workbook.xml"))
    rels = ET.fromstring(z.read("xl/_rels/workbook.xml.rels"))
    rid2tgt = {r.get("Id"): r.get("Target") for r in rels}
    mapping: dict[str, str] = {}
    for s in wb.iter(f"{{{NS_S}}}sheet"):
        rid = s.get(f"{{{NS_R}}}id")
        tgt = rid2tgt.get(rid, "")
        if not tgt:
            continue
        sheet_part = "xl/" + tgt.lstrip("/")
        rel_part = os.path.dirname(sheet_part) + "/_rels/" + os.path.basename(sheet_part) + ".rels"
        if rel_part not in z.namelist():
            continue
        for r in ET.fromstring(z.read(rel_part)):
            if r.get("Type", "").endswith("/drawing"):
                drawing = os.path.normpath(r.get("Target").replace("../", "xl/"))
                mapping[drawing] = s.get("name")
    return mapping


def scan_workbook(path: str) -> list[dict[str, str]]:
    hits: list[dict[str, str]] = []
    with zipfile.ZipFile(path) as z:
        draw2sheet = sheet_drawing_map(z)
        for name in z.namelist():
            if not re.match(r"xl/drawings/drawing\d+\.xml$", name):
                continue
            root = ET.fromstring(z.read(name))
            for anchor in root:
                text = "".join(t.text or "" for t in anchor.iter(f"{{{NS_A}}}t")).strip()
                if not text or not PH2_RE.search(text):
                    continue
                cell = "?"
                frm = anchor.find(f"{{{NS_XDR}}}from")
                if frm is not None:
                    col = frm.find(f"{{{NS_XDR}}}col")
                    row = frm.find(f"{{{NS_XDR}}}row")
                    if col is not None and row is not None:
                        cell = col_letter(col.text) + str(int(row.text) + 1)
                hits.append(
                    {
                        "book": os.path.basename(path),
                        "sheet": draw2sheet.get(name, "(?)"),
                        "cell": cell,
                        "text": text,
                    }
                )
    return hits


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default=".")
    args = parser.parse_args()
    pattern = os.path.join(args.repo, "excel_to_html/input/*.xlsx")
    total = 0
    for book in sorted(glob.glob(pattern)):
        if os.path.basename(book).startswith("~$"):
            continue
        for hit in scan_workbook(book):
            total += 1
            print(f"[{hit['book'][:4]}] sheet='{hit['sheet']}' @{hit['cell']}: {hit['text'][:100]}")
    print(f"# ph2 shape notes: {total}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
