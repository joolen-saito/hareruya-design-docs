/** F06-07 購入履歴詳細のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 注文IDの受注の件数 */
export function 受注の件数(注文ID: string): number {
  return Number(query(`select count(*) as n from dtb_order where id = $1`, [注文ID])[0]?.n ?? 0);
}
