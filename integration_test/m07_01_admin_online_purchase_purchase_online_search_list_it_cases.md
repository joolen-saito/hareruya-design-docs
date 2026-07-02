# m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m07-01_admin_online_purchase_purchase_online_search_list.html`

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
| IT-23 | 実行結果、更新内容、検索条件 |
| IT-26 | 更新内容 |

## テストケースTSV

以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し（先頭列は `機能名`、**テストレベル列なし**）。**2行目以降**がケース（各10列）。`機能名` 列に元設計の表示名を入れる。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-001	IT-15	CSRF	P1	CSRFの結合確認	ナビから「ネット買取管理」→「買取一覧」を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でナビから「ネット買取管理」→「買取一覧」の確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	検索条件は空もしくは既定の日付のみであること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-002	IT-15	未認証	P1	未認証の結合確認	一覧のページ送りを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で一覧のページ送りの確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	直前の検索条件をセッションから復元し、指定ページを表示すること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-003	IT-15	対象データ	P1	対象データの結合確認	表示件数プルダウンを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で表示件数プルダウンの確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	マスタ mtb_page_max に存在する件数ならセッションへ保存し、1 ページ目から再表示すること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-004	IT-20	出力抑止	P1	出力抑止の結合確認	表示要素を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で表示要素の確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	検索結果ブロックとダウンロード用フォーム・ページ情報は pagination.totalItemCount > 0 のときのみ描画すること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-005	IT-20	識別子	P1	識別子の結合確認	JS 挙動を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でJS 挙動の確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	purchase.jsであること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-006	IT-15	状態変化	P1	状態変化の結合確認	クライアント共通を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でクライアント共通の確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	select2、sort-method-display.js で二段ドロップダウンであること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-007	IT-25	UI部品	P3	UI部品の操作結果確認	一覧の CSRFを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で一覧の CSRFの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧の CSRFを確認する
3. 画面表示と後続状態を確認する"	検索フォームは項目型で CSRF を無効化していること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-008	IT-25	UI部品	P3	UI部品の操作結果確認	一覧の総件数とページ構成を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で一覧の総件数とページ構成の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧の総件数とページ構成を確認する
3. 画面表示と後続状態を確認する"	DtbBuyOrder を基底エイリアス bであること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-009	IT-25	操作起点	P1	操作起点の操作結果確認	キャンセル含有表示を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でキャンセル含有表示の確認に必要な条件を指定する	"1. 対象画面を表示する
2. キャンセル含有表示を確認する
3. 画面表示と後続状態を確認する"	POST 済み一覧の対象 ID について、dtb_buy_main_card.sale_flg が非売却、もしくは個別入力 dtb_buy_order_indivisual_input_product.sale_flg…であること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-010	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	本人確認（複数選択）を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で本人確認（複数選択）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 本人確認（複数選択）
3. 画面表示と後続状態を確認する"	状態を未選択もしくは全解除のままであるとき結合しないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-011	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	利用回数範囲を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で利用回数範囲の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 利用回数範囲を確認する
3. 画面表示と後続状態を確認する"	サブクエリで顧客ごとの dtb_buy_order の件数を算出し、その件数について下限・上限がある場合のみ having と主クエリへの customer id IN (...) で制約すること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-012	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	packageCount の警告を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でpackageCount の警告の確認に必要な条件を指定する	"1. 対象画面を表示する
2. packageCount の警告を確認する
3. 画面表示と後続状態を確認する"	設定値 eccube_buy_order_package_count_warning（既定 3）以上なら画面上で警告色および太字になること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-013	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	買取番号を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で買取番号の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 買取番号を確認する
3. 画面表示と後続状態を確認する"	フォーム識別子 purchase_numberであること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-014	IT-03	外部画面	P2	外部画面の操作結果確認	利用回数（下限／上限）を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で利用回数（下限／上限）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 利用回数（下限／上限）を確認する
3. 画面表示と後続状態を確認する"	orderCountFrom・orderCountToであること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-015	IT-03	画面遷移	P2	画面遷移の操作結果確認	AND／OR検索を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でAND／OR検索の確認に必要な条件を指定する	"1. 対象画面を表示する
2. AND／OR検索
3. 画面表示と後続状態を確認する"	product_name_selectであること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-016	IT-03	画面遷移	P2	画面遷移の操作結果確認	本人確認を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で本人確認の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 本人確認を確認する
3. 画面表示と後続状態を確認する"	identityConfirmStatusであること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-017	IT-03	画面遷移	P2	画面遷移の操作結果確認	棚戻し未完了のみ表示を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で棚戻し未完了のみ表示の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 棚戻し未完了のみ表示を確認する
3. 画面表示と後続状態を確認する"	restock_incomplete_onlyであること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	ソートクエリ不正を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でソートクエリ不正の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ソートクエリ不正を確認する
3. 画面表示と後続状態を確認する"	フラッシュ admin.error.sort を積むであること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	一覧表示中に総件数とページサイズ関係から現在ページが空を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で一覧表示中に総件数とページサイズ関係から現在ページが空の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧表示中に総件数とページサイズ関係から現在ページが空を確認する
3. 画面表示と後続状態を確認する"	自動でページ番号を 1減じて再フェッチすること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	氏名自動検索を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で氏名自動検索の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 氏名自動検索
3. 画面表示と後続状態を確認する"	買取状況の select2 が空送信されるのみで、入力済み日付フィールドなどは送信時点の値が残ったまま再検索に使われる実装となること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-021	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	一覧の買取状況名を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で一覧の買取状況名の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧の買取状況名を確認する
3. 画面表示と後続状態を確認する"	DB 読み込み済みオブジェクトからの表示であり、リスト取得時と描画間に別処理で状態が進むと差が生じうる同一セッション内の再フェッチ問題は通常運用では管理者操作が無い限り小さいであること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-022	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	本人確認表示を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で本人確認表示の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 本人確認表示を確認する
3. 画面表示と後続状態を確認する"	集約問い合わせの後勝ちと顧客・Player 関係の前提に依存すること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-023	IT-25	URL	P2	URLの操作結果確認	成功時出力を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	HTML（@admin/Purchase/index.twig）であること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-024	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	失敗時出力を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-025	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	副作用を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-026	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	dtb_buy_orderを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. dtb_buy_orderを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-027	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	dtb_playerを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. dtb_playerを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-028	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	mtb_buy_order_statusを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. mtb_buy_order_statusを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	mtb_identity_confirm_statusを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. mtb_identity_confirm_statusを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	mtb_page_maxを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でmtb_page_maxの確認に必要な条件を指定する	"1. 対象画面を表示する
2. mtb_page_maxを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-031	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	利用回数を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で利用回数の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 利用回数を確認する
3. 画面表示と後続状態を確認する"	HTML min=1 のヒントのみであること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-032	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	管理メンバー（ログイン済）を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で管理メンバー（ログイン済）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 管理メンバー（ログイン済）を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-033	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	削除・更新後のリスト復帰等（別機能）を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で削除・更新後のリスト復帰等（別機能）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 削除・更新後のリスト復帰等（別機能）
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-034	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	POST またはページ GET が成功したあと別画面から戻るを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でPOST またはページ GET が成功したあと別画面から戻るの確認に必要な条件を指定する	"1. 対象画面を表示する
2. POST またはページ GET が成功したあと別画面から戻るを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	並び順パラメータが ASC/DESC 以外を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 並び順パラメータが ASC/DESC 以外を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	バリデーションエラーを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. バリデーションエラーを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	保持するものを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 保持するものを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	更新タイミングを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 更新タイミングを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-039	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	ナビから「ネット買取管理」→「買取一覧」を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でナビから「ネット買取管理」→「買取一覧」の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ナビから「ネット買取管理」→「買取一覧」を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-040	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	一覧のページ送りを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で一覧のページ送りの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧のページ送りを確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-041	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	表示件数プルダウンを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で表示件数プルダウンの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示件数プルダウンを確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-042	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	表示要素を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-043	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	JS 挙動を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-044	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	クライアント共通を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. クライアント共通を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	一覧の CSRFを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 一覧の CSRFを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	一覧の総件数とページ構成を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で一覧の総件数とページ構成の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧の総件数とページ構成を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	キャンセル含有表示を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でキャンセル含有表示の確認に必要な条件を指定する	"1. 対象画面を表示する
2. キャンセル含有表示を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	本人確認（複数選択）を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 本人確認（複数選択）
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-049	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	利用回数範囲を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 利用回数範囲を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-050	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	買取番号を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 買取番号を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-051	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	利用回数（下限／上限）を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 利用回数（下限／上限）を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-052	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	AND／OR検索を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. AND／OR検索
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-053	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	本人確認を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 本人確認を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-054	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	棚戻し未完了のみ表示を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 棚戻し未完了のみ表示を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-055	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	ソートクエリ不正を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. ソートクエリ不正を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-056	IT-22	必須制御	P1	必須制御の入力検証	一覧表示中に総件数とページサイズ関係から現在ページが空を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. 一覧表示中に総件数とページサイズ関係から現在ページが空を確認する
3. 画面表示と後続状態を確認する"	自動でページ番号を 1減じて再フェッチすること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-057	IT-23	検索条件	P2	検索時の検索条件確認	一覧の買取状況名を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-058	IT-23	検索条件	P2	検索時の検索条件確認	本人確認表示を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-059	IT-23	検索条件	P2	検索時の検索条件確認	成功時出力を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で成功時出力の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	HTML（@admin/Purchase/index.twig）であること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-060	IT-23	検索条件	P2	検索時の検索条件確認	失敗時出力を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-061	IT-23	検索条件	P2	検索時の検索条件確認	副作用を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-062	IT-23	検索条件	P2	検索時の検索条件確認	dtb_buy_orderを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-063	IT-23	検索条件	P2	検索時の検索条件確認	dtb_playerを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-064	IT-23	検索条件	P2	検索時の検索条件確認	mtb_buy_order_statusを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-065	IT-23	検索条件	P2	検索時の検索条件確認	mtb_identity_confirm_statusを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-066	IT-23	検索条件	P2	検索時の検索条件確認	mtb_page_maxを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でmtb_page_maxの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-067	IT-23	検索条件	P2	検索時の検索条件確認	利用回数を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で利用回数の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-068	IT-23	検索条件	P2	検索時の検索条件確認	管理メンバー（ログイン済）を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で管理メンバー（ログイン済）の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-069	IT-23	検索条件	P2	検索時の検索条件確認	削除・更新後のリスト復帰等（別機能）を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で削除・更新後のリスト復帰等（別機能）の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-070	IT-23	検索条件	P2	検索時の検索条件確認	POST またはページ GET が成功したあと別画面から戻るを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でPOST またはページ GET が成功したあと別画面から戻るの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	admin_purchase_page の GET で同一条件の続きを表示しうるであること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-071	IT-23	検索条件	P2	検索時の検索条件確認	並び順パラメータが ASC/DESC 以外を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で並び順パラメータが ASC/DESC 以外の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-072	IT-23	検索条件	P2	検索時の検索条件確認	バリデーションエラーを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でバリデーションエラーの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-073	IT-23	実行結果	P2	検索時の実行結果確認	保持するものを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で保持するものの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-074	IT-23	実行結果	P2	検索時の実行結果確認	更新タイミングを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で更新タイミングの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	admin_purchase_search と admin_purchase_page の処理が通過するたびであること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-075	IT-23	実行結果	P2	検索時の実行結果確認	ナビから「ネット買取管理」→「買取一覧」を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でナビから「ネット買取管理」→「買取一覧」の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-076	IT-23	実行結果	P2	検索時の実行結果確認	一覧のページ送りを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で一覧のページ送りの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-077	IT-23	実行結果	P2	検索時の実行結果確認	表示件数プルダウンを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で表示件数プルダウンの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-078	IT-26	更新内容	P1	更新時の更新内容確認	表示要素を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で表示要素の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-079	IT-26	更新内容	P1	更新時の更新内容確認	JS 挙動を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でJS 挙動の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-080	IT-26	更新内容	P1	更新時の更新内容確認	クライアント共通を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でクライアント共通の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-081	IT-26	更新内容	P1	更新時の更新内容確認	一覧の CSRFを試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で一覧の CSRFの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索フォームは項目型で CSRF を無効化していること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-082	IT-26	更新内容	P1	更新時の更新内容確認	一覧の総件数とページ構成を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で一覧の総件数とページ構成の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	DtbBuyOrder を基底エイリアス bであること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-083	IT-23	更新内容	P1	更新時の更新内容確認	キャンセル含有表示を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でキャンセル含有表示の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	POST 済み一覧の対象 ID について、dtb_buy_main_card.sale_flg が非売却、もしくは個別入力 dtb_buy_order_indivisual_input_product.sale_flg…であること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-084	IT-26	更新内容	P1	更新時の更新内容確認	本人確認（複数選択）を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で本人確認（複数選択）の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	状態を未選択もしくは全解除のままであるとき結合しないこと。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-085	IT-26	更新内容	P1	更新時の更新内容確認	利用回数範囲を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で利用回数範囲の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	サブクエリで顧客ごとの dtb_buy_order の件数を算出し、その件数について下限・上限がある場合のみ having と主クエリへの customer id IN (...) で制約すること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-086	IT-26	更新内容	P1	更新時の更新内容確認	packageCount の警告を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でpackageCount の警告の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	設定値 eccube_buy_order_package_count_warning（既定 3）以上なら画面上で警告色および太字になること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-087	IT-26	更新内容	P1	更新時の更新内容確認	買取番号を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で買取番号の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	フォーム識別子 purchase_numberであること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-088	IT-26	更新内容	P1	更新時の更新内容確認	利用回数（下限／上限）を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で利用回数（下限／上限）の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	orderCountFrom・orderCountToであること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-089	IT-26	更新内容	P1	更新時の更新内容確認	AND／OR検索を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）でAND／OR検索の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）	IT-M07-01-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-SEARCH-LIST-090	IT-26	更新内容	P1	更新時の更新内容確認	本人確認を試験できる状態である	m07-01_admin_online_purchase_purchase_online_search_list（ネット買取管理_買取検索一覧）（m07_01_admin_online_purchase_purchase_online_search_list）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
```

## 対象外観点

| 分類・範囲 | 理由 |
|-----------|------|
| バリデーション / バリデーション / 単項目バリデーション（IT-22） | 元設計HTMLに該当する処理・I/Fがないため |
| バリデーション / 管理画面 / バリデーション（IT-22） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 登録（IT-23, IT-26） | 本機能に登録処理がないため |
| データベースアクセス / DB操作 / 更新（IT-05, IT-26） | 元設計HTMLに該当する処理・I/Fがないため |
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
