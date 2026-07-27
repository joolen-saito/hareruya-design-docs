# golden review: m03-11-category-strike

- 確認者: y-saito (Claude実装エージェント支援・実データ直読で人手同等の一次確認を実施)
- 確認日時: 2026-07-24
- 対象: `excel_preprocess/golden/expected/m03-11-category-strike.json`
- 生成方法: `excel_preprocess/golden/independent_dump.py`(抽出器 `excel_preprocess/ooxml.py` / `canonical.py` とは別実装。dataclass不使用・走査順序も別)
- 突合結果: `excel-preprocess verify --mode golden` で抽出器出力 `excel_blocks/m03-11_admin_product_product_category_register_edit.json` と **差分0**(2026-07-24実行)。

## 対象ブロック

- 原本: `excel_to_html/input/0204_基本設計仕様書(商品管理).xlsx`
  - SHA-256: `81873f2dbc509c4c83ecf6b85001ea02e1eebb4d18682cac6b3d04ba1a81fdf1`
- シート: `カテゴリ登録`(workbook.xml 上のシート順 index=25、0-based。`xl/worksheets/sheet26.xml`)
- ブロック: `A1:BM949`(シート全体。1シート=1機能であることを39ブック全数走査で確認済み——後述の「重要な訂正」参照)

## 重要な訂正(捏造ゼロのため明記)

既存ドラフト(`integration_test/e2e/exec/_drafts/m03-11_...executable_draft.md` および
`T2_EXCEL_PREPROCESS_SPEC.md` 自身)は「`0204:6182-6480` 行・機能Noセル `0204:6195`・
strike `0204:6285,6287`」と記載しているが、これらは**実XLSXのセル座標ではない**。
`xl/worksheets/sheet26.xml` の `<dimension ref="A1:BM949"/>` から、当該シートは
最大行949までしか存在せず、行6182などそもそも物理的に存在しない。

実際に確認したところ、この行番号は `excel_to_html/output/0204_基本設計仕様書(商品管理).html`
という**複数シートを1ファイルに連結したHTML出力ファイルの行番号**
(`integration_test/tools/excel_spec_parser.py` の `doc_lines()` が返す `enumerate(..., 1)` の
行番号)であり、Excelの行アドレスと無関係である。T2前処理仕様書 §2.2 の実例citationは
このHTML行番号を誤ってExcelアドレス表記のまま引用したものであり、本ゴールデンケースは
**実XLSXを直接読んで得た本物の座標**(A4/D4=機能Noラベル・値、D142/D144=strike対象)
で再確定した。

## 確認セル(独立ダンプでのXML実測値)

| セル | 内容 | 確認事項 |
|---|---|---|
| `A4` | `機能No`(shared string idx=18) | 機能ブロックのラベルセル |
| `D4` | `M03-11`(shared string idx=445) | 機能No値。A4/D4の構造マッチが境界根拠 |
| `D142` | `※この画面からの画像アップロードは実施しない。`(shared string idx=764, **runなしのプレーン文字列**) | セルの**xf(style id=731→fontId=72)自体が `<strike/>` を持つ**(セル全体strike)。`cell.font.strike` が真であるケース |
| `S142` | `※この画面からの画像アップロード、削除、変更を実施可能とする`(shared string idx=2233) | xf(style id=227→fontId=6)は strike なし。D142の撤回に対する生存記述(隣接セルの極性) |
| `D144` | D142と同一パターン(shared string idx=764, style id=731) | 識別ID:11(カテゴリアイコン画像)側の同型strike。撤回記述の2件目 |
| `S144` | D144の生存記述(shared string idx=2233, style id=227) | 同上 |

`xl/styles.xml` の `cellXfs[731]` → `fontId=72` → `<font><strike/><sz val="9"/>...</font>` を
直接確認し、`<strike/>` に `val` 属性が無い(=真)ことを確認した。

## 書式・構造的特徴の確認

- 結合セル: 57件(`mergeCells` 要素実測)。例 `B170:D170`, `AG171:AY171` 等。
- カスタム行高: 949行中873行が `customHeight="1"` を持つ。
- 書式のみの空行: 行177〜949(773行連続)は `<c>` 要素は存在するがテキスト・数式を
  一切持たない「書式のみセル」の連続。行番号を詰めずそのまま保持することを確認。
- drawing: `xl/worksheets/sheet26.xml` の `<drawing r:id="rId1"/>` から図形パートが
  存在することを確認し、`drawing_residuals` にアンカーセルのみ記録(画像内容は再構成しない)。

## 差分0検証の実行記録(2026-07-24)

```
excel-preprocess extract --fid m03-11 ... -> exit 0
excel-preprocess verify --mode source --source 0204_....xlsx -> OK diffs=0
excel-preprocess verify --mode reconstruct -> OK diffs=0
excel-preprocess verify --mode golden --golden-expected m03-11-category-strike.json -> OK diffs=0
```

陰性テスト: `D142` の `format_classes`/`effective_strike` を意図的に破壊したコピーで
`verify --mode golden` を実行し、`CELL_STYLE_MISMATCH 0204:D142 expected=['cell-strike']
actual=[]` および `RICH_RUN_MISMATCH` が正しく報告され exit 1 になることを確認済み
(検証器が実際に差分を検出する能力を持つことの確認)。

## 独立性の証跡

独立ダンパーが抽出器を一切importしていないことのimport文レベルの証跡は
`expected/INDEPENDENCE_EVIDENCE.md` に集約した(codex D2レビュー付随指摘への回答)。
