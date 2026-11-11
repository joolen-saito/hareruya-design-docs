/** F06-17 大会デッキ登録確認～完了のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 日程（イベント詳細）に結び付いた、削除されていないデッキの件数（選手・フォーマットを問わない） */
export function 日程のデッキ件数(イベント詳細ID: string): number {
  return Number(query(`select count(*) as n from dtb_deck where event_detail_id = $1::int and deleted_at is null`, [イベント詳細ID])[0].n);
}

/** 番号のイベント詳細（日程）の件数（削除済みも数える） */
export function 日程の件数(イベント詳細ID: string): number {
  return Number(query(`select count(*) as n from dtb_event_detail where id = $1::int`, [イベント詳細ID])[0].n);
}

/** 番号のデッキの件数（削除済みも数える） */
export function デッキの件数(デッキID: string): number {
  return Number(query(`select count(*) as n from dtb_deck where id = $1::int`, [デッキID])[0].n);
}

export type デッキの記録 = { デッキID: string; プレイヤー名: string | null; デッキ編集者: string | null; イベント詳細ID: string | null; 選手ID: string | null; 削除済み: boolean };

/** 番号のデッキの、プレイヤー名・デッキ編集者・日程・選手 */
export function デッキの記録(デッキID: string): デッキの記録 | null {
  const r = query(
    `select id, player_name, member_id, event_detail_id, player_id, (deleted_at is not null) as deleted from dtb_deck where id = $1::int`, [デッキID],
  )[0];
  if (!r) return null;
  return { デッキID: r.id ?? "", プレイヤー名: r.player_name, デッキ編集者: r.member_id, イベント詳細ID: r.event_detail_id, 選手ID: r.player_id, 削除済み: r.deleted === "t" || r.deleted === "true" };
}
