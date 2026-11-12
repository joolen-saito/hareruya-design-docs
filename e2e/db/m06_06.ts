/**
 * M06-06 買取商品履歴CSV出力のシード・確かめのための DB 操作。物理名はこのファイルの SQL の中にだけ書く。
 *
 * 読む（件数・在庫数量）は lib/db.ts の query（参照だけ）。
 * 書くのは、E2E が作った「実行の印つき」の商品規格の在庫数量だけ（db/write_adapter.ts の writeTestData を通す）。
 */
import { query, Row } from "../lib/db";
import { RUN_MARK } from "../lib/run_marker";
import { writeTestData } from "./write_adapter";

function 数(r: Row[]): number {
  return Number(r[0]?.n ?? 0);
}

/** 査定ID（買取の画面の番号）に紐づく実在庫履歴の件数 */
export function 実在庫履歴の件数(査定ID: string): number {
  return 数(query(`select count(*) as n from dtb_otc_buy_order_stock_history h
                    join dtb_otc_buy_order_stock s on s.id = h.otc_buy_order_stock_id
                    join dtb_otc_buy_order o on o.id = s.otc_buy_order_id where o.assessment_id = $1`, [査定ID]));
}

/** 査定IDに紐づく買取明細の件数 */
export function 買取明細の件数(査定ID: string): number {
  return 数(query(`select count(*) as n from dtb_otc_buy_order_detail d
                    join dtb_otc_buy_order o on o.id = d.otc_buy_order_id where o.assessment_id = $1`, [査定ID]));
}

/** 商品コードの商品の在庫数量（商品規格は1件のはず） */
export function 在庫数量(商品コード: string): number {
  const r = query(`select ps.stock as n from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id
                    where pc.product_code = $1`, [商品コード]);
  if (r.length !== 1) throw new Error(`商品コード ${商品コード} の在庫の行が ${r.length} 件（1件のはず）`);
  return Number(r[0].n);
}

/** 実行の印つきの商品コードの商品の在庫数量を設定する（シード表の「商品の在庫数量」） */
export function 在庫数量を設定する(商品コード: string, 数量: number): void {
  const c = query("select id from dtb_product_class where product_code = $1", [商品コード]);
  if (c.length !== 1) throw new Error(`商品コード ${商品コード} の商品規格が ${c.length} 件（1件のはず）`);
  const n = writeTestData({
    理由: `商品 ${商品コード} の在庫数量を ${数量} にする`,
    sql: "update dtb_product_stock set stock = $2::int where product_class_id = $1::int",
    params: [String(Number(c[0].id)), 数量],
    対象の確かめ: "select pc.id, pc.product_code from dtb_product_class pc where pc.id = $1::int", 確かめのparams: [String(Number(c[0].id))],
    印: RUN_MARK, 最大行数: 1,
  });
  if (n !== 1) throw new Error(`在庫数量の設定: 書き込んだ行が ${n} 行（1行のはず）`);
}
