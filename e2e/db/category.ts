/** カテゴリのDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type 保存されたカテゴリ = {
  カテゴリID: string; 親カテゴリID: string | null; 名称: string; 英名: string | null; 階層: string; 表示順: string;
  フロント非表示: boolean; 支店非表示: boolean; 埋め込みHTML日: string | null; 埋め込みHTML英: string | null; 検索パラメータ: string | null;
};

const SELECT = `select id as "カテゴリID", parent_category_id as "親カテゴリID", category_name as "名称", category_name_en as "英名",
  hierarchy as "階層", sort_no as "表示順", front_search_hide_flg as "フロント非表示", branch_hide_flg as "支店非表示",
  html_ja as "埋め込みHTML日", html_en as "埋め込みHTML英", search_parameters as "検索パラメータ" from dtb_category`;

function toCategory(r: Record<string, string | null>): 保存されたカテゴリ {
  return {
    カテゴリID: r.カテゴリID ?? "", 親カテゴリID: r.親カテゴリID, 名称: r.名称 ?? "", 英名: r.英名, 階層: r.階層 ?? "", 表示順: r.表示順 ?? "",
    フロント非表示: r.フロント非表示 === "true", 支店非表示: r.支店非表示 === "true",
    埋め込みHTML日: r.埋め込みHTML日, 埋め込みHTML英: r.埋め込みHTML英, 検索パラメータ: r.検索パラメータ,
  };
}

/** カテゴリIDのカテゴリ。無ければ null */
export function カテゴリ(カテゴリID: string): 保存されたカテゴリ | null {
  const rows = query(`${SELECT} where id = $1`, [カテゴリID]);
  return rows.length ? toCategory(rows[0]) : null;
}

/** 名称（日）が一致するカテゴリ（カテゴリIDの順） */
export function 名称のカテゴリ(名称: string): 保存されたカテゴリ[] {
  return query(`${SELECT} where category_name = $1 order by id`, [名称]).map(toCategory);
}

/** 英名が一致するカテゴリ（カテゴリIDの順） */
export function 英名のカテゴリ(英名: string): 保存されたカテゴリ[] {
  return query(`${SELECT} where category_name_en = $1 order by id`, [英名]).map(toCategory);
}
