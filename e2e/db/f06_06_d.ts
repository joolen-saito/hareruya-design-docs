/** F06-06 購入履歴一覧の続き（-d）の DB 確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 受注の注文番号（未採番なら空） */
export function 受注の注文番号(受注ID: string): string {
  return query(`select coalesce(order_no,'') as n from dtb_order where id = $1`, [受注ID])[0]?.n ?? "";
}

/** 受注の注文日を、購入履歴一覧の表示の書式（年/月/日。月日は0で埋めない）で返す */
export function 受注の注文日の表示(受注ID: string): string {
  return query(`select to_char(order_date at time zone 'Asia/Tokyo', 'YYYY/FMMM/FMDD') as d from dtb_order where id = $1`, [受注ID])[0]?.d ?? "";
}
