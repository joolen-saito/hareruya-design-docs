/** 略称タグCSV入力のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type 取り込まれた略称タグ = { 略称タグID: string; 名称: string; 並び順: string; アルファベット順: boolean };

const SELECT = `select id as "略称タグID", name as "名称", "rank" as "並び順", alphabet_sort_flg as "アルファベット順" from mtb_storage_code`;

function toTag(r: Record<string, string | null>): 取り込まれた略称タグ {
  return { 略称タグID: r.略称タグID ?? "", 名称: r.名称 ?? "", 並び順: r.並び順 ?? "", アルファベット順: r.アルファベット順 === "true" };
}

/** 略称タグIDの略称タグ。無ければ null */
export function 略称タグIDの略称タグ(略称タグID: string): 取り込まれた略称タグ | null {
  const rows = query(`${SELECT} where id = $1`, [略称タグID]);
  return rows.length ? toTag(rows[0]) : null;
}

/** 名称が一致する略称タグ（略称タグIDの順） */
export function 名称が一致する略称タグ(名称: string): 取り込まれた略称タグ[] {
  return query(`${SELECT} where name = $1 order by id`, [名称]).map(toTag);
}

/** 並び順が一致する略称タグ（略称タグIDの順） */
export function 並び順が一致する略称タグ(並び順: string): 取り込まれた略称タグ[] {
  return query(`${SELECT} where "rank" = $1 order by id`, [並び順]).map(toTag);
}

/** 略称タグIDの最大値（取り込みの前後で、新しく追加された行を見分ける） */
export function 略称タグIDの最大値(): number {
  return Number(query(`select coalesce(max(id), 0) as "最大" from mtb_storage_code`)[0].最大 ?? "0");
}
