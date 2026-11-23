/**
 * M04-10 在庫移動振替CSV出力のシードの、控える番号の照会と、E2E の在庫移動のステータス変更履歴の日時の書き足し。
 * 物理名はこのファイルの SQL の中にだけ書く。照会は参照だけ（lib/db.ts）。書き足しは lib/db_write.ts の窓口を通し、
 * 実行の印つきの商品コードの在庫を明細に持つ在庫移動・振替の履歴だけを書く（依頼者決定 2026-11-10・2026-11-23）。
 */
import { query } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

export type 控えるID = {
  移動指示ID: string;
  明細: { 明細ID: string; 商品コード: string; 商品ID: string; 出庫元在庫ID: string; 入庫先在庫ID: string }[];
  /** ステータスが「移動中」の変更履歴のID（無ければ空） */
  移動中の履歴ID: string;
};

export function 控えるIDを読む(id: string): 控えるID {
  const head = query(`select coalesce(move_instruction_id::text, '') as iid from dtb_stock_move_transfer where id = $1::int`, [id])[0];
  const 明細 = query(
    `select d.id::text as did, pc.product_code as code, pc.product_id::text as pid,
            d.move_from_product_stock_id::text as sf, d.move_to_product_stock_id::text as st
       from dtb_stock_move_transfer_detail d
       join dtb_product_stock ps on ps.id = d.move_from_product_stock_id
       join dtb_product_class pc on pc.id = ps.product_class_id
      where d.stock_move_transfer_id = $1::int order by d.id`, [id],
  ).map((r) => ({ 明細ID: String(r.did), 商品コード: String(r.code), 商品ID: String(r.pid), 出庫元在庫ID: String(r.sf), 入庫先在庫ID: String(r.st) }));
  const h = query(
    `select h.id::text as hid from dtb_stock_move_transfer_status_history h
       join mtb_stock_move_transfer_status s on s.id = h.stock_move_transfer_status_id
      where h.stock_move_transfer_id = $1::int and s.status_name = '移動中' order by h.id desc limit 1`, [id],
  )[0];
  return { 移動指示ID: String(head?.iid ?? ""), 明細, 移動中の履歴ID: String(h?.hid ?? "") };
}

/** 名前（完全一致）のメンバーのID */
export function メンバーID(名前: string): string {
  const r = query(`select m.id::text as id from dtb_member m where m.name = $1`, [名前]);
  if (r.length !== 1) throw new Error(`名前「${名前}」のメンバーが ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}

/** 実行の印つきの商品コードの在庫を明細に持つ在庫移動・振替の、ステータス変更履歴 */
const 自分の移動の履歴 = {
  sql: `select h.id from dtb_stock_move_transfer_status_history h where exists (
          select 1 from dtb_stock_move_transfer_detail dd
            join dtb_product_stock ps on ps.id in (dd.move_from_product_stock_id, dd.move_to_product_stock_id)
            join dtb_product_class pc on pc.id = ps.product_class_id
           where dd.stock_move_transfer_id = h.stock_move_transfer_id and pc.product_code like '%-' || $1)`,
  params: [RUN_MARK],
};

/** 画面で作った E2E の在庫移動の、「移動中」の変更履歴の日時を書く（シード表「画面に表示されないため、日時をDBへ直接設定する」） */
export function 移動中の履歴の日時を整える(what: string, 履歴ID: string, 日時: string): void {
  updateOwnRows(what, { table: "dtb_stock_move_transfer_status_history", key: "id", ids: [履歴ID], set: { update_date: 日時 }, owner: 自分の移動の履歴 });
}
