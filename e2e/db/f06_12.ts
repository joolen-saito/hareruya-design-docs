/** F06-12 ネット買取の一括買取確認のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 買取依頼IDの買取依頼の件数 */
export function 買取依頼の件数(買取依頼ID: number): number {
  return Number(query(`select count(*) as n from dtb_buy_order where id = $1`, [買取依頼ID])[0].n);
}
