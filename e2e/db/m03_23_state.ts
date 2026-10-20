/**
 * M03-23 の環境の状態のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 * 流す前の環境の状態（商品・価格履歴・カードセット・カードの件数）と、シードが残したデータ（カードセット・カード）を、
 * 決められた経路（lib/db.ts の query）で読むために使う。
 */
import { count, query } from "../lib/db";

/** 商品・商品規格・価格履歴・カードセット・カードの件数 */
export type 件数の要約 = { 商品: number; 商品規格: number; 価格履歴: number; カードセット: number; カード: number };

export function 件数の要約(): 件数の要約 {
  return {
    商品: count("select id from dtb_product"),
    商品規格: count("select id from dtb_product_class"),
    価格履歴: count("select id from dtb_price_history"),
    カードセット: count("select id from mtb_cardset"),
    カード: count("select id from mtb_card"),
  };
}

/** セット名(日)が一致するカードセット（カードセットIDの順） */
export type 保存されたカードセット = { カードセットID: string; セット名英: string; セットコード: string | null };

export function 名称のカードセット(セット名日: string): 保存されたカードセット[] {
  return query(`select id as "カードセットID", name_en as "セット名英", code as "セットコード"
    from mtb_cardset where name_jp = $1 order by id`, [セット名日])
    .map((r) => ({ カードセットID: r.カードセットID ?? "", セット名英: r.セット名英 ?? "", セットコード: r.セットコード }));
}

/** カード名(日)が一致するカードと、その詳細情報のカードセット（カードID・カード詳細IDの順） */
export type 保存されたカード = { カードID: string; カード名英: string; カード詳細ID: string | null; カードセットID: string | null };

export function 名称のカード(カード名日: string): 保存されたカード[] {
  return query(`select c.id as "カードID", c.name_en as "カード名英", cd.id as "カード詳細ID", cd.cardset_id as "カードセットID"
    from mtb_card c left join mtb_card_detail cd on cd.card_id = c.id
    where c.name_jp = $1 order by c.id, cd.id`, [カード名日])
    .map((r) => ({ カードID: r.カードID ?? "", カード名英: r.カード名英 ?? "", カード詳細ID: r.カード詳細ID, カードセットID: r.カードセットID }));
}

/**
 * 商品コードが一致する商品規格の価格履歴ごとに、その商品に付いたカードの詳細情報のカードセット・商品規格の言語・変更後の価格（価格履歴IDの順）。
 * 画面の検索は、エキスパンションを商品に付いたカードの詳細情報のカードセットで、言語を商品規格の言語で絞る。
 * シード表の状態・属性（「…=履歴セットAlpha」「言語は日本語」「変更後価格あり」など）を、シードが作ったあとに確かめるために使う。
 */
export type 価格履歴の属性 = {
  価格履歴ID: string; 商品規格ID: string; カードセットID: string | null; カードセット名: string | null; 言語: string | null;
  変更後基準価格: string | null; 変更後販売価格: string | null; 変更後買取価格: string | null;
};

export function 商品コードの価格履歴の属性(商品コード: string): 価格履歴の属性[] {
  return query(`select ph.id as "価格履歴ID", pc.id as "商品規格ID", cd.cardset_id as "カードセットID", cs.name_jp as "カードセット名",
      l.name_jp as "言語", ph.standard_price as "変更後基準価格", ph.sell_price as "変更後販売価格", ph.buy_price as "変更後買取価格"
    from dtb_price_history ph
    join dtb_product_class pc on pc.id = ph.product_class_id
    join dtb_product p on p.id = pc.product_id
    left join mtb_card_detail cd on cd.id = p.card_detail_id
    left join mtb_cardset cs on cs.id = cd.cardset_id
    left join mtb_language l on l.id = pc.language_id
    where pc.product_code = $1 order by ph.id`, [商品コード])
    .map((r) => ({
      価格履歴ID: r.価格履歴ID ?? "", 商品規格ID: r.商品規格ID ?? "", カードセットID: r.カードセットID, カードセット名: r.カードセット名, 言語: r.言語,
      変更後基準価格: r.変更後基準価格, 変更後販売価格: r.変更後販売価格, 変更後買取価格: r.変更後買取価格,
    }));
}

/** 商品コードが一致する商品規格の件数 */
export function 商品コードの商品規格の件数(商品コード: string): number {
  return count("select id from dtb_product_class where product_code = $1", [商品コード]);
}

/** カードIDのカードが付いている商品の件数 */
export function カードが付いた商品の件数(カードID: string): number {
  return count(`select p.id from dtb_product p join mtb_card_detail cd on cd.id = p.card_detail_id where cd.card_id = $1`, [カードID]);
}

/**
 * 画面の検索の対象の項目（商品名(日)・商品名(英)・商品コード・カード名(日)・カード名(英)・備考）のどれかに語をそのまま含む価格履歴の件数を、
 * 商品の公開状態と商品規格の状態ごとに数える（大文字と小文字を区別する。画面の検索と同じ）。
 * 既存のデータが多い環境で、シード表の「…を持つ価格履歴はこのN件だけ」が崩れていないかを、行を全部読まずに確かめるために使う。
 */
export type 公開状態と状態ごとの件数 = { 公開状態: string; 状態: string; 件数: number };

export function 語を持つ価格履歴の件数(語: string): 公開状態と状態ごとの件数[] {
  return query(`select coalesce(ps.name, '') as "公開状態", coalesce(cc.code, '') as "状態", count(*) as "件数"
    from dtb_price_history ph
    join dtb_product_class pc on pc.id = ph.product_class_id
    join dtb_product p on p.id = pc.product_id
    left join mtb_product_status ps on ps.id = p.product_status_id
    left join mtb_card_condition cc on cc.id = pc.card_condition_id
    left join mtb_card_detail cd on cd.id = p.card_detail_id
    left join mtb_card c on c.id = cd.card_id
    where strpos(coalesce(p.name, ''), $1) > 0 or strpos(coalesce(p.name_en, ''), $1) > 0
       or strpos(coalesce(pc.product_code, ''), $1) > 0 or strpos(coalesce(c.name_jp, ''), $1) > 0
       or strpos(coalesce(c.name_en, ''), $1) > 0 or strpos(coalesce(p.note, ''), $1) > 0
    group by 1, 2 order by 1, 2`, [語])
    .map((r) => ({ 公開状態: r.公開状態 ?? "", 状態: r.状態 ?? "", 件数: Number(r.件数) }));
}
