/**
 * M05-14 対応状況設定の連携ケースの受注シードが使う DB の参照（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";

/**
 * 登録者（ログインID）が在庫変更CSV登録で登録した、未承認の行（店舗ID・増減数が合うもの）の番号（承認一覧の「?id=」に渡す値）。新しい順。
 * 本店の在庫編集承認一覧には未承認の行が1,000件を超えて積み重なり、一覧の表示に今回の行が出ないので、番号で開く。
 */
export function 未承認の在庫変更CSVの番号(登録者のログインID: string, 店舗ID: string, 増減数: number): string[] {
  return query(
    `select a.history_source_id::text as src
       from dtb_stock_approval_list a
       join dtb_member m on m.id = a.registered_member_id
      where a.history_source_type_id = 3 and m.login_id = $1 and a.base_info_id = $2::int and a.inventory_change_total_count = $3::int and a.approval_status = 1
      order by a.id desc`,
    [登録者のログインID, 店舗ID, 増減数]).map((r) => String(r.src));
}
