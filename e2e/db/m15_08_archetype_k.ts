// 取り込み注記: 同じ部品を main 側も別に実装していたため、栗野側の版を別ファイルにした（栗野側のケース・シードがこちらを使う）。
/** M15-08 アーキタイプ検索のDB確認（参照だけ）。物理名はこのファイルの SQL の中だけに書く。 */
import { query } from "../lib/db";

/** アーキタイプの削除の状態。行が無ければ null（削除日時は、削除済みでなければ空） */
export function アーキタイプの削除状態(id: string): { 行がある: boolean; 削除日時: string } | null {
  const rows = query("select deleted_at as d from dtb_archetype where id = $1", [id]);
  if (rows.length === 0) return null;
  return { 行がある: true, 削除日時: rows[0].d ?? "" };
}
