/** M15-02 デッキCSV出力のDB確認（参照だけ）。保存されている値を、業務の言葉の関数名で返す。 */
import { query } from "../lib/db";

/** デッキに保存されているフォーマット名(英)とアーキタイプ名(日)（未設定は空） */
export function 保存済みのフォーマットとアーキタイプ(デッキID: string): { フォーマット名英: string; アーキタイプ名日: string } {
  const r = query(
    "select coalesce(f.name_en,'') as f, coalesce(a.name_jp,'') as a from dtb_deck d left join mtb_format f on f.id = d.format_id left join dtb_archetype a on a.id = d.archetype_id where d.id = $1",
    [デッキID],
  );
  if (r.length !== 1) throw new Error(`デッキID ${デッキID} が1件に決まらない（${r.length}件）`);
  return { フォーマット名英: r[0].f!, アーキタイプ名日: r[0].a! };
}
