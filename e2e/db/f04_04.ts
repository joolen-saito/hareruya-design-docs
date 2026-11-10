/** F04-04 決済〜購入完了の DB 確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

export type 在庫履歴の行 = { 在庫変動数: number; 変更前在庫: number; 変更後在庫: number; 登録元: string };

/** 受注（受注ID）を登録元とする、商品コードの在庫の履歴（フロントの注文完了などの登録元の名前つき） */
export function 受注を登録元とする在庫履歴(受注ID: string, 商品コード: string): 在庫履歴の行[] {
  return query(
    `select sh.stock_change_quantity as q, sh.old_stock as o, sh.stock as n, coalesce(st.source_name, '') as src
       from dtb_stock_history sh
       join dtb_product_stock ps on ps.id = sh.product_stock_id
       join dtb_product_class pc on pc.id = ps.product_class_id
       left join mtb_stock_history_source_type st on st.id = sh.history_source_type
      where sh.history_source_id = $1 and pc.product_code = $2
      order by sh.id`,
    [受注ID, 商品コード]).map((r) => ({ 在庫変動数: Number(r.q), 変更前在庫: Number(r.o), 変更後在庫: Number(r.n), 登録元: r.src ?? "" }));
}

/** 受注（受注ID）の明細ごとの売上分析タグID（商品IDごと・昇順）。売上分析タグの無い明細は空の配列 */
export function 受注明細の売上分析タグ(受注ID: string): Record<string, number[]> {
  const rows = query(
    `select oi.product_id as p, ta.tag_sales_analysis_id as tag
       from dtb_order_item oi
       left join dtb_order_item_tag_sales_analysis ta on ta.order_item_id = oi.id
      where oi.order_id = $1 and oi.product_id is not null
      order by oi.product_id, ta.tag_sales_analysis_id`,
    [受注ID]);
  const out: Record<string, number[]> = {};
  for (const r of rows) {
    const k = r.p ?? "";
    out[k] ??= [];
    if (r.tag) out[k].push(Number(r.tag));
  }
  return out;
}

/** 商品コード（商品規格コード）の在庫の合計（全店舗・全在庫区分） */
export function 商品コードの総在庫(商品コード: string): number {
  const r = query(
    `select coalesce(sum(ps.stock), 0) as s from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id where pc.product_code = $1`,
    [商品コード])[0];
  return Number(r?.s ?? 0);
}
