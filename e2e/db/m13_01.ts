/** M13-01 イベント一覧のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** ページ表示件数のマスタの既定値（並び順が先頭の件数） */
export function ページ表示件数マスタの既定値(): number {
  const r = query("select name from mtb_page_max order by sort_no asc, id asc limit 1");
  return Number(r[0]?.name);
}

/** イベントが登録済みとして取得できるか（削除されたものは含まない） */
export function 登録済みのイベントか(イベントID: string): boolean {
  return query("select id from dtb_event where id = $1::int and deleted_at is null", [イベントID]).length > 0;
}
