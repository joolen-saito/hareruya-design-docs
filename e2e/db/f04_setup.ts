/**
 * F04 の共通のシード（pages/admin/f04_setup.ts）の照会（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";

/**
 * 在庫編集承認一覧の、baseline より後に足された未承認の入庫の行のうち、商品コードが codes のどれかに当たるものの在庫編集ID（一覧を ?id= で絞り込む値）。
 * 新しい順。一覧は「未承認が上・登録日の古い順」で、前の実行で残った未承認の行が1ページ目を埋めると今回の行が後ろのページに回るので、番号で開く。
 */
export function 未承認の在庫編集ID(baseline: number, codes: string[]): string[] {
  if (codes.length === 0) return [];
  return query(
    `select distinct a.history_source_id::text as src, a.id
       from dtb_stock_approval_list a
       join dtb_stock_edit_approval_detail d on d.stock_edit_approval_id = a.history_source_id
       join dtb_product_stock ps on ps.id = d.product_stock_id
       join dtb_product_class pc on pc.id = ps.product_class_id
      where a.history_source_type_id = 1 and a.approval_status = 1 and a.id > $1::int
        and pc.product_code = any(string_to_array($2, chr(9)))
      order by a.id desc`,
    [baseline, codes.join("\t")]).map((r) => r.src ?? "");
}

/**
 * 在庫編集承認一覧の、baseline より後に足された未承認の行のうち、登録者の名前と在庫の増減の合計が合うものの絞り込みの値（一覧を ?id= で開く値）。新しい順。
 * 在庫変更CSV登録の承認に使う（一覧の1ページ目が前の実行の未承認の行で埋まり、今回の行が後ろのページに回るため）。
 */
export function 未承認の行の絞り込みの値(baseline: number, 登録者名: string, 合計: number): string[] {
  return query(
    `select a.history_source_id::text as src
       from dtb_stock_approval_list a join dtb_member m on m.id = a.registered_member_id
      where a.approval_status = 1 and a.id > $1::int and m.name = $2 and a.inventory_change_total_count = $3::int
      order by a.id desc`,
    [baseline, 登録者名, 合計]).map((r) => r.src ?? "");
}
