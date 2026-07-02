# m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート） E2Eテストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m04-25_admin_stock_stock_move_instruction_export.html`（正本 `functions/ec-cube-enterprise/m04-25_admin_stock_stock_move_instruction_export.md`）

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/m04_25_admin_stock_stock_move_instruction_export_it_cases.md`（母集合 計90観点行）

期待結果は画面表示・遷移・URL・ダウンロード発火・HTTP応答ヘッダ・ファイル名・アラート(dialog)の有無などブラウザで観測できる結果で判定する。**期待結果は仕様（設計書・観点表・基本設計）由来**とし、実装/POM由来の表示文言・Form制約をオラクル化しない（未選択アラートの**具体文言**は設計書に定義がなく実装(messages.ja.yaml)由来のためオラクル化しない＝「アラートが表示される／ダウンロードが発火しない」のみで判定）。本機能は画面タイプ`csv_export`（在庫移動指示一覧 M04-24 から起動する2系統のCSV出力＝送り状CSV(POST/CSRF/ids[])と実績入力用CSV雛形(GET)）であり、CSVの中身（送り状23列マッピング・雛形4列見出し・文字コード・改行コード・区切り文字・固定値・関連店舗JOIN・対象0件時の見出しのみ）は**手動**確認、自動化はダウンロード発火・ファイル名・HTTP応答・UI部品・未認証ガード（雛形GET/送り状POST両系統）・未選択アラート(有無)・確認ダイアログ非表示に限る。TSV は既存IT casesと同一の 10 列固定。E2E固有情報は TSV 後の付帯表に `テストID` で対応づける。Playwright は本リポジトリでは実行しない（構造参考のみ）。未検証セレクタは `要実機確認`。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-25 | 2系統の出力UI部品表示・操作起点・確認ダイアログ非表示/未選択アラート・HTTPステータス・URL・送り状CSV応答（一部手動） |
| IT-13 | 雛形CSV URL直接GETでのダウンロード発火 |
| IT-15 | 未認証アクセスガード（雛形GET＝040／送り状CSV POST＝043）・送り状CSVのCSRF（正＝030 download／負＝051 欠落/改ざんで出力されない=要実機／050 ids空404=要実機）・関連店舗JOIN（手動/間接）・参照のみ（手動/間接） |
| IT-24（観点マスタ・ファイルDL） | 既存IT cases母集合には射影されていないが、ファイルダウンロード機能として観点表マスタ `integration-test-viewpoints.md` のIT-24（ファイル処理＝ファイルダウンロードを含む／データ出力）が該当。デフォルトファイル名=011/015/031、文字コード=102、項目並び順/フォーマット=100/101、区切り文字=手動、改行コードは設計書に定義なし＝要確認/手動。詳細は付帯表4 #6 |
| IT-03 | ダウンロード後の画面遷移なし（一覧滞留）・参照テーブル（間接）・外部画面なし（対象外） |
| IT-16 | 送り状CSV出力内容・ファイル名・文字コード（内容一致は手動）・区切り文字（108 手動）・氏名/カナ連結分岐（109 手動）・入力境界（入力検証なし＝対象外） |
| IT-27 | 出力失敗（ストリーム途中＝対象外）・対象0件時ヘッダのみ（手動） |
| IT-22 | 送り状CSVの選択必須（必須制御＝未選択アラート）。入力フォームを持たないため大半は対象外 |
| IT-26 | 参照のみでDB無変更（追加/更新なし＝手動/間接・一部対象外） |
| IT-23 | 雛形CSVヘッダ4列定義（100 CSV本文＝手動）・雛形CSV文字コード/BOM（107 手動）・log（対象外） |
| IT-20 | ログ出力（log_info）＝ブラウザ観測外（対象外） |

## テストケースTSV（10列固定・既存IT casesと同一形式）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-001	IT-25	操作起点	P2	一覧に「在庫移動実績入力用CSVダウンロード」リンクが表示される	管理ログイン済／SEED-M04-25-ADMIN	—	"1. 在庫移動指示一覧（/%admin%/product/stock/move-instruction）を開く"	画面に「在庫移動実績入力用CSVダウンロード」リンクが表示されること。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-002	IT-25	操作起点	P1	一覧に「送り状CSVダウンロード」ボタンが表示される	管理ログイン済／SEED-M04-25-ADMIN	—	"1. 在庫移動指示一覧を開く"	画面に「送り状CSVダウンロード」ボタンが表示されること。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-010	IT-25	UI部品	P1	雛形DLリンク押下で雛形CSVダウンロードが発火する	管理ログイン済／SEED-M04-25-ADMIN	—	"1. 一覧を開く
2. 「在庫移動実績入力用CSVダウンロード」リンクを押下する"	ダウンロード（download）が発火すること。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-011	IT-25	URL	P1	雛形ファイル名が stock_move_instruction_record_template_<日時14桁>.csv 形式である	管理ログイン済／SEED-M04-25-ADMIN	—	"1. 雛形DLリンクを押下する
2. ダウンロードファイル名を確認する"	ファイル名が「stock_move_instruction_record_template_{YmdHis}.csv」形式（数字14桁＋.csv）であること。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-012	IT-13	URL直接アクセス	P2	雛形CSV URLへ直接GETするとダウンロードが発火する	管理ログイン済／SEED-M04-25-ADMIN	GET /%admin%/product/stock/move-instruction/csv-template	"1. 雛形CSV URLへ直接GETアクセスする"	ダウンロード（download）が発火すること。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-013	IT-25	HTTPステータス	P1	雛形CSV応答がHTTP200を返す	管理ログイン済／SEED-M04-25-ADMIN	GET /%admin%/product/stock/move-instruction/csv-template	"1. 認証済みコンテキストで雛形CSV URLへGETする
2. HTTPステータスを確認する"	HTTPステータスが200であること。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-014	IT-25	URL	P1	雛形CSV応答のContent-Typeが text/csv である	管理ログイン済／SEED-M04-25-ADMIN	GET /%admin%/product/stock/move-instruction/csv-template	"1. 認証済みコンテキストで雛形CSV URLへGETする
2. 応答ヘッダContent-Typeを確認する"	Content-Type が text/csv（charset付き）であること。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-015	IT-25	URL	P1	雛形CSV応答が添付ファイルのContent-Dispositionを返す	管理ログイン済／SEED-M04-25-ADMIN	GET /%admin%/product/stock/move-instruction/csv-template	"1. 認証済みコンテキストで雛形CSV URLへGETする
2. 応答ヘッダContent-Dispositionを確認する"	Content-Disposition が「attachment; filename=stock_move_instruction_record_template_<日時14桁>.csv」であること。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-020	IT-22	必須制御	P1	送り状CSVを未選択で押下するとアラートで送信が抑止される	管理ログイン済／SEED-M04-25-ADMIN	行チェックボックス未選択	"1. 一覧を開く
2. どの行もチェックせず「送り状CSVダウンロード」を押下する"	アラート(dialog)が表示されて送信が抑止され、ダウンロードが発火しないこと（具体文言は設計書未定義のため照合しない）。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-030	IT-25	確認ダイアログ	P1	行を選択して送り状CSVを押下するとダウンロードが発火する	管理ログイン済／SEED-M04-25-INSTRUCTION	—	"1. 一覧で指示行のチェックボックスを選択する
2. 「送り状CSVダウンロード」を押下する"	ダウンロード（download）が発火すること。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-031	IT-16	実行結果	P1	送り状CSVファイル名が stock_move_instruction_labels_<日時14桁>.csv 形式である	管理ログイン済／SEED-M04-25-INSTRUCTION	—	"1. 行を選択して「送り状CSVダウンロード」を押下する
2. ダウンロードファイル名を確認する"	ファイル名が「stock_move_instruction_labels_{YmdHis}.csv」形式（数字14桁＋.csv）であること。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-040	IT-15	未認証	P1	未ログインで雛形CSV URLへアクセスすると管理ログイン画面へ誘導される	未ログイン	GET /%admin%/product/stock/move-instruction/csv-template	"1. 未ログイン状態で雛形CSV URLへ直接アクセスする"	管理ログイン画面へ誘導されること。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-043	IT-15	未認証	P1	未ログインで送り状CSV(POST /labels)へアクセスすると管理ログイン画面へ誘導される	未ログイン	POST /%admin%/product/stock/move-instruction/labels	"1. 未ログイン状態で送り状CSV labels エンドポイントへPOSTする"	管理ログイン画面へリダイレクト誘導されること（未認証はCSRF/ids検証より前にログインへ誘導）。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-041	IT-03	画面遷移	P2	雛形DL後も一覧画面に留まる	管理ログイン済／SEED-M04-25-ADMIN	—	"1. 雛形DLリンクを押下する
2. ダウンロード後の画面URLを確認する"	在庫移動指示一覧画面に留まること（別画面へ遷移しない）。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-042	IT-25	確認ダイアログ	P2	雛形DL時に確認ダイアログを介さない	管理ログイン済／SEED-M04-25-ADMIN	—	"1. 雛形DLリンクを押下する
2. 確認ダイアログの有無を確認する"	出力前の確認ダイアログが表示されないこと。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-050	IT-15	CSRF	P2	送り状CSVへids空でPOSTすると404を返す	管理ログイン済／SEED-M04-25-ADMIN	POST /%admin%/product/stock/move-instruction/labels（有効CSRFトークン・ids空）	"1. 一覧フォームから有効なCSRFトークンを採取する
2. ids無しで labels エンドポイントへPOSTする"	HTTPステータス404が返ること（**要実機確認＝自動化保留**：有効CSRFトークン採取手順が未確定のため spec は test.fixme、付帯表2集計では自動化対象外として計上）。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-051	IT-15	CSRF	P2	送り状CSVへ無効/欠落CSRFトークンでPOSTすると送り状CSVが出力されない（CSRF負＝030の異常系の対）	管理ログイン済／SEED-M04-25-INSTRUCTION	POST /%admin%/product/stock/move-instruction/labels（CSRFトークン欠落/改ざん・有効ids）	"1. 行を選択した状態の送り状CSVフォームから、CSRFトークンを欠落/改ざんさせて labels へPOSTする
2. 応答とダウンロード発火有無を確認する"	CSRFトークンが不正/欠落のとき対象処理（送り状CSV出力）が実行されず、CSV添付応答（octet-stream/attachment）が返らずダウンロードが発火しないこと（設計書「isTokenValid()でCSRF検証」由来。具体的なHTTPステータス・エラー画面文言は実装依存のためオラクル化せず、CSVが出力されない事実のみで判定）（**要実機確認＝自動化保留**：有効セッション確立＋トークン改ざんPOST手順が未確定のため spec は test.fixme、付帯表2集計では自動化対象外として計上）。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-100	IT-23	登録内容	P2	雛形CSVヘッダが規定の4列・列名・列順で出力される	管理ログイン済／SEED-M04-25-ADMIN	—	"1. 雛形CSVを出力し、出力ファイルの1行目を確認する"	ヘッダ行が 移動指示ID／出庫元店舗(名称)／入庫先店舗(名称)／送り状No. の4列・順序であること。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-101	IT-16	実行結果	P2	送り状CSVが規定の23列・出庫元=注文者/入庫先=配送先マッピングで出力される	管理ログイン済／SEED-M04-25-INSTRUCTION	出庫元/入庫先店舗・住所・電話を持つ既知の指示	"1. 行を選択して送り状CSVを出力する
2. 出力ファイルの列と値を既知データと突合する"	注文番号=移動指示ID・注文者=出庫元店舗・配送先=入庫先店舗・送料/手数料=0固定・郵便種別=0・発送方法=ゆうパック等、23列が規定どおり出力されること。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-102	IT-16	実行結果	P2	送り状CSVが規定の文字コードで出力される	管理ログイン済／SEED-M04-25-INSTRUCTION	—	"1. 送り状CSVを出力し、文字コードを確認する"	eccube_csv_export_encoding（既定SJIS-win、UTF-8時はBOM付与）で出力されること。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-103	IT-15	対象データ	P2	送り状CSVが選択IDと関連店舗(出庫元/入庫先・Pref)のJOIN結果を出力する	管理ログイン済／SEED-M04-25-INSTRUCTION	複数の選択ID	"1. 複数行を選択して送り状CSVを出力する
2. 各行が選択ID・関連店舗・都道府県と一致するか突合する"	選択した指示IDごとに1行、関連店舗(会社名+店名)・都道府県(Pref.name)が id ASC で出力されること。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-104	IT-26	登録内容	P1	CSV出力は参照のみで業務データを更新しない	管理ログイン済／SEED-M04-25-INSTRUCTION	—	"1. CSV出力前後で dtb_stock_move_instruction と関連 BaseInfo の値を確認する"	dtb_stock_move_instruction・BaseInfo のレコードが追加・更新されないこと（参照のみ）。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-105	IT-27	実行結果	P2	対象なし（該当指示なし）のとき送り状CSVがヘッダ行のみで出力される	管理ログイン済／SEED-M04-25-ADMIN	該当しないIDのみを指定	"1. 該当指示が存在しないIDで送り状CSVを出力する
2. 出力行を確認する"	ヘッダ行のみのCSV（データ行なし）が出力され、明示エラーにならないこと。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-106	IT-25	URL	P2	送り状CSV応答が octet-stream / attachment を返す	管理ログイン済／SEED-M04-25-INSTRUCTION	POST /%admin%/product/stock/move-instruction/labels（有効CSRF・有効ids）	"1. 送り状CSVを出力し、応答ヘッダを確認する"	Content-Type が application/octet-stream、Content-Disposition が attachment; filename=stock_move_instruction_labels_<日時>.csv であること。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-107	IT-23	登録内容	P2	雛形CSVが規定の文字コード（既定SJIS-win／UTF-8時のみBOM付与）で出力される	管理ログイン済／SEED-M04-25-ADMIN	—	"1. 雛形CSVを出力し、文字コードと先頭バイトを確認する"	eccube_csv_export_encoding（既定SJIS-win＝windows-31j、各列値は mb_convert_encoding 変換）で出力され、UTF-8設定時のみ先頭にBOM（\xEF\xBB\xBF）が付与されること（観点表マスタ IT-24 文字コード／付帯表4 #6。送り状CSV文字コード102とは別系統）。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-108	IT-16	実行結果	P3	送り状CSV/雛形CSVが規定の区切り文字で出力される	管理ログイン済／SEED-M04-25-INSTRUCTION	—	"1. 送り状CSV・雛形CSVをそれぞれ出力し、列区切り文字を確認する"	eccube_csv_export_separator（既定 `,` カンマ）で各列が区切られていること（観点表マスタ IT-24 区切り文字／付帯表4 #6。改行コードは設計書未定義のため要確認＝本ケース対象外）。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-109	IT-16	実行結果	P3	送り状CSVの氏名/カナが会社名・店名の有無に応じて連結される（連結分岐）	管理ログイン済／SEED-M04-25-INSTRUCTION	会社名のみ／店名のみ／両方空の店舗を含む指示	"1. 会社名のみ・店名のみ・会社名/店名とも空の店舗を持つ指示を選択して送り状CSVを出力する
2. 注文者氏名/カナ・配送先氏名/カナ列を確認する"	両方ありは半角空白1つで連結、片方のみはその値、両方空は空文字で出力されること（joinWithHalfWidthSpace の3分岐＝設計書「会社名と店名をtrimし両方あれば半角空白1つで連結」由来。観点表マスタ IT-24 出力内容/連結）。
m04-25_admin_stock_stock_move_instruction_export（在庫移動指示リストエクスポート）	E2E-M04-25-110	IT-20	出力抑止	P3	送り状CSV出力完了が log_info に記録される	管理ログイン済／SEED-M04-25-INSTRUCTION	—	"1. 送り状CSVを出力する
2. アプリケーションログを確認する"	log_info に「在庫移動指示 送り状CSV出力完了. ファイル名: …」が記録されること。
```

## 付帯表1：E2E自動化区分・セレクタ・仕様根拠・元ITケースID（TSV外）

行番号は ec-cube-enterprise 現行ソース基準。Twig: `src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig`。Controller: `src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php`。Service: `src/Eccube/Service/Csv/Exporter/StockMoveInstructionLabelCsvExporterService.php`。

| テストID | E2E可否 | 対象セレクタ（根拠 file:line / 要実機確認） | 仕様根拠 |
|----------|---------|----------------------------------------------|----------|
| E2E-M04-25-001 | E2E自動化 | a[href$="/product/stock/move-instruction/csv-template"]（index.twig:160 / trans admin.stock.move_instruction.csv_download_record=「在庫移動実績入力用CSVダウンロード」 messages.ja.yaml:4967） | 利用者視点の入口（雛形DLリンク） |
| E2E-M04-25-002 | E2E自動化 | #stockMoveInstructionLabelsExport（index.twig:161 / trans csv_download_invoice=「送り状CSVダウンロード」 messages.ja.yaml:4968） | 利用者視点の入口（送り状CSVボタン） |
| E2E-M04-25-010 | E2E自動化 | 雛形リンク押下→download イベント（StreamedResponse Controller.php:343） | プロセスフロー（雛形ストリーム出力） |
| E2E-M04-25-011 | E2E自動化 | download.suggestedFilename（Controller.php:340 `stock_move_instruction_record_template_'.format('YmdHis').'.csv'`） | 雛形CSV（ファイル名） |
| E2E-M04-25-012 | E2E自動化 | templatePath=/%admin%/product/stock/move-instruction/csv-template（Controller.php:334 route admin_stock_move_instruction_csv_download_record, methods GET） | 利用者視点の入口（URLエンドポイント・GET） |
| E2E-M04-25-013 | E2E自動化 | page.request.get(templatePath).status（Controller.php:343 StreamedResponse） | 雛形CSV（HTTP応答） |
| E2E-M04-25-014 | E2E自動化 | 応答ヘッダ content-type（Controller.php:358-359 `text/csv; charset=...`） | 雛形CSV（Content-Type） |
| E2E-M04-25-015 | E2E自動化 | 応答ヘッダ content-disposition（Controller.php:360 `attachment; filename=`） | 雛形CSV（Content-Disposition） |
| E2E-M04-25-020 | E2E自動化 | #stockMoveInstructionLabelsExport 押下＋page.on('dialog')でアラート有無を判定（index.twig:411-415 ids.length===0でalert＋return false）。**アラート具体文言は照合しない**（設計書未定義＝実装由来オラクルのため） | フロント挙動（未選択時の送信抑止＝必須制御） |
| E2E-M04-25-030 | E2E自動化（要シード行） | input.row-check[name="ids[]"]（index.twig:203）→ #stockMoveInstructionLabelsExport（index.twig:161）→ download | プロセスフロー（送り状CSVストリーム出力） |
| E2E-M04-25-031 | E2E自動化（要シード行） | download.suggestedFilename（Service.php:87 `stock_move_instruction_labels_'.format('YmdHis').'.csv'`） | 送り状CSV（ファイル名） |
| E2E-M04-25-040 | E2E自動化（資格情報不要） | 管理ログイン画面 #login_id（admin/login.twig:26） | 権限・認可（管理ログインを要する＝雛形GET） |
| E2E-M04-25-043 | E2E自動化（資格情報不要） | POST labelsPath を maxRedirects:0 でPOSTしリダイレクト先 location が /login（Controller.php:317 route admin_stock_move_instruction_labels_export, methods POST／設計書「いずれも管理画面ログインを要する」） | 権限・認可（送り状CSV POSTも管理ログインを要する＝040の異常系の対） |
| E2E-M04-25-041 | E2E自動化 | 一覧URL（admin_stock_move_instruction_list Controller.php:66） | 画面遷移（同一タブGETダウンロード＝一覧滞留） |
| E2E-M04-25-042 | E2E自動化 | page.on('dialog')（雛形リンクに確認ダイアログ要素なし index.twig:160） | フロント挙動（出力前確認ダイアログを持たない） |
| E2E-M04-25-050 | 要実機確認（CSRFトークン採取手順） | form#form_stock_move_instruction_label_csv の CSRF token（index.twig:343-344）→ POST labels（Controller.php:317,323-326 ids空→404） | 分岐・例外（ids空配列/未指定→404） |
| E2E-M04-25-051 | 要実機確認（有効セッション＋CSRFトークン改ざんPOST手順） | POST labels に欠落/改ざんCSRFトークンを付与（Controller.php:321 isTokenValid()がids空チェック:323-326より先＝CSRF不正は処理到達前に拒否）。判定はCSV添付応答非発火のみ（HTTPステータス/エラー画面は実装依存のため照合しない） | 判定順序・権限/CSRF（CSRF欠落/改ざん→対象処理を実行しない＝030正常系の異常系の対） |
| E2E-M04-25-100 | 手動（CSV本文＝雛形4列見出しを開いて検査） | CSV 1行目（Controller.php:339 columns 4列） | 雛形CSV（出力列ヘッダ） |
| E2E-M04-25-101 | 手動（CSV本文＝23列マッピング検査・要シード） | CSV データ行（Service buildRow 23列） | 送り状CSV（出力列・マッピング） |
| E2E-M04-25-102 | 手動（CSV文字コード検査） | CSV エンコーディング（CsvExportService / eccube_csv_export_encoding） | 送り状CSV（文字コード） |
| E2E-M04-25-103 | 手動/間接（CSV内容で関連JOINを確認・要シード） | CSV データ行（findByIdsForLabelExport JOIN・id ASC） | 送り状CSV（対象データの抽出） |
| E2E-M04-25-104 | 手動/間接（DB値の前後比較＝ブラウザ観測外） | dtb_stock_move_instruction / BaseInfo / mtb_pref | 状態・データ更新（参照のみ） |
| E2E-M04-25-105 | 手動（CSV本文＝0件時の見出しのみ） | CSV 出力行（ヘッダのみ Service） | 分岐・例外（対象なし＝ヘッダのみ） |
| E2E-M04-25-106 | 手動（POST応答ヘッダ＝CSRFトークン採取が必要・要シード） | 応答ヘッダ content-type/content-disposition（Service.php:88-89） | 送り状CSV（Content-Type/Disposition） |
| E2E-M04-25-107 | 手動（雛形CSV文字コード/BOM＝CSV本文バイト検査） | 雛形CSVバイト列（Controller.php:342-354 mb_convert_encoding／UTF-8時のみ BOM `\xEF\xBB\xBF`／eccube_csv_export_encoding） | 実績入力用CSV雛形（文字コード・BOM分岐／観点表マスタ IT-24） |
| E2E-M04-25-108 | 手動（区切り文字＝CSV本文検査） | CSV列区切り（eccube_csv_export_separator 既定 `,`／Controller.php・Service） | 送り状CSV/雛形CSV（区切り文字／観点表マスタ IT-24。改行コードは設計書未定義＝要確認） |
| E2E-M04-25-109 | 手動（氏名/カナ連結の3分岐＝CSV本文・要シード） | CSV データ行（joinWithHalfWidthSpace：両方あり→半角空白連結／片方のみ→その値／両方空→空文字） | 送り状CSV（出力値の連結分岐／観点表マスタ IT-24 出力内容） |
| E2E-M04-25-110 | 対象外（log_info＝ブラウザ観測外） | log_info（Service.php:91） | ログ |

注: 既存IT casesは観点名のみの定型自動生成スタブ（操作手順・期待結果が汎用文。前提条件・操作手順に設計書の語句やメタ情報＝「2026-06-12」「実装確認」が機械的に流し込まれている）であり、機能固有シナリオを持たない。本E2Eは設計書本文（利用者視点の入口・送り状CSV/雛形CSVの出力列・プロセスフロー・分岐例外・状態更新）を一次情報源として網羅した。行単位対応は付帯表2bが正本。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合は既存 `m04_25_admin_stock_stock_move_instruction_export_it_cases.md` の関連ID件数（IT-22=35／IT-26=17／IT-16=11／IT-25=9／IT-03=7／IT-15=4／IT-27=2／IT-20=2／IT-23=2／IT-13=1＝計90）。内訳は **付帯表2b（行単位明細・全90行）** が正本で、本表はその集計値。

観点表母集合との関係: 上位の観点マスタ `integration_test/integration-test-viewpoints.md` は全機能共通の汎用観点集合であり、機能ごとに該当IT-IDを射影して結合試験ケースへ展開する。本機能（画面タイプ`csv_export`）に射影された結果が上記10種のIT-ID（計90行）であり、これが本機能の母集合となる。本機能は入力フォームを持たず（送り状CSVは一覧チェックボックス選択＋CSRF、雛形はGET）、DB更新も行わない（参照のみ）ため、IT-22（バリデーション）・IT-26/IT-23（DB登録・更新内容）は大半が「機能非該当による射影対象外＝対象外」となる。これは未分類ではなく理由付きの対象外である。

| IT-ID | 母集合 | E2E自動化 | 手動/間接 | 対象外 | 対象外/手動の主な理由 |
|-------|:-----:|:--------:|:--------:|:------:|------------------|
| IT-22 | 35 | 2 | 0 | 33 | 選択必須（未選択アラート）のみ自動化。本機能は入力フォーム/入力バリデーションを持たないため残りは対象外 |
| IT-26 | 17 | 0 | 12 | 5 | 参照のみ＝レコード追加/更新なしのDB値前後比較は手動/間接。出力サービス/ログ/メタは対象外 |
| IT-16 | 11 | 0 | 5 | 6 | 出力内容一致・文字コード・参照データは手動/間接。入力境界(最大長±1/最小長±1)・メタは対象外。送り状CSVファイル名(031)・区切り文字(108)・連結分岐(109)は母集合外の補完ケースで自動/手動側に別途計上 |
| IT-25 | 9 | 8 | 0 | 1 | UI部品・操作起点・確認ダイアログ/未選択アラート・HTTP/URLは自動化（010,011,012,013,014,016,025,026の8行）。出力サービス内部(015)のみ対象外。送り状CSV応答ヘッダ細目は母集合外の補完手動ケース106へ |
| IT-03 | 7 | 1 | 1 | 5 | 画面遷移なし（一覧滞留）は自動化。参照テーブルは間接。外部画面なし・ログ・メタは対象外 |
| IT-15 | 4 | 1 | 2 | 1 | 未認証ガードは自動化。対象データJOIN・参照のみは手動/間接。CSRF負（欠落/改ざんトークン＝051）は要実機のため自動化集計外＝対象外計上（ids空404の050とは別の異常系） |
| IT-27 | 2 | 0 | 1 | 1 | 対象0件時ヘッダのみは手動。出力失敗（ストリーム途中の異常注入）は対象外 |
| IT-20 | 2 | 0 | 0 | 2 | log_info 出力抑止・識別子はブラウザ観測外 |
| IT-23 | 2 | 0 | 1 | 1 | 雛形ヘッダ4列定義はCSV本文＝手動。log は対象外 |
| IT-13 | 1 | 1 | 0 | 0 | 雛形CSV URL直接GETでのダウンロード発火を自動化 |
| 合計 | 90 | 13 | 22 | 55 | **未分類 0** |

注: E2E自動化13は固有テストID 15本（040,043,001,002,010,011,012,013,014,015,020,030,031,041,042）に対応し、IT行への射影で13行（IT-15-005, IT-25×8, IT-03-018, IT-13-024, IT-22×2＝005,010,011,012,013,014,016,018,024,025,026,027,060）。未認証ガードは雛形GET(040)・送り状POST(043)の2本が同一観点 IT-15-005（未認証）を冗長被覆するため、IT行カバー数は13のまま（2本→1行）。送り状CSVファイル名(031)は母集合90行に対応する固有のIT-16自動化行を持たない補完ケースで、母集合IT-16の自動化は0、観点表マスタ IT-24（ダウンロード属性）相当として位置づける。送り状CSV ids空→404（E2E-M04-25-050）と CSRF欠落/改ざん（E2E-M04-25-051）は いずれも有効CSRFトークン採取/改ざんPOST手順の実機確認を要するため `要実機確認`（spec は test.fixme）で、IT行集計では IT-15-004 CSRF を対象外側に計上した（自動化が確定していないため）。母集合90行外の補完E2Eケース（106 応答ヘッダ手動／107 雛形文字コード手動／108 区切り文字手動／109 連結分岐手動／031 送り状ファイル名自動／051 CSRF負・要実機）は観点表マスタ IT-24（ファイルダウンロード）相当を被覆するもので、母集合90行の集計（未分類0）には算入しない。「手動/間接」22件は CSV本文検査（送り状23列・雛形4列・文字コード・関連JOIN・0件時）＋参照系DB値前後比較が中心で、download artifact 保存で技術的に自動検証可能だが (a) 既知レコードのシード未整備、(b) 文字コード(SJIS-win)整形のCSVパース方針未確定、のため本工程では手動とした（「ブラウザ観測不能」が理由ではない）。対象外55件は「入力フォームなし（IT-22大半）」「DB登録/更新なし＝参照のみ（IT-26）」「ブラウザ観測外＝ログ（IT-20）」「メタ情報行」「ストリーム途中失敗の異常注入」が理由で放置ではない。

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

各行の観点を本機能でのブラウザ観測可否で分類し、対応E2EケースIDまたは理由を付す。スタブは観点が汎用のため同一観点が連番で重複する。区分は行ごとに確定し、付帯表2の集計と一致する。

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-16 | 実行結果 | 手動 | 101（送り状CSV出力内容一致＝本文検査） |
| 002 | IT-27 | 実行結果 | 手動 | 101（出力内容一致） |
| 003 | IT-27 | 出力失敗 | 対象外 | ストリーム途中の出力失敗は異常注入が必要でブラウザ観測困難 |
| 004 | IT-15 | CSRF | 対象外 | CSRF負（欠落/改ざんトークン拒否＝対象処理を実行しない）は E2E-M04-25-051 で異常系ケースを定義（HTTPレベルで試験可能だが有効セッション＋トークン改ざんPOST手順が未確定で要実機・自動化未確定のため対象外計上＝050の要実機と同扱い）。正のCSRFは030で間接的に通過。050はids空→404（CSRF負ではない別分岐）|
| 005 | IT-15 | 未認証 | E2E自動化 | 040（雛形GET未ログイン→管理ログイン誘導）／043（送り状POST未ログイン→管理ログイン誘導） |
| 006 | IT-15 | 対象データ | 手動/間接 | 103（関連店舗JOIN＝CSV内容で間接確認） |
| 007 | IT-20 | 出力抑止 | 対象外 | log_info はブラウザ観測外 |
| 008 | IT-20 | 識別子 | 対象外 | ログ識別子はブラウザ観測外 |
| 009 | IT-15 | 状態変化 | 手動/間接 | 104（参照のみ＝DB無変更の前後比較） |
| 010 | IT-25 | UI部品 | E2E自動化 | 010（雛形ストリーム出力＝ダウンロード発火） |
| 011 | IT-25 | UI部品 | E2E自動化 | 001/002（出力UI部品表示） |
| 012 | IT-25 | 操作起点 | E2E自動化 | 002（送り状CSVボタン＝操作起点） |
| 013 | IT-25 | 確認ダイアログ | E2E自動化 | 020（送り状CSV未選択アラート） |
| 014 | IT-25 | 確認ダイアログ | E2E自動化 | 042（雛形DL確認ダイアログ非表示） |
| 015 | IT-25 | 確認ダイアログ | 対象外 | 出力サービス内部（CsvExportService）＝ブラウザ観測外。これ以上のダイアログ細目なし |
| 016 | IT-25 | 送信可否制御 | E2E自動化 | 020（未選択時はボタンがalertで送信抑止＝送信可否制御） |
| 017 | IT-03 | 外部画面 | 対象外 | 別タブ/外部画面遷移なし（同一タブGETダウンロード） |
| 018 | IT-03 | 画面遷移 | E2E自動化 | 041（ダウンロード後も一覧に留まる） |
| 019 | IT-03 | 画面遷移 | 手動/間接 | 104（参照のみ） |
| 020 | IT-03 | 画面遷移 | 対象外 | ログ＝ブラウザ観測外 |
| 021 | IT-03 | 画面遷移 | 対象外 | 実装確認＝メタ情報でテスト対象でない |
| 022 | IT-03 | 画面遷移 | 対象外 | 2026-06-12＝メタ情報でテスト対象でない |
| 023 | IT-03 | 画面遷移 | 対象外 | 送り状CSVストリーム出力＝011/030で代表済（画面遷移観点としては該当処理なし） |
| 024 | IT-13 | URL直接アクセス | E2E自動化 | 012（雛形CSV URL直接GETでダウンロード発火） |
| 025 | IT-25 | HTTPステータス | E2E自動化 | 013（雛形CSV HTTP200） |
| 026 | IT-25 | URL | E2E自動化 | 014/015（雛形CSV URLエンドポイントの応答ヘッダ） |
| 027 | IT-22 | 必須バリデーション | E2E自動化 | 020（送り状CSVは選択必須＝未選択でアラート抑止） |
| 028 | IT-22 | 必須バリデーション | 対象外 | 本機能に入力必須項目なし（選択必須は027で代表） |
| 029-059 | IT-22 | 文字列長/数値/文字種/相関/その他/DB相関/部分入力 | 対象外 | 本機能は入力フォーム/入力バリデーションを持たない（送り状=選択＋CSRF、雛形=GET） |
| 060 | IT-22 | 必須制御 | E2E自動化 | 020（選択必須の制御＝未選択アラート） |
| 061 | IT-22 | 部分入力 | 対象外 | 入力フォームなし＝部分入力の概念が該当しない |
| 062 | IT-26 | 登録内容（追加される） | 手動/間接 | 104（参照のみ＝レコードは追加されない。スタブ期待「追加される」は仕様参照のみと矛盾＝不具合候補#3） |
| 063 | IT-26 | 登録内容（追加されない） | 手動/間接 | 104（参照のみ＝追加されないをDB前後比較） |
| 064 | IT-26 | 登録内容（追加される） | 手動/間接 | 104（同上・参照のみ） |
| 065 | IT-26 | 登録内容（出力サービス） | 対象外 | CsvExportService内部＝ブラウザ観測外 |
| 066 | IT-26 | 登録内容（ログ） | 対象外 | log_info＝ブラウザ観測外 |
| 067 | IT-23 | 登録内容（出力列4列） | 手動 | 100（雛形ヘッダ4列＝CSV本文検査） |
| 068 | IT-26 | 登録内容 | 手動/間接 | 104（参照のみ） |
| 069 | IT-26 | 登録内容（主データ参照のみ） | 手動/間接 | 104（参照のみ） |
| 070 | IT-26 | 登録内容（ログ） | 対象外 | log_info＝ブラウザ観測外 |
| 071 | IT-26 | 登録内容（実装確認） | 対象外 | メタ情報行 |
| 072 | IT-26 | 登録内容（2026-06-12） | 対象外 | メタ情報行 |
| 073 | IT-26 | 登録内容（追加される） | 手動/間接 | 104（参照のみ） |
| 074 | IT-26 | 登録内容（最大長） | 手動/間接 | 104（参照のみ。入力境界は本機能非該当のため参照のみへ集約） |
| 075 | IT-26 | 登録内容（最大長+1/追加されない） | 手動/間接 | 104（参照のみ） |
| 076 | IT-26 | 登録内容（最小長） | 手動/間接 | 104（参照のみ） |
| 077 | IT-26 | 登録内容（最小長-1/追加されない） | 手動/間接 | 104（参照のみ） |
| 078 | IT-26 | 登録内容（追加される） | 手動/間接 | 104（参照のみ） |
| 079 | IT-26 | 実行結果（追加される） | 手動/間接 | 104（参照のみ） |
| 080 | IT-23 | 実行結果（ログ） | 対象外 | log_info＝ブラウザ観測外 |
| 081 | IT-16 | 実行結果（実装確認） | 対象外 | メタ情報行 |
| 082 | IT-16 | 実行結果（2026-06-12） | 対象外 | メタ情報行 |
| 083 | IT-16 | 実行結果（送り状CSV） | 手動 | 101（出力内容一致） |
| 084 | IT-16 | 実行結果（最大長） | 対象外 | 本機能に入力検証対象がない |
| 085 | IT-16 | 実行結果（最大長+1） | 対象外 | 同上（入力検証なし） |
| 086 | IT-16 | 実行結果（最小長） | 対象外 | 同上（入力検証なし） |
| 087 | IT-16 | 実行結果（最小長-1） | 対象外 | 同上（入力検証なし） |
| 088 | IT-16 | 実行結果（文字コード） | 手動 | 102（文字コード＝CSV本文検査） |
| 089 | IT-16 | 実行結果（主データ） | 手動/間接 | 103/104（参照データ／参照のみ） |
| 090 | IT-16 | 実行結果（ログ前提・出力内容一致） | 手動 | 101（出力内容一致） |

集計（付帯表2と一致）: E2E自動化 13（005,010,011,012,013,014,016,018,024,025,026,027,060）／ 手動・間接 22（手動: 001,002,067,083,088,090＝6／手動/間接: 006,009,019,062,063,064,068,069,073,074,075,076,077,078,079,089＝16）／ 対象外 55（003,004,007,008,015,017,020,021,022,023,028,029-059の31行,061,065,066,070,071,072,080,081,082,084,085,086,087）。**未分類 0**。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-M04-25-ADMIN | dtb_member（管理者） | 在庫管理メニューにアクセス可能な有効管理者1。ログインID/パスワードは config 既定 | fixture(config既定) | 既存利用・撤去不要 | 001,002,010,011,012,013,014,015,020,040,041,042,050,100,105,107 |
| SEED-M04-25-INSTRUCTION | dtb_stock_move_instruction / BaseInfo（出庫元・入庫先） / mtb_pref | 一覧に出る在庫移動指示複数。出庫元/入庫先店舗（会社名・店名・カナ・郵便番号・住所・電話・都道府県）と standard_total_price を持ち、findByIdsForLabelExport の JOIN が成立する。送り状No.の有無を含む。連結分岐検証(109)用に「会社名のみ／店名のみ／会社名・店名とも空」の店舗バリエーションを含む | fixture/migration | 専用識別接頭辞・撤去。参照のみで値は破壊されない | 030,031,051,101,102,103,104,106,108,109,110 |

注: 本機能は参照のみで業務データを更新しない。送り状CSV内容（101/102/103）・参照のみ確認（104）・対象0件時ヘッダのみ（105）・log_info（110）はシード値とCSV/ログを突合する手動/間接工程。送り状CSVのidsは一覧の行チェックボックス（input.row-check name=ids[]）由来のため、一覧に1件以上の指示行（SEED-M04-25-INSTRUCTION）が必要。共通ログインは `config/default.config.ts`（ECCUBE_ADMIN_USER/PASS）を流用する。`migration` を選ぶ場合はDB=ec-cube-enterprise正典（reverse-design 1c）。

## 付帯表4：不具合候補（仕様乖離）／要確認

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | Excel基本設計の機能No M04-25 は「在庫移動指示**詳細**画面」（送状No.登録/備考/削除）を定義（it_cases原典・正本md内Excel抽出） | 正本md／実装は M04-25 を「在庫移動指示リスト**エクスポート**」（送り状CSV＋実績入力用CSV雛形）として実装（StockMoveInstructionController::exportLabelCsv/csvTemplateDownload） | Excel M04-25（詳細画面）と正本md/実装（エクスポート）で機能定義がずれる。詳細画面の項目（送状No.全角半角65535byte・備考・削除）はM04-24（在庫移動指示詳細）側の責務。本E2Eはエクスポート機能（送り状CSV＋雛形）を仕様正典として網羅し、詳細画面の入力検証は本機能対象外とした | 全件（スコープ） | 要確認（基本設計と実装のスコープ乖離） |
| 2 | 送り状CSV: ids空配列/未指定→404、isTokenValidでCSRF検証 | Controller.php:320-326（set_time_limit→isTokenValid→ids空チェックの順） | CSRF検証(321)がids空チェック(323-326)より先に走るため、無効CSRFのPOSTは404でなくトークン例外になる。ids空→404は有効CSRFトークン付きPOSTでのみ到達。判定順序は仕様（ids空→404）と矛盾しないが順序に依存 | 050 | 要確認（判定順序） |
| 3 | 状態・データ更新は参照のみ（業務データを更新しない） | Controller.php:318-329 / Service（参照のみ） | 既存IT casesスタブの IT-26 行は「対象レコードが追加されること」を期待値にしているが、本機能は参照のみ＝追加しない。スタブの期待値は機能と矛盾するため採用せず、仕様（参照のみ＝無変更）を期待値とした（104） | 062,064,073,078,079,104 | 要確認（スタブ期待値が仕様と矛盾） |
| 4 | 雛形CSV Content-Type は text/csv; charset=（SJIS-win時 windows-31j）／送り状CSVは application/octet-stream | 雛形 Controller.php:358-359 / 送り状 Service.php:88 | 2系統で Content-Type/文字コードが異なる。雛形の charset は eccube_csv_export_encoding 依存（既定SJIS-win→windows-31j）で環境設定により変動。テストは text/csv 包含で照合し、charset厳密値は手動 | 014,102 | 要確認（環境設定依存） |
| 5 | 送り状CSVはJSの alert で未選択時の送信を抑止（必須制御はクライアント側） | index.twig:411-415（ids.length===0でalert＋return false） | 必須制御はサーバ側でなくクライアントJSのalertで実現。JS無効環境ではidsなしPOST→404になる（050）。alert文言は trans csv_invoice_select_rows 由来で**期待値には用いない**（設計書未定義＝実装由来オラクルのため。判定はアラート有無のみ＝020） | 020,050 | 要確認（クライアント側制御） |
| 6 | 観点表マスタ `integration-test-viewpoints.md` の IT-24（ファイル処理＝ファイルダウンロードを含む／データ出力：デフォルトファイル名・文字コード・改行コード・区切り文字・項目並び順）はCSVダウンロード機能に該当 | 既存IT cases `m04_25_..._it_cases.md`（90行）は本機能へ IT-24 を射影していない（I/FID列に IT-24 行なし） | 本E2Eの母集合は既存IT cases 90行（自動生成の射影結果）であり IT-24 を含まないが、ダウンロード機能としてIT-24観点は実質的に該当する。本E2Eは設計書「出力ファイル・レスポンス」節を一次情報源に IT-24 相当を被覆済（デフォルトファイル名=011/015/031、文字コード=102、項目並び順/フォーマット=100/101、区切り文字=手動）。**改行コードは設計書に定義がなく要確認/手動**。既存IT cases側でIT-24未射影が原典の網羅漏れか意図的かは要確認 | 011,015,031,100,101,102 | 要確認（既存IT cases原典のIT-24未射影＝網羅監査上の指摘） |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口（エンドポイント） | 送り状CSV(POST/labels)・雛形(GET/csv-template)・管理ログイン要 | 雛形GET=001,012／送り状POST正常=030／送り状POST未認証=043／雛形GET未認証=040／UI部品=002 | カバー（POST/labels の正常実行は030・未認証は043、雛形GETは012/040） |
| 送り状CSV（出力列23列・マッピング） | 注文者=出庫元/配送先=入庫先・固定値・氏名カナ連結（両方あり/片方のみ/両方空の3分岐） | 101,109 | 手動（CSV本文検査。連結3分岐は109） |
| 送り状CSV（対象データ抽出） | 選択ID×関連店舗JOIN・id ASC・1指示1行 | 103 | 手動/間接（要シード） |
| 送り状CSV（ファイル名・Content-Type） | stock_move_instruction_labels_<日時>.csv・octet-stream・attachment | 031,106 | 031カバー／応答ヘッダは手動 |
| 実績入力用CSV雛形（出力列4列・文字コード・ファイル名） | 4列ヘッダ・SJIS-win/BOM・stock_move_instruction_record_template_<日時>.csv | 011,014,015,100,107 | ファイル名/Content-Type/Dispositionカバー／4列ヘッダは手動(100)・雛形文字コード/BOMは手動(107。102は送り状CSV用で雛形には不適用) |
| プロセスフロー | チェック選択→POST／雛形リンク→GET／ストリーム出力 | 010,020,030 | カバー（発火・未選択抑止） |
| 分岐・例外（送り状CSVでID無し） | ids空配列/未指定→404 | 050 | 要実機確認（CSRFトークン採取） |
| 分岐・例外（対象なし） | 該当指示なし→ヘッダのみCSV | 105 | 手動（CSV本文検査） |
| 状態・データ更新（参照のみ） | dtb_stock_move_instruction/BaseInfo を更新しない | 104 | 手動/間接（DB値前後比較） |
| ログ | 出力完了時 log_info | 110 | 対象外（ブラウザ観測外） |
| 確認ダイアログ/画面遷移 | 雛形DL確認なし・未選択アラート・DL後一覧滞留 | 020,041,042 | カバー |
| 権限・認可 | 未認証はCSV出力不可＝管理ログイン誘導（雛形GET・送り状POST両系統） | 040,043 | カバー |
| ファイルダウンロード観点（観点表マスタ IT-24） | デフォルトファイル名・文字コード・区切り文字・項目並び順・改行コード | 011,015,031,100,101,102,107,108,109 | ファイル名カバー／送り状文字コード=102・雛形文字コード/BOM=107・列順=100/101・区切り文字=108・連結分岐=109は手動／改行コードは設計書未定義＝要確認（付帯表4 #6） |
| CSRF | 送り状CSV POSTはCSRF検証あり（雛形GETはなし） | 030(正),051(負=CSRF欠落/改ざん=要実機),050(ids空404=要実機・CSRF負ではない別分岐) | 部分カバー/保留（正＝030でdownload通過／負＝051は要実機=test.fixmeのみ・実体未実装） |
| 入力バリデーション・境界 | 本機能に入力フォームなし（送り状=選択＋CSRF、雛形=GET）。選択必須のみ | 020 | カバー（選択必須）／文字長等は対象外 |
| 在庫移動指示詳細（Excel M04-25詳細画面の項目） | 送状No.登録/備考/削除・入力検証 | （M04-24へ委譲・不具合候補#1） | 対象外（スコープ外・別機能） |

未カバーはいずれも理由（CSV本文＝手動／参照のみDB値＝間接／ログ＝ブラウザ観測外／CSRF負＝要実機=test.fixmeのみ実体未実装／入力フォームなし／Excel詳細はM04-24委譲／改行コード＝設計書未定義で要確認）を明記済み。正常系（010/030 ダウンロード発火）と異常系（020 未選択抑止・040 雛形GET未認証ガード・043 送り状POST未認証ガード・051 送り状POST CSRF欠落/改ざんで出力されない=要実機・050 ids空404=要実機・105 対象0件）の対を備える（送り状CSVのCSRF判定順序は 正常030／異常051(CSRF負)／異常050(ids空) の3分岐を網羅。ただし051/050は要実機=test.fixmeで自動化保留）。
