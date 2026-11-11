/** F09-03 メタゲーム一覧のDB確認（参照だけ）。物理名はこのファイルの SQL の中だけに書く。 */
import { query } from "../lib/db";

/** フォーマットのデッキの、デッキの番号と更新日時（番号の順） */
export function フォーマットのデッキの更新日時(フォーマットの番号: string): { デッキ: string; 更新日時: string }[] {
  return query(
    "select d.id as i, to_char(d.update_date, 'YYYY-MM-DD HH24:MI:SS.US TZ') as u from dtb_deck d where d.format_id = $1 order by d.id",
    [フォーマットの番号],
  ).map((r) => ({ デッキ: r.i ?? "", 更新日時: r.u ?? "" }));
}
