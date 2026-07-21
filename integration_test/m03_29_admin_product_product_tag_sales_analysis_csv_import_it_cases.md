# m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m03-29_admin_product_product_tag_sales_analysis_csv_import.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-27 | JSON、コピー、スキーマ、入力JSON、出力失敗、削除、同名ファイル、実行結果、移動・リネーム、配置先 |
| IT-15 | CSRF、対象データ、未認証、機密情報、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、URL、一覧、更新抑止、画面レイアウト、確認ダイアログ |
| IT-22 | DBとの相関バリデーション、必須バリデーション、文字列長バリデーション、相関バリデーション、部分入力 |
| IT-26 | 実行結果、更新内容、登録内容 |
| IT-23 | 実行結果 |
| IT-05 | 削除条件、実行結果 |
| IT-16 | 実行結果 |
| IT-17 | フォーマット定義 |
| IT-24 | 出力内容 |
| IT-33 | ファイル出力、ファイル登録 |
| IT-02 | 初期行数、表示順 |
| IT-12 | 内部情報、画面レイアウト、画面表示データ |
| IT-07 | 排他制御 |
| IT-06 | ロールバック |

## テストケースTSV

以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し（先頭列は `機能名`、**テストレベル列なし**）。**2行目以降**がケース（各10列）。`機能名` 列に元設計の表示名を入れる。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-001	IT-27	出力失敗	P1	出力失敗の結合確認	ナビ「商品管理」→「商品CSV管理」→「売上分析タグ更新CSVアップロード」を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で出力失敗の対象ファイルと処理条件を指定する	"1. 対象画面で出力失敗のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力失敗のファイル出力内容または取り込み結果が対象データと一致すること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-002	IT-15	CSRF	P1	CSRFの結合確認	アップロード送信を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）でCSRFの対象ファイルと処理条件を指定する	"1. 対象画面でCSRFのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	CSRFのファイル出力内容または取り込み結果が対象データと一致すること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-003	IT-15	未認証	P1	未認証の結合確認	履歴の表示件数変更を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で未認証の対象ファイルと処理条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	クエリの件数が許容リストに含まれるときだけセッションに保存され、履歴のページサイズが変わるであること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-004	IT-15	対象データ	P1	対象データの結合確認	表示要素を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で対象データの対象ファイルと処理条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	@admin/Product/csv_tag_sales_analysis.twig は共通テンプレート @admin/Product/base_csv_upload.twig を継承すること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-005	IT-20	出力抑止	P1	出力抑止の結合確認	JS 挙動を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で出力抑止の対象ファイルと処理条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ファイル選択でラベルにファイル名を表示すること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-006	IT-20	識別子	P1	識別子の結合確認	モーダル・ポップアップを試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で識別子の対象ファイルと処理条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	送信前の確認ダイアログはないこと。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-007	IT-15	状態変化	P1	状態変化の結合確認	タグの意味を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で状態変化の対象ファイルと処理条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	CSV で指定された売上分析タグ ID の集合が、その商品について最終的な紐付けになること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-008	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	マスタ側の削除との競合を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. マスタ側の削除との競合
3. 画面表示と後続状態を確認する"	取込処理の検証で読み込んだ ID 集合と異なる状態への変化が並行して起きた場合の整合は本書では確定しないこと。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-009	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	CSVファイル選択を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）でHTTPステータスの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. CSVファイル選択
3. 画面表示と後続状態を確認する"	フォームキー admin_csv_import[import_file]であること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-010	IT-25	URL	P2	URLの操作結果確認	タグ列のみ空を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）でURLの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. タグ列のみ空を確認する
3. 画面表示と後続状態を確認する"	検証は通り、その商品の紐付けはすべて削除されるであること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-011	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	存在しない売上分析タグ IDを試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 存在しない売上分析タグ IDを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-012	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	存在しない商品 IDを試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 存在しない商品 IDを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-013	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	改行カウントが閾値以上を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で文字列長バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 改行カウントが閾値以上を確認する
3. 画面表示と後続状態を確認する"	取込処理に入らず、ADMIN_CSV_IMPORT_MAX_ROWS を上限としてエラーフラッシュのみであること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-014	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	成功時出力を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-015	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	失敗時出力を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-016	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	dtb_product_tag_sales_analysisを試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. dtb_product_tag_sales_analysisを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-017	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	dtb_csv_import_historyを試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. dtb_csv_import_historyを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-018	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	登録/更新を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-019	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	売上分析タグ(ID) 列を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 売上分析タグ(ID) 列を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-020	IT-22	部分入力	P2	部分入力の入力検証	管理画面にログイン済みで当パスへ到達できる管理者を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で部分入力の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 管理画面にログイン済みで当パスへ到達できる管理者を確認する
3. 画面表示と後続状態を確認する"	実装されている処理を実行できること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-021	IT-26	登録内容	P1	登録時の登録内容確認	ナビから開くを試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-022	IT-26	登録内容	P1	登録時の登録内容確認	取込フォーム送信後（成否問わず）を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-023	IT-26	登録内容	P1	登録時の登録内容確認	ページング・件数変更（GET）を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-024	IT-26	登録内容	P1	登録時の登録内容確認	取込 POST 後のリダイレクトを試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	アップロード画面が再描画され、フラッシュがあれば利用者に見えるであること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-025	IT-26	登録内容	P1	登録時の登録内容確認	フォーム検証失敗を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-026	IT-26	登録内容	P1	登録時の登録内容確認	CSV 事前検証（ヘッダ・データ無し）を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-027	IT-26	登録内容	P1	登録時の登録内容確認	取込完了（コントローラ、エラー無し）を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-028	IT-26	登録内容	P1	登録時の登録内容確認	取込異常終了（コントローラ、エラーあり）を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-029	IT-26	登録内容	P1	登録時の登録内容確認	ナビ「商品管理」→「商品CSV管理」→「売上分析タグ更新CSVアップロード」を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-030	IT-26	登録内容	P1	登録時の登録内容確認	アップロード送信を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-031	IT-26	実行結果	P1	登録時の実行結果確認	履歴の表示件数変更を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-032	IT-23	実行結果	P1	登録時の実行結果確認	表示要素を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	@admin/Product/csv_tag_sales_analysis.twig は共通テンプレート @admin/Product/base_csv_upload.twig を継承すること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-033	IT-26	更新内容	P1	更新時の更新内容確認	JS 挙動を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-034	IT-26	更新内容	P1	更新時の更新内容確認	モーダル・ポップアップを試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-035	IT-26	更新内容	P1	更新時の更新内容確認	タグの意味を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-036	IT-26	更新内容	P1	更新時の更新内容確認	マスタ側の削除との競合を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	取込処理の検証で読み込んだ ID 集合と異なる状態への変化が並行して起きた場合の整合は本書では確定しないこと。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-037	IT-26	更新内容	P1	更新時の更新内容確認	CSVファイル選択を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-038	IT-26	更新内容	P1	更新時の更新内容確認	タグ列のみ空を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-039	IT-26	更新内容	P1	更新時の更新内容確認	存在しない売上分析タグ IDを試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-040	IT-26	更新内容	P1	更新時の更新内容確認	存在しない商品 IDを試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-041	IT-26	更新内容	P1	更新時の更新内容確認	改行カウントが閾値以上を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で更新内容の対象項目に最小長-1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-042	IT-26	更新内容	P1	更新時の更新内容確認	成功時出力を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-043	IT-05	実行結果	P1	更新時の実行結果確認	失敗時出力を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードの値が変更されること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-044	IT-05	実行結果	P1	更新時の実行結果確認	dtb_product_tag_sales_analysisを試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	取込で一度削除され、指定どおり再投入されるであること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-045	IT-05	削除条件	P1	削除時の削除条件確認	dtb_csv_import_historyを試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	成功時のみ INSERTであること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-046	IT-05	削除条件	P1	削除時の削除条件確認	登録/更新を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）であること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-047	IT-05	削除条件	P1	削除時の削除条件確認	売上分析タグ(ID) 列を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	任意であること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-048	IT-05	削除条件	P1	削除時の削除条件確認	管理画面にログイン済みで当パスへ到達できる管理者を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実装されている処理を実行できること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-049	IT-05	削除条件	P1	削除時の削除条件確認	ナビから開くを試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で削除条件の対象ファイルと処理条件を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	削除条件の対象レコードが削除状態にならないこと。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-050	IT-05	実行結果	P1	削除時の実行結果確認	取込フォーム送信後（成否問わず）を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-051	IT-05	実行結果	P1	削除時の実行結果確認	ページング・件数変更（GET）を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	保存済みのページ状態で履歴が表示されるであること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-052	IT-05	実行結果	P1	削除時の実行結果確認	取込 POST 後のリダイレクトを試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-053	IT-05	実行結果	P1	削除時の実行結果確認	フォーム検証失敗を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	エラーフラッシュを積み、アップロード画面へリダイレクトすること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-054	IT-16	実行結果	P2	実行結果の結合確認	CSV 事前検証（ヘッダ・データ無し）を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-055	IT-17	フォーマット定義	P2	フォーマット定義の入力検証	取込完了（コントローラ、エラー無し）を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）でフォーマット定義で対象条件に該当する値を指定する	"1. 対象画面でフォーマット定義のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	フォーマット定義でエラーが表示されず、対象処理を継続できること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-056	IT-17	フォーマット定義	P2	フォーマット定義の入力検証	取込異常終了（コントローラ、エラーあり）を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）でフォーマット定義で対象条件に該当しない値を指定する	"1. 対象画面でフォーマット定義のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	フォーマット定義でエラーが表示され、対象処理が完了しないこと。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-057	IT-27	実行結果	P2	実行結果の結合確認	ナビ「商品管理」→「商品CSV管理」→「売上分析タグ更新CSVアップロード」を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-058	IT-27	実行結果	P2	実行結果の結合確認	アップロード送信を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-059	IT-24	出力内容	P2	出力内容の結合確認	履歴の表示件数変更を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容のファイル出力内容または取り込み結果が対象データと一致すること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-060	IT-24	出力内容	P2	出力内容の結合確認	表示要素を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容のファイル出力内容または取り込み結果が対象データと一致すること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-061	IT-24	出力内容	P2	出力内容の結合確認	JS 挙動を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容のファイル出力内容または取り込み結果が対象データと一致すること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-062	IT-24	出力内容	P2	出力内容の結合確認	モーダル・ポップアップを試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容のファイル出力内容または取り込み結果が対象データと一致すること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-063	IT-24	出力内容	P2	出力内容の結合確認	タグの意味を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容でエラーが表示されず、対象処理を継続できること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-064	IT-27	削除	P1	削除の結合確認	マスタ側の削除との競合を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で削除の対象ファイルと処理条件を指定する	"1. 対象画面で削除のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	削除の該当レコードが取得結果に含まれないこと。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-065	IT-27	移動・リネーム	P2	移動・リネームの結合確認	CSVファイル選択を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で移動・リネームの対象ファイルと処理条件を指定する	"1. 対象画面で移動・リネームのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	移動・リネームの該当レコードが取得結果に含まれないこと。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-066	IT-27	コピー	P1	コピーの結合確認	タグ列のみ空を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）でコピーの対象ファイルと処理条件を指定する	"1. 対象画面でコピーのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	コピーのファイル出力内容または取り込み結果が対象データと一致すること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-067	IT-33	ファイル登録	P1	ファイル登録の結合確認	存在しない売上分析タグ IDを試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）でファイル登録の対象ファイルと処理条件を指定する	"1. 対象画面でファイル登録のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	ファイル登録のファイル出力内容または取り込み結果が対象データと一致すること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-068	IT-33	ファイル出力	P1	ファイル出力の結合確認	存在しない商品 IDを試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）でファイル出力の対象ファイルと処理条件を指定する	"1. 対象画面でファイル出力のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	ファイル出力のファイル出力内容または取り込み結果が対象データと一致すること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-069	IT-27	JSON	P1	JSONの結合確認	改行カウントが閾値以上を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）でJSONの対象ファイルと処理条件を指定する	"1. 対象画面でJSONのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	JSONのファイル出力内容または取り込み結果が対象データと一致すること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-070	IT-27	同名ファイル	P1	同名ファイルの結合確認	成功時出力を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で同名ファイルの対象ファイルと処理条件を指定する	"1. 対象画面で同名ファイルのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	同名ファイルのファイル出力内容または取り込み結果が対象データと一致すること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-071	IT-27	入力JSON	P1	入力JSONの結合確認	失敗時出力を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で入力JSONの対象ファイルと処理条件を指定する	"1. 対象画面で入力JSONのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	入力JSONの対象レコードの値が変更されないこと。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-072	IT-27	配置先	P1	配置先の結合確認	dtb_product_tag_sales_analysisを試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で配置先の対象ファイルと処理条件を指定する	"1. 対象画面で配置先のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	配置先の該当レコードが取得結果に含まれること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-073	IT-27	スキーマ	P1	スキーマの結合確認	dtb_csv_import_historyを試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）でスキーマの対象ファイルと処理条件を指定する	"1. 対象画面でスキーマのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	スキーマのファイル出力内容または取り込み結果が対象データと一致すること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-074	IT-02	初期行数	P2	初期行数の結合確認	登録/更新を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で初期行数の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）であること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-075	IT-02	表示順	P2	表示順の結合確認	売上分析タグ(ID) 列を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で表示順の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 売上分析タグ(ID) 列を確認する
3. 画面表示と後続状態を確認する"	任意であること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-076	IT-25	更新抑止	P1	更新抑止の結合確認	管理画面にログイン済みで当パスへ到達できる管理者を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で更新抑止の対象ファイルと処理条件を指定する	"1. 対象画面で更新抑止のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	更新抑止のファイル出力内容または取り込み結果が対象データと一致すること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-077	IT-12	内部情報	P1	内部情報の結合確認	ナビから開くを試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で内部情報の対象ファイルと処理条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	GET …/csv_uploadであること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-078	IT-15	機密情報	P1	機密情報の結合確認	取込フォーム送信後（成否問わず）を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で機密情報の対象ファイルと処理条件を指定する	"1. 対象画面で機密情報のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	機密情報のファイル出力内容または取り込み結果が対象データと一致すること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-079	IT-07	排他制御	P1	排他制御の結合確認	ページング・件数変更（GET）を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で排他制御の対象ファイルと処理条件を指定する	"1. 排他制御の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	保存済みのページ状態で履歴が表示されるであること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-080	IT-07	排他制御	P1	排他制御の結合確認	取込 POST 後のリダイレクトを試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で排他制御の対象ファイルと処理条件を指定する	"1. 排他制御の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	アップロード画面が再描画され、フラッシュがあれば利用者に見えるであること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-081	IT-06	ロールバック	P3	ロールバックの結合確認	フォーム検証失敗を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）でロールバックの対象ファイルと処理条件を指定する	"1. ロールバックの対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	エラーフラッシュを積み、アップロード画面へリダイレクトすること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-082	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	CSV 事前検証（ヘッダ・データ無し）を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. CSV 事前検証（ヘッダ・データ無し）を確認する
3. 画面表示と後続状態を確認する"	インポータ結果のエラー配列をフラッシュしリダイレクトすること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-083	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	取込完了（コントローラ、エラー無し）を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 取込完了（コントローラ、エラー無し）を確認する
3. 画面表示と後続状態を確認する"	情報ログに完了文言と件数コンテキストを書くであること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-084	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	取込異常終了（コントローラ、エラーあり）を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 取込異常終了（コントローラ、エラーあり）を確認する
3. 画面表示と後続状態を確認する"	情報ログに異常終了文言を書くであること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-085	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	ナビ「商品管理」→「商品CSV管理」→「売上分析タグ更新CSVアップロード」を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ナビ「商品管理」→「商品CSV管理」→「売上分析タグ更新CSVアップロード」
3. 画面表示と後続状態を確認する"	アップロード画面が開き、フォーマット表と履歴が表示されるであること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-086	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	アップロード送信を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. アップロード送信
3. 画面表示と後続状態を確認する"	検証・取込後、常に GET …/product/tag_sales_analysis/csv_upload へリダイレクトされ、フラッシュで結果が示されるであること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-087	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	履歴の表示件数変更を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 履歴の表示件数変更を確認する
3. 画面表示と後続状態を確認する"	クエリの件数が許容リストに含まれるときだけセッションに保存され、履歴のページサイズが変わるであること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-088	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	表示要素を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	@admin/Product/csv_tag_sales_analysis.twig は共通テンプレート @admin/Product/base_csv_upload.twig を継承すること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-089	IT-25	一覧	P2	一覧の結合確認	JS 挙動を試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で一覧の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	ファイル選択でラベルにファイル名を表示すること。
m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）	IT-M03-29-ADMIN-PRODUCT-PRODUCT-TAG-SALES-ANALYSIS-CSV-IMPORT-090	IT-12	画面表示データ	P2	画面表示データの結合確認	モーダル・ポップアップを試験できる状態である	m03-29_admin_product_product_tag_sales_analysis_csv_import（管理画面_商品管理_売上分析タグ更新CSV登録）（m03_29_admin_product_product_tag_sales_analysis_csv_import）で画面表示データの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
```

## テスト層による母集合除外（結合テスト対象外）

結合テスト観点マスタは各観点に「テスト層」を付与し、**結合層のみ**を機能×観点のクロス積対象とする。以下の層は本結合テストの母集合から除外し、それぞれの行き先で担保する（除外の根拠はマスタ `integration_test/integration-test-viewpoints.md` のテスト層列）。

| テスト層 | 除外観点数 | 行き先 |
|---|---:|---|
| UT | 108 | 単体テスト粒度（単項目境界値・単機能ロジック）→単体テストで担保。表内に保持しマーク。 |
| 委譲 | 143 | 期待値を設計書へ委譲（「記載通り」）→機能別チェックリストへ降格。per機能で設計書の具体値を引用してケース化。 |
| e2e | 33 | 見た目／ブラウザ挙動→e2e（Playwright）＋手動で担保。 |
| 非機能 | 5 | 方式／性能／基盤（ロック方式・リトライ間隔・MQクラスタ・レート制限等）→非機能・障害試験へ分離。 |
| 対象外 | 1 | 合否オラクルを持たない管理・スコーピング指示→テスト観点ではないため除外。 |
| 統合 | 6 | 他観点に統合吸収済み（冗長削除）。統合先が同一バグクラスを検出するため重複クロス積を回避。行は監査用に保持しクロス積からのみ除外（codex+fable5承認）。 |

## 対象外観点（結合層のうち本機能に非該当）

| 分類・範囲 | 理由 |
|-----------|------|
| データベースアクセス / DB操作 / 検索（IT-23） | 本機能に検索処理がないため |
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
| データベースアクセス / 分割・結合 / 承認・棄却（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 実数反映 / 不足（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 実数反映 / 超過（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 管理画面 / 同時更新（IT-07） | 元設計HTMLに該当する処理・I/Fがないため |
| ファイル処理 / 数量・金額影響機能 / 対象機能（IT-33） | 本機能はメール送信を扱わないため |
| ファイル処理 / 数量 / 更新結果（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| メール処理 / メール処理 / 実行結果（IT-11, IT-28） | 本機能はメール送信を扱わないため |
| メール処理 / メール処理 / メール編集（IT-28） | 本機能はメール送信を扱わないため |
| 電文処理 / 送信処理 / 実行結果（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| 電文処理 / 送信処理 / 電文編集（IT-29） | 本機能は対象の外部I/Fを扱わないため |
| ウェブアプリケーション / データベースアクセス / DB操作（IT-08） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / ウェブサービス呼出 / リトライ制御（IT-12） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 通知 / WebSocket（IT-11） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 金額・単価 / 戻し処理（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 履歴 / 登録元追跡（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブアプリケーション / 数量・金額 / フロント更新（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 数量減（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 数量増（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 数量・金額 / 欠落登録（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / API-公開側 / キャッシュ（IT-25） | 本機能は対象の外部I/Fを扱わないため |
| バッチアプリケーション / バッチアプリケーション機能 / 実行結果（IT-12, IT-30） | 本機能はバッチ処理を起動しないため |
| バッチアプリケーション / バッチ / 正常終了（IT-30） | 本機能はバッチ処理を起動しないため |
| バッチアプリケーション / バッチ / 異常終了（IT-12） | 本機能はバッチ処理を起動しないため |
| メッセージング / メッセージング機能 / 実行結果（IT-31） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / ウェブサービス機能 / 実行結果（IT-09, IT-10, IT-32） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 数量 / 区分整合（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 数量 / エラー（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 金額・単価 / 外部取引（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 外部連携 / 自動加算（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 外部連携 / 実数更新（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 外部連携 / 売上・返品（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / バッチ / 正常終了（IT-09） | 本機能はバッチ処理を起動しないため |
| ウェブサービス / バッチ / 異常終了（IT-10） | 本機能はバッチ処理を起動しないため |
| ウェブサービス / フロント / 外部キャッシュ（IT-10） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / フロント / 外部取得（IT-10） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / API / 抽出条件（IT-32） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / API / 正常応答（IT-32） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / API / 認証・認可（IT-32） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 決済連携 / 外部決済（IT-10） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 決済連携 / 二重実行（IT-08） | 本機能はバッチ処理を起動しないため |
| ウェブアプリケーション / 決済連携 / 状態表示（IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 決済連携 / 金額整合（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 外部連携 / Webhook・外部通知（IT-10, IT-32） | 本機能は対象の外部I/Fを扱わないため |
| ウェブサービス / 外部連携 / 下流転送（IT-10） | 本機能は対象の外部I/Fを扱わないため |
| データベースアクセス / 在庫引当 / 状態遷移（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 在庫引当 / 競合（IT-08） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 注文・決済・在庫 / 原子性（IT-08） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 状態遷移 / 遷移可否（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 買取・査定 / 状態遷移（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / 金額計算 / 税・端数（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| バッチアプリケーション / 時刻境界 / 日時切替（IT-30） | 本機能はバッチ処理を起動しないため |
| ウェブサービス / 冪等・再処理 / 冪等キー（IT-08） | 本機能はバッチ処理を起動しないため |
| データベースアクセス / ポイント / ライフサイクル（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 販売価格 / 価格改定（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブアプリケーション / 一覧 / ページング（IT-23） | 元設計HTMLに該当する処理・I/Fがないため |
| ウェブサービス / 非同期連携 / 通知引渡し（IT-08） | 本機能は対象の外部I/Fを扱わないため |

> 別枠（非該当ではない）: 本機能に該当するが上限（max_cases）または実行キー重複で今回未収載の結合観点 11件 — No.357, No.358, No.359, No.381, No.382, No.385, No.387, No.412, No.413, No.414, No.416。上限緩和または個別ケース化で収載可能。
