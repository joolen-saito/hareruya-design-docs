/**
 * M04-32 在庫編集承認一覧の DB 確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 * 実行区分が「ブラウザ+DB確認」のケース（104・108・109）だけが使う。
 */
import { query } from "../lib/db";

/** 商品コード・店舗名・在庫区分（1=EC-CUBE、2=スマレジ）の在庫（在庫数と総原価）。行が1件でなければ止める */
export function stockOf(商品コード: string, 店名: string, 在庫区分: 1 | 2): { 在庫: number; 総原価: number } {
  const rows = query(
    `select ps.stock, ps.total_cost from dtb_product_stock ps
       join dtb_product_class pc on pc.id = ps.product_class_id
       join dtb_base_info bi on bi.id = ps.base_info_id
      where pc.product_code = $1 and bi.shop_name = $2 and ps.stock_location_id = $3`, [商品コード, 店名, 在庫区分],
  );
  if (rows.length !== 1) throw new Error(`商品コード ${商品コード}・店舗 ${店名}・在庫区分 ${在庫区分} の在庫が ${rows.length} 件（1件のはず）`);
  return { 在庫: Number(rows[0].stock), 総原価: Number(rows[0].total_cost) };
}

export type HistoryRow = { 在庫増減数: number; 変更前総原価: number | null; 変更後総原価: number | null; 総原価増減数: number | null; 承認日: string | null };

/** 商品コード・店舗名・在庫区分の在庫の在庫変動履歴（古い順） */
export function historiesOf(商品コード: string, 店名: string, 在庫区分: 1 | 2): HistoryRow[] {
  return query(
    `select sh.stock_change_quantity, sh.total_cost_price_before, sh.total_cost_price_after, sh.approval_at
       from dtb_stock_history sh
       join dtb_product_stock ps on ps.id = sh.product_stock_id
       join dtb_product_class pc on pc.id = ps.product_class_id
       join dtb_base_info bi on bi.id = ps.base_info_id
      where pc.product_code = $1 and bi.shop_name = $2 and ps.stock_location_id = $3
      order by sh.id`, [商品コード, 店名, 在庫区分],
  ).map((r) => {
    const before = r.total_cost_price_before === null ? null : Number(r.total_cost_price_before);
    const after = r.total_cost_price_after === null ? null : Number(r.total_cost_price_after);
    return {
      在庫増減数: Number(r.stock_change_quantity), 変更前総原価: before, 変更後総原価: after,
      総原価増減数: before === null || after === null ? null : after - before, 承認日: r.approval_at,
    };
  });
}
