/**
 * a06-15 店頭買取受注_同一所属店舗メンバー取得（同一所属店舗のメンバー候補一覧JSONを返す参照系GET API）用 ペイロード／ヘルパ。
 * ケース表 integration_test/e2e/a06_15_api_store_purchase_otc_buy_order_same_store_members_e2e_cases.md（付帯表1 E2E可否 / 付帯表3 SEED / 付帯表4 要確認）に対応。
 * 本ファイルは設計書(a06-15) 入出力記載のリクエスト仕様のみを最小構成で組む未実行雛形（実DBは呼ばない）。
 *
 * 重要（付帯表4#1）: MTGバイヤーAPIに同一所属店舗メンバー取得専用の公開GETルートは実装で確認できない。
 *  対応する取得ロジックは `MemberRepository::getApprovalAuthorityMembers(?BaseInfo)`（MemberRepository.php:162-213）で、
 *  `SELECT … FROM dtb_member m INNER JOIN dtb_member_base_info mbi … WHERE mbi.base_info_id = :BaseInfoId … ORDER BY m.name`
 *  （MemberRepository.php:165-188）だが管理画面フォーム内部利用で公開GETルートとして露出していない。
 *  よって送信先パス・応答項目・絞り込みキーは要実機確認＝本機能のAPI/統合ケースは全て test.fixme（spec参照）。
 *
 * 値の出所と独立性:
 *  - 期待値（合否）は spec 側で「HTTPステータス（正常一覧=200／0件でも空一覧200）」を仕様由来で判定する想定だが、
 *    公開ルート未確認のため未実行（fixme）。実装の応答項目・命名・並び順はオラクルにしない（付帯表4#3/#4/#5）。
 */

/**
 * 送信先パス（要実機確認）。専用GETルートが実装で未確認のため env で供給する（既定はプレースホルダ）。
 * 取得ロジック由来: getApprovalAuthorityMembers（MemberRepository.php:162）／所属店舗＝`$Member->getBaseInfo()->getId()`（OtcBuyOrderController.php:77）。
 */
export const SAME_STORE_MEMBERS_PATH =
  process.env.A06_15_SAME_STORE_MEMBERS_PATH || "/api/v1/admin/otcBuyOrder/sameStoreMembers.json";

/**
 * 認証ヘッダ。実装は `IsGranted('IS_AUTHENTICATED_FULLY')`（OtcBuyOrderController.php:51）＝認証済必須。
 * 認可方式の実体は要実機確認（付帯表4#2）。ヘッダ名/値は env で供給し原値はコミットしない。
 */
export function buildAuthHeaders(extra?: Record<string, string>): Record<string, string> {
  const headers: Record<string, string> = {};
  const name = process.env.A06_15_AUTH_HEADER;
  const value = process.env.A06_15_AUTH_VALUE;
  if (name && value) headers[name] = value;
  return { ...headers, ...(extra ?? {}) };
}
