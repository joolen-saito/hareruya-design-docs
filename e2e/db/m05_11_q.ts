/**
 * M05-11 受注情報編集の追加分（お支払方法の確認・ポイント連携エラーの履歴）のDB確認と、印つきの受注への書き足し。
 * 書くのは、この実行の印を含む商品コードの明細を持つ受注だけ（db/write_adapter.ts の writeTestData を通す）。
 * 物理名（テーブル・カラム）はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";
import { RUN_MARK } from "../lib/run_marker";
import { writeTestData } from "./write_adapter";

/** 注文番号の受注のお支払方法の名前（読むだけ） */
export function 受注の支払方法(注文番号: string): string {
  const r = query(`select p.payment_method as n from dtb_order o left join dtb_payment p on p.id = o.payment_id where o.order_number = $1 and o.base_info_id = 1 order by o.id desc limit 1`, [注文番号]);
  if (r.length === 0) throw new Error(`注文番号「${注文番号}」の受注が無い`);
  return String(r[0].n ?? "");
}

/** 受注のポイント連携エラー（画面では入力できない欄。履歴画面の表示の準備のために書き足す） */
export function ポイント連携エラーを設定(受注ID: string, 文: string): void {
  writeTestData({
    理由: "ポイント連携エラーに値を入れる（画面では入力できない欄のため）",
    sql: `update dtb_order set point_error_message = $2::text where id = $1::int`,
    params: [受注ID, 文],
    対象の確かめ: `select o.id as 受注ID, i.product_code as 商品コード from dtb_order o join dtb_order_item i on i.order_id = o.id where o.id = $1::int and i.product_code like $2`,
    確かめのparams: [受注ID, `%${RUN_MARK}%`], 印: RUN_MARK, 最大行数: 1,
  });
}
