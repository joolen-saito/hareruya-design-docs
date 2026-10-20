/**
 * M04-19 欠品履歴検索一覧の、実行後の残りの確かめ（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 * ケースの期待結果の確かめには使わない（どのケースも実行区分は「ブラウザのみ」）。記録に「DBに残ったデータ」を書くための照会と、
 * シード S-M04-19-ABSENT-018 の「DBで確認する」（参照だけ。削除はしない）の照会。
 */
import { query, Row } from "../lib/db";

/** 商品コードが語で始まる商品規格ごとに、商品ID・商品コード・在庫変動履歴の数・欠品の在庫変動履歴（欠品減算(受注)・欠品減算(移動)）の数 */
export function 試験商品の残り(語の並び: string[]): Row[] {
  const out: Row[] = [];
  for (const 語 of 語の並び) {
    out.push(...query(
      `select pc.product_id as 商品ID, pc.product_code as 商品コード,
              (select count(*) from dtb_stock_history h join dtb_product_stock s on s.id = h.product_stock_id
                where s.product_class_id = pc.id) as 履歴,
              (select count(*) from dtb_stock_history h join dtb_product_stock s on s.id = h.product_stock_id
                where s.product_class_id = pc.id and h.stock_change_type_detail_id in (19, 21)) as 欠品の履歴
         from dtb_product_class pc
        where pc.product_code like $1 || '%'
        order by pc.product_code`, [語]));
  }
  return out;
}

/** カテゴリIDごとの名称と親カテゴリID（グッズ商品CSVが受け付けるカテゴリを調べるため） */
export function カテゴリ(ids: string[]): Row[] {
  return query(
    `select id as カテゴリID, category_name as 名称, parent_category_id as 親
       from dtb_category where id = any(string_to_array($1, ',')::int[]) order by id`, [ids.join(",")]);
}

/** 表示件数マスタの行（ID・名称・並び順） */
export function 表示件数マスタ(): Row[] {
  return query("select id as ID, name as 名称, sort_no as 並び順 from mtb_page_max order by sort_no, id");
}

/** ログインIDのメンバー（メンバーID・名前・ログインID） */
export function メンバー(ログインIDの並び: string[]): Row[] {
  return query(
    `select id as メンバーID, name as 名前, login_id as ログインID
       from dtb_member where login_id = any(string_to_array($1, ',')) order by id`, [ログインIDの並び.join(",")]);
}

/** 店名の店舗（店舗ID・店名） */
export function 店舗(店名: string): Row[] {
  return query("select id as 店舗ID, shop_name as 店名 from dtb_base_info where shop_name = $1 order by id", [店名]);
}

/**
 * 商品名(日)・商品名(英)・カード名(日/英)・商品コードのいずれかに語を含む商品の、欠品の在庫変動履歴（欠品減算(受注)・欠品減算(移動)）の数。
 * 大文字と小文字を区別せずに数える（シードの「0件」の確かめを、画面の検索より広く取るため）。
 */
export function 語を含む欠品履歴の数(語: string): number {
  return Number(query(
    `select count(*) as n
       from dtb_stock_history h
       join dtb_product_stock s on s.id = h.product_stock_id
       join dtb_product_class pc on pc.id = s.product_class_id
       join dtb_product p on p.id = pc.product_id
       left join mtb_card_detail cd on cd.id = p.card_detail_id
       left join mtb_card ca on ca.id = cd.card_id
      where h.stock_change_type_detail_id in (19, 21)
        and (strpos(lower(coalesce(p.name, '')), lower($1)) > 0
          or strpos(lower(coalesce(p.name_en, '')), lower($1)) > 0
          or strpos(lower(coalesce(pc.product_code, '')), lower($1)) > 0
          or strpos(lower(coalesce(ca.name_jp, '')), lower($1)) > 0
          or strpos(lower(coalesce(ca.name_en, '')), lower($1)) > 0)`, [語])[0].n);
}
