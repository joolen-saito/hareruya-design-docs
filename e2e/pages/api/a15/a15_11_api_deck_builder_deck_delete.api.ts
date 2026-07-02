/**
 * a15-11 デッキビルダー_デッキ削除（JWT認証つき DELETE API＝デッキビルダーの自身デッキ削除。論理削除＋Redis下書き削除）API/統合レイヤ用 パス／ヘッダ／オラクル文言ヘルパ。
 * ケース表 integration_test/e2e/a15_11_api_deck_builder_deck_delete_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a15-11) 入出力記載のリクエスト仕様（jwt-token ヘッダ付き DELETE・ボディなし）のみを最小構成で組む未実行雛形。実環境は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス形・FW既定値・例外整形を期待値に流用しない）:
 *  - 送信先は実装の実効パス `DELETE /api/deck/{id}`（付帯表1 / 付帯表4#1）。
 *    由来: `#[Route('/api/deck/{id}', name: 'api_deck_builder_deck_delete', methods: ['DELETE', 'OPTIONS'], requirements: ['id' => '\d+'])]`（DeckController.php:177）。
 *          path id は `\d+` 必須（非整数IDはルート不一致で404）。正本md `DELETE /deck/{id}` は `/api` プレフィクスを欠き実装と不一致（付帯表4#1）。
 *    テストは実効パスへ送信し本差異を付帯表で管理する（host/ドメインプレフィクスは要実機確認）。
 *  - 認証は `jwt-token` ヘッダのJWT（HS256・ペイロード `aud` の顧客ID→プレイヤー）を JwtPlayerAuthenticator で検証（DeleteDeckAction.php:29,43-46）。
 *    ヘッダ欠落／署名不正／該当プレイヤーなしは 401（InvalidTokenException|PlayerNotFoundException→401＝DeckController.php:191-195。HS256署名検証の実方式は要実機確認＝付帯表4#6）。
 *  - 所有者でないデッキは 401（DeckAccessDeniedException→401＝DeckController.php:196-200／DeleteDeckAction.php:53-56）。
 *  - 対象デッキなしは 404（DeckNotFoundException→404＝DeckController.php:201-205／DeleteDeckAction.php:48-50）。
 *  - 合否（成功）は HTTP200＋応答 `{code:200, message:"Deck delete success"}`、（失敗）は 401／404＋`{code, message}` を仕様（正本md）由来で判定する（spec側）。
 *  - メッセージは正本md文言を期待値とする。成功「Deck delete success」（実装 en「Deck deletion succeeded」と乖離＝付帯表4#2）／404「The deck does not exist」（実装 en「Deck is not found」と乖離＝付帯表4#3）／所有者外「Authentication failed」（乖離なし＝付帯表4#6）。実装文言へ固定しない。
 *  - 本APIはブラウザ向け画面を持たない（正本md）。削除副作用は永続化先テーブル dtb_deck（deleted_at・採用カード dtb_deck_card の物理削除なし）とRedis一時保存を直接照合（DB／Redis副作用観測）して判定する想定で、spec側はAPI応答を一次に置きDB／Redis照査で補完する（本リポでDB/Redisは実行しない）。
 *  - 本APIはボディパラメータを持たないため送信ペイロードは無い（path id と jwt-token ヘッダのみ）。
 *  - jwt-token原値・署名シークレット（auth_magic）は env で供給し原値はコミットしない（付帯表3）。SEEDデッキIDも env 供給（要実機確認の暫定値）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_11_READY。
 */

/** API実効パス接頭辞。由来: DeckController.php:177（Route `/api/deck/{id}`）。 */
export const API_DECK_PREFIX = "/api/deck";

/**
 * デッキ削除エンドポイント実効パスを組む（デッキID {id} を埋める）。
 * 由来: DeckController.php:177 ＝実効 `DELETE /api/deck/{id}`（id は `\d+` 必須）。
 * 正本md `DELETE /deck/{id}`（接頭辞 `/api` なし）とは不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理する。
 */
export function buildDeletePath(deckId: string | number): string {
  return `${API_DECK_PREFIX}/${deckId}`;
}

/** 認証ヘッダ名。由来: 正本md／DeleteDeckAction.php:29,43-46（jwt-token ヘッダのJWTを JwtPlayerAuthenticator で検証）。 */
export const JWT_HEADER_NAME = "jwt-token";

// ===== JWT（env 供給・原値非コミット。既定値は要実機確認の暫定） =====

/**
 * 有効JWT（SEED-A15-11-JWT-PLAYER／対象デッキの所有プレイヤー）。HS256・有効署名・ペイロード aud の顧客IDが当該プレイヤーに紐づく。
 * 要実機確認: テスト環境固定の有効トークンへ差し替える（署名シークレット auth_magic は env 供給・原値非コミット）。
 */
export const PLAYER_JWT = process.env.A15_11_JWT_PLAYER || "";

/** 署名不正トークン（E2E-A15-11-022）。署名シークレットを持たずに合成。実装は JwtPlayerAuthenticator 検証で 401 を返すことを期待。 */
export const JWT_BAD_SIGNATURE =
  process.env.A15_11_JWT_BAD_SIGNATURE ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiIxIn0.invalid-signature-not-hs256";

/**
 * 署名は正しいが顧客IDに該当するプレイヤーが存在しないトークン（E2E-A15-11-023）。
 * 正しい署名には実機シークレットが要るため env 供給（要実機確認）。未設定時は合成値（署名不正として401となる）でフォールバック。
 */
export const JWT_NO_PLAYER =
  process.env.A15_11_JWT_NO_PLAYER ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiI5OTk5OTk5OSJ9.no-matching-player-signature";

/** jwt-token ヘッダを組む。token 未指定（undefined / 空）なら jwt-token ヘッダを付けない（欠落系021）。token 省略時は PLAYER_JWT。 */
export function buildJwtHeaders(token: string | undefined = PLAYER_JWT): Record<string, string> {
  const headers: Record<string, string> = {};
  if (token !== undefined && token !== "") headers[JWT_HEADER_NAME] = token;
  return headers;
}

/** jwt-token を一切付与しないヘッダ（E2E-A15-11-021 欠落）。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return {};
}

// ===== SEED デッキID（env 供給・既定は要実機確認の暫定） =====

/**
 * SEEDデッキID（付帯表3）。env 供給・既定値は要実機確認のプレースホルダ。HAS_API(A15_11_READY) ガード下でのみ送信される。
 *  - TARGET:      認証プレイヤーが所有する既知IDのデッキ（player_id=認証プレイヤー・deleted_at=NULL・採用カード/Redis下書きあり）＝SEED-A15-11-DECK。
 *  - OTHER:       別プレイヤーが所有するデッキ（所有者外401＝024／区分整合の不変確認＝050）＝SEED-A15-11-DECK-OTHER。
 *  - NONEXISTENT: 該当しない（存在しない）デッキID（030）。path id は `\d+` 必須のため整数を使う。
 */
export const DECK_ID = {
  TARGET: process.env.A15_11_DECK_ID || "1001", // 要実機確認: SEED-A15-11-DECK（対象デッキ）
  OTHER: process.env.A15_11_DECK_OTHER_ID || "1002", // 要実機確認: SEED-A15-11-DECK-OTHER（別プレイヤー所有）
  NONEXISTENT: process.env.A15_11_DECK_NONEXISTENT_ID || "99999999", // 存在しないデッキID（030）
} as const;

// ===== 正本md由来のオラクル文言。実装文言の乖離は付帯表4で記録（テストは正本md文言で照合し違えば落として検出） =====

/**
 * 正本md（レスポンス節・エラー処理節）の応答メッセージ（オラクル）。
 *  - DELETE_SUCCESS: 削除成功（正本md「Deck delete success」。実装 en「Deck deletion succeeded」＝付帯表4#2）。
 *  - DECK_NOT_FOUND: 対象デッキなし（正本md「The deck does not exist」。実装 en「Deck is not found」＝付帯表4#3）。
 *  - AUTH_FAILED:    所有者でないデッキ（正本md「Authentication failed」。実装一致・乖離なし＝付帯表4#6）。
 */
export const SPEC_MESSAGE = {
  DELETE_SUCCESS: "Deck delete success",
  DECK_NOT_FOUND: "The deck does not exist",
  AUTH_FAILED: "Authentication failed",
} as const;
