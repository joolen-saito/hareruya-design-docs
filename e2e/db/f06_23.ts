/** F06-23 お問い合わせ履歴のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** お問い合わせ番号の行があるか */
export function お問い合わせがある(番号: string): boolean {
  return query(`select id from dtb_contact where id = $1::int`, [番号]).length > 0;
}
