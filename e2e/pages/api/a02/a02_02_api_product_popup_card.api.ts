/**
 * a02-02 ポップアップ用カード情報取得（GET参照系JSON API）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a02_02_api_product_popup_card_e2e_cases.md（付帯表3 SEED）に対応。
 * 本ファイルは設計書(a02-02) 入出力・処理フロー記載のリクエスト仕様のみを最小構成で組む未実行雛形。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋レスポンス構造/型/値」を仕様由来で判定する。
 *  - 実装の応答型(int化)・追加フィールド(productUrl)・404本文形({code,errors})・言語フォールバックはオラクルにしない（付帯表4#2/#4/#5/#10）。
 *  - 既知SEED値は env で供給し、未設定時の既定値は創作値（要実機確認）。
 */

/**
 * 実効パス。
 * 由来: `#[Route(path: '/api/popup/card/{lang}/{cardId}', name: 'popup_product_by_card_id', methods: ['GET'])]`
 *       （src/Eccube/Controller/App/ProductController.php:265）＋ App群 prefix無し（app/config/eccube/routes.yaml:5-7）
 *       ＝実効 `GET /api/popup/card/{lang}/{cardId}`。
 * 設計書パス `/popup/card/...` とは `/api` 接頭辞の有無で不一致（付帯表4#1）。
 */
export const POPUP_CARD_PATH_PREFIX = "/api/popup/card";

export const LANG_JP = "jp";
export const LANG_EN = "en";

/** GET送信先パスを組み立てる（パス変数 lang・cardId は設計書 入出力 必須）。 */
export function buildPopupCardPath(lang: string, cardId: string | number): string {
  return `${POPUP_CARD_PATH_PREFIX}/${lang}/${cardId}`;
}

/** SEED-A02-02-CARD-PRODUCT 既知の実在カードID（要実機確認: テスト環境固定値）。 */
export const KNOWN_CARD_ID = process.env.A02_02_KNOWN_CARD_ID || "1"; // 要実機確認: SEEDカードID

/** SEED-A02-02-NONE 該当なしカードID（存在しないID＝後始末不要）。054 は integer 型上限付近の境界値。 */
export const NONE_CARD_ID = process.env.A02_02_NONE_CARD_ID || "999999999";
export const BOUNDARY_CARD_ID = process.env.A02_02_BOUNDARY_CARD_ID || "2147483647";

/**
 * 成功レスポンスの仕様フィールド契約（設計書 入出力 レスポンス(成功)由来・E2E-A02-02-009）。
 * price01/price02/stock/weeklySold は数値文字列(string)＝付帯表4#10。
 */
export const POPUP_CARD_SUCCESS_FIELDS = [
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
  "beltUrl",
  "weeklySold",
] as const;

/** 数値文字列(string)契約のフィールド（実装の int 化はオラクルにしない＝付帯表4#10）。 */
export const POPUP_CARD_NUMERIC_STRING_FIELDS = ["price01", "price02", "stock", "weeklySold"] as const;

export const UNKNOWN_QUERY_PARAMS: Record<string, string> = { unknownField: "x", foo: "1" };

/** API認可資格情報（SEED-A02-02-AUTHZ）。認可方式は「pf-apiの方針」＝要実機確認（付帯表4#8）。 */
export function buildAuthzHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const name = process.env.A02_API_AUTH_HEADER;
  const value = process.env.A02_API_AUTH_VALUE;
  if (name && value) headers[name] = value;
  return headers;
}
