# golden review: a06-08-store-stock-retraction

- 確認者: y-saito (Claude実装エージェント支援・実データ直読で人手同等の一次確認を実施)
- 確認日時: 2026-07-24
- 対象: `excel_preprocess/golden/expected/a06-08-store-stock-retraction.json`
- 生成方法: `excel_preprocess/golden/independent_dump.py`(抽出器とは別実装)
- 突合結果: `excel-preprocess verify --mode golden` で抽出器出力
  `excel_blocks/a06-08_api_store_purchase_buying_products_search.json` と**差分0**(2026-07-24)。

## 対象ブロック

- 原本: `excel_to_html/input/0506_基本設計仕様書(API_店頭買取管理).xlsx`
  - SHA-256: `db7b1ef28ddcf3e8419bfdbf94542bd375c2520be88f6b16eb21c391f94c9fbd`
- シート: `カード名から買取用商品情報を取得`(index=9, `xl/worksheets/sheet10.xml`)
- ブロック: `A1:BB1001`(シート全体)

## 重要な訂正(捏造ゼロのため明記)

`integration_test/_poc2_a06-08.md` の `0506:L2698,L2707`(strike)・`0506:L2699,L2708`(生存)
という引用も、m03-11と同様に**HTML出力ファイルの行番号**であり実XLSXのアドレスではない。
実XLSXでの本物の座標は `E17`/`E44`(strike側)・`E18`/`E45`(生存側)である
(列Lではなく列E)。

## 確認セル(独立ダンプでのXML実測値)

| セル | 内容 | 確認事項 |
|---|---|---|
| `A4` | `機能No` | ラベルセル |
| `D4` | `A06-08` | 機能No値 |
| `E17` | `商品の在庫を取得していたところを明示的に本店ECの在庫を取得するようにする`(shared string idx=556) | **1セル内でrunが3分割**: run0「商品の在庫を取得していたところを明示的に」(strike無し)、run1「本店ECの在庫」(`<rPr><strike/></rPr>` あり)、run2「を取得するようにする」(`<rPr><strike/></rPr>` あり)。**セルの `s=` 属性(21→fontId=11)自体は strike を持たない**——`cell.font.strike` が偽でも run 単位の strike を検出できることの実証ケース |
| `E18` | `追加開発でログイン者の所属店舗のEC在庫を取得するようにする`(shared string idx=554) | strikeなし。E17の撤回に対する生存記述 |
| `E44`/`E45` | E17/E18と同一パターンの2件目(同一shared string idx 553/554) | 隣接極性の反復確認 |
| 行6 | `hidden="1"` | 非表示行。行番号を保持しつつ hidden フラグを正しく記録することを確認 |

`xl/sharedStrings.xml` の `<si>` idx=556 を直接確認し、`<r><rPr><strike/></rPr><t>本店ECの在庫</t></r>`
の形で run 単位に strike が付与されていることを確認した(セル全体のstrikeではない)。

## 書式・構造的特徴の確認

- 結合セル: 61件。
- カスタム行高: 1001行中989行。
- 非表示行: 行6(`hidden="1"`)。仕様§2.1「非表示シートを含めて機能Noラベル候補を探す」の
  シート単位の要件に加え、行単位の非表示も本ケースで確認できる。

## 差分0検証の実行記録(2026-07-24)

```
excel-preprocess extract --fid a06-08 ... -> exit 0
excel-preprocess verify --mode source --source 0506_....xlsx -> OK diffs=0
excel-preprocess verify --mode reconstruct -> OK diffs=0
excel-preprocess verify --mode golden --golden-expected a06-08-store-stock-retraction.json -> OK diffs=0
```

## 独立性の証跡

独立ダンパーが抽出器を一切importしていないことのimport文レベルの証跡は
`expected/INDEPENDENCE_EVIDENCE.md` に集約した(codex D2レビュー付随指摘への回答)。
