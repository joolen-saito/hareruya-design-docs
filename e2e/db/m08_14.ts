/** M08-14 仮会員メール再送のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。 */
import { query } from "../lib/db";

/** 仮会員登録メールのテンプレート（共有の設定。読むだけ） */
export function 仮会員メールのテンプレート(): { 名前: string; 件名: string } | undefined {
  const r = query(`select t.name as n, t.mail_subject as s from dtb_mail_template t where t.mail_key = 'eccube.mail.entry_confirm' order by t.id limit 1`)[0];
  return r ? { 名前: String(r.n ?? ""), 件名: String(r.s ?? "") } : undefined;
}

/** 店舗基本情報の店名（共有の設定。読むだけ） */
export function 店名(): string | undefined {
  return query(`select shop_name as n from dtb_base_info order by id limit 1`)[0]?.n ?? undefined;
}

/** 送信履歴の行が使ったテンプレートの名前・件名と、送信時の店舗の店名 */
export function 履歴のテンプレートと店名(履歴ID: string): { テンプレート名: string | null; テンプレート件名: string | null; 店名: string | null } | undefined {
  const r = query(
    `select t.name as tn, t.mail_subject as ts, b.shop_name as bn
       from dtb_mail_history h
       left join dtb_mail_template t on t.id = h.template_id
       left join dtb_base_info b on b.id = h.base_info_id
      where h.id = $1::int`, [履歴ID])[0];
  return r ? { テンプレート名: r.tn, テンプレート件名: r.ts, 店名: r.bn } : undefined;
}

/** 全会員の送信履歴の件数（会員に紐づく送信履歴） */
export function 全会員の送信履歴の件数(): number {
  return Number(query(`select count(*) as n from dtb_mail_history where customer_id is not null`)[0].n);
}

/** 会員の本登録用シークレット（本登録用URLの末尾になる） */
export function 本登録用シークレット(会員ID: string): string {
  return String(query(`select secret_key as v from dtb_customer where id = $1::int`, [会員ID])[0]?.v ?? "");
}
