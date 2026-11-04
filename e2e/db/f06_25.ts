/** F06-25 店頭モニターのDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 店舗IDの店舗が本店か（店舗が無ければ null）と店名 */
export function 店舗(店舗ID: number): { 本店: boolean; 店名: string } | null {
  const r = query(`select is_main_shop, shop_name from dtb_base_info where id = $1`, [店舗ID])[0];
  return r ? { 本店: r.is_main_shop === "true", 店名: r.shop_name ?? "" } : null;
}
