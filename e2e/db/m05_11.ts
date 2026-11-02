/** M05-11 受注情報編集のDB確認（SELECT だけ） */
import { query, Row } from "../lib/db";
import { RUN_MARK } from "../lib/run_marker";

/** 注文番号の受注の、確かめたい項目（日付は日時の文字列、無ければ null） */
export function 受注(注文番号: string): Row {
  const rows = query(
    `select o.id as "受注ID", s.name as "ステータス", o.name01 as "注文者姓", o.note as "ショップ用メモ",
            o.payment_date as "入金日", o.confirm_date as "注文確定日", o.otc_rsv_date as "店頭予約日", o.shipping_date as "出荷日",
            o.cancel_date as "キャンセル日", o.gained_points as "発生ポイント", o.email as "メール", m.name as "担当者"
       from dtb_order o left join mtb_order_status s on s.id = o.order_status_id left join dtb_member m on m.id = o.operator_id
      where o.order_number = $1 and o.base_info_id = 1 order by o.id desc limit 1`, [注文番号]);
  if (rows.length !== 1) throw new Error(`注文番号「${注文番号}」の受注が ${rows.length} 件（1件のはず）`);
  return rows[0];
}

/** 受注の配送先ごとの出荷日（配送情報の出荷日） */
export function 配送情報の出荷日(受注ID: string): (string | null)[] {
  return query(`select sh.shipping_date as "出荷日" from dtb_shipping sh where sh.order_id = $1 order by sh.id`, [受注ID]).map((r) => r.出荷日);
}

/** 受注に対する手動変更履歴の件数 */
export function 手動変更履歴の件数(受注ID: string): number {
  return Number(query(`select count(*) as n from dtb_order_history h where h.order_id = $1 and h.source = 'admin'`, [受注ID])[0].n);
}

/** 受注の問い合わせ（注文者の問い合わせ欄の保存値） */
export function 問い合わせ(注文番号: string): string {
  const rows = query(`select o.message as "問い合わせ" from dtb_order o where o.order_number = $1 and o.base_info_id = 1 order by o.id desc limit 1`, [注文番号]);
  if (rows.length !== 1) throw new Error(`注文番号「${注文番号}」の受注が ${rows.length} 件（1件のはず）`);
  return rows[0].問い合わせ ?? "";
}

const 項目 = ["name01", "name02", "kana01", "kana02", "company_name", "postal_code", "abroad_postal_code", "addr01", "addr02", "addr03", "tel01", "tel02", "tel03", "fax01", "fax02", "fax03"];

/** 注文者（受注）の項目の保存値。キーは項目名（name01 など） */
export function 注文者の項目(注文番号: string): Record<string, string> {
  const rows = query(`select ${項目.map((c) => `coalesce(o.${c}, '') as "${c}"`).join(", ")}, coalesce(o.message, '') as "message" from dtb_order o where o.order_number = $1 and o.base_info_id = 1 order by o.id desc limit 1`, [注文番号]);
  if (rows.length !== 1) throw new Error(`注文番号「${注文番号}」の受注が無い`);
  return rows[0] as Record<string, string>;
}

/** お届け先（配送）の項目の保存値（最初の配送先） */
export function お届け先の項目(注文番号: string): Record<string, string> {
  const rows = query(`select ${項目.map((c) => `coalesce(s.${c}, '') as "${c}"`).join(", ")} from dtb_shipping s join dtb_order o on o.id = s.order_id where o.order_number = $1 and o.base_info_id = 1 order by o.id desc, s.id limit 1`, [注文番号]);
  if (rows.length !== 1) throw new Error(`注文番号「${注文番号}」のお届け先が無い`);
  return rows[0] as Record<string, string>;
}

/** 受注の会員の保持ポイント */
export function 会員ポイント(注文番号: string): number {
  const rows = query(`select p.point as "ポイント" from dtb_order o join dtb_player p on p.customer_id = o.customer_id where o.order_number = $1 and o.base_info_id = 1 order by o.id desc limit 1`, [注文番号]);
  if (rows.length !== 1) throw new Error(`注文番号「${注文番号}」の会員のポイントが引けない`);
  return Number(rows[0].ポイント);
}

/** 受注の全項目（比べるための文字列。項目名順） */
export function 受注の全項目(注文番号: string): Record<string, string | null> {
  const rows = query(`select o.* from dtb_order o where o.order_number = $1 and o.base_info_id = 1 order by o.id desc limit 1`, [注文番号]);
  if (rows.length !== 1) throw new Error(`注文番号「${注文番号}」の受注が無い`);
  return rows[0];
}

/** 受注の商品明細（商品コード順）。数量・価格・総原価 */
export function 受注明細(注文番号: string): { 商品コード: string; 数量: string; 価格: string; 総原価: string; 欠品数量: string }[] {
  return query(
    `select i.product_code as "商品コード", i.quantity::text as "数量", i.price::text as "価格", coalesce(i.total_cost, 0)::text as "総原価", coalesce(i.stockout, 0)::text as "欠品数量"
       from dtb_order_item i join dtb_order o on o.id = i.order_id
      where o.order_number = $1 and o.base_info_id = 1 and o.id = (select max(o2.id) from dtb_order o2 where o2.order_number = $1 and o2.base_info_id = 1)
        and i.order_item_type_id = 1 order by i.product_code`, [注文番号]) as { 商品コード: string; 数量: string; 価格: string; 総原価: string; 欠品数量: string }[];
}

/** 商品コードの規格の、本店・EC-CUBE の在庫数と在庫の総原価（合計） */
export function 商品の在庫(商品コード: string): { 在庫: number; 総原価: number } {
  const r = query(
    `select coalesce(sum(s.stock), 0)::text as "在庫", coalesce(sum(s.total_cost), 0)::text as "総原価"
       from dtb_product_stock s join dtb_product_class pc on pc.id = s.product_class_id where pc.product_code = $1`, [商品コード])[0];
  return { 在庫: Number(r.在庫), 総原価: Number(r.総原価) };
}

/** 商品コードの規格の在庫変動履歴（古い順）。増減数・理由 */
export function 在庫変動履歴(商品コード: string): { 増減数: number; 理由: string }[] {
  return query(
    `select h.stock_change_quantity::text as "増減数", coalesce(h.stock_change_reason, '') as "理由"
       from dtb_stock_history h join dtb_product_stock s on s.id = h.product_stock_id join dtb_product_class pc on pc.id = s.product_class_id
      where pc.product_code = $1 order by h.id`, [商品コード]).map((r) => ({ 増減数: Number(r.増減数), 理由: r.理由 ?? "" }));
}

/** この実行で作った商品（商品コードの末尾が実行の印）が属するカテゴリのID。無ければ受注の最初の商品のカテゴリ。どちらも無ければ null */
export function 受注の商品のカテゴリID(注文番号: string): string | null {
  const own = query(
    `select pc.category_id::text as "c" from dtb_product_category pc join dtb_product_class k on k.product_id = pc.product_id
      where k.product_code like $1 order by pc.product_id desc limit 1`, [`%-${RUN_MARK}`]);
  if (own[0]?.c) return own[0].c;
  const r = query(
    `select pc.category_id::text as "c" from dtb_order_item i join dtb_order o on o.id = i.order_id join dtb_product_category pc on pc.product_id = i.product_id
      where o.order_number = $1 and o.base_info_id = 1 and i.order_item_type_id = 1 order by o.id desc, i.id limit 1`, [注文番号]);
  return r[0]?.c ?? null;
}

/** お届け先の お届け日・お届け時間・送り状No.（空は ""） */
export function お届け先の配送項目(注文番号: string): { お届け日: string; お届け時間: string; 送り状No: string } {
  const r = query(
    `select coalesce(s.delivery_date::text, '') as "d", coalesce(s.delivery_time, '') as "t", coalesce(o.invoice_number, '') as "n"
       from dtb_shipping s join dtb_order o on o.id = s.order_id where o.order_number = $1 and o.base_info_id = 1 order by o.id desc, s.id limit 1`, [注文番号])[0];
  return { お届け日: r?.d ?? "", お届け時間: r?.t ?? "", 送り状No: r?.n ?? "" };
}
