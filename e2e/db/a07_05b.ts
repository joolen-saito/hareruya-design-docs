/**
 * A07-05（ネット買取注文の査定終了処理）の追加ケース用の DB の参照と、画面で作れない値の書き込み。
 * 書き込みは E2E の買取（会員のメールアドレスに実行の印がある行）の合計金額だけ（db/write_adapter.ts → lib/db_write.ts）。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";

const 数字 = (s: string | number): string => { const v = String(s); if (!/^\d+$/.test(v)) throw new Error(`番号が数字でない（${v}）`); return String(Number(v)); };

export type 受注の値 = { 状況ID: string; 合計金額: string | null; 担当ID: string | null; 更新日時: string };
/** 買取の状況・合計金額・更新担当者・更新日時 */
export function 受注を読む(番号: string): 受注の値 | null {
  const r = query("select buy_order_status_id::text as s, total_price::text as p, member_id::text as m, to_char(update_date, 'YYYY-MM-DD HH24:MI:SS.US') as u from dtb_buy_order where id = $1::int", [数字(番号)])[0];
  return r ? { 状況ID: String(r.s), 合計金額: r.p === null ? null : String(r.p), 担当ID: r.m === null ? null : String(r.m), 更新日時: String(r.u) } : null;
}
export type 履歴の行 = { ID: string; 状況ID: string; 担当ID: string | null };
/** ステータス変更履歴（番号の順） */
export function 履歴を読む(番号: string): 履歴の行[] {
  return query("select id::text as id, buy_order_status_id::text as s, member_id::text as m from dtb_buy_order_status_histry where buy_order_id = $1::int order by id", [数字(番号)])
    .map((r) => ({ ID: String(r.id), 状況ID: String(r.s), 担当ID: r.m === null ? null : String(r.m) }));
}
/** E2E の買取の合計金額を書く（画面で指定できない） */
export function 合計金額を書く(番号: string, メール: string, 金額: number): void {
  const n = writeTestData({
    理由: `A07-05: 買取 ${番号} の合計金額を ${金額} にする（画面で指定できない）`,
    sql: "update dtb_buy_order set total_price = $2::int where id = $1::int",
    params: [数字(番号), 金額], 対象の確かめ: "select b.id, b.email from dtb_buy_order b where b.id = $1::int", 確かめのparams: [数字(番号)], 印: メール, 最大行数: 1,
  });
  if (n !== 1) throw new Error(`買取 ${番号} に書いた行が ${n} 行`);
}
