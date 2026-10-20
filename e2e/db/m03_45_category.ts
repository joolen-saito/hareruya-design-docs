/** M03-45 カテゴリ一覧のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** カテゴリIDのカテゴリの件数（0 か 1） */
export function カテゴリの件数(カテゴリID: string): number {
  return Number(query(`select count(*) as "件数" from dtb_category where id = $1`, [カテゴリID])[0].件数);
}

/** カテゴリIDごとの表示順。無いカテゴリは null */
export function 表示順(カテゴリID一覧: string[]): Record<string, string | null> {
  const out: Record<string, string | null> = {};
  for (const id of カテゴリID一覧) {
    const rows = query(`select sort_no as "表示順" from dtb_category where id = $1`, [id]);
    out[id] = rows.length ? rows[0].表示順 : null;
  }
  return out;
}
