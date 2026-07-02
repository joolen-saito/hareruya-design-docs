# m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m03-25_admin_product_product_duplicate_product_code_check.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、UI部品、操作起点、確認ダイアログ、送信可否制御 |
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
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-001	IT-15	CSRF	P1	CSRFの結合確認	サイドナビ「商品管理」配下の「重複コード確認」（ロケール依存）を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）でサイドナビ「商品管理」配下の「重複コード確認」（ロケール依存）の確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	前ページが開き、大きなボタンから結果ページへ進めるであること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-002	IT-15	未認証	P1	未認証の結合確認	前ページの「重複確認する」ボタンを試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で前ページの「重複確認する」ボタンの確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	DB で重複を検索し、無ければメッセージ、あれば表で一覧すること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-003	IT-15	対象データ	P1	対象データの結合確認	結果ページの各セルのリンク（別タブ）を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で結果ページの各セルのリンク（別タブ）の確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	該当規格の編集画面を別タブで開くこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-004	IT-20	出力抑止	P1	出力抑止の結合確認	表示要素を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で表示要素の確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	共通フレーム @admin/default_frame.twig を継承であること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-005	IT-20	識別子	P1	識別子の結合確認	重複が 1 件も無いを試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で重複が 1 件も無いの確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	結果ページはテーブルを出さず、固定メッセージのみ表示すること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-006	IT-15	状態変化	P1	状態変化の結合確認	一覧と DBを試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で一覧と DBの確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	一覧はリクエスト処理中の読み取り時点のコミット済みデータを反映すること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-007	IT-25	UI部品	P3	UI部品の操作結果確認	一覧と規格編集を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で一覧と規格編集の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧と規格編集を確認する
3. 画面表示と後続状態を確認する"	リンク先は編集画面の初期表示であり、別タブで開いたあとの同時更新との整合は保証しないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-008	IT-25	UI部品	P3	UI部品の操作結果確認	成功時出力を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	HTTP 200 と HTMLであること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-009	IT-25	操作起点	P1	操作起点の操作結果確認	失敗時出力を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	管理画面共通のエラー扱い（認証失敗時のログイン誘導など）であること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-010	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	副作用を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で副作用の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	DB の書き込み・セッションキー更新・フラッシュメッセージ追加は行わないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-011	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	管理画面にログインしており、ファイアウォール上パス /{admin_route…を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で管理画面にログインしており、ファイアウォール上パス /{admin_route…の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 管理画面にログインしており、ファイアウォール上パス /{admin_route…を確認する
3. 画面表示と後続状態を確認する"	画面を表示できること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-012	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	ナビから「重複コード確認」を選択を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）でナビから「重複コード確認」を選択の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ナビから「重複コード確認」を選択
3. 画面表示と後続状態を確認する"	GET …/product/pre_doubling_checkであること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-013	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	前ページで「重複確認する」を押下を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で前ページで「重複確認する」を押下の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 前ページで「重複確認する」を押下
3. 画面表示と後続状態を確認する"	GET …/product/doubling_checkであること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-014	IT-03	外部画面	P2	外部画面の操作結果確認	結果ページの表のリンクを押下（別タブ）を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で結果ページの表のリンクを押下（別タブ）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 結果ページの表のリンクを押下（別タブ）
3. 画面表示と後続状態を確認する"	規格編集画面であること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-015	IT-03	画面遷移	P2	画面遷移の操作結果確認	DB アクセス失敗を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）でDB アクセス失敗の確認に必要な条件を指定する	"1. 対象画面を表示する
2. DB アクセス失敗を確認する
3. 画面表示と後続状態を確認する"	アプリケーション共通のエラーハンドリングに委ねるであること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-016	IT-03	画面遷移	P2	画面遷移の操作結果確認	前ページ・結果ページの表示を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で前ページ・結果ページの表示の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 前ページ・結果ページの表示を確認する
3. 画面表示と後続状態を確認する"	当機能の処理経路ではセッションへの読み書きを行わない（確認値）であること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-017	IT-03	画面遷移	P2	画面遷移の操作結果確認	サイドナビ「商品管理」配下の「重複コード確認」（ロケール依存）を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）でサイドナビ「商品管理」配下の「重複コード確認」（ロケール依存）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. サイドナビ「商品管理」配下の「重複コード確認」（ロケール依存）を確認する
3. 画面表示と後続状態を確認する"	前ページが開き、大きなボタンから結果ページへ進めるであること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	前ページの「重複確認する」ボタンを試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で前ページの「重複確認する」ボタンの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 前ページの「重複確認する」ボタンを確認する
3. 画面表示と後続状態を確認する"	DB で重複を検索し、無ければメッセージ、あれば表で一覧すること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	結果ページの各セルのリンク（別タブ）を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で結果ページの各セルのリンク（別タブ）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 結果ページの各セルのリンク（別タブ）を確認する
3. 画面表示と後続状態を確認する"	該当規格の編集画面を別タブで開くこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	表示要素を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	共通フレーム @admin/default_frame.twig を継承であること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-021	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	重複が 1 件も無いを試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で重複が 1 件も無いの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 重複が 1 件も無いを確認する
3. 画面表示と後続状態を確認する"	結果ページはテーブルを出さず、固定メッセージのみ表示すること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-022	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	一覧と DBを試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で一覧と DBの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧と DBを確認する
3. 画面表示と後続状態を確認する"	一覧はリクエスト処理中の読み取り時点のコミット済みデータを反映すること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-023	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	成功時出力を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-024	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	失敗時出力を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-025	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	副作用を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-026	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	管理画面にログインしており、ファイアウォール上パス /{admin_route…を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. 管理画面にログインしており、ファイアウォール上パス /{admin_route…を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-027	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	ナビから「重複コード確認」を選択を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. ナビから「重複コード確認」を選択
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-028	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	前ページで「重複確認する」を押下を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. 前ページで「重複確認する」を押下
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	結果ページの表のリンクを押下（別タブ）を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で結果ページの表のリンクを押下（別タブ）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 結果ページの表のリンクを押下（別タブ）
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-030	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	前ページ・結果ページの表示を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で前ページ・結果ページの表示の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 前ページ・結果ページの表示を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-031	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	サイドナビ「商品管理」配下の「重複コード確認」（ロケール依存）を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）でサイドナビ「商品管理」配下の「重複コード確認」（ロケール依存）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. サイドナビ「商品管理」配下の「重複コード確認」（ロケール依存）を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-032	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	前ページの「重複確認する」ボタンを試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で前ページの「重複確認する」ボタンの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 前ページの「重複確認する」ボタンを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-033	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	結果ページの各セルのリンク（別タブ）を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 結果ページの各セルのリンク（別タブ）を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-034	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	表示要素を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	重複が 1 件も無いを試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 重複が 1 件も無いを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	一覧と DBを試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 一覧と DBを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	一覧と規格編集を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で一覧と規格編集の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧と規格編集を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-038	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	成功時出力を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-039	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	失敗時出力を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-040	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	副作用を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-041	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	管理画面にログインしており、ファイアウォール上パス /{admin_route…を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 管理画面にログインしており、ファイアウォール上パス /{admin_route…を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-042	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	ナビから「重複コード確認」を選択を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. ナビから「重複コード確認」を選択
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-043	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	前ページで「重複確認する」を押下を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 前ページで「重複確認する」を押下
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-044	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	結果ページの表のリンクを押下（別タブ）を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で結果ページの表のリンクを押下（別タブ）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 結果ページの表のリンクを押下（別タブ）
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	DB アクセス失敗を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）でDB アクセス失敗の確認に必要な条件を指定する	"1. 対象画面を表示する
2. DB アクセス失敗を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	前ページ・結果ページの表示を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 前ページ・結果ページの表示を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	サイドナビ「商品管理」配下の「重複コード確認」（ロケール依存）を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. サイドナビ「商品管理」配下の「重複コード確認」（ロケール依存）を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-048	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	結果ページの各セルのリンク（別タブ）を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 結果ページの各セルのリンク（別タブ）を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-049	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	表示要素を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-050	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	重複が 1 件も無いを試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 重複が 1 件も無いを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-051	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	一覧と DBを試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 一覧と DBを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-052	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	一覧と規格編集を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 一覧と規格編集を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-053	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	成功時出力を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-054	IT-22	必須制御	P1	必須制御の入力検証	失敗時出力を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	管理画面共通のエラー扱い（認証失敗時のログイン誘導など）であること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-055	IT-23	検索条件	P2	検索時の検索条件確認	管理画面にログインしており、ファイアウォール上パス /{admin_route…を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-056	IT-23	検索条件	P2	検索時の検索条件確認	ナビから「重複コード確認」を選択を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-057	IT-23	検索条件	P2	検索時の検索条件確認	前ページで「重複確認する」を押下を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で前ページで「重複確認する」を押下の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	GET …/product/doubling_checkであること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-058	IT-23	検索条件	P2	検索時の検索条件確認	結果ページの表のリンクを押下（別タブ）を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-059	IT-23	検索条件	P2	検索時の検索条件確認	DB アクセス失敗を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-060	IT-23	検索条件	P2	検索時の検索条件確認	前ページ・結果ページの表示を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-061	IT-23	検索条件	P2	検索時の検索条件確認	サイドナビ「商品管理」配下の「重複コード確認」（ロケール依存）を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-062	IT-23	検索条件	P2	検索時の検索条件確認	前ページの「重複確認する」ボタンを試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-063	IT-23	検索条件	P2	検索時の検索条件確認	結果ページの各セルのリンク（別タブ）を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-064	IT-23	検索条件	P2	検索時の検索条件確認	表示要素を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で表示要素の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-065	IT-23	検索条件	P2	検索時の検索条件確認	重複が 1 件も無いを試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で重複が 1 件も無いの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-066	IT-23	検索条件	P2	検索時の検索条件確認	一覧と DBを試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で一覧と DBの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-067	IT-23	検索条件	P2	検索時の検索条件確認	一覧と規格編集を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で一覧と規格編集の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-068	IT-23	検索条件	P2	検索時の検索条件確認	成功時出力を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で成功時出力の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	HTTP 200 と HTMLであること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-069	IT-23	検索条件	P2	検索時の検索条件確認	失敗時出力を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で失敗時出力の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-070	IT-23	検索条件	P2	検索時の検索条件確認	副作用を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で副作用の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-071	IT-23	実行結果	P2	検索時の実行結果確認	管理画面にログインしており、ファイアウォール上パス /{admin_route…を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で管理画面にログインしており、ファイアウォール上パス /{admin_route…の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-072	IT-23	実行結果	P2	検索時の実行結果確認	ナビから「重複コード確認」を選択を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）でナビから「重複コード確認」を選択の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	GET …/product/pre_doubling_checkであること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-073	IT-23	実行結果	P2	検索時の実行結果確認	前ページで「重複確認する」を押下を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で前ページで「重複確認する」を押下の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-074	IT-23	実行結果	P2	検索時の実行結果確認	結果ページの表のリンクを押下（別タブ）を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で結果ページの表のリンクを押下（別タブ）の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-075	IT-23	実行結果	P2	検索時の実行結果確認	DB アクセス失敗を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）でDB アクセス失敗の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-076	IT-26	更新内容	P1	更新時の更新内容確認	前ページ・結果ページの表示を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で前ページ・結果ページの表示の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-077	IT-26	更新内容	P1	更新時の更新内容確認	サイドナビ「商品管理」配下の「重複コード確認」（ロケール依存）を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）でサイドナビ「商品管理」配下の「重複コード確認」（ロケール依存）の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-078	IT-26	更新内容	P1	更新時の更新内容確認	前ページの「重複確認する」ボタンを試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で前ページの「重複確認する」ボタンの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-079	IT-26	更新内容	P1	更新時の更新内容確認	結果ページの各セルのリンク（別タブ）を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で結果ページの各セルのリンク（別タブ）の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	該当規格の編集画面を別タブで開くこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-080	IT-26	更新内容	P1	更新時の更新内容確認	表示要素を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で表示要素の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	共通フレーム @admin/default_frame.twig を継承であること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-081	IT-23	更新内容	P1	更新時の更新内容確認	重複が 1 件も無いを試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で重複が 1 件も無いの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	結果ページはテーブルを出さず、固定メッセージのみ表示すること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-082	IT-26	更新内容	P1	更新時の更新内容確認	一覧と DBを試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で一覧と DBの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	一覧はリクエスト処理中の読み取り時点のコミット済みデータを反映すること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-083	IT-26	更新内容	P1	更新時の更新内容確認	一覧と規格編集を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で一覧と規格編集の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	リンク先は編集画面の初期表示であり、別タブで開いたあとの同時更新との整合は保証しないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-084	IT-26	更新内容	P1	更新時の更新内容確認	成功時出力を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で成功時出力の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	HTTP 200 と HTMLであること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-085	IT-26	更新内容	P1	更新時の更新内容確認	失敗時出力を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で失敗時出力の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	管理画面共通のエラー扱い（認証失敗時のログイン誘導など）であること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-086	IT-26	更新内容	P1	更新時の更新内容確認	副作用を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で副作用の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	DB の書き込み・セッションキー更新・フラッシュメッセージ追加は行わないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-087	IT-26	更新内容	P1	更新時の更新内容確認	管理画面にログインしており、ファイアウォール上パス /{admin_route…を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で管理画面にログインしており、ファイアウォール上パス /{admin_route…の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-088	IT-26	更新内容	P1	更新時の更新内容確認	ナビから「重複コード確認」を選択を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-089	IT-26	更新内容	P1	更新時の更新内容確認	前ページで「重複確認する」を押下を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）	IT-M03-25-ADMIN-PRODUCT-PRODUCT-DUPLICATE-PRODUCT-CODE-CHECK-090	IT-26	更新内容	P1	更新時の更新内容確認	結果ページの表のリンクを押下（別タブ）を試験できる状態である	m03-25_admin_product_product_duplicate_product_code_check（管理画面_商品管理_重複商品コード確認）（m03_25_admin_product_product_duplicate_product_code_check）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
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
| ウェブアプリケーション / フロント / リンク（IT-25） | 元設計HTMLに該当する処理・I/Fがないため |
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
| その他 | 同種の対象外観点 20 件は上記分類と同じ理由で対象外 |
