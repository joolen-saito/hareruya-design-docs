/** M16-01 トップバナーのDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type 保存されたバナー = { ID: number; 画像URL: string; リンク先URL: string; 表示タイプ: string; 言語: string[]; 画像alt属性: string; 並び順: string };

const 表示タイプの名 = (v: string | null): string => (v === "1" ? "表示" : v === "0" ? "非表示" : `（値 ${v ?? "なし"}）`);

/** ID のトップバナーの保存された値（言語は言語の名前の昇順。無い ID は返さない） */
export function トップバナーを読む(ids: number[]): 保存されたバナー[] {
  const rows = query(
    `select b.id::text as id, b.image_url, b.link, b.disp_type::text as disp_type, coalesce(b.image_alt, '') as image_alt, b.sort_no::text as sort_no,
       coalesce((select string_agg(l.name_jp, ',' order by l.id) from dtb_top_banner_language tl join mtb_language l on l.id = tl.language_id where tl.top_banner_id = b.id), '') as langs
     from mtb_top_banner b where b.id = any(string_to_array($1, ',')::int[]) order by b.id`,
    [ids.join(",")],
  );
  return rows.map((r) => ({
    ID: Number(r.id), 画像URL: r.image_url ?? "", リンク先URL: r.link ?? "", 表示タイプ: 表示タイプの名(r.disp_type),
    言語: (r.langs ?? "").split(",").filter(Boolean), 画像alt属性: r.image_alt ?? "", 並び順: r.sort_no ?? "",
  }));
}
