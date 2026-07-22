# m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m03-11_admin_product_product_category_register_edit.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、フォーム送信、更新抑止、画面レイアウト、画面表示データ、確認ダイアログ |
| IT-22 | DBとの相関バリデーション、必須バリデーション、文字列長バリデーション、相関バリデーション、部分入力 |
| IT-23 | 実行結果、検索条件 |
| IT-26 | 実行結果、更新内容、登録内容 |
| IT-05 | 実行結果 |
| IT-02 | 公開コンテンツ、初期行数、表示順 |
| IT-12 | エラー継続、内部情報、画面レイアウト、画面表示データ |
| IT-07 | 排他制御 |
| IT-16 | ファイル選択 |

## テストケースTSV

以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し（先頭列は `機能名`、**テストレベル列なし**）。**2行目以降**がケース（各10列）。`機能名` 列に元設計の表示名を入れる。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-001	IT-15	CSRF	P1	CSRFの結合確認	英語名・拡張列を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で英語名・拡張列の確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	dtb_category に統合（category_name_en・front_search_hide_flg・branch_hide_flg・banner_image・icon_image・html_ja・html_…であること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-002	IT-15	未認証	P1	未認証の結合確認	新規保存時の並び順キーを試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で新規保存時の並び順キーの確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	dtb_category.sort_no を採番・繰り上げ（実在確認済み）であること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-003	IT-15	対象データ	P1	対象データの結合確認	親を選んだ子一覧を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で親を選んだ子一覧の確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	上部に新規用フォーム（子カテゴリ作成）であること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-004	IT-20	出力抑止	P1	出力抑止の結合確認	行の編集アイコンを試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で行の編集アイコンの確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	上部に編集用フォームであること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-005	IT-20	識別子	P1	識別子の結合確認	子カテゴリ作成の送信を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で子カテゴリ作成の送信の確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	検証と画像処理のあと保存し、成功なら GET …/category/{parent_id} へリダイレクトすること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-006	IT-15	状態変化	P1	状態変化の結合確認	カテゴリ更新の送信を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でカテゴリ更新の送信の確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	検証後保存し、成功なら親がいれば GET …/category/{parent_id}、ルートカテゴリなら GET …/product/category へリダイレクトすること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-007	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	表示要素を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	親がいる一覧もしくは編集モードのとき、カード内にフォームであること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-008	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	JS 挙動を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でJS 挙動の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	新規時のみ、バナー・アイコンそれぞれで file の change、ドロップゾーンの dragover／drop、クリックで隠し file を開く、プレビュー imgであること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-009	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	モーダル・ポップアップを試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-010	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	支店非表示フラグを試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 支店非表示フラグを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-011	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	ルート直下一覧のみ（親 null）を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でルート直下一覧のみ（親 null）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ルート直下一覧のみ（親 null）を確認する
3. 画面表示と後続状態を確認する"	登録フォームカードは出ないこと。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-012	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	成功時出力を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-013	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	失敗時出力を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-014	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	副作用を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-015	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	M03-11-MSG-001を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. M03-11-MSG-001を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-016	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	M03-11-MSG-002を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. M03-11-MSG-002を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-017	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	M03-11-MSG-003を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. M03-11-MSG-003を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-018	IT-22	部分入力	P2	部分入力の入力検証	M03-11-MSG-004を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でM03-11-MSG-004の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M03-11-MSG-004を確認する
3. 画面表示と後続状態を確認する"	DELETE 時に対象カテゴリが DB 上に存在しないとき（CategoryController.php:669-674 deleteMessage() → admin.common.delete_error_alre…であること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-019	IT-23	検索条件	P2	検索時の検索条件確認	M03-11-MSG-007を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-020	IT-23	検索条件	P2	検索時の検索条件確認	M03-11-MSG-008を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-021	IT-23	検索条件	P2	検索時の検索条件確認	M03-11-MSG-009を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-022	IT-23	検索条件	P2	検索時の検索条件確認	M03-11-MSG-010を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-023	IT-23	検索条件	P2	検索時の検索条件確認	dtb_categoryを試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-024	IT-23	検索条件	P2	検索時の検索条件確認	登録/更新を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-025	IT-23	検索条件	P2	検索時の検索条件確認	新規保存成功を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-026	IT-23	検索条件	P2	検索時の検索条件確認	更新保存成功かつ親ありを試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-027	IT-23	検索条件	P2	検索時の検索条件確認	更新保存成功かつ親なしを試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で更新保存成功かつ親なしの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-028	IT-23	検索条件	P2	検索時の検索条件確認	検証失敗・画像失敗を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で検証失敗・画像失敗の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-029	IT-23	検索条件	P2	検索時の検索条件確認	Symfony フォーム検証を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でSymfony フォーム検証の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-030	IT-23	検索条件	P2	検索時の検索条件確認	画像アップロードまたはディレクトリ作成失敗を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で画像アップロードまたはディレクトリ作成失敗の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-031	IT-23	検索条件	P2	検索時の検索条件確認	保存開始・完了を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で保存開始・完了の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-032	IT-23	検索条件	P2	検索時の検索条件確認	英語名・拡張列を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で英語名・拡張列の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-033	IT-23	実行結果	P2	検索時の実行結果確認	新規保存時の並び順キーを試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で新規保存時の並び順キーの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-034	IT-23	実行結果	P2	検索時の実行結果確認	親を選んだ子一覧を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で親を選んだ子一覧の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-035	IT-23	実行結果	P2	検索時の実行結果確認	行の編集アイコンを試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で行の編集アイコンの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-036	IT-23	実行結果	P2	検索時の実行結果確認	子カテゴリ作成の送信を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で子カテゴリ作成の送信の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-037	IT-26	登録内容	P1	登録時の登録内容確認	カテゴリ更新の送信を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でカテゴリ更新の送信の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-038	IT-26	登録内容	P1	登録時の登録内容確認	表示要素を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で表示要素の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-039	IT-26	登録内容	P1	登録時の登録内容確認	JS 挙動を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でJS 挙動の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-040	IT-26	登録内容	P1	登録時の登録内容確認	モーダル・ポップアップを試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録・編集フォーム自体はモーダルにしないこと。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-041	IT-26	登録内容	P1	登録時の登録内容確認	支店非表示フラグを試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で支店非表示フラグの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-042	IT-26	登録内容	P1	登録時の登録内容確認	ルート直下一覧のみ（親 null）を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-043	IT-26	登録内容	P1	登録時の登録内容確認	成功時出力を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-044	IT-26	登録内容	P1	登録時の登録内容確認	失敗時出力を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-045	IT-26	登録内容	P1	登録時の登録内容確認	副作用を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-046	IT-26	登録内容	P1	登録時の登録内容確認	M03-11-MSG-001を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でM03-11-MSG-001の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-047	IT-26	実行結果	P1	登録時の実行結果確認	M03-11-MSG-002を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でM03-11-MSG-002の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-048	IT-23	実行結果	P1	登録時の実行結果確認	M03-11-MSG-003を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でM03-11-MSG-003の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	カテゴリ削除処理の try 節で例外（\Exception）を捕捉したとき（CategoryController.php:700 admin.common.delete_error_foreign_key）であること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-049	IT-26	更新内容	P1	更新時の更新内容確認	M03-11-MSG-004を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でM03-11-MSG-004の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-050	IT-26	更新内容	P1	更新時の更新内容確認	M03-11-MSG-007を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でM03-11-MSG-007の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-051	IT-26	更新内容	P1	更新時の更新内容確認	M03-11-MSG-008を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でM03-11-MSG-008の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-052	IT-26	更新内容	P1	更新時の更新内容確認	M03-11-MSG-009を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でM03-11-MSG-009の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	バナー／アイコン画像がフォーム経由で破損検出されたとき（CategoryType.php:84 form_error.category_image_corrupted）であること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-053	IT-26	更新内容	P1	更新時の更新内容確認	M03-11-MSG-010を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でM03-11-MSG-010の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-054	IT-26	更新内容	P1	更新時の更新内容確認	dtb_categoryを試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-055	IT-26	更新内容	P1	更新時の更新内容確認	登録/更新を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-056	IT-26	更新内容	P1	更新時の更新内容確認	新規保存成功を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-057	IT-26	更新内容	P1	更新時の更新内容確認	更新保存成功かつ親ありを試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で更新内容の対象項目に最小長-1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-058	IT-26	更新内容	P1	更新時の更新内容確認	更新保存成功かつ親なしを試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で更新保存成功かつ親なしの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-059	IT-05	実行結果	P1	更新時の実行結果確認	検証失敗・画像失敗を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で検証失敗・画像失敗の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードの値が変更されること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-060	IT-05	実行結果	P1	更新時の実行結果確認	Symfony フォーム検証を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でSymfony フォーム検証の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	同一 Twig 200、フィールドエラー表示であること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-061	IT-02	初期行数	P2	初期行数の結合確認	画像アップロードまたはディレクトリ作成失敗を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で画像アップロードまたはディレクトリ作成失敗の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 画像アップロードまたはディレクトリ作成失敗
3. 画面表示と後続状態を確認する"	共通アップロードエラー文言を該当フィールドもしくはフォームに付与であること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-062	IT-02	表示順	P2	表示順の結合確認	保存開始・完了を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で保存開始・完了の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 保存開始・完了
3. 画面表示と後続状態を確認する"	日本語短文とカテゴリ id（完了時）であること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-063	IT-25	更新抑止	P1	更新抑止の結合確認	英語名・拡張列を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で英語名・拡張列の確認に必要な条件を指定する	"1. 更新抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	dtb_category に統合（category_name_en・front_search_hide_flg・branch_hide_flg・banner_image・icon_image・html_ja・html_…であること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-064	IT-12	内部情報	P1	内部情報の結合確認	新規保存時の並び順キーを試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で新規保存時の並び順キーの確認に必要な条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	dtb_category.sort_no を採番・繰り上げ（実在確認済み）であること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-065	IT-07	排他制御	P1	排他制御の結合確認	親を選んだ子一覧を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で親を選んだ子一覧の確認に必要な条件を指定する	"1. 排他制御の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	上部に新規用フォーム（子カテゴリ作成）であること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-066	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	行の編集アイコンを試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で行の編集アイコンの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 行の編集アイコンを確認する
3. 画面表示と後続状態を確認する"	上部に編集用フォームであること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-067	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	子カテゴリ作成の送信を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で子カテゴリ作成の送信の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 子カテゴリ作成の送信
3. 画面表示と後続状態を確認する"	検証と画像処理のあと保存し、成功なら GET …/category/{parent_id} へリダイレクトすること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-068	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	カテゴリ更新の送信を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でカテゴリ更新の送信の確認に必要な条件を指定する	"1. 対象画面を表示する
2. カテゴリ更新の送信
3. 画面表示と後続状態を確認する"	検証後保存し、成功なら親がいれば GET …/category/{parent_id}、ルートカテゴリなら GET …/product/category へリダイレクトすること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-069	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	モーダル・ポップアップを試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	登録・編集フォーム自体はモーダルにしないこと。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-070	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	支店非表示フラグを試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で支店非表示フラグの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 支店非表示フラグを確認する
3. 画面表示と後続状態を確認する"	dtb_category.branch_hide_flgであること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-071	IT-12	画面表示データ	P2	画面表示データの結合確認	成功時出力を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-072	IT-25	画面表示データ	P2	画面表示データの結合確認	失敗時出力を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	検証失敗や画像失敗は 200 で同一 Twigであること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-073	IT-12	画面表示データ	P2	画面表示データの結合確認	副作用を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）で副作用の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-074	IT-25	画面表示データ	P2	画面表示データの結合確認	M03-11-MSG-001を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でM03-11-MSG-001の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M03-11-MSG-001を確認する
3. 画面表示と後続状態を確認する"	カテゴリ作成/更新フォームが送信・妥当で保存処理が正常完了したとき（成功後、親があれば親配下、なければ一覧へリダイレクト）であること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-075	IT-25	フォーム送信	P1	フォーム送信の結合確認	M03-11-MSG-002を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でM03-11-MSG-002の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M03-11-MSG-002を確認する
3. 画面表示と後続状態を確認する"	対象カテゴリが存在し DELETE …/category/{id}/delete の削除処理が正常終了したとき（成功後、親があれば親配下、なければ一覧へリダイレクト）であること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-076	IT-16	ファイル選択	P2	ファイル選択の結合確認	M03-11-MSG-003を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でM03-11-MSG-003の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M03-11-MSG-003を確認する
3. 画面表示と後続状態を確認する"	カテゴリ削除処理の try 節で例外（\Exception）を捕捉したとき（CategoryController.php:700 admin.common.delete_error_foreign_key）であること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-077	IT-12	エラー継続	P3	エラー継続の結合確認	M03-11-MSG-007を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でM03-11-MSG-007の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M03-11-MSG-007を確認する
3. 画面表示と後続状態を確認する"	バナー／アイコン画像がフォーム経由で MIME 不一致のとき（CategoryType.php:81 form_error.category_image_invalid_mime）であること。
m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）	IT-M03-11-ADMIN-PRODUCT-PRODUCT-CATEGORY-REGISTER-EDIT-078	IT-02	公開コンテンツ	P1	公開コンテンツの結合確認	M03-11-MSG-008を試験できる状態である	m03-11_admin_product_product_category_register_edit（管理画面_商品管理_カテゴリ登録・編集）（m03_11_admin_product_product_category_register_edit）でM03-11-MSG-008の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M03-11-MSG-008を確認する
3. 画面表示と後続状態を確認する"	バナー／アイコン画像がフォーム経由で 10M 超過のとき（CategoryType.php:82 form_error.category_image_too_large）であること。
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

> 別枠（非該当ではない）: 本機能に該当するが上限（max_cases）または実行キー重複で今回未収載の結合観点 11件 — No.109, No.111, No.333, No.334, No.346, No.385, No.412, No.413, No.414, No.415, No.510。上限緩和または個別ケース化で収載可能。
