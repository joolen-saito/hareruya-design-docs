/** メンバー（管理者）のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** ログインIDから管理者IDを引く。無ければ null */
export function 管理者ID(ログインID: string): string | null {
  return query(`select id from dtb_member where login_id = $1`, [ログインID])[0]?.id ?? null;
}
