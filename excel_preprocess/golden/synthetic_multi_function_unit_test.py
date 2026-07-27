#!/usr/bin/env python3
"""multi-function-contiguous 境界分割ロジックの単体テスト(合成最小xlsx)。

**これはD2 golden corpusの代替ではない。** `excel_preprocess.golden.manifest`
の `multi-function-contiguous` ケースは実データに存在しない
(`expected/multi-function-contiguous.GAP_REPORT.md` 参照・643シート全数走査で
distinct-FID/sheet の最大値=1、該当0件を確認済み)。仕様§5のgolden要件は
「実ブックから選定」であり、合成データはgoldenの正本になり得ない。

このスクリプトは、`block_finder.detect_block_for_fid` の「同一シート内に
複数の機能マーカーがある場合、行順で隣接マーカー間を連続分割する」ロジック
(仕様§2.2)が実装として機能することを、programmatically構築した最小xlsx
(openpyxlで2機能を1シートに詰め込んだもの)で検証する。実データでは検証
できない分岐を補うための単体テストであり、codex D2レビューでの代替案として
提示するもの。

実行: `excel_to_html/.venv/bin/python3 excel_preprocess/golden/synthetic_multi_function_unit_test.py`
"""
from __future__ import annotations

import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from openpyxl import Workbook

from excel_preprocess import block_finder, ooxml
from excel_preprocess.errors import AmbiguousBlockBoundaryError


def build_synthetic_workbook(path: Path) -> None:
    """1シートに2機能(T01-01, T02-01)を実コーパスと同じ配置パターン
    (A列=ラベル、D列=値、4行目からメタデータ開始)で詰め込む。"""
    wb = Workbook()
    ws = wb.active
    ws.title = "合成テストシート"

    # function T01-01: header rows 1-3, marker at row 4, body to row 40
    ws["A1"] = "表紙相当"
    ws["A3"] = "更新日"
    ws["B3"] = "2026-01-01"
    ws["A4"] = "機能No"
    ws["D4"] = "T01-01"
    ws["A5"] = "機能名"
    ws["D5"] = "合成関数A"
    for r in range(6, 40):
        ws[f"B{r}"] = f"T01-01 body row {r}"
    ws["B39"] = "★カスタマイズ相当の目印"

    # function T02-01: marker at row 41, body to row 80
    ws["A40"] = "更新日"
    ws["B40"] = "2026-02-02"
    ws["A41"] = "機能No"
    ws["D41"] = "T02-01"
    ws["A42"] = "機能名"
    ws["D42"] = "合成関数B"
    for r in range(43, 80):
        ws[f"B{r}"] = f"T02-01 body row {r}"

    wb.save(path)


def main() -> int:
    with tempfile.TemporaryDirectory(prefix="excel_preprocess_synth_") as tmp:
        xlsx_path = Path(tmp) / "synthetic_multi_function.xlsx"
        build_synthetic_workbook(xlsx_path)

        reader = ooxml.WorkbookReader(xlsx_path)
        sheet = reader.sheets[0]

        markers = block_finder.find_function_markers_in_sheet(reader, sheet)
        assert len(markers) == 2, f"expected 2 markers, got {len(markers)}: {markers}"
        assert markers[0].fid == "T01-01" and markers[0].row == 4, markers[0]
        assert markers[1].fid == "T02-01" and markers[1].row == 41, markers[1]
        print(f"PASS: find_function_markers_in_sheet found {len(markers)} markers in one sheet: "
              f"{[(m.fid, m.row) for m in markers]}")

        block1, evidence1 = block_finder.detect_block_for_fid(reader, sheet, "T01-01")
        assert block1.row_start == 1, f"T01-01 row_start expected 1, got {block1.row_start}"
        assert block1.row_end == 40, f"T01-01 row_end expected 40 (row before T02-01's marker row 41), got {block1.row_end}"
        print(f"PASS: T01-01 block = rows {block1.row_start}-{block1.row_end} (excludes T02-01's marker row 41)")

        block2, evidence2 = block_finder.detect_block_for_fid(reader, sheet, "T02-01")
        assert block2.row_start == 41, f"T02-01 row_start expected 41, got {block2.row_start}"
        # last marker -> block runs to the sheet's materialized max row
        max_row, _ = block_finder._sheet_max_row_col(reader.sheet_xml(sheet))
        assert block2.row_end == max_row, f"T02-01 row_end expected {max_row}, got {block2.row_end}"
        print(f"PASS: T02-01 block = rows {block2.row_start}-{block2.row_end} (excludes T01-01's body, starts exactly at its own marker row)")

        # no row overlap between the two split blocks, and no row dropped between them
        assert block1.row_end + 1 == block2.row_start, (
            f"boundary split must be contiguous with no gap/overlap: "
            f"block1 ends {block1.row_end}, block2 starts {block2.row_start}"
        )
        print("PASS: boundary split is contiguous (no row gap, no row overlap, no next-function bleed)")

        # ambiguity check: querying a fid that doesn't exist in this sheet must fail loudly
        try:
            block_finder.detect_block_for_fid(reader, sheet, "T09-09")
            print("FAIL: expected AmbiguousBlockBoundaryError for a fid not present in the sheet")
            return 1
        except AmbiguousBlockBoundaryError:
            print("PASS: querying a non-existent fid in this sheet raises AmbiguousBlockBoundaryError as expected")

    print("\nALL SYNTHETIC UNIT TESTS PASSED (this is a unit test, NOT a D2 golden case; see module docstring)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
