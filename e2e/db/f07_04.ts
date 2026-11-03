/** F07-04 イベント申込（フロント）のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 会員の選手ID（会員ごとに1つ。無ければ null） */
export function 会員の選手ID(会員ID: string): string | null {
  return query(`select id from dtb_player where customer_id = $1::int and deleted_at is null`, [会員ID])[0]?.id ?? null;
}

export type 日程の申込 = { 申込ID: string; 申込状況: string; 支払会員ID: string };

/** 日程の有効な申込（削除されていないもの）を、古い順に */
export function 日程の申込一覧(日程ID: string): 日程の申込[] {
  return query(
    `select e.id as id, s.name as status, e.paying_customer_id as cid
       from dtb_event_entry e join mtb_entry_status s on s.id = e.entry_status_id
      where e.event_detail_id = $1::int and e.deleted_at is null order by e.id`, [日程ID],
  ).map((r) => ({ 申込ID: r.id ?? "", 申込状況: r.status ?? "", 支払会員ID: r.cid ?? "" }));
}

/** 日程の有効な申込に紐づく、有効な申込選手の件数（会員を指定すれば、その会員の選手の分だけ） */
export function 日程の申込選手の件数(日程ID: string, 会員ID?: string): number {
  const base = `select count(*) as n from dtb_entry_player ep join dtb_event_entry e on e.id = ep.event_entry_id
      join dtb_player p on p.id = ep.player_id
     where e.event_detail_id = $1::int and e.deleted_at is null and ep.deleted_at is null`;
  return Number(query(会員ID ? `${base} and p.customer_id = $2::int` : base, 会員ID ? [日程ID, 会員ID] : [日程ID])[0].n);
}

/** 日程の有効な申込に紐づく、申込履歴の件数 */
export function 日程の申込履歴の件数(日程ID: string): number {
  return Number(query(
    `select count(*) as n from dtb_entry_history h join dtb_event_entry e on e.id = h.event_entry_id
      where e.event_detail_id = $1::int and e.deleted_at is null`, [日程ID],
  )[0].n);
}

/** 日程の申込選手のうち、確認済みでないもの（未承認）の件数 */
export function 日程の未承認の申込選手の件数(日程ID: string): number {
  return Number(query(
    `select count(*) as n from dtb_entry_player ep join dtb_event_entry e on e.id = ep.event_entry_id
      where e.event_detail_id = $1::int and e.deleted_at is null and ep.deleted_at is null and ep.confirm_flg = false`, [日程ID],
  )[0].n);
}

/** 会員のメールアドレスで登録された、会員に紐づかない選手（メールだけの仮の選手）の件数 */
export function メールだけの仮選手の件数(メール: string): number {
  return Number(query(`select count(*) as n from dtb_player where customer_id is null and lower(email) = lower($1)`, [メール])[0].n);
}

/** 申込の申込選手ID（画面に出ない番号。控えるときに参照する）。申込に1件だけあるはず */
export function 申込の申込選手ID(申込ID: string): string {
  const rows = query(`select id from dtb_entry_player where event_entry_id = $1::int and deleted_at is null order by id`, [申込ID]);
  if (rows.length !== 1) throw new Error(`申込 ${申込ID} の申込選手が ${rows.length} 件ある（1件のはず）`);
  return rows[0].id!;
}

/** 申込の登録時の履歴ID（画面に出ない番号。控えるときに参照する）。いちばん古い履歴 */
export function 申込の登録時履歴ID(申込ID: string): string {
  const rows = query(`select min(id) as id from dtb_entry_history where event_entry_id = $1::int`, [申込ID]);
  if (!rows[0]?.id) throw new Error(`申込 ${申込ID} の履歴が無い`);
  return rows[0].id;
}
