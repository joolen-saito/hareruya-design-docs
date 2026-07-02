# m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m05-01_admin_order_order_search_list.html`

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
| IT-22 | DBとの相関バリデーション、その他のバリデーション、必須バリデーション、必須制御、数値バリデーション、文字列長バリデーション、文字種バリデーション、相関バリデーション、部分入力 |
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
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-001	IT-15	CSRF	P1	CSRFの結合確認	管理画面ナビから受注一覧を開くを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で管理画面ナビから受注一覧を開くの確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	クエリに page_no も resume も無い通常GETの場合、検索条件は空に近い初期値、ページ1、表示件数はセッションもしくは eccube_default_page_count に従うであること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-002	IT-15	未認証	P1	未認証の結合確認	「検索」ボタンで送信を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で「検索」ボタンで送信の確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	検証成功時のみ検索ビューデータとページ番号1がセッションへ書き込まれ、同一条件で一覧が組み立てられるであること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-003	IT-15	対象データ	P1	対象データの結合確認	ページリンクで移動を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）でページリンクで移動の確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	セッションに保存済みの検索ビューデータから復元し、指定ページを表示すること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-004	IT-20	出力抑止	P1	出力抑止の結合確認	他画面から一覧へ戻る（検索状態維持）を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で他画面から一覧へ戻る（検索状態維持）の確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	セッションの検索ビューデータとページ番号を復元して一覧を表示すること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-005	IT-20	識別子	P1	識別子の結合確認	表示件数プルダウン変更を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で表示件数プルダウン変更の確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	page_count がページマスタ mtb_page_max のいずれかの名前と一致するときだけセッションの表示件数が更新され、1ページ目が表示されるであること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-006	IT-15	状態変化	P1	状態変化の結合確認	一覧ヘッダの並びアイコンをクリックを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で一覧ヘッダの並びアイコンをクリックの確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	隠し項目 sortkey と sorttype が更新された状態で検索フォーム全体が送信され、検証成功時はページ1相当のセッション更新と並び替え付き一覧となること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-007	IT-25	UI部品	P3	UI部品の操作結果確認	保存済み検索パターン名をクリックを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で保存済み検索パターン名をクリックの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 保存済み検索パターン名をクリック
3. 画面表示と後続状態を確認する"	DBから復号したビューデータでフォームが組み立てられ、セッション検索状態がその内容で上書きされるであること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-008	IT-25	UI部品	P3	UI部品の操作結果確認	検索パターン保存ボタンを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索パターン保存ボタンの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索パターン保存ボタン
3. 画面表示と後続状態を確認する"	パターン名が空ならエラーフラッシュ付きで admin_order に戻ること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-009	IT-25	操作起点	P1	操作起点の操作結果確認	検索パターン削除ボタンを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索パターン削除ボタンの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索パターン削除ボタン
3. 画面表示と後続状態を確認する"	パターン削除後、admin_order へリダイレクトすること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-010	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	一覧から受注日または注文番号のリンクを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で一覧から受注日または注文番号のリンクの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧から受注日または注文番号のリンクを確認する
3. 画面表示と後続状態を確認する"	受注編集画面へ遷移する（詳細仕様は別書）であること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-011	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	パターンに保存された条件での件数をJSONで返す（一覧ヘッダからXHRで利用）を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）でパターンに保存された条件での件数をJSONで返す（一覧ヘッダからXHRで利用）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. パターンに保存された条件での件数をJSONで返す（一覧ヘッダからXHRで利用）
3. 画面表示と後続状態を確認する"	パターンに保存された条件での件数をJSONで返す（一覧ヘッダからXHRで利用）であること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-012	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	表示要素を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	ページタイトル・サブタイトルは受注一覧／受注管理であること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-013	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	JS挙動を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）でJS挙動の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS挙動を確認する
3. 画面表示と後続状態を確認する"	共通 function.js の .search-clear で、#search_form 内の .input_search および .search-box-inner 配下の入力をクリアすること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-014	IT-03	外部画面	P2	外部画面の操作結果確認	モーダル・ポップアップを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	一括ステータス・メール確認モーダル、PDFや印刷の別ウィンドウを開く処理があること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-015	IT-03	画面遷移	P2	画面遷移の操作結果確認	ステータス別件数（ラベル横リンク）を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）でステータス別件数（ラベル横リンク）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ステータス別件数（ラベル横リンク）を確認する
3. 画面表示と後続状態を確認する"	OrderRepository::countByOrderStatus が単純カウントすること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-016	IT-03	画面遷移	P2	画面遷移の操作結果確認	店舗（複数選択）を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で店舗（複数選択）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 店舗（複数選択）
3. 画面表示と後続状態を確認する"	tenantsであること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-017	IT-03	画面遷移	P2	画面遷移の操作結果確認	検索パターン名を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索パターン名の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索パターン名
3. 画面表示と後続状態を確認する"	保存処理時は必須扱いであること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	検索パターンID（隠し）を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索パターンID（隠し）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索パターンID（隠し）
3. 画面表示と後続状態を確認する"	保存時に既存行の特定に使うこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	購入メッセージの有無（チェック複数可）を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で購入メッセージの有無（チェック複数可）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 購入メッセージの有無（チェック複数可）を確認する
3. 画面表示と後続状態を確認する"	値 1 のみ選択時は o.message IS NOT NULL、0 のみは IS NULLであること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	ピック日時・入金日時・出荷指示日時・出荷日時・キャンセル日時・売上確定日時・店…を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）でピック日時・入金日時・出荷指示日時・出荷日時・キャンセル日時・売上確定日時・店…の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ピック日時・入金日時・出荷指示日時・出荷日時・キャンセル日時・売上確定日時・店…を確認する
3. 画面表示と後続状態を確認する"	それぞれ o.confirmDate、o.payment_date、o.commitDate、o.shippingDate、o.cancel_date、o.receiptDate、o.otc_rsv_date、o.up…であること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-021	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	配送先カナを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で配送先カナの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 配送先カナを確認する
3. 画面表示と後続状態を確認する"	DQL文字列に括弧欠落があり、実行時エラーや無効条件になりうる実装になっている（要コード修正の可能性）であること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-022	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	並びキー・昇降（隠し）を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で並びキー・昇降（隠し）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 並びキー・昇降（隠し）を確認する
3. 画面表示と後続状態を確認する"	sortkey・sorttype（a 以外は降順扱い）であること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-023	IT-25	URL	P2	URLの操作結果確認	検索成功POSTを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索成功POSTの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索成功POST
3. 画面表示と後続状態を確認する"	同一一覧URLでテンプレート再描画（ページは1起点にセッション更新）であること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-024	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	検索検証失敗を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 検索検証失敗
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-025	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	検索パターン保存で名称空を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 検索パターン保存で名称空
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-026	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	検索パターン保存成功を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 検索パターン保存成功
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-027	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	削除成功を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. 削除成功
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-028	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	検索フォーム検証エラーを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. 検索フォーム検証エラー
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	検索パターン削除対象無しを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. 検索パターン削除対象無し
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	トランザクション境界を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）でトランザクション境界の確認に必要な条件を指定する	"1. 対象画面を表示する
2. トランザクション境界を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-031	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	ロックを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）でロックの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ロックを確認する
3. 画面表示と後続状態を確認する"	受注検索、検索パターン保存・削除とも行ロック・悲観ロック・楽観ロック・ロックファイルは使用しないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-032	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	例外時を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で例外時の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 例外時を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-033	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	管理画面ナビから受注一覧を開くを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で管理画面ナビから受注一覧を開くの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 管理画面ナビから受注一覧を開く
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-034	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	「検索」ボタンで送信を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で「検索」ボタンで送信の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 「検索」ボタンで送信
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	ページリンクで移動を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. ページリンクで移動を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	他画面から一覧へ戻る（検索状態維持）を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 他画面から一覧へ戻る（検索状態維持）
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	表示件数プルダウン変更を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 表示件数プルダウン変更を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	一覧ヘッダの並びアイコンをクリックを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 一覧ヘッダの並びアイコンをクリックを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-039	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	保存済み検索パターン名をクリックを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で保存済み検索パターン名をクリックの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 保存済み検索パターン名をクリック
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-040	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	検索パターン保存ボタンを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索パターン保存ボタンの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索パターン保存ボタン
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-041	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	検索パターン削除ボタンを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索パターン削除ボタンの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索パターン削除ボタン
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-042	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	一覧から受注日または注文番号のリンクを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 一覧から受注日または注文番号のリンクを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-043	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	パターンに保存された条件での件数をJSONで返す（一覧ヘッダからXHRで利用）を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. パターンに保存された条件での件数をJSONで返す（一覧ヘッダからXHRで利用）
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-044	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	表示要素を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	JS挙動を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. JS挙動を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	モーダル・ポップアップを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	ステータス別件数（ラベル横リンク）を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）でステータス別件数（ラベル横リンク）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ステータス別件数（ラベル横リンク）を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	店舗（複数選択）を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 店舗（複数選択）
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-049	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	検索パターン名を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 検索パターン名
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-050	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	購入メッセージの有無（チェック複数可）を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 購入メッセージの有無（チェック複数可）を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-051	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	ピック日時・入金日時・出荷指示日時・出荷日時・キャンセル日時・売上確定日時・店…を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. ピック日時・入金日時・出荷指示日時・出荷日時・キャンセル日時・売上確定日時・店…を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-052	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	配送先カナを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 配送先カナを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-053	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	並びキー・昇降（隠し）を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 並びキー・昇降（隠し）を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-054	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	検索成功POSTを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 検索成功POST
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-055	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	検索検証失敗を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 検索検証失敗
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-056	IT-22	必須制御	P1	必須制御の入力検証	検索パターン保存で名称空を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. 検索パターン保存で名称空
3. 画面表示と後続状態を確認する"	admin_order へリダイレクトであること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-057	IT-22	部分入力	P2	部分入力の入力検証	検索パターン保存成功を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索パターン保存成功の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索パターン保存成功
3. 画面表示と後続状態を確認する"	admin_order_search_pattern へリダイレクトであること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-058	IT-23	検索条件	P2	検索時の検索条件確認	削除成功を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-059	IT-23	検索条件	P2	検索時の検索条件確認	検索フォーム検証エラーを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-060	IT-23	検索条件	P2	検索時の検索条件確認	検索パターン削除対象無しを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索パターン削除対象無しの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	admin_order へであること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-061	IT-23	検索条件	P2	検索時の検索条件確認	トランザクション境界を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-062	IT-23	検索条件	P2	検索時の検索条件確認	ロックを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-063	IT-23	検索条件	P2	検索時の検索条件確認	例外時を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-064	IT-23	検索条件	P2	検索時の検索条件確認	管理画面ナビから受注一覧を開くを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-065	IT-23	検索条件	P2	検索時の検索条件確認	「検索」ボタンで送信を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-066	IT-23	検索条件	P2	検索時の検索条件確認	ページリンクで移動を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-067	IT-23	検索条件	P2	検索時の検索条件確認	他画面から一覧へ戻る（検索状態維持）を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で他画面から一覧へ戻る（検索状態維持）の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-068	IT-23	検索条件	P2	検索時の検索条件確認	表示件数プルダウン変更を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で表示件数プルダウン変更の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-069	IT-23	検索条件	P2	検索時の検索条件確認	一覧ヘッダの並びアイコンをクリックを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で一覧ヘッダの並びアイコンをクリックの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-070	IT-23	検索条件	P2	検索時の検索条件確認	保存済み検索パターン名をクリックを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で保存済み検索パターン名をクリックの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-071	IT-23	検索条件	P2	検索時の検索条件確認	検索パターン保存ボタンを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索パターン保存ボタンの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	パターン名が空ならエラーフラッシュ付きで admin_order に戻ること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-072	IT-23	検索条件	P2	検索時の検索条件確認	検索パターン削除ボタンを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索パターン削除ボタンの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-073	IT-23	検索条件	P2	検索時の検索条件確認	一覧から受注日または注文番号のリンクを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で一覧から受注日または注文番号のリンクの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-074	IT-23	実行結果	P2	検索時の実行結果確認	パターンに保存された条件での件数をJSONで返す（一覧ヘッダからXHRで利用）を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）でパターンに保存された条件での件数をJSONで返す（一覧ヘッダからXHRで利用）の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-075	IT-23	実行結果	P2	検索時の実行結果確認	表示要素を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で表示要素の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	ページタイトル・サブタイトルは受注一覧／受注管理であること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-076	IT-23	実行結果	P2	検索時の実行結果確認	JS挙動を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）でJS挙動の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-077	IT-23	実行結果	P2	検索時の実行結果確認	モーダル・ポップアップを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-078	IT-23	実行結果	P2	検索時の実行結果確認	ステータス別件数（ラベル横リンク）を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）でステータス別件数（ラベル横リンク）の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-079	IT-26	更新内容	P1	更新時の更新内容確認	店舗（複数選択）を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で店舗（複数選択）の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-080	IT-26	更新内容	P1	更新時の更新内容確認	検索パターン名を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索パターン名の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-081	IT-26	更新内容	P1	更新時の更新内容確認	検索パターンID（隠し）を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索パターンID（隠し）の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-082	IT-26	更新内容	P1	更新時の更新内容確認	購入メッセージの有無（チェック複数可）を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で購入メッセージの有無（チェック複数可）の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	値 1 のみ選択時は o.message IS NOT NULL、0 のみは IS NULLであること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-083	IT-26	更新内容	P1	更新時の更新内容確認	ピック日時・入金日時・出荷指示日時・出荷日時・キャンセル日時・売上確定日時・店…を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）でピック日時・入金日時・出荷指示日時・出荷日時・キャンセル日時・売上確定日時・店…の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	それぞれ o.confirmDate、o.payment_date、o.commitDate、o.shippingDate、o.cancel_date、o.receiptDate、o.otc_rsv_date、o.up…であること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-084	IT-23	更新内容	P1	更新時の更新内容確認	配送先カナを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で配送先カナの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	DQL文字列に括弧欠落があり、実行時エラーや無効条件になりうる実装になっている（要コード修正の可能性）であること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-085	IT-26	更新内容	P1	更新時の更新内容確認	並びキー・昇降（隠し）を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で並びキー・昇降（隠し）の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	sortkey・sorttype（a 以外は降順扱い）であること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-086	IT-26	更新内容	P1	更新時の更新内容確認	検索成功POSTを試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索成功POSTの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	同一一覧URLでテンプレート再描画（ページは1起点にセッション更新）であること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-087	IT-26	更新内容	P1	更新時の更新内容確認	検索検証失敗を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索検証失敗の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	同一テンプレートでエラー表示、一覧領域は空メッセージ扱いであること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-088	IT-26	更新内容	P1	更新時の更新内容確認	検索パターン保存で名称空を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索パターン保存で名称空の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	admin_order へリダイレクトであること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-089	IT-26	更新内容	P1	更新時の更新内容確認	検索パターン保存成功を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で検索パターン保存成功の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	admin_order_search_pattern へリダイレクトであること。
m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）	IT-M05-01-ADMIN-ORDER-ORDER-SEARCH-LIST-090	IT-26	更新内容	P1	更新時の更新内容確認	削除成功を試験できる状態である	m05-01_admin_order_order_search_list（受注管理 — 受注情報検索・一覧）（m05_01_admin_order_order_search_list）で削除成功の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
```

## 対象外観点

| 分類・範囲 | 理由 |
|-----------|------|
| バリデーション / バリデーション / 単項目バリデーション（IT-22） | 元設計HTMLに該当する処理・I/Fがないため |
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
| ウェブサービス / 外部連携 / 実数更新（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| その他 | 同種の対象外観点 18 件は上記分類と同じ理由で対象外 |
