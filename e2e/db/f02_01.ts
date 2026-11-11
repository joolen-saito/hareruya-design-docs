/** F02-01 本店PC版ナビゲーションのDB確認（参照だけ）。物理名はこのファイルの SQL にだけ書く。 */
import { query } from "../lib/db";

/** 会員（メールアドレス）のカートにある、商品名の明細の数量（明細が無ければ空の配列。明細ごとに1つ） */
export function 会員のカートの商品の数量(メール: string, 商品名: string): number[] {
  return query(`
    select ci.quantity::text as q
      from dtb_cart_item ci
      join dtb_cart c on c.id = ci.cart_id
      join dtb_customer cu on cu.id = c.customer_id
      join dtb_product_class pc on pc.id = ci.product_class_id
      join dtb_product p on p.id = pc.product_id
     where cu.email = $1 and p.name = $2
     order by ci.id`, [メール, 商品名]).map((r) => Number(r.q));
}
