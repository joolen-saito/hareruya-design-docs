/**
 * M04-08 在庫移動・振替検索一覧・M04-09 在庫移動・振替登録/編集 の DB 確認（参照だけ）。物理名は SQL の中にだけ書く。
 * 店舗は店名（試験店舗A・試験店舗B）、在庫区分は表示名（EC-CUBE・スマレジ）、商品は商品コードで指定する。
 */
import { query } from "../lib/db";

const ZONE: Record<string, number> = { "EC-CUBE": 1, "スマレジ": 2 };

export type 在庫移動振替 = {
  ID: string; ステータス: string; 移動タイプ: string; 出庫元店舗: string; 入庫先店舗: string; 出庫元在庫区分: string; 入庫先在庫区分: string;
  移動指示ID: string | null; メモ: string | null; 却下理由: string | null;
  出庫承認者: string | null; 出庫承認日: string | null; 入庫承認者: string | null; 入庫承認日: string | null;
  登録者: string | null; 更新者: string | null; 更新日: string | null;
};

const SELECT_MOVE = `
  select t.id as "ID", s.status_name as "ステータス", case t.move_transfer_type when 1 then '在庫移動' when 2 then '在庫振替' else t.move_transfer_type::text end as "移動タイプ",
         bf.shop_name as "出庫元店舗", bt.shop_name as "入庫先店舗",
         case t.move_from_stock_location_id when 1 then 'EC-CUBE' when 2 then 'スマレジ' else t.move_from_stock_location_id::text end as "出庫元在庫区分",
         case t.move_to_stock_location_id when 1 then 'EC-CUBE' when 2 then 'スマレジ' else t.move_to_stock_location_id::text end as "入庫先在庫区分",
         t.move_instruction_id::text as "移動指示ID", t.memo as "メモ", t.rejected_memo as "却下理由",
         mf.name as "出庫承認者", t.move_from_approval_at::text as "出庫承認日", mt.name as "入庫承認者", t.move_to_approval_at::text as "入庫承認日",
         mr.name as "登録者", mu.name as "更新者", t.update_date::text as "更新日"
    from dtb_stock_move_transfer t
    join mtb_stock_move_transfer_status s on s.id = t.move_transfer_status_id
    left join dtb_base_info bf on bf.id = t.move_from_base_info_id
    left join dtb_base_info bt on bt.id = t.move_to_base_info_id
    left join dtb_member mf on mf.id = t.move_from_approval_member_id
    left join dtb_member mt on mt.id = t.move_to_approval_member_id
    left join dtb_member mr on mr.id = t.registered_member_id
    left join dtb_member mu on mu.id = t.updated_member_id`;

/** 在庫移動・振替を1件読む。無ければ null */
export function 在庫移動振替(id: string): 在庫移動振替 | null {
  const rows = query(`${SELECT_MOVE} where t.id = $1::int`, [id]);
  return rows.length ? (rows[0] as unknown as 在庫移動振替) : null;
}

/** 長いメモ・却下理由を、値を持ち出さずに確かめる（文字数・半角の A だけでできているか） */
export function 長い文の形(id: string, 項目: "メモ" | "却下理由"): { 文字数: number; Aだけ: boolean } | null {
  const col = 項目 === "メモ" ? "memo" : "rejected_memo";
  const rows = query(`select char_length(${col}) as n, (${col} ~ '^A+$') as only_a from dtb_stock_move_transfer where id = $1::int and ${col} is not null`, [id]);
  if (!rows.length) return null;
  return { 文字数: Number(rows[0].n), Aだけ: rows[0].only_a === "true" };
}

/** 商品コードの商品（規格）を、出庫元または入庫先に持つ在庫移動・振替のID */
export function 商品の在庫移動振替(code: string): string[] {
  return query(
    `select distinct d.stock_move_transfer_id::text as id
       from dtb_stock_move_transfer_detail d
       join dtb_product_stock ps on ps.id in (d.move_from_product_stock_id, d.move_to_product_stock_id)
       join dtb_product_class pc on pc.id = ps.product_class_id
      where pc.product_code = $1 order by 1`,
    [code],
  ).map((r) => r.id ?? "");
}

export type 明細 = { 商品コード: string; 振替先商品コード: string; 移動点数: number; 欠品点数: number; 差分点数: number; 入庫点数: number; 出庫総原価: number; 登録時出庫元在庫: number | null };

/** 在庫移動・振替の明細（明細IDの順） */
export function 明細(id: string): 明細[] {
  return query(
    `select pf.product_code as "商品コード", pt.product_code as "振替先商品コード", d.move_transfer_quantity as q, d.stockout_quantity as so,
            d.difference_quantity as diff, d.move_to_quantity as mtq, d.outbound_total_cost as cost, d.move_from_stock_at_registration as reg
       from dtb_stock_move_transfer_detail d
       join dtb_product_stock sf on sf.id = d.move_from_product_stock_id
       join dtb_product_class pf on pf.id = sf.product_class_id
       join dtb_product_stock st on st.id = d.move_to_product_stock_id
       join dtb_product_class pt on pt.id = st.product_class_id
      where d.stock_move_transfer_id = $1::int order by d.id`,
    [id],
  ).map((r) => ({
    商品コード: r.商品コード ?? "", 振替先商品コード: r.振替先商品コード ?? "", 移動点数: Number(r.q), 欠品点数: Number(r.so), 差分点数: Number(r.diff),
    入庫点数: Number(r.mtq), 出庫総原価: Number(r.cost), 登録時出庫元在庫: r.reg === null ? null : Number(r.reg),
  }));
}

export type ステータス変更履歴 = { ステータス: string; 更新者: string; 更新日: string };

export function ステータス変更履歴(id: string): ステータス変更履歴[] {
  return query(
    `select s.status_name as "ステータス", m.name as "更新者", h.update_date::text as "更新日"
       from dtb_stock_move_transfer_status_history h
       join mtb_stock_move_transfer_status s on s.id = h.stock_move_transfer_status_id
       left join dtb_member m on m.id = h.update_member_id
      where h.stock_move_transfer_id = $1::int order by h.id`,
    [id],
  ).map((r) => ({ ステータス: r.ステータス ?? "", 更新者: r.更新者 ?? "", 更新日: r.更新日 ?? "" }));
}

/** 店舗名・在庫区分・商品コードの在庫（在庫数・総原価）。行が無ければ null */
export function 在庫(code: string, 店名: string, 区分: "EC-CUBE" | "スマレジ"): { 在庫: number; 総原価: number } | null {
  const rows = query(
    `select ps.stock::text as stock, ps.total_cost::text as cost
       from dtb_product_stock ps
       join dtb_product_class pc on pc.id = ps.product_class_id
       join dtb_base_info b on b.id = ps.base_info_id
      where pc.product_code = $1 and b.shop_name = $2 and ps.stock_location_id = $3::int`,
    [code, 店名, ZONE[区分]],
  );
  if (rows.length > 1) throw new Error(`在庫の行が ${rows.length} 件ある（${code}・${店名}・${区分}）`);
  if (!rows.length) return null;
  return { 在庫: Number(rows[0].stock), 総原価: Number(rows[0].cost) };
}

export type 在庫変動履歴 = {
  区分: string; 変更前在庫: number; 変更後在庫: number; 増減数: number | null; 変更前総原価: number | null; 変更後総原価: number | null;
  仕入総価格: number | null; 理由: string; 履歴登録元: string | null; 履歴登録元ID: string | null;
};

/** 店舗名・在庫区分・商品コードの在庫変動履歴（古い順） */
export function 在庫変動履歴(code: string, 店名: string, 区分: "EC-CUBE" | "スマレジ"): 在庫変動履歴[] {
  return query(
    `select d.child_name as "区分", h.old_stock as old, h.stock as new, h.stock_change_quantity as qty,
            h.total_cost_price_before as tb, h.total_cost_price_after as ta, h.buy_price as bp, h.stock_change_reason as reason,
            src.source_name as "履歴登録元", h.history_source_id::text as "履歴登録元ID"
       from dtb_stock_history h
       join dtb_product_stock ps on ps.id = h.product_stock_id
       join dtb_product_class pc on pc.id = ps.product_class_id
       join dtb_base_info b on b.id = ps.base_info_id
       join mtb_stock_change_type_detail d on d.id = h.stock_change_type_detail_id
       left join mtb_stock_history_source_type src on src.id = h.history_source_type
      where pc.product_code = $1 and b.shop_name = $2 and ps.stock_location_id = $3::int
      order by h.id`,
    [code, 店名, ZONE[区分]],
  ).map((r) => ({
    区分: r.区分 ?? "", 変更前在庫: Number(r.old), 変更後在庫: Number(r.new), 増減数: r.qty === null ? null : Number(r.qty),
    // 在庫変動履歴に「仕入総価格」の列は無い。この履歴で増減した総原価（変更後総原価 − 変更前総原価）の絶対値を仕入総価格とみなす（記録の注記）
    変更前総原価: r.tb === null ? null : Number(r.tb), 変更後総原価: r.ta === null ? null : Number(r.ta),
    仕入総価格: r.tb === null || r.ta === null ? null : Math.abs(Number(r.ta) - Number(r.tb)),
    理由: r.reason ?? "", 履歴登録元: r.履歴登録元, 履歴登録元ID: r.履歴登録元ID,
  }));
}

/** 在庫移動指示のうち、指定の在庫移動・振替を含むもの（在庫移動指示IDの昇順） */
export function 在庫移動指示(ids: string[]): { 移動指示ID: string; 在庫移動振替ID: string[] }[] {
  const rows = query(
    `select i.id::text as iid, string_agg(t.id::text, ',' order by t.id) as tids
       from dtb_stock_move_instruction i
       join dtb_stock_move_transfer t on t.move_instruction_id = i.id
      where i.id in (select move_instruction_id from dtb_stock_move_transfer where id = any(string_to_array($1, ',')::int[]))
      group by i.id order by i.id`,
    [ids.join(",")],
  );
  return rows.map((r) => ({ 移動指示ID: r.iid ?? "", 在庫移動振替ID: (r.tids ?? "").split(",").filter(Boolean) }));
}

/** 在庫移動指示の件数（全体） */
export function 在庫移動指示の最大ID(): number {
  return Number(query(`select coalesce(max(id), 0) as n from dtb_stock_move_instruction`)[0].n);
}
