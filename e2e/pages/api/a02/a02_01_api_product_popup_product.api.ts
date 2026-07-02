/**
 * a02-01 ポップアップ用商品情報取得（GET参照系JSON API）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a02_01_api_product_popup_product_e2e_cases.md（付帯表3 SEED）に対応。
 * 本ファイルは設計書(a02-01) 入出力・処理フロー記載のリクエスト仕様のみを最小構成で組む未実行雛形。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋レスポンス構造/型/値」を仕様由来で判定する。本ファイルは送信パラメータと既知期待値の組立のみ。
 *  - 実装の応答型(int化等)・追加フィールド(productUrl)・404本文形({code,errors})はオラクルにしない（付帯表4#3/#6/#7/#8）。
 *  - 既知SEED値は env で供給し、未設定時の既定値は創作値（要実機確認）。
 */

/**
 * 実効パス。
 * 由来: `#[Route(path: '/api/popup/product/{lang}/{productId}', name: 'popup_product_by_product_id', methods: ['GET'])]`
 *       （src/Eccube/Controller/App/ProductController.php:150-151）＋ App群 prefix無し（app/config/eccube/routes.yaml:5-6）
 *       ＝実効 `GET /api/popup/product/{lang}/{productId}`。
 * 設計書パス `/popup/product/...` とは `/api` 接頭辞の有無で不一致（付帯表4#1）。テストは実効パスへ送信し差異は付帯表で管理。
 */
export const POPUP_PRODUCT_PATH_PREFIX = "/api/popup/product";

/** 言語コード（設計書 入出力 lang「jpまたはen」由来。実装は `ja`/`en` 受理＝付帯表4#4）。 */
export const LANG_JP = "jp";
export const LANG_EN = "en";

/** GET送信先パスを組み立てる（パス変数 lang・productId は設計書 入出力 必須）。 */
export function buildPopupProductPath(lang: string, productId: string | number): string {
  return `${POPUP_PRODUCT_PATH_PREFIX}/${lang}/${productId}`;
}

/** SEED-A02-01-PRODUCT-KNOWN 既知の実在商品ID（要実機確認: テスト環境固定値を env で供給）。 */
export const KNOWN_PRODUCT_ID = process.env.A02_01_KNOWN_PRODUCT_ID || "1"; // 要実機確認: SEED商品ID

/** SEED-A02-01-PRODUCT-NONE 該当なし商品ID（存在しないIDを使う＝後始末不要）。 */
export const NONE_PRODUCT_ID = process.env.A02_01_NONE_PRODUCT_ID || "999999999";

/**
 * 成功レスポンスの仕様フィールド契約（設計書 入出力 レスポンス(成功)由来・E2E-A02-01-006）。
 * price01/price02/stock/weeklySold は数値文字列(string)、productId/productClassId は integer、
 * foilFlg は boolean、subFileName/fileName は string|null（付帯表4#6/#7）。
 */
export const POPUP_PRODUCT_SUCCESS_FIELDS = [
  "productId",
  "name",
  "productClassId",
  "price01",
  "price02",
  "stock",
  "nameEn",
  "subFileName",
  "fileName",
  "code",
  "conditionCode",
  "foilFlg",
  "weeklySold",
] as const;

/** 仕様の型契約（数値文字列＝string。実装の int 化はオラクルにしない＝付帯表4#7）。 */
export const POPUP_PRODUCT_FIELD_TYPES: Record<string, "string" | "number" | "boolean" | "string|null"> = {
  productId: "number",
  name: "string",
  productClassId: "number",
  price01: "string",
  price02: "string",
  stock: "string",
  nameEn: "string",
  subFileName: "string|null",
  fileName: "string|null",
  code: "string",
  conditionCode: "string",
  foilFlg: "boolean",
  weeklySold: "string",
};

/**
 * 想定外クエリ項目（E2E-A02-01-014・要実機確認）。未知クエリの扱いは正本に明記が無く期待値を固定しない。
 */
export const UNKNOWN_QUERY_PARAMS: Record<string, string> = { unknownField: "x", foo: "1" };

/**
 * API資格情報ヘッダ（SEED-A02-01-API-ACCESS）。
 * 認可方式は設計書「pf-apiの方針に従う」＝未確定（付帯表4#2）。env があれば付与し、原値はコミットしない。
 */
export function buildApiAccessHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const name = process.env.A02_API_AUTH_HEADER; // 要実機確認: 認可ヘッダ名
  const value = process.env.A02_API_AUTH_VALUE;
  if (name && value) headers[name] = value;
  return headers;
}
