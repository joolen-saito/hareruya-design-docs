/** M08-02 メール一括送信のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。 */
import { query } from "../lib/db";

/** 会員の送信履歴（メール履歴）の件数 */
export function 送信履歴の件数(会員ID: string): number {
  return Number(query(`select count(*) as n from dtb_mail_history where customer_id = $1::int`, [会員ID])[0].n);
}

export type 送信履歴の行 = { 履歴ID: string; 会員ID: string; 件名: string; 本文: string; 送信日時: number; テンプレートID: string | null; 作成者ID: string | null };

const 履歴の列 = `id, customer_id, mail_subject, mail_body, extract(epoch from send_date)::bigint as t, template_id, creator_id`;
const 履歴の行 = (r: Record<string, string | null>): 送信履歴の行 => ({
  履歴ID: String(r.id), 会員ID: String(r.customer_id), 件名: String(r.mail_subject ?? ""), 本文: String(r.mail_body ?? ""),
  送信日時: Number(r.t), テンプレートID: r.template_id, 作成者ID: r.creator_id,
});

/** 会員の送信履歴（古い順） */
export function 会員の送信履歴(会員ID: string): 送信履歴の行[] {
  return query(`select ${履歴の列} from dtb_mail_history where customer_id = $1::int order by id`, [会員ID]).map(履歴の行);
}

/** 件名が一致し、宛先会員が指定の会員のどれかである送信履歴（古い順） */
export function 件名の送信履歴(件名: string, 会員ID: string[]): 送信履歴の行[] {
  if (会員ID.length === 0) return [];
  const ph = 会員ID.map((_, i) => `$${i + 2}::int`).join(", ");
  return query(`select ${履歴の列} from dtb_mail_history where mail_subject = $1 and customer_id in (${ph}) order by id`, [件名, ...会員ID]).map(履歴の行);
}

/** 送信履歴の表に、送信の成否などを持つ列があるか（あれば、その列の名前の一覧。無ければ空） */
export function 送信成否の列(): string[] {
  return query(`select column_name from information_schema.columns where table_schema = 'public' and table_name = 'dtb_mail_history' and column_name ~ '(success|result|status|error|fail)'`).map((r) => String(r.column_name));
}

/** DB の現在時刻（UNIX 時刻の秒） */
export function DBの現在時刻(): number {
  return Number(query(`select extract(epoch from now())::bigint as t`)[0].t);
}
