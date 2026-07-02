# m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語）） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-18 | フォーマット定義 |
| IT-16 | 実行結果 |
| IT-27 | 出力失敗、実行結果 |
| IT-15 | CSRF、対象データ、未認証、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、UI部品、URL、操作起点、確認ダイアログ、送信可否制御 |
| IT-03 | 外部画面、画面遷移 |
| IT-13 | URL直接アクセス |
| IT-22 | DBとの相関バリデーション、その他のバリデーション、必須バリデーション、必須制御、数値バリデーション、文字列長バリデーション、文字種バリデーション、相関バリデーション、部分入力 |
| IT-23 | 実行結果、検索条件 |

## テストケースTSV

以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し（先頭列は `機能名`、**テストレベル列なし**）。**2行目以降**がケース（各10列）。`機能名` 列に元設計の表示名を入れる。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-001	IT-18	フォーマット定義	P2	フォーマット定義の結合確認	ナビ「受注管理」→「出荷指示リスト」→検索で対象リストを選択し、admin_s…を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）でフォーマット定義の対象ファイルと処理条件を指定する	"1. 対象画面でフォーマット定義のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	フォーマット定義のファイル出力内容または取り込み結果が対象データと一致すること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-002	IT-18	フォーマット定義	P2	フォーマット定義の結合確認	order_ids 連想入力のオンキーを受注主キー一覧として読み、当該出荷指示…を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）でフォーマット定義の対象ファイルと処理条件を指定する	"1. 対象画面でフォーマット定義のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	フォーマット定義のファイル出力内容または取り込み結果が対象データと一致すること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-003	IT-18	フォーマット定義	P2	フォーマット定義の結合確認	表示要素を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）でフォーマット定義の対象ファイルと処理条件を指定する	"1. 対象画面でフォーマット定義のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	フォーマット定義のファイル出力内容または取り込み結果が対象データと一致すること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-004	IT-18	フォーマット定義	P2	フォーマット定義の結合確認	モーダル・ポップアップを試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）でフォーマット定義の対象ファイルと処理条件を指定する	"1. 対象画面でフォーマット定義のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	フォーマット定義のファイル出力内容または取り込み結果が対象データと一致すること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-005	IT-18	フォーマット定義	P2	フォーマット定義の結合確認	画面上部の請求欄テーブル値を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）でフォーマット定義の対象ファイルと処理条件を指定する	"1. 対象画面でフォーマット定義のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	フォーマット定義のファイル出力内容または取り込み結果が対象データと一致すること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-006	IT-18	フォーマット定義	P2	フォーマット定義の結合確認	オン受注から配送ID一覧を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）でフォーマット定義の対象ファイルと処理条件を指定する	"1. 対象画面でフォーマット定義のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	フォーマット定義のファイル出力内容または取り込み結果が対象データと一致すること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-007	IT-16	実行結果	P1	実行結果の結合確認	DB書込を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-008	IT-27	実行結果	P1	実行結果の結合確認	親画面チェック状態と印刷内容を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-009	IT-27	出力失敗	P1	出力失敗の結合確認	成功時出力を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で出力失敗の対象ファイルと処理条件を指定する	"1. 対象画面で出力失敗のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力失敗のファイル出力内容または取り込み結果が対象データと一致すること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-010	IT-15	CSRF	P1	CSRFの結合確認	失敗時出力を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）でCSRFの対象ファイルと処理条件を指定する	"1. 対象画面でCSRFのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	CSRFのファイル出力内容または取り込み結果が対象データと一致すること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-011	IT-15	未認証	P1	未認証の結合確認	副作用を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で未認証の対象ファイルと処理条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	DB更新なし、セッション書込みなしであること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-012	IT-15	対象データ	P1	対象データの結合確認	dtb_deliveryを試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で対象データの対象ファイルと処理条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	is_abroad で国内／海外、id が日本語テンプレの署名欄分岐に載る確認値として使われる場合があること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-013	IT-20	出力抑止	P1	出力抑止の結合確認	検索を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で出力抑止の対象ファイルと処理条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	検索条件に合致するレコードを抽出すること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-014	IT-20	識別子	P1	識別子の結合確認	ボタン成功後を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で識別子の対象ファイルと処理条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	編集ウィンドウ（親）はその場にとどまるであること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-015	IT-15	状態変化	P1	状態変化の結合確認	ナビ「受注管理」→「出荷指示リスト」→検索で対象リストを選択し、admin_s…を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で状態変化の対象ファイルと処理条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	window.open で空ウィンドウを開くこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-016	IT-25	UI部品	P3	UI部品の操作結果確認	order_ids 連想入力のオンキーを受注主キー一覧として読み、当該出荷指示…を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）でUI部品の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. order_ids 連想入力のオンキーを受注主キー一覧として読み、当該出荷指示…
3. 画面表示と後続状態を確認する"	order_ids 連想入力のオンキーを受注主キー一覧として読み、当該出荷指示リストに属する送信対象受注だけに絞り、それらにぶら下がる各配送について配送主キーを一意に集めるであること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-017	IT-25	UI部品	P3	UI部品の操作結果確認	表示要素を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）でUI部品の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	共通管理フレーム内編集ページであること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-018	IT-25	操作起点	P1	操作起点の操作結果確認	モーダル・ポップアップを試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で操作起点の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	印刷前の確認ダイアログは無いが、別ウィンドウを開いてPOSTするのみであること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-019	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	画面上部の請求欄テーブル値を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 画面上部の請求欄テーブル値を確認する
3. 画面表示と後続状態を確認する"	「小計」「送料」「手数料」「ポイント使用」「発送手段名」「請求金額（税込）」「内税」相当にデータが渡されるであること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-020	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	オン受注から配送ID一覧を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. オン受注から配送ID一覧を確認する
3. 画面表示と後続状態を確認する"	チェックオン受注のみが送信キーを持ち、各受注の全配送ぶら下がりの配送主キーを集めるであること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-021	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	DB書込を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. DB書込を確認する
3. 画面表示と後続状態を確認する"	しないこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-022	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	親画面チェック状態と印刷内容を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で送信可否制御の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 親画面チェック状態と印刷内容を確認する
3. 画面表示と後続状態を確認する"	POST時点でブラウザに載っていた状態のみ送信であること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-023	IT-03	外部画面	P2	外部画面の操作結果確認	成功時出力を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で外部画面の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	UTF-8のHTMLであること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-024	IT-03	画面遷移	P2	画面遷移の操作結果確認	失敗時出力を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	リスト不正・入力不正・結合結果の異常によりアクセス不存在相当もしくは共通例外処理であること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-025	IT-03	画面遷移	P2	画面遷移の操作結果確認	副作用を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	DB更新なし、セッション書込みなしであること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-026	IT-03	画面遷移	P2	画面遷移の操作結果確認	dtb_deliveryを試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. dtb_deliveryを確認する
3. 画面表示と後続状態を確認する"	is_abroad で国内／海外、id が日本語テンプレの署名欄分岐に載る確認値として使われる場合があること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-027	IT-03	画面遷移	P2	画面遷移の操作結果確認	検索を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 検索
3. 画面表示と後続状態を確認する"	検索条件に合致するレコードを抽出すること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-028	IT-03	画面遷移	P2	画面遷移の操作結果確認	ボタン成功後を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ボタン成功後を確認する
3. 画面表示と後続状態を確認する"	編集ウィンドウ（親）はその場にとどまるであること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-029	IT-03	画面遷移	P2	画面遷移の操作結果確認	ナビ「受注管理」→「出荷指示リスト」→検索で対象リストを選択し、admin_s…を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ナビ「受注管理」→「出荷指示リスト」→検索で対象リストを選択し、admin_s…
3. 画面表示と後続状態を確認する"	window.open で空ウィンドウを開くこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-030	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	order_ids 連想入力のオンキーを受注主キー一覧として読み、当該出荷指示…を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）でURL直接アクセスの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. order_ids 連想入力のオンキーを受注主キー一覧として読み、当該出荷指示…
3. 画面表示と後続状態を確認する"	order_ids 連想入力のオンキーを受注主キー一覧として読み、当該出荷指示リストに属する送信対象受注だけに絞り、それらにぶら下がる各配送について配送主キーを一意に集めるであること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-031	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	表示要素を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）でHTTPステータスの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	共通管理フレーム内編集ページであること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-032	IT-25	URL	P2	URLの操作結果確認	モーダル・ポップアップを試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）でURLの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	印刷前の確認ダイアログは無いが、別ウィンドウを開いてPOSTするのみであること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-033	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	画面上部の請求欄テーブル値を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 画面上部の請求欄テーブル値を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-034	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	オン受注から配送ID一覧を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. オン受注から配送ID一覧を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-035	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	DB書込を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. DB書込を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-036	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	親画面チェック状態と印刷内容を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. 親画面チェック状態と印刷内容を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-037	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	成功時出力を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-038	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	失敗時出力を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-039	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	副作用を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で文字列長バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-040	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	dtb_deliveryを試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で文字列長バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. dtb_deliveryを確認する
3. 画面表示と後続状態を確認する"	is_abroad で国内／海外、id が日本語テンプレの署名欄分岐に載る確認値として使われる場合があること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-041	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	検索を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 検索
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-042	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	ボタン成功後を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ボタン成功後を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-043	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	ナビ「受注管理」→「出荷指示リスト」→検索で対象リストを選択し、admin_s…を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ナビ「受注管理」→「出荷指示リスト」→検索で対象リストを選択し、admin_s…
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-044	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	order_ids 連想入力のオンキーを受注主キー一覧として読み、当該出荷指示…を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. order_ids 連想入力のオンキーを受注主キー一覧として読み、当該出荷指示…
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-045	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	表示要素を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-046	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	モーダル・ポップアップを試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-047	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	画面上部の請求欄テーブル値を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 画面上部の請求欄テーブル値を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-048	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	オン受注から配送ID一覧を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. オン受注から配送ID一覧を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-049	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	DB書込を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で文字種バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. DB書込を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-050	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	親画面チェック状態と印刷内容を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で文字種バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 親画面チェック状態と印刷内容を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-051	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	成功時出力を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-052	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	失敗時出力を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-053	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	副作用を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-054	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	dtb_deliveryを試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. dtb_deliveryを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-055	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	検索を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）でその他のバリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 検索
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-056	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	ボタン成功後を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）でその他のバリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ボタン成功後を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-057	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	ナビ「受注管理」→「出荷指示リスト」→検索で対象リストを選択し、admin_s…を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. ナビ「受注管理」→「出荷指示リスト」→検索で対象リストを選択し、admin_s…
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-058	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	order_ids 連想入力のオンキーを受注主キー一覧として読み、当該出荷指示…を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. order_ids 連想入力のオンキーを受注主キー一覧として読み、当該出荷指示…
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-059	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	表示要素を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）でその他のバリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	共通管理フレーム内編集ページであること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-060	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	モーダル・ポップアップを試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-061	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	画面上部の請求欄テーブル値を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 画面上部の請求欄テーブル値を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-062	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	オン受注から配送ID一覧を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. オン受注から配送ID一覧を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-063	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	DB書込を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. DB書込を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-064	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	親画面チェック状態と印刷内容を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 親画面チェック状態と印刷内容を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-065	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	成功時出力を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-066	IT-22	必須制御	P1	必須制御の入力検証	失敗時出力を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	リスト不正・入力不正・結合結果の異常によりアクセス不存在相当もしくは共通例外処理であること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-067	IT-22	部分入力	P2	部分入力の入力検証	副作用を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で部分入力の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	DB更新なし、セッション書込みなしであること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-068	IT-23	検索条件	P2	検索時の検索条件確認	dtb_deliveryを試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-069	IT-23	検索条件	P2	検索時の検索条件確認	検索を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-070	IT-23	検索条件	P2	検索時の検索条件確認	ボタン成功後を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	編集ウィンドウ（親）はその場にとどまるであること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-071	IT-23	検索条件	P2	検索時の検索条件確認	ナビ「受注管理」→「出荷指示リスト」→検索で対象リストを選択し、admin_s…を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-072	IT-23	検索条件	P2	検索時の検索条件確認	order_ids 連想入力のオンキーを受注主キー一覧として読み、当該出荷指示…を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-073	IT-23	検索条件	P2	検索時の検索条件確認	表示要素を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-074	IT-23	検索条件	P2	検索時の検索条件確認	モーダル・ポップアップを試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-075	IT-23	検索条件	P2	検索時の検索条件確認	画面上部の請求欄テーブル値を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-076	IT-23	検索条件	P2	検索時の検索条件確認	オン受注から配送ID一覧を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-077	IT-23	検索条件	P2	検索時の検索条件確認	DB書込を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-078	IT-23	検索条件	P2	検索時の検索条件確認	親画面チェック状態と印刷内容を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-079	IT-23	検索条件	P2	検索時の検索条件確認	成功時出力を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-080	IT-23	検索条件	P2	検索時の検索条件確認	失敗時出力を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-081	IT-23	検索条件	P2	検索時の検索条件確認	副作用を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	DB更新なし、セッション書込みなしであること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-082	IT-23	検索条件	P2	検索時の検索条件確認	dtb_deliveryを試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-083	IT-23	検索条件	P2	検索時の検索条件確認	検索を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-084	IT-23	実行結果	P2	検索時の実行結果確認	ボタン成功後を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-085	IT-23	実行結果	P2	検索時の実行結果確認	ナビ「受注管理」→「出荷指示リスト」→検索で対象リストを選択し、admin_s…を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	window.open で空ウィンドウを開くこと。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-086	IT-23	実行結果	P2	検索時の実行結果確認	order_ids 連想入力のオンキーを受注主キー一覧として読み、当該出荷指示…を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-087	IT-23	実行結果	P2	検索時の実行結果確認	表示要素を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-088	IT-23	実行結果	P2	検索時の実行結果確認	モーダル・ポップアップを試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-089	IT-16	実行結果	P2	実行結果の結合確認	画面上部の請求欄テーブル値を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））	IT-M05-22-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-PRINT-DELIVERY-SLIPS-JA-090	IT-16	実行結果	P2	実行結果の結合確認	オン受注から配送ID一覧を試験できる状態である	m05-22_admin_order_order_shipping_standby_print_delivery_slips_ja（受注管理_出荷指示_納品書印刷（日本語））（m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
```

## 対象外観点

| 分類・範囲 | 理由 |
|-----------|------|
| データベースアクセス / DB操作 / 登録（IT-23, IT-26） | 本機能に登録処理がないため |
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
| ファイル処理 / ※ファイルアップロードを含む / 実行結果（IT-16, IT-24） | 元設計HTMLに該当する処理・I/Fがないため |
| ファイル処理 / ※ファイルアップロードを含む / バリデーション（IT-17, IT-24） | 元設計HTMLに該当する処理・I/Fがないため |
| ファイル処理 / ファイル出力 / 実行結果（IT-27） | 元設計HTMLに該当する処理・I/Fがないため |
| ファイル処理 / ※ファイルダウンロードを含む / 実行結果（IT-24, IT-27） | 元設計HTMLに該当する処理・I/Fがないため |
| ファイル処理 / ※ファイルダウンロードを含む / データ出力（IT-24） | 元設計HTMLに該当する処理・I/Fがないため |
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
| ウェブサービス / 外部連携 / 連携エラー（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| その他 | 同種の対象外観点 16 件は上記分類と同じ理由で対象外 |
