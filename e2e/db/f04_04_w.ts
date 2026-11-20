/**
 * F04-04 決済〜購入完了の「手順で DB を書き換える」ケースと、シードの書き足し。物理名はこのファイルの SQL の中にだけ書く。
 * - 書き換えるのは、画面で作った E2E の行（実行の印つきの商品コードの規格・実行の印つきのメールの会員とその受注）だけ
 *   （依頼者決定 2026-11-10。lib/db_write.ts の窓口を通す）。
 * - 照会は参照だけ（lib/db.ts）。
 */
import { query } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

const 自分の規格 = { sql: `select pc.id from dtb_product_class pc where pc.product_code like '%-' || $1`, params: [RUN_MARK] };
const 自分の商品 = { sql: `select p.id from dtb_product p where exists (select 1 from dtb_product_class pc where pc.product_id = p.id and pc.product_code like '%-' || $1)`, params: [RUN_MARK] };
const 自分の在庫 = { sql: `select ps.id from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id where pc.product_code like '%-' || $1`, params: [RUN_MARK] };
const 自分の会員 = { sql: `select c.id from dtb_customer c where c.email like '%-' || $1 || '@example.test'`, params: [RUN_MARK] };
const 自分の受注 = {
  sql: `select o.id from dtb_order o where o.customer_id in (select c.id from dtb_customer c where c.email like '%-' || $1 || '@example.test')`,
  params: [RUN_MARK],
};

function 規格(商品コード: string): { 規格ID: string; 商品ID: string } {
  const r = query(`select pc.id, pc.product_id from dtb_product_class pc where pc.product_code = $1`, [商品コード]);
  if (r.length !== 1) throw new Error(`商品コード ${商品コード} の規格が ${r.length} 件（1件のはず）`);
  return { 規格ID: String(r[0].id), 商品ID: String(r[0].product_id) };
}

/** 商品コードの規格の商品規格ID（カート画面の行と突き合わせる） */
export function 商品規格ID(商品コード: string): string { return 規格(商品コード).規格ID; }

// ---- 書き換え ----
export function 在庫無制限にする(what: string, 商品コード: string): void {
  updateOwnRows(what, { table: "dtb_product_class", key: "id", ids: [規格(商品コード).規格ID], set: { stock_unlimited: true }, owner: 自分の規格 });
}
export function 商品を非公開にする(what: string, 商品コード: string): void {
  updateOwnRows(what, { table: "dtb_product", key: "id", ids: [規格(商品コード).商品ID], set: { product_status_id: 2 }, owner: 自分の商品 });
}
export function 購入制限数を変える(what: string, 商品コード: string, 数: number): void {
  updateOwnRows(what, { table: "dtb_product_class", key: "id", ids: [規格(商品コード).規格ID], set: { sale_limit: 数 }, owner: 自分の規格 });
}
/** 商品コードの在庫のうち、在庫のある行（購入のあった店舗の行）の在庫数を変える */
export function 在庫数を変える(what: string, 商品コード: string, 数: number): void {
  const ids = query(`select ps.id from dtb_product_stock ps where ps.product_class_id = $1 and ps.stock > 0`, [規格(商品コード).規格ID]).map((r) => String(r.id));
  updateOwnRows(what, { table: "dtb_product_stock", key: "id", ids, set: { stock: 数 }, owner: 自分の在庫 });
}
export function 会員の累計を整える(what: string, メール: string, 回数: number, 金額: number): void {
  const r = query(`select c.id from dtb_customer c where c.email = $1`, [メール]);
  if (r.length !== 1) throw new Error(`${what}: メール ${メール} の会員が ${r.length} 件`);
  updateOwnRows(what, { table: "dtb_customer", key: "id", ids: [String(r[0].id)], set: { buy_times: 回数, buy_total: 金額 }, owner: 自分の会員 });
}
/** 受注の保持する支払方法を、支払方法の名前（先頭の1件）に変える */
export function 受注の支払方法を変える(what: string, 受注ID: string, 支払方法名: string): void {
  const p = query(`select p.id from dtb_payment p where p.payment_method = $1 order by p.id limit 1`, [支払方法名]);
  if (p.length !== 1) throw new Error(`${what}: 支払方法「${支払方法名}」が無い`);
  updateOwnRows(what, { table: "dtb_order", key: "id", ids: [受注ID], set: { payment_id: String(p[0].id), payment_method: 支払方法名 }, owner: 自分の受注 });
}

// ---- 照会 ----
export function 会員の累計(メール: string): { 回数: number; 金額: number } {
  const r = query(`select coalesce(c.buy_times, 0) as kaisu, coalesce(c.buy_total, 0) as kingaku from dtb_customer c where c.email = $1`, [メール]);
  if (r.length !== 1) throw new Error(`メール ${メール} の会員が ${r.length} 件`);
  return { 回数: Number(r[0].kaisu), 金額: Number(r[0].kingaku) };
}
/** 商品コードの規格の在庫の合計と総原価の合計 */
export function 商品の総在庫と総原価(商品コード: string): { 総在庫: number; 総原価: number } {
  const r = query(`select coalesce(sum(ps.stock), 0) as s, coalesce(sum(ps.total_cost), 0) as c from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id where pc.product_code = $1`, [商品コード]);
  return { 総在庫: Number(r[0]?.s ?? 0), 総原価: Number(r[0]?.c ?? 0) };
}
/** 受注の、商品コードの明細の注文数と総原価の合計 */
export function 受注の明細(受注ID: string, 商品コード: string): { 件数: number; 注文数: number; 総原価: number } {
  const r = query(`select count(*) as n, coalesce(sum(oi.quantity), 0) as q, coalesce(sum(oi.total_cost), 0) as c from dtb_order_item oi where oi.order_id = $1 and oi.product_code = $2`, [受注ID, 商品コード]);
  return { 件数: Number(r[0]?.n ?? 0), 注文数: Number(r[0]?.q ?? 0), 総原価: Number(r[0]?.c ?? 0) };
}
