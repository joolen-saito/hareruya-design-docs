/**
 * a02-05 更新商品規格の取得（GET参照系JSON API・期間内更新の商品規格を件数付きで取得）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a02_05_api_product_updated_product_class_e2e_cases.md（付帯表3 SEED）に対応。
 * 本ファイルは設計書(a02-05) 入出力・処理フロー記載のリクエスト仕様のみを最小構成で組む未実行雛形。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋count/result 構造・期間絞り込み・各フィールド値」を仕様由来で判定する。
 *  - 実装の不正日付時404/500・失敗本文形({code,errors})・フィールド綴り(storageCodeId)・stock/price02のint化・在庫取得元はオラクルにしない（付帯表4#2/#4/#7/#9/#10）。
 *  - 既知SEED値・期間は env で供給し、未設定時の既定値は創作値（要実機確認）。
 */

/**
 * 実効パス。
 * 由来: `#[Route(path: '/updateProducts/{strFromDate}/{strToDate}', name: 'updated_product_classes', requirements: ['strFromDate' => '[^./]+', 'strToDate' => '[^./]+'], methods: ['GET'])]`
 *       （src/Eccube/Controller/App/ProductController.php:204）＋ App群 prefix無し（app/config/eccube/routes.yaml:5-7）
 *       ＝実効 `GET /updateProducts/{strFromDate}/{strToDate}`（設計書と一致）。
 */
export const UPDATED_PRODUCTS_PATH_PREFIX = "/updateProducts";

/** GET送信先パスを組み立てる（パス変数 strFromDate・strToDate は設計書 入出力 必須）。 */
export function buildUpdatedProductsPath(strFromDate: string, strToDate: string): string {
  return `${UPDATED_PRODUCTS_PATH_PREFIX}/${strFromDate}/${strToDate}`;
}

/**
 * SEED-A02-05-PRODUCT-INPERIOD で対象規格の update_date を含む有効な期間（YYYY-MM-DD）。
 * 実装は \DateTime::createFromFormat('Y-m-d', ...) で厳密（付帯表4#3）。要実機確認: テスト環境固定値。
 */
export const PERIOD_FROM = process.env.A02_05_PERIOD_FROM || "2020-01-01";
export const PERIOD_TO = process.env.A02_05_PERIOD_TO || "2030-12-31";

/** SEED-A02-05-EMPTY-WINDOW 該当0件の期間（更新実績の無い過去の範囲）。要実機確認。 */
export const EMPTY_FROM = process.env.A02_05_EMPTY_FROM || "1990-01-01";
export const EMPTY_TO = process.env.A02_05_EMPTY_TO || "1990-01-02";

/** 不正な日付値（E2E-A02-05-020〜024。日付として解釈できない値・範囲外日付）。 */
export const INVALID_DATE = "not-a-date";
export const OUT_OF_RANGE_DATE = "2026-13-99";

/**
 * 成功レスポンス result[] の公開I/Fフィールド契約（設計書 正本md:101-124 由来・E2E-A02-05-008）。
 * 綴りは仕様契約どおり（`strageCodeId`）。実装の `storageCodeId` 綴りはオラクルにしない＝付帯表4#7で落ちて検出。
 */
export const UPDATED_PRODUCT_RESULT_FIELDS = [
  "productId",
  "productCode",
  "name",
  "nameEn",
  "descriptionDetail",
  "descriptionDetailEn",
  "statusId",
  "statusName",
  "stock",
  "price02",
  "imageFileName",
  "categoryId",
  "categoryName",
  "strageCodeId",
  "storageCodeName",
  "languageCode",
  "cardsetCode",
  "cardConditionCode",
  "productClassUpdateDate",
  "productUpdateDate",
] as const;

/** 数値文字列(string)契約のフィールド（実装のint化はオラクルにしない＝付帯表4#9）。 */
export const UPDATED_PRODUCT_NUMERIC_STRING_FIELDS = ["stock", "price02"] as const;

/** 認可前提（SEED-A02-05-AUTH）。認可方式は「pf-apiの方針」＝要実機確認（付帯表4#1）。 */
export function buildAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const name = process.env.A02_API_AUTH_HEADER;
  const value = process.env.A02_API_AUTH_VALUE;
  if (name && value) headers[name] = value;
  return headers;
}
