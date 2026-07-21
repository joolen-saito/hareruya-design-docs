# A15-02（デッキビルダー_ログアウト） E2Eテストケース

元設計md（正本一次・pf-api リバース）: `functions/pf-api/a15-02_api_deck_builder_deck_logout.md`
機能詳細HTML: `function_spec_html_preview/pf-api/a15-02_api_deck_builder_deck_logout.html`

テスト観点: `integration_test/integration-test-viewpoints.md` ／ 既存IT: `integration_test/a15_02_api_deck_builder_deck_logout_it_cases.md`（母集合 計38観点行）

本機能は画面を伴わない機能仕様（デッキビルダーアプリ向けの会員ログアウト JSON API。`POST`）であり、**両レイヤで網羅**する。本APIの観測可能な結果はJSONレスポンス（成功＝HTTP200・`{code, message}` の `message` が `Logout success`／失敗＝HTTP401・`{code, message}`）とログアウト成功時のトークンCookie空設定（副作用）であり、結果はEC-CUBE管理画面に現れずデッキビルダーアプリ側に返るため、主レイヤは **API/統合**（Playwright `request` でエンドポイントへPOST送信し、HTTPステータス・レスポンス本文の `code`／`message` 値・型契約・トークンCookie空設定（Set-Cookie）・冪等性で判定）。UIレイヤは0件（本APIの結果が管理画面に現れず、アクセストークンの発行はA15-01ログイン、各デッキビルダーAPIの認可は各APIの設計へ正本md「本書で扱わないこと」で委譲のため）。

**期待結果は仕様（正本md＝pf-api挙動／観点表）由来**とし、実装のレスポンス形・フレームワーク既定値・トークンライブラリ既定値を期待値に流用しない（オラクル独立性）。正本mdはリバース設計のため、基本設計・観点表を上位オラクルとし、移行先 ec-cube-enterprise 実装からは位置情報（APIパス・メソッド・認証方式・応答組み立て元）のみを `file:line` 根拠で取得し、取れないもの・刷新先の独自挙動・正本md未定義の挙動は `要実機確認` とする。設計（pf-api `POST /user/logout`・`aud` クレーム・トークンCookie空設定）と実装（ec-cube-enterprise `POST /api/user/logout`・`sub` クレーム・Cookie操作なし）の食い違いは付帯表4に出す。型契約（`code`＝integer、`message`＝string）は正本mdの仕様型で期待値化し、実装のキャスト差異があれば付帯表4へ出す。TSV は既存IT casesの10列に実施管理欄（実施者・実施日・結果・失敗理由）を加えた14列固定。Playwright は本リポジトリでは実行しない（構造参考のみ）。送信先パスは実装の実効パスに統一し、設計パスとの差異は付帯表4でのみ管理する（本体期待値に設計パスを混在させない）。

## 関連ID対応概要

| 関連ID | 本機能でのE2E確認範囲 |
|--------|------------------------|
| IT-32 | 資格情報（有効トークンのみログアウト成立）・受信検証（トークン検証）・必須条件（jwt-tokenヘッダ欠落→401）・異常パラメータ（不正トークン→401）・想定外項目（ボディは無視して200）・レスポンス（成功時の型契約）・データなし（aud対応プレイヤーなし→401）。バージョニングは正典にAPIバージョン指定が無く対象外 |
| IT-09 | 正常ログアウトのHTTPステータス200・実行結果（`{code, message}`返却）・リクエスト正常（ボディなし）・外部取得相当（audの会員IDで既知プレイヤー照合） |
| IT-19 | 同時実行数の制限は本APIにレート制限の仕様/実装が無く（参照とCookie操作・応答整形のみ・排他/トランザクション対象なし）対象外 |
| IT-10 | HTTPステータス・通信・正常/異常系・エラー（認証失敗401本文）・認証拒否（重複・順序）・タイムアウト。複数バリデーション一括返却/ソート順・外部キャッシュ・決済代行・転送再連携は本機能に非該当で対象外 |
| IT-33 | 数量・金額・履歴の連携更新観点は本機能が認証＋Cookie操作のみ（業務データ更新・外部連携なし）で全件非該当・対象外 |

## テストケースTSV

```tsv
機能名	テストID	I/FID	テスト観点	優先度	テスト項目名	前提条件	入力データ/リクエスト内容	操作手順/実行方法	期待結果／レスポンス	実施者	実施日	結果	失敗理由
a15-02_api_deck_builder_deck_logout（API_デッキビルダー_ログアウト）	E2E-A15-02-001	IT-32	資格情報	P1	有効なトークンを持つ会員でログアウトが成立する	SEED-A15-02-PLAYER／SEED-A15-02-JWT-SECRET	有効なjwt-tokenヘッダ（既知プレイヤーの会員IDを持つ）	"1. jwt-tokenヘッダに有効トークンを付与してログアウトAPIへPOST送信する
2. HTTPステータスを確認する"	有効なトークンを持つ会員のみログアウトが成立し、HTTP200が返ること。				
a15-02_api_deck_builder_deck_logout（API_デッキビルダー_ログアウト）	E2E-A15-02-002	IT-09	実行結果	P1	成功時に本文のcode=200・message=Logout successが返る	SEED-A15-02-PLAYER／SEED-A15-02-JWT-SECRET	有効なjwt-token	"1. ログアウトAPIへPOST送信する
2. レスポンス本文のcode・messageを確認する"	応答本文のcodeが200、messageが「Logout success」であること。				
a15-02_api_deck_builder_deck_logout（API_デッキビルダー_ログアウト）	E2E-A15-02-003	IT-09	HTTPステータス	P1	ログアウト成功時のHTTPステータスが200である	SEED-A15-02-PLAYER／SEED-A15-02-JWT-SECRET	有効なjwt-token	"1. ログアウトAPIへPOST送信する
2. HTTPステータスを確認する"	ログアウト成功時のHTTPステータスが200であること。				
a15-02_api_deck_builder_deck_logout（API_デッキビルダー_ログアウト）	E2E-A15-02-004	IT-09	リクエスト	P2	リクエストボディを持たずヘッダのみで正常実行される	SEED-A15-02-PLAYER／SEED-A15-02-JWT-SECRET	有効なjwt-token（リクエストボディなし）	"1. リクエストボディを付けずjwt-tokenヘッダのみでログアウトAPIへPOST送信する
2. HTTPステータスを確認する"	リクエストボディを持たずjwt-tokenヘッダのみで正常実行され、HTTP200が返ること。				
a15-02_api_deck_builder_deck_logout（API_デッキビルダー_ログアウト）	E2E-A15-02-005	IT-32	リクエスト	P1	jwt-tokenヘッダ欠落で認証拒否となる	SEED-A15-02-PLAYER	jwt-tokenヘッダなし	"1. jwt-tokenヘッダを付与せずログアウトAPIへPOST送信する
2. HTTPステータスを確認する"	jwt-tokenヘッダが欠落した場合、認証拒否（HTTP401）となること。				
a15-02_api_deck_builder_deck_logout（API_デッキビルダー_ログアウト）	E2E-A15-02-006	IT-32	リクエスト	P3	想定外項目を加えても無視され認証成功する	SEED-A15-02-PLAYER／SEED-A15-02-JWT-SECRET	有効なjwt-token＋ボディに想定外の項目（項目名と値のセット）	"1. ボディに想定外項目を含めてログアウトAPIへPOST送信する
2. HTTPステータスを確認する"	ボディに想定外項目を加えても無視され、有効なトークンで認証成功（HTTP200）すること。				
a15-02_api_deck_builder_deck_logout（API_デッキビルダー_ログアウト）	E2E-A15-02-008	IT-10	エラー	P2	署名不正トークンで401・Access Token is incorrectが返る	SEED-A15-02-PLAYER／SEED-A15-02-JWT-SECRET	署名が不正なjwt-token	"1. 署名を改ざんしたトークンでログアウトAPIへPOST送信する
2. HTTPステータスとレスポンス本文を確認する"	署名が不正なトークンで認証拒否（HTTP401）となり、messageが「Access Token is incorrect」であること。				
a15-02_api_deck_builder_deck_logout（API_デッキビルダー_ログアウト）	E2E-A15-02-015	IT-10	エラー	P3	タイムアウト時の応答を確認する	SEED-A15-02-PLAYER	タイムアウトを誘発する状態	"1. タイムアウトを誘発してログアウトAPIへPOST送信する
2. 応答を確認する"	処理中の例外・タイムアウト時は正本mdが共通例外処理（HTTP500）と定めるが、タイムアウト固有の応答は正本md未定義かつ再現が外部依存のため、観測された応答を要実機確認で記録すること（合否は実機確認の結果による）。				
a15-02_api_deck_builder_deck_logout（API_デッキビルダー_ログアウト）	E2E-A15-02-024	IT-09	外部取得	P1	audの会員IDで既知プレイヤーが照合されログアウト成功する	SEED-A15-02-PLAYER／SEED-A15-02-JWT-SECRET	既知プレイヤーの会員IDをaudに持つ有効jwt-token	"1. ログアウトAPIへPOST送信する
2. HTTPステータスを確認する"	トークンのaud（会員ID）に対応するプレイヤーがSEEDの既知会員で引け、ログアウトが成功（HTTP200）すること。				
a15-02_api_deck_builder_deck_logout（API_デッキビルダー_ログアウト）	E2E-A15-02-025	IT-10	HTTPステータス	P1	認証失敗時のHTTPステータスが401である	SEED-A15-02-PLAYER	不正なjwt-token	"1. 不正なトークンでログアウトAPIへPOST送信する
2. HTTPステータスを確認する"	認証失敗時のHTTPステータスが401であること。				
a15-02_api_deck_builder_deck_logout（API_デッキビルダー_ログアウト）	E2E-A15-02-026	IT-10	通信	P1	POST通信が成立し認証結果に応じた応答が返る	SEED-A15-02-PLAYER／SEED-A15-02-JWT-SECRET	有効なjwt-token	"1. ログアウトAPIへPOST送信する
2. 通信成立とHTTPステータスを確認する"	POST通信が成立し、認証結果に応じたHTTPステータス（成功＝200）が返ること。				
a15-02_api_deck_builder_deck_logout（API_デッキビルダー_ログアウト）	E2E-A15-02-027	IT-10	正常	P2	有効トークンで200と成功メッセージが返る	SEED-A15-02-PLAYER／SEED-A15-02-JWT-SECRET	有効なjwt-token	"1. ログアウトAPIへPOST送信する
2. HTTPステータスとレスポンス本文を確認する"	有効なトークンでHTTP200と成功メッセージ（Logout success）が返ること。				
a15-02_api_deck_builder_deck_logout（API_デッキビルダー_ログアウト）	E2E-A15-02-030	IT-10	異常系	P2	不正トークンで401となり成功応答が返らない	SEED-A15-02-PLAYER	不正なjwt-token	"1. 不正なトークンでログアウトAPIへPOST送信する
2. HTTPステータスとレスポンス本文を確認する"	トークンが不正のとき認証拒否（HTTP401）となり、成功応答（code=200）が返らないこと。				
a15-02_api_deck_builder_deck_logout（API_デッキビルダー_ログアウト）	E2E-A15-02-031	IT-32	必須条件	P3	必須のjwt-tokenヘッダ欠落時に認証拒否となる	SEED-A15-02-PLAYER	jwt-tokenヘッダなし	"1. jwt-tokenヘッダを付与せずログアウトAPIへPOST送信する
2. HTTPステータスを確認する"	必須のjwt-tokenヘッダが欠落した場合、認証拒否（HTTP401）となること。				
a15-02_api_deck_builder_deck_logout（API_デッキビルダー_ログアウト）	E2E-A15-02-032	IT-32	レスポンス	P3	成功レスポンスの型契約（code=integer・message=string）を満たす	SEED-A15-02-PLAYER／SEED-A15-02-JWT-SECRET	有効なjwt-token	"1. ログアウトAPIへPOST送信する
2. レスポンス各フィールドの型を確認する"	成功応答のcodeがinteger型、messageがstring型で返ること。				
a15-02_api_deck_builder_deck_logout（API_デッキビルダー_ログアウト）	E2E-A15-02-033	IT-32	データなし	P2	aud対応プレイヤーなしで401・Authentication failedが返る	SEED-A15-02-NOPLAYER／SEED-A15-02-JWT-SECRET	会員IDに対応するプレイヤーが存在しない有効署名のjwt-token	"1. プレイヤー未登録の会員IDをaudに持つトークンでログアウトAPIへPOST送信する
2. HTTPステータスとレスポンス本文を確認する"	トークンのaudに対応するプレイヤーが存在しない場合、認証拒否（HTTP401）となり、messageが「Authentication failed」であること。				
a15-02_api_deck_builder_deck_logout（API_デッキビルダー_ログアウト）	E2E-A15-02-036	IT-32	受信検証	P1	jwt-tokenの検証が成立し認証成功で200が返る	SEED-A15-02-PLAYER／SEED-A15-02-JWT-SECRET	有効なjwt-token	"1. ログアウトAPIへPOST送信する
2. HTTPステータスを確認する"	jwt-tokenの署名検証とプレイヤー照合が成立し、認証成功でHTTP200が返ること。				
a15-02_api_deck_builder_deck_logout（API_デッキビルダー_ログアウト）	E2E-A15-02-037	IT-10	重複・順序	P1	不正トークンのクライアントは再送しても毎回認証拒否となる	SEED-A15-02-PLAYER	不正なjwt-token（複数回送信）	"1. 不正なトークンでログアウトAPIへ複数回POST送信する
2. 各応答のHTTPステータスを確認する"	トークンが不正のクライアントは再送しても毎回認証拒否（HTTP401）となること。				
a15-02_api_deck_builder_deck_logout（API_デッキビルダー_ログアウト）	E2E-A15-02-050	IT-09	実行結果	P2	ログアウト成功時にトークンCookieが空値に設定される	SEED-A15-02-PLAYER／SEED-A15-02-JWT-SECRET	有効なjwt-token	"1. ログアウトAPIへPOST送信する
2. レスポンスのSet-Cookie（トークンCookie）を確認する"	ログアウト成功時、副作用としてトークンCookieを空値に設定するSet-Cookieが応答に含まれること（実装にCookie操作が無い場合は付帯表4#2で落ちて検出）。				
a15-02_api_deck_builder_deck_logout（API_デッキビルダー_ログアウト）	E2E-A15-02-051	IT-09	リクエスト	P3	サーバ側でトークン失効せず同一トークンの再ログアウトが成功する	SEED-A15-02-PLAYER／SEED-A15-02-JWT-SECRET	有効なjwt-token（ログアウト後に同一トークンを再送）	"1. 有効トークンでログアウトAPIへPOST送信する
2. 同一トークンで再度ログアウトAPIへPOST送信し応答を確認する"	サーバ側でトークンを失効しないため、ログアウト成功後に同一トークンで再度ログアウトしてもHTTP200が返ること。				
a15-02_api_deck_builder_deck_logout（API_デッキビルダー_ログアウト）	E2E-A15-02-052	IT-32	受信検証	P3	会員IDクレームを欠くトークンで認証拒否となる	SEED-A15-02-JWT-SECRET	有効署名だが会員ID（aud）クレームを持たないjwt-token	"1. 会員IDクレームを持たない有効署名トークンでログアウトAPIへPOST送信する
2. HTTPステータスを確認する"	トークンに会員ID（aud）クレームが無い場合、認証拒否（HTTP401）となること（クレーム名はaud／subで設計と実装が異なり、判定の所在は要実機確認）。				
```

## 付帯表1：E2E自動化区分・対象/根拠・仕様根拠・元ITケースID（TSV外）

移行先 ec-cube-enterprise の実装エンドポイントは `#[Route('/api/user/logout', name: 'api_deck_builder_logout', methods: ['POST', 'OPTIONS'])]`（`src/Eccube/Controller/App/DeckBuilder/LoginController.php:79`）＝実効パス `POST /api/user/logout`。認証ヘッダは `jwt-token`（同:86）。欠落（空）→ `createErrorResponse(401, trans('api.deck_builder.auth.token_incorrect'))`（同:87-92）。トークン検証は `LogoutAction::handle`（`src/Eccube/Service/App/DeckBuilder/LogoutAction.php:39-55`）＝`JwtTokenService::verifyToken`（HS256・`src/Eccube/Security/AccessToken/JwtTokenService.php:97-131`）。署名不正/形式不正・`sub` 欠落/非数値→ `InvalidTokenException`→401 `api.deck_builder.auth.token_incorrect`（LoginController.php:96-100／LogoutAction.php:41-48）。プレイヤー照合は `DtbPlayerRepository::findOneBy(['Customer' => (int) $sub])`（LogoutAction.php:50）。該当なし→ `AuthFailedException`→401 `api.deck_builder.login.auth_failed`（LoginController.php:101-106／LogoutAction.php:51-53）。成功→ `JsonResponse(['code'=>200,'message'=>trans('api.deck_builder.logout.success')], 200)`（LoginController.php:108-111）。`createErrorResponse` 本文は `{code, message}`（`AbstractDeckBuilderController::createErrorResponse`、`src/Eccube/Controller/App/DeckBuilder/AbstractDeckBuilderController.php:45-50`）。メッセージ実値はロケール依存で、en は `Access Token is incorrect`／`Authentication failed`／`Logout success`（`src/Eccube/Resource/locale/messages.en.yaml:3645,3643,3646`）、ja は別文言（`messages.ja.yaml:6012,6010,6013`）。

**設計（正本md／pf-api）のエンドポイント `POST /user/logout`（利用者視点の入口）と、実装（ec-cube-enterprise）の `POST /api/user/logout`（`/api` prefix付き）は食い違う。さらに正本mdはトークンの `aud`（会員ID）でプレイヤーを引き、ログアウト成功時に「トークンCookieを空値に設定する」（副作用）と定めるが、実装は `sub` クレームでプレイヤーを引き（LogoutAction.php:43,50）、ログアウト処理にCookie操作が無い（LoginController.php:80-112）。送信先パスは実装の実効パス `POST /api/user/logout` に統一し（テストが実在経路へ届くため）、合否は正本mdの意味（成功＝HTTP200＋`{code:200, message:Logout success}`、認証＝トークン検証＋プレイヤー照合の通過/拒否＝401、副作用＝トークンCookie空設定・業務データ不更新・サーバ側失効なし）で判定する。パス・クレーム名（aud⇔sub）・Cookie副作用・OPTIONSプリフライト/CORS・メッセージのロケール差異の設計⇔実装の差異は付帯表4でのみ不具合候補/要確認として一元管理し、TSV期待値・本文・前提条件・シード要件に実装パスや実装独自挙動を仕様由来の固定期待として混在させない。** UIレイヤ（アクセストークン発行・各デッキビルダーAPIの認可）は正本md「本書で扱わないこと」で別機能委譲のため本機能のE2E観測対象外（UI自動化0件）。

| テストID | E2E可否 | 対象セレクタ／APIパス・メソッド（根拠 file:line / 要実機確認） | 仕様根拠（設計書節・行/IT-ID） | 元ITケースID |
|----------|---------|--------------------------------------------------------------|--------------------------------|--------------|
| E2E-A15-02-001/003/026/027/036 | E2E自動化(API/統合) | `POST /api/user/logout`（LoginController.php:79）／成功応答（同:108-111） | 利用者視点の入口・処理フロー#1-4・レスポンス（成功）HTTP200／IT-32・IT-09・IT-10 | IT-A15-02-...-001,003,026,027,036 |
| E2E-A15-02-002 | E2E自動化(API/統合) | 成功本文 `{code:200, message:'Logout success'}`（LoginController.php:108-111／messages.en.yaml:3646） | レスポンス（成功）`code`/`message`・サンプルレスポンス／IT-09 | IT-A15-02-...-002 |
| E2E-A15-02-004 | E2E自動化(API/統合) | リクエストはヘッダ `jwt-token` のみ・ボディ未参照（LoginController.php:86） | 入出力・リクエスト（ボディパラメータを持たず認証ヘッダのみ）／IT-09 | IT-A15-02-...-004 |
| E2E-A15-02-005/031 | E2E自動化(API/統合) | `jwt-token` 空→401 token_incorrect（LoginController.php:86-92） | 処理フロー#1（ヘッダ欠落→401）・入出力（jwt-token必須）・権限認可（未送信→401）／IT-32 | IT-A15-02-...-005,031 |
| E2E-A15-02-006 | E2E自動化(API/統合) | ボディ未参照＝想定外項目は無視（LoginController.php:80-86） | 入出力（リクエストボディのパラメータを持たない）・想定外項目／IT-32 | IT-A15-02-...-006 |
| E2E-A15-02-008/025/030/037 | E2E自動化(API/統合) | 署名/形式不正→ InvalidTokenException→401 token_incorrect（LoginController.php:96-100／LogoutAction.php:41-48／messages.en.yaml:3645） | 処理フロー#1（署名不正→401）・認証失敗（Access Token is incorrect）・エラー処理／IT-10 | IT-A15-02-...-008,025,030,037 |
| E2E-A15-02-024 | E2E自動化(API/統合) | プレイヤー照合 `findOneBy(['Customer'=>(int)$sub])`（LogoutAction.php:50）。**正本mdは `aud`、実装は `sub`＝付帯表4#3** | 認証・認可（aud＝会員IDでプレイヤーを引く）・データ整合性（参照時点）／IT-09 | IT-A15-02-...-024 |
| E2E-A15-02-032 | E2E自動化(API/統合) | 成功本文 `code`（Response::HTTP_OK=200 integer）・`message`（string）（LoginController.php:108-111） | レスポンス（成功）の型（code=integer・message=string）／IT-32 | IT-A15-02-...-032 |
| E2E-A15-02-033 | E2E自動化(API/統合) | プレイヤー不在→ AuthFailedException→401 auth_failed（LogoutAction.php:51-53／LoginController.php:101-106／messages.en.yaml:3643） | 処理フロー#2（該当プレイヤーなし→401）・認証失敗（Authentication failed）・権限認可（該当プレイヤーなし→401）／IT-32 | IT-A15-02-...-033 |
| E2E-A15-02-015 | 手動（要実機確認: タイムアウト誘発） | 処理中の例外は deck-api 共通例外処理（正本md エラー処理）に委ねる。タイムアウト誘発は外部依存（要実機確認） | エラー処理（処理中の例外→共通例外処理・HTTP500）・レスポンス（失敗）500／IT-10 | IT-A15-02-...-015 |
| E2E-A15-02-050 | E2E自動化(API/統合) | ログアウト処理にCookie操作なし（LoginController.php:80-112）。**正本mdは「トークンCookieを空値に設定」＝付帯表4#2** | 副作用（トークンCookieを空値に設定する）／IT-09 | （母集合外・正本md補完） |
| E2E-A15-02-051 | E2E自動化(API/統合) | サーバ側で失効/ブラックリスト登録なし（LogoutAction.php は参照のみ・persist/flushなし） | 副作用・データ整合性（サーバ側でトークンを保存・失効しない＝有効期限まで署名上有効）・業務ルール（冪等な成功応答）／IT-09 | （母集合外・正本md補完） |
| E2E-A15-02-052 | E2E自動化(API/統合)（要実機確認: aud/subクレーム名） | `sub` 欠落/非数値→ InvalidTokenException→401（LogoutAction.php:43-48）。**正本mdは `aud`、実装は `sub`＝付帯表4#3** | 認証・認可（audでプレイヤーを引く・該当無は認証拒否）／IT-32 | （母集合外・正本md補完） |

注: 既存IT casesは観点名のみの定型自動生成スタブ（操作手順が「対象機能を実行する」等の汎用文）であり、機能固有のシナリオを持たない。本E2Eは正本md（処理フロー・認証認可・入出力・レスポンス・副作用・データ整合性・エラー処理）を一次オラクルとし、移行先実装（LoginController.php／LogoutAction.php／JwtTokenService.php／AbstractDeckBuilderController.php）からは位置情報のみを取得して両レイヤ（主API/統合・UIは別機能委譲で0件）を網羅した。

## 付帯表2：分類サマリ（母集合＝既存IT cases 38観点行・未分類0）

母集合は既存 `a15_02_api_deck_builder_deck_logout_it_cases.md` の関連ID件数（IT-32=8／IT-09=4／IT-19=1／IT-10=18／IT-33=7＝計38）。`自動化(UI)` と `自動化(API/統合)` を分けて集計する。本機能はデッキビルダーアプリ向けJSONログアウトAPIで結果が管理画面に現れないため自動化(UI)は0。

| IT-ID | 母集合 | 自動化(UI) | 自動化(API/統合) | 手動 | 対象外 | 備考 |
|-------|:-----:|:---------:|:----------------:|:----:|:------:|------|
| IT-32 | 8 | 0 | 7 | 0 | 1 | 資格情報・リクエスト(異常)・リクエスト(想定外項目)・必須条件・レスポンス・データなし・受信検証はHTTPステータス/本文で観測可。バージョニングは正典にAPIバージョン指定が無く対象外（理由付き） |
| IT-09 | 4 | 0 | 4 | 0 | 0 | 正常ログアウトのHTTPステータス200・実行結果・リクエスト・外部取得相当（audの会員IDで既知プレイヤー照合） |
| IT-19 | 1 | 0 | 0 | 0 | 1 | 同時実行数の制限は本APIにレート制限の仕様/実装が無く（参照とCookie操作・応答整形のみ・排他/トランザクション対象なし）対象外（理由付き） |
| IT-10 | 18 | 0 | 6 | 1 | 11 | エラー(401本文)・HTTPステータス・通信・正常・異常系・重複/順序(認証拒否)はAPI/統合。タイムアウト1件は手動。複数バリデーション一括返却/ソート順6件・外部キャッシュ2件・決済代行2件・転送再連携1件は本機能に非該当で対象外 |
| IT-33 | 7 | 0 | 0 | 0 | 7 | 数量・金額・履歴の連携更新観点は本機能が認証＋Cookie操作のみ（業務データ更新・外部連携なし）で全件非該当・対象外 |
| 合計 | 38 | 0 | 17 | 1 | 20 | **未分類 0** |

注1: 対象外20件の内訳＝IT-32 バージョニング1（正典にAPIバージョン指定が無く創作になるため）／IT-19 同時実行数の制限1（本APIにレート制限の仕様/実装なし・排他/トランザクション対象なし）／IT-10 11（複数単項目・相関・DB相関バリデーションの一括返却・ソート順6件＝本APIはリクエストボディの入力検証を行わない、外部キャッシュ形式不正・障害2件＝外部キャッシュを持たない、決済代行正常/異常2件＝決済を持たない、転送再連携の部分失敗1件＝転送・再連携を持たない）／IT-33 7（区分整合・エラー・外部取引・自動加算・実数更新・売上返品・連携エラー＝認証＋Cookie操作のみで数量金額履歴の更新・外部連携を行わない）。いずれも理由付きで放置ではない。

注2（母集合外・正本md補完ケース）: 050（ログアウト成功でトークンCookie空設定）・051（サーバ側失効なし＝同一トークンの再ログアウト成功）・052（会員IDクレーム欠落→401）は、母集合38行の汎用観点を超えて正本md（副作用・データ整合性・認証認可）と実装の位置情報から補完したケースであり、母集合集計には算入せず別管理する。いずれも自動化(API/統合)（052はaud/subクレーム名が要実機確認）。

## 付帯表2b：観点行 行単位分類（既存IT cases 全38行・未分類0の監査用）

| IT行 | IT-ID | 観点 | 区分 | 対応E2E / 理由 |
|------|-------|------|------|----------------|
| 001 | IT-32 | 資格情報 | 自動化(API/統合) | 001（有効トークンのみログアウト成立） |
| 002 | IT-09 | 実行結果 | 自動化(API/統合) | 002 |
| 003 | IT-09 | HTTPステータス | 自動化(API/統合) | 003 |
| 004 | IT-09 | リクエスト | 自動化(API/統合) | 004（ボディなし・ヘッダのみ正常） |
| 005 | IT-32 | リクエスト | 自動化(API/統合) | 005（異常＝ヘッダ欠落→401） |
| 006 | IT-32 | リクエスト | 自動化(API/統合) | 006（想定外項目→無視で200） |
| 007 | IT-19 | 同時実行数の制限 | 対象外 | 本APIにレート制限の仕様/実装なし・参照とCookie操作のみで排他/トランザクション対象なしのため |
| 008 | IT-10 | エラー | 自動化(API/統合) | 008（署名不正→401 token_incorrect） |
| 009 | IT-10 | エラー(単項目バリ一括返却) | 対象外 | 本APIはリクエストボディの入力検証を行わず複数エラー本文の一括返却を持たないため |
| 010 | IT-10 | エラー(単項目バリ ソート順) | 対象外 | 同上（エラーメッセージのソート順を持たない） |
| 011 | IT-10 | エラー(相関バリ一括返却) | 対象外 | 同上 |
| 012 | IT-10 | エラー(相関バリ ソート順) | 対象外 | 同上 |
| 013 | IT-10 | エラー(DB相関バリ一括返却) | 対象外 | 同上 |
| 014 | IT-10 | エラー(DB相関バリ ソート順) | 対象外 | 同上 |
| 015 | IT-10 | エラー(タイムアウト) | 手動（要実機確認） | 015（タイムアウトの実再現は外部依存） |
| 016 | IT-32 | バージョニング | 対象外 | 正典にAPIバージョン指定が無く、バージョン依存挙動は創作になるため（理由付き） |
| 017 | IT-33 | 区分整合 | 対象外 | 認証＋Cookie操作のみで数量別管理の更新を行わないため |
| 018 | IT-33 | エラー | 対象外 | 認証＋Cookie操作のみで数量・金額・履歴の更新を行わないため |
| 019 | IT-33 | 外部取引 | 対象外 | 認証＋Cookie操作のみで外部取引の加減算を行わないため |
| 020 | IT-33 | 自動加算 | 対象外 | 認証＋Cookie操作のみで自動加算・履歴作成を行わないため |
| 021 | IT-33 | 実数更新 | 対象外 | 認証＋Cookie操作のみで実数更新を行わないため |
| 022 | IT-33 | 売上・返品 | 対象外 | 認証＋Cookie操作のみで売上/返品の数量金額更新を行わないため |
| 023 | IT-33 | 連携エラー | 対象外 | 認証＋Cookie操作のみで数量金額履歴の外部連携を行わないため |
| 024 | IT-09 | 外部取得 | 自動化(API/統合) | 024（audの会員IDで既知プレイヤー照合） |
| 025 | IT-10 | HTTPステータス | 自動化(API/統合) | 025 |
| 026 | IT-10 | 通信 | 自動化(API/統合) | 026 |
| 027 | IT-10 | 正常 | 自動化(API/統合) | 027 |
| 028 | IT-10 | 形式不正(外部キャッシュ) | 対象外 | 本機能は外部キャッシュを持たないため |
| 029 | IT-10 | 障害(外部キャッシュ) | 対象外 | 本機能は外部キャッシュを持たないため |
| 030 | IT-10 | 異常系 | 自動化(API/統合) | 030（不正トークン→401・成功応答なし） |
| 031 | IT-32 | 必須条件 | 自動化(API/統合) | 031（jwt-tokenヘッダ欠落→401） |
| 032 | IT-32 | レスポンス | 自動化(API/統合) | 032（型契約 code=integer・message=string） |
| 033 | IT-32 | データなし | 自動化(API/統合) | 033（aud対応プレイヤーなし→401 auth_failed） |
| 034 | IT-10 | 正常系(決済代行) | 対象外 | 本機能は決済代行/外部決済を持たないため |
| 035 | IT-10 | 異常系(決済代行) | 対象外 | 本機能は決済代行/外部決済を持たないため |
| 036 | IT-32 | 受信検証 | 自動化(API/統合) | 036（トークン検証＋プレイヤー照合成立） |
| 037 | IT-10 | 重複・順序 | 自動化(API/統合) | 037（不正トークンは再送しても401） |
| 038 | IT-10 | 部分失敗(転送再連携) | 対象外 | 本機能は外部通知/取得結果の転送・再連携を持たないため |

集計（付帯表2と一致）: 自動化(UI) 0／自動化(API/統合) 17（001,002,003,004,005,006,008,024,025,026,027,030,031,032,033,036,037）／手動・要実機 1（015）／対象外 20（007,009,010,011,012,013,014,016,017,018,019,020,021,022,023,028,029,034,035,038）。**未分類 0**（母集合38行）。母集合外の補完ケース 050/051/052 は別管理（いずれも自動化(API/統合)、052はaud/subが要実機確認）であり母集合38件の区分集計を変えない。

## 付帯表3：シードデータ要件（個別流し込み・独立・べき等。実装は後）

| シードセットID | 対象/キー | 必要レコードの要点 | データ源 | 独立性・べき等・後始末 | 使用テストID |
|----------------|-----------|--------------------|----------|------------------------|--------------|
| SEED-A15-02-PLAYER | dtb_player（＋dtb_customer）／customer_id | 会員1件と、その会員IDに紐づくプレイヤー1件。会員ID（移行先主キーは `dtb_customer.id`、プレイヤー主キーは `dtb_player.id`、照合キーは `dtb_player.customer_id`）は既知。当該会員IDをaudに持つ有効jwt-tokenを発行できる | fixture／migration | 専用会員＋プレイヤー・撤去可。値はテスト環境固定。不正トークンケースは署名改ざん値を使用 | 001-008,024-027,030-032,036,037,050,051／（不正トークン）005,008,025,030,031,037 |
| SEED-A15-02-NOPLAYER | dtb_customer（プレイヤー未登録）／customer_id | 会員は存在するが対応する dtb_player レコードが無い会員1件。会員IDをaudに持つ有効署名トークンを発行できる | fixture／migration | 専用会員・撤去可。dtb_player に紐づけない | 033 |
| SEED-A15-02-JWT-SECRET | JWT署名シークレット（環境変数 JWT_SECRET／base64） | HS256署名用シークレットがテスト環境に設定済み。有効トークン・署名不正トークン・クレーム欠落トークンの生成に使用。**原値は設計書・ログに書かない** | env（環境ガード `test.skip`） | 環境隔離・撤去不要。原値非記載 | 001-004,006,008,024,026,027,032,033,036,050,051,052 |

注: 会員・プレイヤーのテーブル/列名はDB正典である ec-cube-enterprise を正とする（正本md「リニューアル移行時の扱い」：プレイヤーテーブル `dtb_player`、主キー列は移行先 `id`（現行 `player_id`）、会員ID列 `customer_id`（移行先は `dtb_customer.id` を参照））。`migration` を充てる場合のDB対応は ec-cube-enterprise 正典（`dtb_player`／`dtb_customer`）に従う。本APIはトークン認証のため、有効/不正/プレイヤー欠落の各トークンは SEED-A15-02-JWT-SECRET の署名鍵で生成し、トークン原値・署名シークレットは設計書・ログに書かない。

## 付帯表4：不具合候補（仕様乖離）／要確認

テストは仕様（正本md＝pf-api）どおりに書き、実装（ec-cube-enterprise）が違えば落ちて検出する。期待値を実装へ書き換えない。

| # | 仕様（正本md/pf-api） | 実装（ec-cube-enterprise file:line） | 乖離/要確認 | 関係テストID | 区分 |
|---|------|------------------|-------------|--------------|------|
| 1 | エンドポイント `POST /user/logout`（利用者視点の入口） | `#[Route('/api/user/logout', name: 'api_deck_builder_logout', methods: ['POST', 'OPTIONS'])]`（LoginController.php:79）＝実効 `POST /api/user/logout` | **設計パス（`/user/logout`）と実装パス（`/api/user/logout`）が不一致**。テストは実装の実効パスへ送信し本差異を記録 | 全API/統合ケース | 不具合候補(パス乖離) |
| 2 | ログアウト成功時に「トークンCookieを空値に設定する」（副作用・処理フロー#3） | `logout()` はトークン検証とプレイヤー照合・成功JSON返却のみで、Cookie操作（Set-Cookie・Cookie削除）が無い（LoginController.php:80-112／LogoutAction.php:39-55）。ログイン側も access_token/session_id を本文返却でCookie未使用（LoginController.php:71-76） | **設計はトークンCookie空設定、実装はCookie操作なし**。テストは仕様どおり「トークンCookie空設定（Set-Cookie）」を期待し、実装が違えば落ちて検出する（期待値を実装へ寄せない） | 050 | 不具合候補(Cookie副作用未実装) |
| 3 | トークンの `aud`（会員ID）でプレイヤーを引く（認証・認可・処理フロー#2） | ペイロードの `sub`（string memberId）でプレイヤーを引く（LogoutAction.php:43,50／JwtTokenService.php createToken payload `{sub}`） | **設計は `aud`、実装は `sub`**。クレーム名が乖離。テストは結果（該当プレイヤーで200・不在で401）で判定し、クレーム名を実装へ固定しない | 024,033,052 | 要確認(クレーム名 aud⇔sub) |
| 4 | 認証失敗時のメッセージは `Access Token is incorrect`／`Authentication failed`、成功は `Logout success`（英語リテラル） | trans キー実値はロケール依存。en は一致（messages.en.yaml:3645,3643,3646）、ja は別文言（messages.ja.yaml:6012,6010,6013） | **メッセージ実値がロケールにより異なる**。正本mdは英語リテラルを定義。en ロケールで期待、ja 運用時は文言が異なるため運用ロケールの確定は要実機確認 | 008,033 | 要確認(メッセージ ロケール差異) |
| 5 | 該当プレイヤーなしは `Authentication failed`、トークン不正は `Access Token is incorrect`（エラー処理） | 有効署名でも `sub` 欠落/非数値は `InvalidTokenException`→`Access Token is incorrect`（LogoutAction.php:43-48）。プレイヤー不在は `AuthFailedException`→`Authentication failed`（同:51-53） | **会員IDクレーム欠落トークンの扱いが正本md未明記**。実装は「不正トークン」（token_incorrect）扱い。判定の所在は要実機確認 | 052 | 要確認(クレーム欠落の分岐) |
| 6 | 正本md記載なし（OPTIONS/CORSプリフライトの仕様未定義） | OPTIONS は 204＋CORSヘッダ、応答に `Access-Control-Allow-Methods/Headers/Origin` を付与（LoginController.php:82-84／AbstractDeckBuilderController.php:60-71） | **OPTIONSプリフライト・CORS応答は実装独自で正本md未定義**。テストの固定期待にせず、必要なら要実機確認で記録 | （対象外＝正本md未定義） | 要確認(CORS/プリフライト) |

## 付帯表5：設計書網羅マトリクス（設計書節→テストID・未カバーは理由付き）

| 設計書の節 | テスト可能な挙動 | 対応テストID | カバー状況 |
|------------|------------------|--------------|------------|
| 概要・本書で扱うこと（トークン検証→プレイヤー照合→Cookie空設定→成功応答／認証失敗応答） | 正常ログアウトで200・失敗で401 | 001,002,008,033 | カバー |
| 利用者視点の入口（POST `/user/logout`・JSON応答・失敗401） | POST送信でHTTP200／失敗401 | 001,003,025 | カバー（実効パスは付帯表4#1で乖離記録） |
| 認証・認可（jwt-token検証 HS256・audでプレイヤー照合・正のみログアウト・失敗401） | 有効トークンのみ成立・audで照合・失敗401 | 001,024,036,052 | カバー（aud⇔subは付帯表4#3） |
| 処理フロー#1-4（ヘッダ検証→aud照合→Cookie空設定→200返却） | 正常200・ヘッダ欠落401・プレイヤーなし401・Cookie空設定 | 001,005,033,050 | カバー（Cookie空設定は付帯表4#2） |
| 入出力・リクエスト（jwt-tokenヘッダ必須・ボディパラメータを持たない） | 必須欠落→401・ボディなしで正常・想定外項目無視 | 004,005,006,031 | カバー |
| 入出力・レスポンス（成功）（HTTP200・`code`(integer)・`message`=Logout success(string)） | 200・code/message・型契約 | 002,003,032 | カバー |
| 入出力・レスポンス（失敗）（401＝`{code, message}`／500＝処理中の例外） | 401本文（token_incorrect/auth_failed）・500 | 008,033,015 | カバー（500は手動/要実機・メッセージは付帯表4#4） |
| 副作用（トークンCookieを空値に設定・サーバ側で失効/ブラックリストなし・業務データ不更新） | Cookie空設定・同一トークンの再ログアウト成功・業務データ不更新 | 050,051 | カバー（Cookie操作未実装は付帯表4#2） |
| バリデーション（リクエストボディの入力検証なし・認証はjwt-token検証・未充足は401） | ボディ検証なし・未送信→401 | 005,006,031 | カバー |
| 業務ルール・計算（無効化のみ・業務データ不更新・既無効への要求は既存認証エラーまたは冪等成功） | 業務データ不更新・冪等成功 | 051 | カバー |
| データ整合性（参照時点のプレイヤー・トークンを保存/失効しない＝有効期限まで署名上有効） | サーバ側失効なし（同一トークン再ログアウト成功） | 051 | カバー |
| 権限・認可（有効トークン会員はログアウト可・未送信/不正/プレイヤーなしは401） | 正で成立・未送信/不正/不在で401 | 001,005,030,033 | カバー |
| エラー処理（ヘッダ欠落/署名不正→token_incorrect／プレイヤーなし→auth_failed／例外→共通例外処理） | 401（2種メッセージ）・例外500 | 008,033,015 | カバー（タイムアウト/例外は手動/要実機） |
| ログ・監査（トークン原値・署名シークレット・Cookie値/セッションID完全値を出さない） | 機密値の出力抑止 | （対象外＝サーバログ実機観測でブラウザ/API応答に現れない） | 対象外(理由付き) |
| 集計条件（一覧・検索・件数を返さない） | 集計を行わない | （対象外＝該当処理なし） | 対象外（集計対象なし） |
| 排他制御・トランザクション（業務トランザクションを張らない・ロック対象なし） | 同時実行制限の対象なし | （対象外＝IT-19/007） | 対象外（参照とCookie操作のみ・ロック対象なし） |
| DBカラム・DB操作（dtb_player を customer_id で参照・参照系で登録/更新/削除なし） | プレイヤー照合（参照系） | 024,033 | カバー |
| 同時実行数の制限（観点表IT-19） | レート制限・同時実行 | （対象外） | 対象外（本APIにレート制限の仕様/実装なし） |
| 複数バリデーション一括返却・ソート順（観点表IT-10細目） | （該当処理なし） | （対象外） | 対象外（リクエストボディの入力検証を持たず複数エラー本文の一括返却を持たない） |
| 外部キャッシュ・決済代行・転送再連携（観点表IT-10細目） | （該当処理なし） | （対象外） | 対象外（外部キャッシュ/決済/転送再連携を持たない） |
| 数量・金額・履歴の連携更新（観点表IT-33） | （該当処理なし） | （対象外） | 対象外（認証＋Cookie操作のみで副作用・外部連携なし） |
| 本書で扱わないこと（アクセストークン発行=A15-01／サーバ側失効・ブラックリスト=実装になし／各APIの認可=各API設計） | 別機能委譲 | （UI/別機能委譲） | 対象外（別機能の設計を正とするためUI観測対象外） |

未カバーはいずれも理由（機密値ログはサーバログ実機観測でブラウザ/API応答に現れない・集計/同時実行/数量金額更新非該当・入力検証なしで複数エラー本文非該当・外部キャッシュ/決済/転送再連携非該当・トークン発行/各API認可は別機能委譲）を明記済み。正本mdの処理フロー・認証認可・入出力・レスポンス・副作用・データ整合性・エラー処理は主レイヤ（API/統合）へ写像し、正常×異常の対（ログアウト成功001-004,027,036 ↔ 未ログイン/トークン未送信005,031・署名不正008,025,030・aud対応プレイヤーなし033・再送拒否037／セッション破棄＝トークンCookie空設定050 ↔ サーバ側失効なし051）を揃えた。UIレイヤは正本mdの非対象宣言により0件で、結果観測はAPI/統合に一本化した。
