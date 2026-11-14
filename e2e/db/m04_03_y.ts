/**
 * M04-03 在庫一括編集（所属のマスタを使うケース）の DB 確認。参照だけ。物理名はこのファイルの SQL の中にだけ書く。
 * 照会の別名に t は使わない（lib/db の包みの名前と重なる）。
 */
import { query } from "../lib/db";

export type 承認明細 = {
  承認ID: string; 承認ステータス: number; 登録者ID: string; 承認者ID: string | null; 承認日時: string | null; 店舗ID: string; 区分ID: string;
  明細ID: string; 在庫ID: string; 在庫増減数: number; 仕入単価: number | null; 在庫変動理由: string;
};

/** 在庫に付いた在庫編集承認の明細（新しい順） */
export function 在庫の承認明細(在庫ID: string): 承認明細[] {
  return query(
    `select a.id as aid, a.approval_status, a.registered_member_id, a.approval_member_id, a.approved_at, a.base_info_id, a.stock_change_type_detail_id,
            d.id as did, d.product_stock_id, d.edit_quantity, d.purchase_unit_price, d.stock_change_reason
       from dtb_stock_edit_approval_detail d join dtb_stock_edit_approval a on a.id = d.stock_edit_approval_id
      where d.product_stock_id = $1 order by d.id desc`, [在庫ID],
  ).map((r) => ({
    承認ID: String(r.aid), 承認ステータス: Number(r.approval_status), 登録者ID: String(r.registered_member_id), 承認者ID: r.approval_member_id === null ? null : String(r.approval_member_id),
    承認日時: r.approved_at, 店舗ID: String(r.base_info_id), 区分ID: String(r.stock_change_type_detail_id), 明細ID: String(r.did), 在庫ID: String(r.product_stock_id),
    在庫増減数: Number(r.edit_quantity), 仕入単価: r.purchase_unit_price === null ? null : Number(r.purchase_unit_price), 在庫変動理由: String(r.stock_change_reason ?? ""),
  }));
}

/** 承認一覧（在庫一括編集の種別）の行。承認IDで引く */
export function 承認一覧の行(承認ID: string): { 件数: number; 承認ステータス: number | null; 承認者ID: string | null; 店舗ID: string | null; 在庫区分ID: string | null; 在庫点数: number | null } {
  const r = query(
    `select l.approval_status, l.approval_member_id, l.base_info_id, l.stock_location_id, l.product_stock_total_count from dtb_stock_approval_list l
      where l.history_source_type_id = 2 and l.history_source_id = $1`, [承認ID],
  );
  const x = r[0];
  return { 件数: r.length, 承認ステータス: x ? Number(x.approval_status) : null, 承認者ID: x?.approval_member_id ?? null, 店舗ID: x ? String(x.base_info_id) : null, 在庫区分ID: x ? String(x.stock_location_id) : null, 在庫点数: x ? Number(x.product_stock_total_count) : null };
}

/** 在庫の在庫変動履歴の件数 */
export function 在庫の履歴件数(在庫ID: string): number {
  return Number(query(`select count(*) as n from dtb_stock_history where product_stock_id = $1`, [在庫ID])[0]?.n ?? 0);
}

/** 在庫の在庫数・総原価 */
export function 在庫の数と原価(在庫ID: string): { 在庫数: number; 総原価: number } {
  const r = query(`select stock, total_cost from dtb_product_stock where id = $1`, [在庫ID])[0];
  if (!r) throw new Error(`在庫ID ${在庫ID} の在庫が無い`);
  return { 在庫数: Number(r.stock), 総原価: Number(r.total_cost) };
}

/** 管理者IDをログインIDで引く */
export function メンバーID(ログインID: string): string {
  const r = query(`select id from dtb_member where login_id = $1`, [ログインID]);
  if (r.length !== 1) throw new Error(`ログインID ${ログインID} の管理者が ${r.length} 件`);
  return String(r[0].id);
}

/** 所属のID（名称が一致する1件） */
export function 所属のID(名称: string): string {
  const r = query(`select id from mtb_department where name = $1`, [名称]);
  if (r.length !== 1) throw new Error(`所属「${名称}」が所属のマスタに ${r.length} 件`);
  return String(r[0].id);
}
