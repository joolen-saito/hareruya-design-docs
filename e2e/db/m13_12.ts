/** M13-12 イベント新規申込登録のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type 申込の内容 = { 申込ID: string; 支払金額: string | null; 申込状況: string; 支払方法: string | null };

/** 日程の有効な申込（削除されていないもの）を、古い順に。申込状況・支払方法は名前で返す */
export function 日程の申込の内容(日程ID: string): 申込の内容[] {
  return query(
    `select e.id as id, e.price as price, s.name as status, p.payment_method as payment
       from dtb_event_entry e
       join mtb_entry_status s on s.id = e.entry_status_id
       left join dtb_payment p on p.id = e.payment_id
      where e.event_detail_id = $1::int and e.deleted_at is null
      order by e.id`, [日程ID],
  ).map((r) => ({ 申込ID: r.id ?? "", 支払金額: r.price, 申込状況: r.status ?? "", 支払方法: r.payment }));
}

/** 日程の有効な申込に付く、有効な申込プレイヤーのプレイヤーID（古い順） */
export function 日程の申込プレイヤーのプレイヤーID(日程ID: string): string[] {
  return query(
    `select ep.player_id as pid from dtb_entry_player ep join dtb_event_entry e on e.id = ep.event_entry_id
      where e.event_detail_id = $1::int and e.deleted_at is null and ep.deleted_at is null order by ep.id`, [日程ID],
  ).map((r) => r.pid ?? "");
}

/** 日程の申込に付く申込履歴の件数（削除された申込の分も数える） */
export function 日程の申込履歴の件数(日程ID: string): number {
  return Number(query(
    `select count(*) as n from dtb_entry_history h join dtb_event_entry e on e.id = h.event_entry_id
      where e.event_detail_id = $1::int`, [日程ID],
  )[0].n);
}

/** プレイヤーの、その日程への有効な申込の件数 */
export function プレイヤーの日程への申込件数(プレイヤーID: string, 日程ID: string): number {
  return Number(query(
    `select count(distinct e.id) as n from dtb_event_entry e join dtb_entry_player ep on ep.event_entry_id = e.id
      where e.event_detail_id = $1::int and ep.player_id = $2::int and e.deleted_at is null and ep.deleted_at is null`, [日程ID, プレイヤーID],
  )[0].n);
}

/** 日程の申込の件数（削除されたものも含む。登録が行われなかったことを見るため） */
export function 日程の申込の件数_削除済みを含む(日程ID: string): number {
  return Number(query(`select count(*) as n from dtb_event_entry where event_detail_id = $1::int`, [日程ID])[0].n);
}
