/**
 * F10-02 購入完了の売上連携の DB 確認・書き足し。物理名はこのファイルの SQL の中にだけ書く。
 * 書き足しは lib/db_write.ts を通す（E2E が作った行だけ。持ち主の確かめは、実行の印つきの配送方法の名前・会員のメール）。
 */
import { query } from "../lib/db";
import { insertOwnRows, updateOwnRows } from "../lib/db_write";

/** 会員の最新の受注の番号（購入処理中の受注も、購入完了の受注も同じ受注） */
export function 会員の最新の受注ID(会員ID: string): string {
  const r = query(`select id from dtb_order where customer_id = $1 order by id desc limit 1`, [会員ID]);
  if (r.length === 0) throw new Error(`会員ID ${会員ID} の受注が無い`);
  return String(r[0].id);
}

/** 購入グループの番号（名前で引く） */
export function 購入グループの番号(名前: string): string {
  const r = query(`select id from mtb_sell_group where name = $1 order by id`, [名前]);
  if (r.length === 0) throw new Error(`購入グループ「${名前}」が無い`);
  return String(r[0].id);
}

/** 配送方法の番号（実行の印つきの名前で引く。ちょうど1件でなければ落とす） */
export function 配送方法の番号(名前: string): string {
  const r = query(`select id from dtb_delivery where name = $1 order by id`, [名前]);
  if (r.length !== 1) throw new Error(`配送方法「${名前}」が ${r.length} 件ある（1件のはず）`);
  return String(r[0].id);
}

/**
 * 画面の配送方法設定には、購入グループと地域別販売制限へ結びつける欄が無いので、画面で作った（印つきの）配送方法を、
 * 購入グループと、その購入グループの配送方法が結びついている地域別販売制限へ結びつける。ご注文方法指定画面の配送方法の選択肢に出すため。
 */
export function 配送方法を購入できる状態にする(what: string, 配送ID: string, 配送名: string, 購入グループ名: string): void {
  const owner = { sql: `select d.id from dtb_delivery d where d.name = $1`, params: [配送名] };
  const g = 購入グループの番号(購入グループ名);
  insertOwnRows(`${what}: 配送方法を購入グループへ結びつける`, {
    table: "dtb_sell_group_delivery", parentColumn: "delivery_id", rows: [{ sell_group_id: g, delivery_id: 配送ID }], owner,
  });
  const rr = query(
    `select distinct rd.region_restriction_id as id from dtb_region_restriction_delivery rd
       join dtb_sell_group_delivery sd on sd.delivery_id = rd.delivery_id where sd.sell_group_id = $1 and rd.delivery_id <> $2 order by 1`, [g, 配送ID]);
  if (rr.length === 0) return;
  insertOwnRows(`${what}: 配送方法を地域別販売制限へ結びつける`, {
    table: "dtb_region_restriction_delivery", parentColumn: "delivery_id",
    rows: rr.map((x) => ({ region_restriction_id: String(x.id), delivery_id: 配送ID })), owner,
  });
}

/** 受注に保存されたメールアドレスを変える（画面に、購入処理中の受注のメールを会員と別にする操作が無い）。持ち主は印つきの会員 */
export function 受注のメールを変える(what: string, 受注ID: string, 会員のメール: string, 新しいメール: string): void {
  updateOwnRows(what, {
    table: "dtb_order", key: "id", ids: [受注ID], set: { email: 新しいメール },
    owner: { sql: `select o.id from dtb_order o join dtb_customer c on c.id = o.customer_id where c.email = $1`, params: [会員のメール] },
  });
}
