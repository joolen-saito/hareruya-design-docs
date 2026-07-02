/**
 * a17-03 ポイント付与（スマレジ取引API中継・更新系JSON API・POST）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a17_03_api_other_point_granter_e2e_cases.md（付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md(a17-03) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形（コンパイル確認のみ）。
 *
 * メソッド: POST（更新系・ミューテーション）。`#[Route('/admin_api/point_granter', methods: ['POST'])]`（PointGranterController.php:44）。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋レスポンス本文＋DB副作用」を仕様由来で判定する（オラクル独立性）。
 *  - 入力検証（必須欠落→400・空本文）は中継前判定で外部依存なく自動化。中継成功以降（result キー・付与・履歴）はスマレジ応答を要し test.fixme（要実機確認）。
 *  - ヘッダ名は実装が X-Contract-Id／X-Access-Token（付帯表4#1。正本md はアンダースコア表記）。送信は実効ヘッダ名で行う。
 *  - 空本文は正本md仕様。実装は `[]`（空JSON配列・付帯表4#7）を返すためオラクルは「本文が空」を保持し差異を検出する。
 *  - 加算先テーブル乖離（付帯表4#2）・履歴 transaction_id 欠落（付帯表4#3）は仕様を期待しDB照合で検出（要実機確認）。
 *  - 例外時ロールバックは正典未定義（付帯表4#8）。固定期待にしない（手動・要実機確認）。
 *  - 契約ID・アクセストークン原値は env で供給しログ/設計に書かない（ログ・監査節）。
 */

/** 実効パス。`#[Route('/admin_api/point_granter', name: 'point_granter', methods: ['POST'])]`（PointGranterController.php:44）。正本md 利用者視点の入口と一致。 */
export const POINT_GRANTER_PATH = "/admin_api/point_granter";

/** 実効ヘッダ名（実装＝PointGranterController.php:47-48。正本md の X_contract_id／X_access_token とは表記差＝付帯表4#1）。 */
export const HEADER_CONTRACT_ID = "X-Contract-Id";
export const HEADER_ACCESS_TOKEN = "X-Access-Token";

// ===== 資格情報・本文（SEED-A17-03-CREDS / SEED-A17-03-PAYLOAD）。env 供給・未設定時は創作既定値（要実機確認） =====

/** スマレジ契約ID（中継用。呼び出し元認可には使われない＝付帯表4#6）。原値は env で供給しログに出さない。 */
export const CONTRACT_ID = process.env.A17_03_CONTRACT_ID || "要実機確認-契約ID";
/** スマレジ アクセストークン（中継用）。原値は env で供給しログに出さない。 */
export const ACCESS_TOKEN = process.env.A17_03_ACCESS_TOKEN || "要実機確認-アクセストークン";

/** 取引更新の処理名（会員ポイント付与の対象＝PointGranterController.php:78-80／Action.php）。 */
export const PROC_NAME_TRANSACTION_UPD = "transaction_upd";
/** 取引更新以外の処理名（中継のみ・付与なし・E2E-A17-03-033）。 */
export const PROC_NAME_OTHER = process.env.A17_03_PROC_NAME_OTHER || "transaction_ref";

/**
 * params（JSON文字列）。実装が読む構造 `data[0].rows[0]`（customerId/newPoint/memo/terminalTranDateTime/pointAttr）に合わせる。
 * 期待値は spec 由来であり、構造は SEED-A17-03-PAYLOAD（synthetic）。未記載フィールドは要実機確認。
 */
export function buildParams(overrides: Record<string, unknown> = {}): string {
  const row = {
    customerId: process.env.A17_03_SMAREGI_CUSTOMER_ID || "要実機確認-スマレジ会員ID",
    newPoint: 100,
    memo: "要実機確認-メモ",
    terminalTranDateTime: "2026-01-01T00:00:00+09:00",
    pointAttr: process.env.A17_03_POINT_ATTR || "1",
    ...overrides,
  };
  return JSON.stringify({ data: [{ rows: [row] }] });
}

/** 全必須項目を満たす有効なヘッダ。 */
export function buildValidHeaders(): Record<string, string> {
  return { [HEADER_CONTRACT_ID]: CONTRACT_ID, [HEADER_ACCESS_TOKEN]: ACCESS_TOKEN };
}

/** 有効な本文（multipart/form フィールド proc_name／params）。 */
export function buildValidBody(
  procName: string = PROC_NAME_TRANSACTION_UPD,
  params: string = buildParams()
): Record<string, string> {
  return { proc_name: procName, params };
}

/** 該当会員なし（スマレジ会員IDが存在しない）params（E2E-A17-03-030/031）。 */
export function buildUnknownMemberParams(): string {
  return buildParams({ customerId: process.env.A17_03_UNKNOWN_SMAREGI_ID || "要実機確認-未存在スマレジ会員ID" });
}

// ===== DB副作用 期待値（SEED-A17-03-PLAYER / POINTTYPE）。env 供給。未設定なら照合スキップ＝要実機確認 =====

/** 付与対象会員（プレイヤー）のキー。 */
export const TARGET_SMAREGI_ID = process.env.A17_03_SMAREGI_CUSTOMER_ID;
/** 付与ポイント（newPoint）。会員ポイント残高への加算量（正本md DBカラム節 dtb_customer.point。実装の加算先＝付帯表4#2）。 */
export const NEW_POINT = Number(process.env.A17_03_NEW_POINT || "100");

/** CORS許可ヘッダ名（副作用節・PointGranterController.php:123-127）。全応答に付与。 */
export const CORS_HEADER = "access-control-allow-origin";

/** 成功時レスポンス本文は result キーを含む（レスポンス(成功)節）。値構造は連携先仕様で要実機確認。 */
export const RESULT_KEY = "result";

/** ポイント履歴の記録カラム（正本md DBカラム節。DB副作用照合で検証＝要実機確認）。 */
export const POINT_HISTORY_COLUMNS = [
  "customer_id",
  "point_change",
  "note",
  "issue_date",
  "point_type_id",
  "transaction_id",
] as const;
