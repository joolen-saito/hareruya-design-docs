/**
 * a06-02 店頭仕入_店頭買取注文一覧（買取アプリ=MTGバイヤー向けの査定対象受注一覧 参照系 JSON API・GET）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a06_02_api_store_purchase_otc_buy_order_list_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは設計書(a06-02・正本md)入出力記載のリクエスト仕様（jwt-token ヘッダ付き GET）のみを最小構成で組む未実行雛形。実環境は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス整形・FW既定値・抽出ステータス集合を流用しない）:
 *  - 送信先は実装の実効パス `GET /api/v1/admin/otcBuyOrders.json`（付帯表1/付帯表4#1。正本md `GET /admin/otcBuyOrders.json`＋別名 `/admin/otcBuyOrders` とは不一致）。
 *    由来: `#[Route('/%eccube_api_v1_route%/admin/otcBuyOrders.json', name:'api_admin_otc_buy_orders', methods:['GET'])]`（OtcBuyOrderController.php:69）
 *          ＋ `eccube_api_v1_route` 既定値 `api/v1`（app/config/eccube/packages/eccube.yaml:6,55）＝実効パス。拡張子なし別名は実装に無い（付帯表4#2）。
 *  - 認証は firewall `app`（pattern `^/api/v1/`）の access_token（token_handler JwtTokenHandler／extractor JwtTokenHeaderExtractor）。
 *    ヘッダ名は `jwt-token`（JwtTokenHeaderExtractor.php:29）、署名方式 HS256（jwt.yaml:2-5）、`#[IsGranted('IS_AUTHENTICATED_FULLY')]`（OtcBuyOrderController.php:51）。認証失敗は401。
 *  - 合否（成功）は HTTPステータス200＋応答配列（ラッパなし・件数フィールドなし）＋各フィールドの型/既知値を仕様由来で判定（spec側）。
 *  - 抽出ステータスは仕様 5/6/7/8/9（正本md 集計条件）を期待。実装 ASSESSMENT_UNCOMPLETED_STATUSES は [5,6,8,9] で振込前(7)欠落（付帯表4#4）→ 7 を含むことを期待し違えば落として検出。
 *  - 日時書式（applyDate=ISO8601／birth=ISO8601）・identificationId 未登録=0 は仕様を期待。実装は `Y/m/d H:i:s`／`Y-m-d`／null（付帯表4#5/#6/#7）→ 該当ケースは要実機確認(fixme)。
 *  - 住所連結は仕様 日本=都道府県名・住所1・住所2／日本以外=国名・住所2・住所1。実装は addr03 も連結（付帯表4#9）→ 要実機確認(fixme)。
 *  - 有効JWT原値・申込者個人情報は env で供給し原値はコミットしない。既定値は要実機確認の暫定（テスト環境固定値へ差し替える）。
 *    有効JWTは a06-01 管理ログイン（POST /api/v1/admin/login.json）の jwtToken を流用想定。発行は外部/実機依存のため env で供給する。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A06_02_READY。
 */

/**
 * 査定対象受注一覧API実効パス。
 * 由来: OtcBuyOrderController.php:69（Route）＋ eccube.yaml:6,55（eccube_api_v1_route 既定 `api/v1`）＝実効 `GET /api/v1/admin/otcBuyOrders.json`。
 * 正本md(pf-api)の `GET /admin/otcBuyOrders.json`（＋拡張子なし別名 `/admin/otcBuyOrders`）とは不一致（付帯表4#1/#2）。テストは実効パスへ送信し差異を付帯表で管理。
 */
export const OTC_BUY_ORDERS_PATH = "/api/v1/admin/otcBuyOrders.json";

/** 認証ヘッダ名。由来: JwtTokenHeaderExtractor.php:29（HEADER_NAME `jwt-token`）。 */
export const JWT_HEADER_NAME = "jwt-token";

// ===== JWT（env 供給・原値非コミット。既定値は要実機確認の暫定） =====

/**
 * 有効JWT（SEED-A06-02-JWT-VALID／所属店舗付き管理者会員）。a06-01 ログインの jwtToken を流用想定。
 * 要実機確認: テスト環境固定の有効トークンへ差し替える。HS256・有効署名・該当管理者会員の利用者IDを含む。
 */
export const VALID_JWT = process.env.A06_02_TOKEN || "";

/** 店舗未紐付け会員（SEED-A06-02-MEMBER-NOSHOP）の有効JWT（017・付帯表4#3 検証用）。要実機確認。 */
export const NOSHOP_JWT = process.env.A06_02_TOKEN_NOSHOP || VALID_JWT;

/** 該当受注0件の会員/店舗（SEED-A06-02-EMPTY）の有効JWT（022 空配列検証用）。要実機確認。 */
export const EMPTY_JWT = process.env.A06_02_TOKEN_EMPTY || VALID_JWT;

/**
 * 署名不正トークン（SEED-A06-02-JWT-INVALID／署名改ざん。E2E-A06-02-010/014/015）。
 * 署名シークレットを持たずに合成。実装は token_handler 検証で401を返すことを期待。
 */
export const JWT_BAD_SIGNATURE =
  process.env.A06_02_JWT_BAD_SIGNATURE ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.invalid-signature-not-hs256";

/**
 * 署名は正しいが該当管理者会員が存在しない利用者IDのトークン（SEED-A06-02-JWT-INVALID／011）。
 * 正しい署名には実機シークレットが要るため env 供給（要実機確認）。未設定時は合成値（署名不正として401となる）でフォールバック。
 */
export const JWT_NO_MEMBER =
  process.env.A06_02_JWT_NO_MEMBER ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTk5OTk5OSJ9.no-matching-member-signature";

/** JWT形式として不正な文字列（SEED-A06-02-JWT-INVALID／013）。ドット区切りの3セグメントを満たさない。 */
export const JWT_MALFORMED = process.env.A06_02_JWT_MALFORMED || "not-a-valid-jwt-string";

/** jwt-token ヘッダを組み立てる。token 省略時は VALID_JWT を使用。token が空文字なら未付与（欠落＝012）。 */
export function buildAuthHeaders(token: string = VALID_JWT): Record<string, string> {
  return token ? { [JWT_HEADER_NAME]: token } : {};
}

// ===== 抽出ステータス・国コード（仕様由来の定数。実装値はオラクルに固定しない） =====

/**
 * 査定対象ステータス（仕様 集計条件 抽出対象）: 商品到着(5)・査定中(6)・振込前(7)・保留(8)・査定再開(9)。
 * 実装 ASSESSMENT_UNCOMPLETED_STATUSES は [5,6,8,9]（MtbOtcBuyOrderStatus.php:84-89）で 7 欠落（付帯表4#4）。テストは仕様の集合で判定。
 */
export const ASSESSMENT_TARGET_STATUSES: number[] = [5, 6, 7, 8, 9];

/**
 * 対象外ステータスの代表値（成立・キャンセル・ダブルチェック済・データ出力済 等）。021 で一覧に含まれないことを確認する。
 * 仕様: 査定対象(5-9)以外は除外。具体IDは SEED-A06-02-ORDERS-EXCLUDED 投入値に対応（要実機確認: 環境の定義へ差し替え）。
 */
export const EXCLUDED_STATUS_SAMPLES: number[] = [1, 2, 3, 4];

/** 国コード 日本=392（Country.php:33）。住所連結の分岐判定（038/039・付帯表4#9）。 */
export const COUNTRY_JAPAN = 392;

// ===== 想定外クエリ（031） =====

/** 想定外クエリ項目（E2E-A06-02-031）。jwt-token 以外のパラメータを持たない仕様（入出力 リクエスト）のため無視され200となることを期待。 */
export const UNKNOWN_QUERY_PARAMS: Record<string, string> = { unknownField: "x", foo: "1", page: "2" };

// ===== SEED 既知期待値（型・値照合用。env 供給・既定は要実機確認の暫定） =====

function numEnv(name: string, fallback: number): number {
  const v = process.env[name];
  return v !== undefined && v !== "" ? Number(v) : fallback;
}

/**
 * 応答主要フィールドの既知期待値（SEED-A06-02-ORDERS-ASSESS の代表1件）。
 * 型契約（044-046）は spec 側で typeof 検証し、値照合はこの既知値で行う想定（要実機確認: SEED投入値へ差し替え）。
 */
export const SEED = {
  /** 型・値照合対象の代表受注ID（044）。 */
  knownOtcBuyOrderId: numEnv("A06_02_KNOWN_OTC_BUY_ORDER_ID", 1001),
  knownAssessmentId: numEnv("A06_02_KNOWN_ASSESSMENT_ID", 2001),
  knownOtcOrderStatusId: numEnv("A06_02_KNOWN_STATUS_ID", 6),
  knownReturnSupply: numEnv("A06_02_KNOWN_RETURN_SUPPLY", 0),
  knownOrderStatusName: process.env.A06_02_KNOWN_STATUS_NAME || "査定中",
  /** customerInfo 文字列フィールド既知値（046）。原値（個人情報）はコミットしない。 */
  knownFirstName: process.env.A06_02_KNOWN_FIRST_NAME || "太郎",
  knownLastName: process.env.A06_02_KNOWN_LAST_NAME || "晴谷",
  knownTelNo: process.env.A06_02_KNOWN_TEL_NO || "0312345678",
  knownZipcode: process.env.A06_02_KNOWN_ZIPCODE || "1000001",
  knownJobName: process.env.A06_02_KNOWN_JOB_NAME || "会社員",
} as const;

/** 受注基本情報（型契約照合用の最小形）。仕様 入出力 レスポンス（成功）由来。実装差異はオラクルに固定しない。 */
export interface OtcBuyOrderCustomerInfo {
  firstName: string;
  lastName: string;
  telNo: string;
  zipcode: string;
  jobName: string;
  birth: string | null;
  address: string;
}

export interface OtcBuyOrder {
  otcBuyOrderId: number;
  assessmentId: number;
  otcOrderStatusId: number;
  orderStatusName: string;
  returnSupply: number;
  callFlg: boolean;
  adultFlg: boolean;
  playingFlg: boolean;
  qualifiedInvoiceIssuerFlg: boolean;
  qualifiedInvoiceIssuerConfirmationFlg: boolean;
  applyDate: string;
  freeComment: string | null;
  memberName: string | null;
  identificationId: number;
  qualifiedInvoiceIssuerCode: string | null;
  customerInfo: OtcBuyOrderCustomerInfo;
  [key: string]: unknown;
}
