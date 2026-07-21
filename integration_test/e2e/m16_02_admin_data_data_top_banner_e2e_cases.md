# データ管理 — トップバナー管理（m16-02_admin_data_data_top_banner） E2Eテストケース

元設計(一次オラクル): `function_spec_html_preview/pf-eccube3/m16-02_admin_data_data_top_banner.html`（正本 `functions/pf-eccube3/m16-02_admin_data_data_top_banner.md`）

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/m16_02_admin_data_data_top_banner_it_cases.md`（母集合 計90観点行）

期待結果は画面表示・遷移・URL・バリデーションメッセージ・(間接)DB/ストレージ状態などブラウザで観測できる結果で判定する。**期待結果は仕様（設計書・観点表・基本設計）由来**とし、実装/POM由来の表示文言・Form制約（Length/NotBlank/maxlength）を期待値に流用しない。TSV は既存IT casesの10列に実施管理欄（実施者・実施日・結果・失敗理由）を加えた14列固定。E2E固有情報は TSV 後の付帯表に `テストID` で対応づける。Playwright は本リポジトリでは実行しない（構造参考のみ）。未検証セレクタは `要実機確認`。

**オラクル独立性の注記（重要）**: 本設計書は現行 pf-eccube3（HareruyaEc プラグイン）のリバースである。刷新先 ec-cube-enterprise には同等のコア機能が存在するが、ルート（`/banner/top` → `/data/top_banner`）・フォーム名（`hareruyaec_banner` → `top_banner`）・並び順検証の実装場所（クライアントJS阻止 → サーバ側POST_SUBMIT検証）・保存成功時のフラッシュ有無などで乖離がある。**実装から取るのはセレクタ（位置情報）のみ**で、合否は設計書・観点表（上位オラクル）で判定する。乖離は付帯表4に分離し、テストは仕様どおりに書く。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-15 | 未認証ガード（保護URL→ログイン誘導）・保存/アップロード/削除による状態変化（間接） |
| IT-20 | 秘密情報のログ出力抑止＝ブラウザ観測外 |
| IT-25 | UI部品（バナー設定欄・アップロード欄・一覧）・操作起点・確認ダイアログ文言・成功/失敗時の画面 |
| IT-03 | 画面遷移（保存/アップロード/削除のリダイレクト・店舗絞り込み・#upload_wrapアンカー） |
| IT-13 | URL直接アクセス（未ログイン誘導） |
| IT-22 | 画像URL/リンク先URLの最大長・参照禁止ホスト、並び順の必須/重複、アップロードファイルの必須/形式/サイズ |
| IT-23 | 本機能は利用者向けDB検索を行わない（マスタ昇順取得は内部）。検索観点は対象外 |
| IT-26 | 登録/更新（mtb_top_banner・dtb_top_banner_language）の間接確認・HTTP到達/拒否 |

## テストケースTSV（14列固定・末尾4列は実施管理欄）

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m16-02_admin_data_data_top_banner（データ管理 — トップバナー管理）	E2E-M16-02-001	IT-25	UI部品	P2	バナー設定画面に案内文・バナー設定ボタン・▼画像設定リンクが表示される	管理者ログイン済／SEED-M16-02-BANNER	—	1. /admin/data/top_banner を開く	案内文「画像とリンク先を入力・変更してください」「空欄にすると表示から削除されます」・送信ボタン「バナー設定」・リンク「▼画像設定」が表示されること。				
m16-02_admin_data_data_top_banner（データ管理 — トップバナー管理）	E2E-M16-02-002	IT-25	UI部品	P2	各スロットに画像URL/リンク先URL/言語/表示タイプ/画像alt/並び順の入力欄が表示される	管理者ログイン済／SEED-M16-02-BANNER	—	1. /admin/data/top_banner を開く	見出し「画像URL」「リンク先URL」「言語」「表示タイプ」「画像alt属性」「並び順」と各入力欄が表示されること。				
m16-02_admin_data_data_top_banner（データ管理 — トップバナー管理）	E2E-M16-02-003	IT-25	操作起点	P3	画面に「データ管理」「トップバナー管理」の見出しが表示される	管理者ログイン済／SEED-M16-02-BANNER	—	1. /admin/data/top_banner を開く	「データ管理」と「トップバナー管理」がともに表示されること。				
m16-02_admin_data_data_top_banner（データ管理 — トップバナー管理）	E2E-M16-02-004	IT-25	UI部品	P2	画像設定ブロックに店舗選択・ファイル入力・アップロードボタン・一覧表が表示される	管理者ログイン済／SEED-M16-02-BANNER	—	1. /admin/data/top_banner を開き #upload_wrap まで移動	店舗選択セレクト・画像ファイル入力・送信ボタン「アップロード」・画像一覧表（画像/更新日時/画像URL/削除の列）が表示されること。				
m16-02_admin_data_data_top_banner（データ管理 — トップバナー管理）	E2E-M16-02-005	IT-03	画面遷移	P3	「▼画像設定」リンクが同一ページ内 #upload_wrap を指す	管理者ログイン済／SEED-M16-02-BANNER	—	"1. /admin/data/top_banner を開く
2. 「▼画像設定」リンクのhref属性を確認"	リンク先が同一ページ内アンカー「#upload_wrap」であり別HTTPリクエストを発生させないこと。				
m16-02_admin_data_data_top_banner（データ管理 — トップバナー管理）	E2E-M16-02-006	IT-13	URL直接アクセス	P1	未ログインで保護URLへ直接アクセスすると管理ログイン画面へ誘導される	未ログイン	—	1. /admin/data/top_banner へ直接アクセス	管理ログイン画面（ログインID入力欄）へ誘導されること。				
m16-02_admin_data_data_top_banner（データ管理 — トップバナー管理）	E2E-M16-02-007	IT-25	UI部品	P3	各スロットのプレビュー画像が当該行の画像URL値を表示する	管理者ログイン済／SEED-M16-02-BANNER	—	"1. /admin/data/top_banner を開く
2. 先頭スロットのプレビュー画像のsrc属性と画像URL入力欄の値を確認"	先頭スロットのプレビュー画像のsrcが当該行の画像URL入力値と一致すること（設計書フロント挙動「プレビュー画像」）。				
m16-02_admin_data_data_top_banner（データ管理 — トップバナー管理）	E2E-M16-02-010	IT-22	文字列長バリデーション	P2	画像URLが最大長を超えると保存できずエラーが表示される	管理者ログイン済／SEED-M16-02-BANNER	先頭スロットの画像URL＝256文字（最大長超過）	"1. /admin/data/top_banner を開く
2. 先頭スロットの画像URLに256文字を入力
3. バナー設定ボタンを押下"	エラーが表示され、バナー設定画面に留まり保存されないこと。				
m16-02_admin_data_data_top_banner（データ管理 — トップバナー管理）	E2E-M16-02-011	IT-22	その他のバリデーション	P2	画像URLに参照禁止ホスト文字列を含めると独自検証で拒否される	管理者ログイン済／SEED-M16-02-BANNER	先頭スロットの画像URL＝「admin.hareruyamtg.com」を含む文字列	"1. /admin/data/top_banner を開く
2. 先頭スロットの画像URLに参照禁止ホストを含む値を入力
3. バナー設定ボタンを押下"	「admin.hareruyamtg.com」を含むURLは指定できない旨のエラーが表示され、バナー設定画面に留まること。				
m16-02_admin_data_data_top_banner（データ管理 — トップバナー管理）	E2E-M16-02-012	IT-22	文字列長バリデーション	P2	リンク先URLが最大長を超えると保存できずエラーが表示される	管理者ログイン済／SEED-M16-02-BANNER	先頭スロットのリンク先URL＝256文字（最大長超過）	"1. /admin/data/top_banner を開く
2. 先頭スロットのリンク先URLに256文字を入力
3. バナー設定ボタンを押下"	エラーが表示され、バナー設定画面に留まり保存されないこと。				
m16-02_admin_data_data_top_banner（データ管理 — トップバナー管理）	E2E-M16-02-013	IT-22	必須バリデーション	P2	並び順が空のスロットがあると保存できずエラーが表示される	管理者ログイン済／SEED-M16-02-BANNER	先頭スロットの並び順＝空	"1. /admin/data/top_banner を開く
2. 先頭スロットの並び順を空にする
3. バナー設定ボタンを押下"	並び順が空である旨のエラーが表示され、保存されずバナー設定画面に留まること（仕様は並び順の空送信を阻止する）。				
m16-02_admin_data_data_top_banner（データ管理 — トップバナー管理）	E2E-M16-02-014	IT-22	相関バリデーション	P2	並び順が重複すると保存できずエラーが表示される	管理者ログイン済／SEED-M16-02-BANNER	2スロットの並び順を同一値に設定	"1. /admin/data/top_banner を開く
2. 2つのスロットの並び順を同一値にする
3. バナー設定ボタンを押下"	並び順が重複している旨のエラーが表示され、保存されずバナー設定画面に留まること。				
m16-02_admin_data_data_top_banner（データ管理 — トップバナー管理）	E2E-M16-02-020	IT-22	必須バリデーション	P2	ファイル未選択でアップロードするとエラーが表示され送信されない	管理者ログイン済／SEED-M16-02-BANNER	ファイル＝未選択	"1. /admin/data/top_banner を開き #upload_wrap まで移動
2. ファイルを選択せずアップロードボタンを押下"	ファイル未選択である旨の必須エラーが表示され、アップロードが送信されず画面に留まること（具体的な文言は実装由来のため固定しない）。				
m16-02_admin_data_data_top_banner（データ管理 — トップバナー管理）	E2E-M16-02-021	IT-22	その他のバリデーション	P2	GIF/JPEG/PNG以外のファイルをアップロードすると形式エラーで拒否される	管理者ログイン済／SEED-M16-02-BANNER	非画像ファイル（例 text/plain）	"1. /admin/data/top_banner を開き #upload_wrap まで移動
2. 非画像ファイルを選択しアップロードボタンを押下"	GIF/JPEG/PNG 形式でない旨のエラーが表示され、ストレージへ保存されず画面に留まること（具体的な文言は実装由来のため固定しない）。				
m16-02_admin_data_data_top_banner（データ管理 — トップバナー管理）	E2E-M16-02-022	IT-22	文字列長バリデーション	P2	上限サイズを超える画像をアップロードするとサイズ超過エラーで拒否される	管理者ログイン済／SEED-M16-02-BANNER	520000バイト超の画像ファイル	"1. /admin/data/top_banner を開き #upload_wrap まで移動
2. 上限サイズ超の画像を選択しアップロードボタンを押下"	ファイルサイズ超過の旨のエラーが表示され、ストレージへ保存されず画面に留まること。				
m16-02_admin_data_data_top_banner（データ管理 — トップバナー管理）	E2E-M16-02-030	IT-26	更新内容	P1	バナー設定が正常に保存されGET画面へリダイレクトされる	管理者ログイン済／SEED-M16-02-BANNER（使い捨て）	先頭スロットに有効な画像URL・並び順は全スロット一意	"1. /admin/data/top_banner を開く
2. 有効な値を入力
3. バナー設定ボタンを押下"	バナー設定画面（GET /admin/data/top_banner）へリダイレクトされること（各行が mtb_top_banner に保存される）。				
m16-02_admin_data_data_top_banner（データ管理 — トップバナー管理）	E2E-M16-02-031	IT-03	画面遷移	P1	画像を正常アップロードすると #upload_wrap 付きGETへリダイレクトされる	管理者ログイン済／SEED-M16-02-BANNER（使い捨て）	520000バイト以下のGIF/JPEG/PNG画像	"1. /admin/data/top_banner を開き #upload_wrap まで移動
2. 有効な画像を選択しアップロードボタンを押下"	#upload_wrap 付きのGET /admin/data/top_banner へリダイレクトされ、一覧に画像が反映されること。				
m16-02_admin_data_data_top_banner（データ管理 — トップバナー管理）	E2E-M16-02-032	IT-15	状態変化	P1	一覧の削除リンクで確認後に画像が削除され #upload_wrap 付きGETへ戻る	管理者ログイン済／SEED-M16-02-BANNER-FILE（使い捨て画像）	削除対象の画像1件	"1. /admin/data/top_banner を開き #upload_wrap まで移動
2. 対象画像の「削除」リンクを押下し確認ダイアログを承認"	対象オブジェクトが削除され、#upload_wrap 付きのGET /admin/data/top_banner へリダイレクトされること。				
m16-02_admin_data_data_top_banner（データ管理 — トップバナー管理）	E2E-M16-02-040	IT-03	画面遷移	P2	店舗絞り込みドロップダウンで特定店舗を選ぶと絞り込みURLへ遷移する	管理者ログイン済／SEED-M16-02-BASEINFO（店舗digit有）	—	"1. /admin/data/top_banner を開き #upload_wrap まで移動
2. 店舗絞り込みドロップダウンで特定店舗を選択"	GET /admin/data/top_banner/{shop_digit}#upload_wrap へ遷移し、当該店舗のサブフォルダのみ一覧されること。				
m16-02_admin_data_data_top_banner（データ管理 — トップバナー管理）	E2E-M16-02-041	IT-25	確認ダイアログ	P3	一覧の削除リンクに削除確認文言が設定される	管理者ログイン済／SEED-M16-02-BANNER-FILE	—	"1. /admin/data/top_banner を開き #upload_wrap まで移動
2. 一覧の削除リンクの確認文言属性を確認"	削除リンクに確認文言「一度削除したデータは元に戻せません。削除してもよろしいですか？」が設定されていること。				
m16-02_admin_data_data_top_banner（データ管理 — トップバナー管理）	E2E-M16-02-042	IT-25	操作起点	P3	一覧に「画像URLコピー」ボタンが表示される	管理者ログイン済／SEED-M16-02-BANNER-FILE	—	1. /admin/data/top_banner を開き #upload_wrap まで移動	一覧の各画像行に「画像URLコピー」ボタンが表示されること（クリップボード実コピーは手動）。				
m16-02_admin_data_data_top_banner（データ管理 — トップバナー管理）	E2E-M16-02-043	IT-03	画面遷移	P3	店舗絞り込みドロップダウンで「全て」を選ぶと全店舗ルートへ戻る	管理者ログイン済／SEED-M16-02-BASEINFO（店舗digit有）	—	"1. /admin/data/top_banner/{shop_digit} を開く（店舗絞り込み状態）
2. 店舗絞り込みドロップダウンで「全て」を選択"	GET /admin/data/top_banner#upload_wrap（全店舗ルート）へ遷移し、banner/ 直下（店舗サブフォルダに限定されない）一覧が表示されること。				
m16-02_admin_data_data_top_banner（データ管理 — トップバナー管理）	E2E-M16-02-044	IT-03	画面遷移	P2	店舗選択ありでアップロードすると店舗サブフォルダ保存・店舗付きGETへ遷移する	管理者ログイン済／SEED-M16-02-BASEINFO／SEED-M16-02-BANNER-FILE（使い捨て）	520000バイト以下のGIF/JPEG/PNG画像＋特定店舗選択	"1. /admin/data/top_banner/{shop_digit} を開く（店舗絞り込み状態）
2. 店舗を選択し有効な画像を選択しアップロードボタンを押下"	当該店舗サブフォルダ（banner/{shop_digit}/ 相当）へ保存され、店舗付きGET /admin/data/top_banner/{shop_digit}#upload_wrap へ遷移し当該店舗の一覧に反映されること。				
m16-02_admin_data_data_top_banner（データ管理 — トップバナー管理）	E2E-M16-02-045	IT-15	状態変化	P2	店舗絞り込み一覧の削除リンクで店舗サブディレクトリ削除後に店舗付きGETへ戻る	管理者ログイン済／SEED-M16-02-BASEINFO／SEED-M16-02-BANNER-FILE（店舗サブフォルダの使い捨て画像）	削除対象の店舗サブフォルダ画像1件	"1. /admin/data/top_banner/{shop_digit} を開き #upload_wrap まで移動
2. 対象画像の「削除」リンクを押下し確認ダイアログを承認"	当該店舗サブディレクトリの対象オブジェクトが削除され、店舗付きGET /admin/data/top_banner/{shop_digit}#upload_wrap へリダイレクトされること。				
```

## 付帯表1：E2E自動化区分・セレクタ・仕様根拠・元ITケースID（TSV外）

DOM id は Symfony Form の名前付きビルダー由来。バナー設定フォーム名 `top_banner`（`TopBannerController.php:95` createNamedBuilder）から `image_url_{id}`→`#top_banner_image_url_{id}`、`link_{id}`→`#top_banner_link_{id}`、`disp_type_{id}`→`#top_banner_disp_type_{id}`（select）、`image_alt_{id}`→`#top_banner_image_alt_{id}`、`language_{id}`→`#top_banner_language_{id}_0` 等（ChoiceType `multiple+expanded` のため個別チェックボックスIDに連番展開。参照は属性前方一致 `input[id^="top_banner_language_"]`。`TopBannerType.php:112-120`）、`sort_no_{id}`→`#top_banner_sort_no_{id}`（`TopBannerType.php:70-128`）。アップロードフォーム名 `top_banner_upload`（同:98）から `base_info`→`#top_banner_upload_base_info`（select）、`file`→`#top_banner_upload_file`（`TopBannerUploadType.php:44-58`）。スロットの id は動的（`mtb_top_banner.id`）のため属性前方一致セレクタ（`input[id^="top_banner_image_url_"]`）で先頭スロットを参照する。行番号は ec-cube-enterprise 現行ソース。

| テストID | E2E可否 | 対象セレクタ（根拠 file:line / 要実機確認） | 仕様根拠 |
|----------|---------|----------------------------------------------|----------|
| E2E-M16-02-001 | E2E自動化(要ログイン) | 案内文(top_banner.twig:156) / button「バナー設定」trans `admin.data.top_banner.setting`(top_banner.twig:160 / messages.ja.yaml:5793) / a[href="#upload_wrap"]「▼画像設定」(top_banner.twig:164) | フロント挙動(表示要素)・利用者視点の入口 |
| E2E-M16-02-002 | E2E自動化(要ログイン) | th見出し `image_url/link_url/language/display_type/image_alt/sort_no`(top_banner.twig:180-219 / messages.ja.yaml:5794-5799) / `input[id^="top_banner_image_url_"]` 等(TopBannerType.php:79-128) | 入力項目定義 |
| E2E-M16-02-003 | E2E自動化(要ログイン) | block title `admin.data.top_banner`(top_banner.twig:15=「トップバナー管理」) / block sub_title `admin.data.data_management`(top_banner.twig:16=「データ管理」 / messages.ja.yaml:5791) | フロント挙動(タイトル/サブタイトル) |
| E2E-M16-02-004 | E2E自動化(要ログイン) | #upload_wrap(top_banner.twig:240) / #top_banner_upload_base_info(top_banner.twig:248) / #top_banner_upload_file(top_banner.twig:257) / button「アップロード」trans `admin.common.upload`(top_banner.twig:261 / messages.ja.yaml:1458) / .top-banner-upload-table thead(top_banner.twig:313-320) | フロント挙動(アップロード欄・一覧) |
| E2E-M16-02-005 | E2E自動化(要ログイン) | a[href="#upload_wrap"](top_banner.twig:164) | 利用者視点の入口(同一ページ内スクロール) |
| E2E-M16-02-006 | E2E自動化(資格情報不要) | 管理ログイン画面 #login_id(login.twig) | 権限・認可(未ログインは管理ログインへ) |
| E2E-M16-02-010 | E2E自動化(要ログイン・非破壊) | `input[id^="top_banner_image_url_"]` / .invalid-feedback(bootstrap_4_horizontal_layout.html.twig:55) | バリデーション(画像URL 最大長255 設計書「業務ルール・計算/画像URL」) |
| E2E-M16-02-011 | E2E自動化(要ログイン・非破壊) | `input[id^="top_banner_image_url_"]` / .invalid-feedback(:55) → `admin.data.top_banner.image_url__regex_error`(validators.ja.yaml:127=「「admin.hareruyamtg.com」は指定できません。」) | バリデーション(画像URL 参照禁止ホスト 設計書「バリデーション/画像URL」) |
| E2E-M16-02-012 | E2E自動化(要ログイン・非破壊) | `input[id^="top_banner_link_"]` / .invalid-feedback(:55) | バリデーション(リンク先URL 最大長255 設計書「バリデーション/リンク先URL」) |
| E2E-M16-02-013 | E2E自動化(要ログイン・非破壊) | `input[id^="top_banner_sort_no_"]` / .invalid-feedback(:55) → `admin.data.top_banner.sort_no_required`(validators.ja.yaml:130=「並び順が空の項目があります。」 / TopBannerType.php:138) | エッジケース(並び順が空)・付帯表4#2(実装はサーバ側検証) |
| E2E-M16-02-014 | E2E自動化(要ログイン・非破壊) | `input[id^="top_banner_sort_no_"]` / .invalid-feedback(:55) → `admin.data.top_banner.sort_no_duplicate`(validators.ja.yaml:131=「並び順が重複しています。」 / TopBannerType.php:149) | エッジケース(並び順が重複)・付帯表4#2 |
| E2E-M16-02-020 | E2E自動化(要ログイン・非破壊) | #top_banner_upload_file / #top-banner-upload-error(top_banner.twig:259、JS top_banner.twig:104) → `admin.data.top_banner.upload_required`(messages.ja.yaml:5807=「画像ファイルを選択してください。」) | 処理フロー(ファイル未選択)・JS挙動 |
| E2E-M16-02-021 | E2E自動化(要ファイル fixture) | #top_banner_upload_file / .invalid-feedback → `admin.data.top_banner.upload_not_image`(validators.ja.yaml:134=「ファイルがGIF・JPG・PNGではありません。」 / TopBannerUploadType.php:71) | バリデーション(画像ファイル形式) |
| E2E-M16-02-022 | E2E自動化(要ファイル fixture) | #top_banner_upload_file / .invalid-feedback → `admin.data.top_banner.upload_max_size`(validators.ja.yaml:133 / TopBannerUploadType.php:80) | バリデーション(サイズ上限520000 設計書「画像ファイル」) |
| E2E-M16-02-007 | E2E自動化(要ログイン・非破壊) | プレビュー画像 `.top-banner-table img`(top_banner.twig:177 src=`TopBanner.imageUrl`) / `input[id^="top_banner_image_url_"]`(同値=`data`:getImageUrl TopBannerType.php:82) | フロント挙動(表示要素「プレビュー画像」設計書 line 42) |
| E2E-M16-02-030 | E2E自動化/破壊的(要使い捨てシード) | button「バナー設定」 / リダイレクト先URL(/data/top_banner) | 処理フロー(バナー設定成功→GETリダイレクト Controller.php:137-140)。注: 店舗絞り込みルートからのPOST成功は `/data/top_banner/{digit}` へ戻る分岐（admin_data_top_banner_filter／設計書 line 230・SEED-M16-02-BASEINFO併用で確認・付帯表4#1） |
| E2E-M16-02-031 | E2E自動化/破壊的(要使い捨てシード＋画像fixture) | button「アップロード」 / リダイレクト先URL(/data/top_banner#upload_wrap) | 処理フロー(アップロード成功→#upload_wrap付きGET Controller.php:121) |
| E2E-M16-02-032 | E2E自動化/破壊的(要使い捨て画像シード) | a[data-method="delete"][data-message](top_banner.twig:349-352) / リダイレクト先URL(#upload_wrap) | 処理フロー(削除→#upload_wrap付きGET Controller.php:185-192) |
| E2E-M16-02-040 | E2E自動化(要店舗digitシード) | .top-banner-filter details summary / .dropdown-item(top_banner.twig:271-308) / リダイレクト先URL(/data/top_banner/{digit}#upload_wrap) | 利用者視点の入口(店舗絞り込みGET)・画面遷移 |
| E2E-M16-02-041 | E2E自動化(要画像シード) | a[data-method="delete"] data-message `admin.data.top_banner.delete_confirm`(top_banner.twig:352 / messages.ja.yaml:5810) | フロント挙動(削除は確認ダイアログ)・エラー処理 |
| E2E-M16-02-042 | E2E自動化(要画像シード) | button.js-copy-url「画像URLコピー」trans `admin.data.top_banner.upload_copy_url`(top_banner.twig:339-341 / messages.ja.yaml:5805) | フロント挙動(URLコピー。実コピーは手動) |
| E2E-M16-02-043 | E2E自動化/保留(要店舗digitシード＋絞り込み状態) | `.top-banner-filter__menu a.dropdown-item[href$="/data/top_banner#upload_wrap"]`「全て」trans `admin.data.top_banner.filter_all`(top_banner.twig:291-296) / リダイレクト先URL(/data/top_banner#upload_wrap) | 画面遷移(店舗ドロップダウンで「全て」→全店舗ルート 設計書 line 234)。「全て」アンカーは絞り込み中(filterBaseInfoDigit!=null)のみ描画(twig:291) |
| E2E-M16-02-044 | E2E自動化/破壊的(要店舗digitシード＋画像fixture) | #top_banner_upload_base_info(特定店舗選択) / button「アップロード」 / リダイレクト先URL(/data/top_banner/{digit}#upload_wrap) | 処理フロー(店舗選択ありアップロード→banner/{html_class}/保存・店舗付き#upload_wrap 設計書 lines 80-83,231) |
| E2E-M16-02-045 | E2E自動化/破壊的(要店舗digitシード＋店舗サブフォルダ画像) | a[data-method="delete"][href*="/delete"]（filter時 `admin_data_top_banner_delete_filter` top_banner.twig:344-352） / リダイレクト先URL(/data/top_banner/{digit}#upload_wrap Controller.php:185-189) | 処理フロー(店舗サブディレクトリDELETE→店舗付き#upload_wrap 設計書 lines 32,85-90) |

注: 既存IT cases（接頭辞 `IT-M16-02-ADMIN-DATA-DATA-TOP-BANNER-NNN`）は観点名のみの定型自動生成スタブであり、操作手順・期待が汎用文（「対象画面を表示する」等）で機能固有シナリオを持たない。本E2Eは設計書本文（利用者視点の入口・処理フロー・バリデーション・画面遷移・エラー処理）を一次情報源として網羅した。行単位対応は付帯表2b。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合は既存 `m16_02_admin_data_data_top_banner_it_cases.md` の関連ID件数（IT-22=35/IT-23=22/IT-26=10/IT-25=9/IT-03=7/IT-15=4/IT-20=2/IT-13=1＝計90）。各観点行を E2E自動化／手動・間接／対象外(理由) に振り分ける。内訳は **付帯表2b（行単位明細・全90行）** が正本。

| IT-ID | 母集合 | E2E自動化 | 手動/間接 | 対象外 | 対象外/手動の主な理由 |
|-------|:-----:|:--------:|:--------:|:------:|------------------|
| IT-22 | 35 | 9 | 4 | 22 | 本機能の実バリデーションは画像URL長/参照禁止ホスト・リンク長・並び順必須/重複・ファイル必須/形式/サイズに限定。スタブの汎用「数値/文字種/部分入力/汎用相関」細目は本機能に非該当。最大長ちょうど等の正常保存はDB更新を伴い間接 |
| IT-23 | 22 | 0 | 0 | 22 | 本機能は利用者向けDB検索を行わない（`mtb_top_banner` の id 昇順取得は内部処理。一覧はストレージ由来）。検索条件・実行結果はブラウザ観測対象にならない |
| IT-26 | 10 | 4 | 4 | 2 | 保存成功時のリダイレクト・HTTP到達/拒否は自動化。mtb_top_banner/言語中間テーブルの原値・主キーはDB内部で間接/対象外 |
| IT-25 | 9 | 5 | 1 | 3 | UI部品・操作起点・確認ダイアログ文言・成功/失敗時画面は自動化。一覧2000件の厳密件数はストレージ依存で手動。専用モーダル無し・フロント10件・表示除外は本管理機能で非該当 |
| IT-03 | 7 | 3 | 4 | 0 | 画面遷移（保存/アップロード/店舗絞り込み）は自動化。エラー再描画の一覧不一致・言語未選択保存・ストレージのみ更新・LastModified降順はDB/ストレージ内部で間接 |
| IT-15 | 4 | 3 | 1 | 0 | 未認証ガード・状態変化（保存/アップロード/削除）は自動化。CSRF不正時のHTTP403はブラウザ観測可能だが、トークン改ざんの自動化が不安定なため手動で403確認（要確認） |
| IT-20 | 2 | 0 | 0 | 2 | パスワード/トークン/Cookie値のログ出力抑止＝ブラウザ観測外 |
| IT-13 | 1 | 1 | 0 | 0 | 未ログイン直接アクセス誘導は自動化 |
| 合計 | 90 | 25 | 14 | 51 | **未分類 0** |

注: 対象外51件はいずれも「ブラウザで観測不能（DB内部値・ログ出力）」「本機能で非該当（DB検索なし・専用モーダルなし・フロント別ブロック）」が理由であり、放置ではない。CSRF（IT行001）は403がブラウザ観測可能なため対象外ではなく手動に分類（要確認）。

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-15 | CSRF | 手動/間接 | CSRF不正時のHTTP403応答はブラウザ観測可能だが、トークン改ざんの自動化が不安定なため手動/APIで403を確認（付帯表4・要確認） |
| 002 | IT-15 | 未認証 | E2E自動化 | 006（未ログインで保護URL→ログイン誘導） |
| 003 | IT-15 | 対象データ | E2E自動化 | 031（アップロード→ストレージ保存） |
| 004 | IT-20 | 出力抑止 | 対象外 | ログ出力抑止はブラウザ観測外 |
| 005 | IT-20 | 識別子 | 対象外 | ログ識別子はブラウザ観測外 |
| 006 | IT-15 | 状態変化 | E2E自動化 | 030/032（保存・削除による状態変化） |
| 007 | IT-25 | UI部品(JS挙動) | E2E自動化 | 020（ファイル未選択JS阻止）/013/014（並び順検証） |
| 008 | IT-25 | UI部品(モーダル) | 対象外 | 専用モーダルなし（確認は共通ダイアログ＝041で文言確認） |
| 009 | IT-25 | 操作起点(一覧2000件) | 手動/間接 | 表示件数の厳密上限はストレージ件数依存で手動 |
| 010 | IT-25 | 確認ダイアログ(フロント10件) | 対象外 | ストアフロントのスライド表示は別ブロック・本管理機能外 |
| 011 | IT-25 | 確認ダイアログ(表示除外) | 対象外 | フロント抽出クエリ挙動・本管理機能外 |
| 012 | IT-25 | 確認ダイアログ(リンクURL) | E2E自動化 | 002（リンク先URL入力欄表示） |
| 013 | IT-25 | 送信可否制御(表示タイプ) | E2E自動化 | 002（表示タイプ入力欄表示） |
| 014 | IT-03 | 外部画面(並び順) | E2E自動化 | 002（並び順入力欄表示）/013 |
| 015 | IT-03 | 画面遷移(店舗パス選択) | E2E自動化 | 040（店舗絞り込み遷移） |
| 016 | IT-03 | 画面遷移(画像アップロード) | E2E自動化 | 031（アップロード→#upload_wrap遷移） |
| 017 | IT-03 | 画面遷移(検証失敗×絞り込み一覧不一致) | 手動/間接 | 実装エッジ・一覧内容比較が不安定で間接 |
| 018 | IT-03 | 画面遷移(言語未選択でも保存続行) | 手動/間接 | 保存続行はDB確認＝間接 |
| 019 | IT-03 | 画面遷移(ストレージのみ更新) | 手動/間接 | DB非更新の確認＝間接 |
| 020 | IT-03 | 画面遷移(一覧LastModified降順) | 手動/間接 | ストレージ並び順依存で間接 |
| 021 | IT-13 | URL直接アクセス | E2E自動化 | 006（未ログイン直接アクセス誘導） |
| 022 | IT-25 | HTTPステータス(成功時出力) | E2E自動化 | 030/031（リダイレクト） |
| 023 | IT-25 | URL(失敗時出力) | E2E自動化 | 010-014/021/022（失敗時 同一画面再描画・エラー） |
| 024 | IT-22 | 必須バリデーション(未入力→エラー) | E2E自動化 | 013（並び順空エラー） |
| 025 | IT-22 | 必須バリデーション(未入力でも継続) | 手動/間接 | 任意項目空での保存継続はDB確認＝間接 |
| 026 | IT-22 | 文字列長(最大長 継続) | 手動/間接 | 255文字ちょうどの正常保存はDB更新＝間接 |
| 027 | IT-22 | 文字列長(最大長+1 エラー) | E2E自動化 | 010/012（画像URL/リンク 256文字エラー） |
| 028 | IT-22 | 文字列長(最小長 継続) | 対象外 | 最小長制約なし（該当なし） |
| 029 | IT-22 | 文字列長(最小長-1 エラー) | 対象外 | 最小長制約なし（該当なし） |
| 030 | IT-22 | 文字列長(ファイル未選択等) | E2E自動化 | 020（ファイル未選択エラー） |
| 031 | IT-22 | 文字列長(delete不存在) | 対象外 | 不存在はエラーにせずリダイレクト＝バリデーション非該当 |
| 032-039 | IT-22 | 数値バリデーション(8行) | 自動化 2 / 対象外 6 | 033→013（並び順空・数値必須）/034→014（並び順重複）。残り6は6桁等の数値細目が本機能に非該当 |
| 040,041 | IT-22 | 文字種バリデーション(2行) | 自動化 1 / 対象外 1 | 041→011（画像URL参照禁止ホスト＝文字種拒否）。040は該当細目なし |
| 042-050 | IT-22 | その他のバリデーション(9行) | 自動化 1 / 対象外 8 | 047→021（非画像ファイル）。043（リンク先URL文字種）は `011`(画像URL参照禁止ホスト)とは別項目で、リンク先URLには実装にRegex検証が無く設計のみ＝付帯表4#7「要確認」のため自動化せず対象外。残り7は本機能に該当細目なし |
| 051-054 | IT-22 | 相関バリデーション(4行) | 自動化 1 / 対象外 3 | 051→014（並び順重複＝相関）。残り3は汎用相関が非該当 |
| 055,056 | IT-22 | DBとの相関バリデーション(2行) | 手動/間接 2 | 本機能にDB相関検証なし。保存系のDB相関は間接 |
| 057 | IT-22 | 必須制御 | E2E自動化 | 013（並び順必須）/030（保存到達） |
| 058 | IT-22 | 部分入力 | 対象外 | 固定スロット入力に部分入力観点は非該当 |
| 059-074 | IT-23 | 検索条件(16行) | 対象外 | 本機能は利用者向けDB検索を行わない |
| 075-079 | IT-23 | 実行結果(5行) | 対象外 | 同上（検索実行結果なし） |
| 080 | IT-26 | 登録内容(追加) | 手動/間接 | mtb_top_banner保存の間接確認（成功画面は030） |
| 081 | IT-26 | 登録内容(追加されない) | 対象外 | 本機能は新規追加せず更新のみ（DB内部） |
| 082 | IT-26 | 登録内容(追加) | 手動/間接 | 言語中間テーブル更新の間接確認 |
| 083 | IT-26 | 登録内容(追加) | 手動/間接 | DB更新の間接確認 |
| 084 | IT-26 | 登録内容(リダイレクト/HTML) | E2E自動化 | 030（保存成功リダイレクト） |
| 085 | IT-23 | 登録内容(失敗時出力) | 対象外 | IT-23検索観点として非該当（失敗画面は023相当=010-014で別途カバー） |
| 086 | IT-26 | 登録内容(put/delete副作用) | E2E自動化 | 031/032（アップロード/削除の遷移で間接観測） |
| 087 | IT-26 | 登録内容(主キー) | 対象外 | DB内部値（主キー）はブラウザ観測外 |
| 088 | IT-26 | 登録内容(直接保存) | 手動/間接 | persist/flushの確定はDB確認＝間接 |
| 089 | IT-26 | 登録内容(HTTP到達) | E2E自動化 | 001（画面到達） |
| 090 | IT-26 | 登録内容(未ログイン到達しない) | E2E自動化 | 006（未ログイン誘導） |

集計（付帯表2と一致）: 自動化 25（002,003,006,007,012,013,014,015,016,021,022,023,024,027×2[010/012],030,033,034,041[文字種],047,051,057,084,086,089,090 を IT-ID別に合算）／ 手動・間接 14（001[CSRF403],009,017,018,019,020,025,026,055,056,080,082,083,088）／ 対象外 51（残り）。**未分類 0**。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-M16-02-ADMIN | dtb_member(管理者) | 当ナビ（データ管理→トップバナー管理）へ到達できる有効な管理者1。ログインID/パスワードは config 既定 | fixture(config既定 `ECCUBE_ADMIN_USER/PASS`) | 既存利用・撤去不要 | 001-005,010-014,020,040,041,042 |
| SEED-M16-02-BANNER | mtb_top_banner | バナー設定表が描画できるスロット（初期マイグレーションの連番id・欠番なし）。参照系（表示・バリデーション失敗）でのみ使用し原値を変更しない | migration(ec-cube-enterprise正典)/fixture | 参照のみ・撤去不要。検証失敗ケースは非破壊（保存されない） | 001-005,010-014,020 |
| SEED-M16-02-BANNER-DISP | mtb_top_banner(使い捨て) | バナー設定保存成功用。保存でDB更新されるためテスト後に原値へ復元または専用環境で実行 | migration/fixture | 使い捨て・テスト毎に復元 | 030 |
| SEED-M16-02-BANNER-FILE | オブジェクトストレージ `banner/`（または `banner/{shop_digit}/`） | 一覧に表示・削除できる画像オブジェクト1件以上 | synthetic(UIアップロード)/fixture(ストレージput) | 使い捨て・識別接頭辞付与・テスト後に削除 | 031,032,041,042 |
| SEED-M16-02-BASEINFO | dtb_base_info | 店舗絞り込みドロップダウンに出る `shop_digit` を持つ店舗1（東京拠点 BaseInfo::TC_TOKYO_ID 相当が既定選択） | migration(現行 mtb_shop.html_class → base_info.shop_digit 対応)/fixture | 参照のみ・撤去不要 | 040 |

注: 画像ファイル fixture は GIF/JPEG/PNG（≤520000バイト）と、形式エラー用の非画像（text/plain）・サイズ超過用（>520000バイト）を用意する。アップロード/削除成功系はストレージへ副作用が出るため、専用接頭辞での投入と後始末を必須とする。`migration` を選ぶ場合 DB は ec-cube-enterprise 正典（reverse-design 1c）に従い、現行 `mtb_shop.html_class` ↔ 移行先 `base_info.shop_digit` のキー対応を移行設計で吸収する。共通ログインは `config/default.config.ts`。

## 付帯表4：不具合候補（仕様乖離）／要確認

設計書は現行 pf-eccube3（HareruyaEc プラグイン）のリバース。刷新先 ec-cube-enterprise のセレクタ（位置情報）と突き合わせ、仕様乖離を列挙する。**テストは仕様どおりに書き、実装が違えば落ちて検出する。期待値を実装へ書き換えない。**

| # | 仕様（設計書/観点表） | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | 入口URLは `GET/POST/DELETE /{admin_route}/banner/top`（pf-eccube3） | ec-cube-enterprise は `/{admin_route}/data/top_banner`（TopBannerController.php:52-53,156-157）。フォーム名も `hareruyaec_banner`→`top_banner` | ルート/フォーム名が刷新で変更。E2Eのナビゲーション（位置情報）は実装ルートを用い、上位オラクル（操作の意味＝バナー画面表示・保存・削除）で合否判定 | 全件 | 要確認(ルート変更) |
| 2 | 並び順の空・重複は**クライアント脚本が submit を中止**し、サーバーは重複検証をしない | 実装は**サーバ側 POST_SUBMIT 検証**で `sort_no_required`/`sort_no_duplicate` をフォームエラーに追加（TopBannerType.php:131-155 / validators.ja.yaml:130-131） | 検証場所がJS→サーバへ移動。観測される最終結果（保存されずエラー表示）は仕様の意図と整合。E2Eはサーバ応答のエラー表示で確認 | 013,014 | 要確認(検証場所の差) |
| 3 | バナー設定検証失敗は `admin.error.text_over`（banner.length=255 埋め込み）を `bannerError` で表示 | 実装の項目エラー（最大長/参照禁止ホスト）は `form_errors` のインライン `.invalid-feedback` 表示。`bannerError` は保存時 RuntimeException 経路のみ（Controller.php:136-137,200-208） | 失敗時のエラー表示位置/文言経路が異なる。E2Eは「エラー表示＋同一画面滞留」を仕様由来の期待にし、特定文言/位置に固定しない | 010,011,012 | 要確認(エラー表示経路) |
| 4 | バナー設定保存成功時は**フラッシュメッセージを付けずリダイレクトのみ** | 実装は `addSuccess('admin.common.save_complete')`＝「保存しました」を付与しリダイレクト（Controller.php:138-140）。アップロード成功は「アップロードしました」、削除は「削除しました」も付与（:119,175） | 刷新でフラッシュ付与が追加。E2Eの合否は遷移（GETへリダイレクト）で判定し、フラッシュ有無は期待値に固定しない | 030,031,032 | 要確認(フラッシュ付与) |
| 5 | 画像URLの参照禁止メッセージキーは `admin.banner.regex_error` | 実装キーは `admin.data.top_banner.image_url__regex_error`＝「「admin.hareruyamtg.com」は指定できません。」（validators.ja.yaml:127） | メッセージキー差。拒否挙動（参照禁止ホストを不正とする）は整合。E2Eは拒否される事実で確認 | 011 | 要確認(キー差) |
| 6 | 店舗絞り込みは「ドロップダウンで店舗を選ぶ」 | 実装は `<details>/<summary>` のリンク列（top_banner.twig:271-308）でJS不要のアンカー遷移。`<select>` ではない | UI実装形態の差（select→details）。遷移先URL（/data/top_banner/{digit}#upload_wrap）で合否判定 | 040 | 要確認(UI形態) |
| 7 | リンク先URLは「最大255文字。許容文字種は正規表現（英数字と記号の集合）」（設計書「表示メッセージ／バリデーション」） | 実装の `link` フィールドは `Length(max=eccube_stext_len)` のみで Regex 制約なし（TopBannerType.php:92-99。画像URLは Regex で参照禁止ホスト拒否だがリンクには無い） | 設計書はリンク先URLに文字種正規表現を規定するが、実装は長さ制約のみで文字種検証が無い。許容文字種の不正値拒否はE2E化できない（仕様が正規の許容集合を具体化せず、実装にも検証が無いため）。リンク文字種の異常系は手動/要確認とし、長さ超過のみ自動化(012) | 012 | 要確認(リンク文字種検証の有無＝仕様乖離の可能性) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口 | 画面表示・店舗絞り込みGET・▼画像設定アンカー・POST/DELETE到達 | 001-005,040,043 / POST・DELETE到達は030,031,032,044,045 | 部分カバー（表示・GET遷移・アンカーは非破壊で実装済。POST保存/アップロード/DELETE到達は破壊系のためspecでは test.fixme＝要実行環境） |
| フロント挙動／表示要素 | 案内文・バナー設定ボタン・各スロット入力欄・プレビュー画像・アップロード欄・一覧表・URLコピー/削除 | 001,002,004,007,041,042 | カバー（プレビュー画像=007 は非破壊で実装。URLコピー実コピー/削除リンク表示=041,042 は要画像シードで test.fixme） |
| フロント挙動／JS挙動 | 並び順空/重複の送信阻止・ファイル未選択阻止・URLコピー | 013,014,020,042 | カバー(検証場所は付帯表4#2) |
| 処理フロー(画面表示GET) | スロット昇順表示・一覧降順表示 | 001,002 / 一覧降順は手動 | 一部カバー |
| 処理フロー(バナー設定POST) | 成功時GETリダイレクト・失敗時同一画面再描画 | 030,010,011,012,013,014 | カバー |
| 処理フロー(アップロードPOST) | 成功時#upload_wrap付きGET・店舗選択時の店舗サブフォルダ保存・未選択/サイズ/非画像エラー | 020(非破壊実装) / 021,022,031,044(fixme) | 部分カバー（ファイル未選択JS阻止=020 のみ非破壊で実装。成功保存・形式/サイズエラー・店舗サブフォルダ保存は要fixture/シードで test.fixme） |
| 処理フロー(削除DELETE) | 確認後削除→#upload_wrap付きGET・店舗サブディレクトリ削除・不存在はスキップ | 032,045,041(全てfixme) / 不存在は手動 | 部分カバー（削除・店舗サブ削除・確認文言は破壊系/要画像シードで test.fixme。不存在スキップは手動） |
| 並び順と永続化の対応 | 並び順による行マッピング | (DB内部ロジック) | 手動/間接(DB確認) |
| 集計条件(一覧2000件・フロント10件) | 表示件数 | （件数厳密はストレージ/フロント依存） | 手動/対象外(理由付き) |
| 業務ルール(画像URL/リンク長・参照禁止ホスト・ファイル) | 各バリデーション | 010,011,012,021,022 | カバー（リンク先URLの許容文字種=正規表現は実装に検証が無く仕様乖離の可能性。文字種の異常系は要確認・付帯表4#7） |
| 入力項目(画像URL/リンク/言語/表示タイプ/alt/並び順) | 入力欄存在・必須/形式 | 002,010-014 | カバー |
| エッジケース(並び順空/重複・id欠番・検証失敗×絞り込み・言語未選択) | 空/重複検証 | 013,014 / 残りは手動 | 一部カバー |
| データ整合性(DBとストレージ独立・後勝ち) | 自動連携しない・後勝ち | （DB内部） | 対象外/手動(DB内部) |
| DBカラム/DB操作 | mtb_top_banner・言語中間テーブルの登録/更新 | 030,031(破壊系fixme) / 原値は間接 | 手動/間接（自動化分も破壊系のため spec では test.fixme） |
| バリデーション(画像URL/リンク/ファイル/CSRF) | 各エラー・403 | 010,011,012,021,022 / CSRF403は手動 / リンク文字種は要確認 | 一部カバー(CSRFは手動・リンク文字種は要確認・付帯表4#7) |
| 権限・認可 | ログイン運用者は到達・未ログインは到達不可（GET/POST/アップロード/DELETE） | 006(未ログインGET誘導) / POST・アップロード・DELETEの未認可拒否は要確認 | 部分カバー（未ログインGET誘導=006 を実装。POST保存/アップロード/DELETEの未認可拒否は未写像＝要確認） |
| 画面遷移 | GET正常・保存/アップロード/削除リダイレクト・店舗ドロップダウン(特定/全て) | 005(非破壊実装),030,031,032,040,043,044,045(fixme) | 部分カバー（▼画像設定アンカー=005 は非破壊で実装。保存/アップロード/削除/店舗遷移(特定040・全て043・店舗アップロード044・店舗削除045)は破壊系・要シードで test.fixme） |
| エラー処理 | CSRF403・bannerError/error・不存在スキップ | 010-014,020,021,022 / CSRF403・不存在は手動 | カバー(一部手動) |
| 試行制限 | （本機能は扱わない） | — | 対象外(該当なし) |
| ログ・監査／ログに出してはいけないもの | 秘密情報の出力抑止 | （対象外＝観測外） | 対象外(理由付き) |
| セッション／Cookie | 本機能固有の読書き/新設なし | （該当なし） | 対象外(該当なし) |
| 排他制御・トランザクション | 楽観ロックなし・後勝ち | （DB内部） | 対象外/手動(DB内部) |
| API/バッチ結果 | （扱わない） | — | 対象外(該当なし) |

未カバーはいずれも理由（DB/ストレージ内部値・件数厳密はストレージ依存・CSRFはフレームワーク内部・本機能で該当なし・ログ観測外）を明記済み。正常系（030/031/032/044/045・表示001-005/007・店舗遷移040/043）と異常系（010-014/020-022・006）の対を確保した。

**自動化実装区分の注記（過大主張の是正）**: 「カバー」表記のうち spec に test として実装済み（非破壊で常時実行可）は 006・001-005・007・010-014・020 のみ。破壊系（DB更新／ストレージput・delete）および専用シード/画像fixtureを要する 021,022,030,031,032,040,041,042,043,044,045 は spec では `test.fixme`（理由付き）で抜け漏れを可視化しており「実装済み自動化」ではない。付帯表5の各行はこの区別を反映して「カバー（非破壊実装）」「部分カバー（破壊系はfixme・要実行環境）」へ整理した。付帯表2/2b の「E2E自動化」件数は**自動化可能（observable）**の母集合分類であり、**実装済み件数ではない**点に留意（観点行→E2E可否は付帯表1、実装状況は spec）。
