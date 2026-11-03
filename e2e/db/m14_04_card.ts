/** M14-04 カード詳細(登録・編集・削除)のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type カードの値 = {
  カードID: string; カード名日: string | null; カード名英: string; アリーナ名日: string | null; アリーナ名英: string | null;
  ルールテキスト日: string | null; ルールテキスト英: string | null; マナ・コスト: string | null; 点数で見たマナ: string | null;
  パワー: string | null; タフネス: string | null; 忠誠度: string | null; 色順: string | null; ステッカー: boolean;
};

export function カードの値(カードID: string | number): カードの値 | null {
  const r = query(`select c.id, c.name_jp, c.name_en, c.arena_format_name_jp as a_jp, c.arena_format_name_en as a_en, c.text_jp, c.text_en,
      c.mana_cost, c.cmc, c.power, c.toughness, c.loyalty, s.name as seq, c.is_sticker
    from mtb_card c left join mtb_color_sequence s on s.id = c.color_sequence_id where c.id = $1`, [カードID])[0];
  if (!r) return null;
  return {
    カードID: String(r.id), カード名日: r.name_jp, カード名英: String(r.name_en), アリーナ名日: r.a_jp, アリーナ名英: r.a_en, ルールテキスト日: r.text_jp, ルールテキスト英: r.text_en,
    マナ・コスト: r.mana_cost, 点数で見たマナ: r.cmc, パワー: r.power, タフネス: r.toughness, 忠誠度: r.loyalty, 色順: r.seq, ステッカー: r.is_sticker === "true",
  };
}

/** カード名(英)が一致するカードのID（古い順） */
export function カード名英でカードID(名: string): string[] {
  return query(`select id from mtb_card where name_en = $1 order by id`, [名]).map((r) => String(r.id));
}

/** カード詳細IDを持つカードのID（無ければ null） */
export function 詳細IDのカードID(詳細ID: string | number): string | null {
  const r = query(`select card_id from mtb_card_detail where id = $1`, [詳細ID])[0];
  return r ? String(r.card_id) : null;
}

export type 詳細の値 = {
  詳細ID: string; コレクターNo: string | null; 裏面詳細ID: string | null; ルールテキスト日: string | null; ルールテキスト英: string | null;
  フレーバー日: string | null; フレーバー英: string | null; パワー: string | null; タフネス: string | null; Foil: string | null; フレーム: string | null;
  イラストレーター: string | null; カードセット: string | null; レアリティ: string | null; レイアウト: string | null; プロモ種別: string | null;
};

export function カードの詳細(カードID: string | number): 詳細の値[] {
  return query(`select d.id, d.card_no, d.back_card_detail_id as back, d.text_jp, d.text_en, d.flavor_jp, d.flavor_en, d.power, d.toughness, d.foil_flg, d.frame_flg,
      i.name_en as illustrator, s.name_jp as cardset, r.name_jp as rarity, l.name_jp as layout, p.name_jp as promotion
    from mtb_card_detail d left join mtb_illustrator i on i.id = d.illustrator_id left join mtb_cardset s on s.id = d.cardset_id
      left join mtb_rarity r on r.id = d.rarity_id left join mtb_card_layout l on l.id = d.card_layout_id left join mtb_promotion p on p.id = d.promotion_id
    where d.card_id = $1 order by d.id`, [カードID]).map((r) => ({
    詳細ID: String(r.id), コレクターNo: r.card_no, 裏面詳細ID: r.back, ルールテキスト日: r.text_jp, ルールテキスト英: r.text_en, フレーバー日: r.flavor_jp, フレーバー英: r.flavor_en,
    パワー: r.power, タフネス: r.toughness, Foil: r.foil_flg, フレーム: r.frame_flg, イラストレーター: r.illustrator, カードセット: r.cardset, レアリティ: r.rarity, レイアウト: r.layout, プロモ種別: r.promotion,
  }));
}

export function 詳細の件数(詳細ID: string | number): number {
  return Number(query(`select count(*) as n from mtb_card_detail where id = $1`, [詳細ID])[0].n);
}

export type 画像の値 = { 画像ID: string; 詳細ID: string; URL: string | null; 言語: string | null; 裏面: boolean };
export function 詳細の画像(詳細ID: string | number): 画像の値[] {
  return query(`select i.id, i.card_detail_id as d, i.url, l.name_jp as lang, i.back_flg from mtb_card_image i left join mtb_language l on l.id = i.language_id where i.card_detail_id = $1 order by i.id`, [詳細ID])
    .map((r) => ({ 画像ID: String(r.id), 詳細ID: String(r.d), URL: r.url, 言語: r.lang, 裏面: r.back_flg === "true" }));
}
export function 画像の件数(画像ID: string | number): number {
  return Number(query(`select count(*) as n from mtb_card_image where id = $1`, [画像ID])[0].n);
}

export type リーガリティの値 = { リーガリティID: string; フォーマット: string; リーガリティ: string };
export function カードのリーガリティ(カードID: string | number): リーガリティの値[] {
  return query(`select cf.id, f.name_jp as format, r.name_jp as restriction from dtb_card_format cf join mtb_format f on f.id = cf.format_id join mtb_restriction r on r.id = cf.restriction_id
    where cf.card_id = $1 order by cf.id`, [カードID]).map((r) => ({ リーガリティID: String(r.id), フォーマット: String(r.format), リーガリティ: String(r.restriction) }));
}

/** カードに紐づく分類の日本語名（種別: color / color_identity / cardtype / subtype / specialtype） */
export function カードの分類(カードID: string | number, 種別: "color" | "color_identity" | "cardtype" | "subtype" | "specialtype"): string[] {
  const sql = {
    color: `select m.name_jp from dtb_card_color x join mtb_color m on m.id = x.color_id where x.card_id = $1 order by m.name_jp`,
    color_identity: `select m.name_jp from dtb_card_color_identity x join mtb_color m on m.id = x.color_id where x.card_id = $1 order by m.name_jp`,
    cardtype: `select m.name_jp from dtb_card_cardtype x join mtb_cardtype m on m.id = x.cardtype_id where x.card_id = $1 order by m.name_jp`,
    subtype: `select m.name_jp from dtb_card_subtype x join mtb_subtype m on m.id = x.subtype_id where x.card_id = $1 order by m.name_jp`,
    specialtype: `select m.name_jp from dtb_card_specialtype x join mtb_specialtype m on m.id = x.specialtype_id where x.card_id = $1 order by m.name_jp`,
  }[種別];
  return query(sql, [カードID]).map((r) => String(r.name_jp));
}

/** カードセットの英語名（日本語名で引く。CSV取込は英語名で引くため） */
export function カードセットの英語名(日本語名: string): string | null { return query(`select name_en from mtb_cardset where name_jp = $1 order by id limit 1`, [日本語名])[0]?.name_en ?? null; }
export function レアリティの英語名(日本語名: string): string | null { return query(`select name_en from mtb_rarity where name_jp = $1 order by id limit 1`, [日本語名])[0]?.name_en ?? null; }
export function レイアウトの英語名(日本語名: string): string | null { return query(`select name_en from mtb_card_layout where name_jp = $1 order by id limit 1`, [日本語名])[0]?.name_en ?? null; }
export function プロモの英語名(日本語名: string): string | null { return query(`select name_en from mtb_promotion where name_jp = $1 order by id limit 1`, [日本語名])[0]?.name_en ?? null; }
export function フォーマットの英語名(日本語名: string): string | null { return query(`select name_en from mtb_format where name_jp = $1 and deleted_at is null order by id limit 1`, [日本語名])[0]?.name_en ?? null; }

/** カードの持つ詳細の件数・画像の件数（削除の確かめ用） */
export function カードの件数(カードID: string | number): number { return Number(query(`select count(*) as n from mtb_card where id = $1`, [カードID])[0].n); }

export function カードセットのコード(日本語名: string): string | null { return query(`select code from mtb_cardset where name_jp = $1 order by id limit 1`, [日本語名])[0]?.code ?? null; }
