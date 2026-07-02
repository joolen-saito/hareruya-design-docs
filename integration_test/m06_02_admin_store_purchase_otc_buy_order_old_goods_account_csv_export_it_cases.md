# m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export.html`

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
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-001	IT-16	実行結果	P1	実行結果の結合確認	検索結果が0件で一覧ブロックが「該当なし」表示のみを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-002	IT-27	実行結果	P1	実行結果の結合確認	一覧はあるがチェックを1つも付けずに「古物台帳入力用CSV」を選ぶを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-003	IT-27	出力失敗	P1	出力失敗の結合確認	表示要素を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で出力失敗の対象ファイルと処理条件を指定する	"1. 対象画面で出力失敗のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力失敗のファイル出力内容または取り込み結果が対象データと一致すること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-004	IT-15	CSRF	P1	CSRFの結合確認	JS挙動を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）でCSRFの対象ファイルと処理条件を指定する	"1. 対象画面でCSRFのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	CSRFのファイル出力内容または取り込み結果が対象データと一致すること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-005	IT-15	未認証	P1	未認証の結合確認	CSS・レイアウトを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で未認証の対象ファイルと処理条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	Bootstrapドロップダウンが非表示になる問題への回避として、#result_list__custom_csv_menu周りに限定したインラインスタイルがあること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-006	IT-15	対象データ	P1	対象データの結合確認	モーダル・ポップアップを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で対象データの対象ファイルと処理条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	出力前の確認ダイアログはないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-007	IT-20	出力抑止	P1	出力抑止の結合確認	出力対象行を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で出力抑止の対象ファイルと処理条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	POSTで渡された店頭買取注文IDのうち、dtb_otc_buy_orderに存在するものであること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-008	IT-20	識別子	P1	識別子の結合確認	年齢を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で識別子の対象ファイルと処理条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	apply_dateとbirthに対してPostgreSQLのAGEで間隔を求め、EXTRACT(YEAR FROM …)で年数のみを出力する（単体テストでは申込日と生年月日から期待される整数と一致する）であること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-009	IT-15	状態変化	P1	状態変化の結合確認	事業者番号を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で状態変化の対象ファイルと処理条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	dtb_qualified_invoice_issuer_account.qualified_invoice_issuer_code（未紐付け時はNULLで空出力）であること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-010	IT-25	UI部品	P3	UI部品の操作結果確認	otcBuyOrderIdsを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）でUI部品の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. otcBuyOrderIdsを確認する
3. 画面表示と後続状態を確認する"	整数配列として解釈であること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-011	IT-25	UI部品	P3	UI部品の操作結果確認	明細も個別入力商品も無い注文を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）でUI部品の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 明細も個別入力商品も無い注文
3. 画面表示と後続状態を確認する"	数量は0として出力されるであること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-012	IT-25	操作起点	P1	操作起点の操作結果確認	電話番号がNULLまたは空を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で操作起点の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 電話番号がNULLまたは空を確認する
3. 画面表示と後続状態を確認する"	"phoneNumber列はNULLもしくは空文字のまま出力され、=""…""形式にならないこと。"
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-013	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	身分証・職業・適格請求書アカウントが未設定を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 身分証・職業・適格請求書アカウントが未設定を確認する
3. 画面表示と後続状態を確認する"	対応列は空もしくはNULLに準ずる出力となること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-014	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	POSTされたIDがすべて存在しないを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. POSTされたIDがすべて存在しないを確認する
3. 画面表示と後続状態を確認する"	ヘッダのみのCSVが返り、エラーにしないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-015	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	一覧との対応を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 一覧との対応を確認する
3. 画面表示と後続状態を確認する"	同一検索結果からチェックしたIDは、その時点のデータベース状態がそのままCSVに反映されるであること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-016	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	トランザクションを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で送信可否制御の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. トランザクションを確認する
3. 画面表示と後続状態を確認する"	本処理は参照SQLとストリーム出力のみであり、注文データを更新しない（戻しリストCSV種別での別副作用は本機能では扱わない）であること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-017	IT-03	外部画面	P2	外部画面の操作結果確認	成功時出力を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で外部画面の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	StreamedResponse本体にCSVバイト列であること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	失敗時出力を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	選択なしはフラッシュエラー付きリダイレクトであること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	副作用を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	old_goods_accountでは注文レコードを更新しないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	mtb_identificationを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. mtb_identificationを確認する
3. 画面表示と後続状態を確認する"	身分証種別表示名であること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-021	IT-03	画面遷移	P2	画面遷移の操作結果確認	mtb_jobを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. mtb_jobを確認する
3. 画面表示と後続状態を確認する"	職業表示名であること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-022	IT-03	画面遷移	P2	画面遷移の操作結果確認	検索を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 検索
3. 画面表示と後続状態を確認する"	検索条件に合致するレコードを抽出すること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-023	IT-03	画面遷移	P2	画面遷移の操作結果確認	otcBuyOrderIdsを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. otcBuyOrderIdsを確認する
3. 画面表示と後続状態を確認する"	整数化後に空ならエラーメッセージを表示してリダイレクトすること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-024	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	CSV送信が成功を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）でURL直接アクセスの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. CSV送信が成功
3. 画面表示と後続状態を確認する"	ブラウザのファイルダウンロードとして応答（画面ルート遷移なし）であること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-025	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	otcBuyOrderIdsが空を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）でHTTPステータスの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. otcBuyOrderIdsが空を確認する
3. 画面表示と後続状態を確認する"	admin_otcbuyorder_pageへHTTPリダイレクト（ページ番号はセッション確認値）であること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-026	IT-25	URL	P2	URLの操作結果確認	export_type不正を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）でURLの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. export_type不正を確認する
3. 画面表示と後続状態を確認する"	エラー応答（一覧へのアプリ制御リダイレクトではない）であること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-027	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	選択なしエラーを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 選択なしエラー
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-028	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	export_typeが未知を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. export_typeが未知を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	CSV応答オブジェクト生成直前を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. CSV応答オブジェクト生成直前を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	クォートを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. クォートを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-031	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	検索結果が0件で一覧ブロックが「該当なし」表示のみを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. 検索結果が0件で一覧ブロックが「該当なし」表示のみ
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-032	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	一覧はあるがチェックを1つも付けずに「古物台帳入力用CSV」を選ぶを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. 一覧はあるがチェックを1つも付けずに「古物台帳入力用CSV」を選ぶ
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-033	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	表示要素を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で文字列長バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-034	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	JS挙動を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で文字列長バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. JS挙動を確認する
3. 画面表示と後続状態を確認する"	.export-linkクリックで既定のリンク遷移を抑止し、#export_type隠し項目にdata-typeを代入して#result_formを送信すること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	CSS・レイアウトを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. CSS・レイアウトを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	モーダル・ポップアップを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	出力対象行を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 出力対象行を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	年齢を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 年齢を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-039	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	事業者番号を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 事業者番号を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-040	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	otcBuyOrderIdsを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. otcBuyOrderIdsを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-041	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	明細も個別入力商品も無い注文を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 明細も個別入力商品も無い注文
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-042	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	電話番号がNULLまたは空を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 電話番号がNULLまたは空を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-043	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	身分証・職業・適格請求書アカウントが未設定を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で文字種バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 身分証・職業・適格請求書アカウントが未設定を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-044	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	POSTされたIDがすべて存在しないを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で文字種バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. POSTされたIDがすべて存在しないを確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	一覧との対応を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 一覧との対応を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	トランザクションを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. トランザクションを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	成功時出力を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	失敗時出力を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-049	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	副作用を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）でその他のバリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-050	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	mtb_identificationを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）でその他のバリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. mtb_identificationを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-051	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	mtb_jobを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. mtb_jobを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-052	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	検索を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 検索
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-053	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	otcBuyOrderIdsを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）でその他のバリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. otcBuyOrderIdsを確認する
3. 画面表示と後続状態を確認する"	整数化後に空ならエラーメッセージを表示してリダイレクトすること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-054	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	CSV送信が成功を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. CSV送信が成功
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-055	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	otcBuyOrderIdsが空を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. otcBuyOrderIdsが空を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-056	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	export_type不正を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. export_type不正を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-057	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	選択なしエラーを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 選択なしエラー
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-058	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	export_typeが未知を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. export_typeが未知を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-059	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	CSV応答オブジェクト生成直前を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. CSV応答オブジェクト生成直前を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-060	IT-22	必須制御	P1	必須制御の入力検証	クォートを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. クォートを確認する
3. 画面表示と後続状態を確認する"	PHP標準のfputcsvに準ずる（エンクロージャとエスケープ文字はサービス実装の確認値）であること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-061	IT-22	部分入力	P2	部分入力の入力検証	検索結果が0件で一覧ブロックが「該当なし」表示のみを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で部分入力の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 検索結果が0件で一覧ブロックが「該当なし」表示のみ
3. 画面表示と後続状態を確認する"	「CSVダウンロード」ドロップダウンは検索結果ヘッダ付近にのみ置かれるため、この入口からは実行できないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-062	IT-23	検索条件	P2	検索時の検索条件確認	一覧はあるがチェックを1つも付けずに「古物台帳入力用CSV」を選ぶを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-063	IT-23	検索条件	P2	検索時の検索条件確認	表示要素を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-064	IT-23	検索条件	P2	検索時の検索条件確認	JS挙動を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	.export-linkクリックで既定のリンク遷移を抑止し、#export_type隠し項目にdata-typeを代入して#result_formを送信すること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-065	IT-23	検索条件	P2	検索時の検索条件確認	CSS・レイアウトを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-066	IT-23	検索条件	P2	検索時の検索条件確認	モーダル・ポップアップを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-067	IT-23	検索条件	P2	検索時の検索条件確認	出力対象行を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-068	IT-23	検索条件	P2	検索時の検索条件確認	年齢を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-069	IT-23	検索条件	P2	検索時の検索条件確認	事業者番号を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-070	IT-23	検索条件	P2	検索時の検索条件確認	otcBuyOrderIdsを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-071	IT-23	検索条件	P2	検索時の検索条件確認	明細も個別入力商品も無い注文を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-072	IT-23	検索条件	P2	検索時の検索条件確認	電話番号がNULLまたは空を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-073	IT-23	検索条件	P2	検索時の検索条件確認	身分証・職業・適格請求書アカウントが未設定を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-074	IT-23	検索条件	P2	検索時の検索条件確認	POSTされたIDがすべて存在しないを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-075	IT-23	検索条件	P2	検索時の検索条件確認	一覧との対応を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	同一検索結果からチェックしたIDは、その時点のデータベース状態がそのままCSVに反映されるであること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-076	IT-23	検索条件	P2	検索時の検索条件確認	トランザクションを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-077	IT-23	検索条件	P2	検索時の検索条件確認	成功時出力を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-078	IT-23	実行結果	P2	検索時の実行結果確認	失敗時出力を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-079	IT-23	実行結果	P2	検索時の実行結果確認	副作用を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	old_goods_accountでは注文レコードを更新しないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-080	IT-23	実行結果	P2	検索時の実行結果確認	mtb_identificationを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-081	IT-23	実行結果	P2	検索時の実行結果確認	mtb_jobを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-082	IT-23	実行結果	P2	検索時の実行結果確認	検索を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-083	IT-26	登録内容	P1	登録時の登録内容確認	otcBuyOrderIdsを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-084	IT-26	登録内容	P1	登録時の登録内容確認	CSV送信が成功を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-085	IT-26	登録内容	P1	登録時の登録内容確認	otcBuyOrderIdsが空を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-086	IT-26	登録内容	P1	登録時の登録内容確認	export_type不正を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	エラー応答（一覧へのアプリ制御リダイレクトではない）であること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-087	IT-26	登録内容	P1	登録時の登録内容確認	選択なしエラーを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	買取一覧の該当ページが再表示され、エラーメッセージが見えるであること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-088	IT-23	登録内容	P1	登録時の登録内容確認	export_typeが未知を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	例外によりエラー応答（運用上は不正改ざんや実装不整合時）であること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-089	IT-26	登録内容	P1	登録時の登録内容確認	CSV応答オブジェクト生成直前を試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	情報ログに「店頭買取CSV出力完了」とファイル名が出力される（種別が古物台帳でも同一文言）であること。
m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）	IT-M06-02-ADMIN-STORE-PURCHASE-OTC-BUY-ORDER-OLD-GOODS-ACCOUNT-CSV-EXPORT-090	IT-26	登録内容	P1	登録時の登録内容確認	クォートを試験できる状態である	m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export（店頭買取管理 — 古物台帳入力用CSV出力）（m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	PHP標準のfputcsvに準ずる（エンクロージャとエスケープ文字はサービス実装の確認値）であること。
```

## 対象外観点

| 分類・範囲 | 理由 |
|-----------|------|
| データベースアクセス / DB操作 / 登録（IT-23, IT-26） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 更新（IT-05, IT-23, IT-26） | 本機能に更新処理がないため |
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
| ウェブアプリケーション / データベースアクセス / DB操作（IT-08） | 本機能に更新処理がないため |
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
