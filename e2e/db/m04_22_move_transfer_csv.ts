/**
 * M04-22 在庫移動・振替CSV登録の DB確認（参照だけ）。物理名はここの SQL の中にだけ書く。
 * 在庫移動・振替の基本情報・状態履歴・在庫・在庫変動履歴の読み方は M04-09 の DB確認（db/m04_09_move.ts）を使い、
 * ここでは「明細の商品の名前と基準価格」「商品・在庫の番号」の照会だけを足す。
 */
import { query } from "../lib/db";

const ZONE: Record<string, number> = { "EC-CUBE": 1, "スマレジ": 2 };

export type 移動明細の商品 = { 商品コード: string; 商品名: string; 基準価格: number | null; 移動点数: number; 登録時出庫元在庫: number | null };

/** 在庫移動・振替の明細（明細IDの順）。出庫元の商品の商品コード・商品名・基準価格（規格の現在の値）と、移動点数・登録時の出庫元在庫数 */
export function 移動明細の商品一覧(id: string): 移動明細の商品[] {
  return query(
    `select pc.product_code as "商品コード", p.name as "商品名", pc.standard_price::text as sp,
            d.move_transfer_quantity::text as q, d.move_from_stock_at_registration::text as reg
       from dtb_stock_move_transfer_detail d
       join dtb_product_stock ps on ps.id = d.move_from_product_stock_id
       join dtb_product_class pc on pc.id = ps.product_class_id
       join dtb_product p on p.id = pc.product_id
      where d.stock_move_transfer_id = $1::int order by d.id`,
    [id],
  ).map((r) => ({
    商品コード: r.商品コード ?? "", 商品名: r.商品名 ?? "", 基準価格: r.sp === null ? null : Number(r.sp),
    移動点数: Number(r.q), 登録時出庫元在庫: r.reg === null ? null : Number(r.reg),
  }));
}

/** 商品コードの商品ID・商品規格ID（シード表が「控える」と書く番号） */
export function 商品の番号(code: string): { 商品ID: string; 商品規格ID: string } {
  const rows = query(`select p.id::text as pid, pc.id::text as cid from dtb_product_class pc join dtb_product p on p.id = pc.product_id where pc.product_code = $1`, [code]);
  if (rows.length !== 1) throw new Error(`商品コード ${code} の商品規格が ${rows.length} 件ある（1件のはず）`);
  return { 商品ID: rows[0].pid ?? "", 商品規格ID: rows[0].cid ?? "" };
}

/** 商品コード・店舗ID・在庫区分の在庫ID */
export function 在庫の番号(code: string, storeId: string, zone: "EC-CUBE" | "スマレジ"): string {
  const rows = query(
    `select ps.id::text as id from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id
      where pc.product_code = $1 and ps.base_info_id = $2::int and ps.stock_location_id = $3::int`,
    [code, storeId, ZONE[zone]],
  );
  if (rows.length !== 1) throw new Error(`商品コード ${code}・店舗ID ${storeId}・${zone} の在庫が ${rows.length} 件ある（1件のはず）`);
  return rows[0].id ?? "";
}

/** 明細の出庫元の商品コードの文字数と先頭6文字（長い商品コードの値そのものを持ち出さずに、登録された形を確かめる） */
export function 明細の商品コードの形(id: string): { 文字数: number; 先頭: string }[] {
  return query(
    `select char_length(pc.product_code)::text as n, left(pc.product_code, 6) as head
       from dtb_stock_move_transfer_detail d
       join dtb_product_stock ps on ps.id = d.move_from_product_stock_id
       join dtb_product_class pc on pc.id = ps.product_class_id
      where d.stock_move_transfer_id = $1::int order by d.id`,
    [id],
  ).map((r) => ({ 文字数: Number(r.n), 先頭: r.head ?? "" }));
}
