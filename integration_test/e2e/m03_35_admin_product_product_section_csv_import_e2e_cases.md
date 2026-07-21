# m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録） E2Eテストケース

元設計: `function_spec_html_preview/pf-eccube3/m03-35_admin_product_product_section_csv_import.html`（正本 `functions/pf-eccube3/m03-35_admin_product_product_section_csv_import.md`）

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/m03_35_admin_product_product_section_csv_import_it_cases.md`（母集合 計90観点行）

期待結果は画面表示・遷移・フラッシュメッセージ・ダウンロード発火・URL など、ブラウザで観測できる結果で判定する。**期待結果は仕様（設計書・観点表・基本設計）由来**とし、実装/POM由来の表示文言や Form 制約（NotBlank/maxSize）をオラクル化しない。取込後の DB 値（`dtb_product_class.section_id` の一括更新・`dtb_csv_import_history` の追記）は画面から直接観測できないため間接/手動として扱う。TSV は既存IT casesの10列に実施管理欄（実施者・実施日・結果・失敗理由）を加えた14列固定。E2E固有情報は TSV 後の付帯表に `テストID` で対応づける。Playwright は本リポジトリでは実行しない（構造参考のみ）。未検証セレクタは `要実機確認`。

設計源は現行 pf-eccube3 のリバースであり、刷新先 ec-cube-enterprise と乖離する箇所は付帯表4（不具合候補）に出す。本機能はカスタマイズ機能だが、刷新先に同等画面 `@admin/Product/csv_product_section.twig`（`ProductSectionCsvController`）が存在し、セレクタを導出できた。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-16 | ファイル取込の実行結果（取込結果フラッシュ） |
| IT-27 | 雛形ファイルのダウンロード発火・取込失敗結果 |
| IT-15 | 未認証ガード（画面/雛形/取込POST）。CSRFトークン欠落/不正時の非取込は手動（E2E-044）。ファイル名表示・状態変化は自動化候補/間接 |
| IT-20 | ログ出力抑止・一時ファイル＝ブラウザ観測外（対象外） |
| IT-25 | アップロード画面のUI部品・フォーマット表・履歴一覧・確認ダイアログ無し・PRGリダイレクト |
| IT-03 | 画面遷移（取込後 csv_upload へリダイレクト・フォーム不正でエラーフラッシュ） |
| IT-13 | URL直接アクセス（履歴ページング件数のクエリ反映） |
| IT-22 | バリデーション（ファイル必須・ヘッダ/データ存在・列数・商品コード必須・規格実在・部門マスタ実在） |
| IT-23 | DB検索（本機能は履歴を種別11固定で表示するのみ。検索条件UIは無し＝対象外） |
| IT-26 | 取込成功時の履歴INSERT・section_id更新の間接確認 |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-001	IT-25	UI部品	P2	アップロード画面にファイル選択欄・アップロードボタン・雛形DLボタンが表示される	管理者ログイン済／SEED-M03-35-ADMIN	—	1. /admin/product/section/csv_upload を開く	ファイル選択欄・「CSVファイルをアップロード」ボタン・「雛形ファイルダウンロード」ボタンが表示されること。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-002	IT-25	表示結果	P3	フォーマット表に「商品コード」必須バッジと「部門コード」が表示される	管理者ログイン済／SEED-M03-35-ADMIN	—	"1. アップロード画面を表示する
2. フォーマット表を確認する"	フォーマット表に「商品コード」（必須バッジ付）と「部門コード」が表示されること。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-003	IT-26	表示結果	P3	取込履歴カードと表示件数プルダウンが表示される	管理者ログイン済／SEED-M03-35-ADMIN	—	"1. アップロード画面を表示する
2. CSVインポート履歴カードを確認する"	「CSVインポート履歴」カードと表示件数プルダウンが表示されること。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-004	IT-25	確認ダイアログ	P3	送信前確認ダイアログが出ず直接送信される	管理者ログイン済／SEED-M03-35-ADMIN	ヘッダ不一致CSV（非破壊）	"1. アップロード画面を表示する
2. ヘッダ不一致CSVを選択しアップロードボタンを押下"	送信前確認ダイアログが介在せずPOSTが実行され、エラーフラッシュが表示されること。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-005	IT-27	実行結果	P2	雛形ダウンロードで product_section_update.csv の取得が発火する	管理者ログイン済／SEED-M03-35-ADMIN	—	"1. アップロード画面を表示する
2. 雛形ファイルダウンロードボタンを押下"	ファイル名 product_section_update.csv のダウンロードが発火すること（内容は手動確認）。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-010	IT-26	登録内容	P1	正常CSV取込で成功フラッシュが表示され履歴が1件追記される	管理者ログイン済／SEED-M03-35-PRODUCT（既存商品コード）／SEED-M03-35-SECTION（既存部門コード）	商品コード=既存,部門コード=既存 の1行CSV	"1. アップロード画面を表示する
2. 正常CSVを選択しアップロード"	成功フラッシュ「登録が完了しました。」が表示され、履歴一覧に当該ファイル名が1件追記されること（破壊的・要シード）。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-011	IT-23	状態変化	P2	部門コード空のCSV取込で当該規格のsection_idがNULLクリアされ成功する	管理者ログイン済／SEED-M03-35-PRODUCT（既存商品コード）	商品コード=既存,部門コード=空 の1行CSV	"1. アップロード画面を表示する
2. 部門コード空のCSVを選択しアップロード"	成功フラッシュ「登録が完了しました。」が表示されること（section_idのNULL更新はDB値のため間接確認・破壊的・要シード）。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-020	IT-22	必須バリデーション	P1	ファイル未選択でアップロードするとエラーが表示され同画面に留まる	管理者ログイン済／SEED-M03-35-ADMIN	ファイル＝未選択	"1. アップロード画面を表示する
2. ファイルを選択せずアップロードボタンを押下"	エラーフラッシュが表示され、アップロード画面（csv_upload）に留まること。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-021	IT-22	その他のバリデーション	P2	ヘッダ不一致のCSVで「CSVのフォーマットが一致しません。」が表示される	管理者ログイン済／SEED-M03-35-ADMIN	ヘッダ行が定義名と異なるCSV	"1. アップロード画面を表示する
2. ヘッダ不一致CSVをアップロード"	「CSVのフォーマットが一致しません。」が表示され、csv_upload に留まること。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-022	IT-22	その他のバリデーション	P2	ヘッダのみ（データ行0）のCSVで「CSVデータが存在しません。」が表示される	管理者ログイン済／SEED-M03-35-ADMIN	ヘッダ行のみのCSV	"1. アップロード画面を表示する
2. ヘッダのみのCSVをアップロード"	「CSVデータが存在しません。」が表示され、csv_upload に留まること。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-023	IT-22	その他のバリデーション	P2	列数が2でないデータ行でフォーマット不一致エラーが表示される	管理者ログイン済／SEED-M03-35-ADMIN	正しいヘッダ＋3列のデータ行CSV	"1. アップロード画面を表示する
2. 列数3のデータ行を含むCSVをアップロード"	「CSVのフォーマットが一致しません。」（行番号付）が表示され、csv_upload に留まること。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-024	IT-22	必須バリデーション	P1	商品コード空のデータ行で必須エラーとなり取込が中断される	管理者ログイン済／SEED-M03-35-ADMIN	商品コード=空,部門コード=任意 の1行CSV	"1. アップロード画面を表示する
2. 商品コード空のCSVをアップロード"	「商品コード は必須項目です。」を含むエラーが表示され、取込が中断され csv_upload に留まること。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-025	IT-22	DBとの相関バリデーション	P1	存在しない商品コードで規格不存在エラーとなり取込が中断される	管理者ログイン済／SEED-M03-35-ADMIN	商品コード=実在しない値,部門コード=空 の1行CSV	"1. アップロード画面を表示する
2. 実在しない商品コードのCSVをアップロード"	「ではデータを取得できません。」を含むエラーが表示され、取込が中断され csv_upload に留まること。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-026	IT-22	DBとの相関バリデーション	P2	非空の部門コードが部門マスタに存在しないとマスタ不存在エラーで中断される	管理者ログイン済／SEED-M03-35-PRODUCT（既存商品コード）	商品コード=既存,部門コード=実在しない値 の1行CSV	"1. アップロード画面を表示する
2. 実在しない部門コードのCSVをアップロード"	「がマスターから取得できません。」を含むエラーが表示され、取込が中断され csv_upload に留まること（規格実在が前提のため要シード）。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-027	IT-22	その他のバリデーション	P2	改行行数が上限(5010)以上のCSVで行数上限超過メッセージが表示される	管理者ログイン済／SEED-M03-35-ADMIN	データ行が5010行以上のCSV	"1. アップロード画面を表示する
2. 5010行以上のCSVをアップロード"	行数上限超過のエラー（{maxRecord} 行を超える…）が表示され、取込されず csv_upload に留まること（大容量生成のため要実機確認）。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-030	IT-22	必須制御	P2	履歴の表示件数を許容リスト内のクエリで指定すると当該件数が反映される	管理者ログイン済／SEED-M03-35-ADMIN	page_count=50,page_no=1	"1. /admin/product/section/csv_upload?page_count=50&page_no=1 を開く
2. 件数プルダウンの選択状態を確認する"	表示件数プルダウンで「50件」が選択状態になること。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-040	IT-15	未認証	P1	未ログインでアップロードURLへアクセスすると管理ログイン画面へ誘導される	未ログイン	—	1. 未ログインで /admin/product/section/csv_upload へアクセス	管理ログイン画面へ誘導されること。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-041	IT-03	画面遷移	P2	取込POST後は成否によらず常にcsv_upload画面へリダイレクトされる	管理者ログイン済／SEED-M03-35-ADMIN	ヘッダ不一致CSV（非破壊）	"1. アップロード画面を表示する
2. ヘッダ不一致CSVをアップロード"	GET /admin/product/section/csv_upload へリダイレクトされること（PRGパターン）。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-006	IT-27	出力結果	P3	雛形CSVがヘッダ1行のみ・キー順・Content-Type application/octet-stream で返る	管理者ログイン済／SEED-M03-35-ADMIN	—	"1. 雛形ファイルダウンロードを発火する
2. 取得ファイルの本文と応答ヘッダを確認する"	本文が1行目のみ＝ヘッダで列順が「商品コード,部門コード」、応答 Content-Type が application/octet-stream であること（内容=自動化候補006c/手動、Content-Type=手動）。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-028	IT-22	その他のバリデーション	P3	ファイルサイズ上限超過でエラーとなり取込されず同画面に留まる	管理者ログイン済／SEED-M03-35-ADMIN	サイズ上限を超える大容量ファイル	"1. アップロード画面を表示する
2. サイズ上限超過ファイルをアップロード"	エラーフラッシュが表示され取込されず csv_upload に留まること（上限値はオラクル化しない／大容量生成のため手動・要実機確認）。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-042	IT-15	未認証	P1	未ログインで雛形DL(csv_template)URLへアクセスすると管理ログイン画面へ誘導される	未ログイン	—	1. 未ログインで /admin/product/section/csv_template へアクセス	管理ログイン画面へ誘導され雛形が得られないこと。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-043	IT-15	未認証	P1	未ログインで取込POST(import)を送ると処理されず管理ログインへ誘導される	未ログイン	multipart CSV	1. 未ログインで POST /admin/product/section/import を送信	取込が実行されず管理ログイン画面へ誘導されること（request-context/multipart・要実機確認のためspecはfixme）。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-050	IT-25	状態変化	P3	同一商品コードを複数データ行に書くと後勝ちで最終行の値が残る	管理者ログイン済／SEED-M03-35-PRODUCT（既存商品コード）	同一商品コードの2行（部門コード異なる）CSV	"1. 同一商品コード2行のCSVをアップロード
2. 規格の部門を別画面で確認"	成功フラッシュが表示され、当該規格の section_id が最終行の値であること（DB値は別画面/間接・手動・破壊的）。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-051	IT-25	状態変化	P3	同一product_codeを持つ複数規格がまとめて同一section_idに更新される	管理者ログイン済／SEED-M03-35-PRODUCT（同一product_code複数規格）	商品コード=既存,部門コード=既存 の1行CSV	"1. 1行CSVをアップロード
2. 同一product_codeの全規格の部門を別画面で確認"	同一 product_code の全規格が同じ section_id に更新されること（DB値は別画面/間接・手動・破壊的）。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-052	IT-26	状態変化	P2	検証エラーでロールバックされたとき履歴に追記されない	管理者ログイン済／SEED-M03-35-ADMIN	規格不存在を含むCSV（途中でbreakAll）	"1. 規格不存在を含むCSVをアップロード
2. 取込履歴一覧を確認"	エラーフラッシュが表示され、取込履歴一覧に当該ファイル名が追記されていないこと（履歴不在で間接・手動）。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-007	IT-25	UI部品	P3	ファイル入力のaccept属性に.csv/.tsv等が含まれCSV/TSVを受け付ける	管理者ログイン済／SEED-M03-35-ADMIN	—	"1. アップロード画面を表示する
2. ファイル選択欄のaccept属性を確認する"	ファイル入力のaccept属性に「.csv」「.tsv」が含まれること（設計書フロント挙動: accept=.csv,text/csv,.tsv,text/tsv）。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-031	IT-22	必須制御	P3	履歴の表示件数を許容リスト外のクエリで指定してもセッション保存されず既定件数のまま	管理者ログイン済／SEED-M03-35-ADMIN	page_count=999,page_no=1	"1. /admin/product/section/csv_upload?page_count=999&page_no=1 を開く
2. 件数プルダウンの選択状態を確認する"	件数プルダウンの選択が「999件」にならず既定の許容件数のままであること（設計書: 許容リストに含まれるときだけセッション保存。030の正常系に対する異常系）。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-029	IT-22	その他のバリデーション	P3	TSV拡張子のファイルはタブ区切りとして取込まれる	管理者ログイン済／SEED-M03-35-PRODUCT（既存商品コード）／SEED-M03-35-SECTION（既存部門コード）	拡張子.tsv・タブ区切り・商品コード=既存,部門コード=既存 の1行	"1. アップロード画面を表示する
2. 拡張子.tsvのタブ区切りファイルをアップロード"	タブ区切りとして列が解釈され取込結果（成功フラッシュ）が得られること（TSV経路・文字コードUTF-8寄せは手動・破壊的・要シード）。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-044	IT-15	CSRF	P2	CSRFトークン欠落/不正の取込POSTは処理されず取込されない	管理者ログイン済／SEED-M03-35-ADMIN	CSRFトークンを欠落/改変したmultipart CSV	"1. アップロード画面を表示する
2. CSRFトークンを欠落/改変して取込POSTを送信"	取込が実行されず（成功フラッシュも履歴追記も生じない）、無効リクエストとして拒否されること（POSTボディ改変が必要なため手動）。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-053	IT-23	登録内容	P3	取込履歴一覧は種別11のみをcreate_date降順で表示し他CSV種別が混在しない	管理者ログイン済／SEED-M03-35-HISTORY（種別11と他種別の履歴を含む）	—	"1. アップロード画面を表示する
2. CSVインポート履歴一覧の行を確認する"	履歴一覧に部門更新CSV（種別11）の履歴のみが新しい順（create_date降順）で表示され、他CSV種別の履歴が混在しないこと（種別・並び順はDB値依存のため手動/間接・要シード）。				
m03-35_admin_product_product_section_csv_import（管理画面_商品管理_部門更新CSV登録）	E2E-M03-35-054	IT-26	状態変化	P3	同一CSV内で後続行がbreakAllすると先行行のUPDATEもロールバックされ一行も確定しない	管理者ログイン済／SEED-M03-35-PRODUCT（既存商品コード）	1行目=既存商品コード(更新可),2行目=規格不存在 の2行CSV	"1. 先行行が更新可・後続行が規格不存在の2行CSVをアップロード
2. 先行行に対応する規格の部門を別画面で確認"	エラーフラッシュが表示され、先行行の規格のsection_idも更新されず元のままであること（一行も確定しない／DB値は別画面・間接・破壊的・要シード）。				
```

## 付帯表1：E2E自動化区分・対象セレクタ・仕様根拠・元IT（TSV外）

DOM id は Symfony Form `CsvImportType` の getBlockPrefix=`admin_csv_import`（`Form/Type/Admin/CsvImportType.php:80-83`）から導出（`import_file`→`#admin_csv_import_import_file`、CsvImportType.php:48）。行番号は ec-cube-enterprise 現行ソース。テンプレートは `src/Eccube/Resource/template/admin/Product/`。

| テストID | E2E可否 | 対象セレクタ（根拠 file:line / 要実機確認） | 仕様根拠 | 元ITケースID |
|----------|---------|----------------------------------------------|----------|--------------|
| E2E-M03-35-001 | E2E自動化 | #admin_csv_import_import_file(base_csv_upload.twig:65) / button#upload-button trans admin.common.csv_upload「CSVファイルをアップロード」(base_csv_upload.twig:73 / messages.ja.yaml:1547) / a#download-template-button trans admin.common.csv_skeleton_download「雛形ファイルダウンロード」(base_csv_upload.twig:83 / messages.ja.yaml:1548) | フロント挙動（表示要素）・利用者視点の入口 | 086,089 |
| E2E-M03-35-002 | E2E自動化 | フォーマット表(base_csv_upload.twig:87-109) / 必須バッジ .badge.bg-primary trans admin.common.required「必須」(base_csv_upload.twig:101 / messages.ja.yaml:1528) / headers=getCsvHeader(商品コード,部門コード ProductSectionCsvController.php:181-187) / 必須=getRequiredCsvHeader(商品コード :194-199) | フロント挙動（フォーマット表・必須バッジ） | 010,011 |
| E2E-M03-35-003 | E2E自動化 | 履歴カード title trans admin.product.csv_import_history_title「CSVインポート履歴」(csv_import_history.twig:6 / messages.ja.yaml:1788) / #page_count_pulldown(csv_import_history.twig:10) | データ整合性（履歴一覧 種別11） | 086 |
| E2E-M03-35-004 | E2E自動化 | dialogイベント無し / フラッシュ .alert-danger(alert.twig:31-48) | フロント挙動（モーダル・ポップアップなし） | 007,013,014 |
| E2E-M03-35-005 | E2E自動化 | a#download-template-button(base_csv_upload.twig:83) / 雛形ファイル名 product_section_update.csv(ProductSectionCsvController.php:58) | 雛形ダウンロード（ファイル名）。内容は手動 | 002,003 |
| E2E-M03-35-006 | 手動(内容/応答ヘッダ・自動化候補006c) | 雛形DL本文1行目=getCsvHeader キー順(商品コード,部門コード ProductSectionCsvController.php:181-187) / Content-Type application/octet-stream(処理フロー雛形#3) | 利用者視点の入口（雛形 ヘッダのみ・キー順・Content-Type） | 002,003 |
| E2E-M03-35-010 | 保留(fixme・自動化未実装/破壊的・要シード) | フラッシュ .alert-success trans admin.register.complete「登録が完了しました。」(alert.twig:21 / messages.ja.yaml:1773) / 履歴行 td(csv_import_history.twig:32) | 処理フロー#8（成功フラッシュ＋履歴INSERT ProductSectionCsvController.php:164-170） | 083,085,087 |
| E2E-M03-35-011 | 保留(fixme・自動化未実装/破壊的・要シード) | フラッシュ .alert-success | エッジケース（部門コード空→section_id NULLクリア／専用手継#3,#5）。DB値は間接 | 009,010,011 |
| E2E-M03-35-020 | E2E自動化 | #upload-button / フラッシュ .alert-danger(alert.twig:31-48) | バリデーション（CsvImportType NotBlank）・エラー処理（フォーム不正→エラーフラッシュ ProductSectionCsvController.php:121-126）。文言は要実機確認 | 021,023,027 |
| E2E-M03-35-021 | E2E自動化 | フラッシュ .alert-danger / trans admin.csv.error.format.header「CSVのフォーマットが一致しません。」(messages.ja.yaml:2209) | 判定順序#3（ヘッダ不正）・バリデーション（CSV全体） | 024,036,050 |
| E2E-M03-35-022 | E2E自動化 | フラッシュ .alert-danger / trans admin.csv.error.data.empty「CSVデータが存在しません。」(messages.ja.yaml:2211) | 判定順序#3（データ空） | 052,059 |
| E2E-M03-35-023 | E2E自動化 | フラッシュ .alert-danger / trans admin.csv.error.format.body「CSVのフォーマットが一致しません。 %d 行目…」(messages.ja.yaml:2210) | 判定順序#4（列数2不一致 MessageStore.php:135 addInvalidColumnCountError） | 030,041 |
| E2E-M03-35-024 | E2E自動化 | フラッシュ .alert-danger / trans admin.csv.error.data.require「%s は必須項目です。…」(messages.ja.yaml:2213)＝商品コード | 判定順序#5（商品コード必須 ProductSectionUpdateImportHandler 列定義 setRequired / MessageStore.php:177 addRequireError） | 027,037,054 |
| E2E-M03-35-025 | E2E自動化 | フラッシュ .alert-danger / trans admin.csv.error.product.not_exists「%d 行目の %s ではデータを取得できません。」(messages.ja.yaml:2218) | 判定順序#6（規格実在 ProductSectionUpdateImportHandler.php:137 addProductNotExistsError＋breakAll） | 048,057,058 |
| E2E-M03-35-026 | 保留(fixme・自動化未実装/要シード) | フラッシュ .alert-danger / trans admin.csv.error.data.not_registered「%s : %s がマスターから取得できません。…」(messages.ja.yaml:2214)＝部門コード | 判定順序#7（部門マスタ実在 ProductSectionUpdateImportHandler.php:164 addMasterNotExistsError＋breakAll） | 039,059,066 |
| E2E-M03-35-027 | 保留(fixme・自動化未実装/大容量・要実機) | フラッシュ .alert-danger / trans admin.csv.error.upload.maxrecord「%maxRecord% 行を超える…」(messages.ja.yaml:1429) | 判定順序#2（改行行数5010以上 ProductSectionCsvController.php:137-141 ADMIN_CSV_IMPORT_MAX_ROWS） | 042,046 |
| E2E-M03-35-028 | 保留(fixme・自動化未実装/大容量・要実機) | フラッシュ .alert-danger（サイズ上限超過）。上限値はオラクル化しない | 判定順序#1（File サイズ上限 eccube_csv_size 配布既定5M）・入力項目 | 045,049 |
| E2E-M03-35-030 | E2E自動化 | #page_count_pulldown 選択option trans admin.common.count「%count%件」(csv_import_history.twig:12 / messages.ja.yaml:1536)。クエリ無し再訪でも保持（セッション保存の観測） | セッション（page_count 許容リスト ProductSectionCsvController.php:75-82）・遷移時引き継ぎ | 060,088 |
| E2E-M03-35-040 | E2E自動化(資格情報不要) | 管理ログイン画面 #login_id(login.twig:26) | 権限・認可（管理FW・未認証は到達不可） GET csv_upload | 005 |
| E2E-M03-35-041 | E2E自動化 | リダイレクト先URL /product/section/csv_upload(ProductSectionCsvController.php:126,173) | 画面遷移（PRG・取込後は常にcsv_uploadへ）・入出力 | 016,022,087 |
| E2E-M03-35-042 | E2E自動化(資格情報不要) | 管理ログイン画面 #login_id(login.twig:26) | 権限・認可（雛形 csv_template も未認証到達不可） | 005 |
| E2E-M03-35-043 | 保留(fixme・自動化未実装/request-context・要実機) | 管理ログイン画面（POST import 未認証時）。multipart送信で取込されないこと | 権限・認可（取込POST import も未認証到達不可） | 005 |
| E2E-M03-35-050 | 手動(DB値・別画面/間接・破壊的) | 規格の部門は別画面で確認（自動観測外）。成功フラッシュ .alert-success | エッジケース（同一商品コード複数行→後勝ち 判定順序#8 / 専用手継#5） | 012 |
| E2E-M03-35-051 | 手動(DB値・別画面/間接・破壊的) | 規格の部門は別画面で確認（自動観測外）。成功フラッシュ .alert-success | エッジケース（同一product_code複数規格→まとめ更新 native UPDATE WHERE product_code） | 013 |
| E2E-M03-35-052 | 手動(履歴不在で間接) | 取込履歴一覧 td(csv_import_history.twig:32) に当該ファイル名が無いこと / エラーフラッシュ .alert-danger | エッジケース（ロールバック時 履歴INSERTなし 処理フロー#7-9 / エラー処理「DBロールバック」） | 014,084 |
| E2E-M03-35-090 | 保留(fixme・自動化候補/ラベルセレクタ要実機確認) | カスタムラベル .custom-file-label（要実機確認）にファイル名表示 | フロント挙動（JS: ファイル選択でカスタムラベルへファイル名表示） | 006,090 |
| E2E-M03-35-007 | E2E自動化 | #admin_csv_import_import_file の accept 属性(base_csv_upload.twig:20 import_file_accept / form_widget attr accept :65) | フロント挙動（表示要素: accept=.csv,text/csv,.tsv,text/tsv 設計書フロント挙動表） | 086,089 |
| E2E-M03-35-031 | E2E自動化 | #page_count_pulldown 選択option(csv_import_history.twig:12)。許容リスト外(999)は非保存＝「999件」option不在/非選択 | セッション/GET画面処理（page_count 許容リスト外は未保存 ProductSectionCsvController.php:75-82 / 処理フロー#3）。030の異常系 | 060,088 |
| E2E-M03-35-029 | 手動(TSV経路・破壊的・要シード) | 取込結果フラッシュ .alert-success（タブ区切り解釈）。拡張子tsv→タブ区切り（バリデーション節 eccube_csv_import_delimiter / 入力項目「拡張子tsvのときタブ」） | バリデーション（TSV区切り・文字コードUTF-8寄せ 設計書バリデーション節）。文字コード変換も同経路で手動 | 045,047,049 |
| E2E-M03-35-044 | 手動(CSRF・POSTボディ改変が必要) | 取込が実行されない（成功フラッシュ/履歴追記なし）。Symfonyフォーム CSRF（form._token base_csv_upload.twig:54） | 入出力（入力にCSRFトークン 設計書入出力節）・権限。トークン欠落/不正で取込・DB更新されない | 004 |
| E2E-M03-35-053 | 手動(DB値依存・要シード) | 取込履歴一覧 行 td(csv_import_history.twig:32)。種別11固定・create_date降順（処理フロー#5 / 集計条件・データ整合性「履歴一覧」 ProductSectionCsvController.php:84-95） | データ整合性（履歴一覧 種別11のみ・他種別混在なし・降順） | 062,063 |
| E2E-M03-35-054 | 手動(DB値・別画面/間接・破壊的) | 先行行の規格 section_id は別画面で確認（自動観測外）。エラーフラッシュ .alert-danger | エッジケース・排他制御（同一CSV内で後続行breakAll→先行行UPDATEもロールバック・一行も確定しない 設計書エッジケース/排他制御節） | 014 |

注: 既存IT cases は観点名のみの定型自動生成スタブ（操作手順が汎用文）であり機能固有シナリオを持たない。本E2Eは設計書本文（処理フロー・判定順序・表示メッセージ・バリデーション）を一次情報源として網羅した。元ITケースID接頭辞は `IT-M03-35-ADMIN-PRODUCT-PRODUCT-SECTION-CSV-IMPORT-NNN`。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合は既存 `m03_35_admin_product_product_section_csv_import_it_cases.md` の関連ID件数（IT-16=1／IT-27=2／IT-15=4／IT-20=2／IT-25=9／IT-03=7／IT-13=1／IT-22=35／IT-23=22／IT-26=7＝計90）。内訳の正本は付帯表2b（行単位明細・全90行）。

「E2E自動化」列には active（実装済）と保留(fixme・未実装)の双方を含む。保留行の内訳は本表下の注に明記する。

| IT-ID | 母集合 | E2E自動化 | 手動/間接 | 対象外 | 対象外/手動の主な理由 |
|-------|:-----:|:--------:|:--------:|:------:|------------------|
| IT-16 | 1 | 1 | 0 | 0 | 取込結果フラッシュは観測可 |
| IT-27 | 2 | 2 | 0 | 0 | 雛形DL発火・取込失敗フラッシュは観測可 |
| IT-15 | 4 | 2 | 2 | 0 | 未認証(画面/雛形/取込POST)・ファイル名表示は観測可/自動化候補。CSRF欠落/不正時の非取込は手動。section_id一括更新は間接 |
| IT-20 | 2 | 1 | 0 | 1 | 送信前確認ダイアログ無し(007=E2E-004)は観測可。一時ファイル退避/削除(008)はブラウザ観測外 |
| IT-25 | 9 | 1 | 6 | 2 | DB更新内容(NULLクリア/複数行/ロールバック)は間接。取込開始/完了ログは対象外 |
| IT-03 | 7 | 4 | 3 | 0 | 遷移・フラッシュは観測可。DB副作用(直接保存)は間接 |
| IT-13 | 1 | 1 | 0 | 0 | 履歴ページング件数のクエリ反映＋セッション保持 |
| IT-22 | 35 | 16 | 1 | 18 | ファイル必須/商品コード必須/フォーマット/データ空/列数/規格実在/部門マスタ実在/行数上限/サイズ上限/許容外件数を自動化。TSV区切り・文字コード(047)は手動。数値/文字種/文字列長/部分入力等のCSV列に存在しない汎用細目は非該当(対象外) |
| IT-23 | 22 | 1 | 2 | 19 | 履歴は種別11固定表示でDB検索UIは無し。page_count保存(088)を自動化、履歴種別11フィルタ・降順(062,063=E2E-053)は手動/間接。残りの汎用検索条件細目は非該当 |
| IT-26 | 7 | 4 | 3 | 0 | 画面表示・PRG・twig継承・ファイル名表示は観測可。履歴追加/section_id更新/先行行ロールバックは間接 |
| 合計 | 90 | 33 | 17 | 40 | **未分類 0** |

注（H4：保留(fixme・未実装)の母集合行）: 自動化33のうち、保留(fixme)でのみカバーされる母集合行は 042/045/046/049(行数・サイズ上限=E2E-027/028) ・059(部門マスタ実在=E2E-026) ・006/090(ファイル名表示=E2E-090) の計7行。残る26行は active 実装で観測する（007 accept・031 page_count許容外 を本監査で追加）。成功系 083/085(=E2E-010/011) は手動/間接。fixme は「自動化予定だが未実装」を意味し、active な自動化網羅とは区別する。

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

スタブは観点が汎用のため同一観点が連番で重複する。H1是正のため**全90行を1行ずつ個別に**確定する（範囲畳み込みを廃止）。区分は付帯表2の集計と一致する。「E2E自動化(保留)」は fixme（自動化予定・未実装）。

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-16 | 実行結果 | E2E自動化 | 010/021（取込結果フラッシュ） |
| 002 | IT-27 | 実行結果 | E2E自動化 | 005（雛形DL発火） |
| 003 | IT-27 | 出力失敗 | E2E自動化 | 021（取込失敗フラッシュ） |
| 004 | IT-15 | CSRF | 手動/間接 | 044（CSRFトークン欠落/不正の取込POSTで取込・DB更新されないこと。POSTボディ改変が必要で手動／仕様「入力＝CSRFトークン」） |
| 005 | IT-15 | 未認証 | E2E自動化 | 040/042/043（未認証→管理ログイン誘導：画面/雛形/取込POST） |
| 006 | IT-15 | 対象データ | E2E自動化(保留) | 090（ファイル選択でカスタムラベルへファイル名表示・fixme/ラベルセレクタ要実機確認） |
| 007 | IT-20 | 出力抑止 | E2E自動化 | 004（IT観点007の期待「送信前確認ダイアログはないこと」＝送信前確認ダイアログ無しは観測可。ログ出力抑止ではない＝誤分類是正） |
| 008 | IT-20 | 識別子 | 対象外 | 一時ディレクトリ退避・削除はブラウザ観測外 |
| 009 | IT-15 | 状態変化 | 手動/間接 | section_id一括更新はDB値（050/051で間接・破壊的） |
| 010 | IT-25 | UI部品 | 手動/間接 | 部門コードtrim空→section_id NULL更新＝DB値（011間接） |
| 011 | IT-25 | UI部品 | 手動/間接 | 同上（NULLクリアはDB値で間接） |
| 012 | IT-25 | 操作起点 | 手動/間接 | 同一商品コード複数行で各行UPDATE＝DB値（050で間接） |
| 013 | IT-25 | 確認ダイアログ | 手動/間接 | 同一product_code複数規格のまとめ更新＝DB値（051で間接）。ダイアログ無しは004でカバー |
| 014 | IT-25 | 確認ダイアログ | 手動/間接 | ロールバック時 履歴INSERTなし＝履歴一覧の不在で間接確認（052）＋先行行UPDATEもロールバックされ一行も確定しない（054・別画面/間接） |
| 015 | IT-25 | 確認ダイアログ | 手動/間接 | 実行後に自動でCSVを再読込しない（規格部門は別画面で確認＝間接） |
| 016 | IT-25 | 送信可否制御 | E2E自動化 | 041（成功・失敗ともcsv_uploadへPRGリダイレクト） |
| 017 | IT-03 | 外部画面 | E2E自動化 | 021（失敗時エラーフラッシュ。「異常終了」ログ部分は対象外） |
| 018 | IT-03 | 画面遷移 | 手動/間接 | 副作用（一括更新・履歴・ログ）はDB/ログで間接 |
| 019 | IT-03 | 画面遷移 | 手動/間接 | dtb_product_class更新＝DB値で間接 |
| 020 | IT-03 | 画面遷移 | 手動/間接 | 直接保存（persist/flush）＝DB値で間接 |
| 021 | IT-03 | 画面遷移 | E2E自動化 | 020（ファイル必須エラー） |
| 022 | IT-03 | 画面遷移 | E2E自動化 | 001/041（ナビから開く→csv_upload表示） |
| 023 | IT-03 | 画面遷移 | E2E自動化 | 020/021（フォーム不正→エラーフラッシュ+リダイレクト） |
| 024 | IT-13 | URL直接アクセス | E2E自動化 | 030（履歴件数クエリ反映＋クエリ無し再訪でセッション保持） |
| 025 | IT-25 | HTTPステータス | 対象外 | 取込開始ログ「部門更新CSV登録開始」はブラウザ観測外 |
| 026 | IT-25 | URL | 対象外 | 完了ログ「部門更新CSV登録完了」＋件数はブラウザ観測外 |
| 027 | IT-22 | 必須バリデーション | E2E自動化 | 020（ファイル必須） |
| 028 | IT-22 | 必須バリデーション | E2E自動化 | 024（商品コード必須） |
| 029 | IT-22 | 文字列長バリデーション | 対象外 | 商品/部門コードにCSV列の長さ制約は無い（DB長は間接）。非該当 |
| 030 | IT-22 | 文字列長バリデーション | 対象外 | 同上 非該当 |
| 031 | IT-22 | 文字列長バリデーション | 対象外 | 同上 非該当 |
| 032 | IT-22 | 文字列長バリデーション | 対象外 | 同上 非該当 |
| 033 | IT-22 | 文字列長バリデーション | 対象外 | 同上 非該当 |
| 034 | IT-22 | 文字列長バリデーション | 対象外 | 同上 非該当 |
| 035 | IT-22 | 数値バリデーション | 対象外 | 商品/部門コードに数値制約は無く非該当 |
| 036 | IT-22 | 数値バリデーション | E2E自動化 | 021（フォーマット不正） |
| 037 | IT-22 | 数値バリデーション | E2E自動化 | 024（商品コード必須/不正） |
| 038 | IT-22 | 数値バリデーション | 対象外 | 数値制約なし 非該当 |
| 039 | IT-22 | 数値バリデーション | 対象外 | 数値制約なし 非該当 |
| 040 | IT-22 | 数値バリデーション | 対象外 | 数値制約なし 非該当 |
| 041 | IT-22 | 数値バリデーション | 対象外 | 数値制約なし 非該当（列数不一致は023で別途） |
| 042 | IT-22 | 数値バリデーション | E2E自動化(保留) | 027（行数上限・fixme） |
| 043 | IT-22 | 文字種バリデーション | 対象外 | 商品/部門コードに文字種制約は無く非該当 |
| 044 | IT-22 | 文字種バリデーション | 対象外 | 同上 非該当 |
| 045 | IT-22 | その他のバリデーション | E2E自動化(保留) | 028（ファイルサイズ上限超過・fixme） |
| 046 | IT-22 | その他のバリデーション | E2E自動化(保留) | 027（行数上限・fixme） |
| 047 | IT-22 | その他のバリデーション | 手動/間接 | 029（TSV拡張子→タブ区切り・文字コードUTF-8寄せは取込結果で観測可・手動/要シード）。一時ファイル退避/削除はブラウザ観測外（008で別途対象外） |
| 048 | IT-22 | その他のバリデーション | E2E自動化 | 025（規格不存在エラー） |
| 049 | IT-22 | その他のバリデーション | E2E自動化(保留) | 028（ファイルサイズ上限・fixme） |
| 050 | IT-22 | その他のバリデーション | E2E自動化 | 021（ヘッダ不一致フォーマット不正） |
| 051 | IT-22 | その他のバリデーション | 対象外 | 該当細目なし（非該当） |
| 052 | IT-22 | その他のバリデーション | E2E自動化 | 022（データ空） |
| 053 | IT-22 | その他のバリデーション | 対象外 | 取込開始ログ＝ブラウザ観測外 |
| 054 | IT-22 | 相関バリデーション | E2E自動化 | 024（商品コード必須/相関） |
| 055 | IT-22 | 相関バリデーション | 対象外 | 該当なし 非該当 |
| 056 | IT-22 | 相関バリデーション | 対象外 | 該当なし 非該当 |
| 057 | IT-22 | 相関バリデーション | E2E自動化 | 025（規格実在） |
| 058 | IT-22 | DBとの相関バリデーション | E2E自動化 | 025（規格実在） |
| 059 | IT-22 | DBとの相関バリデーション | E2E自動化(保留) | 026（部門マスタ実在・fixme/要シード） |
| 060 | IT-22 | 必須制御 | E2E自動化 | 030/031（page_count許容リスト反映＋許容リスト外は非保存で既定のまま） |
| 061 | IT-22 | 部分入力 | 対象外 | CSVファイル1系統に部分入力観点は非該当 |
| 062 | IT-23 | 検索条件 | 手動/間接 | 053（履歴一覧に種別11の履歴が含まれる＝DB検索結果として観測可・要シード。検索UIは無いが履歴クエリ結果は観測可） |
| 063 | IT-23 | 検索条件 | 手動/間接 | 053（他CSV種別の履歴は含まれない＝種別11フィルタの負例・要シード） |
| 064 | IT-23 | 検索条件 | 対象外 | 同上 非該当 |
| 065 | IT-23 | 検索条件 | 対象外 | 同上 非該当 |
| 066 | IT-23 | 検索条件 | 対象外 | 同上 非該当 |
| 067 | IT-23 | 検索条件 | 対象外 | 同上 非該当 |
| 068 | IT-23 | 検索条件 | 対象外 | 同上 非該当 |
| 069 | IT-23 | 検索条件 | 対象外 | 同上 非該当 |
| 070 | IT-23 | 検索条件 | 対象外 | 同上 非該当 |
| 071 | IT-23 | 検索条件 | 対象外 | 同上 非該当 |
| 072 | IT-23 | 検索条件 | 対象外 | 同上 非該当 |
| 073 | IT-23 | 検索条件 | 対象外 | 同上 非該当 |
| 074 | IT-23 | 検索条件 | 対象外 | 同上 非該当 |
| 075 | IT-23 | 検索条件 | 対象外 | 同上 非該当 |
| 076 | IT-23 | 検索条件 | 対象外 | 同上 非該当 |
| 077 | IT-23 | 検索条件 | 対象外 | 同上 非該当 |
| 078 | IT-23 | 実行結果 | 対象外 | 検索実行結果UIなし 非該当 |
| 079 | IT-23 | 実行結果 | 対象外 | 同上 非該当 |
| 080 | IT-23 | 実行結果 | 対象外 | 同上 非該当 |
| 081 | IT-23 | 実行結果 | 対象外 | 同上 非該当 |
| 082 | IT-23 | 実行結果 | 対象外 | 同上 非該当 |
| 083 | IT-26 | 登録内容 | 手動/間接 | 履歴INSERT（対象レコード追加）＝履歴一覧で間接（010・破壊的） |
| 084 | IT-26 | 登録内容 | 手動/間接 | ロールバック時 履歴追加されない＝履歴不在で間接（052） |
| 085 | IT-26 | 登録内容 | 手動/間接 | section_id更新＝DB値で間接（011） |
| 086 | IT-26 | 登録内容 | E2E自動化 | 001/003（アップロード画面・フォーマット表・履歴表示） |
| 087 | IT-26 | 登録内容 | E2E自動化 | 041（取込後 常にcsv_uploadへリダイレクト+フラッシュ） |
| 088 | IT-23 | 登録内容 | E2E自動化 | 030（page_count許容リストのときセッション保存） |
| 089 | IT-26 | 登録内容 | E2E自動化 | 001/007（csv_product_section.twig→base_csv_upload.twig継承＝画面表示で代表＋ファイル入力accept属性） |
| 090 | IT-26 | 登録内容 | E2E自動化(保留) | 090（ファイル選択でカスタムラベルへファイル名表示・fixme/要実機） |

集計（付帯表2と一致）: 自動化 33（うち保留fixme 7行: 006,042,045,046,049,059,090）／手動・間接 17／対象外 40。**未分類 0**。

本監査での是正（誤分類/未分類）: 007（出力抑止→送信前確認ダイアログ無し＝E2E自動化004へ是正）／004（CSRF＝新規手動044へ写像）／047（TSV区切り・文字コード＝新規手動029へ写像）／062・063（履歴種別11フィルタ＝新規手動053へ写像）。これにより対象外44→40・手動14→17・自動化32→33。母集合90・未分類0は維持。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-M03-35-ADMIN | dtb_member（管理者） | 有効な管理者1（ログインID/パスワードは config 既定 ECCUBE_ADMIN_USER/PASS）。商品CSV管理画面にアクセス可能 | fixture(config既定) | 既存利用・撤去不要 | 001-005,020-024,025,027,030,040,041 |
| SEED-M03-35-PRODUCT | dtb_product_class / product_code=`E2E-PSEC-EXIST` | 既知の商品コードを持つ規格行が1件以上実在（規格実在チェックを通過させるため） | fixture/migration | 専用コード。section_id 更新後は元値へ復元（または使い捨て） | 010,011,026,029,054 |
| SEED-M03-35-SECTION | mtb_section / code=`E2E-SEC-EXIST` | 既知の部門コードを持つ部門マスタ行が1件実在（部門マスタ実在チェックを通過させるため） | fixture/migration | 専用コード・参照のみ・撤去 | 010,029 |
| SEED-M03-35-HISTORY | dtb_csv_import_history / csv_import_type_id=11 と 他種別 | 種別11（部門更新CSV）と他CSV種別の履歴行を複数（create_date前後）実在させ、種別フィルタ・降順・他種別非混在を観測させる | fixture/migration | 専用ファイル名接頭辞で識別・参照のみ・撤去 | 053 |

注: 取込成功系(010,011)は `dtb_product_class.section_id` を一括更新する破壊的ケースであり、`dtb_csv_import_history` への追記も生じる。テスト後に section_id を元値へ復元し、履歴行は識別接頭辞(ファイル名 `E2E_*.csv`)で撤去できるようにする。異常系(020-027)は `breakAll` でロールバックされ DB を変更しないため非破壊で、専用シード不要（管理者ログインのみ）。共通ログインは `config/default.config.ts`（ECCUBE_ADMIN_USER/PASS）を流用する。`migration` を充てる場合 DB=ec-cube-enterprise を正典とする。

## 付帯表4：不具合候補（仕様乖離）／要確認

テストは仕様どおりに書き、実装が違えば落ちて検出する。期待値を実装へ書き換えない。

| # | 仕様（設計書/観点表） | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | 画面名（機能名）は「部門更新CSV登録」。sub_title 翻訳キー admin.product.product_section_csv は「部門更新CSV登録」と説明 | messages.ja.yaml:1819 admin.product.product_section_csv=「部門登録CSVアップロード」／:1820「部門登録CSV」／:1821「部門登録CSVファイルフォーマット」 | 設計書は「部門**更新**CSV登録」だが刷新先の表示文言は「部門**登録**CSV…」。表示文言が乖離。UI見出しの完全一致では判定せず構造要素（ファイル入力/ボタン/履歴）で表示確認し、文言乖離は本表で管理 | 001,002 | 不具合候補(表示文言) |
| 2 | 取込検証エラーは管理者向けフラッシュに積まれリダイレクト | ProductSectionCsvController.php:122-126,160-162 addError→flash。base_csv_upload.twig:40-51 の import_errors ブロックは当コントローラから渡されず、エラーはフラッシュ(alert.twig:31-48 .alert-danger)で表示 | 静的確認済。エラーは inline ではなくフラッシュ表示。セレクタは .alert-danger を用いる（要実機確認） | 020-027 | 要確認(表示位置) |
| 3 | ファイル未選択(null)は admin.common.csv_invalid_format をフラッシュ | ProductSectionCsvController.php:121-126（form不正で先に NotBlank エラーを addError）→ :131-135（form valid かつ file null時のみ csv_invalid_format） | 未選択送信は NotBlank で form 不正となり :131 の csv_invalid_format には到達しない見込み。020 の表示文言は要実機確認（NotBlank の validators.ja.yaml 既定文言） | 020 | 要確認(文言) |
| 4 | 商品コードは最大長 DB上255（CSV列に Length 制約なし） | ProductSectionUpdateImportHandler 列定義 productCode（ColumnDefinitions.php:58-61 文字列列・Length無し） | CSV列に長さバリデータが無いため文字列長境界（IT-22 文字列長 029-034）は本機能で非該当。対象外で正しい | 029-034(対象外) | 要確認(非該当) |
| 5 | TSV拡張子のとき区切りはタブ／文字コードはサービス側でUTF-8へ寄せる（SJIS系含む） | バリデーション節（eccube_csv_import_delimiter／拡張子tsv→タブ・eccube_csv_import_enclosure・文字コードフィルタ） | TSVでのヘッダ判定経路・SJIS変換経路は要ソース/実機確認。本E2EはCSV経路のみ自動化、TSV・文字コードは手動(E2E-029) | E2E-029(手動) | 要確認(TSV/文字コード経路) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口（GET csv_upload） | アップロード画面表示・フォーマット表・履歴 | 001,002,003 | カバー |
| 利用者視点の入口（GET csv_template） | 雛形 product_section_update.csv DL発火・ヘッダのみ・キー順・Content-Type | 005（発火）/006・006c（内容/Content-Type） | カバー(内容は手動/fixme) |
| 利用者視点の入口（POST import） | 取込後 常に csv_upload へリダイレクト | 041 | カバー |
| 利用者視点の入口（page_count/page_no） | 許容件数クエリの反映／許容外は非保存 | 030,031 | カバー |
| フロント挙動（表示要素） | ファイル入力・accept・フォーマット表・必須バッジ・履歴 | 001,002,003,007 | カバー（accept属性は007） |
| フロント挙動（JS：ファイル名表示） | カスタムラベルへファイル名表示 | 090 | 保留(fixme・ラベルセレクタ要実機確認) |
| フロント挙動（JS：件数プルダウン変更で即時遷移／送信ローディング） | 件数プルダウン変更で選択URLへ遷移・送信時changeLoading | 030,031（プルダウン値反映で代表） | 部分カバー(プルダウン値反映は030/031で観測。changeLoadingの表示は描画依存で要実機・手動) |
| フロント挙動（モーダル無し） | 送信前確認ダイアログ無し（ネイティブ＋DOMモーダル両否定） | 004 | カバー |
| 処理フロー（GET画面 page_count/page_no） | 許容リスト時のみセッション更新・再訪で保持／許容外は非保存 | 030,031 | カバー(保存自体は間接、保持と許容外非保存は観測) |
| 判定順序#1（File妥当性・サイズ上限） | フォーム不正/サイズ超過でフラッシュ | 020 / 028（サイズ上限・fixme） | 部分カバー(020 active／サイズ上限028は保留fixme・大容量) |
| 判定順序#2（改行行数5010以上） | 行数上限超過メッセージ | 027 | 保留(fixme・大容量) |
| 判定順序#3（ヘッダ・データ行存在） | ヘッダ不正/データ空エラー | 021,022 | カバー |
| 判定順序#4（列数2一致） | 列数不一致でフォーマット不一致 | 023 | カバー |
| 判定順序#5（商品コード必須・部門コード空可） | 商品コード必須エラー | 024 | カバー |
| 判定順序#6（規格実在） | 規格不存在エラーで中断 | 025 | カバー |
| 判定順序#7（部門マスタ実在） | 部門マスタ不存在エラーで中断 | 026 | 保留(fixme・要シード) |
| 判定順序#8（native UPDATE で section_id 設定/NULL） | 成功フラッシュ・section_id更新 | 010,011 | 保留(fixme・破壊的・間接) |
| エッジケース（部門コード空→NULLクリア） | 空で検証スキップ・NULL更新 | 011 | カバー(間接) |
| エッジケース（同一商品コード複数行） | 後勝ち（最終行の値が残る） | 050 | カバー(手動/間接：DB値) |
| エッジケース（同一product_code複数規格） | まとめ更新 | 051 | カバー(手動/間接：DB値) |
| エッジケース（ロールバック時 履歴INSERTなし） | 履歴に追記されない | 052 | カバー(手動/間接：履歴不在) |
| エッジケース（同一CSV内で後続行breakAll→先行行UPDATEもロールバック） | 一行も確定しない | 054 | カバー(手動/間接：DB値・別画面・要シード) |
| 表示メッセージ（成功） | admin.register.complete | 010 | 保留(fixme) |
| 表示メッセージ（フォーマット/データ/列数/必須/規格/マスタ/行数） | 各エラー文言 | 021,022,023,024,025,026,027 | カバー |
| 画面遷移（取込後 csv_upload／ナビから開く） | PRGリダイレクト | 041,001 | カバー |
| エラー処理（フォーム不正/ファイルnull/行数超過/検証エラー） | フラッシュ＋リダイレクト | 020,021-027 | カバー(一部要実機) |
| 権限・認可（未ログイン到達不可：画面/雛形/取込POST） | 管理ログインへ誘導 | 040（csv_upload）/042（csv_template）/043（import POST・fixme） | 部分カバー(040/042 active／POST043は保留fixme) |
| 入出力（入力にCSRFトークン） | トークン欠落/不正時に取込・DB更新されない | 044 | カバー(手動：POSTボディ改変が必要) |
| バリデーション（ファイル必須・CSV全体・各行） | 必須・形式・相関 | 020-026 | カバー |
| バリデーション（TSV区切り・文字コードUTF-8寄せ） | TSV拡張子でタブ区切り取込・SJIS系UTF-8変換 | 029 | カバー(手動：TSV/文字コード経路・要シード) |
| データ整合性・集計条件（履歴一覧 種別11のみ・create_date降順） | 種別11だけ・降順・他CSV種別混在なし | 053 | カバー(手動/間接：DB値・要シード) |
| DB操作（section_id一括更新・履歴INSERT・member_id=ログイン利用者） | 永続化 | 010,011（更新）/053（履歴 member_id作業者表示は間接） | 保留(fixme)/間接 |
| ログ・監査（開始/完了/異常終了ログ・秘匿情報抑止） | 情報ログ | （対象外＝ブラウザ観測外） | 対象外(理由付き) |
| セッション（page_count/page_no） | 整数保存 | 030 | カバー(保存自体は間接) |
| Cookie | 専用Cookieなし | （対象外＝要件なし） | 対象外(要件なし) |
| 排他制御・トランザクション（breakAllでロールバック・行ロック5秒） | ロールバック（先行行UPDATEも含め一行も確定しない） | 054（先行行ロールバック・手動/間接）／異常系020-026で非破壊＝間接、ロック時間は対象外 | 間接/対象外 |
| 試行制限 | レートリミット無し | （対象外＝要件なし） | 対象外(要件なし) |
| API/バッチ | 起動しない | （対象外＝要件なし） | 対象外(要件なし) |

未カバーはいずれも理由（ブラウザ観測外・DB値で間接・JS依存で要実機・大容量で要実機・TSV経路は手動・要件なし）を明記済み。判定順序#1〜#8は各分岐をケース化し、#1サイズ上限(028)・#2行数(027)・#7マスタ実在(026)・#8成功系(010,011)は fixme（破壊的・大容量・要シード）、#7サイズ系は大容量のため fixme とした。CSRF・ファイル名表示・雛形内容も母集合へ写像済み（044 手動／090 fixme／006 手動・006c fixme）。本監査で accept属性(007)・page_count許容外(031)・TSV/文字コード(029 手動)・履歴種別11降順(053 手動)・CSRF欠落/不正(044 手動)・先行行ロールバック(054 手動) を追加し、付帯表5の「カバー」過大主張（CSRF=004／accept=001のみ／session=030のみ）と fixme のみ行を「保留(fixme)／部分カバー」へ是正した。
