# m01-02_admin_login_two_factor_auth（管理画面_二段階認証） E2Eテストケース

元設計: `function_spec_html_preview/ec-cube-enterprise/m01-02_admin_login_two_factor_auth.html`（正本 `functions/ec-cube-enterprise/m01-02_admin_login_two_factor_auth.md`）

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/m01_02_admin_login_two_factor_auth_it_cases.md`（母集合 計90観点行）

期待結果は画面表示・遷移・URL・別画面での間接確認などブラウザで観測できる結果で判定する。**期待結果は仕様（設計書・観点表・基本設計）由来**とし、実装/POM由来の表示文言をオラクル化しない。TSV は既存IT casesの10列に実施管理欄（実施者・実施日・結果・失敗理由）を加えた14列固定。E2E固有情報は TSV 後の付帯表に `テストID` で対応づける。Playwright は本リポジトリでは実行しない（構造参考のみ）。未検証セレクタは `要実機確認`。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-25 | 各画面のUI部品・プレースホルダ・見出し・タイトル・ヘッダリンク表示 |
| IT-03 | 画面遷移（保護URL→追加認証/初回設定誘導・成功時ホーム遷移・/set→/auth誘導・本人再設定Cookie無効時ホーム） |
| IT-13 | URL直接アクセス（未ログイン誘導・システム2FA無効/認証済みでホーム） |
| IT-22 | 必須/形式（6桁）バリデーション・TOTP相関・試行制限 |
| IT-15 | 認証済みCookie付与・属性（HTTPOnly等）・未認証ガード |
| IT-26 | 秘密鍵更新（two_factor_auth_key）の間接確認・メンバー一覧設定状態表示 |
| IT-20 | ログ出力抑止（秘密鍵・トークン・Cookie値）＝ブラウザ観測外 |
| IT-23 | DB検索（本機能は検索を行わない。メンバー一覧検索は別機能m11） |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-001	IT-25	UI部品	P2	追加認証画面にトークン入力欄・認証ボタンが表示される	個別2FA ON／秘密鍵設定済／未認証／SEED-M01-02-2FA-SECRET	—	"1. 当該管理者でID/PW認証する
2. 追加認証画面（/admin/two_factor_auth/auth）を表示する"	見出し「2段階認証」・6桁トークン入力欄・送信ボタン「認証」が表示されること。	Codex	2026-07-06	〇	
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-002	IT-25	表示結果	P3	追加認証画面のトークン欄にプレースホルダ「トークン」が表示される	個別2FA ON／秘密鍵設定済／未認証／SEED-M01-02-2FA-SECRET	—	1. 追加認証画面を表示する	トークン入力欄にプレースホルダ「トークン」が表示されること。	Codex	2026-07-06	〇	
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-003	IT-25	UI部品	P2	初回設定画面にQR説明文・トークン欄・登録ボタンが表示される	個別2FA ON／秘密鍵未設定／未認証／SEED-M01-02-2FA-NOSECRET	—	"1. 当該管理者でID/PW認証する
2. 初回設定画面（/admin/two_factor_auth/set）を表示する"	見出し「2段階認証」・説明文「QRコードを2段階認証用スマートフォンアプリで読み込み、表示された6桁の数字を入力してください。」・QR表示領域・トークン入力欄・送信ボタン「登録」が表示されること。	Codex	2026-07-06	×	初回設定画面GETで500。実装例外: TwoFactorAuthController::set(): Return value must be of type RedirectResponse, array returned (/var/ec-cube/src/Eccube/Controller/Admin/Setting/System/TwoFactorAuthController.php:97)。
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-004	IT-25	UI部品	P3	本人の再設定画面に見出し・QRラベル・必須トークン・登録ボタンが表示される	個別2FA ON／秘密鍵設定済／認証済みCookie有効／SEED-M01-02-2FA-SECRET	—	1. 認証済みの管理者で本人再設定画面（/admin/setting/system/two_factor_auth/edit）を表示する	サブタイトル「システム設定」・カード見出し「2段階認証」・「QRコード」ラベル・「トークン」ラベル（必須バッジ付）・送信ボタン「登録」が表示されること。	Codex	2026-07-06	×	本人再設定画面GETで500。実装例外: TwoFactorAuthController::edit(): Return value must be of type RedirectResponse, array returned (/var/ec-cube/src/Eccube/Controller/Admin/Setting/System/TwoFactorAuthController.php:114)。
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-005	IT-03	表示結果	P2	本人再設定画面で秘密鍵設定済のとき再設定警告が表示される	個別2FA ON／秘密鍵設定済／認証済みCookie有効／SEED-M01-02-2FA-SECRET	—	1. 認証済みの管理者で本人再設定画面をGET表示する	警告「既に2段階認証の設定が行われています。再設定すると登録済みのデバイスが使用出来なくなります。」が表示されること。	Codex	2026-07-06	×	本人再設定画面GETで500。実装例外: TwoFactorAuthController::edit(): Return value must be of type RedirectResponse, array returned (/var/ec-cube/src/Eccube/Controller/Admin/Setting/System/TwoFactorAuthController.php:114)。
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-010	IT-03	画面遷移	P1	正しい6桁トークンで追加認証に成功しホームへ遷移する	個別2FA ON／秘密鍵設定済／未認証／SEED-M01-02-2FA-SECRET	既知秘密鍵から算出した現在時刻の有効な6桁トークン	"1. 追加認証画面を表示する
2. 有効な6桁トークンを入力
3. 認証ボタンを押下"	ホーム画面相当へ遷移すること。	Codex	2026-07-06	〇	
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-011	IT-26	登録内容	P1	初回設定で6桁トークンが一致すると秘密鍵が確定し成功メッセージが表示される	個別2FA ON／秘密鍵未設定／未認証／SEED-M01-02-2FA-NOSECRET-ONCE（使い捨て）	画面の隠し秘密鍵候補から算出した有効な6桁トークン	"1. 初回設定画面を表示する
2. 隠し項目の秘密鍵候補から有効な6桁トークンを算出し入力
3. 登録ボタンを押下"	成功メッセージ「2段階認証の設定が完了しました。」が表示され、ホーム画面相当へ遷移すること。	Codex	2026-07-06	×	初回設定画面GETで500となり #admin_two_factor_auth_auth_key が出現せずタイムアウト。原因は TwoFactorAuthController::set() の戻り値型不整合（RedirectResponse指定にarray返却）。
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-012	IT-26	更新内容	P1	本人再設定で6桁トークンが一致すると秘密鍵が更新され成功メッセージが表示される	個別2FA ON／秘密鍵設定済／認証済みCookie有効／SEED-M01-02-2FA-RESET（使い捨て）	画面の隠し秘密鍵候補から算出した有効な6桁トークン	"1. 本人再設定画面を表示する
2. 隠し項目の新秘密鍵候補から有効な6桁トークンを算出し入力
3. 登録ボタンを押下"	成功メッセージ「2段階認証の設定が完了しました。」が表示され、ホーム画面相当へ遷移すること。	Codex	2026-07-06	×	本人再設定画面GETで500となり #admin_two_factor_auth_auth_key が出現せずタイムアウト。原因は TwoFactorAuthController::edit() の戻り値型不整合（RedirectResponse指定にarray返却）。
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-020	IT-22	必須バリデーション	P1	追加認証でトークン未入力だと再入力メッセージが表示される	個別2FA ON／秘密鍵設定済／未認証／SEED-M01-02-2FA-SECRET	トークン＝空	"1. 追加認証画面を表示する
2. トークンを空のまま認証ボタンを押下"	「トークンに誤りがあります。再度入力してください。」が表示され、追加認証画面に留まること。	Codex	2026-07-06	×	トークン空送信時、ブラウザのHTML5 required制約で送信が止まり .text-danger が出現しないため期待メッセージ検出に失敗。入力欄は追加認証画面に留まる。
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-021	IT-22	文字列長バリデーション	P2	追加認証で6桁以外を入力すると再入力メッセージが表示される	個別2FA ON／秘密鍵設定済／未認証／SEED-M01-02-2FA-SECRET	トークン＝6桁未満（例 12345）	"1. 追加認証画面を表示する
2. 6桁未満を入力し認証ボタンを押下"	「トークンに誤りがあります。再度入力してください。」が表示され、追加認証画面に留まること。	Codex	2026-07-06	〇	
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-022	IT-22	DBとの相関バリデーション	P1	追加認証でTOTP不一致だと再入力メッセージが表示される	個別2FA ON／秘密鍵設定済／未認証／SEED-M01-02-2FA-SECRET	トークン＝形式は正しいが不一致の6桁	"1. 追加認証画面を表示する
2. 不一致の6桁を入力し認証ボタンを押下"	「トークンに誤りがあります。再度入力してください。」が表示され、追加認証画面に留まること。	Codex	2026-07-06	〇	
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-030	IT-22	文字列長バリデーション	P1	初回設定で6桁以外を入力すると形式不正メッセージが表示される	個別2FA ON／秘密鍵未設定／未認証／SEED-M01-02-2FA-NOSECRET	トークン＝6桁未満（例 12345）	"1. 初回設定画面を表示する
2. 6桁未満を入力し登録ボタンを押下"	「トークンに誤りがあります。数字6桁で入力してください。」が表示され、初回設定画面に留まること。	Codex	2026-07-06	×	初回設定画面GETで500となり #admin_two_factor_auth_device_token が出現せずタイムアウト。原因は TwoFactorAuthController::set() の戻り値型不整合（RedirectResponse指定にarray返却）。
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-031	IT-22	DBとの相関バリデーション	P1	初回設定でTOTP不一致だと再入力メッセージが表示される	個別2FA ON／秘密鍵未設定／未認証／SEED-M01-02-2FA-NOSECRET	画面の秘密鍵候補と一致しない有効書式の6桁	"1. 初回設定画面を表示する
2. 形式は正しいが不一致の6桁を入力し登録ボタンを押下"	「トークンに誤りがあります。再度入力してください。」が表示され、初回設定画面に留まること。	Codex	2026-07-06	×	初回設定画面GETで500となり #admin_two_factor_auth_auth_key が出現せずタイムアウト。原因は TwoFactorAuthController::set() の戻り値型不整合（RedirectResponse指定にarray返却）。
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-040	IT-22	文字列長バリデーション	P2	本人再設定で6桁以外を入力すると形式不正メッセージが表示される	個別2FA ON／秘密鍵設定済／認証済みCookie有効／SEED-M01-02-2FA-SECRET	トークン＝6桁未満（例 12345）	"1. 本人再設定画面を表示する
2. 6桁未満を入力し登録ボタンを押下"	「トークンに誤りがあります。数字6桁で入力してください。」が表示され、本人再設定画面に留まること。	Codex	2026-07-06	×	本人再設定画面GETで500となり #admin_two_factor_auth_device_token が出現せずタイムアウト。原因は TwoFactorAuthController::edit() の戻り値型不整合（RedirectResponse指定にarray返却）。
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-041	IT-22	DBとの相関バリデーション	P2	本人再設定でTOTP不一致だと再入力メッセージが表示される	個別2FA ON／秘密鍵設定済／認証済みCookie有効／SEED-M01-02-2FA-SECRET	画面の秘密鍵候補と一致しない有効書式の6桁	"1. 本人再設定画面を表示する
2. 形式は正しいが不一致の6桁を入力し登録ボタンを押下"	「トークンに誤りがあります。再度入力してください。」が表示され、本人再設定画面に留まること。	Codex	2026-07-06	×	本人再設定画面GETで500となり #admin_two_factor_auth_auth_key が出現せずタイムアウト。原因は TwoFactorAuthController::edit() の戻り値型不整合（RedirectResponse指定にarray返却）。
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-050	IT-03	画面遷移	P1	個別2FA ON・秘密鍵あり・未認証で保護URLへ進むと追加認証画面へ誘導される	個別2FA ON／秘密鍵設定済／未認証／SEED-M01-02-2FA-SECRET	保護された管理URL	1. 当該管理者でID/PW認証後、保護された管理URLへアクセス	追加認証画面（/admin/two_factor_auth/auth）へ誘導されること。	Codex	2026-07-06	〇	
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-051	IT-03	画面遷移	P1	個別2FA ON・秘密鍵なし・未認証で保護URLへ進むと初回設定画面へ誘導される	個別2FA ON／秘密鍵未設定／未認証／SEED-M01-02-2FA-NOSECRET	保護された管理URL	1. 当該管理者でID/PW認証後、保護された管理URLへアクセス	初回設定画面（/admin/two_factor_auth/set）へ誘導されること。	Codex	2026-07-06	〇	
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-052	IT-13	URL直接アクセス	P2	秘密鍵設定済が初回設定画面へ入ろうとすると追加認証画面へ誘導される	個別2FA ON／秘密鍵設定済／未認証／SEED-M01-02-2FA-SECRET	—	1. 未認証のまま初回設定画面（/admin/two_factor_auth/set）へ直接アクセス	初回設定画面を表示せず追加認証画面へ誘導されること（未認証での秘密鍵再設定を防ぐ）。	Codex	2026-07-06	〇	
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-053	IT-03	画面遷移	P1	個別2FA OFFの管理者は追加認証なしで保護画面を利用できる	個別2FA OFF／SEED-M01-02-2FA-OFF	—	1. 当該管理者でID/PW認証後、保護された管理URLへアクセス	追加認証へ誘導されず保護画面を利用できること。	Codex	2026-07-06	〇	
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-054	IT-15	状態変化	P2	追加認証成功後はCookie有効期間内は再度追加認証を要求されない	個別2FA ON／秘密鍵設定済／追加認証成功直後／SEED-M01-02-2FA-SECRET	—	"1. 追加認証に成功する
2. 同一ブラウザで保護された管理URLへ再アクセス"	追加認証画面へ誘導されず保護画面を利用できること。	Codex	2026-07-06	〇	
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-055	IT-13	URL直接アクセス	P2	認証済みCookie有効で追加認証画面へ直接アクセスするとホームへ遷移する	個別2FA ON／秘密鍵設定済／認証済みCookie有効／SEED-M01-02-2FA-SECRET	—	1. 認証済みのまま追加認証画面（/admin/two_factor_auth/auth）へ直接アクセス	追加認証画面を表示せずホーム画面相当へリダイレクトされること。	Codex	2026-07-06	〇	
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-056	IT-03	画面遷移	P2	本人再設定で認証済みCookieが無効だとホームへ送られガードで再誘導される	個別2FA ON／秘密鍵設定済／認証済みCookie無効／SEED-M01-02-2FA-SECRET	—	1. 認証済みCookie無効の状態で本人再設定画面（/admin/setting/system/two_factor_auth/edit）へアクセス	本人再設定画面を表示せずホーム画面相当へ送られ、以降のガードで追加認証画面へ誘導されること。	Codex	2026-07-06	〇	
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-057	IT-03	画面遷移	P2	システム2FAが無効なら個別2FA状態によらず追加認証なしで保護画面を利用できる	システム2FA無効／個別2FA ON／SEED-M01-02-2FA-SECRET	—	"1. システム2FAを無効にする
2. 当該管理者でID/PW認証後、保護された管理URLへアクセス"	追加認証・初回設定へ誘導されず保護画面を利用できること（判定順序#1）。	Codex	2026-07-06	×	未実施。システム2FA無効化は共有設定変更を伴う手動/隔離環境ケースで、今回の自動実行specなし。
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-060	IT-13	URL直接アクセス	P2	未ログインで追加認証URLへ直接アクセスすると管理ログイン画面へ誘導される	未ログイン	—	1. /admin/two_factor_auth/auth へ直接アクセス	管理ログイン画面へ誘導されること。	Codex	2026-07-06	〇	
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-061	IT-13	URL直接アクセス	P2	未ログインで初回設定・本人再設定URLへ直接アクセスすると管理ログイン画面へ誘導される	未ログイン	—	1. /admin/two_factor_auth/set または /admin/setting/system/two_factor_auth/edit へ直接アクセス	管理ログイン画面へ誘導されること。	Codex	2026-07-06	〇	
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-070	IT-25	操作起点	P3	個別2FA ONの管理者はヘッダに「2段階認証 設定」リンクが表示される	個別2FA ON／認証済み／SEED-M01-02-2FA-SECRET	—	1. ログイン後ヘッダのユーザーメニューを開く	ユーザーメニュー内に「2段階認証 設定」リンクが表示されること。	Codex	2026-07-06	〇	
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-071	IT-25	操作起点	P3	個別2FA OFFの管理者はヘッダに「2段階認証 設定」リンクが表示されない	個別2FA OFF／SEED-M01-02-2FA-OFF	—	1. ログイン後ヘッダのユーザーメニューを開く	ユーザーメニュー内に「2段階認証 設定」リンクが表示されないこと。	Codex	2026-07-06	〇	
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-080	IT-22	必須制御	P2	追加認証POSTがユーザー単位5回/30分の上限を超えると制限メッセージが表示される	個別2FA ON／秘密鍵設定済／未認証／SEED-M01-02-2FA-LOCK	誤った6桁での連続失敗	"1. 誤トークンで5回失敗
2. 6回目を送信"	「試行回数の上限を超過しました。しばらくお待ちいただき、再度お試しください。」が表示されること。	Codex	2026-07-06	×	test.fixmeで未実行。専用IP隔離とRateLimiter/Redis状態初期化ハーネスが未実装。
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-090	IT-15	対象データ	P2	追加認証成功時にHTTPOnlyの認証済みCookieが付与される	個別2FA ON／秘密鍵設定済／未認証／SEED-M01-02-2FA-SECRET	有効な6桁トークン	1. 追加認証成功の前後でブラウザのCookieを比較する	追加認証成功後に新規の認証済みCookieが付与され、当該CookieがHttpOnly属性であること（Cookie名は仕様固定でないため名称一致では判定しない）。	Codex	2026-07-06	〇	
m01-02_admin_login_two_factor_auth（管理画面_二段階認証）	E2E-M01-02-091	IT-26	更新内容	P2	本人再設定成功後は旧秘密鍵に基づくトークンでは追加認証できない	個別2FA ON／秘密鍵設定済→再設定済／SEED-M01-02-2FA-SECRET	旧秘密鍵から算出した6桁	"1. 本人再設定で秘密鍵を更新する
2. 認証済みCookieを破棄し追加認証画面で旧秘密鍵由来のトークンを入力"	旧秘密鍵由来のトークンでは認証に失敗し「トークンに誤りがあります。再度入力してください。」が表示されること。	Codex	2026-07-06	×	未実施。本人再設定成功後の旧秘密鍵無効化は、再設定画面が500で到達不能かつ複数手順の手動/間接ケースのため今回の自動実行specなし。
```

## 付帯表1：E2E自動化区分・セレクタ・仕様根拠・元ITケースID（TSV外）

DOM id は Symfony Form の getBlockPrefix=`admin_two_factor_auth`（`TwoFactorAuthType.php:62-64`）から導出（`device_token`→`#admin_two_factor_auth_device_token`、`auth_key`→`#admin_two_factor_auth_auth_key`、`_token`→`#admin_two_factor_auth__token`）。追加認証画面では `auth_key` が `$builder->remove('auth_key')`（`TwoFactorAuthController.php:52`）で除去される。行番号は ec-cube-enterprise 現行ソース（`nl -ba` 基準）。

| テストID | E2E可否 | 対象セレクタ（根拠 file:line / 要実機確認） | 仕様根拠 |
|----------|---------|----------------------------------------------|----------|
| E2E-M01-02-001/002 | E2E自動化(要シード) | #admin_two_factor_auth_device_token(two_factor_auth.twig:34 placeholder `...device_token`=「トークン」 messages.ja.yaml:3023) / button trans `...two_factor_auth.auth`=「認証」(two_factor_auth.twig:39 / messages.ja.yaml:3024) / h5 `...two_factor_auth_title`=「2段階認証」(two_factor_auth.twig:25 / messages.ja.yaml:3021) | 表示メッセージ(追加認証画面)・フロント挙動(表示要素) |
| E2E-M01-02-003 | E2E自動化(要シード) | QR説明 `tooltip...qr_code`(two_factor_auth_set.twig:50 / messages.ja.yaml:3485) / #qrcode(two_factor_auth_set.twig:51) / #admin_two_factor_auth_device_token(set.twig:58) / button trans `admin.common.registration`=「登録」(set.twig:63 / messages.ja.yaml:1436) | 表示メッセージ(初回設定画面) |
| E2E-M01-02-004 | E2E自動化(要シード/要Cookie) | サブタイトル `admin.setting.system`(two_factor_auth_edit.twig:16) / card-title `...two_factor_auth_title`(edit.twig:58) / `...two_factor_auth.qr`=「QRコード」(edit.twig:70 / messages.ja.yaml:3022) / 必須バッジ `admin.common.required`(edit.twig:81) / button「登録」(edit.twig:113) | 表示メッセージ(本人再設定画面) |
| E2E-M01-02-005 | E2E自動化(要シード/要Cookie) | フラッシュ警告 `...configured_warning`(messages.ja.yaml:3025、TwoFactorAuthController.php addWarning) | 表示メッセージ(GET時秘密鍵あり警告)・エッジケース |
| E2E-M01-02-010 | E2E自動化(要シード＋TOTP生成) | #admin_two_factor_auth_device_token / button「認証」 | 判定順序#7＋処理フロー(追加認証 成功時ホーム＋Cookie付与 Controller.php:60-61) |
| E2E-M01-02-011 | E2E自動化(要シード＋TOTP生成・隠し鍵をDOM取得) | #admin_two_factor_auth_auth_key(set.twig:48 hidden) / #admin_two_factor_auth_device_token / button「登録」 | 処理フロー(初回設定 成功時保存＋成功メッセージ Controller.php:143-147) |
| E2E-M01-02-012 | E2E自動化(要RESETシード＋TOTP生成＋要Cookie) | #admin_two_factor_auth_auth_key(edit.twig:51 hidden) / #admin_two_factor_auth_device_token / button「登録」 | 処理フロー(本人再設定 成功時更新＋成功メッセージ Controller.php:143-147) |
| E2E-M01-02-020/021/022 | E2E自動化(要シード) | .text-danger(two_factor_auth.twig:28) | エラー処理(追加認証は失敗理由を区別しない＝`invalid_message__reinput` Controller.php:65,71 / messages.ja.yaml:3027) |
| E2E-M01-02-030/040 | E2E自動化(要シード) | .text-danger(set.twig:53 / edit.twig:91) | エラー処理(形式不正＝`invalid_message__invalid` Controller.php:154 / messages.ja.yaml:3028) |
| E2E-M01-02-031/041 | E2E自動化(要シード) | .text-danger(set.twig:53 / edit.twig:91) | エラー処理(TOTP不一致＝`invalid_message__reinput` Controller.php:151 / messages.ja.yaml:3027) |
| E2E-M01-02-050/051 | E2E自動化(要シード) | リダイレクト先URL / #admin_two_factor_auth_device_token | 判定順序#7/#8＋画面遷移＋権限・認可 |
| E2E-M01-02-052 | E2E自動化(要シード) | リダイレクト先URL(/two_factor_auth/auth) | 判定順序#4(Controller.php:92-94) |
| E2E-M01-02-053 | E2E自動化(要シード 個別2FA OFF) | 保護画面が表示される | 判定順序#5＋権限・認可(個別2FA OFFは誘導しない) |
| E2E-M01-02-054 | E2E自動化/間接(要シード) | 保護画面が表示される | 判定順序#6(認証済みCookie有効) |
| E2E-M01-02-055 | E2E自動化(要シード/要Cookie) | リダイレクト先URL(ホーム) | 処理フロー(Cookie有効で各画面直接アクセス→ホーム Controller.php:46-47) |
| E2E-M01-02-056 | E2E自動化(要シード/Cookie無効) | リダイレクト先URL(ホーム) | 処理フロー(本人再設定 Cookie無効→ホーム Controller.php:106-107) |
| E2E-M01-02-057 | 手動(システム設定 eccube_2fa_enabled の切替が必要) | 保護画面が表示される | 判定順序#1＋権限・認可(システム2FA無効は誘導しない TwoFactorAuthService.php:124-131 isEnabled) |
| E2E-M01-02-060/061 | E2E自動化(資格情報不要) | 管理ログイン画面 #login_id | 利用者視点の入口(未ログインは管理ログイン対象) |
| E2E-M01-02-070/071 | E2E自動化(要シード・ポップオーバー要実機確認) | ヘッダ user メニュー内 link「2段階認証 設定」(default_frame.twig:184 `if app.user.two_factor_auth_enabled` / messages.ja.yaml:1704) | 表示メッセージ(ヘッダ・個別2FA ON時のみ) |
| E2E-M01-02-080 | E2E自動化(要データ生成・要隔離) | .text-danger 等 | 試行制限(追加認証POST 5回/30分 messages.ja.yaml:3585) |
| E2E-M01-02-090 | E2E自動化/間接(要シード・context.cookies差分) | 認証成功前後のCookie差分＋HttpOnly属性(TwoFactorAuthService.php:109 httpOnly=true)。**Cookie名は仕様非固定のため名称一致では判定しない**（実装確認値 eccube_2fa は :34、名称は環境変数 ECCUBE_2FA_COOKIE_NAME 由来 :49-56） | Cookie(認証済みCookie付与・HttpOnly)・設計書「Cookie名は機能仕様として固定しない」 |
| E2E-M01-02-091 | 手動/間接(要シード・複数手順) | .text-danger(two_factor_auth.twig:28) | データ整合性(秘密鍵更新で旧トークン無効化) |

注: `元ITケースID` の行単位対応付けは別途実施（既存IT cases接頭辞 `IT-M01-02-ADMIN-LOGIN-TWO-FACTOR-AUTH-NNN`）。既存IT casesは観点名のみの定型自動生成であり、本E2Eは設計書本文（判定順序・表示メッセージ・処理フロー）を一次情報源として網羅した。

## 付帯表2：分類サマリ（母集合＝既存IT cases 90観点行・未分類0）

母集合は既存 `m01_02_admin_login_two_factor_auth_it_cases.md` の関連ID件数（IT-22=35/IT-23=22/IT-26=10/IT-25=9/IT-03=7/IT-15=4/IT-20=2/IT-13=1＝計90）。各観点行を E2E自動化／手動・間接／対象外(理由) に振り分ける。

既存IT casesは**観点名のみの定型自動生成スタブ**（操作手順が「対象画面を表示する」等の汎用文）であり、機能固有のシナリオを持たない。本機能の入力はデバイストークン（6桁数字）のみであるため、各スタブ行の観点を「本機能においてブラウザで観測可能か」で分類する。下記は IT-ID 別の集計で、内訳は **付帯表2b（行単位明細・全90行）** が正本。サマリはその集計値である。

| IT-ID | 母集合 | E2E自動化 | 手動/間接 | 対象外 | 対象外の主な理由 |
|-------|:-----:|:--------:|:--------:|:------:|------------------|
| IT-22 | 35 | 11 | 0 | 24 | 6桁トークンに非該当の細目（数値・文字種・部分入力・汎用相関）はブラウザ操作で観測対象にならない。本機能の入力は6桁トークンのみ |
| IT-23 | 22 | 0 | 0 | 22 | 本機能はDB検索を行わない（検索条件・実行結果はメンバー一覧検索＝別機能m11_01へ委譲） |
| IT-26 | 10 | 4 | 2 | 4 | 秘密鍵更新は画面で原値を観測不能。成功メッセージ／Cookie／初回保存は自動化、旧トークン無効化等は間接 |
| IT-25 | 9 | 2 | 0 | 7 | 確認ダイアログ・モーダル・送信可否制御は本機能で不使用、メンバー画面UIは別機能m11へ委譲 |
| IT-03 | 7 | 7 | 0 | 0 | 画面遷移・表示はすべて本機能で観測可能 |
| IT-15 | 4 | 2 | 1 | 1 | CSRFはフレームワーク内部完結。Cookie属性(Secure/SameSite)はSSL設定依存で手動 |
| IT-20 | 2 | 0 | 0 | 2 | 秘密鍵・トークン・Cookie値のログ出力抑止＝ブラウザ観測外 |
| IT-13 | 1 | 1 | 0 | 0 | |
| 合計 | 90 | 27 | 3 | 60 | **未分類 0** |

注: 対象外60件はいずれも「ブラウザで観測不能」「本機能で非該当」「別機能m11へ委譲」が理由であり、放置ではない。

## 付帯表2b：観点行 行単位分類（既存IT cases 全90行・未分類0の監査用）

既存IT cases の各行（`...-NNN`）の観点を、本機能でのブラウザ観測可否で `E2E自動化／手動・間接／対象外` に分類し、対応E2EケースIDまたは理由を付す。スタブは観点が汎用のため、同一観点が連番で重複する。区分は行ごとに確定し、付帯表2の集計と一致する。

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-15 | CSRF | 対象外 | CSRFはSymfony Form内部で完結しブラウザ観測外 |
| 002 | IT-15 | 未認証 | E2E自動化 | 060/061/050（未認証・未完了ガード） |
| 003 | IT-15 | 対象データ | E2E自動化 | 090（認証済みCookie） |
| 004 | IT-20 | 出力抑止 | 対象外 | ログ出力抑止はブラウザ観測外 |
| 005 | IT-20 | 識別子 | 対象外 | ログ識別子はブラウザ観測外 |
| 006 | IT-15 | 状態変化 | 手動/間接 | Cookie属性 Secure/SameSite はSSL設定依存で手動（不具合候補#4） |
| 007 | IT-25 | UI部品 | E2E自動化 | 004（本人再設定画面UI） |
| 008 | IT-25 | UI部品 | 対象外 | メンバー編集UIは別機能m11_02へ委譲 |
| 009 | IT-25 | 操作起点 | E2E自動化 | 001（追加認証画面 表示要素） |
| 010 | IT-25 | 確認ダイアログ | 対象外 | 本機能はモーダル/確認ダイアログ不使用 |
| 011 | IT-25 | 確認ダイアログ | 対象外 | 同上（モーダル不使用） |
| 012 | IT-25 | 確認ダイアログ | 対象外 | 本機能は確認ダイアログを使わない（入力欄表示は009/007・E2E001/002でカバー済） |
| 013 | IT-25 | 送信可否制御 | 対象外 | 送信ボタンは常時活性でクライアント側の送信可否制御を持たない |
| 014 | IT-03 | 外部画面 | E2E自動化 | 001（見出し「2段階認証」） |
| 015 | IT-03 | 画面遷移 | E2E自動化 | 003（著作権含むログインフレーム） |
| 016 | IT-03 | 画面遷移 | E2E自動化 | 002（プレースホルダ） |
| 017 | IT-03 | 画面遷移 | E2E自動化 | 020（フォーム検証併記・要実機） |
| 018 | IT-03 | 画面遷移 | E2E自動化 | 003（QRコード説明文） |
| 019 | IT-03 | 画面遷移 | E2E自動化 | 004（本人再設定タイトル） |
| 020 | IT-03 | 画面遷移 | E2E自動化 | 005（再設定警告） |
| 021 | IT-13 | URL直接アクセス | E2E自動化 | 060/061/070（直接アクセス・ヘッダリンク） |
| 022 | IT-25 | HTTPステータス | 対象外 | 前提「一覧列見出し」＝メンバー一覧画面は別機能m11_01へ委譲（本機能の画面ではない） |
| 023 | IT-25 | URL | 対象外 | 前提「設定状態アイコンのツールチップ」＝メンバー一覧画面は別機能m11_01へ委譲 |
| 024,025 | IT-22 | 必須バリデーション | E2E自動化 | 020（トークン未入力→再入力） |
| 026-031 | IT-22 | 文字列長バリデーション | E2E自動化 | 021/030/040（6桁固定長 形式不正） |
| 032-039 | IT-22 | 数値バリデーション | 対象外 | 6桁トークン以外の数値入力は本機能に非該当 |
| 040,041 | IT-22 | 文字種バリデーション | 対象外 | 6桁数字のみで文字種観点は非該当 |
| 042-050 | IT-22 | その他のバリデーション | 対象外 | 6桁トークン入力に該当する細目なし |
| 051-054 | IT-22 | 相関バリデーション | 対象外 | 本機能の相関はTOTP/秘密鍵候補照合（055,056で代表）。汎用相関は非該当 |
| 055,056 | IT-22 | DBとの相関バリデーション | E2E自動化 | 022/031/041（TOTP照合不一致） |
| 057 | IT-22 | 必須制御 | E2E自動化 | 020（必須・空入力） |
| 058 | IT-22 | 部分入力 | 対象外 | 6桁固定長入力に部分入力観点は非該当 |
| 059-074 | IT-23 | 検索条件 | 対象外 | 本機能はDB検索を行わない（一覧検索は別機能m11_01） |
| 075-079 | IT-23 | 実行結果 | 対象外 | 同上（検索実行結果なし） |
| 080 | IT-26 | 登録内容 | 手動/間接 | 秘密鍵保存の間接確認（成功メッセージは082/086でカバー） |
| 081 | IT-26 | 登録内容 | 対象外 | 本機能はレコード新規追加を行わない（更新のみ） |
| 082 | IT-26 | 登録内容 | E2E自動化 | 011（初回設定 秘密鍵確定） |
| 083 | IT-26 | 登録内容 | E2E自動化 | 090（認証済みCookie付与） |
| 084 | IT-26 | 登録内容 | 手動/間接 | 091（本人再設定の秘密鍵更新＝旧トークン無効化で間接確認） |
| 085 | IT-23 | 登録内容 | 対象外 | DB検索観点として非該当（更新のみ） |
| 086 | IT-26 | 登録内容 | E2E自動化 | 011（QR確定で秘密鍵保存） |
| 087 | IT-26 | 登録内容 | 対象外 | 本人再設定到達は別機能ヘッダ経由（070でリンク確認・本体は委譲） |
| 088 | IT-26 | 登録内容 | 対象外 | メンバー編集は別機能m11_02へ委譲 |
| 089 | IT-26 | 登録内容 | E2E自動化 | 001（追加認証 表示要素） |
| 090 | IT-26 | 登録内容 | 対象外 | CSS・共通フレームで本機能固有の登録観測なし |

集計（付帯表2と一致）: 自動化 27（002,003,007,009,014,015,016,017,018,019,020,021,024,025,026-031=6,055,056,057,082,083,086,089）／ 手動・間接 3（006,080,084）／ 対象外 60（残り）。**未分類 0**。

## 付帯表3：シードデータ（個別流し込み・独立・べき等。実装済み）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-M01-02-2FA-SECRET | dtb_member / login_id=`e2e_2fa_secret` | システム2FA有効。個別2FA=ON（two_factor_auth_enabled=1）。**既知のTOTP秘密鍵を two_factor_auth_key に設定済**（テストがTOTPを算出するため）。base_info・既知ID/PW | fixture/migration | 専用ID・削除。秘密鍵を更新しない参照系のみで使う（更新系012は別アカウント）。テストは認証済みCookieを使い捨て | 001,002,004,005,010,020,021,022,040,041,050,052,054,055,056,070,090,091 |
| SEED-M01-02-2FA-RESET | dtb_member / login_id=`e2e_2fa_reset` | システム2FA有効。個別2FA=ON。**既知のTOTP秘密鍵を設定済**。**本人再設定で秘密鍵が破壊されるため使い捨て**（テスト毎に再投入または専用アカウント） | fixture/migration | 使い捨て・テスト毎に既知秘密鍵へ復元。後続テストへ影響させない | 012 |
| SEED-M01-02-2FA-NOSECRET | dtb_member / login_id=`e2e_2fa_nosecret` | システム2FA有効。個別2FA=ON。**秘密鍵未設定（two_factor_auth_key=NULL）**。既知ID/PW。**参照系のみ（初回設定成功で破壊しない）** | fixture/migration | 専用ID・削除。秘密鍵未設定状態を維持 | 003,030,031,051 |
| SEED-M01-02-2FA-NOSECRET-ONCE | dtb_member / login_id=`e2e_2fa_nosecret_once` | システム2FA有効。個別2FA=ON。**秘密鍵未設定（two_factor_auth_key=NULL）**。既知ID/PW。**初回設定成功011で秘密鍵が確定し破壊されるため使い捨て** | fixture/migration | 使い捨て・テスト毎にNULLへ復元（または専用アカウント）。共通NOSECRETと分離し後続(003/030/031/051)へ影響させない | 011 |
| SEED-M01-02-2FA-OFF | dtb_member / login_id=`e2e_2fa_off` | システム2FA有効。個別2FA=OFF（two_factor_auth_enabled=0）。既知ID/PW | fixture(config既定で代替可) | 専用ID・削除 | 053,071 |
| SEED-M01-02-2FA-LOCK | 試行制限状態 / 専用login_id＋専用IP | 追加認証POSTで失敗5回到達。**専用ID＋IP隔離＋テスト前にリミッタ(Redis)初期化でべき等化** | synthetic＋setup(初期化) | 専用・再現可能・隔離 | 080 |

注: TOTP秘密鍵は base32（RobThree\Auth\TwoFactorAuth 既定＝SHA1/30秒/6桁）。`createSecret()`（TwoFactorAuthService.php:120-122）が生成し `verifyCode($authKey,$token,2)`（同:114-117）が許容ウィンドウ±2で検証する。SECRETシードは秘密鍵原値をテスト環境変数で受け渡し、設計書・ログには原値を書かない。`migration` 時はDB=ec-cube-enterprise正典。共通ログインは `config/default.config.ts`／秘密鍵は環境変数で供給する。

### M01-02 シード適用・再利用手順

M01-02 のシード実体は `e2e/seed/sets/m01/SEED-M01-02-*.sql`、登録情報は `e2e/seed/manifest.json`、Playwright から参照する環境変数は `e2e/config/seed.config.ts` に定義済み。テスト前に以下を実行して、正常系・異常系・破壊系を同じ状態へ戻してから使う。

```bash
e2e/seed/lib/apply.sh SEED-M01-02-2FA-SECRET SEED-M01-02-2FA-RESET SEED-M01-02-2FA-NOSECRET SEED-M01-02-2FA-NOSECRET-ONCE SEED-M01-02-2FA-OFF SEED-M01-02-2FA-LOCK
eval "$(e2e/seed/lib/seed-env.sh)"
cd e2e
npx playwright test spec/admin/two_factor_auth.spec.ts --reporter=list
```

`SEED-M01-02-2FA-RESET` と `SEED-M01-02-2FA-NOSECRET-ONCE` は成功系テストで `two_factor_auth_key` が更新されるため、再実行前に上記 `apply.sh` を再実行して既知状態へ戻す。`SEED-M01-02-2FA-LOCK` は専用管理者と既知秘密鍵までを提供する。RateLimiter/Redis のカウンタ状態はDBシード外のため、E2E-M01-02-080 の完全自動化には専用IP隔離とリミッタ初期化ハーネスを併用する。

## 付帯表4：不具合候補（仕様乖離）／要確認

| # | 仕様 | 実装(file:line) | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | 追加認証の失敗は理由を区別せず常に「再度入力してください。」 | TwoFactorAuthController.php:66(form不正),72(TOTP不一致) ともに `invalid_message__reinput` | 静的確認済。空入力時にフォーム検証「入力されていません。」が併記されるか実機確認 | 020,021,022 | 要確認(併記表示) |
| 2 | 初回設定・本人再設定は形式不正と不一致で文言が分かれる | Controller.php:154(invalid),151(reinput) / set.twig:53・edit.twig:91 `.text-danger` | 静的確認済。set画面はinline `{{error}}`、edit画面は addError(フラッシュ)＋inline の二重表示有無を実機確認 | 030,031,040,041 | 要確認(表示位置) |
| 3 | device_token は6桁固定（必須・6桁） | TwoFactorAuthType.php:37-43(NotBlank/Length min=max=6)・twig attr maxlength=6 | フォーム制約は静的確認済だが**期待値は設計書(6桁固定)由来**でオラクル化。maxlength属性により7桁以上の入力可否は実機確認 | 021,030,040 | 要確認(セレクタ/属性) |
| 4 | 認証済みCookie属性 HttpOnly=true／Secure・SameSiteはSSL設定連動 | TwoFactorAuthService.php:100-110(httpOnly=true, secure/SameSite=force_ssl連動) | HttpOnlyは観測可。Secure/SameSite=NoneはSSL強制設定依存のため環境依存・手動 | 090 | 要確認(環境依存) |
| 5 | 追加認証POSTにユーザー単位5回/30分の試行制限 | 設計書「試行制限」(m01-02.md:411-419「本番向けレート制限設定にて…掛かりうる」) vs 既定config `app/config/eccube/packages/eccube_rate_limiter.yaml` は `shopping_*` のみで **`admin_two_factor_auth` 用 limiter 未設定**。`TwoFactorAuthController`/`TwoFactorAuthService` にも throttling コード無し | **既定環境では2FAの試行制限は非活性＝実装乖離候補**。設計書も「本番向けレート制限設定」と条件付き記載。本番向けlimiter設定を投入した環境でのみ080が成立。初回設定/本人再設定POSTの制限対象可否も併せて要確認 | 080 | 要確認(環境依存/実装乖離候補) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 利用者視点の入口 | 各画面URL・未ログイン誘導 | 060,061,050,051 | カバー |
| フロント挙動／表示要素 | 追加認証(トークン欄/認証ボタン)・初回設定(QR/登録)・本人再設定(QRラベル/必須/登録) | 001,002,003,004 | カバー |
| 処理フロー(入口ガード) | #7追加認証誘導・#8初回設定誘導・#4 /set→/auth・#5 OFF・#6 Cookie有効 | 050,051,052,053,054 | カバー |
| 処理フロー(追加認証) | 成功時ホーム＋Cookie・失敗時滞留再入力 | 010,020,021,022 | カバー |
| 処理フロー(初回設定) | 成功時保存＋成功メッセージ・形式不正/不一致 | 011,030,031 | カバー |
| 処理フロー(本人再設定) | 成功時更新・Cookie無効時ホーム・形式不正/不一致 | 012,040,041,056 | カバー |
| 判定順序 #1 システム2FA無効/管理リクエストでない | 誘導しない＝保護画面利用可 | 057 | カバー(手動・システム設定切替要) |
| 判定順序 #2 追加認証画面リクエスト | 後続実行（画面表示） | 001,002,010 | カバー |
| 判定順序 #3 初回設定リクエスト＋秘密鍵未設定 | 後続実行（初回設定表示） | 003,051 | カバー |
| 判定順序 #4 初回設定リクエスト＋秘密鍵あり | 追加認証へ誘導 | 052 | カバー |
| 判定順序 #5 管理者でない/個別2FA OFF | 誘導しない | 053 | カバー |
| 判定順序 #6 認証済みCookie有効 | 誘導しない | 054,055 | カバー |
| 判定順序 #7 秘密鍵あり | 追加認証画面へ誘導 | 050 | カバー |
| 判定順序 #8 秘密鍵なし | 初回設定画面へ誘導 | 051 | カバー |
| 表示メッセージ(追加認証 再入力) | `...invalid_message__reinput` | 020,021,022 | カバー |
| 表示メッセージ(初回/再設定 形式不正) | `...invalid_message__invalid` | 030,040 | カバー |
| 表示メッセージ(初回/再設定 TOTP不一致) | `...invalid_message__reinput` | 031,041 | カバー |
| 表示メッセージ(成功) | `...complete_message` | 011,012 | カバー |
| 表示メッセージ(再設定警告) | `...configured_warning` | 005 | カバー |
| 表示メッセージ(プレースホルダ/見出し/ボタン) | トークン/2段階認証/認証/登録 | 001,002,003,004 | カバー |
| 表示メッセージ(タイトル `<title>`) | 「ログイン - {店舗名}」(login_frame.twig:16)・「システム設定 2段階認証 - {店舗名}」(edit.twig:15) | 004(サブタイトル「システム設定」で部分確認) | 一部手動({店舗名}動的・login系titleは低価値で手動) |
| 表示メッセージ(noscript) | 「JavaScriptを有効に…」 | （JS無効が前提＝対象外） | 対象外(JS無効状態が必要) |
| 表示メッセージ(著作権) | 「Copyright … EC-CUBE …」 | （静的・低価値） | 対象外(低価値・共通フレーム) |
| 表示メッセージ(ヘッダリンク) | 「2段階認証 設定」ON時のみ | 070,071 | カバー(ポップオーバー要実機確認) |
| 表示メッセージ(試行制限) | `exception.error_message_rate_limit`(messages.ja.yaml:3585) | 080(test.fixme) | 要確認(本番向けレート制限設定依存。既定configに `admin_two_factor_auth` limiter 未設定で非活性＝環境依存/実装乖離候補。付帯表4#5) |
| 表示メッセージ(メンバー一覧 完了/未完了ツールチップ) | `...member.two_factor_auth_completed/incompleted` | （別機能m11_01へ委譲） | 対象外(委譲) |
| 画面遷移 | 保護URL→誘導・成功→ホーム・Cookie有効→ホーム | 050,051,010,055,057 | カバー |
| 権限・認可 | 個別2FA OFFは利用可・ON未認証は誘導・本人再設定はCookie要・システム2FA無効は利用可 | 053,050,056,057 | カバー |
| バリデーション・入力項目 | 必須(空)・6桁固定長(形式不正)・TOTP相関 | 020,021,030,040,022,031,041 | カバー |
| Cookie・セッション | 認証済みCookie付与(HttpOnly)・有効期間内省略・属性(Secure/SameSite) | 090,054 / 属性は手動 | カバー(属性は要実機・SSL依存) |
| Cookie期限切れ/自動ログアウト | 有効期間切れで次回追加認証 | （時間依存＝手動） | 手動(時間依存) |
| 同一管理者の複数ブラウザ | 排他しない | （排他要件なし＝対象外） | 対象外(要件なし) |
| DB操作 | 秘密鍵 two_factor_auth_key 更新(間接)・旧トークン無効化 | 011,012,091 | 手動/間接 |
| メンバー編集(個別2FAトグル・ツールチップ) | トグル保存・説明文 | （別機能m11_02へ委譲） | 対象外(委譲) |
| ログ・監査 | 秘密鍵・トークン・Cookie値の出力抑止 | （対象外＝観測外） | 対象外(理由付き) |

未カバーはいずれも理由（観測不能・時間依存・SSL環境依存・JS無効前提・低価値共通フレーム・別機能m11へ委譲・システム設定変更要）を明記済み。判定順序#1〜#8は各分岐を行単位に分解し、#1のみ手動（システム設定切替要）とした。
