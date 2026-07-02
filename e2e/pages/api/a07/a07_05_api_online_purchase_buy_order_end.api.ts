/**
 * a07-05 オンライン仕入_買取注文完了（買取アプリ=MTGバイヤーが、ネット買取受注の査定を終え、明細とステータスを確定する更新系JSON API）API/統合レイヤ用 パス／ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a07_05_api_online_purchase_buy_order_end_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a07-05) 入出力記載のリクエスト仕様（jwt-token ヘッダ付き PUT・id/order_status/order_details[]）のみを最小構成で組む未実行雛形。実環境（買取アプリ＝MTGバイヤー）は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス形・FW既定値・DTO制約を期待値に流用しない）:
 *  - 送信先は実装の実効パス `PUT /api/v1/admin/buyOrder/{id}.json`（付帯表1/付帯表4#1）。
 *    由来: `#[Route('/%eccube_api_v1_route%/admin/buyOrder/{id}.json', name: 'api_admin_buy_order_update', methods: ['PUT'])]`（BuyOrderController.php:170）
 *          ＋ `eccube_api_v1_route` 既定値 `api/v1`（app/config/eccube/packages/eccube.yaml:6,55）＝実効パス。正本md `PUT /admin/buyOrder/{id}.json` は `/api/v1` を欠き不一致（付帯表4#1）。
 *  - 認証は firewall（pattern `^/api/v1/`）の access_token（token_handler JwtTokenHandler／extractor JwtTokenHeaderExtractor＝security.yaml:33-39）＋HS256シークレット（jwt.yaml:3,5）＋クラス `#[IsGranted('IS_AUTHENTICATED_FULLY')]`（BuyOrderController.php:44）。
 *    ヘッダ名は `jwt-token`（JwtTokenHeaderExtractor.php:29）。未認証・該当管理者会員なし・署名不正は 401。HS256署名検証・JWT発行・会員紐づけの実方式は要実機確認（付帯表1 010/011/012）。
 *  - 対象受注なしは 404（受注取得＝BuyOrderController.php:170-186・処理フロー#2）。
 *  - 入力検証は DTO（UpdateBuyOrderDto.php:29,30,34,35／UpdateBuyOrderDetailDto.php:26,30,35,39,58）＋マスタ存在判定（BuyOrderController.php:183-186）。更新本体は UpdateBuyOrderAction::handle（UpdateBuyOrderAction.php:55-121：トランザクション開始:57・合計額10円切上げ roundUpPrice:271-273/:34・ステータス変更時の履歴保存:111-118・flush/commit:120-121・例外rollback＋InternalException:130-138）。まとめ買取商品IDは BulkPurchaseIdService::get（BulkPurchaseIdService.php:34／MtbOption::BULK_PURCHASE_ID:77）。
 *  - 合否（成功）は HTTPステータス200＋応答 `{code:200}`、（失敗）は 400＋`{code,errors}` を仕様（正本md）由来で判定する（spec側）。
 *    検証失敗時のHTTPステータスは正本mdの 400 を期待する。実装は `#[MapRequestPayload]` 既定で 422 を返す可能性（付帯表4#2）→ 仕様どおり期待し違えば落として検出する（実装へ寄せない）。
 *  - 検証メッセージは正本md文言を期待値とする（末尾句点・マスタ非存在文言・name最大長は実装と乖離＝付帯表4#3/#4/#6）。実装文言へ固定しない。
 *  - 本APIはブラウザ向け画面を持たない（正本md）。更新副作用（受注のステータス・合計額・更新担当者・更新日時、買取代表カード・個別入力商品の登録/更新/削除、申込時買取価格の引き継ぎ/削除、まとめ買取商品の申込時買取価格削除、ステータス変更時の履歴登録）は
 *    永続化先テーブル（dtb_buy_order・dtb_buy_main_card・dtb_buy_order_indivisual_input_product・dtb_application_price・dtb_buy_order_status_histry）を直接DB照合（DB副作用観測）して判定する想定で、spec側はAPI応答を一次に置きDB照査で補完する（本リポでDBは実行しない）。
 *  - jwt-token原値・署名シークレットは env で供給し原値はコミットしない（付帯表3）。SEED受注ID・ステータスID・商品規格ID・買取区分も env 供給（要実機確認の暫定値）。
 *    実装定数（MtbBuyOrderStatus.php:29-59）はシードへ流用せず、シードは正本mdの「マスタに存在する/しない」区分で組む（付帯表4#5）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A07_05_READY。
 */

/** API実効パス接頭辞。由来: eccube.yaml:6,55（%eccube_api_v1_route% 既定値 `api/v1`）。 */
export const API_V1_PREFIX = "/api/v1";

/**
 * ネット買取受注 査定終了処理エンドポイント実効パスを組む（受注ID {id} を埋める）。
 * 由来: BuyOrderController.php:170（Route）＋ eccube.yaml:6,55 ＝実効 `PUT /api/v1/admin/buyOrder/{id}.json`。
 * 正本md `PUT /admin/buyOrder/{id}.json`（接頭辞 `/api/v1` なし）とは不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理する。
 */
export function buildBuyOrderEndPath(orderId: string | number): string {
  return `${API_V1_PREFIX}/admin/buyOrder/${orderId}.json`;
}

/** 認証ヘッダ名。由来: JwtTokenHeaderExtractor.php:29（HEADER_NAME `jwt-token`）。 */
export const JWT_HEADER_NAME = "jwt-token";

// ===== JWT（env 供給・原値非コミット。既定値は要実機確認の暫定。SEED-A07-05-JWT-MEMBER） =====

/**
 * 有効JWT（SEED-A07-05-JWT-MEMBER／更新担当者の管理者会員A）。HS256・有効署名・該当会員の利用者IDを含む（jwt.yaml:3,5）。
 * 要実機確認: テスト環境固定の有効トークンへ差し替える（付帯表1 010-012・JWT発行・会員紐づけ）。
 */
export const MEMBER_JWT = process.env.A07_05_JWT_MEMBER || "";

/** 署名不正トークン（E2E-A07-05-011）。署名シークレットを持たずに合成。実装は token_handler 検証で401を返すことを期待。 */
export const JWT_BAD_SIGNATURE =
  process.env.A07_05_JWT_BAD_SIGNATURE ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.invalid-signature-not-hs256";

/**
 * 署名は正しいが該当管理者会員が存在しない利用者IDのトークン（E2E-A07-05-012）。
 * 正しい署名には実機シークレットが要るため env 供給（要実機確認）。未設定時は合成値（署名不正として401となる）でフォールバック。
 */
export const JWT_NO_MEMBER =
  process.env.A07_05_JWT_NO_MEMBER ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTk5OTk5OSJ9.no-matching-member-signature";

/** jwt-token ヘッダ＋Content-Type を組む。token 未指定（undefined/空）なら jwt-token ヘッダを付けない（欠落系010）。token 省略時は MEMBER_JWT。 */
export function buildJwtHeaders(token: string | undefined = MEMBER_JWT): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token !== undefined && token !== "") headers[JWT_HEADER_NAME] = token;
  return headers;
}

/** jwt-token を一切付与しないヘッダ（E2E-A07-05-010 欠落）。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

// ===== SEED 受注ID・ステータス・商品規格・買取区分（env 供給・既定は要実機確認の暫定） =====

/**
 * SEED受注ID（付帯表3）。env 供給・既定値は要実機確認のプレースホルダ。HAS_API(A07_05_READY) ガード下でのみ送信される。
 *  - OPEN:         SEED-A07-05-ORDER-OPEN（査定終了前の中間状態・既存明細最小・担当者未設定）。正常/検証/履歴/区分整合の対象受注。
 *  - WITH_DETAILS: SEED-A07-05-ORDER-WITH-DETAILS（既存の買取代表カード・個別入力商品・申込時買取価格・まとめ買取・サプライ相当を含む）。明細CRUD・削除・引き継ぎ・保持の検証用。
 *  - NONEXISTENT:  存在しない受注ID（030）。
 */
export const ORDER_ID = {
  OPEN: process.env.A07_05_ORDER_ID || "1001", // 要実機確認: SEED-A07-05-ORDER-OPEN
  WITH_DETAILS: process.env.A07_05_ORDER_WITH_DETAILS_ID || "1002", // 要実機確認: SEED-A07-05-ORDER-WITH-DETAILS
  NONEXISTENT: process.env.A07_05_ORDER_NONEXISTENT_ID || "99999999", // 存在しない受注ID（030）
} as const;

/**
 * 買取受注ステータス（SEED-A07-05-STATUS-MASTER／mtb_buy_order_status）。値定義の正は正本md（実装定数 MtbBuyOrderStatus.php:29-59 との対応は付帯表4#5）。
 *  - VALID:        マスタに存在する有効なステータスID（汎用正常）。
 *  - CHANGED:      SEED-A07-05-ORDER-OPEN の更新前ステータスと異なる有効ID（履歴登録 060/061・受注更新 050）。
 *  - UNCHANGED:    SEED-A07-05-ORDER-OPEN の更新前ステータスと同一の有効ID（履歴未登録 062）。
 *  - NOT_IN_MASTER: 買取受注ステータスマスタに存在しないID（例999／032,033,044）。
 */
export const STATUS = {
  VALID: Number(process.env.A07_05_STATUS_VALID || 1), // 要実機確認: マスタ存在の有効ステータスID
  CHANGED: Number(process.env.A07_05_STATUS_CHANGED || 2), // 要実機確認: 更新前と異なる有効ステータスID
  UNCHANGED: Number(process.env.A07_05_STATUS_UNCHANGED || 1), // 要実機確認: 更新前と同一のステータスID
  NOT_IN_MASTER: Number(process.env.A07_05_STATUS_NOT_IN_MASTER || 999), // マスタ非存在ID（032,033,044）
} as const;

/** 既知の商品規格ID（0以外＝買取代表カード／053・056）。SEED-A07-05-ORDER-WITH-DETAILS。要実機確認: 環境の投入値へ差し替え。 */
export const KNOWN_PRODUCT_CLASS_ID = Number(process.env.A07_05_PRODUCT_CLASS_ID || 5001);

/** 商品規格ID=0（個別入力商品／051・052・正本md 処理フロー#4）。 */
export const INDIVIDUAL_PRODUCT_CLASS_ID = 0;

/** 明細の買取区分 purchase_category（整数・正常値）。要実機確認: 環境の有効値へ差し替え。 */
export const PURCHASE_CATEGORY = Number(process.env.A07_05_PURCHASE_CATEGORY || 1);

// ===== ペイロード（正本md 入出力節 記載フィールドのみで最小構成。明細: name/product_class_id/quantity/price/purchase_category） =====

/** 非整数値（整数形式バリデーション 038-041・045 用）。JSON 上の非整数文字列で送る。 */
export const NON_INTEGER_VALUE = "abc";

/** 明細1件のオプション（正本md 入出力: name/product_class_id/quantity/price/purchase_category）。 */
export interface OrderDetailOptions {
  name?: string | null;
  productClassId?: number | string | null;
  quantity?: number | string;
  price?: number | string;
  purchaseCategory?: number | string;
}

/** 受注 査定終了ボディのオプション（正本md: order_status・order_details[]）。 */
export interface BuyOrderEndPayloadOptions {
  orderStatus?: number | string | null;
  details?: OrderDetailOptions[] | null;
}

/** 明細1件を組む（正本md 記載フィールドのみ）。未指定キーは送らない（必須欠落の検証＝036 用に省略可能にする）。 */
export function buildDetail(opts: OrderDetailOptions = {}): Record<string, unknown> {
  const detail: Record<string, unknown> = {};
  if ("name" in opts) detail.name = opts.name;
  else detail.name = "テスト商品";
  detail.product_class_id = "productClassId" in opts ? opts.productClassId : KNOWN_PRODUCT_CLASS_ID;
  detail.quantity = "quantity" in opts ? opts.quantity : 1;
  detail.price = "price" in opts ? opts.price : 1000;
  detail.purchase_category = "purchaseCategory" in opts ? opts.purchaseCategory : PURCHASE_CATEGORY;
  return detail;
}

/** 正常な査定終了ボディ（order_status=有効・正常明細1件）。overrides で各種異常・境界へ振る。 */
export function buildValidPayload(opts: BuyOrderEndPayloadOptions = {}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  body.order_status = "orderStatus" in opts ? opts.orderStatus : STATUS.VALID;
  body.order_details = "details" in opts ? opts.details : [buildDetail()];
  return body;
}

/** order_status 未指定ボディ（031）。 */
export function buildMissingStatusPayload(): Record<string, unknown> {
  return { order_details: [buildDetail()] };
}

/** マスタ非存在 order_status=999 ボディ（032,033,044）。 */
export function buildUnknownStatusPayload(): Record<string, unknown> {
  return { order_status: STATUS.NOT_IN_MASTER, order_details: [buildDetail()] };
}

/** order_details 空配列ボディ（034,035）。 */
export function buildEmptyDetailsPayload(): Record<string, unknown> {
  return { order_status: STATUS.VALID, order_details: [] };
}

/** 明細の name 未指定ボディ（036）。 */
export function buildMissingNamePayload(): Record<string, unknown> {
  return { order_status: STATUS.VALID, order_details: [buildDetail({ name: null })] };
}

/** 指定長の name を持つ明細ボディ（037=最大長超過）。 */
export function buildNameLengthPayload(length: number): Record<string, unknown> {
  return { order_status: STATUS.VALID, order_details: [buildDetail({ name: "あ".repeat(length) })] };
}

/** name 最大長（65535文字＝境界内）。正本mdの上限（付帯表4#6で実装の個別入力商品列長255と乖離し得る）。 */
export const NAME_MAX_LENGTH = 65535;
/** name 最大長+1（65536文字＝境界外・037）。 */
export const NAME_OVER_MAX_LENGTH = 65536;

/** 明細の指定項目を非整数にしたボディ（038/039/040/041/045）。field は OrderDetailOptions のキー。 */
export function buildNonIntegerDetailPayload(field: keyof OrderDetailOptions): Record<string, unknown> {
  return { order_status: STATUS.VALID, order_details: [buildDetail({ [field]: NON_INTEGER_VALUE })] };
}

/** 複数の検証エラーを同時に含むボディ（042：order_status未指定＋明細のname未指定＋quantity非整数）。 */
export function buildMultipleErrorsPayload(): Record<string, unknown> {
  return {
    order_details: [buildDetail({ name: null, quantity: NON_INTEGER_VALUE })],
  };
}

/** product_class_id=0 かつ受注に同名が無い明細を含むボディ（051：個別入力商品の新規登録）。 */
export function buildIndividualInputNewPayload(): Record<string, unknown> {
  return {
    order_status: STATUS.VALID,
    order_details: [buildDetail({ productClassId: INDIVIDUAL_PRODUCT_CLASS_ID, name: "個別入力_新規_" + Date.now() })],
  };
}

/** product_class_id=0 かつ既存と同名の明細を含むボディ（052：個別入力商品の更新／同名で重複新規行が増えない）。name は SEED の既存名へ差し替え想定。 */
export function buildIndividualInputExistingPayload(): Record<string, unknown> {
  const name = process.env.A07_05_EXISTING_INDIVIDUAL_NAME || "既存個別入力商品"; // 要実機確認: SEED-A07-05-ORDER-WITH-DETAILS の既存個別入力商品名
  return {
    order_status: STATUS.VALID,
    order_details: [buildDetail({ productClassId: INDIVIDUAL_PRODUCT_CLASS_ID, name })],
  };
}

/** 商品規格ID（0以外）を持つ明細を含むボディ（053：買取代表カードの登録/更新）。 */
export function buildMainCardPayload(): Record<string, unknown> {
  return {
    order_status: STATUS.VALID,
    order_details: [buildDetail({ productClassId: KNOWN_PRODUCT_CLASS_ID })],
  };
}

/** 既存明細の一部を含まない明細ボディ（054：今回保持しない既存カード・個別入力商品・申込時買取価格が削除される）。 */
export function buildReplacedDetailsPayload(): Record<string, unknown> {
  return {
    order_status: STATUS.VALID,
    order_details: [buildDetail({ productClassId: KNOWN_PRODUCT_CLASS_ID, name: "置換後カード", quantity: 1, price: 500 })],
  };
}

/** 単価×数量の合計が10円単位で割り切れない明細ボディ（057：合計額の10円切上げ観測用 例 1234→1240）。 */
export function buildNonRoundedTotalPayload(): Record<string, unknown> {
  // price=1234 × quantity=1 = 1234 → 10円単位切上げで 1240 を期待（DB副作用で判定）。
  return { order_status: STATUS.VALID, order_details: [buildDetail({ price: 1234, quantity: 1 })] };
}

// ===== 正本md由来のエラーメッセージ文言（オラクル）。実装文言の乖離は付帯表4で記録（テストは正本md文言で照合し違えば落として検出） =====

/**
 * 正本md（バリデーション節）の検証メッセージ。
 *  - STATUS_REQUIRED: order_status必須（末尾句点あり。実装 UpdateBuyOrderDto.php:29 は句点なし＝付帯表4#3）。
 *  - DETAILS_REQUIRED: order_details必須／空・配列以外（末尾句点あり。実装 UpdateBuyOrderDto.php:34-35 は句点なし＝付帯表4#3）。035。
 *  - INTEGER_PRODUCT_CLASS_ID: 明細 product_class_id の整数形式（045）。
 *  - INTEGER_QUANTITY: 明細 quantity の整数形式（042 の集約照合に使用。正本md「整数」表記の同パターン）。
 */
export const SPEC_MESSAGE = {
  STATUS_REQUIRED: "ステータスを選択してください。",
  DETAILS_REQUIRED: "1つ以上の商品を選んでください。",
  INTEGER_PRODUCT_CLASS_ID: "商品規格IDは、整数で入力してください。",
  INTEGER_QUANTITY: "数量は、整数で入力してください。",
} as const;

/**
 * マスタ非存在 order_status メッセージ（033）。指定IDを埋める。
 * 正本md文言「MtbBuyOrderStatusに（値）が見つかりません。」。実装は別文言（BuyOrderController.php:183-186「正しい買取ステータスIDを入力してください」＝付帯表4#4）。
 */
export function statusNotInMasterMessage(id: number = STATUS.NOT_IN_MASTER): string {
  return `MtbBuyOrderStatusに${id}が見つかりません。`;
}
