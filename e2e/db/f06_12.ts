/** F06-12 ネット買取の一括買取確認のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 買取依頼IDの買取依頼の件数 */
export function 買取依頼の件数(買取依頼ID: number): number {
  return Number(query(`select count(*) as n from dtb_buy_order where id = $1`, [買取依頼ID])[0].n);
}

/** 会員のネット買取依頼のうち、IDがいちばん大きいもの（会員が作ったばかりの依頼を指す。無ければ null） */
export function 会員の最新のネット買取依頼ID(会員ID: string): string | null {
  return query(`select id from dtb_buy_order where customer_id = $1::int order by id desc limit 1`, [会員ID])[0]?.id ?? null;
}

/** 会員の店頭買取依頼のうち、IDがいちばん大きいもの（無ければ null） */
export function 会員の最新の店頭買取依頼ID(会員ID: string): string | null {
  return query(`select id from dtb_otc_buy_order where customer_id = $1::int order by id desc limit 1`, [会員ID])[0]?.id ?? null;
}

export type 依頼の状態 = { 更新日時: string; 通常明細の件数: number; 個別入力明細の件数: number };

/** ネット買取依頼の更新日時と、買取の明細（まとめて買取を含む）・個別入力の明細の件数 */
export function 依頼の状態(買取依頼ID: string): 依頼の状態 {
  const o = query(`select to_char(update_date, 'YYYY-MM-DD HH24:MI:SS.US') as d from dtb_buy_order where id = $1::int`, [買取依頼ID])[0];
  const m = query(`select count(*) as n from dtb_buy_main_card where buy_order_id = $1::int`, [買取依頼ID])[0];
  const i = query(`select count(*) as n from dtb_buy_order_indivisual_input_product where buy_order_id = $1::int`, [買取依頼ID])[0];
  return { 更新日時: o?.d ?? "（依頼なし）", 通常明細の件数: Number(m.n), 個別入力明細の件数: Number(i.n) };
}

/** 買取依頼IDのネット買取依頼の所有会員ID（無ければ null） */
export function ネット買取依頼の所有会員ID(買取依頼ID: string): string | null {
  return query(`select customer_id from dtb_buy_order where id = $1::int`, [買取依頼ID])[0]?.customer_id ?? null;
}
