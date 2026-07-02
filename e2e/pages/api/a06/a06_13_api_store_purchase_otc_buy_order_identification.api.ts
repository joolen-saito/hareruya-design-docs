/**
 * a06-13 店頭買取受注_本人確認証明書更新（受注に本人確認証明書IDを設定する更新系PUT API）用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a06_13_api_store_purchase_otc_buy_order_identification_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a06-13) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形（実DBは呼ばない）。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋DB副作用（dtb_otc_buy_order の3列）」を仕様由来で判定する。
 *  - 実装の応答本文形（`{code:200}`＝OtcBuyOrderController.php:309）はオラクルにしない。送信先・本文の組立のみ。
 *  - 証明書IDマスタ非存在時の実HTTPステータス（実装404／仕様400）は要実機確認（付帯表4#2）。
 *  - 認証は firewall app（JWT・HS256）＝署名検証の実方式/ヘッダ名は要実機確認。認証情報は env で供給し原値はコミットしない。
 */

/**
 * 実効パス組立。由来: `#[Route('/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/identification.json', methods:['PUT'])]`
 *  （OtcBuyOrderController.php:273）＋ `eccube_api_v1_route` 既定 `api/v1`（eccube.yaml:55）＝実効 `PUT /api/v1/admin/otcBuyOrder/{id}/identification.json`。
 * 正本md `PUT /admin/otcBuyOrder/{id}/identification` は `/api/v1` を欠き不一致（付帯表4#1）。テストは実効パスへ送信。
 */
export function buildIdentificationPath(orderId: string | number): string {
  return `/api/v1/admin/otcBuyOrder/${orderId}/identification.json`;
}

/** 本人確認証明書ID（リクエスト項目）。param名は env で上書き可（既定 `identification`＝入出力「証明書ID」由来）。 */
export function buildIdentificationForm(identificationId: string | number): Record<string, string> {
  const key = process.env.A06_13_IDENTIFICATION_PARAM || "identification";
  return { [key]: String(identificationId) };
}

/** SEED 由来の既知値。 */
export const KNOWN_ORDER_ID = process.env.A06_13_KNOWN_ORDER_ID || "1"; // 既存の店頭買取受注
export const KNOWN_IDENTIFICATION_ID = process.env.A06_13_KNOWN_IDENTIFICATION_ID || "1"; // 証明書IDマスタの実在値
export const NOT_FOUND_ORDER_ID = process.env.A06_13_NOT_FOUND_ORDER_ID || "99999999"; // 対象なし→404
export const NOT_FOUND_IDENTIFICATION_ID = process.env.A06_13_NOT_FOUND_IDENTIFICATION_ID || "99999999"; // 証明書IDマスタ非存在

/**
 * 認証ヘッダ。実装は firewall app（pattern ^/api/v1/・access_token・JwtTokenHandler／security.yaml:33-39）＝認証済必須。
 * 署名検証の実方式（HS256）・`jwt-token` ヘッダ名は要実機確認（付帯表4）。ヘッダ名/値は env で供給し原値はコミットしない。
 */
export function buildAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {};
  const name = process.env.A06_13_AUTH_HEADER;
  const value = process.env.A06_13_AUTH_VALUE;
  if (name && value) headers[name] = value;
  return { ...headers, ...(extra ?? {}) };
}

/** 不正/欠落した認証（署名不正・ヘッダ欠落の負例）。 */
export function buildInvalidAuthHeaders(): Record<string, string> {
  const name = process.env.A06_13_AUTH_HEADER || "Authorization";
  return { [name]: "Bearer invalid.jwt.token" };
}
