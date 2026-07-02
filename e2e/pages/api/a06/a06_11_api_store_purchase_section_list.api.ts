/**
 * a06-11 店頭仕入_部門一覧取得（公開対象の部門一覧JSONを返すパラメータなし参照系GET API）用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a06_11_api_store_purchase_section_list_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは設計書(a06-11) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形（実DBは呼ばない）。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス」を仕様由来で判定する（正常一覧=200／0件でも空一覧200）。
 *  - 実装の応答ラッパ・命名（部門配列を直接返す＝SectionController.php:40-49）はオラクルにしない（付帯表4#3/#4）。
 *  - 認可方式（公開/IP制限/認証）は設計書から確定できず要実機確認（付帯表4#2）。認証情報は env で供給し原値はコミットしない。
 */

/**
 * 実効パス。由来: `#[Route('/%eccube_api_v1_route%/admin/sections.json', methods:['GET'])]`（SectionController.php:35）
 *  ＋ `eccube_api_v1_route` 既定値 `api/v1`（eccube.yaml:6,55）＝実効 `GET /api/v1/admin/sections.json`。
 * 取得は `findBy(['visible'=>true], ['code'=>'ASC'])`（SectionController.php:38）＝公開対象を部門コード昇順で返す。
 */
export const SECTIONS_PATH = "/api/v1/admin/sections.json";

/** 想定外クエリ（パラメータ非参照＝SectionController.php は request パラメータを使わない）。 */
export const UNEXPECTED_QUERY = { unexpected: "x", foo: "1" } as Record<string, string>;

/**
 * 認証ヘッダ。実装は `IsGranted('IS_AUTHENTICATED_FULLY')`（SectionController.php:25）＝認証済必須だが、
 * 設計の認可方式は pf-api 方針で未確定＝要実機確認（付帯表4#2）。ヘッダ名/値は env で供給し原値はコミットしない。
 */
export function buildAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {};
  const name = process.env.A06_11_AUTH_HEADER;
  const value = process.env.A06_11_AUTH_VALUE;
  if (name && value) headers[name] = value;
  return { ...headers, ...(extra ?? {}) };
}
