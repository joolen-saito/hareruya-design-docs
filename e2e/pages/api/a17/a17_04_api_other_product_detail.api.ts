/**
 * a17-04 商品詳細取得（GET参照系JSON API）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a17_04_api_other_product_detail_e2e_cases.md（付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a17-04) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形（コンパイル確認のみ）。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋応答本文の構造/型/既知値」を仕様由来で判定する（オラクル独立性）。
 *  - 404本文形（付帯表4#3）・週間販売数の集計定義（付帯表4#4）・表示下限値（付帯表4#6）は要確認。
 *  - 型不正・不正パラメータ時の具体ステータス（付帯表4#5）は固定せず「正常取得200とならない」で判定。
 *  - 認可方式（付帯表4#2）は仕様未確定（資格情報ケースは手動）。既知SEED値・期待値は env で供給し未設定時は創作既定値（要実機確認）。
 */

/**
 * 実効パスを組む。由来: `#[Route(path: '/api/product/detail/{productId}', requirements: ['productId' => '\\d+'], methods: ['GET'])]`（ProductController.php:50）。
 * 設計書パス `/product/detail/{productId}` と実装 `/api/product/detail/{productId}` は `/api` プレフィクスで不一致（付帯表4#1）。送信先は実効パスへ統一。
 */
export function buildDetailPath(productId: string | number): string {
  return `/api/product/detail/${productId}`;
}

/** 拡張子あり別名パス（.json／同一handler・ProductController.php:51）。 */
export function buildDetailJsonPath(productId: string | number): string {
  return `/api/product/detail/${productId}.json`;
}

/** productId 欠落パス（E2E-A17-04-007）。ルート不一致/404等の具体ステータスは要実機確認。 */
export const MISSING_PRODUCT_ID_PATH = "/api/product/detail/";

/** lang クエリ（任意・空時JP＝ProductController.php:54-57）。 */
export function buildLangQuery(lang: string): Record<string, string> {
  return { lang };
}

/** 想定外クエリ項目（E2E-A17-04-006）。パス変数・lang のみ参照（ProductController.php:50-54）。 */
export const UNKNOWN_QUERY_PARAMS: Record<string, string> = { unknownField: "x", foo: "1" };

/** 既定言語（処理フロー#1・データ整合性「未指定時は日本語(JP)」）。仕様由来オラクル。 */
export const DEFAULT_LANG = "JP";

// ===== SEED-A17-04-*。env で供給し、未設定時は要実機確認の創作既定値 =====

/** SEED-A17-04-PRODUCT-KNOWN 実在商品ID（E2E-A17-04-001 ほか）。 */
export const KNOWN_PRODUCT_ID = process.env.A17_04_KNOWN_PRODUCT_ID || "要実機確認-既知productId";
/** SEED-A17-04-CARD カード商品ID（言語コードprefix・card_detail・null許容・E2E-A17-04-031/037）。 */
export const CARD_PRODUCT_ID = process.env.A17_04_CARD_PRODUCT_ID || "要実機確認-カード商品productId";
/** SEED-A17-04-NONCARD 非カード商品ID（card_detail null・E2E-A17-04-032）。 */
export const NONCARD_PRODUCT_ID = process.env.A17_04_NONCARD_PRODUCT_ID || "要実機確認-非カード商品productId";
/** SEED-A17-04-COND NM/表示下限境界の商品ID（E2E-A17-04-034。下限値は付帯表4#6）。 */
export const COND_PRODUCT_ID = process.env.A17_04_COND_PRODUCT_ID || "要実機確認-表示条件商品productId";
/** SEED-A17-04-NONE 商品詳細が紐づかない未登録 productId（E2E-A17-04-009/011/012）。 */
export const NONE_PRODUCT_ID = process.env.A17_04_NONE_PRODUCT_ID || "999999999";

// ===== 不正 productId（仕様の404は該当なしのみ。「正常取得200とならない」を判定。具体ステータスは要実機確認） =====

/** 0 の productId（ルート一致後 findProductById で空＝404該当なし・E2E-A17-04-005）。 */
export const ZERO_PRODUCT_ID = "0";
/** 負値の productId（ルート要件 `\\d+` 不一致・E2E-A17-04-005/015）。 */
export const NEGATIVE_PRODUCT_ID = "-1";
/** 非数値（型不正）の productId（ルート要件不一致・E2E-A17-04-039）。 */
export const NON_NUMERIC_PRODUCT_ID = "abc";

// ===== 既知レコード期待値（E2E-A17-04-002 値照合 ほか）。env 供給。未設定なら値照合はスキップ＝要実機確認 =====

/** weekly_sold の期待値（各商品規格の数量合算・E2E-A17-04-033。集計定義は付帯表4#4）。 */
export const EXPECTED_WEEKLY_SOLD = process.env.A17_04_EXPECTED_WEEKLY_SOLD;
/** price の期待値（再計算/丸めなし確認・E2E-A17-04-002）。 */
export const EXPECTED_PRICE = process.env.A17_04_EXPECTED_PRICE;
/** stock の期待値（再計算/丸めなし確認・E2E-A17-04-002）。 */
export const EXPECTED_STOCK = process.env.A17_04_EXPECTED_STOCK;

/** カード商品の商品名先頭に付く言語コードprefix（処理フロー#3「【JP】」始まり）。仕様由来オラクル。 */
export const LANGUAGE_CODE_PREFIX_HEAD = "【";

/** 404失敗応答の message（正本md レスポンス(失敗)「Not Found」。本文形は付帯表4#3 でオラクルに固定しない）。 */
export const NOT_FOUND_MESSAGE = "Not Found";

/** 成功レスポンス ルートフィールド（正本md 入出力 レスポンス(成功)）。 */
export const ROOT_FIELDS = [
  "code",
  "weekly_sold",
  "product_id",
  "product_name",
  "language_code",
  "description_detail",
  "categories",
  "region_restriction",
  "card_detail",
  "product_classes",
] as const;

/** 商品規格要素フィールド（正本md product_classes[]）。 */
export const PRODUCT_CLASS_FIELDS = [
  "product_class_id",
  "product_code",
  "high_price_code",
  "card_condition_code",
  "price",
  "sale_limit",
  "stock",
  "product_class_images",
] as const;

/** 成功レスポンス型（正本md 入出力 レスポンス(成功)）。 */
export type ProductDetailSuccessBody = {
  code: number;
  weekly_sold: number;
  product_id: number;
  product_name: string;
  language_code: string;
  description_detail: string;
  categories: unknown[];
  region_restriction: string;
  card_detail: Record<string, unknown> | null;
  product_classes: Record<string, unknown>[];
};

/** 失敗レスポンス型（正本md レスポンス(失敗)）。 */
export type ProductDetailErrorBody = {
  code: number;
  message?: string;
};
