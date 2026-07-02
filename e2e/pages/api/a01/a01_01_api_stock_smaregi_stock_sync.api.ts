/**
 * a01-01 スマレジ連携処理（Webhook受信→在庫更新）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a01_01_api_stock_smaregi_stock_sync_e2e_cases.md（付帯表3 SEED-A01-01-PAYLOAD）に対応。
 * 本ファイルは設計書(a01-01) 1-1 A「受信データ」記載フィールドのみを最小構成で組む未実行雛形。
 * スマレジ実環境（外部POS）・取引詳細取得API(C) は呼び出さない（実連携は手動/要実機=060/061/062）。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋在庫副作用」を仕様由来で判定する。本ファイルは送信データのみ。
 *  - 実装が返すJSON本文（{status:...}）はオラクルにしない（設計レスポンス書式「なし(ステータスコードのみ)」／付帯表4#3）。
 */

/**
 * Webhook受信エンドポイント実効パス。
 * 由来: prefix `/%eccube_smaregi_webhook_route%`（app/config/eccube/routes.yaml:12）
 *       ＋ `#[Route('', name: 'smaregi_webhook', methods: ['POST'])]`（src/Eccube/Controller/Smaregi/WebhookController.php:41）
 *       ＋ 既定値 `smaregi/webhook`（app/config/eccube/packages/eccube.yaml:7,56）＝実効 `POST /smaregi/webhook/`。
 * 設計書のエンドポイント `POST /smaregi/stocks`（Excel抽出）と実装パスは不一致（付帯表4#1・不具合候補）。
 * テストは実在経路へ届くよう実装の実効パスへ送信し、差異はケース表 付帯表4 で一元管理する。
 */
export const SMAREGI_WEBHOOK_PATH = "/smaregi/webhook/";

/** スマレジ在庫区分（設計書 a01-01 1-2 由来）。02=売上（出庫=減算）、12=返品（入庫=加算）、それ以外は無視。 */
export type SmaregiTransactionType = "02" | "12";

/** 受信データ項目（設計書1-1 A）。ids 配列の各要素は [在庫変動履歴ID, 商品ID, 店舗ID] を持つとされるが、
 *  正確な構造は設計書に明記が無く要実機確認。本雛形は最小オブジェクトで表現する（創作値は env / 既定の合成値）。 */
export interface StockWebhookId {
  stockChangeHistoryId: string; // スマレジ在庫変動履歴ID（連携元ID。設計書1-1 A）
  productId: string;            // スマレジ商品ID（設計書1-1 A）
  storeId: string;              // スマレジ店舗ID（設計書1-1 A）
}

export interface BuildStockWebhookPayloadOptions {
  transactionType: SmaregiTransactionType;
  /** 契約ID（設計書1-1 A・必須）。テスト環境固定値を env で供給。 */
  contractId?: string;
  /** イベント名（設計書1-1 A）。スマレジ POS 取引イベント。既定 `pos:transactions`。 */
  event?: string;
  /** アクション（設計書1-1 A）。既定 `edited`（一括は `bulk-update` 等。設計書記載値のみ）。 */
  action?: string;
  /** 在庫変動履歴IDリスト（設計書1-1 A）。空配列は「対象なし」（E2E-A01-01-015）。 */
  ids?: StockWebhookId[];
  /** 想定外項目テスト（E2E-A01-01-014）用に未知フィールドを追加する。 */
  extra?: Record<string, unknown>;
}

const DEFAULT_CONTRACT_ID = process.env.SMAREGI_CONTRACT_ID || "TEST_CONTRACT_ID"; // 要実機確認: 実値はテスト環境固定

/** 設計書1-1 A の既定 ids（合成値・要実機確認: スマレジ側ID⇔EC-CUBE規格の紐づけは SEED-A01-01-STOCK-KNOWN）。 */
function defaultIds(): StockWebhookId[] {
  return [
    {
      stockChangeHistoryId: process.env.SMAREGI_STOCK_HISTORY_ID || "1", // 要実機確認: SEED連携元ID
      productId: process.env.SMAREGI_PRODUCT_ID || "1",                  // 要実機確認: SEED商品ID
      storeId: process.env.SMAREGI_STORE_ID || "1",                      // 要実機確認: SEED店舗ID
    },
  ];
}

/**
 * 設計書1-1 A の受信データ記載フィールドのみで最小ペイロードを組む。
 * transactionType（02/12）は設計書1-2 で「取引詳細取得(C)で判定」とも読めるため、受信ペイロードに含めるか否かは要実機確認。
 * 本雛形は 02/12 のバリエーション駆動のため `transactionType` を保持する（実機での所在は要実機確認）。
 */
export function buildStockWebhookPayload(opts: BuildStockWebhookPayloadOptions): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    contractId: opts.contractId ?? DEFAULT_CONTRACT_ID, // 設計書1-1 A 必須
    event: opts.event ?? "pos:transactions",            // 設計書1-1 A
    action: opts.action ?? "edited",                    // 設計書1-1 A
    ids: opts.ids ?? defaultIds(),                      // 設計書1-1 A（空配列＝対象なし）
    transactionType: opts.transactionType,              // 要実機確認: 受信ペイロード所在（設計書1-2は取引詳細由来とも読める）
  };
  if (opts.extra) {
    Object.assign(payload, opts.extra); // 想定外項目（E2E-A01-01-014）
  }
  return payload;
}

/** 必須項目（contractId/event/action/ids のいずれか）を欠落させたペイロード（E2E-A01-01-012）。 */
export function buildMissingFieldPayload(
  omit: "contractId" | "event" | "action" | "ids",
  base: BuildStockWebhookPayloadOptions = { transactionType: "02" }
): Record<string, unknown> {
  const payload = buildStockWebhookPayload(base);
  delete payload[omit];
  return payload;
}

/** 異常なパラメータ値（型不正・範囲外）を含むペイロード（E2E-A01-01-013）。 */
export function buildInvalidValuePayload(): Record<string, unknown> {
  return {
    contractId: 12345,           // 型不正（数値）
    event: ["pos:transactions"], // 型不正（配列）
    action: null,                // 不正値
    ids: "not-an-array",         // 型不正（文字列）
    transactionType: "99",       // 範囲外（02/12以外）
  };
}

/** 形式不正（JSON不正）リクエスト本文の生文字列（E2E-A01-01-024）。 */
export const MALFORMED_JSON_BODY = '{"contractId": "x", "event": '; // 途中で切れた不正JSON

/**
 * スマレジ受信ヘッダ。実装は `smaregi-event-id` を必須・冪等キーにするが、
 * 設計書1-1 A の受信データ項目に当該ヘッダ／冪等キーの記載が無く要実機確認（付帯表4#7）。
 * 認証資格情報（IP/署名/ヘッダのいずれか）も要実機確認（付帯表4#2）。env で供給し原値はコミットしない。
 * @param eventId 冪等判定用イベントID（同値なら重複扱い。冪等性テスト 028/031 で固定値を再送）。
 */
export function buildSmaregiHeaders(eventId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  // 冪等キー（要実機確認: 設計の受信項目ではない）。未指定なら毎回ユニーク。
  headers["smaregi-event-id"] = eventId ?? `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  // 認証資格情報（要実機確認: 照合方式）。env があれば付与する。
  const authHeaderName = process.env.SMAREGI_WEBHOOK_AUTH_HEADER; // 例: 署名ヘッダ名（要実機確認）
  const authHeaderValue = process.env.SMAREGI_WEBHOOK_AUTH_VALUE;
  if (authHeaderName && authHeaderValue) {
    headers[authHeaderName] = authHeaderValue;
  }
  return headers;
}
