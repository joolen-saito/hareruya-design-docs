/**
 * o01-01 その他_MTGバイヤー_店頭買取（MTGバイヤーが店頭買取査定で叩くEC-CUBE側 admin JSON API 群）
 * API/統合レイヤ用 パス／ヘッダ／ペイロード ヘルパ。
 *
 * area 判定: **api**（画面を伴わない）。MTGバイヤー本体は本リポジトリ外の外部アプリで画面・UIは仕様確定せず、
 *   EC-CUBE側で観測できる入口は `App/MTGBuyer/V1/Admin/` の JSON API（正本md「利用者視点の入口」L65-75／「フロント挙動」L79-87
 *   ＝MTGバイヤー本体の表示要素はリポジトリ外）。よって front/admin 画面specは無く、request ベースの API/統合レイヤで扱う。
 *
 * ケース表 integration_test/e2e/o01_01_other_mtg_buyer_mtg_buyer_store_purchase_e2e_cases.md（付帯表1 E2E可否／付帯表3 SEED／付帯表4 要確認）に対応。
 * 本ファイルは正本md(o01-01) 利用者視点の入口・入力項目・処理フロー・業務ルールのリクエスト仕様のみを最小構成で組む未実行雛形。実環境（MTGバイヤー）は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来。実装のレスポンス形・FW既定値・DTO制約を期待値に流用しない）:
 *  - 送信先は ec-cube-enterprise 実装の実効パス（接頭辞 %eccube_api_v1_route% 既定 `api/v1`／security.yaml firewall app pattern `^/api/v1/`）。
 *    由来（file:line は sibling ../ec-cube-enterprise）:
 *      POST   /api/v1/admin/login.json                         LoginController.php:45
 *      GET    /api/v1/admin/otcBuyOrders.json                  OtcBuyOrderController.php:69（査定対象＝未完了の受注一覧）
 *      PUT    /api/v1/admin/otcBuyOrder/{id}.json              OtcBuyOrderController.php:129（査定結果確定＝明細/在庫/履歴の作り直し）
 *      PUT    /api/v1/admin/otcBuyOrder/{id}/status.json       OtcBuyOrderController.php:190（ステータス更新＋変更履歴）
 *      PUT    /api/v1/admin/otcBuyOrder/{id}/freeComment.json  OtcBuyOrderController.php:156（フリーコメント保存）
 *      PUT    /api/v1/admin/otcBuyOrder/{id}/identification.json OtcBuyOrderController.php:273（本人確認状態更新）
 *    ※正本md「利用者視点の入口」は `PUT /admin/otcBuyOrder/{id}/free_comment.json` 等（`/api/v1` 欠落・snake_case `free_comment`）で
 *      実装の実効パス（`/api/v1` 付き・camelCase `freeComment`）と不一致（付帯表4）。テストは実効パスへ送信し差異を付帯表で管理する。
 *  - 認証は firewall `app`（access_token・JwtTokenHandler／JwtTokenHeaderExtractor＝security.yaml:33-39）。ヘッダ名 `jwt-token`。
 *    欠落/該当会員なし/署名不正＝401（正本md 権限・認可 L238-245／エラー処理「認証不可」L263）。
 *  - 対象受注なし＝404（正本md エッジケース「受注IDが存在しない＝該当なし」L159／エラー処理 L265）。
 *  - 入力不正（ステータスマスタ非存在・明細空等）＝400（正本md バリデーション L226-234／エラー処理 L266-267）。
 *    ※検証失敗時HTTPコードの 400/422 差異（実装 #[MapRequestPayload] 既定）や検証メッセージ文言は正本md由来で判定し、乖離は付帯表4に出す（実装へ寄せない）。
 *  - 更新副作用（明細/在庫/在庫履歴の作り直し・買取合計金額の10円切上げ・ステータス変更履歴）はブラウザ画面を持たないため、
 *    一次オラクル＝API応答、DB副作用は永続化先テーブル（dtb_otc_buy_order 等）を直接DB照合して補完する（本リポでDBは実行しない）。
 *  - jwt-token 原値・SEED ID は env 供給・原値非コミット（正本md ログ・監査「ログに出してはいけないもの」L287-294）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル/--list 確認のみ）。環境ガード O01_01_READY。
 */

/** API実効パス接頭辞。由来: eccube.yaml %eccube_api_v1_route% 既定 `api/v1`／security.yaml firewall app pattern `^/api/v1/`。 */
export const API_V1_PREFIX = "/api/v1";

/** 認証ヘッダ名。由来: JwtTokenHeaderExtractor（security.yaml:39）。原値は env 供給。 */
export const JWT_HEADER_NAME = "jwt-token";

// ===== エンドポイント（実効パス。file:line は ../ec-cube-enterprise） =====
export const PATH = {
  /** POST 管理ログイン（認証トークン取得）。LoginController.php:45 */
  LOGIN: `${API_V1_PREFIX}/admin/login.json`,
  /** GET 査定対象の店頭買取受注一覧（未完了）。OtcBuyOrderController.php:69 */
  LIST: `${API_V1_PREFIX}/admin/otcBuyOrders.json`,
} as const;

/** PUT 査定結果確定（詳細更新）。OtcBuyOrderController.php:129 */
export function updatePath(orderId: string | number): string {
  return `${API_V1_PREFIX}/admin/otcBuyOrder/${orderId}.json`;
}
/** PUT ステータス更新。OtcBuyOrderController.php:190 */
export function statusPath(orderId: string | number): string {
  return `${API_V1_PREFIX}/admin/otcBuyOrder/${orderId}/status.json`;
}
/** PUT フリーコメント更新。OtcBuyOrderController.php:156（実効 camelCase freeComment／正本md free_comment とは付帯表4で差異） */
export function freeCommentPath(orderId: string | number): string {
  return `${API_V1_PREFIX}/admin/otcBuyOrder/${orderId}/freeComment.json`;
}
/** PUT 本人確認状態更新。OtcBuyOrderController.php:273 */
export function identificationPath(orderId: string | number): string {
  return `${API_V1_PREFIX}/admin/otcBuyOrder/${orderId}/identification.json`;
}

// ===== JWT（env 供給・原値非コミット。既定は要実機確認の暫定合成値） =====

/** 有効JWT（SEED-O01-01-JWT-ADMIN／査定担当者の管理者会員。a06-01 管理ログインの token を流用想定）。要実機確認: 環境固定の有効トークンへ差し替え。 */
export const ADMIN_JWT = process.env.O01_01_JWT_ADMIN || "";

/** 店舗に紐づく管理者会員のJWT（SEED-O01-01-JWT-STORE／店舗絞り込み確認用）。要実機確認。 */
export const STORE_JWT = process.env.O01_01_JWT_STORE || "";

/** 署名不正トークン（E2E-O01-01 認証拒否）。署名シークレットを持たず合成。実装は token_handler 検証で401を返すことを期待。 */
export const JWT_BAD_SIGNATURE =
  process.env.O01_01_JWT_BAD_SIGNATURE ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.invalid-signature-not-hs256";

/** 署名は正しいが該当管理者会員が存在しない利用者IDのトークン。要実機確認（正しい署名は実機シークレットが要る）。未設定時は合成値でフォールバック。 */
export const JWT_NO_MEMBER =
  process.env.O01_01_JWT_NO_MEMBER ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTk5OTk5OSJ9.no-matching-member-signature";

/** jwt-token ＋ Content-Type を組む。token=undefined/"" なら jwt-token を付けない（欠落系）。省略時は ADMIN_JWT。 */
export function jwtHeaders(token: string | undefined = ADMIN_JWT): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token !== undefined && token !== "") headers[JWT_HEADER_NAME] = token;
  return headers;
}

/** jwt-token を一切付与しないヘッダ（欠落＝401）。 */
export function noAuthHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

// ===== SEED 受注ID・ステータス・部門・商品規格（env 供給・既定は要実機確認の暫定） =====

export const ORDER_ID = {
  /** 更新対象の既知受注（既存明細/在庫/履歴あり・更新前ステータス既知）。 */
  TARGET: process.env.O01_01_ORDER_ID || "1001",
  /** 存在しない受注ID（404）。 */
  NONEXISTENT: process.env.O01_01_ORDER_NONEXISTENT_ID || "99999999",
} as const;

/** 店頭買取ステータス（正本md：成立/キャンセル等）。SEED-O01-01-STATUS-MTB。 */
export const STATUS = {
  COMPLETE: Number(process.env.O01_01_STATUS_COMPLETE || 1), // 買取成立
  CANCEL: Number(process.env.O01_01_STATUS_CANCEL || 2), // 買取キャンセル
  /** 店頭買取ステータスマスタに存在しないID（入力不正）。要実機確認: 環境のマスタ範囲外IDへ。 */
  NOT_IN_MASTER: Number(process.env.O01_01_STATUS_NOT_IN_MASTER || 99999),
} as const;

/** 既知の商品規格ID（在庫集計・全置換）。要実機確認。 */
export const KNOWN_PRODUCT_CLASS_ID = Number(process.env.O01_01_PRODUCT_CLASS_ID || 5001);
/** 既知の部門ID。要実機確認。 */
export const KNOWN_SECTION_ID = Number(process.env.O01_01_SECTION_ID || 3001);

// ===== ペイロード（正本md 入力項目 記載フィールドのみで最小構成） =====

export interface DetailOptions {
  productClassId?: number | string | null;
  name?: string | null;
  quantity?: number | string;
  price?: number | string;
  sellPrice?: number | string;
  sectionId?: number | string | null;
}

/** 明細1件を組む（正本md 入力項目 L142-152: 商品規格ID/商品名/数量/買取単価/販売価格/部門）。 */
export function buildDetail(opts: DetailOptions = {}): Record<string, unknown> {
  const d: Record<string, unknown> = {};
  d.product_class_id = "productClassId" in opts ? opts.productClassId : KNOWN_PRODUCT_CLASS_ID;
  d.name = "name" in opts ? opts.name : "テスト商品";
  d.quantity = "quantity" in opts ? opts.quantity : 1;
  d.price = "price" in opts ? opts.price : 1000;
  d.sell_price = "sellPrice" in opts ? opts.sellPrice : 1500;
  d.section_id = "sectionId" in opts ? opts.sectionId : KNOWN_SECTION_ID;
  return d;
}

export interface UpdateOptions {
  orderStatus?: number | string | null;
  details?: DetailOptions[] | null;
}

/** 正常な査定結果確定ボディ（order_status=成立・正常明細1件）。 */
export function buildValidPayload(opts: UpdateOptions = {}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  body.order_status = "orderStatus" in opts ? opts.orderStatus : STATUS.COMPLETE;
  body.order_details = "details" in opts ? opts.details : [buildDetail()];
  return body;
}

/** ステータスマスタ非存在の order_status（入力不正）。 */
export function buildUnknownStatusPayload(): Record<string, unknown> {
  return { order_status: STATUS.NOT_IN_MASTER, order_details: [buildDetail()] };
}

/** 明細が空（正本md エッジケース「明細が空＝入力不正・既存明細/在庫を削除しない」L160）。 */
export function buildEmptyDetailsPayload(): Record<string, unknown> {
  return { order_status: STATUS.COMPLETE, order_details: [] };
}

/** 同一商品規格を複数含む明細（商品規格別に数量集計して在庫を作り直す＝業務ルール「在庫数量」L138）。 */
export function buildDuplicateProductClassPayload(): Record<string, unknown> {
  return {
    order_status: STATUS.COMPLETE,
    order_details: [
      buildDetail({ productClassId: KNOWN_PRODUCT_CLASS_ID, quantity: 2 }),
      buildDetail({ productClassId: KNOWN_PRODUCT_CLASS_ID, quantity: 3 }),
    ],
  };
}

/** 商品規格IDが空＝個別入力商品（業務ルール「個別入力商品の扱い」L136）。 */
export function buildIndividualInputPayload(): Record<string, unknown> {
  return { order_status: STATUS.COMPLETE, order_details: [buildDetail({ productClassId: null, name: "個別入力商品" })] };
}

/** 買取単価×数量が10円単位でない明細（買取合計金額の10円切上げ観測用＝業務ルール「買取合計金額」L137）。 */
export function buildNonRoundedTotalPayload(): Record<string, unknown> {
  // price=333 × quantity=1 = 333 → 10円単位切上げで 340 を期待（DB副作用で判定）。
  return { order_status: STATUS.COMPLETE, order_details: [buildDetail({ price: 333, quantity: 1 })] };
}

/** ステータス更新ボディ。 */
export function buildStatusPayload(status: number = STATUS.COMPLETE): Record<string, unknown> {
  return { order_status: status };
}

/** フリーコメント更新ボディ。value 未指定は空文字（正本md 入力項目「フリーコメント 任意」L150）。 */
export function buildFreeCommentPayload(value = "査定メモ"): Record<string, unknown> {
  return { free_comment: value };
}

/** 本人確認状態更新ボディ（正本md 入力項目「本人確認情報 任意」L151。項目詳細はA06系委譲＝最小構成）。 */
export function buildIdentificationPayload(): Record<string, unknown> {
  return { identification_status: 1 };
}

// ===== 正本md由来の検証メッセージ（オラクル。実装文言の乖離は付帯表4／テストは仕様文言で照合し違えば落として検出） =====
export const SPEC_MESSAGE = {
  /** ステータス不正＝入力不正（正本md バリデーション「ステータス…存在しない場合は入力不正」L232）。安定部分で照合。 */
  STATUS_INVALID: "ステータス",
  /** 明細1件以上（正本md バリデーション「査定明細 1件以上であること」L233）。安定部分で照合。 */
  DETAILS_REQUIRED: "商品",
} as const;
