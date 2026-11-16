/**
 * M07-04 手動メール通知のDB確認と、E2E が作った買取受注の通知送信履歴の削除。物理名はこのファイルの SQL にだけ書く。
 * 削除は lib/db_write.ts の窓口だけを通し、メールアドレスに実行の印がある買取受注の履歴だけを対象にする。
 */
import { query } from "../lib/db";
import { deleteOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

export type 通知送信履歴 = { 件名: string; 本文: string; 送信日時あり: boolean; テンプレートID: string; 買取番号: string; 会員ID: string };

export function 通知送信履歴を読む(買取番号: string): 通知送信履歴[] {
  return query(`select coalesce(mail_subject, '') as s, coalesce(mail_body, '') as b, (send_date is not null) as d, coalesce(template_id::text, '') as tt,
    buy_order_id::text as o, coalesce(customer_id::text, '') as c from dtb_mail_history where buy_order_id = $1::int order by id`, [Number(買取番号)])
    .map((r) => ({ 件名: r.s ?? "", 本文: r.b ?? "", 送信日時あり: r.d === "true", テンプレートID: r.tt ?? "", 買取番号: r.o ?? "", 会員ID: r.c ?? "" }));
}
export function 通知送信履歴の件数(買取番号: string): number {
  return Number(query(`select count(*) as n from dtb_mail_history where buy_order_id = $1::int`, [Number(買取番号)])[0].n);
}
/** E2E が作った買取受注（メールアドレスに実行の印がある）の通知送信履歴を消して0件にする。買取申込の受付完了メールの履歴が残るため */
export function 通知送信履歴を消す(理由: string, 買取番号: string): void {
  const ids = query(`select id::text as id from dtb_mail_history where buy_order_id = $1::int`, [Number(買取番号)]).map((r) => r.id as string);
  if (ids.length) {
    deleteOwnRows(理由, {
      table: "dtb_mail_history", key: "id", ids,
      owner: { sql: `select h.id from dtb_mail_history h join dtb_buy_order o on o.id = h.buy_order_id where o.email ilike $1`, params: [`%${RUN_MARK}%`] },
    });
  }
  if (通知送信履歴の件数(買取番号) !== 0) throw new Error(`${理由}: 買取番号 ${買取番号} の通知送信履歴を0件にできない`);
}
/** 買取受注レコードの全項目（比べるための文字列） */
export function 買取受注レコード(買取番号: string): string {
  const r = query(`select to_jsonb(o)::text as j from dtb_buy_order o where o.id = $1::int`, [Number(買取番号)]);
  if (!r.length) throw new Error(`買取番号 ${買取番号} の買取受注がDBに無い`);
  return r[0].j as string;
}

/**
 * テストが足したメールテンプレート（番号 ids）を参照する通知履歴のうち、この実行の印つきの買取・会員のものを消す。
 * テンプレートを消す前に呼ぶ（テストの手順で送った履歴が参照していると、テンプレートを消せず戻しが止まる。2026-11-16 M07-04-018）。
 */
export function テンプレートを使った通知履歴を消す(理由: string, ids: number[]): void {
  const hs = query(`select id::text as id from dtb_mail_history where template_id = any(string_to_array($1, ',')::int[])`, [ids.join(",")]).map((r) => r.id as string);
  if (hs.length === 0) return;
  deleteOwnRows(理由, {
    table: "dtb_mail_history", key: "id", ids: hs,
    owner: { sql: `select h.id from dtb_mail_history h left join dtb_buy_order o on o.id = h.buy_order_id left join dtb_customer c on c.id = h.customer_id where o.email ilike $1 or c.email ilike $1`, params: [`%${RUN_MARK}%`] },
  });
}
