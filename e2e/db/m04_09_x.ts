/**
 * M04-09 在庫移動・振替登録/編集の続き（仕分け直しで流せる見込みになったもの）の、E2E が作った行への書き足し。物理名はこのファイルの SQL の中にだけ書く。
 * - 書き足すのは、画面で作った E2E の行（実行の印つきの商品コードの在庫・その在庫を明細に持つ在庫移動・振替）だけ
 *   （依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」。lib/db_write.ts の窓口を通す）。
 * - 書くのはシード表の投入方法が「画面で指定できないためDBへ直接設定する」とするものだけ（在庫数・総原価、在庫の行が無い状態、日時、出庫承認の空、
 *   2件目のステータス変更履歴）。照会は参照だけ（lib/db.ts）。
 */
import { query } from "../lib/db";
import { deleteOwnRows, insertOwnRows, updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

const ZONE: Record<"EC-CUBE" | "スマレジ", number> = { "EC-CUBE": 1, "スマレジ": 2 };

// ---- 持ち主の確かめ（実行の印つきの商品コードの行だけ） ----

const 自分の在庫 = {
  sql: `select ps.id from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id where pc.product_code like '%-' || $1`,
  params: [RUN_MARK],
};
/** 実行の印つきの商品コードの在庫を、出庫元か入庫先の明細に持つ在庫移動・振替 */
const 自分の在庫移動振替 = {
  sql: `select smt.id from dtb_stock_move_transfer smt where exists (
          select 1 from dtb_stock_move_transfer_detail dd
            join dtb_product_stock ps on ps.id in (dd.move_from_product_stock_id, dd.move_to_product_stock_id)
            join dtb_product_class pc on pc.id = ps.product_class_id
           where dd.stock_move_transfer_id = smt.id and pc.product_code like '%-' || $1)`,
  params: [RUN_MARK],
};

function 在庫ID(code: string, 店名: string, 区分: "EC-CUBE" | "スマレジ"): string {
  const r = query(
    `select ps.id from dtb_product_stock ps
       join dtb_product_class pc on pc.id = ps.product_class_id
       join dtb_base_info b on b.id = ps.base_info_id
      where pc.product_code = $1 and b.shop_name = $2 and ps.stock_location_id = $3::int`,
    [code, 店名, ZONE[区分]],
  );
  if (r.length !== 1) throw new Error(`在庫（${code}・${店名}・${区分}）の行が ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}

/** 画面で作った E2E の商品の在庫に、在庫数・総原価を書き足す（シード表「画面で指定できないためDBへ直接設定する（在庫変動履歴は作らない）」） */
export function 在庫数と総原価を整える(what: string, code: string, 店名: string, 区分: "EC-CUBE" | "スマレジ", 在庫数: number, 総原価: number): void {
  updateOwnRows(what, { table: "dtb_product_stock", key: "id", ids: [在庫ID(code, 店名, 区分)], set: { stock: 在庫数, total_cost: 総原価 }, owner: 自分の在庫 });
}

/** 画面で作った E2E の商品の在庫の行を消す（シード表「無い状態を画面で指定できないためDBへ直接設定する（該当する在庫の行を削除する）」） */
export function 在庫の行を消す(what: string, code: string, 店名: string, 区分: "EC-CUBE" | "スマレジ"): void {
  deleteOwnRows(what, { table: "dtb_product_stock", key: "id", ids: [在庫ID(code, 店名, 区分)], owner: 自分の在庫 });
}

/** 在庫の行があるか */
export function 在庫の行がある(code: string, 店名: string, 区分: "EC-CUBE" | "スマレジ"): boolean {
  return query(
    `select ps.id from dtb_product_stock ps
       join dtb_product_class pc on pc.id = ps.product_class_id
       join dtb_base_info b on b.id = ps.base_info_id
      where pc.product_code = $1 and b.shop_name = $2 and ps.stock_location_id = $3::int`,
    [code, 店名, ZONE[区分]],
  ).length > 0;
}

/** 名前（完全一致）のメンバーのID（1件であること） */
export function メンバーID(名前: string): string {
  const r = query(`select m.id from dtb_member m where m.name = $1`, [名前]);
  if (r.length !== 1) throw new Error(`名前「${名前}」のメンバーが ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}

export type 移動の日時 = { 出庫承認日?: string; 入庫承認日?: string; 出庫日時?: string; 入庫日時?: string };

/** 画面で作った E2E の在庫移動の日時（画面では操作した日時になる）を、シード表の値にする。値は時差つき（例 2026-03-02 10:00:00+09） */
export function 移動の日時を整える(what: string, id: string, v: 移動の日時): void {
  const set: Record<string, string> = {};
  if (v.出庫承認日) set.move_from_approval_at = v.出庫承認日;
  if (v.入庫承認日) set.move_to_approval_at = v.入庫承認日;
  if (v.出庫日時) set.move_from_stock_at = v.出庫日時;
  if (v.入庫日時) set.move_to_stock_at = v.入庫日時;
  updateOwnRows(what, { table: "dtb_stock_move_transfer", key: "id", ids: [id], set, owner: 自分の在庫移動振替 });
}

/** 画面で作った E2E の在庫移動の入庫承認者を、名前のメンバー（E2E が作った試験管理者）にする */
export function 入庫承認者を整える(what: string, id: string, 名前: string): void {
  updateOwnRows(what, { table: "dtb_stock_move_transfer", key: "id", ids: [id], set: { move_to_approval_member_id: メンバーID(名前) }, owner: 自分の在庫移動振替 });
}

/** 画面で作った E2E の在庫移動の出庫承認日・出庫承認者を空にする（シード表「空の状態は画面で指定できないためDBへ直接設定する」） */
export function 出庫承認を空にする(what: string, id: string): void {
  updateOwnRows(what, { table: "dtb_stock_move_transfer", key: "id", ids: [id], set: { move_from_approval_at: null, move_from_approval_member_id: null }, owner: 自分の在庫移動振替 });
}

/**
 * 画面で作った E2E の在庫移動・振替に、ステータス変更履歴をもう1件足す（シード表「更新日時の異なる2件目の履歴は画面で指定できないためDBへ直接設定する」）。
 * ステータスと更新者は1件目と同じ、更新日時は1件目より ずらし時間 だけ前にする。足した履歴の更新日時（ISO）を返す。
 */
export function ステータス変更履歴を足す(what: string, id: string, ずらし時間ms: number): string {
  const r = query(
    `select h.stock_move_transfer_status_id as st, h.update_member_id as mem, to_char(h.update_date at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') as at
       from dtb_stock_move_transfer_status_history h where h.stock_move_transfer_id = $1::int order by h.id`,
    [id],
  );
  if (r.length !== 1) throw new Error(`${what}: 在庫移動・振替 ${id} のステータス変更履歴が ${r.length} 件（画面の登録でできる1件のはず）`);
  const at = new Date(Date.parse(String(r[0].at)) - ずらし時間ms).toISOString();
  insertOwnRows(what, {
    table: "dtb_stock_move_transfer_status_history", parentColumn: "stock_move_transfer_id",
    rows: [{ stock_move_transfer_id: id, stock_move_transfer_status_id: String(r[0].st), update_member_id: String(r[0].mem), update_date: at }],
    owner: 自分の在庫移動振替,
  });
  return at;
}

/** 在庫移動・振替の出庫日時・入庫日時と送り状No.（表示の確かめの注記用） */
export function 移動の日時と送り状(id: string): { 出庫日時: string | null; 入庫日時: string | null; 送り状No: string | null } | null {
  const r = query(
    `select smt.move_from_stock_at::text as fa, smt.move_to_stock_at::text as ta, smt.tracking_no as tn from dtb_stock_move_transfer smt where smt.id = $1::int`,
    [id],
  );
  return r.length ? { 出庫日時: r[0].fa, 入庫日時: r[0].ta, 送り状No: r[0].tn } : null;
}

/** 在庫移動・振替の登録日時（DBの形のまま） */
export function 登録日時(id: string): string | null {
  const r = query(`select smt.create_date::text as cd from dtb_stock_move_transfer smt where smt.id = $1::int`, [id]);
  return r.length ? r[0].cd : null;
}

export type 明細の商品 = { 商品コード: string; 商品名: string; 基準価格: number | null; 登録時在庫数: number | null; 移動点数: number };

/** 在庫移動・振替の明細の、出庫元（振替元）の商品の情報（明細IDの順） */
export function 明細の商品(id: string): 明細の商品[] {
  return query(
    `select pc.product_code as code, p.name as pname, dd.move_from_standard_price::text as sp, dd.move_from_stock_at_registration::text as reg, dd.move_transfer_quantity::text as q
       from dtb_stock_move_transfer_detail dd
       join dtb_product_stock ps on ps.id = dd.move_from_product_stock_id
       join dtb_product_class pc on pc.id = ps.product_class_id
       join dtb_product p on p.id = pc.product_id
      where dd.stock_move_transfer_id = $1::int order by dd.id`,
    [id],
  ).map((r) => ({
    商品コード: r.code ?? "", 商品名: r.pname ?? "", 基準価格: r.sp === null ? null : Number(r.sp),
    登録時在庫数: r.reg === null ? null : Number(r.reg), 移動点数: Number(r.q),
  }));
}
