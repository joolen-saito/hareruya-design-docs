/** F04 カート・ご注文方法指定のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 会員の購入処理中（処理中）の受注の受注ID（古い順） */
export function 処理中受注ID一覧(会員ID: string): string[] {
  return query(`select id from dtb_order where customer_id = $1 and order_status_id = 8 order by id`, [会員ID]).map((r) => r.id ?? "");
}

export type 受注の配送先 = { 郵便番号: string; 海外郵便番号: string; 都道府県ID: string; 住所1: string; 住所2: string; 住所3: string; 姓: string; 名: string; 電話: string };

/** 受注の1件目の配送先 */
export function 受注の配送先(受注ID: string): 受注の配送先 {
  const r = query(
    `select coalesce(postal_code,'') as p, coalesce(abroad_postal_code,'') as ap, coalesce(pref_id::text,'') as pr, coalesce(addr01,'') as a1,
            coalesce(addr02,'') as a2, coalesce(addr03,'') as a3, coalesce(name01,'') as n1, coalesce(name02,'') as n2
       from dtb_shipping where order_id = $1 order by id limit 1`, [受注ID])[0];
  if (!r) throw new Error(`受注 ${受注ID} の配送先がDBに無い`);
  return { 郵便番号: r.p ?? "", 海外郵便番号: r.ap ?? "", 都道府県ID: r.pr ?? "", 住所1: r.a1 ?? "", 住所2: r.a2 ?? "", 住所3: r.a3 ?? "", 姓: r.n1 ?? "", 名: r.n2 ?? "", 電話: "" };
}

export type 配送先の登録 = { 配送先ID: string; 配送先名称: string; 姓カナ: string; 名カナ: string; 郵便番号: string; 住所2: string; 住所3: string; 会社名: string };

/** 会員の配送先（配送先名称で引く） */
export function 会員の配送先(会員ID: string, 配送先名称: string): 配送先の登録 | null {
  const r = query(
    `select id, coalesce(address_name,'') as an, coalesce(kana01,'') as k1, coalesce(kana02,'') as k2, coalesce(postal_code,'') as p,
            coalesce(addr02,'') as a2, coalesce(addr03,'') as a3, coalesce(company_name,'') as c
       from dtb_customer_address where customer_id = $1 and address_name = $2 and del_flg = 0 order by id desc limit 1`, [会員ID, 配送先名称])[0];
  return r ? { 配送先ID: r.id ?? "", 配送先名称: r.an ?? "", 姓カナ: r.k1 ?? "", 名カナ: r.k2 ?? "", 郵便番号: r.p ?? "", 住所2: r.a2 ?? "", 住所3: r.a3 ?? "", 会社名: r.c ?? "" } : null;
}

/** 会員のアドレス帳の件数 */
export function アドレス帳の件数(会員ID: string): number {
  return Number(query(`select count(*) as n from dtb_customer_address where customer_id = $1 and del_flg = 0`, [会員ID])[0].n);
}
