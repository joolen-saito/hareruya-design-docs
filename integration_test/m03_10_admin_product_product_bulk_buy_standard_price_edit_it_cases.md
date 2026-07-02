# m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m03-10_admin_product_product_bulk_buy_standard_price_edit.html`

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
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-007	IT-25	UI部品	P3	UI部品の操作結果確認	表示要素を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	メニューは product と product_editであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-008	IT-25	UI部品	P3	UI部品の操作結果確認	JS 挙動を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でJS 挙動の確認に必要な条件を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	.js-buy-price と .js-base-price（NM 基準価格）の入力で価格比率を再計算であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-009	IT-25	操作起点	P1	操作起点の操作結果確認	買取価格(NM)を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で買取価格(NM)の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 買取価格(NM)を確認する
3. 画面表示と後続状態を確認する"	保存時は上記ルールで全通常規格の dtb_product_class.buy_price を再計算・更新であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-010	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	基準価格 (NM)を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で基準価格 (NM)の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 基準価格 (NM)を確認する
3. 画面表示と後続状態を確認する"	dtb_product_class.standard_price を対象規格すべて同一値で更新であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-011	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	基準価格 (SP)を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で基準価格 (SP)の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 基準価格 (SP)を確認する
3. 画面表示と後続状態を確認する"	POST 値は読み取り専用であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-012	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	商品 ID（表示兼隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で商品 ID（表示兼隠し）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 商品 ID（表示兼隠し）を確認する
3. 画面表示と後続状態を確認する"	…[product_id]であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-013	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	NM 規格 ID（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でNM 規格 ID（隠し）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. NM 規格 ID（隠し）を確認する
3. 画面表示と後続状態を確認する"	…[product_class_id_nm]であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-014	IT-03	外部画面	P2	外部画面の操作結果確認	SP / MP / HP 規格 ID（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でSP / MP / HP 規格 ID（隠し）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. SP / MP / HP 規格 ID（隠し）を確認する
3. 画面表示と後続状態を確認する"	テンプレートの有無判定に使うこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-015	IT-03	画面遷移	P2	画面遷移の操作結果確認	状態ステータス（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で状態ステータス（隠し）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 状態ステータス（隠し）を確認する
3. 画面表示と後続状態を確認する"	テンプレートで廃止時の空白表示に使うこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-016	IT-03	画面遷移	P2	画面遷移の操作結果確認	割引率（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で割引率（隠し）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 割引率（隠し）を確認する
3. 画面表示と後続状態を確認する"	保存時の率計算は商品に紐づく買取減額率を優先し、フォームの rate は主説明から外れるであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-017	IT-03	画面遷移	P2	画面遷移の操作結果確認	販売価格（NM）（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で販売価格（NM）（隠し）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 販売価格（NM）（隠し）を確認する
3. 画面表示と後続状態を確認する"	更新しないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	複数行送信の途中で例外を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で複数行送信の途中で例外の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 複数行送信の途中で例外
3. 画面表示と後続状態を確認する"	それ以前にコミットした商品グループは保存済みのままであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	NM 規格が無い商品・言語を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でNM 規格が無い商品・言語の確認に必要な条件を指定する	"1. 対象画面を表示する
2. NM 規格が無い商品・言語を確認する
3. 画面表示と後続状態を確認する"	product_class_id_nm が 0 となり保存スキップであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	一覧との表示差を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で一覧との表示差の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 一覧との表示差を確認する
3. 画面表示と後続状態を確認する"	成功後は一覧へ戻り resume でセッション検索を再利用するため、通常は最新の検索結果に反映されるであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-021	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	販売価格を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で販売価格の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 販売価格を確認する
3. 画面表示と後続状態を確認する"	当機能では price02 を書き換えないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-022	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	成功時出力を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で成功時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	商品一覧ページへの HTTP リダイレクトと成功フラッシュであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-023	IT-25	URL	P2	URLの操作結果確認	失敗時出力を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で失敗時出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	編集 HTML 200 とエラーフラッシュ、もしくは一覧へのリダイレクトとエラーフラッシュ（ids 空）であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-024	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	dtb_product_classを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. dtb_product_classを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-025	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	登録/更新を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-026	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	買取 vs 販売（NM）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. 買取 vs 販売（NM）を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-027	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	確定成功を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. 確定成功を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-028	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	フォーム検証失敗を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. フォーム検証失敗を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	規格 ID 不正・削除済みを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. 規格 ID 不正・削除済み
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	買取がマスタに無い（条件を満たす低額帯）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で買取がマスタに無い（条件を満たす低額帯）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 買取がマスタに無い（条件を満たす低額帯）を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-031	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	フラッシュを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でフラッシュの確認に必要な条件を指定する	"1. 対象画面を表示する
2. フラッシュを確認する
3. 画面表示と後続状態を確認する"	成功・エラー・警告メッセージであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-032	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	監査ログ専用出力を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で監査ログ専用出力の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 監査ログ専用出力を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-033	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	トランザクション境界を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でトランザクション境界の確認に必要な条件を指定する	"1. 対象画面を表示する
2. トランザクション境界を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-034	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	ロックを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でロックの確認に必要な条件を指定する	"1. 対象画面を表示する
2. ロックを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	買取価格を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 買取価格を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	商品一覧で商品にチェックし「買取・基準価格一括編集」相当のボタンを押すを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 商品一覧で商品にチェックし「買取・基準価格一括編集」相当のボタンを押すを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	編集画面をブックマーク相当で開くを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 編集画面をブックマーク相当で開く
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	ids を付けずに編集 URL へ入るを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. ids を付けずに編集 URL へ入るを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-039	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	「登録」で確定を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で「登録」で確定の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 「登録」で確定を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-040	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	「商品一覧」リンクを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で「商品一覧」リンクの確認に必要な条件を指定する	"1. 対象画面を表示する
2. 「商品一覧」リンクを確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-041	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	表示要素を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で表示要素の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-042	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	JS 挙動を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-043	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	買取価格(NM)を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 買取価格(NM)を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-044	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	基準価格 (NM)を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 基準価格 (NM)を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	基準価格 (SP)を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 基準価格 (SP)を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	商品 ID（表示兼隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で商品 ID（表示兼隠し）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. 商品 ID（表示兼隠し）を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	NM 規格 ID（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でNM 規格 ID（隠し）の確認に必要な条件を指定する	"1. 対象画面を表示する
2. NM 規格 ID（隠し）を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	SP / MP / HP 規格 ID（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. SP / MP / HP 規格 ID（隠し）を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-049	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	状態ステータス（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 状態ステータス（隠し）を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-050	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	販売価格（NM）（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 販売価格（NM）（隠し）を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-051	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	複数行送信の途中で例外を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 複数行送信の途中で例外
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-052	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	NM 規格が無い商品・言語を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. NM 規格が無い商品・言語を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-053	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	一覧との表示差を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 一覧との表示差を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-054	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	販売価格を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 販売価格を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-055	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	成功時出力を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-056	IT-22	必須制御	P1	必須制御の入力検証	失敗時出力を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	編集 HTML 200 とエラーフラッシュ、もしくは一覧へのリダイレクトとエラーフラッシュ（ids 空）であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-057	IT-22	部分入力	P2	部分入力の入力検証	dtb_product_classを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でdtb_product_classの確認に必要な条件を指定する	"1. 対象画面を表示する
2. dtb_product_classを確認する
3. 画面表示と後続状態を確認する"	条件別に再計算され更新であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-058	IT-23	検索条件	P2	検索時の検索条件確認	登録/更新を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-059	IT-23	検索条件	P2	検索時の検索条件確認	買取 vs 販売（NM）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-060	IT-23	検索条件	P2	検索時の検索条件確認	確定成功を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で確定成功の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	一覧はセッションのページ番号と resume で再検索表示であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-061	IT-23	検索条件	P2	検索時の検索条件確認	フォーム検証失敗を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-062	IT-23	検索条件	P2	検索時の検索条件確認	規格 ID 不正・削除済みを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-063	IT-23	検索条件	P2	検索時の検索条件確認	買取がマスタに無い（条件を満たす低額帯）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-064	IT-23	検索条件	P2	検索時の検索条件確認	フラッシュを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-065	IT-23	検索条件	P2	検索時の検索条件確認	監査ログ専用出力を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-066	IT-23	検索条件	P2	検索時の検索条件確認	トランザクション境界を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-067	IT-23	検索条件	P2	検索時の検索条件確認	ロックを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でロックの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-068	IT-23	検索条件	P2	検索時の検索条件確認	買取価格を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で買取価格の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-069	IT-23	検索条件	P2	検索時の検索条件確認	商品一覧で商品にチェックし「買取・基準価格一括編集」相当のボタンを押すを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で商品一覧で商品にチェックし「買取・基準価格一括編集」相当のボタンを押すの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-070	IT-23	検索条件	P2	検索時の検索条件確認	編集画面をブックマーク相当で開くを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で編集画面をブックマーク相当で開くの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-071	IT-23	検索条件	P2	検索時の検索条件確認	ids を付けずに編集 URL へ入るを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でids を付けずに編集 URL へ入るの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	エラーフラッシュのうえ、セッションの eccube.admin.product.search.page_no を使って GET /{admin_route}/product/page/{page_no} へリダイレクト…であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-072	IT-23	検索条件	P2	検索時の検索条件確認	「登録」で確定を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で「登録」で確定の確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-073	IT-23	検索条件	P2	検索時の検索条件確認	「商品一覧」リンクを試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で「商品一覧」リンクの確認に必要な条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-074	IT-23	実行結果	P2	検索時の実行結果確認	表示要素を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で表示要素の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-075	IT-23	実行結果	P2	検索時の実行結果確認	JS 挙動を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でJS 挙動の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	.js-buy-price と .js-base-price（NM 基準価格）の入力で価格比率を再計算であること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-076	IT-23	実行結果	P2	検索時の実行結果確認	買取価格(NM)を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で買取価格(NM)の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-077	IT-23	実行結果	P2	検索時の実行結果確認	基準価格 (NM)を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で基準価格 (NM)の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-078	IT-23	実行結果	P2	検索時の実行結果確認	基準価格 (SP)を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で基準価格 (SP)の確認に必要な条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-079	IT-26	登録内容	P1	登録時の登録内容確認	商品 ID（表示兼隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で商品 ID（表示兼隠し）の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-080	IT-26	登録内容	P1	登録時の登録内容確認	NM 規格 ID（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でNM 規格 ID（隠し）の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-081	IT-26	登録内容	P1	登録時の登録内容確認	SP / MP / HP 規格 ID（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でSP / MP / HP 規格 ID（隠し）の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-082	IT-26	登録内容	P1	登録時の登録内容確認	状態ステータス（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で状態ステータス（隠し）の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	テンプレートで廃止時の空白表示に使うこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-083	IT-26	登録内容	P1	登録時の登録内容確認	割引率（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で割引率（隠し）の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	保存時の率計算は商品に紐づく買取減額率を優先し、フォームの rate は主説明から外れるであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-084	IT-23	登録内容	P1	登録時の登録内容確認	販売価格（NM）（隠し）を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で販売価格（NM）（隠し）の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新しないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-085	IT-26	登録内容	P1	登録時の登録内容確認	複数行送信の途中で例外を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で複数行送信の途中で例外の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	それ以前にコミットした商品グループは保存済みのままであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-086	IT-26	登録内容	P1	登録時の登録内容確認	NM 規格が無い商品・言語を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）でNM 規格が無い商品・言語の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	product_class_id_nm が 0 となり保存スキップであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-087	IT-26	登録内容	P1	登録時の登録内容確認	一覧との表示差を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で一覧との表示差の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	成功後は一覧へ戻り resume でセッション検索を再利用するため、通常は最新の検索結果に反映されるであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-088	IT-26	登録内容	P1	登録時の登録内容確認	販売価格を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で販売価格の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	当機能では price02 を書き換えないこと。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-089	IT-26	登録内容	P1	登録時の登録内容確認	成功時出力を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で成功時出力の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	商品一覧ページへの HTTP リダイレクトと成功フラッシュであること。
m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）	IT-M03-10-ADMIN-PRODUCT-PRODUCT-BULK-BUY-STANDARD-PRICE-EDIT-090	IT-26	登録内容	P1	登録時の登録内容確認	失敗時出力を試験できる状態である	m03-10_admin_product_product_bulk_buy_standard_price_edit（管理画面_商品管理_買取・基準価格一括編集）（m03_10_admin_product_product_bulk_buy_standard_price_edit）で失敗時出力の確認に必要な条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
```

## 対象外観点

| 分類・範囲 | 理由 |
|-----------|------|
| バリデーション / バリデーション / 単項目バリデーション（IT-22） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 登録（IT-23, IT-26） | 元設計HTMLに該当する処理・I/Fがないため |
| データベースアクセス / DB操作 / 更新（IT-05, IT-23, IT-26） | 元設計HTMLに該当する処理・I/Fがないため |
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
