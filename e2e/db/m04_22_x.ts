/**
 * M04-22 在庫移動・振替CSV登録（見直し分 -x）の DB 確認と、画面で作れない状態の書き足し。物理名は SQL の中にだけ書く。
 *
 * - 店舗は店舗ID で指定する（開発環境には同じ店名「店舗A」「店舗B」の店舗がほかにもある。店名では引かない）。
 * - 在庫区分は表示名（EC-CUBE・スマレジ）、商品は商品コード（実行の印つき）で指定する。
 * - 件数を数えるときは、E2E の商品・E2E のメンバーに関係する行だけを数える（共有の開発環境では、ほかの方の在庫移動も増える）。
 * - 書き足すのは、画面で作った E2E の商品の在庫の在庫数だけ（016 の 999999999。lib/db_write.ts）。
 */
import { query } from "../lib/db";
import { updateOwnRows } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

export type 在庫区分 = "EC-CUBE" | "スマレジ";
const ZONE: Record<在庫区分, number> = { "EC-CUBE": 1, "スマレジ": 2 };
const ZONE_NAME = `case %s when 1 then 'EC-CUBE' when 2 then 'スマレジ' else %s::text end`;
const zoneName = (col: string) => ZONE_NAME.replace(/%s/g, col);

// ---------------------------------------------------------------- 商品・在庫の番号（シードが控える）

/** 商品コードの商品ID・商品規格ID。無い・複数あれば止める */
export function 商品の番号(商品コード: string): { 商品ID: string; 商品規格ID: string } {
  const r = query(`select pc.product_id::text as pid, pc.id::text as cid from dtb_product_class pc where pc.product_code = $1`, [商品コード]);
  if (r.length !== 1) throw new Error(`商品コード ${商品コード} の商品規格が ${r.length} 件（1件のはず）`);
  return { 商品ID: r[0].pid ?? "", 商品規格ID: r[0].cid ?? "" };
}

/** 商品コードの商品規格の件数 */
export function 商品規格の件数(商品コード: string): number {
  return Number(query(`select count(*) as n from dtb_product_class where product_code = $1`, [商品コード])[0].n);
}

/** 商品コード・店舗ID・在庫区分の在庫（在庫ID・在庫数・総原価）。行が無ければ null */
export function 在庫(商品コード: string, 店舗ID: string, 区分: 在庫区分): { 在庫ID: string; 在庫数: number; 総原価: number } | null {
  const r = query(
    `select ps.id::text as id, ps.stock::text as stock, ps.total_cost::text as cost
       from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id
      where pc.product_code = $1 and ps.base_info_id = $2::int and ps.stock_location_id = $3::int`,
    [商品コード, 店舗ID, ZONE[区分]],
  );
  if (r.length > 1) throw new Error(`在庫の行が ${r.length} 件ある（${商品コード}・店舗ID ${店舗ID}・${区分}）`);
  if (!r.length) return null;
  return { 在庫ID: r[0].id ?? "", 在庫数: Number(r[0].stock), 総原価: Number(r[0].cost) };
}

/** 実行の印の付いた商品コードの商品規格の在庫（持ち主の確かめ） */
const 印の在庫 = {
  sql: `select ps.id from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id where pc.product_code like '%' || $1`,
  params: [`-${RUN_MARK}`],
};

/** 画面で作った E2E の商品の在庫に、在庫数を書き足す（画面では 999999999 を指定できない。シード表の投入方法のとおり DB で設定する） */
export function 在庫数を書き足す(what: string, 在庫ID: string, 在庫数: number): void {
  updateOwnRows(what, { table: "dtb_product_stock", key: "id", ids: [在庫ID], set: { stock: 在庫数 }, owner: 印の在庫 });
}

// ---------------------------------------------------------------- マスター（導入時の初期データ）

/** 在庫移動・振替のステータスの名前（番号の順） */
export function 移動振替のステータス(): { 番号: string; 名前: string }[] {
  return query(`select id::text as id, status_name from mtb_stock_move_transfer_status order by id`).map((r) => ({ 番号: r.id ?? "", 名前: r.status_name ?? "" }));
}

/** 在庫変動区分（詳細）の名前のうち、移動・振替に関するもの */
export function 移動の在庫変動区分(): string[] {
  return query(`select child_name from mtb_stock_change_type_detail where child_name like '%移動%' or child_name like '%振替%' order by id`).map((r) => r.child_name ?? "");
}

// ---------------------------------------------------------------- 在庫移動・振替

export type 移動振替 = {
  ID: string; 移動タイプ: string; ステータス: string;
  出庫元店舗ID: string; 出庫元在庫区分: string; 入庫先店舗ID: string; 入庫先在庫区分: string;
  登録者のログインID: string; 登録者: string; 更新者: string;
};

/** 商品コードの商品の在庫を、出庫元または入庫先に持つ在庫移動・振替（IDの昇順） */
export function 商品の移動振替(商品コード: string): 移動振替[] {
  return query(
    `select t.id::text as id,
            case t.move_transfer_type when 1 then '在庫移動' when 2 then '在庫振替' else t.move_transfer_type::text end as kind,
            s.status_name as status,
            t.move_from_base_info_id::text as from_id, ${zoneName("t.move_from_stock_location_id")} as from_zone,
            t.move_to_base_info_id::text as to_id, ${zoneName("t.move_to_stock_location_id")} as to_zone,
            coalesce(mr.login_id, '') as reg_login, coalesce(mr.name, '') as reg_name, coalesce(mu.name, '') as upd_name
       from dtb_stock_move_transfer t
       join mtb_stock_move_transfer_status s on s.id = t.move_transfer_status_id
       left join dtb_member mr on mr.id = t.registered_member_id
       left join dtb_member mu on mu.id = t.updated_member_id
      where t.id in (select d.stock_move_transfer_id from dtb_stock_move_transfer_detail d
                       join dtb_product_stock ps on ps.id in (d.move_from_product_stock_id, d.move_to_product_stock_id)
                       join dtb_product_class pc on pc.id = ps.product_class_id
                      where pc.product_code = $1)
      order by t.id`,
    [商品コード],
  ).map((r) => ({
    ID: r.id ?? "", 移動タイプ: r.kind ?? "", ステータス: r.status ?? "",
    出庫元店舗ID: r.from_id ?? "", 出庫元在庫区分: r.from_zone ?? "", 入庫先店舗ID: r.to_id ?? "", 入庫先在庫区分: r.to_zone ?? "",
    登録者のログインID: r.reg_login ?? "", 登録者: r.reg_name ?? "", 更新者: r.upd_name ?? "",
  }));
}

/** ログインIDのメンバーが登録した在庫移動・振替の件数（移動タイプ別。E2E のメンバーだけを数える） */
export function メンバーが登録した移動振替の件数(ログインID: string, 移動タイプ: "在庫移動" | "在庫振替"): number {
  return Number(query(
    `select count(*) as n from dtb_stock_move_transfer t join dtb_member m on m.id = t.registered_member_id
      where m.login_id = $1 and t.move_transfer_type = $2::int`,
    [ログインID, 移動タイプ === "在庫移動" ? 1 : 2],
  )[0].n);
}

export type 対象商品 = {
  商品コード: string; 商品コードの文字数: number; 商品名: string; 振替先商品コード: string;
  出庫元店舗ID: string; 出庫元在庫区分: string; 入庫先店舗ID: string; 入庫先在庫区分: string;
  移動点数: number; 基準価格: number | null; 登録時在庫数: number | null;
};

/** 在庫移動・振替の対象商品（明細。明細IDの順） */
export function 対象商品(在庫移動振替ID: string): 対象商品[] {
  return query(
    `select pf.product_code as code, char_length(pf.product_code) as len, p.name as name, pt.product_code as to_code,
            sf.base_info_id::text as from_id, ${zoneName("sf.stock_location_id")} as from_zone,
            st.base_info_id::text as to_id, ${zoneName("st.stock_location_id")} as to_zone,
            d.move_transfer_quantity as q, d.move_from_standard_price as sp, d.move_from_stock_at_registration as reg
       from dtb_stock_move_transfer_detail d
       join dtb_product_stock sf on sf.id = d.move_from_product_stock_id
       join dtb_product_class pf on pf.id = sf.product_class_id
       join dtb_product p on p.id = pf.product_id
       join dtb_product_stock st on st.id = d.move_to_product_stock_id
       join dtb_product_class pt on pt.id = st.product_class_id
      where d.stock_move_transfer_id = $1::int order by d.id`,
    [在庫移動振替ID],
  ).map((r) => ({
    商品コード: r.code ?? "", 商品コードの文字数: Number(r.len), 商品名: r.name ?? "", 振替先商品コード: r.to_code ?? "",
    出庫元店舗ID: r.from_id ?? "", 出庫元在庫区分: r.from_zone ?? "", 入庫先店舗ID: r.to_id ?? "", 入庫先在庫区分: r.to_zone ?? "",
    移動点数: Number(r.q), 基準価格: r.sp === null ? null : Number(r.sp), 登録時在庫数: r.reg === null ? null : Number(r.reg),
  }));
}

/** 在庫移動・振替のステータス変更履歴（古い順） */
export function ステータス変更履歴(在庫移動振替ID: string): { ステータス: string; 更新者: string; 更新者のログインID: string; 更新日時: string }[] {
  return query(
    `select s.status_name as status, coalesce(m.name, '') as name, coalesce(m.login_id, '') as login, coalesce(h.update_date::text, '') as at
       from dtb_stock_move_transfer_status_history h
       join mtb_stock_move_transfer_status s on s.id = h.stock_move_transfer_status_id
       left join dtb_member m on m.id = h.update_member_id
      where h.stock_move_transfer_id = $1::int order by h.id`,
    [在庫移動振替ID],
  ).map((r) => ({ ステータス: r.status ?? "", 更新者: r.name ?? "", 更新者のログインID: r.login ?? "", 更新日時: r.at ?? "" }));
}

/** 在庫（在庫ID）の在庫変動履歴（古い順） */
export function 在庫変動履歴(在庫ID: string): { 区分: string; 変更前在庫: number; 変更後在庫: number; 増減数: number | null; 登録元: string; 登録元ID: string }[] {
  return query(
    `select d.child_name as kind, h.old_stock as old, h.stock as new, h.stock_change_quantity as qty,
            coalesce(src.source_name, '') as src, coalesce(h.history_source_id::text, '') as src_id
       from dtb_stock_history h
       join mtb_stock_change_type_detail d on d.id = h.stock_change_type_detail_id
       left join mtb_stock_history_source_type src on src.id = h.history_source_type
      where h.product_stock_id = $1::int order by h.id`,
    [在庫ID],
  ).map((r) => ({
    区分: r.kind ?? "", 変更前在庫: Number(r.old), 変更後在庫: Number(r.new), 増減数: r.qty === null ? null : Number(r.qty),
    登録元: r.src ?? "", 登録元ID: r.src_id ?? "",
  }));
}

// ---------------------------------------------------------------- メンバー

/** ログインIDのメンバーの管理者ID（いなければ null） */
export function ログインIDの管理者ID(ログインID: string): string | null {
  const r = query(`select id::text as id from dtb_member where login_id = $1`, [ログインID]);
  return r[0]?.id ?? null;
}

/** 店舗に所属する（所属店舗が店舗IDの）、承認権限のあるメンバー（アプリの承認通知先の候補の決め方と同じ。名前の順） */
export function 店舗の承認者(店舗ID: string): { 名前: string; ログインID: string; 所属: string }[] {
  return query(
    `select m.name, m.login_id, coalesce(d.name, '') as dept
       from dtb_member m left join mtb_department d on d.id = m.department_id
      where m.base_info_id = $1::int
        and m.authority_id not in (select authority_id from dtb_authority_role where deny_url = '/approval_authority')
      order by m.name`,
    [店舗ID],
  ).map((r) => ({ 名前: r.name ?? "", ログインID: r.login_id ?? "", 所属: r.dept ?? "" }));
}
