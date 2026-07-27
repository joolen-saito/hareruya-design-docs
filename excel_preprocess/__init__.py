"""T2 Excel前処理ツール(excel-preprocess)。

正典: integration_test/T2_EXCEL_PREPROCESS_SPEC.md

このパッケージは選定済みExcel機能ブロックのセル座標・空行・書式・rich-text run・
結合範囲・行列属性・数式を、元 .xlsx の SpreadsheetML と意味等価に
`excel_blocks/<fid>.json` へ固定し、元ブックと機械比較する。

書式・rich-text・strike の正本は zipfile + xml.etree.ElementTree による直接XML読取
(`excel_preprocess.ooxml`)である。openpyxl はブック/シート/結合の補助にのみ用いる
(`excel_preprocess.reconstruct` の書き戻し補助)。
"""

__version__ = "1.0"
