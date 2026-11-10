/** F06-21 退会（完了後）のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type 会員の退会状態 = { メール: string; 削除済み: string };

/** 会員IDの会員（削除済みを含む）のメールアドレスと削除フラグ */
export function 会員の退会状態(会員ID: string): 会員の退会状態 | null {
  const r = query(`select email, del_flg from dtb_customer where id = $1::int`, [会員ID])[0];
  return r ? { メール: r.email ?? "", 削除済み: r.del_flg ?? "" } : null;
}

/** 会員に紐づく選手情報のうち、削除されていないものの数と、削除された日時のあるものの数 */
export function 会員の選手情報(会員ID: string): { 未削除: number; 削除済み: number } {
  const r = query(
    `select count(*) filter (where deleted_at is null) as alive, count(*) filter (where deleted_at is not null) as dead from dtb_player where customer_id = $1::int`,
    [会員ID],
  )[0];
  return { 未削除: Number(r.alive), 削除済み: Number(r.dead) };
}

/** 会員のメール送信履歴の件数 */
export function 会員の送信履歴の件数(会員ID: string): number {
  return Number(query(`select count(*) as n from dtb_mail_history where customer_id = $1::int`, [会員ID])[0].n);
}
