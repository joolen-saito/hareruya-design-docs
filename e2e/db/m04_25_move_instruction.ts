/**
 * M04-25 在庫移動指示詳細の DB 確認（参照だけ）。
 * 送り状No.・発送状況・紐づく在庫移動のステータスは M04-24 の照会（db/m04_24_move_instruction.ts）をそのまま使い、ここでは備考を足す。
 * 物理名は SQL の中にだけ書く。
 */
import { query } from "../lib/db";

export { 在庫移動指示, 発送状況, 紐づく在庫移動, 送り状Noの形 } from "./m04_24_move_instruction";

/** 在庫移動指示の送り状No.と備考（未登録は null）。在庫移動指示が無ければ null */
export function 送り状Noと備考(在庫移動指示ID: string): { 送り状No: string | null; 備考: string | null } | null {
  const rows = query(
    `select tracking_no as "送り状No", memo as "備考" from dtb_stock_move_instruction where id = $1::int`,
    [在庫移動指示ID],
  );
  if (rows.length === 0) return null;
  return { 送り状No: rows[0].送り状No, 備考: rows[0].備考 };
}

export type 長い値の形 = { 文字数: number; バイト数: number; 半角大文字Aだけ: boolean };

/** 長い備考を、値そのものを持ち出さずに確かめる（文字数・バイト数・半角の A だけでできているか）。備考が無ければ null */
export function 備考の形(在庫移動指示ID: string): 長い値の形 | null {
  const rows = query(
    `select char_length(memo) as chars, octet_length(memo) as bytes, (memo ~ '^A+$') as only_a
       from dtb_stock_move_instruction where id = $1::int and memo is not null`,
    [在庫移動指示ID],
  );
  if (rows.length === 0) return null;
  return { 文字数: Number(rows[0].chars), バイト数: Number(rows[0].bytes), 半角大文字Aだけ: rows[0].only_a === "true" };
}
