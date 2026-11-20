/**
 * M03-22 購入グループの、E2E が作った行への書き足し（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」。lib/db_write.ts の窓口）。
 * 物理名はこのファイルの SQL の中にだけ書く。書き足すのは、画面で指定できない日時（作成日時・更新日時・削除日時）だけ。
 * 持ち主の確かめは「名称（日）の末尾に実行の印がある購入グループ」。
 */
import { query } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

const 自分の購入グループ = { sql: `select g.id from mtb_sell_group g where g.name like '%-' || $1`, params: [RUN_MARK] };

/** 購入グループの作成日時・更新日時（と、あれば削除日時）を書き足す。日時は「2026-01-01 00:00:00+09」の形 */
export function 購入グループの日時を書き足す(what: string, 購入グループID: string, v: { 作成日時: string; 更新日時: string; 削除日時?: string }): void {
  const set: Record<string, string> = { create_date: v.作成日時, update_date: v.更新日時 };
  if (v.削除日時) set.deleted_at = v.削除日時;
  updateOwnRows(what, { table: "mtb_sell_group", key: "id", ids: [購入グループID], set, owner: 自分の購入グループ });
}

/** 購入グループIDの行があるか（削除日時が入った行も含む） */
export function 購入グループの行がある(購入グループID: string): boolean {
  return query(`select g.id from mtb_sell_group g where g.id = $1`, [購入グループID]).length > 0;
}
/** 購入グループの名称（日）・名称（英）・メモ（行が無ければ null） */
export function 購入グループの入力値(購入グループID: string): { 名称日: string; 名称英: string; メモ: string } | null {
  const r = query(`select g.name as n, g.name_en as e, coalesce(g.memo, '') as m from mtb_sell_group g where g.id = $1`, [購入グループID]);
  return r.length ? { 名称日: r[0].n ?? "", 名称英: r[0].e ?? "", メモ: r[0].m ?? "" } : null;
}
