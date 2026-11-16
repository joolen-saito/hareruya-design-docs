/** M13-15 画像設定のDB確認（参照だけ）。バナー設定（識別番号ごとの内容）を読む。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type バナー設定の行 = { 識別番号: number; 画像URL: string; リンク先URL: string; 表示タイプ: string; 画像alt属性: string; 表示店舗: string; 言語: string };

/** 識別番号 1〜15 のバナー設定（全列。表示店舗・言語は ID の昇順）。無い識別番号は返さない */
export function バナー設定を読む(): バナー設定の行[] {
  const rows = query(
    `select b.id::text as id, b.image_url, b.link, b.disp_type::text as disp_type, coalesce(b.image_alt, '') as image_alt,
       coalesce((select string_agg(bb.base_info_id::text, ',' order by bb.base_info_id) from dtb_banner_base_info bb where bb.banner_id = b.id), '') as shops,
       coalesce((select string_agg(bl.language_id::text, ',' order by bl.language_id) from dtb_banner_language bl where bl.banner_id = b.id), '') as langs
     from mtb_banner b where b.id between 1 and 15 order by b.id`,
  );
  return rows.map((r) => ({
    識別番号: Number(r.id), 画像URL: r.image_url ?? "", リンク先URL: r.link ?? "", 表示タイプ: r.disp_type ?? "", 画像alt属性: r.image_alt ?? "",
    表示店舗: r.shops ?? "", 言語: r.langs ?? "",
  }));
}

/** 1行を読める文字にする（比べる・画像の表に出す） */
export const バナー設定の文 = (r: バナー設定の行): string =>
  `画像URL「${r.画像URL}」・リンク先「${r.リンク先URL}」・表示タイプ ${r.表示タイプ}・alt「${r.画像alt属性}」・表示店舗ID [${r.表示店舗}]・言語ID [${r.言語}]`;
