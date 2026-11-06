/** M14-05 カード登録CSVアップロードのDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type 取込後のカード = {
  カードID: string; カード名英: string; 点数で見たマナ: string | null; パワー: string | null; タフネス: string | null; 忠誠度: string | null; 色順: string | null;
};
export type 取込後の詳細 = {
  詳細ID: string; コレクターNo: string | null; 裏面詳細ID: string | null; Foil: string | null; フレーム: string | null; パワー: string | null; タフネス: string | null;
  カードセット: string | null; レアリティ: string | null; イラストレーター: string | null; レイアウト: string | null; プロモ種別: string | null;
};

/** カード名(英)が一致するカード（古い順） */
export function カード名でカード(名: string): 取込後のカード[] {
  return query(`select c.id, c.name_en, c.cmc, c.power, c.toughness, c.loyalty, s.name as seq from mtb_card c left join mtb_color_sequence s on s.id = c.color_sequence_id
    where c.name_en = $1 order by c.id`, [名]).map((r) => ({
    カードID: String(r.id), カード名英: String(r.name_en), 点数で見たマナ: r.cmc, パワー: r.power, タフネス: r.toughness, 忠誠度: r.loyalty, 色順: r.seq,
  }));
}

export function カードの件数(名: string): number {
  return Number(query(`select count(*) as n from mtb_card where name_en = $1`, [名])[0].n);
}

/** 名前の先頭が一致するカードの件数（印つきの名前を、取込前に数える用） */
export function 名前で始まるカードの件数(前: string): number {
  return Number(query(`select count(*) as n from mtb_card where name_en like $1`, [`${前}%`])[0].n);
}

export function カードの詳細(カードID: string): 取込後の詳細[] {
  return query(`select d.id, d.card_no, d.back_card_detail_id as back, d.foil_flg, d.frame_flg, d.power, d.toughness,
      s.name_en as cardset, r.name_en as rarity, i.name_en as illustrator, l.name_en as layout, p.name_en as promotion
    from mtb_card_detail d left join mtb_cardset s on s.id = d.cardset_id left join mtb_rarity r on r.id = d.rarity_id
      left join mtb_illustrator i on i.id = d.illustrator_id left join mtb_card_layout l on l.id = d.card_layout_id left join mtb_promotion p on p.id = d.promotion_id
    where d.card_id = $1 order by d.id`, [カードID]).map((r) => ({
    詳細ID: String(r.id), コレクターNo: r.card_no, 裏面詳細ID: r.back, Foil: r.foil_flg, フレーム: r.frame_flg === "1" ? "Special" : r.frame_flg === "0" ? "Normal" : r.frame_flg, パワー: r.power, タフネス: r.toughness,
    カードセット: r.cardset, レアリティ: r.rarity, イラストレーター: r.illustrator, レイアウト: r.layout, プロモ種別: r.promotion,
  }));
}

/** カード詳細IDを持つカードのID（無ければ null） */
export function 詳細IDのカードID(詳細ID: string | number): string | null {
  const r = query(`select card_id from mtb_card_detail where id = $1`, [詳細ID])[0];
  return r ? String(r.card_id) : null;
}

export function 詳細IDの詳細(詳細ID: string | number): 取込後の詳細 | null {
  const id = 詳細IDのカードID(詳細ID);
  return id ? (カードの詳細(id).find((d) => d.詳細ID === String(詳細ID)) ?? null) : null;
}

/** 分類（英語名）。種別: color / color_identity / cardtype / subtype / specialtype */
export function カードの分類英(カードID: string, 種別: "color" | "color_identity" | "cardtype" | "subtype" | "specialtype"): string[] {
  const sql = {
    color: `select m.name_en as n from dtb_card_color x join mtb_color m on m.id = x.color_id where x.card_id = $1 order by m.name_en`,
    color_identity: `select m.name_en as n from dtb_card_color_identity x join mtb_color m on m.id = x.color_id where x.card_id = $1 order by m.name_en`,
    cardtype: `select m.name_en as n from dtb_card_cardtype x join mtb_cardtype m on m.id = x.cardtype_id where x.card_id = $1 order by m.name_en`,
    subtype: `select m.name_en as n from dtb_card_subtype x join mtb_subtype m on m.id = x.subtype_id where x.card_id = $1 order by m.name_en`,
    specialtype: `select m.name_en as n from dtb_card_specialtype x join mtb_specialtype m on m.id = x.specialtype_id where x.card_id = $1 order by m.name_en`,
  }[種別];
  return query(sql, [カードID]).map((r) => String(r.n));
}

/** リーガリティ（フォーマットの英語名:制限の英語名）。Legal=使用可・Restriction=制限・Ban=禁止 */
export function カードのリーガリティ英(カードID: string): string[] {
  return query(`select f.name_en as f, r.name_en as r from dtb_card_format cf join mtb_format f on f.id = cf.format_id join mtb_restriction r on r.id = cf.restriction_id
    where cf.card_id = $1 order by f.name_en, r.name_en`, [カードID]).map((x) => `${x.f}:${x.r}`);
}

/** 画像（言語の日本語名:URL）。詳細IDで引く */
export function 詳細の画像URL(詳細ID: string | number): string[] {
  return query(`select l.name_jp as lang, i.url from mtb_card_image i left join mtb_language l on l.id = i.language_id where i.card_detail_id = $1 order by i.id`, [詳細ID])
    .map((x) => `${x.lang}:${x.url}`);
}

export function イラストレーターの件数(英語名: string): number {
  return Number(query(`select count(*) as n from mtb_illustrator where name_en = $1`, [英語名])[0].n);
}

/** マスターの有無（英語名で引く）。種別ごとの照会 */
export function マスターの件数(種別: "cardtype" | "color" | "subtype" | "specialtype" | "format" | "cardset" | "rarity" | "illustrator" | "layout" | "promotion", 英語名: string): number {
  const table = { cardtype: "mtb_cardtype", color: "mtb_color", subtype: "mtb_subtype", specialtype: "mtb_specialtype", format: "mtb_format", cardset: "mtb_cardset", rarity: "mtb_rarity", illustrator: "mtb_illustrator", layout: "mtb_card_layout", promotion: "mtb_promotion" }[種別];
  return Number(query(`select count(*) as n from ${table} where name_en = $1`, [英語名])[0].n);
}
