/**
 * M04-09 在庫移動・振替登録/編集の DB 確認（参照だけ）の続き。明細の欠品・差分の登録者と、保存されたメンバーの番号。
 * 物理名は SQL の中にだけ書く。
 */
import { query } from "../lib/db";

export type 明細の担当者 = { 商品コード: string; 商品名: string; 欠品点数: number; 欠品登録者: string | null; 差分点数: number; 差分登録者: string | null };

/** 明細ごとの商品・欠品点数・欠品登録者・差分点数・差分登録者（明細IDの順） */
export function 明細の担当者(id: string): 明細の担当者[] {
  return query(
    `select pf.product_code as "商品コード", p.name as "商品名", d.stockout_quantity as so, ms.name as "欠品登録者", d.difference_quantity as diff, md.name as "差分登録者"
       from dtb_stock_move_transfer_detail d
       join dtb_product_stock sf on sf.id = d.move_from_product_stock_id
       join dtb_product_class pf on pf.id = sf.product_class_id
       join dtb_product p on p.id = pf.product_id
       left join dtb_member ms on ms.id = d.stockout_member_id
       left join dtb_member md on md.id = d.difference_member_id
      where d.stock_move_transfer_id = $1::int order by d.id`,
    [id],
  ).map((r) => ({
    商品コード: r.商品コード ?? "", 商品名: r.商品名 ?? "", 欠品点数: Number(r.so), 欠品登録者: r.欠品登録者, 差分点数: Number(r.diff), 差分登録者: r.差分登録者,
  }));
}

/** 在庫移動情報・明細・ステータス変更履歴に保存されているメンバーの番号（どの欄か・番号。空の欄は番号が null） */
export function 保存されたメンバーの番号(id: string): { 場所: string; 番号: string | null }[] {
  return query(
    `select '在庫移動情報の出庫承認者' as "場所", t.move_from_approval_member_id::text as "番号" from dtb_stock_move_transfer t where t.id = $1::int
     union all select '在庫移動情報の入庫承認者', t.move_to_approval_member_id::text from dtb_stock_move_transfer t where t.id = $1::int
     union all select '在庫移動情報の登録者', t.registered_member_id::text from dtb_stock_move_transfer t where t.id = $1::int
     union all select '在庫移動情報の更新者', t.updated_member_id::text from dtb_stock_move_transfer t where t.id = $1::int
     union all select '明細の欠品登録者', d.stockout_member_id::text from dtb_stock_move_transfer_detail d where d.stock_move_transfer_id = $1::int
     union all select '明細の差分登録者', d.difference_member_id::text from dtb_stock_move_transfer_detail d where d.stock_move_transfer_id = $1::int
     union all select 'ステータス変更履歴の更新者', h.update_member_id::text from dtb_stock_move_transfer_status_history h where h.stock_move_transfer_id = $1::int`,
    [id],
  ).map((r) => ({ 場所: r.場所 ?? "", 番号: r.番号 }));
}
