/** M03-03 カード商品CSV出力のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。 */
import { query } from "../lib/db";

/** 購入グループに、日本語の名称がちょうど一致するものがあるか */
export function 購入グループがあるか(名称: string): boolean {
  return query(`select 1 as v from mtb_sell_group where name = $1 and deleted_at is null limit 1`, [名称]).length > 0;
}

/** 商品公開ステータスの名称（番号の順） */
export function 商品公開ステータスの名称(): string[] {
  return query(`select name as v from mtb_product_status order by id`).map((r) => String(r.v));
}
