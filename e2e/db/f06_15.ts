/** F06-15 買取履歴詳細のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 買取依頼IDの買取依頼の件数 */
export function 買取依頼の件数(買取依頼ID: string): number {
  return Number(query(`select count(*) as n from dtb_buy_order where id = $1`, [買取依頼ID])[0].n);
}

/** 買取番号（数字）の買取状況ID。無ければ null */
export function 買取状況ID(買取番号: string): number | null {
  const r = query(`select buy_order_status_id as v from dtb_buy_order where id = $1`, [String(Number(買取番号))])[0];
  return r ? Number(r.v) : null;
}

function 数字(s: string): string {
  if (!/^\d+$/.test(s)) throw new Error(`買取番号が数字でない（${s}）`);
  return String(Number(s));
}

/** 買取番号（7桁の表示または数字）の買取状況の ID と名前 */
export function 買取状況(買取番号: string): { ID: string; 名前: string } {
  const r = query(
    `select s.id, s.name from dtb_buy_order b join mtb_buy_order_status s on s.id = b.buy_order_status_id where b.id = $1`, [数字(買取番号)],
  )[0];
  if (!r) throw new Error(`買取番号 ${買取番号} の買取が無い`);
  return { ID: String(Number(r.id)), 名前: r.name ?? "" };
}
