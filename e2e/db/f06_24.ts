/** F06-24 お問い合わせ履歴詳細のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** お問い合わせ番号の記録（全項目を1つの文にしたもの）。無ければ null */
export function お問い合わせの記録(番号: string): string | null {
  const rows = query(`select row_to_json(c)::text as rec from dtb_contact c where c.id = $1::int`, [番号]);
  return rows.length === 0 ? null : rows[0].rec ?? null;
}
