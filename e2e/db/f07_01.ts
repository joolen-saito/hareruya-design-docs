/** F07-01 のDB確認（参照のみ） */
import { count } from "../lib/db";

/** 店舗IDの店舗が登録されているか */
export function 店舗が登録されている(店舗ID: number): boolean {
  return count("select 1 from dtb_base_info where id = $1", [店舗ID]) > 0;
}
