# m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力） E2Eテストケース

元設計: `function_spec_html_preview/pf-eccube3/m03-04_admin_product_product_goods_csv_export.html`（正本 `functions/pf-eccube3/m03-04_admin_product_product_goods_csv_export.md`）

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/m03_04_admin_product_product_goods_csv_export_it_cases.md`（母集合 計90観点行）

期待結果は画面表示・遷移・URL・ダウンロード発火・HTTP応答ヘッダ・フラッシュなどブラウザで観測できる結果で判定する。**期待結果は仕様（設計書・観点表・基本設計）由来**とし、実装/POM由来の表示文言をオラクル化しない。本機能は商品一覧 `form_bulk` からの **POST CSV 出力** であり、画面タイプは `csv_export`。**ダウンロード発火・ファイル名・Content-Type/Disposition・リダイレクト・フラッシュ・UI部品・権限ガード**を自動化対象とし、**CSV本文（列・規格行展開・カンマ連結・並び）は手動**とする。TSV は既存IT casesと同一の 10 列固定。E2E固有情報は TSV 後の付帯表に `テストID` で対応づける。Playwright は本リポジトリでは実行しない（構造参考のみ）。未検証セレクタは `要実機確認`。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-27 | CSV出力成功/失敗（ダウンロード発火・text/csv・attachment・リダイレクト） |
| IT-16 | 出力ファイル内容が対象データと一致（CSV本文＝手動） |
| IT-25 | UI部品（出力ボタン）・確認ダイアログ無し・成功時出力ヘッダ・送信可否 |
| IT-03 | 画面遷移（出力成功＝ダウンロード／取得空・対象なし＝リダイレクト／未到達） |
| IT-15 | 未認証ガード（未認証POSTでログイン誘導）・対象データ（チェックボックス選択）・CSRF（仕様未規定で自動E2E対象外＝不具合候補#2に要確認記録） |
| IT-13 | 出力ルート/一覧URLへの未ログイン直接アクセス誘導 |
| IT-22 | 必須（未選択）・数値（正整数フィルタ）・部分入力。永続フォーム検証は持たない |
| IT-23 | DB検索（findBy）の内部レコード一致＝ブラウザ観測外。一覧検索は別機能へ委譲 |
| IT-20 | ログ「グッズ商品CSV出力ファイル名」＝サーバログ観測外 |

## テストケースTSV（10列固定・既存IT casesと同一形式）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-001	IT-25	UI部品	P2	商品一覧に「グッズ商品CSV出力」ボタンが表示される	管理者ログイン済／検索結果1件以上／SEED-M03-04-ADMIN	—	"1. 商品一覧(/admin/product)を開く"	一覧ブロックのボタン行に「グッズ商品CSV出力」ボタンが表示されること。
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-002	IT-15	対象データ	P3	各商品行にids[]チェックボックスと全選択チェックが表示される	管理者ログイン済／検索結果1件以上／SEED-M03-04-ADMIN	—	"1. 商品一覧を開く"	各行先頭に name=\"ids[]\" のチェックボックスがあり、表頭に全選択チェック(#trigger_check_all)が表示されること。
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-003	IT-25	確認ダイアログ	P2	出力ボタン押下前に確認ダイアログが表示されない	管理者ログイン済／検索結果1件以上／SEED-M03-04-ADMIN	—	"1. 商品一覧を開く
2. 商品を選択せず「グッズ商品CSV出力」を押下"	出力前に確認ダイアログ(モーダル/alert)が表示されないこと（ボタンはtype=submitでクライアント側チェックが掛からない）。
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-004	IT-03	画面遷移	P2	検索結果0件のとき「グッズ商品CSV出力」ボタンが表示されない	管理者ログイン済／SEED-M03-04-ADMIN	一致しないキーワード	"1. 商品一覧を開く
2. 一致しないキーワードで検索する"	一覧ブロック(form_bulk)とボタン行が描画されず「グッズ商品CSV出力」ボタンが表示されないこと（件数が正のときのみ描画）。
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-010	IT-27	実行結果	P1	グッズ商品を選択して出力するとCSVがダウンロードされファイル名がproduct_goods_{YmdHis}.csvになる	管理者ログイン済／カード詳細なし・規格1件以上の商品/SEED-M03-04-GOODS	出力対象のグッズ商品IDをチェック	"1. 商品一覧を開く
2. グッズ商品の行をチェック
3. 「グッズ商品CSV出力」を押下"	CSVファイルのダウンロードが発火し、ファイル名が product_goods_{YmdHis}.csv であること。
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-011	IT-25	確認ダイアログ	P1	出力応答がtext/csvでattachment配信される	管理者ログイン済／SEED-M03-04-GOODS	出力対象のグッズ商品ID	"1. 認証済みコンテキストで出力ルートへ ids[] 付きPOST"	応答が HTTP 200・Content-Type に text/csv を含み・Content-Disposition が attachment（filename=product_goods_…）であること。
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-014	IT-27	実行結果	P2	有効グッズIDと存在しないIDを混在POSTすると取得できた商品でCSVが配信される	管理者ログイン済／SEED-M03-04-GOODS	ids[]＝有効グッズID＋存在しないID（例 999999999）	"1. 認証済みコンテキストで出力ルートへ 有効ID＋存在しないID をPOST"	配列が空でなく取得結果が空でないため CSV が配信されること（HTTP 200・text/csv・attachment）。出力対象が取得できた商品だけであることはCSV本文＝手動(012b)。
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-012a	IT-16	実行結果	P2	CSVヘッダ行がグッズ登録CSVのキー順で並ぶ	管理者ログイン済／SEED-M03-04-GOODS	出力対象のグッズ商品ID	"1. グッズ商品を選択して出力する
2. ダウンロードCSVのヘッダ行を確認する"	ヘッダ行がグッズ商品登録CSV用ヘッダー連想配列のキー順で並ぶこと（手動: CSV本文検査）。
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-012b	IT-16	実行結果	P2	出力対象が選択した商品のみである	管理者ログイン済／SEED-M03-04-GOODS	出力対象のグッズ商品ID	"1. グッズ商品を選択して出力する
2. ダウンロードCSVの対象商品を確認する"	CSVに出力される商品が選択した商品IDのみであること（手動: CSV本文検査）。
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-012c	IT-16	実行結果	P2	選択商品の各規格が規格行として展開される	管理者ログイン済／SEED-M03-04-GOODS	出力対象のグッズ商品ID	"1. グッズ商品を選択して出力する
2. ダウンロードCSVの行を確認する"	選択商品の全規格がそれぞれ1データ行として展開されること（規格ごと1行・全規格走査。手動: CSV本文検査）。
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-012d	IT-16	実行結果	P2	各列の値が対象データと一致する	管理者ログイン済／SEED-M03-04-GOODS	出力対象のグッズ商品ID	"1. グッズ商品を選択して出力する
2. ダウンロードCSVの各セル値を確認する"	各列の値が対象データ（商品共通列・規格依存列）と一致すること（手動: CSV本文検査）。
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-012e	IT-16	実行結果	P3	出力エンコーディング・区切り・BOMが設定どおりに整形される	管理者ログイン済／SEED-M03-04-GOODS	出力対象のグッズ商品ID	"1. グッズ商品を選択して出力する
2. ダウンロードCSVのバイト列（先頭BOM・区切り文字・charset）を確認する"	設定出力エンコーディングがUTF-8のとき先頭にBOMが付与され、区切り文字は設定 eccube_csv_export_separator・エンクロージャは二重引用符であること（手動: CSV本文/バイト検査。仕様「入出力」由来）。
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-013	IT-25	操作起点	P3	全選択チェックで行チェックが一括オンオフされる	管理者ログイン済／検索結果1件以上／SEED-M03-04-ADMIN	—	"1. 商品一覧を開く
2. 表頭の全選択チェック(#trigger_check_all)を操作する"	id が check_ で始まる行チェックボックスが一括でオン/オフされること（JS連動・要実機確認）。
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-020	IT-22	必須制御	P1	商品未選択で出力すると商品一覧へリダイレクトされる	管理者ログイン済／検索結果1件以上／SEED-M03-04-ADMIN	ids＝未選択（空）	"1. 商品一覧を開く
2. 何も選択せず「グッズ商品CSV出力」を押下"	商品一覧(admin_product_page、ページ番号はセッションの検索ページ)へリダイレクトされること。
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-021	IT-22	必須バリデーション	P1	商品未選択で出力すると選択を促すメッセージが表示される	管理者ログイン済／検索結果1件以上／SEED-M03-04-ADMIN	ids＝未選択（空）	"1. 商品一覧を開く
2. 何も選択せず「グッズ商品CSV出力」を押下"	「1つ以上の商品を選択してください」が表示されること（eccube.admin.error フラッシュ）。
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-030	IT-27	出力失敗	P1	カード詳細ありの商品のみ選択するとCSVが配信されずリダイレクトされる	管理者ログイン済／カード詳細あり商品/SEED-M03-04-CARD	カード詳細ありの商品IDのみをチェック	"1. 商品一覧を開く
2. カード詳細ありの商品のみをチェック
3. 「グッズ商品CSV出力」を押下"	変換結果が空となりCSVは配信されず、Referer/商品一覧へリダイレクトされること（admin.csv.error.export.no_goods_data 相当）。
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-033	IT-27	出力失敗	P2	カード詳細なしだが規格0件の商品のみ選択するとCSVが配信されずリダイレクトされる	管理者ログイン済／規格0件・カード詳細なし商品/SEED-M03-04-NOCLASS	規格0件の商品IDのみをチェック	"1. 商品一覧を開く
2. 規格0件（カード詳細なし）の商品のみをチェック
3. 「グッズ商品CSV出力」を押下"	規格0件はスキップされ変換結果が空となりCSVは配信されず、Referer/商品一覧へリダイレクトされること（admin.csv.error.export.no_goods_data 相当。030のカード詳細ありとは別分岐）。
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-015	IT-27	実行結果	P2	グッズ商品とカード詳細あり商品を混在選択するとグッズ商品でCSVが配信される	管理者ログイン済／SEED-M03-04-GOODS／SEED-M03-04-CARD	グッズ商品ID＋カード詳細あり商品ID	"1. 商品一覧を開く
2. グッズ商品とカード詳細あり商品の双方をチェック
3. 「グッズ商品CSV出力」を押下"	カード詳細あり商品はスキップされ、残ったグッズ商品で CSV が配信されること（HTTP 200・text/csv）。カード詳細商品が除外される本文照合はCSV本文＝手動(012b)。
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-031	IT-03	画面遷移	P2	存在しないIDのみを出力POSTするとCSVが配信されずリダイレクトされる	管理者ログイン済／SEED-M03-04-ADMIN	ids[]＝存在しない商品ID（例 999999999）	"1. 認証済みコンテキストで出力ルートへ存在しないids[]をPOST"	CSVストリームではなく 302 リダイレクト応答が返り、Content-Type に text/csv を含まないこと（admin.csv.error.export.not_registered 相当）。
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-035	IT-03	画面遷移	P2	例外時にRefererがあればRefererのURLへリダイレクトされCSVは配信されない	管理者ログイン済／SEED-M03-04-ADMIN	ids[]＝存在しない商品ID（例 999999999）／Refererヘッダ＝商品一覧の特定ページURL	"1. Refererヘッダを付与して出力ルートへ存在しないids[]をPOST"	302リダイレクト応答が返り、Locationヘッダが送信したRefererのURL（例 /product/page/2）であること（Referer非空時はadmin_product_page既定ではなくRefererへ戻す）。Content-Typeにtext/csvを含まないこと。
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-032	IT-22	数値バリデーション	P2	0以下・非数字のIDのみを出力POSTするとCSVが配信されずリダイレクトされる	管理者ログイン済／SEED-M03-04-ADMIN	ids[]＝0・-1・abc	"1. 認証済みコンテキストで出力ルートへ無効なids[]をPOST"	整数化後0以下/非整数は破棄され有効ID0件となり、302 リダイレクト応答が返ること（CSVは配信されない）。
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-034	IT-22	数値バリデーション	P2	非配列のidsを出力POSTすると空配列扱いでCSVが配信されずリダイレクトされる	管理者ログイン済／SEED-M03-04-ADMIN	ids＝abc（配列記法でないスカラ値）	"1. 認証済みコンテキストで出力ルートへ非配列の ids=abc をPOST"	idsが配列でないため空配列とみなされ有効ID0件となり、302 リダイレクト応答が返ること（CSVは配信されない。処理フロー#2「配列でない場合は空配列」）。
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-040	IT-15	未認証	P1	未ログインで商品一覧へアクセスすると管理ログイン画面へ誘導される	未ログイン	—	"1. 未ログインで /admin/product へアクセス"	管理ログイン画面へ誘導されること（当パスへ到達できない）。
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-041	IT-13	URL直接アクセス	P2	未ログインで出力ルートへPOSTすると管理ログイン画面へ誘導されCSVは配信されない	未ログイン	ids未指定	"1. 未ログインで /admin/product/product_goods_csv_export へPOST（出力ルートはPOST専用）"	302で管理ログイン画面へ誘導され（Locationに/login）、Content-Typeにtext/csvを含まないこと（GET直アクセスは405になり得るためPOSTで観測）。
m03-04_admin_product_product_goods_csv_export（管理画面_商品管理_グッズ商品CSV出力）	E2E-M03-04-050	IT-20	出力抑止	P3	出力後にファイル名が情報ログへ記録される	管理者ログイン済／SEED-M03-04-GOODS	出力対象のグッズ商品ID	"1. グッズ商品を選択して出力する
2. サーバの情報ログを確認する"	情報ログに「グッズ商品CSV出力ファイル名」と生成ファイル名が記録されること（対象外: サーバログはブラウザ観測外）。
```

## 付帯表1：E2E自動化区分・セレクタ・仕様根拠（TSV外）

セレクタは `src/Eccube/Resource/template/admin/Product/index.twig`・`admin/alert.twig` 由来の位置情報のみ。ルートは `ProductCsvController.php`／ファイル名・ヘッダは `ProductGoodsCsv.php`＋`Csv/AbstractCsvService.php`。行番号は ec-cube-enterprise 現行ソース。

| テストID | E2E可否 | 対象セレクタ（根拠 file:line / 要実機確認） | 仕様根拠 | 元ITケースID |
|----------|---------|----------------------------------------------|----------|--------------|
| E2E-M03-04-001 | E2E自動化(要シード) | button「グッズ商品CSV出力」(index.twig:471-473 formaction=url('admin_product_goods_csv_export') / trans admin.product.goods_csv_export messages.ja.yaml:2046) / form#form_bulk(index.twig:465、pagination.totalItemCount>0 index.twig:464) | フロント挙動(検索結果件数が正のときのみ表示)・利用者視点の入口 | 010,053,027 |
| E2E-M03-04-002 | E2E自動化(要シード) | input[name="ids[]"] #check_{id}(index.twig:585) / #trigger_check_all(index.twig:552) | フロント挙動(各行チェックボックス・全選択) | 006 |
| E2E-M03-04-003 | E2E自動化(要シード) | button(index.twig:471) / page.on('dialog') | フロント挙動(type=submitでクライアント側チェック非適用)・モーダルなし(設計「モーダル・ポップアップ」) | 005,013 |
| E2E-M03-04-004 | E2E自動化(要シード) | #search_form #admin_search_product_product_name / .admin-product-search-submit(index.twig:445) / search_no_result(index.twig:824 messages.ja.yaml:1542) / button非存在 | 利用者視点の入口(検索結果0件は当ボタン非描画)・フロント挙動(件数が正のときのみ表示 index.twig:464) | 053 |
| E2E-M03-04-010 | E2E自動化(要GOODSシード) | #check_{id}(index.twig:585) / button(index.twig:471) / Download.suggestedFilename | 処理フロー#11(ファイル名 product_goods_+YmdHis+.csv ProductGoodsCsv.php:72/AbstractCsvService.php:380-383)・画面遷移(出力成功＝ダウンロード) | 002,023 |
| E2E-M03-04-011 | E2E自動化(要GOODSシード・request POST) | exportUrl POST / response headers | 入出力(text/csv ストリーム AbstractCsvService.php:395)・処理フロー#12(Content-Disposition attachment 同:396) | 014 |
| E2E-M03-04-014 | E2E自動化(要GOODSシード・request POST) | exportUrl POST([有効ID,存在しないID]) / 200・text/csv | 処理フロー#6(配列非空かつ取得空のときのみnot_registered→取得できた商品だけ出力 ProductGoodsCsv.php:53-54) | 002 |
| E2E-M03-04-012a〜012d | 手動(CSV本文検査・1判定/件) | （ダウンロードファイル内容） | 012a ヘッダーキー順／012b 出力対象は選択IDのみ／012c 規格ごと1行・全規格走査／012d 各列値が対象データ一致(出力列とデータの対応・業務ルール・データ整合性) | 001,083,011,012,017,018 |
| E2E-M03-04-012e | 手動(CSV本文/バイト検査・1判定/件) | （ダウンロードファイルのバイト列） | 入出力(UTF-8時BOM付与・区切りは eccube_csv_export_separator・エンクロージャ二重引用符・出力エンコーディング変換 設計「入出力」/AbstractCsvService.php fopen/fputcsv) | 001 |
| E2E-M03-04-013 | 自動化予定/要実機(fixme) | #trigger_check_all(index.twig:552 / JS index.twig:131-) | フロント挙動(check_始まりのチェックを一括オンオフ) | 013 |
| E2E-M03-04-020 | E2E自動化(要シード) | button(index.twig:471) / リダイレクト先URL | 処理フロー#3(responseNoProductIdError→admin_product_page ProductCsvController.php:118-119,149-154)・エラー処理 | 027,060,034,059,009 |
| E2E-M03-04-021 | E2E自動化(要シード) | .alert.alert-danger(alert.twig eccube.admin.error) | エラー処理(addError(admin.product.not_select,'admin') ProductCsvController.php:151 / messages.ja.yaml:1769) | 027 |
| E2E-M03-04-030 | 自動化予定/要CARDシード(fixme) | #check_{id}(index.twig:585) / 非ダウンロード＋リダイレクト | 処理フロー#7-8(カード詳細あり・規格0はスキップ→変換空→no_goods_data ProductGoodsCsv.php:57-58,96-101)・エッジケース | 008,021,058,083 |
| E2E-M03-04-033 | 自動化予定/要NOCLASSシード(fixme) | #check_{id}(index.twig:585) / 非ダウンロード＋リダイレクト | 処理フロー#7-8(規格0件はスキップ→変換空→no_goods_data ProductGoodsCsv.php:57-58)・エッジケース「規格0件のみ」・業務ルール「規格0件のみ選んだ場合」。030(カード詳細あり)とは別分岐 | 021,083 |
| E2E-M03-04-034 | E2E自動化(request POST・maxRedirects0) | exportUrl POST(ids=abc 非配列) / 302応答 / Location=admin_product_page | 処理フロー#2(配列でない場合は空配列とみなす→有効ID0件→responseNoProductIdError ProductCsvController.php:114-119)・エッジケース「ids未送信・空・文字列のみ」 | 034,059,009 |
| E2E-M03-04-035 | E2E自動化(request POST・Refererヘッダ付与・maxRedirects0) | exportUrl POST([存在しないID]) + Referer / 302応答 / Location=Referer URL | 実行時例外処理(Referer非空→そのURLへリダイレクト ProductCsvController.php:138-145)・画面遷移「実行時例外」 | 010,015 |
| E2E-M03-04-015 | 自動化予定/要GOODS＋CARDシード(fixme) | #check_{id}(index.twig:585) / 200・text/csv | 処理フロー#7(カード詳細あり商品はスキップ→残ったグッズ商品で出力 ProductGoodsCsv.php:57-58)・正常系混在 | 002,083 |
| E2E-M03-04-031 | E2E自動化(request POST・maxRedirects0) | exportUrl POST / 302応答 / Location=admin_product_page(/product…) | 処理フロー#6(取得空→not_registered ProductGoodsCsv.php:53-54)・実行時例外(Referer無→admin_product_page ProductCsvController.php:138-145) | 020,015,003,054 |
| E2E-M03-04-032 | E2E自動化(request POST・maxRedirects0) | exportUrl POST / 302応答 / Location=admin_product_page(/product…) | 処理フロー#2(intval→0以下破棄)＋#3(有効ID0件→responseNoProductIdError ProductCsvController.php:114-119,149-154)・バリデーション(正整数のみ対象) | 035,061 |
| E2E-M03-04-040 | E2E自動化(資格情報不要) | #login_id(login.twig) / リダイレクト先URL | 権限・認可(未ログインは到達不可)・利用者視点の入口 | 005,022 |
| E2E-M03-04-041 | E2E自動化(資格情報不要・request POST・maxRedirects0) | exportUrl POST(未認証) / 302・Location=/login・非text/csv | 権限・認可(出力ルート未ログインガード)・URL直接アクセス。出力ルートはPOST専用(methods:['POST'] ProductCsvController.php:109)のためGET直アクセスは405になり得る | 024 |
| E2E-M03-04-050 | 対象外(サーバログ＝ブラウザ観測外) | （サーバ情報ログ log_info ProductGoodsCsv.php:75-76） | ログ・監査(出力後にファイル名を記録) | 007,008,024 |

`元ITケースID` の行単位対応は付帯表2bが正本（既存IT cases接頭辞 `IT-M03-04-ADMIN-PRODUCT-PRODUCT-GOODS-CSV-EXPORT-NNN`）。既存IT casesは観点名のみの定型自動生成であり、本E2Eは設計書本文（処理フロー・エラー処理・入出力・フロント挙動）を一次情報源として網羅した。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合は既存 `m03_04_..._it_cases.md` の関連ID件数（IT-22=35／IT-23=21／IT-16=9／IT-25=9／IT-03=7／IT-15=4／IT-20=2／IT-27=2／IT-13=1＝計90）。各観点行を E2E自動化／手動／対象外(理由) に振り分ける。既存IT casesは**観点名のみの定型自動生成スタブ**（操作手順が汎用文）であり機能固有シナリオを持たない。内訳は **付帯表2b（行単位明細・全90行）** が正本、本表はその集計値。

| IT-ID | 母集合 | E2E自動化 | 手動 | 対象外 | 対象外の主な理由 |
|-------|:-----:|:--------:|:---:|:------:|------------------|
| IT-22 | 35 | 8 | 1 | 26 | 本機能は永続フォーム検証(最大長/文字種/相関)を持たない。入力はids[]の正整数フィルタのみで、文字列長/数値/文字種/その他の細目は非該当 |
| IT-23 | 21 | 0 | 0 | 21 | DB検索(findBy)の内部レコード一致はブラウザ観測外。検索条件・一覧検索は別機能(商品一覧)へ委譲 |
| IT-16 | 9 | 0 | 2 | 7 | CSV出力内容一致は手動(本文検査)。最大長/最小長系スタブは項目検証なしのため非該当 |
| IT-25 | 9 | 4 | 2 | 3 | UI部品/確認ダイアログ無し/成功時出力は自動化。一覧対応・全規格はCSV内容＝手動、送信可否/URL/HTTPステータス(セッション)は内部で対象外 |
| IT-03 | 7 | 4 | 2 | 1 | 画面遷移(成功＝DL/失敗＝リダイレクト/未到達)は自動化。列源泉・名称解決はCSV内容＝手動、検索抽出はDB内部で対象外 |
| IT-15 | 4 | 3 | 0 | 1 | 未認証ガード・状態変化(リダイレクト)・対象データ(チェックボックス選択)は自動化。CSRFはブラウザからの保護有無を仕様準拠で判定するオラクルが立てられず**自動E2E対象外**だが、放置せず**不具合候補#2に要確認として記録**(監査可能。実装の未保護を期待値化しない) |
| IT-20 | 2 | 0 | 0 | 2 | ログ出力(ファイル名記録)・識別子はサーバログでブラウザ観測外 |
| IT-27 | 2 | 2 | 0 | 0 | CSV出力成功(DL)・失敗(リダイレクト)はブラウザ観測可能 |
| IT-13 | 1 | 1 | 0 | 0 | 出力ルートへの未ログイン直接アクセス誘導 |
| 合計 | 90 | 22 | 7 | 61 | **未分類 0** |

注: 対象外61件はいずれも「ブラウザ観測不能(DB内部/サーバログ)」「本機能で非該当(永続フォーム検証なし/CSRF未保護)」「CSV本文は手動」「別機能へ委譲」が理由であり、放置ではない。

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

スタブは観点が汎用のため同一観点が連番で重複する。区分は行ごとに確定し、付帯表2の集計と一致する。

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-16 | 実行結果 | 手動 | 012（CSV出力内容＝対象データ一致＝本文検査） |
| 002 | IT-27 | 実行結果 | E2E自動化 | 010/011/014/015（出力成功＝ダウンロード発火・text/csv。混在=取得できた商品/グッズのみで配信） |
| 003 | IT-27 | 出力失敗 | E2E自動化 | 031/030（出力失敗＝CSV非配信＋リダイレクト） |
| 004 | IT-15 | CSRF | 対象外(要確認#2) | CSRFトークン保護の有無は本機能仕様で規定がなく、ブラウザから仕様準拠で判定するオラクルが立てられないため自動E2E対象外。出力submitがトークンを持たない実装はセキュリティ乖離の疑いとして**不具合候補#2に要確認**で記録（監査可能・期待値化しない） |
| 005 | IT-15 | 未認証 | E2E自動化 | 040/041（未ログインガード） |
| 006 | IT-15 | 対象データ | E2E自動化 | 002（ids[]チェックボックス・選択対象） |
| 007 | IT-20 | 出力抑止 | 対象外 | ログ抑止＝サーバログでブラウザ観測外 |
| 008 | IT-20 | 識別子 | 対象外 | ログ識別子＝サーバログでブラウザ観測外 |
| 009 | IT-15 | 状態変化 | E2E自動化 | 020（未選択→一覧へリダイレクト） |
| 010 | IT-25 | UI部品 | E2E自動化 | 001（出力ボタン表示） |
| 011 | IT-25 | UI部品 | 手動 | 012（出力対象は選択IDのみ＝CSV内容で確認） |
| 012 | IT-25 | 操作起点 | 手動 | 012（全規格走査＝CSV内容で確認） |
| 013 | IT-25 | 確認ダイアログ | E2E自動化 | 003（確認ダイアログ無し） |
| 014 | IT-25 | 確認ダイアログ | E2E自動化 | 011（成功時出力 text/csv） |
| 015 | IT-25 | 確認ダイアログ | E2E自動化 | 020/031（失敗時出力＝リダイレクト） |
| 016 | IT-25 | 送信可否制御 | 対象外 | 本機能は送信可否のクライアント制御を持たない（ボタン常時活性） |
| 017 | IT-03 | 外部画面 | 手動 | 012（dtb_product＝商品共通列源泉＝CSV内容） |
| 018 | IT-03 | 画面遷移 | 手動 | 012（関連マスタ名称解決＝CSV内容） |
| 019 | IT-03 | 画面遷移 | 対象外 | 検索抽出＝DB内部（findBy）でブラウザ観測外 |
| 020 | IT-03 | 画面遷移 | E2E自動化 | 031（取得空→エラーでリダイレクト） |
| 021 | IT-03 | 画面遷移 | E2E自動化 | 030（グッズ出力可否→スキップ/エラー） |
| 022 | IT-03 | 画面遷移 | E2E自動化 | 040/041（未ログイン→到達不可） |
| 023 | IT-03 | 画面遷移 | E2E自動化 | 010（出力成功→ダウンロード） |
| 024 | IT-13 | URL直接アクセス | E2E自動化 | 041（出力ルート未ログイン直接アクセス誘導） |
| 025 | IT-25 | HTTPステータス | 対象外 | セッション更新しない＝セッション内部値でブラウザ観測外 |
| 026 | IT-25 | URL | 対象外 | card_detail_id判定＝DB内部（出力可否は030で間接） |
| 027 | IT-22 | 必須バリデーション | E2E自動化 | 001/010（一覧描画＋選択で出力可） |
| 028 | IT-22 | 必須バリデーション | 対象外 | 「未入力で継続」スタブ＝本機能の必須は未選択リダイレクトのみ（020で代表） |
| 029-033 | IT-22 | 文字列長バリデーション | 対象外 | ids[]に文字列長検証なし＝非該当（最大長/最小長/±1） |
| 034 | IT-22 | 文字列長バリデーション | E2E自動化 | 020/032（ids未送信→リダイレクト） |
| 035 | IT-22 | 数値バリデーション | E2E自動化 | 032（0以下・非整数の破棄） |
| 036-042 | IT-22 | 数値バリデーション | 対象外 | ids[]は正整数フィルタのみで数値範囲検証なし＝非該当 |
| 043,044 | IT-22 | 文字種バリデーション | 対象外 | ids[]に文字種検証なし＝非該当 |
| 045-052 | IT-22 | その他のバリデーション | 対象外 | 本機能の入力に該当する追加検証なし |
| 053 | IT-22 | その他のバリデーション | E2E自動化 | 001/004（ボタンは件数正のときのみ表示＝0件で非表示） |
| 054 | IT-22 | 相関バリデーション | E2E自動化 | 020（未選択→エラーリダイレクト） |
| 055-057 | IT-22 | 相関バリデーション | 対象外 | 本機能の相関はカード詳細/規格・存在ID（030/031で代表）。汎用相関は非該当 |
| 058 | IT-22 | DBとの相関バリデーション | E2E自動化 | 030（カード詳細あり→出力不可） |
| 059 | IT-22 | DBとの相関バリデーション | E2E自動化 | 020（ids未送信→エラー） |
| 060 | IT-22 | 必須制御 | E2E自動化 | 020（Referer欠落→admin_product_pageリダイレクト） |
| 061 | IT-22 | 部分入力 | 手動 | 012（出力対象は選択IDのみ＝CSV内容で確認） |
| 062-077 | IT-23 | 検索条件 | 対象外 | findBy内部レコードの取得有無＝DB内部でブラウザ観測外。一覧検索は別機能へ委譲 |
| 078-082 | IT-23 | 実行結果 | 対象外 | 検索実行結果＝DB内部（079のtype=button alertは本出力ボタンに非適用＝別ボタン） |
| 083 | IT-16 | 実行結果 | 手動 | 012/030/015（カード詳細あり選択時の出力内容＝CSV/出力可否。混在時はグッズのみ出力＝本文手動） |
| 084,085 | IT-16 | 実行結果 | 対象外 | 「ids未送信/Referer欠落で出力内容一致」スタブ＝出力されずリダイレクト（020/031で別観点カバー）。出力内容一致は非該当 |
| 086-090 | IT-16 | 実行結果 | 対象外 | 最大長/最小長系スタブ＝項目検証なしのため非該当 |

集計（付帯表2と一致）:
- **E2E自動化 22**: 002,003,005,006,009,010,013,014,015,020,021,022,023,024,027,034,035,053,054,058,059,060。
- **手動 7**: 001,011,012,017,018,061,083（IT-16=2／IT-25=2／IT-03=2／IT-22=1）。
- **対象外 61**: 004,007,008,016,019,025,026,028,029-033,036-042,043-044,045-052,055-057,062-082,084-090。
- **未分類 0**。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-M03-04-ADMIN | dtb_member(管理者) | 有効な管理者1。ログインID/パスワードは config 既定（ECCUBE_ADMIN_USER/PASS） | fixture(config既定) | 既存利用・撤去不要 | 001,002,003,020,021,031,032 |
| SEED-M03-04-GOODS | dtb_product / dtb_product_class | **カード詳細なし（card_detail_id=NULL）かつ規格1件以上**の商品1。既知の商品ID（env GOODS_PRODUCT_ID で供給） | fixture/migration | 専用ID・参照系のみ（更新しない）。一覧検索で1件以上ヒットする状態を保証 | 010,011,012,050 |
| SEED-M03-04-CARD | dtb_product | **カード詳細あり（card_detail_id 設定済）**の商品1。グッズ出力対象外になる | fixture/migration | 専用ID・参照系のみ | 030 |
| SEED-M03-04-NOCLASS | dtb_product / dtb_product_class | **カード詳細なし（card_detail_id=NULL）かつ規格0件**の商品1。コンバート時にスキップされ変換結果が空になる | fixture/migration | 専用ID・参照系のみ。一覧描画には件数>0が必要 | 033 |

注: 一覧ブロック（form_bulk・出力ボタン）は `pagination.totalItemCount>0`（index.twig:464）のとき描画される。検索結果0件環境では UI/未選択系ケースは skip 相当となる。テーブル名・列名は ec-cube-enterprise 正典（`dtb_product.card_detail_id`・`dtb_product_class`）に従う。共通ログインは `config/default.config.ts`。

## 付帯表4：不具合候補（仕様乖離）／要確認

テストは仕様どおりに書き、実装が違えば落ちて検出する。期待値を実装へ書き換えない。

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | 実行時例外(not_registered / no_goods_data)時はフラッシュメッセージ付きでリダイレクト | ProductCsvController.php:139 `addError($e->getMessage())` は namespace 既定=front → flash `eccube.front.error`。admin/alert.twig は `eccube.admin.*` のみ描画 | 例外経路のフラッシュは**管理画面に表示されない可能性が高い**。テストは「CSVを配信せずリダイレクト」を観測し、文言表示は要実機確認 | 030,031 | 不具合候補/要確認 |
| 2 | グッズ商品CSV出力ボタンの送信はPOST | index.twig:471 出力submitに `_token`(CSRF)が無く、コントローラもCSRF未検証（searchForm._token は別フォーム index.twig:212） | 一括公開系(action-submit)はCSRFトークンを持つが、CSV出力submitは未保護。IT-15 CSRF観点は本機能で非該当。要セキュリティ確認 | 004(対象外),011,031,032 | 不具合候補/要確認 |
| 3 | 取得結果が空のとき `admin.csv.error.export.not_registered` | messages.ja.yaml:2244 = 「存在しないカードIDが含まれています。」 | グッズ商品CSVの「商品が存在しない」状況に対し、文言が「カードID」を指し意味的に不整合。要確認 | 031 | 要確認(文言) |
| 4 | 変換結果0行のとき `admin.csv.error.export.no_goods_data` | messages.ja.yaml に当該キーの定義が**見当たらない** | 翻訳キー未定義の場合、生キー文字列がそのまま例外メッセージになる。要確認（定義場所/別ロケール） | 030 | 要確認(翻訳キー) |
| 5 | 設計書のルート名は `m03-04_admin_product_product_goods_csv_export` | 実装ルート名は `admin_product_goods_csv_export`（ProductCsvController.php:109）。パスは一致 `/<route>/product/product_goods_csv_export` | ルートnameは設計書記載と相違（パスは同一）。テストはパスで参照（name非依存） | 010,011,040,041 | 要確認(名称) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口 | 検索結果あり＋商品チェックで出力／ボタンは件数正のときのみ描画／0件は非描画 | 001,004,010 | カバー |
| フロント挙動 | 出力ボタン表示・ids[]チェックボックス・全選択・確認ダイアログ無し・type=submit | 001,002,003,013 | 部分カバー（001/002/003は実装済。013=#trigger_check_all連動はtest.fixmeで未実装・要実機） |
| 処理フロー#2 ids取得・整数化・正整数フィルタ | 0以下/非整数の破棄 | 032 | カバー |
| 処理フロー#3 有効ID0件 responseNoProductIdError | 一覧へリダイレクト＋not_selectメッセージ | 020,021 | カバー |
| 処理フロー#2 ids非配列 | 配列でない場合は空配列とみなす→有効ID0件→リダイレクト | 034 | カバー |
| 処理フロー#6 取得結果空 not_registered／一部のみ取得 | 全不存在=CSV非配信＋リダイレクト／有効ID混在=取得できた商品で配信 | 031,014 | カバー |
| 処理フロー#7 カード詳細あり/規格0スキップ | カード詳細のみ=出力不可／規格0件のみ=出力不可／グッズ混在=グッズのみ配信 | 030,033,015 | 保留（030/033/015はすべてtest.fixmeで未実装。要CARD/NOCLASS/GOODSシード） |
| 処理フロー#8 変換結果0行 no_goods_data | CSV非配信＋リダイレクト（カード詳細あり=030／規格0件=033） | 030,033 | 保留（test.fixmeで未実装・要シード） |
| 実行時例外 Referer分岐 | Referer非空=RefererへリダイレクトCSV非配信 | 035 | カバー |
| 処理フロー#10-12 ストリーム出力・ファイル名・ヘッダ | ダウンロード発火・product_goods_{YmdHis}.csv・text/csv・attachment | 010,011 | カバー |
| 処理フロー#13 ログ記録 | ファイル名を情報ログへ | 050 | 対象外(サーバログ観測外) |
| 出力列とデータの対応 | ヘッダーキー順・規格行展開・カンマ連結 | 012 | 手動(CSV本文) |
| 業務ルール・計算 | 行複製単位(規格ごと1行)・一覧と異なる全規格走査・findBy戻り順 | 012 | 手動(CSV本文) |
| 入力項目(ids[]) | 1件以上の正の商品IDが残ること | 020,032 | カバー |
| エッジケース(未送信/空/文字列のみ) | 一覧へリダイレクト | 020,032 | カバー |
| エッジケース(存在しないIDのみ) | not_registered | 031 | カバー |
| エッジケース(カード詳細あり/規格0のみ) | no_goods_data | 030,033 | 保留（test.fixmeで未実装。カード詳細あり=030／規格0件=033・要シード） |
| エッジケース(Referer欠落かつエラー) | admin_product_pageへリダイレクト | 031 | カバー(Locationで商品一覧パスへのリダイレクトをアサート。page_no厳密値は要実機) |
| データ整合性 | 出力対象は選択IDのみ・一覧表示との差・並び | 012 | 手動(CSV本文) |
| 入出力(成功/失敗) | text/csvストリーム／フラッシュ付きリダイレクト | 010,011,014,020,031 | 部分カバー（成功=DL/text/csv/attachment・失敗=非text/csv＋302リダイレクトは自動化済。例外系031/030/033のフラッシュ"文言"表示はnamespace既定=front疑義(不具合候補#1)で期待値化せず未検証＝要実機） |
| 入出力(出力エンコーディング) | UTF-8時BOM・区切り文字・エンクロージャ・charset変換 | 012e | 手動(CSV本文/バイト検査) |
| DB操作 | 参照系(findBy)・登録更新なし | 012,031 | 手動/間接(DB内部はブラウザ観測外) |
| バリデーション | 正整数のみ対象・取得空エラー・グッズ出力可否 | 032,031,030 | カバー |
| 権限・認可 | 通常管理者は出力可・未ログイン/遮断は到達不可 | 010,040,041 | カバー |
| 画面遷移 | 成功＝ダウンロード／未選択＝admin_product_page／例外＝Referer or admin_product_page | 010,020,031,035 | カバー（例外時の両分岐: Referer欠落=031／Referer非空=035） |
| 試行制限 | （本機能では扱わない） | — | 対象外(設計上なし) |
| ログ・監査 | ファイル名ログ・出してはいけない値の抑止 | 050 | 対象外(サーバログ観測外) |
| セッション | 未選択時リダイレクト先ページ番号を読む・出力は更新しない | 020 | 部分カバー（未選択→商品一覧パスへの302は020で確認。page_noをセッションへ事前設定し戻り先page_no厳密一致を読む検証は未実装＝要実機）/対象外(書込なし＝内部値は観測外) |
| Cookie | 専用Cookie新設なし | — | 対象外(該当なし) |
| 排他制御・トランザクション | 単体ではトランザクション開始なし | — | 対象外(該当なし) |

未カバー・部分カバー・保留はいずれも理由（サーバログ観測外・CSV本文/バイトは手動・DB内部値・設計上機能なし・要シードのtest.fixme未実装・例外フラッシュ文言は不具合候補#1疑義で期待値化せず要実機）を明記済み。「保留」は実体がtest.fixmeのみで自動実行されないことを示し、過大主張を避ける。

注: 本監査での追記E2Eケース（012e/033/034/035）は既存IT母集合（90観点行）の行を新設するものではなく、既存行（034/059/009/010/015/021/083/001 等）へ多重写像する設計書本文由来の補完である。したがって付帯表2/2bの集計（90行・未分類0）は不変。
