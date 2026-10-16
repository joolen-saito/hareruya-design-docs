/** 商品のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { count } from "../lib/db";

/** 商品IDの商品が何件保存されているか（削除されていれば0） */
export function 商品の件数(商品ID: string): number {
  return count("select id from dtb_product where id = $1", [商品ID]);
}
