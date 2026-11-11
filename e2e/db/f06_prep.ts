/**
 * F06-15（買取履歴詳細）・F06-11（買取履歴一覧）のシードの、画面で作れない部分を DB で整える書き込み（依頼者の承認 2026-11-10「印つきデータは何でも」）。
 * 物理名はこのファイルの SQL の中にだけ書く。書き込みはすべて db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） を通す（1文ずつ・印の確かめ・行数の上限・ログ）。
 *
 * 書く先は、E2E が画面で作った「実行の印つき」のもの（会員のメールアドレスに実行の印が入っている買取、印つきの商品コードの商品）だけ。
 * 共有のマスタ・設定・ほかの人のデータには書かない。M07 の部品（db/m07_prep.ts）はそのまま使い、ここにはその外の書き込みだけを置く。
 *
 * 行の形は、アプリのエンティティの定義に合わせた（読んだもの）:
 * - ネット買取の明細（買取代表カード）: 買取区分（1=えらんで買取・2=まとめて買取）・査定価格・数量・売却・カード状態。申込みで作られた明細を書き換える
 *   （申込時買取価格の行・商品・言語は申込みで入っているので、そのまま活かす）。
 * - 店頭買取の明細: 査定時の個数・査定金額・商品規格（店頭買取注文詳細）。個別入力商品: 商品名・査定金額・個数・商品規格（空でもよい）。
 * - 店頭買取注文: 申込日時・成立日時（完了日時）・査定合計金額・店頭買取ステータス。
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

const 売却の値 = (v: "する" | "しない" | "未定"): string => (v === "する" ? "true" : v === "しない" ? "false" : "");

// ---------------------------------------------------------------- 商品（印つきの商品コード）

const 商品の確かめ = "select pc.id, pc.product_code from dtb_product_class pc where pc.product_code = $1";

/** 印つきの商品の商品規格を、明細の言語・状態と一致しない状態（その他）にする。ネット買取の明細から商品規格が特定できなくなる */
export function 商品規格を特定できなくする(商品コード: string): void {
  一件(writeTestData({
    理由: `商品 ${商品コード} の商品規格の状態を「その他」にして、明細の言語・状態と一致しないようにする`,
    sql: "update dtb_product_class set card_condition_id = 5 where product_code = $1 and card_condition_id <> 5",
    params: [商品コード], 対象の確かめ: 商品の確かめ, 確かめのparams: [商品コード], 印: 商品コード, 最大行数: 1,
  }), "商品規格");
}

/** 印つきの商品と商品規格を論理削除済み（商品は廃止・商品規格は非表示）にする。明細との関連は残す */
export function 商品と規格を論理削除する(商品コード: string): void {
  一件(writeTestData({
    理由: `商品 ${商品コード} の商品規格を非表示にする（論理削除）`,
    sql: "update dtb_product_class set visible = false where product_code = $1",
    params: [商品コード], 対象の確かめ: 商品の確かめ, 確かめのparams: [商品コード], 印: 商品コード, 最大行数: 1,
  }), "商品規格の論理削除");
  一件(writeTestData({
    理由: `商品 ${商品コード} を廃止にする（論理削除）`,
    sql: "update dtb_product set product_status_id = 3 where id = (select pc.product_id from dtb_product_class pc where pc.product_code = $1)",
    params: [商品コード],
    対象の確かめ: "select p.id, pc.product_code from dtb_product p join dtb_product_class pc on pc.product_id = p.id where pc.product_code = $1",
    確かめのparams: [商品コード], 印: 商品コード, 最大行数: 1,
  }), "商品の論理削除");
}

// ---------------------------------------------------------------- ネット買取の明細（申込みで作られた明細を書き換える）

export type 明細の設定 = {
  /** 区分を変える（申込みの明細はえらんで買取） */
  区分?: "えらんで買取" | "まとめて買取";
  /** 査定価格（null＝未確定） */
  査定価格?: number | null;
  数量?: number;
  売却?: "する" | "しない" | "未定";
  /** カード状態の定義順（1=NM, 2=SP, 3=MP, 4=HP, 5=その他） */
  状態の定義順?: number;
};

const 買取の確かめ = "select b.id, b.email from dtb_buy_order b where b.id = $1::int";

/** 印つきの買取の、印つきの商品コードの商品の明細（1件）を書き換える */
export function 明細を設定する(買取番号: string, 印: string, 商品コード: string, v: 明細の設定): void {
  const set: string[] = [];
  const params: (string | number)[] = [数字(買取番号), 商品コード];
  const p = (x: string | number): string => { params.push(x); return `$${params.length}`; };
  if (v.区分) set.push(`purchase_category = ${p(v.区分 === "えらんで買取" ? 1 : 2)}::int`);
  if (v.査定価格 !== undefined) set.push(`price = nullif(${p(v.査定価格 === null ? "" : v.査定価格)}, '')::int`);
  if (v.数量 !== undefined) set.push(`count = ${p(v.数量)}::int`);
  if (v.売却) set.push(`sale_flg = nullif(${p(売却の値(v.売却))}, '')::boolean`);
  if (v.状態の定義順) set.push(`card_condition_id = ${p(v.状態の定義順)}::int`);
  if (!set.length) return;
  const 条件 = "buy_order_id = $1::int and product_id = (select pc.product_id from dtb_product_class pc where pc.product_code = $2)";
  一件(writeTestData({
    理由: `買取 ${買取番号} の明細 ${商品コード} を書き換える（${JSON.stringify(v)}）`,
    sql: `update dtb_buy_main_card set ${set.join(", ")} where ${条件}`,
    params,
    対象の確かめ: `select c.id, b.email from dtb_buy_main_card c join dtb_buy_order b on b.id = c.buy_order_id
                   where c.buy_order_id = $1::int and c.product_id = (select pc.product_id from dtb_product_class pc where pc.product_code = $2)`,
    確かめのparams: [数字(買取番号), 商品コード], 印, 最大行数: 1,
  }), `明細 ${商品コード}`);
}

/** 画面で作った印つきの買取の、明細のID（読むだけ。明細の件数の確かめ用） */
export function 明細の数(買取番号: string): number {
  return Number(query("select count(*) as n from dtb_buy_main_card where buy_order_id = $1::int", [数字(買取番号)])[0].n);
}

// ---------------------------------------------------------------- 店頭買取

const 店頭の確かめ = "select o.id, c.email from dtb_otc_buy_order o join dtb_customer c on c.id = o.customer_id where o.id = $1::int";

/** 店頭買取ステータスの番号（アプリの定数） */
export const 店頭の状況の番号 = {
  買取成立: 1, 買取キャンセル: 2, 査定前: 5, 査定中: 6, 査定中断: 8, 査定再開: 9, 経理払い出し待ち: 10,
} as const;
export type 店頭の状況名 = keyof typeof 店頭の状況の番号;

export type 店頭の設定 = {
  /** 「2026-06-09 12:00:00+09」の形 */
  依頼日?: string;
  成立日?: string;
  査定金額合計?: number;
  状況?: 店頭の状況名;
};

/** 印つきの店頭買取の、依頼日・成立日・査定金額合計・ステータスを設定する */
export function 店頭買取を設定する(店頭ID: string, 印: string, v: 店頭の設定): void {
  const set: string[] = [];
  const params: (string | number)[] = [数字(店頭ID)];
  const p = (x: string | number): string => { params.push(x); return `$${params.length}`; };
  if (v.依頼日) set.push(`apply_date = ${p(v.依頼日)}::timestamptz`);
  if (v.成立日) set.push(`complete_date = ${p(v.成立日)}::timestamptz`);
  if (v.査定金額合計 !== undefined) set.push(`total_price = ${p(v.査定金額合計)}::int`);
  if (v.状況) set.push(`otc_buy_order_status_id = ${p(店頭の状況の番号[v.状況])}::int`);
  if (!set.length) return;
  一件(writeTestData({
    理由: `店頭買取 ${店頭ID} を設定する（${JSON.stringify(v)}）`,
    sql: `update dtb_otc_buy_order set ${set.join(", ")} where id = $1::int`,
    params, 対象の確かめ: 店頭の確かめ, 確かめのparams: [数字(店頭ID)], 印, 最大行数: 1,
  }), "店頭買取の設定");
}

/** 印つきの店頭買取に、明細（印つきの商品コードの商品規格）を1件足す。査定価格 null＝未確定 */
export function 店頭の明細を足す(店頭ID: string, 印: string, v: { 商品コード: string; 査定価格: number | null; 数量: number }): void {
  const n = Number(query("select count(*) as n from dtb_product_class where product_code = $1", [v.商品コード])[0].n);
  if (n !== 1) throw new Error(`商品コード ${v.商品コード} の商品規格が ${n} 件（1件のはず）`);
  一件(writeTestData({
    理由: `店頭買取 ${店頭ID} に明細 ${v.商品コード}（査定価格${v.査定価格 ?? "未確定"}・数量${v.数量}）を足す`,
    sql: `insert into dtb_otc_buy_order_detail (otc_buy_order_id, product_class_id, price, original_quantity)
          select o.id, pc.id, nullif($3, '')::int, $4::int from dtb_otc_buy_order o join dtb_product_class pc on pc.product_code = $2 where o.id = $1::int`,
    params: [数字(店頭ID), v.商品コード, v.査定価格 === null ? "" : v.査定価格, v.数量],
    対象の確かめ: 店頭の確かめ, 確かめのparams: [数字(店頭ID)], 印, 最大行数: 1,
  }), "店頭買取の明細");
}

/** 印つきの店頭買取に、個別入力商品を1件足す（商品規格は空）。査定価格 null＝未確定 */
export function 店頭の個別入力を足す(店頭ID: string, 印: string, v: { 名前: string; 査定価格: number | null; 数量: number }): void {
  一件(writeTestData({
    理由: `店頭買取 ${店頭ID} に個別入力商品 ${v.名前}（査定価格${v.査定価格 ?? "未確定"}・数量${v.数量}）を足す`,
    sql: `insert into dtb_otc_buy_order_indivisual_input_product (otc_buy_order_id, name, price, quantity)
          select o.id, $2, nullif($3, '')::int, $4::int from dtb_otc_buy_order o where o.id = $1::int`,
    params: [数字(店頭ID), v.名前, v.査定価格 === null ? "" : v.査定価格, v.数量],
    対象の確かめ: 店頭の確かめ, 確かめのparams: [数字(店頭ID)], 印, 最大行数: 1,
  }), "店頭買取の個別入力商品");
}

// ---------------------------------------------------------------- 参照

/** 買取番号（数字）の実在庫情報のうち、商品コードのものの件数と、その実在庫の履歴の件数 */
export function 商品コードの実在庫と履歴(買取番号: string, 商品コード: string): { 実在庫: number; 履歴: number } {
  const s = Number(query(
    `select count(*) as n from dtb_buy_order_stock s join dtb_product_class pc on pc.id = s.product_class_id where s.buy_order_id = $1::int and pc.product_code = $2`,
    [数字(買取番号), 商品コード])[0].n);
  const h = Number(query(
    `select count(*) as n from dtb_buy_order_stock_history h join dtb_buy_order_stock s on s.id = h.buy_order_stock_id
       join dtb_product_class pc on pc.id = s.product_class_id where s.buy_order_id = $1::int and pc.product_code = $2`,
    [数字(買取番号), 商品コード])[0].n);
  return { 実在庫: s, 履歴: h };
}

/** 画面の確かめ用: 買取（数字）の買取番号・商品・数量の保存値（件数と明細の並びを文字にしたもの） */
export function 買取の保存値(買取番号: string): { 買取件数: number; 明細: string[]; 個別入力: string[] } {
  const b = Number(query("select count(*) as n from dtb_buy_order where id = $1::int", [数字(買取番号)])[0].n);
  const m = query(
    `select pc.product_code as code, c.purchase_category as cat, c.count as cnt, c.price as price, c.sale_flg as sale
       from dtb_buy_main_card c left join dtb_product_class pc on pc.product_id = c.product_id where c.buy_order_id = $1::int order by c.id`,
    [数字(買取番号)]).map((r) => `${r.code}/${r.cat}/${r.cnt}/${r.price}/${r.sale}`);
  const i = query(
    "select name, quantity, price, sale_flg from dtb_buy_order_indivisual_input_product where buy_order_id = $1::int order by id",
    [数字(買取番号)]).map((r) => `${r.name}/${r.quantity}/${r.price}/${r.sale_flg}`);
  return { 買取件数: b, 明細: m, 個別入力: i };
}
