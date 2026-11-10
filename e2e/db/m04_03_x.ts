/**
 * M04-03 在庫一括編集の続き（-x）の DB 確認と、画面で作れない状態の書き足し（E2E の行だけ。依頼者決定 2026-11-10）。
 * 物理名はこのファイルの SQL の中にだけ書く。照会の別名に t は使わない（lib/db の包みの名前と重なる）。
 */
import { query } from "../lib/db";
import { insertOwnRows, updateOwnRows, Owner } from "../lib/db_write";
import { RUN_MARK } from "../lib/run_marker";

/** 規格（商品コード）と店舗の EC-CUBE の在庫ID */
export function 在庫IDの(商品コード: string, 店舗ID: string): string {
  const r = query(
    `select ps.id from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id
      where pc.product_code = $1 and ps.base_info_id = $2 and ps.stock_location_id = 1`,
    [商品コード, 店舗ID],
  );
  if (r.length !== 1) throw new Error(`商品コード ${商品コード}・店舗ID ${店舗ID}・EC-CUBE の在庫が ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}

/** 在庫の在庫数・総原価・原価単価 */
export function 在庫の(在庫ID: string): { 在庫数: number; 総原価: number } {
  const r = query(`select stock, total_cost from dtb_product_stock where id = $1`, [在庫ID])[0];
  if (!r) throw new Error(`在庫ID ${在庫ID} の在庫が無い`);
  return { 在庫数: Number(r.stock), 総原価: Number(r.total_cost) };
}

/** 持ち主の確かめ: 実行の印つきの商品コードの規格の在庫（E2E が作ったもの） */
const 自分の在庫: Owner = {
  sql: `select ps.id from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id where pc.product_code like $1`,
  params: [`%-${RUN_MARK}`],
};
/** 持ち主の確かめ: 実行の印つきの商品コードの規格（E2E が作ったもの） */
const 自分の規格: Owner = { sql: `select pc.id from dtb_product_class pc where pc.product_code like $1`, params: [`%-${RUN_MARK}`] };

/** 画面で作った E2E の規格の在庫に、在庫数・総原価を書き足す（シード表の投入方法が画面で指定できないとするもの） */
export function 在庫数と総原価を整える(what: string, 在庫ID: string, 在庫数: number, 総原価: number): void {
  updateOwnRows(what, { table: "dtb_product_stock", key: "id", ids: [在庫ID], set: { stock: 在庫数, total_cost: 総原価 }, owner: 自分の在庫 });
}

/** 画面で作った E2E の規格に、期間別販売数量（当日・昨日・3日間・1週間・1ヶ月）の行を足す（画面に入力の手段が無い） */
export function 期間別販売数量を足す(what: string, 規格ID: string, 店舗ID: string, 数量: [number, number, number, number, number]): void {
  const [d1, d2, d3, w1, m1] = 数量;
  insertOwnRows(what, {
    table: "dtb_sales_quantity", parentColumn: "product_class_id", owner: 自分の規格,
    rows: [{ product_class_id: 規格ID, base_info_id: 店舗ID, sales_quantity_01: d1, sales_quantity_02: d2, sales_quantity_03: d3, sales_quantity_04: w1, sales_quantity_05: m1,
      sales_quantity_06: 0, sales_quantity_07: 0, sales_quantity_08: 0, update_date: new Date().toISOString(), sales_location: 1 }],
  });
}

/** 規格の期間別販売数量（行が無ければ空） */
export function 規格の期間別販売数量(規格ID: string): number[][] {
  return query(`select sales_quantity_01, sales_quantity_02, sales_quantity_03, sales_quantity_04, sales_quantity_05 from dtb_sales_quantity where product_class_id = $1 order by id`, [規格ID])
    .map((r) => [r.sales_quantity_01, r.sales_quantity_02, r.sales_quantity_03, r.sales_quantity_04, r.sales_quantity_05].map(Number));
}

/** 在庫の最新の在庫編集承認の番号（在庫に関係する入庫承認待ち明細・承認一覧から引く。新しい順の先頭） */
export function 在庫の最新の承認ID(在庫ID: string): string | null {
  const r = query(
    `select l.history_source_id as approval_id from dtb_stock_approval_list l
       join dtb_stock_edit_approval_detail d on d.stock_edit_approval_id = l.history_source_id
      where l.history_source_type_id = 1 and d.product_stock_id = $1 order by l.id desc limit 1`,
    [在庫ID],
  )[0];
  return r ? String(r.approval_id) : null;
}

/** 在庫の在庫変動履歴のうち、仕入総価格・原価単価の前後・履歴登録元の番号（新しい順） */
export function 在庫の変動履歴の金額(在庫ID: string): { 仕入総価格: number | null; 変更前原価単価: number | null; 変更後原価単価: number | null; 履歴登録元ID: string | null }[] {
  const n = (v: unknown) => (v === null || v === undefined || v === "" ? null : Number(v));
  return query(
    `select h.buy_price, h.unit_cost_price_before, h.unit_cost_price_after, h.history_source_id from dtb_stock_history h where h.product_stock_id = $1 order by h.id desc`,
    [在庫ID],
  ).map((r) => ({ 仕入総価格: n(r.buy_price), 変更前原価単価: n(r.unit_cost_price_before), 変更後原価単価: n(r.unit_cost_price_after), 履歴登録元ID: r.history_source_id === null ? null : String(r.history_source_id) }));
}

/** 名前がちょうど一致する店舗の番号（開いているもの） */
export function 店名の店舗ID(店名: string): string[] {
  return query(`select id from dtb_base_info where shop_name = $1 order by id`, [店名]).map((r) => String(r.id));
}

/** 開発環境に既にある、商品の付いていないカード詳細（Foil: 1=通常・2=特殊）。カードのマスタは新しく作らない */
export function 商品の無いカード詳細(foil: 1 | 2): { カード詳細ID: string; カード名: string } {
  const r = query(
    `select d.id, c.name_jp from mtb_card_detail d join mtb_card c on c.id = d.card_id
      where d.foil_flg = $1 and coalesce(c.name_jp, '') <> ''
        and not exists (select 1 from dtb_product p where p.card_detail_id = d.id)
      order by d.id desc limit 1`,
    [foil],
  )[0];
  if (!r) throw new Error(`商品の付いていない、Foil が「${foil === 1 ? "通常" : "特殊"}」のカード詳細が開発環境に無い（カードのマスタは新しく作らない）`);
  return { カード詳細ID: String(r.id), カード名: String(r.name_jp) };
}
