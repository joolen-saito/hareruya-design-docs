/** M09-04 ページ管理の保存結果の照会（参照だけ）。SQL はここにだけ書く */
import { query } from "../lib/db";

export type ページ行 = {
  ページID: string; ページ名: string | null; URL: string; ファイル名: string | null; 利用者作成: boolean;
  author: string | null; description: string | null; keyword: string | null; robot: string | null; metatag: string | null;
};

const 列 = `p.id as id, p.page_name as name, p.url as url, p.file_name as file_name, p.edit_type as edit_type,
  p.author as author, p.description as description, p.keyword as keyword, p.meta_robots as robot, p.meta_tags as metatag`;
const 変換 = (r: Record<string, string | null>): ページ行 => ({
  ページID: r.id!, ページ名: r.name, URL: r.url!, ファイル名: r.file_name, 利用者作成: r.edit_type === "0",
  author: r.author, description: r.description, keyword: r.keyword, robot: r.robot, metatag: r.metatag,
});

export function ページIDで(id: string): ページ行 | null {
  const r = query(`select ${列} from dtb_page p where p.id = $1`, [id]);
  return r.length ? 変換(r[0]) : null;
}
export function ページ名で(name: string): ページ行[] {
  return query(`select ${列} from dtb_page p where p.page_name = $1 order by p.id`, [name]).map(変換);
}
/** そのページに設定されているレイアウトの名称と端末種別（PC / モバイル / その他）の組 */
export function レイアウトの設定(ページID: string): { 名称: string; 端末種別: string }[] {
  return query(`select l.layout_name as name, l.device_type_id as dev from dtb_page_layout pl join dtb_layout l on l.id = pl.layout_id where pl.page_id = $1 order by pl.sort_no`, [ページID])
    .map((r) => ({ 名称: r.name!, 端末種別: r.dev === "10" ? "PC" : r.dev === "2" || r.dev === "1" ? "モバイル" : `その他(${r.dev})` }));
}
