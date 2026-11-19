/**
 * B16-09 サイトマップ生成処理の DB の参照（読むだけ）。物理名はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";

/** 本店の基本情報の「在庫なし商品を隠す」設定が有効か */
export function 在庫なし商品を隠す(): boolean {
  const r = query(`select case when option_nostock_hidden then '1' else '0' end as v from dtb_base_info where id = 1`);
  return r[0]?.v === "1";
}

/** 公開中の商品の件数 */
export function 公開中の商品の数(): number {
  return Number(query(`select count(*)::text as n from dtb_product where product_status_id = 1`)[0]?.n ?? "0");
}

/** 削除されておらず、非公開でないデッキの件数 */
export function 公開のデッキの数(): number {
  return Number(query(`select count(*)::text as n from dtb_deck where deleted_at is null and not coalesce(private_flg, false)`)[0]?.n ?? "0");
}
