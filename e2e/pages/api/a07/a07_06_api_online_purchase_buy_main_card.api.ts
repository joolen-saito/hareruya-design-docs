/**
 * a07-06 オンライン仕入_買取メインカード（買取アプリ=MTGバイヤー向けに、複数のネット買取受注IDから買取代表カード一覧をまとめて返す参照系JSON API・POST）API/統合レイヤ用 パス／ヘッダ／ペイロード／期待値ヘルパ。
 * ケース表 integration_test/e2e/a07_06_api_online_purchase_buy_main_card_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a07-06) 入出力記載のリクエスト仕様（jwt-token ヘッダ付き POST・ボディ ids）のみを最小構成で組む未実行雛形。実環境（買取アプリ＝MTGバイヤー）は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス形・HTTPライブラリ既定値・整形結果を期待値に流用しない）:
 *  - 送信先は実装の実効パス `POST /api/v1/admin/buyMainCard.json`（付帯表1/付帯表4#1）。
 *    由来: `#[Route('/%eccube_api_v1_route%/admin/buyMainCard.json', name: 'api_admin_buy_main_card', methods: ['POST'])]`（src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyMainCardController.php:37）
 *          ＋ `eccube_api_v1_route` 既定値 `api/v1`（app/config/eccube/packages/eccube.yaml:6,55）＝実効パス。正本md `POST /admin/buyMainCard.json` は `/api/v1` を欠き不一致（付帯表4#1）。
 *  - 認証は firewall `app`（pattern `^/api/v1/`）の access_token（token_handler JwtTokenHandler／extractor JwtTokenHeaderExtractor＝security.yaml:32-39）。
 *    ヘッダ名は `jwt-token`（JwtTokenHeaderExtractor.php:29・HS256＝JwtTokenService.php:41,113-117）。トークン不正・該当Memberなしは 401（BadCredentialsException＝JwtTokenHandler.php:46-58,73-79）。
 *    認可は `#[IsGranted('IS_AUTHENTICATED_FULLY')]`（BuyMainCardController.php:26。クライアント=買取アプリ限定の実体は付帯表4#6 要確認）。
 *  - 取得は `findByBuyOrderIdsWithApplicationPrices($buyOrderIds)`（BuyMainCardController.php:59／DtbBuyMainCardRepository.php:142-153）。ids は `$request->request->get('ids')` 受領（BuyMainCardController.php:40）。
 *    null/空は空配列で短絡（BuyMainCardController.php:40-45・付帯表4#5）、カンマ分解→数字のみ `preg_match('/^\d+$/')` でフィルタ→intval（BuyMainCardController.php:48-52・付帯表4#3）、有効ID無しは空配列（55-57）。
 *  - 合否は設計書の意味で判定する: 正常取得＝HTTP200＋買取代表カード配列JSON／該当0件＝HTTP200＋空配列 `[]`〔仕様固定〕／認証失敗（ヘッダ欠落・署名不正・該当会員なし）＝HTTP401〔仕様固定〕。
 *  - 成功レスポンスの型契約は正本md 入出力(成功) 由来（buyMainCardId/buyOrderId/productId/purchaseCategory=integer、languageId/count/price/cardConditionId=integer(未設定null)、foilFlg/saleFlg=boolean(未設定null)、applicationPrice=状態コードキーのobject）。
 *    foilFlg の実装 int 返却（getFoilFlg(): ?int）は付帯表4#2、applicationPrice の未付与時/0件時の付与形（実装は常にキー付与・空配列）は付帯表4#4 で管理し、期待値を実装へ寄せない（仕様どおり期待し違えば落として検出）。
 *  - jwt-token原値・署名シークレットは env で供給し原値はコミットしない（付帯表3）。SEED の実在ネット買取受注ID・紐づきなしID も env 供給（要実機確認の暫定値）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A07_06_READY。
 */

/** API実効パス接頭辞。由来: eccube.yaml:6,55（%eccube_api_v1_route% 既定値 `api/v1`）。 */
export const API_V1_PREFIX = "/api/v1";

/**
 * 買取代表カード取得エンドポイント実効パス。
 * 由来: BuyMainCardController.php:37（Route）＋ eccube.yaml:6,55（%eccube_api_v1_route% 既定 `api/v1`）＝実効 `POST /api/v1/admin/buyMainCard.json`。
 * 正本md `POST /admin/buyMainCard.json`（接頭辞 `/api/v1` なし）とは不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理する。
 */
export const BUY_MAIN_CARD_PATH = `${API_V1_PREFIX}/admin/buyMainCard.json`;

/** 認証ヘッダ名。由来: JwtTokenHeaderExtractor.php:29（HEADER_NAME `jwt-token`）。 */
export const JWT_HEADER_NAME = "jwt-token";

// ===== JWT（env 供給・原値非コミット。既定値は要実機確認の暫定） =====

/**
 * 有効JWT（SEED-A07-06-API-AUTH／認証済管理者会員）。HS256・有効署名・該当会員の利用者ID(sub)を含む。
 * 要実機確認: テスト環境固定の有効トークンへ差し替える。
 */
export const ADMIN_JWT = process.env.A07_06_JWT_ADMIN || "";

/** 署名不正トークン（SEED-A07-06-API-AUTH 派生／署名改ざん。E2E-A07-06-008/015/016/019）。署名シークレットを持たずに合成。実装は token_handler 検証で401を返すことを期待。 */
export const JWT_BAD_SIGNATURE =
  process.env.A07_06_JWT_BAD_SIGNATURE ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.invalid-signature-not-hs256";

/**
 * 署名は正しいが該当管理者会員が存在しない利用者ID(sub)のトークン（SEED-A07-06-API-AUTH 派生／E2E-A07-06-008）。
 * 正しい署名には実機シークレットが要るため env 供給（要実機確認）。未設定時は合成値（署名不正として401となる）でフォールバック。
 */
export const JWT_NO_MEMBER =
  process.env.A07_06_JWT_NO_MEMBER ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTk5OTk5OSJ9.no-matching-member-signature";

/** jwt-token ヘッダ＋Content-Type を組む。token 省略時は ADMIN_JWT。token が空文字列/undefined なら jwt-token ヘッダを付けない（欠落系007）。 */
export function buildJwtHeaders(token: string | undefined = ADMIN_JWT): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token !== undefined && token !== "") headers[JWT_HEADER_NAME] = token;
  return headers;
}

/** jwt-token を一切付与しないヘッダ（E2E-A07-06-007 欠落）。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

// ===== SEED ネット買取受注ID（付帯表3・env 供給・既定は要実機確認の暫定プレースホルダ） =====

/**
 * SEED-A07-06-CARD-KNOWN: 実在し買取代表カードが紐づくネット買取受注IDのカンマ区切り（既知値）。
 * env 供給・既定値は要実機確認のプレースホルダ。HAS_API(A07_06_READY) ガード下でのみ送信される。
 */
export const BUY_ORDER_IDS_KNOWN = process.env.A07_06_BUY_ORDER_IDS || "5001,5002";

/**
 * SEED-A07-06-CARD-NONE: 買取代表カードが紐づかないネット買取受注ID（未登録ID／紐づきなしID）。
 * 該当0件＝200空配列（E2E-A07-06-010）の確認に使用。env 供給・既定は要実機確認の暫定。
 */
export const BUY_ORDER_IDS_NONE = process.env.A07_06_BUY_ORDER_IDS_NONE || "99990001";

/** 非数値を含む不正な ids（E2E-A07-06-011・非数値フィルタは付帯表4#3）。先頭に非数値・後ろに有効数値ID。 */
export const BUY_ORDER_IDS_INVALID = `abc,${BUY_ORDER_IDS_KNOWN.split(",")[0]}`;

/**
 * KNOWN ids に含まれる買取受注ID群（数値）。受信検証/外部取得（E2E-A07-06-004/013）で
 * 返却各要素の buyOrderId が指定IDのいずれかと一致することの照合に使う。正本md「分解してIDの配列とする」に基づく。
 */
export function expectedBuyOrderIds(): number[] {
  return BUY_ORDER_IDS_KNOWN.split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d+$/.test(s))
    .map((s) => Number(s));
}

// ===== ペイロード（正本md 入出力節 記載フィールド ids のみで最小構成） =====

/** 正常 ids ボディ（実在ネット買取受注ID・カンマ区切り）。E2E-A07-06-001 ほか。 */
export function buildValidIdsPayload(): Record<string, unknown> {
  return { ids: BUY_ORDER_IDS_KNOWN };
}

/** 該当代表カードが無いネット買取受注ID ボディ（E2E-A07-06-010）。 */
export function buildNoneIdsPayload(): Record<string, unknown> {
  return { ids: BUY_ORDER_IDS_NONE };
}

/** 非数値・不正値を含む ids ボディ（E2E-A07-06-011）。 */
export function buildInvalidIdsPayload(): Record<string, unknown> {
  return { ids: BUY_ORDER_IDS_INVALID };
}

/** 正常 ids ＋想定外のボディ項目（E2E-A07-06-012・無視可否は要実機確認）。 */
export function buildExtraFieldPayload(): Record<string, unknown> {
  return { ids: BUY_ORDER_IDS_KNOWN, unexpected_field: "unexpected_value" };
}

/** ids 未指定ボディ（E2E-A07-06-043・空配列短絡は付帯表4#5）。 */
export function buildMissingIdsPayload(): Record<string, unknown> {
  return {};
}

/** ids 空文字ボディ（E2E-A07-06-043）。 */
export function buildEmptyIdsPayload(): Record<string, unknown> {
  return { ids: "" };
}

// ===== 成功レスポンス 型契約オラクル（正本md 入出力(成功) 由来・実装の整形/型へ寄せない） =====

/** 各要素に必須の成功フィールド（正本md 入出力(成功)）。E2E-A07-06-006 で構成を確認。 */
export const SUCCESS_FIELDS = [
  "buyMainCardId",
  "buyOrderId",
  "productId",
  "languageId",
  "foilFlg",
  "count",
  "price",
  "cardConditionId",
  "saleFlg",
  "purchaseCategory",
] as const;

/** 常に integer のフィールド（正本md：buyMainCardId・buyOrderId・productId・purchaseCategory）。 */
export const INTEGER_FIELDS = ["buyMainCardId", "buyOrderId", "productId", "purchaseCategory"] as const;

/** integer（未設定時 null）のフィールド（正本md：languageId・count・price・cardConditionId）。 */
export const NULLABLE_INTEGER_FIELDS = ["languageId", "count", "price", "cardConditionId"] as const;

/** boolean（未設定時 null）のフィールド（正本md：foilFlg・saleFlg。foilFlg の実装 int 返却は付帯表4#2）。 */
export const NULLABLE_BOOLEAN_FIELDS = ["foilFlg", "saleFlg"] as const;
