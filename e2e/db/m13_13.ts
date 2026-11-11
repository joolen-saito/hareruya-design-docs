/** M13-13 イベント一括登録のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/**
 * イベントとイベント日程の総数。削除の印が付いた行も数える（取込で行が足されたかを、前後の数の差で見るため。
 * 画面の削除は削除の印を付けるだけなので、ほかの操作で数が減ることはない）。
 */
export function イベントと日程の総数(): { イベント: number; 日程: number } {
  const r = query(`select (select count(*) from dtb_event) as events, (select count(*) from dtb_event_detail) as details`)[0];
  return { イベント: Number(r.events), 日程: Number(r.details) };
}

/** イベント名(日)が語で始まるイベントの件数（削除済みは含まない） */
export function 名前が語で始まるイベントの件数(語: string): number {
  return Number(query(`select count(*) as n from dtb_event where deleted_at is null and left(name_jp, length($1)) = $1`, [語])[0].n);
}

/**
 * 保存されているイベント日程。日時は「2026-10-10 15:00」の形（時刻帯はアプリの時刻帯で表す）。空の値は ""、真偽は "真"／"偽"。
 * 受付の有無を表す項目は無く、受付時間（From・To）が入っているかで表される（アプリの作り）。
 */
export type 保存日程 = {
  日程ID: string; 開始時間: string; 受付時間From: string; 受付時間To: string; デッキ登録: string; デッキ登録締切: string;
  オンライン受付: string; オンライン受付時間From: string; オンライン受付時間To: string; 定員: string; 参加費: string; 公開状態: string;
  "賞品(日)": string; "賞品(英)": string;
};

/** イベントに属する日程（削除済みは含まない。日程IDの昇順） */
export function イベントの日程(イベントID: string, 時刻帯: string): 保存日程[] {
  const t = (c: string, a: string) => `coalesce(to_char(d.${c} at time zone $2, 'YYYY-MM-DD HH24:MI'), '') as ${a}`;
  const rows = query(`
    select d.id, ${t("start_date", "start_at")}, ${t("entry_start_date", "entry_from")}, ${t("entry_end_date", "entry_to")},
           d.deck_regist_flg, ${t("deck_regist_deadline", "deck_deadline")}, d.entry_flg,
           ${t("online_entry_start_date", "online_from")}, ${t("online_entry_end_date", "online_to")},
           d.capacity, d.entry_fee, coalesce(m.name, '') as disp, coalesce(d.prize_jp, '') as prize_jp, coalesce(d.prize_en, '') as prize_en
      from dtb_event_detail d left join mtb_disp m on m.id = d.disp_id
     where d.deleted_at is null and d.event_id = $1::int
     order by d.id`, [イベントID, 時刻帯]);
  const b = (v: string | null) => (v === "true" ? "真" : "偽");
  const s = (v: string | null) => v ?? "";
  return rows.map((r) => ({
    日程ID: s(r.id), 開始時間: s(r.start_at), 受付時間From: s(r.entry_from), 受付時間To: s(r.entry_to), デッキ登録: b(r.deck_regist_flg),
    デッキ登録締切: s(r.deck_deadline), オンライン受付: b(r.entry_flg), オンライン受付時間From: s(r.online_from), オンライン受付時間To: s(r.online_to),
    定員: s(r.capacity), 参加費: s(r.entry_fee), 公開状態: s(r.disp), "賞品(日)": s(r.prize_jp), "賞品(英)": s(r.prize_en),
  }));
}
