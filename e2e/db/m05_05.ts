/** M05-05 のシードが、画面から読めない番号を控えるための参照（SELECT だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 管理画面の注文番号（8桁）の受注の注文IDと、その配送IDの一覧 */
export function 注文IDと配送ID(注文番号: string): { 注文ID: string; 配送ID: string[] } {
  // 手元のDBには、同じ注文番号の古い受注がある（注文番号の採番が戻っているため）。今回の注文は、その中で注文IDが最大のもの
  const o = query(`select id as "注文ID" from dtb_order where order_number = $1 order by id desc limit 1`, [注文番号]);
  if (o.length !== 1) throw new Error(`注文番号 ${注文番号} の受注が見つからない`);
  const id = o[0].注文ID ?? "";
  const s = query(`select id as "配送ID" from dtb_shipping where order_id = $1 order by id`, [id]);
  return { 注文ID: id, 配送ID: s.map((r) => r.配送ID ?? "") };
}
