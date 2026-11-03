/** M08-02 メール一括送信のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。 */
import { query } from "../lib/db";

/** 会員の送信履歴（メール履歴）の件数 */
export function 送信履歴の件数(会員ID: string): number {
  return Number(query(`select count(*) as n from dtb_mail_history where customer_id = $1::int`, [会員ID])[0].n);
}
