/**
 * F01-02（支店ECTOP）のシードの、画面で作れない部分を DB で整える書き込み（依頼者の承認 2026-11-10「印つきデータは何でも」）。
 * 物理名はこのファイルの SQL の中にだけ書く。書き込みはすべて db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） を通す（1文ずつ・印の確かめ・行数の上限・ログ）。
 *
 * 書く先は、E2E が画面（グッズ商品CSV登録・規格の追加）で作った「実行の印つきの商品コード」の商品規格に紐づく行だけ:
 * - 支店在庫のピックアップ指定: 支店の在庫（在庫場所 EC-CUBE）の行。ピックアップ指定を入力する画面が無い（スマレジ連携・買取入庫だけが立てる）。
 * - 週間販売数（期間別販売数集計データ）: 本店・EC-CUBE の行の「1週間販売数」。集計バッチが作るデータで、画面から作れない。
 *   同じ商品規格・本店・販売場所の行があれば書き換え、無ければ足す（印つきの商品規格の行だけ）。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";

/** 本店の店舗ID・販売場所 EC-CUBE・在庫場所 EC-CUBE（アプリの定数） */
const 本店ID = 1;
const 販売場所ECCUBE = 1;
const 在庫場所ECCUBE = 1;

function 数字(s: string): string {
  if (!/^\d+$/.test(s)) throw new Error(`番号が数字でない（${s}）`);
  return String(Number(s));
}

const 規格の確かめ = "select pc.id, pc.product_code from dtb_product_class pc where pc.product_code like $1 || '%'";

/** 印つきの商品コード（と、そこに足した規格 <商品コード>… ）の、支店の在庫（在庫場所 EC-CUBE）のピックアップ指定を「あり」にする */
export function 支店在庫のピックアップを指定する(商品コード: string, 支店ID: string): number {
  if (query(規格の確かめ, [商品コード]).length === 0) throw new Error(`商品コード ${商品コード} の商品規格が無い`);
  return writeTestData({
    理由: `商品 ${商品コード} の規格の、支店 ${支店ID} の在庫のピックアップ指定を「あり」にする`,
    sql: `update dtb_product_stock ps set pick_up_flg = true
            from dtb_product_class pc
           where pc.id = ps.product_class_id and pc.product_code like $1 || '%' and ps.base_info_id = $2::int and ps.stock_location_id = ${在庫場所ECCUBE}`,
    params: [商品コード, 数字(支店ID)],
    対象の確かめ: 規格の確かめ, 確かめのparams: [商品コード], 印: 商品コード, 最大行数: 20,
  });
}

/** 印つきの商品コードの規格（取込の規格1件）の、本店・EC-CUBE の1週間販売数を設定する（行があれば書き換え、無ければ足す） */
export function 週間販売数を設定する(商品コード: string, 数: number): void {
  const rows = query("select pc.id, pc.product_code from dtb_product_class pc where pc.product_code = $1", [商品コード]);
  if (rows.length !== 1) throw new Error(`商品コード ${商品コード} の商品規格が ${rows.length} 件（1件のはず）`);
  // 窓口は「あれば更新・無ければ追加」を1文で書けないので、既にあるかを先に調べて分ける
  const あり = query(
    `select sq.id from dtb_sales_quantity sq where sq.product_class_id = $1::int and sq.base_info_id = ${本店ID} and sq.sales_location = ${販売場所ECCUBE}`, [rows[0].id as string]).length > 0;
  const 確かめ = { 対象の確かめ: "select pc.id, pc.product_code from dtb_product_class pc where pc.product_code = $1", 確かめのparams: [商品コード], 印: 商品コード, 最大行数: 1 };
  const n = writeTestData(あり ? {
    理由: `商品 ${商品コード} の規格の、本店の1週間販売数を ${数} にする`,
    sql: `update dtb_sales_quantity set sales_quantity_04 = $2::int, update_date = now()
          where product_class_id = (select pc.id from dtb_product_class pc where pc.product_code = $1) and base_info_id = ${本店ID} and sales_location = ${販売場所ECCUBE}`,
    params: [商品コード, 数], ...確かめ,
  } : {
    理由: `商品 ${商品コード} の規格の、本店の1週間販売数を ${数} にする`,
    sql: `insert into dtb_sales_quantity (product_class_id, base_info_id, sales_location, sales_quantity_04, update_date)
          select pc.id, ${本店ID}, ${販売場所ECCUBE}, $2::int, now() from dtb_product_class pc where pc.product_code = $1`,
    params: [商品コード, 数], ...確かめ,
  });
  if (n !== 1) throw new Error(`週間販売数: 書き込んだ行が ${n} 行（1行のはず）`);
}
