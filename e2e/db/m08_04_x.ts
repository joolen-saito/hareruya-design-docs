/**
 * M08-04 会員登録/編集の続き（-x）の DB の照会と、E2E の行への書き足し。物理名はこのファイルの SQL の中にだけ書く。
 * 書き足すのは、画面で作った E2E の会員（メールアドレスに実行の印）とその受注・本人確認情報の、画面で作れない値だけ（lib/db_write.ts）。
 */
import { query } from "../lib/db";
import { Owner, updateOwnRows } from "../lib/db_write";

function 会員の持ち主(メール: string): Owner {
  return { sql: `select c.id from dtb_customer c where c.email = $1`, params: [メール] };
}
function 受注の持ち主(メール: string): Owner {
  return { sql: `select o.id from dtb_order o join dtb_customer c on c.id = o.customer_id where c.email = $1`, params: [メール] };
}
function 本人確認情報の持ち主(メール: string): Owner {
  return { sql: `select p.id from dtb_player p join dtb_customer c on c.id = p.customer_id where c.email = $1`, params: [メール] };
}
function 会員ID(メール: string): string {
  const r = query(`select id from dtb_customer where email = $1`, [メール]);
  if (r.length !== 1) throw new Error(`会員「${メール}」が ${r.length} 人（1人のはず）`);
  return String(r[0].id);
}

/** 累計注文回数・累計注文金額を指定の値にする（画面では、購入の実績で決まる） */
export function 累計を書き足す(what: string, メール: string, 回数: number, 金額: number): void {
  updateOwnRows(what, { table: "dtb_customer", key: "id", ids: [会員ID(メール)], set: { buy_times: 回数, buy_total: 金額 }, owner: 会員の持ち主(メール) });
}

/** 本人確認情報のスマレジIDを指定の値にする（画面に入力欄が無い） */
export function スマレジIDを書き足す(what: string, メール: string, スマレジID: string): void {
  const ids = query(`select p.id from dtb_player p join dtb_customer c on c.id = p.customer_id where c.email = $1`, [メール]).map((r) => String(r.id));
  if (ids.length !== 1) throw new Error(`${what}: 会員「${メール}」の本人確認情報が ${ids.length} 件（1件のはず）`);
  updateOwnRows(what, { table: "dtb_player", key: "id", ids, set: { smaregi_id: スマレジID }, owner: 本人確認情報の持ち主(メール) });
}

export type 受注の行 = { 受注ID: string; 受注番号: string; 状態ID: string };
/** 会員の受注（古い順） */
export function 会員の受注(会員ID: string): 受注の行[] {
  return query(`select id, coalesce(order_number,'') as n, order_status_id::text as s from dtb_order where customer_id = $1::int order by id`, [会員ID])
    .map((r) => ({ 受注ID: String(r.id), 受注番号: r.n ?? "", 状態ID: r.s ?? "" }));
}

/** 受注ステータスの番号（名前で引く） */
export function 受注ステータスの番号(名前: string): string {
  const r = query(`select id::text as id from mtb_order_status where name = $1`, [名前]);
  if (r.length !== 1) throw new Error(`受注ステータス「${名前}」が ${r.length} 件`);
  return r[0].id ?? "";
}

/** 受注の、画面で作れない値（注文日時・発送日・支払方法の表示名・購入金額・受注ステータス・受注番号）を書き足す。null は空にする */
export function 受注を書き足す(what: string, 受注ID: string, メール: string, v: { 注文日時?: string; 発送日?: string | null; 支払方法?: string; 購入金額?: number; 受注ステータス?: string; 受注番号?: string | null }): void {
  const set: Record<string, string | number | null> = {};
  if (v.注文日時 !== undefined) set.order_date = v.注文日時;
  if (v.発送日 !== undefined) set.shipping_date = v.発送日;
  if (v.支払方法 !== undefined) set.payment_method = v.支払方法;
  if (v.購入金額 !== undefined) set.total = v.購入金額;
  if (v.受注ステータス !== undefined) set.order_status_id = 受注ステータスの番号(v.受注ステータス);
  if (v.受注番号 !== undefined) set.order_number = v.受注番号;
  updateOwnRows(what, { table: "dtb_order", key: "id", ids: [受注ID], set, owner: 受注の持ち主(メール) });
}

export type お届け先 = { お届け先ID: string; 配送先名称: string; 姓: string; 名: string; 既定: boolean };
/** 会員のお届け先（削除されていないもの・番号の小さい順） */
export function 会員のお届け先(会員ID: string): お届け先[] {
  return query(
    `select id, coalesce(address_name,'') as an, coalesce(name01,'') as n1, coalesce(name02,'') as n2, default_flg::text as d
       from dtb_customer_address where customer_id = $1::int and del_flg = 0 order by id`, [会員ID],
  ).map((r) => ({ お届け先ID: String(r.id), 配送先名称: r.an ?? "", 姓: r.n1 ?? "", 名: r.n2 ?? "", 既定: r.d === "true" }));
}
