# m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録） E2Eテストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m04-23_admin_stock_stock_split_join_csv_import.html`（正本 `functions/ec-cube-enterprise/m04-23_admin_stock_stock_split_join_csv_import.md`）

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/m04_23_admin_stock_stock_split_join_csv_import_it_cases.md`（母集合 計90観点行）

期待結果は画面表示・遷移・URL・ダウンロード発火/応答ヘッダ・フラッシュメッセージなどブラウザで観測できる結果で判定する。**期待結果は仕様（設計書・基本設計仕様書(在庫管理機能 M04-23シート)・観点表）由来**とし、実装の現挙動・Form制約(NotBlank/File)・POM由来文言をオラクル化しない。TSV は既存IT casesの10列に実施管理欄（実施者・実施日・結果・失敗理由）を加えた14列固定。E2E固有情報（セレクタ・自動化区分・仕様根拠・シード・不具合候補）は TSV 後の付帯表に `テストID` で対応づける。Playwright は本リポジトリでは実行しない（構造参考のみ）。未検証セレクタは `要実機確認`。

刷新先 ec-cube-enterprise に該当画面・ルートが存在することを確認済み（`StockSplitJoinController` ＋ `stock_split_join_index.twig` のモーダル ＋ `stock_split_csv_modal_body.twig`/`stock_join_csv_modal_body.twig`）。screenExists=true。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-25 | モーダルUI部品・「CSVから登録」ボタン・CSVフォーマット表・雛形DLリンク・HTTPステータス・URL |
| IT-27 | CSV雛形ダウンロード発火・応答ヘッダ・ファイル名（雛形内容＝BOM/文字コードは手動） |
| IT-16 | 取込結果メッセージ（成功/エラー）の表示（取込内容のDB一致・在庫増減は手動/間接） |
| IT-22 | CSVのヘッダ/列数/数値/必須/区分の取込バリデーション（行エラー→全件ロールバック・一覧滞留） |
| IT-15 | CSRFトークン検証・未認証ガード・承認通知先メンバー取得(JSON)・状態変化(DB=手動) |
| IT-03 | 取込後の一覧リダイレクト（PRG）。登録/承認ロジック本体はM04-13へ委譲 |
| IT-13 | 雛形URL・取込POSTルートの未ログイン直接アクセス誘導 |
| IT-26 | 登録内容（成功/失敗メッセージで間接観測。DB値・ステータス遷移は手動/間接） |
| IT-20 | ログ出力抑止＝ブラウザ観測外（対象外） |
| IT-23 | 本機能はDB検索を行わない（一覧検索はM04-12へ委譲）＝対象外 |

## テストケースTSV（14列固定・末尾4列は実施管理欄）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-001	IT-25	UI部品	P2	一覧に分割/結合CSV登録ボタンが表示される	管理者ログイン済／SEED-M04-23-ADMIN	—	1. 在庫分割結合一覧（/%admin%/product/stock/split-join）を開く	「在庫分割CSV登録」「在庫結合CSV登録」ボタンが表示されること。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-002	IT-25	UI部品	P2	分割モーダルに店舗・在庫区分・ファイル選択・「CSVから登録」が表示される	管理者ログイン済／SEED-M04-23-ADMIN	—	"1. 一覧を開く
2. 「在庫分割CSV登録」を押下しモーダルを開く"	店舗セレクト・在庫区分ラジオ・ファイル選択・送信ボタン「CSVから登録」が表示されること。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-003	IT-25	UI部品	P3	分割モーダルに承認通知先メンバー欄が表示される	管理者ログイン済／SEED-M04-23-ADMIN	—	1. 分割CSV登録モーダルを開く	「承認通知先」ラベルとメンバー選択欄が表示されること。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-004	IT-25	表示結果	P3	分割モーダルのCSVフォーマット表に4列の項目名が表示される	管理者ログイン済／SEED-M04-23-ADMIN	—	1. 分割CSV登録モーダルを開く	フォーマット表に「分割元商品コード」「分割数」「分割先商品コード」「分割先在庫数」が表示されること。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-005	IT-25	UI部品	P2	結合モーダルに店舗・在庫区分・ファイル選択・「CSVから登録」が表示される	管理者ログイン済／SEED-M04-23-ADMIN	—	"1. 一覧を開く
2. 「在庫結合CSV登録」を押下しモーダルを開く"	店舗セレクト・在庫区分ラジオ・ファイル選択・送信ボタン「CSVから登録」が表示されること。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-007	IT-25	UI部品	P3	分割モーダルに承認通知先「所属」セレクトが表示される	管理者ログイン済／SEED-M04-23-ADMIN	—	1. 分割CSV登録モーダルを開く	承認通知先の「所属」セレクト（所属選択）が表示されること（設計のアップロードフォーム項目 承認通知先所属）。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-006	IT-25	表示結果	P3	結合モーダルのCSVフォーマット表に5列（結合数を含む）が表示される	管理者ログイン済／SEED-M04-23-ADMIN	—	1. 結合CSV登録モーダルを開く	フォーマット表に「結合先商品コード」「結合数」「結合元商品コード」「結合元在庫区分」「結合元在庫数」が表示されること（基本設計の列名。実装は「結合数」を表示しないため不具合候補#1で検出見込み）。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-010	IT-27	実行結果	P2	分割CSV雛形ダウンロードが発火する	管理者ログイン済／SEED-M04-23-ADMIN	—	"1. 分割CSV登録モーダルを開く
2. 「雛形ファイルダウンロード」を押下"	ダウンロードが発火すること。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-011	IT-25	操作起点	P2	分割CSV雛形がCSV形式（拡張子.csv）でダウンロードされる	管理者ログイン済／SEED-M04-23-ADMIN	—	1. 分割CSV雛形をダウンロードする	ダウンロードファイルの拡張子が .csv であること（CSV雛形。厳密名 stock_split_template.csv は設計書未規定の実装確認値でありオラクル化しない＝手動/要確認）。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-012	IT-25	HTTPステータス	P2	分割CSV雛形応答がHTTP200を返す	管理者ログイン済／SEED-M04-23-ADMIN	GET /%admin%/product/stock/split-join/split-csv-template	1. 分割CSV雛形URLへGETする	HTTP200が返ること。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-013	IT-25	表示結果	P3	分割CSV雛形応答がダウンロード（添付）として返る	管理者ログイン済／SEED-M04-23-ADMIN	GET split-csv-template	1. 分割CSV雛形URLへGETする	Content-Disposition が attachment であること（ダウンロード=添付。Content-Type=application/octet-stream は設計書未規定の実装確認値でありオラクル化しない）。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-014	IT-25	表示結果	P3	分割CSV雛形応答が attachment かつ CSV(.csv) ファイル名を返す	管理者ログイン済／SEED-M04-23-ADMIN	GET split-csv-template	1. 分割CSV雛形URLへGETする	Content-Disposition が attachment かつ拡張子 .csv を含むこと（厳密名 stock_split_template.csv は実装確認値でありオラクル化しない）。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-015	IT-27	実行結果	P2	結合CSV雛形ダウンロードが発火する	管理者ログイン済／SEED-M04-23-ADMIN	—	"1. 結合CSV登録モーダルを開く
2. 「雛形ファイルダウンロード」を押下"	ダウンロードが発火すること。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-016	IT-25	操作起点	P2	結合CSV雛形がCSV形式（拡張子.csv）でダウンロードされる	管理者ログイン済／SEED-M04-23-ADMIN	—	1. 結合CSV雛形をダウンロードする	ダウンロードファイルの拡張子が .csv であること（厳密名 stock_join_template.csv は実装確認値でありオラクル化しない＝手動/要確認）。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-017	IT-25	HTTPステータス	P2	結合CSV雛形応答がHTTP200を返す	管理者ログイン済／SEED-M04-23-ADMIN	GET /%admin%/product/stock/split-join/join-csv-template	1. 結合CSV雛形URLへGETする	HTTP200が返ること。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-018	IT-27	実行結果	P3	分割CSV雛形の内容がヘッダ4列のみ・UTF-8 BOM付きである	管理者ログイン済／SEED-M04-23-ADMIN	—	1. 分割CSV雛形をダウンロードし内容を開く	1行目に「分割元商品コード,分割数,分割先商品コード,分割先在庫数」のヘッダのみが含まれデータ行が無く、UTF-8 BOM付きであること（設計: ヘッダのみ・UTF-8 BOM付き。BOM/文字コードはバイナリ確認＝手動）。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-019	IT-27	出力失敗	P3	結合CSV雛形の内容がヘッダ5列のみ・UTF-8 BOM付きである／出力失敗系	管理者ログイン済／SEED-M04-23-ADMIN	—	1. 結合CSV雛形をダウンロードし内容を開く	1行目に基本設計表記「結合先商品コード,結合数,結合元商品コード,結合元在庫区分,結合元在庫数」のヘッダのみが含まれ、UTF-8 BOM付きであること。雛形出力失敗（ディレクトリ不在/権限/容量不足）はサーバ内部事象でブラウザ観測外、BOM/文字コードはバイナリ確認＝いずれも手動。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-020	IT-22	その他のバリデーション	P1	分割: 列数/ヘッダ不一致CSV取込でエラー表示・一覧へ・登録されない	管理者ログイン済／SEED-M04-23-ADMIN	必須4列でないCSV（例: 列A,列B）	"1. 分割CSV登録モーダルを開く
2. 店舗・在庫区分(EC-CUBE)を選び不正CSVを添付
3. 「CSVから登録」を押下"	エラーメッセージが表示され、成功メッセージは出ず、一覧画面に留まること（全件ロールバック）。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-021	IT-22	必須バリデーション	P1	分割: 必須ヘッダ欠落CSV取込でエラー表示・一覧へ	管理者ログイン済／SEED-M04-23-ADMIN	必須ヘッダ「分割先在庫数」欠落のCSV	1. 分割CSV登録モーダルでヘッダ欠落CSVを添付し送信	エラーメッセージが表示され、一覧画面に留まること。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-022	IT-22	数値バリデーション	P1	分割: 数値不正行(分割数0)取込でエラー表示・全件ロールバック	管理者ログイン済／SEED-M04-23-ADMIN	分割数=0 を含むCSV	1. 分割CSV登録モーダルで数値不正CSVを添付し送信	エラーメッセージが表示され、成功メッセージは出ず、一覧画面に留まること。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-023	IT-15	CSRF	P1	分割: CSRFトークン不正POSTでセッションタイムアウト表示・一覧へ	管理者ログイン済／SEED-M04-23-ADMIN	不正なCSRFトークン	"1. 分割CSV登録フォームのCSRFトークンを不正値に書き換える
2. 「CSVから登録」を押下"	「セッションがタイムアウトしました。もう一度やり直してください。」が表示され、一覧画面に留まること。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-024	IT-22	必須バリデーション	P1	分割: ファイル未添付POSTでアップロード失敗メッセージ	管理者ログイン済／SEED-M04-23-ADMIN	import_file 未指定	1. ファイル未添付で分割CSV登録をPOSTする（直POST）	「CSVファイルのアップロードに失敗しました」が表示され、一覧画面に留まること。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-025	IT-22	その他のバリデーション	P2	分割: 在庫区分が1/2以外のPOSTでアップロード失敗メッセージ	管理者ログイン済／SEED-M04-23-ADMIN	inventory_category=99（1/2以外）	1. 在庫区分を1/2以外にして分割CSV登録をPOSTする（直POST）	「CSVファイルのアップロードに失敗しました」が表示され、一覧画面に留まること。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-026	IT-22	その他のバリデーション	P2	分割: 店舗未解決POSTでアップロード失敗メッセージ	管理者ログイン済／SEED-M04-23-ADMIN	store=存在しないID（解決不可）	1. 店舗を存在しないIDにして分割CSV登録をPOSTする（直POST）	「CSVファイルのアップロードに失敗しました」が表示され、一覧画面に留まること（検証順序#3 店舗解決不可）。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-028	IT-22	その他のバリデーション	P2	分割: 非CSV(画像等)ファイル取込でエラー／アップロード失敗	管理者ログイン済／SEED-M04-23-ADMIN	CSV以外のファイル（例: PNG）	1. 分割CSV登録モーダルでCSV以外のファイルを添付し送信（必要に応じ直POST）	フォーマット不一致またはアップロード失敗のエラーが表示され、登録されず一覧画面に留まること（設計「csv以外のファイルはエラー」。実装はMIME未検証の可能性＝不具合候補#4で検出見込み・要実機）。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-030	IT-22	その他のバリデーション	P1	結合: 列数/ヘッダ不一致CSV取込でエラー表示・一覧へ	管理者ログイン済／SEED-M04-23-ADMIN	必須5列でないCSV	1. 結合CSV登録モーダルで不正CSVを添付し送信	エラーメッセージが表示され、成功メッセージは出ず、一覧画面に留まること。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-035	IT-22	必須バリデーション	P1	結合: 必須ヘッダ欠落CSV取込でエラー表示・一覧へ	管理者ログイン済／SEED-M04-23-ADMIN	必須ヘッダ「結合元在庫数」欠落のCSV	1. 結合CSV登録モーダルでヘッダ欠落CSVを添付し送信	エラーメッセージが表示され、成功メッセージは出ず、一覧画面に留まること（分割021と対の結合側異常系）。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-029	IT-22	その他のバリデーション	P3	分割/結合: 登録上限(2,000件)超のCSV取込で中断・エラー	管理者ログイン済／SEED-M04-23-ADMIN	2,001行のCSV	1. 2,000件を超えるCSVを添付し送信	取込が中断されエラーが表示され、全件登録されないこと（MAX_ROWS=2000。上限値は性能試験で確定＝手動/性能依存・大容量CSV要）。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-034	IT-22	数値バリデーション	P1	結合: 数値不正行(結合数0)取込でエラー表示・全件ロールバック	管理者ログイン済／SEED-M04-23-ADMIN	結合数=0 を含むCSV（ヘッダはExcel正典表記）	1. 結合CSV登録モーダルで数値不正CSVを添付し送信	エラーメッセージが表示され、成功メッセージは出ず、一覧画面に留まること（分割022と対の結合側異常系）。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-031	IT-15	CSRF	P1	結合: CSRFトークン不正POSTでセッションタイムアウト表示・一覧へ	管理者ログイン済／SEED-M04-23-ADMIN	不正なCSRFトークン	1. 結合CSV登録フォームのCSRFトークンを不正値に書き換え送信	「セッションがタイムアウトしました。もう一度やり直してください。」が表示され、一覧画面に留まること。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-032	IT-22	必須バリデーション	P2	結合: ファイル未添付POSTでアップロード失敗メッセージ	管理者ログイン済／SEED-M04-23-ADMIN	import_file 未指定	1. ファイル未添付で結合CSV登録をPOSTする（直POST）	「CSVファイルのアップロードに失敗しました」が表示され、一覧画面に留まること。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-033	IT-22	その他のバリデーション	P2	結合: 在庫区分が1未満のPOSTでアップロード失敗メッセージ	管理者ログイン済／SEED-M04-23-ADMIN	inventory_category=0	1. 在庫区分を1未満にして結合CSV登録をPOSTする（直POST）	「CSVファイルのアップロードに失敗しました」が表示され、一覧画面に留まること。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-040	IT-26	登録内容	P1	分割: 正常CSV取込で分割登録＋承認申請の成功メッセージ表示	管理者ログイン済／SEED-M04-23-SPLIT-OK	分割元/分割先が実在する正常な分割CSV	1. 分割CSV登録モーダルで正常CSVを添付し送信	「（件数）件の分割を登録し、承認申請まで進めました。」が表示され、一覧画面へ遷移すること。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-041	IT-26	登録内容	P1	結合: 正常CSV取込で結合登録＋欠品入力遷移の成功メッセージ表示	管理者ログイン済／SEED-M04-23-JOIN-OK	結合先/結合元が実在する正常な結合CSV	1. 結合CSV登録モーダルで正常CSVを添付し送信	「（件数）件の結合を登録し、欠品入力まで進めました。」が表示され、一覧画面へ遷移すること。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-050	IT-13	URL直接アクセス	P2	未ログインで分割CSV雛形URL直接アクセスで管理ログインへ誘導	未ログイン	—	1. /%admin%/product/stock/split-join/split-csv-template へ直接GET	管理ログイン画面へ誘導されること。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-051	IT-13	URL直接アクセス	P2	未ログインで分割CSV登録POSTで管理ログインへ誘導	未ログイン	—	1. /%admin%/product/stock/split-join/list-split-csv-import へ未ログインでPOST	管理ログイン画面へ誘導されること（取込されない）。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-052	IT-13	URL直接アクセス	P2	未ログインで結合CSV雛形URL直接アクセスで管理ログインへ誘導	未ログイン	—	1. /%admin%/product/stock/split-join/join-csv-template へ直接GET	管理ログイン画面へ誘導されること。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-053	IT-15	未認証	P2	未ログインで承認通知先メンバー取得URLで管理ログインへ誘導	未ログイン	—	1. /%admin%/product/stock/split-join/approval-members?store_id=1 へ直接GET	管理ログイン画面へ誘導されること。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-054	IT-13	URL直接アクセス	P2	未ログインで結合CSV登録POSTで管理ログインへ誘導	未ログイン	—	1. /%admin%/product/stock/split-join/list-join-csv-import へ未ログインでPOST	管理ログイン画面へ誘導されること（取込されない。分割051と対の結合側異常系）。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-060	IT-15	対象データ	P2	承認通知先メンバー取得が application/json をHTTP200で返す	管理者ログイン済／SEED-M04-23-ADMIN	GET approval-members?store_id=1	1. 承認通知先メンバー取得URLへGETする	HTTP200かつ Content-Type が application/json であること（分割CSV登録モーダル用に承認権限メンバーをJSONで返す）。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-061	IT-15	対象データ	P3	承認通知先メンバー取得が編集不可店舗のstore_idで権限外応答（対象メンバー無し）を返す	管理者ログイン済／SEED-M04-23-NOEDIT-STORE	GET approval-members?store_id=（編集不可店舗）	1. 編集権限のない店舗IDで承認通知先メンバー取得URLへGETする	承認権限メンバーが返らない（権限外＝対象データ無し）こと（編集可能店舗 M11-03 に基づく権限制御。編集不可店舗のseedが必要＝要実機/手動。HTTPステータスの厳密値はオラクル化しない）。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-070	IT-22	その他のバリデーション	P3	取込処理の例外発生時に取込エラーメッセージを表示し一覧へ	管理者ログイン済／SEED-M04-23-ADMIN	取込中に例外を誘発する条件	1. 取込処理で例外が発生する条件でCSVを取り込む	取込エラーメッセージが表示され一覧画面に留まること（検証順序#6 例外時 admin.common.csv_import_error。例外誘発条件の構築が必要＝手動/要確認。固有文言はオラクル化しない）。				
m04-23_admin_stock_stock_split_join_csv_import（在庫分割結合CSV登録）	E2E-M04-23-071	IT-26	登録内容	P3	取込エラー後にモーダル選択内容がリセットされ一覧の状態が維持される	管理者ログイン済／SEED-M04-23-ADMIN	不正CSV	1. 不正CSVで分割CSV登録を送信しエラー後の一覧を確認する	エラー後はリダイレクトでモーダルの選択内容がリセットされ、一覧の検索条件・状態が維持されること（基本設計「エラー時はモーダル選択内容リセット」。間接観測＝手動/間接）。				
```

## 付帯表1：E2E自動化区分・対象セレクタ・仕様根拠・元ITケースID（TSV外）

DOM id は Symfony Form の getBlockPrefix から導出（分割 `admin_stock_split_csv_upload`＝`StockSplitCsvUploadType.php:131` ／ 結合 `admin_stock_join_csv_upload`＝`StockJoinCsvUploadType.php:112`）。行番号は ec-cube-enterprise 現行ソース（`nl -ba` 基準）。フラッシュ表示は `alert.twig`（success=.alert-success:22 / error=.alert-danger:42、`default_frame.twig:200` include）。

| テストID | E2E可否 | 対象セレクタ（根拠 file:line / 要実機確認） | 仕様根拠 | 元ITケースID |
|----------|---------|----------------------------------------------|----------|--------------|
| E2E-M04-23-001 | E2E自動化 | button trans split_csv_register(stock_split_join_index.twig:102 / messages:4580) ・ join_csv_register(:103 / messages:4581) | 利用者視点の入口（モーダル起点） | 010-012,025,026相当 |
| E2E-M04-23-002 | E2E自動化 | #admin_stock_split_csv_upload_store(modal_body.twig:16) / #..._inventory_category_0(:21 value=1) / #..._import_file(:51) / #btn-split-csv-import(:58 trans list_csv_import_submit=「CSVから登録」messages:4582) | アップロードフォーム項目（分割） | 010,011,016相当 |
| E2E-M04-23-003 | E2E自動化 | #admin_stock_split_csv_upload_approval_notification_target_members(modal_body.twig:39) / ラベル approval_notification_target(messages:4644) | アップロードフォーム項目（承認通知先） | 010,011相当 |
| E2E-M04-23-007 | E2E自動化 | #admin_stock_split_csv_upload_approval_department(modal_body.twig:33 class js-split-csv-approval-dept) / ラベル approval_affiliation(modal_body.twig:30) | アップロードフォーム項目（承認通知先所属 1-3） | 010,011相当 |
| E2E-M04-23-004 | E2E自動化 | フォーマット表セル(modal_body.twig:75-88 trans format_source_code/split_quantity/target_code/target_stock messages:4665-4672) | CSV必須ヘッダ（分割4列） | 010,011相当 |
| E2E-M04-23-005 | E2E自動化 | #admin_stock_join_csv_upload_store(join_modal_body.twig:14) / #..._inventory_category_0(:19) / #..._import_file(:27) / #btn-join-csv-import(:33) | アップロードフォーム項目（結合） | 010,011相当 |
| E2E-M04-23-006 | E2E自動化(不具合候補#1検出見込) | フォーマット表セル(join_modal_body.twig:48-65 / 2列目 format_join_quantity messages:4682=「結合元在庫数」) | CSV必須ヘッダ（結合5列・基本設計列名「結合数」） | 010,011相当 |
| E2E-M04-23-010/011 | E2E自動化 | 分割雛形リンク a[href$=split-csv-template](modal_body.twig:68 trans split_csv_modal.template_download messages:4674) / Controller splitCsvTemplate(:180 filename stock_split_template.csv:185) | CSV雛形ダウンロード（分割） | 002,003相当(IT-27) |
| E2E-M04-23-012/013/014 | E2E自動化 | GET admin_stock_split_csv_template(Controller.php:180) / Content-Type octet-stream(:204) / Content-Disposition attachment filename(:205) | 雛形応答ヘッダ | 002,003相当 |
| E2E-M04-23-015/016 | E2E自動化 | 結合雛形リンク a[href$=join-csv-template](join_modal_body.twig:42) / Controller joinCsvTemplate(:172 filename stock_join_template.csv:177) | CSV雛形ダウンロード（結合） | 002,003相当 |
| E2E-M04-23-017 | E2E自動化 | GET admin_stock_join_csv_template(Controller.php:172) | 雛形応答 | 002,003相当 |
| E2E-M04-23-018 | 手動（内容/BOM） | 雛形バイト列のヘッダ行＝format_*(messages:4665-4672) / UTF-8 BOM(Controller.php:202) | 利用者視点の入口（分割雛形 ヘッダのみ・UTF-8 BOM付き） | 002相当(IT-27) |
| E2E-M04-23-019 | 手動（内容/BOM・出力失敗観測外） | 雛形バイト列のヘッダ行（Excel表記） / UTF-8 BOM | 利用者視点の入口（結合雛形 内容）＋出力失敗（容量/権限）はサーバ内部 | 003相当(IT-27 出力失敗) |
| E2E-M04-23-020/021/022 | E2E自動化 | #..._import_file(setInputFiles) / #btn-split-csv-import / .alert-danger(alert.twig:42) | 検証順序#6-7＋取込処理(行/形式エラー→addError→全件ロールバック Controller.php:293-298 / Handler onValidateRow) | 037,046,048,052,036,039,041,042相当(IT-22) |
| E2E-M04-23-023 | E2E自動化(token改変) | #admin_stock_split_csv_upload__token(modal_body.twig:11) / .alert-danger / 文言 admin.common.csrf_invalid(messages:3941) | 検証順序#1 CSRF(Controller.php:227-230) | 004相当(IT-15 CSRF) |
| E2E-M04-23-024/025 | 自動化予定/要実機(直POST) | POST admin_stock_split_join_list_split_csv_import(Controller.php:222) / 文言 admin.common.csv_upload_error(messages:1410) | 検証順序#2 ファイル妥当性(:235) / #4 区分(:251) | 027,050相当 |
| E2E-M04-23-026 | 自動化予定/要実機(直POST) | POST list-split-csv-import / 文言 csv_upload_error | 検証順序#3 店舗解決不可(:243付近) | 050,051相当 |
| E2E-M04-23-028 | 自動化予定/要実機(直POST) | #..._import_file(非CSV setInputFiles) / .alert-danger | 設計「csv以外のファイルはエラー」（不具合候補#4: 取込ルートはMIME未検証の可能性＝要実機） | 037,046相当 |
| E2E-M04-23-029 | 手動（性能・大容量CSV） | onValidateRow MAX_ROWS=2000(breakAll) / .alert-danger | 取込処理 登録上限（性能試験で確定） | 051,053相当 |
| E2E-M04-23-030 | E2E自動化 | #..._import_file / #btn-join-csv-import / .alert-danger | 検証順序#6-7＋取込処理(結合 Handler onValidateRow) | 050,052相当 |
| E2E-M04-23-034 | E2E自動化 | #..._import_file(setInputFiles) / #btn-join-csv-import / .alert-danger | 取込処理 onValidateRow 数値検証(結合数>0)。分割022と対の結合側異常系 | 036,039,041,042相当(IT-22 数値) |
| E2E-M04-23-035 | E2E自動化 | #..._import_file(setInputFiles 結合) / #btn-join-csv-import / .alert-danger | 取込処理 onValidateRow 必須ヘッダ欠落（結合）。分割021と対の結合側異常系 | 048,052相当(IT-22 必須/その他) |
| E2E-M04-23-031 | E2E自動化(token改変) | #admin_stock_join_csv_upload__token(join_modal_body.twig:10) / .alert-danger / csrf_invalid | 検証順序#1 CSRF(Controller.php:319-322) | 004相当 |
| E2E-M04-23-032/033 | 自動化予定/要実機(直POST) | POST admin_stock_split_join_list_join_csv_import(:314) / csv_upload_error | 検証順序#2(:327) / #4 区分≥1(:342) | 027,050相当 |
| E2E-M04-23-040 | 自動化予定/要シード | #..._import_file / #btn-split-csv-import / .alert-success(alert.twig:22) / 文言 list_csv_split_import_done(messages:4585) | 処理フロー(分割 onAfterImport 成功 Controller.php:299-301) | 062,064,079相当(IT-26/IT-23) |
| E2E-M04-23-041 | 自動化予定/要シード | #..._import_file / #btn-join-csv-import / .alert-success / 文言 list_csv_join_import_done(messages:4584) | 処理フロー(結合 onAfterImport 成功) | 065,080相当 |
| E2E-M04-23-050/052 | E2E自動化(資格不要) | 管理ログイン画面 #login_id(login.twig:26) | 利用者視点の入口（未ログインは管理ログイン） | 024相当(IT-13) |
| E2E-M04-23-051 | 自動化予定/要実機(未認証直POST) | POST list-split-csv-import / 管理ログイン誘導 | 権限・認可（未ログインPOST） | 005相当(IT-15未認証) |
| E2E-M04-23-054 | 自動化予定/要実機(未認証直POST) | POST list-join-csv-import / 管理ログイン誘導 | 権限・認可（未ログインPOST・分割051と対） | 005相当(IT-15未認証) |
| E2E-M04-23-053 | E2E自動化(資格不要) | GET approval-members→ログイン誘導 | 権限・認可（未ログイン） | 005相当 |
| E2E-M04-23-060 | E2E自動化 | GET admin_stock_split_join_approval_members(Controller.php:427) / Content-Type application/json | 利用者視点の入口（承認通知先メンバー取得 JSON） | 006,021,066相当(IT-15対象データ) |
| E2E-M04-23-061 | 手動/要確認（編集不可店舗seed） | GET approval-members?store_id=（編集不可店舗）→ isEditableShop false で空応答403(Controller.php:438-439) | 権限・認可（編集可能店舗 M11-03） | 006,066相当(IT-15対象データ) |
| E2E-M04-23-070 | 手動/要確認（例外誘発） | 取込例外→ admin.common.csv_import_error / .alert-danger | 検証順序#6 例外時(:Controller import try/catch) | 037,046相当(IT-22) |
| E2E-M04-23-071 | 手動/間接（リセット観測） | リダイレクト後 #modalSplitCsv 非表示・選択クリア / 一覧状態維持 | エラー時の挙動（モーダル選択内容リセット） | 062,079相当(IT-26) |

注: 既存IT casesは観点名のみの定型自動生成スタブ（操作手順が「対象画面を表示する」等の汎用文）であり機能固有シナリオを持たない。本E2Eは設計書本文（利用者視点の入口・検証順序・取込処理・表示メッセージ）を一次情報源として網羅した。`元ITケースID` は観点単位の対応の目安。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合は既存 `m04_23_admin_stock_stock_split_join_csv_import_it_cases.md` の関連ID件数（IT-16=11／IT-27=2／IT-15=4／IT-20=2／IT-25=9／IT-03=7／IT-13=1／IT-22=35／IT-26=17／IT-23=2＝計90）。各観点行を E2E自動化／手動・間接／対象外(理由) に振り分ける（内訳は付帯表2bが正本）。

母集合の根拠: 観点表 `integration-test-viewpoints.md` は観点カテゴリ(IT-01〜IT-33)の定義であり、本機能で実際に発生する観点行はその機能別インスタンス＝既存IT cases 90行に確定する。`integration-test-viewpoints.md` 側でカテゴリのみ存在し本機能のIT casesに行が無い観点（例: 金額計算・ファイルタイプ専用観点・メール本文等）は、本機能のIT casesに該当行が立たない＝本機能では非該当か他カテゴリ(IT-22/IT-26)に内包される。本機能の監査対象母集合は90行で過不足なし（**未分類0**）。

「E2E自動化」区分の意味: 付帯表2/2bの「E2E自動化」は**自動化対象（=ブラウザで観測可能で自動化可能）**を指す監査区分であり、spec実装状態とは別軸。spec(`*.spec.ts`)では「実装済(`test`)」と「自動化予定(`test.fixme`)＝024/025/026/028/032/033/040/041/051/054(要シード/未認証・店舗未解決・非CSV・区分不正の直POST)」を区別して保持する。fixme対応行も監査上は自動化対象に含むが、現時点の実行可能ケースは実装済のみ。

| IT-ID | 母集合 | E2E自動化 | 手動/間接 | 対象外 | 対象外/手動の主な理由 |
|-------|:-----:|:--------:|:--------:|:------:|------------------|
| IT-16 | 11 | 1 | 10 | 0 | 取込内容のDB一致・在庫増減はブラウザ観測外（手動/間接）。取込結果メッセージのみ自動化 |
| IT-27 | 2 | 1 | 1 | 0 | 雛形DL発火/応答ヘッダ/ファイル名は自動化(002)。出力失敗(003=ディレクトリ不在/権限/容量不足)・内容のBOM/文字コードはブラウザ観測外＝手動(018/019) |
| IT-15 | 4 | 3 | 1 | 0 | CSRF/未認証/承認メンバーJSONは自動化。状態変化（在庫・DB）は手動 |
| IT-20 | 2 | 0 | 0 | 2 | ログ出力抑止・識別子＝ブラウザ観測外 |
| IT-25 | 9 | 5 | 2 | 2 | UI部品/HTTP/URLは自動化。承認メール・ステータスmtbは手動、取込履歴(記録なし)・送信可否制御は対象外 |
| IT-03 | 7 | 6 | 0 | 1 | 取込後の一覧リダイレクトは自動化。登録/承認ロジック本体(外部画面)はM04-13へ委譲 |
| IT-13 | 1 | 1 | 0 | 0 | URL直接アクセス（雛形/POST）は自動化 |
| IT-22 | 35 | 12 | 21 | 2 | ヘッダ/列数/数値/区分/CSRFの取込検証は自動化。最大長255・文字種・コード解決等はCSV内容/seed依存で手動、必須制御(取込履歴)・部分入力は非該当で対象外 |
| IT-26 | 17 | 2 | 15 | 0 | 成功/失敗メッセージは自動化。登録内容・在庫・ステータス遷移はDB＝手動/間接 |
| IT-23 | 2 | 0 | 0 | 2 | 本機能はDB検索を行わない（一覧検索はM04-12へ委譲） |
| 合計 | 90 | 31 | 50 | 9 | **未分類 0** |

注: 対象外9件＋手動/間接50件はいずれも「ブラウザで観測不能」「DB/外部依存」「内容の厳密一致」「別機能(M04-12/M04-13)へ委譲」が理由であり、放置ではない。

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

スタブは観点が汎用のため同一観点が連番で重複する。区分は行ごとに確定し、付帯表2の集計と一致する。

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-16 | 実行結果 | E2E自動化 | 020/040（取込結果メッセージ表示） |
| 002 | IT-27 | 実行結果 | E2E自動化 | 010-014（分割雛形DL/応答） |
| 003 | IT-27 | 出力失敗 | 手動/間接 | 019（結合雛形の出力失敗＝ディレクトリ不在/権限/容量不足はサーバ内部事象でブラウザ観測外、雛形内容/BOMはバイナリ確認＝手動）。結合雛形の正常DL/応答は015-017で自動化 |
| 004 | IT-15 | CSRF | E2E自動化 | 023/031（CSRFトークン不正） |
| 005 | IT-15 | 未認証 | E2E自動化 | 051/053（未認証POST/GET誘導） |
| 006 | IT-15 | 対象データ | E2E自動化 | 060（承認メンバーJSON） |
| 007 | IT-20 | 出力抑止 | 対象外 | ログ出力抑止はブラウザ観測外 |
| 008 | IT-20 | 識別子 | 対象外 | ログ識別子はブラウザ観測外 |
| 009 | IT-15 | 状態変化 | 手動/間接 | 在庫確保・DB更新（M04-13ロジック）は手動 |
| 010 | IT-25 | UI部品 | E2E自動化 | 001（登録ボタン表示） |
| 011 | IT-25 | UI部品 | E2E自動化 | 002/005（モーダルUI部品） |
| 012 | IT-25 | 操作起点 | E2E自動化 | 001（モーダル起点ボタン） |
| 013 | IT-25 | 確認ダイアログ | 手動/間接 | 承認アラートメール送信は実受信が必要＝手動 |
| 014 | IT-25 | 確認ダイアログ | 手動/間接 | ステータス mtb_stock_split_join_status はDB＝手動 |
| 015 | IT-25 | 確認ダイアログ | 対象外 | 取込履歴 dtb_csv_import_history は本ルートで記録なし＝観測対象なし |
| 016 | IT-25 | 送信可否制御 | 対象外 | クライアント側の送信可否制御を持たない |
| 017 | IT-03 | 外部画面 | 対象外 | 登録/承認ロジック本体はM04-13へ委譲 |
| 018 | IT-03 | 画面遷移 | E2E自動化 | 020（取込後 一覧へリダイレクト） |
| 019 | IT-03 | 画面遷移 | E2E自動化 | 040（分割登録＋承認申請後 一覧へ） |
| 020 | IT-03 | 画面遷移 | E2E自動化 | 041（結合登録＋欠品入力遷移後 一覧へ） |
| 021 | IT-03 | 画面遷移 | E2E自動化 | 060（承認メンバー取得） |
| 022 | IT-03 | 画面遷移 | E2E自動化 | 021（onValidateRowエラー→一覧） |
| 023 | IT-03 | 画面遷移 | E2E自動化 | 022（onAfterImport ロールバック→一覧） |
| 024 | IT-13 | URL直接アクセス | E2E自動化 | 050/052（雛形URL未ログイン誘導） |
| 025 | IT-25 | HTTPステータス | E2E自動化 | 012/017（雛形 HTTP200） |
| 026 | IT-25 | URL | E2E自動化 | 014（雛形URL/Content-Disposition） |
| 027 | IT-22 | 必須バリデーション | E2E自動化 | 024/032（ファイル未添付→失敗） |
| 028 | IT-22 | 必須バリデーション | 手動/間接 | 承認通知先は任意で継続＝正常取込(seed)が必要 |
| 029 | IT-22 | 文字列長 | 手動/間接 | 最大長255内の正常取込＝seed必要 |
| 030 | IT-22 | 文字列長 | 手動/間接 | 最大長+1コードは不存在→業務エラー（コード解決=seed依存） |
| 031 | IT-22 | 文字列長 | 手動/間接 | 最小長の正常取込＝seed必要 |
| 032 | IT-22 | 文字列長 | E2E自動化 | 022（空コード行→行エラー） |
| 033 | IT-22 | 文字列長 | 手動/間接 | 正常取込＝seed必要 |
| 034 | IT-22 | 文字列長 | 手動/間接 | 正常取込＝seed必要 |
| 035 | IT-22 | 数値 | 手動/間接 | 正常数値の取込＝seed必要 |
| 036 | IT-22 | 数値 | E2E自動化 | 022（数値不正行→エラー） |
| 037 | IT-22 | 数値 | E2E自動化 | 020/022（形式不正→onValidateRowエラー） |
| 038 | IT-22 | 数値 | 手動/間接 | 正常数値の継続＝seed必要 |
| 039 | IT-22 | 数値 | E2E自動化 | 022（数値不正→エラー） |
| 040 | IT-22 | 数値 | 手動/間接 | 正常継続＝seed必要 |
| 041 | IT-22 | 数値 | E2E自動化 | 022（数値不正→エラー） |
| 042 | IT-22 | 数値 | E2E自動化 | 022（数値不正→エラー） |
| 043 | IT-22 | 文字種 | 手動/間接 | 正常文字種の継続＝seed必要 |
| 044 | IT-22 | 文字種 | 手動/間接 | 数値列への文字混入はコード解決失敗＝間接 |
| 045 | IT-22 | その他 | 手動/間接 | 正常継続＝seed必要 |
| 046 | IT-22 | その他 | E2E自動化 | 020（列数不一致→エラー） |
| 047 | IT-22 | その他 | 手動/間接 | 正常継続＝seed必要 |
| 048 | IT-22 | その他 | E2E自動化 | 021（必須ヘッダ欠落→エラー） |
| 049 | IT-22 | その他 | 手動/間接 | 正常継続＝seed必要 |
| 050 | IT-22 | その他 | E2E自動化 | 025/033（在庫区分不正→失敗） |
| 051 | IT-22 | その他 | 手動/間接 | 正常継続＝seed必要 |
| 052 | IT-22 | その他 | E2E自動化 | 030（結合 列数/ヘッダ不正→エラー） |
| 053 | IT-22 | その他 | E2E自動化 | 022（rollback→一覧） |
| 054 | IT-22 | 相関 | 手動/間接 | 在庫不足等の業務相関はDB＝間接 |
| 055 | IT-22 | 相関 | 手動/間接 | 正常相関の継続＝seed必要 |
| 056 | IT-22 | 相関 | 手動/間接 | 正常相関の継続＝seed必要 |
| 057 | IT-22 | 相関 | 手動/間接 | 同一在庫/区分不正の業務相関＝間接 |
| 058 | IT-22 | DB相関 | 手動/間接 | コード解決成功＝seed必要 |
| 059 | IT-22 | DB相関 | 手動/間接 | コード未解決→業務エラー（DB照合）＝間接 |
| 060 | IT-22 | 必須制御 | 対象外 | 取込履歴 dtb_csv_import_history は記録なし＝観測対象なし |
| 061 | IT-22 | 部分入力 | 対象外 | 固定列CSVに部分入力観点は非該当 |
| 062 | IT-26 | 登録内容 | E2E自動化 | 040（分割 成功メッセージ） |
| 063 | IT-26 | 登録内容 | E2E自動化 | 020/022/030/034（「登録されない」をブラウザ観測可能な間接証跡＝成功メッセージなし・エラー表示・一覧滞留で判定。DB未反映の厳密確認は068で手動/間接） |
| 064 | IT-26 | 登録内容 | 手動/間接 | dtb_stock_split_join 追加レコードはDB＝間接 |
| 065 | IT-26 | 登録内容 | 手動/間接 | 結合登録レコードはDB＝間接 |
| 066 | IT-26 | 登録内容 | 手動/間接 | 承認メンバー解決はseed/DB＝間接（表示は060でカバー） |
| 067 | IT-23 | 登録内容 | 対象外 | 本機能はDB検索を行わない |
| 068 | IT-26 | 登録内容 | 手動/間接 | ロールバックのDB未反映確認＝間接 |
| 069 | IT-26 | 登録内容 | 手動/間接 | 親/明細レコード値はDB＝間接 |
| 070 | IT-26 | 登録内容 | 手動/間接 | ステータス(3/2)遷移はDB＝間接 |
| 071 | IT-26 | 登録内容 | 手動/間接 | 在庫確保・更新はDB＝間接 |
| 072 | IT-26 | 登録内容 | 手動/間接 | 取込履歴(記録なし)＝間接/対象 |
| 073 | IT-26 | 登録内容 | 手動/間接 | 承認メール送信レコード＝間接 |
| 074 | IT-26 | 登録内容 | 手動/間接 | 最大長値の登録＝seed/DB |
| 075 | IT-26 | 登録内容 | 手動/間接 | 最大長+1で登録されない＝DB間接 |
| 076 | IT-26 | 登録内容 | 手動/間接 | 最小長の登録＝seed/DB |
| 077 | IT-26 | 登録内容 | 手動/間接 | 最小長-1で登録されない＝DB間接 |
| 078 | IT-26 | 登録内容 | 手動/間接 | 正常登録＝seed/DB |
| 079 | IT-26 | 実行結果 | 手動/間接 | 登録レコードの実行結果＝DB間接（成功表示は040でカバー） |
| 080 | IT-23 | 実行結果 | 対象外 | 本機能はDB検索を行わない（結合取込結果のDBはIT-26側で間接扱い） |
| 081 | IT-16 | 実行結果 | 手動/間接 | 取込内容とデータの一致＝CSV/DB照合は手動 |
| 082 | IT-16 | 実行結果 | 手動/間接 | onValidateRow結果の内容一致＝手動 |
| 083 | IT-16 | 実行結果 | 手動/間接 | onAfterImport(ロールバック)の内容＝間接 |
| 084 | IT-16 | 実行結果 | 手動/間接 | 最大長の取込内容一致＝手動 |
| 085 | IT-16 | 実行結果 | 手動/間接 | 最大長+1でエラー＝内容照合は手動 |
| 086 | IT-16 | 実行結果 | 手動/間接 | 最小長の取込内容一致＝手動 |
| 087 | IT-16 | 実行結果 | 手動/間接 | 最小長-1でエラー＝手動 |
| 088 | IT-16 | 実行結果 | 手動/間接 | 取込継続の内容一致＝手動 |
| 089 | IT-16 | 実行結果 | 手動/間接 | 取込結果の内容一致＝手動 |
| 090 | IT-16 | 実行結果 | 手動/間接 | 取込結果の内容一致＝手動 |

集計（付帯表2と一致）: 自動化 31 ／ 手動・間接 50 ／ 対象外 9（007,008,015,016,017,060,061,067,080）。**未分類 0**。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-M04-23-ADMIN | dtb_member(管理者)＋dtb_base_info(店舗) | 在庫管理にアクセスでき、編集可能店舗を1つ以上持つ管理者。`config/default.config.ts` の ECCUBE_ADMIN_USER/PASS を流用。店舗セレクトに実選択肢が1件以上（選択は先頭の実選択肢を動的に選ぶ＝index固定にしない） | fixture(config既定＋既存店舗) | 既存利用・撤去不要 | 001-007,010-035,060,070,071 |
| SEED-M04-23-NOEDIT-STORE | dtb_base_info(店舗)＋dtb_member権限 | テスト管理者が編集権限を持たない店舗を1件用意（`isEditableShop`=false になる店舗）。承認通知先メンバー取得の権限外(403/空応答)分岐の検証用 | fixture/migration | 既存店舗の権限割当のみ・撤去不要 | 061 |
| SEED-M04-23-SPLIT-OK | dtb_product_stock | 分割元/分割先の商品コードが「店舗×在庫区分(EC-CUBE)」で実在し、分割元在庫が分割数以上 | fixture/migration | 専用商品コード接頭辞(e2e_)・取込で生成される dtb_stock_split_join は使い捨て/撤去 | 040 |
| SEED-M04-23-JOIN-OK | dtb_product_stock | 結合先/結合元の商品コードが「店舗×在庫区分」で実在し、結合元在庫が結合元数量以上。結合元在庫区分(1/2)が解決可能 | fixture/migration | 専用商品コード接頭辞・生成レコード撤去 | 041 |

注: 取込成功(040/041)は M04-13 の登録/承認ロジックが動くため、ProductStock の実在と在庫充足が前提。`migration`(現行pf-eccube3移行)を充てる場合 DB は ec-cube-enterprise 正典(reverse-design 1c)に従う。CSRF不正(023/031)・未認証(050-053)・直POST(024/025/032/033/051)はDB生成を伴わず後始末不要。

## 付帯表4：不具合候補（仕様乖離）／要確認

テストは仕様どおりに書き、実装が違えば落ちて検出する。期待値を実装へ書き換えない。

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | 結合CSVのフォーマット表（モーダル表示）は基本設計(Excel)の列名「結合先商品コード／結合数／結合元商品コード／結合元在庫区分／結合元在庫数」を表示（オラクル＝設計md:67,69 / Excel:290,311） | join_modal_body.twig:52 で format_join_quantity=messages.ja.yaml:4682「結合元在庫数」を表示し「結合数」を表示しない（5列目 format_source_stock_quantity:4688 も「結合元在庫数」で重複） | **表示ラベルの不具合候補**：モーダル2列目ラベルが「結合数」でない。E2E-006 は仕様(Excel表記)どおり「結合数」を期待し、実装差異があれば落として検出する | E2E-M04-23-006 | 不具合候補 |
| 2 | CSV雛形ヘッダ・取込ハンドラの列表記は Excel表記「結合数」「結合元在庫数」を正とする（オラクル＝設計md:69「テスト／取込CSVはExcel表記を期待値とする」） | 設計md:69 は「現状実装(雛形・取込ハンドラ)は `結合数量`・`結合元数量` を用いており実装側の是正対象」と記載。一方 ハンドラ定数(StockJoinListCsvImportHandler.php:49 COL_JOIN_QTY 等)の現値は要実機確認（コミット間で差異の可能性） | **設計書/実装の差異は要確認**：是正前なら Excel表記CSVはヘッダ不一致でエラー、是正後なら成功。E2Eは期待値を Excel表記(設計md:69)に固定し、実装現挙動には寄せない（実装由来オラクル混入を避ける） | E2E-M04-23-006/041 | 要確認(設計書/実装差異) |
| 3 | 取込結果（行/業務エラー）は一覧上部のエラー表示エリアに表示 | addError→eccube.admin.error→alert.twig:42 .alert-danger | 行エラーの具体文言はファイル内容で動的（Handler が生成）。E2Eは「.alert-danger表示・成功なし・一覧滞留」を判定し、固有文言はオラクル化しない | E2E-M04-23-020/021/022/030 | 要確認(文言動的) |
| 4 | アップロードファイルはCSV(MIME text/csv 等)に限定 | StockSplitCsvUploadType.php:105-108 に File制約あり。だが listSplitCsvImport(Controller.php:222-) はフォームを使わず request bag を手動処理し UploadedFile::isValid のみ検証（MIME未検証） | フォームのFile/NotBlank制約が取込ルートで未適用＝MIME不正ファイルが isValid を通過し得る。MIME検証の是非を実機/設計で確認。テストは設計どおり「CSV前提」で書く | E2E-M04-23-020 | 不具合候補/要確認 |
| 5 | 必須メッセージキー（split_csv_modal.csv_file_required／inventory_category_required／form.approval_notification_target_required／common.upload_error_file_type） | messages.ja.yaml に当該キーが見当たらない（Form Type:104,76,57,107 が参照） | 翻訳キー未定義の可能性。ただし取込ルートはフォーム検証を経ないため実害は限定的。要メッセージ追加確認 | （手動分類） | 要確認(翻訳未定義) |
| 6 | ファイル未添付/区分不正は「CSVファイルのアップロードに失敗しました」 | Controller.php:235-255。FileType required により画面送信はHTML5でブロックされ得る | 画面UIからの未添付送信はブラウザが阻止する可能性。サーバ判定の検証は直POSTが必要＝024/025/032/033 を fixme | E2E-M04-23-024/025/032/033 | 要確認(実機/直POST) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口（エンドポイント） | 分割/結合CSV登録モーダル起点・雛形DL・承認メンバー取得 | 001,002,005,010,015,060 | カバー |
| アップロードフォーム項目（分割） | 店舗・在庫区分・承認通知先（所属/メンバー）・ファイル・送信ボタン | 002,003,007 | カバー（所属セレクト=007 追加） |
| アップロードフォーム項目（結合） | 店舗・在庫区分・ファイル・送信ボタン（承認欄なし） | 005 | カバー |
| CSV必須ヘッダ（分割4列） | フォーマット表の列名表示 | 004 | カバー |
| CSV必須ヘッダ（結合5列） | フォーマット表の列名表示（結合数含む） | 006 | カバー(不具合候補#1検出見込) |
| CSV雛形ダウンロード（分割/結合） | DL発火・ファイル名(.csv)・HTTP200・Content-Disposition(添付) | 010-017 | 部分カバー（DL発火/HTTP200は分割結合とも自動化、Content-Disposition添付は分割013/014のみ・結合は未検証、Content-Type=octet-streamは実装確認値でオラクル化せず未検証） |
| CSV雛形の内容（ヘッダのみ・UTF-8 BOM付き・出力失敗） | ヘッダ4列/5列のみ・BOM・出力失敗時挙動 | 018,019 | 手動（内容/BOM/文字コードはバイナリ確認、出力失敗=容量/権限はサーバ内部でブラウザ観測外） |
| コントローラ前段検証 #1 CSRF | トークン不正→csrf_invalid・一覧へ | 023,031 | カバー |
| コントローラ前段検証 #2 ファイル妥当性 | 未添付→csv_upload_error | 024,032 | 部分カバー（024/032はtest.fixme・未実行＝直POST要） |
| コントローラ前段検証 #3 店舗解決 | 店舗未解決→csv_upload_error | 026 | 部分カバー（026はtest.fixme・未実行＝直POST要） |
| コントローラ前段検証 #4 在庫区分 | 分割∈{1,2}／結合≥1 不正→csv_upload_error | 025,033 | 部分カバー（025/033はtest.fixme・未実行＝直POST要） |
| コントローラ前段検証 #5 ログインメンバー | 未ログイン→ログイン誘導（login_required は到達困難） | 051,053 | 一部カバー(fixme)・login_required分岐は手動 |
| コントローラ前段検証 #6 取込例外 | importer/handler 例外→csv_import_error 表示・一覧へ | 070 | 手動/要確認（例外誘発条件の構築が必要） |
| 取込処理 onValidateRow（形式検証） | 列数/必須ヘッダ/数値不正→行エラー・全件ロールバック | 020,021,022(分割)／030,034,035(結合) | カバー（分割: 列数020/必須ヘッダ021/数値022。結合: 列数030/数値034/必須ヘッダ035。正常×異常の対を分割結合とも具備） |
| 取込処理 onValidateRow 登録上限 MAX_ROWS=2000 | 2000件超で中断・エラー | 029 | 手動（029=性能依存・大容量CSV要・最終値は性能試験で確定） |
| 取込処理 ファイル種別（空ファイル/非CSV） | 空・非CSVの取込→エラー/失敗 | 028 | 部分カバー（028はtest.fixme・直POST要。不具合候補#4: 取込ルートはMIME未検証の可能性＝要実機確認） |
| 取込処理 onAfterImport（業務登録） | コード解決・在庫充足・同一在庫等の業務エラー | 040,041(成功)／業務エラー詳細=間接 | 一部カバー(成功はfixme・業務エラーは手動/間接) |
| トランザクション（全件ロールバック） | 1件でもエラーなら登録されない | 020,022（成功なし・一覧滞留で間接） | カバー(間接) |
| エラー時の挙動（モーダルリセット・一覧状態維持） | エラー後はモーダル選択内容リセット・一覧の検索条件/状態維持 | 071 | 手動/間接（リダイレクトで再描画＝間接観測） |
| 状態・データ更新（主データ/明細/ステータス/在庫/履歴/通知） | dtb_stock_split_join等の登録・在庫増減・ステータス遷移・承認メール・取込履歴 | （DB/メール/履歴=手動・間接、取込履歴は記録なし=対象外） | 手動/間接/対象外(理由付き) |
| 表示メッセージ（成功） | list_csv_split/join_import_done | 040,041 | 部分カバー（040/041はtest.fixme・未実行＝要シード） |
| 表示メッセージ（CSRF/アップロード失敗） | csrf_invalid / csv_upload_error | 023,031,024,025,032,033 | カバー(一部fixme) |
| 画面遷移（PRG：取込後一覧へ） | 取込結果に関わらず一覧へリダイレクト | 020,021,022,023,030,031 | カバー |
| 権限制御（M11-03 編集可能店舗） | 店舗セレクト・編集可能店舗による制限 | （権限はM11-03へ委譲） | 対象外(別機能委譲) |
| URL直接アクセス（未ログイン） | 雛形/取込POST/承認メンバーURL→管理ログイン | 050,051,052,053,054 | 部分カバー（雛形/承認メンバーGET=050/052/053は実装済、取込POST051/054はtest.fixme・未実行＝未認証直POST要） |
| 承認通知先メンバー取得 | JSON応答・HTTP200・権限外(編集不可店舗)応答 | 060,061 | 部分カバー（HTTP200/application/json=060実装済、JSON内容/権限外応答=061は手動・要seed） |
| ログ・監査 | log_error/error_log（秘匿情報含む） | （対象外＝観測外） | 対象外(理由付き) |
| DB検索 | 本機能は検索なし（一覧検索はM04-12） | （対象外） | 対象外(別機能委譲) |

未カバーはいずれも理由（DB/メール内部値・取込履歴記録なし・権限はM11-03委譲・検索はM04-12委譲・ログ観測外・HTML5 required回避の直POST要・要シード）を明記済み。
