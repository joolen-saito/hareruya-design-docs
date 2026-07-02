/**
 * a06-12 店頭仕入_定額部門取得（定額部門IDの設定値JSONを返すパラメータなし参照系GET API）用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a06_12_api_store_purchase_fixed_price_section_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a06-12) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形（実DBは呼ばない）。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス」を仕様由来で判定する（成功＝200）。
 *  - 実装のレスポンス契約（`JsonResponse($value)`＝OptionController.php:59）・設定無し時挙動はオラクルにしない（付帯表4）。
 *  - 認可方式（公開/IP制限/認証）は設計書から確定できず要実機確認（付帯表4）。認証情報は env で供給し原値はコミットしない。
 */

/**
 * 実効パス。由来: `#[Route('/%eccube_api_v1_route%/admin/fixedPriceSection.json', methods:['GET'])]`（OptionController.php:50）。
 *  `%eccube_api_v1_route%` は env `ECCUBE_API_V1_ROUTE`（eccube.yaml:55／既定 `api/v1`）。具体プレフィクスは要実機確認のため env で上書き可能にする。
 * 取得は `mtbOptionRepository->findOneBy(['option_key'=>MtbOption::FIXED_PRICE_SECTION])`（OptionController.php:53-55、
 *  option_key='fixed_price_section'＝MtbOption.php:31）→ `getOptionValue() ?? ''`（:57）→ `JsonResponse($value)`（:59）。
 */
export const FIXED_PRICE_SECTION_PATH =
  process.env.A06_12_FIXED_PRICE_SECTION_PATH || "/api/v1/admin/fixedPriceSection.json";

/** 想定外/異常クエリ（パラメータ非参照＝OptionController は request パラメータを使わない）。 */
export const UNEXPECTED_QUERY = { unexpected: "x" } as Record<string, string>;

/**
 * 認証ヘッダ。実装は `IsGranted('IS_AUTHENTICATED_FULLY')`（OptionController.php:25）＝認証済必須だが、
 * 設計の認可方式は pf-api 方針で未確定＝要実機確認。ヘッダ名/値は env で供給し原値はコミットしない。
 */
export function buildAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {};
  const name = process.env.A06_12_AUTH_HEADER;
  const value = process.env.A06_12_AUTH_VALUE;
  if (name && value) headers[name] = value;
  return { ...headers, ...(extra ?? {}) };
}
