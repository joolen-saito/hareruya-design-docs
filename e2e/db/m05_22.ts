/**
 * M05-22 出荷指示：納品書印刷（日本語）の DB 確認と、E2E が作った行への書き足し（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」）。
 * 物理名はこのファイルの SQL の中にだけ書く。書き足しは lib/db_write.ts を通し、持ち主（試験会員のメールアドレス）を確かめてから書く。
 * M05-09・M05-10 と同じ書き足し（受注日時・注文者の都道府県・配送先の都道府県／国・明細の商品規格・プレイヤー・会員・配送先）は db/m05_09.ts・db/m05_10.ts を使う。
 */
import { query } from "../lib/db";
import { Owner, updateOwnRows } from "../lib/db_write";

const 配送先の持ち主 = (配送先IDs: string[], メール: string): Owner => ({
  sql: `select s.id from dtb_shipping s join dtb_order o on o.id = s.order_id join dtb_customer c on c.id = o.customer_id where s.id = any($1::int[]) and c.email = $2`,
  params: [`{${配送先IDs.join(",")}}`, メール],
});
const 明細の持ち主 = (明細IDs: string[], メール: string): Owner => ({
  sql: `select oi.id from dtb_order_item oi join dtb_order o on o.id = oi.order_id join dtb_customer c on c.id = o.customer_id where oi.id = any($1::int[]) and c.email = $2`,
  params: [`{${明細IDs.join(",")}}`, メール],
});

/** 配送先の配送方法を外す（画面では配送方法は必須） */
export function 配送先の配送方法を外す(what: string, 配送先IDs: string[], メール: string): void {
  updateOwnRows(what, { table: "dtb_shipping", key: "id", ids: 配送先IDs, set: { delivery_id: null }, owner: 配送先の持ち主(配送先IDs, メール) });
}

/** 明細の商品の紐付けを外す（画面では商品を持たない商品明細を作れない） */
export function 明細の商品を外す(what: string, 明細IDs: string[], メール: string): void {
  updateOwnRows(what, { table: "dtb_order_item", key: "id", ids: 明細IDs, set: { product_id: null }, owner: 明細の持ち主(明細IDs, メール) });
}

/** 受注の対応状況の名前 */
export function 受注の対応状況名(受注ID: string): string {
  return query(`select st.name from dtb_order o join mtb_order_status st on st.id = o.order_status_id where o.id = $1::int`, [受注ID])[0]?.name ?? "";
}

/** 対応状況「出荷指示」がマスタにあるか */
export function 出荷指示の対応状況がある(): boolean {
  return query(`select id from mtb_order_status where name = '出荷指示'`).length === 1;
}

/** 配送方法の出荷指示リスト除外の設定（生成で受注が外れるか） */
export function 出荷指示リストから外れる配送方法か(名前: string): boolean | null {
  const r = query(`select is_shipping_standby_list_exclusion::text as ex from dtb_delivery where name = $1 order by id limit 1`, [名前])[0];
  return r ? r.ex === "true" : null;
}

/** 商品サブ情報・商品規格サブ情報に当たる表が、このアプリのデータベースにあるか（現行の表の名前で探す） */
export function サブ情報の表がある(): { 商品: boolean; 商品規格: boolean } {
  const r = query(`select
      (select count(*) from pg_tables where schemaname = 'public' and tablename = 'dtb_product_sub_info')::text as p,
      (select count(*) from pg_tables where schemaname = 'public' and tablename = 'dtb_product_class_sub_info')::text as pc`)[0];
  return { 商品: r.p !== "0", 商品規格: r.pc !== "0" };
}
