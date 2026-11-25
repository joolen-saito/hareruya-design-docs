/** M03-37 追加分の DB 確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。 */
import { count } from "../lib/db";

/** 商品IDの商品の件数（削除済みも含む） */
export function 商品IDの件数(商品ID: string): number {
  return count("select id from dtb_product where id = $1::int", [商品ID]);
}
