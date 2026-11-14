/**
 * M04-17 在庫履歴検索一覧の、E2E が作った在庫変動履歴への書き足し（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」。lib/db_write.ts）。
 * 物理名はこのファイルの SQL の中にだけ書く。書き足すのは、画面で作れない状態（在庫変動履歴の登録日時）だけ。
 * 持ち主の確かめは「商品コード（実行の印つき）の商品規格の在庫の、在庫変動履歴」。
 */
import { query } from "../lib/db";
import { Owner, updateOwnRows } from "../lib/db_write";

/** 商品コード（実行の印つき）の商品規格の在庫の、在庫変動履歴 */
const 履歴の持ち主 = (商品コード: string): Owner => ({
  sql: `select sh.id from dtb_stock_history sh join dtb_product_stock ps on ps.id = sh.product_stock_id
         join dtb_product_class pc on pc.id = ps.product_class_id where pc.product_code = $1`,
  params: [商品コード],
});

/** 商品コードの商品規格の在庫変動履歴の番号（古い順） */
export function 商品コードの在庫変動履歴(商品コード: string): string[] {
  return query(
    `select sh.id from dtb_stock_history sh join dtb_product_stock ps on ps.id = sh.product_stock_id
       join dtb_product_class pc on pc.id = ps.product_class_id where pc.product_code = $1 order by sh.id`, [商品コード],
  ).map((r) => String(r.id));
}

/** 商品コードの商品規格の在庫変動履歴の登録日時を書き換える。日時は「2026-08-01 00:00:00+09」の形 */
export function 在庫変動履歴の登録日時を書き足す(what: string, 商品コード: string, 日時: string): number {
  const ids = 商品コードの在庫変動履歴(商品コード);
  if (ids.length === 0) throw new Error(`${what}: 商品コード ${商品コード} の在庫変動履歴が無い`);
  updateOwnRows(what, { table: "dtb_stock_history", key: "id", ids, set: { create_date: 日時 }, owner: 履歴の持ち主(商品コード) });
  return ids.length;
}
