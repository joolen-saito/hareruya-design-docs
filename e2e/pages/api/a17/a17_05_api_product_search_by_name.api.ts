/**
 * a17-05 商品名検索（GET参照系JSON API）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a17_05_api_product_search_by_name_e2e_cases.md（付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本機能は a06-09（店頭仕入_商品名検索）と同一エンドポイント族（GET /product/search）であり、a06-09 を近接モデルとする。
 * 本ファイルは正本md(a17-05) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形（コンパイル確認のみ）。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋応答本文の構造/型/既知値」を仕様由来で判定する（オラクル独立性）。
 *  - 実装が付加する余剰 count（付帯表4#1）・空値の null 化（high_price_code＝付帯表4#4）はオラクルに固定しない。
 *  - 想定外クエリ項目の無視・200（付帯表4#6）は正典未定義のため固定オラクルを置かない（当該ケースは手動・本specには書かない）。
 *  - 既知SEED値・期待値は env で供給し未設定時は創作既定値（要実機確認）。本APIは認証を行わない（正本md:62）。
 *  - 商品サブクラスの DB 再編（付帯表4#2）に伴う SEED 再現は要実機確認。
 */

/**
 * 実効パス。
 * 由来: `#[Route(path: '/product/search', name: 'products_search', methods: ['GET'])]`
 *       （src/Eccube/Controller/App/ProductController.php:88）＝メソッド getProductListByProductName（同:90）。
 * 正本md のパス `GET /product/search` と実装は一致（付帯表4で乖離なしを確認）。
 */
export const PRODUCT_SEARCH_PATH = "/product/search";

/**
 * 拡張子あり別名パス（同一handlerで同一処理）。
 * 由来: `#[Route(path: '/product/search.json', name: 'products_search_json', methods: ['GET'])]`（ProductController.php:89・同一handler:90）。
 */
export const PRODUCT_SEARCH_JSON_PATH = "/product/search.json";

/** productパラメータ取得＝`$request->query->get('product', '')`（ProductController.php:92）。GET送信時のクエリ（product=値）を組み立てる。 */
export function buildProductQuery(name: string): Record<string, string> {
  return { product: name };
}

/** product未指定（空）クエリ（E2E-A17-05-020）。空時404＝NotFoundException（ProductController.php:92,95,99）。 */
export const EMPTY_QUERY: Record<string, string> = {};

/** 本APIは認証を行わない（正本md:62。ルートに認証/firewall設定なし＝ProductController.php:88-89 App配下）。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return {};
}

// ===== 検索語（SEED-A17-05-*）。env で供給し、未設定時は要実機確認の創作既定値 =====

/** SEED-A17-05-PRODUCT-KNOWN 既知商品名（部分一致のベース）。 */
export const KNOWN_PRODUCT_NAME = process.env.A17_05_KNOWN_PRODUCT_NAME || "要実機確認-既知商品名";
/** SEED-A17-05-PRODUCT-KNOWN 部分一致語（E2E-A17-05-001）。 */
export const PARTIAL_MATCH_WORD = process.env.A17_05_PARTIAL_MATCH_WORD || "要実機確認-部分一致語";
/** SEED-A17-05-PRODUCT-KNOWN（複数該当）複数商品に部分一致する語（E2E-A17-05-009）。 */
export const MULTI_MATCH_WORD = process.env.A17_05_MULTI_MATCH_WORD || "要実機確認-複数該当語";
/** SEED-A17-05-PRODUCT-KNOWN（カード詳細あり）言語コードprefix対象の商品名（E2E-A17-05-010）。 */
export const CARD_DETAIL_PRODUCT_NAME =
  process.env.A17_05_CARD_DETAIL_PRODUCT_NAME || "要実機確認-カード詳細あり商品名";
/** SEED-A17-05-OTHER-COND（表示可）その他コンディション表示可の商品名（E2E-A17-05-011）。 */
export const OTHER_COND_PRODUCT_NAME =
  process.env.A17_05_OTHER_COND_PRODUCT_NAME || "要実機確認-その他コンディション表示可商品名";
/** SEED-A17-05-OTHER-COND（抑制／表示下限未満）NM絞り込み対象の商品名（E2E-A17-05-012）。 */
export const SUPPRESSED_PRODUCT_NAME =
  process.env.A17_05_SUPPRESSED_PRODUCT_NAME || "要実機確認-表示下限未満商品名";
/** SEED-A17-05-OVER100 101件以上に部分一致する語（E2E-A17-05-014）。規模は要実機確認（付帯表3）。 */
export const OVER100_WORD = process.env.A17_05_OVER100_WORD || "要実機確認-101件以上該当語";
/** SEED-A17-05-SUBCLASS-MISSING 商品はヒットするが規格が無い商品名（E2E-A17-05-023）。再現方法は要実機確認（付帯表4#2）。 */
export const SUBCLASS_MISSING_PRODUCT_NAME =
  process.env.A17_05_SUBCLASS_MISSING_PRODUCT_NAME || "要実機確認-規格なし商品名";

/** SEED-A17-05-PRODUCT-NONE どの既知商品名にも部分一致しない語（E2E-A17-05-021/022/025）＝0件→404。 */
export const NONE_MATCH_WORD = process.env.A17_05_NONE_MATCH_WORD || "zzz-該当なし-xyzzy-0000";
/** SEED-A17-05-PRODUCT-NONE 特殊文字（記号等）で該当なし（E2E-A17-05-024）。 */
export const SPECIAL_CHAR_QUERY = process.env.A17_05_SPECIAL_CHAR_QUERY || "!@#$%^&*()";
/** 空白のみ（全角＋半角）。実質空として該当なし→404（E2E-A17-05-026）。 */
export const WHITESPACE_QUERY = process.env.A17_05_WHITESPACE_QUERY || "　 ";

// ===== 既知レコード期待値（E2E-A17-05-002 値照合）。env 供給。未設定なら値照合はスキップ＝要実機確認 =====

/** products[].product_id の期待値（SEED既知レコード）。 */
export const EXPECTED_PRODUCT_ID = process.env.A17_05_EXPECTED_PRODUCT_ID;
/** products[].product_name の期待値（SEED既知レコード）。 */
export const EXPECTED_PRODUCT_NAME = process.env.A17_05_EXPECTED_PRODUCT_NAME;
/** products[].product_classes[].price の期待値（SEED既知レコード）。 */
export const EXPECTED_PRICE = process.env.A17_05_EXPECTED_PRICE;
/** products[].product_classes[].stock の期待値（SEED既知レコード）。 */
export const EXPECTED_STOCK = process.env.A17_05_EXPECTED_STOCK;

/** 最大件数の仕様値（集計条件「最大100件で打ち切り」正本md:88／実装 $maxCount=100）。仕様由来オラクル。 */
export const MAX_RESULT_COUNT = 100;

/** 言語コードprefix（カード詳細あり商品）の先頭記号（正本md:74。【JP】等）。 */
export const LANGUAGE_CODE_PREFIX_HEAD = "【";

/** 404失敗応答の message（正本md:124-126「Not Found」）。 */
export const NOT_FOUND_MESSAGE = "Not Found";

/** 成功レスポンスのルート型（正本md:104-120 レスポンス(成功)）。実装付加の count はオラクルにしない（付帯表4#1）。 */
export type ProductSearchSuccessBody = {
  code: number;
  products: unknown[];
};

/** 404失敗レスポンスのルート型（正本md:124-126）。 */
export type ProductSearchErrorBody = {
  code: number;
  message: string;
};
