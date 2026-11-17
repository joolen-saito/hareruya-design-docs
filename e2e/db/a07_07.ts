/**
 * A07-07 個別入力商品の一覧取得（MTGバイヤーの API）の DB の参照と、画面で作れない個別入力商品の書き込み。
 *
 * 個別入力商品は画面で作れないので、シード表の番号（940707001 など）・値で、E2E の買取（会員のメールアドレスに実行の印がある行）にぶら下げる
 * （db/write_adapter.ts → lib/db_write.ts。依頼者決定 2026-11-10）。
 * - シード表の「既存試験データを削除してから登録する」は行わない（消さない）。同じ番号の行が前の実行の E2E の買取（メールアドレスが a0707- で始まる
 *   試験用の @example.test）にぶら下がっていれば、その行を今回の買取へ付け替えて値を書き直す。ほかの方の行なら止める。無ければ番号を指定して足す。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";

function 数字(s: string | number): string {
  const v = String(s);
  if (!/^\d+$/.test(v)) throw new Error(`番号が数字でない（${v}）`);
  return String(Number(v));
}
function 一件(n: number, 何: string): void {
  if (n !== 1) throw new Error(`${何}: 書き込んだ行が ${n} 行（1行のはず）`);
}

export type 個別入力 = { ID: string; 名前: string; 金額: number | null; 枚数: number | null; 売却: boolean | null };
const 値 = (v: number | boolean | null): string => (v === null ? "" : String(v));
/** 前の実行の E2E の買取の印（会員のメールアドレスの頭）。この機能のシードの会員だけが持つ */
const E2Eの頭 = "a0707-";

/** 個別入力商品を、印つきの買取に、シード表の番号で置く（あれば E2E の行だけ付け替える。消さない） */
export function 個別入力商品を置く(買取番号: string, メール: string, v: 個別入力): void {
  const 今の買取 = query("select email from dtb_buy_order where id = $1::int", [数字(買取番号)])[0];
  if (!今の買取 || String(今の買取.email) !== メール) throw new Error(`買取 ${買取番号} の会員のメールアドレスが ${メール} でない（E2E の買取と確かめられない）`);
  const 既存 = query(`select p.id::text as id, b.email from dtb_buy_order_indivisual_input_product p join dtb_buy_order b on b.id = p.buy_order_id where p.id = $1::int`, [数字(v.ID)])[0];
  if (既存) {
    const e = String(既存.email);
    if (!(e.startsWith(E2Eの頭) && e.endsWith("@example.test"))) throw new Error(`個別入力商品 ${v.ID} は E2E でない買取（${e.replace(/^(.{3}).*@/, "$1…@")}）にぶら下がっている。書き換えない`);
    一件(writeTestData({
      理由: `A07-07: 前の実行の E2E の買取にある個別入力商品 ${v.ID} を、買取 ${買取番号} へ付け替えて値（${v.名前}・金額${値(v.金額)}・枚数${値(v.枚数)}・売却${値(v.売却)}）を書き直す（消さない）`,
      sql: `update dtb_buy_order_indivisual_input_product set buy_order_id = $2::int, name = $3, price = nullif($4, '')::int, quantity = nullif($5, '')::int, sale_flg = nullif($6, '')::boolean, product_class_id = null where id = $1::int`,
      params: [数字(v.ID), 数字(買取番号), v.名前, 値(v.金額), 値(v.枚数), 値(v.売却)],
      対象の確かめ: `select p.id, b.email from dtb_buy_order_indivisual_input_product p join dtb_buy_order b on b.id = p.buy_order_id where p.id = $1::int`,
      確かめのparams: [数字(v.ID)], 印: E2Eの頭, 最大行数: 1,
    }), "個別入力商品の付け替え");
    return;
  }
  一件(writeTestData({
    理由: `A07-07: 買取 ${買取番号} に個別入力商品 ${v.ID}（${v.名前}・金額${値(v.金額)}・枚数${値(v.枚数)}・売却${値(v.売却)}）を足す（画面で作れない）`,
    sql: `insert into dtb_buy_order_indivisual_input_product (id, buy_order_id, name, price, quantity, sale_flg)
          select $2::int, b.id, $3, nullif($4, '')::int, nullif($5, '')::int, nullif($6, '')::boolean from dtb_buy_order b where b.id = $1::int`,
    params: [数字(買取番号), 数字(v.ID), v.名前, 値(v.金額), 値(v.枚数), 値(v.売却)],
    対象の確かめ: "select b.id, b.email from dtb_buy_order b where b.id = $1::int", 確かめのparams: [数字(買取番号)], 印: メール, 最大行数: 1,
  }), "個別入力商品");
}

export type 個別入力の行 = { ID: string; 名前: string; 金額: string | null; 枚数: string | null; 売却: string | null };
/** 買取にぶら下がる個別入力商品（番号の順） */
export function 個別入力商品を読む(買取番号: string): 個別入力の行[] {
  return query("select id::text as id, name, price::text as price, quantity::text as q, sale_flg::text as s from dtb_buy_order_indivisual_input_product where buy_order_id = $1::int order by id", [数字(買取番号)])
    .map((r) => ({ ID: String(r.id), 名前: String(r.name), 金額: r.price === null ? null : String(r.price), 枚数: r.q === null ? null : String(r.q), 売却: r.s === null ? null : String(r.s) }));
}

/** 買取の買取状況の名前 */
export function 買取状況の名前(買取番号: string): string | null {
  const r = query("select s.name from dtb_buy_order b join mtb_buy_order_status s on s.id = b.buy_order_status_id where b.id = $1::int", [数字(買取番号)])[0];
  return r ? String(r.name) : null;
}
