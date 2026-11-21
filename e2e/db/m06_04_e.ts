/** M06-04 買取ステータス変更の金額の確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type 買取の金額 = { 買取金額: number | null; 販売金額: number; 明細の件数: number };

/** 店頭買取受注の、買取金額（査定合計金額）と、買取明細の販売金額の合計・明細の件数 */
export function 買取の金額(受注ID: string): 買取の金額 {
  if (!/^\d+$/.test(受注ID)) throw new Error(`番号が数字でない（${受注ID}）`);
  const r = query(
    `select o.total_price::text as total,
            coalesce((select sum(d.sell_price * d.original_quantity) from dtb_otc_buy_order_detail d where d.otc_buy_order_id = o.id), 0)::text as sell,
            (select count(*) from dtb_otc_buy_order_detail d where d.otc_buy_order_id = o.id)::text as n
       from dtb_otc_buy_order o where o.id = $1::int`, [受注ID]);
  if (r.length !== 1) throw new Error(`店頭買取受注ID ${受注ID} の買取が ${r.length} 件`);
  return { 買取金額: r[0].total === null ? null : Number(r[0].total), 販売金額: Number(r[0].sell), 明細の件数: Number(r[0].n) };
}
