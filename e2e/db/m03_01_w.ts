/**
 * M03-01 商品マスターの検索のシードで、E2E が作った商品規格へ書き足す値（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」。lib/db_write.ts の窓口）。
 * 物理名はこのファイルの SQL の中にだけ書く。書き足すのは、画面で指定できない値（期間別販売数・規格の更新日時・棚番号）だけ。
 * 持ち主の確かめは「商品コードの末尾が実行の印の商品規格」。
 */
import { query } from "../lib/db";
import { insertOwnRows, updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

const 自分の規格 = { sql: `select pc.id from dtb_product_class pc where pc.product_code like '%-' || $1`, params: [RUN_MARK] };

function 規格ID(商品コード: string): string {
  const r = query(`select pc.id from dtb_product_class pc where pc.product_code = $1`, [商品コード]);
  if (r.length !== 1) throw new Error(`商品コード ${商品コード} の規格が ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}

/** 期間別販売数の列: 当日・前日・3日間・1週間・1ヶ月・90日間 */
export type 期間別販売数 = [当日: number, 前日: number, 三日間: number, 一週間: number, 一ヶ月: number, 九十日間: number];

/** 商品コードの規格に、店舗（店舗ID）の期間別販売数の行を足す（販売場所は EC-CUBE） */
export function 販売数を足す(what: string, 商品コード: string, 店舗ID: string, 数: 期間別販売数): void {
  const id = 規格ID(商品コード);
  insertOwnRows(what, {
    table: "dtb_sales_quantity", parentColumn: "product_class_id", owner: 自分の規格,
    rows: [{
      product_class_id: id, base_info_id: 店舗ID, sales_location: 1,
      sales_quantity_01: 数[0], sales_quantity_02: 数[1], sales_quantity_03: 数[2], sales_quantity_04: 数[3], sales_quantity_05: 数[4], sales_quantity_06: 数[5],
      sales_quantity_07: 数[5], sales_quantity_08: 数[5], update_date: new Date().toISOString(),
    }],
  });
}

/** 商品コードの規格の更新日時を書き換える（「2026-09-03 00:00:00+09」の形） */
export function 規格の更新日時を書き足す(what: string, 商品コード: string, 日時: string): void {
  updateOwnRows(what, { table: "dtb_product_class", key: "id", ids: [規格ID(商品コード)], set: { update_date: 日時 }, owner: 自分の規格 });
}
