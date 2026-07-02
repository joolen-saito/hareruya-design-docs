/**
 * a07-03 オンライン仕入_買取注文フリーコメント更新（買取アプリ=MTGバイヤー向けにネット買取受注のフリーコメント＝メモをPUT更新するJWT認証付きJSON API）API/統合レイヤ用 パス／ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a07_03_api_online_purchase_buy_order_free_comment_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a07-03) 入出力記載のリクエスト仕様（jwt-token ヘッダ付き PUT・free_comment）のみを最小構成で組む未実行雛形。実環境（買取アプリ＝MTGバイヤー）は呼ばない。
 * 本ファイルの export 面（パス／ID／JWT／buildAuthHeaders／buildValidCommentPayload）は API spec と UI(admin) spec の双方から再利用する（UI spec が API で更新→管理画面で観測するため）。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス形・例外クラス既定挙動・HTTPライブラリ既定値・Form制約を期待値に流用しない）:
 *  - 送信先は実装の実効パス `PUT /api/v1/admin/buyOrder/{id}/freeComment.json`（付帯表1/付帯表4#1）。
 *    由来: `#[Route('/%eccube_api_v1_route%/admin/buyOrder/{id}/freeComment.json', methods:['PUT'])]`（src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:93）
 *          ＋ `eccube_api_v1_route` 既定値 `api/v1`（app/config/eccube/packages/eccube.yaml:6,55）＝実効パス。正本md `PUT /admin/buyOrder/{id}/freeComment.json` は `/api/v1` を欠き不一致（付帯表4#1）。
 *  - 認証は firewall `app`（pattern `^/api/v1/`）の access_token（token_handler JwtTokenHandler／extractor JwtTokenHeaderExtractor＝security.yaml:32-39）。
 *    ヘッダ名は `jwt-token`（JwtTokenHeaderExtractor.php:29）。欠落・署名不正・該当会員なしは 401（firewall 認証がメソッド実行に先行。HS256署名検証の実方式は要実機確認＝付帯表4#2/#3）。
 *  - 対象受注なしは 404（NotFoundException＝BuyOrderController.php:101-104）。free_comment=null は 400＋errors「コメントを入力してください」（MissingRequiredParameterException＝BuyOrderController.php:96-99／MissingRequiredParameterException.php:30-31）。
 *  - 更新本体は setMemo()->setMember()->setUpdateDate()＋flush/commit（UpdateFreeCommentAction.php:35-37）。永続化先 dtb_buy_order（メモ列 memo・更新担当者 member_id→dtb_member id）。
 *  - 合否（成功）は HTTPステータス200＋応答 `{code:200}`（JsonResponse BuyOrderController.php:120）、（失敗）は 400＋`{code,errors}` を仕様（正本md）由来で判定する（spec側）。
 *  - 空文字・長大コメントはpf-api側で上限判定せず保存（正本md:149）。DBカラム長(memo)超過時の挙動はDB制約依存＝要実機確認（付帯表4#7）。
 *  - jwt-token原値・署名シークレット(auth_magic)は env で供給し原値はコミットしない（付帯表3）。SEED受注IDも env 供給（要実機確認の暫定値）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A07_03_READY。
 */

/** API実効パス接頭辞。由来: eccube.yaml:6,55（%eccube_api_v1_route% 既定値 `api/v1`）。 */
export const API_V1_PREFIX = "/api/v1";

/**
 * ネット買取受注フリーコメント更新エンドポイント実効パスを組む（受注ID {id} を埋める）。
 * 由来: BuyOrderController.php:93（Route）＋ eccube.yaml:6,55 ＝実効 `PUT /api/v1/admin/buyOrder/{id}/freeComment.json`。
 * 正本md `PUT /admin/buyOrder/{id}/freeComment.json`（接頭辞 `/api/v1` なし）とは不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理する。
 */
export function buyOrderFreeCommentPath(orderId: string | number): string {
  return `${API_V1_PREFIX}/admin/buyOrder/${orderId}/freeComment.json`;
}

/** 認証ヘッダ名。由来: JwtTokenHeaderExtractor.php:29（HEADER_NAME `jwt-token`）。 */
export const JWT_HEADER_NAME = "jwt-token";

// ===== JWT（env 供給・原値非コミット。既定値は要実機確認の暫定） =====

/**
 * 有効JWT（SEED-A07-03-AUTH-MEMBER／更新担当者の管理者会員）。HS256・有効署名・該当会員の利用者IDを含む。
 * 要実機確認: テスト環境固定の有効トークンへ差し替える（署名シークレット auth_magic は env 供給・原値非コミット）。
 */
export const JWT_TOKEN = process.env.A07_03_JWT_ADMIN || "";

/** 署名不正トークン（E2E-A07-03-021）。署名シークレットを持たずに合成。実装は token_handler 検証で401を返すことを期待。 */
export const JWT_BAD_SIGNATURE =
  process.env.A07_03_JWT_BAD_SIGNATURE ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.invalid-signature-not-hs256";

/**
 * 署名は正しいが該当管理者会員が存在しない利用者IDのトークン（E2E-A07-03-022）。
 * 正しい署名には実機シークレットが要るため env 供給（要実機確認）。未設定時は合成値（署名不正として401となる）でフォールバック。
 */
export const JWT_NO_MEMBER =
  process.env.A07_03_JWT_NO_MEMBER ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTk5OTk5OSJ9.no-matching-member-signature";

/** jwt-token ヘッダ＋Content-Type を組む。token 未指定（undefined）/空なら jwt-token ヘッダを付けない（欠落系020）。token 省略時は JWT_TOKEN。 */
export function buildAuthHeaders(token: string | undefined = JWT_TOKEN): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token !== undefined && token !== "") headers[JWT_HEADER_NAME] = token;
  return headers;
}

/** jwt-token を一切付与しないヘッダ（E2E-A07-03-020 欠落）。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

// ===== SEED 受注ID（env 供給・既定は要実機確認の暫定） =====

/**
 * SEED受注ID（付帯表3 SEED-A07-03-NET-ORDER 系）。env 供給・既定値は要実機確認のプレースホルダ。HAS_API(A07_03_READY) ガード下でのみ送信される。
 *  - TARGET:      更新対象の既知ネット買取受注（メモ＝フリーコメント任意・受注ステータス既知）。
 *  - EMPTY:       メモ未設定のネット買取受注（新規登録010・SEED-A07-03-NET-ORDER-EMPTY）。
 *  - FILLED:      メモ設定済のネット買取受注（上書き更新011・SEED-A07-03-NET-ORDER-FILLED）。
 *  - NONEXISTENT: 存在しない受注ID（030/031）。
 */
export const ORDER_ID = {
  TARGET: process.env.A07_03_ORDER_ID || "1001", // 要実機確認: SEED-A07-03-NET-ORDER（対象受注）
  EMPTY: process.env.A07_03_ORDER_EMPTY_ID || "1002", // 要実機確認: SEED-A07-03-NET-ORDER-EMPTY（メモ未設定）
  FILLED: process.env.A07_03_ORDER_FILLED_ID || "1003", // 要実機確認: SEED-A07-03-NET-ORDER-FILLED（メモ設定済）
  NONEXISTENT: process.env.A07_03_ORDER_NONEXISTENT_ID || "99999999", // 存在しない受注ID（030/031）
} as const;

/** UI(admin) spec が更新対象に使う既定受注ID（ORDER_ID.TARGET）。a06_04 の OTC_ORDER_ID 相当の単一エクスポート。 */
export const ORDER_ID_FOR_UI = ORDER_ID.TARGET;

// ===== ペイロード（正本md 入出力節 記載フィールド free_comment のみで最小構成） =====

/** 長大コメント文字数（013＝最大長相当。DBカラム長(memo)超過時の挙動は要実機確認＝付帯表4#7）。env 供給可。 */
export const COMMENT_LONG_LENGTH = Number(process.env.A07_03_COMMENT_LONG_LENGTH || 10000);

/** 想定外項目（014）。正本md未記載の項目。free_comment のみ参照され想定外項目はエラーで停止しないこと（BuyOrderController.php:96）を確認する。 */
export const UNEXPECTED_FIELD = { unexpected_field: "想定外の値" } as const;

/** 正常更新ボディ（free_comment＝任意文字列）。comment 省略時は既定値。 */
export function buildValidCommentPayload(comment = "E2E フリーコメント"): Record<string, unknown> {
  return { free_comment: comment };
}

/** 空文字コメントボディ（012＝空文字は入力不正としない・正本md:149）。 */
export function buildEmptyCommentPayload(): Record<string, unknown> {
  return { free_comment: "" };
}

/** 長大コメントボディ（013＝最大長相当・APIは上限判定しない・正本md:149。length 省略時は COMMENT_LONG_LENGTH）。 */
export function buildLongCommentPayload(length = COMMENT_LONG_LENGTH): Record<string, unknown> {
  return { free_comment: "あ".repeat(length) };
}

/** 想定外項目を加えたボディ（014＝free_comment のみ反映・想定外項目で停止しない）。 */
export function buildExtraFieldCommentPayload(comment = "E2E フリーコメント"): Record<string, unknown> {
  return { free_comment: comment, ...UNEXPECTED_FIELD };
}

/** free_comment 未指定（null）ボディ（032/033＝入力不正400）。free_comment キーを送らない。 */
export function buildMissingCommentPayload(): Record<string, unknown> {
  return {};
}

// ===== 正本md由来のエラーメッセージ文言（オラクル）。実装文言/本文書式の乖離は付帯表4で記録（テストは正本md文言で照合し違えば落として検出） =====

/**
 * 正本md（処理フロー#3・エラー処理節）の検証メッセージ。
 *  - COMMENT_REQUIRED: free_comment 未指定（null）時のメッセージ（正本md:107,124,201）。
 *    実装は MissingRequiredParameterException('コメントを入力してください')（BuyOrderController.php:96-99）。
 *    レスポンス本文の `code` 同梱有無は要実機確認（付帯表4#5）。
 */
export const SPEC_MESSAGE = {
  COMMENT_REQUIRED: "コメントを入力してください",
} as const;
