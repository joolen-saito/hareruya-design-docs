# m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m03-08_admin_product_product_product_class_list.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、一覧、更新抑止、画面レイアウト、画面表示データ、確認ダイアログ |
| IT-22 | DBとの相関バリデーション、必須バリデーション、文字列長バリデーション、相関バリデーション、部分入力 |
| IT-23 | 実行結果、検索条件 |
| IT-26 | 実行結果、更新内容、登録内容 |
| IT-05 | 実行結果 |
| IT-02 | 初期行数、表示順 |
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
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-007	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	一覧 URL へ POSTを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で一覧 URL へ POSTの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧 URL へ POSTを確認する
3. 画面表示と後続状態を確認する"	アクション側は一覧組み立てのみで、本体に相当する一覧用フォーム処理は実装しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-008	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	表示要素を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	ウィンドウタイトルはロケールの「商品規格一覧」に相当する翻訳であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-009	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	画面上の並び順を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 画面上の並び順を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-010	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	在庫数を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 在庫数を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-011	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	販売制限数を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で販売制限数の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 販売制限数を確認する
3. 画面表示と後続状態を確認する"	設定があれば数値として表示するが、 Twig は偽評価のとき空文字となること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-012	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	「新規登録」ヘッダを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 「新規登録」ヘッダを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-013	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	商品登録画面上の確認付き規格一覧導線を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 商品登録画面上の確認付き規格一覧導線を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-014	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	M03-08-MSG-001を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. M03-08-MSG-001を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-015	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	M03-08-MSG-002を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. M03-08-MSG-002を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-016	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	M03-08-MSG-003を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. M03-08-MSG-003を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-017	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	M03-08-MSG-004を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. M03-08-MSG-004を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-018	IT-22	部分入力	P2	部分入力の入力検証	M03-08-MSG-005を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でM03-08-MSG-005の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M03-08-MSG-005を確認する
3. 画面表示と後続状態を確認する"	更新処理 ProductClassUpdateAction::handle() が任意の例外を送出したとき（表示文言は $e->getMessage() 由来で可変・固定不能であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-019	IT-23	検索条件	P2	検索時の検索条件確認	M03-08-MSG-006を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-020	IT-23	検索条件	P2	検索時の検索条件確認	M03-08-MSG-007を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-021	IT-23	検索条件	P2	検索時の検索条件確認	M03-08-MSG-008を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-022	IT-23	検索条件	P2	検索時の検索条件確認	M03-08-MSG-009を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-023	IT-23	検索条件	P2	検索時の検索条件確認	M03-08-MSG-010を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-024	IT-23	検索条件	P2	検索時の検索条件確認	M03-08-MSG-011を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-025	IT-23	検索条件	P2	検索時の検索条件確認	M03-08-MSG-012を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-026	IT-23	検索条件	P2	検索時の検索条件確認	M03-08-MSG-013を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-027	IT-23	検索条件	P2	検索時の検索条件確認	M03-08-MSG-014を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でM03-08-MSG-014の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-028	IT-23	検索条件	P2	検索時の検索条件確認	M03-08-MSG-015を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でM03-08-MSG-015の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-029	IT-23	検索条件	P2	検索時の検索条件確認	M03-08-MSG-016を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でM03-08-MSG-016の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-030	IT-23	検索条件	P2	検索時の検索条件確認	M03-08-MSG-017を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でM03-08-MSG-017の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-031	IT-23	検索条件	P2	検索時の検索条件確認	M03-08-MSG-018を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でM03-08-MSG-018の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-032	IT-23	検索条件	P2	検索時の検索条件確認	M03-08-MSG-019を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でM03-08-MSG-019の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-033	IT-23	実行結果	P2	検索時の実行結果確認	トランザクション境界を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でトランザクション境界の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-034	IT-23	実行結果	P2	検索時の実行結果確認	ロックを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でロックの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-035	IT-23	実行結果	P2	検索時の実行結果確認	例外時を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で例外時の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-036	IT-23	実行結果	P2	検索時の実行結果確認	言語・カード状態の参照を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で言語・カード状態の参照の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-037	IT-26	登録内容	P1	登録時の登録内容確認	商品編集サイドなどから規格一覧を開く（確認ダイアログ経由など）を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で商品編集サイドなどから規格一覧を開く（確認ダイアログ経由など）の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-038	IT-26	登録内容	P1	登録時の登録内容確認	return_product_list を付与して開くを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でreturn_product_list を付与して開くの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-039	IT-26	登録内容	P1	登録時の登録内容確認	「新規登録」ボタンを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で「新規登録」ボタンの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-040	IT-26	登録内容	P1	登録時の登録内容確認	行「編集」を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で行「編集」の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	規格編集へ遷移すること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-041	IT-26	登録内容	P1	登録時の登録内容確認	存在しない商品 IDを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で存在しない商品 IDの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-042	IT-26	登録内容	P1	登録時の登録内容確認	一覧 URL へ POSTを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-043	IT-26	登録内容	P1	登録時の登録内容確認	表示要素を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-044	IT-26	登録内容	P1	登録時の登録内容確認	画面上の並び順を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-045	IT-26	登録内容	P1	登録時の登録内容確認	在庫数を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-046	IT-26	登録内容	P1	登録時の登録内容確認	販売制限数を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で販売制限数の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-047	IT-26	実行結果	P1	登録時の実行結果確認	「新規登録」ヘッダを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で「新規登録」ヘッダの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-048	IT-23	実行結果	P1	登録時の実行結果確認	商品登録画面上の確認付き規格一覧導線を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で商品登録画面上の確認付き規格一覧導線の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	GET …/product/product/class/{id} と同じルート名で id を渡す確認付きリンク（テンプレートは未保存のときの id 取り回し規則に従う）であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-049	IT-26	更新内容	P1	更新時の更新内容確認	M03-08-MSG-001を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でM03-08-MSG-001の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-050	IT-26	更新内容	P1	更新時の更新内容確認	M03-08-MSG-002を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でM03-08-MSG-002の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-051	IT-26	更新内容	P1	更新時の更新内容確認	M03-08-MSG-003を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でM03-08-MSG-003の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-052	IT-26	更新内容	P1	更新時の更新内容確認	M03-08-MSG-004を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でM03-08-MSG-004の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	編集フォームが未送信もしくはバリデーション不正のとき（編集フォームを再描画）であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-053	IT-26	更新内容	P1	更新時の更新内容確認	M03-08-MSG-005を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でM03-08-MSG-005の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-054	IT-26	更新内容	P1	更新時の更新内容確認	M03-08-MSG-006を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-055	IT-26	更新内容	P1	更新時の更新内容確認	M03-08-MSG-007を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-056	IT-26	更新内容	P1	更新時の更新内容確認	M03-08-MSG-008を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-057	IT-26	更新内容	P1	更新時の更新内容確認	M03-08-MSG-009を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で更新内容の対象項目に最小長-1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-058	IT-26	更新内容	P1	更新時の更新内容確認	M03-08-MSG-010を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でM03-08-MSG-010の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-059	IT-05	実行結果	P1	更新時の実行結果確認	M03-08-MSG-011を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でM03-08-MSG-011の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードの値が変更されること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-060	IT-05	実行結果	P1	更新時の実行結果確認	M03-08-MSG-012を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でM03-08-MSG-012の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	要ソース確認であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-061	IT-02	初期行数	P2	初期行数の結合確認	M03-08-MSG-013を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でM03-08-MSG-013の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M03-08-MSG-013を確認する
3. 画面表示と後続状態を確認する"	要ソース確認であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-062	IT-02	表示順	P2	表示順の結合確認	M03-08-MSG-014を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でM03-08-MSG-014の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M03-08-MSG-014を確認する
3. 画面表示と後続状態を確認する"	要ソース確認であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-063	IT-25	更新抑止	P1	更新抑止の結合確認	M03-08-MSG-015を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でM03-08-MSG-015の確認に必要な条件を指定する	"1. 更新抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	要ソース確認であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-064	IT-12	内部情報	P1	内部情報の結合確認	M03-08-MSG-016を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でM03-08-MSG-016の確認に必要な条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	要ソース確認であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-065	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	M03-08-MSG-017を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でM03-08-MSG-017の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M03-08-MSG-017を確認する
3. 画面表示と後続状態を確認する"	要ソース確認であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-066	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	M03-08-MSG-018を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でM03-08-MSG-018の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M03-08-MSG-018を確認する
3. 画面表示と後続状態を確認する"	要ソース確認であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-067	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	M03-08-MSG-019を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でM03-08-MSG-019の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M03-08-MSG-019を確認する
3. 画面表示と後続状態を確認する"	要ソース確認であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-068	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	トランザクション境界を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でトランザクション境界の確認に必要な条件を指定する	"1. 対象画面を表示する
2. トランザクション境界を確認する
3. 画面表示と後続状態を確認する"	本機能は参照・出力を主とし、業務データ更新用の明示トランザクションを開始しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-069	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	ロックを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でロックの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ロックを確認する
3. 画面表示と後続状態を確認する"	行ロック・悲観ロック・楽観ロック・ロックファイルを使用しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-070	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	例外時を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で例外時の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 例外時を確認する
3. 画面表示と後続状態を確認する"	出力もしくは表示処理中に例外が発生した場合、未送信の出力は完了しないこと。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-071	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	言語・カード状態の参照を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で言語・カード状態の参照の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 言語・カード状態の参照を確認する
3. 画面表示と後続状態を確認する"	dtb_product_class の language_id・card_condition_id に統合（補助表は廃止であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-072	IT-25	一覧	P2	一覧の結合確認	商品編集サイドなどから規格一覧を開く（確認ダイアログ経由など）を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で商品編集サイドなどから規格一覧を開く（確認ダイアログ経由など）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 商品編集サイドなどから規格一覧を開く（確認ダイアログ経由など）
3. 画面表示と後続状態を確認する"	ヘッダに商品名であること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-073	IT-12	画面表示データ	P2	画面表示データの結合確認	return_product_list を付与して開くを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）でreturn_product_list を付与して開くの確認に必要な条件を指定する	"1. 対象画面を表示する
2. return_product_list を付与して開く
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-074	IT-25	画面表示データ	P2	画面表示データの結合確認	「新規登録」ボタンを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で「新規登録」ボタンの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 「新規登録」ボタンを確認する
3. 画面表示と後続状態を確認する"	規格新規入力へ遷移すること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-075	IT-12	画面表示データ	P2	画面表示データの結合確認	行「編集」を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で行「編集」の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 行「編集」を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-076	IT-25	画面表示データ	P2	画面表示データの結合確認	存在しない商品 IDを試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で存在しない商品 IDの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 存在しない商品 IDを確認する
3. 画面表示と後続状態を確認する"	応答が 404 となる実装確認値とすること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-077	IT-12	非同期更新	P1	非同期更新の結合確認	画面上の並び順を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で画面上の並び順の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 画面上の並び順を確認する
3. 画面表示と後続状態を確認する"	アクティブ・廃止とも、アルゴリズム順に言語昇順（実体の join 済みオブジェクト昇順として付与されている）、続いてカード状態昇順、続いて規格側の売価列降順、規格側の主キー昇順となる実装確認値となること。
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-078	IT-12	エラー継続	P3	エラー継続の結合確認	在庫数を試験できる状態である	m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）（m03_08_admin_product_product_product_class_list）で在庫数の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 在庫数を確認する
3. 画面表示と後続状態を確認する"	stock_unlimited が真ならロケールの「無制限」短文であること。
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
| データベースアクセス / DB操作 / 削除（IT-05） | 本機能に削除処理がないため |
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
| その他 | 同種の対象外観点 4 件は上記分類と同じ理由で対象外 |

> 別枠（非該当ではない）: 本機能に該当するが上限（max_cases）または実行キー重複で今回未収載の結合観点 11件 — No.109, No.110, No.111, No.381, No.382, No.412, No.413, No.414, No.415, No.416, No.510。上限緩和または個別ケース化で収載可能。
