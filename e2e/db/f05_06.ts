/**
 * F05-06 ネット買取 買取手続き〜完了 の DB 確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 * 実行区分が「ブラウザ+DB確認」のケースだけが使う。買取は、完了画面に出た買取番号の数字（買取受注の番号）で引く。
 */
import { query } from "../lib/db";

function 数字(s: string): string {
  if (!/^\d+$/.test(s)) throw new Error(`番号が数字でない（${s}）`);
  return String(Number(s));
}
const 真 = (v: string | null | undefined) => v === "true" || v === "1" || v === "t";

export type 買取受注 = {
  状態: string; 送金方法: string; 姓: string; 名: string; セイ: string; メイ: string; メール: string; 郵便番号: string; 都道府県: string;
  住所1: string; 住所2: string; 住所3: string; 電話番号: string; 職業: string; 生年月日: string; 箱数: string; 自動承諾: boolean; メモ: string;
  事業者: boolean; 事業者番号: string; 会員ID: string;
};

/** 買取受注の値 */
export function 買取受注を読む(番号: string): 買取受注 {
  const r = query(
    `select s.name as status, coalesce(rm.name, '') as remittance, b.last_name, b.first_name, b.last_name_kana, b.first_name_kana, b.email, b.zipcode,
            coalesce(p.name, '') as pref, b.addr01, b.addr02, b.addr03, coalesce(b.tel_no, '') as tel_no, coalesce(j.name, '') as job,
            coalesce(to_char(b.birth, 'YYYY-MM-DD'), '') as birth, coalesce(b.package_count::text, '') as package_count, b.auto_approval_flg,
            coalesce(b.memo, '') as memo, b.qualified_invoice_issuer_flg, coalesce(q.qualified_invoice_issuer_code, '') as code, coalesce(b.customer_id::text, '') as customer_id
       from dtb_buy_order b
       join mtb_buy_order_status s on s.id = b.buy_order_status_id
       left join mtb_remittance_method rm on rm.id = b.remittance_method_id
       left join mtb_pref p on p.id = b.pref_id
       left join mtb_job j on j.id = b.job_id
       left join dtb_qualified_invoice_issuer_account q on q.id = b.qualified_invoice_issuer_account_id
      where b.id = $1`, [数字(番号)],
  )[0];
  if (!r) throw new Error(`買取番号 ${番号} の買取受注が無い`);
  return {
    状態: r.status ?? "", 送金方法: r.remittance ?? "", 姓: r.last_name ?? "", 名: r.first_name ?? "", セイ: r.last_name_kana ?? "", メイ: r.first_name_kana ?? "",
    メール: r.email ?? "", 郵便番号: r.zipcode ?? "", 都道府県: r.pref ?? "", 住所1: r.addr01 ?? "", 住所2: r.addr02 ?? "", 住所3: r.addr03 ?? "",
    電話番号: r.tel_no ?? "", 職業: r.job ?? "", 生年月日: r.birth ?? "", 箱数: r.package_count ?? "", 自動承諾: 真(r.auto_approval_flg), メモ: r.memo ?? "",
    事業者: 真(r.qualified_invoice_issuer_flg), 事業者番号: r.code ?? "", 会員ID: r.customer_id ?? "",
  };
}

/** 買取受注に紐づく振込口座 */
export function 振込口座を読む(番号: string): { 銀行名: string; 支店名: string; 口座種別: string; 口座番号: string; 口座名義: string } | null {
  const r = query(
    `select a.bank_code, a.branch_code, a.account_type, a.account_no, coalesce(a.account_holder, '') as account_holder
       from dtb_buy_order b join dtb_bank_account a on a.id = b.bank_account_id where b.id = $1`, [数字(番号)],
  )[0];
  return r ? { 銀行名: r.bank_code ?? "", 支店名: r.branch_code ?? "", 口座種別: r.account_type ?? "", 口座番号: r.account_no ?? "", 口座名義: r.account_holder ?? "" } : null;
}

/** 買取受注に紐づく適格請求書発行事業者情報の件数 */
export function 事業者情報の件数(番号: string): number {
  return Number(query(
    `select count(*) as n from dtb_buy_order b join dtb_qualified_invoice_issuer_account q on q.id = b.qualified_invoice_issuer_account_id where b.id = $1`, [数字(番号)],
  )[0].n);
}

/** 買取受注の明細（商品ID・数量）。登録の順 */
export function 明細を読む(番号: string): { 商品ID: string; 数量: string }[] {
  return query(`select product_id, count from dtb_buy_main_card where buy_order_id = $1 order by id`, [数字(番号)])
    .map((r) => ({ 商品ID: String(r.product_id ?? ""), 数量: String(r.count ?? "") }));
}

/** 買取受注の明細のうち商品IDの行の、状態ごとの申込時買取価格（状態の略号 → 価格） */
export function 申込時買取価格を読む(番号: string, 商品ID: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const r of query(
    `select cc.code, ap.application_price from dtb_application_price ap
       join dtb_buy_main_card c on c.id = ap.buy_main_card_id
       left join mtb_card_condition cc on cc.id = ap.card_condition_id
      where c.buy_order_id = $1 and c.product_id = $2 order by ap.id`, [数字(番号), 数字(商品ID)],
  )) out[String(r.code ?? "")] = String(Number(r.application_price ?? 0));
  return out;
}

/** 買取受注のステータス変更履歴の件数 */
export function ステータス変更履歴の件数(番号: string): number {
  return Number(query(`select count(*) as n from dtb_buy_order_status_histry where buy_order_id = $1`, [数字(番号)])[0].n);
}

/** 会員の買取受注の番号（新しい順） */
export function 会員の買取受注(会員ID: string): string[] {
  return query(`select id from dtb_buy_order where customer_id = $1 order by id desc`, [数字(会員ID)]).map((r) => String(r.id));
}

/** 会員の職業と生年月日 */
export function 会員の職業と生年月日(会員ID: string): { 職業: string; 生年月日: string } {
  const r = query(
    `select coalesce(j.name, '') as job, coalesce(to_char(c.birth, 'YYYY-MM-DD'), '') as birth from dtb_customer c left join mtb_job j on j.id = c.job_id where c.id = $1`,
    [数字(会員ID)],
  )[0];
  if (!r) throw new Error(`会員ID ${会員ID} の会員が無い`);
  return { 職業: r.job ?? "", 生年月日: r.birth ?? "" };
}
