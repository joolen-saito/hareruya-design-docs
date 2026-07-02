# m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m03-01_admin_product_product_search_list.html`

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
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-001	IT-15	CSRF	P1	CSRFの結合確認	ナビから商品一覧を開くを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でナビから商品一覧を開くの確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	フォーム既定値で検索ビューデータをセッションへ書き込み、ページ 1 を表示すること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-002	IT-15	未認証	P1	未認証の結合確認	「検索する」で送信を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で「検索する」で送信の確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	検証に成功すれば条件をセッションへ保存しページ番号を 1 にし、同一条件で一覧を組み立てるであること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-003	IT-15	対象データ	P1	対象データの結合確認	ページネーションで N ページへを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でページネーションで N ページへの確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	セッションの検索条件とページ番号を更新し、N ページ目を表示すること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-004	IT-20	出力抑止	P1	出力抑止の結合確認	ソートアイコン押下を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でソートアイコン押下の確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	隠しフィールド sortkey・sorttype を更新して送信し、ページ番号は 1 にリセットされる POST 分岐に入るであること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-005	IT-20	識別子	P1	識別子の結合確認	表示件数プルダウン変更を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で表示件数プルダウン変更の確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	mtb_page_max に存在する件数ならセッションへ保存し、その件数で分割すること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-006	IT-15	状態変化	P1	状態変化の結合確認	一覧表示データプルダウン変更を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で一覧表示データプルダウン変更の確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	セッションの表示モードを更新し、同一ページ番号で再描画すること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-007	IT-25	UI部品	P3	UI部品の操作結果確認	商品名リンクを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で商品名リンクの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 商品名リンクを確認する
3. 画面表示と後続状態を確認する"	商品編集画面へ遷移すること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-008	IT-25	UI部品	P3	UI部品の操作結果確認	他画面から一覧へ戻るを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で他画面から一覧へ戻るの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 他画面から一覧へ戻るを確認する
3. 画面表示と後続状態を確認する"	セッションに保存されたページ番号を復元し、検索条件もセッションから復元すること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-009	IT-25	操作起点	P1	操作起点の操作結果確認	ホームの在庫切れ件数から遷移を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でホームの在庫切れ件数から遷移の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ホームの在庫切れ件数から遷移を確認する
3. 画面表示と後続状態を確認する"	別節およびエッジケース参照であること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-010	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	表示要素を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	見出しは商品一覧であること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-011	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	JS 挙動を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でJS 挙動の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	複数選択フィールドに select2（カテゴリ、エキスパンション、タグ、略称タグ、売上分析タグ、部門、棚番号）であること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-012	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	モーダル・ポップアップを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	規格一覧確認モーダル、一括完全削除モーダルであること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-013	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	基準価格（開始）を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で基準価格（開始）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 基準価格（開始）を確認する
3. 画面表示と後続状態を確認する"	フォームおよびセッションには載るが、getQueryBuilderBySearchDataForAdmin 本体では参照しない（確認値）であること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-014	IT-03	外部画面	P2	外部画面の操作結果確認	規格更新日（開始）を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で規格更新日（開始）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 規格更新日（開始）を確認する
3. 画面表示と後続状態を確認する"	pc.update_date の下限であること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-015	IT-03	画面遷移	P2	画面遷移の操作結果確認	規格更新日（終了）を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で規格更新日（終了）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 規格更新日（終了）を確認する
3. 画面表示と後続状態を確認する"	終日 inclusiveであること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-016	IT-03	画面遷移	P2	画面遷移の操作結果確認	POST 検証エラーを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でPOST 検証エラーの確認に必要な条件を指定する	"1. 対象画面を表示する
2. POST 検証エラーを確認する
3. 画面表示と後続状態を確認する"	has_errors が真となり、「検索条件に誤りがあります」系のメッセージブロックを表示であること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-017	IT-03	画面遷移	P2	画面遷移の操作結果確認	検索結果 0 件を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で検索結果 0 件の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索結果 0 件
3. 画面表示と後続状態を確認する"	「検索結果がありません」メッセージを表示であること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	sortkey が列マップ外を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でsortkey が列マップ外の確認に必要な条件を指定する	"1. 対象画面を表示する
2. sortkey が列マップ外を確認する
3. 画面表示と後続状態を確認する"	リポジトリが orderBy する時点で未定義添字参照となり、実行時エラーになり得る（不正な隠しフィールド送付）であること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	ホームの search_nonstock のみをセッションに載せて一覧へ入るを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でホームの search_nonstock のみをセッションに載せて一覧へ入るの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ホームの search_nonstock のみをセッションに載せて一覧へ入るを確認する
3. 画面表示と後続状態を確認する"	コントローラは CSV 用に用意しているマージ処理を経由せず submitAndGetData するため、フォームに無いキーだけが残ると Symfony のフォームがエラーになり得るであること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	一覧テンプレートの在庫・期間別数量セルを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で一覧テンプレートの在庫・期間別数量セルの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧テンプレートの在庫・期間別数量セルを確認する
3. 画面表示と後続状態を確認する"	一部が固定文字列のプレースホルダのまま残っており、検索結果データと一致しない表示になり得るであること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-021	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	一覧と CSVを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で一覧と CSVの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧と CSVを確認する
3. 画面表示と後続状態を確認する"	CSV 出力側はセッションと既定フォーム値をマージしてから submitAndGetData するため、一覧画面よりセッションの未知キーを引きずりやすいであること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-022	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	一覧と編集画面を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で一覧と編集画面の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧と編集画面を確認する
3. 画面表示と後続状態を確認する"	一覧は読み取りクエリのみであること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-023	IT-25	URL	P2	URLの操作結果確認	クエリカスタマイザを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でクエリカスタマイザの確認に必要な条件を指定する	"1. 対象画面を表示する
2. クエリカスタマイザを確認する
3. 画面表示と後続状態を確認する"	登録がある環境では一覧 SQL が本体説明と異なる場合があること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-024	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	成功時出力を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-025	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	失敗時出力を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-026	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	副作用を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-027	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	規格更新日を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. 規格更新日を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-028	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	その他テキストを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. その他テキストを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	管理画面にログインしルートへ到達できる運用者を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. 管理画面にログインしルートへ到達できる運用者を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	未ログインまたは拒否された主体を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で未ログインまたは拒否された主体の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 未ログインまたは拒否された主体を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-031	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	編集などから resume=1 で戻るを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で編集などから resume=1 で戻るの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 編集などから resume=1 で戻るを確認する
3. 画面表示と後続状態を確認する"	保存されていたページ番号と条件で一覧を組み立てるであること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-032	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	POST 検証失敗を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でPOST 検証失敗の確認に必要な条件を指定する	"1. 対象画面を表示する
2. POST 検証失敗を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-033	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	一括削除の一部失敗を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で一括削除の一部失敗の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一括削除の一部失敗
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-034	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	検索ビューデータを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で検索ビューデータの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 検索ビューデータ
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	表示件数を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 表示件数を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	一覧表示データモードを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 一覧表示データモードを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	ナビから商品一覧を開くを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. ナビから商品一覧を開く
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	「検索する」で送信を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 「検索する」で送信
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-039	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	ページネーションで N ページへを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でページネーションで N ページへの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ページネーションで N ページへを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-040	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	ソートアイコン押下を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でソートアイコン押下の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ソートアイコン押下
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-041	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	表示件数プルダウン変更を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で表示件数プルダウン変更の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示件数プルダウン変更を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-042	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	一覧表示データプルダウン変更を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 一覧表示データプルダウン変更を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-043	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	商品名リンクを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 商品名リンクを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-044	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	他画面から一覧へ戻るを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 他画面から一覧へ戻るを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	ホームの在庫切れ件数から遷移を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. ホームの在庫切れ件数から遷移を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	表示要素を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	JS 挙動を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でJS 挙動の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	モーダル・ポップアップを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-049	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	基準価格（開始）を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 基準価格（開始）を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-050	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	規格更新日（終了）を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 規格更新日（終了）を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-051	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	POST 検証エラーを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. POST 検証エラーを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-052	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	検索結果 0 件を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 検索結果 0 件
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-053	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	sortkey が列マップ外を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. sortkey が列マップ外を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-054	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	ホームの search_nonstock のみをセッションに載せて一覧へ入るを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. ホームの search_nonstock のみをセッションに載せて一覧へ入るを確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-055	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	一覧テンプレートの在庫・期間別数量セルを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 一覧テンプレートの在庫・期間別数量セルを確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-056	IT-22	必須制御	P1	必須制御の入力検証	一覧と CSVを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. 一覧と CSVを確認する
3. 画面表示と後続状態を確認する"	CSV 出力側はセッションと既定フォーム値をマージしてから submitAndGetData するため、一覧画面よりセッションの未知キーを引きずりやすいであること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-057	IT-23	検索条件	P2	検索時の検索条件確認	クエリカスタマイザを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-058	IT-23	検索条件	P2	検索時の検索条件確認	成功時出力を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-059	IT-23	検索条件	P2	検索時の検索条件確認	失敗時出力を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で失敗時出力の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	フォームエラー時はエラーメッセージと入力値を保持したフォームであること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-060	IT-23	検索条件	P2	検索時の検索条件確認	副作用を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-061	IT-23	検索条件	P2	検索時の検索条件確認	規格更新日を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-062	IT-23	検索条件	P2	検索時の検索条件確認	その他テキストを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-063	IT-23	検索条件	P2	検索時の検索条件確認	管理画面にログインしルートへ到達できる運用者を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-064	IT-23	検索条件	P2	検索時の検索条件確認	未ログインまたは拒否された主体を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-065	IT-23	検索条件	P2	検索時の検索条件確認	編集などから resume=1 で戻るを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-066	IT-23	検索条件	P2	検索時の検索条件確認	POST 検証失敗を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でPOST 検証失敗の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-067	IT-23	検索条件	P2	検索時の検索条件確認	一括削除の一部失敗を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で一括削除の一部失敗の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-068	IT-23	検索条件	P2	検索時の検索条件確認	検索ビューデータを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で検索ビューデータの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-069	IT-23	検索条件	P2	検索時の検索条件確認	表示件数を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で表示件数の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-070	IT-23	検索条件	P2	検索時の検索条件確認	一覧表示データモードを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で一覧表示データモードの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	キー eccube.admin.product.search.display_modeであること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-071	IT-23	検索条件	P2	検索時の検索条件確認	ナビから商品一覧を開くを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でナビから商品一覧を開くの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-072	IT-23	検索条件	P2	検索時の検索条件確認	「検索する」で送信を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で「検索する」で送信の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-073	IT-23	実行結果	P2	検索時の実行結果確認	ページネーションで N ページへを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でページネーションで N ページへの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-074	IT-23	実行結果	P2	検索時の実行結果確認	ソートアイコン押下を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でソートアイコン押下の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	隠しフィールド sortkey・sorttype を更新して送信し、ページ番号は 1 にリセットされる POST 分岐に入るであること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-075	IT-23	実行結果	P2	検索時の実行結果確認	表示件数プルダウン変更を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で表示件数プルダウン変更の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-076	IT-23	実行結果	P2	検索時の実行結果確認	一覧表示データプルダウン変更を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で一覧表示データプルダウン変更の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-077	IT-23	実行結果	P2	検索時の実行結果確認	商品名リンクを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で商品名リンクの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-078	IT-26	更新内容	P1	更新時の更新内容確認	他画面から一覧へ戻るを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で他画面から一覧へ戻るの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-079	IT-26	更新内容	P1	更新時の更新内容確認	ホームの在庫切れ件数から遷移を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でホームの在庫切れ件数から遷移の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-080	IT-26	更新内容	P1	更新時の更新内容確認	表示要素を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で表示要素の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-081	IT-26	更新内容	P1	更新時の更新内容確認	JS 挙動を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でJS 挙動の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	複数選択フィールドに select2（カテゴリ、エキスパンション、タグ、略称タグ、売上分析タグ、部門、棚番号）であること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-082	IT-26	更新内容	P1	更新時の更新内容確認	モーダル・ポップアップを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	規格一覧確認モーダル、一括完全削除モーダルであること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-083	IT-23	更新内容	P1	更新時の更新内容確認	基準価格（開始）を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で基準価格（開始）の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	フォームおよびセッションには載るが、getQueryBuilderBySearchDataForAdmin 本体では参照しない（確認値）であること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-084	IT-26	更新内容	P1	更新時の更新内容確認	規格更新日（開始）を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で規格更新日（開始）の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	pc.update_date の下限であること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-085	IT-26	更新内容	P1	更新時の更新内容確認	規格更新日（終了）を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で規格更新日（終了）の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	終日 inclusiveであること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-086	IT-26	更新内容	P1	更新時の更新内容確認	POST 検証エラーを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でPOST 検証エラーの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	has_errors が真となり、「検索条件に誤りがあります」系のメッセージブロックを表示であること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-087	IT-26	更新内容	P1	更新時の更新内容確認	検索結果 0 件を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で検索結果 0 件の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	「検索結果がありません」メッセージを表示であること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-088	IT-26	更新内容	P1	更新時の更新内容確認	sortkey が列マップ外を試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でsortkey が列マップ外の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	リポジトリが orderBy する時点で未定義添字参照となり、実行時エラーになり得る（不正な隠しフィールド送付）であること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-089	IT-26	更新内容	P1	更新時の更新内容確認	ホームの search_nonstock のみをセッションに載せて一覧へ入るを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）でホームの search_nonstock のみをセッションに載せて一覧へ入るの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）	IT-M03-01-ADMIN-PRODUCT-PRODUCT-SEARCH-LIST-090	IT-26	更新内容	P1	更新時の更新内容確認	一覧テンプレートの在庫・期間別数量セルを試験できる状態である	m03-01_admin_product_product_search_list（管理画面_商品管理_商品検索・一覧）（m03_01_admin_product_product_search_list）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
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
