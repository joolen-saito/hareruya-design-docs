/**
 * M03-26 カード商品CSV登録の続き（-b）の DB 確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 * - 使えるカード詳細を選ぶ（開発環境に既にある、商品が付いていないカード詳細。カードのマスタは新しく作らない）
 * - 取り込んだ商品・規格・カテゴリ・タグ・価格履歴・在庫・取込履歴を読む
 */
import { query } from "../lib/db";

/**
 * 商品の付いていないカード詳細を n 件選ぶ（新しい商品コードが既存の規格の商品コードと重ならないもの）。
 * 取込は「プロモの略称＋カードセットの略称＋Foil の印＋カード番号（5桁）＋言語＋状態」で商品コードを作り、同じコードの規格があると行を飛ばす。
 * そのため、プロモの指定が無く、カードセットの略称とカード番号があり、同じ先頭（言語 JP）の商品コードが無いカード詳細だけを選ぶ。
 * ほかの回と同じものを選ばないよう、選ぶ位置を ずらし（0〜）でずらし、除くもの（この回で選んだもの）を外す。
 */
export function 商品の無いカード詳細(n: number, ずらし: number, 除く: string[]): string[] {
  const rows = query(
    `select d.id from mtb_card_detail d
       join mtb_cardset s on s.id = d.cardset_id
      where d.promotion_id is null and coalesce(d.card_no, '') <> '' and coalesce(s.code, '') <> ''
        and not exists (select 1 from dtb_product p where p.card_detail_id = d.id)
        and not exists (select 1 from dtb_product_class pc
                         where pc.product_code like s.code || (case when d.foil_flg = 1 then 'F' else '' end) || lpad(d.card_no, 5, '0') || 'JP%')
        and not (d.id::text = any($3::text[]))
      order by d.id desc
      offset $1 limit $2`,
    [ずらし, n, `{${除く.join(",")}}`],
  );
  return rows.map((r) => String(r.id));
}

/** カード詳細にカードが付いているか（カード名(英)） */
export function カード名の(カード詳細ID: string): string {
  const r = query(`select c.name_en from mtb_card_detail d join mtb_card c on c.id = d.card_id where d.id = $1`, [カード詳細ID]);
  return r.length ? String(r[0].name_en ?? "") : "";
}

/** 番号の項目（言語・カテゴリ・割引率・買取減額率・略称タグ・売上分析タグ・タグ）と購入グループの名称が、マスタに無いことを確かめる */
export function マスタに無いか(番号: string, 購入グループ名称: string): Record<string, boolean> {
  const r = query(
    `select
       not exists (select 1 from mtb_language where id = $1::int) as "言語",
       not exists (select 1 from dtb_category where id = $1::int) as "商品カテゴリ",
       not exists (select 1 from mtb_discount where id = $1::int) as "割引率",
       not exists (select 1 from mtb_buy_discount where id = $1::int) as "買取減額率",
       not exists (select 1 from mtb_storage_code where id = $1::int) as "略称タグ",
       not exists (select 1 from mtb_tag_sales_analysis where id = $1::int) as "売上分析タグ",
       not exists (select 1 from dtb_tag where id = $1::int) as "タグ",
       not exists (select 1 from mtb_sell_group where name = $2) as "購入グループ"`,
    [番号, 購入グループ名称],
  )[0];
  return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v) === "true" || String(v) === "t"]));
}

/** カード詳細が登録されていないか */
export function カード詳細が無いか(カード詳細ID: string): boolean {
  return query(`select 1 from mtb_card_detail where id = $1::int`, [カード詳細ID]).length === 0;
}

/** 商品が登録されていないか */
export function 商品が無いか(商品ID: string): boolean {
  return query(`select 1 from dtb_product where id = $1::int`, [商品ID]).length === 0;
}

export type 商品の行 = {
  商品ID: string; 商品名日: string; 商品名英: string; 商品公開ステータス: number; 支店の商品公開ステータス: number;
  サイズ: string | null; 重量: string | null; 購入グループ: string | null; 割引率: string | null; 買取減額率: string | null;
  略称タグ: string | null; 地域別販売制限: string | null; 商品説明日: string | null; 商品説明英: string | null;
  買取商品説明日: string | null; 買取商品説明英: string | null; 検索ワード: string | null; フリーエリア: string | null;
};

/** カード詳細の商品（作成順） */
export function カード詳細の商品(カード詳細ID: string): 商品の行[] {
  return query(
    `select p.id, p.name, p.name_en, p.product_status_id, p.is_branch_published, p.size, p.weight,
            g.name as sell_group, p.discount_id, p.buy_discount_id, p.storage_code_id, p.region_restriction_id,
            p.description_detail_jp, p.description_detail_en, p.buy_description_detail, p.buy_description_detail_en, p.search_word, p.free_area
       from dtb_product p left join mtb_sell_group g on g.id = p.sell_group_id
      where p.card_detail_id = $1::int order by p.id`,
    [カード詳細ID],
  ).map((r) => ({
    商品ID: String(r.id), 商品名日: String(r.name ?? ""), 商品名英: String(r.name_en ?? ""),
    商品公開ステータス: Number(r.product_status_id), 支店の商品公開ステータス: Number(r.is_branch_published),
    サイズ: r.size === null ? null : String(r.size), 重量: r.weight === null ? null : String(r.weight),
    購入グループ: r.sell_group === null ? null : String(r.sell_group), 割引率: r.discount_id === null ? null : String(r.discount_id),
    買取減額率: r.buy_discount_id === null ? null : String(r.buy_discount_id), 略称タグ: r.storage_code_id === null ? null : String(r.storage_code_id),
    地域別販売制限: r.region_restriction_id === null ? null : String(r.region_restriction_id),
    商品説明日: r.description_detail_jp ?? null, 商品説明英: r.description_detail_en ?? null,
    買取商品説明日: r.buy_description_detail ?? null, 買取商品説明英: r.buy_description_detail_en ?? null,
    検索ワード: r.search_word ?? null, フリーエリア: r.free_area ?? null,
  }));
}

export type 規格の行 = {
  規格ID: string; 言語: string; 状態: string; 基準価格: number; 販売価格: number; 買取価格: number; セール: boolean; 販売制限数: string | null;
};

/** 商品の規格 */
export function 商品の規格(商品ID: string): 規格の行[] {
  return query(
    `select pc.id, pc.language_id, c.code as cond, pc.standard_price, pc.price02, pc.buy_price, pc.sale_flg, pc.sale_limit
       from dtb_product_class pc left join mtb_card_condition c on c.id = pc.card_condition_id
      where pc.product_id = $1::int order by pc.id`,
    [商品ID],
  ).map((r) => ({
    規格ID: String(r.id), 言語: String(r.language_id ?? ""), 状態: String(r.cond ?? ""), 基準価格: Number(r.standard_price),
    販売価格: Number(r.price02), 買取価格: Number(r.buy_price), セール: String(r.sale_flg) === "true" || String(r.sale_flg) === "t",
    販売制限数: r.sale_limit === null ? null : String(r.sale_limit),
  }));
}

/** 商品のカテゴリ（番号の昇順） */
export function 商品のカテゴリ(商品ID: string): string[] {
  return query(`select category_id from dtb_product_category where product_id = $1::int order by category_id`, [商品ID]).map((r) => String(r.category_id));
}

/** 指定したカテゴリとその祖先（番号の昇順）。取込は指定したカテゴリの祖先も商品に付ける */
export function カテゴリと祖先(カテゴリ: string[]): string[] {
  return query(
    `with recursive a(id, p) as (
       select id, parent_category_id from dtb_category where id = any($1::int[])
       union select c.id, c.parent_category_id from dtb_category c join a on c.id = a.p)
     select distinct id from a order by id`,
    [`{${カテゴリ.join(",")}}`],
  ).map((r) => String(r.id));
}

/** 商品のタグ・売上分析タグ（番号の昇順） */
export function 商品のタグ(商品ID: string): { タグ: string[]; 売上分析タグ: string[] } {
  const t = query(`select tag_id from dtb_product_tag where product_id = $1::int order by tag_id`, [商品ID]).map((r) => String(r.tag_id));
  const s = query(`select tag_sales_analysis_id from dtb_product_tag_sales_analysis where product_id = $1::int order by 1`, [商品ID]).map((r) => String(r.tag_sales_analysis_id));
  return { タグ: t, 売上分析タグ: s };
}

/** 商品の規格の画像の件数 */
export function 規格画像の件数(商品ID: string): number {
  return Number(query(`select count(*) n from dtb_product_class_image i join dtb_product_class pc on pc.id = i.product_class_id where pc.product_id = $1::int`, [商品ID])[0].n);
}

/** 規格の価格履歴（作成順） */
export function 規格の価格履歴(規格ID: string): { 販売価格: number; 買取価格: number; 基準価格: number | null }[] {
  return query(`select sell_price, buy_price, standard_price from dtb_price_history where product_class_id = $1::int order by id`, [規格ID])
    .map((r) => ({ 販売価格: Number(r.sell_price), 買取価格: Number(r.buy_price), 基準価格: r.standard_price === null ? null : Number(r.standard_price) }));
}

/** 規格の在庫（店舗の数・在庫場所の数・行の数・数量0でない行の数） */
export function 規格の在庫(規格ID: string): { 店舗: number; 在庫場所: number; 行: number; 数量0でない: number } {
  const r = query(
    `select count(distinct base_info_id) s, count(distinct stock_location_id) l, count(*) n, count(*) filter (where stock <> 0) nz
       from dtb_product_stock where product_class_id = $1::int`,
    [規格ID],
  )[0];
  return { 店舗: Number(r.s), 在庫場所: Number(r.l), 行: Number(r.n), 数量0でない: Number(r.nz) };
}

/** 比べる相手: ほかの商品の規格の在庫が持つ店舗の数・在庫場所の数（直近に作られた、在庫の行がある規格） */
export function 在庫の店舗と在庫場所の数(除く規格ID: string[]): { 店舗: number; 在庫場所: number } {
  const r = query(
    `select count(distinct ps.base_info_id) s, count(distinct ps.stock_location_id) l from dtb_product_stock ps
      where ps.product_class_id = (select max(product_class_id) from dtb_product_stock where not (product_class_id::text = any($1::text[])))`,
    [`{${除く規格ID.join(",")}}`],
  )[0];
  return { 店舗: Number(r.s), 在庫場所: Number(r.l) };
}

/** カード商品CSVの取込履歴の件数（ファイル名を指定すればそのファイル名だけ） */
export function カード商品CSVの取込履歴(ファイル名?: string): number {
  const base = `select count(*) n from dtb_csv_import_history h join mtb_csv_import_type t on t.id = h.csv_import_type_id where t.name = 'カード商品登録'`;
  return Number((ファイル名 ? query(`${base} and h.file_name = $1`, [ファイル名]) : query(base))[0].n);
}

/** 商品名(日)がちょうど一致する商品の数 */
export function 商品名の商品数(商品名: string): number {
  return Number(query(`select count(*) n from dtb_product where name = $1`, [商品名])[0].n);
}

/** S-M03-26-MASTER の決め打ちの番号のマスタが開発環境にあるか（項目ごとに true/false） */
export function 正本のマスタがあるか(): Record<string, boolean> {
  const r = query(
    `select
       exists (select 1 from mtb_language where id = 1) as "言語1",
       (select count(*) from dtb_category where id in (1, 177, 178)) = 3 as "商品カテゴリ1・177・178",
       exists (select 1 from mtb_sell_group where name = '通常商品') as "購入グループ通常商品",
       exists (select 1 from mtb_discount where id = 5) as "割引率5",
       exists (select 1 from mtb_buy_discount where id = 1) as "買取減額率1",
       exists (select 1 from mtb_storage_code where id = 2448) as "略称タグ2448",
       (select count(*) from mtb_tag_sales_analysis where id in (28, 29)) = 2 as "売上分析タグ28・29",
       (select count(*) from dtb_tag where id in (2, 3)) = 2 as "タグ2・3"`,
  )[0];
  return Object.fromEntries(Object.entries(r).map(([k, v]) => [k, String(v) === "true" || String(v) === "t"]));
}
