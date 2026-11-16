/** F06-26 店頭PC用アカウント制御の DB 確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 注文番号の受注に保存された店舗販売用の整理番号（番号札）。受注が無ければ undefined、番号が無ければ null */
export function 受注の番号札(注文番号: string): { 受注の数: number; 番号札: (string | null)[] } {
  const r = query("select waiting_number::text as n from dtb_order where order_no = $1", [注文番号]);
  return { 受注の数: r.length, 番号札: r.map((x) => x.n) };
}
