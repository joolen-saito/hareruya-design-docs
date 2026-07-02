# m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録） 結合試験テストケース

元設計: `function_spec_html_preview/pf-eccube3/m03-38_admin_product_product_status_csv.html`

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
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-001	IT-16	実行結果	P1	実行結果の結合確認	ナビ「商品管理」→「商品CSV管理」→「商品公開CSV登録」を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-002	IT-27	実行結果	P1	実行結果の結合確認	アップロード送信を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で実行結果の対象ファイルと処理条件を指定する	"1. 対象画面で実行結果のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	実行結果のファイル出力内容または取り込み結果が対象データと一致すること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-003	IT-27	出力失敗	P1	出力失敗の結合確認	履歴の表示件数変更を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で出力失敗の対象ファイルと処理条件を指定する	"1. 対象画面で出力失敗のファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	出力失敗のファイル出力内容または取り込み結果が対象データと一致すること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-004	IT-15	CSRF	P1	CSRFの結合確認	表示要素を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）でCSRFの対象ファイルと処理条件を指定する	"1. 対象画面でCSRFのファイル処理を実行する
2. 出力ファイルまたは取り込み結果を確認する"	CSRFのファイル出力内容または取り込み結果が対象データと一致すること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-005	IT-15	未認証	P1	未認証の結合確認	JS 挙動を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で未認証の対象ファイルと処理条件を指定する	"1. 未認証の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	ファイル選択でカスタムラベルへファイル名表示であること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-006	IT-15	対象データ	P1	対象データの結合確認	モーダル・ポップアップを試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で対象データの対象ファイルと処理条件を指定する	"1. 対象データの認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	送信前確認ダイアログはないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-007	IT-20	出力抑止	P1	出力抑止の結合確認	CSV ファイルを試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で出力抑止の対象ファイルと処理条件を指定する	"1. 出力抑止の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	アップロード済みオブジェクトから一時ディレクトリ eccube_csv_temp_realdir へ退避後にインポータが読込み、終了時に一時ファイルを削除試行すること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-008	IT-20	識別子	P1	識別子の結合確認	支店の商品公開ステータスを試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で識別子の対象ファイルと処理条件を指定する	"1. 識別子の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	dtb_product.is_branch_published に PHP の真偽へキャストして保存（0 以外の整数は実質受け付けない）であること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-009	IT-15	状態変化	P1	状態変化の結合確認	商品の公開ステータスが廃止の行を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で状態変化の対象ファイルと処理条件を指定する	"1. 状態変化の認証・Cookie・セッション・試行制限など前提条件を設定する
2. 対象の認証操作を実行する
3. 画面表示・遷移・Cookie・セッション・履歴など観測値を確認する"	バリデーションでは通過しうるが onReadRow で何も更新せず false を返すこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-010	IT-25	UI部品	P3	UI部品の操作結果確認	リポジトリの isProductExists コメントと手継のスキップを試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）でUI部品の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. リポジトリの isProductExists コメントと手継のスキップを確認する
3. 画面表示と後続状態を確認する"	ネイティブ存在確認はステータスで絞らない一方、実更新は廃止を除外するため、コメントと実行結果が一致しない場合があること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-011	IT-25	UI部品	P3	UI部品の操作結果確認	トランザクションがロールバックされた取込を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）でUI部品の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. トランザクションがロールバックされた取込を確認する
3. 画面表示と後続状態を確認する"	履歴 INSERT はエラー結果のときは実行されず、フラッシュのみであること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-012	IT-25	操作起点	P1	操作起点の操作結果確認	一覧と反映内容を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で操作起点の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 一覧と反映内容を確認する
3. 画面表示と後続状態を確認する"	アップロード画面の説明テーブルは静的配列であり、実行後の自動再読込はしないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-013	IT-25	確認ダイアログ	P1	確認ダイアログの操作結果確認	履歴一覧を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 履歴一覧を確認する
3. 画面表示と後続状態を確認する"	「商品公開 CSV 取込」種別に絞られるため、ほか種別のアップロードは混ぜて表示しないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-014	IT-25	確認ダイアログ	P2	確認ダイアログの操作結果確認	成功時出力を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	302 で product/status/csv_upload へのリダイレクトおよび成功フラッシュであること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-015	IT-25	確認ダイアログ	P3	確認ダイアログの操作結果確認	失敗時出力を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で確認ダイアログの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	同上のリダイレクトに加え、管理者向けフラッシュおよびインポータ由来の多言語済み文言であること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-016	IT-25	送信可否制御	P3	送信可否制御の操作結果確認	副作用を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で送信可否制御の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	条件付きで dtb_product の公開列の更新、dtb_csv_import_history への INSERT、情報ログ複数種であること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-017	IT-03	外部画面	P2	外部画面の操作結果確認	dtb_csv_import_historyを試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で外部画面の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. dtb_csv_import_historyを確認する
3. 画面表示と後続状態を確認する"	取込エラーなく完了したときだけ INSERTであること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-018	IT-03	画面遷移	P2	画面遷移の操作結果確認	登録/更新を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	当機能が行う登録・更新で対象テーブルを直接保存する（不要な削除は含まない）であること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-019	IT-03	画面遷移	P2	画面遷移の操作結果確認	ファイル必須を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ファイル必須を確認する
3. 画面表示と後続状態を確認する"	フォーム NotBlankであること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-020	IT-03	画面遷移	P2	画面遷移の操作結果確認	ナビまたはブックマークで画面を開くを試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ナビまたはブックマークで画面を開く
3. 画面表示と後続状態を確認する"	GET …/product/status/csv_uploadであること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-021	IT-03	画面遷移	P2	画面遷移の操作結果確認	送信完了（成功または失敗）を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 送信完了（成功または失敗）
3. 画面表示と後続状態を確認する"	常に GET …/product/status/csv_upload へのリダイレクトであること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-022	IT-03	画面遷移	P2	画面遷移の操作結果確認	表示件数・ページ変更を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 表示件数・ページ変更を確認する
3. 画面表示と後続状態を確認する"	GET 結果の履歴リストが選択したページサイズになること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-023	IT-03	画面遷移	P2	画面遷移の操作結果確認	フォーム検証エラー・ファイル null・行数超過を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で画面遷移の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. フォーム検証エラー・ファイル null・行数超過を確認する
3. 画面表示と後続状態を確認する"	HTTP フラッシュのみであること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-024	IT-13	URL直接アクセス	P2	URL直接アクセスの操作結果確認	ヘッダ不備／データ無し／行検証／商品不存在を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）でURL直接アクセスの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. ヘッダ不備／データ無し／行検証／商品不存在を確認する
3. 画面表示と後続状態を確認する"	インポータがエラー結果を返し、コントローラがフラッシュに展開すること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-025	IT-25	HTTPステータス	P2	HTTPステータスの操作結果確認	取込処理に入った直後を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）でHTTPステータスの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 取込処理に入った直後を確認する
3. 画面表示と後続状態を確認する"	「商品公開CSV登録開始」であること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-026	IT-25	URL	P2	URLの操作結果確認	正常完了後を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）でURLの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 正常完了後を確認する
3. 画面表示と後続状態を確認する"	「商品公開CSV登録完了」と件数引数の連想情報であること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-027	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	結果にエラーが残ったときを試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 結果にエラーが残ったときを確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-028	IT-22	必須バリデーション	P2	必須バリデーションの入力検証	一覧ページング閲覧状態を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で必須バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 一覧ページング閲覧状態を確認する
3. 画面表示と後続状態を確認する"	必須バリデーションでエラーが表示されず、対象処理を継続できること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-029	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	ナビ「商品管理」→「商品CSV管理」→「商品公開CSV登録」を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で文字列長バリデーションの対象項目に最大長の値を指定する	"1. 対象画面を表示する
2. ナビ「商品管理」→「商品CSV管理」→「商品公開CSV登録」を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-030	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	アップロード送信を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で文字列長バリデーションの対象項目に最大長+1の値を指定する	"1. 対象画面を表示する
2. アップロード送信
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-031	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	履歴の表示件数変更を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で文字列長バリデーションの対象項目に最小長の値を指定する	"1. 対象画面を表示する
2. 履歴の表示件数変更を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-032	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	表示要素を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で文字列長バリデーションの対象項目に最小長-1の値を指定する	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-033	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	JS 挙動を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で文字列長バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	文字列長バリデーションでエラーが表示されず、対象処理を継続できること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-034	IT-22	文字列長バリデーション	P2	文字列長バリデーションの入力検証	モーダル・ポップアップを試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で文字列長バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. モーダル・ポップアップを確認する
3. 画面表示と後続状態を確認する"	送信前確認ダイアログはないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-035	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	CSV ファイルを試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. CSV ファイルを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-036	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	支店の商品公開ステータスを試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 支店の商品公開ステータスを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-037	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	商品の公開ステータスが廃止の行を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 商品の公開ステータスが廃止の行を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-038	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	リポジトリの isProductExists コメントと手継のスキップを試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. リポジトリの isProductExists コメントと手継のスキップを確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-039	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	トランザクションがロールバックされた取込を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. トランザクションがロールバックされた取込を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-040	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	一覧と反映内容を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 一覧と反映内容を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示されず、対象処理を継続できること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-041	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	履歴一覧を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で数値バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 履歴一覧を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-042	IT-22	数値バリデーション	P2	数値バリデーションの入力検証	成功時出力を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で数値バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 成功時出力を確認する
3. 画面表示と後続状態を確認する"	数値バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-043	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	失敗時出力を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で文字種バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 失敗時出力を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示されず、対象処理を継続できること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-044	IT-22	文字種バリデーション	P2	文字種バリデーションの入力検証	副作用を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で文字種バリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 副作用を確認する
3. 画面表示と後続状態を確認する"	文字種バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-045	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	dtb_csv_import_historyを試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. dtb_csv_import_historyを確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-046	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	登録/更新を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 登録/更新を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-047	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	ファイル必須を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. ファイル必須を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-048	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	ナビまたはブックマークで画面を開くを試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. ナビまたはブックマークで画面を開く
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-049	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	送信完了（成功または失敗）を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）でその他のバリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 送信完了（成功または失敗）
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-050	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	表示件数・ページ変更を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）でその他のバリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 表示件数・ページ変更を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-051	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	フォーム検証エラー・ファイル null・行数超過を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）でその他のバリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. フォーム検証エラー・ファイル null・行数超過を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示されず、対象処理を継続できること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-052	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	ヘッダ不備／データ無し／行検証／商品不存在を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）でその他のバリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. ヘッダ不備／データ無し／行検証／商品不存在を確認する
3. 画面表示と後続状態を確認する"	その他のバリデーションでエラーが表示され、対象処理が完了しないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-053	IT-22	その他のバリデーション	P2	その他のバリデーションの入力検証	取込処理に入った直後を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）でその他のバリデーションの対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. 取込処理に入った直後を確認する
3. 画面表示と後続状態を確認する"	「商品公開CSV登録開始」であること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-054	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	正常完了後を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 正常完了後を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-055	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	結果にエラーが残ったときを試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で相関バリデーションの対象項目を未入力にする	"1. 対象画面を表示する
2. 結果にエラーが残ったときを確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-056	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	一覧ページング閲覧状態を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. 一覧ページング閲覧状態を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-057	IT-22	相関バリデーション	P2	相関バリデーションの入力検証	ナビ「商品管理」→「商品CSV管理」→「商品公開CSV登録」を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. ナビ「商品管理」→「商品CSV管理」→「商品公開CSV登録」を確認する
3. 画面表示と後続状態を確認する"	相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-058	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	アップロード送信を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）でDBとの相関バリデーションで対象条件に該当する値を指定する	"1. 対象画面を表示する
2. アップロード送信
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示されず、対象処理を継続できること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-059	IT-22	DBとの相関バリデーション	P2	DBとの相関バリデーションの入力検証	履歴の表示件数変更を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）でDBとの相関バリデーションで対象条件に該当しない値を指定する	"1. 対象画面を表示する
2. 履歴の表示件数変更を確認する
3. 画面表示と後続状態を確認する"	DBとの相関バリデーションでエラーが表示され、対象処理が完了しないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-060	IT-22	必須制御	P1	必須制御の入力検証	表示要素を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で必須制御の対象項目を未入力にする	"1. 対象画面を表示する
2. 表示要素を確認する
3. 画面表示と後続状態を確認する"	@admin/Product/csv_product_status.twig は共通テンプレート @admin/Product/base_csv_upload.twig を継承すること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-061	IT-22	部分入力	P2	部分入力の入力検証	JS 挙動を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で部分入力の対象ファイルと処理条件を指定する	"1. 対象画面を表示する
2. JS 挙動を確認する
3. 画面表示と後続状態を確認する"	ファイル選択でカスタムラベルへファイル名表示であること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-062	IT-23	検索条件	P2	検索時の検索条件確認	モーダル・ポップアップを試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-063	IT-23	検索条件	P2	検索時の検索条件確認	CSV ファイルを試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-064	IT-23	検索条件	P2	検索時の検索条件確認	支店の商品公開ステータスを試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	dtb_product.is_branch_published に PHP の真偽へキャストして保存（0 以外の整数は実質受け付けない）であること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-065	IT-23	検索条件	P2	検索時の検索条件確認	商品の公開ステータスが廃止の行を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-066	IT-23	検索条件	P2	検索時の検索条件確認	リポジトリの isProductExists コメントと手継のスキップを試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-067	IT-23	検索条件	P2	検索時の検索条件確認	トランザクションがロールバックされた取込を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-068	IT-23	検索条件	P2	検索時の検索条件確認	一覧と反映内容を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-069	IT-23	検索条件	P2	検索時の検索条件確認	履歴一覧を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で検索条件で対象条件に該当する値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-070	IT-23	検索条件	P2	検索時の検索条件確認	成功時出力を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で検索条件で対象条件に該当しない値を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-071	IT-23	検索条件	P2	検索時の検索条件確認	失敗時出力を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-072	IT-23	検索条件	P2	検索時の検索条件確認	副作用を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-073	IT-23	検索条件	P2	検索時の検索条件確認	dtb_csv_import_historyを試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-074	IT-23	検索条件	P2	検索時の検索条件確認	登録/更新を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-075	IT-23	検索条件	P2	検索時の検索条件確認	ファイル必須を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	フォーム NotBlankであること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-076	IT-23	検索条件	P2	検索時の検索条件確認	ナビまたはブックマークで画面を開くを試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-077	IT-23	検索条件	P2	検索時の検索条件確認	送信完了（成功または失敗）を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で検索条件の対象ファイルと処理条件を指定する	"1. 検索条件の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検索条件の該当レコードが取得結果に含まれないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-078	IT-23	実行結果	P2	検索時の実行結果確認	表示件数・ページ変更を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-079	IT-23	実行結果	P2	検索時の実行結果確認	フォーム検証エラー・ファイル null・行数超過を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	HTTP フラッシュのみであること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-080	IT-23	実行結果	P2	検索時の実行結果確認	ヘッダ不備／データ無し／行検証／商品不存在を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-081	IT-23	実行結果	P2	検索時の実行結果確認	取込処理に入った直後を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-082	IT-23	実行結果	P2	検索時の実行結果確認	正常完了後を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で実行結果の対象ファイルと処理条件を指定する	"1. 実行結果の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	実行結果の該当レコードが取得結果に含まれること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-083	IT-26	登録内容	P1	登録時の登録内容確認	結果にエラーが残ったときを試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-084	IT-26	登録内容	P1	登録時の登録内容確認	一覧ページング閲覧状態を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されないこと。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-085	IT-26	登録内容	P1	登録時の登録内容確認	ナビ「商品管理」→「商品CSV管理」→「商品公開CSV登録」を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	登録内容の対象レコードが追加されること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-086	IT-26	登録内容	P1	登録時の登録内容確認	アップロード送信を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	検証・取込後、常に GET …/product/status/csv_upload へリダイレクトされ、フラッシュで結果が示されるであること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-087	IT-26	登録内容	P1	登録時の登録内容確認	履歴の表示件数変更を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	クエリの件数が許容リストに含まれるときだけセッションに保存されるであること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-088	IT-23	登録内容	P1	登録時の登録内容確認	表示要素を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	@admin/Product/csv_product_status.twig は共通テンプレート @admin/Product/base_csv_upload.twig を継承すること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-089	IT-26	登録内容	P1	登録時の登録内容確認	JS 挙動を試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	ファイル選択でカスタムラベルへファイル名表示であること。
m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）	IT-M03-38-ADMIN-PRODUCT-PRODUCT-STATUS-CSV-090	IT-26	登録内容	P1	登録時の登録内容確認	モーダル・ポップアップを試験できる状態である	m03-38_admin_product_product_status_csv（管理画面_商品管理_商品公開CSV登録）（m03_38_admin_product_product_status_csv）で登録内容の対象ファイルと処理条件を指定する	"1. 登録内容の対象レコードと前提状態を用意する
2. 登録・更新・削除・検索のいずれか対象のDB操作を発生させる
3. 対象テーブルのレコード（区分・件数・更新値）を確認する"	送信前確認ダイアログはないこと。
```

## 対象外観点

| 分類・範囲 | 理由 |
|-----------|------|
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
| ファイル処理 / ファイル取込 / 実行結果（IT-16） | 元設計HTMLに該当する処理・I/Fがないため |
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
| ウェブサービス / 外部連携 / 売上・返品（IT-33） | 本機能は対象の外部I/Fを扱わないため |
| その他 | 同種の対象外観点 17 件は上記分類と同じ理由で対象外 |
