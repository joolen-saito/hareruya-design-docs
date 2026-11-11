/** M13-10 イベント申込詳細・編集のDB確認（参照）と、実行の印つきの申込への参加者の追加（書き込み）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";

/** 申込の申込状況の名前（申込が無ければ null） */
export function 申込の申込状況(申込ID: string): string | null {
  return query(
    `select s.name as status from dtb_event_entry e join mtb_entry_status s on s.id = e.entry_status_id where e.id = $1::int`, [申込ID],
  )[0]?.status ?? null;
}

/** 申込に付く、有効な参加者のプレイヤーID（古い順） */
export function 申込の参加者のプレイヤーID(申込ID: string): string[] {
  return query(
    `select player_id as pid from dtb_entry_player where event_entry_id = $1::int and deleted_at is null order by id`, [申込ID],
  ).map((r) => r.pid ?? "");
}

/** 申込に付く申込履歴のID（古い順） */
export function 申込の申込履歴ID(申込ID: string): string[] {
  return query(`select id from dtb_entry_history where event_entry_id = $1::int order by id`, [申込ID]).map((r) => r.id ?? "");
}

/**
 * 申込に、画面で足せない2人目以降の参加者を足す（DB への書き込み。依頼者の承認 2026-11-10「印つきデータは何でも」）。
 * 対象は、実行の印つきのイベント名のイベントの申込だけ（印を含まない申込には書かない）。
 */
export function 申込に参加者を足す(申込ID: string, プレイヤーID: string, 席順: number, 印: string): void {
  writeTestData({
    理由: `実行の印つきの申込 ${申込ID} に参加者（プレイヤーID ${プレイヤーID}）を足す（画面には2人目以降の参加者を足す操作が無い）`,
    sql: `insert into dtb_entry_player (event_entry_id, player_id, confirm_flg, seat_order) values ($1::int, $2::int, true, $3::int)`,
    params: [申込ID, プレイヤーID, 席順],
    対象の確かめ: `select ev.name_jp as 印つきの名前 from dtb_event_entry ee join dtb_event_detail d on d.id = ee.event_detail_id join dtb_event ev on ev.id = d.event_id where ee.id = $1::int`,
    確かめのparams: [申込ID],
    印,
    最大行数: 1,
  });
}
