/**
 * M07（ネット買取管理）の追加ケース（M07-03 023・M07-05 002・M07-06 002/005/006/011・M07-12）のシードが、画面で作れない部分を DB で整える書き込みと、その確かめの照会。
 * 依頼者の承認 2026-11-10「E2E が作った行だけ書いてよい」: 書く先は、E2E が画面で作った実行の印つきの買取（会員のメールアドレスに印）と、
 * 印つきの商品コードの商品規格だけ。書き込みはすべて db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口）を通す。
 * 物理名はこのファイルの SQL の中にだけ書く。既存の db/m07_prep.ts などは変えない（このファイルに足した）。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";

function 数字(s: string): string {
  if (!/^\d+$/.test(s)) throw new Error(`番号が数字でない（${s}）`);
  return String(Number(s));
}
function 一件(n: number, 何: string): void {
  if (n !== 1) throw new Error(`${何}: 書き込んだ行が ${n} 行（1行のはず）`);
}

const 買取の確かめ = "select b.id, b.email from dtb_buy_order b where b.id = $1::int";

// ---------------------------------------------------------------------------
// M07-06
// ---------------------------------------------------------------------------

/** 印つきの買取の、選んで買取の明細（印つきの商品コードの商品）の状態を未設定（空）にする */
export function 明細の状態を未設定にする(買取番号: string, 印: string, 商品コード: string): void {
  const 確かめ = `select c.id, b.email from dtb_buy_main_card c join dtb_buy_order b on b.id = c.buy_order_id
                   where b.id = $1::int and c.purchase_category = 1 and c.product_id = (select pc.product_id from dtb_product_class pc where pc.product_code = $2)`;
  一件(writeTestData({
    理由: `買取 ${買取番号} の選んで買取 ${商品コード} の状態を未設定にする`,
    sql: `update dtb_buy_main_card set card_condition_id = null
           where buy_order_id = $1::int and purchase_category = 1 and product_id = (select pc.product_id from dtb_product_class pc where pc.product_code = $2)`,
    params: [数字(買取番号), 商品コード],
    対象の確かめ: 確かめ, 確かめのparams: [数字(買取番号), 商品コード], 印, 最大行数: 1,
  }), "明細の状態を未設定");
}

/** 印つきの買取の、選んで買取の明細をすべて消す（個別入力商品だけの買取にする）。消した件数を返す */
export function 選んで買取の明細を消す(買取番号: string, 印: string): number {
  const 確かめ = `select c.id, b.email from dtb_buy_main_card c join dtb_buy_order b on b.id = c.buy_order_id where b.id = $1::int`;
  const 件数 = query("select count(*)::text as n from dtb_buy_main_card where buy_order_id = $1::int", [数字(買取番号)])[0].n;
  const n = Number(件数);
  if (n === 0) return 0;
  // 明細に紐づく申込単価を先に消す（明細を消せない参照があるため）。どちらも、この買取（印つき）の行だけ
  const 単価の確かめ = `select ap.id, b.email from dtb_application_price ap join dtb_buy_main_card c on c.id = ap.buy_main_card_id join dtb_buy_order b on b.id = c.buy_order_id where b.id = $1::int`;
  const m = query(単価の確かめ, [数字(買取番号)]).length;
  if (m > 0) {
    writeTestData({
      理由: `買取 ${買取番号} の明細に紐づく申込単価 ${m} 件を消す`,
      sql: `delete from dtb_application_price where id in (select ap.id from dtb_application_price ap join dtb_buy_main_card c on c.id = ap.buy_main_card_id where c.buy_order_id = $1::int)`,
      params: [数字(買取番号)],
      対象の確かめ: 単価の確かめ, 確かめのparams: [数字(買取番号)], 印, 最大行数: m,
    });
  }
  const w = writeTestData({
    理由: `買取 ${買取番号} の選んで買取の明細 ${n} 件を消す`,
    sql: "delete from dtb_buy_main_card where buy_order_id = $1::int",
    params: [数字(買取番号)],
    対象の確かめ: 確かめ, 確かめのparams: [数字(買取番号)], 印, 最大行数: Math.max(n, 1),
  });
  if (w !== n) throw new Error(`明細を消した件数が ${w}（${n} のはず）`);
  return w;
}

/** 印つきの買取の更新日時を設定する */
export function 更新日時を設定する(買取番号: string, 印: string, 日時: string): void {
  一件(writeTestData({
    理由: `買取 ${買取番号} の更新日時を ${日時} にする`,
    sql: "update dtb_buy_order set update_date = $2::timestamptz where id = $1::int",
    params: [数字(買取番号), 日時],
    対象の確かめ: 買取の確かめ, 確かめのparams: [数字(買取番号)], 印, 最大行数: 1,
  }), "更新日時");
}

/** 印つきの商品コードの商品規格の、本店（店舗ID 1）・EC-CUBE在庫の在庫数を設定する（行が無ければ足す） */
export function 規格の在庫数を設定する(商品コード: string, 数: number): void {
  const ps = query(
    `select ps.id from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id
      where pc.product_code = $1 and ps.base_info_id = 1 and ps.stock_location_id = 1`, [商品コード]);
  const 確かめ = "select pc.id, pc.product_code from dtb_product_class pc where pc.product_code = $1";
  if (ps.length === 0) {
    一件(writeTestData({
      理由: `商品規格 ${商品コード} の本店の在庫の行を足す（在庫数 ${数}）`,
      sql: `insert into dtb_product_stock (product_class_id, base_info_id, stock, create_date, update_date, pick_up_flg, stock_location_id, total_cost)
            select pc.id, 1, $2::int, now(), now(), false, 1, 0 from dtb_product_class pc where pc.product_code = $1`,
      params: [商品コード, 数],
      対象の確かめ: 確かめ, 確かめのparams: [商品コード], 印: 商品コード, 最大行数: 1,
    }), "規格の在庫の行");
    return;
  }
  一件(writeTestData({
    理由: `商品規格 ${商品コード} の本店の在庫数を ${数} にする`,
    sql: `update dtb_product_stock set stock = $2::int
           where base_info_id = 1 and stock_location_id = 1 and product_class_id = (select pc.id from dtb_product_class pc where pc.product_code = $1)`,
    params: [商品コード, 数],
    対象の確かめ: 確かめ, 確かめのparams: [商品コード], 印: 商品コード, 最大行数: 1,
  }), "規格の在庫数");
}

export type 買取の状態 = { 買取状況: string; 更新日時: string; 明細の個数: number | null; 在庫数: number | null };

/** 買取の買取状況（番号）・更新日時（日本時間の文字）・選んで買取の明細の個数の合計・商品コードの規格の本店在庫数（参照だけ） */
export function 買取の状態を読む(買取番号: string, 商品コード: string): 買取の状態 {
  const b = query(
    `select b.buy_order_status_id::text as s, to_char(b.update_date at time zone 'Asia/Tokyo', 'YYYY/MM/DD HH24:MI:SS') as u,
            (select sum(c.count)::text from dtb_buy_main_card c where c.buy_order_id = b.id
               and c.product_id = (select pc.product_id from dtb_product_class pc where pc.product_code = $2)) as n
       from dtb_buy_order b where b.id = $1::int`, [数字(買取番号), 商品コード])[0];
  if (!b) throw new Error(`買取 ${買取番号} がDBに無い`);
  const st = query(
    `select sum(ps.stock)::text as s from dtb_product_stock ps join dtb_product_class pc on pc.id = ps.product_class_id
      where pc.product_code = $1 and ps.base_info_id = 1 and ps.stock_location_id = 1`, [商品コード])[0];
  return { 買取状況: String(b.s), 更新日時: String(b.u), 明細の個数: b.n === null ? null : Number(b.n), 在庫数: st?.s === null || st?.s === undefined ? null : Number(st.s) };
}

/** 印つきの商品コードの商品規格の状態（NM・SP など）を設定する。印は商品コード（実行の印つき） */
export function 規格の状態を設定する(商品コード: string, 状態のコード: string): void {
  一件(writeTestData({
    理由: `商品規格 ${商品コード} の状態を ${状態のコード} にする`,
    sql: "update dtb_product_class set card_condition_id = (select cc.id from mtb_card_condition cc where cc.code = $2) where product_code = $1",
    params: [商品コード, 状態のコード],
    対象の確かめ: "select pc.id, pc.product_code from dtb_product_class pc where pc.product_code = $1", 確かめのparams: [商品コード], 印: 商品コード, 最大行数: 1,
  }), "商品規格の状態");
}

/** 印つきの買取の、選んで買取の明細（印つきの商品コードの商品）の状態を設定する（価格はそのまま） */
export function 明細の状態を設定する(買取番号: string, 印: string, 商品コード: string, 状態のコード: string): void {
  const 確かめ = `select c.id, b.email from dtb_buy_main_card c join dtb_buy_order b on b.id = c.buy_order_id
                   where b.id = $1::int and c.purchase_category = 1 and c.product_id = (select pc.product_id from dtb_product_class pc where pc.product_code = $2)`;
  一件(writeTestData({
    理由: `買取 ${買取番号} の選んで買取 ${商品コード} の状態を ${状態のコード} にする`,
    sql: `update dtb_buy_main_card set card_condition_id = (select cc.id from mtb_card_condition cc where cc.code = $3)
           where buy_order_id = $1::int and purchase_category = 1 and product_id = (select pc.product_id from dtb_product_class pc where pc.product_code = $2)`,
    params: [数字(買取番号), 商品コード, 状態のコード],
    対象の確かめ: 確かめ, 確かめのparams: [数字(買取番号), 商品コード], 印, 最大行数: 1,
  }), "明細の状態");
}

// ---------------------------------------------------------------------------
// M07-05（入金CSV）
// ---------------------------------------------------------------------------

/** 印つきの買取の送料を設定する */
export function 送料を設定する(買取番号: string, 印: string, 金額: number): void {
  一件(writeTestData({
    理由: `買取 ${買取番号} の送料を ${金額} にする`,
    sql: "update dtb_buy_order set delivery_fee = $2::int where id = $1::int",
    params: [数字(買取番号), 金額],
    対象の確かめ: 買取の確かめ, 確かめのparams: [数字(買取番号)], 印, 最大行数: 1,
  }), "送料");
}

/** 印つきの買取の銀行口座（買取の銀行口座。会員の口座の行）の値を設定する */
export function 銀行口座を設定する(買取番号: string, 印: string, v: { 銀行コード: string; 支店コード: string; 口座種別: string; 口座番号: number; 名義: string }): void {
  一件(writeTestData({
    理由: `買取 ${買取番号} の銀行口座を 銀行${v.銀行コード}・支店${v.支店コード}・種別${v.口座種別}・番号${v.口座番号} にする`,
    sql: `update dtb_bank_account set bank_code = $2, branch_code = $3, account_type = $4, account_no = $5::int, account_holder = $6
           where id = (select b.bank_account_id from dtb_buy_order b where b.id = $1::int)`,
    params: [数字(買取番号), v.銀行コード, v.支店コード, v.口座種別, v.口座番号, v.名義],
    対象の確かめ: "select ba.id, b.email from dtb_bank_account ba join dtb_buy_order b on b.bank_account_id = ba.id where b.id = $1::int", 確かめのparams: [数字(買取番号)], 印, 最大行数: 1,
  }), "銀行口座");
}

/** 印つきの買取の、選んで買取の明細（先頭の1件）の価格・個数・売却を設定する。件数を返す */
export function 先頭の明細を設定する(買取番号: string, 印: string, v: { 価格: number; 個数: number; 売却: boolean }): void {
  const 確かめ = "select c.id, b.email from dtb_buy_main_card c join dtb_buy_order b on b.id = c.buy_order_id where b.id = $1::int";
  const rows = query("select id::text as id from dtb_buy_main_card where buy_order_id = $1::int order by id", [数字(買取番号)]);
  if (rows.length !== 1) throw new Error(`買取 ${買取番号} の明細が ${rows.length} 件（1件のはず）`);
  一件(writeTestData({
    理由: `買取 ${買取番号} の明細の価格を ${v.価格}・個数を ${v.個数}・売却を ${v.売却} にする`,
    sql: "update dtb_buy_main_card set price = $2::int, count = $3::int, sale_flg = $4::boolean where buy_order_id = $1::int",
    params: [数字(買取番号), v.価格, v.個数, v.売却 ? "true" : "false"],
    対象の確かめ: 確かめ, 確かめのparams: [数字(買取番号)], 印, 最大行数: 1,
  }), "明細の価格・個数・売却");
}

/** 印つきの買取の、明細1件に、同じ商品・言語・状態の売却しない明細を1件足す（明細金額を受理合計価格より大きくするため） */
export function 売却しない明細を足す(買取番号: string, 印: string, v: { 価格: number; 個数: number }): void {
  const 確かめ = "select b.id, b.email from dtb_buy_order b where b.id = $1::int";
  一件(writeTestData({
    理由: `買取 ${買取番号} に、売却しない明細（価格${v.価格}・個数${v.個数}）を足す`,
    sql: `insert into dtb_buy_main_card (buy_order_id, product_id, language_id, card_condition_id, foil_flg, price, count, sale_flg, purchase_category)
          select c.buy_order_id, c.product_id, c.language_id, c.card_condition_id, c.foil_flg, $2::int, $3::int, false, c.purchase_category
            from dtb_buy_main_card c where c.buy_order_id = $1::int order by c.id limit 1`,
    params: [数字(買取番号), v.価格, v.個数],
    対象の確かめ: 確かめ, 確かめのparams: [数字(買取番号)], 印, 最大行数: 1,
  }), "売却しない明細");
}

// ---------------------------------------------------------------------------
// M07-12（実在庫履歴の入庫数）
// ---------------------------------------------------------------------------

const 履歴の確かめ = `select h.id, b.email from dtb_buy_order_stock_history h
   join dtb_buy_order_stock s on s.id = h.buy_order_stock_id join dtb_buy_order b on b.id = s.buy_order_id
   join dtb_product_class pc on pc.id = s.product_class_id
  where b.id = $1::int and pc.product_code = $2`;

/** 印つきの買取の、商品の実在庫履歴（1件）の変更後の数量（買取商品履歴の入庫数）だけを設定する */
export function 実在庫履歴の変更後を設定する(買取番号: string, 印: string, 商品コード: string, 後: number): void {
  const n = query(履歴の確かめ, [数字(買取番号), 商品コード]).length;
  if (n !== 1) throw new Error(`買取 ${買取番号} の ${商品コード} の実在庫履歴が ${n} 件（1件のはず）`);
  一件(writeTestData({
    理由: `買取 ${買取番号} の ${商品コード} の実在庫履歴の変更後の数量を ${後} にする`,
    sql: `update dtb_buy_order_stock_history set after_quantity = $3::int
           where id in (select h.id from dtb_buy_order_stock_history h join dtb_buy_order_stock s on s.id = h.buy_order_stock_id
                         join dtb_product_class pc on pc.id = s.product_class_id where s.buy_order_id = $1::int and pc.product_code = $2)`,
    params: [数字(買取番号), 商品コード, 後],
    対象の確かめ: 履歴の確かめ, 確かめのparams: [数字(買取番号), 商品コード], 印, 最大行数: 1,
  }), "実在庫履歴の変更後");
}

// ---------------------------------------------------------------------------
// 参照（シードが控える番号）
// ---------------------------------------------------------------------------

/** 買取の銀行口座の番号（参照だけ） */
export function 銀行口座の番号(買取番号: string): string {
  const r = query("select b.bank_account_id as id from dtb_buy_order b where b.id = $1::int", [数字(買取番号)]);
  if (!r[0]?.id) throw new Error(`買取注文 ${買取番号} の銀行口座をDBの参照で読めない`);
  return String(r[0].id);
}

/** 買取の、売却する明細の先頭の番号（参照だけ。無ければ空） */
export function 売却する明細の番号(買取番号: string): string {
  const r = query("select c.id from dtb_buy_main_card c where c.buy_order_id = $1::int and c.sale_flg = true order by c.id", [数字(買取番号)]);
  return String(r[0]?.id ?? "");
}
