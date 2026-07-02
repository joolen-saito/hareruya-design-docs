/**
 * a07-07 オンライン仕入_買取注文個別入力商品（買取アプリ=MTGバイヤー向けに、複数のネット買取受注ID→各受注に紐づく
 * 個別入力商品一覧を一括取得する参照系JSON API）API/統合レイヤ用 パス／ペイロード／ヘルパ。
 * 関数名の綴りは仕様どおり "indivisual"（実装の Controller/Entity 綴りに一致）。
 * ケース表 integration_test/e2e/a07_07_api_online_purchase_buy_order_indivisual_input_product_e2e_cases.md
 *   （付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a07-07) 入出力記載のリクエスト仕様（jwt-token ヘッダ付き POST・ids カンマ区切り）のみを
 * 最小構成で組む未実行雛形。実環境（買取アプリ＝MTGバイヤー）は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス形・型キャスト・FW既定値を期待値に流用しない）:
 *  - 送信先は実装の実効パス `POST /api/v1/admin/buyOrderIndivisualInputProduct.json`（付帯表1/付帯表4#1）。
 *    由来: `#[Route(path: '/%eccube_api_v1_route%/admin/buyOrderIndivisualInputProduct.json',
 *            name: 'api_admin_buy_order_indivisual_input_product', methods: ['POST'])]`
 *          （src/Eccube/Controller/App/MTGBuyer/V1/Admin/BuyOrderIndivisualInputProductController.php:37）
 *          ＋ `eccube_api_v1_route` 既定値 `api/v1`（app/config/eccube/packages/eccube.yaml:6,55）＝実効パス。
 *    正本md `POST /admin/buyOrderIndivisualInputProduct.json` は `/api/v1` を欠き不一致（付帯表4#1）。
 *    テストは実効パスへ送信し本差異を記録、合否は仕様の意味（200・配列構造・型契約・0件正常）で判定する。
 *  - 認証は `#[IsGranted('IS_AUTHENTICATED_FULLY')]`（BuyOrderIndivisualInputProductController.php:26）＋ firewall `app`
 *    （pattern `^/api/v1/`・access_token・JwtTokenHandler／JwtTokenHeaderExtractor＝app/config/eccube/packages/security.yaml:32-39）。
 *    ヘッダ名は `jwt-token`。ヘッダ欠落・該当管理者会員なし・署名不正は 401（正本md:62-68,192）。
 *    HS256署名検証の実方式・ヘッダ名一致は要実機確認（付帯表4#2）だが結果（401）で判定する。
 *  - ids は `request->request->get('ids')`（:40）でカンマ分解（`explode(',', $ids)`:49）、空/未指定・有効ID無しは
 *    `new JsonResponse([])`＝空配列（:43-44,55-57）。非数値IDは `preg_match('/^\d+$/')` で除外・intval（:48-52・正典未定義＝付帯表4#3）。
 *  - 応答整形（:61-71）: buyOrderIndivisualInputProductId=getId()(int)／buyOrderId=getBuyOrder()->getId()(int)／
 *    name=getName()(string)／price=getPrice()(?int・Entity/DtbBuyOrderIndivisualInputProduct.php:79)／
 *    count=getQuantity()(?int・:91)／saleFlg=isSaleFlg()(?bool・:103)。型・フィールド名・null契約・serialize_null は正本mdと一致（乖離なし）。
 *  - 本APIは参照のみ（副作用 無し・正本md:150-152）でDB更新観点を持たない。判定はHTTPステータス・レスポンス本文に閉じる（UIレイヤ0）。
 *  - jwt-token原値・署名シークレットは env で供給し原値はコミットしない（付帯表3）。SEED受注IDも env 供給（要実機確認の暫定値）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A07_07_READY。
 */

/** API実効パス接頭辞。由来: eccube.yaml:6,55（%eccube_api_v1_route% 既定値 `api/v1`）。 */
export const API_V1_PREFIX = "/api/v1";

/**
 * 個別入力商品一括取得エンドポイント実効パスを組む。
 * 由来: BuyOrderIndivisualInputProductController.php:37（Route・methods:['POST']）＋ eccube.yaml:6,55
 *       ＝実効 `POST /api/v1/admin/buyOrderIndivisualInputProduct.json`。
 * 正本md `POST /admin/buyOrderIndivisualInputProduct.json`（接頭辞 `/api/v1` なし）とは不一致（付帯表4#1）。
 */
export function buildBuyOrderIndivisualInputProductPath(): string {
  return `${API_V1_PREFIX}/admin/buyOrderIndivisualInputProduct.json`;
}

/** 認証ヘッダ名。由来: 正本md 認証・認可（jwt-token・:62-68）／JwtTokenHeaderExtractor（security.yaml:32-39）。 */
export const JWT_HEADER_NAME = "jwt-token";

// ===== JWT（env 供給・原値非コミット。既定値は要実機確認の暫定） =====

/**
 * 有効JWT（SEED-A07-07-JWT-ADMIN／該当する管理者会員）。HS256・有効署名・該当会員の利用者IDを含む。
 * 要実機確認: テスト環境固定の有効トークンへ差し替える。
 */
export const ADMIN_JWT = process.env.A07_07_JWT_ADMIN || "";

/** 署名不正トークン（E2E-A07-07-023）。署名シークレットを持たずに合成。実装は token_handler 検証で401を返すことを期待。 */
export const JWT_BAD_SIGNATURE =
  process.env.A07_07_JWT_BAD_SIGNATURE ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.invalid-signature-not-hs256";

/**
 * 署名は正しいが該当管理者会員が存在しない利用者IDのトークン（E2E-A07-07-022）。
 * 正しい署名には実機シークレットが要るため env 供給（要実機確認）。未設定時は合成値（署名不正として401となる）でフォールバック。
 */
export const JWT_NO_MEMBER =
  process.env.A07_07_JWT_NO_MEMBER ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTk5OTk5OSJ9.no-matching-member-signature";

/** jwt-token ヘッダ＋Content-Type を組む。token 未指定（undefined）／空なら jwt-token ヘッダを付けない（欠落系021）。token 省略時は ADMIN_JWT。 */
export function buildJwtHeaders(token: string | undefined = ADMIN_JWT): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token !== undefined && token !== "") headers[JWT_HEADER_NAME] = token;
  return headers;
}

/** jwt-token を一切付与しないヘッダ（E2E-A07-07-021 欠落）。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

// ===== SEED 買取受注ID（env 供給・既定は要実機確認の暫定。HAS_API(A07_07_READY) ガード下でのみ送信される） =====

/**
 * SEED買取受注ID（付帯表3）。env 供給・既定値は要実機確認のプレースホルダ。
 *  - PRODUCTS_KNOWN_A / PRODUCTS_KNOWN_B: 既知の個別入力商品を持つ別々のネット買取受注ID（SEED-A07-07-PRODUCTS-KNOWN・004/055用に2件以上）。
 *  - ORDER_NOPRODUCT:                    個別入力商品が1件も紐づかない買取受注ID（SEED-A07-07-ORDER-NOPRODUCT・007/012/055）。
 *  - NULLFIELDS:                         price/count/saleFlg がいずれも未設定（NULL）の個別入力商品を持つ買取受注ID（SEED-A07-07-NULLFIELDS・050）。
 *  - NONEXISTENT:                        存在しない買取受注ID（055 の一部不存在）。
 */
export const ORDER_ID = {
  PRODUCTS_KNOWN_A: process.env.A07_07_ORDER_KNOWN_A || "1001", // 要実機確認: SEED-A07-07-PRODUCTS-KNOWN（既知商品あり受注A）
  PRODUCTS_KNOWN_B: process.env.A07_07_ORDER_KNOWN_B || "1002", // 要実機確認: SEED-A07-07-PRODUCTS-KNOWN（既知商品あり受注B）
  ORDER_NOPRODUCT: process.env.A07_07_ORDER_NOPRODUCT || "1003", // 要実機確認: SEED-A07-07-ORDER-NOPRODUCT（個別入力商品なし受注）
  NULLFIELDS: process.env.A07_07_ORDER_NULLFIELDS || "1004", // 要実機確認: SEED-A07-07-NULLFIELDS（price/count/saleFlg 未設定）
  NONEXISTENT: process.env.A07_07_ORDER_NONEXISTENT || "99999999", // 存在しない買取受注ID（055）
} as const;

/** 仕様応答フィールド名（正本md レスポンス フィールド定義・型契約。オラクルの期待キー集合）。 */
export const RESPONSE_FIELDS = [
  "buyOrderIndivisualInputProductId",
  "buyOrderId",
  "name",
  "price",
  "count",
  "saleFlg",
] as const;

// ===== ペイロード（正本md 入出力節 記載フィールド ids のみで最小構成。値はテスト内生成 synthetic） =====

/** 個別入力商品1要素の応答型（正本md 型契約：未設定は null）。 */
export interface BuyOrderIndivisualInputProduct {
  buyOrderIndivisualInputProductId: number;
  buyOrderId: number;
  name: string;
  price: number | null;
  count: number | null;
  saleFlg: boolean | null;
}

/** ids（カンマ区切りstring）を持つPOSTボディを組む。配列を渡すとカンマ連結する（正本md: ids はカンマ区切りstring）。 */
export function buildIdsPayload(ids: Array<string | number>): Record<string, unknown> {
  return { ids: ids.join(",") };
}

/** 複数の既知買取受注ID（001/002/003/006/009/051/052/053/054）。 */
export function buildKnownIdsPayload(): Record<string, unknown> {
  return buildIdsPayload([ORDER_ID.PRODUCTS_KNOWN_A, ORDER_ID.PRODUCTS_KNOWN_B]);
}

/** 異なるネット買取受注に跨る複数ID（004 外部取得・一括取得）。 */
export function buildMultiOrderIdsPayload(): Record<string, unknown> {
  return buildIdsPayload([ORDER_ID.PRODUCTS_KNOWN_A, ORDER_ID.PRODUCTS_KNOWN_B]);
}

/** ids 空文字（011 必須条件→空配列）。 */
export function buildEmptyIdsPayload(): Record<string, unknown> {
  return { ids: "" };
}

/** ids 未指定（011 必須条件→空配列・キーごと送らない）。 */
export function buildMissingIdsPayload(): Record<string, unknown> {
  return {};
}

/** 個別入力商品が紐づかない買取受注IDのみ（007/012 データなし→空配列）。 */
export function buildNoProductIdsPayload(): Record<string, unknown> {
  return buildIdsPayload([ORDER_ID.ORDER_NOPRODUCT]);
}

/** 同一買取受注IDの重複・順不同を含む ids（008 重複・順序）。 */
export function buildDuplicateUnorderedIdsPayload(): Record<string, unknown> {
  return buildIdsPayload([
    ORDER_ID.PRODUCTS_KNOWN_B,
    ORDER_ID.PRODUCTS_KNOWN_A,
    ORDER_ID.PRODUCTS_KNOWN_A,
    ORDER_ID.PRODUCTS_KNOWN_B,
  ]);
}

/** price/count/saleFlg 未設定の個別入力商品を持つ買取受注ID（050 null契約）。 */
export function buildNullFieldsIdsPayload(): Record<string, unknown> {
  return buildIdsPayload([ORDER_ID.NULLFIELDS]);
}

/** 商品あり受注 + 紐づきなし/存在しない受注を混在（055 一部不存在）。 */
export function buildPartialExistIdsPayload(): Record<string, unknown> {
  return buildIdsPayload([ORDER_ID.PRODUCTS_KNOWN_A, ORDER_ID.ORDER_NOPRODUCT, ORDER_ID.NONEXISTENT]);
}

/** 既知IDに非数値/型不正値を混在（030 要実機確認・付帯表4#3）。 */
export function buildNonNumericIdsPayload(): Record<string, unknown> {
  return { ids: `${ORDER_ID.PRODUCTS_KNOWN_A},abc,-1,12.5` };
}

/** ids に加え想定外の項目を付与（031 要実機確認・付帯表4#3）。 */
export function buildExtraFieldPayload(): Record<string, unknown> {
  return { ids: `${ORDER_ID.PRODUCTS_KNOWN_A},${ORDER_ID.PRODUCTS_KNOWN_B}`, unexpectedField: "unexpectedValue" };
}

/** 異常系を誘発する入力（032 要実機確認・付帯表4#3）。ids に型不正な構造を与える。 */
export function buildAbnormalPayload(): Record<string, unknown> {
  return { ids: { unexpected: "object-instead-of-string" } };
}
