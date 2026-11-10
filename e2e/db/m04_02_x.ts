/**
 * M04-02 在庫編集の続き（-x）の DB 確認と、E2E が作った行への書き足し。物理名はこのファイルの SQL の中にだけ書く。
 * - 書き足すのは、画面で作った在庫（実行の印つきの商品コードの規格の在庫）の在庫数・総原価だけ（依頼者決定 2026-11-10「E2E が作った行だけ書いてよい」）。
 * - 照会は参照だけ（lib/db.ts）。
 */
import { query } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

/** 実行の印つきの商品コード（この回の E2E の規格）に付く在庫だけを返す、持ち主の確かめ */
const 自分の在庫 = {
  sql: `select ps.id from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id
         where pc.product_code like '%-' || $1`,
  params: [RUN_MARK],
};

/** 開発環境に既にある、商品の付いていないカード詳細のうち、Foil の区分が「通常」（区分1）のものを1件（カードのマスタは新しく作らない） */
export function 商品の無いFoil通常のカード詳細(): { カード詳細ID: string; カード名: string } {
  const r = query(
    `select d.id, c.name_jp from mtb_card_detail d join mtb_card c on c.id = d.card_id
      where d.foil_flg = 1 and coalesce(c.name_jp, '') <> ''
        and not exists (select 1 from dtb_product p where p.card_detail_id = d.id)
      order by d.id desc limit 1`,
  )[0];
  if (!r) throw new Error("商品の付いていない、Foil が「通常」のカード詳細が開発環境に無い");
  return { カード詳細ID: String(r.id), カード名: String(r.name_jp) };
}

/** 規格（商品コード）と店舗・在庫区分（EC-CUBE）の在庫ID */
export function 在庫IDの(商品コード: string, 店舗ID: string): string {
  const r = query(
    `select ps.id from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id
      where pc.product_code = $1 and ps.base_info_id = $2 and ps.stock_location_id = 1`,
    [商品コード, 店舗ID],
  );
  if (r.length !== 1) throw new Error(`商品コード ${商品コード}・店舗ID ${店舗ID}・EC-CUBE の在庫が ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}

/** 在庫の在庫数・総原価 */
export function 在庫の(在庫ID: string): { 在庫数: number; 総原価: number } {
  const r = query(`select stock, total_cost from dtb_product_stock where id = $1`, [在庫ID])[0];
  if (!r) throw new Error(`在庫ID ${在庫ID} の在庫が無い`);
  return { 在庫数: Number(r.stock), 総原価: Number(r.total_cost) };
}

/** 画面で作った E2E の規格の在庫に、在庫数・総原価を書き足す（画面では指定できない。シード表の投入方法のとおり） */
export function 在庫数と総原価を整える(what: string, 在庫ID: string, 在庫数: number, 総原価: number): void {
  updateOwnRows(what, { table: "dtb_product_stock", key: "id", ids: [在庫ID], set: { stock: 在庫数, total_cost: 総原価 }, owner: 自分の在庫 });
}

export type 承認情報 = {
  承認ID: string; 承認状態: number; 承認対象: string; 店舗ID: string; 在庫区分: string; 対象商品規格数: number; 合計在庫増減数: number;
  合計総原価増減数: number; 在庫変動区分: string; 在庫変動理由: string[]; 登録日: string; 登録者: string; 承認日: string | null; 承認者: string | null;
  変更前総原価: string | null;
};

/** 在庫に関係する在庫編集承認情報（承認一覧の行と、在庫編集の承認の見出し。登録の新しい順） */
export function 在庫の承認情報(在庫ID: string): 承認情報[] {
  return query(
    `select a.id, a.approval_status, coalesce(st.source_name, '') as source_name, a.base_info_id, (case l.stock_location_id when 1 then 'EC-CUBE' when 2 then 'スマレジ' else '' end) as location,
            coalesce(l.product_stock_total_count, 0) as product_count, coalesce(l.inventory_change_total_count, 0) as qty,
            (select coalesce(sum(d2.outbound_total_cost), 0) from dtb_stock_edit_approval_detail d2 where d2.stock_edit_approval_id = a.id) as cost,
            coalesce(t.name, '') || '/' || coalesce(td.child_name, '') as change_type,
            (select string_agg(d3.stock_change_reason, E'\\n' order by d3.id) from dtb_stock_edit_approval_detail d3 where d3.stock_edit_approval_id = a.id) as reasons,
            to_char(a.registered_at at time zone 'Asia/Tokyo', 'YYYY-MM-DD') as registered_on, rm.name as registrant,
            a.approved_at, am.name as approver, l.total_cost_price_before
       from dtb_stock_edit_approval a
       left join dtb_stock_approval_list l on l.history_source_id = a.id and l.history_source_type_id = 1
       left join mtb_stock_history_source_type st on st.id = l.history_source_type_id
       left join mtb_stock_change_type_detail td on td.id = a.stock_change_type_detail_id
       left join mtb_stock_change_type t on t.id = td.stock_change_type_id
       left join dtb_member rm on rm.id = a.registered_member_id
       left join dtb_member am on am.id = a.approval_member_id
      where exists (select 1 from dtb_stock_edit_approval_detail d where d.stock_edit_approval_id = a.id and d.product_stock_id = $1)
      order by a.id desc`,
    [在庫ID],
  ).map((r) => ({
    承認ID: String(r.id), 承認状態: Number(r.approval_status), 承認対象: String(r.source_name), 店舗ID: String(r.base_info_id),
    在庫区分: String(r.location), 対象商品規格数: Number(r.product_count), 合計在庫増減数: Number(r.qty), 合計総原価増減数: Number(r.cost),
    在庫変動区分: String(r.change_type), 在庫変動理由: String(r.reasons ?? "").split("\n"), 登録日: String(r.registered_on ?? ""),
    登録者: String(r.registrant ?? ""), 承認日: r.approved_at, 承認者: r.approver, 変更前総原価: r.total_cost_price_before,
  }));
}

export type 承認待ちの明細 = {
  明細ID: string; 承認ID: string; 承認状態: number; 商品コード: string; 商品名: string; 言語: string; 状態: string; 店舗ID: string; 在庫区分: string;
  在庫変動区分: string; 在庫変動理由: string; 在庫増減数: number; 仕入単価: number | null; 総原価増減数: number | null;
  登録日時: string; 更新日時: string; 登録者: string; 更新者: string; 変更前仕入単価: string | null;
};

/** 在庫に関係する入庫承認待ち在庫情報（在庫編集の承認の明細。登録の新しい順） */
export function 在庫の承認待ちの明細(在庫ID: string): 承認待ちの明細[] {
  return query(
    `select d.id, d.stock_edit_approval_id, a.approval_status, pc.product_code, p.name as product_name, coalesce(lg.name_jp, '') as language,
            coalesce(cc.code, '') as condition, ps.base_info_id, (case ps.stock_location_id when 1 then 'EC-CUBE' when 2 then 'スマレジ' else '' end) as location,
            coalesce(t.name, '') || '/' || coalesce(td.child_name, '') as change_type, d.stock_change_reason, d.edit_quantity,
            d.purchase_unit_price, d.outbound_total_cost, d.create_date, d.update_date, rm.name as registrant, um.name as updater,
            d.before_purchase_unit_price
       from dtb_stock_edit_approval_detail d
       join dtb_stock_edit_approval a on a.id = d.stock_edit_approval_id
       join dtb_product_stock ps on ps.id = d.product_stock_id
       join dtb_product_class pc on pc.id = ps.product_class_id
       join dtb_product p on p.id = pc.product_id
       left join mtb_language lg on lg.id = pc.language_id
       left join mtb_card_condition cc on cc.id = pc.card_condition_id
       left join mtb_stock_change_type_detail td on td.id = a.stock_change_type_detail_id
       left join mtb_stock_change_type t on t.id = td.stock_change_type_id
       left join dtb_member rm on rm.id = a.registered_member_id
       left join dtb_member um on um.id = d.member_id
      where d.product_stock_id = $1
      order by d.id desc`,
    [在庫ID],
  ).map((r) => ({
    明細ID: String(r.id), 承認ID: String(r.stock_edit_approval_id), 承認状態: Number(r.approval_status), 商品コード: String(r.product_code),
    商品名: String(r.product_name), 言語: String(r.language), 状態: String(r.condition), 店舗ID: String(r.base_info_id), 在庫区分: String(r.location),
    在庫変動区分: String(r.change_type), 在庫変動理由: String(r.stock_change_reason ?? ""), 在庫増減数: Number(r.edit_quantity),
    仕入単価: r.purchase_unit_price === null ? null : Number(r.purchase_unit_price),
    総原価増減数: r.outbound_total_cost === null ? null : Number(r.outbound_total_cost),
    登録日時: String(r.create_date ?? ""), 更新日時: String(r.update_date ?? ""), 登録者: String(r.registrant ?? ""), 更新者: String(r.updater ?? ""),
    変更前仕入単価: r.before_purchase_unit_price,
  }));
}

export type 変動履歴 = {
  履歴ID: string; 承認ID: string | null; 商品コード: string; 商品名: string; 言語: string; 状態: string; 店舗ID: string; 在庫区分: string;
  在庫変動区分: string; 在庫変動理由: string; 在庫増減数: number; 変更前在庫: number | null; 変更後在庫: number | null;
  変更前総原価: number | null; 変更後総原価: number | null; 総原価増減数: number | null; 変更時販売価格: number | null; 履歴登録元: string;
  登録日時: string; 更新日時: string; 登録者: string; 更新者: string; 承認日時: string | null;
};

/** 在庫の在庫変動履歴（新しい順）。承認IDは、履歴登録元が在庫編集のときの登録元の番号 */
export function 在庫の変動履歴(在庫ID: string): 変動履歴[] {
  return query(
    `select h.id, case when h.history_source_type = 1 then h.history_source_id end as approval_id, pc.product_code, p.name as product_name,
            coalesce(lg.name_jp, '') as language, coalesce(cc.code, '') as condition, ps.base_info_id, (case ps.stock_location_id when 1 then 'EC-CUBE' when 2 then 'スマレジ' else '' end) as location,
            coalesce(t.name, '') || '/' || coalesce(td.child_name, '') as change_type, h.stock_change_reason, h.stock_change_quantity,
            h.old_stock, h.stock, h.total_cost_price_before, h.total_cost_price_after, h.sell_price, coalesce(st.source_name, '') as source_name,
            h.registered_at, h.update_date, rm.name as registrant, um.name as updater, h.approval_at
       from dtb_stock_history h
       join dtb_product_stock ps on ps.id = h.product_stock_id
       join dtb_product_class pc on pc.id = ps.product_class_id
       join dtb_product p on p.id = pc.product_id
       left join mtb_language lg on lg.id = pc.language_id
       left join mtb_card_condition cc on cc.id = pc.card_condition_id
       left join mtb_stock_change_type_detail td on td.id = h.stock_change_type_detail_id
       left join mtb_stock_change_type t on t.id = td.stock_change_type_id
       left join mtb_stock_history_source_type st on st.id = h.history_source_type
       left join dtb_member rm on rm.id = h.registered_member_id
       left join dtb_member um on um.id = h.update_member_id
      where h.product_stock_id = $1
      order by h.id desc`,
    [在庫ID],
  ).map((r) => {
    const n = (v: unknown) => (v === null || v === undefined ? null : Number(v));
    const before = n(r.total_cost_price_before), after = n(r.total_cost_price_after);
    return {
      履歴ID: String(r.id), 承認ID: r.approval_id === null ? null : String(r.approval_id), 商品コード: String(r.product_code), 商品名: String(r.product_name),
      言語: String(r.language), 状態: String(r.condition), 店舗ID: String(r.base_info_id), 在庫区分: String(r.location), 在庫変動区分: String(r.change_type),
      在庫変動理由: String(r.stock_change_reason ?? ""), 在庫増減数: Number(r.stock_change_quantity), 変更前在庫: n(r.old_stock), 変更後在庫: n(r.stock),
      変更前総原価: before, 変更後総原価: after, 総原価増減数: before === null || after === null ? null : after - before, 変更時販売価格: n(r.sell_price),
      履歴登録元: String(r.source_name), 登録日時: String(r.registered_at ?? ""), 更新日時: String(r.update_date ?? ""), 登録者: String(r.registrant ?? ""),
      更新者: String(r.updater ?? ""), 承認日時: r.approval_at,
    };
  });
}

/** 在庫編集の承認に対応する、在庫編集承認一覧の行の番号（一覧の選択欄の値） */
export function 承認一覧の行の番号(承認ID: string): string {
  const r = query(`select id from dtb_stock_approval_list where history_source_type_id = 1 and history_source_id = $1`, [承認ID]);
  if (r.length !== 1) throw new Error(`在庫編集の承認 ${承認ID} の承認一覧の行が ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}
