/** M08-03 会員のCSV出力のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。 */
import { query } from "../lib/db";

/** 会員CSVの「出力する項目」の番号を、出力の並びで返す */
export function 会員CSVの出力項目の番号(): string[] {
  return query(`select id from dtb_csv where csv_type_id = 2 and enabled order by sort_no, id`).map((r) => String(r.id));
}
