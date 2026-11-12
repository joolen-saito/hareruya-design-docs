/**
 * M07-10 買取商品履歴 のシードの、画面で作れない部分を DB で整える書き込み（依頼者決定 2026-11-10「印つきデータは何でも」）。
 * 物理名はこのファイルの SQL の中にだけ書く。書き込みは db/write_adapter.ts の writeTestData を通す。
 * 書く先は、E2E が画面で作った「実行の印つき」の買取（会員のメールアドレスに実行の印が入っている）とその実在庫・履歴、
 * 印つきの商品コードの商品規格だけ。共有のマスタ・設定・ほかの人のデータには書かない。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";

function 数字(s: string): string {
  if (!/^\d+$/.test(s)) throw new Error(`番号が数字でない（${s}）`);
  return String(Number(s));
}
const 買取の確かめ = "select b.id, b.email from dtb_buy_order b where b.id = $1::int";
function 一件(n: number, 何: string): void {
  if (n !== 1) throw new Error(`${何}: 書き込んだ行が ${n} 行（1行のはず）`);
}

/** 印つきの買取の査定担当者（メンバー）を、ログインIDのメンバーにする */
export function 査定担当者を設定する(買取番号: string, 印: string, ログインID: string): void {
  const m = query("select count(*) as n from dtb_member where login_id = $1", [ログインID])[0];
  if (Number(m.n) !== 1) throw new Error(`ログインID ${ログインID} のメンバーが ${m.n} 件（1件のはず）`);
  一件(writeTestData({
    理由: `買取 ${買取番号} の査定担当者をメンバー ${ログインID} にする`,
    sql: "update dtb_buy_order set member_id = (select m.id from dtb_member m where m.login_id = $2) where id = $1::int",
    params: [数字(買取番号), ログインID],
    対象の確かめ: 買取の確かめ, 確かめのparams: [数字(買取番号)], 印, 最大行数: 1,
  }), "査定担当者");
}

/** 印つきの商品コードの商品規格の基準価格・販売価格を設定する（印は商品コード） */
export function 商品の価格を設定する(商品コード: string, 基準価格: number, 販売価格: number): void {
  一件(writeTestData({
    理由: `商品規格 ${商品コード} の基準価格を ${基準価格}・販売価格を ${販売価格} にする`,
    sql: "update dtb_product_class set standard_price = $2::int, price02 = $3::int where product_code = $1",
    params: [商品コード, 基準価格, 販売価格],
    対象の確かめ: "select pc.id, pc.product_code from dtb_product_class pc where pc.product_code = $1", 確かめのparams: [商品コード], 印: 商品コード, 最大行数: 1,
  }), "商品の価格");
}

const 履歴の確かめ = `select h.id, b.email from dtb_buy_order_stock_history h
   join dtb_buy_order_stock s on s.id = h.buy_order_stock_id join dtb_buy_order b on b.id = s.buy_order_id
   join dtb_product_class pc on pc.id = s.product_class_id
  where b.id = $1::int and pc.product_code = $2`;

/** 印つきの買取の、商品の実在庫履歴（1件）の変更後の数量を設定する */
export function 実在庫履歴の数量を設定する(買取番号: string, 印: string, 商品コード: string, 数量: number): void {
  const n = query(履歴の確かめ, [数字(買取番号), 商品コード]).length;
  if (n !== 1) throw new Error(`買取 ${買取番号} の ${商品コード} の実在庫履歴が ${n} 件（1件のはず）`);
  一件(writeTestData({
    理由: `買取 ${買取番号} の ${商品コード} の実在庫履歴の数量を ${数量} にする`,
    sql: `update dtb_buy_order_stock_history set after_quantity = $3::int
           where id in (select h.id from dtb_buy_order_stock_history h join dtb_buy_order_stock s on s.id = h.buy_order_stock_id
                         join dtb_product_class pc on pc.id = s.product_class_id where s.buy_order_id = $1::int and pc.product_code = $2)`,
    params: [数字(買取番号), 商品コード, 数量],
    対象の確かめ: 履歴の確かめ, 確かめのparams: [数字(買取番号), 商品コード], 印, 最大行数: 1,
  }), "実在庫履歴の数量");
}

/** 印つきの買取の、商品の実在庫（1件）の数量を設定する（履歴は増やさない） */
export function 実在庫の数量を設定する(買取番号: string, 印: string, 商品コード: string, 数量: number): void {
  const 確かめ = `select s.id, b.email from dtb_buy_order_stock s join dtb_buy_order b on b.id = s.buy_order_id
                   join dtb_product_class pc on pc.id = s.product_class_id where b.id = $1::int and pc.product_code = $2`;
  const n = query(確かめ, [数字(買取番号), 商品コード]).length;
  if (n !== 1) throw new Error(`買取 ${買取番号} の ${商品コード} の実在庫が ${n} 件（1件のはず）`);
  一件(writeTestData({
    理由: `買取 ${買取番号} の ${商品コード} の実在庫の数量を ${数量} にする`,
    sql: `update dtb_buy_order_stock set quantity = $3::int
           where id in (select s.id from dtb_buy_order_stock s join dtb_product_class pc on pc.id = s.product_class_id where s.buy_order_id = $1::int and pc.product_code = $2)`,
    params: [数字(買取番号), 商品コード, 数量],
    対象の確かめ: 確かめ, 確かめのparams: [数字(買取番号), 商品コード], 印, 最大行数: 1,
  }), "実在庫の数量");
}

/**
 * 買取の実在庫の数量の合計・実在庫履歴の件数・買取明細の件数・買取状況の名前を読む（参照だけ。M07-10-030 の確かめ）。
 * q はケースのDB確認の窓口（ctx.db.query）を渡す。
 */
export function 買取の中身を読む(q: (sql: string, params?: (string | number)[]) => { [k: string]: string | null }[], 買取番号: string): { 実在庫の数量: number; 実在庫履歴の件数: number; 買取明細の件数: number; 買取状況: string } {
  const b = 数字(買取番号);
  const n = (sql: string) => Number(q(sql, [b])[0].n);
  return {
    実在庫の数量: n("select coalesce(sum(quantity), 0) as n from dtb_buy_order_stock where buy_order_id = $1::int"),
    実在庫履歴の件数: n("select count(*) as n from dtb_buy_order_stock_history h join dtb_buy_order_stock s on s.id = h.buy_order_stock_id where s.buy_order_id = $1::int"),
    買取明細の件数: n("select count(*) as n from dtb_buy_main_card where buy_order_id = $1::int"),
    買取状況: String(q("select s.name as n from dtb_buy_order b join mtb_buy_order_status s on s.id = b.buy_order_status_id where b.id = $1::int", [b])[0].n),
  };
}

/** 買取状況マスタの名前（参照だけ） */
export function 買取状況の名前一覧(): string[] {
  return query("select name as n from mtb_buy_order_status order by rank").map((r) => String(r.n));
}
