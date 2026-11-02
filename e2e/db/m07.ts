/** M07（ネット買取管理）のDB確認・参照の照会。物理名はここの SQL にだけ書く（参照だけ） */
import { query } from "../lib/db";

/** ネット買取の商品として使える商品IDの候補（買取価格500円以上・公開中・在庫の記録あり）。新しいものから */
export function 買取できる商品の候補(件数: number): string[] {
  return query(
    `select p.id as id from dtb_product p
       join dtb_product_class pc on pc.product_id = p.id
       join mtb_card_condition cc on cc.id = pc.card_condition_id and cc.code = 'NM'
       join dtb_product_stock ps on ps.product_class_id = pc.id
      where p.product_status_id = 1 and pc.buy_price >= 500 and pc.visible = true and pc.high_price_code is null and pc.language_id is not null
      group by p.id order by p.id desc limit ${Math.floor(件数)}`,
  ).map((r) => r.id as string);
}

/** 買取番号（数字）の買取情報があるか */
export function 買取情報の件数(買取番号: string): number {
  return Number(query("select count(*) as n from dtb_buy_order where id = $1", [数字の番号(買取番号)])[0].n);
}

/** 買取番号の棚戻し済みフラグ（真なら棚戻し済み） */
export function 棚戻し済みか(買取番号: string): boolean | null {
  const r = query("select restocked_flg as v from dtb_buy_order where id = $1", [数字の番号(買取番号)])[0];
  if (!r) return null;
  return r.v === "true" || r.v === "1";
}

function 数字の番号(s: string): string {
  if (!/^\d+$/.test(s)) throw new Error(`買取番号が数字でない（${s}）`);
  return String(Number(s));
}

/** 商品コード（規格の商品コード）から商品ID。無ければ null */
export function 商品IDをコードから(コード: string): string | null {
  const r = query("select pc.product_id as id from dtb_product_class pc where pc.product_code = $1 order by pc.id desc limit 1", [コード])[0];
  return r ? (r.id as string) : null;
}

/** 買取番号（数字）の買取状況の名前 */
export function 買取状況の名前(買取番号: string): string | null {
  const r = query("select s.name as v from dtb_buy_order b join mtb_buy_order_status s on s.id = b.buy_order_status_id where b.id = $1", [数字の番号(買取番号)])[0];
  return r ? (r.v as string) : null;
}

/** 商品コードの規格の在庫の合計（本店・全在庫場所の合計。参照だけ） */
export function 在庫数量(コード: string): number | null {
  const r = query(
    "select sum(ps.stock) as n from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id where pc.product_code = $1",
    [コード],
  )[0];
  return r && r.n !== null ? Number(r.n) : null;
}

/** 本店の高額商品閾値1〜3（未設定は ""。参照だけ） */
export function 高額商品閾値(): [string, string, string] {
  const r = query("select expensive_threshold1 as a, expensive_threshold2 as b, expensive_threshold3 as c from dtb_base_info where id = 1")[0];
  const f = (v: string | null | undefined) => (v === null || v === undefined ? "" : String(Number(v)));
  return r ? [f(r.a), f(r.b), f(r.c)] : ["", "", ""];
}

/** 棚番号の件数（名称で。参照だけ） */
export function 棚番号の件数(名称: string): number {
  return Number(query("select count(*) as n from dtb_shelf_number where name = $1", [名称])[0].n);
}

/** 棚番号の並び順で、まだ使われていない次の値（最大＋1） */
export function 次の棚並び順(): number {
  return Number(query("select coalesce(max(sort_no), 0) + 1 as n from dtb_shelf_number")[0].n);
}
