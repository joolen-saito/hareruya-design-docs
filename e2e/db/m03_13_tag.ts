/** タグとタグの優先表示順のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type 保存されたタグ = {
  タグID: string; 名称日: string | null; 名称英: string | null; 並び順: string | null;
  フリーエリア日: string | null; フリーエリア英: string | null; 優先表示商品: string | null;
  タイトル日: string | null; 説明日: string | null; タイトル英: string | null; 説明英: string | null;
};
export type 優先表示の行 = { 規格コード: string; 順位: string };

const SELECT = `select id as "タグID", name as "名称日", name_en as "名称英", sort_no as "並び順",
  free_area_jp as "フリーエリア日", free_area_en as "フリーエリア英", priority_products as "優先表示商品",
  title_jp as "タイトル日", description_jp as "説明日", title_en as "タイトル英", description_en as "説明英"
  from dtb_tag`;

function toTag(r: Record<string, string | null>): 保存されたタグ {
  return {
    タグID: r.タグID ?? "", 名称日: r.名称日, 名称英: r.名称英, 並び順: r.並び順,
    フリーエリア日: r.フリーエリア日, フリーエリア英: r.フリーエリア英, 優先表示商品: r.優先表示商品,
    タイトル日: r.タイトル日, 説明日: r.説明日, タイトル英: r.タイトル英, 説明英: r.説明英,
  };
}

/** タグIDのタグ。無ければ null */
export function タグ(タグID: string): 保存されたタグ | null {
  const rows = query(`${SELECT} where id = $1`, [タグID]);
  return rows.length ? toTag(rows[0]) : null;
}

/** 名称(日)が一致するタグ（タグIDの順） */
export function 名称のタグ(名称日: string): 保存されたタグ[] {
  return query(`${SELECT} where name = $1 order by id`, [名称日]).map(toTag);
}

/** タグIDの優先表示順の行（順位の大きい順。同じ順位は規格コードの順） */
export function 優先表示順(タグID: string): 優先表示の行[] {
  return query(`select pc.product_code as "規格コード", ts.rank as "順位"
    from dtb_tag_sort ts join dtb_product_class pc on pc.id = ts.product_class_id
    where ts.tag_id = $1 order by ts.rank desc, pc.product_code`, [タグID])
    .map((r) => ({ 規格コード: r.規格コード ?? "", 順位: r.順位 ?? "" }));
}
