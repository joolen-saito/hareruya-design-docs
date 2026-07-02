/**
 * a06-04 店頭仕入_買取注文フリーコメント更新（PUT・JWT認証付き更新系API）API/統合レイヤ用 パス／ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a06_04_api_store_purchase_otc_buy_order_free_comment_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは正本md（pf-apiリバース／観点表／基本設計）の入出力記載のみで最小構成を組む未実行雛形（コンパイル確認のみ）。実環境は呼ばない。
 *
 * 値の出所と独立性（オラクル独立性）:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋応答本文（{code}／{code,errors}）＋DB副作用（フリーコメント・更新担当者）」を仕様由来で判定する。
 *  - 更新系（010 新規登録／011 上書き）の確定はDB副作用が一次オラクル（DB照査で補完。UI反映は E2E-A06-04-040）。
 *  - 実装の例外応答書式（401/404 の本文有無・400 の code 同梱有無）はオラクルにしない（付帯表4#3/#4/#5）。本ファイルは送信データ組立のみ。
 *  - JWT資格情報・SEED受注IDは正本md・ログに原値を書かず env で供給（要実機確認は既定値）。
 */

/**
 * フリーコメント更新エンドポイント実効パス（{id} 埋め込み）。
 * 由来: ルート `#[Route('/%eccube_api_v1_route%/admin/otcBuyOrder/{id}/freeComment.json', methods:['PUT'])]`（OtcBuyOrderController.php:156）
 *       ＋ `eccube_api_v1_route` 既定値 `api/v1`（eccube.yaml:6,55）＝実効 `PUT /api/v1/admin/otcBuyOrder/{id}/freeComment.json`。
 * 正本md は `/api/v1` プレフィックスなし・`.json` 無し別名を記すが実装に見当たらず、テストは実効パスへ送信し差異を付帯表4#1で管理。
 */
export function otcBuyOrderFreeCommentPath(id: string | number): string {
  return `/api/v1/admin/otcBuyOrder/${id}/freeComment.json`;
}

/** SEED受注ID（付帯表3）。原値は env で供給し、未設定時は要実機確認の既定値。 */
export const OTC_ORDER_ID = process.env.A06_04_OTC_ORDER_ID || "1"; // SEED-A06-04-OTC-ORDER（要実機確認: 既存受注ID）
export const OTC_ORDER_EMPTY_ID = process.env.A06_04_OTC_ORDER_EMPTY_ID || "1"; // SEED-A06-04-OTC-ORDER-EMPTY（要実機確認）
export const OTC_ORDER_FILLED_ID = process.env.A06_04_OTC_ORDER_FILLED_ID || "1"; // SEED-A06-04-OTC-ORDER-FILLED（要実機確認）
export const NONEXISTENT_ORDER_ID = process.env.A06_04_NONEXISTENT_ORDER_ID || "999999999"; // 該当なし→404（030/031）

/** JWT資格情報（付帯表3 SEED-A06-04-AUTH-MEMBER）。原値・署名シークレット(auth_magic)はコミットしない。 */
export const JWT_TOKEN = process.env.A06_04_JWT_TOKEN || ""; // 有効JWT（要実機確認: 署名方式HS256・付帯表4#2）
export const JWT_TOKEN_BADSIG = process.env.A06_04_JWT_TOKEN_BADSIG || ""; // 署名不正JWT（021・要実機確認: 401経路）
export const JWT_TOKEN_NOMEMBER = process.env.A06_04_JWT_TOKEN_NOMEMBER || ""; // 該当管理者会員なしJWT（022・要実機確認）

/** 入力不正(400)時の期待エラーメッセージ（正本md:108,125,191 由来。MissingRequiredParameterException('コメントを入力してください') OtcBuyOrderController.php:166）。 */
export const MSG_COMMENT_REQUIRED = "コメントを入力してください";

/**
 * JWT認証ヘッダ。抽出ヘッダ名 `jwt-token`（JwtTokenHeaderExtractor.php:29 HEADER_NAME）。
 * token 未指定（undefined）はヘッダ欠落＝認証拒否(401)シナリオ（020）に使う。
 */
export function buildAuthHeaders(token?: string, extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["jwt-token"] = token; // 欠落時は付与しない（020 受信検証→401）
  return { ...headers, ...(extra ?? {}) };
}

/**
 * フリーコメント更新リクエストボディ。フォーム値フィールド名 `free_comment`（正本md 入出力由来。
 * 実装の Form フィールド名の厳密値は要実機確認だが、正本mdは free_comment を入力項目と定める）。
 */
export function buildValidCommentPayload(comment = "E2E更新コメント"): Record<string, unknown> {
  return { free_comment: comment };
}

/** 空文字コメント（012）。pf-api側で入力不正と判定しない（正本md:149）。 */
export function buildEmptyCommentPayload(): Record<string, unknown> {
  return { free_comment: "" };
}

/** 最大長相当の長大コメント（013）。文字数上限はpf-api側で判定しない（正本md:149）。DBカラム長超過は要実機確認（付帯表4#7）。 */
export function buildMaxLenCommentPayload(length = 5000): Record<string, unknown> {
  return { free_comment: "あ".repeat(length) };
}

/** 既存コメント上書き用ペイロード（011）。別値で上書き（正本md:95 更新方法＝上書き）。 */
export function buildOverwriteCommentPayload(comment = "上書き後コメント"): Record<string, unknown> {
  return { free_comment: comment };
}

/** 想定外項目を加えたペイロード（014）。free_comment のみ参照され想定外項目は未参照（正本md:159）。 */
export function buildPayloadWithExtra(comment = "想定外項目つきコメント"): Record<string, unknown> {
  return { free_comment: comment, unknownField: "x", foo: 1 };
}

/** free_comment 未指定（null）ボディ（032/033）。入力不正→400＋errors（正本md:108,125,191）。 */
export function buildMissingCommentPayload(): Record<string, unknown> {
  return {};
}
