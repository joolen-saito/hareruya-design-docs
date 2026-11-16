/**
 * M06-12 買取商品一覧CSV出力のシードのための DB 操作。物理名はこのファイルの SQL の中にだけ書く。
 *
 * 依頼者の承認（2026-11-10「E2E が作った実行の印つきのデータに限りDBへ書いてよい」）の範囲で、書くのは次だけ:
 * - E2E が画面（フロントの店頭買取査定申込）で作った「実行の印つき」の買取（申込者の姓・名に実行の印）に、買取明細・個別入力明細を足す。
 * - E2E が画面（グッズ商品CSV登録・商品規格の新規作成）で作った、商品名に実行の印のある商品の商品規格の、状態・商品コードを変える。
 * 共有のマスタ（言語・状態・レアリティ・略称タグ・店舗）は、既にある行を指すだけで、書き換えない。
 * 書き込みは db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口）を通す。
 */
import { query } from "../lib/db";
import { RUN_MARK } from "../lib/run_marker";
import { writeTestData } from "./write_adapter";

const 印 = RUN_MARK;
const 買取の確かめ = "select o.id, o.last_name, o.first_name from dtb_otc_buy_order o where o.id = $1::int";
const 規格の確かめ = "select pc.id, p.name from dtb_product_class pc join dtb_product p on p.id = pc.product_id where pc.id = $1::int";

function 数字(s: string): string {
  if (!/^\d+$/.test(s)) throw new Error(`番号が数字でない（${s}）`);
  return String(Number(s));
}
function 一件(n: number, 何: string): void {
  if (n !== 1) throw new Error(`${何}: 書き込んだ行が ${n} 行（1行のはず）`);
}

// ---------------------------------------------------------------- 読むだけ

/** 商品コードの商品規格ID（1件でなければ止める） */
export function 商品コードの規格ID(商品コード: string): string {
  const r = query("select id from dtb_product_class where product_code = $1", [商品コード]);
  if (r.length !== 1) throw new Error(`商品コード ${商品コード} の商品規格が ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}

// ---------------------------------------------------------------- 商品規格（実行の印つきの商品）

/** 印つきの商品の商品規格を、状態に紐づかない規格にする（画面で状態を外せないため） */
export function 規格の状態を外す(規格ID: string): void {
  一件(writeTestData({
    理由: `商品規格 ${規格ID} の状態の紐づきを外す（状態なしにする）`,
    sql: "update dtb_product_class set card_condition_id = null where id = $1::int",
    params: [数字(規格ID)],
    対象の確かめ: 規格の確かめ, 確かめのparams: [数字(規格ID)], 印, 最大行数: 1,
  }), "商品規格の状態を外す");
}

/** 印つきの商品の商品規格を、商品コードなし・状態（コード）にする（画面で商品コードを空にできないため） */
export function 規格を商品コードなしにする(規格ID: string, 状態コード: string): void {
  if (query("select id from mtb_card_condition where code = $1", [状態コード]).length !== 1) throw new Error(`状態「${状態コード}」が状態マスタに1件でない`);
  一件(writeTestData({
    理由: `商品規格 ${規格ID} の商品コードを空にし、状態を ${状態コード} にする`,
    sql: "update dtb_product_class set product_code = null, card_condition_id = (select c.id from mtb_card_condition c where c.code = $2) where id = $1::int",
    params: [数字(規格ID), 状態コード],
    対象の確かめ: 規格の確かめ, 確かめのparams: [数字(規格ID)], 印, 最大行数: 1,
  }), "商品規格の商品コードを空にする");
}

// ---------------------------------------------------------------- 買取の明細（実行の印つきの買取）

/** 印つきの買取に、商品規格（印つきの商品）の買取明細を1件足す。足した明細のIDを返す */
export function 買取明細を足す(受注ID: string, 規格ID: string, 数量: number, 単価: number): string {
  if (query(規格の確かめ, [数字(規格ID)]).filter((r) => String(r.name ?? "").includes(印)).length !== 1) {
    throw new Error(`商品規格 ${規格ID} は実行の印つきの商品の規格でない`);
  }
  一件(writeTestData({
    理由: `買取 ${受注ID} に買取明細（商品規格 ${規格ID}・数量${数量}・買取価格${単価}）を足す`,
    sql: `insert into dtb_otc_buy_order_detail (otc_buy_order_id, product_class_id, price, sell_price, original_quantity)
          select o.id, $2::int, $3::int, $3::int, $4::int from dtb_otc_buy_order o where o.id = $1::int`,
    params: [数字(受注ID), 数字(規格ID), 単価, 数量],
    対象の確かめ: 買取の確かめ, 確かめのparams: [数字(受注ID)], 印, 最大行数: 1,
  }), "買取明細");
  const r = query("select max(id) as id from dtb_otc_buy_order_detail where otc_buy_order_id = $1::int and product_class_id = $2::int", [数字(受注ID), 数字(規格ID)]);
  if (!r[0]?.id) throw new Error(`足した買取明細（買取 ${受注ID}・商品規格 ${規格ID}）が見つからない`);
  return String(r[0].id);
}

/** 印つきの買取に、商品に紐づかない個別入力明細を1件足す。足した個別入力明細のIDを返す */
export function 個別入力明細を足す(受注ID: string, 商品名: string, 数量: number, 単価: number): string {
  一件(writeTestData({
    理由: `買取 ${受注ID} に個別入力明細（${商品名}・数量${数量}・買取価格${単価}・商品の紐づきなし）を足す`,
    sql: `insert into dtb_otc_buy_order_indivisual_input_product (otc_buy_order_id, name, product_class_id, price, sell_price, quantity)
          select o.id, $2, null, $3::int, $3::int, $4::int from dtb_otc_buy_order o where o.id = $1::int`,
    params: [数字(受注ID), 商品名, 単価, 数量],
    対象の確かめ: 買取の確かめ, 確かめのparams: [数字(受注ID)], 印, 最大行数: 1,
  }), "個別入力明細");
  const r = query("select max(id) as id from dtb_otc_buy_order_indivisual_input_product where otc_buy_order_id = $1::int and name = $2", [数字(受注ID), 商品名]);
  if (!r[0]?.id) throw new Error(`足した個別入力明細（買取 ${受注ID}・${商品名}）が見つからない`);
  return String(r[0].id);
}
