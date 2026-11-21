/**
 * B16-09 サイトマップ生成処理（2回目に書いたケース）の DB の参照（読むだけ）。物理名はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";

const 文字 = (s: string) => `'${s.replace(/'/g, "''")}'`;

/** 買取商品のサイトマップに載る条件の商品の件数（公開・規格が NM・高額買取のコードなし・買取価格あり・規格も公開・予約の販売グループでない） */
export function 買取の対象の商品の数(): number {
  return Number(query(`select count(distinct p.id)::text as n from dtb_product p join dtb_product_class pc on pc.product_id = p.id
    left join mtb_sell_group sg on sg.id = p.sell_group_id
    where p.product_status_id = 1 and pc.card_condition_id = 1 and pc.high_price_code is null and pc.buy_price > 0
      and pc.product_status_id = 1 and coalesce(sg.reservation_flg, 0) = 0`)[0]?.n ?? "0");
}

/** デッキ詳細のサイトマップに載る条件のデッキの件数（公開・ユーザー作成以外・採用カードを非公開にしていない・削除されていない） */
export function デッキ詳細の対象の数(): number {
  return Number(query(`select count(*)::text as n from dtb_deck where disp_id = 1 and deck_type_id <> 2 and not private_flg and deleted_at is null`)[0]?.n ?? "0");
}

/** カテゴリの件数 */
export function カテゴリの数(): number {
  return Number(query(`select count(*)::text as n from dtb_category`)[0]?.n ?? "0");
}

/** 商品名（日本語）が一致する商品の ID（E2E が実行の印つきで作った商品。1件でなければ投げる） */
export function 商品IDを名前で読む(商品名: string): string {
  const r = query(`select id::text as id from dtb_product where name = ${文字(商品名)} order by id`);
  if (r.length !== 1) throw new Error(`商品名「${商品名}」の商品が ${r.length} 件`);
  return String(r[0].id);
}

/** デッキ名が一致するデッキの ID（削除済みを含む。1件でなければ投げる） */
export function デッキIDを名前で読む(デッキ名: string): string {
  const r = query(`select id::text as id from dtb_deck where deck_name = ${文字(デッキ名)} order by id`);
  if (r.length !== 1) throw new Error(`デッキ名「${デッキ名}」のデッキが ${r.length} 件`);
  return String(r[0].id);
}

/** フォーマット名（日本語）が一致するフォーマットの ID（1件でなければ投げる） */
export function フォーマットIDを名前で読む(名: string): string {
  const r = query(`select id::text as id from mtb_format where name_jp = ${文字(名)} order by id`);
  if (r.length !== 1) throw new Error(`フォーマット名「${名}」のフォーマットが ${r.length} 件`);
  return String(r[0].id);
}

/** 店舗のコード（フロントの URL の店舗の部分） */
export function 店舗コードを読む(店舗ID: string): string {
  const r = query(`select coalesce(html_class_name, '') as c from dtb_base_info where id = ${Number(店舗ID)}`);
  if (!r[0]?.c) throw new Error(`店舗ID ${店舗ID} の店舗コードが読めない`);
  return r[0].c;
}

/** 公開中の商品の ID を1つ（商品詳細ページを開くため。ほかの方の商品は読むだけ） */
export function 公開中の商品を1つ(): string {
  const r = query(`select id::text as id from dtb_product where product_status_id = 1 order by id desc limit 1`);
  if (!r[0]) throw new Error("公開中の商品が無い");
  return String(r[0].id);
}
