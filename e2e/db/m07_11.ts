/**
 * M07-11 買取商品履歴CSV出力 のシードの、画面で作れない部分を DB で整える書き込み。
 * 物理名はこのファイルの SQL の中にだけ書く。書き込みは db/write_adapter.ts の writeTestData を通す。
 * 書く先は、E2E が画面で作った「実行の印つき」の買取（会員のメールアドレスに実行の印が入っている）の実在庫履歴だけ。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";

const 履歴の確かめ = `select h.id, b.email from dtb_buy_order_stock_history h
   join dtb_buy_order_stock s on s.id = h.buy_order_stock_id join dtb_buy_order b on b.id = s.buy_order_id
   join dtb_product_class pc on pc.id = s.product_class_id
  where b.id = $1::int and pc.product_code = $2`;

/** 印つきの買取の、商品の実在庫履歴（1件）の変更前・変更後の数量を設定する */
export function 実在庫履歴の前後を設定する(買取番号: string, 印: string, 商品コード: string, 前: number, 後: number): void {
  if (!/^\d+$/.test(買取番号)) throw new Error(`番号が数字でない（${買取番号}）`);
  const b = String(Number(買取番号));
  const n = query(履歴の確かめ, [b, 商品コード]).length;
  if (n !== 1) throw new Error(`買取 ${買取番号} の ${商品コード} の実在庫履歴が ${n} 件（1件のはず）`);
  const w = writeTestData({
    理由: `買取 ${買取番号} の ${商品コード} の実在庫履歴の数量を ${前} → ${後} にする`,
    sql: `update dtb_buy_order_stock_history set before_quantity = $3::int, after_quantity = $4::int
           where id in (select h.id from dtb_buy_order_stock_history h join dtb_buy_order_stock s on s.id = h.buy_order_stock_id
                         join dtb_product_class pc on pc.id = s.product_class_id where s.buy_order_id = $1::int and pc.product_code = $2)`,
    params: [b, 商品コード, 前, 後],
    対象の確かめ: 履歴の確かめ, 確かめのparams: [b, 商品コード], 印, 最大行数: 1,
  });
  if (w !== 1) throw new Error(`実在庫履歴の数量: 書き込んだ行が ${w} 行（1行のはず）`);
}
