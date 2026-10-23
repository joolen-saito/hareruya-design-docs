### 指摘（O01-03 / IT-O01-03-003）
- 主張: アプリ一覧の状態・枚数と、出力CSVの明細内容を一つの期待結果にしている（[ケース2行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/O01-03_A_rv_test_cases.tsv:2)）。
- 実際: 設計書は一覧の行の編集前の枚数を引き継ぐことを定め（[設計書L0037](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/O01-03/design.txt:37)）、CSVの明細は「一覧の1行につき1行」と別に定める（[同L0061](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/O01-03/design.txt:61)）。
- 判定: 複数の期待結果
- 修正案: 一覧表示とCSV出力内容を別の判定として整理する。

### 指摘（O01-03 / IT-O01-03-004）
- 主張: アプリ一覧の商品名・プロモと、出力CSVの商品コード・略称タグ・レアリティを一つの期待結果にしている（[ケース3行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/O01-03_A_rv_test_cases.tsv:3)）。
- 実際: 設計書は一覧へ足す行の値を定め（[設計書L0031〜L0038](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/O01-03/design.txt:31)）、CSVへ出す列を別に定める（[同L0074〜L0085](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/O01-03/design.txt:74)）。
- 判定: 複数の期待結果
- 修正案: 一覧表示とCSV出力内容を別の判定として整理する。

### 指摘（O01-03 / IT-O01-03-005）
- 主張: アプリ一覧の言語・状態と、出力CSVの商品コード・状態・言語IDを一つの期待結果にしている（[ケース4行](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/revive/cases/O01-03_A_rv_test_cases.tsv:4)）。
- 実際: 設計書は一覧行の言語・状態を定め（[設計書L0036](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/O01-03/design.txt:36)）、CSVの言語ID・状態の列を別に定める（[同L0082〜L0085](/home/y-saito/Developments/hareruya-design-docs/integration_test/casegen/fp_gap/units/O01-03/design.txt:82)）。
- 判定: 複数の期待結果
- 修正案: 一覧表示とCSV出力内容を別の判定として整理する。
