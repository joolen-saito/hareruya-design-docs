/**
 * a06-03 店頭仕入_店頭買取注文更新（買取アプリ=MTGバイヤー向けに店頭買取受注の詳細をPUT更新するJSON API）API/統合レイヤ用 パス／ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a06_03_api_store_purchase_otc_buy_order_update_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a06-03) 入出力記載のリクエスト仕様（jwt-token ヘッダ付き PUT）のみを最小構成で組む未実行雛形。実環境（買取アプリ＝MTGバイヤー）は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス形・FW既定値・DTO制約を期待値に流用しない）:
 *  - 送信先は実装の実効パス `PUT /api/v1/admin/otcBuyOrder/{id}.json`（付帯表1/付帯表4#1）。
 *    由来: `#[Route('/%eccube_api_v1_route%/admin/otcBuyOrder/{id}.json', name: 'api_admin_otc_buy_order_update', methods: ['PUT'])]`（OtcBuyOrderController.php:129）
 *          ＋ `eccube_api_v1_route` 既定値 `api/v1`（app/config/eccube/packages/eccube.yaml:6,55）＝実効パス。正本md `PUT /admin/otcBuyOrder/{id}.json` は `/api/v1` を欠き不一致（付帯表4#1）。
 *  - 認証は firewall `app`（pattern `^/api/v1/`）の access_token（token_handler JwtTokenHandler／extractor JwtTokenHeaderExtractor＝security.yaml:33-39）。
 *    ヘッダ名は `jwt-token`（JwtTokenHeaderExtractor.php:29）。未認証・該当会員なし・署名不正は 401（UnauthenticatedException＝OtcBuyOrderController.php:137-140。HS256署名検証の実方式は要実機確認）。
 *  - 対象受注なしは 404（NotFoundException＝OtcBuyOrderController.php:132-135）。
 *  - 入力検証は `#[MapRequestPayload] UpdateOtcBuyOrderDto`（OtcBuyOrderController.php:130／UpdateOtcBuyOrderDto.php／UpdateOtcBuyOrderDetailDto.php）。更新本体は UpdateOtcBuyOrderAction（OtcBuyOrderController.php:143）。
 *  - 合否（成功）は HTTPステータス200＋応答 `{code:200}`、（失敗）は 400＋`{code,errors}` を仕様（正本md）由来で判定する（spec側）。
 *    検証失敗時のHTTPステータスは正本mdの 400 を期待する。実装は `#[MapRequestPayload]` 既定で 422 を返す可能性（付帯表4#2）→ 仕様どおり期待し違えば落として検出する（実装へ寄せない）。
 *  - 検証メッセージは正本md文言を期待値とする（末尾句点「。」やマスタ非存在文言は実装と乖離＝付帯表4#4/#5/#6）。実装文言へ固定しない。
 *  - 本APIはブラウザ向け画面を持たない（正本md）。更新副作用は永続化先テーブル（dtb_otc_buy_order 等）を直接DB照合（DB副作用観測）して判定する想定で、spec側はAPI応答を一次に置きDB照査で補完する（本リポでDBは実行しない）。
 *  - jwt-token原値・署名シークレットは env で供給し原値はコミットしない（付帯表3）。SEED受注ID・ステータスID・部門ID・商品規格IDも env 供給（要実機確認の暫定値）。
 *    正本md未記載の入力項目 `smaregi_transaction_id`（DTO 実装にあり＝付帯表4#7）は期待値・送信に含めない。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A06_03_READY。
 */

/** API実効パス接頭辞。由来: eccube.yaml:6,55（%eccube_api_v1_route% 既定値 `api/v1`）。 */
export const API_V1_PREFIX = "/api/v1";

/**
 * 店頭買取受注更新エンドポイント実効パスを組む（受注ID {id} を埋める）。
 * 由来: OtcBuyOrderController.php:129（Route）＋ eccube.yaml:6,55 ＝実効 `PUT /api/v1/admin/otcBuyOrder/{id}.json`。
 * 正本md `PUT /admin/otcBuyOrder/{id}.json`（接頭辞 `/api/v1` なし）とは不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理する。
 */
export function buildUpdatePath(orderId: string | number): string {
  return `${API_V1_PREFIX}/admin/otcBuyOrder/${orderId}.json`;
}

/** 認証ヘッダ名。由来: JwtTokenHeaderExtractor.php:29（HEADER_NAME `jwt-token`）。 */
export const JWT_HEADER_NAME = "jwt-token";

// ===== JWT（env 供給・原値非コミット。既定値は要実機確認の暫定） =====

/**
 * 有効JWT（SEED-A06-03-JWT-ADMIN／査定担当者の管理者会員）。a06-01 管理ログインの jwtToken を流用想定。HS256・有効署名・該当会員の利用者IDを含む。
 * 要実機確認: テスト環境固定の有効トークンへ差し替える。
 */
export const ADMIN_JWT = process.env.A06_03_JWT_ADMIN || "";

/** 署名不正トークン（SEED-A06-03-JWT-ADMIN 派生／署名改ざん。E2E-A06-03-023）。署名シークレットを持たずに合成。実装は token_handler 検証で401を返すことを期待。 */
export const JWT_BAD_SIGNATURE =
  process.env.A06_03_JWT_BAD_SIGNATURE ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.invalid-signature-not-hs256";

/**
 * 署名は正しいが該当管理者会員が存在しない利用者IDのトークン（SEED-A06-03-JWT-ADMIN 派生／E2E-A06-03-022）。
 * 正しい署名には実機シークレットが要るため env 供給（要実機確認）。未設定時は合成値（署名不正として401となる）でフォールバック。
 */
export const JWT_NO_MEMBER =
  process.env.A06_03_JWT_NO_MEMBER ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTk5OTk5OSJ9.no-matching-member-signature";

/** jwt-token ヘッダ＋Content-Type を組む。token 未指定（undefined）なら jwt-token ヘッダを付けない（欠落系021）。token 省略時は ADMIN_JWT。 */
export function buildJwtHeaders(token: string | undefined = ADMIN_JWT): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token !== undefined && token !== "") headers[JWT_HEADER_NAME] = token;
  return headers;
}

/** jwt-token を一切付与しないヘッダ（E2E-A06-03-021 欠落）。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

// ===== SEED 受注ID・ステータス・部門・商品規格（env 供給・既定は要実機確認の暫定） =====

/**
 * SEED受注ID（付帯表3 SEED-A06-03-ORDER）。env 供給・既定値は要実機確認のプレースホルダ。HAS_API(A06_03_READY) ガード下でのみ送信される。
 *  - TARGET:      更新対象の既知受注（既存明細・在庫・履歴あり・更新前ステータス既知）。
 *  - OTHER:       区分整合用の別受注（050 で不変を確認）。
 *  - NONEXISTENT: 存在しない受注ID（030）。
 */
export const ORDER_ID = {
  TARGET: process.env.A06_03_ORDER_ID || "1001", // 要実機確認: SEED-A06-03-ORDER（対象受注）
  OTHER: process.env.A06_03_ORDER_OTHER_ID || "1002", // 要実機確認: SEED-A06-03-ORDER（別受注／区分整合050）
  NONEXISTENT: process.env.A06_03_ORDER_NONEXISTENT_ID || "99999999", // 存在しない受注ID（030）
} as const;

/**
 * 店頭買取ステータス（正本md：成立(1)・キャンセル(2)等）。SEED-A06-03-STATUS-MTB。
 * 実装の許容集合は {成立1,キャンセル2} の2値に限定（UpdateOtcBuyOrderDto.php:35／付帯表4#3）が、テストは正本mdの意味（成立／成立以外）で判定する。
 *  - NOT_IN_MASTER: 店頭買取ステータスマスタに存在しないID（101／要実機確認: 環境のマスタ範囲外IDへ差し替え）。
 */
export const STATUS = {
  COMPLETE: 1, // 成立
  CANCEL: 2, // キャンセル
  NOT_IN_MASTER: Number(process.env.A06_03_STATUS_NOT_IN_MASTER || 99999), // マスタ非存在ID（101）
} as const;

/** 既知の商品規格ID（SEED-A06-03-SECTION／product_class）。在庫集計（123）に使用。要実機確認: 環境の投入値へ差し替え。 */
export const KNOWN_PRODUCT_CLASS_ID = Number(process.env.A06_03_PRODUCT_CLASS_ID || 5001);

/** 既知の部門ID（SEED-A06-03-SECTION／mtb_section）。明細の部門設定（123）に使用。要実機確認。 */
export const KNOWN_SECTION_ID = Number(process.env.A06_03_SECTION_ID || 3001);

/** 該当部門が存在しない section_id（131／部門未設定分岐）。要実機確認: 環境に存在しない整数へ差し替え。 */
export const NONEXISTENT_SECTION_ID = Number(process.env.A06_03_SECTION_NONEXISTENT_ID || 88888);

// ===== ペイロード（正本md 入出力節 記載フィールドのみで最小構成） =====

/** 商品規格IDなし（空）の表現（個別入力商品＝125・正本md）。 */
export const EMPTY_PRODUCT_CLASS_ID = null;

/** 非整数値（整数形式バリデーション 106-110・046 用）。JSON 上の非整数文字列で送る。 */
export const NON_INTEGER_VALUE = "abc";

/** 明細1件のオプション（正本md 入出力: product_class_id/name/quantity/price/sell_price/section_id）。 */
export interface OrderDetailOptions {
  productClassId?: number | string | null;
  name?: string | null;
  quantity?: number | string;
  price?: number | string;
  sellPrice?: number | string;
  sectionId?: number | string | null;
}

/** 受注更新ボディのオプション（正本md: order_status・order_details[]・qualified_invoice_issuer_confirmation_flg）。 */
export interface UpdatePayloadOptions {
  orderStatus?: number | string | null;
  details?: OrderDetailOptions[] | null;
  qualifiedInvoiceIssuerConfirmationFlg?: boolean;
}

/** 明細1件を組む（正本md 記載フィールドのみ）。未指定キーは送らない（任意未指定の検証＝111 用に省略可能にする）。 */
export function buildDetail(opts: OrderDetailOptions = {}): Record<string, unknown> {
  const detail: Record<string, unknown> = {};
  if ("productClassId" in opts) detail.product_class_id = opts.productClassId;
  else detail.product_class_id = KNOWN_PRODUCT_CLASS_ID;
  detail.name = "name" in opts ? opts.name : "テスト商品";
  if ("quantity" in opts) detail.quantity = opts.quantity;
  else detail.quantity = 1;
  if ("price" in opts) detail.price = opts.price;
  else detail.price = 1000;
  if ("sellPrice" in opts) detail.sell_price = opts.sellPrice;
  else detail.sell_price = 1500;
  if ("sectionId" in opts) detail.section_id = opts.sectionId;
  else detail.section_id = KNOWN_SECTION_ID;
  return detail;
}

/** 任意項目（quantity/price/sell_price/section_id）を省いた明細（111 任意未指定用。name は残す）。 */
export function buildDetailOptionalOmitted(): Record<string, unknown> {
  return { product_class_id: KNOWN_PRODUCT_CLASS_ID, name: "テスト商品" };
}

/** 正常更新ボディ（order_status=成立・正常明細1件）。overrides で各種異常・境界へ振る。 */
export function buildValidPayload(opts: UpdatePayloadOptions = {}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  body.order_status = "orderStatus" in opts ? opts.orderStatus : STATUS.COMPLETE;
  if ("details" in opts) body.order_details = opts.details;
  else body.order_details = [buildDetail()];
  if ("qualifiedInvoiceIssuerConfirmationFlg" in opts) {
    body.qualified_invoice_issuer_confirmation_flg = opts.qualifiedInvoiceIssuerConfirmationFlg;
  }
  return body;
}

/** order_status 未指定ボディ（040/044/100）。 */
export function buildMissingStatusPayload(): Record<string, unknown> {
  return { order_details: [buildDetail()] };
}

/** マスタ非存在 order_status ボディ（042/101）。 */
export function buildUnknownStatusPayload(): Record<string, unknown> {
  return { order_status: STATUS.NOT_IN_MASTER, order_details: [buildDetail()] };
}

/** order_details 空ボディ（045/102）。 */
export function buildEmptyDetailsPayload(): Record<string, unknown> {
  return { order_status: STATUS.COMPLETE, order_details: [] };
}

/** 明細の商品名未入力ボディ（103）。 */
export function buildMissingNamePayload(): Record<string, unknown> {
  return { order_status: STATUS.COMPLETE, order_details: [buildDetail({ name: "" })] };
}

/** 指定長の商品名を持つ明細ボディ（104=65535境界内／105=65536境界外）。 */
export function buildNamedLengthPayload(length: number): Record<string, unknown> {
  return { order_status: STATUS.COMPLETE, order_details: [buildDetail({ name: "あ".repeat(length) })] };
}

/** 商品名最大長（65535文字＝境界内・104）。 */
export const NAME_MAX_LENGTH = 65535;
/** 商品名最大長+1（65536文字＝境界外・105）。 */
export const NAME_OVER_MAX_LENGTH = 65536;

/** 明細の指定項目を非整数にしたボディ（046/106-110）。field は OrderDetailOptions のキー。 */
export function buildNonIntegerDetailPayload(field: keyof OrderDetailOptions): Record<string, unknown> {
  return { order_status: STATUS.COMPLETE, order_details: [buildDetail({ [field]: NON_INTEGER_VALUE })] };
}

/** 複数の検証エラーを同時に含むボディ（041：ステータス未指定＋明細の複数項目が非整数）。 */
export function buildMultipleErrorsPayload(): Record<string, unknown> {
  return {
    order_details: [
      buildDetail({ quantity: NON_INTEGER_VALUE, price: NON_INTEGER_VALUE, sellPrice: NON_INTEGER_VALUE }),
    ],
  };
}

/** 汎用の異常ボディ（043：検証に失敗する／ステータス未指定かつ明細空）。 */
export function buildInvalidPayload(): Record<string, unknown> {
  return { order_details: [] };
}

/** 任意項目（quantity/price/sell_price/section_id/qualified_invoice_issuer_confirmation_flg）を未指定にした正常ボディ（111）。 */
export function buildOptionalOmittedPayload(): Record<string, unknown> {
  return { order_status: STATUS.COMPLETE, order_details: [buildDetailOptionalOmitted()] };
}

/** 単価×数量の合計が10円単位でない明細ボディ（121：買取合計金額の10円切上げ観測用）。 */
export function buildNonRoundedTotalPayload(): Record<string, unknown> {
  // price=333 × quantity=1 = 333 → 10円単位切上げで 340 を期待（DB副作用で判定）。
  return { order_status: STATUS.COMPLETE, order_details: [buildDetail({ price: 333, quantity: 1 })] };
}

/** 既存明細と異なる明細で全置換するボディ（122：送信外の旧明細が残らないこと観測用）。 */
export function buildReplacedDetailsPayload(): Record<string, unknown> {
  return {
    order_status: STATUS.COMPLETE,
    order_details: [buildDetail({ name: "置換後商品", quantity: 2, price: 2000, sellPrice: 3000 })],
  };
}

/** 同一商品規格を複数含む明細ボディ（123：商品規格別の数量集計で在庫が作り直されること観測用）。 */
export function buildDuplicateProductClassPayload(): Record<string, unknown> {
  return {
    order_status: STATUS.COMPLETE,
    order_details: [
      buildDetail({ productClassId: KNOWN_PRODUCT_CLASS_ID, quantity: 2 }),
      buildDetail({ productClassId: KNOWN_PRODUCT_CLASS_ID, quantity: 3 }),
    ],
  };
}

/** 商品規格IDが空（個別入力商品）の明細を含むボディ（125）。 */
export function buildIndividualInputPayload(): Record<string, unknown> {
  return {
    order_status: STATUS.COMPLETE,
    order_details: [buildDetail({ productClassId: EMPTY_PRODUCT_CLASS_ID, name: "個別入力商品" })],
  };
}

/** 該当部門が存在しない section_id を指定した明細ボディ（131：部門未設定分岐・更新自体は成功）。 */
export function buildNonexistentSectionPayload(): Record<string, unknown> {
  return { order_status: STATUS.COMPLETE, order_details: [buildDetail({ sectionId: NONEXISTENT_SECTION_ID })] };
}

// ===== 正本md由来のエラーメッセージ文言（オラクル）。実装文言の乖離は付帯表4で記録（テストは正本md文言で照合し違えば落として検出） =====

/**
 * 正本md（バリデーション節）の検証メッセージ。
 *  - STATUS_REQUIRED: ステータス必須（末尾句点あり。実装は句点なし＝付帯表4#4）。
 *  - DETAILS_REQUIRED: 明細必須（末尾句点あり。実装は句点なし＝付帯表4#4）。
 *  - NAME_MAX_LENGTH: 商品名最大長超過（実装は「文字以下で入力してください。」表記＝付帯表4#6）。
 *  - INTEGER_*: 各項目の整数形式メッセージ。
 *  - statusNotInMaster(id): マスタ非存在（実装は Choice の `order_status is invalid`＝付帯表4#5）。
 */
export const SPEC_MESSAGE = {
  STATUS_REQUIRED: "ステータスを選択してください。",
  DETAILS_REQUIRED: "1つ以上の商品を選んでください。",
  NAME_MAX_LENGTH: "商品名は、 65535 以下で入力してください。",
  INTEGER_PRODUCT_CLASS_ID: "商品規格IDは、整数で入力してください。",
  INTEGER_QUANTITY: "数量は、整数で入力してください。",
  INTEGER_PRICE: "単価は、整数で入力してください。",
  INTEGER_SELL_PRICE: "販売価格は、整数で入力してください。",
  INTEGER_SECTION_ID: "部門IDは、整数で入力してください。",
  /** 商品名必須（正本md。安定部分で照合）。 */
  NAME_REQUIRED_STABLE: "商品名",
} as const;

/** マスタ非存在メッセージ（101）。指定IDを埋める。 */
export function statusNotInMasterMessage(id: number = STATUS.NOT_IN_MASTER): string {
  return `MtbOtcBuyOrderStatusに${id}が見つかりません。`;
}
