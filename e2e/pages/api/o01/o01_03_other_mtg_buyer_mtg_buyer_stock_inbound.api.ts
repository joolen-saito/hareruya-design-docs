/**
 * o01-03 その他_MTGバイヤー_入庫モード（買取成立商品を在庫 ProductStock へ登録する入庫処理）
 * API/統合レイヤ用 パス／ヘッダ／ペイロード／コマンド名 ヘルパ。
 *
 * area 判定: **api**（画面を伴わない）。入庫専用の外部APIは存在せず（正本md「重要な確認結果」L9／API・バッチ結果 L109-111）、
 *   入庫は (1) 買取ステータス更新API（入庫待ち→入庫済み遷移）を契機にEC-CUBE側内部サービスが実行、または (2) 一括入庫バッチ で起動する。
 *   MTGバイヤー本体はリポジトリ外の外部アプリで画面・UIは仕様確定しない（正本md「本書で扱わないこと」L23-29／「画面遷移」L172-174）。
 *   よって front/admin 画面specは無く、request（ステータス更新API）＋コンソールバッチ（起動口が実機依存＝spec は test.fixme）で扱う。
 *
 * ケース表 integration_test/e2e/o01_03_other_mtg_buyer_mtg_buyer_stock_inbound_e2e_cases.md（付帯表1/3/4）に対応。
 * 本ファイルは正本md(o01-03) 利用者視点の入口・処理フローのリクエスト仕様のみを最小構成で組む未実行雛形。実環境（MTGバイヤー）は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来。実装のレスポンス形・終了コード実値・出力文言を期待値に流用しない）:
 *  - ステータス更新の送信先（入庫起動の契機。ネット買取。店頭買取は O01-01 の status API）:
 *      PUT /api/v1/admin/buyOrder/{id}/status.json  BuyOrderController.php:126（../ec-cube-enterprise）
 *    firewall app pattern `^/api/v1/`・access_token・JwtTokenHeaderExtractor（security.yaml:33-39）。ヘッダ名 `jwt-token`。欠落/署名不正＝401。
 *  - 一括入庫バッチ（起動口＝コンソール・実機依存）:
 *      bin/console `eccube:buy-order:auto-stock`  BuyOrderAutoStockCommand.php:36（#[AsCommand]。買取自動入庫バッチ）
 *      本体は OtcBatchAutoStockAction::handle()／NetBatchAutoStockAction::handle()（同:52-53）。例外時 error 出力＋Command::FAILURE（同:55-58）／完了時 success＋Command::SUCCESS（同:60-62）。
 *      ※ Playwright request からコンソールバッチを直接起動できない（実機/シェル依存）ため、バッチ起動ケースは spec で test.fixme（理由付き）。
 *  - 入庫の副作用（買取在庫→商品在庫 ProductStock への反映・在庫履歴の更新前後数量・ステータス入庫済み）は画面/APIレスポンスに現れにくいため、
 *    一次オラクル＝ステータス更新API応答（200）とし、在庫反映・履歴・二重入庫防止は永続化先テーブルの直接DB照合で補完する（本リポでDBは実行しない）。
 *  - ステータス値（入庫待ち16・入庫済み14・未登録在庫あり等）の定義は ec-cube-enterprise `Master\MtbBuyOrderStatus` を正とする（要実機確認）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル/--list 確認のみ）。環境ガード O01_03_READY。
 */

export const API_V1_PREFIX = "/api/v1";
export const JWT_HEADER_NAME = "jwt-token";

/** PUT 買取ステータス更新（入庫待ち→入庫済み遷移で入庫を起動）。BuyOrderController.php:126 */
export function statusPath(orderId: string | number): string {
  return `${API_V1_PREFIX}/admin/buyOrder/${orderId}/status.json`;
}

/** 一括入庫バッチのコマンド名（起動口＝コンソール・実機依存）。BuyOrderAutoStockCommand.php:36 */
export const AUTO_STOCK_COMMAND = "eccube:buy-order:auto-stock";

// ===== JWT（env 供給・原値非コミット。既定は要実機確認の暫定合成値） =====
export const ADMIN_JWT = process.env.O01_03_JWT_ADMIN || "";
export const JWT_BAD_SIGNATURE =
  process.env.O01_03_JWT_BAD_SIGNATURE ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.invalid-signature-not-hs256";

export function jwtHeaders(token: string | undefined = ADMIN_JWT): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token !== undefined && token !== "") headers[JWT_HEADER_NAME] = token;
  return headers;
}
export function noAuthHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

// ===== SEED 受注ID・ステータス（env 供給・既定は要実機確認の暫定） =====
export const ORDER_ID = {
  /** 入庫待ちの買取受注（入庫対象）。 */
  PENDING: process.env.O01_03_ORDER_PENDING_ID || "3001",
  /** すでに入庫済みの買取受注（二重入庫防止確認用）。 */
  STOCKED: process.env.O01_03_ORDER_STOCKED_ID || "3002",
} as const;

/** 買取ステータス（値は ec-cube-enterprise Master\MtbBuyOrderStatus を正とする。正本md: 入庫待ち16・入庫済み14）。要実機確認。 */
export const STATUS = {
  PENDING_STOCK: Number(process.env.O01_03_STATUS_PENDING || 16), // 入庫待ち
  STOCKED: Number(process.env.O01_03_STATUS_STOCKED || 14), // 入庫済み
} as const;

/** ステータス更新ボディ（既定＝入庫済みへ遷移＝入庫起動）。 */
export function buildStatusPayload(status: number = STATUS.STOCKED): Record<string, unknown> {
  return { order_status: status };
}
