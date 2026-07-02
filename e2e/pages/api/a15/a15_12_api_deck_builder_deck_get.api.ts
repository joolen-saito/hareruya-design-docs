/**
 * a15-12 デッキビルダー_デッキ取得（デッキIDを指定して1件のデッキ情報を返す JSON API・GET参照系）API/統合レイヤ用 パス／クエリ／ヘルパ。
 * ケース表 integration_test/e2e/a15_12_api_deck_builder_deck_get_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a15-12) 入出力記載のリクエスト仕様（display_token クエリ・jwt-token ヘッダ任意の GET）のみを最小構成で組む未実行雛形。実環境は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス形・型・FW既定値・Form制約を期待値に流用しない）:
 *  - 送信先は実装の実効パス `GET /api/deck/{id}`（付帯表1/付帯表4#1）。
 *    由来: `#[Route('/api/deck/{id}', name: 'api_deck_builder_deck_get', methods: ['GET','OPTIONS'], requirements: ['id' => '\d+'])]`（DeckController.php:214）
 *          ＋ App配下コントローラはプレフィクス無しで登録（routes.yaml:6）＝実効 `GET /api/deck/{id}`。正本md `GET /deck/{id}` は `/api` を欠き不一致（付帯表4#1）。
 *  - `display_token` はクエリから受領（DeckController.php:221）。`jwt-token` ヘッダは optionalAuthenticate（DeckController.php:747-759／無効・欠落は null＝所有者扱いしない）。
 *    本APIはトークンが無くても公開デッキを返すため、トークン欠落のみを理由に 401 は返さない（認証・認可）。
 *  - 取得順は Redis下書き優先（getDeckFromRedis／DeckService.php:305）→ 無ければ DB（findByDeckIdWithCards／DeckController.php:239／deleted_at 非nullは404）。
 *  - 公開範囲判定は canViewDeck（DeckController.php:764-789／公開1=無条件可・非公開2=所有者本人・限定公開3=display_token一致または所有者本人）。
 *  - 合否（成功）は HTTP200＋応答 `{..., code:200, message}`、（失敗＝該当なし・参照不可）は 404＋`{code, message}` を仕様（正本md）由来で判定する。
 *    成功メッセージは正本md「Get deck success」、失敗メッセージは正本md「Deck is not found」を期待し、実装の日本語文言（付帯表4#2/#3）と違えば落として検出する（実装へ寄せない）。
 *    `deck_private_flag` は仕様 boolean（実装は int 1/0＝付帯表4#4）、`scope_id` は公開区分（実装は disp_id 直充当＝付帯表4#6）を仕様型・仕様意味で期待する。
 *  - `id` 非数値・0以下・id欠落時の具体ステータスは正典未定義（要実機確認＝付帯表4#5）。テストは「正常取得200とならない」ことのみ判定し具体ステータスを固定しない。
 *  - 本APIは参照系（DB更新・Redis書き込み無し）。副作用なし・物理削除なしの観測は永続化先の直接DB照合（DB副作用観測）で補完する想定で、spec側はAPI応答を一次に置きDB照査で補完する（本リポでDBは実行しない）。
 *  - jwt-token原値・display_token原値・署名シークレットは env で供給し原値はコミットしない（付帯表3）。SEEDデッキIDも env 供給（要実機確認の暫定値）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A15_12_READY。
 */

/** API実効パス接頭辞。由来: routes.yaml:6（App配下プレフィクス無し）＋ DeckController.php:214（Route `/api/deck/{id}`）。 */
export const API_PREFIX = "/api";

/** クエリパラメータ名（display_token）。由来: DeckController.php:221（クエリから受領）。 */
export const DISPLAY_TOKEN_PARAM = "display_token";

/**
 * デッキ取得エンドポイント実効パスを組む（デッキID {id} を埋める／任意でクエリを付与）。
 * 由来: DeckController.php:214（Route）＋ routes.yaml:6（プレフィクス無し）＝実効 `GET /api/deck/{id}`。
 * 正本md `GET /deck/{id}`（接頭辞 `/api` なし）とは不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理する。
 */
export function buildDeckPath(
  id: string | number,
  query: Record<string, string | number> = {},
): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) qs.append(k, String(v));
  const suffix = qs.toString();
  return `${API_PREFIX}/deck/${id}${suffix ? `?${suffix}` : ""}`;
}

/**
 * デッキIDを欠いたパス（E2E-A15-12-031 必須パス変数 id 欠落）。
 * ルート要件 `requirements ['id' => '\d+']`（DeckController.php:214）に一致せず、具体ステータスは要実機確認（付帯表4#5）。
 */
export function buildDeckPathNoId(): string {
  return `${API_PREFIX}/deck/`;
}

/** display_token クエリのみを付与してパスを組む（限定公開トークン照合 030/036/043 用）。 */
export function buildDeckPathWithToken(id: string | number, displayToken: string): string {
  return buildDeckPath(id, { [DISPLAY_TOKEN_PARAM]: displayToken });
}

// ===== 認証ヘッダ（jwt-token・env 供給・原値非コミット） =====

/** 認証ヘッダ名。由来: optionalAuthenticate の jwt-token ヘッダ（DeckController.php:747-759）。 */
export const JWT_HEADER_NAME = "jwt-token";

/**
 * 所有者本人の有効JWT（SEED-A15-12-JWT／HS256・aud＝顧客ID＝所有プレイヤー）。非公開/限定公開デッキの所有者参照（042/043）に使用。
 * 要実機確認: テスト環境固定の有効トークンへ差し替える。原値はコミットしない。
 */
export const JWT_OWNER = process.env.A15_12_JWT_OWNER || "";

/**
 * 無効/署名不正トークン（SEED-A15-12-JWT／E2E-A15-12-001）。optionalAuthenticate で null 化され所有者扱いされないことを期待。
 * 正しい署名には実機シークレットが要るため env 供給（要実機確認）。未設定時は合成値（無効トークン）でフォールバック。
 */
export const JWT_INVALID =
  process.env.A15_12_JWT_INVALID ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIwIn0.invalid-signature-not-hs256";

/** jwt-token ヘッダを組む。token 未指定（undefined）または空文字なら jwt-token ヘッダを付けない（欠落系）。 */
export function buildJwtHeaders(token: string | undefined = JWT_OWNER): Record<string, string> {
  const headers: Record<string, string> = {};
  if (token !== undefined && token !== "") headers[JWT_HEADER_NAME] = token;
  return headers;
}

/** jwt-token を一切付与しないヘッダ（公開デッキ参照・トークン無し参照系）。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return {};
}

// ===== SEED デッキID（env 供給・既定は要実機確認の暫定値。HAS_API(A15_12_READY) ガード下でのみ送信） =====

/**
 * SEEDデッキID（付帯表3）。env 供給・既定値は要実機確認のプレースホルダ。
 *  - PUBLIC:      公開デッキ（scope_id=1・private_flg=0）SEED-A15-12-DECK-PUBLIC。
 *  - PRIVATE:     非公開デッキ（scope_id=2・private_flg=1・所有プレイヤー既知）SEED-A15-12-DECK-PRIVATE。
 *  - UNLISTED:    限定公開デッキ（scope_id=3・display_token既知・所有プレイヤー既知）SEED-A15-12-DECK-UNLISTED。
 *  - DRAFT:       Redis下書きあり/なしを切り替えられる公開デッキ SEED-A15-12-DECK-DRAFT。
 *  - NONEXISTENT: 存在しないデッキID（未登録）SEED-A15-12-DECK-NONE。
 *  - DELETED:     論理削除済み（deleted_at 設定）デッキID SEED-A15-12-DECK-NONE。
 *  - INVALID_ZERO: 0以下の不正ID（005／具体ステータスは要実機確認＝付帯表4#5）。
 */
export const DECK_ID = {
  PUBLIC: process.env.A15_12_DECK_PUBLIC_ID || "1", // 要実機確認: SEED-A15-12-DECK-PUBLIC（disp_id=1）
  PRIVATE: process.env.A15_12_DECK_PRIVATE_ID || "2", // 要実機確認: SEED-A15-12-DECK-PRIVATE（disp_id=2）
  UNLISTED: process.env.A15_12_DECK_UNLISTED_ID || "3", // 要実機確認: SEED-A15-12-DECK-UNLISTED（disp_id=3）
  DRAFT: process.env.A15_12_DECK_DRAFT_ID || "1", // 要実機確認: SEED-A15-12-DECK-DRAFT（下書き切替対象）
  NONEXISTENT: process.env.A15_12_DECK_NONE_ID || "99999999", // 存在しないデッキID（008/025/033）
  DELETED: process.env.A15_12_DECK_DELETED_ID || "99999998", // 論理削除済みデッキID（044）
  INVALID_ZERO: "0", // 0以下の不正ID（005・ルート要件 \d+ 起因）
} as const;

// ===== display_token（env 供給・原値非コミット。既定は要実機確認の暫定値） =====

/**
 * 限定公開デッキの閲覧用 display_token（SEED-A15-12-DECK-UNLISTED）。
 *  - MATCH:    一致トークン（036／限定公開を参照可）。要実機確認: 環境の既知値へ。原値はコミットしない。
 *  - MISMATCH: 不一致トークン（030／非所有者かつトークン不一致で404）。
 */
export const DISPLAY_TOKEN = {
  MATCH: process.env.A15_12_DISPLAY_TOKEN_MATCH || "match-display-token-placeholder",
  MISMATCH: process.env.A15_12_DISPLAY_TOKEN_MISMATCH || "mismatch-display-token-placeholder",
} as const;

// ===== 想定外クエリ（006・要実機確認＝サーバエラーで停止しないことのみ判定） =====

/** 未知のクエリ項目（006）。正本に明記が無いため値・無視可否は固定しない（要実機確認）。 */
export const UNKNOWN_QUERY = { unknown_param: "unexpected-value" } as const;

// ===== 公開範囲（scope_id）。仕様意味（付帯表4#6・実装は disp_id 直充当） =====

/** 公開範囲 scope_id（公開1／非公開2／限定公開3）。仕様意味で参照可否を判定する。 */
export const SCOPE = {
  PUBLIC: 1,
  PRIVATE: 2,
  UNLISTED: 3,
} as const;

// ===== 正本md由来のメッセージ文言（オラクル）。実装の日本語文言乖離は付帯表4で記録（テストは正本md文言で照合し違えば落として検出） =====

/**
 * 正本md（入出力 レスポンス）のメッセージ文言。
 *  - GET_SUCCESS: 成功（実装は「デッキ取得に成功しました」＝付帯表4#3）。
 *  - NOT_FOUND:   失敗＝該当なし・参照不可（実装は「デッキが見つかりません」＝付帯表4#2）。
 */
export const MESSAGE = {
  GET_SUCCESS: "Get deck success",
  NOT_FOUND: "Deck is not found",
} as const;

/**
 * 成功レスポンスの仕様フィールド（入出力 レスポンス(成功)・032）。
 * code・scope_id は integer、deck_private_flag は boolean、deck_tags・campaign_tags・cards は array（型契約は spec で照合）。
 */
export const SUCCESS_FIELDS = [
  "code",
  "message",
  "deck_name",
  "format_id",
  "scope_id",
  "deck_private_flag",
  "deck_user_id",
  "display_token",
  "deck_tags",
  "campaign_tags",
  "cards",
] as const;
