/**
 * a15-01 デッキビルダー_ログイン（デッキビルダーアプリ向け会員ログイン JSON API・POST）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a15_01_api_deck_builder_deck_login_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは設計書(a15-01・正本md)入出力記載のリクエスト仕様（JSONボディ id/password）のみを最小構成で組む未実行雛形。実環境は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス形・FW既定値・Form制約を流用しない）:
 *  - 送信先は実装の実効パス `POST /api/user/login`（付帯表1/付帯表4#1。LoginController.php:43 の Route ＋ routes.yaml:5-7 prefix無し＝実効パス）。
 *    設計書(正本md/pf-api)の `POST /user/login` とは不一致（`/api` prefix・付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理。
 *  - 入力は JSONボディ id/password（parseJsonBody＝application/json→toArray・AbstractDeckBuilderController.php:30-42／id/password取得 LoginController.php:52-53）。
 *  - 合否（成功）は HTTPステータス200＋本文 code/message/access_token/session_id（型: code=integer・他=string）を仕様由来で判定（spec側）。
 *  - 合否（入力不正）は HTTP400（正本md: 必須＋メール形式＋パスワード許容文字。実装は非空判定のみ＝付帯表4#2。仕様どおり400を期待し違えば落として検出）。
 *  - 合否（認証拒否）は HTTP401＋{code, message} 存在で判定。文言リテラルは実装へ固定しない（英語(設計)⇔日本語(実装)乖離・付帯表4#3）。
 *  - JWTペイロードは正本md=発行者(iss)＋利用者ID(=会員ID・aud)＋発行時刻(iat)、実装は {sub:(string)customerId} のみで iss/aud/iat 欠落（付帯表4#6）。053で検出（要実機確認・fixme）。
 *  - 成功時 Cookie 設定（有効期限付き）は正本md副作用、実装は Set-Cookie 無し（付帯表4#5）。052で検出（要実機確認・fixme）。
 *  - 未削除（del_flg）条件は正本md、実装の照合メソッドに明示フィルタ無し（付帯表4#7）。056で検出（要実機確認・fixme）。
 *  - SEED 期待値・資格情報は env で供給し原値はコミットしない。既定値は要実機確認の暫定（テスト環境固定値へ差し替える）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_01_READY。
 */

/**
 * デッキビルダー会員ログインAPI実効パス。
 * 由来: `#[Route('/api/user/login', name:'api_deck_builder_login', methods:['POST','OPTIONS'])]`（LoginController.php:43）
 *       ＋ app_controllers は prefix無し（app/config/eccube/routes.yaml:5-7）＝実効 `POST /api/user/login`。
 * 設計書(正本md/pf-api)の `POST /user/login` とは不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理。
 */
export const LOGIN_PATH = "/api/user/login";

// ===== SEED 期待値（env 供給・原値非コミット。既定値は要実機確認の暫定） =====

/** 正資格情報（SEED-A15-01-CUSTOMER）。id＝メールアドレス。要実機確認: テスト環境固定値へ差し替える。 */
export const SEED_ID = process.env.A15_01_ID || "e2e_a15_01@example.com"; // 要実機確認
export const SEED_PASSWORD = process.env.A15_01_PASSWORD || "e2e_a15_01_pass"; // 要実機確認

/** 誤パスワード（SEED未投入値／password不一致値で再現。原値は書かない）。 */
export const WRONG_PASSWORD = process.env.A15_01_WRONG_PASSWORD || "wrong_password_value"; // 要実機確認

/** 存在しないid（メールアドレス・SEED未投入値）。 */
export const NONEXISTENT_ID = process.env.A15_01_NONEXISTENT_ID || "no_such_user_xyz@example.com"; // 存在しないid

/** メールアドレス形式でないid（E2E-A15-01-050。正本md: メール形式不正→400）。 */
export const MALFORMED_EMAIL_ID = process.env.A15_01_MALFORMED_EMAIL_ID || "not-an-email-format"; // 形式不正

/** パスワード許容外文字（半角表示可能文字!〜~以外を含む。E2E-A15-01-051。正本md: 許容外文字→400）。 */
export const INVALID_CHAR_PASSWORD = process.env.A15_01_INVALID_CHAR_PASSWORD || "パスワード　全角"; // 許容外文字（全角等）

/** 非本会員（Status≠REGULAR・未削除）の正資格情報（SEED-A15-01-CUSTOMER-NONREGULAR・E2E-A15-01-018）。 */
export const NONREGULAR_ID = process.env.A15_01_NONREGULAR_ID || "e2e_a15_01_nonregular@example.com"; // 要実機確認
export const NONREGULAR_PASSWORD = process.env.A15_01_NONREGULAR_PASSWORD || "e2e_a15_01_nonregular_pass"; // 要実機確認

/** 削除済み本会員（Status=REGULAR・del_flg=削除済）の正資格情報（SEED-A15-01-CUSTOMER-DELETED・E2E-A15-01-056）。 */
export const DELETED_ID = process.env.A15_01_DELETED_ID || "e2e_a15_01_deleted@example.com"; // 要実機確認
export const DELETED_PASSWORD = process.env.A15_01_DELETED_PASSWORD || "e2e_a15_01_deleted_pass"; // 要実機確認

/** プレイヤー未紐付けの本会員の正資格情報（SEED-A15-01-CUSTOMER-NOPLAYER・E2E-A15-01-054）。 */
export const NOPLAYER_ID = process.env.A15_01_NOPLAYER_ID || "e2e_a15_01_noplayer@example.com"; // 要実機確認
export const NOPLAYER_PASSWORD = process.env.A15_01_NOPLAYER_PASSWORD || "e2e_a15_01_noplayer_pass"; // 要実機確認

/** JWT署名シークレット（SEED-A15-01-JWT-SECRET・env JWT_SECRET）。原値は設計書・ログに書かない。053(要実機確認・fixme)で使用想定。 */
export const JWT_SECRET = process.env.JWT_SECRET || ""; // 要実機確認（原値非記載）

/** JSONボディ（application/json）。Playwright request の `data` で送信する（parseJsonBody＝toArray）。 */
export type LoginBody = Record<string, unknown>;

/** 正しい id・password（SEED-A15-01-CUSTOMER）。 */
export function buildValidBody(): LoginBody {
  return { id: SEED_ID, password: SEED_PASSWORD };
}

/** id 空（E2E-A15-01-008）。password は任意（正値を入れる）。正本md: id未入力→入力不正(400)。 */
export function buildMissingIdBody(): LoginBody {
  return { id: "", password: SEED_PASSWORD };
}

/** password 空（E2E-A15-01-009）。id は任意（正値を入れる）。正本md: password未入力→入力不正(400)。 */
export function buildMissingPasswordBody(): LoginBody {
  return { id: SEED_ID, password: "" };
}

/** 正しい id・誤った password（E2E-A15-01-010/013/014/017/055B）。誤資格情報→認証拒否(401)。 */
export function buildWrongPasswordBody(): LoginBody {
  return { id: SEED_ID, password: WRONG_PASSWORD };
}

/** 存在しない id・任意 password（E2E-A15-01-012/055A）。会員不存在→認証拒否(401)。 */
export function buildNonexistentIdBody(): LoginBody {
  return { id: NONEXISTENT_ID, password: SEED_PASSWORD };
}

/** 正資格情報＋想定外項目（E2E-A15-01-011）。LoginController は id/password のみ取得（:52-53）＝他項目は無視。 */
export function buildExtraFieldBody(): LoginBody {
  return { ...buildValidBody(), unexpected_field: "x", foo: 1 };
}

/** メールアドレス形式でない id・正しい password（E2E-A15-01-050）。正本md: メール形式不正→入力不正(400)。 */
export function buildMalformedEmailBody(): LoginBody {
  return { id: MALFORMED_EMAIL_ID, password: SEED_PASSWORD };
}

/** 正しい id・許容外文字を含む password（E2E-A15-01-051）。正本md: パスワード許容外文字→入力不正(400)。 */
export function buildInvalidPasswordCharBody(): LoginBody {
  return { id: SEED_ID, password: INVALID_CHAR_PASSWORD };
}

/** 非本会員（有効状態でない）会員の正資格情報（E2E-A15-01-018・SEED-A15-01-CUSTOMER-NONREGULAR）。 */
export function buildNonregularBody(): LoginBody {
  return { id: NONREGULAR_ID, password: NONREGULAR_PASSWORD };
}

/** 削除済み本会員の正資格情報（E2E-A15-01-056・SEED-A15-01-CUSTOMER-DELETED）。 */
export function buildDeletedBody(): LoginBody {
  return { id: DELETED_ID, password: DELETED_PASSWORD };
}

/** プレイヤー未紐付け本会員の正資格情報（E2E-A15-01-054・SEED-A15-01-CUSTOMER-NOPLAYER）。 */
export function buildNoPlayerBody(): LoginBody {
  return { id: NOPLAYER_ID, password: NOPLAYER_PASSWORD };
}
