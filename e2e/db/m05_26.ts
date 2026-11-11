/**
 * M05-26 出荷実績インポート登録の、DB の書き込み（シードの準備。実行の印つきの受注・会員だけ）と、取込結果の照会（参照だけ）。
 * 依頼者の承認（2026-11-10「印つきデータは何でも」）の範囲で、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通して書く。
 *
 * 守ること:
 *  - 書き換えるのは、この実行の印を含む商品コードの明細を持つ受注（画面でシードが作った受注と、その複製）と、その受注の会員だけ。
 *    対象の確かめの SELECT が返す行は、どれも印を含む（含まなければ writeTestData が書かずに止める）。
 *  - 物理名（テーブル・カラム）はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";

const 印 = RUN_MARK;

/** 受注が、この実行の印つきの商品コードの明細を持つことを確かめる SELECT */
function 受注の確かめ(受注ID: string) {
  return {
    対象の確かめ: `select o.id as 受注ID, i.product_code as 商品コード from dtb_order o join dtb_order_item i on i.order_id = o.id
                    where o.id = $1::int and i.product_code like $2`,
    確かめのparams: [受注ID, `%${印}%`],
    印,
  };
}

/** 会員が、この実行の印つきの商品コードの明細を持つ受注を持つことを確かめる SELECT */
function 会員の確かめ(会員ID: string) {
  return {
    対象の確かめ: `select c.id as 会員ID, i.product_code as 商品コード from dtb_customer c
                    join dtb_order o on o.customer_id = c.id join dtb_order_item i on i.order_id = o.id
                    where c.id = $1::int and i.product_code like $2 limit 1`,
    確かめのparams: [会員ID, `%${印}%`],
    印,
  };
}

/** 日本時間の「2026-08-01 09:00:00」を時刻つきの値に直す */
function 日本時間(s: string): string {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}(:\d{2})?$/.test(s)) throw new Error(`日時の形が違う: ${s}（YYYY-MM-DD HH:MM[:SS]）`);
  return `${s}${s.length === 16 ? ":00" : ""}+09:00`;
}

/** 表の列名（除く列以外）を information_schema から読む（参照だけ） */
function 列(表: string, 除く: string[]): string[] {
  const rows = query(`select column_name from information_schema.columns where table_schema = 'public' and table_name = $1 order by ordinal_position`, [表]);
  const cols = rows.map((r) => String(r.column_name)).filter((c) => !除く.includes(c));
  if (cols.length === 0) throw new Error(`表 ${表} の列を読めない`);
  return cols;
}

// ---------------------------------------------------------------- 書き込み（シードの準備）

/** 受注の付与ポイント（受注のポイント発生）を設定する。null で空 */
export function 付与ポイントを設定(受注ID: string, ポイント: number | null): void {
  writeTestData({
    理由: "付与ポイントをシード表の値にする（受注情報編集画面のポイント発生欄の値は無視されるため画面で指定できない）",
    sql: ポイント === null ? `update dtb_order set gained_points = null where id = $1::int` : `update dtb_order set gained_points = $2::bigint where id = $1::int`,
    params: ポイント === null ? [受注ID] : [受注ID, ポイント], ...受注の確かめ(受注ID), 最大行数: 1,
  });
}

/** 会員のポイント残高を設定する（ポイント付与画面で付与するとポイント履歴が1件できるため画面で指定できない） */
export function 会員ポイント残高を設定(会員ID: string, ポイント: number): void {
  writeTestData({
    理由: "会員ポイント残高をシード表の値にする",
    sql: `update dtb_player set point = $2::int where customer_id = $1::int`,
    params: [会員ID, ポイント], ...会員の確かめ(会員ID), 最大行数: 1,
  });
}

/** 受注の最初の配送先を写して、配送先を1件足す（配送先を画面で追加できないため） */
export function 配送先を足す(受注ID: string): void {
  const cols = 列("dtb_shipping", ["id"]);
  writeTestData({
    理由: "2件目の配送を足す（配送は画面で追加できない）",
    sql: `insert into dtb_shipping (${cols.join(", ")}) select ${cols.map((c) => `s.${c}`).join(", ")} from dtb_shipping s
           where s.order_id = $1::int and s.id = (select min(x.id) from dtb_shipping x where x.order_id = $1::int)`,
    params: [受注ID], ...受注の確かめ(受注ID), 最大行数: 1,
  });
}

/** 受注の配送情報すべての出荷日を設定する（"YYYY-MM-DD HH:MM[:SS]" 日本時間。null で空） */
export function 配送の出荷日を設定(受注ID: string, 日時: string | null): void {
  writeTestData({
    理由: "配送情報の出荷日をシード表・手順の値にする",
    sql: 日時 === null ? `update dtb_shipping set shipping_date = null where order_id = $1::int`
      : `update dtb_shipping set shipping_date = $2::timestamptz where order_id = $1::int`,
    params: 日時 === null ? [受注ID] : [受注ID, 日本時間(日時)], ...受注の確かめ(受注ID), 最大行数: 5,
  });
}

// ---------------------------------------------------------------- 照会（参照だけ）

const 日時の書式 = `'YYYY/MM/DD HH24:MI'`;

export type 取込結果 = { ステータス: string; 出荷日: string | null; 送り状No: string | null };
/** 受注の対応状況の名前・出荷日（日本時間 YYYY/MM/DD HH:MM）・送り状No. */
export function 受注の取込結果(受注ID: string): 取込結果 {
  const r = query(
    `select s.name as st, to_char(o.shipping_date at time zone 'Asia/Tokyo', ${日時の書式}) as d, o.invoice_number as inv
       from dtb_order o left join mtb_order_status s on s.id = o.order_status_id where o.id = $1::int`, [受注ID])[0];
  if (!r) throw new Error(`受注ID ${受注ID} の受注が無い`);
  return { ステータス: String(r.st), 出荷日: r.d, 送り状No: r.inv };
}

/** 受注の配送情報ごとの出荷日（日本時間 YYYY/MM/DD HH:MM。配送IDの小さい順） */
export function 配送情報の出荷日一覧(受注ID: string): (string | null)[] {
  return query(`select to_char(shipping_date at time zone 'Asia/Tokyo', ${日時の書式}) as d from dtb_shipping where order_id = $1::int order by id`, [受注ID]).map((r) => r.d);
}

/** 受注の配送情報の配送ID（小さい順） */
export function 配送IDの一覧(受注ID: string): string[] {
  return query(`select id from dtb_shipping where order_id = $1::int order by id`, [受注ID]).map((r) => String(r.id));
}

/** 受注のメールアドレス・会員のスマレジID（控え用） */
export function 会員のスマレジID(会員ID: string): string {
  const r = query(`select smaregi_id as s from dtb_player where customer_id = $1::int and deleted_at is null order by id desc limit 1`, [会員ID])[0];
  return r?.s ?? "";
}

export type 会員のポイント = { 残高: number; 履歴件数: number; 購入取得: { 増減量: number; 受注ID: string | null }[] };
/** 会員のポイント残高・ポイント履歴の件数・購入によるポイント取得の履歴 */
export function 会員のポイントを読む(会員ID: string): 会員のポイント {
  const p = query(`select point::text as p from dtb_player where customer_id = $1::int and deleted_at is null order by id desc limit 1`, [会員ID])[0];
  if (!p) throw new Error(`会員ID ${会員ID} のポイント残高が読めない`);
  const h = query(`select point_type_id::text as t, point_change::text as c, order_id::text as o from dtb_point_history where customer_id = $1::int order by id`, [会員ID]);
  return {
    残高: Number(p.p), 履歴件数: h.length,
    購入取得: h.filter((x) => x.t === "2").map((x) => ({ 増減量: Number(x.c), 受注ID: x.o })),
  };
}

export type メール履歴 = { 件名: string; 本文: string; 宛先受注ID: string };
/** 会員の受注に結びついたメール送信履歴 */
export function 会員のメール送信履歴(会員ID: string): メール履歴[] {
  return query(
    `select h.mail_subject as s, h.mail_body as b, h.order_id::text as o from dtb_mail_history h
      where h.order_id in (select id from dtb_order where customer_id = $1::int) order by h.id`, [会員ID])
    .map((r) => ({ 件名: r.s ?? "", 本文: r.b ?? "", 宛先受注ID: String(r.o) }));
}

/** 受注に結びついたメール送信履歴 */
export function 受注のメール送信履歴(受注ID: string): メール履歴[] {
  return query(`select mail_subject as s, mail_body as b, order_id::text as o from dtb_mail_history where order_id = $1::int order by id`, [受注ID])
    .map((r) => ({ 件名: r.s ?? "", 本文: r.b ?? "", 宛先受注ID: String(r.o) }));
}

/** 注文番号の受注が（削除済みを除いて）何件あるか */
export function 注文番号の受注件数(注文番号: string): number {
  return query(`select id from dtb_order where order_number = $1 and deleted_at is null`, [注文番号]).length;
}

/** 出荷完了メールの定型文（日本語・英語）が登録されている件数（読むだけ） */
export function 出荷完了メール定型文の件数(): number {
  return query(`select id from dtb_mail_template where id in (25, 26)`).length;
}

/** 会員の会員ID（メールアドレスから。読むだけ） */
export function 会員IDをメールから(メール: string): string {
  const r = query(`select id from dtb_customer where email = $1 and del_flg = 0 order by id desc limit 1`, [メール]);
  if (r.length === 0) throw new Error(`会員（${メール}）が見つからない`);
  return String(r[0].id);
}
