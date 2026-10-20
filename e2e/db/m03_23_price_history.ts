/**
 * 買取・販売価格履歴のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 * シードが作った状態（「…を持つ価格履歴はこのN件だけ」など）を、画面とは別に確かめるために使う。
 */
import { query } from "../lib/db";

/** 価格履歴の1件と、その商品規格・商品の公開状態と状態 */
export type 価格履歴の要約 = { 価格履歴ID: string; 商品規格ID: string; 商品コード: string; 公開状態: string; 状態: string };

const SELECT = `
  select ph.id as "価格履歴ID", pc.id as "商品規格ID", pc.product_code as "商品コード", ps.name as "公開状態", cc.code as "状態"
  from dtb_price_history ph
  join dtb_product_class pc on pc.id = ph.product_class_id
  join dtb_product p on p.id = pc.product_id
  left join mtb_product_status ps on ps.id = p.product_status_id
  left join mtb_card_condition cc on cc.id = pc.card_condition_id
  left join mtb_card_detail cd on cd.id = p.card_detail_id
  left join mtb_card c on c.id = cd.card_id`;

const toSummary = (r: Record<string, string | null>): 価格履歴の要約 => ({
  価格履歴ID: r.価格履歴ID ?? "", 商品規格ID: r.商品規格ID ?? "", 商品コード: r.商品コード ?? "", 公開状態: r.公開状態 ?? "", 状態: r.状態 ?? "",
});

/**
 * 画面の検索の対象の項目（商品名(日)・商品名(英)・商品コード・カード名(日)・カード名(英)・備考）のどれかに、語をそのまま含む価格履歴（価格履歴IDの順）。
 * 「%」「_」も文字として探す。公開状態・状態では絞らない。
 */
export function 語を持つ価格履歴(語: string): 価格履歴の要約[] {
  return query(`${SELECT}
    where strpos(coalesce(p.name, ''), $1) > 0 or strpos(coalesce(p.name_en, ''), $1) > 0
       or strpos(coalesce(pc.product_code, ''), $1) > 0 or strpos(coalesce(c.name_jp, ''), $1) > 0
       or strpos(coalesce(c.name_en, ''), $1) > 0 or strpos(coalesce(p.note, ''), $1) > 0
    order by ph.id`, [語]).map(toSummary);
}

/** 商品規格の価格履歴（価格履歴IDの順） */
export function 商品規格の価格履歴(商品規格ID: string): 価格履歴の要約[] {
  return query(`${SELECT} where pc.id = $1 order by ph.id`, [商品規格ID]).map(toSummary);
}
