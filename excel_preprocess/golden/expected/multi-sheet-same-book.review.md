# golden review: multi-sheet-same-book

- 確認者: y-saito (Claude実装エージェント支援・実データ直読で人手同等の一次確認を実施)
- 確認日時: 2026-07-24
- 対象: `expected/m03-11-category-strike.json`(パート1)+ `expected/multi-sheet-same-book-m03-45.json`(パート2)
- 生成方法: 両パートとも `excel_preprocess/golden/independent_dump.py`(抽出器とは別実装)
- 突合結果: 両パートとも `excel-preprocess verify --mode golden` で対応する抽出器出力と
  **差分0**(2026-07-24)。

## 構成

同一ブック `0204_基本設計仕様書(商品管理).xlsx`(SHA-256
`81873f2dbc509c4c83ecf6b85001ea02e1eebb4d18682cac6b3d04ba1a81fdf1`)内の2機能:

| パート | fid | シート | index | ブロック |
|---|---|---|---|---|
| 1 | `m03-11_admin_product_product_category_register_edit` | `カテゴリ登録` | 25 | A1:BM949 |
| 2 | `m03-45_admin_product_product_category_list` | `カテゴリ一覧` | 24 | A1:BF840 |

パート1は `m03-11-category-strike` ケースと同一実体を再利用している(同一ブック・
同一シート・同一ブロックのため、別の独立ダンプを重複生成する意味がないと判断)。

## 確認事項

- `sheet_index`(0-based, workbook.xml上の宣言順): m03-11=25, m03-45=24 — 隣接シートだが
  異なるindex/異なるrIdを正しく解決できることを確認。
- `sheet_state`: 両シートとも `visible`。
- ブック番号引用(`workbook_no`=`0204`)が両パートで一致すること、かつ `sha256` が
  同一ブックである旨も一致することを確認。

## 「表示/非表示状態」観点についての補足(要確認事項として記録)

仕様§5の当該ケース説明は「sheet relationship、表示／非表示状態、ブック番号引用を確認」
としている。当初、非表示シート側の実例として `0506`(及び他の多くのブック)に存在する
隠しシート「機能A」(`F06-10` という機能Noラベルを持つ)を使う計画だったが、
`excel-preprocess detect --fid f06-10` を実データに対して実行したところ、
`F06-10` は 21ブック(0204/0205/0209/0211/0212/0214/0306/0402/0404/0406/0408/0413/
0416/0501/0502/0506/0507/0516/0517/0601)の隠しシート「機能A」すべてに**同一の
プレースホルダ文言として重複**しており、`AMBIGUOUS_BLOCK_BOUNDARY` として正しく
拒否された。これは「機能A」が各ブックへコピーされた**未使用テンプレートシート**
であり実際の個別機能ではないことを示す実データ根拠であるため、これをあたかも
実在の隠し機能であるかのように golden ケースへ採用することは捏造に当たると判断し、
不採用とした。

したがって本ケースでは、`sheet_state` フィールド自体が非表示状態を正しく記録できる
ことは `a06-08-store-stock-retraction`(行6 `hidden="1"`)および
`excel-preprocess detect` の 39ブック走査で確認済みの `sheet.state` 解決ロジック
(仕様§2.1「非表示シートを含めて機能Noラベル候補を探す」)で担保し、本ケースは
「同一ブック内の複数シート・複数機能」の観点(sheet relationship・ブック番号引用)
にスコープを絞った。この判断はcodexレビューでの要確認事項として明記する。

## 差分0検証の実行記録(2026-07-24)

```
excel-preprocess extract --fid m03-45 ... -> exit 0
excel-preprocess verify --mode source --source 0204_....xlsx -> OK diffs=0
excel-preprocess verify --mode reconstruct -> OK diffs=0
excel-preprocess verify --mode golden --golden-expected multi-sheet-same-book-m03-45.json -> OK diffs=0
(m03-11パートは m03-11-category-strike.review.md 参照。同一に exit 0)
```

## 独立性の証跡

独立ダンパーが抽出器を一切importしていないことのimport文レベルの証跡は
`expected/INDEPENDENCE_EVIDENCE.md` に集約した(codex D2レビュー付随指摘への回答)。
