# 商品管理 — 部門CSV入力 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m03-20_admin_product_product_department_csv_import.html`

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
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-001	IT-16	実行結果	P1	実行結果の結合確認	部門CSV登録の免税区分列を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-002	IT-27	実行結果	P1	実行結果の結合確認	取込履歴を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-003	IT-27	出力失敗	P1	出力失敗の結合確認	ナビ「商品管理」→「商品CSV管理」→「部門更新CSV登録」を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で出力失敗の対象ファイルと処理条件を指定する	"1. 対象画面で出力失敗のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力失敗のファイル出力内容または取り込み結果が対象データと一致すること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-004	IT-15	CSRF	P1	CSRFの結合確認	雛形ダウンロード（部門更新）を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）でCSRFの対象ファイルと処理条件を指定する	"1. 対象画面でCSRFのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	CSRFのファイル出力内容または取り込み結果が対象データと一致すること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-005	IT-15	未認証	P1	未認証の結合確認	部門更新のファイル送信を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で未認証の対象ファイルと処理条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	検証・取込後、常に GET …/csv_upload へリダイレクトされ、フラッシュで成否が分かるであること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-006	IT-15	対象データ	P1	対象データの結合確認	部門CSV登録画面の表示を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で対象データの対象ファイルと処理条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ファイル選択・一括登録ボタン、フォーマット表、雛形リンクが表示されるであること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-007	IT-20	出力抑止	P1	出力抑止の結合確認	部門CSV登録の送信を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で出力抑止の対象ファイルと処理条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	検証成功時は部門マスタが更新され、成功メッセージが付いた同系画面が返るであること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-008	IT-20	識別子	P1	識別子の結合確認	雛形ダウンロード（部門マスタCSV登録）を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で識別子の対象ファイルと処理条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	department.csv が得られるであること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-009	IT-15	状態変化	P1	状態変化の結合確認	表示要素を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で状態変化の対象ファイルと処理条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ブロックタイトルは「商品管理」であること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-010	IT-25	UI部品	P3	UI部品の操作結果確認	モーダル・ポップアップを試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）でUI部品の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	送信前の確認ダイアログはないこと。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-011	IT-25	UI部品	P3	UI部品の操作結果確認	表示要素を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）でUI部品の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	タイトルは admin.product.department_csv_upload（日本語確認値「部門CSV登録」）であること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-012	IT-25	操作起点	P1	操作起点の操作結果確認	JS 挙動を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で操作起点の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	送信時にアップロード・雛形ボタンを無効化し、スピナーを表示（spin.js）であること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-013	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	部門更新CSVの同一商品コードを試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 部門更新CSVの同一商品コードを確認する
3. 画面表示と後続状態を確認する"	product_code に一致する複数の dtb_product_class が存在する場合、同一 UPDATE 条件によりまとめて同じ section_id になること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-014	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	部門コード空を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 部門コード空を確認する
3. 画面表示と後続状態を確認する"	部門更新CSVで部門コードが空（トリム後）のとき、section_id を null にすること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-015	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	部門CSV登録の新規と更新を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 部門CSV登録の新規と更新を確認する
3. 画面表示と後続状態を確認する"	部門ID列が空なら新規行であること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-016	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	部門更新CSVで先頭データ行が不正を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で送信可否制御の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 部門更新CSVで先頭データ行が不正を確認する
3. 画面表示と後続状態を確認する"	breakAll により後続行は処理されず、トランザクションはロールバックされるであること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-017	IT-03	外部画面	P2	外部画面の操作結果確認	部門更新CSVの行数が上限ちょうどを試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で外部画面の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 部門更新CSVの行数が上限ちょうどを確認する
3. 画面表示と後続状態を確認する"	countCsvRows が改行数ベースのため、環境・末尾改行で境界付近は実測が安全であること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	部門CSV登録で免税区分に任意文字列を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 部門CSV登録で免税区分に任意文字列を確認する
3. 画面表示と後続状態を確認する"	空でなければ通過し得る（数値以外の厳密拒否は実装されていない）であること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	部門CSV登録は行数上限チェック無しを試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 部門CSV登録は行数上限チェック無しを確認する
3. 画面表示と後続状態を確認する"	ADMIN_CSV_IMPORT_MAX_ROWS は部門更新CSVの POST のみで使用であること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	部門更新CSV成功後を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 部門更新CSV成功後を確認する
3. 画面表示と後続状態を確認する"	同一 DB を参照する商品規格一覧・詳細は再表示で section_id の変更が見えるであること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-021	IT-03	画面遷移	P2	画面遷移の操作結果確認	履歴を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 履歴を確認する
3. 画面表示と後続状態を確認する"	部門更新CSVのみ dtb_csv_import_history に残るであること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-022	IT-03	画面遷移	P2	画面遷移の操作結果確認	失敗時を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 失敗時を確認する
3. 画面表示と後続状態を確認する"	部門更新CSVはロールバックにより当該リクエストの更新はコミットされないこと。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-023	IT-03	画面遷移	P2	画面遷移の操作結果確認	成功時出力を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	部門更新CSVは 302 でアップロード画面へ戻り成功フラッシュであること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-024	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	失敗時出力を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）でURL直接アクセスの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	部門更新CSVはエラーフラッシュのみでリダイレクトであること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-025	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	副作用を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）でHTTPステータスの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	mtb_section の INSERT/UPDATE、もしくは dtb_product_class.section_id の UPDATEであること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-026	IT-25	URL	P2	URLの操作結果確認	dtb_product_classを試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）でURLの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. dtb_product_classを確認する
3. 画面表示と後続状態を確認する"	部門更新CSVで product_code 一致行の section_id を更新もしくは NULLであること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-027	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	mtb_sectionを試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. mtb_sectionを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-028	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	dtb_csv_import_historyを試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. dtb_csv_import_historyを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	登録/更新を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	部門更新CSVを試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. 部門更新CSVを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-031	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	部門CSV登録を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. 部門CSV登録を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-032	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	部門更新 POST 完了を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. 部門更新 POST 完了を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-033	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	部門CSV登録 POST 完了（成功・一部失敗を問わずテンプレート再描画の実装）を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で文字列長バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 部門CSV登録 POST 完了（成功・一部失敗を問わずテンプレート再描画の実装）を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-034	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	部門更新の履歴ページングを試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で文字列長バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 部門更新の履歴ページングを確認する
3. 画面表示と後続状態を確認する"	リダイレクト先 GET ではセッション値が引き続き使われるであること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	部門更新で行数超過を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 部門更新で行数超過を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	部門更新で商品未存在・部門未存在を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 部門更新で商品未存在・部門未存在を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	部門CSV登録で形式・必須欠如を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 部門CSV登録で形式・必須欠如を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	CSRF 不正を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. CSRF 不正を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-039	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	部門更新CSV POST 開始を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 部門更新CSV POST 開始を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-040	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	部門更新CSV 成功を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 部門更新CSV 成功を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-041	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	部門CSV登録の免税区分列を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 部門CSV登録の免税区分列を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-042	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	取込履歴を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 取込履歴を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-043	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	ナビ「商品管理」→「商品CSV管理」→「部門更新CSV登録」を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で文字種バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ナビ「商品管理」→「商品CSV管理」→「部門更新CSV登録」を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-044	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	雛形ダウンロード（部門更新）を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で文字種バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 雛形ダウンロード（部門更新）
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	部門更新のファイル送信を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 部門更新のファイル送信
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	部門CSV登録画面の表示を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 部門CSV登録画面の表示を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	部門CSV登録の送信を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 部門CSV登録の送信
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	雛形ダウンロード（部門マスタCSV登録）を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 雛形ダウンロード（部門マスタCSV登録）
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-049	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	表示要素を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）でその他のバリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-050	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	モーダル・ポップアップを試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）でその他のバリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-051	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	表示要素を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-052	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	JS 挙動を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-053	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	部門更新CSVの同一商品コードを試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）でその他のバリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 部門更新CSVの同一商品コードを確認する
3. 画面表示と後続状態を確認する"	product_code に一致する複数の dtb_product_class が存在する場合、同一 UPDATE 条件によりまとめて同じ section_id になること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-054	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	部門コード空を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 部門コード空を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-055	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	部門CSV登録の新規と更新を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 部門CSV登録の新規と更新を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-056	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	部門更新CSVで先頭データ行が不正を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 部門更新CSVで先頭データ行が不正を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-057	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	部門更新CSVの行数が上限ちょうどを試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 部門更新CSVの行数が上限ちょうどを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-058	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	部門CSV登録で免税区分に任意文字列を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 部門CSV登録で免税区分に任意文字列を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-059	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	部門CSV登録は行数上限チェック無しを試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 部門CSV登録は行数上限チェック無しを確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-060	IT-22	必須制御	P1	必須制御の入力検証	部門更新CSV成功後を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. 部門更新CSV成功後を確認する
3. 画面表示と後続状態を確認する"	同一 DB を参照する商品規格一覧・詳細は再表示で section_id の変更が見えるであること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-061	IT-22	部分入力	P2	部分入力の入力検証	履歴を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で部分入力の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 履歴を確認する
3. 画面表示と後続状態を確認する"	部門更新CSVのみ dtb_csv_import_history に残るであること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-062	IT-26	登録内容	P1	登録時の登録内容確認	失敗時を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-063	IT-26	登録内容	P1	登録時の登録内容確認	成功時出力を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-064	IT-26	登録内容	P1	登録時の登録内容確認	失敗時出力を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-065	IT-26	登録内容	P1	登録時の登録内容確認	副作用を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	mtb_section の INSERT/UPDATE、もしくは dtb_product_class.section_id の UPDATEであること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-066	IT-26	登録内容	P1	登録時の登録内容確認	dtb_product_classを試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	部門更新CSVで product_code 一致行の section_id を更新もしくは NULLであること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-067	IT-23	登録内容	P1	登録時の登録内容確認	mtb_sectionを試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	部門CSV登録の新規・更新対象であること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-068	IT-26	登録内容	P1	登録時の登録内容確認	dtb_csv_import_historyを試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	部門更新CSV成功時のみ追加（種別 ID 11）であること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-069	IT-26	登録内容	P1	登録時の登録内容確認	登録/更新を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）であること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-070	IT-26	登録内容	P1	登録時の登録内容確認	部門更新CSVを試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	フォーム NotBlank/File 最大サイズであること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-071	IT-26	登録内容	P1	登録時の登録内容確認	部門CSV登録を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	同上に加え、必須ヘッダ集合の包含、部門IDの数字形式、既存 ID の実在、名称・コード・免税区分の非空であること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-072	IT-26	登録内容	P1	登録時の登録内容確認	部門更新 POST 完了を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	GET /{admin_route}/product/section/csv_uploadであること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-073	IT-26	登録内容	P1	登録時の登録内容確認	部門CSV登録 POST 完了（成功・一部失敗を問わずテンプレート再描画の実装）を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-074	IT-26	登録内容	P1	登録時の登録内容確認	部門更新の履歴ページングを試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-075	IT-26	登録内容	P1	登録時の登録内容確認	部門更新で行数超過を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-076	IT-26	登録内容	P1	登録時の登録内容確認	部門更新で商品未存在・部門未存在を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-077	IT-26	登録内容	P1	登録時の登録内容確認	部門CSV登録で形式・必須欠如を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-078	IT-26	登録内容	P1	登録時の登録内容確認	CSRF 不正を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-079	IT-26	実行結果	P1	登録時の実行結果確認	部門更新CSV POST 開始を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-080	IT-23	実行結果	P1	登録時の実行結果確認	部門更新CSV 成功を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	情報ログ「部門更新CSV登録完了」と件数であること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-081	IT-26	更新内容	P1	更新時の更新内容確認	部門CSV登録の免税区分列を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-082	IT-26	更新内容	P1	更新時の更新内容確認	取込履歴を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-083	IT-26	更新内容	P1	更新時の更新内容確認	ナビ「商品管理」→「商品CSV管理」→「部門更新CSV登録」を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-084	IT-26	更新内容	P1	更新時の更新内容確認	雛形ダウンロード（部門更新）を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	product_section_update.csv が得られるであること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-085	IT-26	更新内容	P1	更新時の更新内容確認	部門更新のファイル送信を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検証・取込後、常に GET …/csv_upload へリダイレクトされ、フラッシュで成否が分かるであること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-086	IT-23	更新内容	P1	更新時の更新内容確認	部門CSV登録画面の表示を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	ファイル選択・一括登録ボタン、フォーマット表、雛形リンクが表示されるであること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-087	IT-26	更新内容	P1	更新時の更新内容確認	部門CSV登録の送信を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検証成功時は部門マスタが更新され、成功メッセージが付いた同系画面が返るであること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-088	IT-26	更新内容	P1	更新時の更新内容確認	雛形ダウンロード（部門マスタCSV登録）を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	department.csv が得られるであること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-089	IT-26	更新内容	P1	更新時の更新内容確認	表示要素を試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	ブロックタイトルは「商品管理」であること。
商品管理 — 部門CSV入力	IT-M03-20-ADMIN-PRODUCT-PRODUCT-DEPARTMENT-CSV-IMPORT-090	IT-26	更新内容	P1	更新時の更新内容確認	モーダル・ポップアップを試験できる状態である	商品管理 — 部門CSV入力（m03_20_admin_product_product_department_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	送信前の確認ダイアログはないこと。
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
