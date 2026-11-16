/**
 * F05-04 ネット買取商品詳細 の DB 準備（IT-F05-04-017）。物理名はこのファイルの SQL の中にだけ書く。
 * - 足すのは、画面で作った E2E の商品（商品コードに実行の印）の規格に付く「商品の販売数」1行だけ（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」）。
 * - 足す前に registerRestore で「消す」ことを登録する。ケースの終わりに基盤が消し、消えたことを DB の参照で確かめる。
 */
import { query } from "../lib/db";
import { deleteOwnRows, insertOwnRows } from "../lib/db_write";
import { registerRestore } from "../lib/shared_restore";
import { RUN_MARK } from "../lib/run_marker";

/** 持ち主の確かめ: 商品コードに実行の印がある規格の番号 */
const 自分の規格 = (規格ID: string) => ({
  sql: `select id from dtb_product_class where id = $1::int and position($2 in product_code) > 0`,
  params: [規格ID, RUN_MARK] as (string | number)[],
});

function 販売数の件数(規格ID: string): number {
  return Number(query(`select count(*) as n from dtb_sales_quantity where product_class_id = $1::int`, [規格ID])[0].n);
}

/**
 * 本店（店舗ID 1）のEC（販売場所 1）の販売数を足す。1週間販売数を指定の数にし、それより長い期間の販売数も同じ数にする
 * （長い期間が1週間より少ないことはないため）。当日・昨日・3日間は 0。
 */
export function 本店ECの1週間販売数を足す(what: string, 規格ID: string, 数量: number): void {
  if (販売数の件数(規格ID) > 0) throw new Error(`${what}: 規格 ${規格ID} の販売数の行が既にある。既存の行は上書きしない`);
  registerRestore(
    `商品規格 ${規格ID} の販売数の行`,
    { 足した規格: 規格ID },
    async () => {
      const ids = query(`select id from dtb_sales_quantity where product_class_id = $1::int`, [規格ID]).map((r) => String(r.id));
      if (ids.length) {
        deleteOwnRows(`${what} の後始末`, {
          table: "dtb_sales_quantity", key: "id", ids,
          owner: { sql: `select s.id from dtb_sales_quantity s join dtb_product_class c on c.id = s.product_class_id where c.id = $1::int and position($2 in c.product_code) > 0`, params: [規格ID, RUN_MARK] },
        });
      }
    },
    async () => 販売数の件数(規格ID) === 0,
  );
  const now = new Date().toISOString();
  insertOwnRows(what, {
    table: "dtb_sales_quantity", parentColumn: "product_class_id", owner: 自分の規格(規格ID),
    rows: [{
      product_class_id: 規格ID, base_info_id: 1, sales_quantity_01: 0, sales_quantity_02: 0, sales_quantity_03: 0, sales_quantity_04: 数量,
      sales_quantity_05: 数量, sales_quantity_06: 数量, sales_quantity_07: 数量, sales_quantity_08: 数量, update_date: now, sales_location: 1,
    }],
  });
}

/** 規格の本店ECの1週間販売数（足したあとの確かめ） */
export function 本店ECの1週間販売数(規格ID: string): number | null {
  const r = query(`select sales_quantity_04 as n from dtb_sales_quantity where product_class_id = $1::int and base_info_id = 1 and sales_location = 1`, [規格ID])[0];
  return r ? Number(r.n) : null;
}
