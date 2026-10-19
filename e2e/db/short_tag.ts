/** 略称タグのDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { count, query } from "../lib/db";

export type 保存された略称タグ = { 略称タグID: string; 名称: string; 並び順: string; アルファベット順: boolean };

const SELECT = `select id as "略称タグID", name as "名称", "rank" as "並び順", alphabet_sort_flg as "アルファベット順" from mtb_storage_code`;

function toTag(r: Record<string, string | null>): 保存された略称タグ {
  return { 略称タグID: r.略称タグID ?? "", 名称: r.名称 ?? "", 並び順: r.並び順 ?? "", アルファベット順: r.アルファベット順 === "true" };
}

/** 略称タグIDの略称タグ。無ければ null */
export function 略称タグ(略称タグID: string): 保存された略称タグ | null {
  const rows = query(`${SELECT} where id = $1`, [略称タグID]);
  return rows.length ? toTag(rows[0]) : null;
}

/** 名称が一致する略称タグ（略称タグIDの順） */
export function 名称の略称タグ(名称: string): 保存された略称タグ[] {
  return query(`${SELECT} where name = $1 order by id`, [名称]).map(toTag);
}

/** 略称タグの全件数 */
export function 略称タグの件数(): number {
  return count("select id from mtb_storage_code");
}

/** 略称タグIDの最大値（登録の前後で、新しい行が増えたかを見る） */
export function 略称タグIDの最大値(): string {
  return query(`select coalesce(max(id), 0) as "最大" from mtb_storage_code`)[0].最大 ?? "0";
}
