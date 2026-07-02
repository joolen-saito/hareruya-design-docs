# m07-08_admin_online_purchase_purchase_online_return_list_csv_export（戻しリストCSV） E2Eテストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m07-08_admin_online_purchase_purchase_online_return_list_csv_export.html`（正本 `functions/ec-cube-enterprise/m07-08_admin_online_purchase_purchase_online_return_list_csv_export.md`）／原典 `excel_to_html/output/0206_基本設計仕様書(ネット買取管理機能).html`

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/m07_08_admin_online_purchase_purchase_online_return_list_csv_export_it_cases.md`（母集合 計90観点行）

期待結果は画面表示・遷移・URL・ダウンロード発火/応答ヘッダなどブラウザで観測できる結果で判定する。**期待結果は仕様（基本設計＝Excel設計書／正本md／観点表）由来**とし、実装の現挙動・POM見出し・Form制約・メッセージ文言を期待値へ流用しない（messages.ja.yaml の文言は仕様文言の静的確認として併記する位置情報扱い）。CSVの中身（8列の値）の厳密検査は**手動**。TSV は既存IT casesと同一の 10 列固定。E2E固有情報は TSV 後の付帯表に `テストID` で対応づける。Playwright は本リポジトリでは実行しない（構造参考のみ）。未検証セレクタは `要実機確認`。

本機能は「ネット買取管理 > 買取一覧」（`admin_purchase_list`＝`/admin/purchase/list`）で対象買取注文をチェック選択し、ダウンロードドロップダウンの「戻しリストCSV」ボタン（`admin_purchase_csv_export_return_list`＝`POST /admin/purchase/csv_export_return_list`）で棚戻し業務用CSVを出力する bulk/csv_export 型の機能である。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-25 | 一覧画面の入口・ダウンロードドロップダウン内「戻しリストCSV」ボタン・ボタンformactionのURL・ダウンロード応答(attachment) |
| IT-27 | CSVダウンロードの発火（実行結果） |
| IT-16 | 出力CSVの内容（8列）が選択データと一致（**内容＝手動**） |
| IT-22 | 選択必須（未選択エラー）・出力対象ステータス相関（入庫待ち/入庫済み以外エラー）・対象不存在エラー |
| IT-15 | 未認証アクセスのログイン誘導・CSRF（フレームワーク内部＝手動/対象外） |
| IT-13 | POST専用ルートへのURL直接アクセス挙動 |
| IT-03 | エラー時の一覧へのリダイレクト留まり・ダウンロード時の無遷移 |
| IT-26 | 出力後も棚戻し済みフラグが更新されないこと（仕様＝参照のみ）の検証（間接・**仕様乖離**＝実装は更新するため検出対象） |
| IT-20 | ログ出力抑止・識別子（ブラウザ観測外＝対象外） |
| IT-23 | 一覧検索条件は別機能（買取検索）へ委譲（対象外） |

## テストケースTSV（10列固定・既存IT casesと同一形式）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m07-08_admin_online_purchase_purchase_online_return_list_csv_export（戻しリストCSV）	E2E-M07-08-001	IT-25	操作起点	P1	買取一覧画面が表示され戻しリストCSV出力の入口に到達できる	管理者ログイン済／SEED-M07-08-ADMIN	—	"1. 管理者でログインする
2. /admin/purchase/list を開く"	ネット買取管理の買取一覧画面（サブタイトル「買取一覧」）が表示されること。
m07-08_admin_online_purchase_purchase_online_return_list_csv_export（戻しリストCSV）	E2E-M07-08-002	IT-25	UI部品	P2	ダウンロードドロップダウンに「戻しリストCSV」ボタンが表示される	管理者ログイン済／検索結果が1件以上／SEED-M07-08-RESTOCK	—	"1. 買取一覧画面を表示する（検索結果1件以上）
2. 「ダウンロード」ドロップダウンを開く"	ドロップダウン内に「戻しリストCSV」ボタン（id=csv_export_return_list）が表示されること。
m07-08_admin_online_purchase_purchase_online_return_list_csv_export（戻しリストCSV）	E2E-M07-08-003	IT-25	URL	P3	「戻しリストCSV」ボタンのformactionが戻しリスト出力ルートを指す	管理者ログイン済／検索結果が1件以上／SEED-M07-08-RESTOCK	—	"1. 買取一覧画面を表示する
2. 「戻しリストCSV」ボタンのformaction属性を確認する"	formaction が戻しリストCSV出力ルート（/admin/purchase/csv_export_return_list）であること。
m07-08_admin_online_purchase_purchase_online_return_list_csv_export（戻しリストCSV）	E2E-M07-08-010	IT-27	実行結果	P1	出力対象を選択し戻しリストCSVを実行するとCSVダウンロードが発火する	管理者ログイン済／入庫待ちまたは入庫済みステータスの買取が1件以上／SEED-M07-08-RESTOCK	対象買取のチェックボックスを選択	"1. 買取一覧画面を表示する
2. 出力対象（入庫待ち/入庫済み）の買取をチェックする
3. 「ダウンロード」→「戻しリストCSV」を押下"	CSVファイルのダウンロードが発火すること（添付ファイルとして応答されること）。
m07-08_admin_online_purchase_purchase_online_return_list_csv_export（戻しリストCSV）	E2E-M07-08-011	IT-25	HTTPステータス	P2	ダウンロードファイル名が戻しリストCSVの命名規則に従う	管理者ログイン済／入庫待ち/入庫済みの買取が1件以上／SEED-M07-08-RESTOCK	対象買取のチェックボックスを選択	"1. 戻しリストCSVを実行する
2. ダウンロードの提案ファイル名を確認する"	ファイル名が purchase_restock_list_ で始まり拡張子 .csv であること。
m07-08_admin_online_purchase_purchase_online_return_list_csv_export（戻しリストCSV）	E2E-M07-08-012	IT-27	出力失敗	P3	出力処理中に失敗した場合はCSVが完成せずエラーとなる（手動・強制注入）	管理者ログイン済／入庫待ち/入庫済みの買取／SEED-M07-08-RESTOCK	出力ストリーム/CSV書込/データ取得を強制的に失敗させる	"1. 戻しリストCSVを実行する
2. 出力処理中に例外/失敗を強制注入する"	正常なCSVが完成せず（添付ファイルとして完了応答されず）エラーとして扱われること。※失敗の強制注入は実機/フィクスチャ依存のため手動（付帯表4 #6）。
m07-08_admin_online_purchase_purchase_online_return_list_csv_export（戻しリストCSV）	E2E-M07-08-020	IT-22	必須制御	P1	未選択で戻しリストCSVを実行すると選択必須エラーが表示され一覧に留まる	管理者ログイン済／検索結果が1件以上／SEED-M07-08-RESTOCK	買取を1件も選択しない	"1. 買取一覧画面を表示する
2. 何も選択せず「ダウンロード」→「戻しリストCSV」を押下"	「1つ以上の買取注文情報を選択してください。」がエラー表示され、買取一覧に留まる（CSVは出力されない）こと。
m07-08_admin_online_purchase_purchase_online_return_list_csv_export（戻しリストCSV）	E2E-M07-08-021	IT-22	DBとの相関バリデーション	P2	出力対象に入庫待ち/入庫済み以外のステータスを含めるとエラーになる	管理者ログイン済／入庫待ち・入庫済み以外のステータスの買取が存在／SEED-M07-08-INVALID-STATUS	入庫待ち/入庫済み以外のステータスの買取を選択	"1. 買取一覧画面を表示する
2. 出力対象外ステータスの買取を選択
3. 「戻しリストCSV」を押下"	出力対象に入庫待ち/入庫済み以外のステータスを含む場合はエラーが表示され（一覧に留まる）、CSVは出力されないこと。※具体的なエラーメッセージ文言・許可ステータスの定義は設計に明記が薄く実装補完（付帯表4 #3）＝要確認のため、文言の完全一致は固定しない。
m07-08_admin_online_purchase_purchase_online_return_list_csv_export（戻しリストCSV）	E2E-M07-08-022	IT-22	DBとの相関バリデーション	P3	対象IDが全件不存在のとき「対象のデータが見つかりません。」エラーになる	管理者ログイン済／SEED-M07-08-ADMIN	存在しない買取番号のみを buyOrderIds に指定（直接POST）	"1. 有効なCSRFトークン付きで存在しない買取番号のみを送信する"	全件が不存在の場合「対象のデータが見つかりません。」がエラー表示され、CSVは出力されないこと（判定順序: findBy結果が空＝BuyOrderRestockListService.php:101-103）。
m07-08_admin_online_purchase_purchase_online_return_list_csv_export（戻しリストCSV）	E2E-M07-08-023	IT-22	DBとの相関バリデーション	P3	有効IDと不存在IDが混在するとき不存在ID個別エラーになる	管理者ログイン済／入庫待ち/入庫済みの買取1件以上／SEED-M07-08-RESTOCK	有効な買取番号と存在しない買取番号を混在指定（直接POST）	"1. 有効なCSRFトークン付きで有効ID＋不存在IDを送信する"	不存在IDについて「買取番号: {7桁} は存在しません。」が個別エラー表示され、CSVは出力されないこと（判定順序: 一部不存在＝BuyOrderRestockListService.php:111-114）。
m07-08_admin_online_purchase_purchase_online_return_list_csv_export（戻しリストCSV）	E2E-M07-08-024	IT-22	部分入力	P3	buyOrderIdsに非数値/0/負数のみを送ると除去され未選択エラーになる	管理者ログイン済／SEED-M07-08-ADMIN	buyOrderIds に非数値文字列・0・負数のみを指定（直接POST）	"1. 有効なCSRFトークン付きで非数値/0/負数のみを送信する"	intval+array_filter で除去され実質未選択となり「1つ以上の買取注文情報を選択してください。」がエラー表示され、CSVは出力されないこと（境界: PurchaseController.php:645-651）。
m07-08_admin_online_purchase_purchase_online_return_list_csv_export（戻しリストCSV）	E2E-M07-08-030	IT-15	未認証	P1	未ログインで買取一覧URLへ直接アクセスすると管理ログイン画面へ誘導される	未ログイン	—	"1. ログアウト状態で /admin/purchase/list へアクセスする"	管理ログイン画面（ログインIDフォーム）へ誘導されること。
m07-08_admin_online_purchase_purchase_online_return_list_csv_export（戻しリストCSV）	E2E-M07-08-032	IT-15	未認証	P2	未ログインで戻しリスト出力ルートへPOSTすると出力されずログインへ誘導される	未ログイン	不正でないCSRFトークン無し/未認証セッション	"1. ログアウト状態で /admin/purchase/csv_export_return_list へPOSTする"	CSVは出力されず、管理ログインへ誘導（または拒否）されること（権限・認可はエンドポイント側でも有効）。
m07-08_admin_online_purchase_purchase_online_return_list_csv_export（戻しリストCSV）	E2E-M07-08-031	IT-13	URL直接アクセス	P2	POST専用の戻しリスト出力ルートへGETで直接アクセスすると出力されない	管理者ログイン済／SEED-M07-08-ADMIN	—	"1. /admin/purchase/csv_export_return_list へGETでアクセスする"	CSVは出力されず、許可されないメソッドとして拒否（または利用不可）となること。
m07-08_admin_online_purchase_purchase_online_return_list_csv_export（戻しリストCSV）	E2E-M07-08-040	IT-16	実行結果	P2	出力CSVの内容（8列）が選択した買取データと一致する	管理者ログイン済／既知の棚戻しデータ／SEED-M07-08-RESTOCK	内容が既知の買取を選択	"1. 戻しリストCSVを出力する
2. ファイルを開き8列（ピッキング区分/棚番号/言語・状態/略称/色・R/数/商品名/基準価格）を確認する"	CSVの列構成と各行の値が選択データおよびExcel設計書の出力仕様と一致すること。
m07-08_admin_online_purchase_purchase_online_return_list_csv_export（戻しリストCSV）	E2E-M07-08-042	IT-16	実行結果	P2	ピッキング区分が基準価格と本店閾値に応じた区分（円未満/円以上〜円未満/円以上/サプライ）で出力される	管理者ログイン済／本店閾値(expensive_threshold1〜3)と各区分に該当する基準価格の買取／SEED-M07-08-PICKING	閾値の各境界に該当/非該当する基準価格の買取を選択	"1. 戻しリストCSVを出力する
2. ピッキング区分列の値を区分ごとに確認する"	設計（md:118-120）どおり、基準価格が「●●円未満」「●●円以上▲▲円未満」「■■円以上」のいずれかに分類され、サプライ品は「サプライ」と出力されること（閾値表示も基準価格を参照）。※CSV内容検査は手動。
m07-08_admin_online_purchase_purchase_online_return_list_csv_export（戻しリストCSV）	E2E-M07-08-043	IT-16	実行結果	P2	言語/状態・略称・色R・商品名がFoil/サプライ品の編集規則で出力される	管理者ログイン済／Foil・非Foil・サプライ品の各買取／SEED-M07-08-EDIT	Foil/非Foil/サプライ品をそれぞれ含む買取を選択	"1. 戻しリストCSVを出力する
2. 言語/状態・略称・色R・商品名の各列を確認する"	設計（md:122-126）どおり、Foilは「FoilJP/NM」形式、サプライ品は言語/状態が「サプライ品」かつ略称は非表示、色/Rは商品名から抽出、商品名は略称・言語・状態・色・レアリティを除去した値で出力されること。※CSV内容検査は手動。
m07-08_admin_online_purchase_purchase_online_return_list_csv_export（戻しリストCSV）	E2E-M07-08-044	IT-16	実行結果	P3	棚番号(本店のみ)・基準価格・CSV項目順/ソート/文字コードが仕様どおり出力される	管理者ログイン済／複数区分の買取（ソート確認用）／SEED-M07-08-PICKING	複数のピッキング区分が混在する買取を選択	"1. 戻しリストCSVを出力する
2. 棚番号・基準価格・項目順・行ソート・文字コード/改行/区切りを確認する"	棚番号は本店の棚番が出力され、8項目の列順が設計どおりで、行は「円未満→円以上〜円未満→円以上→サプライ」「非Foil→Foil」の順にソートされること（IT-24相当の文字コード/改行/区切りも仕様準拠）。※CSV内容検査は手動。
m07-08_admin_online_purchase_purchase_online_return_list_csv_export（戻しリストCSV）	E2E-M07-08-041	IT-26	更新内容	P2	戻しリストCSV出力後も対象買取の棚戻し済みフラグが更新されない（仕様＝参照のみ・乖離検出／間接）	管理者ログイン済／入庫待ち/入庫済みの買取／SEED-M07-08-RESTOCK	対象買取を選択	"1. 戻しリストCSVを出力する
2. 対象買取の棚戻し済みフラグ（restocked_flg）をDBで確認する"	仕様（正本md「CSV出力＝参照のみでDB更新を伴わない」）どおり、出力対象の買取の restocked_flg が更新されないこと。※実装は markBuyOrdersAsRestocked で更新するため、更新が起きれば仕様乖離を検出（付帯表4 #1）。
m07-08_admin_online_purchase_purchase_online_return_list_csv_export（戻しリストCSV）	E2E-M07-08-050	IT-15	CSRF	P2	CSRFトークンが不正な戻しリスト出力リクエストは拒否される	管理者ログイン済／SEED-M07-08-ADMIN	不正/欠落のCSRFトークン	"1. 不正なトークンで /admin/purchase/csv_export_return_list へPOSTする"	リクエストが拒否され、CSVが出力されないこと。
```

## 付帯表1：E2E自動化区分・セレクタ・仕様根拠・元ITケースID（TSV外）

DOM/セレクタは `src/Eccube/Resource/template/admin/Purchase/index.twig` 由来の位置情報のみ。フォームは `#bulk_csv_export`（index.twig:162、`method=post`・CSRF hidden index.twig:163）。戻しリストCSVボタンは `#csv_export_return_list`（index.twig:175、`formaction=path('admin_purchase_csv_export_return_list')`、文言 trans `admin.purchase.online.btn.csv_export_return_list`＝「戻しリストCSV」messages.ja.yaml:5259）。ダウンロードドロップダウンのトグルは `#result_list__custom_csv_menu` 内 `.dropdown-toggle`（index.twig:166-169、文言 `admin.common.download`＝「ダウンロード」:1459）。チェックボックスは `input.searched_buy_order_id[name="buyOrderIds[]"]`（index.twig:231）／全選択 `#allCheck`（index.twig:212）。エラーは flash `eccube.admin.error`→`.alert-danger`（admin/alert.twig:41-49）。一覧サブタイトル「買取一覧」（index.twig:7 / messages.ja.yaml:5216）、タイトル「ネット買取管理」（index.twig:6 / :5215）。

| テストID | E2E可否 | 対象セレクタ（根拠 file:line / 要実機確認） | 仕様根拠 |
|----------|---------|----------------------------------------------|----------|
| E2E-M07-08-001 | E2E自動化 | サブタイトル「買取一覧」(index.twig:7 / messages.ja.yaml:5216) / URL admin_purchase_list=/admin/purchase/list(PurchaseController.php:121) | 利用者視点の入口・開始条件 |
| E2E-M07-08-002 | E2E自動化(要データ) | #result_list__custom_csv_menu .dropdown-toggle(index.twig:166-169) / #csv_export_return_list(index.twig:175) | フロント挙動（ダウンロード操作部品） |
| E2E-M07-08-003 | E2E自動化(要データ) | #csv_export_return_list の formaction(index.twig:175 path admin_purchase_csv_export_return_list) | URLエンドポイント(PurchaseController.php:638) |
| E2E-M07-08-010 | E2E自動化(要シード:有効ステータス) | input.searched_buy_order_id(index.twig:231) / #csv_export_return_list(index.twig:175) / download event | 処理フロー（成功時CSV出力 PurchaseController.php:662 / BuyOrderRestockListCsvExportService.php:55-91） |
| E2E-M07-08-011 | E2E自動化(要シード) | download.suggestedFilename() | ファイル名 purchase_restock_list_{min%07d}_{YmdHis}.csv＋Content-Disposition: attachment(BuyOrderRestockListCsvExportService.php:81-87) |
| E2E-M07-08-012 | 手動(失敗の強制注入＝実機/フィクスチャ依存) | ダウンロード未完了/エラー応答 | 出力失敗時はCSV未完成（StreamedResponse callback内処理 BuyOrderRestockListCsvExportService.php:60-79）。例外強制はブラウザ操作外＝手動 |
| E2E-M07-08-020 | E2E自動化(要データ) | .alert-danger(alert.twig:42) / #csv_export_return_list | 判定順序(選択必須)＋`admin.purchase.online.csv_export.no_selection`=「1つ以上の買取注文情報を選択してください。」(PurchaseController.php:647-651 / messages.ja.yaml:5247) |
| E2E-M07-08-021 | E2E自動化(要シード:対象外ステータス) | .alert-danger(alert.twig:42) | 状態不整合（出力許可は入庫待ち/入庫済みのみ BuyOrderRestockListService.php:30-33,117-119 / 文言:118） |
| E2E-M07-08-022 | 手動/要実機(直接POST＋有効CSRF必要・UIからは不存在IDを送れない) | .alert-danger(alert.twig:42) | 対象なし＝findBy結果が空（BuyOrderRestockListService.php:101-103）。文言「対象のデータが見つかりません。」 |
| E2E-M07-08-023 | 手動/要実機(直接POST＋有効CSRF必要・有効ID＋不存在IDの混在送信) | .alert-danger(alert.twig:42) | 一部不存在＝個別エラー（BuyOrderRestockListService.php:111-114）。文言「買取番号: %07d は存在しません。」（022と別分岐） |
| E2E-M07-08-024 | 手動/要実機(直接POST＋有効CSRF必要・非数値/0/負数の送信) | .alert-danger(alert.twig:42) | 入力境界＝array_filter(array_map('intval'))で除去→実質未選択（PurchaseController.php:645-651） |
| E2E-M07-08-030 | E2E自動化(資格不要) | 管理ログイン #login_id(login.twig) | 権限・認可（未認証は管理ログインへ誘導 共通セキュリティ設定） |
| E2E-M07-08-031 | E2E自動化/要実機(405挙動) | HTTP応答（GET不可） | ルート methods:['POST'](PurchaseController.php:638) |
| E2E-M07-08-032 | E2E自動化/要実機(未認証で直接POST) | 管理ログイン #login_id(login.twig) / HTTP応答 | 権限・認可（POST専用エンドポイントも管理ファイアウォール配下＝未認証は出力されずログイン誘導/拒否） |
| E2E-M07-08-040 | 手動(CSV内容の厳密検査) | ダウンロードファイル内容（8列） | Excel設計書 戻しリストCSV 8項目定義＋CSV_HEADER(BuyOrderRestockListCsvExportService.php:33-42) |
| E2E-M07-08-042 | 手動(CSV内容＝ピッキング区分の分岐) | ダウンロードファイル内容（ピッキング区分列） | 設計md:118-120（閾値=本店expensive_threshold1〜3／基準価格参照／サプライ）＋RestockListCsvRowFormatter.php:81,107,121-133 |
| E2E-M07-08-043 | 手動(CSV内容＝言語/状態・略称・色R・商品名の編集規則) | ダウンロードファイル内容（言語/状態・略称・色R・商品名列） | 設計md:122-126（Foil形式・サプライ品・略称非表示・色R抽出・商品名除去）＋RestockListCsvRowFormatter.php:143,146 |
| E2E-M07-08-044 | 手動(CSV内容＝棚番号/基準価格/項目順/ソート/文字コード) | ダウンロードファイル内容（行順・列順・棚番号・基準価格） | 設計md:121,127（棚番=本店のみ）＋出力ソート（DtbBuyOrderRepository.php:855-864 ORDER BY pickingTypeSort,…）。IT-24相当の文字コード/改行/区切りは仕様準拠を手動確認 |
| E2E-M07-08-041 | 手動/間接(DB値・ブラウザ観測外) | restocked_flg（DB） | 期待＝仕様「参照のみ・DB更新なし」（restocked_flg は不変）。**仕様乖離**：実装は markBuyOrdersAsRestocked で更新する(BuyOrderRestockListService.php:68-86 / CsvExportService.php:78)ため更新検出で乖離を検知。付帯表4 #1 |
| E2E-M07-08-050 | 手動(直接POSTでトークン欠落/改ざんを送る必要・ブラウザ自動描画フォームからは正規トークンしか送出できない) | .alert-danger(alert.twig:42) | CSRF：Controllerで明示的に isTokenValid() を実行（PurchaseController.php:642）。トークン不正時は副作用なし＝拒否 |

注: 既存IT cases（接頭辞 `IT-M07-08-ADMIN-ONLINE-PURCHASE-PURCHASE-ONLINE-RETURN-LIST-CSV-EXPORT-NNN`）は観点名のみの定型自動生成スタブ（操作手順が「対象画面を表示する」等の汎用文）であり、機能固有シナリオを持たない。本E2Eは基本設計（Excel）・処理フロー・実装の判定順序を一次情報源として網羅した。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合は既存 `m07_08_..._it_cases.md` のTSV（90データ行）の関連ID件数（IT-22=35／IT-23=22／IT-25=9／IT-03=7／IT-26=7／IT-15=4／IT-20=2／IT-27=2／IT-16=1＝計90）。各観点行を「本機能（チェック選択→戻しリストCSV出力）でブラウザ観測可能か」で振り分ける。内訳は付帯表2bが正本。

注（母集合の範囲）: 本E2Eの母集合は観点表マスタ（`integration-test-viewpoints.md` の全IT-ID）ではなく、IT工程で本機能に該当ありと判定済みの上記90行である。観点表マスタの IT-24（CSV文字コード/改行/区切り/項目順/件数/ソート 等）や IT-33（数量・金額・履歴の更新結果 等）は、既存IT cases の「対象外観点」節で「元設計HTMLに該当する処理・I/Fがないため」として既に対象外確定済みであり、E2E母集合の対象外ではなくIT段階での非該当である（IT cases 対象外観点節を正典として継承）。

| IT-ID | 母集合 | E2E自動化 | 手動/間接 | 対象外 | 対象外/手動の主な理由 |
|-------|:-----:|:--------:|:--------:|:------:|------------------|
| IT-16 | 1 | 0 | 1 | 0 | CSV内容の一致検査は手動（040） |
| IT-27 | 2 | 1 | 1 | 0 | ダウンロード発火は自動化（010）。出力失敗の強制は手動 |
| IT-15 | 4 | 1 | 3 | 0 | 未認証誘導=自動化(030)。CSRFは直接POSTでトークン欠落/改ざん送信が必要=手動(050)。対象データ参照/状態変化(restocked)=手動/間接 |
| IT-20 | 2 | 0 | 0 | 2 | ログ出力抑止・識別子はブラウザ観測外 |
| IT-25 | 9 | 5 | 0 | 4 | 入口/部品/URL/応答=自動化。確認ダイアログ3・送信可否制御1は本機能で不使用 |
| IT-03 | 7 | 6 | 0 | 1 | 一覧留まり/ダウンロード無遷移=自動化。外部画面なし=対象外 |
| IT-13 | 1 | 1 | 0 | 0 | POST専用ルートへのGET直接アクセス |
| IT-22 | 35 | 5 | 1 | 29 | 選択必須3・状態相関2のみ自動化。部分入力1は直接POST境界（024）で手動。文字列長/数値/文字種/その他は入力フォームが無く非該当 |
| IT-23 | 22 | 0 | 6 | 16 | 一覧検索条件は別機能（買取検索）へ委譲=対象外。実行結果/更新は内容=手動/間接 |
| IT-26 | 7 | 1 | 6 | 0 | ダウンロード=自動化(090相当)。restocked_flg更新は間接（仕様乖離） |
| 合計 | 90 | 20 | 18 | 52 | **未分類 0** |

注: 対象外53件はいずれも「ブラウザ観測不能」「本機能で非該当（入力フォーム無し）」「別機能へ委譲」が理由であり、放置ではない。

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-16 | 実行結果 | 手動 | 040（CSV内容8列の一致は手動検査） |
| 002 | IT-27 | 実行結果 | E2E自動化 | 010/011（ダウンロード発火・応答） |
| 003 | IT-27 | 出力失敗 | 手動 | 012（出力失敗時にCSV未完成。例外強制注入は実機/フィクスチャ依存＝手動） |
| 004 | IT-15 | CSRF | 手動 | 050（Controllerで明示 isTokenValid。トークン欠落/改ざんは直接POSTで送信する必要があり手動） |
| 005 | IT-15 | 未認証 | E2E自動化 | 030（未ログイン→管理ログイン誘導） |
| 006 | IT-15 | 対象データ | 手動/間接 | 041（restocked_flg更新は間接・仕様乖離） |
| 007 | IT-20 | 出力抑止 | 対象外 | ログ出力抑止はブラウザ観測外 |
| 008 | IT-20 | 識別子 | 対象外 | ログ識別子はブラウザ観測外 |
| 009 | IT-15 | 状態変化 | 手動/間接 | 041（restocked_flgの状態変化は間接） |
| 010 | IT-25 | UI部品 | E2E自動化 | 002（戻しリストCSVボタン表示） |
| 011 | IT-25 | UI部品 | E2E自動化 | 001（一覧/チェックボックス表示の入口） |
| 012 | IT-25 | 操作起点 | E2E自動化 | 001（買取一覧の入口） |
| 013 | IT-25 | 確認ダイアログ | 対象外 | 本機能はダウンロードに確認ダイアログ不使用 |
| 014 | IT-25 | 確認ダイアログ | 対象外 | 同上（確認ダイアログ不使用） |
| 015 | IT-25 | 確認ダイアログ | 対象外 | 同上（確認ダイアログ不使用） |
| 016 | IT-25 | 送信可否制御 | 対象外 | ボタンは常時活性でクライアント側送信可否制御を持たない |
| 017 | IT-03 | 外部画面 | 対象外 | 本機能に外部画面遷移なし（同画面でのダウンロード） |
| 018 | IT-03 | 画面遷移 | E2E自動化 | 010（ダウンロード時は無遷移＝一覧維持） |
| 019 | IT-03 | 画面遷移 | E2E自動化 | 020（エラー時は買取一覧へリダイレクト留まり） |
| 020 | IT-03 | 画面遷移 | E2E自動化 | 021（状態相関エラー時の一覧留まり） |
| 021 | IT-03 | 画面遷移 | E2E自動化 | 030（未認証→ログイン誘導） |
| 022 | IT-03 | 画面遷移 | E2E自動化 | 001（一覧への到達） |
| 023 | IT-03 | 画面遷移 | E2E自動化 | 002（ドロップダウン展開） |
| 024 | IT-13 | URL直接アクセス | E2E自動化 | 031（POST専用ルートへのGET直接） |
| 025 | IT-25 | HTTPステータス | E2E自動化 | 011（attachment応答） |
| 026 | IT-25 | URL | E2E自動化 | 003（ボタンformactionのURL） |
| 027,028 | IT-22 | 必須バリデーション | E2E自動化 | 020（選択必須・未選択エラー） |
| 029-034 | IT-22 | 文字列長バリデーション | 対象外 | 本機能に文字列入力欄なし（選択のみ）＝非該当 |
| 035-042 | IT-22 | 数値バリデーション | 対象外 | 本機能に数値入力欄なし＝非該当 |
| 043,044 | IT-22 | 文字種バリデーション | 対象外 | 文字入力欄なし＝非該当 |
| 045-053 | IT-22 | その他のバリデーション | 対象外 | 戻しリスト出力に該当する入力細目なし（種別パラメータも無し） |
| 054-057 | IT-22 | 相関バリデーション | 対象外 | 本機能の相関はステータス相関（058,059で代表）。汎用相関は非該当 |
| 058,059 | IT-22 | DBとの相関バリデーション | E2E自動化 | 021（出力対象ステータス相関エラー） |
| 060 | IT-22 | 必須制御 | E2E自動化 | 020（選択必須） |
| 061 | IT-22 | 部分入力 | 手動 | 024（buyOrderIdsに非数値/0/負数のみ＝array_filterで除去され実質未選択。直接POST境界＝手動/要実機） |
| 062-077 | IT-23 | 検索条件 | 対象外 | 一覧の検索条件は別機能（買取検索）へ委譲。本機能はCSV出力のみ |
| 078-082 | IT-23 | 実行結果 | 手動/間接 | 040,042,043,044（取得結果のCSV反映・区分分岐・編集規則・項目順/ソート/文字コード＝内容検査は手動）。0件は022（対象なしエラー） |
| 083 | IT-26 | 更新内容 | 手動/間接 | 041（restocked_flg更新・仕様乖離）。母集合行は「値が変更される」期待だが正本設計は参照のみ＝設計を正としテストは非更新を期待（付帯表4 #1の乖離検出） |
| 084 | IT-26 | 更新内容 | 手動/間接 | 041（更新有無の間接確認） |
| 085 | IT-26 | 更新内容 | 手動/間接 | 041（更新値の間接確認）。母集合行は「値が変更される」期待だが設計は参照のみ＝設計を正とし非更新を期待（乖離検出） |
| 086 | IT-26 | 更新内容 | 手動/間接 | 041（参照＋更新の間接確認） |
| 087 | IT-26 | 更新内容 | 手動/間接 | 041（履歴・更新の間接確認） |
| 088 | IT-23 | 更新内容 | 手動/間接 | 041（参照テーブル値の間接確認） |
| 089 | IT-26 | 更新内容 | 手動/間接 | 041（実装確認値・ブラウザ観測外） |
| 090 | IT-26 | 更新内容 | E2E自動化 | 010（CSVダウンロード＝出力の観測） |

集計（付帯表2と一致）: 自動化 20（IT行 002,005,010,011,012,018,019,020,021,022,023,024,025,026,027,028,058,059,060,090）／ 手動・間接 18（IT行 001,003,004,006,009,061,078,079,080,081,082,083,084,085,086,087,088,089）／ 対象外 52（IT行 007,008,013,014,015,016,017,029-034=6,035-042=8,043,044,045-053=9,054-057=4,062-077=16）。**未分類 0**。
注: 上記「IT行 NNN」は既存IT cases 90行の行番号であり、E2EテストID（E2E-M07-08-NNN）とは別系。IT行061（部分入力）は本監査で対象外→手動へ是正（直接POST境界の024に対応）。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-M07-08-ADMIN | dtb_member(管理者) | ネット買取管理にアクセスできる有効な管理者1（ログインID/PWは config 既定） | fixture(config既定) | 既存利用・撤去不要 | 全テスト（ログイン前提） |
| SEED-M07-08-RESTOCK | dtb_buy_order ほか | 検索結果に出る買取注文1件以上。**出力対象として有効なステータス（入庫待ち=WAITING_FOR_STOCK または 入庫済み=STOCKING_COMPLETE）**。関連: dtb_buy_order_stock(実在庫)・dtb_product_class(規格)・dtb_shelf_number(棚番)・本店 dtb_base_info(expensive_threshold1〜3) | fixture/migration | 専用買取番号・撤去。**出力でrestocked_flgが更新されるため使い捨てまたは復元** | 002,003,010,011,040,041 |
| SEED-M07-08-INVALID-STATUS | dtb_buy_order | 入庫待ち・入庫済み以外のステータス（例: 査定中・キャンセル等）の買取注文1件 | fixture/migration | 専用買取番号・撤去 | 021 |
| SEED-M07-08-PICKING | dtb_buy_order/dtb_product_class/dtb_base_info | 本店の閾値(expensive_threshold1〜3)に対し「閾値未満」「閾値以上〜次閾値未満」「最大閾値以上」「サプライ品」「基準価格NULL」の各区分に該当する買取（出力対象ステータス）。複数区分混在でソート確認可 | fixture/migration | 専用買取番号・出力でrestocked_flgが立つため使い捨てまたは復元 | 042,044 |
| SEED-M07-08-EDIT | dtb_buy_order/dtb_product_class | Foil・非Foil・サプライ品をそれぞれ含む買取（言語/状態・略称・色R・商品名の編集規則確認用） | fixture/migration | 専用買取番号・使い捨てまたは復元 | 043 |

注: 出力許可ステータスは `BuyOrderRestockListService::ALLOWED_STATUS_IDS`（:30-33）＝入庫待ち/入庫済みのみ。`migration` を選ぶ場合 DB=ec-cube-enterprise 正典に従う。共通ログインは `config/default.config.ts`（ECCUBE_ADMIN_USER/PASS）を流用。**SEED-M07-08-RESTOCK は出力で棚戻し済みフラグが立つため、テスト毎に復元するか使い捨て買取番号を用いる**。

## 付帯表4：不具合候補（仕様乖離）／要確認

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | 正本md「本機能はCSV出力（参照のみ）でありDB更新を行わない」 | BuyOrderRestockListCsvExportService.php:78 が markBuyOrdersAsRestocked を呼び、BuyOrderRestockListService.php:68-86 が restocked_flg=true を更新 | **仕様乖離**：設計は参照のみだが実装は出力で棚戻し済みフラグを更新する。テストは仕様（参照のみ）を期待し、更新が起きれば検出。ただしDB値はブラウザ観測外のため間接/手動 | E2E-M07-08-041 | 不具合候補 |
| 2 | CSVの中身（8列・ピッキング区分の閾値表示等） | CSV_HEADER(:33-42) と RestockListCsvRowFormatter | CSV内容の厳密一致はブラウザから検査困難＝手動。Excel設計の閾値・色/R・略称ルール準拠は手動検証 | E2E-M07-08-040 | 要確認(手動) |
| 3 | 出力対象ステータスは入庫待ち/入庫済み | ALLOWED_STATUS_IDS(:30-33) | 設計（Excel/正本md）にステータス制限の明記が薄く、実装値を補完情報としている。許可ステータスの妥当性は基本設計と要突合 | E2E-M07-08-021 | 要確認(仕様補完) |
| 4 | 戻しリストPDF（隣接ボタン）はAJAXでJSON(html)を返す（CSVとは別経路） | PurchaseController.php:668-701（pdf_export_return_list は JsonResponse） | 本機能（CSV）の範囲外。PDFは別機能でダウンロード発火経路が異なる点に留意 | （対象外） | 要確認(範囲) |
| 5 | 未選択時はエラーで一覧へリダイレクト | redirectToPurchaseSearchResult(:650) | リダイレクト先（buyのページ/検索結果）と flash 表示位置は実機確認（.alert-danger の出現） | E2E-M07-08-020 | 要確認(表示位置) |
| 6 | 出力処理は StreamedResponse のコールバックで実行（応答開始後にCSV生成） | BuyOrderRestockListCsvExportService.php:60-79 | 出力途中失敗（書込/取得例外）はストリーム開始後のため、エラー表示への切替挙動は実機/フィクスチャでの強制注入が必要＝手動 | E2E-M07-08-012 | 要確認(手動) |
| 7 | CSVの文字コード/改行/区切り/項目順/ソート（IT-24相当）は基本設計のCSV仕様準拠 | DtbBuyOrderRepository.php:855-864（ORDER BY）／CSV_HEADER列順 | 既存IT対象外節はIT-24を「該当I/Fなし」とするが、本機能はCSV出力でありIT-24（文字コード/改行/区切り/項目順/件数/ソート）は該当。手動で仕様準拠を確認（042-044）。観点表マスタ継承の是非は要確認 | E2E-M07-08-044 | 要確認(母集合継承) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口（開始条件） | 管理者ログイン後に買取一覧から戻しリストCSV出力に到達 | 001,002 | カバー |
| フロント挙動（UI部品） | ダウンロードドロップダウン・戻しリストCSVボタン・チェックボックス | 002,003 | カバー |
| プロセスフロー（主処理=出力） | 対象選択→CSVダウンロード発火・応答 | 010,011 | 部分カバー（ダウンロード発火・ファイル名prefix/extのみ自動化。Content-Disposition: attachment・Content-Type: application/octet-stream・min(%07d)・timestamp・CSV本文・DB非更新は手動040-044/041） |
| 例外処理（入力不備=未選択） | 選択必須エラー・一覧留まり | 020 | カバー |
| 例外処理（入力境界=非数値/0/負数） | array_filterで除去され実質未選択 | 024 | 手動/要実機(直接POST) |
| 例外処理（状態不整合） | 入庫待ち/入庫済み以外でエラー | 021 | カバー(要シード) |
| 例外処理（対象なし＝全件不存在） | 全件不存在で「対象のデータが見つかりません。」 | 022 | 手動/要実機(直接POST) |
| 例外処理（対象なし＝一部不存在） | 有効ID＋不存在ID混在で「買取番号: %07d は存在しません。」 | 023 | 手動/要実機(直接POST) |
| 例外処理（出力失敗） | 出力処理中の失敗でCSV未完成 | 012 | 手動(失敗の強制注入＝実機/フィクスチャ依存) |
| 終了条件（出力完了/エラー表示） | ダウンロード完了 or 各エラー表示・一覧留まり | 010 / 020,021,022,023,024,050,012 | 部分カバー（正常010自動化。エラー終了は020自動化、021要シード、022-024/050は手動/要実機、012手動） |
| 入出力仕様（出力=CSV内容8列・編集規則） | 8列＋ピッキング区分閾値分岐・Foil/サプライ編集・棚番号/基準価格・項目順 | 040,042,043,044 | 手動(内容検査・各分岐を個別ケース化) |
| 出力仕様（行ソート/文字コード=IT-24相当） | 円未満→円以上〜→円以上→サプライ・非Foil→Foilのソート、文字コード/改行/区切り | 044 | 手動(内容検査) |
| 状態・データ更新（restocked_flg） | 仕様＝参照のみ（出力後も restocked_flg は不変）の検証。実装は更新するため乖離検出（間接） | 041 | 手動/間接(付帯表4 #1) |
| 判定条件（権限・ログイン状態） | 未認証は管理ログインへ誘導（一覧GET／出力POST両方） | 030,032 | 部分カバー（一覧GET030=自動化。出力POST未認証032=要実機の直接POST） |
| 判定条件（CSRF・POST専用） | 不正トークン拒否・GET直接不可 | 050,031 | 手動(CSRF＝直接POSTでトークン欠落/改ざん送信が必要)/要実機(405)。合格判定はCSV未出力＋一覧留まり/拒否（HTTPステータス文言は実装由来のため固定しない） |
| URLエンドポイント | admin_purchase_csv_export_return_list | 003,031 | カバー |
| 履歴・ログ（出力抑止/識別子） | ログ出力抑止・識別子 | （対象外＝観測外） | 対象外(理由付き) |
| 一覧検索条件（IT-23） | 検索条件によるレコード取得 | （別機能=買取検索へ委譲） | 対象外(委譲) |
| CSV種別パラメータ | 戻しリストは type 不要（product_list のみ type 分岐） | （非該当） | 対象外(非該当) |

未自動化はいずれも理由（ブラウザ観測外＝ログ/DB内部値、CSV内容/分岐/ソート/文字コード＝手動、CSRF＝直接POST必須、別機能委譲＝一覧検索、要実機＝405/直接POST/未認証POST、出力失敗＝強制注入）を明記済み。CSV内容分岐（042-044＝ピッキング区分閾値・Foil/サプライ編集・棚番号/基準価格・項目順/ソート/文字コード）、出力失敗（012）、POST未認証（032）を本監査で個別化し、設計書節→ケースの過大主張（プロセスフロー/終了条件/CSRF・POST専用）を「部分カバー」へ是正した。正常系（010 ダウンロード発火／040-044 CSV内容）と異常系（020 選択必須／021 状態相関／022 全件不存在／023 一部不存在／024 入力境界／012 出力失敗／030,032 未認証／050 CSRF）の対を確保した。
