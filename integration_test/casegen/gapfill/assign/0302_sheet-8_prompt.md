# 依頼: シート「別添資料_通知一覧」（0302_sheet-8）の抜け1件を、どの機能の結合テストケースにするか決める

リポジトリ `/home/y-saito/Developments/hareruya-design-docs/`。出力は日本語。ファイルは下の出力1つだけを書く。

このシートは対応する機能が無い（別添資料・共通処理など）ため、被覆監査で見つかった「ケースが無い定め」を、どの機能のケースとして書くかが決まっていない。
1件ずつ、**その定めのふるまいを実際に起こす操作・処理を持つ機能**を、下の候補から1つ選べ。

- 抜けの一覧: `integration_test/casegen/gapfill/assign/0302_sheet-8_in.tsv`
- 設計書（行頭 L0001 が行番号）: `integration_test/casegen/coverage_audit/units/0302_sheet-8/sheet.txt`
- 候補の機能の設計書は `integration_test/casegen/coverage_audit/units/0302_<シートID>/sheet.txt`（対応は `coverage_audit/units.tsv`）、既存ケースは `integration_test/casegen/cases/<機能ID>_test_cases.tsv`。必要な分だけ読む。

決め方:
- 1巡目がテストIDを挙げている（一部抜け）なら、原則そのテストIDの機能。
- 複数の機能で同じふるまいが起きる定め（例: 「各機能で在庫チェックを行う」）は、理由に書かれている未確認の操作を持つ機能を選ぶ。決め手が無ければ、その定めをいちばん直接に実行する機能。
- 候補のどれにも当たらないときだけ、機能IDを `該当なし` とし、理由を書く。

候補（同じ冊子でケースを持つ機能）:

| 機能ID | 機能名 | シート |
| --- | --- | --- |
| F02-01 | PC版ナビゲーション | PC版ナビゲーション |
| F02-02 | スマホ版ナビゲーション | スマホ版ナビゲーション |
| F02-03 | 支店PC版ナビゲーション | 支店PC版ナビゲーション |
| F02-04 | 支店スマホ版ナビゲーション | 支店スマホ版ナビゲーション |
| F02-05 | 通知 | 通知 |

出力: `integration_test/casegen/gapfill/assign/0302_sheet-8_out.tsv`（ヘッダつきタブ区切り・全1件）

```
指摘ID	機能ID	理由
```

返答は、機能IDごとの件数を1行で。
