# m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m03-26_admin_product_product_card_csv_import.html`

テスト観点: `integration_test/integration-test-viewpoints.md`

期待結果は画面表示、遷移、DB状態、ファイル、レスポンス、ログなど試験で観測できる結果で判定する。TSV は 10 列固定で、`テストレベル` 列は含めない。

## 関連ID対応概要

| 関連ID | 本機能での主な確認範囲 |
|--------|------------------------|
| IT-27 | JSON、コピー、スキーマ、入力JSON、出力失敗、削除、同名ファイル、実行結果、移動・リネーム、配置先 |
| IT-15 | CSRF、対象データ、未認証、機密情報、状態変化 |
| IT-20 | 出力抑止、識別子 |
| IT-25 | HTTPステータス、URL、データなし、フォーム送信、一覧、件数上限、更新抑止、欠損値、画面レイアウト、画面表示データ、確認ダイアログ |
| IT-22 | DBとの相関バリデーション、必須バリデーション、文字列長バリデーション、相関バリデーション、部分入力 |
| IT-23 | データ正当性、実行結果、検索条件 |
| IT-26 | 実行結果、更新内容、登録内容 |
| IT-05 | 実行結果 |
| IT-16 | ファイル選択、実行結果 |
| IT-17 | フォーマット定義 |
| IT-24 | 出力内容 |
| IT-33 | カート整合、ファイル出力、ファイル登録 |
| IT-02 | 公開コンテンツ、初期行数、表示順 |
| IT-12 | エラー継続、内部情報、画面レイアウト、画面表示データ、非同期更新 |
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
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-001	IT-27	出力失敗	P1	出力失敗の結合確認	ナビ「商品管理」→「商品CSV管理」→「カード商品CSV登録」を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で出力失敗の対象ファイルと処理条件を指定する	"1. 対象画面で出力失敗のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力失敗のファイル出力内容または取り込み結果が対象データと一致すること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-002	IT-15	CSRF	P1	CSRFの結合確認	アップロード送信を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）でCSRFの対象ファイルと処理条件を指定する	"1. 対象画面でCSRFのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	CSRFのファイル出力内容または取り込み結果が対象データと一致すること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-003	IT-15	未認証	P1	未認証の結合確認	履歴の表示件数変更を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で未認証の対象ファイルと処理条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	クエリの件数が許容リストに含まれるときだけセッションに保存され、履歴のページサイズが変わるであること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-004	IT-15	対象データ	P1	対象データの結合確認	表示要素を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で対象データの対象ファイルと処理条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	@admin/Product/csv_product_card_bulk.twig は共通テンプレート @admin/Product/base_csv_upload.twig を継承すること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-005	IT-20	出力抑止	P1	出力抑止の結合確認	JS 挙動を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で出力抑止の対象ファイルと処理条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ファイル選択でラベルにファイル名を表示すること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-006	IT-20	識別子	P1	識別子の結合確認	モーダル・ポップアップを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で識別子の対象ファイルと処理条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	送信前の確認ダイアログはないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-007	IT-15	状態変化	P1	状態変化の結合確認	CSV ファイルを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で状態変化の対象ファイルと処理条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	アップロード後は設定 eccube_csv_temp_realdir 配下へ移動し、インポータ終了時に削除されるであること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-008	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	商品公開ステータスを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 商品公開ステータスを確認する
3. 画面表示と後続状態を確認する"	dtb_product およびスマレジ連携フラグ判定に利用であること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-009	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	発送日目安(ID)を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）でHTTPステータスの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 発送日目安(ID)を確認する
3. 画面表示と後続状態を確認する"	現状ロジックでは更新に使わないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-010	IT-25	URL	P2	URLの操作結果確認	基準価格を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）でURLの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 基準価格を確認する
3. 画面表示と後続状態を確認する"	standard_priceであること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-011	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	全体中断フラグが付いた検証エラーを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 全体中断フラグが付いた検証エラーを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-012	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	同一カード詳細を持つ別商品が既にいる（自分自身を除く）を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 同一カード詳細を持つ別商品が既にいる（自分自身を除く）を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-013	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	取込結果オブジェクトにエラーが 1 件でもあるを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で文字列長バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 取込結果オブジェクトにエラーが 1 件でもあるを確認する
3. 画面表示と後続状態を確認する"	フラッシュはすべてエラー側のみで、成功メッセージと取込履歴 INSERT は行わないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-014	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	一部行のみスキップされ、かつ中断なしでコミットされた場合を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 一部行のみスキップされ、かつ中断なしでコミットされた場合を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-015	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	一覧との一致を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 一覧との一致を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-016	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	履歴を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 履歴を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-017	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	成功時出力を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-018	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	失敗時出力を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-019	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	登録/更新を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-020	IT-22	部分入力	P2	部分入力の入力検証	メニューまたはブックマークから開くを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で部分入力の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. メニューまたはブックマークから開く
3. 画面表示と後続状態を確認する"	GET アップロード画面であること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-021	IT-23	検索条件	P2	検索時の検索条件確認	送信成功・失敗のどちらでも POST 後を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-022	IT-23	検索条件	P2	検索時の検索条件確認	POST 取込を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-023	IT-23	検索条件	P2	検索時の検索条件確認	ヘッダのみ・列数不一致などインポータ事前検証を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-024	IT-23	検索条件	P2	検索時の検索条件確認	行ごとの検証・業務エラーを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-025	IT-23	検索条件	P2	検索時の検索条件確認	M03-26-MSG-004を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-026	IT-23	検索条件	P2	検索時の検索条件確認	M03-26-MSG-005を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-027	IT-23	検索条件	P2	検索時の検索条件確認	ナビ「商品管理」→「商品CSV管理」→「カード商品CSV登録」を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-028	IT-23	検索条件	P2	検索時の検索条件確認	アップロード送信を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-029	IT-23	検索条件	P2	検索時の検索条件確認	履歴の表示件数変更を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-030	IT-23	検索条件	P2	検索時の検索条件確認	表示要素を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-031	IT-23	検索条件	P2	検索時の検索条件確認	JS 挙動を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-032	IT-23	検索条件	P2	検索時の検索条件確認	モーダル・ポップアップを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-033	IT-23	検索条件	P2	検索時の検索条件確認	CSV ファイルを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-034	IT-23	検索条件	P2	検索時の検索条件確認	商品公開ステータスを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-035	IT-23	実行結果	P2	検索時の実行結果確認	発送日目安(ID)を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-036	IT-23	実行結果	P2	検索時の実行結果確認	基準価格を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-037	IT-23	実行結果	P2	検索時の実行結果確認	全体中断フラグが付いた検証エラーを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-038	IT-23	実行結果	P2	検索時の実行結果確認	同一カード詳細を持つ別商品が既にいる（自分自身を除く）を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-039	IT-26	登録内容	P1	登録時の登録内容確認	取込結果オブジェクトにエラーが 1 件でもあるを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-040	IT-26	登録内容	P1	登録時の登録内容確認	一部行のみスキップされ、かつ中断なしでコミットされた場合を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-041	IT-26	登録内容	P1	登録時の登録内容確認	一覧との一致を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-042	IT-26	登録内容	P1	登録時の登録内容確認	履歴を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	エラー配列が空のときだけ履歴が 1 件増えるであること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-043	IT-26	登録内容	P1	登録時の登録内容確認	成功時出力を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-044	IT-26	登録内容	P1	登録時の登録内容確認	失敗時出力を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で登録内容の対象項目に最大長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-045	IT-26	登録内容	P1	登録時の登録内容確認	登録/更新を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で登録内容の対象項目に最大長+1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-046	IT-26	登録内容	P1	登録時の登録内容確認	メニューまたはブックマークから開くを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で登録内容の対象項目に最小長の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-047	IT-26	登録内容	P1	登録時の登録内容確認	送信成功・失敗のどちらでも POST 後を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で登録内容の対象項目に最小長-1の値を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-048	IT-26	登録内容	P1	登録時の登録内容確認	POST 取込を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-049	IT-26	実行結果	P1	登録時の実行結果確認	ヘッダのみ・列数不一致などインポータ事前検証を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードが追加されること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-050	IT-23	実行結果	P1	登録時の実行結果確認	行ごとの検証・業務エラーを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	メッセージを結果へ集約しフラッシュ（コミット可否は中断フラグとトランザクション節を参照）であること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-051	IT-26	更新内容	P1	更新時の更新内容確認	M03-26-MSG-004を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-052	IT-26	更新内容	P1	更新時の更新内容確認	M03-26-MSG-005を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-053	IT-26	更新内容	P1	更新時の更新内容確認	ナビ「商品管理」→「商品CSV管理」→「カード商品CSV登録」を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-054	IT-26	更新内容	P1	更新時の更新内容確認	アップロード送信を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検証・取込後、常に GET …/product_card_csv_upload へリダイレクトされ、フラッシュで結果が示されるであること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-055	IT-26	更新内容	P1	更新時の更新内容確認	履歴の表示件数変更を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-056	IT-26	更新内容	P1	更新時の更新内容確認	表示要素を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で更新内容の対象項目に最大長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-057	IT-26	更新内容	P1	更新時の更新内容確認	JS 挙動を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で更新内容の対象項目に最大長+1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-058	IT-26	更新内容	P1	更新時の更新内容確認	モーダル・ポップアップを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で更新内容の対象項目に最小長の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-059	IT-26	更新内容	P1	更新時の更新内容確認	CSV ファイルを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で更新内容の対象項目に最小長-1の値を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-060	IT-26	更新内容	P1	更新時の更新内容確認	商品公開ステータスを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で更新内容の対象ファイルと処理条件を指定する	"1. 更新内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	更新内容の対象レコードの値が変更されること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-061	IT-05	実行結果	P1	更新時の実行結果確認	発送日目安(ID)を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の対象レコードの値が変更されること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-062	IT-05	実行結果	P1	更新時の実行結果確認	基準価格を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	standard_priceであること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-063	IT-16	実行結果	P2	実行結果の結合確認	全体中断フラグが付いた検証エラーを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-064	IT-17	フォーマット定義	P2	フォーマット定義の入力検証	同一カード詳細を持つ別商品が既にいる（自分自身を除く）を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）でフォーマット定義で対象条件に該当する値を指定する	"1. 対象画面でフォーマット定義のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	フォーマット定義でエラーが表示されず、対象処理を継続できること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-065	IT-17	フォーマット定義	P2	フォーマット定義の入力検証	取込結果オブジェクトにエラーが 1 件でもあるを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）でフォーマット定義で対象条件に該当しない値を指定する	"1. 対象画面でフォーマット定義のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	フォーマット定義でエラーが表示され、対象処理が完了しないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-066	IT-27	実行結果	P2	実行結果の結合確認	一部行のみスキップされ、かつ中断なしでコミットされた場合を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-067	IT-27	実行結果	P2	実行結果の結合確認	一覧との一致を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-068	IT-24	出力内容	P2	出力内容の結合確認	履歴を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容のファイル出力内容または取り込み結果が対象データと一致すること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-069	IT-24	出力内容	P2	出力内容の結合確認	成功時出力を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容のファイル出力内容または取り込み結果が対象データと一致すること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-070	IT-24	出力内容	P2	出力内容の結合確認	失敗時出力を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容のファイル出力内容または取り込み結果が対象データと一致すること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-071	IT-24	出力内容	P2	出力内容の結合確認	登録/更新を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容のファイル出力内容または取り込み結果が対象データと一致すること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-072	IT-24	出力内容	P2	出力内容の結合確認	メニューまたはブックマークから開くを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で出力内容の対象ファイルと処理条件を指定する	"1. 対象画面で出力内容のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力内容でエラーが表示されず、対象処理を継続できること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-073	IT-27	削除	P1	削除の結合確認	送信成功・失敗のどちらでも POST 後を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で削除の対象ファイルと処理条件を指定する	"1. 対象画面で削除のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	削除の該当レコードが取得結果に含まれないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-074	IT-27	移動・リネーム	P2	移動・リネームの結合確認	POST 取込を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で移動・リネームの対象ファイルと処理条件を指定する	"1. 対象画面で移動・リネームのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	移動・リネームの該当レコードが取得結果に含まれないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-075	IT-27	コピー	P1	コピーの結合確認	ヘッダのみ・列数不一致などインポータ事前検証を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）でコピーの対象ファイルと処理条件を指定する	"1. 対象画面でコピーのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	コピーのファイル出力内容または取り込み結果が対象データと一致すること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-076	IT-33	ファイル登録	P1	ファイル登録の結合確認	行ごとの検証・業務エラーを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）でファイル登録の対象ファイルと処理条件を指定する	"1. 対象画面でファイル登録のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	ファイル登録のファイル出力内容または取り込み結果が対象データと一致すること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-077	IT-33	ファイル出力	P1	ファイル出力の結合確認	M03-26-MSG-004を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）でファイル出力の対象ファイルと処理条件を指定する	"1. 対象画面でファイル出力のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	ファイル出力のファイル出力内容または取り込み結果が対象データと一致すること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-078	IT-27	JSON	P1	JSONの結合確認	M03-26-MSG-005を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）でJSONの対象ファイルと処理条件を指定する	"1. 対象画面でJSONのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	JSONのファイル出力内容または取り込み結果が対象データと一致すること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-079	IT-27	同名ファイル	P1	同名ファイルの結合確認	ナビ「商品管理」→「商品CSV管理」→「カード商品CSV登録」を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で同名ファイルの対象ファイルと処理条件を指定する	"1. 対象画面で同名ファイルのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	同名ファイルのファイル出力内容または取り込み結果が対象データと一致すること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-080	IT-27	入力JSON	P1	入力JSONの結合確認	アップロード送信を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で入力JSONの対象ファイルと処理条件を指定する	"1. 対象画面で入力JSONのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	入力JSONの対象レコードの値が変更されないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-081	IT-27	配置先	P1	配置先の結合確認	履歴の表示件数変更を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で配置先の対象ファイルと処理条件を指定する	"1. 対象画面で配置先のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	配置先の該当レコードが取得結果に含まれること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-082	IT-27	スキーマ	P1	スキーマの結合確認	表示要素を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）でスキーマの対象ファイルと処理条件を指定する	"1. 対象画面でスキーマのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	スキーマのファイル出力内容または取り込み結果が対象データと一致すること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-083	IT-02	初期行数	P2	初期行数の結合確認	JS 挙動を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で初期行数の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	ファイル選択でラベルにファイル名を表示すること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-084	IT-02	表示順	P2	表示順の結合確認	モーダル・ポップアップを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で表示順の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	送信前の確認ダイアログはないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-085	IT-25	更新抑止	P1	更新抑止の結合確認	CSV ファイルを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で更新抑止の対象ファイルと処理条件を指定する	"1. 対象画面で更新抑止のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	更新抑止のファイル出力内容または取り込み結果が対象データと一致すること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-086	IT-12	内部情報	P1	内部情報の結合確認	商品公開ステータスを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で内部情報の対象ファイルと処理条件を指定する	"1. 内部情報の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	dtb_product およびスマレジ連携フラグ判定に利用であること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-087	IT-15	機密情報	P1	機密情報の結合確認	発送日目安(ID)を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で機密情報の対象ファイルと処理条件を指定する	"1. 対象画面で機密情報のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	機密情報のファイル出力内容または取り込み結果が対象データと一致すること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-088	IT-07	排他制御	P1	排他制御の結合確認	基準価格を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で排他制御の対象ファイルと処理条件を指定する	"1. 排他制御の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	standard_priceであること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-089	IT-06	ロールバック	P3	ロールバックの結合確認	全体中断フラグが付いた検証エラーを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）でロールバックの対象ファイルと処理条件を指定する	"1. ロールバックの対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	トランザクションはロールバックされ、結果オブジェクトにエラーが載るであること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-090	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	同一カード詳細を持つ別商品が既にいる（自分自身を除く）を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 同一カード詳細を持つ別商品が既にいる（自分自身を除く）を確認する
3. 画面表示と後続状態を確認する"	エラーメッセージを積み当該行のみスキップであること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-091	IT-25	画面レイアウト	P2	画面レイアウトの結合確認	取込結果オブジェクトにエラーが 1 件でもあるを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 取込結果オブジェクトにエラーが 1 件でもあるを確認する
3. 画面表示と後続状態を確認する"	フラッシュはすべてエラー側のみで、成功メッセージと取込履歴 INSERT は行わないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-092	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	一部行のみスキップされ、かつ中断なしでコミットされた場合を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 一部行のみスキップされ、かつ中断なしでコミットされた場合を確認する
3. 画面表示と後続状態を確認する"	DB は成功行ぶん更新済みでも、画面はエラーのみを見せ、履歴にも残らないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-093	IT-12	画面レイアウト	P2	画面レイアウトの結合確認	一覧との一致を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 一覧との一致を確認する
3. 画面表示と後続状態を確認する"	画面は CSV のプレビューを保持しないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-094	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	履歴を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 履歴を確認する
3. 画面表示と後続状態を確認する"	エラー配列が空のときだけ履歴が 1 件増えるであること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-095	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	成功時出力を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	HTTP 302 でアップロード画面へ戻り、成功フラッシュが付く場合があること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-096	IT-12	画面レイアウト	P2	画面レイアウトの入力検証	失敗時出力を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で画面レイアウトの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	同上でエラーフラッシュが 1 件以上付く場合があること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-097	IT-25	一覧	P2	一覧の結合確認	登録/更新を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で一覧の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）であること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-098	IT-12	画面表示データ	P2	画面表示データの結合確認	メニューまたはブックマークから開くを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で画面表示データの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. メニューまたはブックマークから開く
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-099	IT-25	画面表示データ	P2	画面表示データの結合確認	送信成功・失敗のどちらでも POST 後を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で画面表示データの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 送信成功・失敗のどちらでも POST 後
3. 画面表示と後続状態を確認する"	GET アップロード画面へリダイレクトであること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-100	IT-12	画面表示データ	P2	画面表示データの結合確認	POST 取込を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で画面表示データの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. POST 取込を確認する
3. 画面表示と後続状態を確認する"	画面表示データでエラーが表示されず、対象処理を継続できること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-101	IT-25	画面表示データ	P2	画面表示データの結合確認	ヘッダのみ・列数不一致などインポータ事前検証を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で画面表示データの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ヘッダのみ・列数不一致などインポータ事前検証を確認する
3. 画面表示と後続状態を確認する"	結果オブジェクト経由でエラーメッセージをフラッシュであること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-102	IT-25	フォーム送信	P1	フォーム送信の結合確認	行ごとの検証・業務エラーを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）でフォーム送信の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 行ごとの検証・業務エラーを確認する
3. 画面表示と後続状態を確認する"	メッセージを結果へ集約しフラッシュ（コミット可否は中断フラグとトランザクション節を参照）であること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-103	IT-16	ファイル選択	P2	ファイル選択の結合確認	M03-26-MSG-004を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）でファイル選択の対象ファイルと処理条件を指定する	"1. 対象画面でファイル選択のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	ファイル選択のファイル出力内容または取り込み結果が対象データと一致すること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-104	IT-12	非同期更新	P1	非同期更新の結合確認	M03-26-MSG-005を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で非同期更新の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. M03-26-MSG-005を確認する
3. 画面表示と後続状態を確認する"	CsvImporter の取込結果 $result にエラーがないとき（成功）であること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-105	IT-12	エラー継続	P3	エラー継続の結合確認	ナビ「商品管理」→「商品CSV管理」→「カード商品CSV登録」を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）でエラー継続の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ナビ「商品管理」→「商品CSV管理」→「カード商品CSV登録」を確認する
3. 画面表示と後続状態を確認する"	アップロード画面が開き、フォーマット表と履歴が表示されるであること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-106	IT-25	件数上限	P2	件数上限の結合確認	アップロード送信を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で件数上限の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. アップロード送信
3. 画面表示と後続状態を確認する"	検証・取込後、常に GET …/product_card_csv_upload へリダイレクトされ、フラッシュで結果が示されるであること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-107	IT-25	欠損値	P2	欠損値の結合確認	履歴の表示件数変更を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で欠損値の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 履歴の表示件数変更を確認する
3. 画面表示と後続状態を確認する"	クエリの件数が許容リストに含まれるときだけセッションに保存され、履歴のページサイズが変わるであること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-108	IT-25	データなし	P2	データなしの結合確認	表示要素を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）でデータなしの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	@admin/Product/csv_product_card_bulk.twig は共通テンプレート @admin/Product/base_csv_upload.twig を継承すること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-109	IT-02	公開コンテンツ	P1	公開コンテンツの結合確認	JS 挙動を試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）で公開コンテンツの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	ファイル選択でラベルにファイル名を表示すること。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-110	IT-33	カート整合	P1	カート整合の結合確認	モーダル・ポップアップを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）でカート整合の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	送信前の確認ダイアログはないこと。
m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）	IT-M03-26-ADMIN-PRODUCT-PRODUCT-CARD-CSV-IMPORT-111	IT-23	データ正当性	P3	データ正当性の結合確認	CSV ファイルを試験できる状態である	m03-26_admin_product_product_card_csv_import（管理画面_商品管理_カード商品CSV登録）（m03_26_admin_product_product_card_csv_import）でデータ正当性の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. CSV ファイルを確認する
3. 画面表示と後続状態を確認する"	アップロード後は設定 eccube_csv_temp_realdir 配下へ移動し、インポータ終了時に削除されるであること。
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
| ファイル処理 / 数量・金額影響機能 / 対象機能（IT-33） | 本機能はメール送信を扱わないため |
| ファイル処理 / 数量 / 更新結果（IT-33） | 元設計HTMLに該当する処理・I/Fがないため |
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
| ウェブサービス / 非同期連携 / 通知引渡し（IT-08） | 本機能は対象の外部I/Fを扱わないため |

> 別枠（非該当ではない）: 本機能に該当するが上限（max_cases）または実行キー重複で今回未収載の結合観点 1件 — No.109。上限緩和または個別ケース化で収載可能。
