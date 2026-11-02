/** M05 のフロント注文のシードが、買う商品を選ぶための参照（SELECT だけ） */
import { query } from "../lib/db";

/**
 * 販売中の商品1点（商品名に「予約」を含まない・公開・在庫が十分ある）の商品ID。
 * 正本は「商品詳細画面で販売中の商品1点」と定める。手元のDBに既にある商品から、商品IDが最小のものを選ぶ。
 */
export function 販売中の商品ID(除く: string[] = []): string {
  const rows = query(
    `select p.id as "商品ID" from dtb_product p
       join dtb_product_class pc on pc.product_id = p.id and pc.visible
       left join dtb_product_stock s on s.product_class_id = pc.id
      where p.product_status_id = 1 and p.name not like '%予約%' and pc.sale_type_id = 1 and pc.price02 between 10 and 1000
      group by p.id having sum(s.stock) >= 100 order by p.id limit 10`,
  ).map((r) => r.商品ID ?? "").filter((id) => id && !除く.includes(id));
  if (rows.length === 0) throw new Error("販売中の商品が手元のDBに見つからない");
  return rows[0];
}
