/**
 * a07-02 オンライン仕入_買取注文一覧（買取アプリ=MTGバイヤー向けに査定対象のネット買取受注一覧をGET取得する参照系JSON API）API/統合レイヤ用 パス／クエリ／ヘルパ。
 * ケース表 integration_test/e2e/a07_02_api_online_purchase_buy_order_list_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a07-02) 入出力記載のリクエスト仕様（jwt-token ヘッダ付き GET・クエリパラメータなし）のみを最小構成で組む未実行雛形。実環境（買取アプリ＝MTGバイヤー）は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス整形＝日時書式・null/空文字の差異・整数/文字列キャストを期待値に流用しない）:
 *  - 送信先は実装の実効パス `GET /api/v1/admin/buyOrders.json`（付帯表1/付帯表4#1）。
 *    由来: `#[Route('/%eccube_api_v1_route%/admin/buyOrders.json', name: 'api_admin_buy_orders_product_arrival', methods: ['GET'])]`（BuyOrderController.php:59）
 *          ＋ `eccube_api_v1_route` 既定値 `api/v1`（app/config/eccube/packages/eccube.yaml:6,55）＝実効パス。正本md `GET /admin/buyOrders.json` は `/api/v1` を欠き不一致（付帯表4#1）。
 *  - 認証は firewall `app`（pattern `^/api/v1/`）の access_token（token_handler JwtTokenHandler／extractor JwtTokenHeaderExtractor＝security.yaml:33-39）。
 *    ヘッダ名は `jwt-token`（JwtTokenHeaderExtractor.php:29）。署名方式 HS256（JwtTokenService.php:41,86）。利用者IDから管理者会員を引く（JwtTokenHandler.php:72）。コントローラは IsGranted('IS_AUTHENTICATED_FULLY')（BuyOrderController.php:44）。
 *    欠落・該当会員なし・署名不正・形式不正は 401（HS256署名検証の実方式は要実機確認だが結果＝401で判定）。
 *  - 抽出処理は findToAssessBuyOrders（DtbBuyOrderRepository.php:286）。抽出ステータス集合は [PRODUCT_ARRIVAL(2),ASSESSING(10),PENDING(11),RESUMPTION(12)]（DtbBuyOrderRepository.php:288-293／MtbBuyOrderStatus.php:31,47,49,51）／IN(:targetStatusIds)（:312）。並び順は受注ID昇順 orderBy('buyOrder.id','ASC')（DtbBuyOrderRepository.php:314）。
 *  - 応答整形は BuyOrderController.php:64-87。住所連結は implode(' ', array_filter([prefName,addr01,addr02]))（:65-69）。応答本体は JsonResponse($response)（:87）でラッパ無しの受注オブジェクト配列。
 *  - 合否（成功）は HTTP200＋査定対象配列、（失敗）は 401 を仕様（正本md）の意味で判定する（spec側）。
 *    フィールド型契約（netBuyOrderId・netOrderStatusId＝integer／applyDate＝ISO8601／freeComment・memberName 未設定null）は正本mdを期待し、実装乖離（付帯表4#2-5）は test.fixme で記録し違えば落として検出する（実装へ寄せない）。
 *  - 本APIの結果は外部買取アプリで消費されEC-CUBE管理画面に現れないため、UIレイヤは本機能のスコープ外（自動化(UI)0件）。
 *  - jwt-token原値・署名シークレット・申込者個人情報は env で供給し原値はコミットしない（付帯表3）。SEED受注の既知値（netBuyOrderId/netOrderStatusId/customerInfo各値/address）も env 供給（要実機確認の暫定値）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A07_02_READY。
 */

/** API実効パス接頭辞。由来: eccube.yaml:6,55（%eccube_api_v1_route% 既定値 `api/v1`）。 */
export const API_V1_PREFIX = "/api/v1";

/**
 * 査定対象 買取受注一覧エンドポイント実効パス。
 * 由来: BuyOrderController.php:59（Route `/%eccube_api_v1_route%/admin/buyOrders.json` GET）＋ eccube.yaml:6,55 ＝実効 `GET /api/v1/admin/buyOrders.json`。
 * 正本md `GET /admin/buyOrders.json`（接頭辞 `/api/v1` なし）とは不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理する。
 */
export function buildListPath(): string {
  return `${API_V1_PREFIX}/admin/buyOrders.json`;
}

/**
 * 想定外クエリパラメータを付与した一覧パス（E2E-A07-02-031）。
 * 正本md: 本APIは jwt-token 以外のパラメータを持たない（入出力 リクエスト）。想定外クエリは無視され 200 が返ることを期待する。
 */
export function buildListPathWithUnknownQuery(): string {
  return `${buildListPath()}?unexpectedParam=dummy&page=999`;
}

/** 認証ヘッダ名。由来: JwtTokenHeaderExtractor.php:29（HEADER_NAME `jwt-token`）。 */
export const JWT_HEADER_NAME = "jwt-token";

// ===== JWT（env 供給・原値非コミット。既定値は要実機確認の暫定） =====

/**
 * 有効JWT（SEED-A07-02-JWT-VALID／有効な管理者会員の利用者ID）。HS256・有効署名・該当会員の利用者IDを含む。
 * 要実機確認: テスト環境固定の有効トークンへ差し替える。
 */
export const VALID_JWT = process.env.A07_02_JWT_VALID || "";

/** 署名不正トークン（SEED-A07-02-JWT-INVALID／署名改ざん。E2E-A07-02-010）。署名シークレットを持たずに合成。実装は token_handler 検証で401を返すことを期待。 */
export const JWT_BAD_SIGNATURE =
  process.env.A07_02_JWT_BAD_SIGNATURE ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.invalid-signature-not-hs256";

/**
 * 署名は正しいが該当管理者会員が存在しない利用者IDのトークン（SEED-A07-02-JWT-INVALID／E2E-A07-02-011）。
 * 正しい署名には実機シークレットが要るため env 供給（要実機確認）。未設定時は合成値（署名不正として401となる）でフォールバック。
 */
export const JWT_NO_MEMBER =
  process.env.A07_02_JWT_NO_MEMBER ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTk5OTk5OSJ9.no-matching-member-signature";

/** JWT形式として不正な文字列（SEED-A07-02-JWT-INVALID／E2E-A07-02-013）。JWTの3パート構造を満たさず、成功扱いされず401となることを期待。 */
export const JWT_MALFORMED = process.env.A07_02_JWT_MALFORMED || "this-is-not-a-jwt";

/** jwt-token ヘッダを組む。token 未指定（undefined）または空なら jwt-token ヘッダを付けない（欠落系012）。token 省略時は VALID_JWT。 */
export function buildJwtHeaders(token: string | undefined = VALID_JWT): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token !== undefined && token !== "") headers[JWT_HEADER_NAME] = token;
  return headers;
}

/** jwt-token を一切付与しないヘッダ（E2E-A07-02-012 欠落）。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return { Accept: "application/json" };
}

// ===== 査定対象ステータス集合（仕様オラクル） =====

/**
 * 抽出対象ステータス集合（正本md 集計条件 抽出対象）。商品到着(2)・査定中(10)・保留(11)・査定再開(12)のみ。
 * 由来: DtbBuyOrderRepository.php:288-293／MtbBuyOrderStatus.php:31,47,49,51／IN(:targetStatusIds)（:312）。
 * 一覧に現れるステータスはこの集合に限られ（020）、それ以外（受付・成立・キャンセル等）は除外される（021）。
 */
export const TARGET_STATUS_IDS = [2, 10, 11, 12] as const;

// ===== SEED 既知期待値（付帯表3・env 供給。既定は要実機確認の暫定。値オラクル照合に使用） =====

/**
 * SEED-A07-02-ORDERS-ASSESS の応答主要フィールド既知期待値（付帯表3）。
 * env 供給・既定値は要実機確認のプレースホルダ。HAS_API(A07_02_READY) ガード下でのみ照合される。
 * 期待値は仕様（型・既知値）由来であり、実装の文字列キャスト等（付帯表4#5）は流用しない。
 */
export const EXPECTED = {
  /** 既知受注の受注ID（netBuyOrderId）。integer 期待（正本md／付帯表4#5は実装が文字列キャスト）。 */
  NET_BUY_ORDER_ID: Number(process.env.A07_02_EXP_NET_BUY_ORDER_ID || 1001),
  /** 既知受注のステータスID（netOrderStatusId）。integer 期待（正本md／付帯表4#5）。抽出対象集合内の値。 */
  NET_ORDER_STATUS_ID: Number(process.env.A07_02_EXP_NET_ORDER_STATUS_ID || 10),
  /** 申込者 名（customerInfo.firstName）。string 期待。 */
  FIRST_NAME: process.env.A07_02_EXP_FIRST_NAME || "太郎",
  /** 申込者 姓（customerInfo.lastName）。string 期待。 */
  LAST_NAME: process.env.A07_02_EXP_LAST_NAME || "晴谷",
  /** 申込者 電話番号（customerInfo.telNo）。string 期待。 */
  TEL_NO: process.env.A07_02_EXP_TEL_NO || "0312345678",
  /** 申込者 郵便番号（customerInfo.zipcode）。string 期待。 */
  ZIPCODE: process.env.A07_02_EXP_ZIPCODE || "1500001",
  /** 都道府県名（mtb_pref.name）。住所連結の先頭要素。 */
  PREF_NAME: process.env.A07_02_EXP_PREF_NAME || "東京都",
  /** 住所1（addr01）。 */
  ADDR01: process.env.A07_02_EXP_ADDR01 || "渋谷区神宮前1-1-1",
  /** 住所2（addr02）。 */
  ADDR02: process.env.A07_02_EXP_ADDR02 || "晴谷ビル101",
} as const;

/**
 * 連結後の住所期待値（customerInfo.address）。
 * 正本md 集計条件 結合: 都道府県名・住所1・住所2を半角空白区切りで連結（implode(' ', array_filter([prefName,addr01,addr02]))＝BuyOrderController.php:65-69）。
 * 空要素は array_filter で除外される仕様だが、SEED は3要素とも値ありを前提とする。
 */
export function expectedAddress(): string {
  return [EXPECTED.PREF_NAME, EXPECTED.ADDR01, EXPECTED.ADDR02].filter((s) => s !== "").join(" ");
}
