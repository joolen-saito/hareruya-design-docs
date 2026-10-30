/** F03-04 カテゴリ一覧のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type 子カテゴリ = { カテゴリID: string; 名称: string; 英名: string | null; 検索パラメータ: string | null };

/** 親カテゴリIDを親に持つカテゴリ（カテゴリIDの順） */
export function 子カテゴリの一覧(親カテゴリID: string): 子カテゴリ[] {
  return query(
    `select id as "カテゴリID", category_name as "名称", category_name_en as "英名", search_parameters as "検索パラメータ"
       from dtb_category where parent_category_id = $1 order by id`, [親カテゴリID],
  ).map((r) => ({ カテゴリID: r.カテゴリID ?? "", 名称: r.名称 ?? "", 英名: r.英名, 検索パラメータ: r.検索パラメータ }));
}
