/**
 * B06-01 買取自動入庫バッチのシードと確かめのための DB の参照と書き込み。物理名はこのファイルの SQL の中にだけ書く。
 *
 * 読むのは lib/db.ts の query（参照だけ）。書くのは、画面で作れない状態だけ（依頼者決定 2026-11-10「E2E が作った行だけ DB に書いてよい」）:
 * - E2E がフロントの店頭買取査定申込で作った受注（申込者の姓に実行の印）の、ステータス・金額と、実在庫の明細（受注にぶら下がる行）。
 *   実在庫の明細は、MTGBuyer の査定で付く行で、管理画面に登録の手段が無い。
 * - E2E がグッズ商品CSV登録で作った商品（商品コードに実行の印）の、入庫先の EC-CUBE 在庫の在庫数・総原価。
 *   シード表は「在庫履歴は0件」と定める。画面の入庫は在庫履歴を1行作るので、画面では作れない。
 * 行は消さない。
 */
import { query } from "../lib/db";
import { insertOwnRows, updateOwnRows } from "../lib/db_write";
import { writeTestData } from "./write_adapter";

/** 在庫履歴の登録元「買取自動入庫バッチ」（マスタの番号は名称で引く） */
function 自動入庫バッチの登録元ID(): string {
  const r = query("select id::text as id from mtb_stock_history_source_type where source_name = $1", ["買取自動入庫バッチ"]);
  if (r.length !== 1) throw new Error(`在庫履歴の登録元「買取自動入庫バッチ」がマスタに ${r.length} 件`);
  return String(r[0].id);
}

/**
 * 時刻 から後に、買取自動入庫バッチが在庫履歴を書いた回の時刻（分の単位・日本時間・古い順）。
 * バッチの実行の記録は画面にも DB にも無いので、バッチが書いた在庫履歴の行の登録日時で見る（ほかの方の買取の分も含む）。
 */
export function 自動入庫バッチの実行(時刻: Date): string[] {
  const r = query(
    `select to_char(create_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI') as hm
       from dtb_stock_history where history_source_type = $1::int and create_date > $2::timestamptz
      group by 1 order by 1`,
    [自動入庫バッチの登録元ID(), 時刻.toISOString()]);
  // 同じ回が分をまたぐことがある（11/15 は 06:00 と 06:01 UTC）。10分以内に続く分は1回にまとめる
  const 回: string[] = [];
  let 前 = 0;
  for (const x of r.map((y) => String(y.hm))) {
    const ms = Date.parse(x.replace(" ", "T") + ":00+09:00");
    if (!回.length || ms - 前 > 10 * 60_000) 回.push(x);
    前 = ms;
  }
  return 回;
}

/** 店頭買取の受注のステータスID */
export function 受注のステータスID(受注ID: string): string | null {
  const r = query("select otc_buy_order_status_id::text as s from dtb_otc_buy_order where id = $1::int", [受注ID]);
  return r[0]?.s ?? null;
}

/** 商品コードの商品規格ID（1件のはず） */
export function 商品コードの規格ID(商品コード: string): string | null {
  const r = query("select id::text as id from dtb_product_class where product_code = $1", [商品コード]);
  if (r.length > 1) throw new Error(`商品コード ${商品コード} の商品規格が ${r.length} 件`);
  return r[0]?.id ?? null;
}

/** 商品規格の、店舗の EC-CUBE 在庫の行（在庫の番号・在庫数・総原価） */
export function 店舗のEC在庫(規格ID: string, 店舗ID: string): { 在庫番号: string; 在庫数: number; 総原価: number }[] {
  return query(
    `select id::text as id, coalesce(stock, 0)::text as s, coalesce(total_cost, 0)::text as c
       from dtb_product_stock where product_class_id = $1::int and base_info_id = $2::int and stock_location_id = 1`,
    [規格ID, 店舗ID]).map((r) => ({ 在庫番号: String(r.id), 在庫数: Number(r.s), 総原価: Number(r.c) }));
}

/** 商品規格の、店舗の在庫履歴の行の数 */
export function 在庫履歴の数(規格ID: string, 店舗ID: string): number {
  return Number(query(
    `select count(*)::text as n from dtb_stock_history h join dtb_product_stock ps on ps.id = h.product_stock_id
      where ps.product_class_id = $1::int and ps.base_info_id = $2::int`, [規格ID, 店舗ID])[0]?.n ?? 0);
}

/** E2E の商品（商品コードに実行の印）の、入庫先の EC-CUBE 在庫に在庫数・総原価を書く */
export function 入庫先の在庫を書く(what: string, 在庫番号: string, 印つきの商品コード: string, v: { 在庫数: number; 総原価: number }): void {
  updateOwnRows(what, {
    table: "dtb_product_stock", key: "id", ids: [在庫番号], set: { stock: v.在庫数, total_cost: v.総原価 },
    owner: { sql: "select ps.id from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id where pc.product_code = $1", params: [印つきの商品コード] },
  });
}

/** E2E の受注（申込者の姓に実行の印）に、実在庫の明細を1行足す */
export function 実在庫の明細を足す(what: string, 受注ID: string, 印つきの姓: string, v: { 規格ID: string; 数量: number; 小計: number }): void {
  insertOwnRows(what, {
    table: "dtb_otc_buy_order_stock", parentColumn: "otc_buy_order_id",
    owner: { sql: "select o.id from dtb_otc_buy_order o where o.last_name = $1", params: [印つきの姓] },
    rows: [{ otc_buy_order_id: 受注ID, product_class_id: v.規格ID, quantity: v.数量, subtotal: v.小計 }],
  });
}

/** 受注の実在庫の明細（規格ID・数量・小計） */
export function 実在庫の明細(受注ID: string): { 規格ID: string; 数量: number; 小計: number }[] {
  return query("select product_class_id::text as p, quantity::text as q, subtotal::text as s from dtb_otc_buy_order_stock where otc_buy_order_id = $1::int order by id", [受注ID])
    .map((r) => ({ 規格ID: String(r.p), 数量: Number(r.q), 小計: Number(r.s) }));
}

/** E2E の受注（申込者の姓に実行の印）のステータスと金額を書く（入庫待ち・入庫済みは、画面で選ぶと入庫の処理が動くため DB で書く） */
export function 受注のステータスと金額を書く(受注ID: string, 印つきの姓: string, ステータスID: string, 金額: number): void {
  if (![受注ID, ステータスID, String(金額)].every((x) => /^\d+$/.test(x))) throw new Error(`番号・金額が数字でない（受注 ${受注ID}・ステータス ${ステータスID}・金額 ${金額}）`);
  const n = writeTestData({
    理由: `E2E の店頭買取の受注 ${受注ID} を、B06-01 のシードのステータス（${ステータスID}）・金額（${金額}）にする`,
    sql: "update dtb_otc_buy_order set otc_buy_order_status_id = $2::int, total_price = $3::int where id = $1::int",
    params: [受注ID, ステータスID, String(金額)],
    対象の確かめ: "select o.id, o.last_name from dtb_otc_buy_order o where o.id = $1::int", 確かめのparams: [受注ID],
    印: 印つきの姓, 最大行数: 1,
  });
  if (n !== 1) throw new Error(`受注 ${受注ID} への書き込みが ${n} 行（1行のはず）`);
}

/** 申込者の姓（実行の印つき）の店頭買取の受注（受注ID・査定ID）。申込の完了画面の番号は受付の通し番号で、査定IDではないため、姓で引く */
export function 姓の受注(姓: string): { 受注ID: string; 査定ID: string }[] {
  return query("select id::text as id, assessment_id as a from dtb_otc_buy_order where last_name = $1 order by id", [姓])
    .map((r) => ({ 受注ID: String(r.id), 査定ID: String(r.a) }));
}
