/**
 * F04-03 配送先の新規登録・変更の続き（-x）の DB の照会と、E2E の行への書き足し。物理名はこのファイルの SQL の中にだけ書く。
 * 書き足すのは、画面で作った E2E の会員（メールアドレスに実行の印）の行の、画面で作れない状態だけ（lib/db_write.ts）。
 * - 既定のお届け先: 会員登録で1件自動で作られ、画面に削除の操作が無い。アプリの削除と同じく削除の印（論理削除）を付ける。
 * - 注文手続き中の2件目の配送: 数量1の注文を画面で2件の配送に分けられない。1件目の配送の値を写して足す。
 */
import { query } from "../lib/db";
import { insertOwnRows, Owner, updateOwnRows } from "../lib/db_write";

/** 会員（メールアドレス。実行の印つき）のお届け先 */
function お届け先の持ち主(メール: string): Owner {
  return { sql: `select a.id from dtb_customer_address a join dtb_customer c on c.id = a.customer_id where c.email = $1`, params: [メール] };
}
/** 会員（メールアドレス。実行の印つき）の受注 */
function 受注の持ち主(メール: string): Owner {
  return { sql: `select o.id from dtb_order o join dtb_customer c on c.id = o.customer_id where c.email = $1`, params: [メール] };
}

function 会員の既定のお届け先ID(メール: string): string[] {
  return query(
    `select a.id from dtb_customer_address a join dtb_customer c on c.id = a.customer_id where c.email = $1 and a.default_flg = true order by a.id`, [メール],
  ).map((r) => String(r.id));
}

/** 会員登録で自動で作られた既定のお届け先を、アプリの削除と同じく削除の印を付けた状態にする（アドレス帳の件数に入らなくなる） */
export function 既定のお届け先を削除済みにする(what: string, メール: string): void {
  const ids = 会員の既定のお届け先ID(メール);
  if (ids.length !== 1) throw new Error(`${what}: 会員「${メール}」の既定のお届け先が ${ids.length} 件（1件のはず）`);
  updateOwnRows(what, { table: "dtb_customer_address", key: "id", ids, set: { del_flg: 1 }, owner: お届け先の持ち主(メール) });
}

/** 削除の印を付けておいた既定のお届け先を、有効に戻す（アドレス帳が1件増える） */
export function 既定のお届け先を有効に戻す(what: string, メール: string): void {
  const ids = 会員の既定のお届け先ID(メール);
  if (ids.length !== 1) throw new Error(`${what}: 会員「${メール}」の既定のお届け先が ${ids.length} 件（1件のはず）`);
  updateOwnRows(what, { table: "dtb_customer_address", key: "id", ids, set: { del_flg: 0 }, owner: お届け先の持ち主(メール) });
}

export type 配送の住所 = { 配送ID: string; 住所1: string; 住所2: string; 国ID: string; 都道府県ID: string };

/** 受注の配送（番号の小さい順） */
export function 受注の配送一覧(受注ID: string): 配送の住所[] {
  return query(
    `select id, coalesce(addr01,'') as a1, coalesce(addr02,'') as a2, coalesce(country_id::text,'') as c, coalesce(pref_id::text,'') as p
       from dtb_shipping where order_id = $1::int order by id`, [受注ID],
  ).map((r) => ({ 配送ID: String(r.id), 住所1: r.a1 ?? "", 住所2: r.a2 ?? "", 国ID: r.c ?? "", 都道府県ID: r.p ?? "" }));
}

/** 配送1件の住所 */
export function 配送の住所(配送ID: string): 配送の住所 | null {
  const r = query(
    `select id, coalesce(addr01,'') as a1, coalesce(addr02,'') as a2, coalesce(country_id::text,'') as c, coalesce(pref_id::text,'') as p
       from dtb_shipping where id = $1::int`, [配送ID],
  )[0];
  return r ? { 配送ID: String(r.id), 住所1: r.a1 ?? "", 住所2: r.a2 ?? "", 国ID: r.c ?? "", 都道府県ID: r.p ?? "" } : null;
}

/**
 * 注文手続き中の受注に2件目の配送を足す（1件目の配送の値を写し、住所1・住所2だけ変える）。足した配送の番号を返す。
 * 正本の配送ID（8903129 など）は指定せず、DB が振る番号を使う。
 */
export function 二件目の配送を足す(what: string, 受注ID: string, メール: string, 住所: { 住所1: string; 住所2: string }): string {
  const cols = ["order_id", "country_id", "pref_id", "delivery_id", "customer_id", "base_info_id", "name01", "name02", "kana01", "kana02",
    "postal_code", "tel01", "tel02", "tel03", "delivery_name", "sort_no"];
  const src = query(`select ${cols.map((c) => `${c}::text as ${c}`).join(", ")} from dtb_shipping where order_id = $1::int order by id limit 1`, [受注ID])[0];
  if (!src) throw new Error(`${what}: 受注 ${受注ID} に1件目の配送が無い`);
  const before = new Set(受注の配送一覧(受注ID).map((s) => s.配送ID));
  const now = new Date().toISOString();
  const row: Record<string, string | number | null> = {};
  for (const c of cols) row[c] = src[c] ?? null;
  row.addr01 = 住所.住所1;
  row.addr02 = 住所.住所2;
  row.create_date = now;
  row.update_date = now;
  insertOwnRows(what, { table: "dtb_shipping", parentColumn: "order_id", rows: [row], owner: 受注の持ち主(メール) });
  const added = 受注の配送一覧(受注ID).filter((s) => !before.has(s.配送ID));
  if (added.length !== 1) throw new Error(`${what}: 足した2件目の配送を見つけられない（${added.length} 件）`);
  return added[0].配送ID;
}

/** 会員のアドレス帳の配送先（配送先名称で引く）の住所 */
export function アドレス帳の住所(会員ID: string, 配送先名称: string): { 配送先ID: string; 住所1: string; 住所2: string; 都道府県ID: string; 国ID: string } | null {
  const r = query(
    `select id, coalesce(addr01,'') as a1, coalesce(addr02,'') as a2, coalesce(pref_id::text,'') as p, coalesce(country_id::text,'') as c
       from dtb_customer_address where customer_id = $1::int and address_name = $2 and del_flg = 0 order by id desc limit 1`, [会員ID, 配送先名称],
  )[0];
  return r ? { 配送先ID: String(r.id), 住所1: r.a1 ?? "", 住所2: r.a2 ?? "", 都道府県ID: r.p ?? "", 国ID: r.c ?? "" } : null;
}

/** 会員のアドレス帳の1件目（番号の小さい順）の都道府県の名前 */
export function アドレス帳の都道府県名(会員ID: string): string[] {
  return query(
    `select coalesce(p.name,'') as n from dtb_customer_address a left join mtb_pref p on p.id = a.pref_id where a.customer_id = $1::int and a.del_flg = 0 order by a.id`, [会員ID],
  ).map((r) => r.n ?? "");
}

/** 会員のアドレス帳の1件（配送先名称で引く）の、保存された値 */
export function アドレス帳の値(会員ID: string, 配送先名称: string): Record<string, string> | null {
  const r = query(
    `select coalesce(address_name,'') as 配送先名称, coalesce(name01,'') as 姓, coalesce(name02,'') as 名, coalesce(kana01,'') as カナ姓, coalesce(kana02,'') as カナ名,
            coalesce(tel01,'') as 電話1, coalesce(tel02,'') as 電話2, coalesce(tel03,'') as 電話3, coalesce(postal_code,'') as 郵便番号,
            coalesce(addr01,'') as 住所1, coalesce(addr02,'') as 住所2
       from dtb_customer_address where customer_id = $1::int and address_name = $2 and del_flg = 0 order by id desc limit 1`, [会員ID, 配送先名称],
  )[0];
  return r ? Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v ?? ""])) : null;
}

/** 会員の購入完了済み（購入処理中・決済処理中でない）受注の受注ID（古い順） */
export function 完了した受注ID一覧(会員ID: string): string[] {
  return query(`select id from dtb_order where customer_id = $1::int and order_status_id not in (7, 8) order by id`, [会員ID]).map((r) => String(r.id));
}

/** 都道府県のマスタの「日本国外」の番号と、東京都の番号 */
export function 都道府県の番号(): { 国外: string; 東京都: string } {
  const r = query(`select (select id::text from mtb_pref where name = '日本国外') as o, (select id::text from mtb_pref where name = '東京都') as t`)[0];
  if (!r?.o || !r?.t) throw new Error("都道府県のマスタに「日本国外」または「東京都」が無い");
  return { 国外: r.o, 東京都: r.t };
}
