/** M05-11: 商品画像つきの販売中の商品を探す（参照だけ） */
import { query } from "../lib/db";

/** 商品画像が登録済みで、公開・在庫が十分ある商品（商品IDが最小）。商品IDと商品コードを返す */
export function 画像つきの販売中の商品(): { 商品ID: string; 商品コード: string } {
  const r = query(
    `select p.id as "商品ID", min(pc.product_code) as "商品コード" from dtb_product p
       join dtb_product_image pi on pi.product_id = p.id
       join dtb_product_class pc on pc.product_id = p.id and pc.visible
       left join dtb_product_stock s on s.product_class_id = pc.id
      where p.product_status_id = 1 and p.name not like '%予約%' and pc.sale_type_id = 1 and pc.price02 between 10 and 1000
      group by p.id having sum(s.stock) >= 100 and count(distinct pc.id) = 1 order by p.id limit 1`,
  );
  if (r.length === 0) throw new Error("商品画像つきの販売中の商品が手元のDBに見つからない");
  return { 商品ID: r[0].商品ID ?? "", 商品コード: r[0].商品コード ?? "" };
}
