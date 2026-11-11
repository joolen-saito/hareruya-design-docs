// 取り込み注記: 同じ部品を main 側も別に実装していたため、栗野側の版を別ファイルにした（栗野側のケース・シードがこちらを使う）。
/**
 * M14-05 カード登録CSVアップロードのDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 * CSVはマスターの英語名（色順は名称）で値を引くので、確かめもマスターの英語名で返す。
 */
import { query } from "../lib/db";

export type カード = {
  カードID: string; カード名日: string | null; カード名英: string; 点数で見たマナコスト: number | null;
  パワー: string | null; タフネス: string | null; 色順: string | null;
};

const toCard = (r: Record<string, string | null>): カード => ({
  カードID: String(r.id), カード名日: r.name_jp, カード名英: String(r.name_en), 点数で見たマナコスト: r.cmc === null ? null : Number(r.cmc),
  パワー: r.power, タフネス: r.toughness, 色順: r.seq,
});

const CARD_SQL = `select c.id, c.name_jp, c.name_en, c.cmc, c.power, c.toughness, s.name as seq
  from mtb_card c left join mtb_color_sequence s on s.id = c.color_sequence_id`;

/** カード名(英語)がちょうど一致するカード（古い順） */
export function カード名英のカード(名: string): カード[] {
  return query(`${CARD_SQL} where c.name_en = $1 order by c.id`, [名]).map(toCard);
}

/** カード名(日本語)がちょうど一致するカード（古い順） */
export function カード名日のカード(名: string): カード[] {
  return query(`${CARD_SQL} where c.name_jp = $1 order by c.id`, [名]).map(toCard);
}

export function カードIDのカード(id: string | number): カード | null {
  return query(`${CARD_SQL} where c.id = $1`, [id]).map(toCard)[0] ?? null;
}

export type カード詳細 = {
  詳細ID: string; カードID: string; カードNo: string | null; Foil: number; フレーム: number; 裏面詳細ID: string | null;
  パワー: string | null; タフネス: string | null; カードセット: string | null; レアリティ: string | null; レイアウト: string | null;
  プロモ種別: string | null; プロモフラグ: boolean; イラストレーター: string | null; 更新日時: string;
};

const toDetail = (r: Record<string, string | null>): カード詳細 => ({
  詳細ID: String(r.id), カードID: String(r.card_id), カードNo: r.card_no, Foil: Number(r.foil_flg), フレーム: Number(r.frame_flg), 裏面詳細ID: r.back,
  パワー: r.power, タフネス: r.toughness, カードセット: r.cardset, レアリティ: r.rarity, レイアウト: r.layout, プロモ種別: r.promotion,
  プロモフラグ: r.promotion_flg === "true", イラストレーター: r.illustrator, 更新日時: String(r.updated),
});

const DETAIL_SQL = `select d.id, d.card_id, d.card_no, d.foil_flg, d.frame_flg, d.back_card_detail_id as back, d.power, d.toughness,
    s.name_en as cardset, r.name_en as rarity, l.name_en as layout, p.name_en as promotion, d.promotion_flg, i.name_en as illustrator,
    d.update_date::text as updated
  from mtb_card_detail d left join mtb_cardset s on s.id = d.cardset_id left join mtb_rarity r on r.id = d.rarity_id
    left join mtb_card_layout l on l.id = d.card_layout_id left join mtb_promotion p on p.id = d.promotion_id
    left join mtb_illustrator i on i.id = d.illustrator_id`;

/** カード詳細IDのカード詳細（無ければ null） */
export function カード詳細(詳細ID: string | number): カード詳細 | null {
  return query(`${DETAIL_SQL} where d.id = $1`, [詳細ID]).map(toDetail)[0] ?? null;
}

/** カードに紐づくカード詳細（詳細IDの順） */
export function カードのカード詳細(カードID: string | number): カード詳細[] {
  return query(`${DETAIL_SQL} where d.card_id = $1 order by d.id`, [カードID]).map(toDetail);
}

/** カード詳細の表の画像URL（言語の英語名 → URL） */
export function カード詳細の画像(詳細ID: string | number): { 言語: string; URL: string | null; 裏面: boolean }[] {
  return query(`select l.name_en as lang, i.url, i.back_flg from mtb_card_image i left join mtb_language l on l.id = i.language_id
    where i.card_detail_id = $1 order by i.id`, [詳細ID]).map((r) => ({ 言語: String(r.lang), URL: r.url, 裏面: r.back_flg === "true" }));
}

export type 紐付けの種類 = "カードタイプ" | "カラー" | "固有色" | "サブタイプ" | "特殊タイプ";

/** カードに紐づく分類の英語名（並びは文字コードの順） */
export function カードの紐付け(カードID: string | number, 種類: 紐付けの種類): string[] {
  const sql: Record<紐付けの種類, string> = {
    カードタイプ: `select m.name_en from dtb_card_cardtype x join mtb_cardtype m on m.id = x.cardtype_id where x.card_id = $1 order by m.name_en`,
    カラー: `select m.name_en from dtb_card_color x join mtb_color m on m.id = x.color_id where x.card_id = $1 order by m.name_en`,
    固有色: `select m.name_en from dtb_card_color_identity x join mtb_color m on m.id = x.color_id where x.card_id = $1 order by m.name_en`,
    サブタイプ: `select m.name_en from dtb_card_subtype x join mtb_subtype m on m.id = x.subtype_id where x.card_id = $1 order by m.name_en`,
    特殊タイプ: `select m.name_en from dtb_card_specialtype x join mtb_specialtype m on m.id = x.specialtype_id where x.card_id = $1 order by m.name_en`,
  };
  return query(sql[種類], [カードID]).map((r) => String(r.name_en)).sort();
}

/** カードのリーガリティ（フォーマットの英語名と、リーガリティの日本語名「使用可・制限・禁止」。フォーマットの英語名の順） */
export function カードのリーガリティ(カードID: string | number): { フォーマット: string; リーガリティ: string }[] {
  return query(`select f.name_en as format, r.name_jp as restriction from dtb_card_format cf join mtb_format f on f.id = cf.format_id
    join mtb_restriction r on r.id = cf.restriction_id where cf.card_id = $1 order by f.name_en`, [カードID])
    .map((r) => ({ フォーマット: String(r.format), リーガリティ: String(r.restriction) }))
    .sort((a, b) => (a.フォーマット < b.フォーマット ? -1 : a.フォーマット > b.フォーマット ? 1 : 0));
}

/** イラストレーターのマスターに英語名がちょうど一致する行の数 */
export function イラストレーターの数(名英: string): number {
  return Number(query(`select count(*) as n from mtb_illustrator where name_en = $1`, [名英])[0].n);
}
