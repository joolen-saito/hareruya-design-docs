/**
 * A07-04 ネット買取受注ステータス更新（MTGバイヤーの API）の DB の参照と、画面で作れない値の書き込み。
 * 書き込みは E2E の買取（会員のメールアドレスに実行の印がある行）にだけ行う（db/write_adapter.ts → lib/db_write.ts。依頼者決定 2026-11-10）。
 * ステータス変更履歴を消す関数は、呼ぶ側（seeds/a07-04.ts）が消してよいの一覧に載っていることを確かめてから呼ぶ（seeds/a07-common.ts の 消してよいか）。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";

function 数字(s: string | number): string {
  const v = String(s);
  if (!/^\d+$/.test(v)) throw new Error(`番号が数字でない（${v}）`);
  return String(Number(v));
}
const 買取の確かめ = "select b.id, b.email from dtb_buy_order b where b.id = $1::int";

/** 受注の買取状況のID */
export function 状況ID(番号: string): string | null {
  const r = query("select buy_order_status_id::text as s from dtb_buy_order where id = $1::int", [数字(番号)])[0];
  return r ? String(r.s) : null;
}
/** 受注のステータス変更履歴の件数 */
export function 履歴の件数(番号: string): number {
  return Number(query("select count(*) as n from dtb_buy_order_status_histry where buy_order_id = $1::int", [数字(番号)])[0]?.n ?? 0);
}
/** 買取状況のマスタ（ID → 名前） */
export function 買取状況のマスタ(): Map<string, string> {
  return new Map(query("select id::text as id, name from mtb_buy_order_status").map((r) => [String(r.id), String(r.name)]));
}

/** E2E の買取の更新日時（と更新担当者）を書く（画面で指定できない）。担当IDが undefined なら担当は変えない */
export function 更新日時と担当を書く(番号: string, メール: string, 日時: string, 担当ID?: string | null): void {
  const 担当 = 担当ID === undefined ? "" : 担当ID === null ? ", member_id = null" : ", member_id = $3::int";
  const params = 担当ID ? [数字(番号), 日時, 数字(担当ID)] : [数字(番号), 日時];
  const n = writeTestData({
    理由: `A07-04: 買取 ${番号} の更新日時を ${日時}${担当ID === undefined ? "" : `・更新担当者を ${担当ID ?? "なし"}`} にする（画面で指定できない）`,
    sql: `update dtb_buy_order set update_date = $2::timestamptz${担当} where id = $1::int`,
    params, 対象の確かめ: 買取の確かめ, 確かめのparams: [数字(番号)], 印: メール, 最大行数: 1,
  });
  if (n !== 1) throw new Error(`買取 ${番号} に書いた行が ${n} 行`);
}

/** E2E の買取のステータス変更履歴を0件にする（消す。呼ぶ前に 消してよいか を通す） */
export function 履歴を消す(番号: string, メール: string): number {
  return writeTestData({
    理由: `A07-04: 買取 ${番号} のステータス変更履歴を0件にする（画面の保存で作られた E2E の行を消す）`,
    sql: "delete from dtb_buy_order_status_histry where buy_order_id = $1::int",
    params: [数字(番号)], 対象の確かめ: "select h.id, b.email from dtb_buy_order_status_histry h join dtb_buy_order b on b.id = h.buy_order_id where b.id = $1::int",
    確かめのparams: [数字(番号)], 印: メール, 最大行数: 50,
  });
}
