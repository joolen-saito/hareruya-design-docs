/**
 * M04-31 棚卸計画の DB 確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。
 * シードでは「削除する」の代わりに0件であることを確かめるのに使い、ケースでは実行区分が「ブラウザ+DB確認」のものだけが使う。
 */
import { query } from "../lib/db";

/** 棚卸名が接頭辞で始まる棚卸計画の件数 */
export function planCountByPrefix(prefix: string): number {
  return Number(query("select count(*) as n from dtb_inventory_plan where name like $1", [`${prefix}%`])[0].n);
}

/** 棚卸名が一致する棚卸計画の件数 */
export function planCountByName(name: string): number {
  return Number(query("select count(*) as n from dtb_inventory_plan where name = $1", [name])[0].n);
}

/** 全棚卸計画の件数 */
export function planCountAll(): number {
  return Number(query("select count(*) as n from dtb_inventory_plan")[0].n);
}

/** 店舗（店舗ID）・在庫区分（1=EC-CUBE、2=スマレジ）の棚卸計画の件数 */
export function planCountByStore(storeId: string, stockLocationId: 1 | 2): number {
  return Number(query("select count(*) as n from dtb_inventory_plan where base_info_id = $1 and stock_location_id = $2", [storeId, stockLocationId])[0].n);
}

/** 開店中の店舗の件数 */
export function openStoreCount(): number {
  return Number(query("select count(*) as n from dtb_base_info where is_open_shop")[0].n);
}

export type SavedPlan = { 棚卸名: string; 備考: string | null; 作業者のログインID: string | null; 作業者名: string | null; 在庫反映日: string | null; 店舗ID: string | null; 在庫区分: string | null };

/** 棚卸名が一致する棚卸計画（作業者は管理者のログインIDと名前で返す） */
export function plansByName(name: string): SavedPlan[] {
  return query(
    `select p.name, p.memo, m.login_id, m.name as member_name, p.stock_reflectioned_date, p.base_info_id, p.stock_location_id
       from dtb_inventory_plan p left join dtb_member m on m.id = p.member_id
      where p.name = $1 order by p.id`, [name],
  ).map((r) => ({
    棚卸名: r.name ?? "", 備考: r.memo, 作業者のログインID: r.login_id, 作業者名: r.member_name, 在庫反映日: r.stock_reflectioned_date,
    店舗ID: r.base_info_id, 在庫区分: r.stock_location_id,
  }));
}
