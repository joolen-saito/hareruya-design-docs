/**
 * A06-03 店頭買取受注詳細更新（MTGBuyer の API）の確かめのための DB の参照。物理名はこのファイルの SQL の中にだけ書く。参照だけで、書き込みは無い。
 */
import { query } from "../lib/db";

function 数字(s: string | number): string {
  const v = String(s);
  if (!/^\d+$/.test(v)) throw new Error(`番号が数字でない（${v}）`);
  return String(Number(v));
}

export type 受注の全体 = { ステータスID: string; 端末取引ID: string | null; 成立日: string | null; キャンセル日: string | null; 合計金額: string | null; 担当者ID: string | null; 更新日時: string; 確認済み: string | null };
/** 店頭買取の受注の値（無ければ null） */
export function 受注の全体を読む(受注ID: string): 受注の全体 | null {
  const r = query(`select otc_buy_order_status_id::text as s, transaction_id::text as t, to_char(complete_date, 'YYYY-MM-DD HH24:MI:SS') as c, to_char(cancel_date, 'YYYY-MM-DD HH24:MI:SS') as x,
      total_price::text as p, member_id::text as m, to_char(update_date, 'YYYY-MM-DD HH24:MI:SS.US') as u, qualified_invoice_issuer_confirmation_flg::text as f
      from dtb_otc_buy_order where id = $1::int`, [数字(受注ID)])[0];
  return r ? { ステータスID: String(r.s), 端末取引ID: r.t ?? null, 成立日: r.c ?? null, キャンセル日: r.x ?? null, 合計金額: r.p ?? null, 担当者ID: r.m ?? null, 更新日時: String(r.u), 確認済み: r.f ?? null } : null;
}
/** 注文詳細（番号・商品名・数量・単価）の一覧 */
export function 注文詳細を読む(受注ID: string): string[] {
  return query("select id::text as i, name, quantity::text as q, price::text as p from dtb_otc_buy_order_detail where otc_buy_order_id = $1::int order by id", [数字(受注ID)])
    .map((r) => `${r.i}:${r.name}:${r.q}:${r.p}`);
}
/** 個別入力商品（番号・商品名・数量・単価・販売価格）の一覧 */
export function 個別入力を読む(受注ID: string): string[] {
  return query("select id::text as i, name, quantity::text as q, price::text as p, sell_price::text as s from dtb_otc_buy_order_indivisual_input_product where otc_buy_order_id = $1::int order by id", [数字(受注ID)])
    .map((r) => `${r.i}:${r.name}:${r.q}:${r.p}:${r.s}`);
}
export type 実在庫の行 = { ID: string; 規格ID: string; 数量: number; 小計: number };
/** 実在庫（商品規格ごと） */
export function 実在庫を読む(受注ID: string): 実在庫の行[] {
  return query("select id::text as i, product_class_id::text as c, quantity::text as q, subtotal::text as t from dtb_otc_buy_order_stock where otc_buy_order_id = $1::int order by id", [数字(受注ID)])
    .map((r) => ({ 規格ID: String(r.c), 数量: Number(r.q), 小計: Number(r.t), ID: String(r.i) }));
}
/** 実在庫履歴（変更前・変更後の数量） */
export function 実在庫履歴を読む(受注ID: string): { 変更前: number | null; 変更後: number | null; 規格ID: string }[] {
  return query(`select h.before_quantity as b, h.after_quantity as a, s.product_class_id::text as c from dtb_otc_buy_order_stock_history h
      join dtb_otc_buy_order_stock s on s.id = h.otc_buy_order_stock_id where s.otc_buy_order_id = $1::int order by h.id`, [数字(受注ID)])
    .map((r) => ({ 変更前: r.b === null ? null : Number(r.b), 変更後: r.a === null ? null : Number(r.a), 規格ID: String(r.c) }));
}
/** ステータス変更履歴（番号・ステータス） */
export function 履歴を読む(受注ID: string): string[] {
  return query("select id::text as i, otc_buy_order_status_id::text as s from dtb_otc_buy_order_status_history where otc_buy_order_id = $1::int order by id", [数字(受注ID)])
    .map((r) => `${r.i}:${r.s}`);
}
/** 受注IDの行があるか */
export function 受注がある(受注ID: string): boolean {
  return Number(query("select count(*) as n from dtb_otc_buy_order where id = $1::int", [数字(受注ID)])[0]?.n ?? 0) > 0;
}
