/**
 * A07-03 ネット買取受注コメント更新（MTGバイヤーの API）の DB の参照と、画面で作れない値の書き込み。
 * 書き込みは E2E の買取（会員のメールアドレスに実行の印がある行）にだけ行う（db/write_adapter.ts → lib/db_write.ts。依頼者決定 2026-11-10）。
 * 存在しない受注の番号（703999006 など）は、0件であることを数えるだけ（消さない・書き換えない）。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";

function 数字(s: string | number): string {
  const v = String(s);
  if (!/^\d+$/.test(v)) throw new Error(`番号が数字でない（${v}）`);
  return String(Number(v));
}
function 一件(n: number, 何: string): void {
  if (n !== 1) throw new Error(`${何}: 書き込んだ行が ${n} 行（1行のはず）`);
}
const 買取の確かめ = "select b.id, b.email from dtb_buy_order b where b.id = $1::int";

/** 受注の番号の行が何件あるか（存在しないことの確かめ。数えるだけ） */
export function 受注の件数(番号: string): number {
  return Number(query("select count(*) as n from dtb_buy_order where id = $1::int", [数字(番号)])[0]?.n ?? 0);
}

export type コメントの値 = { フリーコメント: string | null; 更新担当者ID: string | null };
/** 受注のフリーコメント（管理者用メモ）と更新担当者（査定担当の管理者ID） */
export function コメントと担当を読む(番号: string): コメントの値 | null {
  const r = query("select memo, member_id::text as m from dtb_buy_order where id = $1::int", [数字(番号)])[0];
  if (!r) return null;
  return { フリーコメント: r.memo === null ? null : String(r.memo), 更新担当者ID: r.m === null ? null : String(r.m) };
}

/** 買取状況の ID と名前（マスタ）が一致するか */
export function 買取状況が一致する(ID: string, 名前: string): boolean {
  return Number(query("select count(*) as n from mtb_buy_order_status where id = $1::int and name = $2", [数字(ID), 名前])[0]?.n ?? 0) === 1;
}

/** 印つきの買取の申込日時と更新担当者を設定する（画面で指定できない） */
export function 申込日時と更新担当者を設定する(番号: string, メール: string, 日時: string, 管理者ID: string): void {
  一件(writeTestData({
    理由: `A07-03: 買取 ${番号} の申込日時を ${日時}・更新担当者を管理者ID ${管理者ID} にする（画面で指定できない）`,
    sql: "update dtb_buy_order set order_date = $2::timestamptz, member_id = $3::int where id = $1::int",
    params: [数字(番号), 日時, 数字(管理者ID)], 対象の確かめ: 買取の確かめ, 確かめのparams: [数字(番号)], 印: メール, 最大行数: 1,
  }), "申込日時・更新担当者");
}
