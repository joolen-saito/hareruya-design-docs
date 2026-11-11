/**
 * M05-06 メール一括送信機能・M08-08 手動メール通知の照会と、E2E の行だけの書き足し。
 * 物理名はこのファイルの SQL の中にだけ書く。書き足し（消す）は lib/db_write.ts を通し、持ち主（試験会員のメールアドレス）を確かめてから行う。
 */
import { query } from "../lib/db";
import { deleteOwnRows, Owner } from "../lib/db_write";

export type 基本情報 = { 店名: string; 送信元: string; 返信先: string; 送信エラー先: string };

/** 本店（店舗ID 1）の基本情報の店名とメールアドレス（手動メールはこの値で送られる。全員が使う設定なので書き換えない） */
export function 本店の基本情報(): 基本情報 {
  const r = query(`select coalesce(shop_name, '') as nm, coalesce(email01, '') as e1, coalesce(email03, '') as e3, coalesce(email04, '') as e4 from dtb_base_info where id = 1`)[0];
  if (!r) throw new Error("本店（店舗ID 1）の基本情報が無い");
  return { 店名: String(r.nm), 送信元: String(r.e1), 返信先: String(r.e3), 送信エラー先: String(r.e4) };
}

export type テンプレート = { ID: string; 名前: string; 件名: string; ヘッダー: string; フッター: string; ベース: string; 自動送信: boolean };

const テンプレートの列 = `id::text as tid, name as nm, coalesce(mail_subject, '') as sj, coalesce(header, '') as hd, coalesce(footer, '') as ft, coalesce(file_name, '') as fl, is_auto_send::text as au`;
const テンプレートに = (r: Record<string, string | null>): テンプレート => ({
  ID: String(r.tid), 名前: String(r.nm), 件名: String(r.sj), ヘッダー: String(r.hd), フッター: String(r.ft), ベース: String(r.fl), 自動送信: r.au === "true",
});

/** メールテンプレート（番号で。無ければ null） */
export function テンプレート(id: string): テンプレート | null {
  const r = query(`select ${テンプレートの列} from dtb_mail_template where id = $1::int`, [id])[0];
  return r ? テンプレートに(r) : null;
}

/** 会員の手動メール通知で選べるテンプレート（手動送信・会員ベース（日・英）とベースなし）を、名前の昇順（DB の並び）で */
export function 会員向け手動テンプレートの並び(): テンプレート[] {
  return query(`select ${テンプレートの列} from dtb_mail_template
     where not is_auto_send and file_name in ('Mail/customer.twig', 'Mail/customer.en.twig', 'Mail/no_base.twig') order by name`).map(テンプレートに);
}

/** 自動送信のテンプレートのうち番号の小さいもの（手動メール通知では選べないもの） */
export function 自動送信のテンプレート(): テンプレート {
  const r = query(`select ${テンプレートの列} from dtb_mail_template where is_auto_send order by id limit 1`)[0];
  if (!r) throw new Error("自動送信のテンプレートが無い");
  return テンプレートに(r);
}

/** 会員向けの自動送信テンプレート（会員ベース）があるか */
export function 会員ベースの自動送信テンプレートがある(): boolean {
  return query(`select id from dtb_mail_template where is_auto_send and file_name in ('Mail/customer.twig', 'Mail/customer.en.twig')`).length > 0;
}

export type 送信履歴 = { ID: string; 件名: string; 本文: string; 送信日時: string; テンプレートID: string; 受注ID: string; 会員ID: string; 作成者ID: string };
const 履歴の列 = `h.id::text as hid, coalesce(h.mail_subject, '') as sj, coalesce(h.mail_body, '') as bd, coalesce(to_char(h.send_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI:SS'), '') as sd,
  coalesce(h.template_id::text, '') as tid, coalesce(h.order_id::text, '') as oid, coalesce(h.customer_id::text, '') as cid, coalesce(h.creator_id::text, '') as crid`;
const 履歴に = (r: Record<string, string | null>): 送信履歴 => ({
  ID: String(r.hid), 件名: String(r.sj), 本文: String(r.bd), 送信日時: String(r.sd), テンプレートID: String(r.tid), 受注ID: String(r.oid), 会員ID: String(r.cid), 作成者ID: String(r.crid),
});

/** 受注の送信履歴（番号の順） */
export function 受注の送信履歴(受注ID: string): 送信履歴[] {
  return query(`select ${履歴の列} from dtb_mail_history h where h.order_id = $1::int order by h.id`, [受注ID]).map(履歴に);
}

/** 会員の送信履歴（番号の順） */
export function 会員の送信履歴(会員ID: string): 送信履歴[] {
  return query(`select ${履歴の列} from dtb_mail_history h where h.customer_id = $1::int order by h.id`, [会員ID]).map(履歴に);
}

/** 受注の行の全項目（比べるための写し。列の名前と値の JSON の文字） */
export function 受注の行の写し(受注ID: string): string {
  const r = query(`select row_to_json(o)::text as js from dtb_order o where o.id = $1::int`, [受注ID])[0];
  if (!r) throw new Error(`受注ID ${受注ID} の受注が無い`);
  return String(r.js);
}

/** 会員の行の全項目（比べるための写し） */
export function 会員の行の写し(会員ID: string): string {
  const r = query(`select row_to_json(c)::text as js from dtb_customer c where c.id = $1::int`, [会員ID])[0];
  if (!r) throw new Error(`会員ID ${会員ID} の会員が無い`);
  return String(r.js);
}

export function 配送IDがある(id: string): boolean { return query(`select id from dtb_shipping where id = $1::int`, [id]).length > 0; }
export function 受注IDがある(id: string): boolean { return query(`select id from dtb_order where id = $1::int`, [id]).length > 0; }
export function 会員IDがある(id: string): boolean { return query(`select id from dtb_customer where id = $1::int`, [id]).length > 0; }

/** 商品コードの商品の商品ID（無ければ空） */
export function 商品コードの商品ID(商品コード: string): string {
  const r = query(`select pc.product_id::text as pid from dtb_product_class pc where pc.product_code = $1 order by pc.id limit 1`, [商品コード])[0];
  return r ? String(r.pid) : "";
}

/** 会員（メールアドレス）の会員ID */
export function メールの会員ID(メール: string): string {
  const r = query(`select c.id::text as cid from dtb_customer c where c.email = $1 order by c.id desc`, [メール]);
  if (r.length !== 1) throw new Error(`メールアドレス ${メール} の会員が ${r.length} 人（1人のはず）`);
  return String(r[0].cid);
}

// ---- 書き足し（E2E の行だけ） ----

const 試験会員の履歴: Owner = {
  sql: `select h.id from dtb_mail_history h
          left join dtb_order o on o.id = h.order_id
          left join dtb_customer oc on oc.id = o.customer_id
          left join dtb_customer c on c.id = h.customer_id
         where coalesce(oc.email, c.email, '') = $1`,
};

/** 受注の送信履歴（購入完了のときに自動で残る注文完了のメールなど）を消して0件にする。持ち主は試験会員のメールアドレス */
export function 受注の送信履歴を消す(what: string, 受注ID: string, メール: string): number {
  const ids = 受注の送信履歴(受注ID).map((h) => h.ID);
  if (ids.length) deleteOwnRows(what, { table: "dtb_mail_history", key: "id", ids, owner: { ...試験会員の履歴, params: [メール] } });
  return ids.length;
}

/** 会員の送信履歴（購入完了のときに自動で残るものなど）を消して0件にする。持ち主は試験会員のメールアドレス */
export function 会員の送信履歴を消す(what: string, 会員ID: string, メール: string): number {
  const ids = 会員の送信履歴(会員ID).map((h) => h.ID);
  if (ids.length) deleteOwnRows(what, { table: "dtb_mail_history", key: "id", ids, owner: { ...試験会員の履歴, params: [メール] } });
  return ids.length;
}
