/**
 * A06-02 未完了店頭買取一覧取得（MTGBuyer の API）の、画面で作れない値の書き込み。
 * 書き込みは E2E の店頭買取（申込者の姓に実行の印がある行）の国の紐づけだけ（db/write_adapter.ts → lib/db_write.ts。依頼者決定 2026-11-10）。
 */
import { writeTestData } from "./write_adapter";

/** E2E の店頭買取の国との紐づけを外す（画面で指定できない） */
export function 国の紐づけを外す(受注ID: string, 印つきの姓: string): void {
  if (!/^\d+$/.test(受注ID)) throw new Error(`番号が数字でない（${受注ID}）`);
  const n = writeTestData({
    理由: `A06-02: 店頭買取 ${受注ID} の国との紐づけを外す（画面で指定できない）`,
    sql: "update dtb_otc_buy_order set country_id = null where id = $1::int",
    params: [受注ID], 対象の確かめ: "select o.id, o.last_name from dtb_otc_buy_order o where o.id = $1::int", 確かめのparams: [受注ID], 印: 印つきの姓, 最大行数: 1,
  });
  if (n !== 1) throw new Error(`店頭買取 ${受注ID} に書いた行が ${n} 行`);
}
