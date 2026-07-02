/**
 * a06-01 店頭仕入_管理ログイン（買取アプリ=MTGバイヤー向けの管理ログイン中継 JSON API・POST）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a06_01_api_store_purchase_admin_login_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは設計書(a06-01・正本md)入出力記載のリクエスト仕様（フォームボディ login_id/password）のみを最小構成で組む未実行雛形。中継先実環境は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス形・FW既定値・Form制約を流用しない）:
 *  - 送信先は実装の実効パス `POST /api/v1/admin/login.json`（付帯表1/付帯表4#1。設計書 pf-api `POST /admin/login.json`（＋別名 `/admin/login`）とは不一致）。
 *    由来: `#[Route('/%eccube_api_v1_route%/admin/login.json', name:'api_admin_login', methods:['POST'])]`（LoginController.php:45）
 *          ＋ `eccube_api_v1_route` 既定値 `api/v1`（app/config/eccube/packages/eccube.yaml:6,55）＝実効パス。
 *  - 入力はフォームボディ login_id / password（LoginController.php:48-49）。
 *  - 合否（成功）は HTTPステータス200＋本文 memberName/memberId/shopName/shopAddr/jwtToken（型: memberId=integer・他=string）を仕様由来で判定（spec側）。
 *  - 合否（失敗）は 401＋コード/メッセージ存在で判定。本文キーは実装 {code,errors}（ExceptionListener.php:135-138）／正本md {code,message} で乖離（付帯表4#3）。
 *    キー名を実装へ固定せず「コード(401)＋メッセージ相当の存在」で判定する。
 *  - JWTペイロードは正本md=発行者(iss)＋利用者ID(memberId)、実装は {sub:(string)memberId} のみで iss 欠落（付帯表4#4）。051で検出（要実機確認・fixme）。
 *  - 店舗未紐付け時 shopName/shopAddr は正本md=空文字、実装は null 参照の可能性（付帯表4#5）。050は仕様どおり空文字を期待し違えば落として検出。
 *  - SEED 期待値・資格情報は env で供給し原値はコミットしない。既定値は要実機確認の暫定（テスト環境固定値へ差し替える）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A06_01_READY。
 */

/**
 * 管理ログインAPI実効パス。
 * 由来: LoginController.php:45（Route）＋ eccube.yaml:6,55（eccube_api_v1_route 既定 `api/v1`）＝実効 `POST /api/v1/admin/login.json`。
 * 設計書(正本md/pf-api)の `POST /admin/login.json`（＋別名 `POST /admin/login`）とは不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理。
 */
export const LOGIN_PATH = "/api/v1/admin/login.json";

// ===== SEED 期待値（env 供給・原値非コミット。既定値は要実機確認の暫定） =====

/** 正資格情報（SEED-A06-01-MEMBER／SEED-A06-01-BASEINFO）。要実機確認: テスト環境固定値へ差し替える。 */
export const SEED_LOGIN_ID = process.env.A06_01_LOGIN_ID || "e2e_a06_01_admin"; // 要実機確認
export const SEED_PASSWORD = process.env.A06_01_PASSWORD || "e2e_a06_01_pass"; // 要実機確認

/** 成功時レスポンスの既知期待値（正本md仕様型: memberId=integer・他=string）。要実機確認: SEED投入値へ差し替える。 */
export const SEED_MEMBER_NAME = process.env.A06_01_MEMBER_NAME || "店頭仕入 太郎"; // 要実機確認
export const SEED_MEMBER_ID = Number(process.env.A06_01_MEMBER_ID || "1001"); // 要実機確認（integer）
export const SEED_SHOP_NAME = process.env.A06_01_SHOP_NAME || "晴れる屋 テスト店"; // 要実機確認
export const SEED_SHOP_ADDR = process.env.A06_01_SHOP_ADDR || "東京都千代田区テスト1-2-3"; // 要実機確認（addr01+addr02 結合）

/** 店舗未紐付け会員（SEED-A06-01-MEMBER-NOSHOP）。050で shopName/shopAddr が空文字（正本md）を期待。 */
export const SEED_NOSHOP_LOGIN_ID = process.env.A06_01_NOSHOP_LOGIN_ID || "e2e_a06_01_noshop"; // 要実機確認
export const SEED_NOSHOP_PASSWORD = process.env.A06_01_NOSHOP_PASSWORD || "e2e_a06_01_noshop_pass"; // 要実機確認

/** 誤パスワード／存在しないlogin_id（SEED未投入値・password不一致値で再現。原値は書かない）。 */
export const WRONG_PASSWORD = process.env.A06_01_WRONG_PASSWORD || "wrong_password_value"; // 要実機確認
export const NONEXISTENT_LOGIN_ID = process.env.A06_01_NONEXISTENT_LOGIN_ID || "no_such_login_id_xyz"; // 存在しないID

/** フォームボディ（application/x-www-form-urlencoded）。Playwright request の `form` で送信する。 */
export type LoginForm = Record<string, string>;

/** 正しい login_id・password（SEED-A06-01-MEMBER／BASEINFO）。 */
export function buildValidForm(): LoginForm {
  return { login_id: SEED_LOGIN_ID, password: SEED_PASSWORD };
}

/** login_id 空（E2E-A06-01-008）。password は任意（正値を入れる）。 */
export function buildMissingLoginIdForm(): LoginForm {
  return { login_id: "", password: SEED_PASSWORD };
}

/** password 空（E2E-A06-01-009）。login_id は任意（正値を入れる）。 */
export function buildMissingPasswordForm(): LoginForm {
  return { login_id: SEED_LOGIN_ID, password: "" };
}

/** 正しい login_id・誤った password（E2E-A06-01-010/013/014/017/018）。 */
export function buildWrongPasswordForm(): LoginForm {
  return { login_id: SEED_LOGIN_ID, password: WRONG_PASSWORD };
}

/** 存在しない login_id・任意 password（E2E-A06-01-012）。 */
export function buildNonexistentLoginIdForm(): LoginForm {
  return { login_id: NONEXISTENT_LOGIN_ID, password: SEED_PASSWORD };
}

/** 正資格情報＋想定外項目（E2E-A06-01-011）。LoginController は login_id/password のみ取得（:48-49）＝他項目は無視。 */
export function buildExtraFieldForm(): LoginForm {
  return { ...buildValidForm(), unexpected_field: "x", foo: "1" };
}

/** 店舗未紐付け会員の正資格情報（E2E-A06-01-050・SEED-A06-01-MEMBER-NOSHOP）。 */
export function buildNoShopForm(): LoginForm {
  return { login_id: SEED_NOSHOP_LOGIN_ID, password: SEED_NOSHOP_PASSWORD };
}
