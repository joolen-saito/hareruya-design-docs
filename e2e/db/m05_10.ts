/**
 * M05-10 納品書印刷（英語）の DB 確認と、E2E が作った行への書き足し（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」）。
 * 物理名はこのファイルの SQL の中にだけ書く。書き足しは lib/db_write.ts を通し、持ち主（試験会員のメールアドレス）を確かめてから書く。
 * M05-09 と同じ書き足し（受注日時・注文者の都道府県・配送先の国・プレイヤー）は db/m05_09.ts を使う。
 */
import { query } from "../lib/db";
import { Owner, updateOwnRows } from "../lib/db_write";

const 受注の持ち主 = (受注IDs: string[], メール: string): Owner => ({
  sql: `select o.id from dtb_order o join dtb_customer c on c.id = o.customer_id where o.id = any($1::int[]) and c.email = $2`,
  params: [`{${受注IDs.join(",")}}`, メール],
});
const 配送先の持ち主 = (配送先IDs: string[], メール: string): Owner => ({
  sql: `select s.id from dtb_shipping s join dtb_order o on o.id = s.order_id join dtb_customer c on c.id = o.customer_id where s.id = any($1::int[]) and c.email = $2`,
  params: [`{${配送先IDs.join(",")}}`, メール],
});

/** 受注の明細ID（登録の順） */
export function 受注の明細ID(受注ID: string): string[] {
  return query(`select oi.id from dtb_order_item oi where oi.order_id = $1::int and oi.product_class_id is not null order by oi.id`, [受注ID]).map((r) => String(r.id));
}

/** 受注の消費税額・利用ポイントを書き足す（受注情報編集に入力欄が無い） */
export function 受注の金額を書き足す(what: string, 受注ID: string, メール: string, v: { 消費税額?: number; 利用ポイント?: number }): void {
  const set: Record<string, number> = {};
  if (v.消費税額 !== undefined) set.tax = v.消費税額;
  if (v.利用ポイント !== undefined) set.use_point = v.利用ポイント;
  if (Object.keys(set).length === 0) return;
  updateOwnRows(what, { table: "dtb_order", key: "id", ids: [受注ID], set, owner: 受注の持ち主([受注ID], メール) });
}

/** 受注から会員の紐付けを外す（画面では会員の受注の会員を外せない）。外したあとは会員のメールアドレスで持ち主を確かめられないので、最後に書く */
export function 受注から会員を外す(what: string, 受注ID: string, メール: string): void {
  updateOwnRows(what, { table: "dtb_order", key: "id", ids: [受注ID], set: { customer_id: null }, owner: 受注の持ち主([受注ID], メール) });
}

/** 配送先を受注から外す（画面では受注の配送先を外せない）。外したあとは持ち主を確かめられないので、最後に書く */
export function 配送先を受注から外す(what: string, 配送先IDs: string[], メール: string): void {
  updateOwnRows(what, { table: "dtb_shipping", key: "id", ids: 配送先IDs, set: { order_id: null }, owner: 配送先の持ち主(配送先IDs, メール) });
}

/** 受注の消費税額・利用ポイント・値引き・合計（確かめに使う） */
export function 受注の金額(受注ID: string): { 小計: number; 送料: number; 手数料: number; 値引き: number; 利用ポイント: number; 合計: number; 消費税額: number } | null {
  const r = query(
    `select o.subtotal::text as s, o.delivery_fee_total::text as d, o.charge::text as c, o.discount::text as di, o.use_point::text as u, o.total::text as t, o.tax::text as x from dtb_order o where o.id = $1::int`,
    [受注ID])[0];
  if (!r) return null;
  const n = (v: unknown) => Number(v ?? 0);
  return { 小計: n(r.s), 送料: n(r.d), 手数料: n(r.c), 値引き: n(r.di), 利用ポイント: n(r.u), 合計: n(r.t), 消費税額: n(r.x) };
}
