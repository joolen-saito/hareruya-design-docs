# m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧） E2Eテストケース

元設計: `function_spec_html_preview/pf-eccube3/m03-08_admin_product_product_product_class_list.html`（正本 `functions/pf-eccube3/m03-08_admin_product_product_product_class_list.md`）

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/m03_08_admin_product_product_product_class_list_it_cases.md`（母集合 計90観点行）

期待結果は画面表示・遷移・URL・HTTP応答などブラウザで観測できる結果で判定する。**期待結果は仕様（設計書・観点表・基本設計）由来**とし、実装/POM由来の表示文言・Form制約をオラクル化しない。TSV は既存IT casesの10列に実施管理欄（実施者・実施日・結果・失敗理由）を加えた14列固定。E2E固有情報は TSV 後の付帯表に `テストID` で対応づける。Playwright は本リポジトリでは実行しない（構造参考のみ）。未検証セレクタは `要実機確認`。

本機能は **参照専用の一覧画面（画面タイプ list）** であり、ユーザー入力欄・送信フォーム・バリデーション・登録/更新の永続書き込みを持たない（設計書「業務ルール・計算」「副作用」「フロント挙動」）。pf-eccube3 のリバース設計だが、刷新先 ec-cube-enterprise に該当画面（`admin/Product/ProductClass/index.twig`・`ProductClassController::index`）が実在し、セレクタを導出できる（screenExists=true）。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-25 | UI部品（タイトル・商品名・件数ヘッダ・列見出し・廃止ブロック）・HTTPステータス(404)・URL(POST一覧描画) |
| IT-03 | 画面遷移（新規登録→/new・行編集→/edit・フッタ戻り商品編集/商品一覧resume=1） |
| IT-13 | URL直接アクセス（未ログイン→管理ログイン誘導） |
| IT-23 | 一覧クエリ結果（active/abolished分離・件数=active集合数・0件空表）。レコード粒度の取得有無は手動/間接 |
| IT-15 | 未認証ガード・対象データ・状態変化(404)。CSRFはFW内部で観測外 |
| IT-20 | ログ出力抑止・識別子＝ブラウザ観測外 |
| IT-22 | 本機能は入力フォーム/バリデーションを持たないため全件対象外 |
| IT-26 | 本機能は登録/更新を行わない（参照専用）。遷移・404・POST描画のみE2E化 |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-001	IT-25	UI部品	P2	一覧画面にタイトル「商品規格一覧」が表示される	管理者ログイン済／SEED-M03-08-ACTIVE	—	1. 一覧URL /{admin_route}/product/product/class/{id} を開く	ウィンドウタイトルに「商品規格一覧」相当の翻訳が表示されること。				
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-002	IT-25	UI部品	P1	ヘッダカードに商品名が表示される	管理者ログイン済／SEED-M03-08-ACTIVE	—	1. 一覧URLを開く	ヘッダカードに対象商品の商品名が表示されること。				
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-003	IT-25	UI部品	P2	検索結果件数ヘッダ「検索結果：…」が表示される	管理者ログイン済／SEED-M03-08-ACTIVE	—	1. 一覧URLを開く	「検索結果：%count%件が該当しました」相当の件数ヘッダが表示されること。				
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-004	IT-25	UI部品	P2	アクティブ一覧の列見出しが仕様どおり表示される	管理者ログイン済／SEED-M03-08-ACTIVE	—	"1. 一覧URLを開く
2. アクティブ一覧テーブルの見出し行を確認する"	公開状態・言語・状態・スマレジ連携フラグ・商品コード・在庫数・販売制限数・基準価格・販売価格・買取価格の見出しが表示されること。				
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-005	IT-25	UI部品	P3	廃止規格一覧ブロック見出しが表示され折りたたみ開閉できる	管理者ログイン済／SEED-M03-08-ACTIVE	—	"1. 一覧URLを開く
2. 「廃止規格一覧」のトグルを押下する"	「廃止規格一覧」見出しが表示され、トグル押下で廃止ブロックが展開されること。				
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-010	IT-25	画面遷移	P1	「新規登録」ボタン押下で規格新規入力(/new)へ遷移する	管理者ログイン済／SEED-M03-08-ACTIVE	—	"1. 一覧URLを開く
2. 「新規登録」ボタンを押下する"	…/product/product/class/{id}/new へ遷移すること。				
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-011	IT-03	画面遷移	P1	行「編集」押下で規格編集(/edit/{productClassId})へ遷移する	管理者ログイン済／SEED-M03-08-ACTIVE	—	"1. 一覧URLを開く
2. 任意の規格行の「編集」を押下する"	…/product/product/class/{id}/edit/{productClassId} へ遷移すること。				
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-012	IT-03	画面遷移	P2	フッタ戻り(return_product_list未指定)が商品編集へ向く	管理者ログイン済／SEED-M03-08-ACTIVE	return_product_list なし	"1. 一覧URLを return_product_list なしで開く
2. フッタの戻りリンクのhrefを確認する"	フッタ戻りリンクが …/product/product/edit/{id}（商品編集）であること。				
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-013	IT-03	画面遷移	P2	return_product_list=1付与でフッタ戻りが商品一覧(resume=1)へ向く	管理者ログイン済／SEED-M03-08-ACTIVE	return_product_list=1	"1. 一覧URLに ?return_product_list=1 を付与して開く
2. フッタの戻りリンクのhrefを確認する"	フッタ戻りリンクが /{admin_route}/product?resume=1（商品一覧）であること。				
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-020	IT-25	HTTPステータス	P1	存在しない商品IDで404となる	管理者ログイン済	不正/未登録の商品ID	1. 不正な商品IDで一覧URLを開く	HTTP応答が404となること。				
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-021	IT-25	URL	P3	一覧URLへPOSTしても一覧描画のみで内容が変わらない	管理者ログイン済／SEED-M03-08-ACTIVE	空ボディのPOST	1. 一覧URLへPOSTを送信する	2xxで一覧が返り、送信ボディを解釈する一覧用フォーム処理が無いこと。				
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-022	IT-13	URL直接アクセス	P1	未ログインで一覧URL直接アクセス時に管理ログイン画面へ誘導される	未ログイン	—	1. 未ログイン状態で一覧URLへ直接アクセスする	管理ログイン画面へ誘導され一覧本文に到達しないこと。				
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-030	IT-25	UI部品	P2	在庫数が無制限の規格行で「無制限」が表示される	管理者ログイン済／SEED-M03-08-UNLIMITED	—	"1. 無制限在庫の規格を含む商品の一覧URLを開く
2. 在庫数セルを確認する"	stock_unlimitedが真の行の在庫数セルに「無制限」が表示されること。				
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-031	IT-23	検索条件	P2	廃止公開状態の規格はアクティブ一覧に出ず廃止一覧に出る	管理者ログイン済／SEED-M03-08-ABOLISHED	—	"1. 廃止規格を含む商品の一覧URLを開く
2. アクティブ一覧と廃止一覧の行を確認する"	公開状態が廃止の規格はアクティブ一覧に現れず廃止一覧にのみ現れること。				
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-032	IT-23	検索条件	P2	件数ヘッダの個数がアクティブ集合の要素数と一致する	管理者ログイン済／SEED-M03-08-ACTIVE(件数既知)	—	"1. 規格件数が既知の商品の一覧URLを開く
2. 件数ヘッダとアクティブ一覧の行数を確認する"	件数ヘッダの数がアクティブ一覧の表示行数と一致すること。				
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-033	IT-23	検索条件	P2	規格0件の商品で件数0・空テーブルとなる	管理者ログイン済／SEED-M03-08-EMPTY	—	1. 規格を持たない商品の一覧URLを開く	件数ヘッダが0件、アクティブ一覧・廃止一覧とも空表であること。				
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-034	IT-25	UI部品	P2	販売制限数が偽評価の規格行は空セルとなる	管理者ログイン済／SEED-M03-08-ACTIVE(sale_limit未設定行)	—	"1. sale_limit未設定の規格を含む商品の一覧URLを開く
2. 販売制限数セルを確認する"	販売制限数が偽評価の行の当該セルが空表示であること。				
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-006	IT-25	UI部品	P2	廃止規格一覧テーブルの列見出しが仕様どおり（公開状態・スマレジ連携フラグ・編集列を省略）	管理者ログイン済／SEED-M03-08-ABOLISHED	—	"1. 廃止規格を含む商品の一覧URLを開く
2. 「廃止規格一覧」を展開し見出し行を確認する"	言語・状態・商品コード・在庫数・販売制限数・基準価格・販売価格・買取価格の見出しのみが表示され、公開状態列・スマレジ連携フラグ列・編集列が無いこと。				
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-035	IT-25	UI部品	P2	スマレジ連携フラグ列が真→ON／偽→OFFの字面で表示される	管理者ログイン済／SEED-M03-08-ACTIVE	—	"1. 一覧URLを開く
2. アクティブ一覧の各行のスマレジ連携フラグ列を確認する"	スマレジ連携フラグセルが真の行は「ON」、偽の行は「OFF」の字面で表示されること。				
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-036	IT-25	UI部品	P2	商品コード未設定の規格行は商品コードセルが空表示	管理者ログイン済／SEED-M03-08-CODE_EMPTY	—	"1. 商品コード未設定の規格を含む商品の一覧URLを開く
2. 商品コードセルを確認する"	商品コードが偽評価（未設定/空）の行の当該セルが空表示であること。				
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-037	IT-25	UI部品	P2	各価格が偽評価の規格行は基準/販売/買取価格セルが空表示	管理者ログイン済／SEED-M03-08-PRICE_EMPTY	—	"1. 価格未設定の規格を含む商品の一覧URLを開く
2. 基準価格・販売価格・買取価格セルを確認する"	価格が偽評価の行の基準価格・販売価格・買取価格セルが空表示であること。				
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-038	IT-23	検索条件	P2	同一規格がアクティブ一覧と廃止一覧に二重掲載されない	管理者ログイン済／SEED-M03-08-ABOLISHED	—	"1. 廃止規格を含む商品の一覧URLを開く
2. アクティブ一覧と廃止一覧の規格行IDを突合する"	同一の規格(productClassId)がアクティブ一覧と廃止一覧の双方には現れないこと。				
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-040	IT-25	副作用	P3	一覧表示・POST後にフラッシュ等の副作用表示が現れない	管理者ログイン済／SEED-M03-08-ACTIVE	空ボディのPOST	"1. 一覧URLをGET表示する
2. 一覧URLへPOSTする
3. フラッシュ/完了メッセージ領域を確認する"	GET/POSTいずれでも登録・更新完了やフラッシュメッセージ等の副作用表示が現れないこと。				
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-050	IT-23	検索条件	P3	visible=falseの規格でも状態・言語・カード状態条件を満たせば一覧に載る	管理者ログイン済／要DB制御	—	"1. visible=falseかつ公開状態≠廃止・言語/カード状態非NULLの規格を用意する
2. 一覧URLを開きアクティブ一覧を確認する"	visibleフラグによる除外は行われず、当該規格がアクティブ一覧に現れること。				
m03-08_admin_product_product_product_class_list（管理画面_商品管理_商品規格一覧）	E2E-M03-08-051	IT-23	検索条件	P3	公開状態NULLの規格はアクティブ/廃止いずれにも載らず件数に含まれない	管理者ログイン済／要DB制御	—	"1. 公開状態がNULLの規格を用意する
2. 一覧URLを開き両一覧と件数を確認する"	公開状態がNULLの規格はアクティブ一覧・廃止一覧のいずれにも現れず、件数にも含まれないこと。				
```

## 付帯表1：E2E自動化区分・セレクタ・仕様根拠・元ITケースID（TSV外）

DOM/セレクタは `src/Eccube/Resource/template/admin/Product/ProductClass/index.twig` 由来の位置情報のみ。ルートは `ProductClassController.php`（admin_product_product_class :72 / _new :102 / _edit :174）。文言はロケール `messages.ja.yaml` の trans キー由来。期待値（合否）は設計書・観点表由来でオラクル化し、実装挙動・Form制約を流用しない。

| テストID | E2E可否 | 対象セレクタ（根拠 file:line / 要実機確認） | 仕様根拠 | 元ITケースID(代表) |
|----------|---------|----------------------------------------------|----------|--------------------|
| E2E-M03-08-001 | E2E自動化(要シード) | block title trans `admin.product.product_class_list`(index.twig:15 / messages.ja.yaml:1726) | フロント挙動(表示要素・ウィンドウタイトル) | 008,072,088 |
| E2E-M03-08-002 | E2E自動化(要シード) | #ex-product_class-header .card-title `{{ Product.name }}`(index.twig:23,29) | 利用者視点の入口(ヘッダに商品名) | 002,018,050,066,082 |
| E2E-M03-08-003 | E2E自動化(要シード) | trans `admin.common.search_result`(index.twig:44 / messages.ja.yaml:1538) | フロント挙動(検索結果件数ヘッダ) | 008 |
| E2E-M03-08-004 | E2E自動化(要シード) | #ex-product_class thead th(index.twig:53-62 / messages.ja.yaml:1849,1983,1987,1992,1889,1881,1893,1996,1878,1997) | フロント挙動(テーブル列) | 008,040 |
| E2E-M03-08-005 | E2E自動化(要シード) | 見出し trans `admin.product.abolished_product_class`(index.twig:120 / messages.ja.yaml:1931) / トグル a[href="#abolishedProductClass"](index.twig:124) / #abolishedProductClass(index.twig:131) | フロント挙動(JS: Bootstrap折りたたみ・廃止ブロック) | 008 |
| E2E-M03-08-010 | E2E自動化(要シード) | link「新規登録」trans `admin.common.registration__new`→url admin_product_product_class_new(index.twig:32-33 / messages.ja.yaml:1437) | 画面遷移(…/class/{id}/new) | 004,012,020,036,052,068,076,084 |
| E2E-M03-08-011 | E2E自動化(要シード) | #ex-product_class link「編集」trans `admin.common.edit`→url admin_product_product_class_edit(index.twig:105-106 / messages.ja.yaml:1439) | 画面遷移(…/class/{id}/edit/{productClassId}) | 005,021,037,053,069,085 |
| E2E-M03-08-012 | E2E自動化(要シード) | .c-conversionArea a.c-baseLink→url admin_product_product_edit(index.twig:194) | 画面遷移(return_product_list偽→商品編集) | — |
| E2E-M03-08-013 | E2E自動化(要シード) | .c-conversionArea a.c-baseLink→url admin_product{resume:1}(index.twig:188-189) | 画面遷移(return_product_list真→商品一覧resume=1) | 003,019,035,067,083 |
| E2E-M03-08-020 | E2E自動化 | HTTP応答ステータス(ProductClassController.php:74 Product引数解決不可→NotFoundHttpException :46,70) | エラー処理(商品ID解決不可→404) | 006,022,038,070,086 |
| E2E-M03-08-021 | E2E自動化(要シード) | HTTP応答(POST /class/{id}・Controller.php:72 methods GET/POST・index は配列返却のみ) | 利用者視点の入口/副作用(POSTは一覧組み立てのみ) | 007,023,039,055,071,087 |
| E2E-M03-08-022 | E2E自動化(資格情報不要) | 管理ログイン画面 #login_id(admin/login.twig:26 form_widget login_id / login.page.ts:21) | アクセス可否(未ログインは一覧本文に到達しない) | 002,021,051 |
| E2E-M03-08-030 | E2E自動化(要シード) | 在庫数セル trans `admin.product.stock_unlimited__short`(index.twig:87,160 / messages.ja.yaml:1935) | 一覧表示の列と値(stock_unlimited真→無制限) | 010,058,090 |
| E2E-M03-08-031 | E2E自動化(要シード) | #ex-product_class tbody / #abolishedProductClass tbody(index.twig:67-,154-) | 集計条件/データ整合性(display_status=3で一方のみ) | 059,060 |
| E2E-M03-08-032 | E2E自動化(要シード件数既知) | trans `admin.common.search_result`(%count%=ActiveProductClasses|length, index.twig:44) | 集計条件(件数=アクティブ集合長) | 073 |
| E2E-M03-08-033 | E2E自動化(要シード) | 空 tbody / 件数0(index.twig:67-,44) | エラー処理(0件→空tbody・count=0) | 074 |
| E2E-M03-08-034 | E2E自動化(要シード) | 販売制限数セル `{{ ProductClass.sale_limit ? ... : '' }}`(index.twig:93,166) | 一覧表示の列と値(販売制限数 偽評価→空文字) | 011,043 |
| E2E-M03-08-006 | E2E自動化(要シード) | #abolishedProductClass thead th(index.twig:135-142：言語/状態/商品コード/在庫数/販売制限数/基準価格/販売価格/買取価格＝公開状態・スマレジ・編集列なし) | フロント挙動(廃止表の列構成・省略列) | 008,059 |
| E2E-M03-08-035 | E2E自動化(要シード) | #ex-product_class スマレジ列セル `{{ ProductClass.smaregiAlignmentFlg ? 'ON' : 'OFF' }}`(index.twig:80) | 一覧表示の列と値(スマレジ 真→ON/偽→OFF＝設計書字面固定) | 008,040 |
| E2E-M03-08-036 | E2E自動化(要シード) | #ex-product_class 商品コードセル `{{ ProductClass.code ? ProductClass.code : '' }}`(index.twig:83) | 一覧表示の列と値(商品コード 偽評価→空) | 062-071 |
| E2E-M03-08-037 | E2E自動化(要シード) | 価格セル standardPrice/price02/buy_price `{{ ... ? ...|number_format : '' }}`(index.twig:96,99,102) | 一覧表示の列と値(価格 偽評価→空) | 075,077 |
| E2E-M03-08-038 | E2E自動化(要シード) | tr[id^="ex-product_class-"] のID突合(#ex-product_class tbody:67- / #abolishedProductClass tbody:148-) | データ整合性(二重計上しない＝各行は一方のみ) | 059,060 |
| E2E-M03-08-040 | 手動/間接 | 共通フラッシュ領域 .alert/[role=alert]（本一覧テンプレートに該当要素の根拠なし＝要実機確認） | 副作用(DB更新/フラッシュ/一覧専用セッション書き込みなし) | 080,081,082,087 |
| E2E-M03-08-050 | 手動/間接 | 要DB制御（visible=false行のクエリ包含。Twig側に可視判定の根拠なし＝要実機確認） | 集計条件(visibleフィルタ非適用) | 062-071 |
| E2E-M03-08-051 | 手動/間接 | 要DB制御（公開状態NULL行の両表非掲載。件数=ActiveProductClasses|length, index.twig:44） | 集計条件/データ整合性(公開状態NULL→両表非掲載・件数不算入) | 062-071,074 |

注: 既存IT cases（接頭辞 `IT-M03-08-ADMIN-PRODUCT-PRODUCT-PRODUCT-CLASS-LIST-NNN`）は観点名のみの定型自動生成スタブであり、操作手順・期待結果が機能固有でない。本E2Eは設計書本文（利用者視点の入口・処理フロー・集計条件・一覧表示の列と値・画面遷移・エラー処理）を一次情報源として網羅した。行単位の全量分類は付帯表2bが正本。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合の正本は、本機能の観点表インスタンス＝既存 `m03_08_admin_product_product_product_class_list_it_cases.md`（90行）とする。`integration-test-viewpoints.md`（517行）は機能横断の観点カテゴリ定義であり、本機能に該当する観点行をこの90行へ写像済みの位置づけ（IT-22の入力系35行は本機能が参照専用一覧のため全て非該当＝対象外で監査可能）。したがって監査の母集合は90行で全行分類する。母集合は既存ITの関連ID件数（IT-22=35／IT-23=22／IT-26=10／IT-25=9／IT-03=7／IT-15=4／IT-20=2／IT-13=1＝計90）。各観点行を E2E自動化／手動・間接／対象外(理由) に振り分ける。

| IT-ID | 母集合 | E2E自動化 | 手動/間接 | 対象外 | 対象外/手動の主な理由 |
|-------|:-----:|:--------:|:--------:|:------:|------------------|
| IT-22 | 35 | 0 | 0 | 35 | 本機能は参照専用一覧で入力欄・送信フォーム・バリデーションを持たない（設計書「業務ルール・計算」「フロント挙動」）。必須/文字列長/数値/文字種/相関/部分入力は全て非該当 |
| IT-23 | 22 | 5 | 16 | 1 | active/abolished分離・件数・0件は観測可でE2E化。レコード粒度の取得有無（NULL除外・並び順）は要DB制御で手動/間接。商品登録画面側導線は別機能委譲 |
| IT-26 | 10 | 6 | 1 | 3 | 本機能は登録/更新を行わない。遷移・404・POST描画はE2E、並び順は手動/間接、レコード追加観点は対象外 |
| IT-25 | 9 | 7 | 1 | 1 | UI部品・404・POST描画はE2E。並び順は手動/間接。商品登録画面側の送信可否制御は別機能委譲 |
| IT-03 | 7 | 3 | 0 | 4 | 画面遷移はE2E。トランザクション/ロック/例外/DBスキーマは観測外 |
| IT-15 | 4 | 3 | 0 | 1 | 未認証・対象データ・状態変化(404)はE2E。CSRFはSymfony Form内部で観測外 |
| IT-20 | 2 | 0 | 0 | 2 | ログ出力抑止・識別子はブラウザ観測外 |
| IT-13 | 1 | 1 | 0 | 0 | URL直接アクセス(未ログイン誘導) |
| 合計 | 90 | 25 | 18 | 47 | **未分類 0** |

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-15 | CSRF | 対象外 | CSRFはSymfony Form内部で完結しブラウザ観測外（本機能はCSRF付き一覧内フォーム送信をしない＝設計書「ログと秘匿情報」） |
| 002 | IT-15 | 未認証 | E2E自動化 | 022（未ログイン→管理ログイン誘導）／002（商品名ヘッダ） |
| 003 | IT-15 | 対象データ | E2E自動化 | 013（return_product_list→resume=1） |
| 004 | IT-20 | 出力抑止 | 対象外 | ログ出力抑止はブラウザ観測外（新規登録遷移は010でカバー） |
| 005 | IT-20 | 識別子 | 対象外 | ログ識別子はブラウザ観測外（規格編集遷移は011でカバー） |
| 006 | IT-15 | 状態変化 | E2E自動化 | 020（存在しない商品ID→404） |
| 007 | IT-25 | UI部品 | E2E自動化 | 021（一覧URLへPOST→描画のみ） |
| 008 | IT-25 | UI部品 | E2E自動化 | 001（タイトル「商品規格一覧」）／003／004 |
| 009 | IT-25 | 操作起点 | 手動/間接 | 並び順（言語昇順→カード状態昇順→売価降順→主キー昇順）は多数規格シードを要し要DB制御 |
| 010 | IT-25 | 確認ダイアログ | E2E自動化 | 030（在庫数「無制限」表示） |
| 011 | IT-25 | 確認ダイアログ | E2E自動化 | 034（販売制限数 偽評価→空セル） |
| 012 | IT-25 | 確認ダイアログ | E2E自動化 | 010（新規登録→/new） |
| 013 | IT-25 | 送信可否制御 | 対象外 | 商品登録画面上の確認付き規格一覧導線は別機能（商品登録画面 m03-07系）へ委譲 |
| 014 | IT-03 | 外部画面 | 対象外 | トランザクション境界は内部処理でブラウザ観測外（本機能は明示トランザクション無し） |
| 015 | IT-03 | 画面遷移 | 対象外 | ロック未使用は内部実装でブラウザ観測外 |
| 016 | IT-03 | 画面遷移 | 対象外 | 例外時の出力未完了は内部挙動でブラウザ観測外 |
| 017 | IT-03 | 画面遷移 | 対象外 | language_id/card_condition_id統合はDBスキーマでブラウザ観測外（移行仕様） |
| 018 | IT-03 | 画面遷移 | E2E自動化 | 002（ヘッダ商品名） |
| 019 | IT-03 | 画面遷移 | E2E自動化 | 013（return_product_list→resume=1） |
| 020 | IT-03 | 画面遷移 | E2E自動化 | 010（新規登録→/new） |
| 021 | IT-13 | URL直接アクセス | E2E自動化 | 022（未ログイン直接アクセス誘導）。本観点（URL直接アクセス）の実体は022のみ。011（行編集）はリンク押下による画面遷移で観点が異なるため紐づけを是正（誤紐づけ除去） |
| 022 | IT-25 | HTTPステータス | E2E自動化 | 020（404） |
| 023 | IT-25 | URL | E2E自動化 | 021（一覧URLへPOST→描画のみ） |
| 024-025 | IT-22 | 必須バリデーション | 対象外 | 本機能は入力欄・必須項目を持たない参照専用一覧（2行） |
| 026-031 | IT-22 | 文字列長バリデーション | 対象外 | 入力欄が無く文字列長バリデーション非該当（6行） |
| 032-039 | IT-22 | 数値バリデーション | 対象外 | 入力欄が無く数値バリデーション非該当（8行） |
| 040-041 | IT-22 | 文字種バリデーション | 対象外 | 入力欄が無く文字種バリデーション非該当（2行） |
| 042-050 | IT-22 | その他のバリデーション | 対象外 | 入力欄が無く該当する細目なし（9行） |
| 051-054 | IT-22 | 相関バリデーション | 対象外 | 入力欄が無く相関バリデーション非該当（4行） |
| 055-056 | IT-22 | DBとの相関バリデーション | 対象外 | 入力欄が無くDB相関バリデーション非該当（2行） |
| 057 | IT-22 | 必須制御 | 対象外 | 入力欄が無く必須制御非該当（並び順は009で手動/間接） |
| 058 | IT-22 | 部分入力 | 対象外 | 入力欄が無く部分入力非該当（無制限表示は010/030でカバー） |
| 059 | IT-23 | 検索条件 | E2E自動化 | 031（アクティブ集合に該当規格が出る） |
| 060 | IT-23 | 検索条件 | E2E自動化 | 031（廃止/除外規格はアクティブ集合に出ない） |
| 061 | IT-23 | 検索条件 | 対象外 | 商品登録画面側の確認付き導線は別機能へ委譲 |
| 062-071 | IT-23 | 検索条件 | 手動/間接 | レコード粒度の取得有無（NULL除外・公開状態判定）は要DB制御で間接確認（10行） |
| 072 | IT-23 | 検索条件 | E2E自動化 | 001（タイトル表示） |
| 073 | IT-23 | 検索条件 | 手動/間接 | 件数=アクティブ集合長は032でE2E化だが個別レコード含有は要DB制御（→手動/間接側に計上） |
| 074 | IT-23 | 検索条件 | 手動/間接 | 除外レコードが結果に含まれないことは要DB制御の間接確認 |
| 075 | IT-23 | 実行結果 | 手動/間接 | 取得結果のレコード含有は要DB制御 |
| 076 | IT-23 | 実行結果 | E2E自動化 | 010（新規登録→/new） |
| 077-079 | IT-23 | 実行結果 | 手動/間接 | 取得結果のレコード含有は要DB制御（3行） |
| 080 | IT-26 | 登録内容 | 対象外 | 本機能は登録(レコード追加)を行わない参照専用 |
| 081 | IT-26 | 登録内容 | 対象外 | 同上（登録なし＝追加されない自明） |
| 082 | IT-26 | 登録内容 | 対象外 | 同上（登録なし） |
| 083 | IT-26 | 登録内容 | E2E自動化 | 013（return_product_list→resume=1） |
| 084 | IT-26 | 登録内容 | E2E自動化 | 010（新規登録→/new） |
| 085 | IT-23 | 登録内容 | E2E自動化 | 011（行編集→/edit） |
| 086 | IT-26 | 登録内容 | E2E自動化 | 020（404） |
| 087 | IT-26 | 登録内容 | E2E自動化 | 021（POST→描画のみ） |
| 088 | IT-26 | 登録内容 | E2E自動化 | 001（タイトル表示） |
| 089 | IT-26 | 登録内容 | 手動/間接 | 並び順は要多数規格シードで手動/間接 |
| 090 | IT-26 | 登録内容 | E2E自動化 | 030（在庫数「無制限」表示） |

集計（付帯表2と一致）: 自動化 25（002,003,006,007,008,010,011,012,018,019,020,021,022,023,059,060,072,076,083,084,085,086,087,088,090）／ 手動・間接 18（009,062-071=10,073,074,075,077,078,079=3,089）／ 対象外 47（残り：001,004,005,013,014,015,016,017,024-058=35,061,080,081,082）。**未分類 0**。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-M03-08-ADMIN | dtb_member(管理者) | 当画面へ到達できる管理者1（2FA等無効）。ID/PWは config 既定 | fixture(config既定) | 既存利用・撤去不要 | 全認証必須ケース |
| SEED-M03-08-ACTIVE | dtb_product + dtb_product_class | アクティブ規格を1件以上持つ商品1（公開状態≠廃止／language_id・card_condition_id 非NULL）。商品名・規格編集IDが既知 | fixture/migration | 専用商品・参照のみ（更新しない）・撤去 | 001,002,003,004,005,010,011,012,013,021,032 |
| SEED-M03-08-ABOLISHED | dtb_product_class | 同一商品にアクティブ規格＋公開状態=廃止(マスタ値3)の規格を併存。いずれも language/card_condition 非NULL | fixture/migration | 専用商品・参照のみ・撤去 | 031 |
| SEED-M03-08-UNLIMITED | dtb_product_class | stock_unlimited=true の規格を含む商品1 | fixture/migration | 専用商品・参照のみ・撤去 | 030 |
| SEED-M03-08-EMPTY | dtb_product | 規格が1件もクエリヒットしない商品1（アクティブ・廃止とも0件） | fixture/migration | 専用商品・参照のみ・撤去 | 033 |
| SEED-M03-08-SALE_LIMIT_EMPTY | dtb_product_class | 先頭アクティブ行の sale_limit が偽評価（未設定/0）の規格を持つ商品1 | fixture/migration | 専用商品・参照のみ・撤去 | 034 |
| SEED-M03-08-CODE_EMPTY | dtb_product_class | 商品コード(code)が偽評価（未設定/空）のアクティブ規格を持つ商品1 | fixture/migration | 専用商品・参照のみ・撤去 | 036 |
| SEED-M03-08-PRICE_EMPTY | dtb_product_class | 基準/販売/買取価格が偽評価（未設定/0）のアクティブ規格を持つ商品1 | fixture/migration | 専用商品・参照のみ・撤去 | 037 |
| SEED-M03-08-MISSING | （未登録ID） | 未登録/不正な商品ID（既存と衝突しない極大値）。レコード不要 | synthetic(値のみ) | 不要 | 020 |

注: 商品ID・規格ID・件数はテスト環境変数で受け渡す（`PCLASS_PRODUCT_ID`=ACTIVE／`PCLASS_MISSING_ID`=MISSING／`PCLASS_UNLIMITED_ID`=UNLIMITED／`PCLASS_ABOLISHED_ID`=ABOLISHED／`PCLASS_EMPTY_ID`=EMPTY／`PCLASS_SALE_LIMIT_EMPTY_ID`=先頭アクティブ行の sale_limit 偽評価商品／`PCLASS_CODE_EMPTY_ID`=CODE_EMPTY／`PCLASS_PRICE_EMPTY_ID`=PRICE_EMPTY）。env 未設定の値依存テストは spec 側で `test.skip`（理由付き）し、抜け漏れは本表で可視化する。`migration` を充てる場合 DB=ec-cube-enterprise 正典（reverse-design 1c）に従う。本機能は参照専用のため後始末はデータ撤去のみで副作用クリーンアップ不要。

## 付帯表4：不具合候補（仕様乖離）／要確認

テストは仕様どおりに書き、実装が違えば落ちて検出する。期待値を実装へ書き換えない。

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | 設計書(pf-eccube3)は言語・カード状態を補助表 dtb_product_sub_class で参照。移行先は dtb_product_class へ統合 | index.twig:74,82,135-136(ProductClass.Language/CardCondition) | 移行仕様どおり統合済（補助表廃止）。表示観点は同等＝要確認のみ（観測差異なし） | 004,017 | 要確認(移行差分・観測同等) |
| 2 | ウィンドウタイトルは「商品規格一覧」 | block title `admin.product.product_class_list`(index.twig:15) は <title> 出力。画面上見出しは sub_title「商品管理」 | <title>と画面見出しの出し分け。E2E001は document title で判定（h2見出しではない）＝要実機確認 | 001 | 要確認(出力位置) |
| 3 | 一覧URLへのPOSTは一覧組み立てのみ（送信ボディ非解釈） | Controller.php:72 methods=['GET','POST']／index は配列返却のみ（フォーム未構築） | 静的確認済。CSRF不要でPOST可・2xx応答。実機での応答コード/本文一致は要確認 | 021 | 要確認(応答) |
| 4 | 検索結果件数=アクティブ集合長 | index.twig:44 `%count%`=ActiveProductClasses|length | 件数ヘッダの数とDOM表示行数の一致は要シード（件数既知商品）。NULL除外で行が0になる境界は手動/間接 | 003,032,033 | 要確認(要シード) |
| 5 | フッタ戻りは return_product_list 真偽で商品一覧(resume=1)/商品編集に分岐 | index.twig:188-194 | 静的確認済。href属性で判定。実機リンク文言/href一致は要確認 | 012,013 | 要確認(セレクタ) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口 | 一覧URL表示・商品名ヘッダ・新規登録/編集導線・404・POST・return_product_list分岐 | 001,002,010,011,012,013,020,021 | カバー |
| フロント挙動(表示要素) | タイトル・商品名・件数ヘッダ・列見出し・廃止ブロック見出し | 001,002,003,004,005 | カバー |
| フロント挙動(廃止表の列構成) | 廃止一覧は公開状態・スマレジ・編集列を省略し他列を持つ | 006 | カバー(要シード) |
| フロント挙動(サブタイトル/メニュー状態) | sub_title「商品管理」(index.twig:16)・サイドメニューのアクティブ状態 | （共通レイアウト位置依存・要実機確認） | 手動/間接(共通部品・位置依存) |
| 一覧表示の列と値(商品コード空表示) | code 偽評価→空セル（index.twig:83） | 004(見出し)／036(空セル) | カバー(要シード) |
| フロント挙動(JS: 折りたたみ) | 廃止ブロックのBootstrap collapse開閉 | 005 | カバー |
| フロント挙動(モーダル無し) | 一覧テンプレートにモーダル無し | （該当部品なし＝対象外） | 対象外(部品なし) |
| 処理フロー(active/abolished取得) | 廃止公開状態の振り分け・件数 | 031,032 | 一部カバー(公開状態は031・visible非適用は050/公開状態NULLは051で手動/間接) |
| 集計条件(visibleフィルタ非適用) | visible=falseでも状態/NULL条件充足で掲載 | 050 | 手動/間接(要DB制御) |
| 集計条件(件数=active長) | 「検索結果」件数 | 032 | カバー(要シード・fixme) |
| 集計条件(並び順) | 言語昇順→カード状態昇順→売価降順→主キー昇順 | 009相当 | 手動/間接(多数規格シード要) |
| 一覧表示の列と値(在庫数) | stock_unlimited真→「無制限」 | 030 | カバー(要シード・fixme) |
| 一覧表示の列と値(販売制限数) | 偽評価→空セル | 034 | カバー(要シード・fixme) |
| 一覧表示の列と値(価格 number_format) | 偽相当→空／それ以外 number_format | 037(空セル)／数値整形(number_format形式)は手動/間接 | 一部カバー(空セルは037・数値整形は値依存で手動/間接) |
| 一覧表示の列と値(スマレジ ON/OFF) | フラグ真→ON・偽→OFF（設計書字面固定） | 004(見出し)／035(ON/OFF値) | カバー(要シード) |
| 一覧表示の列と値(公開状態/言語/状態/コード) | マスタ名/nameJp/code/空 | 004(見出し)／036(コード空)／公開状態名・nameJp・code値は手動/間接 | 一部カバー(コード036・他値は手動/間接) |
| データ整合性(二重計上しない) | 各行は active/abolished 一方のみ | 031,038(同一productClassIdが両表非掲載) | カバー(要シード) |
| データ整合性(NULL欠落行は両表非掲載) | language/card/公開状態 NULLは両表に出ない | 051(公開状態NULL)／language/card NULLは要DB制御 | 手動/間接(要DB制御) |
| 画面遷移(新規登録) | …/class/{id}/new | 010 | カバー |
| 画面遷移(行編集) | …/class/{id}/edit/{productClassId} | 011 | カバー |
| 画面遷移(フッタ戻り) | return_product_list偽→商品編集／真→商品一覧resume=1 | 012,013 | カバー |
| 画面遷移(商品登録画面の確認付き導線) | 同ルート名でid渡す確認付きリンク | （別機能 商品登録画面へ委譲） | 対象外(委譲) |
| エラー処理(404) | 商品ID解決不可→404 | 020 | カバー |
| エラー処理(0件) | 空tbody・件数0 | 033 | カバー(要シード・fixme) |
| 副作用(POST非解釈) | 一覧URLへのPOSTは描画のみ | 021 | カバー |
| 副作用(DB更新/フラッシュ無し) | GET/POST後にフラッシュ/完了表示・DB更新が無い | 040(フラッシュ不在)／DB件数・セッション差分は要DB制御 | 手動/間接(フラッシュ不在はDOM観測可だが共通領域セレクタ要実機確認) |
| 排他制御・トランザクション | 明示トランザクション無し・ロック無し・例外時 | （内部・観測外） | 対象外(観測外) |
| API／バッチ結果 | 外部API/バッチ起動なし | （非該当） | 対象外(非該当) |
| アクセス可否(未ログイン) | 未ログイン→管理ログイン誘導 | 022 | カバー |
| アクセス可否(ログイン済み到達) | 一覧テンプレート返却 | 001 | カバー |
| ログと秘匿情報 | クエリログ詳細は運用設定依存・CSRF一覧フォーム送信なし | （観測外） | 対象外(観測外) |

未カバーはいずれも理由（部品なし・別機能委譲・観測外・値依存で手動/間接・要シードでfixme・非該当）を明記済み。判定の正本は付帯表2b（全90行・未分類0）。
