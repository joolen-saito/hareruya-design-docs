/**
 * A07-06 ネット買取受注の商品一覧（買取代表カード）取得（MTGバイヤーの API）の DB の参照と、画面で作れない明細の値の書き込み。
 * 書き込みは E2E の買取（会員のメールアドレスに実行の印がある行）の明細にだけ行う（db/write_adapter.ts → lib/db_write.ts。依頼者決定 2026-11-10）。
 * 申込時買取価格・明細を消す関数は、呼ぶ側（seeds/a07-06.ts）が消してよいの一覧に載っていることを確かめてから呼ぶ（seeds/a07-common.ts の 消してよいか）。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";

function 数字(s: string | number): string {
  const v = String(s);
  if (!/^\d+$/.test(v)) throw new Error(`番号が数字でない（${v}）`);
  return String(Number(v));
}
const 明細の確かめ = "select m.id, b.email from dtb_buy_main_card m join dtb_buy_order b on b.id = m.buy_order_id where m.id = $1::int";
const 買取の確かめ = "select b.id, b.email from dtb_buy_order b where b.id = $1::int";

export type 明細 = { ID: string; 商品ID: string; 言語ID: string | null; 状態ID: string | null; 枚数: string | null; 査定金額: string | null; フォイル: string | null; 売却: string | null; 買取カテゴリ: string; 申込時: { 状態: string; 金額: string }[] };

/** 買取の明細（買取代表カード）と申込時買取価格 */
export function 明細を読む(買取番号: string): 明細[] {
  return query(`select m.id::text as id, m.product_id::text as p, m.language_id::text as l, m.card_condition_id::text as c, m.count::text as n, m.price::text as pr,
      m.foil_flg::text as f, m.sale_flg::text as s, m.purchase_category::text as cat from dtb_buy_main_card m where m.buy_order_id = $1::int order by m.id`, [数字(買取番号)])
    .map((r) => ({
      ID: String(r.id), 商品ID: String(r.p), 言語ID: r.l as string | null, 状態ID: r.c as string | null, 枚数: r.n as string | null, 査定金額: r.pr as string | null,
      フォイル: r.f as string | null, 売却: r.s as string | null, 買取カテゴリ: String(r.cat),
      申込時: query("select c.code, a.application_price::text as v from dtb_application_price a join mtb_card_condition c on c.id = a.card_condition_id where a.buy_main_card_id = $1::int order by c.id", [String(r.id)])
        .map((x) => ({ 状態: String(x.code), 金額: String(x.v) })),
    }));
}

export type 明細の値 = { 言語ID?: number | null; 状態ID?: number | null; 枚数?: number | null; 査定金額?: number | null; フォイル?: number | null; 売却?: boolean | null; 買取カテゴリ?: number };
const 列: Record<keyof 明細の値, string> = { 言語ID: "language_id", 状態ID: "card_condition_id", 枚数: "count", 査定金額: "price", フォイル: "foil_flg", 売却: "sale_flg", 買取カテゴリ: "purchase_category" };

/** E2E の買取の明細の値を書く（画面で指定できない値。null は未設定） */
export function 明細に書く(明細ID: string, メール: string, v: 明細の値): void {
  const keys = (Object.keys(v) as (keyof 明細の値)[]).filter((k) => v[k] !== undefined);
  if (keys.length === 0) return;
  const sets = keys.map((k, i) => (v[k] === null ? `${列[k]} = null` : `${列[k]} = $${i + 2}${k === "売却" ? "::boolean" : "::int"}`));
  const params = [数字(明細ID), ...keys.map((k) => (v[k] === null ? "" : String(v[k])))];
  const n = writeTestData({
    理由: `A07-06: 明細 ${明細ID} の ${keys.map((k) => `${k}=${v[k]}`).join("・")} を書く（画面で指定できない）`,
    sql: `update dtb_buy_main_card set ${sets.join(", ")} where id = $1::int`,
    params, 対象の確かめ: 明細の確かめ, 確かめのparams: [数字(明細ID)], 印: メール, 最大行数: 1,
  });
  if (n !== 1) throw new Error(`明細 ${明細ID} に書いた行が ${n} 行`);
}

/** E2E の買取の明細の申込時買取価格を、状態のコードの金額にする（行があれば金額を書き換え、無ければ足す） */
export function 申込時買取価格を置く(明細ID: string, メール: string, 状態コード: string, 金額: number): void {
  const c = query("select id::text as id from mtb_card_condition where code = $1", [状態コード])[0];
  if (!c) throw new Error(`カードの状態のコード ${状態コード} が無い`);
  const 既存 = query("select id::text as id from dtb_application_price where buy_main_card_id = $1::int and card_condition_id = $2::int", [数字(明細ID), String(c.id)])[0];
  const n = 既存
    ? writeTestData({ 理由: `A07-06: 明細 ${明細ID} の申込時買取価格 ${状態コード} を ${金額} にする`, sql: "update dtb_application_price set application_price = $2::int where id = $1::int",
        params: [String(既存.id), 金額], 対象の確かめ: "select a.id, b.email from dtb_application_price a join dtb_buy_main_card m on m.id = a.buy_main_card_id join dtb_buy_order b on b.id = m.buy_order_id where a.id = $1::int",
        確かめのparams: [String(既存.id)], 印: メール, 最大行数: 1 })
    : writeTestData({ 理由: `A07-06: 明細 ${明細ID} に申込時買取価格 ${状態コード}=${金額} を足す`, sql: "insert into dtb_application_price (buy_main_card_id, card_condition_id, application_price) select m.id, $2::int, $3::int from dtb_buy_main_card m where m.id = $1::int",
        params: [数字(明細ID), String(c.id), 金額], 対象の確かめ: 明細の確かめ, 確かめのparams: [数字(明細ID)], 印: メール, 最大行数: 1 });
  if (n !== 1) throw new Error(`明細 ${明細ID} の申込時買取価格 ${状態コード} に書いた行が ${n} 行`);
}

/** E2E の買取の明細の申込時買取価格を0件にする（消す。呼ぶ前に 消してよいか を通す） */
export function 申込時買取価格を消す(明細ID: string, メール: string): number {
  return writeTestData({
    理由: `A07-06: 明細 ${明細ID} の申込時買取価格を0件にする（申込みで作られた E2E の行を消す）`,
    sql: "delete from dtb_application_price where buy_main_card_id = $1::int",
    params: [数字(明細ID)], 対象の確かめ: "select a.id, b.email from dtb_application_price a join dtb_buy_main_card m on m.id = a.buy_main_card_id join dtb_buy_order b on b.id = m.buy_order_id where m.id = $1::int",
    確かめのparams: [数字(明細ID)], 印: メール, 最大行数: 20,
  });
}

/** E2E の買取の明細（買取代表カード）を0件にする（消す。呼ぶ前に 消してよいか と 申込時買取価格を消す を通す） */
export function 明細を消す(買取番号: string, メール: string): number {
  return writeTestData({
    理由: `A07-06: 買取 ${買取番号} の明細を0件にする（申込みで作られた E2E の行を消す）`,
    sql: "delete from dtb_buy_main_card where buy_order_id = $1::int",
    params: [数字(買取番号)], 対象の確かめ: "select m.id, b.email from dtb_buy_main_card m join dtb_buy_order b on b.id = m.buy_order_id where b.id = $1::int",
    確かめのparams: [数字(買取番号)], 印: メール, 最大行数: 20,
  });
}
void 買取の確かめ;
