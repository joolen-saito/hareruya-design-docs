/** M16-04 MTGマスターデータ編集のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 種別の表示名 → 表（画面の選択肢の表示名で引く） */
const 表: Record<string, string> = {
  レアリティ: "mtb_rarity", デッキタグ: "mtb_deck_tag", 色順: "mtb_color_sequence", カードタイプ: "mtb_cardtype", サブタイプ: "mtb_subtype",
  特殊タイプ: "mtb_specialtype", カラー: "mtb_color", カードレイアウト: "mtb_card_layout", プロモーション: "mtb_promotion", イラストレーター: "mtb_illustrator",
  リーガリティ: "mtb_restriction", ボード: "mtb_board", カードセットブロック: "mtb_cardsetblock", 認定: "mtb_certification", 言語: "mtb_language",
  マナシンボル: "mtb_mana_symbol", ルール適用度: "mtb_rel", キャンペーンタグ: "mtb_campaign_tag", 状態: "mtb_card_condition",
  特殊サジェスト: "mtb_special_suggest", 特殊制限: "mtb_special_restriction", お問い合わせ件名: "mtb_contact_subject",
};

/** 種別の行の並び順（行が無ければ null） */
export function 行の並び順(種別: string, 番号: number | string): string | null {
  const t = 表[種別];
  if (!t) throw new Error(`種別「${種別}」の表が分からない`);
  const r = query(`select sort_no from ${t} where id = $1::int`, [String(番号)]);
  return r.length ? r[0].sort_no : null;
}

export type カードの色の行 = { 番号: string; 日本語名: string | null; 英語名: string | null; 並び順: string | null };

/** カラーの行（無ければ null） */
export function カラーの行(番号: number | string): カードの色の行 | null {
  const r = query(`select id, name_jp, name_en, sort_no from mtb_color where id = $1::int`, [String(番号)]);
  if (!r.length) return null;
  return { 番号: r[0].id ?? "", 日本語名: r[0].name_jp, 英語名: r[0].name_en, 並び順: r[0].sort_no };
}

/** 日本語名がこの値のカラーの行 */
export function 日本語名のカラー(日本語名: string): カードの色の行[] {
  return query(`select id, name_jp, name_en, sort_no from mtb_color where name_jp = $1::text order by id`, [日本語名])
    .map((r) => ({ 番号: r.id ?? "", 日本語名: r.name_jp, 英語名: r.name_en, 並び順: r.sort_no }));
}

/** カラーの件数 */
export function カラーの件数(): number {
  return Number(query(`select count(*) as n from mtb_color`)[0].n);
}
