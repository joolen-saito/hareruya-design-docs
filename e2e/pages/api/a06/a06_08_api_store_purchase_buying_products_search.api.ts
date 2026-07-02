/**
 * a06-08 店頭仕入_買取商品検索（参照系JSON検索API）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a06_08_api_store_purchase_buying_products_search_e2e_cases.md
 * （付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは設計書(a06-08) 入出力記載のリクエスト仕様（name 前方一致検索）のみを最小構成で組む未実行雛形。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋応答 cards の構造/型/前方一致/索引付け」を仕様由来で判定する。
 *  - 実装の POST/ボディ受け・空 cards の200・カードIDキー・foilFlg int・price/stock int 等はオラクルに固定しない
 *    （付帯表4#1/#3/#4/#5/#6/#7）。
 *  - 既知SEED値（カード名・店舗コンテキスト・認可資格情報）は env で供給し、未設定時の既定値は創作値（要実機確認）。
 */

/**
 * 実効パス。
 * 由来: `#[Route('/%eccube_api_v1_route%/search', name: 'api_search', methods: ['POST'])]`
 *        （BuyingController.php:99）＋既定 `eccube_api_v1_route: api/v1`（eccube.yaml:6,55）＝実効 `POST /api/v1/search`。
 * 設計書パス `GET /search`（name はクエリパラメータ）とは メソッド・`/api/v1` プレフィクス・パラメータ位置で不一致（付帯表4#1）。
 * `name` は `$request->request->get('name','')`＝リクエストボディ（BuyingController.php:102）で受け取るため form 送信する。
 */
export const SEARCH_PATH = "/api/v1/search";

/** name をリクエストボディ（form）に組む（実装は request->request->get('name')＝ボディ）。 */
export function buildSearchForm(name: string): Record<string, string> {
  return { name };
}

/** 想定外項目を加えた form（E2E-A06-08-014）。name 以外は未参照（要実機確認: 無視されるか）。 */
export function buildSearchFormWithExtra(name: string): Record<string, string> {
  return { name, unknownField: "x", foo: "1" };
}

/** name 未指定（任意）の form（E2E-A06-08-007）。応答は正典未定義（要実機確認）。 */
export const NO_NAME_FORM: Record<string, string> = {};

/**
 * SEED-A06-08-CARD-KNOWN: 前方一致で買取商品に合致する既知カード名（要実機確認: env で供給）。
 * 商品名（カード名）の先頭文字列が既知であること。
 */
export const KNOWN_CARD_NAME = process.env.A06_08_KNOWN_CARD_NAME || "ブラック・ロータス";

/**
 * SEED-A06-08-CARD-NONE: 前方一致する買取商品が存在しないカード名（該当なし誘発）。
 * どのカード名にも前方一致しない文字列（要実機確認: env で供給）。
 */
export const NONE_CARD_NAME = process.env.A06_08_NONE_CARD_NAME || "____NO_SUCH_BUYING_CARD____";

/** 複数カードが同一前方一致キーに合致する検索キー（索引付け検証 020/043 用）。 */
export const MULTI_PREFIX_CARD_NAME = process.env.A06_08_MULTI_PREFIX_CARD_NAME || "Black";

/**
 * 前方一致検証用（044）。先頭一致するカードと語中のみ一致するカードが混在するデータの検索キー。
 * 期待: 検索キーで「始まる」カードのみ返る。
 */
export const PREFIX_MATCH_CARD_NAME = process.env.A06_08_PREFIX_MATCH_CARD_NAME || KNOWN_CARD_NAME;

/** null 許容フィールド確認用（041）。カードセット/プロモ/保管/買取価格/部門が未設定のカードの検索キー。 */
export const NULL_FIELD_CARD_NAME = process.env.A06_08_NULL_FIELD_CARD_NAME || KNOWN_CARD_NAME;

/** `%` リテラル検証用（045）。リテラル `%` を名称先頭に持つカードに合致する検索キー。 */
export const PERCENT_CARD_NAME = process.env.A06_08_PERCENT_CARD_NAME || "50%OFF";

/** `_` リテラル検証用（046）。リテラル `_` を名称先頭に持つカードに合致する検索キー。 */
export const UNDERSCORE_CARD_NAME = process.env.A06_08_UNDERSCORE_CARD_NAME || "POWER_9";

/**
 * SEED-A06-08-API-AUTH: 認証済Member（MTGバイヤー）の資格情報を env で供給する。
 * 認可方式（公開/IP制限/APIキー/セッション等）は設計書から確定できず要確認（付帯表4#2）。
 * env が未設定なら空ヘッダ（A06_08_READY 未設定時は spec 側 test.skip でガード）。
 */
export const API_AUTH_HEADER = process.env.A06_08_API_AUTH_HEADER || "Authorization";
export const API_AUTH_TOKEN = process.env.A06_08_API_AUTH_TOKEN || "";

/** 正常な資格情報ヘッダ（認証済Member相当）。資格情報の原値はログ・設計書に書かない。 */
export function buildAuthHeaders(): Record<string, string> {
  return API_AUTH_TOKEN ? { [API_AUTH_HEADER]: API_AUTH_TOKEN } : {};
}

/** 無効・欠落した資格情報ヘッダ（E2E-A06-08-008 負例）。許可されず正常取得200を返さないことを期待。 */
export function buildInvalidAuthHeaders(): Record<string, string> {
  return { [API_AUTH_HEADER]: "Bearer invalid-or-missing-credential" };
}

/**
 * 成功レスポンスの仕様フィールド（E2E-A06-08-006 型契約・付帯表4#4/#5/#6）。
 * 設計書 入出力 レスポンス(成功)由来。実装差異（foilFlg int／price/stock int／productClassCode）はオラクルに寄せない。
 */
export const SUCCESS_CARD_FIELDS = ["cardNameJp", "cardNameEn", "imageFileName", "details"] as const;
export const SUCCESS_DETAIL_FIELDS = [
  "cardsetCode",
  "cardsetName",
  "foilFlg",
  "cardNo",
  "promotionName",
  "productId",
  "productNameJp",
  "productNameEn",
  "rarityCode",
  "storageCodeName",
] as const;
export const SUCCESS_CONDITION_FIELDS = [
  "productClassId",
  "productCode",
  "buyPrice",
  "price",
  "stock",
  "sectionId",
] as const;

/** 未設定時 null が許容される任意フィールド（E2E-A06-08-041）。 */
export const NULLABLE_FIELDS = [
  "cardsetCode",
  "cardsetName",
  "promotionName",
  "storageCodeName",
  "buyPrice",
  "sectionId",
] as const;
