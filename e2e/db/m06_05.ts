/**
 * M06-05 買取商品履歴のシードのための DB 操作。物理名はこのファイルの SQL の中にだけ書く。
 *
 * 依頼者の承認 2026-11-10「印つきデータは何でも」に従い、書くのは E2E が画面（フロントの店頭買取査定申込）で作った
 * 「実行の印つき」の買取（申込者の姓・名に実行の印）と、その買取に紐づく行（実在庫・履歴・個別入力商品）、
 * 実行の印つきの商品コードの商品規格だけ。書き込みはすべて db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） を通す。
 * 共有のマスタ（言語・状態・店舗）・メンバー・会員は、既にある行を指すだけで、書き換えない。
 *
 * 申込者の姓・名は、買取に書く最後の操作（申込者を設定する）で書き換える。それ以降はこの買取への書き込みはできない。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";

const 印 = RUN_MARK;

/** 親の買取の確かめ。姓・名に実行の印がある行だけを返す */
const 親の確かめ = "select o.id, o.last_name, o.first_name from dtb_otc_buy_order o where o.id = $1::int";

function 数字(s: string): string {
  if (!/^\d+$/.test(s)) throw new Error(`番号が数字でない（${s}）`);
  return String(Number(s));
}
function 一件(n: number, 何: string): void {
  if (n !== 1) throw new Error(`${何}: 書き込んだ行が ${n} 行（1行のはず）`);
}

/** 査定ID → 店頭買取受注ID（内部ID）。1件でなければ止める */
export function 受注ID(査定ID: string): string {
  const r = query("select id from dtb_otc_buy_order where assessment_id = $1", [査定ID]);
  if (r.length !== 1) throw new Error(`査定ID ${査定ID} の買取が ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}

function メンバーID(名前: string): string {
  const r = query("select id from dtb_member where name = $1", [名前]);
  if (r.length !== 1) throw new Error(`メンバー「${名前}」が ${r.length} 人（1人のはず）`);
  return String(r[0].id);
}

function 規格のID(商品コード: string): string {
  const r = query("select id from dtb_product_class where product_code = $1", [商品コード]);
  if (r.length !== 1) throw new Error(`商品コード ${商品コード} の商品規格が ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}

// ---------------------------------------------------------------- 商品（実行の印つきのサプライ品）

export type 規格の値 = {
  基準価格?: number;
  販売価格?: number;
  /** 言語の名前（日本語・英語・フランス語・ドイツ語 など。言語マスタの名前(日)） */
  言語?: string;
  /** 状態の記号（NM・SP・MP・HP） */
  状態?: string;
};

/** 実行の印つきの商品コードの商品規格の、基準価格・販売価格・言語・状態を整える（指定したものだけ） */
export function 商品規格を整える(商品コード: string, v: 規格の値): void {
  規格のID(商品コード);
  if (v.言語 !== undefined) {
    const n = query("select id from mtb_language where name_jp = $1", [v.言語]).length;
    if (n !== 1) throw new Error(`言語「${v.言語}」が言語マスタに ${n} 件（1件のはず）`);
  }
  if (v.状態 !== undefined) {
    const n = query("select id from mtb_card_condition where code = $1", [v.状態]).length;
    if (n !== 1) throw new Error(`状態「${v.状態}」が状態マスタに ${n} 件（1件のはず）`);
  }
  一件(writeTestData({
    理由: `商品規格 ${商品コード} の${[
      v.基準価格 !== undefined ? `基準価格を ${v.基準価格}` : "", v.販売価格 !== undefined ? `販売価格を ${v.販売価格}` : "",
      v.言語 !== undefined ? `言語を ${v.言語}` : "", v.状態 !== undefined ? `状態を ${v.状態}` : "",
    ].filter(Boolean).join("・")} にする`,
    sql: `update dtb_product_class set
            standard_price = coalesce(nullif($2, '')::bigint, standard_price),
            price02 = coalesce(nullif($3, '')::numeric, price02),
            language_id = coalesce((select l.id from mtb_language l where l.name_jp = nullif($4, '')), language_id),
            card_condition_id = coalesce((select c.id from mtb_card_condition c where c.code = nullif($5, '')), card_condition_id)
          where product_code = $1`,
    params: [商品コード, v.基準価格 ?? "", v.販売価格 ?? "", v.言語 ?? "", v.状態 ?? ""],
    対象の確かめ: "select pc.id, pc.product_code from dtb_product_class pc where pc.product_code = $1", 確かめのparams: [商品コード], 印, 最大行数: 1,
  }), "商品規格の更新");
}

// ---------------------------------------------------------------- 買取（実行の印つき）

/** 印つきの買取の買取店舗を、店舗名が一致する既存の店舗に設定する（店舗は変えない。指すだけ） */
export function 買取店舗を設定する(査定ID: string, 店舗ID: string, 店名: string): void {
  const s = query("select shop_name from dtb_base_info where id = $1::int", [数字(店舗ID)]);
  if (s.length !== 1 || s[0].shop_name !== 店名) throw new Error(`店舗ID ${店舗ID} の店名が「${店名}」でない（${s[0]?.shop_name ?? "店舗なし"}）`);
  const id = 受注ID(査定ID);
  一件(writeTestData({
    理由: `買取 ${査定ID} の買取店舗を既存の店舗「${店名}」にする`,
    sql: "update dtb_otc_buy_order set base_info_id = $2::int where id = $1::int",
    params: [数字(id), 数字(店舗ID)],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(id)], 印, 最大行数: 1,
  }), "買取店舗の設定");
}

/** 印つきの買取の会員を、既存の会員に設定する（会員の内部IDを指すだけ） */
export function 会員を設定する(査定ID: string, 会員ID: string): void {
  if (query("select id from dtb_customer where id = $1::int", [数字(会員ID)]).length !== 1) throw new Error(`会員ID ${会員ID} の会員が無い`);
  const id = 受注ID(査定ID);
  一件(writeTestData({
    理由: `買取 ${査定ID} の会員を既存の会員 ${会員ID} にする`,
    sql: "update dtb_otc_buy_order set customer_id = $2::int where id = $1::int",
    params: [数字(id), 数字(会員ID)],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(id)], 印, 最大行数: 1,
  }), "会員の設定");
}

/** 印つきの買取の査定担当者を、同じ名前の既存のメンバーに設定する */
export function 査定担当者を設定する(査定ID: string, 管理者名: string): void {
  const id = 受注ID(査定ID);
  一件(writeTestData({
    理由: `買取 ${査定ID} の査定担当者を、既存のメンバー「${管理者名}」にする`,
    sql: "update dtb_otc_buy_order set member_id = $2::int where id = $1::int",
    params: [数字(id), 数字(メンバーID(管理者名))],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(id)], 印, 最大行数: 1,
  }), "査定担当者の設定");
}

/** 印つきの買取の査定申込日時と更新日時を設定する（日本時間 'YYYY-MM-DD HH:MM:SS'。指定したものだけ） */
export function 申込日時と更新日時を設定する(査定ID: string, v: { 申込?: string; 更新?: string }): void {
  const id = 受注ID(査定ID);
  一件(writeTestData({
    理由: `買取 ${査定ID} の${v.申込 ? `査定申込日時を ${v.申込}` : ""}${v.申込 && v.更新 ? "・" : ""}${v.更新 ? `更新日時を ${v.更新}` : ""} にする`,
    sql: `update dtb_otc_buy_order set
            apply_date = coalesce((nullif($2, '')::timestamp) at time zone 'Asia/Tokyo', apply_date),
            update_date = coalesce((nullif($3, '')::timestamp) at time zone 'Asia/Tokyo', update_date)
          where id = $1::int`,
    params: [数字(id), v.申込 ?? "", v.更新 ?? ""],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(id)], 印, 最大行数: 1,
  }), "査定申込日時・更新日時の設定");
}

/** 印つきの買取の申込者の姓・名を設定する。買取に書く最後の操作にする（姓・名から実行の印が消えるため） */
export function 申込者を設定する(査定ID: string, 姓: string, 名: string): void {
  const id = 受注ID(査定ID);
  一件(writeTestData({
    理由: `買取 ${査定ID} の申込者を「${姓} ${名}」にする`,
    sql: "update dtb_otc_buy_order set last_name = $2, first_name = $3 where id = $1::int",
    params: [数字(id), 姓, 名],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(id)], 印, 最大行数: 1,
  }), "申込者の設定");
}

// ---------------------------------------------------------------- 実在庫・履歴・買取数の元になる行

export type 実在庫の値 = {
  数量: number;
  /** 小計。買取価格（実際の買取単価）は 小計 ÷ 数量 */
  小計: number;
  /** 実在庫履歴の変更前の個数（null は空） */
  変更前: number | null;
  変更後: number;
  /** 実在庫履歴の作業者（既存のメンバーの名前） */
  作業者: string;
  /** 実在庫履歴の作成日時（日本時間 'YYYY-MM-DD HH:MM:SS'。省略は書き込んだ時刻） */
  作成日時?: string;
};

/** 印つきの買取に、実在庫情報（印つきの商品コードの商品）と、その実在庫履歴を1件足す。履歴IDを返す */
export function 実在庫と履歴を足す(査定ID: string, 商品コード: string, v: 実在庫の値): string {
  規格のID(商品コード);
  const id = 受注ID(査定ID);
  const 作業者ID = メンバーID(v.作業者);
  一件(writeTestData({
    理由: `買取 ${査定ID} に実在庫情報（商品 ${商品コード}・数量${v.数量}・小計${v.小計}）を足す`,
    sql: `insert into dtb_otc_buy_order_stock (otc_buy_order_id, product_class_id, quantity, subtotal)
          select o.id, pc.id, $3::int, $4::int from dtb_otc_buy_order o join dtb_product_class pc on pc.product_code = $2 where o.id = $1::int`,
    params: [数字(id), 商品コード, v.数量, v.小計],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(id)], 印, 最大行数: 1,
  }), "実在庫情報");
  const stock = query(`select max(s.id) as id from dtb_otc_buy_order_stock s join dtb_product_class pc on pc.id = s.product_class_id
                        where s.otc_buy_order_id = $1::int and pc.product_code = $2`, [数字(id), 商品コード]);
  const stockId = stock[0]?.id;
  if (!stockId) throw new Error(`足した実在庫情報（買取 ${査定ID}・商品 ${商品コード}）が見つからない`);
  一件(writeTestData({
    理由: `買取 ${査定ID} の実在庫 ${stockId} に実在庫履歴（${v.変更前 ?? "空"}→${v.変更後}・作業者「${v.作業者}」${v.作成日時 ? `・${v.作成日時}` : ""}）を足す`,
    sql: `insert into dtb_otc_buy_order_stock_history (otc_buy_order_stock_id, member_id, before_quantity, after_quantity, create_date)
          select s.id, $2::int, nullif($3, '')::int, $4::int, coalesce((nullif($5, '')::timestamp) at time zone 'Asia/Tokyo', now())
            from dtb_otc_buy_order_stock s where s.id = $1::int`,
    params: [数字(stockId), 数字(作業者ID), v.変更前 === null ? "" : v.変更前, v.変更後, v.作成日時 ?? ""],
    対象の確かめ: "select s.id, o.last_name, o.first_name from dtb_otc_buy_order_stock s join dtb_otc_buy_order o on o.id = s.otc_buy_order_id where s.id = $1::int",
    確かめのparams: [数字(stockId)], 印, 最大行数: 1,
  }), "実在庫履歴");
  const h = query("select max(h.id) as id from dtb_otc_buy_order_stock_history h where h.otc_buy_order_stock_id = $1::int", [数字(stockId)]);
  if (!h[0]?.id) throw new Error(`足した実在庫履歴（実在庫 ${stockId}）が見つからない`);
  return String(h[0].id);
}

/** 印つきの買取に、買取明細（印つきの商品コードの商品）を1件足す。買取数は明細の査定時の個数の合計 */
export function 買取明細を足す(査定ID: string, 商品コード: string, 数量: number, 買取金額: number): void {
  規格のID(商品コード);
  const id = 受注ID(査定ID);
  一件(writeTestData({
    理由: `買取 ${査定ID} に買取明細（商品 ${商品コード}・数量${数量}・買取金額${買取金額}）を足す`,
    sql: `insert into dtb_otc_buy_order_detail (otc_buy_order_id, product_class_id, price, sell_price, original_quantity)
          select o.id, pc.id, $3::int, $3::int, $4::int from dtb_otc_buy_order o join dtb_product_class pc on pc.product_code = $2 where o.id = $1::int`,
    params: [数字(id), 商品コード, 買取金額, 数量],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(id)], 印, 最大行数: 1,
  }), "買取明細");
}

/** 印つきの買取に、実在庫と同じ商品規格に紐づく個別入力商品を1件足す */
export function 実在庫に紐づく個別入力商品を足す(査定ID: string, 商品コード: string, 名前: string, 数量: number, 査定金額: number): void {
  規格のID(商品コード);
  const id = 受注ID(査定ID);
  一件(writeTestData({
    理由: `買取 ${査定ID} に、商品 ${商品コード} の実在庫に紐づく個別入力商品（${名前}・数量${数量}・査定金額${査定金額}）を足す`,
    sql: `insert into dtb_otc_buy_order_indivisual_input_product (otc_buy_order_id, name, product_class_id, price, sell_price, quantity)
          select o.id, $3, pc.id, $4::int, $4::int, $5::int from dtb_otc_buy_order o join dtb_product_class pc on pc.product_code = $2 where o.id = $1::int`,
    params: [数字(id), 商品コード, 名前, 査定金額, 数量],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(id)], 印, 最大行数: 1,
  }), "個別入力商品");
}

/** 実在庫履歴を1件消す（印つきの買取に紐づくものだけ）。履歴IDは画面の行の値 */
export function 実在庫履歴を消す(履歴ID: string): void {
  一件(writeTestData({
    理由: `実在庫履歴 ${履歴ID} を消す（画面で最終ページの履歴が無くなった状態を作る）`,
    sql: "delete from dtb_otc_buy_order_stock_history where id = $1::int",
    params: [数字(履歴ID)],
    対象の確かめ: `select h.id, o.last_name, o.first_name from dtb_otc_buy_order_stock_history h
                    join dtb_otc_buy_order_stock s on s.id = h.otc_buy_order_stock_id join dtb_otc_buy_order o on o.id = s.otc_buy_order_id where h.id = $1::int`,
    確かめのparams: [数字(履歴ID)], 印, 最大行数: 1,
  }), "実在庫履歴の削除");
}

// ---------------------------------------------------------------- 読むだけ

/** 買取（査定ID）に紐づく会員の会員ID。会員がなければ止める */
export function 会員IDを調べる(査定ID: string): string {
  const r = query("select customer_id as id from dtb_otc_buy_order where assessment_id = $1", [査定ID]);
  if (r.length !== 1 || !r[0].id) throw new Error(`査定ID ${査定ID} の買取に会員が紐づいていない`);
  return String(r[0].id);
}

/** 商品コードの実在庫を持つ買取の査定ID（1件でなければ止める） */
export function 商品コードの査定ID(商品コード: string): string {
  const r = query(`select distinct o.assessment_id as id from dtb_otc_buy_order_stock s
                     join dtb_product_class pc on pc.id = s.product_class_id join dtb_otc_buy_order o on o.id = s.otc_buy_order_id
                    where pc.product_code = $1`, [商品コード]);
  if (r.length !== 1) throw new Error(`商品コード ${商品コード} の実在庫を持つ買取が ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}
