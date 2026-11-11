/** M13-07 イベント申込一括編集のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 申込の申込状況の名前（申込が無ければ空） */
export function 申込の申込状況(申込ID: string): string {
  const r = query(
    `select s.name as status from dtb_event_entry e join mtb_entry_status s on s.id = e.entry_status_id where e.id = $1::int`, [申込ID],
  );
  return r[0]?.status ?? "";
}

/** 申込に付く申込履歴の件数 */
export function 申込の申込履歴の件数(申込ID: string): number {
  return Number(query(`select count(*) as n from dtb_entry_history where event_entry_id = $1::int`, [申込ID])[0].n);
}
