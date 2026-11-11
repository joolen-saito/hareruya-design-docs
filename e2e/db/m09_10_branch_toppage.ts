/** M09-10 支店トップページ管理のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type トップページ設定の値 = { 共通設定を適用: boolean; バナー画像: string; バナーリンクタグID: string };

/** 支店の、支店共通設定を適用・バナー画像（保管先）・バナーリンクタグのタグID（未設定は空） */
export function 支店のトップページ設定(支店ID: string): トップページ設定の値 {
  const rows = query(`select common_setting_flg as flg, banner_image as image, banner_image_tag as tag from dtb_base_info where id = $1`, [支店ID]);
  if (rows.length !== 1) throw new Error(`支店ID ${支店ID} の支店が ${rows.length} 件`);
  return { 共通設定を適用: rows[0].flg === "true", バナー画像: rows[0].image ?? "", バナーリンクタグID: rows[0].tag ?? "" };
}

export type タイルの値 = { タイルID: string; 位置: number; 属性: string; タグID: string };

/** 支店のタイル（タイル位置の順）。属性はタイル属性の名称、タグIDは未設定なら空 */
export function 支店のタイル(支店ID: string): タイルの値[] {
  return query(
    `select t.id as id, t.section as section, tt.name as type_name, t.tag_id as tag_id
       from dtb_tile t join mtb_tile_type tt on tt.id = t.tile_type_id
      where t.base_info_id = $1 order by t.section, t.id`, [支店ID],
  ).map((r) => ({ タイルID: r.id ?? "", 位置: Number(r.section), 属性: r.type_name ?? "", タグID: r.tag_id ?? "" }));
}
