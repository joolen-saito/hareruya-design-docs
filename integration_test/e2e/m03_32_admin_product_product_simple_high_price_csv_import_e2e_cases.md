# m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録） E2Eテストケース

元設計: `function_spec_html_preview/pf-eccube3/m03-32_admin_product_product_simple_high_price_csv_import.html`（正本 `functions/pf-eccube3/m03-32_admin_product_product_simple_high_price_csv_import.md`）

テスト観点: `integration_test/integration-test-viewpoints.md`（汎用観点カタログ 全516行・全機能共通）／ 既存IT: `integration_test/m03_32_admin_product_product_simple_high_price_csv_import_it_cases.md`（本機能の母集合 計90観点行）

監査単位の定義: 分類の母集合は本機能の既存IT cases 90行とする。これは汎用観点カタログ（viewpoints.md）のうち本機能に該当する観点を機能固有化した母集合であり、カタログ側のIT-ID（IT-03/13/15/16/20/22/23/25/26/27）は全て本表で分類済み（IT-IDレベルで未分類0）。viewpoints.md の汎用行のうち本機能に非該当の観点（日付/メールアドレス/サロゲートペア/コード値範囲/任意項目・小数桁などの行。本機能の恒久入力はCSVファイル＝商品コード/基準価格の2列のみ）は「本機能に該当なし」として母集合外＝該当なし扱い。したがって「未分類0」は本機能母集合（90行）に対する主張であり、viewpoints.md全516行に対する写像主張ではない（汎用行の非該当判定は機能仕様＝CSV2列に基づく）。

期待結果は画面表示・遷移・URL・フラッシュ・ダウンロード発火などブラウザで観測できる結果で判定する。**期待結果は仕様（設計書・観点表・基本設計）由来**とし、実装/POM由来の表示文言・Form制約（NotBlank/maxSize）をオラクル化しない。設計源は pf-eccube3 のリバースだが、刷新先 ec-cube-enterprise に同等実装（`ProductSimpleHighPriceCsvController`）が存在し、セレクタはそこから根拠付きで導出する（位置情報のみ）。TSV は既存IT casesと同一の 10 列固定。E2E固有情報は TSV 後の付帯表に `テストID` で対応づける。Playwright は本リポジトリでは実行しない（構造参考のみ）。未検証セレクタは `要実機確認`。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-16 | ファイル取込の実行結果（取込成功＝DB更新は手動/間接） |
| IT-27 | 履歴件数プルダウン変更による一覧再描画（URL反映） |
| IT-15 | 未認証ガード／CSRFトークン改ざん時のPOST後エラーフラッシュ（対象データのファイル処理後削除はブラウザ観測外） |
| IT-20 | 取込ファイルの処理後削除・ログ識別子（＝ブラウザ観測外） |
| IT-25 | UI部品・確認モーダル不在・失敗/成功フラッシュ（操作起点） |
| IT-03 | 画面遷移（POST→アップロード画面へリダイレクト）・前段エラー戻り |
| IT-13 | URL直接アクセス（高額条件外の継続＝間接） |
| IT-22 | ファイル必須・列数/ヘッダ一致・必須列・数値/桁・商品コード相関・行数キャップ |
| IT-26 | 登録/更新内容（dtb_product_class／dtb_csv_import_history）＝手動/間接 |
| IT-23 | 本機能はDB検索を行わない（履歴一覧は件数プルダウンのみ）／実行結果ログは観測外 |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-001	IT-25	UI部品	P1	アップロード画面にファイル入力・アップロードボタン・雛形ダウンロードリンクが表示される	管理者ログイン済／SEED-M03-32-ADMIN	—	"1. /admin/product/simple_high_price/csv_upload を開く"	ファイル入力・「CSVファイルをアップロード」ボタン・「雛形ファイルダウンロード」リンクが表示されること。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-002	IT-03	外部画面	P2	サブタイトル「高額商品価格変更CSVアップロード」が表示される	管理者ログイン済／SEED-M03-32-ADMIN	—	"1. アップロード画面を開く"	サブタイトルに「高額商品価格変更CSVアップロード」が表示されること。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-003	IT-25	UI部品	P3	ボックス見出し「高額商品価格変更CSV」が表示される	管理者ログイン済／SEED-M03-32-ADMIN	—	"1. アップロード画面を開く"	アップロードボックスの見出しに「高額商品価格変更CSV」が表示されること。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-004	IT-22	必須制御	P2	フォーマット表に商品コード・基準価格が必須として表示される	管理者ログイン済／SEED-M03-32-ADMIN	—	"1. アップロード画面を開く
2. フォーマット表を確認する"	フォーマット表に「商品コード」「基準価格」が表示され、両列に必須バッジ（計2個）が付くこと。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-005	IT-27	URL	P2	雛形ダウンロードで simple_high_price_template.csv の取得が発火する	管理者ログイン済／SEED-M03-32-ADMIN	—	"1. アップロード画面を開く
2. 「雛形ファイルダウンロード」を押下"	ダウンロードが発火し、ファイル名が simple_high_price_template.csv であること（内容は手動確認）。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-006	IT-25	確認ダイアログ	P2	送信前の確認ダイアログが表示されず直接送信される	管理者ログイン済／SEED-M03-32-ADMIN	非破壊CSV（列数不一致）	"1. アップロード画面を開く
2. CSVを選択しアップロードボタンを押下"	確認ダイアログが表示されず、POSTが直接実行されエラーフラッシュが表示されること。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-008	IT-27	実行結果	P2	履歴件数プルダウン変更でpage_countを反映したURLへ遷移する	管理者ログイン済／SEED-M03-32-ADMIN	件数＝既定50以外の許容候補	"1. アップロード画面を開く
2. 取込履歴の件数プルダウンを変更する"	page_count クエリを反映したURLへ遷移し履歴一覧が再描画されること。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-040	IT-15	未認証	P1	未ログインでアップロードURLへアクセスすると管理ログイン画面へ誘導される	未ログイン	—	"1. /admin/product/simple_high_price/csv_upload へ直接アクセス"	管理ログイン画面へ誘導されること。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-020	IT-22	必須バリデーション	P1	ファイル未選択でアップロードするとエラーフラッシュが表示され同画面に留まる	管理者ログイン済／SEED-M03-32-ADMIN	ファイル＝未選択	"1. アップロード画面を開く
2. ファイル未選択のままアップロードボタンを押下"	エラーフラッシュが表示され、取込されずアップロード画面に留まること。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-021	IT-22	部分入力	P2	列数不一致のCSVで「CSVのフォーマットが一致しません。」	管理者ログイン済／SEED-M03-32-ADMIN	1列のみのCSV	"1. アップロード画面を開く
2. ヘッダ・データとも1列のCSVをアップロード"	「CSVのフォーマットが一致しません。」が表示され、取込されず画面に留まること。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-022	IT-22	相関バリデーション	P2	ヘッダ名不一致のCSVでエラーフラッシュが表示され同画面に留まる	管理者ログイン済／SEED-M03-32-ADMIN	ヘッダ名がcol1,col2	"1. アップロード画面を開く
2. ヘッダ名不一致のCSVをアップロード"	エラーフラッシュが表示され、取込されず画面に留まること。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-023	IT-22	その他のバリデーション	P2	ヘッダのみ（データ行0）で「CSVデータが存在しません。」	管理者ログイン済／SEED-M03-32-ADMIN	ヘッダ行のみ	"1. アップロード画面を開く
2. ヘッダ行のみのCSVをアップロード"	「CSVデータが存在しません。」が表示され、取込されず画面に留まること。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-030	IT-22	必須バリデーション	P2	基準価格が空で必須エラーが表示され同画面に留まる	管理者ログイン済／SEED-M03-32-ADMIN	基準価格＝空	"1. アップロード画面を開く
2. 基準価格を空にしたCSVをアップロード"	「…は必須項目です。」が表示され、取込されず画面に留まること。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-031	IT-22	必須バリデーション	P2	商品コードが空で必須エラーが表示され同画面に留まる	管理者ログイン済／SEED-M03-32-ADMIN	商品コード＝空	"1. アップロード画面を開く
2. 商品コードを空にしたCSVをアップロード"	「…は必須項目です。」が表示され、取込されず画面に留まること。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-032	IT-22	数値バリデーション	P2	基準価格が非数値で数値エラーが表示され同画面に留まる	管理者ログイン済／SEED-M03-32-ADMIN	基準価格＝abc	"1. アップロード画面を開く
2. 基準価格に非数値を入れたCSVをアップロード"	「…は0以上の数値を設定してください。」が表示され、取込されず画面に留まること。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-033	IT-22	文字列長バリデーション	P2	基準価格が桁超過(10桁)で桁エラーが表示され同画面に留まる	管理者ログイン済／SEED-M03-32-ADMIN	基準価格＝1234567890（10桁）	"1. アップロード画面を開く
2. 基準価格を10桁にしたCSVをアップロード"	「…桁以内の数値を設定してください。」が表示され、取込されず画面に留まること。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-034	IT-22	DBとの相関バリデーション	P1	存在しない商品コードでデータ取得不可エラーが表示され同画面に留まる	管理者ログイン済／SEED-M03-32-ADMIN	実在しない商品コード＋有効な基準価格	"1. アップロード画面を開く
2. 実在しない商品コードのCSVをアップロード"	「…ではデータを取得できません。」が表示され、打ち切り・ロールバックで画面に留まること。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-050	IT-22	その他のバリデーション	P2	行数過多(>=5010行)で行数キャップエラーが表示され取込されない	管理者ログイン済／SEED-M03-32-ADMIN	5010行以上のCSV	"1. アップロード画面を開く
2. 5010行以上のCSVをアップロード"	「…行を超えるCSVファイルは登録できません。」が表示され、インポータ未起動で画面に留まること。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-010	IT-26	更新内容	P1	セール中の高額対象規格を取込むと成功フラッシュが表示され基準価格のみ更新される	管理者ログイン済／SEED-M03-32-PC-SALE	実在するセール中の高額対象商品コード＋基準価格	"1. アップロード画面を開く
2. 対象CSVをアップロード"	「登録が完了しました。」（成功）に加えセール中規格には警告フラッシュ（sell_price_not_updated＝販売価格は更新されない旨 messages:1808）が表示され、standard_priceのみ更新（price02は不変）・取込履歴に1行追加されること（DB値は手動/間接）。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-011	IT-26	更新内容	P1	セール外の高額対象規格を取込むと成功フラッシュが表示されstandard_price/price02が同値更新される	管理者ログイン済／SEED-M03-32-PC-NOSALE	実在するセール外の高額対象商品コード＋基準価格	"1. アップロード画面を開く
2. 対象CSVをアップロード"	「登録が完了しました。」が表示され、standard_priceとprice02が同値で更新・取込履歴に1行追加されること（DB値は手動/間接）。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-012	IT-13	URL直接アクセス	P2	商品コードは存在するが高額対象規格でないと成功表示も履歴追加もされない	管理者ログイン済／SEED-M03-32-PC-NOMATCH	実在するが高額対象外の商品コード	"1. アップロード画面を開く
2. 対象CSVをアップロード"	「対象の商品規格がありません。」がエラーとして表示され、成功フラッシュ・取込履歴追加がいずれも行われないこと。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-013	IT-22	相関バリデーション	P2	同一商品コードに複数規格が存在すると重複エラーで打ち切られる	管理者ログイン済／SEED-M03-32-PC-DUP	1商品コードに複数規格が紐づく値	"1. アップロード画面を開く
2. 対象CSVをアップロード"	商品コード重複エラーが表示され、breakAllでトランザクション全体がロールバックされること。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-009	IT-25	UI部品	P2	ファイル入力がCSV/TSV形式を受け付ける（accept属性）	管理者ログイン済／SEED-M03-32-ADMIN	—	"1. アップロード画面を開く
2. ファイル入力のaccept属性を確認する"	ファイル入力のaccept属性に .csv と .tsv（text/csv・text/tsv 相当）が含まれること。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-024	IT-22	その他のバリデーション	P2	空ファイル（ヘッダ不成立）でエラーフラッシュが表示され同画面に留まる	管理者ログイン済／SEED-M03-32-ADMIN	空のCSV（0バイト／ヘッダ行なし）	"1. アップロード画面を開く
2. 空ファイルをアップロード"	エラーフラッシュが表示され、取込されずアップロード画面に留まること（ヘッダ成立せず前段で打ち切り・非破壊）。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-035	IT-22	数値バリデーション	P2	基準価格が負値(-1)で数値エラー（0以上）が表示され同画面に留まる	管理者ログイン済／SEED-M03-32-ADMIN	基準価格＝-1	"1. アップロード画面を開く
2. 基準価格に負値を入れたCSVをアップロード"	「…は0以上の数値を設定してください。」が表示され、取込されず画面に留まること（数値下限違反・非破壊）。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-041	IT-15	CSRF	P2	CSRFトークンを改ざんして送信するとエラーフラッシュが表示され取込されない	管理者ログイン済／SEED-M03-32-ADMIN	改ざんしたCSRFトークン＋任意CSV	"1. アップロード画面を開く
2. フォームの隠しCSRFトークンを書き換えて送信"	フォーム不正としてエラーフラッシュが表示され、取込されずアップロード画面に留まること（CSRF検証失敗・非破壊）。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-007	IT-27	実行結果	P3	取込履歴の見出し・列（ファイル名／アップロード日時／作業者）と0件時表示が確認できる	管理者ログイン済／SEED-M03-32-ADMIN	—	"1. アップロード画面を開く
2. 取込履歴セクションを確認する"	取込履歴セクションが表示され、ファイル名・アップロード日時・作業者の列見出しと履歴0件時の表示が仕様どおりであること（具体セレクタ／文言は要実機確認＝手動）。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-051	IT-22	その他のバリデーション	P3	ファイルサイズ上限超過でエラーフラッシュが表示され取込されない	管理者ログイン済／SEED-M03-32-ADMIN	上限(eccube_csv_size)超過サイズのCSV	"1. アップロード画面を開く
2. サイズ上限超過のファイルをアップロード"	サイズ制約エラーのフラッシュが表示され、取込されず画面に留まること（>上限ファイル生成が重く手動／間接）。
m03-32_admin_product_product_simple_high_price_csv_import（管理画面_商品管理_高額商品価格変更CSV登録）	E2E-M03-32-014	IT-26	更新内容	P2	同一取込内でinfo(セール中警告)とerror(対象規格なし)が両立し成功フラッシュ・履歴INSERTが行われない	管理者ログイン済／SEED-M03-32-PC-MIXED	セール中対象行＋高額対象外行を混在させたCSV	"1. アップロード画面を開く
2. 混在CSVをアップロード"	警告フラッシュ(sell_price_not_updated)とエラーフラッシュ(対象規格なし)が同時に表示され、hasError真のため成功フラッシュ・履歴追加がいずれも行われないこと（要混在SEED・破壊的＝手動/fixme）。
```

## 付帯表1：E2E自動化区分・セレクタ・仕様根拠・元ITケースID（TSV外）

DOM id は Symfony Form `CsvImportType` の getBlockPrefix=`admin_csv_import`（`Form/Type/Admin/CsvImportType.php:79-82`）から導出（`import_file`→`#admin_csv_import_import_file`）。ボタン/見出しは `base_csv_upload.twig`＋`csv_product_simple_high_price.twig`＋`csv_import_history.twig`＋flash `alert.twig` 由来。フラッシュは addError('admin')→`.alert-danger`（alert.twig:42）、addSuccess('admin')→`.alert-success`（:22）、addWarning('admin')→`.alert-warning`（:52）。行番号は ec-cube-enterprise 現行ソース。

| テストID | E2E可否 | 対象セレクタ（根拠 file:line / 要実機確認） | 仕様根拠 |
|----------|---------|----------------------------------------------|----------|
| E2E-M03-32-001 | E2E自動化(要ログイン) | #admin_csv_import_import_file(base_csv_upload.twig:65) / #upload-button(base_csv_upload.twig:73 trans admin.common.csv_upload messages:1547) / a#download-template-button(base_csv_upload.twig:83 trans admin.common.csv_skeleton_download messages:1548) | フロント挙動（表示要素） |
| E2E-M03-32-002 | E2E自動化(要ログイン) | サブタイトル trans admin.product.simple_high_price_csv=「高額商品価格変更CSVアップロード」(csv_product_simple_high_price.twig:5 / messages:1804) | 利用者視点の入口（サブタイトル） |
| E2E-M03-32-003 | E2E自動化(要ログイン) | h4.card-title csv_box_title=admin.product.simple_high_price_csv_upload_title(base_csv_upload.twig:58 / messages:1805 / Controller:92) | フロント挙動（見出し） |
| E2E-M03-32-004 | E2E自動化(要ログイン) | フォーマット表 td(base_csv_upload.twig:95-107)/span.badge trans admin.common.required(base_csv_upload.twig:101 messages:1528)。必須2列=getRequiredCsvHeader(Controller:197-203) | バリデーション・入力項目（商品コード/基準価格 必須） |
| E2E-M03-32-005 | E2E自動化(要ログイン) | a#download-template-button(base_csv_upload.twig:83) / 応答ファイル名 simple_high_price_template.csv(Controller:56) | CSV雛形取得（filename / octet-stream） |
| E2E-M03-32-006 | E2E自動化(要ログイン) | page.on('dialog') 非発火 / #upload-button(base_csv_upload.twig:73) / .alert-danger(alert.twig:42) | モーダル・ポップアップ（確認モーダルなし） |
| E2E-M03-32-008 | E2E自動化(要ログイン) | #page_count_pulldown(csv_import_history.twig select。option value=path(history_page_route,{page_no,page_count})) | 遷移時に引き継ぐ状態（件数→URL/セッション） |
| E2E-M03-32-040 | E2E自動化(資格情報不要) | 管理ログイン画面 #login_id(login.twig) | 権限・認可（未サインインは管理ログインへ） |
| E2E-M03-32-020 | E2E自動化(要ログイン) | #upload-button / .alert-danger(alert.twig:42) | 処理フロー(import)#2 フォーム不正→adminエラーフラッシュ・取込なし(Controller:121-127)。文言は要実機確認 |
| E2E-M03-32-021 | E2E自動化(要ログイン) | .alert-danger / addInvalidColumnCountError=admin.csv.error.format.body(MessageStore.php:134-138 / messages:2210) | バリデーション(列数一致 BaseCsvImportHandler.php:72-77) |
| E2E-M03-32-022 | E2E自動化(要ログイン) | .alert-danger / addColumnNotExistsError=admin.csv.error.product.not_exists(BaseCsvImportHandler.php:86-90 / messages:2218) | バリデーション(ヘッダ列名一致)。文言は要実機確認 |
| E2E-M03-32-023 | E2E自動化(要ログイン) | .alert-danger / addNoDataError=admin.csv.error.data.empty(MessageStore.php:146-150 / messages:2211) | エラー処理(ヘッダ/データ無し前段) |
| E2E-M03-32-030/031 | E2E自動化(要ログイン) | .alert-danger / RequiredValidator→addRequireError=admin.csv.error.data.require(RequiredValidator.php:37 / messages:2213) | バリデーション(基準価格/商品コード 必須=ColumnDefinitions setRequired SimpleHighPriceImportHandler.php:132-133) |
| E2E-M03-32-032 | E2E自動化(要ログイン) | .alert-danger / NumericValidator→addNumericError=admin.csv.error.product.over_zero(NumericValidator.php:47 / messages:2220) | バリデーション(基準価格 符号なし数値 ColumnDefinitions:434-436) |
| E2E-M03-32-033 | E2E自動化(要ログイン) | .alert-danger / NumericMaxLengthValidator→addNumericMaxLengthError=admin.csv.error.product.max_length(NumericMaxLengthValidator.php:58 / messages:2221) | バリデーション(基準価格 最大9桁 ColumnDefinitions:436) |
| E2E-M03-32-034 | E2E自動化(要ログイン) | .alert-danger / addProductNotExistsError=admin.csv.error.product.not_exists(MessageStore.php:283-288 / messages:2218、SimpleHighPriceImportHandler.php:148-156 existsByProductCode→breakAll) | 検証フェーズ(商品コード存在チェック) |
| E2E-M03-32-050 | E2E自動化(要ログイン・5010行生成) | .alert-danger / getCsvImportMaxRowsExceededMessage=admin.csv.error.upload.maxrecord(AbstractController.php:442-446 / messages:1429、ADMIN_CSV_IMPORT_MAX_ROWS=5010 :364、Controller:137-141) | 行数キャップ(>=5010) |
| E2E-M03-32-010 | 手動/間接(要SEED破壊的・fixme) | .alert-success(alert.twig:22 admin.register.complete messages:1773) / .alert-warning(alert.twig:52 simple_high_price_csv.sell_price_not_updated messages:1808) / 取込履歴テーブル(csv_import_history.twig) | 行更新#1(セール中=standard_priceのみ Handler:83-90 / replaceStandardPriceOnly) ＋ 履歴INSERT(Controller:167-173) |
| E2E-M03-32-011 | 手動/間接(要SEED破壊的・fixme) | .alert-success(alert.twig:22 messages:1773) / 取込履歴テーブル | 行更新#2(セール外=standard_price/price02同値 Handler:93-96 / replaceStandardPriceAndPrice02) |
| E2E-M03-32-012 | 手動/間接(要SEED・fixme) | .alert-danger(simple_high_price_csv.no_matching_product_class messages:1809) / 成功フラッシュ・履歴の不在 | 行更新#3(対象規格なし Handler:99-104) ＋ データ整合性(hasError時は完了表示・履歴なし Controller:161-174) |
| E2E-M03-32-013 | 手動/間接(要SEED・fixme) | .alert-danger(product_code_duplicated messages:2225) | 検証フェーズ(同一規格コード2件以上→breakAll Handler:163-176 isProductCodeUnique) |
| E2E-M03-32-009 | E2E自動化(要ログイン) | #admin_csv_import_import_file の accept 属性(base_csv_upload.twig:20,65＝.csv,text/csv,.tsv,text/tsv) | フロント挙動（ファイル入力の許容形式）。期待は設計書記載の許容形式由来（accept値そのものはオラクル化せず .csv/.tsv 包含で判定） |
| E2E-M03-32-024 | E2E自動化(要ログイン) | #upload-button / .alert-danger(alert.twig:42)。空ファイル→ヘッダ不成立で前段打ち切り(インポータ共通順序#2 / BaseCsvImportHandler) | バリデーション(インポータ前段：ヘッダ成立せず)。文言は要実機確認(no_data/format いずれか) |
| E2E-M03-32-035 | E2E自動化(要ログイン) | .alert-danger / NumericValidator→addNumericError=admin.csv.error.product.over_zero(NumericValidator.php:47 / messages:2220) | バリデーション(基準価格 符号なし数値の下限違反＝負値 ColumnDefinitions:434-436) |
| E2E-M03-32-041 | E2E自動化(要ログイン) | form#upload-form の隠しCSRFトークン input(name 末尾 [_token]＝blockPrefix admin_csv_import の _token)を改ざん→ .alert-danger(alert.twig:42) | 入出力(CSRFトークン)／処理フロー(import#2 フォーム不正→adminエラーフラッシュ・取込なし Controller:121-127)。token選択は要実機確認 |
| E2E-M03-32-007 | 手動/間接(要実機確認 selector) | 取込履歴セクション(csv_import_history.twig 見出し・列ファイル名/アップロード日時 Y-m-d H:i/作業者・0件表示) | フロント挙動（取込履歴の表示内容）。見出し/列文言の具体セレクタは未検証＝要実機確認 |
| E2E-M03-32-051 | 手動/間接(>上限ファイル生成が重い) | .alert-danger / Symfony File 制約(サイズ上限 eccube_csv_size=5MB相当) | バリデーション(ファイルサイズ上限)。上限超過ファイル生成コストのため手動 |
| E2E-M03-32-014 | 手動/間接(要SEED-MIXED・破壊的・fixme) | .alert-warning(simple_high_price_csv.sell_price_not_updated messages:1808) ＋ .alert-danger(no_matching_product_class messages:1809) ／ .alert-success・履歴の不在 | エッジケース(info と error の両立 設計書「業務ルール・計算/エッジケース」) ＋ データ整合性(hasError真→完了表示・履歴なし Controller:161-174)。breakAll無しでセール行はコミットされうる＝破壊的 |

注: 既存IT cases（接頭辞 `IT-M03-32-ADMIN-PRODUCT-PRODUCT-SIMPLE-HIGH-PRICE-CSV-IMPORT-NNN`）は観点名のみの定型自動生成スタブ（操作手順が「対象画面を表示する」等の汎用文）であり機能固有シナリオを持たない。本E2Eは設計書本文（処理フロー・行更新フェーズ・エラー処理・バリデーション）を一次情報源として網羅した。行単位の対応は付帯表2bが正本。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合は既存 `m03_32_..._it_cases.md` の関連ID件数（IT-16=1/IT-27=2/IT-15=4/IT-20=2/IT-25=9/IT-03=7/IT-13=1/IT-22=35/IT-26=26/IT-23=3＝計90）。各観点行を E2E自動化／手動・間接／対象外(理由) に振り分ける。本機能の恒久入力はファイル（CSV）とCSRFトークンのみ（業務ルール節）であり、画面入力欄はほぼ存在しない。CSVの中身に対する検証は取込パイプライン側で起き、観測点はフラッシュ・画面遷移・ダウンロード発火・履歴一覧の件数反映に限られる。DB更新値・ログ・ファイル削除・トランザクション内部はブラウザ観測外。

| IT-ID | 母集合 | E2E自動化 | 手動/間接 | 対象外 | 対象外/手動の主な理由 |
|-------|:-----:|:--------:|:--------:|:------:|------------------|
| IT-16 | 1 | 0 | 1 | 0 | 取込成功の実行結果＝DB更新値照合は手動/間接 |
| IT-27 | 2 | 1 | 0 | 1 | 件数プルダウンはE2E化。出力失敗の観測は困難で対象外 |
| IT-15 | 4 | 2 | 1 | 1 | 未認証・CSRFトークン改ざん(POST後エラーフラッシュ)はE2E。対象データ(ファイル処理後削除)はブラウザ観測外 |
| IT-20 | 2 | 0 | 0 | 2 | ファイル処理後削除・ログ識別子＝ブラウザ観測外 |
| IT-25 | 9 | 1 | 4 | 4 | 失敗フラッシュはE2E。成功フラッシュ/UI-DB相関は手動。トランザクション/Doctrine/開始・異常終了ログは観測外 |
| IT-03 | 7 | 5 | 1 | 1 | 画面遷移・前段エラー戻り・行数キャップ・到達はE2E。DB直接保存は手動、アプリログは観測外 |
| IT-13 | 1 | 0 | 1 | 0 | 高額条件外の継続は要シードで手動/間接 |
| IT-22 | 35 | 16 | 15 | 4 | 必須/列数/数値/桁/相関(存在)/行数はE2E。正常継続(成功)は手動、ファイル削除/Doctrine/異常終了ログ/show_sale_alertは観測外 |
| IT-26 | 26 | 5 | 18 | 3 | 失敗フラッシュ/テンプレ表示/桁・必須エラー/行数はE2E。DB登録更新値は手動、ログ/show_sale_alert/ファイル削除は観測外 |
| IT-23 | 3 | 1 | 0 | 2 | 確認モーダルなしはE2E。Doctrine cache・異常終了ログは観測外（本機能は検索なし） |
| 合計 | 90 | 31 | 41 | 18 | **未分類 0** |

注: 対象外18件・手動41件はいずれも「ブラウザで観測不能（DB内部値・ログ・ファイル削除・トランザクション/Doctrine内部）」「要シードの破壊的DB更新（成功系・更新値照合）」が理由であり、放置ではない。CSRFは当初対象外だったがトークン改ざん時のPOST後エラーフラッシュが観測可能なため E2E自動化（041）へ是正した。新規E2Eケース 009/024/035/041(自動化)・007/051/014(手動・fixme) は既存IT母集合の写像強化であり母集合90行は不変。

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

既存IT cases の各行（`...-NNN`）の観点を、本機能でのブラウザ観測可否で `E2E自動化／手動・間接／対象外` に分類し、対応E2EケースIDまたは理由を付す。

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-16 | 実行結果 | 手動/間接 | 取込成功のDB更新値照合（010/011で操作・値はDB確認） |
| 002 | IT-27 | 実行結果 | E2E自動化 | 008（件数プルダウン→URL反映） |
| 003 | IT-27 | 出力失敗 | 対象外 | 出力（雛形DL）失敗の発生・観測が困難 |
| 004 | IT-15 | CSRF | E2E自動化 | 041（CSRFトークン改ざん→フォーム不正でPOST後エラーフラッシュ・取込なし・画面滞留）。当初「Form内部で観測外」としたが改ざん時の結果はブラウザ観測可能と是正 |
| 005 | IT-15 | 未認証 | E2E自動化 | 040（未ログイン→管理ログイン誘導） |
| 006 | IT-15 | 対象データ | 対象外 | show_sale_alert未参照（Twigで観測不可）／取込ファイルは処理後削除＝サーバ内部 |
| 007 | IT-20 | 出力抑止 | 対象外 | 取込ファイルの処理後削除＝サーバ内部、観測外 |
| 008 | IT-20 | 識別子 | 対象外 | ログ識別子＝ブラウザ観測外 |
| 009 | IT-15 | 状態変化 | 手動/間接 | 012（高額条件外で行エラーのみ継続。要シード） |
| 010 | IT-25 | UI部品 | 手動/間接 | 010（セール優先で基準価格のみ更新。DB更新は手動） |
| 011 | IT-25 | UI部品 | 手動/間接 | 014（info(セール中=sell_price_not_updated警告)とerror(対象規格なし)が同一取込内で両立。hasError真で成功表示/履歴なし＝Controller:161-174。要MIXED SEED・破壊的・fixme）。従来010/012へ分離写像していた混在多行ケースを独立ケース014として明示化 |
| 012 | IT-25 | 操作起点 | 対象外 | トランザクション境界＝内部、ブラウザ観測外 |
| 013 | IT-25 | 確認ダイアログ | 対象外 | Doctrine cache＝内部、ブラウザ観測外 |
| 014 | IT-25 | 確認ダイアログ | 手動/間接 | 012（hasError時はUI成功表示なし。要シード） |
| 015 | IT-25 | 確認ダイアログ | 手動/間接 | 010（成功フラッシュ。要シード破壊的） |
| 016 | IT-25 | 送信可否制御 | E2E自動化 | 020-050（失敗フラッシュ各種） |
| 017 | IT-03 | 外部画面 | 対象外 | アプリログ＝サーバログ、観測外 |
| 018 | IT-03 | 画面遷移 | 手動/間接 | dtb_product_class/履歴へのDB直接保存（DB確認） |
| 019 | IT-03 | 画面遷移 | E2E自動化 | 050（行数キャップ） |
| 020 | IT-03 | 画面遷移 | E2E自動化 | 001/002（サインイン到達・画面表示） |
| 021 | IT-03 | 画面遷移 | E2E自動化 | 020（Symfony不正→画面戻り） |
| 022 | IT-03 | 画面遷移 | E2E自動化 | 021/022/023（ヘッダ・データ無し前段） |
| 023 | IT-03 | 画面遷移 | E2E自動化 | 030-034（ヘッダ名/桁/必須/相関 breakAll） |
| 024 | IT-13 | URL直接アクセス | 手動/間接 | 012（行エラーのみで継続。要シード） |
| 025 | IT-25 | HTTPステータス | 対象外 | 取込開始ログ＝サーバログ、観測外 |
| 026 | IT-25 | URL | 対象外 | 異常終了ログ＝サーバログ、観測外 |
| 027 | IT-22 | 必須バリデーション | E2E自動化 | 030/031（必須空エラー） |
| 028 | IT-22 | 必須バリデーション | 手動/間接 | 010（ファイル有の正常継続。要シード） |
| 029 | IT-22 | 文字列長 | 手動/間接 | 010/011（基準価格 最大長内で成功。要シード） |
| 030 | IT-22 | 文字列長 | E2E自動化 | 033（基準価格 最大長+1＝桁超過） |
| 031 | IT-22 | 文字列長 | 手動/間接 | 010（最小長内で成功。要シード） |
| 032 | IT-22 | 文字列長 | E2E自動化 | 030（基準価格 空＝最小長未満相当） |
| 033 | IT-22 | 文字列長 | 手動/間接 | 010（正常継続。要シード） |
| 034 | IT-22 | 文字列長 | 対象外 | 取込ファイルの処理後削除＝サーバ内部 |
| 035 | IT-22 | 数値 | 手動/間接 | 010/011（基準価格の数値正常値での継続・成功。境界0/9桁は要シードで値設定。DB確認）。数値観点を規格重複(013)へ写像していた誤分類を是正 |
| 036 | IT-22 | 数値 | E2E自動化 | 032（基準価格 数値異常エラー） |
| 037 | IT-22 | 数値 | 手動/間接 | 010（両セット並存でセール優先。要シード） |
| 038 | IT-22 | 数値 | 手動/間接 | 011（正常継続。要シード） |
| 039 | IT-22 | 数値 | E2E自動化 | 032（数値異常エラー） |
| 040 | IT-22 | 数値 | 対象外 | Doctrine cache＝内部、観測外 |
| 041 | IT-22 | 数値 | 手動/間接 | 012（UI成功表示とDBの相関。要シード） |
| 042 | IT-22 | 数値 | E2E自動化 | 032（数値異常エラー） |
| 043 | IT-22 | 文字種 | 手動/間接 | 011（正常継続。要シード） |
| 044 | IT-22 | 文字種 | E2E自動化 | 032（基準価格 非数値＝文字種不正） |
| 045 | IT-22 | その他 | 手動/間接 | 011（正常継続。要シード） |
| 046 | IT-22 | その他 | E2E自動化 | 050（行数キャップ） |
| 047 | IT-22 | その他 | E2E自動化 | 001（サインイン到達・画面表示） |
| 048 | IT-22 | その他 | E2E自動化 | 020（Symfony不正→画面戻り） |
| 049 | IT-22 | その他 | 手動/間接 | 010（前段通過の正常継続。要シード） |
| 050 | IT-22 | その他 | E2E自動化 | 030-034（ヘッダ/桁/必須/相関 エラー） |
| 051 | IT-22 | その他 | 手動/間接 | 012（高額条件外の継続。要シード） |
| 052 | IT-22 | その他 | E2E自動化 | 020（取込開始前の不正で戻り） |
| 053 | IT-22 | その他 | 対象外 | 異常終了ログ＝サーバログ、観測外 |
| 054 | IT-22 | 相関 | E2E自動化 | 031（必須空エラー） |
| 055 | IT-22 | 相関 | 手動/間接 | 010（正常継続。要シード） |
| 056 | IT-22 | 相関 | 手動/間接 | 011（正常継続。要シード） |
| 057 | IT-22 | 相関 | E2E自動化 | 034（商品コード存在しない＝相関） |
| 058 | IT-22 | DBとの相関 | 手動/間接 | 010（既存商品で成功。要シード） |
| 059 | IT-22 | DBとの相関 | E2E自動化 | 034（DB存在チェック不一致） |
| 060 | IT-22 | 必須制御 | 対象外 | show_sale_alert未参照＝画面観測不能 |
| 061 | IT-22 | 部分入力 | E2E自動化 | 021（列数不一致＝部分入力） |
| 062 | IT-26 | 登録内容 | 手動/間接 | 013（規格重複時の登録抑止。DB確認） |
| 063 | IT-26 | 登録内容 | 手動/間接 | 012（高額条件外で未登録。DB確認） |
| 064 | IT-26 | 登録内容 | 手動/間接 | 010（セール側更新。DB確認） |
| 065 | IT-26 | 登録内容 | 手動/間接 | 014（info/error両立時は hasError真で登録抑止＝履歴INSERTなし。DB確認・要MIXED SEED）。011はセール外成功のみで両立を含まないため是正 |
| 066 | IT-26 | 登録内容 | 手動/間接 | 010/011（1取込1トランザクション。DB確認） |
| 067 | IT-23 | 登録内容 | 対象外 | Doctrine cache＝内部、観測外 |
| 068 | IT-26 | 登録内容 | 手動/間接 | 012（hasError時は未登録。DB確認） |
| 069 | IT-26 | 登録内容 | 手動/間接 | 010（成功フラッシュ＝要シード破壊的） |
| 070 | IT-26 | 登録内容 | E2E自動化 | 020-050（失敗フラッシュ） |
| 071 | IT-26 | 登録内容 | 対象外 | アプリログ＝サーバログ、観測外 |
| 072 | IT-26 | 登録内容 | 手動/間接 | dtb_product_class/履歴へのDB直接保存（DB確認） |
| 073 | IT-26 | 登録内容 | E2E自動化 | 050（行数キャップ＝未登録） |
| 074 | IT-26 | 登録内容 | 手動/間接 | 010（最大長内で成功登録。DB確認） |
| 075 | IT-26 | 登録内容 | E2E自動化 | 033（桁超過＝未登録） |
| 076 | IT-26 | 登録内容 | 手動/間接 | 010（最小長内で成功。DB確認） |
| 077 | IT-26 | 登録内容 | E2E自動化 | 030（必須空＝未登録） |
| 078 | IT-26 | 登録内容 | 手動/間接 | 012（高額条件外で未登録。DB確認） |
| 079 | IT-26 | 実行結果 | 手動/間接 | 010（取込開始後の登録結果。DB確認） |
| 080 | IT-23 | 実行結果 | 対象外 | 異常終了ログ＝サーバログ、観測外 |
| 081 | IT-26 | 更新内容 | 手動/間接 | 010/011（基準価格更新値。DB確認） |
| 082 | IT-26 | 更新内容 | 手動/間接 | 034（エラー時は値不変＝ロールバック。DB確認） |
| 083 | IT-26 | 更新内容 | 手動/間接 | 010（更新値。DB確認） |
| 084 | IT-26 | 更新内容 | E2E自動化 | 001/003（テンプレート継承＝画面表示要素） |
| 085 | IT-26 | 更新内容 | 手動 | custom-file-input変更でラベルにファイル名表示（JS・実機/手動確認） |
| 086 | IT-23 | 更新内容 | E2E自動化 | 006（送信前の確認モーダルなし） |
| 087 | IT-26 | 更新内容 | 対象外 | show_sale_alert未参照＝画面観測不能 |
| 088 | IT-26 | 更新内容 | 対象外 | 取込ファイルの処理後削除＝サーバ内部 |
| 089 | IT-26 | 更新内容 | 手動/間接 | 013（規格重複でbreakAll＝未更新。DB確認） |
| 090 | IT-26 | 更新内容 | 手動/間接 | 012（対象規格なしでメッセージのみ継続。DB確認） |

集計（付帯表2と一致）: 自動化 31（002,004,005,016,019,020,021,022,023,027,030,032,036,039,042,044,046,047,048,050,052,054,057,059,061,070,073,075,077,084,086）／ 手動・間接 41（001,009,010,011,014,015,018,024,028,029,031,033,035,037,038,041,043,045,049,051,055,056,058,062,063,064,065,066,068,069,072,074,076,078,079,081,082,083,089,090,085）／ 対象外 18（003,006,007,008,012,013,017,025,026,034,040,053,060,067,071,080,087,088）。**未分類 0**（IT行004 CSRF を対象外→E2E自動化へ是正済み）。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-M03-32-ADMIN | dtb_member(管理者) | 当ルートに到達できる有効な管理者1。ID/PWは config 既定（ECCUBE_ADMIN_USER/PASS） | fixture(config既定) | 既存利用・撤去不要 | 001,002,003,004,005,006,007,008,009,020,021,022,023,024,030,031,032,033,034,035,041,050,051 |
| SEED-M03-32-PC-SALE | dtb_product_class（セール中の高額対象規格） | 実在する商品コードに対し existsProductClassByProductCodeAndSaleFlg(code,true) が真となる規格1（公開ステータス0・高額商品コード設定・セールフラグ真）。商品コードは規格1件のみ（一意） | fixture/migration | 専用商品コード接頭辞E2E-。**破壊的（standard_price更新・履歴INSERT）→テスト後に価格・履歴を復元/削除** | 010 |
| SEED-M03-32-PC-NOSALE | dtb_product_class（セール外の高額対象規格） | existsProductClassByProductCodeAndSaleFlg(code,false) が真となる規格1（セールフラグ偽/NULL・高額対象）。商品コード一意 | fixture/migration | 専用商品コード接頭辞E2E-。**破壊的（standard_price/price02更新・履歴INSERT）→復元/削除** | 011 |
| SEED-M03-32-PC-NOMATCH | dtb_product_class（高額対象外） | existsByProductCode が真（onValidateRow通過）かつ isProductCodeUnique 真だが、セール真/偽いずれの高額条件も満たさない規格1 | fixture/migration | 専用商品コード接頭辞E2E-。非破壊（DB更新なし）。履歴・成功フラッシュが出ないことを観測 | 012 |
| SEED-M03-32-PC-DUP | dtb_product_class（規格重複） | 同一商品コードに ProductClass が2件以上（isProductCodeUnique が偽） | fixture/migration | 専用商品コード接頭辞E2E-。非破壊（breakAllでロールバック） | 013 |
| SEED-M03-32-PC-MIXED | dtb_product_class（セール中高額対象規格＋高額対象外規格） | 1取込内で「セール中の高額対象規格」行と「商品コードは存在するが高額対象外」行を並存させるための2商品コード（PC-SALE相当＋PC-NOMATCH相当）。breakAll は発生しない | fixture/migration | 専用商品コード接頭辞E2E-。**破壊的（セール行は standard_price 更新がコミットされうる）→価格を復元**。完了フラッシュ・履歴INSERTは出ないことを観測 | 014 |

注: 永続化の正は ec-cube-enterprise（dtb_product_class.standard_price/price02/update_date、dtb_csv_import_history。取込種別ID=SIMPLE_HIGH_PRICE_IMPORT_CSV_ID=7）。`migration` を充てる場合 DB は ec-cube-enterprise 正典に従う。共通ログインは `config/default.config.ts`（ECCUBE_ADMIN_USER/PASS）を流用。異常系（020-050）は実在商品コードを使わず（E2E-NOPROD…）前段検証/打ち切りで非破壊のため専用シードを要しない。

## 付帯表4：不具合候補（仕様乖離）／要確認

テストは仕様どおりに書き、実装が違えば落ちて検出する。期待値を実装へ書き換えない。

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | フォーム不正/ファイル未選択は admin エラーフラッシュを積んで取込しない | Controller.php:121-127(form不正でforeach addError) / 131-135(file null→csv_invalid_no_data) | ファイル未選択時に出る文言（NotBlankのフォーム検証文 か csv_invalid_no_data か）は経路で異なるため要実機確認。テストは「エラーフラッシュ表示＋画面滞留」を仕様由来で判定 | 020 | 要確認(文言) |
| 2 | ヘッダ名不一致時のメッセージ | BaseCsvImportHandler.php:86-90(addColumnNotExistsError=product.not_exists) ／ 前段ヘッダ検証(addHeaderFormatError)も存在 | ヘッダ名不一致が「行単位の取得不可」と「ヘッダ形式不一致」のどちらで出るかは CsvImporter のヘッダ前段処理に依存し要実機確認。テストは .alert-danger 表示で判定 | 022 | 要確認(経路) |
| 3 | 取込ファイルは処理後に削除される | 設計書(フロント挙動: 処理後削除) | サーバ内部のファイル削除はブラウザ観測外。E2E化せず対象外（付帯表2b 034/088） | — | 対象外(観測外) |
| 4 | show_sale_alert=true をコントローラが渡す | Controller.php:101 / base_csv_upload.twig（変数未参照） | 設計書も「変数参照が無く画面に効かない」と明記。画面上に対応表示が無いため観測不能。仕様乖離ではなく未使用変数。E2E対象外 | 060,087 | 要確認(未使用) |
| 5 | 成功は hasError 偽のときのみ（完了フラッシュ・履歴INSERT） | Controller.php:161-174 | 行更新#3(対象規格なし)は addMessage(error)で hasError 真→breakAll無しでもコミットされうるが完了表示・履歴は出ない。UIとDBの交差は要シード・手動/間接で確認 | 012 | 要確認(交差状態) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口（GET csv_upload／直接URL到達） | アップロード画面表示・サブタイトル | 001,002,003 | カバー（直接URL到達） |
| 利用者視点の入口（ナビ経路：商品管理→商品CSV管理→高額商品価格変更CSVアップロード） | サイドメニュー選択でアップロード画面へ到達・選択状態 | （共通メニュー機能・別管理） | 手動/別管理（メニュー階層は共通レイアウト機能の責務。本機能specは直接URL到達で画面検証。ナビ経路の自動化は要確認） |
| 利用者視点の入口（GET csv_template） | 雛形ダウンロード発火・ファイル名 | 005 | カバー（ファイル名のみ。内容＝ヘッダ行のみ／Content-Type=application/octet-stream は手動分離・下記参照） |
| 利用者視点の入口（雛形DLの内容・Content-Type） | ヘッダ行のみのCSV・Content-Type application/octet-stream | （005の手動分離） | 手動（005はファイル名のみE2E。Download本文・Content-Typeヘッダ検証はブラウザDL APIで部分観測可だが内容妥当性は手動。要確認） |
| 利用者視点の入口（件数プルダウン） | page_count をURL/セッションへ反映 | 008 | 部分カバー（008はURL反映・履歴再描画のみ。セッションキー保存・許容外値の既定50化は間接/未自動＝要確認） |
| フロント挙動（表示要素：入力/ボタン/フォーマット表） | ファイル入力・アップロードボタン・フォーマット表（商品コード/基準価格 必須） | 001,004 | カバー |
| フロント挙動（ファイル入力の許容形式 accept） | .csv/.tsv（text/csv・text/tsv）を受け付ける | 009 | カバー（accept属性に .csv/.tsv 包含で判定） |
| フロント挙動（取込履歴の表示内容） | 履歴見出し・列（ファイル名/アップロード日時/作業者）・0件表示 | 007 | 手動（具体セレクタ/文言は要実機確認。従来001/004の「カバー」主張は過大→007手動へ是正） |
| フロント挙動（モーダルなし） | 送信前確認ダイアログが無い | 006 | カバー |
| フロント挙動（JS: ラベルにファイル名） | custom-file-input変更でラベル更新 | 085(手動) | 手動（JS・実機確認） |
| フロント挙動（show_sale_alert未反映） | 画面に効かない | （観測不能） | 対象外(未使用変数・付帯表4#4) |
| 処理フロー（import #2 フォーム不正） | adminエラーフラッシュ・取込なし・画面戻り | 020 | カバー |
| 処理フロー（import #3 ファイルnull） | csv_invalid_no_data | 020(統合観測) | 一部要確認(経路・付帯表4#1) |
| 処理フロー（import #4 行数過多） | maxrecord・インポータ未起動 | 050 | カバー |
| 処理フロー（import #5-8 ログ/成功/履歴） | 開始・異常終了・完了ログ | （サーバログ） | 対象外(観測外) |
| 処理フロー（import #8 成功フラッシュ・履歴INSERT） | 登録完了・履歴1行追加 | 010,011 | 手動/間接(fixme・自動未検証：要破壊的SEED) |
| インポータ共通（ヘッダ/データ無し前段） | 形式不一致・データ無し | 021,023 | カバー |
| 検証フェーズ（列スキーマ一致・必須列） | 列数一致・必須空 | 021,030,031 | カバー |
| 検証フェーズ（商品コード存在） | 存在しないコードでbreakAll | 034 | カバー |
| 検証フェーズ（同一規格コード重複） | 重複でbreakAll・ロールバック | 013 | 手動/間接(fixme・自動未検証：要DUP SEED) |
| 行更新フェーズ #1 セール中 | standard_priceのみ更新＋警告(sell_price_not_updated) | 010 | 手動/間接(fixme・自動未検証：要破壊的SEED) |
| 行更新フェーズ #2 セール外 | standard_price/price02同値更新 | 011 | 手動/間接(fixme・自動未検証：要破壊的SEED) |
| 行更新フェーズ #3 対象規格なし | 行エラー継続・完了/履歴なし | 012 | 手動/間接(fixme・自動未検証：要NOMATCH SEED) |
| バリデーション（ファイル必須） | 未選択でエラー | 020 | カバー |
| バリデーション（基準価格 数値/桁） | 非数値・10桁でエラー | 032,033 | カバー |
| バリデーション（基準価格 数値下限＝負値 -1） | 負値で「0以上」エラー | 035 | カバー |
| バリデーション（基準価格 正常境界 0/9桁・行数5009正常境界） | 境界内で正常継続・成功 | （要シード成功・手動） | 手動/間接（成功系は破壊的SEEDを要し未自動＝010/011で境界値設定） |
| バリデーション（行数カウントの引用符内改行除外） | "..."内改行は最大行数判定から除外 | （境界） | 要確認（成功側は要シード／除外計数はサーバ内部計算でブラウザ観測は限定的） |
| バリデーション（ファイルサイズ上限 eccube_csv_size） | 上限超過でエラー | 051 | 手動/間接（>上限ファイル生成が重く手動） |
| バリデーション（インポータ前段：空ファイル/ヘッダ不成立） | ヘッダ成立せずエラー・取込なし | 023,024 | カバー（024=空ファイル） |
| 入出力（CSRFトークン） | 改ざんでフォーム不正→エラーフラッシュ・取込なし | 041 | カバー |
| エッジケース（info と error の両立） | 同一取込で警告(セール中)+エラー(対象規格なし)両立・成功/履歴なし | 014 | 手動/間接（fixme・自動未検証：要MIXED SEED・破壊的） |
| バリデーション（必須列） | 商品コード/基準価格 空でエラー | 030,031 | カバー |
| バリデーション（行数キャップ） | >=5010でエラー | 050 | カバー |
| データ整合性（トランザクション境界/Doctrine cache） | コミット/ロールバック・キャッシュ | （DB内部） | 対象外(観測外・DB値は手動) |
| データ整合性（UI成功表示とデータ hasError） | hasError時は完了表示なし | 012,014 | 手動/間接（fixme・自動未検証：要NOMATCH/MIXED SEED。従来「カバー」は付帯表1のfixme実体と不一致のため是正） |
| DBカラム/DB操作 | standard_price/price02/update_date・履歴INSERT | 010,011 | 手動/間接(DB確認) |
| 画面遷移 | 任意処理後POST→アップロード画面へリダイレクト | 020,021,023,030-034,050 | カバー |
| 権限・認可 | 未サインインは管理ログインへ | 040 | カバー |
| ログ・監査 | 開始/異常終了/完了ログ・出力抑止 | （サーバログ・観測外） | 対象外(理由付き) |
| セッション/Cookie | 履歴ページ状態のセッション保存・専用Cookieなし | 008(間接) | 部分カバー（008は件数反映で間接観測。セッションキー保存自体・許容外値の既定化はブラウザ直接観測外＝要確認） |
| 試行制限 | レート制限なし（仕様） | — | 該当なし(仕様で無し) |
| 集計条件/API・バッチ | ビジネス集計・外部API・バッチなし | — | 該当なし(仕様で無し) |
| 排他制御 | 行ロック秒既定・SKU粒度はDB委譲 | （DB内部） | 対象外(観測外) |

未カバーはいずれも理由（観測不能＝DB内部値・サーバログ・ファイル削除・トランザクション/Doctrine/CSRF・SKUロック、要シードの破壊的更新、JS実機確認、仕様で機能なし）を明記済み。設計書にあって観点表に薄い分岐（行更新#1〜#3・ヘッダ前段・行数キャップ）も独立ケース化した。
