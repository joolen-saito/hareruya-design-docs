/**
 * a05-02 受注_直接印刷（GetRequest/SetResponse の異常系・境界・認証・帳票観測）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a05_02_api_order_print_direct_e2e_cases.md（付帯表3 SEED / 付帯表4 要確認）に対応。
 * a05-01 と同一エンドポイント `POST /api/order/prints/direct/{base_info_id}` を対象とする未実行雛形。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋Content-Type＋応答本体(空)＋受注ステータス/フラグの副作用」を仕様由来で判定する。
 *  - 不一致時の HTTP400+text/plain（付帯表4#3）・印刷ログ未実装（付帯表4#4）はオラクルにしない。本ファイルは送信データの組立のみ。
 *  - ResponseFile XML のキー名・属性・受注ID抽出規則は実装由来で固定しない（SEED注記＝要実機確認）。
 */

/** 実効パス（OrderController.php:43）。設計書パス `/order/print/direct` とは不一致（付帯表4#1/#2）。 */
export const ORDER_DIRECT_PRINT_PATH_PREFIX = "/api/order/prints/direct";

/** 設計書パス（利用者視点の入口）。E2E-A05-02-007 のメソッド乖離検出（GET送信）でのみ用いる。 */
export const DESIGN_ORDER_DIRECT_PRINT_PATH = "/order/print/direct";

export function buildDirectPrintPath(baseInfoId: string | number): string {
  return `${ORDER_DIRECT_PRINT_PATH_PREFIX}/${baseInfoId}`;
}

/** SEED-A05-02-BASEINFO 本店/支店の base_info_id（要実機確認: env で供給）。 */
export const BASE_INFO_ID = process.env.A05_BASE_INFO_ID || "1";

export const CONNECTION_TYPE_GET = "GetRequest";
export const CONNECTION_TYPE_SET = "SetResponse";

/** SEED-A05-02-ORDER-TARGET 更新対象の既知受注ID（printjobid 先頭部＝受注ID。要実機確認）。 */
export const TARGET_ORDER_ID = process.env.A05_02_TARGET_ORDER_ID || "1";
/** 存在しない受注ID（スキップされる＝後始末不要）。 */
export const UNKNOWN_ORDER_ID = process.env.A05_02_UNKNOWN_ORDER_ID || "999999999";

export function buildGetRequestBody(extra?: Record<string, unknown>): Record<string, unknown> {
  return { ConnectionType: CONNECTION_TYPE_GET, ...(extra ?? {}) };
}

export function buildSetResponseBody(responseFile: string): Record<string, unknown> {
  return { ConnectionType: CONNECTION_TYPE_SET, ResponseFile: responseFile };
}

/** ConnectionType を想定外値にしたボディ（E2E-A05-02-031）。 */
export function buildUnknownConnectionTypeBody(extra?: Record<string, unknown>): Record<string, unknown> {
  return { ConnectionType: "Unknown", foo: "x", ...(extra ?? {}) };
}

/** ResponseFile XML（正常）。schema は要実機確認・env 上書き想定（UpdatePrintedOrderStatusAction.php:79 で printjobid 先頭部＝受注ID）。 */
export function buildValidResponseFileXml(orderId: string | number = TARGET_ORDER_ID): string {
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

/** ResponseFile XML（解析失敗）＝不正XML（E2E-A05-02-020）。 */
export const MALFORMED_RESPONSE_FILE_XML = "<PrintResponseInfo><ServerDirectPrint>true";

/** ResponseFile XML（直接印刷結果=偽。E2E-A05-02-021）。 */
export function buildServerDirectPrintFalseXml(): string {
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    "<PrintResponseInfo>",
    "  <ServerDirectPrint>false</ServerDirectPrint>",
    "</PrintResponseInfo>",
  ].join("\n");
}

/** ResponseFile XML（印刷結果要素0件。E2E-A05-02-022）。 */
export function buildNoEposPrintXml(): string {
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    "<PrintResponseInfo>",
    "  <ServerDirectPrint>true</ServerDirectPrint>",
    "</PrintResponseInfo>",
  ].join("\n");
}

/** ResponseFile XML（受注不存在＝スキップ。E2E-A05-02-023）。 */
export function buildUnknownOrderResponseFileXml(unknownOrderId: string | number = UNKNOWN_ORDER_ID): string {
  return buildValidResponseFileXml(unknownOrderId);
}

/** ResponseFile XML（存在＋不存在の混在＝存在分は継続更新。E2E-A05-02-024）。 */
export function buildMixedOrderResponseFileXml(
  knownOrderId: string | number = TARGET_ORDER_ID,
  unknownOrderId: string | number = UNKNOWN_ORDER_ID
): string {
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    "<PrintResponseInfo>",
    "  <ServerDirectPrint>true</ServerDirectPrint>",
    "  <ePOSPrint>",
    `    <response printjobid="${unknownOrderId}_1" success="true"/>`,
    `    <response printjobid="${knownOrderId}_1" success="true"/>`,
    "  </ePOSPrint>",
    "</PrintResponseInfo>",
  ].join("\n");
}
