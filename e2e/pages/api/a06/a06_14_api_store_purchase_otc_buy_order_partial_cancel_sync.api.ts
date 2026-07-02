/**
 * a06-14 店頭買取受注_一部キャンセル同期更新（買取明細の一部キャンセルを記録し在庫明細を更新する更新系PUT API）用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a06_14_api_store_purchase_otc_buy_order_partial_cancel_sync_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルはExcel基本設計(a06-14) リクエスト仕様のみを最小構成で組む未実行雛形（実DBは呼ばない）。
 *
 * 重要（付帯表1注・付帯表4）: 本処理は **ec-cube-enterprise に未実装（Ph2）**。
 *  OtcBuyOrderController の実装ルートは otcBuyOrders.json(GET:69)／otcBuyOrder/{id}.json(PUT:129)／freeComment.json(PUT:156)／
 *  status.json(PUT:190)／doubleCheckMember.json(PUT:231)／identification.json(PUT:273) のみで、`partiallyCancelUpdate` ルートは存在しない。
 *  よって送信先パス・認証方式・専用テーブル・処理順序は実装で確定できず、**本機能のAPI/統合ケースは全て `要実機確認: Ph2未実装`＝test.fixme**（spec参照）。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス（成功200・レスポンスデータなし）＋DB副作用（一部キャンセル記録/在庫明細更新）」をExcel設計由来で判定する想定だが、
 *    Ph2未実装のため未実行（fixme）。実装の応答書式・冪等キー・順序解決方式はオラクルにしない（付帯表4#9）。
 */

/**
 * 送信先パス（要実機確認: Ph2未実装）。Excel基本設計のエンドポイント `PUT /api/otcBuyOrder/{id}/partiallyCancelUpdate.json`
 *  （リクエストサンプルURL由来）。ec-cube-enterprise に当ルート無し（OtcBuyOrderController.php:69-273）。env で上書き可能。
 */
export function buildPartialCancelPath(orderId: string | number): string {
  const base = process.env.A06_14_PARTIAL_CANCEL_BASE || "/api";
  return `${base}/otcBuyOrder/${orderId}/partiallyCancelUpdate.json`;
}

/** SEED 由来の既知値（Ph2未実装のため参考値）。 */
export const KNOWN_ORDER_ID = process.env.A06_14_KNOWN_ORDER_ID || "7326";
export const NOT_FOUND_ORDER_ID = process.env.A06_14_NOT_FOUND_ORDER_ID || "99999999";

/**
 * 一部キャンセル明細（Excel リクエストパラメータ）。order_details[].name 必須/最大65535・quantity 必須・price 必須・各数値は整数／
 *  product_class_id・sell_price・section_id は任意（Excel）。実装DTO未実装で検証機構は要実機確認。
 */
export interface OrderDetailInput {
  name?: string;
  quantity?: number;
  price?: number;
  product_class_id?: number;
  sell_price?: number;
  section_id?: number;
}
export function buildPartialCancelPayload(details: OrderDetailInput[]): Record<string, unknown> {
  return { order_details: details };
}

/**
 * 認証ヘッダ（要実機確認: Ph2未実装）。Excel認証方式は IP制限／MTGバイヤーAPI実装パターンは JWT（firewall app）。
 * 当ルート未実装で認証実体は要実機確認。ヘッダ名/値は env で供給し原値はコミットしない。
 */
export function buildAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {};
  const name = process.env.A06_14_AUTH_HEADER;
  const value = process.env.A06_14_AUTH_VALUE;
  if (name && value) headers[name] = value;
  return { ...headers, ...(extra ?? {}) };
}
