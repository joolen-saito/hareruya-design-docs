/**
 * a06-17 店頭仕入_買取商品詳細取得（カード詳細IDに紐づく買取商品情報JSONを返す参照系GET API）用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a06_17_api_buying_products_by_detail_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは設計書(a06-17) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形（実DBは呼ばない）。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス」を仕様由来で判定する（正常取得=200／該当なし=404／不正detailは正常取得200とならない）。
 *  - 実装のレスポンス本文形・404メッセージはオラクルにしない（付帯表4#3）。本ファイルは送信先の組立のみ。
 *  - 認可方式（公開/IP制限/認証）は設計書から確定できず要実機確認（付帯表4#2）。認証情報は env で供給し原値はコミットしない。
 */

/**
 * 実効パス組立。由来: `#[Route('/%eccube_api_v1_route%/buying/{cardDetailId}.json', methods:['GET'])]`（BuyingController.php:46）
 *  ＋ `eccube_api_v1_route` 既定値 `api/v1`（eccube.yaml:6,55）＝実効 `GET /api/v1/buying/{cardDetailId}.json`。
 * 設計書パス `GET /buying/{detailId}` とは `/api/v1` プレフィクス・`.json`・変数名(detailId⇔cardDetailId)で不一致（付帯表4#1）。
 */
export function buildBuyingDetailPath(cardDetailId: string | number): string {
  return `/api/v1/buying/${cardDetailId}.json`;
}

/** SEED-A06-17-CARD-KNOWN 由来の実在カード詳細ID（買取商品が取得できる）。env で供給。 */
export const KNOWN_CARD_DETAIL_ID = process.env.A06_17_KNOWN_CARD_DETAIL_ID || "1";
/** 該当なし（実在しない）カード詳細ID → 404（処理フロー#3・NotFoundException＝BuyingController.php:57-59）。 */
export const NOT_FOUND_CARD_DETAIL_ID = process.env.A06_17_NOT_FOUND_CARD_DETAIL_ID || "99999999";
/** 不正な detailId（≦0）。正しい買取商品が取得されない（具体ステータスは要実機確認・付帯表4）。 */
export const INVALID_CARD_DETAIL_ID = "0";
/** 非数値 detailId（int パス変数の型解決に不一致＝ルート不一致/404等）。 */
export const NON_NUMERIC_CARD_DETAIL_ID = "abc";

/**
 * 認証ヘッダ。実装は `IsGranted('IS_AUTHENTICATED_FULLY')`＋getUser()がMember必須（BuyingController.php:34,50-51）だが、
 * 設計の認可方式は pf-api 方針で未確定＝要実機確認（付帯表4#2）。ヘッダ名/値は env で供給し原値はコミットしない。
 */
export function buildAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {};
  const name = process.env.A06_17_AUTH_HEADER;
  const value = process.env.A06_17_AUTH_VALUE;
  if (name && value) headers[name] = value;
  return { ...headers, ...(extra ?? {}) };
}
