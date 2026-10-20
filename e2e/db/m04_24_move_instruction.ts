/**
 * M04-24 在庫移動指示検索・作成の DB 確認（参照だけ）。
 * 発送状況は表に列が無く、送り状No.の有無で決まる（送り状No.があれば「済」、無ければ「未」。設計書 0202 在庫移動指示検索の機能仕様と、画面のテンプレートの表示の条件が同じ）。
 * 物理名は SQL の中にだけ書く。
 */
import { query } from "../lib/db";

export type 保存された在庫移動指示 = {
  在庫移動指示ID: string;
  出庫元店舗ID: string;
  入庫先店舗ID: string;
  /** 登録されていなければ null */
  送り状No: string | null;
};

/** 在庫移動指示を1件読む。無ければ null */
export function 在庫移動指示(在庫移動指示ID: string): 保存された在庫移動指示 | null {
  const rows = query(
    `select id as "在庫移動指示ID", move_from_base_info_id as "出庫元店舗ID", move_to_base_info_id as "入庫先店舗ID", tracking_no as "送り状No"
       from dtb_stock_move_instruction where id = $1::int`,
    [在庫移動指示ID],
  );
  if (rows.length === 0) return null;
  const r = rows[0];
  return { 在庫移動指示ID: r.在庫移動指示ID ?? "", 出庫元店舗ID: r.出庫元店舗ID ?? "", 入庫先店舗ID: r.入庫先店舗ID ?? "", 送り状No: r.送り状No };
}

/** 発送状況（送り状No.が空でなければ「済」、それ以外は「未」） */
export function 発送状況(指示: 保存された在庫移動指示): "済" | "未" {
  return 指示.送り状No !== null && 指示.送り状No.trim() !== "" ? "済" : "未";
}

export type 紐づく在庫移動の状態 = { 在庫移動ID: string; ステータス: string };

/** 在庫移動指示に紐づく在庫移動（在庫移動ID の昇順）と、そのステータスの名称 */
export function 紐づく在庫移動(在庫移動指示ID: string): 紐づく在庫移動の状態[] {
  return query(
    `select t.id as "在庫移動ID", s.status_name as "ステータス"
       from dtb_stock_move_transfer t
       join mtb_stock_move_transfer_status s on s.id = t.move_transfer_status_id
      where t.move_instruction_id = $1::int
      order by t.id`,
    [在庫移動指示ID],
  ).map((r) => ({ 在庫移動ID: r.在庫移動ID ?? "", ステータス: r.ステータス ?? "" }));
}

export type 送り状Noの形 = { バイト数: number; 文字数: number; 半角大文字Aだけ: boolean };

/** 長い送り状No.を、値そのものを持ち出さずに確かめる（バイト数・文字数・半角の A だけでできているか）。送り状No.が無ければ null */
export function 送り状Noの形(在庫移動指示ID: string): 送り状Noの形 | null {
  const rows = query(
    `select octet_length(tracking_no) as bytes, char_length(tracking_no) as chars, (tracking_no ~ '^A+$') as only_a
       from dtb_stock_move_instruction where id = $1::int and tracking_no is not null`,
    [在庫移動指示ID],
  );
  if (rows.length === 0) return null;
  return { バイト数: Number(rows[0].bytes), 文字数: Number(rows[0].chars), 半角大文字Aだけ: rows[0].only_a === "true" };
}
