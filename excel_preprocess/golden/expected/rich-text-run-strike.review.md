# golden review: rich-text-run-strike

- 確認者: y-saito (Claude実装エージェント支援・実データ直読で人手同等の一次確認を実施)
- 確認日時: 2026-07-24
- 対象: `excel_preprocess/golden/expected/rich-text-run-strike.json`
- 生成方法: `excel_preprocess/golden/independent_dump.py`(抽出器とは別実装)
- 突合結果: `excel-preprocess verify --mode golden` で抽出器出力
  `excel_blocks/m03-30-format-sheet.json` と**差分0**(2026-07-24)。

## fidについて(要確認事項)

このケースの `fid`(`m03-30-format-sheet`)は **`integration_test/fid_kubun.tsv` に存在しない
golden専用の合成識別子**である。理由は以下の通り。

`excel-preprocess detect --fid m03-30` を実行したところ、`M03-30` という機能Noラベルは
`0204_基本設計仕様書(商品管理).xlsx` の **2つの異なるシート**
(`xl/worksheets/sheet43.xml`=「基準価格変更CSVアップロード」、
`xl/worksheets/sheet44.xml`=「基準価格変更CSVフォーマット」)に実在し、
ツールは仕様§2.3「同一fidが複数ブック／シートで検出される」に該当するとして
`AMBIGUOUS_BLOCK_BOUNDARY` を正しく返した(exit 1)。これはツールの不具合ではなく、
実データが本当に曖昧であることの検出である。

このgoldenケースが必要とする「1セル内でstrike run と非strike runが共存する」実例
(shared string idx=1928)は sheet44 側にのみ存在するため、golden corpus専用の目的で
sheet44 を人手選定し、`fid="m03-30-format-sheet"`・`function_no="M03-30"` として
`excel_blocks/manifest.json` へ個別承認した(T2本番のfid_kubun.tsv行には対応しない
=このfidをT2の305/306集合には含めない)。

## 対象ブロック

- 原本: `excel_to_html/input/0204_基本設計仕様書(商品管理).xlsx`(SHA-256 同上)
- シート: `基準価格変更CSVフォーマット`(index=43, `xl/worksheets/sheet44.xml`)
- ブロック: `A1:BB789`(シート全体)

## 確認セル(独立ダンプでのXML実測値)

| セル | 内容 | 確認事項 |
|---|---|---|
| `E10` | `販売価格 基準価格`(shared string idx=1928) | **1セル内で2 run**: run0「販売価格」(`<rPr><strike/>...` あり=strike)、run1「 基準価格」(`<rPr>...` にstrike無し、かつ `xml:space="preserve"` で**先頭半角スペースを保持**)。セル全体strikeの検査だけでは不十分であることを固定するケース |
| セルスタイル | xf id=670→fontId=47 | セル自体は strike=false(runのみがstrikeを持つ) |

`xl/sharedStrings.xml` の `<si>` idx=1928 を直接確認した:

```xml
<si>
  <r><rPr><strike/><sz val="9"/><color rgb="FFFF0000"/><rFont val="Meiryo"/>...</rPr><t>販売価格</t></r>
  <r><rPr><sz val="9"/><color rgb="FFFF0000"/><rFont val="Meiryo"/>...</rPr><t xml:space="preserve"> 基準価格</t></r>
</si>
```

## 差分0検証の実行記録(2026-07-24)

```
excel-preprocess extract --fid m03-30-format-sheet ... -> exit 0
excel-preprocess verify --mode source --source 0204_....xlsx -> OK diffs=0
excel-preprocess verify --mode reconstruct -> OK diffs=0
excel-preprocess verify --mode golden --golden-expected rich-text-run-strike.json -> OK diffs=0
```

## 独立性の証跡

独立ダンパーが抽出器を一切importしていないことのimport文レベルの証跡は
`expected/INDEPENDENCE_EVIDENCE.md` に集約した(codex D2レビュー付随指摘への回答)。
