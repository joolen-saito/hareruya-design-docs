/** 売上分析タグのDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type 保存された売上分析タグ = { 売上分析タグID: string; 名称: string; 並び順: string };

const SELECT = `select id as "売上分析タグID", name as "名称", "rank" as "並び順" from mtb_tag_sales_analysis`;

function toTag(r: Record<string, string | null>): 保存された売上分析タグ {
  return { 売上分析タグID: r.売上分析タグID ?? "", 名称: r.名称 ?? "", 並び順: r.並び順 ?? "" };
}

/** 売上分析タグIDの売上分析タグ。無ければ null */
export function 売上分析タグ(売上分析タグID: string): 保存された売上分析タグ | null {
  const rows = query(`${SELECT} where id = $1`, [売上分析タグID]);
  return rows.length ? toTag(rows[0]) : null;
}

/** 名称と並び順が一致する売上分析タグ（売上分析タグIDの順） */
export function 名称と並び順の売上分析タグ(名称: string, 並び順: string): 保存された売上分析タグ[] {
  return query(`${SELECT} where name = $1 and "rank" = $2 order by id`, [名称, 並び順]).map(toTag);
}

/** 名称が一致する売上分析タグ（売上分析タグIDの順） */
export function 名称の売上分析タグ(名称: string): 保存された売上分析タグ[] {
  return query(`${SELECT} where name = $1 order by id`, [名称]).map(toTag);
}
