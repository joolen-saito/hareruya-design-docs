/**
 * a05-04 スマレジ受信（取引通知Webhook受信→ポイント付与/利用・取消/打消・出荷完了反映）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a05_04_api_order_order_smaregi_receive_e2e_cases.md（付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは設計書(a05-04) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形。スマレジ実環境は呼ばない。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋応答本体＋ポイント残高/履歴/受注ステータスの副作用」を仕様由来で判定する。
 *  - 実装の応答形（{status:ok/error}・非同期投入）はオラクルにしない（付帯表4#3）。本ファイルは送信データの組立のみ。
 *  - 連携用ヘッダ・冪等キーは設計受信項目に明記がなく要実機確認（付帯表4#2/#7）。env で供給し原値はコミットしない。
 */

/**
 * Webhook受信エンドポイント実効パス。
 * 由来: prefix `/%eccube_smaregi_webhook_route%`（routes.yaml:12）＋既定値 `smaregi/webhook`（eccube.yaml:7,56）
 *       ＋ `#[Route('', name: 'smaregi_webhook', methods: ['POST'])]`（WebhookController.php:41）＝実効 `POST /smaregi/webhook/`。
 * 設計書パス `POST /{_locale}/smaregi/transaction` とは不一致（付帯表4#1）。テストは実効パスへ送信し差異を付帯表で管理。
 */
export const SMAREGI_WEBHOOK_PATH = "/smaregi/webhook/";

/** 取引区分（設計書 入出力 由来）。cancel_division=1 で取消、dispose_division=2 で打消、いずれも0で通常取引。 */
export interface TransactionHeadOptions {
  transactionId?: string;   // 取引ID（冪等判定基準＝要実機確認・付帯表4#7）
  smaregiPlayerId?: string;  // スマレジ会員ID（SEED-A05-04-PLAYER-KNOWN）
  cancelDivision?: 0 | 1;    // 取消区分（1=取消）
  disposeDivision?: 0 | 2;   // 打消区分（2=打消）
  issuePoint?: number;       // 付与ポイント
  usePoint?: number;         // 利用ポイント
}

export interface TransactionDetailOptions {
  productCode?: string; // 商品コード（先頭に3桁ゼロ埋め店舗コードを含む。SEED-A05-04-OPTION-STORE）
  quantity?: number;
}

const DEFAULT_PLAYER_ID = process.env.A05_04_SMAREGI_PLAYER_ID || "TEST_PLAYER_ID"; // 要実機確認: SEED会員ID
const DEFAULT_PRODUCT_CODE = process.env.A05_04_PRODUCT_CODE || "001TESTPRODUCT";   // 要実機確認: 自店舗3桁＋商品コード

/** 一意な取引IDを採番（冪等性テスト 028 では固定値を再送）。 */
function newTransactionId(): string {
  return `e2e-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * 取引通知ペイロード（設計書 入出力 記載フィールドのみで最小構成）。
 * 通常取引（issuePoint/usePoint）・取消（cancelDivision=1）・打消（disposeDivision=2）を opts で切替える。
 */
export function buildTransactionPayload(opts: TransactionHeadOptions = {}, details?: TransactionDetailOptions[]): Record<string, unknown> {
  const head = {
    transaction_id: opts.transactionId ?? newTransactionId(),
    smaregi_player_id: opts.smaregiPlayerId ?? DEFAULT_PLAYER_ID,
    cancel_division: opts.cancelDivision ?? 0,
    dispose_division: opts.disposeDivision ?? 0,
    issue_point: opts.issuePoint ?? 0,
    use_point: opts.usePoint ?? 0,
  };
  const transactionDetails = (details ?? [{ productCode: DEFAULT_PRODUCT_CODE, quantity: 1 }]).map((d) => ({
    product_code: d.productCode ?? DEFAULT_PRODUCT_CODE,
    quantity: d.quantity ?? 1,
  }));
  return {
    data: [{ TransactionHead: head, TransactionDetail: transactionDetails }],
  };
}

/** 通常取引（付与）ペイロード。 */
export function buildNormalTransactionPayload(overrides: TransactionHeadOptions = {}): Record<string, unknown> {
  return buildTransactionPayload({ issuePoint: 10, ...overrides });
}

/** 取消取引ペイロード（cancel_division=1）。 */
export function buildCancelTransactionPayload(overrides: TransactionHeadOptions = {}): Record<string, unknown> {
  return buildTransactionPayload({ cancelDivision: 1, issuePoint: 10, ...overrides });
}

/** 打消取引ペイロード（dispose_division=2）。 */
export function buildDisposeTransactionPayload(overrides: TransactionHeadOptions = {}): Record<string, unknown> {
  return buildTransactionPayload({ disposeDivision: 2, issuePoint: 10, ...overrides });
}

/** 取引ヘッダ欠落ペイロード（E2E-A05-04-012）。 */
export function buildMissingHeadPayload(): Record<string, unknown> {
  return { data: [{ TransactionDetail: [{ product_code: DEFAULT_PRODUCT_CODE, quantity: 1 }] }] };
}

/** 想定外項目を加えたペイロード（E2E-A05-04-014）。 */
export function buildPayloadWithExtra(): Record<string, unknown> {
  const p = buildNormalTransactionPayload();
  return { ...p, unknownField: "x", foo: 1 };
}

/** 会員/履歴/注文が見つからない受信（存在しない会員ID。E2E-A05-04-015/055）。 */
export function buildUnknownPlayerPayload(): Record<string, unknown> {
  return buildNormalTransactionPayload({ smaregiPlayerId: process.env.A05_04_UNKNOWN_PLAYER_ID || "NO_SUCH_PLAYER" });
}

/** 形式不正（params解釈不可＝JSON不正）リクエスト本文の生文字列（E2E-A05-04-013/024）。 */
export const MALFORMED_JSON_BODY = '{"data": [ {"TransactionHead": ';

/**
 * スマレジ受信ヘッダ。実装は authenticationService->verify を通すが、設計は「認証なし・匿名許可」（付帯表4#2）。
 * 連携用ヘッダ（X_contract_id/X_access_token）は支店転送時のみ・要実機確認（付帯表4#6）。env で供給し原値はコミットしない。
 */
export function buildSmaregiHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const eventHeader = process.env.A05_04_AUTH_HEADER; // 要実機確認: 受信検証ヘッダ名（付帯表4#2）
  const eventValue = process.env.A05_04_AUTH_VALUE;
  if (eventHeader && eventValue) headers[eventHeader] = eventValue;
  return { ...headers, ...(extra ?? {}) };
}
