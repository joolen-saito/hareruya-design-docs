/**
 * M07-03 買取情報編集の DB 確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 * 実行区分が「ブラウザ+DB確認」のケースだけが使う。
 */
import { query } from "../lib/db";

function 数字(s: string): string {
  if (!/^\d+$/.test(s)) throw new Error(`買取番号が数字でない（${s}）`);
  return String(Number(s));
}

export type 買取の値 = {
  買取状況: string; 送料: string; メモ: string; 振込依頼可能: boolean; 振込失敗: boolean;
  住所3: string; 電話番号: string; 生年月日: string; 職業: string; 都道府県: string; 身分証明書: string;
  事業者: boolean; 事業者番号: string; 口座番号: string; 口座種別: string; 査定金額合計: string; 最終更新者: string;
};

const 真 = (v: string | null) => v === "true" || v === "1" || v === "t";

/** 買取番号の買取情報（依頼者・口座・事業者・フラグ・送料・メモ・最終更新者のログインID） */
export function 買取の値を読む(買取番号: string): 買取の値 {
  const r = query(
    `select s.name as status, b.delivery_fee, b.memo, b.can_transfer_request_flg, b.transfer_failed_flg, b.addr03, b.tel_no,
            to_char(b.birth, 'YYYY-MM-DD') as birth, j.name as job, p.name as pref, i.name as ident,
            b.qualified_invoice_issuer_flg, q.qualified_invoice_issuer_code as code, ba.account_no, ba.account_type,
            b.total_price, m.login_id
       from dtb_buy_order b
       join mtb_buy_order_status s on s.id = b.buy_order_status_id
       left join mtb_job j on j.id = b.job_id
       left join mtb_pref p on p.id = b.pref_id
       left join mtb_identification i on i.id = b.identification_id
       left join dtb_qualified_invoice_issuer_account q on q.id = b.qualified_invoice_issuer_account_id
       left join dtb_bank_account ba on ba.id = b.bank_account_id
       left join dtb_member m on m.id = b.member_id
      where b.id = $1`, [数字(買取番号)],
  )[0];
  if (!r) throw new Error(`買取番号 ${買取番号} の買取情報が無い`);
  const n = (v: string | null) => (v === null ? "" : String(Number(v)));
  return {
    買取状況: r.status ?? "", 送料: n(r.delivery_fee), メモ: r.memo ?? "", 振込依頼可能: 真(r.can_transfer_request_flg), 振込失敗: 真(r.transfer_failed_flg),
    住所3: r.addr03 ?? "", 電話番号: r.tel_no ?? "", 生年月日: r.birth ?? "", 職業: r.job ?? "", 都道府県: r.pref ?? "", 身分証明書: r.ident ?? "",
    事業者: 真(r.qualified_invoice_issuer_flg), 事業者番号: r.code ?? "", 口座番号: r.account_no ?? "", 口座種別: r.account_type ?? "",
    査定金額合計: n(r.total_price), 最終更新者: r.login_id ?? "",
  };
}

export type 明細 = { 商品コード: string; 査定価格: string; 数量: string; 売却: "する" | "しない" | "未定" };

/** 買取番号の選んで買取の明細（商品コードは商品の規格の商品コードの最小） */
export function 選んで買取の明細(買取番号: string): 明細[] {
  return query(
    `select (select min(pc.product_code) from dtb_product_class pc where pc.product_id = c.product_id) as code, c.price, c.count, c.sale_flg
       from dtb_buy_main_card c where c.buy_order_id = $1 and c.purchase_category = 1 order by c.id`, [数字(買取番号)],
  ).map((r) => ({
    商品コード: r.code ?? "", 査定価格: r.price === null ? "" : String(Number(r.price)), 数量: r.count === null ? "" : String(Number(r.count)),
    売却: r.sale_flg === null ? "未定" : 真(r.sale_flg) ? "する" : "しない",
  }));
}

/** 買取番号のステータス変更履歴のうち、買取状況の名前の件数 */
export function 履歴の件数(買取番号: string, 状況: string): number {
  return Number(query(
    `select count(*) as n from dtb_buy_order_status_histry h join mtb_buy_order_status s on s.id = h.buy_order_status_id
      where h.buy_order_id = $1 and s.name = $2`, [数字(買取番号), 状況],
  )[0].n);
}

export type 実在庫 = { 商品コード: string; 数量: number; 小計: number };

/** 買取番号の実在庫情報（商品コード順） */
export function 実在庫を読む(買取番号: string): 実在庫[] {
  return query(
    `select pc.product_code as code, s.quantity, s.subtotal from dtb_buy_order_stock s join dtb_product_class pc on pc.id = s.product_class_id
      where s.buy_order_id = $1 order by pc.product_code, s.id`, [数字(買取番号)],
  ).map((r) => ({ 商品コード: r.code ?? "", 数量: Number(r.quantity), 小計: Number(r.subtotal) }));
}

/** 買取番号の実在庫情報の変更履歴（古い順） */
export function 実在庫履歴を読む(買取番号: string): { 商品コード: string; 変更前: number | null; 変更後: number }[] {
  return query(
    `select pc.product_code as code, h.before_quantity, h.after_quantity
       from dtb_buy_order_stock_history h join dtb_buy_order_stock s on s.id = h.buy_order_stock_id
       join dtb_product_class pc on pc.id = s.product_class_id
      where s.buy_order_id = $1 order by h.id`, [数字(買取番号)],
  ).map((r) => ({ 商品コード: r.code ?? "", 変更前: r.before_quantity === null ? null : Number(r.before_quantity), 変更後: Number(r.after_quantity) }));
}

/** 商品コードの、本店（店舗ID 1）・EC-CUBE の在庫（無ければ null） */
export function 本店の在庫(商品コード: string): { 在庫: number; 総原価: number } | null {
  const r = query(
    `select ps.stock, ps.total_cost from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id
      where pc.product_code = $1 and ps.base_info_id = 1 and ps.stock_location_id = 1`, [商品コード],
  );
  if (r.length === 0) return null;
  return { 在庫: Number(r[0].stock), 総原価: Number(r[0].total_cost) };
}

export type 在庫履歴 = { 登録元: string; 在庫変動区分: string; 登録元ID: string; 理由: string; 仕入単価: string; 増減数: number; 変更後原価単価: string };

/** 商品コードの、本店（店舗ID 1）・EC-CUBE の在庫の在庫履歴（古い順） */
export function 本店の在庫履歴(商品コード: string): 在庫履歴[] {
  return query(
    `select st.source_name as src, d.child_name as kind, h.history_source_id, h.stock_change_reason, h.buy_price, h.stock_change_quantity, h.unit_cost_price_after
       from dtb_stock_history h join dtb_product_stock ps on ps.id = h.product_stock_id
       join dtb_product_class pc on pc.id = ps.product_class_id
       left join mtb_stock_history_source_type st on st.id = h.history_source_type
       left join mtb_stock_change_type_detail d on d.id = h.stock_change_type_detail_id
      where pc.product_code = $1 and ps.base_info_id = 1 and ps.stock_location_id = 1 order by h.id`, [商品コード],
  ).map((r) => ({
    登録元: r.src ?? "", 在庫変動区分: r.kind ?? "", 登録元ID: r.history_source_id ?? "", 理由: r.stock_change_reason ?? "",
    仕入単価: r.buy_price === null ? "" : String(Number(r.buy_price)), 増減数: Number(r.stock_change_quantity),
    変更後原価単価: r.unit_cost_price_after === null ? "" : String(Number(r.unit_cost_price_after)),
  }));
}
