/** M07-07（買取商品（キャンセル）CSV出力）のDB確認の照会。物理名はここの SQL にだけ書く（参照だけ） */
import { query } from "../lib/db";

export type 買取の記録 = {
  /** 買取情報の件数（買取番号が指す買取情報） */
  買取情報の件数: number;
  /** 買取状況の番号（アプリの定数。16=入庫待ち） */
  買取状況: number | null;
  明細の件数: number;
  数量: number | null;
  買取価格: number | null;
  /** 売却: true=する／false=しない／null=未定 */
  売却: boolean | null;
  基準価格: number | null;
  在庫数: number | null;
};

export const 入庫待ちの番号 = 16;

/** 買取番号（数字）の買取情報・買取明細（商品コードの商品）・商品規格（商品コード）の、いまの値を読む */
export function 記録を読む(買取番号: string, 商品コード: string): 買取の記録 {
  const id = String(Number(買取番号));
  const 買取 = query("select count(*) as n, max(buy_order_status_id) as s from dtb_buy_order where id = $1::int", [id])[0];
  const 明細 = query(
    `select count(*) as n, max(c.count) as q, max(c.price) as p, bool_and(c.sale_flg) as f, count(c.sale_flg) as k
       from dtb_buy_main_card c where c.buy_order_id = $1::int`, [id])[0];
  const 規格 = query(
    `select pc.standard_price as sp, (select coalesce(sum(ps.stock), 0) from dtb_product_stock ps where ps.product_class_id = pc.id) as st
       from dtb_product_class pc where pc.product_code = $1`, [商品コード])[0];
  const num = (v: string | null | undefined): number | null => (v === null || v === undefined ? null : Number(v));
  return {
    買取情報の件数: Number(買取.n),
    買取状況: num(買取.s),
    明細の件数: Number(明細.n),
    数量: num(明細.q),
    買取価格: num(明細.p),
    売却: Number(明細.k) === 0 ? null : 明細.f === "t" || 明細.f === "true",
    基準価格: num(規格?.sp),
    在庫数: num(規格?.st),
  };
}
