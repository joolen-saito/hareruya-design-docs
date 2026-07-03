/**
 * o01-02 その他_MTGバイヤー_ネット買取（MTGバイヤーがネット/オンライン買取査定で叩くEC-CUBE側 admin JSON API 群）
 * API/統合レイヤ用 パス／ヘッダ／ペイロード ヘルパ。
 *
 * area 判定: **api**（画面を伴わない）。MTGバイヤー本体はリポジトリ外の外部アプリで画面・UIは仕様確定せず、
 *   EC-CUBE側で観測できる入口は `App/MTGBuyer/V1/Admin/` の JSON API（正本md「利用者視点の入口」L57-66／「フロント挙動」L73-78）。
 *   よって front/admin 画面specは無く request ベースの API/統合レイヤで扱う。店頭買取（O01-01）の姉妹機能で、対象が別テーブル系統（dtb_buy_order*）。
 *
 * ケース表 integration_test/e2e/o01_02_other_mtg_buyer_mtg_buyer_online_purchase_e2e_cases.md（付帯表1/3/4）に対応。
 * 本ファイルは正本md(o01-02) 利用者視点の入口・処理フロー・業務ルールのリクエスト仕様のみを最小構成で組む未実行雛形。実環境（MTGバイヤー）は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来。実装のレスポンス形・FW既定値・DTO制約を期待値に流用しない）:
 *  - 送信先は ec-cube-enterprise 実装の実効パス（接頭辞 %eccube_api_v1_route% 既定 `api/v1`／security.yaml firewall app pattern `^/api/v1/`）。
 *    由来（file:line＝../ec-cube-enterprise）:
 *      POST   /api/v1/admin/login.json                          LoginController.php:45
 *      GET    /api/v1/admin/buyOrders.json                      BuyOrderController.php:59（査定対象＝商品到着のネット買取一覧）
 *      PUT    /api/v1/admin/buyOrder/{id}.json                  BuyOrderController.php:170（査定結果確定＝メインカード/個別入力の作り直し・合計金額再計算）
 *      PUT    /api/v1/admin/buyOrder/{id}/status.json           BuyOrderController.php:126（ステータス更新＋変更履歴）
 *      PUT    /api/v1/admin/buyOrder/{id}/freeComment.json      BuyOrderController.php:93（フリーコメント/メモ保存）
 *      POST   /api/v1/admin/buyMainCard.json                    BuyMainCardController.php:37（正本mdは「登録」だが実装は getByBuyOrderIds＝取得。付帯表4-2）
 *      POST   /api/v1/admin/buyOrderIndivisualInputProduct.json BuyOrderIndivisualInputProductController.php:37（同上＝取得。付帯表4-2）
 *    ※正本md「利用者視点の入口」は `/admin/...`（`/api/v1` 欠落）で実効パス（`/api/v1` 付き）と不一致（付帯表4-1）。テストは実効パスへ送信し差異を付帯表で管理する。
 *  - 認証は firewall `app`（access_token・JwtTokenHandler／JwtTokenHeaderExtractor＝security.yaml:33-39）。ヘッダ名 `jwt-token`。欠落/該当会員なし/署名不正＝401（正本md 権限・認可 L186-193／エラー処理 L205-210）。
 *  - 対象受注なし＝該当なし（正本md 処理フロー「対象受注が存在しなければ該当なし」L91／エラー処理 L207）＝404 相当で判定。
 *  - 入力検証エラー＝エラー応答・DB更新しない（正本md 処理フロー L94／エラー処理 L208）＝400 相当で判定。400/422差は付帯表4-3。
 *  - 買取合計金額はサーバ側再計算（正本md 業務ルール L112）／明細全置換（データ整合性 L122）。画面を持たないため一次オラクル＝API応答、DB副作用はDB照合で補完（本リポでDBは実行しない）。
 *  - jwt-token 原値・SEED ID は env 供給・原値非コミット。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル/--list 確認のみ）。環境ガード O01_02_READY。
 */

export const API_V1_PREFIX = "/api/v1";
export const JWT_HEADER_NAME = "jwt-token";

export const PATH = {
  /** POST 管理ログイン。LoginController.php:45 */
  LOGIN: `${API_V1_PREFIX}/admin/login.json`,
  /** GET 査定対象のネット買取受注一覧。BuyOrderController.php:59 */
  LIST: `${API_V1_PREFIX}/admin/buyOrders.json`,
  /** POST メインカード（実装は getByBuyOrderIds＝取得。付帯表4-2）。BuyMainCardController.php:37 */
  MAIN_CARD: `${API_V1_PREFIX}/admin/buyMainCard.json`,
  /** POST 個別入力商品（実装は getByBuyOrderIds＝取得。付帯表4-2）。BuyOrderIndivisualInputProductController.php:37 */
  INDIVISUAL_INPUT: `${API_V1_PREFIX}/admin/buyOrderIndivisualInputProduct.json`,
} as const;

/** PUT 査定結果確定（詳細更新）。BuyOrderController.php:170 */
export function updatePath(orderId: string | number): string {
  return `${API_V1_PREFIX}/admin/buyOrder/${orderId}.json`;
}
/** PUT ステータス更新。BuyOrderController.php:126 */
export function statusPath(orderId: string | number): string {
  return `${API_V1_PREFIX}/admin/buyOrder/${orderId}/status.json`;
}
/** PUT フリーコメント更新。BuyOrderController.php:93 */
export function freeCommentPath(orderId: string | number): string {
  return `${API_V1_PREFIX}/admin/buyOrder/${orderId}/freeComment.json`;
}

// ===== JWT（env 供給・原値非コミット。既定は要実機確認の暫定合成値） =====
export const ADMIN_JWT = process.env.O01_02_JWT_ADMIN || "";
export const JWT_BAD_SIGNATURE =
  process.env.O01_02_JWT_BAD_SIGNATURE ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.invalid-signature-not-hs256";
export const JWT_NO_MEMBER =
  process.env.O01_02_JWT_NO_MEMBER ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTk5OTk5OSJ9.no-matching-member-signature";

export function jwtHeaders(token: string | undefined = ADMIN_JWT): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token !== undefined && token !== "") headers[JWT_HEADER_NAME] = token;
  return headers;
}
export function noAuthHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

// ===== SEED 受注ID・ステータス・商品規格（env 供給・既定は要実機確認の暫定） =====
export const ORDER_ID = {
  /** 更新対象の既知ネット買取受注（既存明細あり・更新前ステータス既知）。 */
  TARGET: process.env.O01_02_ORDER_ID || "2001",
  /** 存在しない受注ID（該当なし＝404）。 */
  NONEXISTENT: process.env.O01_02_ORDER_NONEXISTENT_ID || "99999999",
} as const;

/** ネット買取ステータス（値の定義は ec-cube-enterprise Master\MtbBuyOrderStatus を正とする）。要実機確認。 */
export const STATUS = {
  ASSESSED: Number(process.env.O01_02_STATUS_ASSESSED || 1), // 査定確定相当
  CANCEL: Number(process.env.O01_02_STATUS_CANCEL || 2),
  NOT_IN_MASTER: Number(process.env.O01_02_STATUS_NOT_IN_MASTER || 99999),
} as const;

export const KNOWN_PRODUCT_CLASS_ID = Number(process.env.O01_02_PRODUCT_CLASS_ID || 5001);

// ===== ペイロード（正本md DBカラム記載フィールドのみで最小構成） =====

/** メインカード明細1件（dtb_buy_main_card: 商品ID(規格)/数量/価格/言語ID/カード状態ID/Foil/買取区分＝正本md L159）。 */
export interface MainCardOptions {
  productClassId?: number | string | null;
  quantity?: number | string;
  price?: number | string;
  languageId?: number;
  cardStateId?: number;
  foilFlg?: boolean;
  buyType?: number;
}
export function buildMainCard(opts: MainCardOptions = {}): Record<string, unknown> {
  const c: Record<string, unknown> = {};
  c.product_class_id = "productClassId" in opts ? opts.productClassId : KNOWN_PRODUCT_CLASS_ID;
  c.quantity = "quantity" in opts ? opts.quantity : 1;
  c.price = "price" in opts ? opts.price : 1000;
  c.language_id = "languageId" in opts ? opts.languageId : 1;
  c.card_state_id = "cardStateId" in opts ? opts.cardStateId : 1;
  c.foil_flg = "foilFlg" in opts ? opts.foilFlg : false;
  c.buy_type = "buyType" in opts ? opts.buyType : 1;
  return c;
}

/** 個別入力商品1件（dtb_buy_order_indivisual_input_product: 商品名/数量/価格＝正本md L160）。 */
export function buildIndividualInput(name = "個別入力商品", quantity: number | string = 1, price: number | string = 500): Record<string, unknown> {
  return { name, quantity, price };
}

export interface UpdateOptions {
  orderStatus?: number | string | null;
  mainCards?: Record<string, unknown>[] | null;
  individualInputs?: Record<string, unknown>[];
}

/** 正常な査定結果確定ボディ（order_status＝査定確定・メインカード明細1件）。 */
export function buildValidPayload(opts: UpdateOptions = {}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  body.order_status = "orderStatus" in opts ? opts.orderStatus : STATUS.ASSESSED;
  body.main_cards = "mainCards" in opts ? opts.mainCards : [buildMainCard()];
  if ("individualInputs" in opts) body.individual_input_products = opts.individualInputs;
  return body;
}

/** マスタ非存在ステータス（入力不正）。 */
export function buildUnknownStatusPayload(): Record<string, unknown> {
  return { order_status: STATUS.NOT_IN_MASTER, main_cards: [buildMainCard()] };
}

/** 明細空（検証エラー＝DB更新しない）。 */
export function buildEmptyDetailsPayload(): Record<string, unknown> {
  return { order_status: STATUS.ASSESSED, main_cards: [] };
}

/** 単価×数量が明細から算出される買取合計金額の再計算観測用（サーバ側再計算＝正本md 業務ルール L112）。 */
export function buildRecalcTotalPayload(): Record<string, unknown> {
  return {
    order_status: STATUS.ASSESSED,
    main_cards: [buildMainCard({ price: 1200, quantity: 2 })], // 合計 2400 をサーバ側再計算で保存する想定
  };
}

/** ステータス更新ボディ。 */
export function buildStatusPayload(status: number = STATUS.ASSESSED): Record<string, unknown> {
  return { order_status: status };
}

/** フリーコメント（メモ）更新ボディ。 */
export function buildFreeCommentPayload(value = "査定メモ"): Record<string, unknown> {
  return { free_comment: value };
}

/** メインカード/個別入力の取得（実装 getByBuyOrderIds＝POST に buyOrderIds を送る。付帯表4-2）。 */
export function buildByOrderIdsPayload(ids: (number | string)[] = [ORDER_ID.TARGET]): Record<string, unknown> {
  return { buy_order_ids: ids };
}

export const SPEC_MESSAGE = {
  /** 明細1件以上の趣旨（正本md バリデーション L180）。安定部分で照合。 */
  DETAILS_REQUIRED: "商品",
} as const;
