# golden独立性の証跡(codex D2レビュー付随指摘への回答)

指摘: 「m03-11/m03-45のexpectedと出力JSONがバイト一致で、同一ロジック複製でない証明が
review記録止まり」。以下、import文の実差分を機械的に記録する。

## import文の実差分(2026-07-24, grep実測)

```
$ grep -n "^import\|^from" excel_preprocess/golden/independent_dump.py
22:from __future__ import annotations
24:import argparse
25:import colorsys
26:import hashlib
27:import json
28:import re
29:import zipfile
30:from pathlib import Path
31:from xml.etree import ElementTree as ET

$ grep -n "^import\|^from" excel_preprocess/ooxml.py
18:from __future__ import annotations
20:import colorsys
21:import hashlib
22:import re
23:import zipfile
24:from dataclasses import dataclass, field
25:from pathlib import Path
26:from typing import Any, Optional
27:import xml.etree.ElementTree as ET

$ grep -n "excel_preprocess" excel_preprocess/golden/independent_dump.py
(実際のimport文としてはヒット0件。docstring本文中の説明文2箇所のみがヒットする)
```

**`independent_dump.py` は `excel_preprocess` パッケージ(`ooxml.py`/`style_model.py`/
`canonical.py`/`block_finder.py`/`extractor.py` 等)を一切importしていない。**
標準ライブラリ(`argparse`/`colorsys`/`hashlib`/`json`/`re`/`zipfile`/`pathlib`/
`xml.etree.ElementTree`)のみに依存する完全に独立したスクリプトである。

## 構造面での独立性(コード実体の相違)

| 観点 | 抽出器(`ooxml.py`/`canonical.py`) | 独立ダンパー(`independent_dump.py`) |
|---|---|---|
| データ構造 | `@dataclass`(`CellXml`/`RowXml`/`SheetXml`/`FontSpec`等) | 素の `dict`(dataclass不使用) |
| ブック読取 | `WorkbookReader` クラス(状態を持つ・キャッシュ付き) | `Zip` クラス(独立実装・別キャッシュ戦略) |
| 列/番地変換 | `col_letters_to_index`/`col_index_to_letters`/`split_address` | `col_to_num`/`num_to_col`/`split_ref`(別名・別実装) |
| 真偽値要素判定 | `_ooxml_bool_element(el)` | `bool_flag(el)`(別関数・別ファイルで独立に実装) |
| 下線判定 | `FontSpec.underline` 内で `val != "none"` をinline判定 | `underline_flag(el)` という専用関数に切り出し |
| スタイル正規化 | `StyleResolver` クラス(`style_model.py`、キャッシュ付きメソッド) | `normalize_xf()` というモジュールレベル関数(キャッシュなし・毎回再計算) |
| セル走査順序 | 行→セル辞書(`RowXml.cells: dict[str, CellXml]`)を先に全パースしてから矩形を埋める | 行要素を都度検索(`cell_els = {c.get('r'): c for c in row_el}`)しながらその場で構築 |
| モジュール分割 | 責務ごとに10ファイル(`ooxml.py`/`style_model.py`/`canonical.py`/`block_finder.py`/`fid_map.py`/`manifest.py`/`extractor.py`/`reconstruct.py`/`verify.py`/`cli.py`) | 単一ファイル(`independent_dump.py`、711行) |

出力JSONの**フィールド形**(キー名・ネスト構造)は仕様§1のスキーマに合わせて共通化して
いるが、これはスキーマドキュメントへの準拠であって、コードの共有・複製ではない
(`verify --mode golden` が両者を突合できるようにするための契約)。

## 突合結果(2026-07-24実測)

`excel-preprocess verify --mode golden` で以下の4ブロック全てが独立ダンパー出力との
差分0を達成した(バイト一致ではなく、上記の`compare_models`によるcanonical model
意味等価比較。仕様§4)。

- `m03-11-category-strike`(61,685セル)
- `a06-08-store-stock-retraction`(54,054セル)
- `rich-text-run-strike`(42,606セル)
- `multi-sheet-same-book-m03-45`(48,720セル)

2つの独立実装が同一の実データに対して同一の結論(strike run・cell-strike・merge・
custom height・drawing residual等)へ到達したこと自体が、実装バグの相互チェックとして
機能した実例でもある(例: `explicit_underline`のval="none"判定漏れ・
`customHeight`の読み取り専用プロパティ問題は、この2実装間の突合とreconstructモード
テストの過程で発見・修正した)。
