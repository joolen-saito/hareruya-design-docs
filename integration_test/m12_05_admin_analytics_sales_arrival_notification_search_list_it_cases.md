# M12-05（入荷通知依頼 一覧表示） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m12-05_admin_analytics_sales_arrival_notification_search_list.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、機密情報、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、URL、データなし、一覧、更新抑止、欠損値、画面レイアウト、画面表示データ、確認ダイアログ |
| IT-22 | DBとの相関バリデーション、必須バリデーション、文字列長バリデーション、相関バリデーション、部分入力 |
| IT-23 | 実行結果、検索条件 |
| IT-26 | 実行結果、更新内容、登録内容 |
| IT-05 | 削除条件、実行結果 |
| IT-02 | 公開コンテンツ、初期行数、表示順 |
| IT-12 | エラー継続、内部情報、画面レイアウト、画面表示データ、非同期更新 |

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
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-007	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	検索ボタン押下を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索ボタン押下の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索ボタン押下
3. 画面表示と後続状態を確認する"	入力された検索条件で抽出し、同一画面に一覧を表示すること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-008	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	表示要素を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	検索条件のアコーディオン、検索ボタン、一覧テーブルであること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-009	IT-25	URL	P2	URLの操作結果確認	入力項目を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で入力項目の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力項目
3. 画面表示と後続状態を確認する"	商品名（日/英）・会員名のテキスト欄、依頼日From・To、販売金額From・To、購入日From・To、購入状況のチェックボックス、並べ替えのセレクト、昇順/降順のラジオ、表示件数のセレクト、売上分析タグであること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-010	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	行操作メニューを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 行操作メニューを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-011	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	対象データを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 対象データを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-012	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	結合を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で結合の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 結合を確認する
3. 画面表示と後続状態を確認する"	言語・状態は規格サブの参照（左結合）で取得すること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-013	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	除外条件を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 除外条件を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-014	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	依頼単位を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 依頼単位を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-015	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	購入の判定を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 購入の判定を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-016	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	通知日/通知設定削除日を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 通知日/通知設定削除日
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-017	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	会員名を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 会員名を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-018	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	表示件数を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 表示件数を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-019	IT-22	部分入力	P2	部分入力の入力検証	商品名（日/英）・会員名を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で商品名（日/英）・会員名の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 商品名（日/英）・会員名を確認する
3. 画面表示と後続状態を確認する"	フォームキー multiであること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-020	IT-23	検索条件	P2	検索時の検索条件確認	依頼日Fromを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-021	IT-23	検索条件	P2	検索時の検索条件確認	依頼日Toを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-022	IT-23	検索条件	P2	検索時の検索条件確認	表示件数を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-023	IT-23	検索条件	P2	検索時の検索条件確認	検索結果が0件を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-024	IT-23	検索条件	P2	検索時の検索条件確認	通知設定が削除済みの依頼を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-025	IT-23	検索条件	P2	検索時の検索条件確認	通知設定削除日が未設定を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-026	IT-23	検索条件	P2	検索時の検索条件確認	参照時点を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-027	IT-23	検索条件	P2	検索時の検索条件確認	論理削除フィルタを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-028	IT-23	検索条件	P2	検索時の検索条件確認	CSVとの整合性を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でCSVとの整合性の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-029	IT-23	検索条件	P2	検索時の検索条件確認	更新との整合性を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で更新との整合性の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-030	IT-23	検索条件	P2	検索時の検索条件確認	入力を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で入力の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-031	IT-23	検索条件	P2	検索時の検索条件確認	成功時出力を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で成功時出力の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-032	IT-23	検索条件	P2	検索時の検索条件確認	失敗時出力を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で失敗時出力の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-033	IT-23	検索条件	P2	検索時の検索条件確認	副作用を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で副作用の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-034	IT-23	実行結果	P2	検索時の実行結果確認	dtb_product_requestを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でdtb_product_requestの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-035	IT-23	実行結果	P2	検索時の実行結果確認	dtb_product_classを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でdtb_product_classの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-036	IT-26	登録内容	P1	登録時の登録内容確認	dtb_orderを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でdtb_orderの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-037	IT-26	登録内容	P1	登録時の登録内容確認	dtb_player（現行 dtb_customer）を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でdtb_player（現行 dtb_customer）の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-038	IT-26	登録内容	P1	登録時の登録内容確認	昇順/降順・表示件数を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で昇順/降順・表示件数の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-039	IT-26	登録内容	P1	登録時の登録内容確認	依頼者の結合を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で依頼者の結合の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	プレイヤー（dtb_player）への結合（dtb_product_request.player_id）であること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-040	IT-26	登録内容	P1	登録時の登録内容確認	会員名（表示・絞り込み）を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で会員名（表示・絞り込み）の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-041	IT-26	登録内容	P1	登録時の登録内容確認	入荷通知依頼を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-042	IT-26	登録内容	P1	登録時の登録内容確認	依頼日を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-043	IT-26	登録内容	P1	登録時の登録内容確認	検索条件セッションを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-044	IT-26	登録内容	P1	登録時の登録内容確認	サイドメニュー「入荷通知依頼」を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-045	IT-26	登録内容	P1	登録時の登録内容確認	検索ボタン押下を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索ボタン押下の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-046	IT-26	実行結果	P1	登録時の実行結果確認	表示要素を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で表示要素の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-047	IT-23	実行結果	P1	登録時の実行結果確認	入力項目を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で入力項目の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	商品名（日/英）・会員名のテキスト欄、依頼日From・To、販売金額From・To、購入日From・To、購入状況のチェックボックス、並べ替えのセレクト、昇順/降順のラジオ、表示件数のセレクト、売上分析タグであること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-048	IT-26	更新内容	P1	更新時の更新内容確認	行操作メニューを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で行操作メニューの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-049	IT-26	更新内容	P1	更新時の更新内容確認	対象データを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で対象データの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-050	IT-26	更新内容	P1	更新時の更新内容確認	結合を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で結合の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-051	IT-26	更新内容	P1	更新時の更新内容確認	除外条件を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で除外条件の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	論理削除フィルタを無効化して抽出すること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-052	IT-26	更新内容	P1	更新時の更新内容確認	依頼単位を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で依頼単位の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-053	IT-26	更新内容	P1	更新時の更新内容確認	購入の判定を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-054	IT-26	更新内容	P1	更新時の更新内容確認	通知日/通知設定削除日を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-055	IT-26	更新内容	P1	更新時の更新内容確認	会員名を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-056	IT-26	更新内容	P1	更新時の更新内容確認	表示件数を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で更新内容の対象項目に最小長-1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-057	IT-26	更新内容	P1	更新時の更新内容確認	商品名（日/英）・会員名を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で商品名（日/英）・会員名の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-058	IT-05	実行結果	P1	更新時の実行結果確認	依頼日Fromを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で依頼日Fromの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードの値が変更されること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-059	IT-05	実行結果	P1	更新時の実行結果確認	依頼日Toを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で依頼日Toの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	フォームキー create_date_toであること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-060	IT-05	削除条件	P1	削除時の削除条件確認	表示件数を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	フォームキー limitであること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-061	IT-05	削除条件	P1	削除時の削除条件確認	検索結果が0件を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	該当データが無い旨の見出しを表示すること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-062	IT-05	削除条件	P1	削除時の削除条件確認	通知設定が削除済みの依頼を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	論理削除フィルタを無効化するため抽出対象に含めるであること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-063	IT-05	削除条件	P1	削除時の削除条件確認	通知設定削除日が未設定を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	通知日/通知設定削除日列は空であること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-064	IT-05	削除条件	P1	削除時の削除条件確認	参照時点を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で参照時点の確認に必要な条件を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	削除条件の対象レコードが削除状態にならないこと。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-065	IT-05	実行結果	P1	削除時の実行結果確認	論理削除フィルタを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で論理削除フィルタの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-066	IT-05	実行結果	P1	削除時の実行結果確認	CSVとの整合性を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でCSVとの整合性の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索実行で検索条件をセッションへ保存すること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-067	IT-05	実行結果	P1	削除時の実行結果確認	更新との整合性を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で更新との整合性の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-068	IT-05	実行結果	P1	削除時の実行結果確認	入力を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で入力の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件（依頼日・販売金額・購入日・購入状況・並べ替え・表示件数・売上分析タグ・商品名/会員名）であること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-069	IT-02	初期行数	P2	初期行数の結合確認	成功時出力を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	入荷通知依頼の一覧を含む画面であること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-070	IT-02	表示順	P2	表示順の結合確認	失敗時出力を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	データ取得失敗時はアプリケーションの共通例外処理に委ねるであること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-071	IT-25	更新抑止	P1	更新抑止の結合確認	副作用を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で副作用の確認に必要な条件を指定する	"1. 更新抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	検索条件セッションへの保存、論理削除フィルタの無効化であること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-072	IT-12	内部情報	P1	内部情報の結合確認	dtb_product_requestを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でdtb_product_requestの確認に必要な条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	依頼日の絞り込み・表示であること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-073	IT-15	機密情報	P1	機密情報の結合確認	dtb_product_requestを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でdtb_product_requestの確認に必要な条件を指定する	"1. 機密情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	通知日/通知設定削除日の表示・購入判定であること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-074	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	dtb_product_classを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でdtb_product_classの確認に必要な条件を指定する	"1. 対象画面を表示する
2. dtb_product_classを確認する
3. 画面表示と後続状態を確認する"	商品コード・販売金額・在庫数の表示・絞り込みであること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-075	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	dtb_product_classを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でdtb_product_classの確認に必要な条件を指定する	"1. 対象画面を表示する
2. dtb_product_classを確認する
3. 画面表示と後続状態を確認する"	言語・状態の表示であること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-076	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	dtb_orderを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でdtb_orderの確認に必要な条件を指定する	"1. 対象画面を表示する
2. dtb_orderを確認する
3. 画面表示と後続状態を確認する"	購入日の判定・表示・絞り込みであること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-077	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	dtb_player（現行 dtb_customer）を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でdtb_player（現行 dtb_customer）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. dtb_player（現行 dtb_customer）を確認する
3. 画面表示と後続状態を確認する"	会員名（プレイヤー名）の表示・絞り込みであること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-078	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	昇順/降順・表示件数を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で昇順/降順・表示件数の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 昇順/降順・表示件数を確認する
3. 画面表示と後続状態を確認する"	必須の選択であること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-079	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	依頼者の結合を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で依頼者の結合の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 依頼者の結合を確認する
3. 画面表示と後続状態を確認する"	プレイヤー（dtb_player）への結合（dtb_product_request.player_id）であること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-080	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	会員名（表示・絞り込み）を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で会員名（表示・絞り込み）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 会員名（表示・絞り込み）を確認する
3. 画面表示と後続状態を確認する"	dtb_player.last_name_jp・first_name_jp（英名は last_name_en・first_name_en）であること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-081	IT-25	一覧	P2	一覧の結合確認	入荷通知依頼を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で入荷通知依頼の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入荷通知依頼を確認する
3. 画面表示と後続状態を確認する"	会員が商品規格に対して登録した再入荷お知らせの依頼であること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-082	IT-12	画面表示データ	P2	画面表示データの結合確認	依頼日を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で依頼日の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 依頼日を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-083	IT-25	画面表示データ	P2	画面表示データの結合確認	検索条件セッションを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で検索条件セッションの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索条件セッション
3. 画面表示と後続状態を確認する"	検索実行時に検索条件を保存するセッション領域であること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-084	IT-12	画面表示データ	P2	画面表示データの結合確認	サイドメニュー「入荷通知依頼」を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）でサイドメニュー「入荷通知依頼」の確認に必要な条件を指定する	"1. 対象画面を表示する
2. サイドメニュー「入荷通知依頼」を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-085	IT-12	非同期更新	P1	非同期更新の結合確認	行操作メニューを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で行操作メニューの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 行操作メニューを確認する
3. 画面表示と後続状態を確認する"	各行の操作メニューから規格編集へ遷移できること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-086	IT-12	エラー継続	P3	エラー継続の結合確認	対象データを試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で対象データの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 対象データを確認する
3. 画面表示と後続状態を確認する"	入荷通知依頼を起点に、会員・商品規格・商品・規格サブ（言語・状態）を結合すること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-087	IT-25	欠損値	P2	欠損値の結合確認	除外条件を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で除外条件の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 除外条件を確認する
3. 画面表示と後続状態を確認する"	論理削除フィルタを無効化して抽出すること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-088	IT-25	データなし	P2	データなしの結合確認	依頼単位を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で依頼単位の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 依頼単位を確認する
3. 画面表示と後続状態を確認する"	一覧は依頼IDでグループ化し、依頼1件を1行として表示すること。
M12-05（入荷通知依頼 一覧表示）	IT-M12-05-ADMIN-ANALYTICS-SALES-ARRIVAL-NOTIFICATION-SEARCH-LIST-089	IT-02	公開コンテンツ	P1	公開コンテンツの結合確認	購入の判定を試験できる状態である	M12-05（入荷通知依頼 一覧表示）（m12_05_admin_analytics_sales_arrival_notification_search_list）で購入の判定の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 購入の判定を確認する
3. 画面表示と後続状態を確認する"	依頼後（通知設定削除日より後の注文日）の同会員・同規格の注文を購入とみなすであること。
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
| ファイル処理 / ※ファイルアップロードを含む / 実行結果（IT-16） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルアップロードを含む / バリデーション（IT-17） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ファイル出力 / 実行結果（IT-27） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルダウンロードを含む / 実行結果（IT-27） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ※ファイルダウンロードを含む / データ出力（IT-24） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / ファイル操作 / 実行結果（IT-27） | 本機能は対象の外部I/Fを扱わないため |
| ファイル処理 / 数量・金額影響機能 / 対象機能（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / 数量 / 更新結果（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / 増加・調整 / ファイル登録（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / 参照・非更新 / ファイル出力（IT-33） | 本機能はファイル入出力を扱わないため |
| ファイル処理 / バッチ / ファイル出力（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ / 再実行（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ / 異常終了（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ-フロント / ファイル連携（IT-27） | 本機能はバッチ処理を起動しないため |
| ファイル処理 / バッチ-フロント / JSON連携（IT-27） | 本機能はバッチ処理を起動しないため |
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
| その他 | 同種の対象外観点 3 件は上記分類と同じ理由で対象外 |

> 別枠（非該当ではない）: 本機能に該当するが上限（max_cases）または実行キー重複で今回未収載の結合観点 9件 — No.54, No.56, No.109, No.110, No.111, No.359, No.381, No.382, No.412。上限緩和または個別ケース化で収載可能。
