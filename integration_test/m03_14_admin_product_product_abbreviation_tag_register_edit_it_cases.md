# m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m03-14_admin_product_product_abbreviation_tag_register_edit.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、機密情報、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、URL、データなし、フォーム送信、一覧、件数上限、更新抑止、欠損値、画面レイアウト、確認ダイアログ |
| IT-22 | DBとの相関バリデーション、必須バリデーション、文字列長バリデーション、相関バリデーション、部分入力 |
| IT-23 | データ正当性、実行結果、検索条件 |
| IT-26 | 実行結果、更新内容、登録内容 |
| IT-05 | 削除条件、実行結果 |
| IT-02 | 公開コンテンツ、初期行数、表示順 |
| IT-12 | エラー継続、内部情報、画面レイアウト、画面表示データ |
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
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-001	IT-15	CSRF	P1	CSRFの結合確認	削除方式を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で削除方式の確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	同一であること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-002	IT-15	未認証	P1	未認証の結合確認	ナビから略称タグ登録／編集を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でナビから略称タグ登録／編集の確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	上部に登録フォーム、下部に一覧であること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-003	IT-15	対象データ	P1	対象データの結合確認	行の id または名称または「変更」を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で行の id または名称または「変更」の確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	上部フォームが当該行の内容になり、一覧は表示されるであること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-004	IT-20	出力抑止	P1	出力抑止の結合確認	画面下部「登録」を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で画面下部「登録」の確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	フォームに載った名称・並び順・チェックの内容が検証されるであること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-005	IT-20	識別子	P1	識別子の結合確認	表示件数プルダウンを試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で表示件数プルダウンの確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	.js-page-count の変更でクエリのみ付いて再読込であること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-006	IT-15	状態変化	P1	状態変化の結合確認	行の削除（window.confirm 確認ダイアログ経由）を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で行の削除（window.confirm 確認ダイアログ経由）の確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	コアの共通トークン名で CSRF が検証されるであること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-007	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	表示要素を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	menus = ['product', 'storage_code']であること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-008	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	JS 挙動を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でJS 挙動の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	.js-page-count の change でクエリに page_count をセットしてページ全体を読み込み直すであること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-009	IT-25	URL	P2	URLの操作結果確認	モーダル・ポップアップを試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	削除前の確認のみ（削除共通）であること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-010	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	アルファベット順ソートフラグを試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. アルファベット順ソートフラグを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-011	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	登録送信で入力不備があったときを試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 登録送信で入力不備があったとき
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-012	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	CSV 出力・インポートを試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でCSV 出力・インポートの確認に必要な条件を指定する	"1. 対象画面を表示する
2. CSV 出力・インポートを確認する
3. 画面表示と後続状態を確認する"	詳細処理は別であること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-013	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	入力を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 入力
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-014	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	成功時出力を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-015	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	失敗時出力を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-016	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	副作用を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-017	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	mtb_storage_codeを試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. mtb_storage_codeを確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-018	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	登録/更新を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-019	IT-22	部分入力	P2	部分入力の入力検証	名称を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で名称の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 名称を確認する
3. 画面表示と後続状態を確認する"	Symfony NotBlankであること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-020	IT-23	検索条件	P2	検索時の検索条件確認	並び順を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-021	IT-23	検索条件	P2	検索時の検索条件確認	管理画面ログイン済み運用者を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-022	IT-23	検索条件	P2	検索時の検索条件確認	「新規登録へ戻る」リンクを試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-023	IT-23	検索条件	P2	検索時の検索条件確認	「登録」押下後成功または失敗を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-024	IT-23	検索条件	P2	検索時の検索条件確認	「CSV 出力」「CSV に取込」を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-025	IT-23	検索条件	P2	検索時の検索条件確認	削除実行後成功または商品紐づけ失敗を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-026	IT-23	検索条件	P2	検索時の検索条件確認	フォーム入力不備を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-027	IT-23	検索条件	P2	検索時の検索条件確認	DELETE 時に関連商品があるを試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-028	IT-23	検索条件	P2	検索時の検索条件確認	M03-14-MSG-001を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でM03-14-MSG-001の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-029	IT-23	検索条件	P2	検索時の検索条件確認	M03-14-MSG-003を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でM03-14-MSG-003の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-030	IT-23	検索条件	P2	検索時の検索条件確認	M03-14-MSG-004を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でM03-14-MSG-004の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-031	IT-23	検索条件	P2	検索時の検索条件確認	M03-14-MSG-005を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でM03-14-MSG-005の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-032	IT-23	検索条件	P2	検索時の検索条件確認	M03-14-MSG-006を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でM03-14-MSG-006の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-033	IT-23	検索条件	P2	検索時の検索条件確認	M03-14-MSG-007を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でM03-14-MSG-007の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-034	IT-23	実行結果	P2	検索時の実行結果確認	M03-14-MSG-008を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でM03-14-MSG-008の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-035	IT-23	実行結果	P2	検索時の実行結果確認	M03-14-MSG-009を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でM03-14-MSG-009の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-036	IT-23	実行結果	P2	検索時の実行結果確認	M03-14-MSG-010を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でM03-14-MSG-010の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-037	IT-23	実行結果	P2	検索時の実行結果確認	M03-14-MSG-011を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でM03-14-MSG-011の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-038	IT-26	登録内容	P1	登録時の登録内容確認	M03-14-MSG-012を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でM03-14-MSG-012の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-039	IT-26	登録内容	P1	登録時の登録内容確認	GET 一覧または編集を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でGET 一覧または編集の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-040	IT-26	登録内容	P1	登録時の登録内容確認	削除方式を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で削除方式の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-041	IT-26	登録内容	P1	登録時の登録内容確認	ナビから略称タグ登録／編集を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でナビから略称タグ登録／編集の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	上部に登録フォーム、下部に一覧であること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-042	IT-26	登録内容	P1	登録時の登録内容確認	行の id または名称または「変更」を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で行の id または名称または「変更」の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-043	IT-26	登録内容	P1	登録時の登録内容確認	画面下部「登録」を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-044	IT-26	登録内容	P1	登録時の登録内容確認	表示件数プルダウンを試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-045	IT-26	登録内容	P1	登録時の登録内容確認	行の削除（window.confirm 確認ダイアログ経由）を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-046	IT-26	登録内容	P1	登録時の登録内容確認	表示要素を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-047	IT-26	登録内容	P1	登録時の登録内容確認	JS 挙動を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でJS 挙動の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-048	IT-26	実行結果	P1	登録時の実行結果確認	モーダル・ポップアップを試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でモーダル・ポップアップの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-049	IT-23	実行結果	P1	登録時の実行結果確認	アルファベット順ソートフラグを試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でアルファベット順ソートフラグの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	キー storage_code[alphabetSortFlg]であること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-050	IT-26	更新内容	P1	更新時の更新内容確認	登録送信で入力不備があったときを試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で登録送信で入力不備があったときの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-051	IT-26	更新内容	P1	更新時の更新内容確認	CSV 出力・インポートを試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でCSV 出力・インポートの確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-052	IT-26	更新内容	P1	更新時の更新内容確認	入力を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で入力の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-053	IT-26	更新内容	P1	更新時の更新内容確認	成功時出力を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で成功時出力の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	HTML 一覧とフォームもしくはリダイレクトによる再GETであること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-054	IT-26	更新内容	P1	更新時の更新内容確認	失敗時出力を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で失敗時出力の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-055	IT-26	更新内容	P1	更新時の更新内容確認	副作用を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-056	IT-26	更新内容	P1	更新時の更新内容確認	mtb_storage_codeを試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-057	IT-26	更新内容	P1	更新時の更新内容確認	登録/更新を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-058	IT-26	更新内容	P1	更新時の更新内容確認	名称を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で更新内容の対象項目に最小長-1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-059	IT-26	更新内容	P1	更新時の更新内容確認	並び順を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で並び順の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-060	IT-05	実行結果	P1	更新時の実行結果確認	管理画面ログイン済み運用者を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で管理画面ログイン済み運用者の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードの値が変更されること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-061	IT-05	実行結果	P1	更新時の実行結果確認	「新規登録へ戻る」リンクを試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で「新規登録へ戻る」リンクの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	GET …/product/storageであること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-062	IT-05	削除条件	P1	削除時の削除条件確認	「登録」押下後成功または失敗を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	いずれも GET admin_product_storage_code（サイトルート上は /{admin_route}/product/storage）であること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-063	IT-05	削除条件	P1	削除時の削除条件確認	「CSV 出力」「CSV に取込」を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	それぞれ GET …/export と GET …/csvであること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-064	IT-05	削除条件	P1	削除時の削除条件確認	削除実行後成功または商品紐づけ失敗を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	GET …/product/storageであること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-065	IT-05	削除条件	P1	削除時の削除条件確認	フォーム入力不備を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	フラッシュ種別エラー、admin.register.failedであること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-066	IT-05	削除条件	P1	削除時の削除条件確認	DELETE 時に関連商品があるを試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でDELETE 時に関連商品があるの確認に必要な条件を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	削除条件の対象レコードが削除状態にならないこと。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-067	IT-05	実行結果	P1	削除時の実行結果確認	M03-14-MSG-001を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でM03-14-MSG-001の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-068	IT-05	実行結果	P1	削除時の実行結果確認	M03-14-MSG-003を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でM03-14-MSG-003の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	削除対象の略称タグが商品で使用されている（getProducts()>0）とき（admin.storage.delete.failed）であること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-069	IT-05	実行結果	P1	削除時の実行結果確認	M03-14-MSG-004を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でM03-14-MSG-004の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-070	IT-05	実行結果	P1	削除時の実行結果確認	M03-14-MSG-005を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でM03-14-MSG-005の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	CSVインポートフォームがバリデーション不正（checkFormValid() 偽）のときであること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-071	IT-02	初期行数	P2	初期行数の結合確認	M03-14-MSG-006を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でM03-14-MSG-006の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M03-14-MSG-006を確認する
3. 画面表示と後続状態を確認する"	アップロードファイルが取得できない（null）とき（admin.common.csv_invalid_format）であること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-072	IT-02	表示順	P2	表示順の結合確認	M03-14-MSG-007を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でM03-14-MSG-007の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M03-14-MSG-007を確認する
3. 画面表示と後続状態を確認する"	インポートデータ取得に失敗した（$data===false）とき（admin.common.csv_invalid_format）であること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-073	IT-25	更新抑止	P1	更新抑止の結合確認	M03-14-MSG-008を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でM03-14-MSG-008の確認に必要な条件を指定する	"1. 更新抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	CSVヘッダー・データ件数・登録処理中に例外（\Throwable）が発生したときであること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-074	IT-12	内部情報	P1	内部情報の結合確認	M03-14-MSG-009を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でM03-14-MSG-009の確認に必要な条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	CSV登録処理が例外なく完了したとき（admin.register.complete）であること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-075	IT-15	機密情報	P1	機密情報の結合確認	M03-14-MSG-010を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でM03-14-MSG-010の確認に必要な条件を指定する	"1. 機密情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	一覧の「削除」ボタンクリック時（admin.common.delete_modal__message を data-message 経由で表示であること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-076	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	M03-14-MSG-011を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でM03-14-MSG-011の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M03-14-MSG-011を確認する
3. 画面表示と後続状態を確認する"	並び順が0〜32767の範囲外で送信されたとき（Range 制約 notInRangeMessage 直書きリテラル、StorageCodeType.php:48-52）であること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-077	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	M03-14-MSG-012を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でM03-14-MSG-012の確認に必要な条件を指定する	"1. 対象画面を表示する
2. M03-14-MSG-012を確認する
3. 画面表示と後続状態を確認する"	略称タグ一覧の行「削除」ボタンを押下したとき（data-confirm が false でないため共通JSが data-message を confirm に渡すであること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-078	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	GET 一覧または編集を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でGET 一覧または編集の確認に必要な条件を指定する	"1. 対象画面を表示する
2. GET 一覧または編集を確認する
3. 画面表示と後続状態を確認する"	admin.product.storage.page_no と admin.product.storage.page_count が更新もしくは初期化されるであること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-079	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	削除方式を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で削除方式の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 削除方式
3. 画面表示と後続状態を確認する"	同一であること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-080	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	ナビから略称タグ登録／編集を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でナビから略称タグ登録／編集の確認に必要な条件を指定する	"1. 対象画面を表示する
2. ナビから略称タグ登録／編集を確認する
3. 画面表示と後続状態を確認する"	上部に登録フォーム、下部に一覧であること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-081	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	行の id または名称または「変更」を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で行の id または名称または「変更」の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 行の id または名称または「変更」を確認する
3. 画面表示と後続状態を確認する"	上部フォームが当該行の内容になり、一覧は表示されるであること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-082	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	画面下部「登録」を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で画面下部「登録」の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 画面下部「登録」を確認する
3. 画面表示と後続状態を確認する"	フォームに載った名称・並び順・チェックの内容が検証されるであること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-083	IT-25	一覧	P2	一覧の結合確認	表示件数プルダウンを試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で表示件数プルダウンの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示件数プルダウンを確認する
3. 画面表示と後続状態を確認する"	.js-page-count の変更でクエリのみ付いて再読込であること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-084	IT-12	画面表示データ	P2	画面表示データの結合確認	行の削除（window.confirm 確認ダイアログ経由）を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で行の削除（window.confirm 確認ダイアログ経由）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 行の削除（window.confirm 確認ダイアログ経由）
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-085	IT-12	画面表示データ	P2	画面表示データの結合確認	JS 挙動を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でJS 挙動の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-086	IT-25	フォーム送信	P1	フォーム送信の結合確認	アルファベット順ソートフラグを試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でアルファベット順ソートフラグの確認に必要な条件を指定する	"1. 対象画面を表示する
2. アルファベット順ソートフラグを確認する
3. 画面表示と後続状態を確認する"	キー storage_code[alphabetSortFlg]であること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-087	IT-16	ファイル選択	P2	ファイル選択の結合確認	登録送信で入力不備があったときを試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で登録送信で入力不備があったときの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 登録送信で入力不備があったとき
3. 画面表示と後続状態を確認する"	編集中であっても GET …/product/storage へ戻ること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-088	IT-12	エラー継続	P3	エラー継続の結合確認	入力を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で入力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 入力
3. 画面表示と後続状態を確認する"	GET 側はページ番号、表示件数、編集対象の id（任意）、POST はフォーム複数項目とSymfonyフォーム用トークンであること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-089	IT-25	件数上限	P2	件数上限の結合確認	成功時出力を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	HTML 一覧とフォームもしくはリダイレクトによる再GETであること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-090	IT-25	欠損値	P2	欠損値の結合確認	失敗時出力を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	バリデーション失敗でもHTMLは一覧トップ向けのみであること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-091	IT-25	データなし	P2	データなしの結合確認	副作用を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で副作用の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	INSERT もしくは UPDATE により mtb_storage_codeであること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-092	IT-02	公開コンテンツ	P1	公開コンテンツの結合確認	mtb_storage_codeを試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）でmtb_storage_codeの確認に必要な条件を指定する	"1. 対象画面を表示する
2. mtb_storage_codeを確認する
3. 画面表示と後続状態を確認する"	並び順列のユーザー向け表示と、各種並べ替えSQLで参照される（業務的意味の網羅は本書対象外）であること。
m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）	IT-M03-14-ADMIN-PRODUCT-PRODUCT-ABBREVIATION-TAG-REGISTER-EDIT-093	IT-23	データ正当性	P3	データ正当性の結合確認	登録/更新を試験できる状態である	m03-14_admin_product_product_abbreviation_tag_register_edit（商品管理 — 略称タグ登録／編集）（m03_14_admin_product_product_abbreviation_tag_register_edit）で登録/更新の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）であること。
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
| その他 | 同種の対象外観点 2 件は上記分類と同じ理由で対象外 |

> 別枠（非該当ではない）: 本機能に該当するが上限（max_cases）または実行キー重複で今回未収載の結合観点 6件 — No.109, No.110, No.111, No.357, No.359, No.385。上限緩和または個別ケース化で収載可能。
