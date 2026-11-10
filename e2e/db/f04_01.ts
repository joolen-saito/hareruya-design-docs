/**
 * F04-01 買い物かごの DB 確認・書き足し。物理名はこのファイルの SQL の中にだけ書く。
 * 書き足しは lib/db_write.ts を通す（E2E が作った行だけ。依頼者決定 2026-11-10）。持ち主の確かめは、実行の印つきの商品コード。
 */
import { query } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";

/** 商品の商品規格（グッズ商品CSVで作る商品は1件） */
export function 商品の商品規格ID(商品ID: string): string {
  const r = query(`select id from dtb_product_class where product_id = $1 order by id`, [商品ID]);
  if (r.length !== 1) throw new Error(`商品ID ${商品ID} の商品規格が ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}

/** 商品規格の、指定の店舗の在庫の番号（在庫区分の番号の小さい順の先頭＝EC-CUBE） */
export function 店舗の在庫ID(商品規格ID: string, 店舗ID: string): string {
  const r = query(
    `select ps.id from dtb_product_stock ps
      where ps.product_class_id = $1 and ps.base_info_id = $2
      order by ps.stock_location_id, ps.id`,
    [商品規格ID, 店舗ID]);
  if (r.length === 0) throw new Error(`商品規格ID ${商品規格ID} の店舗ID ${店舗ID} の在庫が無い`);
  return String(r[0].id);
}

/** 会員の、指定の店舗のカートの番号（無ければ空） */
export function 会員の店舗のカートID(会員ID: string, 店舗ID: string): string {
  return String(query(`select id from dtb_cart where customer_id = $1 and base_info_id = $2 order by id desc limit 1`, [会員ID, 店舗ID])[0]?.id ?? "");
}

/** 会員の、指定の店舗のカートの、商品規格の明細の番号（無ければ空） */
export function カートの明細ID(会員ID: string, 店舗ID: string, 商品規格ID: string): string {
  return String(query(
    `select ci.id from dtb_cart_item ci join dtb_cart c on c.id = ci.cart_id
      where c.customer_id = $1 and c.base_info_id = $2 and ci.product_class_id = $3 order by ci.id desc limit 1`,
    [会員ID, 店舗ID, 商品規格ID])[0]?.id ?? "");
}

/** 会員の、指定の店舗のカートの明細（商品規格ID と数量） */
export function カートの明細(会員ID: string, 店舗ID: string): { 商品規格ID: string; 数量: number }[] {
  return query(
    `select ci.product_class_id, ci.quantity from dtb_cart_item ci join dtb_cart c on c.id = ci.cart_id
      where c.customer_id = $1 and c.base_info_id = $2 order by ci.id`,
    [会員ID, 店舗ID]).map((r) => ({ 商品規格ID: String(r.product_class_id), 数量: Number(r.quantity) }));
}

/** 購入グループの番号（名前で引く） */
export function 購入グループID(名前: string): string {
  const r = query(`select id from mtb_sell_group where name = $1 order by id`, [名前]);
  if (r.length === 0) throw new Error(`購入グループ「${名前}」が無い`);
  return String(r[0].id);
}

/** 本店の送料無料条件（金額・数量）。設定なしは空 */
export function 本店の送料無料条件(): { 金額: string; 数量: string } {
  const r = query(`select delivery_free_amount, delivery_free_quantity from dtb_base_info where id = 1`)[0];
  const n = (v: string | null) => (v === null || v === "" ? "" : String(Number(v)));
  return { 金額: n(r.delivery_free_amount), 数量: n(r.delivery_free_quantity) };
}

const 商品の持ち主 = (商品コード: string) => ({
  sql: `select ps.id from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id where pc.product_code = $1`, params: [商品コード],
});

/** 商品（実行の印つきの商品コード）の本店の EC-CUBE の在庫数を変える（手順の「DBで在庫数を変更する」） */
export function 在庫数を変える(what: string, 商品コード: string, 在庫ID: string, 在庫数: number): void {
  updateOwnRows(what, { table: "dtb_product_stock", key: "id", ids: [在庫ID], set: { stock: 在庫数 }, owner: 商品の持ち主(商品コード) });
}

/** 商品（実行の印つきの商品コード）の商品規格の購入上限（販売制限数）を変える（手順の「DBで購入上限数を変更する」） */
export function 購入上限を変える(what: string, 商品コード: string, 商品規格ID: string, 上限: number): void {
  updateOwnRows(what, {
    table: "dtb_product_class", key: "id", ids: [商品規格ID], set: { sale_limit: 上限 },
    owner: { sql: `select pc.id from dtb_product_class pc where pc.product_code = $1`, params: [商品コード] },
  });
}

/** 商品規格の在庫数・購入上限（確かめ用） */
export function 在庫と購入上限(商品規格ID: string, 在庫ID: string): { 在庫: number; 上限: number | null } {
  const s = query(`select stock from dtb_product_stock where id = $1`, [在庫ID])[0];
  const l = query(`select sale_limit from dtb_product_class where id = $1`, [商品規格ID])[0];
  return { 在庫: Number(s?.stock ?? NaN), 上限: l?.sale_limit === null || l?.sale_limit === undefined ? null : Number(l.sale_limit) };
}
