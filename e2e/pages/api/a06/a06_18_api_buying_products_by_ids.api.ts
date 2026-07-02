/**
 * a06-18 店頭仕入_買取商品複数ID取得（商品IDリストから買取商品情報JSONを返す参照系POST API）用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a06_18_api_buying_products_by_ids_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは設計書(a06-18) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形（実DBは呼ばない）。
 * ※ a06-10 と同一実効パス・同一実装（api_buying_products）。テストID接頭辞・環境ガード名のみ機能ごとに分離する。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス」を仕様由来で判定する（正常取得=200／0件=エラーとせず200・404にしない）。
 *  - 実装のレスポンス本文形（空=`{cards:{}}`／Formatter.php:123）はオラクルにしない（付帯表4#3）。本ファイルは送信データの組立のみ。
 *  - 認可方式（公開/IP制限/認証）は設計書から確定できず要実機確認（付帯表4#2）。認証情報は env で供給し原値はコミットしない。
 */

/**
 * 実効パス。由来: `#[Route('/%eccube_api_v1_route%/buying/products', methods:['POST'])]`（BuyingController.php:67）
 *  ＋ `eccube_api_v1_route` 既定値 `api/v1`（eccube.yaml:6,55）＝実効 `POST /api/v1/buying/products`。
 * 設計書パス `POST /buying/products` とは `/api/v1` プレフィクスで不一致（付帯表4#1）。テストは実効パスへ送信。
 */
export const BUYING_PRODUCTS_PATH = "/api/v1/buying/products";

/** ids はボディ取得・カンマ区切り（BuyingController.php:70 `$request->request->get('ids','')`）。フォーム値で送る。 */
export function buildIdsForm(ids: string): Record<string, string> {
  return { ids };
}

/** SEED-A06-18-CARD-KNOWN 由来の買取対象（実在カード）商品ID（複数ID取得の検証）。env で供給。 */
export const KNOWN_PRODUCT_IDS = process.env.A06_18_KNOWN_PRODUCT_IDS || "1,2";
/** 重複・順序混在の商品ID（IN句で吸収＝MtbCardRepository.php:113-114）。 */
export const DUP_PRODUCT_IDS = process.env.A06_18_DUP_PRODUCT_IDS || "1,1,2";
/** 有効ID＋該当なしIDの混在（該当分のみ返却・該当なしIDは結果に含まれない）。 */
export const MIXED_PRODUCT_IDS = process.env.A06_18_MIXED_PRODUCT_IDS || "1,99999999";
/** カード商品以外のID（数値だが買取カードに紐づかない）→ 0件200（404にしない）。 */
export const NON_CARD_PRODUCT_IDS = process.env.A06_18_NON_CARD_PRODUCT_IDS || "88888888,99999999";
/** 非数値・不正トークン（数字フィルタで除外→空→0件200）。 */
export const INVALID_IDS = "abc,xyz,@@@";
/** 空 ids（未指定/空＝0件200・Member検査前に返す＝BuyingController.php:80-82）。 */
export const EMPTY_IDS = "";

/**
 * 認証ヘッダ。実装は `IsGranted('IS_AUTHENTICATED_FULLY')`（BuyingController.php:34）＝認証済必須だが、
 * 設計の認可方式は pf-api 方針で未確定＝要実機確認（付帯表4#2）。ヘッダ名/値は env で供給し原値はコミットしない。
 */
export function buildAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {};
  const name = process.env.A06_18_AUTH_HEADER; // 例: Authorization / jwt-token（要実機確認）
  const value = process.env.A06_18_AUTH_VALUE;
  if (name && value) headers[name] = value;
  return { ...headers, ...(extra ?? {}) };
}
