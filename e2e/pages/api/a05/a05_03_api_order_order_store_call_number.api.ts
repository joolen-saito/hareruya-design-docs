/**
 * a05-03 呼出番号取得（GET参照系JSON API）API/統合レイヤ用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a05_03_api_order_order_store_call_number_e2e_cases.md（付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは設計書(a05-03) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス＋応答配列の構造/型/並び」を仕様由来で判定する。
 *  - 実装の数字int化・店舗(base_info_id)絞り込み・waitingNumber昇順はオラクルに固定しない（付帯表4#2/#3/#4）。
 *  - 既知SEED値は env で供給し、未設定時の既定値は創作値（要実機確認）。
 */

/**
 * 実効パス。
 * 由来: `#[Route(path: '/waiting_api/get_waiting_number/{base_info_id}', name: 'get_waiting_number',
 *        requirements: ['base_info_id' => '\d+'], methods: ['GET'])]`（WaitingNumberController.php:56）。
 * 設計書パス `GET /{_locale}/waiting_api/get_waiting`（言語prefixあり・末尾 `get_waiting`）とは不一致（付帯表4#1）。
 * 実装は base_info_id 必須パスパラメータで店舗絞り込みを行う（設計はパラメータなし＝付帯表4#2）。
 */
export const WAITING_NUMBER_PATH_PREFIX = "/waiting_api/get_waiting_number";

/** GET送信先パスを組み立てる（base_info_id は実装の必須パスパラメータ）。 */
export function buildWaitingNumberPath(baseInfoId: string | number): string {
  return `${WAITING_NUMBER_PATH_PREFIX}/${baseInfoId}`;
}

/** SEED-A05-03-BASEINFO ピック完了/英字札が紐づく既知 BaseInfo ID（要実機確認: env で供給）。 */
export const KNOWN_BASE_INFO_ID = process.env.A05_03_KNOWN_BASE_INFO_ID || "1";
/** SEED-A05-03-EMPTY 対象0件の BaseInfo ID（ピック完了・waiting_number・waiting_tag いずれも0件。E2E-A05-03-008）。 */
export const EMPTY_BASE_INFO_ID = process.env.A05_03_EMPTY_BASE_INFO_ID || "999999";

/** 想定外クエリ項目（E2E-A05-03-011）。入力検証なしのため無視され取得できることを期待。 */
export const UNKNOWN_QUERY_PARAMS: Record<string, string> = { unknownField: "x", foo: "1" };
