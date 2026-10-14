/** 日程のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 日程の状態。「ある」＝削除されていない／「削除済み」＝削除の印が付いている／「無い」＝行が無い */
export function 日程の状態(日程ID: string): "ある" | "削除済み" | "無い" {
  const r = query(`select deleted_at from dtb_event_detail where id = $1::int`, [日程ID])[0];
  if (!r) return "無い";
  return r.deleted_at === null ? "ある" : "削除済み";
}

/** 日程が属するイベントのイベントID（削除済みの日程も引ける）。行が無ければ null */
export function 日程のイベントID(日程ID: string): string | null {
  return query(`select event_id from dtb_event_detail where id = $1::int`, [日程ID])[0]?.event_id ?? null;
}
