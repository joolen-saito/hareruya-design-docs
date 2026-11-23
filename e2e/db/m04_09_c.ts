/**
 * M04-09 の続き（105 のステータス変更履歴）の、E2E が作った行への書き足し。物理名はこのファイルの SQL の中にだけ書く。
 * - 書くのは、画面で作った E2E の在庫移動（実行の印つきの商品コードの在庫を明細に持つもの）のステータス変更履歴だけ
 *   （依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」・2026-11-23「DB の直接の設定は E2E の行だけなら流してよい」。lib/db_write.ts の窓口を通す）。
 * - シード表（S-M04-09-GF-MOVE-DONE-105）は「DBシードで … ステータス変更履歴4件を登録する」とする。画面で入庫完了まで進めた移動の履歴を、
 *   シード表の4件（更新日・ステータス・更新者）にそろえる（画面の操作でできた残りの履歴は消す）。
 */
import { query } from "../lib/db";
import { deleteOwnRows, updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

/** 実行の印つきの商品コードの在庫を、出庫元か入庫先の明細に持つ在庫移動・振替の、ステータス変更履歴 */
const 自分の移動の履歴 = {
  sql: `select h.id from dtb_stock_move_transfer_status_history h where h.stock_move_transfer_id in (
          select smt.id from dtb_stock_move_transfer smt where exists (
            select 1 from dtb_stock_move_transfer_detail dd
              join dtb_product_stock ps on ps.id in (dd.move_from_product_stock_id, dd.move_to_product_stock_id)
              join dtb_product_class pc on pc.id = ps.product_class_id
             where dd.stock_move_transfer_id = smt.id and pc.product_code like '%-' || $1))`,
  params: [RUN_MARK],
};

export type 履歴の行 = { 番号: string; ステータス: string; 更新者: string; 更新日: string };

/** 在庫移動・振替のステータス変更履歴（履歴の番号の順。番号つき） */
export function 履歴の行(id: string): 履歴の行[] {
  return query(
    `select h.id::text as hid, s.status_name as st, m.name as mem, h.update_date::text as at
       from dtb_stock_move_transfer_status_history h
       join mtb_stock_move_transfer_status s on s.id = h.stock_move_transfer_status_id
       left join dtb_member m on m.id = h.update_member_id
      where h.stock_move_transfer_id = $1::int order by h.id`,
    [id],
  ).map((r) => ({ 番号: String(r.hid), ステータス: r.st ?? "", 更新者: r.mem ?? "", 更新日: r.at ?? "" }));
}

/** 名前（完全一致）のメンバーのID（1件であること。参照だけ） */
function メンバーID(名前: string): string {
  const r = query(`select m.id from dtb_member m where m.name = $1`, [名前]);
  if (r.length !== 1) throw new Error(`名前「${名前}」のメンバーが ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}

/** 履歴の1行の更新日（時差つき。例 2026-03-01 09:00:00+09）と更新者（名前のメンバー）を書き換える */
export function 履歴を整える(what: string, 番号: string, 更新日: string, 更新者名: string): void {
  updateOwnRows(what, {
    table: "dtb_stock_move_transfer_status_history", key: "id", ids: [番号],
    set: { update_date: 更新日, update_member_id: メンバーID(更新者名) }, owner: 自分の移動の履歴,
  });
}

/** 履歴の行を消す（シード表の4件に入らない、画面の操作でできた履歴） */
export function 履歴を消す(what: string, 番号: string[]): void {
  if (!番号.length) return;
  deleteOwnRows(what, { table: "dtb_stock_move_transfer_status_history", key: "id", ids: 番号, owner: 自分の移動の履歴 });
}
