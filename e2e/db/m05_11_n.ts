/** M05-11 受注情報編集のDB確認（SELECT だけ）。キャンセル後の受注のポイント */
import { query } from "../lib/db";

/** 受注の使用ポイントと付与ポイント（最新の受注） */
export function 受注のポイント(注文番号: string): { 使用: number; 付与: number; 会員の保持: number } {
  const r = query(
    `select o.spended_points as "使用", o.gained_points as "付与", p.point as "保持"
       from dtb_order o left join dtb_player p on p.customer_id = o.customer_id
      where o.order_number = $1 and o.base_info_id = 1 order by o.id desc limit 1`, [注文番号]);
  if (r.length !== 1) throw new Error(`注文番号「${注文番号}」の受注が無い`);
  return { 使用: Number(r[0].使用), 付与: Number(r[0].付与), 会員の保持: Number(r[0].保持) };
}
