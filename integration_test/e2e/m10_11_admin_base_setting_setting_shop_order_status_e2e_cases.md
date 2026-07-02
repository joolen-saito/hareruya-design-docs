# m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定） E2Eテストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m10-11_admin_base_setting_setting_shop_order_status.html`（正本 `functions/ec-cube-enterprise/m10-11_admin_base_setting_setting_shop_order_status.md`）

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/m10_11_admin_base_setting_setting_shop_order_status_it_cases.md`（母集合 計90観点行）

期待結果は画面表示・遷移・URL・成功/エラーメッセージ・(間接)DB再表示などブラウザで観測できる結果で判定する。**期待結果は仕様（設計書・観点表・基本設計）由来**とし、実装/POM由来の表示文言をオラクル化しない。TSV は既存IT casesと同一の 10 列固定。E2E固有情報（セレクタ・自動化区分・仕様根拠・シード・不具合候補）は TSV 後の付帯表に `テストID` で対応づける。Playwright は本リポジトリでは実行しない（構造参考のみ）。未検証セレクタは `要実機確認`。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-15 | 未認証ガード・対象データ（全ステータス行表示）・状態変化（見出し表示） |
| IT-20 | 出力抑止・識別子（ログ抑止＝ブラウザ観測外） |
| IT-25 | UI部品（列ヘッダ・入力欄・色ウィジェット・件数トグル・ツールチップ）・操作起点・ID参照表示・再表示 |
| IT-03 | クロスエンティティ更新（name/件数/マイページ名の上書き＝間接再表示）・検証失敗時DB不変 |
| IT-13 | URL直接アクセス（未認証→管理ログイン誘導） |
| IT-22 | 必須バリデーション・最大長境界・必須制御・部分入力（本機能は数値/文字種/相関/DB相関を持たない） |
| IT-23 | 本機能はDB検索を行わない（検索条件・実行結果は対象外）・権限403はシード前提 |
| IT-26 | 登録/更新（保存成功フラッシュ・更新値再表示・件数表示更新） |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-001	IT-15	状態変化	P1	画面見出し「受注対応状況設定」が表示される	管理ログイン済／SEED-M10-11-ADMIN	—	"1. 管理ログインする
2. 受注対応状況設定画面（/setting/shop/order_status）をGET表示する"	ページ見出しとして「受注対応状況設定」が表示されること。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-002	IT-25	UI部品	P2	サブ見出し「基本情報設定」が表示される	管理ログイン済／SEED-M10-11-ADMIN	—	"1. 受注対応状況設定画面を表示する"	サブ見出しとして「基本情報設定」が表示されること。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-003	IT-15	対象データ	P1	全ステータス行が表示され各行ID・登録ボタンが見える	管理ログイン済／SEED-M10-11-ADMIN	—	"1. 受注対応状況設定画面を表示する"	全受注ステータス行がテーブル表示され、各行のID参照値と「登録」ボタンが表示されること。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-004	IT-25	UI部品	P2	列ヘッダ5列と各行4入力欄が表示される	管理ログイン済／SEED-M10-11-ADMIN	—	"1. 受注対応状況設定画面を表示する"	列ヘッダが左からID・名称(マイページ)・名称(受注管理)・色・件数表示の5列で表示され、各行に4種の入力欄があること。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-005	IT-25	UI部品	P3	色入力ウィジェットにform-control-colorが付与される	管理ログイン済／SEED-M10-11-ADMIN	—	"1. 受注対応状況設定画面を表示する
2. 色入力欄の属性を確認する"	色入力ウィジェットにform-control-colorが付与され、ブラウザ標準のカラーピッカーで選色できること。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-006	IT-25	UI部品	P3	件数表示がチェックボックス（トグル）で表示される	管理ログイン済／SEED-M10-11-ADMIN	—	"1. 受注対応状況設定画面を表示する
2. 件数表示欄の種別を確認する"	件数表示がトグルスイッチ（type=checkbox）で表示されること。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-007	IT-25	送信可否制御	P2	ID列は参照表示で入力欄を持たない	管理ログイン済／SEED-M10-11-ADMIN	—	"1. 受注対応状況設定画面を表示する
2. ID列セルを確認する"	ID列は参照表示のみで入力要素を持たず、編集できないこと。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-008	IT-25	UI部品	P3	カードヘッダ見出しとツールチップ質問アイコンが表示される	管理ログイン済／SEED-M10-11-ADMIN	—	"1. 受注対応状況設定画面を表示する"	カードヘッダに見出し「受注対応状況」と質問アイコン（ツールチップ）が表示されること。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-010	IT-26	登録内容	P1	登録成功で成功フラッシュ「保存しました」が表示される	管理ログイン済／SEED-M10-11-MUTABLE（使い捨て）	名称(受注管理)を有効な一時値に更新	"1. 受注対応状況設定画面を表示する
2. 任意行の名称(受注管理)を有効値で更新
3. 「登録」を押下する"	成功フラッシュ「保存しました」が表示されること。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-011	IT-26	更新内容	P1	登録成功後に同一画面へリダイレクトし更新値で再表示される	管理ログイン済／SEED-M10-11-MUTABLE（使い捨て）	名称(受注管理)を有効な一時値に更新	"1. 名称(受注管理)を更新し「登録」を押下
2. リダイレクト後のGET再表示を確認する"	受注対応状況設定画面へリダイレクトされ、更新後マスタ値が入力欄に再表示されること。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-012	IT-03	画面遷移	P2	件数表示トグル更新でdisplay_order_countが反映され成功する	管理ログイン済／SEED-M10-11-MUTABLE（使い捨て）	件数表示トグルをオン/オフ	"1. 任意行の件数表示トグルを切り替える
2. 「登録」を押下し再表示を確認する"	保存に成功し、再表示で件数表示トグルの状態がmtb_order_status.display_order_countへ反映されていること。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-020	IT-22	必須バリデーション	P1	名称(受注管理)未入力で登録すると必須エラーで滞留する	管理ログイン済／SEED-M10-11-ADMIN	名称(受注管理)＝空	"1. 任意行の名称(受注管理)を空にする
2. 「登録」を押下する"	「入力されていません。」が表示され、同一画面に滞留しflushされないこと。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-021	IT-22	必須バリデーション	P2	名称(マイページ)未入力で登録すると必須エラーで保存されない	管理ログイン済／SEED-M10-11-ADMIN	名称(マイページ)＝空	"1. 任意行の名称(マイページ)を空にする
2. 「登録」を押下する"	「入力されていません。」が表示され、成功フラッシュが出ず保存されないこと。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-022	IT-22	必須バリデーション	P2	色未入力で登録すると必須エラーで保存されない	管理ログイン済／SEED-M10-11-ADMIN	色＝空	"1. 任意行の色入力を空にする
2. 「登録」を押下する"	「入力されていません。」が表示され、成功フラッシュが出ず保存されないこと。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-023	IT-22	文字列長バリデーション	P2	名称(受注管理)最大長255文字はエラーにならず保存できる	管理ログイン済／SEED-M10-11-MUTABLE（使い捨て）	名称(受注管理)＝255文字	"1. 任意行の名称(受注管理)に255文字を入力
2. 「登録」を押下する"	エラーにならず保存に成功すること（最大長255は境界内）。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-024	IT-22	文字列長バリデーション	P1	名称(受注管理)最大長+1(256文字)はエラーで保存されない	管理ログイン済／SEED-M10-11-ADMIN	名称(受注管理)＝256文字	"1. 任意行の名称(受注管理)に256文字を入力
2. 「登録」を押下する"	最大長超過によりエラーとなり、成功フラッシュが出ず保存されないこと。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-025	IT-22	部分入力	P2	行フォームに一部だけ入力して送信しても部分保存されない	管理ログイン済／SEED-M10-11-ADMIN	1行の必須を欠いた状態	"1. 任意行の必須項目を1つ空にする
2. 「登録」を押下する"	サーバ側検証でエラーとなり、正常項目だけが部分保存されないこと。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-030	IT-13	URL直接アクセス	P1	未認証で当画面URLへ直接アクセスすると管理ログイン画面へ誘導される	未ログイン	—	"1. 未ログインで /setting/shop/order_status へ直接アクセスする"	管理ログイン画面へ誘導されること。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-031	IT-23	実行結果	P1	店舗系権種(tenant_owner)でGETすると認可失敗でHTTP 403になる	tenant_owner権種でログイン済／SEED-M10-11-TENANT	—	"1. tenant_owner権種でログインする
2. /setting/shop/order_status をGETする"	管理共通の認可失敗としてHTTP 403となること。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-040	IT-03	画面遷移	P3	関連行(CustomerOrderStatus/OrderStatusColor)欠損時は当該列が値未セットで表示される	管理ログイン済／SEED-M10-11-MISSING（関連行欠損）	—	"1. 関連行が欠損したステータス行のある状態で画面を表示する
2. 欠損側の列の初期値を確認する"	欠け側の列は初期表示で値未セットのまま表示されること（間接確認）。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-009	IT-03	画面遷移	P2	名称(マイページ)・色がGET初期表示で関連テーブル由来値で表示される	管理ログイン済／SEED-M10-11-ADMIN	—	"1. 受注対応状況設定画面を表示する
2. 名称(マイページ)・色入力欄の初期値を確認する"	関連行が揃うステータス行で、名称(マイページ)欄・色欄に初期値（POST_SET_DATAで埋まる mtb_customer_order_status.name／mtb_order_status_color.name 由来）が空でなくセットされていること。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-013	IT-03	画面遷移	P1	名称(マイページ)を有効値に更新し登録すると成功し再表示で反映される	管理ログイン済／SEED-M10-11-MUTABLE（使い捨て）	名称(マイページ)を有効な一時値に更新	"1. 任意行の名称(マイページ)を有効値で更新
2. 「登録」を押下
3. リダイレクト後のGET再表示を確認する"	成功フラッシュ「保存しました」表示後、再表示で名称(マイページ)欄に更新値が再表示されること（mtb_customer_order_status.name へ上書き＝間接確認）。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-014	IT-03	画面遷移	P1	色を有効値に更新し登録すると成功し再表示で反映される	管理ログイン済／SEED-M10-11-MUTABLE（使い捨て）	色を有効な一時値に更新	"1. 任意行の色を有効値で更新
2. 「登録」を押下
3. リダイレクト後のGET再表示を確認する"	成功フラッシュ「保存しました」表示後、再表示で色欄に更新値が再表示されること（mtb_order_status_color.name へ上書き＝間接確認）。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-026	IT-22	文字列長バリデーション	P2	名称(マイページ)最大長+1(256文字)はエラーで保存されない	管理ログイン済／SEED-M10-11-ADMIN	名称(マイページ)＝256文字	"1. 任意行の名称(マイページ)に256文字を入力
2. 「登録」を押下する"	最大長超過によりエラーとなり、成功フラッシュが出ず保存されないこと。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-027	IT-22	文字列長バリデーション	P3	色最大長+1(256文字)はエラーで保存されない（ブラウザ依存・要実機確認）	管理ログイン済／SEED-M10-11-ADMIN	色＝256文字（input[type=color]へ値注入）	"1. 任意行の色欄へ256文字相当を注入
2. 「登録」を押下する"	サーバ側のLength超過でエラーとなり保存されないこと。input[type=color]への文字列入力可否はブラウザ依存のため発火条件は要実機確認。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-028	IT-22	文字列長バリデーション	P2	名称(受注管理)最小長1文字はエラーにならず保存できる	管理ログイン済／SEED-M10-11-MUTABLE（使い捨て）	名称(受注管理)＝1文字	"1. 任意行の名称(受注管理)に1文字を入力
2. 「登録」を押下する"	エラーにならず保存に成功すること（最小長1は境界内）。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-032	IT-23	実行結果	P2	店舗系権種(tenant_operator)でGETすると認可失敗でHTTP 403になる	tenant_operator権種でログイン済／SEED-M10-11-TENANT-OP	—	"1. tenant_operator権種でログインする
2. /setting/shop/order_status をGETする"	/setting/shop 先頭一致の deny_url によりHTTP 403となること（設計上 tenant_operator も拒否対象。PHPUnitは tenant_owner のみ明示のため operator 単体は要確認）。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-041	IT-03	画面遷移	P3	関連行欠損行へ有効値を入力し保存しても欠損テーブルへ反映されず失われる	管理ログイン済／SEED-M10-11-MISSING（関連行欠損）	欠損側列（マイページ名 or 色）に有効値	"1. 関連行が欠損したステータス行の欠損側列に有効値を入力
2. 必須を満たして「登録」を押下
3. リダイレクト後のGET再表示を確認する"	保存自体は成功するが、欠損テーブルにはpersistされず、再表示で欠損側列は値未セットのままで入力が失われていること（間接・破壊的）。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-050	IT-15	CSRF	P2	不正なCSRFトークンで登録送信すると保存されない	管理ログイン済／SEED-M10-11-ADMIN	hidden _token を不正値へ改ざん／request経由POST	"1. hidden _token を不正値に改ざんしてPOST送信する
2. 結果を確認する"	管理共通の拒否処理となり保存されないこと（成功フラッシュが出ない）。トークン改ざん操作が要るため手動/改ざんE2E。
m10-11_admin_base_setting_setting_shop_order_status（管理画面_店舗設定_受注対応状況設定）	E2E-M10-11-015	IT-25	並び順	P3	行がsort_no昇順で表示され保存後も行順が変わらない	管理ログイン済／SEED-M10-11-ORDER（既知ID順）	任意の有効更新	"1. 行のID列順がsort_no昇順であることを確認
2. 「登録」を押下
3. リダイレクト後のGET再表示で行順を確認する"	行が sort_no 昇順で並び、保存しても行順が変わらないこと（既知ID順シードで判定＝手動/間接）。
```

## 付帯表1：E2E自動化区分・対象セレクタ・仕様根拠・元ITケースID（TSV外）

DOM id は `OrderStatusController.php:43` の `createBuilder()` ＋CollectionType フィールド名 `OrderStatuses` から導出する。`createBuilder()` は root フォーム名に FormType の block prefix `form` を用いる（`FormFactory.php:53` = `getType(FormType::class)->getBlockPrefix()='form'`）ため、name 属性は `form[OrderStatuses][<index>][field]`、id は `form_OrderStatuses_<index>_<field>`。行番号は ec-cube-enterprise 現行ソース基準。

| テストID | E2E可否 | 対象セレクタ（根拠 file:line / 要実機確認） | 仕様根拠 | 元ITケースID（観点） |
|----------|---------|----------------------------------------------|----------|----------------------|
| E2E-M10-11-001 | E2E自動化 | 見出し block title `admin.setting.shop.order_status_setting`=「受注対応状況設定」(order_status.twig:16 / messages.ja.yaml:2785) | フロント挙動・状態変化（見出し） | 006,086 |
| E2E-M10-11-002 | E2E自動化 | sub_title `admin.setting.basic_info`=「基本情報設定」(order_status.twig:17 / messages.ja.yaml:2773) | フロント挙動（サブ見出し） | 006 |
| E2E-M10-11-003 | E2E自動化 | tbody tr(order_status.twig:61-85) / ID セル(twig:64) / 登録 button[type=submit].btn-ec-conversion(twig:101) | 利用者視点の入口（GET）・処理フロー(GET) | 003,023,083 |
| E2E-M10-11-004 | E2E自動化 | thead th×5(twig:38,42,46,50,55 / messages.ja.yaml:2980-2984) / #form_OrderStatuses_0_customer_order_status_name(twig:67) / _name(twig:71) / _color(twig:76) / _display_order_count(twig:81) | フロント挙動（表示要素・入力項目） | 009,089 |
| E2E-M10-11-005 | E2E自動化 | #form_OrderStatuses_0_color class form-control-color(order_status.twig:76) | フロント挙動（CSS・レイアウト） | 007,087 |
| E2E-M10-11-006 | E2E自動化 | #form_OrderStatuses_0_display_order_count type=checkbox(twig:81 / ToggleSwitchType.php:50 getParent=CheckboxType) | 入力項目（件数表示=ToggleSwitch） | 012 |
| E2E-M10-11-007 | E2E自動化 | ID セル td:first input 不在(twig:63-65) | 業務ルール（識別子は参照のみ） | 013 |
| E2E-M10-11-008 | E2E自動化 | .card-header span `...order_status.order_status`=「受注対応状況」(twig:30 / messages.ja.yaml:2979) / i.fa-question-circle(twig:30,42,50,55) | フロント挙動（カードヘッダ・ツールチップ） | 008 |
| E2E-M10-11-010 | E2E自動化(fixme・破壊的/要シード) | 登録 button(twig:101) / .alert-success(共通 alert.twig) | 処理フロー(POST成功) addSuccess `admin.common.save_complete`(OrderStatusController.php:75) / 表示メッセージ「保存しました」(messages.ja.yaml:1398) | 080,084,004 |
| E2E-M10-11-011 | E2E自動化(fixme・破壊的・間接DB) | リダイレクト先URL / #form_OrderStatuses_0_name 再表示値 | 画面遷移（成功→redirectToRoute OrderStatusController.php:77）・データ整合性（再表示はDB再読込） | 015,022 |
| E2E-M10-11-012 | E2E自動化(fixme・破壊的) | #form_OrderStatuses_0_display_order_count / 再表示状態 | 入力項目（件数表示→display_order_count上書き）・業務ルール | 017,082 |
| E2E-M10-11-020 | E2E自動化 | 必須エラー form_errors(twig:72 .invalid-feedback/.text-danger 要実機確認) / 文言「入力されていません。」 | バリデーション(name NotBlank OrderStatusSettingType.php:47) / 表示メッセージ(validators.ja.yaml:17) | 024,029,057 |
| E2E-M10-11-021 | E2E自動化 | form_errors(twig:68) / 「入力されていません。」 | バリデーション(customer_order_status_name NotBlank OrderStatusSettingType.php:54) | 056 |
| E2E-M10-11-022 | E2E自動化 | form_errors(twig:78) / 「入力されていません。」 | バリデーション(color NotBlank OrderStatusSettingType.php:61) | 031 |
| E2E-M10-11-023 | E2E自動化(fixme・破壊的・境界内成功) | #form_OrderStatuses_0_name | バリデーション(Length max=eccube_stext_len=255 OrderStatusSettingType.php:48)・入力項目（最大長255） | 026,028,030 |
| E2E-M10-11-024 | E2E自動化 | #form_OrderStatuses_0_name / .alert-success 不在 | バリデーション(Length max=255 超過 OrderStatusSettingType.php:48) | 027 |
| E2E-M10-11-025 | E2E自動化 | 行フォーム / .alert-success 不在 | 処理フロー(POST失敗 isValid 不成立で flush せず OrderStatusController.php:56)・部分入力 | 058,081 |
| E2E-M10-11-030 | E2E自動化(資格情報不要) | 管理ログイン画面 #login_id(login.twig) | 利用者視点の入口（未認証は管理ログイン要件）・権限・認可 | 002,021,076 |
| E2E-M10-11-031 | E2E自動化(fixme・要tenantシード) | HTTP 403 応答 | 権限・認可（/setting/shop 先頭一致 deny_url で 403。tenantOnlyAllowedTest） | 005,085,038 |
| E2E-M10-11-040 | 手動/間接(要欠損シード) | 欠損側 input の初期値 | エッジケース（関連行欠損時は当該列が値未セット） | 019 |
| E2E-M10-11-009 | E2E自動化 | #form_OrderStatuses_0_customer_order_status_name value / #form_OrderStatuses_0_color value | 処理フロー(GET) POST_SET_DATA で関連行から初期表示を埋める(OrderStatusSettingType.php POST_SET_DATA / order_status.twig:67,76) | 014 |
| E2E-M10-11-013 | E2E自動化(fixme・破壊的・間接DB) | #form_OrderStatuses_0_customer_order_status_name / .alert-success / 再表示値 | 処理フロー(POST成功) 名称(マイページ)を mtb_customer_order_status.name へコピー(OrderStatusController.php:64-66付近) / クロスエンティティ更新 | 016 |
| E2E-M10-11-014 | E2E自動化(fixme・破壊的・間接DB) | #form_OrderStatuses_0_color / .alert-success / 再表示値 | 処理フロー(POST成功) 色を mtb_order_status_color.name へコピー(OrderStatusController.php:67-71付近) / クロスエンティティ更新 | 014 |
| E2E-M10-11-026 | E2E自動化 | #form_OrderStatuses_0_customer_order_status_name / .alert-success 不在 | バリデーション(customer_order_status_name Length max=255 OrderStatusSettingType.php:55 超過) | 027 |
| E2E-M10-11-027 | E2E自動化(要実機確認・ブラウザ依存) | #form_OrderStatuses_0_color / .alert-success 不在 | バリデーション(color Length max=255 OrderStatusSettingType.php:62 超過。input[type=color]の文字列入力可否は付帯表4#4) | 031 |
| E2E-M10-11-028 | E2E自動化(fixme・破壊的・境界内成功) | #form_OrderStatuses_0_name | バリデーション(name Length min境界=1文字は有効 OrderStatusSettingType.php:48)・入力項目（最小長1） | 028 |
| E2E-M10-11-032 | E2E自動化(fixme・要tenant_operatorシード・要確認) | HTTP 403 応答 | 権限・認可（tenant_operator も /setting/shop deny_url 対象。設計md:249。operator 単体成否は要確認） | 085 |
| E2E-M10-11-041 | 手動/間接(要欠損シード・破壊的) | 再表示の欠損側 input 値（値未セットのまま） | 業務ルール/欠損行（欠損テーブルへ persist せず入力は失われる。設計md:169 / OrderStatusController.php:61-71） | 019 |
| E2E-M10-11-050 | 手動/改ざん(リクエスト改ざん) | hidden input[name=_token]（order_status.twig:26） / .alert-success 不在 | エラー処理（CSRF検証失敗→共通拒否・保存されない。設計md:96,281） | 001 |
| E2E-M10-11-015 | 手動/間接(要既知ID順シード) | tbody tr の ID セル並び（twig:64） / 再表示の行順 | 業務ルール/並び順（sort_no 昇順表示・保存時不変。設計md:146） | 012 |

注: 既存IT cases は観点名のみの定型自動生成スタブ（操作手順が「対象画面を表示する」等の汎用文）であり機能固有シナリオを持たない。本E2Eは設計書本文（利用者視点の入口・処理フロー・バリデーション・権限・認可・表示メッセージ）を一次情報源として網羅した。`元ITケースID（観点）` は付帯表2b の行単位分類に対応する。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合は既存 `m10_11_..._it_cases.md` の関連ID件数（IT-22=35／IT-23=22／IT-26=10／IT-25=9／IT-03=7／IT-15=4／IT-20=2／IT-13=1＝計90）。各観点行を E2E自動化／手動・間接／対象外(理由) に振り分ける。内訳は付帯表2b（行単位明細・全90行）が正本。

| IT-ID | 母集合 | E2E自動化 | 手動/間接 | 対象外 | 対象外の主な理由 |
|-------|:-----:|:--------:|:--------:|:------:|------------------|
| IT-22 | 35 | 10 | 0 | 25 | 本機能の入力は name/マイページ名/色(必須・最大長255)と件数トグルのみ。数値・文字種・日付・メール・相関・DB相関の細目は非該当 |
| IT-23 | 22 | 1 | 0 | 21 | 本機能はDB検索を行わない（検索条件・実行結果なし）。権限403の1件のみ自動化(要シード) |
| IT-26 | 10 | 8 | 0 | 2 | 登録/更新の成功・失敗・再表示は自動化。モーダル不使用・集計ロジック(別機能)は対象外 |
| IT-25 | 9 | 7 | 1 | 1 | UI部品・列ヘッダ・ツールチップ・ID参照・再表示は自動化。sort_no昇順表示/保存時行順不変(012)は既知ID順シードが要るため手動/間接。確認ダイアログ(件数集計=別機能)は対象外 |
| IT-03 | 7 | 5 | 1 | 1 | クロスエンティティ更新(名称(受注管理)/マイページ名/色/件数)の再表示・検証失敗時DB不変は自動化。欠損行は手動/間接、0件行は対象外 |
| IT-15 | 4 | 3 | 1 | 0 | 未認証・対象データ・状態変化は自動化。CSRFは hidden token 改ざん送信／`request` 経由POSTで拒否を観測可のため手動/改ざんE2E |
| IT-20 | 2 | 0 | 0 | 2 | ログ出力抑止・識別子＝ブラウザ観測外 |
| IT-13 | 1 | 1 | 0 | 0 | |
| 合計 | 90 | 35 | 3 | 52 | **未分類 0** |

注: 対象外52件はいずれも「ブラウザで観測不能」「本機能で非該当（数値/文字種/相関/検索なし）」「別機能へ委譲（件数集計）」が理由であり、放置ではない。CSRF は改ざん操作で観測可のため手動/間接へ分類した。

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-15 | CSRF | 手動/間接 | 050（hidden `_token` 改ざん送信／`request` 経由POSTで拒否＝保存されないを観測。改ざんE2E・付帯表4#3） |
| 002 | IT-15 | 未認証 | E2E自動化 | 030（未認証→管理ログイン誘導） |
| 003 | IT-15 | 対象データ | E2E自動化 | 003（全ステータス行表示） |
| 004 | IT-20 | 出力抑止 | 対象外 | ログ出力抑止はブラウザ観測外 |
| 005 | IT-20 | 識別子 | 対象外 | ログ識別子はブラウザ観測外 |
| 006 | IT-15 | 状態変化 | E2E自動化 | 001/002（見出し・サブ見出し表示） |
| 007 | IT-25 | UI部品 | E2E自動化 | 005（色 form-control-color） |
| 008 | IT-25 | UI部品 | E2E自動化 | 008（カードヘッダ見出し・質問アイコン） |
| 009 | IT-25 | 操作起点 | E2E自動化 | 004（入力項目・列ヘッダ） |
| 010 | IT-25 | 確認ダイアログ | 対象外 | 本機能は確認ダイアログ不使用。stub観点の件数集計は別機能（受注一覧） |
| 011 | IT-25 | 確認ダイアログ | E2E自動化 | 010（保存しました＝save_complete） |
| 012 | IT-25 | 確認ダイアログ | 手動/間接 | 015（sort_no昇順表示・保存時に行順不変。既知ID順シードが要るため手動/間接。003は行存在のみで順序未アサート） |
| 013 | IT-25 | 送信可否制御 | E2E自動化 | 007（ID参照表示・編集不可） |
| 014 | IT-03 | 外部画面 | E2E自動化 | 009/013/014（POST_SET_DATAで関連行から初期表示・マイページ名/色をフォームからセット） |
| 015 | IT-03 | 画面遷移 | E2E自動化 | 011（name上書き＝再表示で間接確認） |
| 016 | IT-03 | 画面遷移 | E2E自動化 | 013（マイページ名を有効値で更新→mtb_customer_order_status.name上書き＝再表示で間接確認） |
| 017 | IT-03 | 画面遷移 | E2E自動化 | 012（display_order_count上書き） |
| 018 | IT-03 | 画面遷移 | 対象外 | ステータス行0件は通常の初期データで起こらず空コレクションのシードが非現実的 |
| 019 | IT-03 | 画面遷移 | 手動/間接 | 040/041（関連行欠損は欠損シードが必要。040=初期表示の値未セット、041=有効値を入力し保存しても欠損テーブルへ反映されず失われる） |
| 020 | IT-03 | 画面遷移 | E2E自動化 | 020/024/025（検証のみ失敗でflush前停止・DB不変） |
| 021 | IT-13 | URL直接アクセス | E2E自動化 | 030（直接アクセス→ログイン誘導） |
| 022 | IT-25 | HTTPステータス | E2E自動化 | 011（成功→リダイレクト後の再表示） |
| 023 | IT-25 | URL | E2E自動化 | 003（GETによる画面表示） |
| 024 | IT-22 | 必須バリデーション | E2E自動化 | 020（必須未入力エラー） |
| 025 | IT-22 | 必須バリデーション | E2E自動化 | 012（任意=件数表示未チェックはエラーにならず保存可） |
| 026 | IT-22 | 文字列長バリデーション | E2E自動化 | 023（最大長255は境界内） |
| 027 | IT-22 | 文字列長バリデーション | E2E自動化 | 024（最大長+1=256でエラー） |
| 028 | IT-22 | 文字列長バリデーション | E2E自動化 | 028（最小長=1文字はエラーにならず保存可。023は255境界のため別ケースで実体化） |
| 029 | IT-22 | 文字列長バリデーション | E2E自動化 | 020（最小長-1=空でエラー） |
| 030 | IT-22 | 文字列長バリデーション | E2E自動化 | 023（境界内は継続） |
| 031 | IT-22 | 文字列長バリデーション | E2E自動化 | 022/027（022=色の必須NotBlank、027=色の最大長256超過。最大長境界を実体化） |
| 032-039 | IT-22 | 数値バリデーション | 対象外 | 本機能に数値入力項目なし（name/マイページ名/色=text・件数=トグル）。8行 |
| 040,041 | IT-22 | 文字種バリデーション | 対象外 | text項目に文字種制約なし（NotBlank/Lengthのみ）。2行 |
| 042-050 | IT-22 | その他のバリデーション | 対象外 | コード値/日付/メール等の該当項目なし。9行 |
| 051-054 | IT-22 | 相関バリデーション | 対象外 | 本機能に条件相関・組合せ検証なし。4行 |
| 055,056 | IT-22 | DBとの相関バリデーション | 対象外 | 本機能はDB相関検証を持たない（NotBlank/Lengthのみ）。2行 |
| 057 | IT-22 | 必須制御 | E2E自動化 | 020（必須未入力で保存・更新が実行されない） |
| 058 | IT-22 | 部分入力 | E2E自動化 | 025（行形式フォームの部分入力でも部分保存されない） |
| 059-079 | IT-23 | 検索条件 | 対象外 | 本機能はDB検索を行わない（検索条件・実行結果なし）。21行 |
| 080 | IT-26 | 登録内容 | E2E自動化 | 010（更新成功＝保存しました） |
| 081 | IT-26 | 登録内容 | E2E自動化 | 020/025（検証失敗で保存されない） |
| 082 | IT-26 | 登録内容 | E2E自動化 | 012（件数表示更新） |
| 083 | IT-26 | 登録内容 | E2E自動化 | 003（GET全行・登録ボタン表示） |
| 084 | IT-26 | 登録内容 | E2E自動化 | 010/011（保存しました→リダイレクト） |
| 085 | IT-23 | 登録内容 | E2E自動化 | 031/032（031=tenant_owner で403、032=tenant_operator で403。設計md:249の deny_url 拒否対象を両権種で実体化。要tenantシード・fixme） |
| 086 | IT-26 | 登録内容 | E2E自動化 | 001（見出し表示） |
| 087 | IT-26 | 登録内容 | E2E自動化 | 005（form-control-color） |
| 088 | IT-26 | 登録内容 | 対象外 | 本機能はモーダル・ポップアップを使わない |
| 089 | IT-26 | 登録内容 | E2E自動化 | 004（入力項目・マイページ名1行テキスト） |
| 090 | IT-26 | 登録内容 | 対象外 | 件数集計ロジックは別機能（受注一覧・選択UI）へ委譲 |

集計（付帯表2と一致）: E2E自動化 35（002,003,006,007,008,009,011,013,014,015,016,017,020,021,022,023,024,025,026,027,028,029,030,031,057,058,080,081,082,083,084,085,086,087,089）／ 手動・間接 3（001,012,019）／ 対象外 52（004,005,010,018,032-039=8,040-041=2,042-050=9,051-054=4,055-056=2,059-079=21,088,090）。**未分類 0**。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-M10-11-ADMIN | dtb_member(管理者) | 店舗設定配下の拒否パターンが紐付かないシステム管理者1（ログインID/PWは config 既定）。mtb_order_status/mtb_customer_order_status/mtb_order_status_color に同一主キーの初期マスタ全行が揃う | fixture(config既定＋標準マスタ) | 既存利用・参照系のみ・撤去不要 | 001-009,020,021,022,024,025,026,027,050 |
| SEED-M10-11-MUTABLE | mtb_order_status / mtb_customer_order_status / mtb_order_status_color | 名称(受注管理)・名称(マイページ)・色・件数表示を更新してよい使い捨て状態（テスト後に元値へ復元、または専用ステータス行で隔離） | fixture/migration | **保存で破壊されるため使い捨て。テスト毎に既知値へ復元** | 010,011,012,013,014,023,028 |
| SEED-M10-11-MISSING | mtb_order_status は存在し mtb_customer_order_status または mtb_order_status_color の同一主キー行が欠損 | 関連行欠損のステータス行を1つ用意 | fixture | 専用・撤去（欠損を作るため隔離環境推奨） | 040,041 |
| SEED-M10-11-TENANT | dtb_member(tenant_owner権種) | `Authority` ロールキー確認値 `tenant_owner`(mtb_authority.id=4)。`dtb_authority_role` に `/setting/shop` 先頭一致の deny_url が紐付く | fixture/migration | 専用アカウント・撤去 | 031 |
| SEED-M10-11-TENANT-OP | dtb_member(tenant_operator権種) | `Authority` ロールキー確認値 `tenant_operator`(mtb_authority.id=5)。`dtb_authority_role` に `/setting/shop` 先頭一致の deny_url が紐付く（設計md:249）。operator 単体の403成否は要確認 | fixture/migration | 専用アカウント・撤去 | 032 |
| SEED-M10-11-ORDER | mtb_order_status / mtb_customer_order_status / mtb_order_status_color | sort_no 昇順の検証用に既知の id/sort_no 並びを持つマスタ全行（行順アサートの基準） | fixture | 参照系（015は手動/間接で行順確認。更新を伴う場合は MUTABLE と併用し復元） | 015 |

注: 永続化先は ec-cube-enterprise 正典（mtb_order_status / mtb_customer_order_status / mtb_order_status_color）。`migration` 採用時もDB=ec-cube-enterprise 正典に従う。共通ログインは `config/default.config.ts`（ECCUBE_ADMIN_USER/PASS）を流用する。MUTABLE は保存系のため後始末（元値復元）を必須とする。

## 付帯表4：不具合候補（仕様乖離）／要確認

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | 必須未入力は「入力されていません。」を該当フィールド下に表示 | OrderStatusSettingType.php:47,54,61(NotBlank) / order_status.twig:68,72,78(form_errors) / validators.ja.yaml:17 | 文言は静的確認済。form_errors のエラークラス（.invalid-feedback / .text-danger）は bootstrap_4_horizontal_layout 依存のため出力先セレクタを実機確認 | 020,021,022 | 要確認(セレクタ) |
| 2 | 名称(受注管理)/名称(マイページ)/色は最大長255(eccube_stext_len) | OrderStatusSettingType.php:48,55,62(Length max) / app/config/eccube/packages/eccube.yaml(確認値255) | 期待値は設計書(255固定)由来でオラクル化。Form制約は静的確認のみ。256でのサーバ検証エラー表示位置を実機確認 | 023,024 | 要確認(境界) |
| 3 | CSRF検証失敗は共通の拒否処理（保存されない） | OrderStatusController.php:54(handleRequest で _token 検証) / order_status.twig:26(_token) | 不正トークン送信は要リクエスト改ざん。ブラウザ通常操作では観測不能のため手動/改ざんE2E(050)で hidden `_token` を不正値にして拒否＝保存されないを観測 | 050（IT001=手動/間接） | 要確認(改ざん) |
| 4 | 色はSymfony ColorType（ブラウザが返す文字列形式） | OrderStatusSettingType.php:58(ColorType) / order_status.twig:76(form-control-color) | 色入力の空値化・任意文字列入力の可否は input[type=color] のブラウザ挙動依存。NotBlank発火条件を実機確認 | 022 | 要確認(ブラウザ依存) |
| 5 | 関連行欠損時は当該列をpersistせず、入力しても失われる | OrderStatusController.php:61-71(find が null ならスキップ) | 欠損状態の生成（DBから関連行削除）が必要。保存後にその列が反映されないことの観測は間接・破壊的 | 040 | 要確認(間接/シード) |
| 6 | サブ見出し「基本情報設定」は block sub_title で表示 | order_status.twig:17(block sub_title) / 管理レイアウト側で描画 | sub_title は本テンプレ本文ではなく管理レイアウトのヘッダ/パンくず領域で描画される。body 全体への containText は左ナビ等の同一文言と衝突し誤検出の恐れ。サブ見出し要素（パンくず/ページヘッダ）へセレクタを絞るのが望ましい（実機でレイアウト要素を確認） | 002 | 要確認(セレクタ/オラクル粒度) |
| 7 | テナント系権種の本画面GETは403 | 設計md:249（tenant_owner=mtb_authority.id 4 / tenant_operator=5 に /setting/shop 先頭一致 deny_url） | PHPUnit `tenantOnlyAllowedTest` は tenant_owner の403のみ明示。tenant_operator 単体の403成否は設計上 deny_url 対象だが実テスト未確認。期待値(403)は設計の deny_url 仕様由来でオラクル化し、operator は要実機確認 | 032（IT085） | 要確認(operator成否) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口（GET） | 全行表示・ID・4入力欄・登録ボタン・関連テーブル由来の初期表示 | 001,002,003,004,009 | カバー(行存在・初期表示由来値=009)。sort_no 昇順の並び自体は既知ID順シードが要るため 015 手動/間接で確認 |
| 利用者視点の入口（離脱） | 編集せず離脱でDBは変わらない | （観測困難＝対象外） | 対象外(理由付き)。送信しない限りDB副作用が無いことは間接（保存系の不変＝020/024/025で代替確認） |
| 利用者視点の入口（権限拒否GET） | 拒否権種(tenant_owner/tenant_operator)で HTTP 403 | 031,032 | 部分カバー(要tenantシード・fixme)。tenant_owner=031はPHPUnit裏付け、tenant_operator=032は設計deny_url由来だが要確認(付帯表4#7) |
| フロント挙動／表示要素 | 見出し・サブ見出し・列ヘッダ・ツールチップ・カードヘッダ | 001,002,004,008 | カバー |
| フロント挙動／サイドバー active | setting/basic_info/shop_order_status がアクティブ | （要実機確認・手動） | 部分カバー。アクティブ判定セレクタは管理レイアウト依存で未確定のため手動/要実機確認 |
| フロント挙動／ツールチップ列別有無 | マイページ名/色/件数はツールチップ付・ID/受注管理名は無し | 008 | 部分カバー。008は質問アイコンの存在のみ。列ごとの有無は未アサート(要実機確認でヘッダ別に確認) |
| フロント挙動／CSS・レイアウト | 色 form-control-color・件数トグル | 005,006 | カバー |
| フロント挙動／モーダル | 利用しない | （モーダル不使用＝対象外） | 対象外(理由付き) |
| フロント挙動／入力項目 | マイページ名/受注管理名(text)・色(color)・件数(トグル=label_on/off空でラベル無) | 004,005,006 | 部分カバー。006はcheckbox種別を確認。label_on/off空でラベル文字を出さない点は未アサート(軽微・要実機確認) |
| 処理フロー(GET) | OrderStatus を sort_no 昇順列挙・ID参照表示・POST_SET_DATAで関連行初期値 | 003,007,009 | 部分カバー。初期表示由来値=009。sort_no昇順の順序アサートは015手動/間接 |
| 処理フロー(POST成功) | name/件数を直接セット・関連行に名称/色をコピー・flush・保存しました・リダイレクト | 010,011,012,013,014 | カバー(破壊的・fixme)。マイページ名=013/色=014で関連2表のコピーも実体化 |
| 処理フロー(POST失敗) | NotBlank/Length 違反で flush せず同一画面200再描画・フィールドエラー | 020,021,022,024,025,026,027 | カバー。検証失敗は同一URL(200)滞留で再描画。入力値の再表示自体の明示アサートは軽微・未強制 |
| フォーム送信時の判定順序 #1 | 子フォーム配列順に NotBlank/最大長検証 | 020,021,022,024,026,027 | 部分カバー。各フィールド単独の失敗は実体化。子フォーム配列順・複数行同時違反のエラー順序は未検証(要確認) |
| 表示メッセージ（保存しました） | admin.common.save_complete | 010 | カバー(fixme) |
| 表示メッセージ（入力されていません。） | NotBlank（This value should not be blank.） | 020,021,022 | カバー |
| 業務ルール／並び順 | 行順は sort_no 昇順・保存時に変更しない | 015 | 手動/間接(要既知ID順シード)。003は行存在のみで順序未アサートのため過大主張を是正 |
| 業務ルール／識別子 | id は編集しない（参照のみ） | 007 | カバー |
| 業務ルール／クロスエンティティ更新 | name=mtb_order_status を直接・マイページ名=mtb_customer_order_status／色=mtb_order_status_color をコピー・件数=display_order_count を直接 | 011(name),013(マイページ名),014(色),012(件数) | カバー(間接・fixme)。3表それぞれ独立ケースで正常更新→再表示を往復確認 |
| 入力項目／最大長255 | 255は有効・256はエラー(name/マイページ名/色)・最小長1は有効 | 023,024,026,027,028 | 部分カバー。name=023/024(255/256・fixme)・028(1文字)。マイページ名=026(256)・色=027(256)で各項目の上限境界を実体化(色256はinput[type=color]ブラウザ依存=付帯表4#4要確認)。マイページ名/色の255有効側は破壊的fixme未実体(13/14の正常更新で代替) |
| エッジケース／関連行欠損 | 欠け側は値未セット（初期表示）／入力しても反映されず失われる（保存時） | 040,041 | 手動/間接(要シード)。040=初期表示の値未セット、041=有効値入力で保存しても欠損テーブルへ反映されず失われる(破壊的・間接・付帯表4#5要確認) |
| エッジケース／0件 | 空コレクション | （通常起きない・シード非現実的） | 対象外(理由付き) |
| エッジケース／同時編集 | 後勝ち flush | （楽観ロックなし＝排他要件なし） | 対象外(要件なし) |
| データ整合性／再表示 | 成功時はDB再読込で確定値表示 | 011,013,014 | カバー(間接・fixme) |
| 副作用／DB操作 | 3表 persist/flush（即時確定） | 010,011,012,013,014,040,041 | カバー(間接/手動)。マイページ名(013)/色(014)の関連2表更新も実体化 |
| 集計条件 | display_order_count 真のときのみ件数集計（選択UI） | （受注一覧・選択Form＝別機能へ委譲） | 対象外(委譲) |
| 権限・認可 | 未認証→ログイン・拒否権種(owner/operator)→403・許可権種→利用可・CSRF失敗→拒否 | 030,031,032,050 | 部分カバー(403/CSRFはfixme・手動)。tenant_operator(032)は要確認(付帯表4#7)、CSRF(050)は手動/改ざん |
| 画面遷移 | 成功→リダイレクト・検証失敗→同一画面200・認可失敗→共通エラー | 011,013,014,020,024,031 | カバー。検証失敗時はORDER_STATUS_RE滞留(=200で再描画)で確認 |
| 試行制限 | 本機能では扱わない | （該当なし） | 対象外(該当なし) |
| Cookie・セッション | 独自Cookie/検索条件セッションを増やさない | （新規状態なし＝観測対象なし） | 対象外(該当なし) |
| ログ・監査 | 専用監査ログ項目を増やさない・トークン/Cookie/セッションID原値を出さない | （ブラウザ観測外） | 対象外(観測外) |

未カバーはいずれも理由（モーダル不使用・0件非現実的・排他要件なし・別機能委譲・試行制限なし・Cookie/セッション新規なし・ログ観測外）を明記済み。検証失敗系・表示系・権限系は正常×異常の対で網羅した。
