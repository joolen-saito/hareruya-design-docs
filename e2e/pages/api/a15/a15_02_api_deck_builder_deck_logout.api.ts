/**
 * a15-02 デッキビルダー_ログアウト（デッキビルダーアプリ向け会員ログアウト JSON API・POST）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a15_02_api_deck_builder_deck_logout_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは設計書(a15-02・正本md)入出力記載のリクエスト仕様（認証ヘッダ jwt-token のみ・リクエストボディを持たない）を最小構成で組む未実行雛形。実環境は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス形・FW既定値・トークンライブラリ既定値を流用しない）:
 *  - 送信先は実装の実効パス `POST /api/user/logout`（付帯表1/付帯表4#1）。
 *    由来: `#[Route('/api/user/logout', name:'api_deck_builder_logout', methods:['POST','OPTIONS'])]`（LoginController.php:79）。
 *    設計書(正本md/pf-api)の `POST /user/logout` とは不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理。
 *  - 認証は HTTP ヘッダ `jwt-token`（LoginController.php:86）。リクエストボディは未参照＝想定外項目は無視（同:80-86）。
 *  - 合否（成功）は HTTPステータス200＋本文 {code:200(integer), message:'Logout success'(string)}（LoginController.php:108-111／messages.en.yaml:3646）を仕様由来で判定（spec側）。
 *  - 合否（失敗）は 401＋本文 {code, message}（AbstractDeckBuilderController.php:45-50）。token_incorrect='Access Token is incorrect'（messages.en.yaml:3645）・auth_failed='Authentication failed'（messages.en.yaml:3643）。
 *    本文キー・メッセージ実値はロケール依存（付帯表4#4）。en ロケールを正本md英語リテラルの期待とし、運用ロケール確定は要実機確認。
 *  - 副作用: 正本md=ログアウト成功時にトークンCookieを空値に設定、実装=Cookie操作なし（付帯表4#2）。050は仕様どおり Set-Cookie 空設定を期待し違えば落として検出。
 *  - クレーム名: 正本md=aud（会員ID）、実装=sub（LogoutAction.php:43,50・付帯表4#3）。024/033/052は結果（照合可否）で判定しクレーム名を実装へ固定しない。
 *  - 各トークン（有効・署名不正・プレイヤー欠落・会員IDクレーム欠落）は SEED-A15-02-JWT-SECRET の署名鍵で生成。原値・署名シークレットは env 供給でコミットしない。既定値は要実機確認の暫定。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_02_READY。
 */

/**
 * ログアウトAPI実効パス。
 * 由来: LoginController.php:79（Route）＝実効 `POST /api/user/logout`。
 * 設計書(正本md/pf-api)の `POST /user/logout` とは不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理。
 */
export const LOGOUT_PATH = "/api/user/logout";

/** 認証ヘッダ名（LoginController.php:86）。 */
export const JWT_TOKEN_HEADER = "jwt-token";

// ===== SEED トークン（env 供給・原値非コミット。既定値は要実機確認の暫定） =====

/** 有効トークン: SEED-A15-02-PLAYER の既知会員IDをaud(実装はsub)に持つ有効署名 jwt-token。 */
export const SEED_VALID_TOKEN = process.env.A15_02_VALID_TOKEN || "REPLACE_VALID_JWT_TOKEN"; // 要実機確認
/** 署名不正トークン: 署名を改ざんした jwt-token（E2E-A15-02-008/025/030/037）。 */
export const SEED_INVALID_TOKEN = process.env.A15_02_INVALID_TOKEN || "REPLACE_INVALID_JWT_TOKEN"; // 要実機確認
/** プレイヤー不在トークン: SEED-A15-02-NOPLAYER の会員IDをaud(sub)に持つ有効署名 jwt-token（E2E-A15-02-033）。 */
export const SEED_NOPLAYER_TOKEN = process.env.A15_02_NOPLAYER_TOKEN || "REPLACE_NOPLAYER_JWT_TOKEN"; // 要実機確認
/** 会員IDクレーム欠落トークン: 有効署名だが aud(sub) クレームを持たない jwt-token（E2E-A15-02-052）。 */
export const SEED_NOAUD_TOKEN = process.env.A15_02_NOAUD_TOKEN || "REPLACE_NOAUD_JWT_TOKEN"; // 要実機確認

// ===== 期待値（正本md英語リテラル＝en ロケール・付帯表4#4。env で運用ロケールへ差し替え可） =====

/** 成功メッセージ（messages.en.yaml:3646）。 */
export const MSG_LOGOUT_SUCCESS = process.env.A15_02_MSG_SUCCESS || "Logout success"; // 要実機確認(ロケール差異 付帯表4#4)
/** トークン不正メッセージ（messages.en.yaml:3645）。 */
export const MSG_TOKEN_INCORRECT = process.env.A15_02_MSG_TOKEN_INCORRECT || "Access Token is incorrect"; // 要実機確認(ロケール差異 付帯表4#4)
/** プレイヤー不在メッセージ（messages.en.yaml:3643）。 */
export const MSG_AUTH_FAILED = process.env.A15_02_MSG_AUTH_FAILED || "Authentication failed"; // 要実機確認(ロケール差異 付帯表4#4)

/** jwt-token ヘッダ（任意トークン）。Playwright request の `headers` で送信する。 */
export type JwtHeaders = Record<string, string>;

/** 有効トークンのヘッダ（E2E-A15-02-001/002/003/004/006/024/026/027/032/036/050/051）。 */
export function buildValidHeaders(): JwtHeaders {
  return { [JWT_TOKEN_HEADER]: SEED_VALID_TOKEN };
}

/** jwt-token ヘッダなし（E2E-A15-02-005/031）。 */
export function buildNoTokenHeaders(): JwtHeaders {
  return {};
}

/** 署名不正トークンのヘッダ（E2E-A15-02-008/025/030/037）。 */
export function buildInvalidTokenHeaders(): JwtHeaders {
  return { [JWT_TOKEN_HEADER]: SEED_INVALID_TOKEN };
}

/** プレイヤー不在トークンのヘッダ（E2E-A15-02-033・SEED-A15-02-NOPLAYER）。 */
export function buildNoPlayerHeaders(): JwtHeaders {
  return { [JWT_TOKEN_HEADER]: SEED_NOPLAYER_TOKEN };
}

/** 会員IDクレーム欠落トークンのヘッダ（E2E-A15-02-052）。 */
export function buildNoAudHeaders(): JwtHeaders {
  return { [JWT_TOKEN_HEADER]: SEED_NOAUD_TOKEN };
}

/** 想定外項目を含むリクエストボディ（E2E-A15-02-006）。実装はボディ未参照＝無視（LoginController.php:80-86）。 */
export function buildExtraBody(): Record<string, string> {
  return { unexpected_field: "x", foo: "1" };
}
