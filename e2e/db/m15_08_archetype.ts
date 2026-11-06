/** M15-08 アーキタイプ検索・一覧のDB確認（参照だけ）。 */
import { query } from "../lib/db";

/** 日本語名または英語名に語を含む、削除されていないアーキタイプの数 */
export function 名前に含む未削除アーキタイプの数(語: string): number {
  return Number(query("select count(*) as n from dtb_archetype where deleted_at is null and (name_jp like $1 or name_en like $1)", [`%${語}%`])[0]?.n ?? 0);
}
