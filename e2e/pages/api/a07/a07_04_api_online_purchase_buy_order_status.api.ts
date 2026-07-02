/**
 * a07-04 オンライン仕入_買取注文ステータス（買取アプリ=MTGバイヤーがネット買取受注のステータスをPUT更新するJSON API）API/統合レイヤ用 パス／ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a07_04_api_online_purchase_buy_order_status_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a07-04) 入出力記載のリクエスト仕様（jwt-token ヘッダ付き PUT・ボディ `status`）のみを最小構成で組む未実行雛形。実環境（買取アプリ＝MTGバイヤー）は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性: 期待値は仕様/正本md由来であり、実装のレスポンス形・FW既定値・ステータスマスタ定義を期待値に流用しない）:
 *  - 送信先は実装の実効パス `PUT /api/v1/admin/buyOrder/{id}/status.json`（付帯表1／付帯表4#1）。
 *    由来: `#[Route('/%eccube_api_v1_route%/admin/buyOrder/{id}/status.json', name: 'api_admin_buy_order_update_status', methods: ['PUT'])]`（Controller/App/MTGBuyer/V1/Admin/BuyOrderController.php:126）
 *          ＋ `eccube_api_v1_route` 既定値 `api/v1`（app/config/eccube/packages/eccube.yaml:6,55）＝実効パス。正本md `PUT /admin/buyOrder/{id}/status.json` は接頭辞 `/api/v1` を欠くが移行節で接頭辞配下配置を明記（付帯表4#1）。
 *  - 認証は firewall `app`（pattern `^/api/v1/`・access_token＝security.yaml:33-39）＋ `JwtTokenHeaderExtractor`（ヘッダ名 `jwt-token`＝JwtTokenHeaderExtractor.php:29,34）＋HS256（jwt.yaml:3-10）。
 *    クラスに `#[IsGranted('IS_AUTHENTICATED_FULLY')]`（BuyOrderController.php:44）。トークン欠落・該当管理者会員なし・署名不正は 401。HS256署名検証・JWT発行・会員紐づけの実方式は要実機確認（付帯表1）。
 *  - 対象受注なしは 404（BuyOrderController.php:130）。status必須・形式不正は 400（:135）。マスタ存在判定は 400（:141）。会員特定不可は 401（:147）。更新本体は UpdateStatusAction（:127-160／UpdateStatusAction.php:65-114）。
 *  - 合否（成功）は HTTPステータス200＋応答 `{code:200}`（code integer・値200）、（失敗）は 400＋`{code,errors}` を仕様（正本md）由来で判定する（spec側）。
 *    検証失敗のHTTPステータスは正本mdの 400 を期待する（実装422の可能性は付帯表で管理）。仕様どおり期待し違えば落として検出する（実装へ寄せない）。
 *  - 検証・判定メッセージは正本md文言を期待値とする（マスタ非存在文言「正しい店頭買取ステータスIDを入力してください」の「店頭」表記は正本md・実装一致だが妥当性は付帯表4#4／占有・査定終了文言は付帯表4#5/#6/#8）。errors 要素形は実装依存のため本文全体を文字列化して文言の存在で照合する。
 *  - ステータス区分は正本md定義（査定中=10・査定再開=12・査定終了={4,5,6,7,8,9,13}）をオラクルとし、実装のマスタ値定義差・遷移許可表は付帯表4#5/#6/#8で管理（実装値を期待へ写さない）。
 *  - 本APIはブラウザ向け画面を持たない（正本md）。更新副作用は永続化先テーブル（dtb_buy_order／dtb_buy_order_status_histry）を直接DB照合（DB副作用観測）して判定する想定で、spec側はAPI応答を一次に置きDB照査で補完する（本リポでDBは実行しない）。
 *  - jwt-token原値・署名シークレットは env で供給し原値はコミットしない（付帯表3）。SEED受注ID・ステータスID も env 供給（要実機確認の暫定値）。
 * 本リポジトリ(hareruya-design-docs)の e2e ランナーでは未実行の雛形（コンパイル確認のみ）。環境ガード A07_04_READY。
 */

/** API実効パス接頭辞。由来: eccube.yaml:6,55（%eccube_api_v1_route% 既定値 `api/v1`）。 */
export const API_V1_PREFIX = "/api/v1";

/**
 * ネット買取受注ステータス更新エンドポイント実効パスを組む（受注ID {id} を埋める）。
 * 由来: BuyOrderController.php:126（Route）＋ eccube.yaml:6,55 ＝実効 `PUT /api/v1/admin/buyOrder/{id}/status.json`。
 * 正本md `PUT /admin/buyOrder/{id}/status.json`（接頭辞 `/api/v1` なし・移行節で接頭辞配下配置を明記）とは表記差（付帯表4#1）。テストは実効パスへ送信し合否は更新結果で判定する。
 */
export function buildStatusPath(orderId: string | number): string {
  return `${API_V1_PREFIX}/admin/buyOrder/${orderId}/status.json`;
}

/** 認証ヘッダ名。由来: JwtTokenHeaderExtractor.php:29,34（ヘッダ名 `jwt-token`）。 */
export const JWT_HEADER_NAME = "jwt-token";

// ===== JWT（env 供給・原値非コミット。既定値は要実機確認の暫定） =====

/**
 * 有効JWT（SEED-A07-04-JWT-MEMBER／査定担当者A）。HS256・有効署名・該当管理者会員（会員A）の利用者IDを含む。
 * 要実機確認: テスト環境固定の有効トークンへ差し替える（JWT発行・会員紐づけ＝付帯表1）。
 */
export const MEMBER_JWT = process.env.A07_04_JWT_MEMBER || "";

/** 別の管理者会員B（SEED-A07-04-JWT-OTHER）。占有テスト（013/014/016/017/018）で会員A担当の受注へ非本人として送る。要実機確認: 環境の有効トークンへ。 */
export const OTHER_JWT = process.env.A07_04_JWT_OTHER || "";

/** 署名不正トークン（E2E-A07-04-011）。署名シークレットを持たずに合成。実装は token_handler 検証で401を返すことを期待。 */
export const JWT_BAD_SIGNATURE =
  process.env.A07_04_JWT_BAD_SIGNATURE ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIn0.invalid-signature-not-hs256";

/**
 * 署名は正しいが該当管理者会員が存在しない利用者IDのトークン（E2E-A07-04-012）。
 * 正しい署名には実機シークレットが要るため env 供給（要実機確認）。未設定時は合成値（署名不正として401となる）でフォールバック。
 */
export const JWT_NO_MEMBER =
  process.env.A07_04_JWT_NO_MEMBER ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5OTk5OTk5OSJ9.no-matching-member-signature";

/** jwt-token ヘッダ＋Content-Type を組む。token 未指定（undefined/空文字）なら jwt-token ヘッダを付けない（欠落系010）。token 省略時は MEMBER_JWT。 */
export function buildJwtHeaders(token: string | undefined = MEMBER_JWT): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token !== undefined && token !== "") headers[JWT_HEADER_NAME] = token;
  return headers;
}

/** jwt-token を一切付与しないヘッダ（E2E-A07-04-010 欠落）。 */
export function buildNoAuthHeaders(): Record<string, string> {
  return { "Content-Type": "application/json" };
}

// ===== SEED 受注ID（env 供給・既定は要実機確認の暫定。HAS_API(A07_04_READY) ガード下でのみ送信される） =====

/**
 * SEED受注ID（付帯表3）。env 供給・既定値は要実機確認のプレースホルダ。
 *  - INTERMEDIATE:       中間値（商品到着2・査定担当者未設定）。正常更新・副作用観測（001-004,030系除く,040-044,049）。
 *  - INPROGRESS_A:       更新前=査定中10・査定担当者=会員A（013-016,047,048）。
 *  - RESUMED_A:          更新前=査定再開12・査定担当者=会員A（017,018）。
 *  - FINISHED:           更新前=査定終了（振込完了7）（020,021,022,025,045,046）。
 *  - FINISHED_AGREE:     更新前=査定終了（査定同意4＝集合下限代表）（023）。
 *  - FINISHED_CONTACTED: 更新前=査定終了（連絡済み13＝集合上限代表）（024）。
 *  - NONEXISTENT:        存在しない受注ID（030）。
 */
export const ORDER_ID = {
  INTERMEDIATE: process.env.A07_04_ORDER_INTERMEDIATE_ID || "2001", // 要実機確認: SEED-A07-04-ORDER-INTERMEDIATE
  INPROGRESS_A: process.env.A07_04_ORDER_INPROGRESS_A_ID || "2002", // 要実機確認: SEED-A07-04-ORDER-INPROGRESS-A
  RESUMED_A: process.env.A07_04_ORDER_RESUMED_A_ID || "2003", // 要実機確認: SEED-A07-04-ORDER-RESUMED-A
  FINISHED: process.env.A07_04_ORDER_FINISHED_ID || "2004", // 要実機確認: SEED-A07-04-ORDER-FINISHED
  FINISHED_AGREE: process.env.A07_04_ORDER_FINISHED_AGREE_ID || "2005", // 要実機確認: SEED-A07-04-ORDER-FINISHED-AGREE
  FINISHED_CONTACTED: process.env.A07_04_ORDER_FINISHED_CONTACTED_ID || "2006", // 要実機確認: SEED-A07-04-ORDER-FINISHED-CONTACTED
  NONEXISTENT: process.env.A07_04_ORDER_NONEXISTENT_ID || "99999999", // 存在しない受注ID（030）
} as const;

/**
 * 買取ステータス値（正本md 用語・入出力節の値定義）。SEED-A07-04-STATUS-MASTER。
 * 査定中=10・査定再開=12・査定終了={4,5,6,7,8,9,13}。実装のマスタ値定義差・遷移許可表は付帯表4#5/#6/#8で管理し、テストは正本md定義をオラクルとする。
 *  - NOT_IN_MASTER: 買取ステータスマスタに存在しないID（032/033。例999）。
 */
export const STATUS = {
  ASSESSING: 10, // 査定中
  RESUMPTION: 12, // 査定再開
  PRODUCT_ARRIVAL: 2, // 商品到着（査定中・査定再開以外）
  TRANSFER_COMPLETE: 7, // 振込完了（査定終了集合 代表）
  APPRAISAL_ACCEPTANCE: 4, // 査定同意（査定終了集合 下限代表）
  COMMUNICATED: 13, // 連絡済み（査定終了集合 上限代表）
  NOT_IN_MASTER: Number(process.env.A07_04_STATUS_NOT_IN_MASTER || 999), // マスタ非存在ID（032/033）
} as const;

// ===== ペイロード（正本md 入出力節 記載フィールド `status` のみで最小構成） =====

/** 非整数値（status 形式バリデーション 034 用）。JSON 上の非整数文字列で送る。 */
export const NON_INTEGER_STATUS = "abc";

/** 正常 status ボディ（既定＝査定中10）。status を override 可能。 */
export function buildValidPayload(status: number | string = STATUS.ASSESSING): Record<string, unknown> {
  return { status };
}

/** status 未指定ボディ（031）。 */
export function buildMissingStatusPayload(): Record<string, unknown> {
  return {};
}

/** マスタ非存在 status ボディ（032/033/036）。 */
export function buildUnknownStatusPayload(): Record<string, unknown> {
  return { status: STATUS.NOT_IN_MASTER };
}

/** 非整数 status ボディ（034）。 */
export function buildNonIntegerStatusPayload(): Record<string, unknown> {
  return { status: NON_INTEGER_STATUS };
}

// ===== 正本md由来のメッセージ文言（オラクル）。実装文言の乖離は付帯表4で記録（テストは正本md文言で照合し違えば落として検出） =====

/**
 * 正本md（バリデーション・エラー処理・処理フロー#5/#6）由来の判定メッセージ。
 *  - STATUS_NOT_IN_MASTER: マスタ非存在status（033。正本md・実装で同文言＝「店頭」表記の妥当性は付帯表4#4）。
 *  - FINISHED_CANNOT_OPEN: 査定終了→査定中・査定再開（021/025。「開くことができません」分岐）。
 *  - FINISHED_UPDATE_FAILED: 査定終了→それ以外（022。「更新に失敗しました」分岐）。
 *  - OCCUPIED_STABLE: 占有拒否メッセージ「この受注は「（査定担当者名）」が査定中です。」の安定部分（査定担当者名は環境依存のため可変。014。占有判定スキップの不具合候補は付帯表4#8）。
 */
export const SPEC_MESSAGE = {
  STATUS_NOT_IN_MASTER: "正しい店頭買取ステータスIDを入力してください",
  FINISHED_CANNOT_OPEN: "この査定はすでに終了しているため開くことができません。",
  FINISHED_UPDATE_FAILED: "この査定はすでに終了しているためステータスの更新に失敗しました。",
  OCCUPIED_STABLE: "が査定中です。",
} as const;
