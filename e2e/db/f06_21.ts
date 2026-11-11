/** F06-21 退会のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type 会員の状態 = { id: string; メール: string; 削除済み: string };

/** メールアドレスの会員（削除済みを含む）の削除フラグ */
export function 退会試験の会員(メール: string): 会員の状態[] {
  return query(`select id, email, del_flg from dtb_customer where email = $1 order by id`, [メール]).map((r) => ({ id: r.id!, メール: r.email ?? "", 削除済み: r.del_flg ?? "" }));
}

/** 会員データIDの会員（削除済みを含む）。退会するとメールアドレスが別の値になるので、番号で引く */
export function 番号の会員(会員ID: string): { メール: string; 削除済み: string } | null {
  const r = query(`select email, del_flg from dtb_customer where id = $1`, [会員ID])[0];
  return r ? { メール: r.email ?? "", 削除済み: r.del_flg ?? "" } : null;
}
/** 会員に紐づく選手情報の削除日時（削除されていなければ空）。選手情報の行ごとに返す */
export function 選手の削除日時(会員ID: string): string[] {
  return query(`select deleted_at from dtb_player where customer_id = $1 order by id`, [会員ID]).map((r) => r.deleted_at ?? "");
}
/** 会員のメール送信履歴の件数 */
export function メール送信履歴の件数(会員ID: string): number {
  return Number(query(`select count(*) as n from dtb_mail_history where customer_id = $1`, [会員ID])[0].n);
}
/** 退会完了メールのテンプレート（日本語用・英語用）が登録されている数 */
export function 退会メールのテンプレート数(): number {
  return Number(query(`select count(*) as n from dtb_mail_template where mail_key in ('eccube.mail.mall.member_cancel', 'eccube.mail.mall.member_cancel_en')`)[0].n);
}
/** 会員（メールアドレスで引く）の選手のスマレジ連携の状態。選手が無ければ null */
export function 選手のスマレジ連携(メール: string): { 番号: string; 存在フラグ: string } | null {
  const r = query(`select p.smaregi_id, p.exists_smaregi_flg from dtb_player p join dtb_customer c on c.id = p.customer_id where c.email = $1 order by p.id limit 1`, [メール])[0];
  return r ? { 番号: r.smaregi_id ?? "", 存在フラグ: r.exists_smaregi_flg ?? "" } : null;
}
