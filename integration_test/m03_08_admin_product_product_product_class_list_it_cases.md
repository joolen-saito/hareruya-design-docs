# m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m03-08_admin_product_product_product_class_list.html`

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
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-001	IT-15	CSRF	P1	CSRFの結合確認	言語・カード状態の参照を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で言語・カード状態の参照の確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	dtb_product_class の language_id・card_condition_id に統合（補助表は廃止であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-002	IT-15	未認証	P1	未認証の結合確認	商品編集サイドなどから規格一覧を開く（確認ダイアログ経由など）を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で商品編集サイドなどから規格一覧を開く（確認ダイアログ経由など）の確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ヘッダに商品名であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-003	IT-15	対象データ	P1	対象データの結合確認	return_product_list を付与して開くを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でreturn_product_list を付与して開くの確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	同じ一覧表示のうえ、フッタの戻りが商品一覧であり、クエリに resume=1 が付くであること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-004	IT-20	出力抑止	P1	出力抑止の結合確認	「新規登録」ボタンを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で「新規登録」ボタンの確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	規格新規入力へ遷移すること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-005	IT-20	識別子	P1	識別子の結合確認	行「編集」を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で行「編集」の確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	規格編集へ遷移すること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-006	IT-15	状態変化	P1	状態変化の結合確認	存在しない商品 IDを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で存在しない商品 IDの確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	応答が 404 となる実装確認値とすること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-007	IT-25	UI部品	P3	UI部品の操作結果確認	一覧 URL へ POSTを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で一覧 URL へ POSTの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧 URL へ POSTを確認する
3. 画面表示と後続状態を確認する"	アクション側は一覧組み立てのみで、本体に相当する一覧用フォーム処理は実装しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-008	IT-25	UI部品	P3	UI部品の操作結果確認	表示要素を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	ウィンドウタイトルはロケールの「商品規格一覧」に相当する翻訳であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-009	IT-25	操作起点	P1	操作起点の操作結果確認	画面上の並び順を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で画面上の並び順の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 画面上の並び順を確認する
3. 画面表示と後続状態を確認する"	アクティブ・廃止とも、アルゴリズム順に言語昇順（実体の join 済みオブジェクト昇順として付与されている）、続いてカード状態昇順、続いて規格側の売価列降順、規格側の主キー昇順となる実装確認値となること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-010	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	在庫数を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で在庫数の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 在庫数を確認する
3. 画面表示と後続状態を確認する"	stock_unlimited が真ならロケールの「無制限」短文であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-011	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	販売制限数を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で販売制限数の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 販売制限数を確認する
3. 画面表示と後続状態を確認する"	設定があれば数値として表示するが、 Twig は偽評価のとき空文字となること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-012	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	「新規登録」ヘッダを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で「新規登録」ヘッダの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 「新規登録」ヘッダを確認する
3. 画面表示と後続状態を確認する"	GET …/product/product/class/{id}/newであること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-013	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	商品登録画面上の確認付き規格一覧導線を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で商品登録画面上の確認付き規格一覧導線の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 商品登録画面上の確認付き規格一覧導線を確認する
3. 画面表示と後続状態を確認する"	GET …/product/product/class/{id} と同じルート名で id を渡す確認付きリンク（テンプレートは未保存のときの id 取り回し規則に従う）であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-014	IT-03	外部画面	P2	外部画面の操作結果確認	トランザクション境界を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でトランザクション境界の確認に必要な条件を指定する	"1. 対象画面を表示する
2. トランザクション境界を確認する
3. 画面表示と後続状態を確認する"	本機能は参照・出力を主とし、業務データ更新用の明示トランザクションを開始しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-015	IT-03	画面遷移	P2	画面遷移の操作結果確認	ロックを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でロックの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ロックを確認する
3. 画面表示と後続状態を確認する"	行ロック・悲観ロック・楽観ロック・ロックファイルを使用しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-016	IT-03	画面遷移	P2	画面遷移の操作結果確認	例外時を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で例外時の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 例外時を確認する
3. 画面表示と後続状態を確認する"	出力もしくは表示処理中に例外が発生した場合、未送信の出力は完了しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-017	IT-03	画面遷移	P2	画面遷移の操作結果確認	言語・カード状態の参照を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で言語・カード状態の参照の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 言語・カード状態の参照を確認する
3. 画面表示と後続状態を確認する"	dtb_product_class の language_id・card_condition_id に統合（補助表は廃止であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	商品編集サイドなどから規格一覧を開く（確認ダイアログ経由など）を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で商品編集サイドなどから規格一覧を開く（確認ダイアログ経由など）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 商品編集サイドなどから規格一覧を開く（確認ダイアログ経由など）
3. 画面表示と後続状態を確認する"	ヘッダに商品名であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	return_product_list を付与して開くを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でreturn_product_list を付与して開くの確認に必要な条件を指定する	"1. 対象画面を表示する
2. return_product_list を付与して開く
3. 画面表示と後続状態を確認する"	同じ一覧表示のうえ、フッタの戻りが商品一覧であり、クエリに resume=1 が付くであること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	「新規登録」ボタンを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で「新規登録」ボタンの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 「新規登録」ボタンを確認する
3. 画面表示と後続状態を確認する"	規格新規入力へ遷移すること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-021	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	行「編集」を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で行「編集」の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 行「編集」を確認する
3. 画面表示と後続状態を確認する"	規格編集へ遷移すること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-022	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	存在しない商品 IDを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で存在しない商品 IDの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 存在しない商品 IDを確認する
3. 画面表示と後続状態を確認する"	応答が 404 となる実装確認値とすること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-023	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	表示要素を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-024	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	画面上の並び順を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 画面上の並び順を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-025	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	在庫数を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 在庫数を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-026	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	販売制限数を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. 販売制限数を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-027	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	「新規登録」ヘッダを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. 「新規登録」ヘッダを確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-028	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	商品登録画面上の確認付き規格一覧導線を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. 商品登録画面上の確認付き規格一覧導線を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	トランザクション境界を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でトランザクション境界の確認に必要な条件を指定する	"1. 対象画面を表示する
2. トランザクション境界を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-030	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	例外時を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で例外時の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 例外時を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-031	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	言語・カード状態の参照を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で言語・カード状態の参照の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 言語・カード状態の参照を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-032	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	商品編集サイドなどから規格一覧を開く（確認ダイアログ経由など）を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で商品編集サイドなどから規格一覧を開く（確認ダイアログ経由など）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 商品編集サイドなどから規格一覧を開く（確認ダイアログ経由など）
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-033	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	return_product_list を付与して開くを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. return_product_list を付与して開く
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-034	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	「新規登録」ボタンを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 「新規登録」ボタンを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	行「編集」を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 行「編集」を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	存在しない商品 IDを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 存在しない商品 IDを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	一覧 URL へ POSTを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で一覧 URL へ POSTの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧 URL へ POSTを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-038	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	表示要素を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-039	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	画面上の並び順を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で画面上の並び順の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 画面上の並び順を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-040	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	在庫数を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 在庫数を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-041	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	販売制限数を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 販売制限数を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-042	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	「新規登録」ヘッダを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 「新規登録」ヘッダを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-043	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	商品登録画面上の確認付き規格一覧導線を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 商品登録画面上の確認付き規格一覧導線を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-044	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	トランザクション境界を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でトランザクション境界の確認に必要な条件を指定する	"1. 対象画面を表示する
2. トランザクション境界を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	ロックを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でロックの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ロックを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	例外時を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 例外時を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	言語・カード状態の参照を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 言語・カード状態の参照を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-048	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	return_product_list を付与して開くを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. return_product_list を付与して開く
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-049	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	「新規登録」ボタンを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 「新規登録」ボタンを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-050	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	行「編集」を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 行「編集」を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-051	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	存在しない商品 IDを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 存在しない商品 IDを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-052	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	一覧 URL へ POSTを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 一覧 URL へ POSTを確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-053	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	表示要素を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-054	IT-22	必須制御	P1	必須制御の入力検証	画面上の並び順を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. 画面上の並び順を確認する
3. 画面表示と後続状態を確認する"	アクティブ・廃止とも、アルゴリズム順に言語昇順（実体の join 済みオブジェクト昇順として付与されている）、続いてカード状態昇順、続いて規格側の売価列降順、規格側の主キー昇順となる実装確認値となること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-055	IT-23	検索条件	P2	検索時の検索条件確認	販売制限数を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-056	IT-23	検索条件	P2	検索時の検索条件確認	「新規登録」ヘッダを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-057	IT-23	検索条件	P2	検索時の検索条件確認	商品登録画面上の確認付き規格一覧導線を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で商品登録画面上の確認付き規格一覧導線の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	GET …/product/product/class/{id} と同じルート名で id を渡す確認付きリンク（テンプレートは未保存のときの id 取り回し規則に従う）であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-058	IT-23	検索条件	P2	検索時の検索条件確認	トランザクション境界を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-059	IT-23	検索条件	P2	検索時の検索条件確認	ロックを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-060	IT-23	検索条件	P2	検索時の検索条件確認	例外時を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-061	IT-23	検索条件	P2	検索時の検索条件確認	言語・カード状態の参照を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-062	IT-23	検索条件	P2	検索時の検索条件確認	商品編集サイドなどから規格一覧を開く（確認ダイアログ経由など）を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-063	IT-23	検索条件	P2	検索時の検索条件確認	return_product_list を付与して開くを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-064	IT-23	検索条件	P2	検索時の検索条件確認	「新規登録」ボタンを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で「新規登録」ボタンの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-065	IT-23	検索条件	P2	検索時の検索条件確認	行「編集」を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で行「編集」の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-066	IT-23	検索条件	P2	検索時の検索条件確認	存在しない商品 IDを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で存在しない商品 IDの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-067	IT-23	検索条件	P2	検索時の検索条件確認	一覧 URL へ POSTを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で一覧 URL へ POSTの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-068	IT-23	検索条件	P2	検索時の検索条件確認	表示要素を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で表示要素の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	ウィンドウタイトルはロケールの「商品規格一覧」に相当する翻訳であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-069	IT-23	検索条件	P2	検索時の検索条件確認	画面上の並び順を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で画面上の並び順の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-070	IT-23	検索条件	P2	検索時の検索条件確認	在庫数を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で在庫数の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-071	IT-23	実行結果	P2	検索時の実行結果確認	販売制限数を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で販売制限数の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-072	IT-23	実行結果	P2	検索時の実行結果確認	「新規登録」ヘッダを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で「新規登録」ヘッダの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	GET …/product/product/class/{id}/newであること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-073	IT-23	実行結果	P2	検索時の実行結果確認	商品登録画面上の確認付き規格一覧導線を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で商品登録画面上の確認付き規格一覧導線の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-074	IT-23	実行結果	P2	検索時の実行結果確認	トランザクション境界を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でトランザクション境界の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-075	IT-23	実行結果	P2	検索時の実行結果確認	ロックを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でロックの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-076	IT-26	登録内容	P1	登録時の登録内容確認	例外時を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で例外時の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-077	IT-26	登録内容	P1	登録時の登録内容確認	言語・カード状態の参照を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で言語・カード状態の参照の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-078	IT-26	登録内容	P1	登録時の登録内容確認	商品編集サイドなどから規格一覧を開く（確認ダイアログ経由など）を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で商品編集サイドなどから規格一覧を開く（確認ダイアログ経由など）の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-079	IT-26	登録内容	P1	登録時の登録内容確認	return_product_list を付与して開くを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でreturn_product_list を付与して開くの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	同じ一覧表示のうえ、フッタの戻りが商品一覧であり、クエリに resume=1 が付くであること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-080	IT-26	登録内容	P1	登録時の登録内容確認	「新規登録」ボタンを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で「新規登録」ボタンの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	規格新規入力へ遷移すること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-081	IT-23	登録内容	P1	登録時の登録内容確認	行「編集」を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で行「編集」の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	規格編集へ遷移すること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-082	IT-26	登録内容	P1	登録時の登録内容確認	存在しない商品 IDを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で存在しない商品 IDの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	応答が 404 となる実装確認値とすること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-083	IT-26	登録内容	P1	登録時の登録内容確認	一覧 URL へ POSTを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で一覧 URL へ POSTの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	アクション側は一覧組み立てのみで、本体に相当する一覧用フォーム処理は実装しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-084	IT-26	登録内容	P1	登録時の登録内容確認	表示要素を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で表示要素の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	ウィンドウタイトルはロケールの「商品規格一覧」に相当する翻訳であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-085	IT-26	登録内容	P1	登録時の登録内容確認	画面上の並び順を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で画面上の並び順の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	アクティブ・廃止とも、アルゴリズム順に言語昇順（実体の join 済みオブジェクト昇順として付与されている）、続いてカード状態昇順、続いて規格側の売価列降順、規格側の主キー昇順となる実装確認値となること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-086	IT-26	登録内容	P1	登録時の登録内容確認	在庫数を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で在庫数の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	stock_unlimited が真ならロケールの「無制限」短文であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-087	IT-26	登録内容	P1	登録時の登録内容確認	販売制限数を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で販売制限数の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-088	IT-26	登録内容	P1	登録時の登録内容確認	「新規登録」ヘッダを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-089	IT-26	登録内容	P1	登録時の登録内容確認	商品登録画面上の確認付き規格一覧導線を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-090	IT-26	登録内容	P1	登録時の登録内容確認	トランザクション境界を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
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
