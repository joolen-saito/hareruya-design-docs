# M04-20（欠品履歴CSV出力） 結合試験テストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m04-20_admin_stock_stock_shortage_history_csv_export.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-16 | 実行結果 |
| IT-27 | 出力失敗、実行結果 |
| IT-15 | CSRF、対象データ、未認証、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、UI部品、URL、操作起点、確認ダイアログ、送信可否制御 |
| IT-03 | 外部画面、画面遷移 |
| IT-13 | URL直接アクセス |
| IT-22 | DBとの相関バリデーション、その他のバリデーション、必須バリデーション、必須制御、数値バリデーション、文字列長バリデーション、文字種バリデーション、相関バリデーション、部分入力 |
| IT-26 | 実行結果、更新内容、登録内容 |
| IT-23 | 実行結果、更新内容、登録内容 |

## テストケースTSV

以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し（先頭列は `機能名`、**テストレベル列なし**）。**2行目以降**がケース（各10列）。`機能名` 列に元設計の表示名を入れる。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-001	IT-16	実行結果	P1	実行結果の結合確認	機能名を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-002	IT-27	実行結果	P1	実行結果の結合確認	実装確認を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-003	IT-27	出力失敗	P1	出力失敗の結合確認	2026-06-12を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で出力失敗の対象ファイルと処理条件を指定する	"1. 対象画面で出力失敗のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力失敗のファイル出力内容または取り込み結果が対象データと一致すること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-004	IT-15	CSRF	P1	CSRFの結合確認	欠品履歴CSV出力を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）でCSRFの対象ファイルと処理条件を指定する	"1. 対象画面でCSRFのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	CSRFのファイル出力内容または取り込み結果が対象データと一致すること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-005	IT-15	未認証	P1	未認証の結合確認	文字コードを試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で未認証の対象ファイルと処理条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	eccube_csv_export_encoding（既定 SJIS-win）であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-006	IT-15	対象データ	P1	対象データの結合確認	ファイル名を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で対象データの対象ファイルと処理条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	stock_history_disposal_ + 出力時刻 YmdHis + .csv（例: stock_history_disposal_20260612153000.csv）であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-007	IT-20	出力抑止	P1	出力抑止の結合確認	出力方式を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で出力抑止の対象ファイルと処理条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	StreamedResponseであること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-008	IT-20	識別子	P1	識別子の結合確認	ids パラメータ無し / 空配列 / 0以下のみ（有効ID0件）を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で識別子の対象ファイルと処理条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	responseNoStockHistoryIdError()：addError('eccube.admin.error', trans('admin.stock_history.not_select')) を表示し、…であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-009	IT-15	状態変化	P1	状態変化の結合確認	指定IDに該当する在庫履歴が存在しない / 変換結果が空を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で状態変化の対象ファイルと処理条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	StockHistoryDisposalCsv::exportCsv() が RuntimeException を送出であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-010	IT-25	UI部品	P3	UI部品の操作結果確認	正常を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）でUI部品の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 正常を確認する
3. 画面表示と後続状態を確認する"	StreamedResponse（HTTP 200、text/csv、attachment）を返すこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-011	IT-25	UI部品	P3	UI部品の操作結果確認	主データを試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）でUI部品の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 主データを確認する
3. 画面表示と後続状態を確認する"	欠品履歴CSV出力は**参照のみ**で業務データを更新しない（在庫・履歴の更新は行わない）であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-012	IT-25	操作起点	P1	操作起点の操作結果確認	ログを試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で操作起点の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ログを確認する
3. 画面表示と後続状態を確認する"	出力ファイル名を log_info でアプリケーションログに記録すること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-013	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	出力対象の在庫履歴を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 出力対象の在庫履歴を確認する
3. 画面表示と後続状態を確認する"	dtb_stock_history（移行先で実在）であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-014	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	欠品履歴の参照を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 欠品履歴の参照を確認する
3. 画面表示と後続状態を確認する"	dtb_stock_history を参照であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-015	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	CSV列の追加仕様を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. CSV列の追加仕様を確認する
3. 画面表示と後続状態を確認する"	**Excelの列要件（店舗・在庫区分・登録元・登録元ID・欠品時販売価格・欠品理由・最終更新日・最終更新者）を正とすること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-016	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	機能名を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で送信可否制御の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 機能名を確認する
3. 画面表示と後続状態を確認する"	欠品履歴CSV出力であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-017	IT-03	外部画面	P2	外部画面の操作結果確認	実装確認を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で外部画面の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 実装確認を確認する
3. 画面表示と後続状態を確認する"	../ec-cube-enterprise（StockHistoryController::csvStockHistoryDispozalExport / Service\Csv\StockHistoryDisposa…であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	2026-06-12を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 2026-06-12を確認する
3. 画面表示と後続状態を確認する"	ec-cube-enterprise 実装（Controller/Service/Form/Entity）と既存テストを読み込み、実装確認値で具体化であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	欠品履歴CSV出力を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 欠品履歴CSV出力を確認する
3. 画面表示と後続状態を確認する"	リクエストの ids[]（選択された在庫履歴ID配列）を受け取り、該当する欠品履歴のCSVを StreamedResponse で返すこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	文字コードを試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 文字コードを確認する
3. 画面表示と後続状態を確認する"	eccube_csv_export_encoding（既定 SJIS-win）であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-021	IT-03	画面遷移	P2	画面遷移の操作結果確認	ファイル名を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ファイル名を確認する
3. 画面表示と後続状態を確認する"	stock_history_disposal_ + 出力時刻 YmdHis + .csv（例: stock_history_disposal_20260612153000.csv）であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-022	IT-03	画面遷移	P2	画面遷移の操作結果確認	出力方式を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 出力方式を確認する
3. 画面表示と後続状態を確認する"	StreamedResponseであること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-023	IT-03	画面遷移	P2	画面遷移の操作結果確認	ids パラメータ無し / 空配列 / 0以下のみ（有効ID0件）を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ids パラメータ無し / 空配列 / 0以下のみ（有効ID0件）を確認する
3. 画面表示と後続状態を確認する"	responseNoStockHistoryIdError()：addError('eccube.admin.error', trans('admin.stock_history.not_select')) を表示し、…であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-024	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	指定IDに該当する在庫履歴が存在しない / 変換結果が空を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）でURL直接アクセスの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 指定IDに該当する在庫履歴が存在しない / 変換結果が空を確認する
3. 画面表示と後続状態を確認する"	StockHistoryDisposalCsv::exportCsv() が RuntimeException を送出であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-025	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	正常を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）でHTTPステータスの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 正常を確認する
3. 画面表示と後続状態を確認する"	StreamedResponse（HTTP 200、text/csv、attachment）を返すこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-026	IT-25	URL	P2	URLの操作結果確認	主データを試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）でURLの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 主データを確認する
3. 画面表示と後続状態を確認する"	欠品履歴CSV出力は**参照のみ**で業務データを更新しない（在庫・履歴の更新は行わない）であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-027	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	ログを試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. ログを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-028	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	出力対象の在庫履歴を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 出力対象の在庫履歴を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	欠品履歴の参照を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 欠品履歴の参照を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	CSV列の追加仕様を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. CSV列の追加仕様を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-031	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	機能名を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. 機能名を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-032	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	実装確認を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. 実装確認を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-033	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	2026-06-12を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で文字列長バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 2026-06-12を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-034	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	欠品履歴CSV出力を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で文字列長バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 欠品履歴CSV出力を確認する
3. 画面表示と後続状態を確認する"	リクエストの ids[]（選択された在庫履歴ID配列）を受け取り、該当する欠品履歴のCSVを StreamedResponse で返すこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	文字コードを試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 文字コードを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	ファイル名を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ファイル名を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	出力方式を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 出力方式を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	ids パラメータ無し / 空配列 / 0以下のみ（有効ID0件）を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. ids パラメータ無し / 空配列 / 0以下のみ（有効ID0件）を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-039	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	指定IDに該当する在庫履歴が存在しない / 変換結果が空を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 指定IDに該当する在庫履歴が存在しない / 変換結果が空を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-040	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	正常を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 正常を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-041	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	主データを試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 主データを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-042	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	ログを試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ログを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-043	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	出力対象の在庫履歴を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で文字種バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 出力対象の在庫履歴を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-044	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	欠品履歴の参照を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で文字種バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 欠品履歴の参照を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	CSV列の追加仕様を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. CSV列の追加仕様を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	機能名を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 機能名を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	実装確認を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 実装確認を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	2026-06-12を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 2026-06-12を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-049	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	欠品履歴CSV出力を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）でその他のバリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 欠品履歴CSV出力を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-050	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	文字コードを試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）でその他のバリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 文字コードを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-051	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	ファイル名を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. ファイル名を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-052	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	出力方式を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 出力方式を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-053	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	ids パラメータ無し / 空配列 / 0以下のみ（有効ID0件）を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）でその他のバリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ids パラメータ無し / 空配列 / 0以下のみ（有効ID0件）を確認する
3. 画面表示と後続状態を確認する"	responseNoStockHistoryIdError()：addError('eccube.admin.error', trans('admin.stock_history.not_select')) を表示し、…であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-054	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	指定IDに該当する在庫履歴が存在しない / 変換結果が空を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 指定IDに該当する在庫履歴が存在しない / 変換結果が空を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-055	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	正常を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 正常を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-056	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	主データを試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 主データを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-057	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	ログを試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. ログを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-058	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	出力対象の在庫履歴を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 出力対象の在庫履歴を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-059	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	欠品履歴の参照を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 欠品履歴の参照を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-060	IT-22	必須制御	P1	必須制御の入力検証	CSV列の追加仕様を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. CSV列の追加仕様を確認する
3. 画面表示と後続状態を確認する"	**Excelの列要件（店舗・在庫区分・登録元・登録元ID・欠品時販売価格・欠品理由・最終更新日・最終更新者）を正とすること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-061	IT-22	部分入力	P2	部分入力の入力検証	機能名を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で部分入力の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 機能名を確認する
3. 画面表示と後続状態を確認する"	欠品履歴CSV出力であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-062	IT-26	登録内容	P1	登録時の登録内容確認	実装確認を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-063	IT-26	登録内容	P1	登録時の登録内容確認	2026-06-12を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-064	IT-26	登録内容	P1	登録時の登録内容確認	欠品履歴CSV出力を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-065	IT-26	登録内容	P1	登録時の登録内容確認	文字コードを試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	eccube_csv_export_encoding（既定 SJIS-win）であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-066	IT-26	登録内容	P1	登録時の登録内容確認	ファイル名を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	stock_history_disposal_ + 出力時刻 YmdHis + .csv（例: stock_history_disposal_20260612153000.csv）であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-067	IT-23	登録内容	P1	登録時の登録内容確認	出力方式を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	StreamedResponseであること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-068	IT-26	登録内容	P1	登録時の登録内容確認	ids パラメータ無し / 空配列 / 0以下のみ（有効ID0件）を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	responseNoStockHistoryIdError()：addError('eccube.admin.error', trans('admin.stock_history.not_select')) を表示し、…であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-069	IT-26	登録内容	P1	登録時の登録内容確認	指定IDに該当する在庫履歴が存在しない / 変換結果が空を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	StockHistoryDisposalCsv::exportCsv() が RuntimeException を送出であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-070	IT-26	登録内容	P1	登録時の登録内容確認	正常を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	StreamedResponse（HTTP 200、text/csv、attachment）を返すこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-071	IT-26	登録内容	P1	登録時の登録内容確認	主データを試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	欠品履歴CSV出力は**参照のみ**で業務データを更新しない（在庫・履歴の更新は行わない）であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-072	IT-26	登録内容	P1	登録時の登録内容確認	ログを試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	出力ファイル名を log_info でアプリケーションログに記録すること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-073	IT-26	登録内容	P1	登録時の登録内容確認	出力対象の在庫履歴を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-074	IT-26	登録内容	P1	登録時の登録内容確認	欠品履歴の参照を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-075	IT-26	登録内容	P1	登録時の登録内容確認	CSV列の追加仕様を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-076	IT-26	登録内容	P1	登録時の登録内容確認	機能名を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-077	IT-26	登録内容	P1	登録時の登録内容確認	実装確認を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-078	IT-26	登録内容	P1	登録時の登録内容確認	2026-06-12を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-079	IT-26	実行結果	P1	登録時の実行結果確認	欠品履歴CSV出力を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-080	IT-23	実行結果	P1	登録時の実行結果確認	文字コードを試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	eccube_csv_export_encoding（既定 SJIS-win）であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-081	IT-26	更新内容	P1	更新時の更新内容確認	ファイル名を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-082	IT-26	更新内容	P1	更新時の更新内容確認	出力方式を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-083	IT-26	更新内容	P1	更新時の更新内容確認	ids パラメータ無し / 空配列 / 0以下のみ（有効ID0件）を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-084	IT-26	更新内容	P1	更新時の更新内容確認	指定IDに該当する在庫履歴が存在しない / 変換結果が空を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	StockHistoryDisposalCsv::exportCsv() が RuntimeException を送出であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-085	IT-26	更新内容	P1	更新時の更新内容確認	正常を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	StreamedResponse（HTTP 200、text/csv、attachment）を返すこと。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-086	IT-23	更新内容	P1	更新時の更新内容確認	主データを試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	欠品履歴CSV出力は**参照のみ**で業務データを更新しない（在庫・履歴の更新は行わない）であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-087	IT-26	更新内容	P1	更新時の更新内容確認	ログを試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	出力ファイル名を log_info でアプリケーションログに記録すること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-088	IT-26	更新内容	P1	更新時の更新内容確認	出力対象の在庫履歴を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	dtb_stock_history（移行先で実在）であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-089	IT-26	更新内容	P1	更新時の更新内容確認	欠品履歴の参照を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	dtb_stock_history を参照であること。
M04-20（欠品履歴CSV出力）	IT-M04-20-ADMIN-STOCK-STOCK-SHORTAGE-HISTORY-CSV-EXPORT-090	IT-26	更新内容	P1	更新時の更新内容確認	CSV列の追加仕様を試験できる状態である	M04-20（欠品履歴CSV出力）（m04_20_admin_stock_stock_shortage_history_csv_export）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	**Excelの列要件（店舗・在庫区分・登録元・登録元ID・欠品時販売価格・欠品理由・最終更新日・最終更新者）を正とすること。
```

## 対象外観点

| 分類・範囲 | 理由 |
|-----------|------|
| データベースアクセス / DB操作 / 検索（IT-23） | 本機能に検索処理がないため |
| データベースアクセス / DB操作 / 更新（IT-05, IT-26） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 削除（IT-05） | 本機能に削除処理がないため |
| データベースアクセス / DB制御 / 更新順序（IT-26） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB制御 / 排他制御（IT-07） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB制御 / ロールバック（IT-06） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 数量 / 更新結果（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 金額・単価 / 増加処理（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 金額・単価 / 減少処理（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 金額・単価 / 実数反映（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 金額・単価 / 按分処理（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 履歴 / 更新履歴（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 履歴 / 算出値表示（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 調整 / 減少理由（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 通知 / 復活通知（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 移動・振替 / 移動開始（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 移動・振替 / 移動完了（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 移動・振替 / 例外処理（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 移動・振替 / 区分変更（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 分割・結合 / 結合（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 分割・結合 / 分割（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 分割・結合 / 承認・棄却（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 実数反映 / 不足（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 実数反映 / 超過（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / バッチ / DB影響（IT-26） | 本機能はバッチ処理を起動しないため |
| データベースアクセス / 管理画面 / 同時更新（IT-07） | 元設計HTMLに該当する処理・I/Fがないため |
| ファイル処理 / ファイル取込 / 実行結果（IT-16） | 元設計HTMLに該当する処理・I/Fがないため |
| ファイル処理 / ※ファイルアップロードを含む / 実行結果（IT-16, IT-24） | 元設計HTMLに該当する処理・I/Fがないため |
| ファイル処理 / ※ファイルアップロードを含む / バリデーション（IT-17, IT-24） | 元設計HTMLに該当する処理・I/Fがないため |
| ファイル処理 / ファイル出力 / 実行結果（IT-27） | 元設計HTMLに該当する処理・I/Fがないため |
| ファイル処理 / ※ファイルダウンロードを含む / 実行結果（IT-24, IT-27） | 元設計HTMLに該当する処理・I/Fがないため |
| ファイル処理 / ※ファイルダウンロードを含む / データ出力（IT-18, IT-24） | 元設計HTMLに該当する処理・I/Fがないため |
| ファイル処理 / ファイル操作 / 実行結果（IT-27） | 本機能は対象の外部I/Fを扱わないため |
| ファイル処理 / 数量・金額影響機能 / 対象機能（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ファイル処理 / 数量 / 更新結果（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ファイル処理 / 増加・調整 / ファイル登録（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ファイル処理 / 参照・非更新 / 参照系機能（IT-33） | 本機能はメール送信を扱わないため |
| ファイル処理 / 参照・非更新 / ファイル出力（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ファイル処理 / バッチ / ファイル出力（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ / 再実行（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ / 異常終了（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ-フロント / ファイル連携（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ-フロント / JSON連携（IT-27） | 本機能はバッチ処理を起動しないため |
| メール処理 / メール処理 / 実行結果（IT-11, IT-28） | 本機能はメール送信を扱わないため |
| メール処理 / メール処理 / メール編集（IT-28） | 本機能はメール送信を扱わないため |
| 電文処理 / 受信処理 / 実行結果（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| 電文処理 / 受信処理 / バリデーション（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| 電文処理 / 送信処理 / 実行結果（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| 電文処理 / 送信処理 / 電文編集（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| ログ出力 / ログ出力 / ログ編集（IT-20） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 画面表示 / 表示結果（IT-12, IT-14, IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 画面操作 / イベント実行結果（IT-01, IT-12, IT-14, IT-16, IT-21, IT-25, IT-27） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / データベースアクセス / DB操作（IT-08） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / ログ出力 / ブラウザ（IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / ウェブサービス呼出 / リトライ制御（IT-12, IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 通知 / WebSocket（IT-11, IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 金額・単価 / 戻し処理（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 履歴 / 登録元追跡（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブアプリケーション / 数量・金額 / フロント更新（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 数量減（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 数量増（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 欠落登録（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 取消（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / フロント / 表示（IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 管理画面-公開側 / 反映（IT-02） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / API-公開側 / キャッシュ（IT-25） | 本機能は対象の外部I/Fを扱わないため |
| ウェブアプリケーション / 管理画面 / 初期表示（IT-02） | 元設計HTMLに該当する処理・I/Fがないため |
| バッチアプリケーション / バッチアプリケーション機能 / 実行結果（IT-12, IT-30） | 本機能はバッチ処理を起動しないため |
| バッチアプリケーション / ファイル取込 / 実行結果（IT-16） | 本機能はバッチ処理を起動しないため |
| バッチアプリケーション / ファイル出力 / 実行結果（IT-27） | 本機能はバッチ処理を起動しないため |
| バッチアプリケーション / バッチ / 正常終了（IT-30） | 本機能はバッチ処理を起動しないため |
| バッチアプリケーション / バッチ / 異常終了（IT-12） | 本機能はバッチ処理を起動しないため |
| メッセージング / メッセージング機能 / 実行結果（IT-31） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / ウェブサービス機能 / 実行結果（IT-09, IT-10, IT-19, IT-32） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 数量 / 区分整合（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 数量 / エラー（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 金額・単価 / 外部取引（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 外部連携 / 自動加算（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 外部連携 / 実数更新（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 外部連携 / 売上・返品（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| その他 | 同種の対象外観点 17 件は上記分類と同じ理由で対象外 |
