/**
 * A01-02 スマレジ Webhook 連携エラー再連携 — API/統合レイヤ ペイロード／ヘルパ。
 * 構造参考: ec-cube-enterprise/e2e-tests。本ファイルは設計書(a01-02)＋実装の位置情報由来の未実行雛形。
 *
 * オラクル独立性: 期待値（HTTPステータス・在庫状態）は設計書/観点表/0202 由来。
 * 本ファイルが実装から採るのは「位置情報のみ」（Webhookパス・必須ヘッダ名・本文エンベロープ項目）。
 * スマレジ実環境・実署名は使わず、設計書記載のフィールドのみを最小構成で組む。
 *
 * 根拠 file:line（ec-cube-enterprise/src/Eccube）:
 *  - ルート: Controller/Smaregi/WebhookController.php:41（#[Route('', name:'smaregi_webhook', methods:['POST'])]）
 *    ＋ app/config/eccube/routes.yaml:12（prefix: /%eccube_smaregi_webhook_route%）
 *    ＋ app/config/eccube/packages/eccube.yaml:7（既定 ECCUBE_SMAREGI_WEBHOOK_ROUTE='smaregi/webhook'）
 *  - 署名（共有secretヘッダ）: Service/Smaregi/Webhook/AuthenticationService.php:33（hash_equals(secret, header値)）
 *    ＋ app/config/eccube/services.yaml:25-26（secret/secretHeader）／.env.dist:91-92（既定 header='x-sdsch-secret'）
 *  - 必須ヘッダ Smaregi-Event-Id: WebhookController.php:67／欠落時400: WebhookController.php:77
 *  - 本文エンベロープ項目: Service/Smaregi/Webhook/EventService.php:42-43（contractId/event/action を読む）
 *
 * 注意（付帯表4 #4）: 本文JSONの「必須キー名・スキーマ・余剰項目の許容可否」は設計書未定義。
 * 在庫変動区分02/12（売上/返品）の判定は Webhook 本文では行われず、非同期ハンドラ側で
 * スマレジ取引を取得して判定する（Webhook層のオラクルは HTTPステータスのみ）。下記の02/12は
 * 「概念上の対象区分」を表すラベルであり、エンベロープ本文の必須キーではない＝要実機確認。
 */

// 既定ルート。staging では ECCUBE_SMAREGI_WEBHOOK_ROUTE が異なる可能性があるため env 上書き可（要実機確認）。
export const SMAREGI_WEBHOOK_ROUTE =
  process.env.SMAREGI_WEBHOOK_ROUTE || "smaregi/webhook";
export const SMAREGI_WEBHOOK_PATH = `/${SMAREGI_WEBHOOK_ROUTE}`;

// 署名（共有secret）ヘッダ名・秘密値。staging の実値は SEED-A01-02-WEBHOOK／環境設定由来＝要実機確認。
// 既定ヘッダ名は .env.dist:92（x-sdsch-secret）。秘密値はコミットしない（環境変数）。
export const SMAREGI_SECRET_HEADER =
  process.env.SMAREGI_WEBHOOK_SECRET_HEADER || "x-sdsch-secret";
export const SMAREGI_WEBHOOK_SECRET = process.env.SMAREGI_WEBHOOK_SECRET || "";

// 必須ヘッダ名（WebhookController.php:67）。
export const SMAREGI_EVENT_ID_HEADER = "Smaregi-Event-Id";

/** 環境ガード: 署名secret＋Webhook許可が無ければ API テストを skip する。 */
export const HAS_WEBHOOK_ENV = !!SMAREGI_WEBHOOK_SECRET;

/** 在庫変動区分（概念ラベル）。02=売上, 12=返品（設計書 入力データ詳細 由来。実装エンベロープの必須キーではない）。 */
export type SmaregiTransactionType = "02" | "12";

/** ランダムでない安定接頭辞付きのテスト用イベントID（後始末・重複制御のため接頭辞で識別）。 */
export function buildEventId(suffix: string): string {
  return `E2E-A01-02-${suffix}`;
}

/**
 * 正しい署名・必須ヘッダを組む。値は env（要実機確認）。
 * extra に Smaregi-Event-Id を渡す／省略でヘッダ欠落ケースを作る。
 */
export function buildWebhookHeaders(opts: {
  eventId?: string | null; // null/undefined で Smaregi-Event-Id を付けない（E2E-004）
  validSignature?: boolean; // false で不正署名（E2E-003）
  extra?: Record<string, string>;
}): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.extra ?? {}),
  };
  // 署名: 正＝secret一致値、不正＝改ざん値（AuthenticationService.php:33 は hash_equals 比較）。
  headers[SMAREGI_SECRET_HEADER] =
    opts.validSignature === false
      ? `${SMAREGI_WEBHOOK_SECRET}-tampered`
      : SMAREGI_WEBHOOK_SECRET;
  if (opts.eventId !== null && opts.eventId !== undefined) {
    headers[SMAREGI_EVENT_ID_HEADER] = opts.eventId;
  }
  return headers;
}

/**
 * Webhook 本文エンベロープ（EventService.php:42-43 が読む contractId/event/action）。
 * transactionType は「概念上の対象区分」を表すメタで、必須キー・スキーマは設計書未定義＝要実機確認。
 */
export function buildWebhookEnvelope(opts: {
  transactionType?: SmaregiTransactionType;
  contractId?: string;
  event?: string;
  action?: string;
  /** 余剰項目（E2E-033 想定外項目）。許容可否は仕様未定義＝要実機確認。 */
  extraFields?: Record<string, unknown>;
}): Record<string, unknown> {
  return {
    // 以下は実装が読む既知エンベロープ項目（EventService.php:42-43）。具体値は要実機確認。
    contractId: opts.contractId ?? "E2E-CONTRACT", // 創作値: 要実機確認
    event: opts.event ?? "transaction", // 創作値: 要実機確認（実イベント名は要確認）
    action: opts.action ?? "created", // 創作値: 要実機確認
    // メタ（実装の必須キーではない・downstream判定の概念ラベル）。
    _e2eTransactionType: opts.transactionType ?? null,
    ...(opts.extraFields ?? {}),
  };
}

/** JSON構文不正の本文（E2E-005/030）。json_decode が失敗する文字列。 */
export const MALFORMED_JSON_BODY = '{"contractId": "E2E", "event": ';

/**
 * 入力不備（必須項目欠落等）本文（E2E-029/031）。
 * どのキーが必須かは設計書未定義（付帯表4 #4）＝要実機確認。空オブジェクトで最小再現。
 */
export const DEFICIENT_BODY: Record<string, unknown> = {};
