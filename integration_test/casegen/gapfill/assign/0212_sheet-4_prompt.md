# 依頼: シート「デッキ一覧(検索結果)」（0212_sheet-4）の抜け15件を、どの機能の結合テストケースにするか決める

リポジトリ `/home/y-saito/Developments/hareruya-design-docs/`。出力は日本語。ファイルは下の出力1つだけを書く。

このシートは複数の機能に対応するため、被覆監査で見つかった「ケースが無い定め」を、どの機能のケースとして書くかが決まっていない。
1件ずつ、**その定めのふるまいを実際に起こす操作・処理を持つ機能**を、下の候補から1つ選べ。

- 抜けの一覧: `integration_test/casegen/gapfill/assign/0212_sheet-4_in.tsv`
- 設計書（行頭 L0001 が行番号）: `integration_test/casegen/coverage_audit/units/0212_sheet-4/sheet.txt`
- 候補の機能の設計書は `integration_test/casegen/coverage_audit/units/0212_<シートID>/sheet.txt`（対応は `coverage_audit/units.tsv`）、既存ケースは `integration_test/casegen/cases/<機能ID>_test_cases.tsv`。必要な分だけ読む。

決め方:
- 1巡目がテストIDを挙げている（一部抜け）なら、原則そのテストIDの機能。
- 複数の機能で同じふるまいが起きる定め（例: 「各機能で在庫チェックを行う」）は、理由に書かれている未確認の操作を持つ機能を選ぶ。決め手が無ければ、その定めをいちばん直接に実行する機能。
- 候補のどれにも当たらないときだけ、機能IDを `該当なし` とし、理由を書く。

候補（同じ冊子でケースを持つ機能）:

| 機能ID | 機能名 | シート |
| --- | --- | --- |
| M15-01 | デッキ検索/一覧 | デッキ一覧(検索入力)、デッキ一覧(検索結果) |
| M15-02 | デッキCSV出力 | デッキ一覧(検索結果) |

出力: `integration_test/casegen/gapfill/assign/0212_sheet-4_out.tsv`（ヘッダつきタブ区切り・全15件）

```
指摘ID	機能ID	理由
```

返答は、機能IDごとの件数を1行で。
