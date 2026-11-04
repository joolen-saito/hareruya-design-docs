/** M13-03 日程のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type 日程の記録 = {
  日程ID: string; 開始時間: string | null; 受付開始: string | null; 受付終了: string | null;
  オンライン受付開始: string | null; オンライン受付終了: string | null; デッキ登録締切: string | null;
  定員: string | null; 参加費: string | null; 賞品日: string | null; 賞品英: string | null;
  デッキ登録を終了する: boolean; デッキ登録あり: boolean; オンライン受付あり: boolean; 祝日: boolean | null;
  登録者: string | null; 公開状態: string; 削除済み: boolean;
};

const bool = (v: string | null) => v === "true";
const FMT = "YYYY/MM/DD HH24:MI";

/** イベントの日程（削除済みを除く）。日程IDの昇順 */
export function イベントの日程(イベントID: string, 削除済みも含める = false): 日程の記録[] {
  const rows = query(
    `select d.id::text as id, to_char(d.start_date at time zone 'Asia/Tokyo','${FMT}') as start_date,
            to_char(d.entry_start_date at time zone 'Asia/Tokyo','${FMT}') as entry_start_date,
            to_char(d.entry_end_date at time zone 'Asia/Tokyo','${FMT}') as entry_end_date,
            to_char(d.online_entry_start_date at time zone 'Asia/Tokyo','${FMT}') as online_entry_start_date,
            to_char(d.online_entry_end_date at time zone 'Asia/Tokyo','${FMT}') as online_entry_end_date,
            to_char(d.deck_regist_deadline at time zone 'Asia/Tokyo','${FMT}') as deck_regist_deadline,
            d.capacity::text as capacity, d.entry_fee::text as entry_fee, d.prize_jp, d.prize_en,
            d.deadline_flg::text as deadline_flg, d.deck_regist_flg::text as deck_regist_flg, d.entry_flg::text as entry_flg,
            d.holiday_flg::text as holiday_flg, d.member_id::text as member_id, m.name as disp_name, (d.deleted_at is not null)::text as deleted
       from dtb_event_detail d join mtb_disp m on m.id = d.disp_id
      where d.event_id = $1::int ${削除済みも含める ? "" : "and d.deleted_at is null"}
      order by d.id`, [イベントID]);
  return rows.map((r) => ({
    日程ID: r.id!, 開始時間: r.start_date, 受付開始: r.entry_start_date, 受付終了: r.entry_end_date,
    オンライン受付開始: r.online_entry_start_date, オンライン受付終了: r.online_entry_end_date, デッキ登録締切: r.deck_regist_deadline,
    定員: r.capacity, 参加費: r.entry_fee, 賞品日: r.prize_jp, 賞品英: r.prize_en,
    デッキ登録を終了する: bool(r.deadline_flg), デッキ登録あり: bool(r.deck_regist_flg), オンライン受付あり: bool(r.entry_flg),
    祝日: r.holiday_flg === null ? null : bool(r.holiday_flg), 登録者: r.member_id, 公開状態: r.disp_name ?? "", 削除済み: bool(r.deleted),
  }));
}

/** 日程IDの日程（削除済みも引く）。無ければ null */
export function 日程(日程ID: string): 日程の記録 | null {
  const r = query(`select event_id::text as e from dtb_event_detail where id = $1::int`, [日程ID])[0];
  if (!r) return null;
  return イベントの日程(r.e!, true).find((x) => x.日程ID === 日程ID) ?? null;
}

/** 管理者のログインIDから、管理者ID（日程の登録者と比べる） */
export function 管理者ID(ログインID: string): string | null {
  return query(`select id::text as id from dtb_member where login_id = $1`, [ログインID])[0]?.id ?? null;
}
