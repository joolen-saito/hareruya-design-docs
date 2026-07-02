# M04-34（戻しリストPDF） E2Eテストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m04-34_admin_stock_stock_move_return_list_pdf_export.html`（正本 `functions/ec-cube-enterprise/m04-34_admin_stock_stock_move_return_list_pdf_export.md`）

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/m04_34_admin_stock_stock_move_return_list_pdf_export_it_cases.md`（母集合 計90観点行）

期待結果は画面表示・遷移・HTTP応答(JSON)・URL等のブラウザで観測できる結果で判定する。**期待結果は仕様（設計書・観点表・基本設計）由来**とし、実装/POM由来の表示文言・Form制約をオラクル化しない。TSV は既存IT casesと同一の 10 列固定。E2E固有情報は TSV 後の付帯表に `テストID` で対応づける。Playwright は本リポジトリでは実行しない（構造参考のみ）。未検証セレクタは `要実機確認`。

本機能は「在庫移動・振替一覧で選択した在庫移動・振替情報から戻しリストHTMLを生成し、別ウィンドウ（ポップアップ）で表示してブラウザ印刷する」機能。サーバは `POST .../return_list_pdf_export` を受け、CSRF検証・対象バリデーション後に **JSONで `{success:true, html}` または `{success:false, redirectUrl}`** を返す（ファイルダウンロードではない）。画面タイプは `pdf_export/print`：**ダウンロード発火に相当する JSON応答・エンドポイント・入口ボタンを自動化対象とし、帳票の中身（閾値グループ・並び順・30行ページ分割・列整形・小計）と印刷ダイアログ起動・ポップアップ表示は手動**とする。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-25 | 一覧のPDF出力ボタン表示・操作起点・送信可否制御（未選択alert）・HTTPステータス・エンドポイントURL |
| IT-27 | 出力可否（検証OKで `{success:true, html}`・検証NGで `{success:false, redirectUrl}`） |
| IT-15 | CSRF検証・未認証ガード・対象データ受領・状態変化（参照のみ＝DB副作用なし／間接） |
| IT-13 | エンドポイントへのURL直接アクセス（未ログイン誘導） |
| IT-03 | 別ウィンドウ（ポップアップ）表示・画面遷移（redirectUrl 遷移） |
| IT-22 | 必須（未選択＝no_selection）・業務相関（不存在/対象外ステータス/権限/入庫先未設定/複数店舗）。文字列長/数値/文字種等の入力欄バリデーションは本機能に非該当 |
| IT-18 | 帳票フォーマット定義（タイトル・列・閾値ラベル・整形）＝帳票内容（手動） |
| IT-16 | 出力内容と対象データの一致＝帳票内容（手動） |
| IT-23 | 取得結果（対象IDの実在庫が含まれる/対象外が含まれない）＝帳票内容/DB（手動・間接） |
| IT-20 | ログ出力抑止・識別子＝ブラウザ観測外（対象外） |

## テストケースTSV（10列固定・既存IT casesと同一形式）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-001	IT-25	操作起点	P1	在庫移動・振替一覧に「戻しリストPDF出力」ボタンが表示される	管理者ログイン済／SEED-M04-34-ADMIN	—	"1. 在庫移動・振替一覧（/%admin%/product/stock/move_transfer）を開く"	「戻しリストPDF出力」ボタンが表示されること。
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-002	IT-25	送信可否制御	P1	チェック未選択でPDF出力ボタンを押すと選択を促すメッセージが表示され処理が中断する	管理者ログイン済／SEED-M04-34-ADMIN	ids＝未選択	"1. 一覧を開く
2. 行を1つも選択せず「戻しリストPDF出力」ボタンを押下"	「1つ以上の在庫移動情報を選択してください。」が表示され、ポップアップ表示・出力処理が行われないこと。
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-003	IT-27	実行結果	P1	有効なIDを送信すると戻しリストHTMLがJSON（success:true）で返る	管理者ログイン済／SEED-M04-34-EXPORTABLE	有効な在庫移動・振替情報ID（ids[]）＋CSRFトークン	"1. 一覧を開きCSRFトークンを取得
2. 出力可能な行のIDでエンドポイントへPOST"	`{success:true, html:…}` が返り、html に戻しリストHTML本文が含まれること。
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-004	IT-18	フォーマット定義	P2	返却HTMLにタイトル・印刷ボタン・明細列見出しが含まれる	管理者ログイン済／SEED-M04-34-EXPORTABLE	有効なID＋CSRFトークン	"1. 出力可能な行のIDでPOST
2. 返却 html を検査"	html にタイトル「戻しリスト」・印刷ボタン（#printButton「印刷する」）・列見出し（No／棚番号／言語/状態／略称／色/R／数／商品名／価格／備考）が含まれること。
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-010	IT-27	出力失敗	P2	選択無し（ids空）でエンドポイントへPOSTするとsuccess:false・redirectUrlが返る	管理者ログイン済／SEED-M04-34-ADMIN	ids＝空配列＋有効なCSRFトークン	"1. 一覧を開きCSRFトークンを取得
2. ids 空でエンドポイントへPOST"	HTTP200のまま `{success:false, redirectUrl:一覧ページ}` が返ること。
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-011	IT-22	DBとの相関バリデーション	P2	存在しないIDを送信すると検証NGでsuccess:false・redirectUrlが返る	管理者ログイン済／SEED-M04-34-ADMIN	存在しないID（例 999999999）＋有効なCSRFトークン	"1. 一覧を開きCSRFトークンを取得
2. 存在しないIDでエンドポイントへPOST"	`{success:false, redirectUrl:一覧ページ}` が返り、戻しリストHTMLを返さないこと。
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-014	IT-22	相関バリデーション	P2	対象外ステータスのIDを送信すると検証NGでsuccess:false・redirectUrlが返る	管理者ログイン済／SEED-M04-34-INVALID	対象外ステータスの在庫移動・振替情報ID＋有効なCSRFトークン	"1. 一覧を開きCSRFトークンを取得
2. 対象外ステータスの行のIDでエンドポイントへPOST"	`{success:false, redirectUrl:一覧ページ}` が返り、戻しリストHTMLを返さないこと（要シード）。
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-015	IT-22	相関バリデーション	P2	権限外店舗のIDを送信すると検証NGでsuccess:false・redirectUrlが返る	管理者ログイン済／SEED-M04-34-INVALID	ログイン管理者の権限外店舗の在庫移動・振替情報ID＋有効なCSRFトークン	"1. 一覧を開きCSRFトークンを取得
2. 権限外店舗の行のIDでエンドポイントへPOST"	`{success:false, redirectUrl:一覧ページ}` が返り、戻しリストHTMLを返さないこと（要シード）。
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-016	IT-22	相関バリデーション	P2	入庫先店舗未設定のIDを送信すると検証NGでsuccess:false・redirectUrlが返る	管理者ログイン済／SEED-M04-34-INVALID	入庫先店舗未設定（shopId=null）の在庫移動・振替情報ID＋有効なCSRFトークン	"1. 一覧を開きCSRFトークンを取得
2. 入庫先未設定の行のIDでエンドポイントへPOST"	`{success:false, redirectUrl:一覧ページ}` が返り、戻しリストHTMLを返さないこと（要シード）。
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-017	IT-22	相関バリデーション	P2	複数店舗混在のIDを送信すると検証NGでsuccess:false・redirectUrlが返る	管理者ログイン済／SEED-M04-34-INVALID	複数の入庫先店舗が混在する在庫移動・振替情報ID＋有効なCSRFトークン	"1. 一覧を開きCSRFトークンを取得
2. 複数店舗混在の行のIDでエンドポイントへPOST"	`{success:false, redirectUrl:一覧ページ}` が返り、戻しリストHTMLを返さないこと（要シード）。
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-012	IT-15	CSRF	P1	CSRFトークン不正で送信すると拒否され戻しリストHTMLを返さない	管理者ログイン済／SEED-M04-34-ADMIN	任意のID＋不正なCSRFトークン	"1. 一覧を開く
2. 不正なトークンでエンドポイントへPOST"	CSRF検証で拒否され、`success:true`／html を返さないこと。
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-013	IT-15	未認証	P1	未ログインでエンドポイントへPOSTすると管理ログイン画面へ誘導される	未ログイン	任意のリクエスト	"1. 未ログイン状態でエンドポイント（.../return_list_pdf_export）へPOST"	管理ログイン画面へ誘導され、戻しリストPDF出力本処理に到達しないこと。
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-020	IT-03	外部画面	P2	出力成功時にHTML本文が別ウィンドウ（ポップアップ）で表示される	管理者ログイン済／SEED-M04-34-EXPORTABLE	有効なIDを選択	"1. 一覧で出力可能な行を選択
2. 「戻しリストPDF出力」ボタンを押下"	別ウィンドウに戻しリスト帳票HTMLが表示されること（ポップアップ起動・JS依存のため手動）。
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-021	IT-25	UI部品	P2	帳票内「印刷する」ボタン押下でブラウザ印刷ダイアログが起動する	管理者ログイン済／SEED-M04-34-EXPORTABLE	—	"1. ポップアップ帳票を表示
2. 「印刷する」ボタンを押下"	PC端末の印刷ダイアログが表示されること（window.print のネイティブUIのため手動）。
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-022	IT-18	フォーマット定義	P2	閾値グループ（商品単位／サプライ）ごとの見出しとページングが表示される	管理者ログイン済／SEED-M04-34-EXPORTABLE	複数閾値・サプライを含む対象	"1. 帳票HTMLを表示し見出しを確認"	「戻しリスト（商品単位{閾値ラベル}）」「戻しリスト（サプライ）」とページング（{現在}/{総数}）が表示されること（帳票内容のため手動）。
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-023	IT-18	フォーマット定義	P2	1ページ30行でページ分割され不足行は空行補完される	管理者ログイン済／SEED-M04-34-EXPORTABLE	31行以上の対象	"1. 帳票HTMLを表示しページ分割を確認"	閾値グループごとに30行で改ページされ、末尾ページは30行まで空行補完されること（帳票内容のため手動）。
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-024	IT-18	フォーマット定義	P2	並び順が金額閾値昇順（最後にサプライ）・閾値内は棚番/言語/状態/Foil/略称/レアリティ/色順	管理者ログイン済／SEED-M04-34-EXPORTABLE	混在対象	"1. 帳票HTMLの明細並び順を確認"	仕様の並び順（金額閾値昇順→サプライ、閾値内は棚番→言語→状態→Foil→略称→レアリティ→色、設定された略称タグのソート種別に応じて末尾はコレクター番号昇順または英語カード名昇順）で出力されること（帳票内容のため手動）。
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-025	IT-16	実行結果	P2	列の整形（商品名から略称等除去・サプライ品表示・色/R非表示）が仕様どおり	管理者ログイン済／SEED-M04-34-EXPORTABLE	サプライ品・シングルカードを含む対象	"1. 帳票HTMLの各列を対象データと突き合わせ"	商品名は略称・言語・状態・色・レアリティを除去、サプライ品は「サプライ品」表示・略称/色非表示、棚番は本店のみ表示であること。あわせてNo列はページ内1始まりの連番、言語/状態はFoil時「FoilJP/NM」形式、数列は3桁区切りで数量1以外は太字、価格は基準価格、備考は空文字であること（帳票内容のため手動）。
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-026	IT-23	検索条件	P2	選択IDに紐づく実在庫が取得結果（帳票）に含まれ対象外は含まれない	管理者ログイン済／SEED-M04-34-EXPORTABLE	対象ID・対象外IDの混在	"1. 帳票HTMLの明細を取得結果と突き合わせ"	選択IDに紐づく実在庫が帳票に含まれ、対象外データは含まれないこと（DB/帳票内容のため手動・間接）。
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-027	IT-15	状態変化	P1	戻しリストPDF出力は参照のみで業務データ・履歴を更新しない	管理者ログイン済／SEED-M04-34-EXPORTABLE	有効なID	"1. 出力前後で対象テーブル・履歴を確認"	CSV取込履歴・在庫履歴・ステータス履歴を含む業務データが更新されないこと（DB確認のため対象外/間接）。
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-028	IT-22	相関バリデーション	P2	検証NG時はデータ取得（getReturnListExportRows）を行わない	管理者ログイン済／SEED-M04-34-ADMIN	検証NGとなるID	"1. 検証NGのIDでPOSTし内部処理を確認"	検証NGではデータ取得処理を呼ばないこと（内部処理のため対象外＝単体テスト領域）。
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-029	IT-03	画面遷移	P3	ポップアップブロック時・データ取得失敗時にメッセージが表示される	管理者ログイン済	ポップアップブロック有効／取得失敗状態	"1. ポップアップブロック有効で出力
2. データ取得失敗を発生させる"	「ポップアップがブロックされているため…」「戻しリストPDF用データの取得に失敗しました。」が表示されること（ブラウザ設定/JS依存のため手動）。
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-030	IT-13	メソッド境界	P2	エンドポイントへ非POST（GET）で直接アクセスすると戻しリストHTML出力本処理に到達しない	管理者ログイン済／SEED-M04-34-ADMIN	HTTP GET（メソッド不一致）	"1. ログイン状態でエンドポイント（.../return_list_pdf_export）へGETでアクセス"	入口はPOST限定のため、戻しリストHTML（success:true・html）を返さず、メソッド不一致で拒否される（本処理に到達しない）こと。
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-031	IT-18	フォーマット定義	P2	各ページ末尾にページ内個数小計「全{合計}点」が表示される	管理者ログイン済／SEED-M04-34-EXPORTABLE	複数明細を含む対象	"1. 帳票HTMLの各ページ末尾の小計を確認"	閾値グループの各ページ末尾にページ内数量合計（全{合計}点）が表示されること（帳票レイアウト識別ID14・帳票内容のため手動）。
m04-34_admin_stock_stock_move_return_list_pdf_export（戻しリストPDF）	E2E-M04-34-032	IT-03	画面遷移	P2	検証NG時はredirectUrlの一覧へ戻りエラーメッセージ（フラッシュ）が表示される	管理者ログイン済／SEED-M04-34-ADMIN	検証NGとなるリクエスト（未選択／不存在ID等）＋有効なCSRFトークン	"1. 検証NGのリクエストでPOSTしredirectUrlを取得
2. redirectUrlの一覧画面を開く"	一覧画面へ戻り、選択不可・対象データなし等の検証NGに対応するエラーメッセージ（フラッシュ）が表示されること（遷移後表示・JS依存のため手動・間接）。
```

## 付帯表1：E2E自動化区分・セレクタ・仕様根拠・元ITケースID（TSV外）

セレクタは ec-cube-enterprise 現行ソース（`nl -ba` 基準）由来の位置情報のみ。CSRFトークン名は `Constant::TOKEN_NAME='_token'`（Constant.php:41）。エンドポイントは `admin_stock_move_transfer_return_list_pdf_export`＝`POST /%admin%/product/stock/move_transfer/return_list_pdf_export`（StockMoveTransferController.php:455）。

| テストID | E2E可否 | 対象セレクタ（根拠 file:line / 要実機確認） | 仕様根拠 |
|----------|---------|----------------------------------------------|----------|
| E2E-M04-34-001 | E2E自動化 | #stockMoveTransferReturnListPdfExport（index.twig:629 / trans action_return_list_pdf_export messages.ja.yaml:5135） | 利用者視点の入口・帳票レイアウト識別ID1／IT-25操作起点 |
| E2E-M04-34-002 | E2E自動化 | #stockMoveTransferReturnListPdfExport＋JS alert（index.twig:191-202 / no_selection messages.ja.yaml:5139） | プロセスフロー（未選択は送信中断）／IT-25送信可否制御 |
| E2E-M04-34-003 | E2E自動化（要SEED-EXPORTABLE） | エンドポイント（Controller.php:455-472）／#form_stock_move_transfer_return_list_pdf token（index.twig:974-975） | プロセスフロー4・分岐「検証OK＝{success:true,html}」（Controller.php:471） |
| E2E-M04-34-004 | E2E自動化（要SEED-EXPORTABLE） | 返却html内 <title>（return_list.twig:6）/ #printButton（return_list.twig:11）/ th列見出し（return_list.twig:34-42） | 帳票レイアウト要素 識別ID1〜13／IT-18 |
| E2E-M04-34-010 | E2E自動化 | エンドポイント＋_token（index.twig:975） | 分岐「ids空→no_selection→{success:false,redirectUrl}」（Controller.php:489-499,462）／IT-27出力失敗 |
| E2E-M04-34-011 | E2E自動化 | エンドポイント＋_token | 分岐「対象データ見つからない→{success:false}」（CsvExportService.php:120-122・Controller.php:509-518,462）／IT-22 DB相関 |
| E2E-M04-34-012 | E2E自動化 | エンドポイント＋不正token | 分岐・例外「CSRF不正→isTokenValid()例外」（Controller.php:458）／IT-15 CSRF |
| E2E-M04-34-013 | E2E自動化（資格情報不要） | エンドポイントURL／管理ログイン画面（未ログイン時 admin_login へリダイレクト・要実機確認 #login_id） | 利用者視点の入口（管理画面ログインを要する md:52）／IT-15未認証・IT-13 |
| E2E-M04-34-014 | E2E自動化（要SEED-INVALID／test.fixme） | エンドポイント＋_token（対象外ステータスのids） | 出力前バリデーション「対象外ステータス→検証NG＝{success:false,redirectUrl}」（md:34・Controller.php:460-463,462）／IT-22相関 |
| E2E-M04-34-015 | E2E自動化（要SEED-INVALID／test.fixme） | エンドポイント＋_token（権限外店舗のids） | 出力前バリデーション「権限外店舗→検証NG」（md:34・md:44）／IT-22相関 |
| E2E-M04-34-016 | E2E自動化（要SEED-INVALID／test.fixme） | エンドポイント＋_token（入庫先未設定のids） | 出力前バリデーション「入庫先未設定→検証NG」（md:34）／IT-22相関 |
| E2E-M04-34-017 | E2E自動化（要SEED-INVALID／test.fixme） | エンドポイント＋_token（複数店舗混在のids） | 出力前バリデーション「複数店舗混在→検証NG」（md:34）／IT-22相関 |
| E2E-M04-34-020 | 手動（ポップアップ/JS依存） | window.open＋document.write（index.twig:209-241） | 表示制御「別ウィンドウで表示」（md:53,102）／IT-03外部画面 |
| E2E-M04-34-021 | 手動（window.print ネイティブUI） | #printButton（return_list.twig:11） | 表示制御「印刷ダイアログ起動」識別ID1（md:76 / index.twig:244-248） |
| E2E-M04-34-022 | 手動（帳票内容） | グループ見出し・ページング（return_list.twig:19-26） | 帳票レイアウト識別ID2・3（md:77,78） |
| E2E-M04-34-023 | 手動（帳票内容） | 空行補完ループ（return_list.twig:61-76）／MAX_PAGE_ROWS=30 | 出力単位「1ページ30行」（md:63,91） |
| E2E-M04-34-024 | 手動（帳票内容） | SQL由来行順（getReturnListExportRows） | 並び順（Excel設計 並び順／md:64） |
| E2E-M04-34-025 | 手動（帳票内容） | 各td（return_list.twig:46-58） | 列整形 識別ID5〜13（md:80-88） |
| E2E-M04-34-026 | 手動/間接（DB・帳票内容・要SEED） | 返却html明細 vs 取得結果 | 取得・整形（getReturnListExportRows / RestockListCsvRowFormatter）／IT-23 |
| E2E-M04-34-027 | 対象外/間接（DB副作用観測） | — | 状態・データ更新「参照のみ・DB書き込み無し」（md:113-118）／IT-15状態変化 |
| E2E-M04-34-028 | 対象外（内部処理＝単体領域） | — | 分岐「検証NGはgetReturnListExportRowsを呼ばない」（md:107）／IT-22相関 |
| E2E-M04-34-029 | 手動（ブラウザ設定/JS依存） | alert（index.twig:216,260,264 / popup_blocked messages.ja.yaml:5140・fetch_failed:5141） | 分岐・例外（画面側メッセージ md:110）／IT-03 |
| E2E-M04-34-030 | E2E自動化 | エンドポイント（`methods: ['POST']` StockMoveTransferController.php:455）へGET | 利用者視点の入口「POSTメソッド限定」（md:50,54 / Route methods POST）／IT-13 |
| E2E-M04-34-031 | 手動（帳票内容） | ページ内個数小計（return_list.twig 末尾 / admin.picking_item_list.all + pageQuantitySubtotal） | 帳票レイアウト識別ID14 ページ内個数小計（md:89） |
| E2E-M04-34-032 | 手動/間接（遷移後フラッシュ） | redirectUrl 遷移先一覧のフラッシュ表示領域（要実機確認） | 分岐・遷移・例外「検証NG→redirectUrl＋addErrorメッセージ表示」（md:98-99,106） |

注: 既存IT cases（接頭辞 `IT-M04-34-ADMIN-STOCK-STOCK-MOVE-RETURN-LIST-PDF-EXPORT-NNN`）は観点名のみの定型自動生成スタブ（操作手順が汎用文）であり、機能固有のシナリオを持たない。本E2Eは設計書本文（利用者視点の入口・プロセスフロー・分岐・帳票レイアウト要素）を一次情報源として網羅した。行単位の対応は付帯表2bが正本。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合は既存 `m04_34_..._it_cases.md` の関連ID件数（IT-18=6／IT-16=3／IT-27=2／IT-15=4／IT-20=2／IT-25=9／IT-03=7／IT-13=1／IT-22=35／IT-23=21＝計90）。各観点行を E2E自動化／手動・間接／対象外(理由) に振り分ける。内訳は **付帯表2b（行単位明細・全90行）** が正本。

| IT-ID | 母集合 | E2E自動化 | 手動/間接 | 対象外 | 対象外/手動の主な理由 |
|-------|:-----:|:--------:|:--------:|:------:|------------------|
| IT-18 | 6 | 0 | 6 | 0 | 帳票フォーマット定義＝出力内容の照合は手動（pdf_export方針：内容は手動） |
| IT-16 | 3 | 0 | 3 | 0 | 出力内容と対象データの一致＝帳票内容のため手動 |
| IT-27 | 2 | 2 | 0 | 0 | 検証OK（success:true,html）・検証NG（success:false,redirectUrl）はJSON応答で観測可 |
| IT-15 | 4 | 3 | 1 | 0 | CSRF/未認証/対象データ受領は自動化。参照のみ（DB副作用なし）は間接 |
| IT-20 | 2 | 0 | 0 | 2 | ログ出力抑止・識別子＝ブラウザ観測外 |
| IT-25 | 9 | 6 | 0 | 3 | ボタン表示/操作起点/送信可否/HTTPステータス/URLは自動化。確認ダイアログは本機能で不使用 |
| IT-03 | 7 | 1 | 6 | 0 | redirectUrl 遷移は自動化。ポップアップ表示・印刷遷移はJS/ブラウザ依存で手動 |
| IT-13 | 1 | 1 | 0 | 0 | エンドポイントへのURL直接アクセス（未ログイン誘導）を自動化 |
| IT-22 | 35 | 18 | 0 | 17 | 必須（未選択）・業務相関（不存在/対象外ステータス/権限/入庫先未設定/複数店舗）は success:false を JSON で観測でき自動化（業務相関は要SEED-INVALIDのため test.fixme）。文字列長/数値/文字種/部分入力は入力欄なしで非該当 |
| IT-23 | 21 | 0 | 21 | 0 | 取得結果は帳票内容/DBに現れる＝手動・間接（要シード） |
| 合計 | 90 | 31 | 37 | 22 | **未分類 0** |

注: 本機能の入力は選択ID（`ids[]`）とCSRFトークンのみで、テキスト入力欄を持たない。よって IT-22 の文字列長/数値/文字種/部分入力は本機能に非該当（対象外）。一方、設計書 md:34 が明記する業務相関NG（対象外ステータス・権限・入庫先未設定・複数店舗）は `{success:false, redirectUrl}` として JSON で観測できるため、内部処理（028）に寄せず E2E自動化（014〜017）として具体化した。対象外22件・手動37件はいずれも「ブラウザ観測不能」「帳票内容＝手動」「本機能で非該当」が理由であり放置ではない。

自動化31件の実行状態内訳（Medium 監査用）: **実装済み（spec で実行可能）= 7**（001,002,010,011,012,013,030）／ **test.fixme（自動化予定・要SEED）= 6**（003,004,014,015,016,017）。残りの自動化区分の母集合行はこれら 13 ケースに集約して対応づく（1 ケースに複数の汎用スタブ行が対応）。手動・間接37件・対象外22件は spec には残さず本ケース表で全量管理する（031 ID14小計・032 遷移後フラッシュは帳票/遷移後表示のため手動・間接でケース表のみ管理）。

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

各行（`...-NNN`）の観点を本機能でのブラウザ観測可否で分類し、対応E2EケースIDまたは理由を付す。スタブは観点が汎用のため連番で重複する。区分は行ごとに確定し、付帯表2の集計と一致する。

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001-006 | IT-18 | フォーマット定義 | 手動 | 022/023/024/025（帳票フォーマット＝出力内容の照合は手動） |
| 007 | IT-16 | 実行結果 | 手動 | 025（出力内容と対象データの一致＝帳票内容） |
| 008 | IT-27 | 実行結果 | E2E自動化 | 003（検証OKで success:true・html） |
| 009 | IT-27 | 出力失敗 | E2E自動化 | 010/011（検証NGで success:false・redirectUrl） |
| 010 | IT-15 | CSRF | E2E自動化 | 012（CSRF不正で拒否） |
| 011 | IT-15 | 未認証 | E2E自動化 | 013（未ログイン→管理ログイン誘導） |
| 012 | IT-15 | 対象データ | E2E自動化 | 003（選択IDを受領しHTMLをJSONで返す） |
| 013 | IT-20 | 出力抑止 | 対象外 | ログ出力抑止＝ブラウザ観測外 |
| 014 | IT-20 | 識別子 | 対象外 | ログ識別子＝ブラウザ観測外 |
| 015 | IT-15 | 状態変化 | 手動/間接 | 027（参照のみ＝DB副作用なしのDB確認） |
| 016,017 | IT-25 | UI部品 | E2E自動化 | 001（一覧のPDF出力ボタン表示） |
| 018 | IT-25 | 操作起点 | E2E自動化 | 001/002（ボタン押下起点） |
| 019,020,021 | IT-25 | 確認ダイアログ | 対象外 | 本機能はPDF出力に確認ダイアログを使わない（未選択はalertで中断＝022でカバー） |
| 022 | IT-25 | 送信可否制御 | E2E自動化 | 002（未選択時は送信せずalertで中断） |
| 023 | IT-03 | 外部画面 | 手動 | 020（別ウィンドウ＝ポップアップ表示・JS依存） |
| 024 | IT-03 | 画面遷移 | E2E自動化 | 010（検証NGの redirectUrl をJSONで返す） |
| 025-029 | IT-03 | 画面遷移 | 手動 | 020/021/029（ポップアップ表示・印刷遷移・失敗メッセージ＝JS/ブラウザ依存） |
| 030 | IT-13 | URL直接アクセス | E2E自動化 | 013（エンドポイント直接アクセス→未ログイン誘導） |
| 031 | IT-25 | HTTPステータス | E2E自動化 | 003/010（JSON応答のHTTPステータス） |
| 032 | IT-25 | URL | E2E自動化 | 003/010（エンドポイントURL action） |
| 033 | IT-22 | 必須バリデーション | E2E自動化 | 002/010（必須＝ids未選択→no_selection でエラー） |
| 034 | IT-22 | 必須バリデーション | E2E自動化 | 003（必須＝ids選択あり・任意未入力→エラーにならず success:true。観点表#2に対応） |
| 035-040 | IT-22 | 文字列長バリデーション | 対象外 | テキスト入力欄なし＝文字列長バリデーション非該当 |
| 041-048 | IT-22 | 数値バリデーション | 対象外 | 数値入力欄なし（ids[]はintval/filter）＝数値バリデーション非該当 |
| 049,050 | IT-22 | 文字種バリデーション | 対象外 | テキスト入力欄なし＝文字種バリデーション非該当 |
| 051 | IT-22 | その他のバリデーション | E2E自動化 | 011（対象データ見つからない＝検証NG） |
| 052-059 | IT-22 | その他のバリデーション | E2E自動化 | 014/015/016/017（対象外ステータス・権限外店舗・入庫先未設定・複数店舗の検証NG＝success:false。要SEED-INVALID／test.fixme。汎用スタブを設計書 md:34 が明記する4業務条件へ割付） |
| 060 | IT-22 | 相関バリデーション | E2E自動化 | 011（不存在IDの相関検証＝NG） |
| 061,062 | IT-22 | 相関バリデーション | E2E自動化 | 003（相関OK＝許可ステータス・権限内・単一店舗・入庫先設定済で success:true。母集合の「該当未入力/該当条件はエラーなし継続」＝正常側に対応） |
| 063 | IT-22 | 相関バリデーション | E2E自動化 | 015/017（権限外店舗・複数店舗の業務相関NG＝success:false。母集合「該当しない値はエラー」＝異常側。要SEED-INVALID／test.fixme） |
| 064 | IT-22 | DBとの相関バリデーション | E2E自動化 | 011（DB照合で対象データなし→NG） |
| 065 | IT-22 | DBとの相関バリデーション | E2E自動化 | 014/016（ステータス・入庫先のDB相関＝success:false。要SEED-INVALID／test.fixme） |
| 066 | IT-22 | 必須制御 | E2E自動化 | 002/010（未選択は必須エラーで中断） |
| 067 | IT-22 | 部分入力 | 対象外 | 選択IDのみで部分入力観点は非該当 |
| 068-083 | IT-23 | 検索条件 | 手動/間接 | 026（取得結果は帳票内容/DBに現れる＝要シードで手動・間接） |
| 084-088 | IT-23 | 実行結果 | 手動/間接 | 026（取得実行結果＝帳票内容/DBで手動・間接） |
| 089,090 | IT-16 | 実行結果 | 手動 | 025（出力内容と対象データの一致＝帳票内容） |

集計（付帯表2と一致）: 自動化 31（008,009,010,011,012,016,017,018,022,024,030,031,032,033,034,051,052-059,060,061,062,063,064,065,066）／ 手動・間接 37（001-007,015,023,025-029,068-090＝7+1+1+5+23）／ 対象外 22（013,014,019,020,021,035-050,067＝2+3+16+1）。**未分類 0**。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-M04-34-ADMIN | dtb_member（管理者） | 在庫移動・振替一覧を閲覧でき、戻しリストPDF出力ボタンに到達できる権限の管理者1。ログインID/PWは config 既定 | fixture(config既定) | 既存利用・撤去不要 | 001,002,010,011,012 |
| SEED-M04-34-EXPORTABLE | dtb_stock_move_transfer / dtb_stock_move_transfer_detail / 入庫先 dtb_product_stock / dtb_base_info（expensive_threshold1〜3）他 | **出力可能な状態**＝許可ステータス（ALLOWED_STATUS_IDS）・入庫先店舗設定済・ログイン管理者の権限店舗。閾値グループ分け・サプライ品・31行以上の分割を検証できるよう複数閾値/サプライ/30行超を含む | fixture もしくは migration（現行相当なし＝新規synthetic可） | 専用識別接頭辞・参照のみ（DB更新しないため復元不要）。複数店舗混在ケースは別レコードで用意 | 003,004,020,021,022,023,024,025,026,027,065,068-090 |
| SEED-M04-34-INVALID | dtb_stock_move_transfer | 検証NGを起こす各レコード：対象外ステータス／入庫先店舗未設定（shopId=null）／ログイン管理者の権限外店舗／複数店舗混在 | fixture もしくは synthetic | 専用識別接頭辞・参照のみ | 014,015,016,017,028 |

注: 戻しリストPDFは参照のみでDBへ書き込まないため、シードは参照系として安定利用できる（後始末はレコード撤去のみ）。本機能は新規実装で現行（pf-eccube3）に相当機能が無いため、`migration` ではなく synthetic/fixture を基本とする。共通ログインは `config/default.config.ts`（ECCUBE_ADMIN_USER/PASS）を流用する。

## 付帯表4：不具合候補（仕様乖離）／要確認

仕様と実装(Twig/ソース)の食い違い。テストは仕様どおりに書き、実装が違えば落ちて検出する。**期待値を実装へ書き換えない。**

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | 未選択時は「1つ以上の在庫移動情報を選択してください。」で中断 | index.twig:198-202（クライアントJSがalertで中断しPOSTしない）＋Controller.php:489-499（サーバ側も no_selection） | クライアントJSをバイパスしてPOSTした場合のみサーバ no_selection を観測（010で確認）。UI経路の中断は alert（002）で確認 | 002,010 | 要確認(2経路) |
| 2 | CSRF不正は例外で拒否 | Controller.php:458 isTokenValid()（戻り値未使用＝EccubeのisTokenValidは無効時に例外送出） | 例外時のHTTPステータス（403/400等）と、Ajax経路でのレスポンス形は実機確認。テストは「成功HTML/サクセスを返さない」を期待 | 012 | 要確認(応答形) |
| 3 | 検証NGはデータ取得しない（getReturnListExportRows未呼び出し） | Controller.php:460-463（hasError時に early return） | 内部呼び出し有無はブラウザ観測不能（単体テスト testExport...DoesNotFetchExportRows が確認）。E2Eでは success:false の観測まで | 011,028 | 対象外(内部) |
| 4 | redirectUrl はセッション page_no（既定1）から生成 | Controller.php:486-487（SESSION_KEY_PAGE_NO） | redirectUrl の page_no はセッション依存。テストは「redirectUrl が文字列で返る」までを期待（具体URLは環境依存） | 010,011 | 要確認(環境依存) |
| 5 | 別ウィンドウ表示・印刷ダイアログ・ポップアップブロック/取得失敗メッセージ | index.twig:209-264（window.open/document.write/window.print/alert） | ポップアップ・印刷ダイアログはブラウザネイティブ/JS依存で自動検知が限定的＝手動 | 020,021,029 | 手動(ブラウザ依存) |
| 6 | 商品仕訳タイトルは「戻しリスト（商品単位{閾値ラベル}）」（md:77 識別ID2） | messages.ja.yaml:5137 `title_per_item` の末尾が全角開き括弧ではなく半角アンダースコア（`戻しリスト（商品単位_`）で、return_list.twig:23 が `{{ label }}）` を連結 | 連結結果が「戻しリスト（商品単位_{ラベル}）」となり閾値ラベル前の区切りが設計書表記とずれる可能性。テストは設計書由来の表記（022/025の手動確認）で判定し、実装文言へ寄せない | 022 | 要確認(メッセージ定義) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口（エンドポイント） | エンドポイントURL・管理ログイン要・POSTメソッド | 001,003,010,013 | カバー |
| 利用者視点の入口（POSTメソッド限定） | 非POST（GET）は本処理に到達しない | 030 | カバー |
| フロント挙動／入口ボタン | 一覧の「戻しリストPDF出力」ボタン表示・操作起点 | 001,002 | カバー |
| プロセスフロー1（CSRF検証） | 不正トークンで拒否 | 012 | カバー |
| プロセスフロー2（共通バリデーション） | ids空→no_selection／不存在ID→検証NG | 002,010,011 | カバー |
| プロセスフロー2（業務相関バリデーション） | 対象外ステータス/権限外店舗/入庫先未設定/複数店舗→検証NG＝{success:false,redirectUrl} | 014,015,016,017 | 部分カバー(014〜017は要SEED-INVALID／test.fixme・未実行) |
| プロセスフロー3（取得・整形・グループ化・30行分割） | 取得結果の帳票反映・閾値グループ・ページ分割 | 026,022,023 | 手動(帳票内容) |
| プロセスフロー4（renderView＋JSON返却） | 検証OK→{success:true, html} | 003 | 部分カバー(003は要SEED-EXPORTABLE／test.fixme・未実行) |
| プロセスフロー5（画面側ポップアップ・印刷） | 別ウィンドウ表示・印刷ダイアログ起動 | 020,021 | 手動(JS/ブラウザ依存) |
| 印刷用データ構造（ReturnList/groups/pages/items） | createdAt・maxPageRows=30・グループ・ページ・明細 | 022,023,024,025 | 手動(帳票内容) |
| 帳票レイアウト識別ID1 印刷ボタン | #printButton「印刷する」表示・印刷範囲外 | 004,021 | 部分カバー(表示は004＝要SEED/test.fixme・印刷範囲外/印刷ダイアログは手動) |
| 帳票レイアウト識別ID2 商品仕訳タイトル | 商品単位/サプライの見出し・閾値ラベル | 004,022 | 部分カバー(見出しは004＝要SEED/test.fixme・閾値ラベル内容は手動) |
| 帳票レイアウト識別ID3 ページング | {現在}/{総数} | 022 | 手動(帳票内容) |
| 帳票レイアウト識別ID4 作成日時 | 作成日時表示 | 022 | 手動(帳票内容・時刻依存) |
| 帳票レイアウト識別ID5〜13 明細各列 | No/棚番/言語状態/略称/色R/数/商品名/価格/備考（No連番・Foil表記・3桁区切り・数量太字・基準価格・備考空文字含む） | 004,025 | 部分カバー(列見出しは004＝要SEED/test.fixme・整形内容は025/024で手動詳細化) |
| 帳票レイアウト識別ID14 ページ内個数小計 | 全{合計}点 | 031 | 手動(帳票内容) |
| 分岐・遷移・例外（選択無し/検証NG） | {success:false, redirectUrl} を HTTP200で返す | 010,011 | カバー |
| 分岐・遷移・例外（検証NG時のフラッシュ表示） | redirectUrl 遷移先一覧でエラーメッセージ（addError）が表示される | 032 | 手動/間接(遷移後表示) |
| 分岐・遷移・例外（検証NGはデータ取得しない） | getReturnListExportRows未呼び出し | 028 | 対象外(内部・単体領域) |
| 分岐・遷移・例外（検証OK） | {success:true, html} | 003 | カバー(要シード) |
| 分岐・遷移・例外（CSRF不正） | 例外で拒否 | 012 | カバー |
| 分岐・遷移・例外（ポップアップ/取得失敗） | popup_blocked/fetch_failed メッセージ | 029 | 手動(ブラウザ設定/JS依存) |
| 状態・データ更新（参照のみ） | 業務データ・CSV取込/在庫/ステータス履歴を更新しない | 027 | 対象外/間接(DB確認) |
| 参照テーブル（取得対象） | 選択IDの実在庫が含まれ対象外は含まれない | 026 | 手動/間接(要シード) |
| 権限・認可（未認証・権限外店舗） | 未ログイン誘導・権限外店舗の検証NG | 013,015 | 部分カバー(未認証013は実装済み・権限外015は要SEED-INVALID／test.fixme・未実行) |
| ログ・監査（出力抑止・識別子） | 機微情報のログ出力抑止 | （IT-20＝観測外） | 対象外(理由付き) |

未カバーはいずれも理由（ブラウザ観測不能・帳票内容＝手動・要シードの業務相関・内部処理＝単体領域・時刻依存）を明記済み。正常系（003 検証OK／001 入口）と各異常系（002/010 未選択・011 不存在・012 CSRF・013 未認証・028 業務相関NG）が対で揃っている。
