/**
 * M07-03 買取情報編集の DB 確認（参照だけ）の続き。まとめて買取・個別入力商品・実在庫の確認。物理名はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";

function 数字(s: string): string {
  if (!/^\d+$/.test(s)) throw new Error(`番号が数字でない（${s}）`);
  return String(Number(s));
}

const 真 = (v: string | null) => v === "true" || v === "1" || v === "t";
const 売却の値 = (v: string | null): "する" | "しない" | "未定" => (v === null ? "未定" : 真(v) ? "する" : "しない");

export type まとめて明細 = { 商品コード: string; 査定価格: string; 数量: string; 売却: "する" | "しない" | "未定" };

/** 買取番号のまとめて買取の明細（商品コードは商品規格の商品コードの最小） */
export function まとめて買取の明細を読む(買取番号: string): まとめて明細[] {
  return query(
    `select (select min(pc.product_code) from dtb_product_class pc where pc.product_id = c.product_id) as code, c.price, c.count, c.sale_flg
       from dtb_buy_main_card c where c.buy_order_id = $1 and c.purchase_category = 2 order by c.id`, [数字(買取番号)],
  ).map((r) => ({
    商品コード: r.code ?? "", 査定価格: r.price === null ? "" : String(Number(r.price)), 数量: r.count === null ? "" : String(Number(r.count)), 売却: 売却の値(r.sale_flg),
  }));
}

export type 個別入力 = { 名前: string; 査定金額: string; 数量: string; 売却: "する" | "しない" | "未定"; 商品コード: string };

/** 買取番号の個別入力商品（商品コードは紐づく商品規格の商品コード。実在庫未登録なら空） */
export function 個別入力商品を読む(買取番号: string): 個別入力[] {
  return query(
    `select i.name, i.price, i.quantity, i.sale_flg, pc.product_code as code
       from dtb_buy_order_indivisual_input_product i left join dtb_product_class pc on pc.id = i.product_class_id
      where i.buy_order_id = $1 order by i.id`, [数字(買取番号)],
  ).map((r) => ({
    名前: r.name ?? "", 査定金額: r.price === null ? "" : String(Number(r.price)), 数量: r.quantity === null ? "" : String(Number(r.quantity)),
    売却: 売却の値(r.sale_flg), 商品コード: r.code ?? "",
  }));
}

/** 買取番号の実在庫情報の件数 */
export function 実在庫の件数(買取番号: string): number {
  return Number(query("select count(*) as n from dtb_buy_order_stock where buy_order_id = $1", [数字(買取番号)])[0].n);
}

/** 買取番号の実在庫の履歴の件数 */
export function 実在庫履歴の件数(買取番号: string): number {
  return Number(query(
    `select count(*) as n from dtb_buy_order_stock_history h join dtb_buy_order_stock s on s.id = h.buy_order_stock_id where s.buy_order_id = $1`, [数字(買取番号)],
  )[0].n);
}

/** 選んで買取の明細の数（商品コードの商品の明細） */
export function 選んで買取の明細の数(買取番号: string, 商品コード: string): number {
  return Number(query(
    `select count(*) as n from dtb_buy_main_card c
      where c.buy_order_id = $1 and c.purchase_category = 1 and c.product_id = (select pc.product_id from dtb_product_class pc where pc.product_code = $2)`,
    [数字(買取番号), 商品コード],
  )[0].n);
}

/** 買取の買取金額合計（買取に保存されている合計） */
export function 買取金額合計(買取番号: string): string {
  const r = query("select total_price from dtb_buy_order where id = $1", [数字(買取番号)])[0];
  if (!r) throw new Error(`買取番号 ${買取番号} の買取が無い`);
  return r.total_price === null ? "" : String(Number(r.total_price));
}
