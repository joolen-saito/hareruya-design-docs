/**
 * a15-05 デッキビルダー_ユーザー更新（デッキビルダーの自プレイヤー＝ニックネーム・プロフィールをJWT認証つきで更新するJSON API・PUT）API/統合レイヤ用 パス／ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a15_05_api_deck_builder_deck_user_update_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a15-05) 入出力記載のリクエスト仕様（jwt-token ヘッダ付き PUT。ボディ user_name・profile）のみを最小構成で組む未実行雛形。実環境（デッキビルダーアプリ）は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス形・FW既定値・JWTクレーム名・trans文言を期待値に流用しない）:
 *  - 送信先は実装の実効パス `PUT /api/user`（付帯表1/付帯表4#1）。
 *    由来: `#[Route('/api/user', name: 'api_deck_builder_user_update', methods: ['PUT', 'OPTIONS'])]`（src/Eccube/Controller/App/DeckBuilder/UserController.php:78）。
 *    正本md のパス `PUT /user` は `/api` プレフィクスを欠き実装と不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理する。
 *  - 認証は本APIが security.yaml の firewall（`^/api/v1/`）配下に無く、コントローラ内で `jwt-token` ヘッダを直接読み（UserController.php:85）`JwtTokenService->verifyToken`（UpdateUserAction.php:90）で検証（HS256・正本md 認証・認可節）。
 *    トークン欠落→401（UserController.php:86-91）／署名不正→`InvalidTokenException`→401（UpdateUserAction.php:91-93・UserController.php:117-121）／該当プレイヤーなし→`PlayerNotFoundException`（UpdateUserAction.php:47-49。実装は400で返す＝付帯表4#3。テストは正本md仕様の401で判定）。
 *    プレイヤー特定キーは正本md=`aud`（顧客ID）／実装=`sub`（UpdateUserAction.php:95）で食い違う（付帯表4#2）。SEED発行時にトークンが正常検証されるよう要実機確認。
 *  - 入力検証は user_name 必須（UserController.php:97-102）。未指定→400（正本md バリデーション節）。
 *  - 合否（成功）は HTTPステータス200＋応答 `{code, message}`（snake_case 2フィールド・code:200）、（失敗）は 400 ／ 401＋`{code, message}` を仕様（正本md）由来で判定する（spec側）。
 *    message 文言は実装が日本語ローカライズで正本md（英語リテラル）と乖離（成功＝付帯表4#6／失敗＝付帯表4#7）。文言は固定せず code とステータスで判定する。
 *  - 本APIはブラウザ向け画面を持たない（正本md）。更新副作用は永続化先テーブル `dtb_player`（`nickname`・`profile`・`customer_id`）を直接DB照合（DB副作用観測）して判定する想定で、spec側はAPI応答を一次に置きDB照査で補完する（本リポでDBは実行しない）。別機能（デッキビルダーアプリ画面・管理画面）の表示は合否条件にしない。
 *  - jwt-token原値・署名シークレット（auth_magic）は env で供給し原値はコミットしない（付帯表3・正本md ログ・監査節）。SEEDニックネーム・プロフィールも env 供給（要実機確認の暫定値）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_05_READY。
 */

/**
 * ユーザー更新エンドポイント実効パス。
 * 由来: UserController.php:78（Route）＝実効 `PUT /api/user`。正本md `PUT /user`（`/api` プレフィクスなし）とは不一致（付帯表4#1）。
 */
export const UPDATE_PATH = "/api/user";

/** 認証ヘッダ名。由来: UserController.php:85（`jwt-token` ヘッダを直接読み取る）。 */
export const JWT_HEADER_NAME = "jwt-token";

// ===== JWT（env 供給・原値非コミット。既定値は要実機確認の暫定） =====

/**
 * 有効JWT（SEED-A15-05-JWT-PLAYER／顧客IDに紐づくプレイヤーあり）。HS256・有効署名・該当プレイヤーの顧客IDを含む。
 * 正本md=`aud`／実装=`sub`（付帯表4#2）でクレーム名が食い違うため、トークンが正常検証されるよう要実機確認。
 * 要実機確認: テスト環境固定の有効トークンへ差し替える（a15 デッキビルダー用ログインAPI または env 供給）。
 */
export const PLAYER_JWT = process.env.A15_05_JWT_PLAYER || ""; // 要実機確認

/**
 * 署名は正しいが顧客IDに該当するプレイヤーが存在しないトークン（SEED-A15-05-JWT-PLAYER 派生／E2E-A15-05-022,030）。
 * 正しい署名には実機シークレットが要るため env 供給（要実機確認）。未設定時は合成値（署名不正として扱われる）でフォールバック。
 */
export const JWT_NO_PLAYER =
  process.env.A15_05_JWT_NO_PLAYER ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTk5OTk5OSJ9.no-matching-player-signature"; // 要実機確認

/** 署名不正トークン（SEED-A15-05-JWT-PLAYER 派生／署名改ざん。E2E-A15-05-023）。署名シークレットを持たずに合成。実装は verifyToken 検証で401を返すことを期待。 */
export const JWT_BAD_SIGNATURE =
  process.env.A15_05_JWT_BAD_SIGNATURE ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.invalid-signature-not-hs256";

/** jwt-token ヘッダ＋Content-Type を組む。token 未指定（undefined）または空なら jwt-token ヘッダを付けない（欠落系021）。token 省略時は PLAYER_JWT。 */
export function buildJwtHeaders(token: string | undefined = PLAYER_JWT): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token !== undefined && token !== "") headers[JWT_HEADER_NAME] = token;
  return headers;
}

/** jwt-token を一切付与しないヘッダ（E2E-A15-05-021 欠落）。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

// ===== SEED 更新値（env 供給・既定は要実機確認の暫定） =====

/** 更新後ニックネーム（SEED-A15-05-PAYLOAD／dtb_player.nickname へ反映＝120）。要実機確認: 環境の投入値へ差し替え。 */
export const SEED_USER_NAME = process.env.A15_05_USER_NAME || "E2Eニックネーム"; // 要実機確認

/** 更新後プロフィール（SEED-A15-05-PAYLOAD／dtb_player.profile へ反映＝121）。要実機確認: 環境の投入値へ差し替え。 */
export const SEED_PROFILE = process.env.A15_05_PROFILE || "E2Eプロフィール"; // 要実機確認

// ===== ペイロード（正本md 入出力節 記載フィールド user_name・profile のみで最小構成） =====

/** 更新ボディのオプション（正本md: user_name 必須・profile 任意）。 */
export interface UpdatePayloadOptions {
  userName?: string;
  profile?: string;
}

/**
 * 正常更新ボディ（user_name・profile）。overrides で各値を差し替える。
 * 記載フィールドのみ（正本md入出力）。実装が受け取るがmdに無い項目は含めない（付帯表3）。
 */
export function buildValidPayload(opts: UpdatePayloadOptions = {}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  body.user_name = "userName" in opts ? opts.userName : SEED_USER_NAME;
  body.profile = "profile" in opts ? opts.profile : SEED_PROFILE;
  return body;
}

/**
 * user_name 未指定（null）ボディ（040/041/042/045/046/051）。profile は残し user_name のみ欠落させる。
 * 正本md: user_name 必須・未指定→400。実装は空文字も400で拒否（付帯表4#4）＝空文字は固定期待にせず、ここでは「未指定」を再現する。
 */
export function buildMissingUserNamePayload(): Record<string, unknown> {
  return { profile: SEED_PROFILE };
}

/**
 * profile 未指定ボディ（122）。user_name は指定し profile のみ欠落させる。
 * 正本md: profile 任意・未指定時は null として保存（上書き）。
 */
export function buildProfileOmittedPayload(): Record<string, unknown> {
  return { user_name: SEED_USER_NAME };
}
