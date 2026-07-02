/**
 * a06-05 店頭仕入_買取注文ステータス（買取アプリ＝MTGバイヤーが店頭買取受注のステータスをPUT更新するJSON API）API/統合レイヤ用 パス／ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a06_05_api_store_purchase_otc_buy_order_status_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a06-05) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形。実環境は呼ばない。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋応答本体（{code:200}／{code,errors}）＋副作用（受注ステータス・査定担当者・履歴）」を仕様（正本md）由来で判定する（オラクル独立性）。
 *  - 実装のエラーメッセージ文言・ステータスマスタ値定義はオラクルにしない。正本md文言を期待値とし、実装差は付帯表4で管理（実装が違えば落ちて検出）。
 *  - 送信先パスは実効パス（付帯表4#1：正本md記載パスに接頭辞 `/api/v1` が無く実装に有る／拡張子なし別名は付帯表4#2で要確認）へ統一する。
 *  - jwt-token原値・署名シークレットは env で供給し原値はコミットしない（付帯表3）。SEED受注ID・会員IDも env 供給（要実機確認の既定値）。
 */

/**
 * ステータス更新エンドポイント実効パス。
 * 由来: prefix `%eccube_api_v1_route%` 既定値 `api/v1`（eccube.yaml:6,55）
 *       ＋ `#[Route('/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/status.json', name: 'api_admin_otc_buy_order_update_status', methods:['PUT'])]`（OtcBuyOrderController.php:190）
 *       ＝実効 `PUT /api/v1/admin/otcBuyOrder/{id}/status.json`。
 * 正本md記載パス `PUT /admin/otcBuyOrder/{id}/status.json`（接頭辞 `/api/v1` なし）とは不一致（付帯表4#1）。拡張子なし別名 `/status` の有無は要確認（付帯表4#2）。
 * テストは実効パスへ送信し、合否はパス文字列でなく更新結果（200/{code:200}・401・400・404・副作用）で判定する。
 */
export const STATUS_API_PREFIX = "/api/v1"; // eccube.yaml:6,55（%eccube_api_v1_route% 既定値）

/** 受注ID {id} を埋めた実効パスを組む（OtcBuyOrderController.php:190）。 */
export function buildStatusPath(orderId: string | number): string {
  return `${STATUS_API_PREFIX}/admin/otcBuyOrder/${orderId}/status.json`;
}

/**
 * 店頭買取ステータス値（正本md：用語・入出力の値定義を正とする。オラクル独立）。
 * 成立1・キャンセル2・…・商品到着5・査定中6・…・保留8・査定再開9。査定終了={1,2,3,4,7}・査定中査定再開={6,9}。
 * 実装定数（5=査定前/8=査定中断 等）とは意味づけ・集合範囲が相違（付帯表4#5）。シードは正本md定義で組む。
 */
export const STATUS = {
  COMPLETE: 1, // 成立（査定終了集合）
  CANCEL: 2, // キャンセル（査定終了・査定中査定再開のいずれでもない＝022用）
  PRODUCT_ARRIVED: 5, // 商品到着（中間値＝更新前。INTERMEDIATE受注の初期値）
  IN_ASSESSMENT: 6, // 査定中
  RESUMED: 9, // 査定再開
  NOT_IN_MASTER: 999, // 店頭買取ステータスマスタに存在しないID（032/033/036用）
} as const;

/**
 * SEED受注ID（付帯表3）。env 供給・既定値は要実機確認のプレースホルダ。HAS_API(A06_05_READY) ガード下でのみ送信される。
 *  - INTERMEDIATE: 更新前=商品到着5・査定担当者未設定（001-004,030-044,050,051）
 *  - INPROGRESS_A: 更新前=査定中6・査定担当者=会員A（013,014,015,016,047,048）
 *  - RESUMED_A:    更新前=査定再開9・査定担当者=会員A（017）
 *  - FINISHED:     更新前=査定終了（成立1）（020,021,022,045,046）
 *  - NONEXISTENT:  存在しない受注ID（030）
 */
export const ORDER_ID = {
  INTERMEDIATE: process.env.A06_05_ORDER_INTERMEDIATE_ID || "1001", // 要実機確認: SEED-A06-05-ORDER-INTERMEDIATE
  INPROGRESS_A: process.env.A06_05_ORDER_INPROGRESS_A_ID || "1002", // 要実機確認: SEED-A06-05-ORDER-INPROGRESS-A
  RESUMED_A: process.env.A06_05_ORDER_RESUMED_A_ID || "1003", // 要実機確認: SEED-A06-05-ORDER-RESUMED-A
  FINISHED: process.env.A06_05_ORDER_FINISHED_ID || "1004", // 要実機確認: SEED-A06-05-ORDER-FINISHED
  NONEXISTENT: process.env.A06_05_ORDER_NONEXISTENT_ID || "99999999", // 存在しない受注ID（030）
} as const;

/**
 * 認証 jwt-token（付帯表3）。HS256・ヘッダ名 `jwt-token`（JwtTokenHeaderExtractor.php:29）。env 供給・原値はコミットしない。
 *  - MEMBER_A: 有効な管理者会員A（査定担当者A）
 *  - MEMBER_B: 会員Aと異なる管理者会員B（占有テスト用）
 */
export const JWT_TOKEN = {
  MEMBER_A: process.env.A06_05_JWT_MEMBER || "", // 要実機確認: SEED-A06-05-JWT-MEMBER（会員A）
  MEMBER_B: process.env.A06_05_JWT_OTHER || "", // 要実機確認: SEED-A06-05-JWT-OTHER（会員B）
} as const;

/** jwt-token ヘッダ名（JwtTokenHeaderExtractor.php:29）。 */
export const JWT_HEADER_NAME = "jwt-token";

/** 認証ヘッダ＋Content-Typeを組む。token 未指定（undefined）ならjwt-tokenヘッダを付けない（欠落系010）。 */
export function buildJwtHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token !== undefined) headers[JWT_HEADER_NAME] = token;
  return headers;
}

/** ステータス更新ボディ（正本md：リクエストはid/statusのみ規定）。status は number/string いずれも組める（非整数系034）。 */
export function buildStatusPayload(status: number | string): Record<string, unknown> {
  return { status };
}

/** status未指定ボディ（031）。 */
export function buildEmptyStatusPayload(): Record<string, unknown> {
  return {};
}

/**
 * 正本md由来のエラーメッセージ文言（オラクル）。実装文言は付帯表4で乖離記録（テストは正本md文言で照合し、違えば落ちて検出）。
 *  - OCCUPANCY: 占有拒否「この受注は「（査定担当者名）」が査定中です。」（付帯表4#4：実装は鉤括弧・末尾句点を欠く）。担当者名は動的のため安定部分で照合。
 *  - FINISHED_OPEN: 査定終了→査定中・査定再開「この査定はすでに終了しているため開くことができません。」
 *  - FINISHED_UPDATE_FAIL: 査定終了→それ以外「この査定はすでに終了しているためステータスの更新に失敗しました。」
 *  - INVALID_MASTER: マスタ非存在「正しい店頭買取ステータスIDを入力してください」（付帯表4#3：実装は別文言）。
 */
export const SPEC_MESSAGE = {
  OCCUPANCY_FULL: "この受注は「（査定担当者名）」が査定中です。",
  OCCUPANCY_STABLE: "が査定中です", // 担当者名を含まない安定部分（占有判定の意味で照合）
  FINISHED_OPEN: "この査定はすでに終了しているため開くことができません。",
  FINISHED_UPDATE_FAIL: "この査定はすでに終了しているためステータスの更新に失敗しました。",
  INVALID_MASTER: "正しい店頭買取ステータスIDを入力してください",
} as const;
