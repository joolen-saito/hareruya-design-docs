/** M04-10 在庫移動振替CSV出力（003・004・009・010）のシードの、最新のステータス変更履歴の照会と日時の書き足し。物理名はこのファイルの SQL の中にだけ書く。 */
import { query } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

/** 在庫移動・振替の、いちばん新しいステータス変更履歴のID（無ければ空）と、そのステータス名 */
export function 最新の履歴(id: string): { 履歴ID: string; ステータス: string } {
  const r = query(
    `select h.id::text as hid, s.status_name as sn from dtb_stock_move_transfer_status_history h
       join mtb_stock_move_transfer_status s on s.id = h.stock_move_transfer_status_id
      where h.stock_move_transfer_id = $1::int order by h.id desc limit 1`, [id],
  )[0];
  return { 履歴ID: String(r?.hid ?? ""), ステータス: String(r?.sn ?? "") };
}

/** 画面で作った E2E の在庫振替（実行の印つきの商品コードの在庫を明細に持つ）の入庫日時を書く */
export function 入庫日時を書く(what: string, id: string, 日時: string): void {
  updateOwnRows(what, {
    table: "dtb_stock_move_transfer", key: "id", ids: [id], set: { move_to_stock_at: 日時 },
    owner: {
      sql: `select t.id from dtb_stock_move_transfer t where exists (
              select 1 from dtb_stock_move_transfer_detail dd
                join dtb_product_stock ps on ps.id in (dd.move_from_product_stock_id, dd.move_to_product_stock_id)
                join dtb_product_class pc on pc.id = ps.product_class_id
               where dd.stock_move_transfer_id = t.id and pc.product_code like '%-' || $1)`,
      params: [RUN_MARK],
    },
  });
}
