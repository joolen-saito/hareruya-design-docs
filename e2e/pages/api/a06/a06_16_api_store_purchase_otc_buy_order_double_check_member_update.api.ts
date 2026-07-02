/**
 * a06-16 店頭買取受注_ダブルチェック担当者更新（受注のダブルチェック担当者を設定/更新する更新系PUT API）用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a06_16_api_store_purchase_otc_buy_order_double_check_member_update_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは設計書(a06-16) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形（実DBは呼ばない）。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋DB副作用（承認登録/更新・受注の member_id/update_date）」を仕様由来で判定する。
 *  - 実装の応答書式・項目名（設計 `member_id` ⇔ 実装 `double_check_member_id`＝OtcBuyOrderController.php:239）はオラクルにしない（付帯表4）。
 *  - パス・認証方式（設計 IP制限 ⇔ 実装 JWT firewall app）の差異は付帯表4。認証情報は env で供給し原値はコミットしない。
 */

/**
 * 実効パス組立。由来: `#[Route('/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/doubleCheckMember.json', methods:['PUT'])]`
 *  （OtcBuyOrderController.php:231）＋ `%eccube_api_v1_route%`＝env `ECCUBE_API_V1_ROUTE`（eccube.yaml:55／既定 `api/v1`、実効値は要実機確認）。
 * 設計書 `PUT /api/otcBuyOrder/{id}/doublecheck.json` とは不一致（付帯表4#1）。テストは実効パスへ送信。
 */
export function buildDoubleCheckPath(orderId: string | number): string {
  const base = process.env.A06_16_API_V1_ROUTE || "/api/v1";
  return `${base}/admin/otcBuyOrder/${orderId}/doubleCheckMember.json`;
}

/** ダブルチェック担当者ID（リクエスト項目）。実装は `double_check_member_id`（OtcBuyOrderController.php:239。設計 `member_id` と差異＝付帯表4）。 */
export function buildDoubleCheckForm(memberId: string | number): Record<string, string> {
  const key = process.env.A06_16_MEMBER_PARAM || "double_check_member_id";
  return { [key]: String(memberId) };
}

/** SEED 由来の既知値。 */
export const KNOWN_ORDER_ID = process.env.A06_16_KNOWN_ORDER_ID || "1"; // 既存の店頭買取受注
export const KNOWN_MEMBER_ID = process.env.A06_16_KNOWN_MEMBER_ID || "2"; // ダブルチェック担当に設定可能な会員
export const SAME_MEMBER_ID = process.env.A06_16_SAME_MEMBER_ID || "1"; // 同一メンバー禁止(InvalidMemberAssignmentException)誘発用＝担当者と同一
export const NOT_FOUND_ORDER_ID = process.env.A06_16_NOT_FOUND_ORDER_ID || "99999999"; // 対象なし→404
export const NOT_FOUND_MEMBER_ID = process.env.A06_16_NOT_FOUND_MEMBER_ID || "99999999"; // 会員不存在→404
export const MALFORMED_MEMBER_ID = "abc"; // 形式不正→(int)キャスト→会員find不一致→404

/**
 * 認証ヘッダ。実装は firewall app（JWT・security.yaml）＝認証済必須。設計の認証方式は IP制限で差異（付帯表4）。
 * 拒否時ステータス（IsGrant拒否は403/リダイレクトの可能性）は要実機確認。ヘッダ名/値は env で供給し原値はコミットしない。
 */
export function buildAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {};
  const name = process.env.A06_16_AUTH_HEADER;
  const value = process.env.A06_16_AUTH_VALUE;
  if (name && value) headers[name] = value;
  return { ...headers, ...(extra ?? {}) };
}

/** 不正/欠落した認証（負例）。 */
export function buildInvalidAuthHeaders(): Record<string, string> {
  const name = process.env.A06_16_AUTH_HEADER || "Authorization";
  return { [name]: "Bearer invalid.jwt.token" };
}
