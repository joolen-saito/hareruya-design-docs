# m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m03-10_admin_product_product_bulk_buy_standard_price_edit.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-15 | CSRF、対象データ、未認証、機密情報、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、URL、フォーム送信、一覧、更新抑止、画面レイアウト、画面表示データ、確認ダイアログ |
| IT-22 | DBとの相関バリデーション、必須バリデーション、文字列長バリデーション、相関バリデーション、部分入力 |
| IT-23 | 実行結果、検索条件 |
| IT-26 | 実行結果、更新内容、登録内容 |
| IT-05 | 削除条件、実行結果 |
| IT-02 | 初期行数、表示順 |
| IT-12 | 内部情報、画面レイアウト、画面表示データ |
| IT-07 | 排他制御 |
| IT-06 | ロールバック |

## テストケースTSV

以下はタブ区切りで、実質はExcelのCSVと同様に、改行や`"`を含むセルはダブルクォートで囲む。

**1行目**が列見出し（先頭列は `機能名`、**テストレベル列なし**）。**2行目以降**がケース（各10列）。`機能名` 列に元設計の表示名を入れる。`テストID`で一意に識別する。優先度は **P1／P2／P3**。

Excel／Googleスプレッドシートへはコードフェンス内を A1 に貼り付ける。

前提条件・入力データ・操作手順など、**期待結果以外**の列で複数項目がある場合は、同一セル内でLF改行する。

**期待結果／レスポンスは1行1判定**とする。複数の期待がある場合は行を分割し、**テスト項目名は当該行の判定内容が分かるよう具体化**する。

`前提条件`、`入力データ/リクエスト内容`、`操作手順/実行方法`、`期待結果／レスポンス` が同一になる行は重複テストとして出力しない。

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-001	IT-15	CSRF	P1	CSRFの結合確認	買取価格を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で買取価格の確認に必要な条件を指定する	"1. CSRFの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	dtb_product_class.buy_price に統合（実在確認済み）であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-002	IT-15	未認証	P1	未認証の結合確認	商品一覧で商品にチェックし「買取・基準価格一括編集」相当のボタンを押すを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で商品一覧で商品にチェックし「買取・基準価格一括編集」相当のボタンを押すの確認に必要な条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	選択商品について編集表が開くこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-003	IT-15	対象データ	P1	対象データの結合確認	編集画面をブックマーク相当で開くを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で編集画面をブックマーク相当で開くの確認に必要な条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	同上であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-004	IT-20	出力抑止	P1	出力抑止の結合確認	ids を付けずに編集 URL へ入るを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でids を付けずに編集 URL へ入るの確認に必要な条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	エラーフラッシュのうえ、セッションの eccube.admin.product.search.page_no を使って GET /{admin_route}/product/page/{page_no} へリダイレクト…であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-005	IT-20	識別子	P1	識別子の結合確認	「登録」で確定を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で「登録」で確定の確認に必要な条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	検証成功時は更新後、セッションのページ番号と resume=1 付きで一覧へリダイレクトすること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-006	IT-15	状態変化	P1	状態変化の結合確認	「商品一覧」リンクを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で「商品一覧」リンクの確認に必要な条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	セッションの eccube.admin.product.search.page_no（無ければ 1）へ遷移であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-007	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	表示要素を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	メニューは product と product_editであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-008	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	JS 挙動を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でJS 挙動の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	.js-buy-price と .js-base-price（NM 基準価格）の入力で価格比率を再計算であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-009	IT-25	URL	P2	URLの操作結果確認	買取価格(NM)を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で買取価格(NM)の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 買取価格(NM)を確認する
3. 画面表示と後続状態を確認する"	保存時は上記ルールで全通常規格の dtb_product_class.buy_price を再計算・更新であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-010	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	基準価格 (NM)を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 基準価格 (NM)を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-011	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	基準価格 (SP)を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 基準価格 (SP)を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-012	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	商品 ID（表示兼隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で商品 ID（表示兼隠し）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 商品 ID（表示兼隠し）を確認する
3. 画面表示と後続状態を確認する"	…[product_id]であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-013	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	NM 規格 ID（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. NM 規格 ID（隠し）を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-014	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	SP / MP / HP 規格 ID（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. SP / MP / HP 規格 ID（隠し）を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-015	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	状態ステータス（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 状態ステータス（隠し）を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-016	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	割引率（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 割引率（隠し）を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-017	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	販売価格（NM）（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 販売価格（NM）（隠し）を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-018	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	複数行送信の途中で例外を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 複数行送信の途中で例外
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-019	IT-22	部分入力	P2	部分入力の入力検証	NM 規格が無い商品・言語を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でNM 規格が無い商品・言語の確認に必要な条件を指定する	"1. 対象画面を表示する
2. NM 規格が無い商品・言語を確認する
3. 画面表示と後続状態を確認する"	product_class_id_nm が 0 となり保存スキップであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-020	IT-23	検索条件	P2	検索時の検索条件確認	一覧との表示差を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-021	IT-23	検索条件	P2	検索時の検索条件確認	販売価格を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-022	IT-23	検索条件	P2	検索時の検索条件確認	成功時出力を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-023	IT-23	検索条件	P2	検索時の検索条件確認	失敗時出力を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-024	IT-23	検索条件	P2	検索時の検索条件確認	dtb_product_classを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-025	IT-23	検索条件	P2	検索時の検索条件確認	登録/更新を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-026	IT-23	検索条件	P2	検索時の検索条件確認	買取 vs 販売（NM）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-027	IT-23	検索条件	P2	検索時の検索条件確認	確定成功を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-028	IT-23	検索条件	P2	検索時の検索条件確認	フォーム検証失敗を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でフォーム検証失敗の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-029	IT-23	検索条件	P2	検索時の検索条件確認	規格 ID 不正・削除済みを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で規格 ID 不正・削除済みの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-030	IT-23	検索条件	P2	検索時の検索条件確認	買取がマスタに無い（条件を満たす低額帯）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で買取がマスタに無い（条件を満たす低額帯）の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-031	IT-23	検索条件	P2	検索時の検索条件確認	フラッシュを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でフラッシュの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-032	IT-23	検索条件	P2	検索時の検索条件確認	監査ログ専用出力を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で監査ログ専用出力の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-033	IT-23	検索条件	P2	検索時の検索条件確認	トランザクション境界を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でトランザクション境界の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-034	IT-23	実行結果	P2	検索時の実行結果確認	ロックを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でロックの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-035	IT-23	実行結果	P2	検索時の実行結果確認	買取価格を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で買取価格の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-036	IT-23	実行結果	P2	検索時の実行結果確認	商品一覧で商品にチェックし「買取・基準価格一括編集」相当のボタンを押すを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で商品一覧で商品にチェックし「買取・基準価格一括編集」相当のボタンを押すの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-037	IT-23	実行結果	P2	検索時の実行結果確認	編集画面をブックマーク相当で開くを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で編集画面をブックマーク相当で開くの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-038	IT-26	登録内容	P1	登録時の登録内容確認	ids を付けずに編集 URL へ入るを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でids を付けずに編集 URL へ入るの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-039	IT-26	登録内容	P1	登録時の登録内容確認	「登録」で確定を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で「登録」で確定の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-040	IT-26	登録内容	P1	登録時の登録内容確認	「商品一覧」リンクを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で「商品一覧」リンクの確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-041	IT-26	登録内容	P1	登録時の登録内容確認	表示要素を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で表示要素の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	メニューは product と product_editであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-042	IT-26	登録内容	P1	登録時の登録内容確認	JS 挙動を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でJS 挙動の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-043	IT-26	登録内容	P1	登録時の登録内容確認	買取価格(NM)を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-044	IT-26	登録内容	P1	登録時の登録内容確認	基準価格 (NM)を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-045	IT-26	登録内容	P1	登録時の登録内容確認	基準価格 (SP)を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-046	IT-26	登録内容	P1	登録時の登録内容確認	商品 ID（表示兼隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-047	IT-26	登録内容	P1	登録時の登録内容確認	NM 規格 ID（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でNM 規格 ID（隠し）の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-048	IT-26	実行結果	P1	登録時の実行結果確認	SP / MP / HP 規格 ID（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でSP / MP / HP 規格 ID（隠し）の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-049	IT-23	実行結果	P1	登録時の実行結果確認	状態ステータス（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で状態ステータス（隠し）の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	テンプレートで廃止時の空白表示に使うこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-050	IT-26	更新内容	P1	更新時の更新内容確認	割引率（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で割引率（隠し）の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-051	IT-26	更新内容	P1	更新時の更新内容確認	販売価格（NM）（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で販売価格（NM）（隠し）の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-052	IT-26	更新内容	P1	更新時の更新内容確認	複数行送信の途中で例外を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で複数行送信の途中で例外の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-053	IT-26	更新内容	P1	更新時の更新内容確認	NM 規格が無い商品・言語を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でNM 規格が無い商品・言語の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	product_class_id_nm が 0 となり保存スキップであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-054	IT-26	更新内容	P1	更新時の更新内容確認	一覧との表示差を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で一覧との表示差の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-055	IT-26	更新内容	P1	更新時の更新内容確認	販売価格を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-056	IT-26	更新内容	P1	更新時の更新内容確認	成功時出力を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-057	IT-26	更新内容	P1	更新時の更新内容確認	失敗時出力を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-058	IT-26	更新内容	P1	更新時の更新内容確認	dtb_product_classを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で更新内容の対象項目に最小長-1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-059	IT-26	更新内容	P1	更新時の更新内容確認	登録/更新を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で登録/更新の確認に必要な条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-060	IT-05	実行結果	P1	更新時の実行結果確認	買取 vs 販売（NM）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で買取 vs 販売（NM）の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードの値が変更されること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-061	IT-05	実行結果	P1	更新時の実行結果確認	確定成功を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で確定成功の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	一覧はセッションのページ番号と resume で再検索表示であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-062	IT-05	削除条件	P1	削除時の削除条件確認	フォーム検証失敗を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	編集画面再表示＋エラーメッセージであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-063	IT-05	削除条件	P1	削除時の削除条件確認	規格 ID 不正・削除済みを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	編集画面再表示＋ admin.product.to_show_completeであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-064	IT-05	削除条件	P1	削除時の削除条件確認	買取がマスタに無い（条件を満たす低額帯）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で削除条件で対象条件に該当する値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	編集画面再表示＋ admin.product.not_found_nm_priceであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-065	IT-05	削除条件	P1	削除時の削除条件確認	フラッシュを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で削除条件で対象条件に該当しない値を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	成功・エラー・警告メッセージであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-066	IT-05	削除条件	P1	削除時の削除条件確認	監査ログ専用出力を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で監査ログ専用出力の確認に必要な条件を指定する	"1. 削除条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	削除条件の対象レコードが削除状態にならないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-067	IT-05	実行結果	P1	削除時の実行結果確認	トランザクション境界を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でトランザクション境界の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-068	IT-05	実行結果	P1	削除時の実行結果確認	ロックを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でロックの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	対象規格への行ロック・悲観ロック・楽観ロック・ロックファイルは使用しないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-069	IT-05	実行結果	P1	削除時の実行結果確認	買取価格を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で買取価格の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが削除状態になること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-070	IT-05	実行結果	P1	削除時の実行結果確認	商品一覧で商品にチェックし「買取・基準価格一括編集」相当のボタンを押すを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で商品一覧で商品にチェックし「買取・基準価格一括編集」相当のボタンを押すの確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	選択商品について編集表が開くこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-071	IT-02	初期行数	P2	初期行数の結合確認	編集画面をブックマーク相当で開くを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で編集画面をブックマーク相当で開くの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 編集画面をブックマーク相当で開く
3. 画面表示と後続状態を確認する"	同上であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-072	IT-02	表示順	P2	表示順の結合確認	ids を付けずに編集 URL へ入るを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でids を付けずに編集 URL へ入るの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ids を付けずに編集 URL へ入るを確認する
3. 画面表示と後続状態を確認する"	エラーフラッシュのうえ、セッションの eccube.admin.product.search.page_no を使って GET /{admin_route}/product/page/{page_no} へリダイレクト…であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-073	IT-25	更新抑止	P1	更新抑止の結合確認	「登録」で確定を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で「登録」で確定の確認に必要な条件を指定する	"1. 更新抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	検証成功時は更新後、セッションのページ番号と resume=1 付きで一覧へリダイレクトすること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-074	IT-12	内部情報	P1	内部情報の結合確認	「商品一覧」リンクを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で「商品一覧」リンクの確認に必要な条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	セッションの eccube.admin.product.search.page_no（無ければ 1）へ遷移であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-075	IT-15	機密情報	P1	機密情報の結合確認	表示要素を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で表示要素の確認に必要な条件を指定する	"1. 機密情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	メニューは product と product_editであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-076	IT-07	排他制御	P1	排他制御の結合確認	JS 挙動を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でJS 挙動の確認に必要な条件を指定する	"1. 排他制御の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	.js-buy-price と .js-base-price（NM 基準価格）の入力で価格比率を再計算であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-077	IT-07	排他制御	P1	排他制御の結合確認	買取価格(NM)を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で買取価格(NM)の確認に必要な条件を指定する	"1. 排他制御の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	保存時は上記ルールで全通常規格の dtb_product_class.buy_price を再計算・更新であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-078	IT-06	ロールバック	P3	ロールバックの結合確認	基準価格 (NM)を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で基準価格 (NM)の確認に必要な条件を指定する	"1. ロールバックの対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	dtb_product_class.standard_price を対象規格すべて同一値で更新であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-079	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	基準価格 (SP)を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で基準価格 (SP)の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 基準価格 (SP)を確認する
3. 画面表示と後続状態を確認する"	POST 値は読み取り専用であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-080	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	NM 規格 ID（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でNM 規格 ID（隠し）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. NM 規格 ID（隠し）を確認する
3. 画面表示と後続状態を確認する"	…[product_class_id_nm]であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-081	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	SP / MP / HP 規格 ID（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でSP / MP / HP 規格 ID（隠し）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. SP / MP / HP 規格 ID（隠し）を確認する
3. 画面表示と後続状態を確認する"	テンプレートの有無判定に使うこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-082	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	状態ステータス（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で状態ステータス（隠し）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 状態ステータス（隠し）を確認する
3. 画面表示と後続状態を確認する"	テンプレートで廃止時の空白表示に使うこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-083	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	割引率（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で割引率（隠し）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 割引率（隠し）を確認する
3. 画面表示と後続状態を確認する"	保存時の率計算は商品に紐づく買取減額率を優先し、フォームの rate は主説明から外れるであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-084	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	販売価格（NM）（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で販売価格（NM）（隠し）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 販売価格（NM）（隠し）を確認する
3. 画面表示と後続状態を確認する"	更新しないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-085	IT-25	一覧	P2	一覧の結合確認	複数行送信の途中で例外を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で複数行送信の途中で例外の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 複数行送信の途中で例外
3. 画面表示と後続状態を確認する"	それ以前にコミットした商品グループは保存済みのままであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-086	IT-12	画面表示データ	P2	画面表示データの結合確認	NM 規格が無い商品・言語を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でNM 規格が無い商品・言語の確認に必要な条件を指定する	"1. 対象画面を表示する
2. NM 規格が無い商品・言語を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-087	IT-25	画面表示データ	P2	画面表示データの結合確認	一覧との表示差を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で一覧との表示差の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧との表示差を確認する
3. 画面表示と後続状態を確認する"	成功後は一覧へ戻り resume でセッション検索を再利用するため、通常は最新の検索結果に反映されるであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-088	IT-12	画面表示データ	P2	画面表示データの結合確認	販売価格を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で販売価格の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 販売価格を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-089	IT-25	画面表示データ	P2	画面表示データの結合確認	成功時出力を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	商品一覧ページへの HTTP リダイレクトと成功フラッシュであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-090	IT-25	フォーム送信	P1	フォーム送信の結合確認	失敗時出力を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	編集 HTML 200 とエラーフラッシュ、もしくは一覧へのリダイレクトとエラーフラッシュ（ids 空）であること。
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
| その他 | 同種の対象外観点 3 件は上記分類と同じ理由で対象外 |

> 別枠（非該当ではない）: 本機能に該当するが上限（max_cases）または実行キー重複で今回未収載の結合観点 8件 — No.330, No.382, No.385, No.387, No.412, No.413, No.414, No.416。上限緩和または個別ケース化で収載可能。
