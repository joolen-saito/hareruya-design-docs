/** A17-05 のシードの確かめ（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/**
 * 商品コード・店舗・増減数の、未承認の入庫の在庫編集の番号（在庫編集承認一覧を絞り込む番号）。新しい順。
 * 在庫編集承認一覧には商品コードが出ず、ほかの方の未承認の行が1ページ目を埋めることがあるので、この番号で絞り込んで開く（M04-13 と同じ形）。
 */
export function 未承認の入庫の在庫編集番号(商品コード: string, 店名: string, 増減数: number): string[] {
  return query(
    `select a.history_source_id::text as src
       from dtb_stock_approval_list a
       join dtb_stock_edit_approval_detail d on d.stock_edit_approval_id = a.history_source_id
       join dtb_product_stock ps on ps.id = d.product_stock_id
       join dtb_product_class pc on pc.id = ps.product_class_id
       join dtb_base_info bi on bi.id = a.base_info_id
      where a.history_source_type_id = 1 and pc.product_code = $1 and bi.shop_name = $2 and d.edit_quantity = $3::int and a.approval_status = 1
      order by a.id desc`,
    [商品コード, 店名, 増減数]).map((r) => String(r.src));
}
