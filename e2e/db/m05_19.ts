/**
 * M05-19 出荷指示リスト検索のシードの準備（印つきの出荷指示リストの注文区分）と、前提の確かめ（読むだけ）。
 * 書き込みは db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通す。対象は、この実行の印つきの商品の明細を持つ受注を含む出荷指示リストだけ。
 * 共有のマスタ（注文区分）は読むだけで、書き換えない。物理名（テーブル・カラム）はこのファイルの SQL の中にだけ書く。
 */
import { count } from "../lib/db";
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";

/** 注文区分の名前が、マスタにある件数（読むだけ） */
export function 注文区分の件数(名前: string): number {
  return count(`select 1 from mtb_order_type where name = $1`, [名前]);
}

/** 印つきの出荷指示リストの注文区分を、名前で設定する（画面で指定できないため） */
export function 出荷指示リストの注文区分を設定する(出荷指示リストID: string, 区分名: string): void {
  if (注文区分の件数(区分名) !== 1) throw new Error(`注文区分「${区分名}」が注文区分マスタに1件でない。共有のマスタなので試験の値を足さずに止めた`);
  writeTestData({
    理由: `出荷指示リストの注文区分を「${区分名}」にする（画面で指定できない）`,
    sql: `update dtb_shipping_standby set order_type_id = (select id from mtb_order_type where name = $2) where id = $1::int`,
    params: [出荷指示リストID, 区分名],
    対象の確かめ: `select ss.id as 出荷指示リストID, i.product_code as 商品コード
                    from dtb_shipping_standby ss
                    join dtb_order_shipping_standby os on os.standby_id = ss.id
                    join dtb_order_item i on i.order_id = os.order_id
                   where ss.id = $1::int and i.product_code like $2`,
    確かめのparams: [出荷指示リストID, `%${RUN_MARK}%`],
    印: RUN_MARK,
    最大行数: 1,
  });
}

/** 出荷指示リストに入っている受注のうち、注文番号が同じで受注IDが違うものの件数（読むだけ。注文番号の検索がほかのリストに当たらないことの前提） */
export function 同じ注文番号のほかのリスト入り受注の件数(注文番号: string, 自分の受注ID: string[]): number {
  return count(
    `select 1 from dtb_order o join dtb_order_shipping_standby os on os.order_id = o.id
      where o.order_number = $1 and not (o.id = any(string_to_array($2, ',')::int[]))`, [注文番号, 自分の受注ID.join(",")]);
}

/** 注文番号が一致する受注のうち、出荷指示リストに入っているものの件数（読むだけ） */
export function リスト入り受注の件数(注文番号: string): number {
  return count(`select 1 from dtb_order o join dtb_order_shipping_standby os on os.order_id = o.id where o.order_number = $1`, [注文番号]);
}
