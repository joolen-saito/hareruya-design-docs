# M12-05（入荷通知依頼 一覧表示） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m12-05_admin_analytics_sales_arrival_notification_search_list.html`

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
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-001	IT-15	CSRF	P1	CSRFの結合確認	依頼者の結合を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で依頼者の結合の確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	プレイヤー（dtb_player）への結合（dtb_product_request.player_id）であること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-002	IT-15	未認証	P1	未認証の結合確認	会員名（表示・絞り込み）を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で会員名（表示・絞り込み）の確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	dtb_player.last_name_jp・first_name_jp（英名は last_name_en・first_name_en）であること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-003	IT-15	対象データ	P1	対象データの結合確認	入荷通知依頼を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で入荷通知依頼の確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	会員が商品規格に対して登録した再入荷お知らせの依頼であること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-004	IT-20	出力抑止	P1	出力抑止の結合確認	依頼日を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で依頼日の確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	入荷通知依頼の登録日であること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-005	IT-20	識別子	P1	識別子の結合確認	検索条件セッションを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索条件セッションの確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	検索実行時に検索条件を保存するセッション領域であること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-006	IT-15	状態変化	P1	状態変化の結合確認	サイドメニュー「入荷通知依頼」を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でサイドメニュー「入荷通知依頼」の確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	依頼日を当月初日〜当月末日、並び順を昇順とした検索画面を表示すること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-007	IT-25	UI部品	P3	UI部品の操作結果確認	検索ボタン押下を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索ボタン押下の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索ボタン押下
3. 画面表示と後続状態を確認する"	入力された検索条件で抽出し、同一画面に一覧を表示すること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-008	IT-25	UI部品	P3	UI部品の操作結果確認	表示要素を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	検索条件のアコーディオン、検索ボタン、一覧テーブルであること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-009	IT-25	操作起点	P1	操作起点の操作結果確認	入力項目を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で入力項目の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力項目
3. 画面表示と後続状態を確認する"	商品名（日/英）・会員名のテキスト欄、依頼日From・To、販売金額From・To、購入日From・To、購入状況のチェックボックス、並べ替えのセレクト、昇順/降順のラジオ、表示件数のセレクト、売上分析タグであること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-010	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	行操作メニューを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で行操作メニューの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 行操作メニューを確認する
3. 画面表示と後続状態を確認する"	各行の操作メニューから規格編集へ遷移できること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-011	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	対象データを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で対象データの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 対象データを確認する
3. 画面表示と後続状態を確認する"	入荷通知依頼を起点に、会員・商品規格・商品・規格サブ（言語・状態）を結合すること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-012	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	結合を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で結合の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 結合を確認する
3. 画面表示と後続状態を確認する"	言語・状態は規格サブの参照（左結合）で取得すること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-013	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	除外条件を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で除外条件の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 除外条件を確認する
3. 画面表示と後続状態を確認する"	論理削除フィルタを無効化して抽出すること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-014	IT-03	外部画面	P2	外部画面の操作結果確認	依頼単位を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で依頼単位の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 依頼単位を確認する
3. 画面表示と後続状態を確認する"	一覧は依頼IDでグループ化し、依頼1件を1行として表示すること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-015	IT-03	画面遷移	P2	画面遷移の操作結果確認	購入の判定を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で購入の判定の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 購入の判定を確認する
3. 画面表示と後続状態を確認する"	依頼後（通知設定削除日より後の注文日）の同会員・同規格の注文を購入とみなすであること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-016	IT-03	画面遷移	P2	画面遷移の操作結果確認	通知日/通知設定削除日を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で通知日/通知設定削除日の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 通知日/通知設定削除日
3. 画面表示と後続状態を確認する"	依頼の論理削除日時を、通知日もしくは通知設定削除日としてY/m/d H:iで表示すること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-017	IT-03	画面遷移	P2	画面遷移の操作結果確認	会員名を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で会員名の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 会員名を確認する
3. 画面表示と後続状態を確認する"	会員の姓と名を全角空白で連結して表示すること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	表示件数を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で表示件数の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示件数を確認する
3. 画面表示と後続状態を確認する"	一覧は表示件数の上限で打ち切るであること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	商品名（日/英）・会員名を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で商品名（日/英）・会員名の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 商品名（日/英）・会員名を確認する
3. 画面表示と後続状態を確認する"	フォームキー multiであること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	依頼日Fromを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で依頼日Fromの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 依頼日Fromを確認する
3. 画面表示と後続状態を確認する"	フォームキー create_date_fromであること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-021	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	依頼日Toを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で依頼日Toの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 依頼日Toを確認する
3. 画面表示と後続状態を確認する"	フォームキー create_date_toであること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-022	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	表示件数を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で表示件数の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示件数を確認する
3. 画面表示と後続状態を確認する"	フォームキー limitであること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-023	IT-25	URL	P2	URLの操作結果確認	検索結果が0件を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索結果が0件の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索結果が0件
3. 画面表示と後続状態を確認する"	該当データが無い旨の見出しを表示すること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-024	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	通知設定が削除済みの依頼を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 通知設定が削除済みの依頼
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-025	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	通知設定削除日が未設定を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 通知設定削除日が未設定
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-026	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	参照時点を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 参照時点を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-027	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	論理削除フィルタを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. 論理削除フィルタ
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-028	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	CSVとの整合性を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. CSVとの整合性を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	更新との整合性を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. 更新との整合性を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	入力を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で入力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-031	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	成功時出力を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	入荷通知依頼の一覧を含む画面であること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-032	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	失敗時出力を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-033	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	副作用を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で副作用の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-034	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	dtb_product_requestを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でdtb_product_requestの確認に必要な条件を指定する	"1. 対象画面を表示する
2. dtb_product_requestを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	dtb_product_requestを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. dtb_product_requestを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	dtb_product_classを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. dtb_product_classを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	dtb_product_classを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. dtb_product_classを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	dtb_orderを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. dtb_orderを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-039	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	dtb_player（現行 dtb_customer）を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でdtb_player（現行 dtb_customer）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. dtb_player（現行 dtb_customer）を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-040	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	昇順/降順・表示件数を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で昇順/降順・表示件数の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 昇順/降順・表示件数を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-041	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	依頼者の結合を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で依頼者の結合の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 依頼者の結合を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-042	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	会員名（表示・絞り込み）を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 会員名（表示・絞り込み）を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-043	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	入荷通知依頼を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 入荷通知依頼を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-044	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	依頼日を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 依頼日を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	検索条件セッションを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 検索条件セッション
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	サイドメニュー「入荷通知依頼」を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でサイドメニュー「入荷通知依頼」の確認に必要な条件を指定する	"1. 対象画面を表示する
2. サイドメニュー「入荷通知依頼」を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	検索ボタン押下を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索ボタン押下の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索ボタン押下
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	表示要素を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-049	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	入力項目を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 入力項目
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-050	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	対象データを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 対象データを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-051	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	結合を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 結合を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-052	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	除外条件を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 除外条件を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-053	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	依頼単位を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 依頼単位を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-054	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	購入の判定を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 購入の判定を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-055	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	通知日/通知設定削除日を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 通知日/通知設定削除日
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-056	IT-22	必須制御	P1	必須制御の入力検証	会員名を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. 会員名を確認する
3. 画面表示と後続状態を確認する"	会員の姓と名を全角空白で連結して表示すること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-057	IT-23	検索条件	P2	検索時の検索条件確認	商品名（日/英）・会員名を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-058	IT-23	検索条件	P2	検索時の検索条件確認	依頼日Fromを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-059	IT-23	検索条件	P2	検索時の検索条件確認	依頼日Toを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で依頼日Toの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	フォームキー create_date_toであること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-060	IT-23	検索条件	P2	検索時の検索条件確認	表示件数を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-061	IT-23	検索条件	P2	検索時の検索条件確認	検索結果が0件を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-062	IT-23	検索条件	P2	検索時の検索条件確認	通知設定が削除済みの依頼を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-063	IT-23	検索条件	P2	検索時の検索条件確認	通知設定削除日が未設定を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-064	IT-23	検索条件	P2	検索時の検索条件確認	参照時点を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-065	IT-23	検索条件	P2	検索時の検索条件確認	論理削除フィルタを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-066	IT-23	検索条件	P2	検索時の検索条件確認	CSVとの整合性を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でCSVとの整合性の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-067	IT-23	検索条件	P2	検索時の検索条件確認	更新との整合性を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で更新との整合性の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-068	IT-23	検索条件	P2	検索時の検索条件確認	入力を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で入力の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-069	IT-23	検索条件	P2	検索時の検索条件確認	成功時出力を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で成功時出力の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-070	IT-23	検索条件	P2	検索時の検索条件確認	失敗時出力を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で失敗時出力の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	データ取得失敗時はアプリケーションの共通例外処理に委ねるであること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-071	IT-23	検索条件	P2	検索時の検索条件確認	副作用を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で副作用の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-072	IT-23	検索条件	P2	検索時の検索条件確認	dtb_product_requestを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でdtb_product_requestの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-073	IT-23	実行結果	P2	検索時の実行結果確認	dtb_product_requestを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でdtb_product_requestの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-074	IT-23	実行結果	P2	検索時の実行結果確認	dtb_product_classを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でdtb_product_classの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	商品コード・販売金額・在庫数の表示・絞り込みであること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-075	IT-23	実行結果	P2	検索時の実行結果確認	dtb_product_classを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でdtb_product_classの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-076	IT-23	実行結果	P2	検索時の実行結果確認	dtb_orderを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でdtb_orderの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-077	IT-23	実行結果	P2	検索時の実行結果確認	dtb_player（現行 dtb_customer）を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でdtb_player（現行 dtb_customer）の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-078	IT-26	登録内容	P1	登録時の登録内容確認	昇順/降順・表示件数を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で昇順/降順・表示件数の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-079	IT-26	登録内容	P1	登録時の登録内容確認	依頼者の結合を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で依頼者の結合の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-080	IT-26	登録内容	P1	登録時の登録内容確認	会員名（表示・絞り込み）を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で会員名（表示・絞り込み）の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-081	IT-26	登録内容	P1	登録時の登録内容確認	入荷通知依頼を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で入荷通知依頼の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	会員が商品規格に対して登録した再入荷お知らせの依頼であること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-082	IT-26	登録内容	P1	登録時の登録内容確認	依頼日を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で依頼日の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	入荷通知依頼の登録日であること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-083	IT-23	登録内容	P1	登録時の登録内容確認	検索条件セッションを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索条件セッションの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索実行時に検索条件を保存するセッション領域であること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-084	IT-26	登録内容	P1	登録時の登録内容確認	サイドメニュー「入荷通知依頼」を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でサイドメニュー「入荷通知依頼」の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	依頼日を当月初日〜当月末日、並び順を昇順とした検索画面を表示すること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-085	IT-26	登録内容	P1	登録時の登録内容確認	検索ボタン押下を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索ボタン押下の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	入力された検索条件で抽出し、同一画面に一覧を表示すること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-086	IT-26	登録内容	P1	登録時の登録内容確認	表示要素を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で表示要素の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件のアコーディオン、検索ボタン、一覧テーブルであること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-087	IT-26	登録内容	P1	登録時の登録内容確認	入力項目を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で入力項目の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	商品名（日/英）・会員名のテキスト欄、依頼日From・To、販売金額From・To、購入日From・To、購入状況のチェックボックス、並べ替えのセレクト、昇順/降順のラジオ、表示件数のセレクト、売上分析タグであること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-088	IT-26	登録内容	P1	登録時の登録内容確認	行操作メニューを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で行操作メニューの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	各行の操作メニューから規格編集へ遷移できること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-089	IT-26	登録内容	P1	登録時の登録内容確認	対象データを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で対象データの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-090	IT-26	登録内容	P1	登録時の登録内容確認	結合を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
```

## 対象外観点

| 分類・範囲 | 理由 |
|-----------|------|
| バリデーション / バリデーション / 単項目バリデーション（IT-22） | 元設計HTMLに該当する処理・I/Fがないため |
| バリデーション / 管理画面 / バリデーション（IT-22） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 登録（IT-23, IT-26） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 更新（IT-05, IT-23, IT-26） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 削除（IT-05） | 元設計HTMLに該当する処理・I/Fがないため |
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
