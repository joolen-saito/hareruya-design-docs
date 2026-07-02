/**
 * a05-01 受注_直接印刷（GetRequest=印刷情報生成 / SetResponse=ステータス更新）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a05_01_api_order_print_direct_e2e_cases.md（付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは設計書(a05-01) 入出力・処理フロー記載のリクエスト仕様のみを最小構成で組む未実行雛形。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋Content-Type＋応答本体(XML/空)＋受注ステータスの副作用」を仕様由来で判定する。
 *  - 実装の応答形（HTTP400+text/plain 等）はオラクルにしない（付帯表4#5）。本ファイルは送信データの組立のみ。
 *  - ResponseFile XML のキー名・属性・受注ID抽出規則は実装由来で固定しない（SEED注記＝要実機確認）。env で上書き可能とする。
 */

/**
 * 実効パス。
 * 由来: `#[Route(path: '/api/order/prints/direct/{base_info_id}', name: 'order_direct_print',
 *        requirements: ['base_info_id' => '\d+'], methods: ['POST'])]`（OrderController.php:43）。
 * 設計書パス `GET/POST /order/print/direct` とは `/api` 接頭辞・`prints` 複数形・`base_info_id` 必須パスパラメータ・POST限定で不一致（付帯表4#1/#2）。
 * テストは実装の実効パスへ送信し、差異はケース表 付帯表4 で一元管理する。
 */
export const ORDER_DIRECT_PRINT_PATH_PREFIX = "/api/order/prints/direct";

/** POST送信先パスを組み立てる（base_info_id は本店/支店判定の必須パスパラメータ＝OrderController.php:44）。 */
export function buildDirectPrintPath(baseInfoId: string | number): string {
  return `${ORDER_DIRECT_PRINT_PATH_PREFIX}/${baseInfoId}`;
}

/** SEED-A05-01-BASEINFO 本店/支店の base_info_id（要実機確認: テスト環境固定値を env で供給）。 */
export const BASE_INFO_ID = process.env.A05_BASE_INFO_ID || "1"; // 要実機確認: 本店/支店の採番元（付帯表4#2）

/** ConnectionType 値（OrderController.php:46-48,76 で GetRequest/SetResponse を分岐）。 */
export const CONNECTION_TYPE_GET = "GetRequest";
export const CONNECTION_TYPE_SET = "SetResponse";

/** SEED-A05-01-RESPONSEFILE 既知受注ID（SetResponse の printjobid 先頭部＝受注ID。要実機確認: env で供給）。 */
export const KNOWN_ORDER_ID = process.env.A05_01_KNOWN_ORDER_ID || "1"; // 要実機確認: 更新前ステータス既知の受注ID
/** 存在しない受注ID（SetResponse でスキップされる＝後始末不要）。 */
export const UNKNOWN_ORDER_ID = process.env.A05_01_UNKNOWN_ORDER_ID || "999999999";

/** GetRequest 送信ボディ（ConnectionType=GetRequest）。想定外項目テスト(053)用に extra を許容。 */
export function buildGetRequestBody(extra?: Record<string, unknown>): Record<string, unknown> {
  return { ConnectionType: CONNECTION_TYPE_GET, ...(extra ?? {}) };
}

/** SetResponse 送信ボディ（ConnectionType=SetResponse + ResponseFile XML文字列）。 */
export function buildSetResponseBody(responseFile: string): Record<string, unknown> {
  return { ConnectionType: CONNECTION_TYPE_SET, ResponseFile: responseFile };
}

/**
 * ResponseFile XML（正常）。ServerDirectPrint=true・ePOSPrint(printjobid=受注ID先頭部) を1件含む。
 * 受注IDは printjobid の先頭部（`{orderId}_連番`）から抽出される（UpdatePrintedOrderStatusAction.php:79 explode('_')[0]）。
 * XMLスキーマ（要素名・属性）は実装由来で固定せず要実機確認。env 上書き想定。
 */
export function buildValidResponseFileXml(orderId: string | number = KNOWN_ORDER_ID): string {
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    "<PrintResponseInfo>",
    "  <ServerDirectPrint>true</ServerDirectPrint>",
    "  <ePOSPrint>",
    `    <response printjobid="${orderId}_1" success="true"/>`,
    "  </ePOSPrint>",
    "</PrintResponseInfo>",
  ].join("\n");
}

/** ResponseFile XML（解析失敗）＝途中で切れた不正XML（E2E-A05-01-032/038/039）。 */
export const MALFORMED_RESPONSE_FILE_XML = "<PrintResponseInfo><ServerDirectPrint>true"; // 閉じタグ欠落

/** ResponseFile XML（直接印刷結果=偽）＝ServerDirectPrint=false（E2E-A05-01-033）。 */
export function buildServerDirectPrintFalseXml(): string {
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    "<PrintResponseInfo>",
    "  <ServerDirectPrint>false</ServerDirectPrint>",
    "</PrintResponseInfo>",
  ].join("\n");
}

/** ResponseFile XML（印刷結果要素なし）＝ePOSPrint 0件（E2E-A05-01-034）。 */
export function buildNoEposPrintXml(): string {
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    "<PrintResponseInfo>",
    "  <ServerDirectPrint>true</ServerDirectPrint>",
    "</PrintResponseInfo>",
  ].join("\n");
}

/** ResponseFile XML（受注不存在＝printjobid の受注がDBに無い。スキップされる。E2E-A05-01-035）。 */
export function buildUnknownOrderResponseFileXml(unknownOrderId: string | number = UNKNOWN_ORDER_ID): string {
  return buildValidResponseFileXml(unknownOrderId);
}
