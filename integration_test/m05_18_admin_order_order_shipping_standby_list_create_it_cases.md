# m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m05-18_admin_order_order_shipping_standby_list_create.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、UI部品、URL、操作起点、確認ダイアログ、送信可否制御 |
| IT-03 | 外部画面、画面遷移 |
| IT-13 | URL直接アクセス |
| IT-22 | DBとの相関バリデーション、その他のバリデーション、必須バリデーション、必須制御、数値バリデーション、文字列長バリデーション、文字種バリデーション、相関バリデーション |
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
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-001	IT-15	CSRF	P1	CSRFの結合確認	ナビ「受注管理」→「出荷指示」で一覧画面を開き、上部カード「生成」を展開して条…を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でナビ「受注管理」→「出荷指示」で一覧画面を開き、上部カード「生成」を展開して条…の確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	検証成功かつ抽出が1件以上なら区分ごとにリストが増え、対象受注に出荷指示日と対応状況「出荷指示」が入るであること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-002	IT-15	未認証	P1	未認証の結合確認	同上だが抽出0件を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で同上だが抽出0件の確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	エラーフラッシュのうえ一覧ルートへ戻ること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-003	IT-15	対象データ	P1	対象データの結合確認	同上だがフォーム検証失敗を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で同上だがフォーム検証失敗の確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	エラーフラッシュのうえ一覧ルートへ戻ること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-004	IT-20	出力抑止	P1	出力抑止の結合確認	表示要素を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で表示要素の確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	@admin/ShippingStandby/index.twig内の独立フォームgenerate_formであること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-005	IT-20	識別子	P1	識別子の結合確認	JSを試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でJSの確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	当ページのjavascriptブロックは空であること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-006	IT-15	状態変化	P1	状態変化の結合確認	受注の更新を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で受注の更新の確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	各リスト行のflushの直後に、その行に紐づく受注へ対応状況と出荷指示日を一括適用すること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-007	IT-25	UI部品	P3	UI部品の操作結果確認	全区分で0件を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で全区分で0件の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 全区分で0件を確認する
3. 画面表示と後続状態を確認する"	コントローラが配列空と判断し、永続化前にエラーフラッシュで終了すること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-008	IT-25	UI部品	P3	UI部品の操作結果確認	受注明細が0件の受注を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で受注明細が0件の受注の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 受注明細が0件の受注を確認する
3. 画面表示と後続状態を確認する"	区分判定で先頭明細参照があり、実装上エラーになりうるであること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-009	IT-25	操作起点	P1	操作起点の操作結果確認	一覧再表示を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で一覧再表示の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧再表示を確認する
3. 画面表示と後続状態を確認する"	成功後はadmin_shipping_standbyへGET相当で戻ること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-010	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	リストと受注を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でリストと受注の確認に必要な条件を指定する	"1. 対象画面を表示する
2. リストと受注を確認する
3. 画面表示と後続状態を確認する"	同一トランザクションでリスト行・中間テーブル・受注の対応状況と出荷指示日が更新されるであること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-011	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	同時更新を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で同時更新の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 同時更新を確認する
3. 画面表示と後続状態を確認する"	楽観ロックは用いず、バルク更新は実行時点の行へ上書きすること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-012	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	成功時出力を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	302でadmin_shipping_standbyへ遷移であること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-013	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	失敗時出力を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	同上ルートへ遷移であること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-014	IT-03	外部画面	P2	外部画面の操作結果確認	副作用を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で副作用の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	dtb_shipping_standbyへのINSERT、中間テーブルへのINSERT、対象dtb_orderのorder_status_idとcommit_dateの更新であること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-015	IT-03	画面遷移	P2	画面遷移の操作結果確認	dtb_orderを試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でdtb_orderの確認に必要な条件を指定する	"1. 対象画面を表示する
2. dtb_orderを確認する
3. 画面表示と後続状態を確認する"	出荷指示（9）へ更新であること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-016	IT-03	画面遷移	P2	画面遷移の操作結果確認	登録/更新を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で登録/更新の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）であること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-017	IT-03	画面遷移	P2	画面遷移の操作結果確認	注文番号の各欄を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で注文番号の各欄の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 注文番号の各欄を確認する
3. 画面表示と後続状態を確認する"	IntegerType・任意であること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	生成POSTを試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で生成POSTの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 生成POSTを確認する
3. 画面表示と後続状態を確認する"	一覧側のGET初期表示もしくは一覧が持つセッション復元規則に従うであること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	フォーム未送信／検証エラーを試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でフォーム未送信／検証エラーの確認に必要な条件を指定する	"1. 対象画面を表示する
2. フォーム未送信／検証エラー
3. 画面表示と後続状態を確認する"	admin.common.save_errorを表示し一覧へであること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	トランザクション内のその他の例外を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でトランザクション内のその他の例外の確認に必要な条件を指定する	"1. 対象画面を表示する
2. トランザクション内のその他の例外を確認する
3. 画面表示と後続状態を確認する"	ロールバック後に再送出であること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-021	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	フラッシュを試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でフラッシュの確認に必要な条件を指定する	"1. 対象画面を表示する
2. フラッシュを確認する
3. 画面表示と後続状態を確認する"	リダイレクト先で一度表示されるメッセージに成功・失敗を載せるであること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-022	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	ナビ「受注管理」→「出荷指示」で一覧画面を開き、上部カード「生成」を展開して条…を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でナビ「受注管理」→「出荷指示」で一覧画面を開き、上部カード「生成」を展開して条…の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ナビ「受注管理」→「出荷指示」で一覧画面を開き、上部カード「生成」を展開して条…を確認する
3. 画面表示と後続状態を確認する"	検証成功かつ抽出が1件以上なら区分ごとにリストが増え、対象受注に出荷指示日と対応状況「出荷指示」が入るであること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-023	IT-25	URL	P2	URLの操作結果確認	同上だが抽出0件を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で同上だが抽出0件の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 同上だが抽出0件を確認する
3. 画面表示と後続状態を確認する"	エラーフラッシュのうえ一覧ルートへ戻ること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-024	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	同上だがフォーム検証失敗を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 同上だがフォーム検証失敗を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-025	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	表示要素を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-026	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	JSを試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. JSを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-027	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	受注の更新を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. 受注の更新を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-028	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	全区分で0件を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. 全区分で0件を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	受注明細が0件の受注を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. 受注明細が0件の受注を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	一覧再表示を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で一覧再表示の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧再表示を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-031	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	同時更新を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で同時更新の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 同時更新を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-032	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	成功時出力を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-033	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	失敗時出力を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-034	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	副作用を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	dtb_orderを試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. dtb_orderを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	登録/更新を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	注文番号の各欄を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 注文番号の各欄を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	生成POSTを試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で生成POSTの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 生成POSTを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-039	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	フォーム未送信／検証エラーを試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でフォーム未送信／検証エラーの確認に必要な条件を指定する	"1. 対象画面を表示する
2. フォーム未送信／検証エラー
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-040	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	トランザクション内のその他の例外を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でトランザクション内のその他の例外の確認に必要な条件を指定する	"1. 対象画面を表示する
2. トランザクション内のその他の例外を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-041	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	フラッシュを試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. フラッシュを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-042	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	ナビ「受注管理」→「出荷指示」で一覧画面を開き、上部カード「生成」を展開して条…を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. ナビ「受注管理」→「出荷指示」で一覧画面を開き、上部カード「生成」を展開して条…を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-043	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	同上だが抽出0件を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 同上だが抽出0件を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-044	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	同上だがフォーム検証失敗を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 同上だがフォーム検証失敗を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	表示要素を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	JSを試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でJSの確認に必要な条件を指定する	"1. 対象画面を表示する
2. JSを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	受注の更新を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 受注の更新を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	全区分で0件を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 全区分で0件を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-049	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	一覧再表示を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 一覧再表示を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-050	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	リストと受注を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. リストと受注を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-051	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	同時更新を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 同時更新を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-052	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	成功時出力を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-053	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	失敗時出力を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-054	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	副作用を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-055	IT-22	必須制御	P1	必須制御の入力検証	dtb_orderを試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. dtb_orderを確認する
3. 画面表示と後続状態を確認する"	出荷指示（9）へ更新であること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-056	IT-23	検索条件	P2	検索時の検索条件確認	注文番号の各欄を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-057	IT-23	検索条件	P2	検索時の検索条件確認	生成POSTを試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-058	IT-23	検索条件	P2	検索時の検索条件確認	フォーム未送信／検証エラーを試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でフォーム未送信／検証エラーの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	admin.common.save_errorを表示し一覧へであること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-059	IT-23	検索条件	P2	検索時の検索条件確認	トランザクション内のその他の例外を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-060	IT-23	検索条件	P2	検索時の検索条件確認	フラッシュを試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-061	IT-23	検索条件	P2	検索時の検索条件確認	ナビ「受注管理」→「出荷指示」で一覧画面を開き、上部カード「生成」を展開して条…を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-062	IT-23	検索条件	P2	検索時の検索条件確認	同上だが抽出0件を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-063	IT-23	検索条件	P2	検索時の検索条件確認	同上だがフォーム検証失敗を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-064	IT-23	検索条件	P2	検索時の検索条件確認	表示要素を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-065	IT-23	検索条件	P2	検索時の検索条件確認	JSを試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でJSの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-066	IT-23	検索条件	P2	検索時の検索条件確認	受注の更新を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で受注の更新の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-067	IT-23	検索条件	P2	検索時の検索条件確認	全区分で0件を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で全区分で0件の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-068	IT-23	検索条件	P2	検索時の検索条件確認	受注明細が0件の受注を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で受注明細が0件の受注の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-069	IT-23	検索条件	P2	検索時の検索条件確認	一覧再表示を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で一覧再表示の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	成功後はadmin_shipping_standbyへGET相当で戻ること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-070	IT-23	検索条件	P2	検索時の検索条件確認	リストと受注を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でリストと受注の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-071	IT-23	検索条件	P2	検索時の検索条件確認	同時更新を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で同時更新の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-072	IT-23	実行結果	P2	検索時の実行結果確認	成功時出力を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で成功時出力の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-073	IT-23	実行結果	P2	検索時の実行結果確認	失敗時出力を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で失敗時出力の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	同上ルートへ遷移であること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-074	IT-23	実行結果	P2	検索時の実行結果確認	副作用を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で副作用の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-075	IT-23	実行結果	P2	検索時の実行結果確認	dtb_orderを試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でdtb_orderの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-076	IT-23	実行結果	P2	検索時の実行結果確認	登録/更新を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で登録/更新の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-077	IT-26	登録内容	P1	登録時の登録内容確認	注文番号の各欄を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で注文番号の各欄の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-078	IT-26	登録内容	P1	登録時の登録内容確認	生成POSTを試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で生成POSTの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-079	IT-26	登録内容	P1	登録時の登録内容確認	フォーム未送信／検証エラーを試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でフォーム未送信／検証エラーの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-080	IT-26	登録内容	P1	登録時の登録内容確認	トランザクション内のその他の例外を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でトランザクション内のその他の例外の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	ロールバック後に再送出であること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-081	IT-26	登録内容	P1	登録時の登録内容確認	フラッシュを試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でフラッシュの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	リダイレクト先で一度表示されるメッセージに成功・失敗を載せるであること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-082	IT-23	登録内容	P1	登録時の登録内容確認	ナビ「受注管理」→「出荷指示」で一覧画面を開き、上部カード「生成」を展開して条…を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でナビ「受注管理」→「出荷指示」で一覧画面を開き、上部カード「生成」を展開して条…の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検証成功かつ抽出が1件以上なら区分ごとにリストが増え、対象受注に出荷指示日と対応状況「出荷指示」が入るであること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-083	IT-26	登録内容	P1	登録時の登録内容確認	同上だが抽出0件を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で同上だが抽出0件の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	エラーフラッシュのうえ一覧ルートへ戻ること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-084	IT-26	登録内容	P1	登録時の登録内容確認	同上だがフォーム検証失敗を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で同上だがフォーム検証失敗の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	エラーフラッシュのうえ一覧ルートへ戻ること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-085	IT-26	登録内容	P1	登録時の登録内容確認	表示要素を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で表示要素の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	@admin/ShippingStandby/index.twig内の独立フォームgenerate_formであること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-086	IT-26	登録内容	P1	登録時の登録内容確認	JSを試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）でJSの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	当ページのjavascriptブロックは空であること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-087	IT-26	登録内容	P1	登録時の登録内容確認	受注の更新を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で受注の更新の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	各リスト行のflushの直後に、その行に紐づく受注へ対応状況と出荷指示日を一括適用すること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-088	IT-26	登録内容	P1	登録時の登録内容確認	全区分で0件を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で全区分で0件の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-089	IT-26	登録内容	P1	登録時の登録内容確認	受注明細が0件の受注を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）	IT-M05-18-ADMIN-ORDER-ORDER-SHIPPING-STANDBY-LIST-CREATE-090	IT-26	登録内容	P1	登録時の登録内容確認	一覧再表示を試験できる状態である	m05-18_admin_order_order_shipping_standby_list_create（受注管理 — 出荷指示リスト作成）（m05_18_admin_order_order_shipping_standby_list_create）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
```

## 対象外観点

| 分類・範囲 | 理由 |
|-----------|------|
| バリデーション / バリデーション / 単項目バリデーション（IT-22） | 元設計HTMLに該当する処理・I/Fがないため |
| バリデーション / 管理画面 / バリデーション（IT-22） | 元設計HTMLに該当する処理・I/Fがないため |
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
| ファイル処理 / ファイル取込 / 実行結果（IT-16） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルアップロードを含む / 実行結果（IT-16, IT-24） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルアップロードを含む / バリデーション（IT-17, IT-24） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ファイル出力 / 実行結果（IT-27） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルダウンロードを含む / 実行結果（IT-24, IT-27） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルダウンロードを含む / データ出力（IT-18, IT-24） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ファイル操作 / 実行結果（IT-27） | 本機能は対象の外部I/Fを扱わないため |
| ファイル処理 / 数量・金額影響機能 / 対象機能（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| ファイル処理 / 数量 / 更新結果（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / 増加・調整 / ファイル登録（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / 参照・非更新 / 参照系機能（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / 参照・非更新 / ファイル出力（IT-33） | 本機能はファイル入出力を扱わないため |
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
| その他 | 同種の対象外観点 19 件は上記分類と同じ理由で対象外 |
