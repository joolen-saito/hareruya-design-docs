/**
 * a02-04 ポップアップ用カード情報取得(旧)（GET参照系JSON API・言語付き旧商品ID）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a02_04_api_product_popup_card_old_e2e_cases.md（付帯表3 SEED）に対応。
 * 本ファイルは設計書(a02-04) 入出力・処理フロー記載のリクエスト仕様のみを最小構成で組む未実行雛形。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋レスポンス構造/型/値」を仕様由来で判定する。
 *  - 実装の応答型(int化)・追加フィールド・404本文形({code,errors})・言語フォールバック(jp→EN)はオラクルにしない（付帯表4#1/#2/#3）。
 *  - 既知SEED値は env で供給し、未設定時の既定値は創作値（要実機確認）。
 */

/**
 * 実効パス。
 * 由来: `#[Route(path: '/popup/old/{lang}/{oldProductId}', name: 'popup_product_by_old_product_id', requirements: ['oldProductId' => '[^./]+'], methods: ['GET'])]`
 *       （src/Eccube/Controller/App/ProductController.php:361）＋ App群 prefix無し（app/config/eccube/routes.yaml:6）
 *       ＝実効 `GET /popup/old/{lang}/{oldProductId}`（設計書と一致）。
 */
export const POPUP_CARD_OLD_PATH_PREFIX = "/popup/old";

export const LANG_JP = "jp";
export const LANG_EN = "en";

/** GET送信先パスを組み立てる（パス変数 lang・oldProductId は設計書 入出力 必須）。 */
export function buildPopupCardOldPath(lang: string, oldProductId: string | number): string {
  return `${POPUP_CARD_OLD_PATH_PREFIX}/${lang}/${oldProductId}`;
}

/** SEED-A02-04-PRODUCT-JP 既知の旧商品ID（日本語）。要実機確認: テスト環境固定値。 */
export const KNOWN_OLD_PRODUCT_ID_JP = process.env.A02_04_OLD_PRODUCT_ID_JP || "1";

/** SEED-A02-04-PRODUCT-EN 既知の旧英語商品ID。要実機確認: テスト環境固定値。 */
export const KNOWN_OLD_PRODUCT_ID_EN = process.env.A02_04_OLD_PRODUCT_ID_EN || "1";

/** SEED-A02-04-NOTFOUND 該当なし旧商品ID（存在しないID＝後始末不要）。 */
export const NONE_OLD_PRODUCT_ID = process.env.A02_04_NONE_OLD_PRODUCT_ID || "999999999";

/**
 * 成功レスポンスの仕様フィールド（設計書 入出力 レスポンス(成功)由来・E2E-A02-04-007）。
 * price01/price02/stock/weeklySold は数値文字列(string)、subFileName/fileName は string|null（付帯表4#3）。
 */
export const POPUP_CARD_OLD_SUCCESS_FIELDS = [
  "productId",
  "name",
  "productClassId",
  "price01",
  "price02",
  "stock",
  "nameEn",
  "subFileName",
  "fileName",
  "weeklySold",
] as const;

/** 数値文字列(string)契約のフィールド（実装のint化はオラクルにしない＝付帯表4#3）。 */
export const POPUP_CARD_OLD_NUMERIC_STRING_FIELDS = ["price01", "price02", "stock", "weeklySold"] as const;

export const UNKNOWN_QUERY_PARAMS: Record<string, string> = { unknownField: "x", foo: "1" };

/** 異常な oldProductId 値（非整数）。E2E-A02-04-014（該当なし扱い）。 */
export const INVALID_OLD_PRODUCT_ID = "abc";

/** 呼び出し元の認可資格情報（SEED-A02-04-AUTH）。認可方式は要実機確認（付帯表4#4）。 */
export function buildAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const name = process.env.A02_API_AUTH_HEADER;
  const value = process.env.A02_API_AUTH_VALUE;
  if (name && value) headers[name] = value;
  return headers;
}
