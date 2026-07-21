# M04-33（戻しリストCSV） E2Eテストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m04-33_admin_stock_stock_move_return_list_csv_export.html`（正本 `functions/ec-cube-enterprise/m04-33_admin_stock_stock_move_return_list_csv_export.md`）

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/m04_33_admin_stock_stock_move_return_list_csv_export_it_cases.md`（母集合 計90観点行）

期待結果は画面表示・遷移・URL・ダウンロード発火/ファイル名/応答ヘッダ・フラッシュメッセージなどブラウザで観測できる結果で判定する。**期待結果は仕様（設計書・観点表・基本設計）由来**とし、実装/Form制約/POM由来の表示文言をオラクル化しない。TSV は既存IT casesの10列に実施管理欄（実施者・実施日・結果・失敗理由）を加えた14列固定。E2E固有情報は TSV 後の付帯表に `テストID` で対応づける。Playwright は本リポジトリでは実行しない（構造参考のみ）。未検証セレクタは `要実機確認`。

本機能は専用画面を持たず、在庫移動・振替一覧（M04-32 相当 / route `admin_stock_move_transfer`）画面ヘッダの「戻しリストCSV出力」ボタン押下で、選択行 `ids[]` を隠しPOSTフォームから送信してCSVをダウンロードする **POST専用エンドポイント** である。CSVの中身（列・整形・ピッキング区分・並び順・文字コード/BOM）は**手動確認**とする。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-16 | CSV本文（出力内容）＝手動 |
| IT-27 | ダウンロード発火・出力失敗（検証NGで非出力）・CSV本文（手動） |
| IT-15 | CSRF拒否・未認証誘導・参照のみ（DB非更新＝間接） |
| IT-20 | 完了ログ出力抑止＝ブラウザ観測外 |
| IT-25 | ボタン表示・送信可否（未選択alert）・確認ダイアログ非表示・HTTP応答・URL |
| IT-03 | 画面遷移（検証NGで一覧へリダイレクト・ダウンロード後の滞留） |
| IT-13 | URL直接アクセス（POST専用＝GET不可・未認証誘導） |
| IT-22 | 必須/相関/DB相関バリデーション（未選択・対象なし・存在しない・入庫先未設定・権限・対象外ステータス・複数店舗） |
| IT-23 | 取得対象データ・並び順（CSV本文＝手動。DB検索内部＝対象外） |
| IT-26 | 登録内容（本機能は参照のみで登録/更新なし＝対象外） |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m04-33_admin_stock_stock_move_return_list_csv_export（戻しリストCSV）	E2E-M04-33-001	IT-25	UI部品	P2	在庫移動・振替一覧に「戻しリストCSV出力」ボタンが表示される	管理者ログイン済／SEED-M04-33-ADMIN	—	1. 在庫移動・振替一覧（/%admin%/product/stock/move_transfer）を開く	「戻しリストCSV出力」ボタンが表示されること。				
m04-33_admin_stock_stock_move_return_list_csv_export（戻しリストCSV）	E2E-M04-33-002	IT-27	実行結果	P1	行を選択しボタン押下でCSVダウンロードが発火する	管理者ログイン済／SEED-M04-33-EXPORTABLE	出力可能な在庫移動・振替情報を1件以上選択	"1. 一覧を開く
2. 出力可能な行のチェックボックスを選択
3. 「戻しリストCSV出力」ボタンを押下"	ダウンロードが発火し一覧HTMLへ遷移しないこと。				
m04-33_admin_stock_stock_move_return_list_csv_export（戻しリストCSV）	E2E-M04-33-003	IT-27	実行結果	P1	ダウンロードファイル名が stock_move_transfer_return_list_<7桁ID>_<日時>.csv 形式である	管理者ログイン済／SEED-M04-33-EXPORTABLE	出力可能な在庫移動・振替情報を1件以上選択	"1. 一覧で出力可能行を選択
2. 「戻しリストCSV出力」ボタンを押下
3. ダウンロードファイル名を確認"	ファイル名が「stock_move_transfer_return_list_{選択IDの最小値を7桁ゼロ詰め}_{YmdHis}.csv」形式であること。				
m04-33_admin_stock_stock_move_return_list_csv_export（戻しリストCSV）	E2E-M04-33-004	IT-25	HTTPステータス	P2	CSV出力応答が application/octet-stream の添付ファイルを返す	管理者ログイン済／SEED-M04-33-EXPORTABLE	出力可能なID配列＋有効CSRFトークン	"1. 隠しフォームのCSRFトークンを取得
2. 出力可能なIDで return_list_csv_export へPOST
3. 応答ヘッダを確認"	Content-Type が application/octet-stream で、Content-Disposition が attachment であること。				
m04-33_admin_stock_stock_move_return_list_csv_export（戻しリストCSV）	E2E-M04-33-010	IT-25	送信可否制御	P1	未選択でボタン押下すると未選択アラートが表示されCSV出力されない	管理者ログイン済／SEED-M04-33-ADMIN	行を1件も選択しない	"1. 一覧を開く
2. 行を選択せず「戻しリストCSV出力」ボタンを押下"	「1つ以上の在庫移動情報を選択してください。」のアラートが表示され、ダウンロードが発火せず一覧に留まること。				
m04-33_admin_stock_stock_move_return_list_csv_export（戻しリストCSV）	E2E-M04-33-011	IT-22	必須バリデーション	P1	ids空でPOSTすると一覧へリダイレクトし未選択エラーが表示される	管理者ログイン済／SEED-M04-33-ADMIN	ids[]＝空＋有効CSRFトークン	"1. CSRFトークンを取得
2. ids[]を空にして return_list_csv_export へPOST"	一覧（admin_stock_move_transfer_page）へリダイレクトし「1つ以上の在庫移動情報を選択してください。」が表示されること。				
m04-33_admin_stock_stock_move_return_list_csv_export（戻しリストCSV）	E2E-M04-33-012	IT-22	DBとの相関バリデーション	P1	存在しないIDのみだと「対象のデータが見つかりません。」で一覧へリダイレクトする	管理者ログイン済／SEED-M04-33-ADMIN	存在しないID（例 99999999）のみ＋有効CSRFトークン	"1. CSRFトークンを取得
2. 存在しないIDのみで return_list_csv_export へPOST"	一覧へリダイレクトし「対象のデータが見つかりません。」が表示されること。				
m04-33_admin_stock_stock_move_return_list_csv_export（戻しリストCSV）	E2E-M04-33-013	IT-22	DBとの相関バリデーション	P2	一部存在しないIDがあると「ID: {id} は存在しません。」が表示される	管理者ログイン済／SEED-M04-33-EXPORTABLE	出力可能ID＋存在しないIDを混在＋有効CSRFトークン	"1. CSRFトークンを取得
2. 有効IDと存在しないIDを混在して return_list_csv_export へPOST"	一覧へリダイレクトし「ID: {存在しないid} は存在しません。」が表示されること。				
m04-33_admin_stock_stock_move_return_list_csv_export（戻しリストCSV）	E2E-M04-33-014	IT-22	相関バリデーション	P2	入庫先店舗未設定のIDだと「ID: {id} は入庫先店舗が設定されていません。」が表示される	管理者ログイン済／SEED-M04-33-NO-MOVE-TO	入庫先店舗未設定のID＋有効CSRFトークン	"1. CSRFトークンを取得
2. 入庫先未設定のIDで return_list_csv_export へPOST"	一覧へリダイレクトし「ID: {id} は入庫先店舗が設定されていません。」が表示されること。				
m04-33_admin_stock_stock_move_return_list_csv_export（戻しリストCSV）	E2E-M04-33-015	IT-22	相関バリデーション	P1	担当外店舗のIDだと「ID: {id} は権限のない店舗のデータです。」が表示される	管理者ログイン済（担当店舗限定）／SEED-M04-33-OTHER-STORE	ログインメンバーの担当外店舗が入庫先のID＋有効CSRFトークン	"1. CSRFトークンを取得
2. 担当外店舗のIDで return_list_csv_export へPOST"	一覧へリダイレクトし「ID: {id} は権限のない店舗のデータです。」が表示されること。				
m04-33_admin_stock_stock_move_return_list_csv_export（戻しリストCSV）	E2E-M04-33-016	IT-22	相関バリデーション	P1	対象外ステータスのIDだと「ID: {id} は対象外のステータスです。」が表示される	管理者ログイン済／SEED-M04-33-INVALID-STATUS	新規/差戻し等（許可外ステータス）のID＋有効CSRFトークン	"1. CSRFトークンを取得
2. 対象外ステータスのIDで return_list_csv_export へPOST"	一覧へリダイレクトし「ID: {id} は対象外のステータスです。」が表示されること（許可は出庫承認済み4/移動中5/入庫承認待ち6/入庫承認済み7）。				
m04-33_admin_stock_stock_move_return_list_csv_export（戻しリストCSV）	E2E-M04-33-017	IT-22	相関バリデーション	P1	入庫先店舗が複数混在すると「複数店舗の在庫移動・振替情報を同時に処理することはできません。」が表示される	管理者ログイン済／SEED-M04-33-MULTI-STORE	入庫先店舗の異なる2件のID＋有効CSRFトークン	"1. CSRFトークンを取得
2. 入庫先店舗が異なる2件のIDで return_list_csv_export へPOST"	一覧へリダイレクトし「複数店舗の在庫移動・振替情報を同時に処理することはできません。」が表示されること。				
m04-33_admin_stock_stock_move_return_list_csv_export（戻しリストCSV）	E2E-M04-33-018	IT-15	CSRF	P1	不正CSRFトークンのPOSTはCSVを出力せず拒否される	管理者ログイン済／SEED-M04-33-EXPORTABLE	出力可能なID配列＋不正/欠落CSRFトークン	1. 不正なCSRFトークンで return_list_csv_export へPOST	CSVが出力されず拒否されること（CSRF検証で例外）。				
m04-33_admin_stock_stock_move_return_list_csv_export（戻しリストCSV）	E2E-M04-33-020	IT-15	未認証	P1	未ログインで戻しリストCSV出力URLへPOSTすると管理ログイン画面へ誘導される	未ログイン	—	1. 未ログインで return_list_csv_export へPOST	管理ログイン画面へ誘導されること。				
m04-33_admin_stock_stock_move_return_list_csv_export（戻しリストCSV）	E2E-M04-33-021	IT-13	URL直接アクセス	P2	戻しリストCSV出力URLへGET直接アクセスするとPOST専用のため許可されない	管理者ログイン済／SEED-M04-33-ADMIN	—	1. return_list_csv_export へGETで直接アクセス	GETは許可されず Method Not Allowed（405）となること（route は methods=POST）。				
m04-33_admin_stock_stock_move_return_list_csv_export（戻しリストCSV）	E2E-M04-33-030	IT-16	実行結果	P1	出力CSVの列構成・整形・ピッキング区分・並び順が設計どおり	管理者ログイン済／SEED-M04-33-EXPORTABLE	出力可能な在庫移動・振替情報を選択	"1. 出力可能行を選択しCSVを出力
2. CSVの中身（ヘッダ8列・各データ行・並び順）を確認"	ヘッダ行（ピッキング区分/棚番号/言語・状態/略称/色・R/数/商品名/基準価格）とデータ行が、設計の整形・ピッキング区分振分・並び順（ピッキング区分→棚番→言語→状態→Foil→略称タグ→レアリティ→色→カード）どおりであること。				
m04-33_admin_stock_stock_move_return_list_csv_export（戻しリストCSV）	E2E-M04-33-031	設計書追加(母集合外/CSV出力仕様)	出力フォーマット(文字コード/BOM/区切り)	P2	出力CSVの文字コード・BOM・区切りが設定どおり	管理者ログイン済／SEED-M04-33-EXPORTABLE	出力可能な在庫移動・振替情報を選択	"1. CSVを出力
2. 文字コード・BOM・区切り文字を確認"	文字コードが eccube_csv_export_encoding 設定どおり（UTF-8設定時は先頭BOM付与）で、区切りが eccube_csv_export_separator 設定どおりであること。				
m04-33_admin_stock_stock_move_return_list_csv_export（戻しリストCSV）	E2E-M04-33-032	IT-16	実行結果	P2	出力CSVの整形・分岐・境界が設計どおり（正常系/境界の対）	管理者ログイン済／SEED-M04-33-EXPORTABLE-VARIANTS	整形・分岐を網羅する明細（基準価格null・閾値未設定→ピッキング区分空欄、サプライ商品→区分99、本店/支店の棚番有無、略称タグ有無、Foil有/無、色・レアリティ複数、商品名整形対象（[略称]有/無）、HAVING/GROUP BY集約）	"1. 各バリアントを含む明細を選択しCSVを出力
2. ピッキング区分振分・棚番ソート（本店のみ棚番順/支店は同順）・整形・集約結果を確認"	基準価格null・閾値未設定はピッキング区分が空欄、サプライは区分99（言語/状態は「サプライ品」・略称/色R空）に振り分けられ、本店は棚番順・支店は棚番ソートなし、商品名整形（[略称]ありは[略称]・【言語/状態】・色・レアリティを除去／[略称]無しは[～]を除去）・Foil/色/レアリティの整形と数量集約（GROUP BY）が設計の整形・並び順どおりであること。				
m04-33_admin_stock_stock_move_return_list_csv_export（戻しリストCSV）	E2E-M04-33-005	IT-03	画面遷移	P2	検証NGで現在のページ番号を保持して一覧へリダイレクトする	管理者ログイン済／SEED-M04-33-PAGED-LIST	2ページ目を表示中に検証NGとなるPOST（ids空 等）＋有効CSRFトークン	"1. 一覧の2ページ目を表示
2. CSRFトークンを取得
3. 検証NGとなる入力で return_list_csv_export へPOST"	セッションのページ番号（eccube.admin.stock.move_transfer.page_no）を用いた admin_stock_move_transfer_page（現在ページ）へリダイレクトし、エラーが表示されること。				
m04-33_admin_stock_stock_move_return_list_csv_export（戻しリストCSV）	E2E-M04-33-019	IT-22	相関バリデーション	P2	出庫承認済み(4)のIDは許可ステータスの正常境界として出力できる	管理者ログイン済／SEED-M04-33-STATUS-OUTBOUND-APPROVED	ステータス＝出庫承認済み(4)・入庫先設定済・担当店舗・単一店舗のID＋有効CSRFトークン	"1. CSRFトークンを取得
2. 出庫承認済み(4)のIDで return_list_csv_export へPOST"	検証を通過しCSVが出力されること（許可ステータスは出庫承認済み4/移動中5/入庫承認待ち6/入庫承認済み7。設計書 md:123 由来。※実装 ALLOWED_STATUS_IDS は5/6/7のみで4を含まず落ちる想定＝付帯表4 #6 の乖離を検出）。				
m04-33_admin_stock_stock_move_return_list_csv_export（戻しリストCSV）	E2E-M04-33-040	IT-22	相関バリデーション	P2	複数の検証エラーが同時に発生すると各メッセージをまとめて表示する	管理者ログイン済／SEED-M04-33-NO-MOVE-TO＋SEED-M04-33-INVALID-STATUS	入庫先未設定ID＋対象外ステータスID＋存在しないIDを同時指定＋有効CSRFトークン	"1. CSRFトークンを取得
2. 入庫先未設定・対象外ステータス・存在しないIDを混在して return_list_csv_export へPOST"	一覧へリダイレクトし「ID: {id} は入庫先店舗が設定されていません。」「ID: {id} は対象外のステータスです。」「ID: {id} は存在しません。」が全て表示されること（エラーは複数まとめて返す md:112）。				
m04-33_admin_stock_stock_move_return_list_csv_export（戻しリストCSV）	E2E-M04-33-041	IT-22	必須バリデーション	P2	空文字等の空要素のみのidsは整数化・空要素除去で未選択エラーになる	管理者ログイン済／SEED-M04-33-ADMIN	ids[]＝空文字等の空要素のみ＋有効CSRFトークン	"1. CSRFトークンを取得
2. ids[]に空文字等の空要素のみを入れて return_list_csv_export へPOST"	idsの整数化・空要素除去（md:105）により空扱いとなり、一覧へリダイレクトして「1つ以上の在庫移動情報を選択してください。」が表示されること。				
```

## 付帯表1：E2E自動化区分・セレクタ・仕様根拠・元ITケースID（TSV外）

セレクタは Twig 由来の位置情報のみ（`src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig`）。行番号は ec-cube-enterprise 現行ソース。期待結果（合否）は設計書/観点表由来であり、セレクタ・Form制約をオラクル化しない。

| テストID | E2E可否 | 対象セレクタ（根拠 file:line / 要実機確認） | 仕様根拠 |
|----------|---------|----------------------------------------------|----------|
| E2E-M04-33-001 | E2E自動化 | #stockMoveTransferReturnListCsvExport（index.twig:628 / ラベル trans `admin.stock.move_transfer.action_return_list_csv_export`=「戻しリストCSV出力」messages.ja.yaml:5134） | 利用者視点の入口・フロント挙動（出力ボタン） |
| E2E-M04-33-002 | E2E自動化(要シード) | #stockMoveTransferReturnListCsvExport / .js-move-transfer-row-check（index.twig:692 name=ids[]） | 分岐・遷移（検証OK→StreamedResponse Controller.php:448） |
| E2E-M04-33-003 | E2E自動化(要シード) | 同上＋Download.suggestedFilename | CSV出力仕様 ファイル名（Service.php:95-96） |
| E2E-M04-33-004 | E2E自動化(要シード＋CSRF) | #form_stock_move_transfer_return_list_csv（index.twig:971-973 CSRF hidden）→ page.request.post 応答ヘッダ | CSV出力仕様（Content-Type/Disposition Service.php:97-100） |
| E2E-M04-33-010 | E2E自動化 | #stockMoveTransferReturnListCsvExport（クリックJS index.twig:172-176 alert）＋dialogハンドラ | 表示メッセージ no_selection（messages.ja.yaml:5139 / index.twig:173） |
| E2E-M04-33-011 | E2E自動化(要CSRF) | .alert-danger（alert.twig:42 / default_frame.twig:200）＋リダイレクトURL | プロセスフロー2 no_selection（Controller.php:489-491） |
| E2E-M04-33-012 | E2E自動化(要CSRF) | .alert-danger＋リダイレクトURL | 出力前バリデーション 対象なし（Service.php:121） |
| E2E-M04-33-013 | E2E自動化(要シード＋CSRF) | .alert-danger | 出力前バリデーション 存在しないID（Service.php:164） |
| E2E-M04-33-014 | E2E自動化(要シード＋CSRF) | .alert-danger | 出力前バリデーション 入庫先未設定（Service.php:144） |
| E2E-M04-33-015 | E2E自動化(要シード＋CSRF) | .alert-danger | 出力前バリデーション 権限なし（Service.php:149）・権限・認可 |
| E2E-M04-33-016 | E2E自動化(要シード＋CSRF) | .alert-danger | 出力前バリデーション 対象外ステータス。許可ステータスは**設計書**（正本 m04-33 md:123）由来＝出庫承認済み4/移動中5/入庫承認待ち6/入庫承認済み7。※実装 `Service.php:44-47` の `ALLOWED_STATUS_IDS` は 5/6/7 のみで「出庫承認済み(4)」を含まない乖離あり（付帯表4 #6）。検証分岐自体は `Service.php:154-156` |
| E2E-M04-33-017 | E2E自動化(要シード＋CSRF) | .alert-danger | 出力前バリデーション 複数店舗混在（Service.php:169） |
| E2E-M04-33-018 | E2E自動化(要CSRF無効化) | return_list_csv_export POST | 分岐・遷移 CSRF不正（Controller.php:441 isTokenValid） |
| E2E-M04-33-020 | E2E自動化(資格情報不要) | 管理ログイン画面 #login_id（login.twig） | 利用者視点の入口（管理画面ログインを要する）・権限・認可 |
| E2E-M04-33-021 | E2E自動化 | return_list_csv_export GET → 405 | 利用者視点の入口 route methods=POST（Controller.php:437） |
| E2E-M04-33-005 | E2E自動化(要シード＝2ページ目データ・要確認) | postExport→リダイレクトURL（admin_stock_move_transfer_page セッション page_no / Controller.php:485,487）＋.alert-danger | 利用者視点の入口・分岐遷移（検証NG時は現在ページ番号を保持して一覧へ md:56・129） |
| E2E-M04-33-019 | E2E自動化(要シード) | #form_stock_move_transfer_return_list_csv のCSRF→postExport（応答 Content-Disposition attachment） | 出力前バリデーション 許可ステータス正常境界 出庫承認済み4（md:123）。※実装 `ALLOWED_STATUS_IDS=5/6/7` のみで4を含まず落ちる想定＝付帯表4 #6 を仕様どおりに書いて検出 |
| E2E-M04-33-040 | E2E自動化(要シード＋CSRF) | .alert-danger（複数メッセージ） | 出力前バリデーション「エラーは複数まとめて返す」（md:112 / Service.php:144,156,164） |
| E2E-M04-33-041 | E2E自動化(要CSRF) | postExport（ids[]＝空文字等の空要素のみ）→.alert-danger | プロセスフロー2 idsの整数化・空要素除去（md:105 / Controller.php:485）。空要素のみは空扱い→no_selection |
| E2E-M04-33-030 | 手動 | CSV本文（ダウンロードファイルを開いて目視） | CSV出力仕様 出力列・整形・並び順（設計書「CSV出力仕様」「出力対象データと並び順」） |
| E2E-M04-33-031 | 手動 | CSV本文（文字コード/BOM/区切り） | CSV出力仕様 文字コード（CsvExportService / eccube_csv_export_encoding）※既存IT母集合90外の設計書追加観点 |
| E2E-M04-33-032 | 手動 | CSV本文（整形・分岐・境界の振分） | CSV出力仕様（設計書「出力列・整形ルール」「出力対象データと並び順」: ピッキング区分振分・棚番ソート・集約・整形の分岐/境界） |

注: 元IT cases（接頭辞 `IT-M04-33-ADMIN-STOCK-STOCK-MOVE-RETURN-LIST-CSV-EXPORT-NNN`）は観点名のみの定型自動生成スタブ（操作手順が「対象画面を表示する」等の汎用文）であり機能固有シナリオを持たない。本E2Eは設計書本文（利用者視点の入口・CSV出力仕様・出力前バリデーション・分岐遷移）を一次情報源として網羅した。行単位対応は付帯表2bが正本。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合は既存 `m04_33_..._it_cases.md` の関連ID件数（IT-22=35／IT-23=22／IT-25=9／IT-26=7／IT-03=7／IT-15=4／IT-27=2／IT-20=2／IT-16=1／IT-13=1＝計90）。本機能の入力は選択ID配列（`ids[]`）とCSRFトークンのみで、出力はCSVダウンロードであるため、各スタブ行の観点を「本機能でブラウザ観測可能か」で分類する。内訳は付帯表2b（行単位明細・全90行）が正本。

**「E2E自動化」列は自動化“対象”の分類であり、spec実装状況とは別軸**である（監査透明性）。spec で現在“実行される（実装済）”のは **001/010/020/021**（資格情報のみで成立）＋ **011（ids空サーバ検証）/012（存在しないIDのみ）/018（不正CSRF）/041（空要素のみ→未選択）**（ログイン＋隠しフォームのCSRFトークン取得のみで成立・シード不要）の計8件。残りの **002,003,004 / 005 / 013〜017 / 019 / 040** はシード（付帯表3）投入を要するため spec 上 `test.fixme`（理由付き）で実装保留。下表の件数は「自動化対象」であって全件「実装済」ではない点に注意（実装済8／fixme保留11）。付帯表5のカバー状況は「実装済」と「写像済み・spec fixme（未実行）」を区別して記載する。

| IT-ID | 母集合 | E2E自動化 | 手動/間接 | 対象外 | 対象外/手動の主な理由 |
|-------|:-----:|:--------:|:--------:|:------:|------------------|
| IT-16 | 1 | 0 | 1 | 0 | CSV出力内容の一致確認＝ファイルを開く目視（手動） |
| IT-27 | 2 | 1 | 1 | 0 | 出力失敗（検証NGで非出力）は自動化／出力内容の一致は手動 |
| IT-15 | 4 | 2 | 1 | 1 | CSRF拒否・未認証誘導は自動化／参照のみ（DB非更新）は間接／実装具体化メタは対象外 |
| IT-20 | 2 | 0 | 0 | 2 | 完了ログ（log_info）出力抑止＝ブラウザ観測外 |
| IT-25 | 9 | 5 | 0 | 4 | ボタン/送信可否/確認ダイアログ非表示/HTTP応答/URLは自動化／CSV_HEADER定数・ログ・メタは観測外 |
| IT-03 | 7 | 3 | 0 | 4 | 検証NGで一覧へリダイレクトする画面遷移（ページ番号保持含む 005）は自動化／外部画面なし・ログ・メタは対象外 |
| IT-13 | 1 | 1 | 0 | 0 | URL直接アクセス（POST専用GET不可）を自動化 |
| IT-22 | 35 | 9 | 0 | 26 | 必須/相関/DB相関の各失敗分岐＋正常系（有効ids/出庫承認済み4境界/複数まとめて/空要素除去）を自動化／6桁・文字種・数値・部分入力など `ids[]`配列入力に非該当の細目は対象外 |
| IT-23 | 22 | 0 | 3 | 19 | 取得対象データ・実行結果（件数/集約）・並び順はCSV本文＝手動/間接。生SQLのDB検索内部は観測外 |
| IT-26 | 7 | 0 | 0 | 7 | 本機能は参照のみで登録/更新を行わない（登録内容観点は非該当） |
| 合計 | 90 | 21 | 6 | 63 | **未分類 0** |

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

各行（`...-NNN`）の観点を、本機能でのブラウザ観測可否で `E2E自動化／手動・間接／対象外` に分類し、対応E2EケースIDまたは理由を付す。区分は行ごとに確定し、付帯表2の集計と一致する。

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-16 | 実行結果 | 手動 | 030（CSV本文＝出力内容の一致は目視）／032（整形・分岐・境界の振分） |
| 002 | IT-27 | 実行結果 | 手動 | 030（CSV本文）。※031（文字コード/BOM/区切り）は既存IT母集合90外＝設計書追加観点として別管理（IT-27 出力失敗には割当てない） |
| 003 | IT-27 | 出力失敗 | E2E自動化 | 011/012（検証NGでCSVを出力せず一覧へ） |
| 004 | IT-15 | CSRF | E2E自動化 | 018（不正CSRFで拒否） |
| 005 | IT-15 | 未認証 | E2E自動化 | 020（未ログインでログイン誘導） |
| 006 | IT-15 | 対象データ | 手動/間接 | 参照のみで業務データ非更新＝DB内部で間接確認 |
| 007 | IT-20 | 出力抑止 | 対象外 | 完了ログ出力抑止はブラウザ観測外 |
| 008 | IT-20 | 識別子 | 対象外 | ログ識別子はブラウザ観測外 |
| 009 | IT-15 | 状態変化 | 対象外 | 「実装読込で具体化」のメタ記述で観測対象なし |
| 010 | IT-25 | UI部品 | E2E自動化 | 001（出力ボタン表示） |
| 011 | IT-25 | UI部品 | 対象外 | CSV_HEADER はコード定数でブラウザ観測外 |
| 012 | IT-25 | 操作起点 | 対象外 | 完了ログ確認はブラウザ観測外 |
| 013 | IT-25 | 確認ダイアログ | E2E自動化 | 010（未選択時はalertのみで確認ダイアログ非表示）／002（選択済み正常出力時も確認ダイアログを介さずダウンロード発火＝dialog未発火） |
| 014 | IT-25 | 確認ダイアログ | 対象外 | ログのみ確認でブラウザ観測外 |
| 015 | IT-25 | 確認ダイアログ | 対象外 | 実装確認メタで観測対象なし |
| 016 | IT-25 | 送信可否制御 | E2E自動化 | 010（未選択時に送信せずalert） |
| 017 | IT-03 | 外部画面 | 対象外 | 本機能は別画面遷移を持たない（ダウンロードのみ） |
| 018 | IT-03 | 画面遷移 | E2E自動化 | 011（検証NGで一覧へリダイレクト） |
| 019 | IT-03 | 画面遷移 | E2E自動化 | 012（検証NGで一覧へリダイレクト） |
| 020 | IT-03 | 画面遷移 | E2E自動化 | 002（ダウンロード後も一覧に留まる） |
| 021 | IT-03 | 画面遷移 | 対象外 | ログ確認のメタで遷移観測対象なし |
| 022 | IT-03 | 画面遷移 | 対象外 | 実装確認メタで観測対象なし |
| 023 | IT-03 | 画面遷移 | 対象外 | 実装具体化メタで観測対象なし |
| 024 | IT-13 | URL直接アクセス | E2E自動化 | 021（POST専用GET不可）/020（未認証誘導） |
| 025 | IT-25 | HTTPステータス | E2E自動化 | 004（octet-stream添付応答） |
| 026 | IT-25 | URL | E2E自動化 | 021（return_list_csv_export ルート） |
| 027 | IT-22 | 必須バリデーション | E2E自動化 | 011（ids空→未選択エラー） |
| 028 | IT-22 | 必須バリデーション | E2E自動化 | 002/004（有効ids＋CSRFはエラーなく出力へ進む正常系）／019（出庫承認済み4の正常境界）／041（空要素除去の境界） |
| 029-034 | IT-22 | 文字列長バリデーション | 対象外 | `ids[]`は整数配列で文字列長制約の入力欄を持たない |
| 035-042 | IT-22 | 数値バリデーション | 対象外 | 数値入力欄を持たない（IDは選択行由来。非該当） |
| 043,044 | IT-22 | 文字種バリデーション | 対象外 | 文字種入力欄を持たない（非該当） |
| 045-053 | IT-22 | その他のバリデーション | 対象外 | `ids[]`/CSRFに該当する細目なし（必須は027・相関は054-060で代表） |
| 054 | IT-22 | 相関バリデーション | E2E自動化 | 017（複数店舗混在） |
| 055 | IT-22 | 相関バリデーション | E2E自動化 | 014（入庫先店舗未設定） |
| 056 | IT-22 | 相関バリデーション | E2E自動化 | 015（権限のない店舗） |
| 057 | IT-22 | 相関バリデーション | E2E自動化 | 040（複数の相関エラーをまとめて表示＝md:112「エラーは複数まとめて返す」） |
| 058 | IT-22 | DBとの相関バリデーション | E2E自動化 | 002/004（有効レコード存在時はエラーなくStreamedResponseへ＝DB相関の正常系） |
| 059 | IT-22 | DBとの相関バリデーション | E2E自動化 | 012（対象データが見つからない）/013（存在しないID）/016（対象外ステータス） |
| 060 | IT-22 | 必須制御 | E2E自動化 | 010（未選択で送信不可） |
| 061 | IT-22 | 部分入力 | 対象外 | 部分入力の入力欄を持たない（ID選択のみ。非該当） |
| 062-079 | IT-23 | 検索条件 | 対象外 | 取得は選択IDからの生SQL集計で、DB検索内部はブラウザ観測外（一覧検索は別機能） |
| 080 | IT-23 | 実行結果 | 手動/間接 | 030（取得対象・並び順はCSV本文で目視確認） |
| 081,082 | IT-23 | 実行結果 | 手動/間接 | 030/032（取得結果・件数・GROUP BY集約はCSV本文で観測。生SQLのDB内部値は間接） |
| 083-087 | IT-26 | 登録内容 | 対象外 | 本機能は参照のみで登録/更新なし（登録観点は非該当） |
| 088 | IT-23 | 登録内容 | 対象外 | CSV_HEADER 定数でブラウザ観測外・登録なし |
| 089,090 | IT-26 | 登録内容 | 対象外 | 参照のみで登録なし／完了ログは観測外 |

集計（付帯表2と一致）: E2E自動化 21（003,004,005,010,013,016,018,019,020,024,025,026,027,028,054,055,056,057,058,059,060）／ 手動・間接 6（001,002,006,080,081,082）／ 対象外 63（残り）。**未分類 0**。（IT行番号は母集合の観点行番号でありE2EケースIDとは別体系）

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-M04-33-ADMIN | dtb_member（管理者） | 在庫管理一覧へアクセス可能な有効管理者1（担当店舗あり）。ログインID/PWは `config/default.config.ts` 既定 | fixture(config既定) | 既存利用・撤去不要 | 001,010,011,012,020,021,041 |
| SEED-M04-33-EXPORTABLE | dtb_stock_move_transfer / dtb_stock_move_transfer_detail / dtb_product_stock 他 | 出力可能な在庫移動・振替情報1件以上（設計書の許可ステータスは出庫承認済み4/移動中5/入庫承認待ち6/入庫承認済み7。正常系シードは実装乖離#6を避けるため**移動中5/入庫承認待ち6/入庫承認済み7のいずれか**を用いる・入庫先店舗設定済・ログイン担当店舗・単一店舗・入庫先在庫明細あり） | fixture/migration | 専用接頭辞・撤去。参照のみで非破壊 | 002,003,004,013,018,030,031 |
| SEED-M04-33-NO-MOVE-TO | dtb_stock_move_transfer | 入庫先店舗（move_to_base_info_id）が未設定の在庫移動・振替情報1件 | fixture/migration | 専用接頭辞・撤去 | 014,040 |
| SEED-M04-33-STATUS-OUTBOUND-APPROVED | dtb_stock_move_transfer | ステータス＝出庫承認済み（`STATUS_OUTBOUND_APPROVED=4`）・入庫先店舗設定済・ログイン担当店舗・単一店舗の出力可能な在庫移動・振替情報1件（許可ステータス正常境界の検証用） | fixture/migration | 専用接頭辞・撤去。参照のみで非破壊 | 019 |
| SEED-M04-33-PAGED-LIST | dtb_stock_move_transfer | 一覧が2ページ以上になる件数の在庫移動・振替情報（2ページ目を表示してから検証NG操作を行い、ページ番号保持リダイレクトを検証） | fixture/migration | 専用接頭辞・撤去。参照のみで非破壊 | 005 |
| SEED-M04-33-OTHER-STORE | dtb_stock_move_transfer / dtb_base_info / 担当店舗 | 入庫先店舗がログインメンバーの担当（MemberBaseInfo）に含まれない在庫移動・振替情報1件 | fixture/migration | 専用接頭辞・撤去。担当店舗限定メンバーで実行 | 015 |
| SEED-M04-33-INVALID-STATUS | dtb_stock_move_transfer | 許可外ステータス（新規1・差戻し3等）の在庫移動・振替情報1件 | fixture/migration | 専用接頭辞・撤去 | 016,040 |
| SEED-M04-33-MULTI-STORE | dtb_stock_move_transfer | 入庫先店舗の異なる出力可能な在庫移動・振替情報2件（混在検証用） | fixture/migration | 専用接頭辞・撤去 | 017 |
| SEED-M04-33-EXPORTABLE-VARIANTS | dtb_stock_move_transfer / dtb_stock_move_transfer_detail / dtb_product_stock / dtb_product_class / mtb_* 他 | CSV整形・分岐・境界を網羅する単一店舗の明細群（基準価格null/閾値未設定＝区分1・サプライ商品＝区分99・本店棚番あり/支店棚番・略称タグ有無・Foil有/無・色/レアリティ複数・商品名整形対象・同一商品の複数明細でGROUP BY集約） | fixture/migration | 専用接頭辞・撤去。参照のみで非破壊 | 032 |

注: CSRFトークンは一覧画面の隠しフォーム `#form_stock_move_transfer_return_list_csv`（index.twig:971-973）から取得して付与する（実装由来は位置情報のみ。期待値はオラクル化しない）。`migration` を選ぶ場合DB=ec-cube-enterprise正典。共通ログインは `config/default.config.ts` を流用する。

## 付帯表4：不具合候補（仕様乖離）／要確認

テストは仕様どおりに書き、実装が違えば落ちて検出する。期待値を実装へ書き換えない。

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | 検証NG時は出力失敗メッセージを表示し一覧へ遷移 | addError は `eccube.admin.error` フラッシュ（Controller.php:490-491,510-511）→ alert.twig:41-49 `.alert-danger` | リダイレクト先 admin_stock_move_transfer_page でフラッシュが表示されることを実機確認（セッションのページ番号依存） | 011-017 | 要確認(表示位置) |
| 2 | 未選択は「1つ以上の在庫移動情報を選択してください。」 | クライアントは JS alert（index.twig:172-176）、サーバも同messageをaddError（Controller.php:490-491） | クライアントとサーバの二重防御。alertはdialogハンドラ要、サーバ側はCSRFトークン直接POST要。文言は messages.ja.yaml:5139 で静的確認済 | 010,011 | 要確認(二重防御) |
| 3 | バリデーションエラー文言（対象なし/存在しない/入庫先未設定/権限/対象外ステータス/複数店舗） | Service.php:121,144,149,156,164,169 にハードコード（trans未経由） | 文言は設計書「出力前バリデーション」由来でオラクル化。実装もハードコードで静的一致。`{id}` 埋め込み形式を実機確認 | 012-017 | 要確認(文言) |
| 4 | ファイル名は選択IDの最小値を7桁ゼロ詰め＋YmdHis | Service.php:95-96 `sprintf('%07d', min($ids))` | 静的確認済。7桁を超えるID（8桁以上）の桁あふれ挙動を実機確認 | 003 | 要確認(桁) |
| 5 | GETは許可しない（POST専用） | route methods:['POST']（Controller.php:437） | 405 期待。Symfony既定の405応答かログイン誘導かを実機確認（認証状態依存） | 021 | 要確認(応答コード) |
| 6 | 許可ステータスは「出庫承認済み4/移動中5/入庫承認待ち6/入庫承認済み7」（設計書 m04-33 md:123） | `ALLOWED_STATUS_IDS=[STATUS_MOVING(5), STATUS_INBOUND_APPROVAL_PENDING(6), STATUS_INBOUND_APPROVED(7)]`（Service.php:44-47） | **乖離候補**: 実装は「出庫承認済み(4)」を許可ステータスに含まない。設計書どおり「ID:4を選択→出力成功」を期待する **E2E-019** は現実装では「対象外のステータス」で落ちる想定（テストは仕様どおりに維持し検出する）。要確認 | 019（出庫承認済み4の正常境界。落ちれば本乖離を検出）／016（新規1/差戻し3の対象外確認＝本乖離の影響外） | 要確認(乖離) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口（エンドポイント） | 一覧の出力ボタン・POST専用ルート・管理ログイン要 | 001,021,020 | カバー（実装済） |
| CSV出力仕様（ヘッダ/文字コード/ファイル名/完了ログ） | ファイル名形式・octet-stream添付／文字コード・BOM／完了ログ | 003,004（spec fixme・要シード）／031（手動）／（ログ＝対象外） | 部分カバー（ファイル名/応答ヘッダは写像済み・spec fixme（未実行）、内容・文字コードは手動、ログは対象外） |
| 出力列（CSV_HEADER 8列・整形ルール） | ピッキング区分・棚番・言語/状態・略称・色R・数・商品名整形・基準価格 | 030／032（基準価格null・閾値未設定→ピッキング区分空欄／[略称]有→[略称]・【言/状】・色・R除去／[略称]無→[～]除去） | 手動（CSV本文目視）。※基準価格null・閾値未設定は区分1ではなく**空欄**（md:71 / RestockListCsvRowFormatter.php:110） |
| 出力対象データと並び順 | 集計・並び順（ピッキング区分→棚番→言語→状態→Foil→略称→レアリティ→色→カード） | 030（並び順）／032（分岐・境界の整形）／081,082（件数・集約＝間接） | 手動/間接（CSV本文目視）。DB検索内部は対象外。文字コード/BOM/区切りは031で別観点 |
| プロセスフロー | CSRF検証→ids整数化・空要素除去→共通検証→exportByIds→StreamedResponse | 011/012/018/041（実装済）／002,013-017（spec fixme・要シード） | 部分カバー（CSRF/必須/対象なし/空要素除去は実装済、StreamedResponse正常系・各相関は写像済み・spec fixme（未実行）） |
| 出力前バリデーション（validateReturnListExportIds） | 対象なし・存在しない・入庫先未設定・権限なし・対象外ステータス・複数店舗・許可ステータス正常境界(4)・複数まとめて | 012（実装済）／013,014,015,016,017,019,040（spec fixme・要シード） | 部分カバー（対象なしのみ実装済、他は写像済み・spec fixme（未実行）。出庫承認済み4境界019は付帯表4#6の乖離検出用） |
| 必須（ids空・未選択） | クライアントalert・サーバ検証・空要素除去 | 010,011,041 | カバー（実装済） |
| 分岐・遷移・例外 | 検証NG→現在ページ番号で一覧リダイレクト・検証OK→StreamedResponse・CSRF不正→例外・対象なし→非出力 | 011/012/018（実装済）／002,005,013-017,040（spec fixme・要シード） | 部分カバー（CSRF不正/対象なし非出力/未選択リダイレクトは実装済、StreamedResponse・ページ番号保持005・各相関は写像済み・spec fixme（未実行）） |
| 状態・データ更新（参照のみ） | 業務データ非更新（参照のみ） | （DB内部＝間接 006） | 手動/間接（DB内部値は観測外） |
| ログ（log_info 出力完了） | 完了ログ記録 | （対象外＝ブラウザ観測外） | 対象外(理由付き) |
| 権限・認可（管理ログイン・担当店舗） | 未ログイン誘導・担当外店舗拒否 | 020（実装済）／015（spec fixme・要シード） | 部分カバー（未ログイン誘導は実装済、担当外店舗拒否は写像済み・spec fixme（未実行）） |
| 文字コード/区切り（CsvExportService設定） | UTF-8時BOM・区切り | 031 | 手動（CSV本文） |

未カバーはいずれも理由（完了ログ＝ブラウザ観測外／CSV本文・並び順・文字コード＝ファイル目視で手動／参照のみDB内部値＝間接／DB検索内部＝観測外）を明記済み。出力前バリデーションの各失敗分岐＋正常境界（出庫承認済み4・複数まとめて・空要素除去）は行単位に分解し全て自動化対象とした。**「カバー（実装済）」は spec で実行される8件（001/010/011/012/018/020/021/041）に限り、シード依存の自動化対象は「写像済み・spec fixme（未実行）」として区別**する（過大主張防止）。基準価格null・閾値未設定はピッキング区分=1ではなく空欄（md:71）であり、032の期待値もこれに是正済み。
