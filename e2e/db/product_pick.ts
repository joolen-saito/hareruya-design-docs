/**
 * 画面の選択肢を読むために開く「既存の商品」を選ぶ照会（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";

/** 商品規格を1件以上持つ商品のうち、いちばん新しいものの商品ID（無ければ空） */
export function 規格のある商品ID(): string {
  return query(`select p.id::text as id from dtb_product p where exists (select 1 from dtb_product_class pc where pc.product_id = p.id) order by p.id desc limit 1`)[0]?.id ?? "";
}
