/**
 * M05-11 受注情報編集のシードが、画面で作った「実行の印つき」のデータを整えるための DB 書き込みと、結果の照会（参照だけ）。
 * 依頼者の承認（2026-11-10「印つきデータは何でも」）の範囲で、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通して書く。
 *
 * 守ること:
 *  - 書き換える・消すのは、この実行の印を含む商品コードの明細を持つ受注（と、その会員）、印つきの商品コードの規格・在庫だけ。
 *    対象の確かめの SELECT が返す行は、どれも印を含む（含まなければ writeTestData が書かずに止める）。
 *  - 物理名（テーブル・カラム）はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";

const 印 = RUN_MARK;

function 受注の確かめ(受注ID: string) {
  return {
    対象の確かめ: `select o.id as 受注ID, i.product_code as 商品コード from dtb_order o join dtb_order_item i on i.order_id = o.id
                    where o.id = $1::int and i.product_code like $2`,
    確かめのparams: [受注ID, `%${印}%`], 印,
  };
}
function 会員の確かめ(会員ID: string) {
  return {
    対象の確かめ: `select c.id as 会員ID, i.product_code as 商品コード from dtb_customer c
                    join dtb_order o on o.customer_id = c.id join dtb_order_item i on i.order_id = o.id
                    where c.id = $1::int and i.product_code like $2 limit 1`,
    確かめのparams: [会員ID, `%${印}%`], 印,
  };
}
function 商品の確かめ(商品コード: string) {
  return {
    対象の確かめ: `select pc.id as 規格ID, pc.product_code as 商品コード from dtb_product_class pc where pc.product_code = $1`,
    確かめのparams: [商品コード], 印,
  };
}

// ---------------------------------------------------------------- 書き込み（シードの準備）

/** 受注の注文確定日（受注情報編集画面の「ピック中」の日付）を設定する。"YYYY-MM-DD HH:MM:SS" 日本時間。null で空 */
export function 注文確定日を設定(受注ID: string, 日時: string | null): void {
  writeTestData({
    理由: "注文確定日をシード表の値にする（画面で日付を指定できないため）",
    sql: 日時 === null ? `update dtb_order set confirm_date = null where id = $1::int` : `update dtb_order set confirm_date = $2::timestamptz where id = $1::int`,
    params: 日時 === null ? [受注ID] : [受注ID, `${日時}+09:00`], ...受注の確かめ(受注ID), 最大行数: 1,
  });
}

/** 受注の会員を、会員の累計注文金額（購入金額）に合わせる */
export function 会員の累計注文金額を設定(会員ID: string, 金額: number): void {
  writeTestData({
    理由: "会員の累計注文金額をシード表の値にする（画面で指定できないため）",
    sql: `update dtb_customer set buy_total = $2::numeric where id = $1::int`,
    params: [会員ID, 金額], ...会員の確かめ(会員ID), 最大行数: 1,
  });
}

/** 受注の会員ID（読むだけ） */
export function 受注の会員ID(受注ID: string): string {
  const r = query(`select customer_id::text as c from dtb_order where id = $1::int`, [受注ID]);
  if (!r[0]?.c) throw new Error(`受注ID ${受注ID} に会員が結び付いていない`);
  return r[0].c;
}

/** 商品コードの規格を在庫無制限にする（規格の画面に在庫無制限の欄が無いため） */
export function 在庫無制限にする(商品コード: string): void {
  writeTestData({
    理由: "商品規格を在庫無制限にする（規格の画面に在庫無制限の欄が無く、グッズ商品CSVが作る規格は在庫無制限なしのため）",
    sql: `update dtb_product_class set stock_unlimited = true where product_code = $1`,
    params: [商品コード], ...商品の確かめ(商品コード), 最大行数: 1,
  });
}

/** 商品コードの規格の在庫値を未設定（空）にする */
export function 在庫値を未設定にする(商品コード: string): void {
  writeTestData({
    理由: "在庫値を未設定にする（画面で指定できないため）",
    sql: `update dtb_product_stock set stock = null where product_class_id in (select id from dtb_product_class where product_code = $1)`,
    params: [商品コード],
    対象の確かめ: `select s.id as 在庫ID, pc.product_code as 商品コード from dtb_product_stock s join dtb_product_class pc on pc.id = s.product_class_id where pc.product_code = $1`,
    確かめのparams: [商品コード], 印, 最大行数: 5,
  });
}

/** 商品コードの規格の、入庫以外の在庫変動履歴（購入のときに作られた履歴）を消す。消した件数を返す（0件ならそのまま） */
export function 購入時の在庫変動履歴を消す(商品コード: string): number {
  const where = `h.product_stock_id in (select s.id from dtb_product_stock s join dtb_product_class pc on pc.id = s.product_class_id where pc.product_code = $1)
                 and coalesce(h.stock_change_reason, '') not like '%M05-11試験データ%'`;
  const n = Number(query(`select count(*) as n from dtb_stock_history h where ${where}`, [商品コード])[0].n);
  if (n === 0) return 0;
  return writeTestData({
    理由: "この受注の在庫変動履歴を0件にする（購入時に作られた履歴を消す。画面で作れないため）",
    sql: `delete from dtb_stock_history h where ${where}`,
    params: [商品コード],
    対象の確かめ: `select h.id as 履歴ID, pc.product_code as 商品コード from dtb_stock_history h join dtb_product_stock s on s.id = h.product_stock_id
                    join dtb_product_class pc on pc.id = s.product_class_id where pc.product_code = $1 and coalesce(h.stock_change_reason, '') not like '%M05-11試験データ%'`,
    確かめのparams: [商品コード], 印, 最大行数: 10,
  });
}

/** 受注の手動変更履歴のうち、いちばん古い1件を消す（画面で履歴を1件にできないため） */
export function 最初の手動変更履歴を消す(受注ID: string): void {
  writeTestData({
    理由: "手動変更履歴を1件にする（1回目の登録でできた履歴を消す。画面で作れないため）",
    sql: `delete from dtb_order_history where id = (select min(h.id) from dtb_order_history h where h.order_id = $1::int and h.source = 'admin')`,
    params: [受注ID], ...受注の確かめ(受注ID), 最大行数: 1,
  });
}

/** 商品コードの規格の、期間別の販売数（当日・翌日・3日以内・7日以内・28日以内・90日以内・180日以内・365日以内）をすべて同じ値にする */
export function 週間販売数を設定(商品コード: string, 値: number): void {
  const cols = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `sales_quantity_0${n}`);
  const found = query(`select sq.id as id from dtb_sales_quantity sq join dtb_product_class pc on pc.id = sq.product_class_id where pc.product_code = $1 and sq.base_info_id = 1 and sq.sales_location = 1`, [商品コード]);
  if (found.length === 0) {
    writeTestData({
      理由: "期間別の販売数の行を足す（購入で行ができていないとき。画面で指定できないため）",
      sql: `insert into dtb_sales_quantity (product_class_id, base_info_id, sales_location, ${cols.join(", ")}, update_date)
            select pc.id, 1, 1, ${cols.map(() => "$2::int").join(", ")}, now() from dtb_product_class pc where pc.product_code = $1`,
      params: [商品コード, 値], ...商品の確かめ(商品コード), 最大行数: 1,
    });
    return;
  }
  writeTestData({
    理由: "商品規格別の週間販売数の各比較欄をシード表の値にする（画面で指定できないため）",
    sql: `update dtb_sales_quantity set ${cols.map((c) => `${c} = $2::int`).join(", ")}, update_date = now()
           where product_class_id in (select id from dtb_product_class where product_code = $1) and base_info_id = 1 and sales_location = 1`,
    params: [商品コード, 値],
    対象の確かめ: `select sq.id as id, pc.product_code as 商品コード from dtb_sales_quantity sq join dtb_product_class pc on pc.id = sq.product_class_id where pc.product_code = $1 and sq.base_info_id = 1`,
    確かめのparams: [商品コード], 印, 最大行数: 1,
  });
}

/** 受注の注文者を会員でなくす（ゲスト購入にする。ゲスト購入の導線が画面に無いため） */
export function ゲスト購入にする(受注ID: string): void {
  writeTestData({
    理由: "受注をゲスト購入（会員なし）にする（フロントにゲスト購入の導線が無いため）",
    sql: `update dtb_order set customer_id = null where id = $1::int`,
    params: [受注ID], ...受注の確かめ(受注ID), 最大行数: 1,
  });
}

/** 受注のポイント付帯情報（ポイント発生・使用・還元率）と送り状No.・ポイント連携エラーを未設定（空）にする */
export function ポイント付帯情報を空にする(受注ID: string): void {
  writeTestData({
    理由: "ポイント発生・使用・還元率と送り状No.・ポイント連携エラーを未設定にする（画面では数値の入力が必須で空に戻せないため）",
    sql: `update dtb_order set gained_points = null, spended_points = null, point_percentage = null, invoice_number = null, point_error_message = null where id = $1::int`,
    params: [受注ID], ...受注の確かめ(受注ID), 最大行数: 1,
  });
}

// ---------------------------------------------------------------- 照会（参照だけ）

/** 受注のポイント使用・ポイント発生 */
export function 受注のポイント(注文番号: string): { 使用: number; 発生: number } {
  const r = query(`select coalesce(o.spended_points, 0)::text as u, coalesce(o.gained_points, 0)::text as g from dtb_order o where o.order_number = $1 and o.base_info_id = 1 order by o.id desc limit 1`, [注文番号])[0];
  if (!r) throw new Error(`注文番号「${注文番号}」の受注が無い`);
  return { 使用: Number(r.u), 発生: Number(r.g) };
}

/** 受注の会員の累計注文金額 */
export function 会員の累計注文金額(注文番号: string): number {
  const r = query(`select c.buy_total::text as t from dtb_order o join dtb_customer c on c.id = o.customer_id where o.order_number = $1 and o.base_info_id = 1 order by o.id desc limit 1`, [注文番号])[0];
  if (!r) throw new Error(`注文番号「${注文番号}」の会員が無い`);
  return Number(r.t ?? "0");
}

/** 商品コードの規格の在庫値（在庫の行が複数なら最初の行。値が空なら null、行が無ければ "なし"） */
export function 商品の在庫値(商品コード: string): string | null {
  const r = query(`select s.stock::text as v from dtb_product_stock s join dtb_product_class pc on pc.id = s.product_class_id where pc.product_code = $1 order by s.id limit 1`, [商品コード]);
  return r.length === 0 ? "なし" : r[0].v;
}

export type 在庫履歴 = { 区分: string; 増減数: number; 変更前在庫: number; 変更後在庫: number; 変更前総原価: number | null; 変更後総原価: number | null; 理由: string };
/** 商品コードの規格の在庫変動履歴（古い順）。区分・増減数・変更前後の在庫と総原価・理由 */
export function 在庫変動履歴の詳細(商品コード: string): 在庫履歴[] {
  return query(
    `select d.child_name as k, h.stock_change_quantity::text as q, h.old_stock::text as o, h.stock::text as n,
            h.total_cost_price_before::text as tb, h.total_cost_price_after::text as ta, coalesce(h.stock_change_reason, '') as r
       from dtb_stock_history h join dtb_product_stock s on s.id = h.product_stock_id join dtb_product_class pc on pc.id = s.product_class_id
       join mtb_stock_change_type_detail d on d.id = h.stock_change_type_detail_id
      where pc.product_code = $1 order by h.id`, [商品コード])
    .map((x) => ({ 区分: x.k ?? "", 増減数: Number(x.q), 変更前在庫: Number(x.o), 変更後在庫: Number(x.n), 変更前総原価: x.tb === null ? null : Number(x.tb), 変更後総原価: x.ta === null ? null : Number(x.ta), 理由: x.r ?? "" }));
}

/** 商品コードの規格の期間別の販売数（当日・翌日・3日以内・7日以内・28日以内・90日以内・180日以内・365日以内の順） */
export function 週間販売数(商品コード: string): number[] {
  const r = query(
    `select sq.sales_quantity_01::text as a, sq.sales_quantity_02::text as b, sq.sales_quantity_03::text as c, sq.sales_quantity_04::text as d,
            sq.sales_quantity_05::text as e, sq.sales_quantity_06::text as f, sq.sales_quantity_07::text as g, sq.sales_quantity_08::text as h
       from dtb_sales_quantity sq join dtb_product_class pc on pc.id = sq.product_class_id where pc.product_code = $1 and sq.base_info_id = 1 and sq.sales_location = 1`, [商品コード])[0];
  if (!r) throw new Error(`商品 ${商品コード} の期間別の販売数の行が無い`);
  return [r.a, r.b, r.c, r.d, r.e, r.f, r.g, r.h].map((v) => Number(v));
}

/** 受注に結び付いたポイント履歴の増減量（古い順） */
export function 受注のポイント履歴(注文番号: string): number[] {
  return query(
    `select h.point_change::text as c from dtb_point_history h join dtb_order o on o.id = h.order_id
      where o.order_number = $1 and o.base_info_id = 1 and o.id = (select max(o2.id) from dtb_order o2 where o2.order_number = $1 and o2.base_info_id = 1) order by h.id`, [注文番号])
    .map((r) => Number(r.c));
}

/** 受注の日付（日本時間の YYYY-MM-DD。空なら null）。col は決まった名前だけ */
export function 受注の日付(注文番号: string, 欄: "キャンセル日" | "受注日" | "入金日" | "注文確定日" | "店頭予約日" | "出荷指示日" | "出荷日"): string | null {
  const col = { キャンセル日: "cancel_date", 受注日: "order_date", 入金日: "payment_date", 注文確定日: "confirm_date", 店頭予約日: "otc_rsv_date", 出荷指示日: "commit_date", 出荷日: "shipping_date" }[欄];
  const r = query(`select to_char(o.${col} at time zone 'Asia/Tokyo', 'YYYY-MM-DD') as d from dtb_order o where o.order_number = $1 and o.base_info_id = 1 order by o.id desc limit 1`, [注文番号])[0];
  if (!r) throw new Error(`注文番号「${注文番号}」の受注が無い`);
  return r.d;
}

/** 受注の対応状況 */
export function 受注の対応状況(注文番号: string): string {
  const r = query(`select s.name as n from dtb_order o join mtb_order_status s on s.id = o.order_status_id where o.order_number = $1 and o.base_info_id = 1 order by o.id desc limit 1`, [注文番号])[0];
  if (!r) throw new Error(`注文番号「${注文番号}」の受注が無い`);
  return r.n ?? "";
}
