# m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m03-33_admin_product_product_sale_high_price_csv_import.html`

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
| IT-23 | 実行結果、検索条件、登録内容 |
| IT-26 | 登録内容 |

## テストケースTSV

以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し（先頭列は `機能名`、**テストレベル列なし**）。**2行目以降**がケース（各10列）。`機能名` 列に元設計の表示名を入れる。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-001	IT-16	実行結果	P1	実行結果の結合確認	ナビ「商品管理」→「商品CSV管理」→「セール用高額商品価格変更CSVアップロ…を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-002	IT-27	実行結果	P1	実行結果の結合確認	履歴の表示件数プルダウン変更を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-003	IT-27	出力失敗	P1	出力失敗の結合確認	表示要素を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で出力失敗の対象ファイルと処理条件を指定する	"1. 対象画面で出力失敗のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力失敗のファイル出力内容または取り込み結果が対象データと一致すること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-004	IT-15	CSRF	P1	CSRFの結合確認	JS 挙動を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）でCSRFの対象ファイルと処理条件を指定する	"1. 対象画面でCSRFのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	CSRFのファイル出力内容または取り込み結果が対象データと一致すること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-005	IT-15	未認証	P1	未認証の結合確認	モーダル・ポップアップを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で未認証の対象ファイルと処理条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	送信前の確認ダイアログはないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-006	IT-15	対象データ	P1	対象データの結合確認	CSV ファイルを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で対象データの対象ファイルと処理条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	一時ディレクトリへ移動後に汎用インポータが読み捨てし、終了時に削除すること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-007	IT-20	出力抑止	P1	出力抑止の結合確認	CSRF トークンを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で出力抑止の対象ファイルと処理条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	欠落・不一致時はフォーム妥当性エラーでリダイレクトであること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-008	IT-20	識別子	P1	識別子の結合確認	商品コードを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で識別子の対象ファイルと処理条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	高額・非公開の規格を一意に特定するキーであること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-009	IT-15	状態変化	P1	状態変化の結合確認	販売価格を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で状態変化の対象ファイルと処理条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	セール ON へ遷移するときおよびセール中のまま更新するときの新しい販売価格の元であること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-010	IT-25	UI部品	P3	UI部品の操作結果確認	高額コードが空／NULL の規格、または規格が公開のままを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）でUI部品の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 高額コードが空／NULL の規格、または規格が公開のままを確認する
3. 画面表示と後続状態を確認する"	検索にヒットせず不存在エラーで全体中断であること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-011	IT-25	UI部品	P3	UI部品の操作結果確認	同一商品コードの規格が 2 件以上を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）でUI部品の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 同一商品コードの規格が 2 件以上を確認する
3. 画面表示と後続状態を確認する"	重複エラーで全体中断であること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-012	IT-25	操作起点	P1	操作起点の操作結果確認	セール外かつ CSV もセール OFFを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で操作起点の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. セール外かつ CSV もセール OFFを確認する
3. 画面表示と後続状態を確認する"	販売価格は CSV ではなく既存 price02 を維持し、情報メッセージを積むであること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-013	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	価格履歴を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 価格履歴を確認する
3. 画面表示と後続状態を確認する"	変更前後で販売・買取・基準のいずれも変化がなければ履歴行は増えないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-014	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	一覧との一致を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 一覧との一致を確認する
3. 画面表示と後続状態を確認する"	取込直後、同一トランザクションがコミットされていれば商品規格の参照クエリは更新後値を返すこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-015	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	履歴を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 履歴を確認する
3. 画面表示と後続状態を確認する"	取込履歴はエラーなくコミット完了した実行だけが 1 件増えるであること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-016	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	成功時出力を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で送信可否制御の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	同一画面上に成功フラッシュ（キー admin.register.complete）であること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-017	IT-03	外部画面	P2	外部画面の操作結果確認	失敗時出力を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で外部画面の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	admin エラーフラッシュに汎用 CSV エラーメッセージもしくはフォームエラーであること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	副作用を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	規格の価格・セール・帯・スマレジフラグ更新、商品タグ置換、条件付きで価格履歴・取込履歴 INSERT、情報ログ、スマレジ連携の予約であること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	登録/更新を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）であること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	GET 画面を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. GET 画面を確認する
3. 画面表示と後続状態を確認する"	保存済みページサイズ・ページ番号で履歴を再取得であること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-021	IT-03	画面遷移	P2	画面遷移の操作結果確認	POST 取込を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. POST 取込を確認する
3. 画面表示と後続状態を確認する"	リダイレクト後の GET でフラッシュが表示され、履歴は更新後データであること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-022	IT-03	画面遷移	P2	画面遷移の操作結果確認	フォーム・CSRF 不備を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. フォーム・CSRF 不備を確認する
3. 画面表示と後続状態を確認する"	エラーフラッシュし、アップロード画面へリダイレクトであること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-023	IT-03	画面遷移	P2	画面遷移の操作結果確認	CSV 形式・列・ターゲット不備を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. CSV 形式・列・ターゲット不備を確認する
3. 画面表示と後続状態を確認する"	汎用インポータがエラー配列を返しトランザクションロールバックであること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-024	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	取込中の例外を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）でURL直接アクセスの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 取込中の例外を確認する
3. 画面表示と後続状態を確認する"	インポータはロールバック試行後、捕捉した例外をそのまま再送出すること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-025	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	取込開始直前を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）でHTTPステータスの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 取込開始直前を確認する
3. 画面表示と後続状態を確認する"	情報ログ「セール用高額商品価格変更CSV登録開始」であること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-026	IT-25	URL	P2	URLの操作結果確認	取込がエラー配列を返したときを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）でURLの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 取込がエラー配列を返したときを確認する
3. 画面表示と後続状態を確認する"	情報ログ「セール用高額商品価格変更CSV登録 異常終了」であること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-027	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	取込がエラーなく完了したときを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 取込がエラーなく完了したときを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-028	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	履歴ページングを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 履歴ページングを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	ナビ「商品管理」→「商品CSV管理」→「セール用高額商品価格変更CSVアップロ…を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. ナビ「商品管理」→「商品CSV管理」→「セール用高額商品価格変更CSVアップロ…を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	履歴の表示件数プルダウン変更を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. 履歴の表示件数プルダウン変更を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-031	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	表示要素を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-032	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	JS 挙動を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-033	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	モーダル・ポップアップを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で文字列長バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-034	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	CSV ファイルを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で文字列長バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. CSV ファイルを確認する
3. 画面表示と後続状態を確認する"	一時ディレクトリへ移動後に汎用インポータが読み捨てし、終了時に削除すること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	CSRF トークンを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. CSRF トークンを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	商品コードを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 商品コードを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	販売価格を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 販売価格を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	高額コードが空／NULL の規格、または規格が公開のままを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 高額コードが空／NULL の規格、または規格が公開のままを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-039	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	同一商品コードの規格が 2 件以上を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 同一商品コードの規格が 2 件以上を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-040	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	セール外かつ CSV もセール OFFを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. セール外かつ CSV もセール OFFを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-041	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	価格履歴を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 価格履歴を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-042	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	一覧との一致を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 一覧との一致を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-043	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	履歴を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で文字種バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 履歴を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-044	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	成功時出力を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で文字種バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	失敗時出力を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	副作用を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	登録/更新を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	GET 画面を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. GET 画面を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-049	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	POST 取込を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）でその他のバリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. POST 取込を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-050	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	フォーム・CSRF 不備を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）でその他のバリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. フォーム・CSRF 不備を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-051	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	CSV 形式・列・ターゲット不備を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. CSV 形式・列・ターゲット不備を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-052	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	取込中の例外を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 取込中の例外を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-053	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	取込開始直前を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）でその他のバリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 取込開始直前を確認する
3. 画面表示と後続状態を確認する"	情報ログ「セール用高額商品価格変更CSV登録開始」であること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-054	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	取込がエラー配列を返したときを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 取込がエラー配列を返したときを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-055	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	取込がエラーなく完了したときを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 取込がエラーなく完了したときを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-056	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	履歴ページングを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 履歴ページングを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-057	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	ナビ「商品管理」→「商品CSV管理」→「セール用高額商品価格変更CSVアップロ…を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. ナビ「商品管理」→「商品CSV管理」→「セール用高額商品価格変更CSVアップロ…を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-058	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	履歴の表示件数プルダウン変更を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 履歴の表示件数プルダウン変更を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-059	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	表示要素を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-060	IT-22	必須制御	P1	必須制御の入力検証	JS 挙動を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	ファイル選択でラベルへファイル名を表示すること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-061	IT-22	部分入力	P2	部分入力の入力検証	モーダル・ポップアップを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で部分入力の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	送信前の確認ダイアログはないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-062	IT-23	検索条件	P2	検索時の検索条件確認	CSV ファイルを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-063	IT-23	検索条件	P2	検索時の検索条件確認	CSRF トークンを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-064	IT-23	検索条件	P2	検索時の検索条件確認	商品コードを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	高額・非公開の規格を一意に特定するキーであること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-065	IT-23	検索条件	P2	検索時の検索条件確認	販売価格を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-066	IT-23	検索条件	P2	検索時の検索条件確認	高額コードが空／NULL の規格、または規格が公開のままを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-067	IT-23	検索条件	P2	検索時の検索条件確認	同一商品コードの規格が 2 件以上を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-068	IT-23	検索条件	P2	検索時の検索条件確認	セール外かつ CSV もセール OFFを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-069	IT-23	検索条件	P2	検索時の検索条件確認	価格履歴を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-070	IT-23	検索条件	P2	検索時の検索条件確認	一覧との一致を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-071	IT-23	検索条件	P2	検索時の検索条件確認	履歴を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-072	IT-23	検索条件	P2	検索時の検索条件確認	成功時出力を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-073	IT-23	検索条件	P2	検索時の検索条件確認	失敗時出力を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-074	IT-23	検索条件	P2	検索時の検索条件確認	副作用を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-075	IT-23	検索条件	P2	検索時の検索条件確認	登録/更新を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）であること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-076	IT-23	検索条件	P2	検索時の検索条件確認	GET 画面を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-077	IT-23	検索条件	P2	検索時の検索条件確認	POST 取込を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-078	IT-23	実行結果	P2	検索時の実行結果確認	フォーム・CSRF 不備を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-079	IT-23	実行結果	P2	検索時の実行結果確認	CSV 形式・列・ターゲット不備を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	汎用インポータがエラー配列を返しトランザクションロールバックであること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-080	IT-23	実行結果	P2	検索時の実行結果確認	取込中の例外を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-081	IT-23	実行結果	P2	検索時の実行結果確認	取込開始直前を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-082	IT-23	実行結果	P2	検索時の実行結果確認	取込がエラー配列を返したときを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-083	IT-26	登録内容	P1	登録時の登録内容確認	取込がエラーなく完了したときを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-084	IT-26	登録内容	P1	登録時の登録内容確認	履歴ページングを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-085	IT-26	登録内容	P1	登録時の登録内容確認	ナビ「商品管理」→「商品CSV管理」→「セール用高額商品価格変更CSVアップロ…を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-086	IT-26	登録内容	P1	登録時の登録内容確認	履歴の表示件数プルダウン変更を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	許容リストに含まれる件数だけセッションに保存され、履歴のページサイズが変わるであること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-087	IT-26	登録内容	P1	登録時の登録内容確認	表示要素を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	@admin/Product/csv_product_sale_high_price.twig は @admin/Product/base_csv_upload.twig を継承すること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-088	IT-23	登録内容	P1	登録時の登録内容確認	JS 挙動を試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	ファイル選択でラベルへファイル名を表示すること。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-089	IT-26	登録内容	P1	登録時の登録内容確認	モーダル・ポップアップを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	送信前の確認ダイアログはないこと。
m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）	IT-M03-33-ADMIN-PRODUCT-PRODUCT-SALE-HIGH-PRICE-CSV-IMPORT-090	IT-26	登録内容	P1	登録時の登録内容確認	CSV ファイルを試験できる状態である	m03-33_admin_product_product_sale_high_price_csv_import（管理画面_商品管理_セール用高額商品価格変更CSV登録）（m03_33_admin_product_product_sale_high_price_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	一時ディレクトリへ移動後に汎用インポータが読み捨てし、終了時に削除すること。
```

## 対象外観点

| 分類・範囲 | 理由 |
|-----------|------|
| データベースアクセス / DB操作 / 登録（IT-23, IT-26） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 更新（IT-05, IT-23, IT-26） | 元設計HTMLに該当する処理・I/Fがないため |
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
