/**
 * M04-02 在庫編集の在庫変動履歴の表示確認用に、E2E が作った在庫へ履歴の行を足す（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」。lib/db_write.ts の窓口）。
 * 物理名はこのファイルの SQL の中にだけ書く。親になる在庫は、持ち主の確かめ（商品コードの末尾が実行の印の規格の在庫）に当たるものだけ。
 */
import { query } from "../lib/db";
import { insertOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

const 自分の在庫 = {
  sql: `select ps.id from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id where pc.product_code like '%-' || $1`,
  params: [RUN_MARK],
};

export type 足す履歴 = { 識別子: string; 基準日時: string; 登録者名?: string; 変動区分?: string };

/** 在庫IDの在庫に、在庫変動履歴を足す。識別子は在庫変動理由の欄に入れる（画面で見分ける印）。基準日時は登録日時（「2026-09-01 00:01:00+09」の形） */
export function 履歴を足す(what: string, 在庫ID: string, 行: 足す履歴[]): void {
  const s = query(`select ps.base_info_id as b, coalesce(ps.stock, 0) as n from dtb_product_stock ps where ps.id = $1`, [在庫ID]);
  if (s.length !== 1) throw new Error(`${what}: 在庫ID ${在庫ID} の在庫が ${s.length} 件`);
  const 区分 = (名前: string): string => {
    const [親, 子] = 名前.split("/");
    const d = query(`select d.id from mtb_stock_change_type_detail d join mtb_stock_change_type t on t.id = d.stock_change_type_id where d.child_name = $1 and t.name = $2`, [子, 親]);
    if (d.length < 1) throw new Error(`${what}: 在庫変動区分「${名前}」が無い`);
    return String(d[0].id);
  };
  insertOwnRows(what, {
    table: "dtb_stock_history", parentColumn: "product_stock_id", owner: 自分の在庫,
    rows: 行.map((r) => ({
      product_stock_id: 在庫ID, stock_change_type_detail_id: 区分(r.変動区分 ?? "入庫/問屋仕入"), base_info_id: String(s[0].b),
      stock: Number(s[0].n), old_stock: Number(s[0].n), sell_price: 0, stock_change_quantity: 0,
      stock_change_reason: r.識別子, registered_at: r.基準日時, create_date: r.基準日時, update_date: r.基準日時,
      ...(r.登録者名 !== undefined ? { operator_member_name: r.登録者名 } : {}),
    })),
  });
}
