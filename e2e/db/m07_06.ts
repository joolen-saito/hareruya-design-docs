/** M07-06（買取商品一覧CSV出力）のDB確認の照会。物理名はここの SQL にだけ書く（参照だけ） */
import { query } from "../lib/db";

/** 商品コード（規格の商品コード）の規格の基準価格。無ければ null */
export function 基準価格(商品コード: string): number | null {
  const r = query("select standard_price as v from dtb_product_class where product_code = $1 order by id desc limit 1", [商品コード])[0];
  return r && r.v !== null ? Number(r.v) : null;
}
