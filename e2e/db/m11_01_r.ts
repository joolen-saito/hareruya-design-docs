/** M11-01 追加分の DB 確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。 */
import { query } from "../lib/db";

/** 名前が一致する、削除されていないメンバーの数 */
export function 名前のメンバーの数(名前: string): number {
  return query(`select id::text as i from dtb_member where name = $1`, [名前]).length;
}
