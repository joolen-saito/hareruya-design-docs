/**
 * M06-02 古物台帳入力用CSV出力のシードのための DB 操作。物理名はこのファイルの SQL の中にだけ書く。
 *
 * 書くのは、E2E が画面（フロントの店頭買取査定申込）で作った「実行の印つき」の買取（申込者の名に実行の印）と、その買取に紐づく行
 * （買取明細・個別入力商品）だけ。書き込みはすべて db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す）を通す。
 * 共有のマスタ（身分証・職業・国・店舗）は、既にある行を名前で指すだけで、書き換えない。
 */
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";
import { query } from "../lib/db";

const 印 = RUN_MARK;
const 親の確かめ = "select o.id, o.first_name from dtb_otc_buy_order o where o.id = $1::int";

function 数字(s: string): string {
  if (!/^\d+$/.test(s)) throw new Error(`番号が数字でない（${s}）`);
  return String(Number(s));
}
function 一件(n: number, 何: string): void {
  if (n !== 1) throw new Error(`${何}: 書き込んだ行が ${n} 行（1行のはず）`);
}

/** 印つきの買取に、数量だけを持つ買取明細を1件足す（商品の紐づけ・部門なし） */
export function 買取明細を数量で足す(受注ID: string, 数量: number): void {
  一件(writeTestData({
    理由: `買取 ${受注ID} に買取明細（数量${数量}）を足す`,
    sql: `insert into dtb_otc_buy_order_detail (otc_buy_order_id, price, sell_price, original_quantity)
          select o.id, 1000, 1000, $2::int from dtb_otc_buy_order o where o.id = $1::int`,
    params: [数字(受注ID), 数量],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(受注ID)], 印, 最大行数: 1,
  }), "買取明細");
}

/** 印つきの買取に、数量だけを持つ個別入力商品を1件足す */
export function 個別入力商品を数量で足す(受注ID: string, 名前: string, 数量: number): void {
  一件(writeTestData({
    理由: `買取 ${受注ID} に個別入力商品（${名前}・数量${数量}）を足す`,
    sql: `insert into dtb_otc_buy_order_indivisual_input_product (otc_buy_order_id, name, price, sell_price, quantity)
          select o.id, $2, 1000, 1000, $3::int from dtb_otc_buy_order o where o.id = $1::int`,
    params: [数字(受注ID), 名前, 数量],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(受注ID)], 印, 最大行数: 1,
  }), "個別入力商品");
}

/** 印つきの買取の身分証を、身分証マスタの名前が一致する既存の行にする（マスタは変えない） */
export function 身分証を設定する(受注ID: string, 名前: string): void {
  const n = query("select id from mtb_identification where name = $1", [名前]).length;
  if (n !== 1) throw new Error(`身分証「${名前}」が身分証マスタに ${n} 件（1件のはず）`);
  一件(writeTestData({
    理由: `買取 ${受注ID} の身分証を既存の種別「${名前}」にする`,
    sql: "update dtb_otc_buy_order set identification_id = (select i.id from mtb_identification i where i.name = $2) where id = $1::int",
    params: [数字(受注ID), 名前],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(受注ID)], 印, 最大行数: 1,
  }), "身分証の設定");
}

/** 印つきの買取の適格請求書発行事業者の区分を設定する */
export function 事業者区分を設定する(受注ID: string, 事業者: boolean): void {
  一件(writeTestData({
    理由: `買取 ${受注ID} の適格請求書発行事業者の区分を「${事業者 ? "事業者" : "事業者でない"}」にする`,
    sql: "update dtb_otc_buy_order set qualified_invoice_issuer_flg = $2::boolean where id = $1::int",
    params: [数字(受注ID), 事業者 ? "true" : "false"],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(受注ID)], 印, 最大行数: 1,
  }), "事業者区分の設定");
}
