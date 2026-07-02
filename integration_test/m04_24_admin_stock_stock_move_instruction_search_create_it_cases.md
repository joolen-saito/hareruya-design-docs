# M04-24（在庫移動指示リスト作成/検索） 結合試験テストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m04-24_admin_stock_stock_move_instruction_search_create.html`

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
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-001	IT-15	CSRF	P1	CSRFの結合確認	実装確認を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で実装確認の確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	../ec-cube-enterprise（StockMoveInstructionController / SearchStockMoveInstructionType / StockMoveInstructionD…であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-002	IT-15	未認証	P1	未認証の結合確認	2026-06-12を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で2026-06-12の確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ec-cube-enterprise 実装（Controller/Service/Form/Entity）と既存テストを読み込み、実装確認値で具体化であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-003	IT-15	対象データ	P1	対象データの結合確認	一覧／検索を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で一覧／検索の確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	GETは初期表示（検索条件をセッション初期化）、?resume=1 付きGETはセッション復元して再検索、POSTは検索実行し検索条件をセッション保存であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-004	IT-20	出力抑止	P1	出力抑止の結合確認	指示詳細／更新を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で指示詳細／更新の確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	GETは詳細表示であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-005	IT-20	識別子	P1	識別子の結合確認	送り状No.登録（モーダル）を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で送り状No.登録（モーダル）の確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	一覧モーダルから tracking_no を登録であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-006	IT-15	状態変化	P1	状態変化の結合確認	指示削除を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で指示削除の確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	送り状No.未登録時のみ削除可であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-007	IT-25	UI部品	P3	UI部品の操作結果確認	在庫移動実績CSV登録を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で在庫移動実績CSV登録の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 在庫移動実績CSV登録を確認する
3. 画面表示と後続状態を確認する"	アップロードCSVで送り状No.を一括登録し、一覧（resume=1）へリダイレクトであること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-008	IT-25	UI部品	P3	UI部品の操作結果確認	CSV雛形ダウンロードを試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）でCSV雛形ダウンロードの確認に必要な条件を指定する	"1. 対象画面を表示する
2. CSV雛形ダウンロード
3. 画面表示と後続状態を確認する"	在庫移動実績入力用CSV雛形を出力（出力仕様はM04-25）であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-009	IT-25	操作起点	P1	操作起点の操作結果確認	送り状CSV出力を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で送り状CSV出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 送り状CSV出力を確認する
3. 画面表示と後続状態を確認する"	チェックした指示IDの送り状CSVを出力（出力列・整形はM04-25）であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-010	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	表示順を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で表示順の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示順を確認する
3. 画面表示と後続状態を確認する"	登録日（create_date）降順（getQueryBuilderBySearchData の orderBy('s.createDate', 'DESC')）であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-011	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	件数を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で件数の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 件数を確認する
3. 画面表示と後続状態を確認する"	ページングなしであること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-012	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	一覧項目を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で一覧項目の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧項目を確認する
3. 画面表示と後続状態を確認する"	チェックボックス（ids[]、送り状CSV出力の選択用）／移動指示ID（詳細へのリンク）／出庫元店舗（MoveFromBaseInfo.shopName）／入庫先店舗（MoveToBaseInfo.shopName）／…であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-013	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	初回表示を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で初回表示の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 初回表示を確認する
3. 画面表示と後続状態を確認する"	GET（resume 無し）では検索条件セッションを初期化し、検索フォームのビューデータのみ表示（一覧は空）であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-014	IT-03	外部画面	P2	外部画面の操作結果確認	登録日 create_date_start / create_date_endを試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で登録日 create_date_start / create_date_endの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 登録日 create_date_start / create_date_endを確認する
3. 画面表示と後続状態を確認する"	日付であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-015	IT-03	画面遷移	P2	画面遷移の操作結果確認	更新日 update_date_start / update_date_endを試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で更新日 update_date_start / update_date_endの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 更新日 update_date_start / update_date_endを確認する
3. 画面表示と後続状態を確認する"	日付であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-016	IT-03	画面遷移	P2	画面遷移の操作結果確認	主データ（更新）を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で主データ（更新）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 主データ（更新）を確認する
3. 画面表示と後続状態を確認する"	詳細更新・送り状No.登録・CSV登録で dtb_stock_move_instruction の tracking_no・memo・update_date・update_member_id を更新であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-017	IT-03	画面遷移	P2	画面遷移の操作結果確認	連動更新を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で連動更新の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 連動更新を確認する
3. 画面表示と後続状態を確認する"	送り状No.の登録/更新時、紐づく在庫移動 dtb_stock_move_transfer.tracking_no を同値に同期であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	店舗・登録者・更新者を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で店舗・登録者・更新者の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 店舗・登録者・更新者を確認する
3. 画面表示と後続状態を確認する"	出庫元/入庫先店舗は move_from_base_info_id / move_to_base_info_id（BaseInfo）、登録者は registered_member_id、更新者は update_memb…であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	在庫移動との関連を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で在庫移動との関連の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 在庫移動との関連を確認する
3. 画面表示と後続状態を確認する"	1移動指示は複数の在庫移動（dtb_stock_move_transfer、move_instruction_id で関連）をまとめるであること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	高額/通常合計の算出列を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で高額/通常合計の算出列の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 高額/通常合計の算出列を確認する
3. 画面表示と後続状態を確認する"	Excel設計が描く「出庫元店舗の高額商品閾値による●●円以上/未満の合計」は、high_total_price / regular_total_price と move_from_price_threshold に対…であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-021	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	実装確認を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で実装確認の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 実装確認を確認する
3. 画面表示と後続状態を確認する"	../ec-cube-enterprise（StockMoveInstructionController / SearchStockMoveInstructionType / StockMoveInstructionD…であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-022	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	2026-06-12を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で2026-06-12の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 2026-06-12を確認する
3. 画面表示と後続状態を確認する"	ec-cube-enterprise 実装（Controller/Service/Form/Entity）と既存テストを読み込み、実装確認値で具体化であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-023	IT-25	URL	P2	URLの操作結果確認	一覧／検索を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で一覧／検索の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧／検索
3. 画面表示と後続状態を確認する"	GETは初期表示（検索条件をセッション初期化）、?resume=1 付きGETはセッション復元して再検索、POSTは検索実行し検索条件をセッション保存であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-024	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	指示詳細／更新を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 指示詳細／更新を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-025	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	送り状No.登録（モーダル）を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 送り状No.登録（モーダル）を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-026	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	指示削除を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 指示削除
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-027	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	在庫移動実績CSV登録を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. 在庫移動実績CSV登録を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-028	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	CSV雛形ダウンロードを試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. CSV雛形ダウンロード
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	送り状CSV出力を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. 送り状CSV出力を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	表示順を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で表示順の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示順を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-031	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	一覧項目を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で一覧項目の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧項目を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-032	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	初回表示を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で初回表示の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 初回表示を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-033	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	登録日 create_date_start / create_date_endを試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で登録日 create_date_start / create_date_endの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 登録日 create_date_start / create_date_endを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-034	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	更新日 update_date_start / update_date_endを試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 更新日 update_date_start / update_date_endを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	主データ（更新）を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 主データ（更新）を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	連動更新を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 連動更新を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	店舗・登録者・更新者を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 店舗・登録者・更新者を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	在庫移動との関連を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で在庫移動との関連の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 在庫移動との関連を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-039	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	高額/通常合計の算出列を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で高額/通常合計の算出列の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 高額/通常合計の算出列を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-040	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	実装確認を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で実装確認の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 実装確認を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-041	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	2026-06-12を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 2026-06-12を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-042	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	一覧／検索を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 一覧／検索
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-043	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	指示詳細／更新を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 指示詳細／更新を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-044	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	送り状No.登録（モーダル）を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 送り状No.登録（モーダル）を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	指示削除を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で指示削除の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 指示削除
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	在庫移動実績CSV登録を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で在庫移動実績CSV登録の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 在庫移動実績CSV登録を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	CSV雛形ダウンロードを試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. CSV雛形ダウンロード
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	送り状CSV出力を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 送り状CSV出力を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-049	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	件数を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 件数を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-050	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	一覧項目を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 一覧項目を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-051	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	初回表示を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 初回表示を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-052	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	登録日 create_date_start / create_date_endを試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 登録日 create_date_start / create_date_endを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-053	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	更新日 update_date_start / update_date_endを試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 更新日 update_date_start / update_date_endを確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-054	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	主データ（更新）を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 主データ（更新）を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-055	IT-22	必須制御	P1	必須制御の入力検証	連動更新を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. 連動更新を確認する
3. 画面表示と後続状態を確認する"	送り状No.の登録/更新時、紐づく在庫移動 dtb_stock_move_transfer.tracking_no を同値に同期であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-056	IT-23	検索条件	P2	検索時の検索条件確認	在庫移動との関連を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-057	IT-23	検索条件	P2	検索時の検索条件確認	高額/通常合計の算出列を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-058	IT-23	検索条件	P2	検索時の検索条件確認	実装確認を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で実装確認の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	../ec-cube-enterprise（StockMoveInstructionController / SearchStockMoveInstructionType / StockMoveInstructionD…であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-059	IT-23	検索条件	P2	検索時の検索条件確認	2026-06-12を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-060	IT-23	検索条件	P2	検索時の検索条件確認	一覧／検索を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-061	IT-23	検索条件	P2	検索時の検索条件確認	指示詳細／更新を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-062	IT-23	検索条件	P2	検索時の検索条件確認	送り状No.登録（モーダル）を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-063	IT-23	検索条件	P2	検索時の検索条件確認	指示削除を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-064	IT-23	検索条件	P2	検索時の検索条件確認	在庫移動実績CSV登録を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-065	IT-23	検索条件	P2	検索時の検索条件確認	CSV雛形ダウンロードを試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）でCSV雛形ダウンロードの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-066	IT-23	検索条件	P2	検索時の検索条件確認	送り状CSV出力を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で送り状CSV出力の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-067	IT-23	検索条件	P2	検索時の検索条件確認	表示順を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で表示順の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-068	IT-23	検索条件	P2	検索時の検索条件確認	件数を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で件数の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-069	IT-23	検索条件	P2	検索時の検索条件確認	一覧項目を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で一覧項目の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	チェックボックス（ids[]、送り状CSV出力の選択用）／移動指示ID（詳細へのリンク）／出庫元店舗（MoveFromBaseInfo.shopName）／入庫先店舗（MoveToBaseInfo.shopName）／…であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-070	IT-23	検索条件	P2	検索時の検索条件確認	初回表示を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で初回表示の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-071	IT-23	検索条件	P2	検索時の検索条件確認	登録日 create_date_start / create_date_endを試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で登録日 create_date_start / create_date_endの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-072	IT-23	実行結果	P2	検索時の実行結果確認	更新日 update_date_start / update_date_endを試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で更新日 update_date_start / update_date_endの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-073	IT-23	実行結果	P2	検索時の実行結果確認	主データ（更新）を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で主データ（更新）の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	詳細更新・送り状No.登録・CSV登録で dtb_stock_move_instruction の tracking_no・memo・update_date・update_member_id を更新であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-074	IT-23	実行結果	P2	検索時の実行結果確認	連動更新を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で連動更新の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-075	IT-23	実行結果	P2	検索時の実行結果確認	店舗・登録者・更新者を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で店舗・登録者・更新者の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-076	IT-23	実行結果	P2	検索時の実行結果確認	在庫移動との関連を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で在庫移動との関連の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-077	IT-26	登録内容	P1	登録時の登録内容確認	高額/通常合計の算出列を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で高額/通常合計の算出列の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-078	IT-26	登録内容	P1	登録時の登録内容確認	実装確認を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で実装確認の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-079	IT-26	登録内容	P1	登録時の登録内容確認	2026-06-12を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で2026-06-12の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-080	IT-26	登録内容	P1	登録時の登録内容確認	一覧／検索を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で一覧／検索の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	GETは初期表示（検索条件をセッション初期化）、?resume=1 付きGETはセッション復元して再検索、POSTは検索実行し検索条件をセッション保存であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-081	IT-26	登録内容	P1	登録時の登録内容確認	指示詳細／更新を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で指示詳細／更新の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	GETは詳細表示であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-082	IT-23	登録内容	P1	登録時の登録内容確認	送り状No.登録（モーダル）を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で送り状No.登録（モーダル）の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	一覧モーダルから tracking_no を登録であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-083	IT-26	登録内容	P1	登録時の登録内容確認	指示削除を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で指示削除の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	送り状No.未登録時のみ削除可であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-084	IT-26	登録内容	P1	登録時の登録内容確認	在庫移動実績CSV登録を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で在庫移動実績CSV登録の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	アップロードCSVで送り状No.を一括登録し、一覧（resume=1）へリダイレクトであること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-085	IT-26	登録内容	P1	登録時の登録内容確認	CSV雛形ダウンロードを試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）でCSV雛形ダウンロードの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	在庫移動実績入力用CSV雛形を出力（出力仕様はM04-25）であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-086	IT-26	登録内容	P1	登録時の登録内容確認	送り状CSV出力を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で送り状CSV出力の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	チェックした指示IDの送り状CSVを出力（出力列・整形はM04-25）であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-087	IT-26	登録内容	P1	登録時の登録内容確認	表示順を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で表示順の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録日（create_date）降順（getQueryBuilderBySearchData の orderBy('s.createDate', 'DESC')）であること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-088	IT-26	登録内容	P1	登録時の登録内容確認	件数を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で件数の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-089	IT-26	登録内容	P1	登録時の登録内容確認	一覧項目を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
M04-24（在庫移動指示リスト作成/検索）	IT-M04-24-ADMIN-STOCK-STOCK-MOVE-INSTRUCTION-SEARCH-CREATE-090	IT-26	登録内容	P1	登録時の登録内容確認	初回表示を試験できる状態である	M04-24（在庫移動指示リスト作成/検索）（m04_24_admin_stock_stock_move_instruction_search_create）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
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
