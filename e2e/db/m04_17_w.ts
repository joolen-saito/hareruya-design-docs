/**
 * M04-17 在庫履歴検索一覧の、E2E が作った在庫変動履歴への書き足し（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」。lib/db_write.ts の窓口）。
 * 物理名はこのファイルの SQL の中にだけ書く。書き足すのは、画面で指定できない値（在庫の前後・増減数・買取価格・承認日時・最終更新日時・変動区分）だけ。
 * 持ち主の確かめは「商品コードに実行の印を含む商品規格の在庫の、在庫変動履歴」（商品コードは mk() が「検索語＋印＋枝番」の形にする）。
 */
import { query } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

const 自分の履歴 = {
  sql: `select sh.id from dtb_stock_history sh join dtb_product_stock ps on ps.id = sh.product_stock_id
         join dtb_product_class pc on pc.id = ps.product_class_id where pc.product_code like '%-' || $1 || '%'`,
  params: [RUN_MARK],
};

export type 履歴の値 = {
  変更前在庫?: number; 変更後在庫?: number; 在庫増減数?: number; 仕入単価?: number | null; 承認日時?: string | null; 最終更新日時?: string | null; 変動区分?: string;
};

/** 商品コードの商品規格の在庫変動履歴の番号（古い順） */
function 履歴の番号(商品コード: string): string[] {
  const ids = query(
    `select sh.id from dtb_stock_history sh join dtb_product_stock ps on ps.id = sh.product_stock_id
       join dtb_product_class pc on pc.id = ps.product_class_id where pc.product_code = $1 order by sh.id`, [商品コード]).map((r) => String(r.id));
  if (ids.length === 0) throw new Error(`商品コード ${商品コード} の在庫変動履歴が無い`);
  return ids;
}

/** 商品コードの在庫変動履歴の値を書き足す。日時は「2026-08-02 00:00:00+09」の形 */
export function 履歴の値を書き足す(what: string, 商品コード: string, v: 履歴の値): number {
  const ids = 履歴の番号(商品コード);
  const set: Record<string, string | number | null> = {};
  if (v.変更前在庫 !== undefined) set.old_stock = v.変更前在庫;
  if (v.変更後在庫 !== undefined) set.stock = v.変更後在庫;
  if (v.在庫増減数 !== undefined) set.stock_change_quantity = v.在庫増減数;
  if (v.仕入単価 !== undefined) set.buy_price = v.仕入単価;
  if (v.承認日時 !== undefined) set.approval_at = v.承認日時;
  if (v.最終更新日時 !== undefined) set.update_date = v.最終更新日時;
  if (v.変動区分 !== undefined) {
    const [親, 子] = v.変動区分.split("/");
    const d = query(`select d.id from mtb_stock_change_type_detail d join mtb_stock_change_type t on t.id = d.stock_change_type_id where d.child_name = $1 and t.name = $2`, [子, 親]);
    if (d.length < 1) throw new Error(`${what}: 在庫変動区分「${v.変動区分}」が無い`);
    set.stock_change_type_detail_id = String(d[0].id);
  }
  updateOwnRows(what, { table: "dtb_stock_history", key: "id", ids, set, owner: 自分の履歴 });
  return ids.length;
}
