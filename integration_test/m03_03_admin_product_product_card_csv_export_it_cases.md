# m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m03-03_admin_product_product_card_csv_export.html`

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
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-001	IT-16	実行結果	P1	実行結果の結合確認	検索結果があり一覧ブロックが描画された状態で、商品をチェックして「カード商品C…を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-002	IT-27	実行結果	P1	実行結果の結合確認	表示要素を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-003	IT-27	出力失敗	P1	出力失敗の結合確認	JS 挙動を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で出力失敗の対象ファイルと処理条件を指定する	"1. 対象画面で出力失敗のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力失敗のファイル出力内容または取り込み結果が対象データと一致すること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-004	IT-15	CSRF	P1	CSRFの結合確認	モーダル・ポップアップを試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）でCSRFの対象ファイルと処理条件を指定する	"1. 対象画面でCSRFのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	CSRFのファイル出力内容または取り込み結果が対象データと一致すること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-005	IT-15	未認証	P1	未認証の結合確認	行の複製単位を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で未認証の対象ファイルと処理条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	商品につき getProductClasses() の反復ごとに 1 行であること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-006	IT-15	対象データ	P1	対象データの結合確認	一部 ID が DB に無い場合を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で対象データの対象ファイルと処理条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	取得できた商品だけが出力対象となり、存在しない ID は静かに無視されるであること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-007	IT-20	出力抑止	P1	出力抑止の結合確認	ids 未送信・空・文字列のみを試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で出力抑止の対象ファイルと処理条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	商品一覧へリダイレクト（ページ番号はセッションの検索ページ）であること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-008	IT-20	識別子	P1	識別子の結合確認	Referer 欠落かつエラーを試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で識別子の対象ファイルと処理条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	redirectToRoute('admin_product_page')であること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-009	IT-15	状態変化	P1	状態変化の結合確認	一覧との対応を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で状態変化の対象ファイルと処理条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	出力対象は一覧でチェックした商品 ID のみであること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-010	IT-25	UI部品	P3	UI部品の操作結果確認	一覧表示との差を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）でUI部品の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 一覧表示との差を確認する
3. 画面表示と後続状態を確認する"	一覧テンプレートは言語・状態が揃った規格だけを表示するロジックがあるが、CSV は getProductClasses() の全要素を走査すること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-011	IT-25	UI部品	P3	UI部品の操作結果確認	商品の並びを試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）でUI部品の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 商品の並びを確認する
3. 画面表示と後続状態を確認する"	findBy(['id' => $productIds]) の戻り順に依存し、利用者が一覧で選んだ順序の再現は保証しないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-012	IT-25	操作起点	P1	操作起点の操作結果確認	成功時出力を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で操作起点の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	text/csv のストリームであること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-013	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	失敗時出力を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	フラッシュメッセージ付きで商品一覧もしくは Referer へ HTTP リダイレクトであること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-014	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	副作用を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	読み取りクエリとログ出力のみであること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-015	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	mtb_card_detail（現行 dtb_card_detail）・関連マ…を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. mtb_card_detail（現行 dtb_card_detail）・関連マ…を確認する
3. 画面表示と後続状態を確認する"	ID 連結や名称解決に利用であること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-016	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	検索を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で送信可否制御の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 検索
3. 画面表示と後続状態を確認する"	検索条件に合致するレコードを抽出すること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-017	IT-03	外部画面	P2	外部画面の操作結果確認	取得結果を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で外部画面の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 取得結果を確認する
3. 画面表示と後続状態を確認する"	1 件も商品が取れなければエラーであること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	カード商品として出力可能かを試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. カード商品として出力可能かを確認する
3. 画面表示と後続状態を確認する"	カード詳細と 1 件以上の規格が無ければスキップもしくは全体エラー（集約結果による）であること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	未ログインまたは共通ルールで遮断される利用者を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 未ログインまたは共通ルールで遮断される利用者を確認する
3. 画面表示と後続状態を確認する"	当パスへ到達できないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	出力成功を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 出力成功を確認する
3. 画面表示と後続状態を確認する"	ブラウザがファイルをダウンロードすること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-021	IT-03	画面遷移	P2	画面遷移の操作結果確認	CSV 出力ストリーム送信後を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. CSV 出力ストリーム送信後
3. 画面表示と後続状態を確認する"	情報ログに「カード商品CSV出力ファイル名」と生成ファイル名であること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-022	IT-03	画面遷移	P2	画面遷移の操作結果確認	書き込みを試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 書き込みを確認する
3. 画面表示と後続状態を確認する"	CSV 出力処理はセッションを更新しないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-023	IT-03	画面遷移	P2	画面遷移の操作結果確認	検索結果があり一覧ブロックが描画された状態で、商品をチェックして「カード商品C…を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 検索結果があり一覧ブロックが描画された状態で、商品をチェックして「カード商品C…
3. 画面表示と後続状態を確認する"	選択した商品 ID がフォームデータとして送られ、条件を満たす商品・規格について CSV がダウンロードされるであること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-024	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	表示要素を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）でURL直接アクセスの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	「カード商品CSV出力」は一覧カード内のボタン行にあり、検索結果件数が正のときのみ表示されるであること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-025	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	JS 挙動を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）でHTTPステータスの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	type=button の一括公開変更などは、未チェック時に alert で止める処理があること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-026	IT-25	URL	P2	URLの操作結果確認	モーダル・ポップアップを試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）でURLの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	出力前の確認ダイアログはないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-027	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	行の複製単位を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 行の複製単位を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-028	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	一部 ID が DB に無い場合を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 一部 ID が DB に無い場合を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	ids 未送信・空・文字列のみを試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. ids 未送信・空・文字列のみ
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	Referer 欠落かつエラーを試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. Referer 欠落かつエラーを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-031	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	一覧との対応を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. 一覧との対応を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-032	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	一覧表示との差を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. 一覧表示との差を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-033	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	商品の並びを試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で文字列長バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 商品の並びを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-034	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	成功時出力を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で文字列長バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	text/csv のストリームであること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	失敗時出力を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	副作用を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	mtb_card_detail（現行 dtb_card_detail）・関連マ…を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. mtb_card_detail（現行 dtb_card_detail）・関連マ…を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	検索を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 検索
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-039	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	取得結果を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 取得結果を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-040	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	カード商品として出力可能かを試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. カード商品として出力可能かを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-041	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	未ログインまたは共通ルールで遮断される利用者を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 未ログインまたは共通ルールで遮断される利用者を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-042	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	出力成功を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 出力成功を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-043	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	CSV 出力ストリーム送信後を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で文字種バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. CSV 出力ストリーム送信後
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-044	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	書き込みを試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で文字種バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 書き込みを確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	検索結果があり一覧ブロックが描画された状態で、商品をチェックして「カード商品C…を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 検索結果があり一覧ブロックが描画された状態で、商品をチェックして「カード商品C…
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	表示要素を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	JS 挙動を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	モーダル・ポップアップを試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-049	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	行の複製単位を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）でその他のバリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 行の複製単位を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-050	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	一部 ID が DB に無い場合を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）でその他のバリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 一部 ID が DB に無い場合を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-051	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	ids 未送信・空・文字列のみを試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. ids 未送信・空・文字列のみ
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-052	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	Referer 欠落かつエラーを試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. Referer 欠落かつエラーを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-053	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	一覧との対応を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）でその他のバリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 一覧との対応を確認する
3. 画面表示と後続状態を確認する"	出力対象は一覧でチェックした商品 ID のみであること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-054	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	一覧表示との差を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 一覧表示との差を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-055	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	商品の並びを試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 商品の並びを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-056	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	成功時出力を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-057	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	失敗時出力を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-058	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	副作用を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-059	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	mtb_card_detail（現行 dtb_card_detail）・関連マ…を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. mtb_card_detail（現行 dtb_card_detail）・関連マ…を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-060	IT-22	必須制御	P1	必須制御の入力検証	検索を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. 検索
3. 画面表示と後続状態を確認する"	検索条件に合致するレコードを抽出すること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-061	IT-22	部分入力	P2	部分入力の入力検証	取得結果を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で部分入力の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 取得結果を確認する
3. 画面表示と後続状態を確認する"	1 件も商品が取れなければエラーであること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-062	IT-23	検索条件	P2	検索時の検索条件確認	カード商品として出力可能かを試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-063	IT-23	検索条件	P2	検索時の検索条件確認	未ログインまたは共通ルールで遮断される利用者を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-064	IT-23	検索条件	P2	検索時の検索条件確認	出力成功を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	ブラウザがファイルをダウンロードすること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-065	IT-23	検索条件	P2	検索時の検索条件確認	CSV 出力ストリーム送信後を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-066	IT-23	検索条件	P2	検索時の検索条件確認	書き込みを試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-067	IT-23	検索条件	P2	検索時の検索条件確認	検索結果があり一覧ブロックが描画された状態で、商品をチェックして「カード商品C…を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-068	IT-23	検索条件	P2	検索時の検索条件確認	表示要素を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-069	IT-23	検索条件	P2	検索時の検索条件確認	JS 挙動を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-070	IT-23	検索条件	P2	検索時の検索条件確認	モーダル・ポップアップを試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-071	IT-23	検索条件	P2	検索時の検索条件確認	行の複製単位を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-072	IT-23	検索条件	P2	検索時の検索条件確認	一部 ID が DB に無い場合を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-073	IT-23	検索条件	P2	検索時の検索条件確認	ids 未送信・空・文字列のみを試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-074	IT-23	検索条件	P2	検索時の検索条件確認	Referer 欠落かつエラーを試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-075	IT-23	検索条件	P2	検索時の検索条件確認	一覧との対応を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	出力対象は一覧でチェックした商品 ID のみであること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-076	IT-23	検索条件	P2	検索時の検索条件確認	一覧表示との差を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-077	IT-23	検索条件	P2	検索時の検索条件確認	商品の並びを試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-078	IT-23	実行結果	P2	検索時の実行結果確認	成功時出力を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-079	IT-23	実行結果	P2	検索時の実行結果確認	失敗時出力を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	フラッシュメッセージ付きで商品一覧もしくは Referer へ HTTP リダイレクトであること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-080	IT-23	実行結果	P2	検索時の実行結果確認	副作用を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-081	IT-23	実行結果	P2	検索時の実行結果確認	mtb_card_detail（現行 dtb_card_detail）・関連マ…を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-082	IT-23	実行結果	P2	検索時の実行結果確認	検索を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-083	IT-16	実行結果	P2	実行結果の結合確認	取得結果を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-084	IT-16	実行結果	P2	実行結果の結合確認	カード商品として出力可能かを試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-085	IT-16	実行結果	P2	実行結果の結合確認	未ログインまたは共通ルールで遮断される利用者を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-086	IT-16	実行結果	P2	実行結果の結合確認	出力成功を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で実行結果の対象項目に最大長の値を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果でエラーが表示されず、対象処理を継続できること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-087	IT-16	実行結果	P2	実行結果の結合確認	CSV 出力ストリーム送信後を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で実行結果の対象項目に最大長+1の値を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果でエラーが表示され、対象処理が完了しないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-088	IT-16	実行結果	P2	実行結果の結合確認	書き込みを試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で実行結果の対象項目に最小長の値を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果でエラーが表示されず、対象処理を継続できること。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-089	IT-16	実行結果	P2	実行結果の結合確認	検索結果があり一覧ブロックが描画された状態で、商品をチェックして「カード商品C…を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で実行結果の対象項目に最小長-1の値を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果でエラーが表示され、対象処理が完了しないこと。
m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）	IT-M03-03-ADMIN-PRODUCT-PRODUCT-CARD-CSV-EXPORT-090	IT-16	実行結果	P2	実行結果の結合確認	表示要素を試験できる状態である	m03-03_admin_product_product_card_csv_export（管理画面_商品管理_カード商品CSV出力）（m03_03_admin_product_product_card_csv_export）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果でエラーが表示されず、対象処理を継続できること。
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
| ウェブサービス / 外部連携 / 連携エラー（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| その他 | 同種の対象外観点 16 件は上記分類と同じ理由で対象外 |
