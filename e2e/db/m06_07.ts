/**
 * M06-07 買取商品履歴CSV出力のシードのための DB 操作（db/m06_05.ts にない分だけ）。物理名はこのファイルの SQL の中にだけ書く。
 *
 * 書くのは、E2E が画面（フロントの店頭買取査定申込）で作った「実行の印つき」の買取（申込者の姓・名に実行の印）だけ。
 * 書き込みは db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口）を通す。
 */
import { RUN_MARK } from "../lib/run_marker";
import { writeTestData } from "./write_adapter";
import { 受注ID } from "./m06_05";

const 親の確かめ = "select o.id, o.last_name, o.first_name from dtb_otc_buy_order o where o.id = $1::int";

/** 印つきの買取の買取店舗を外す（未設定にする） */
export function 買取店舗を外す(査定ID: string): void {
  const id = 受注ID(査定ID);
  const n = writeTestData({
    理由: `買取 ${査定ID} の買取店舗を未設定にする`,
    sql: "update dtb_otc_buy_order set base_info_id = null where id = $1::int",
    params: [id],
    対象の確かめ: 親の確かめ, 確かめのparams: [id], 印: RUN_MARK, 最大行数: 1,
  });
  if (n !== 1) throw new Error(`買取店舗を外す: 書き込んだ行が ${n} 行（1行のはず）`);
}
