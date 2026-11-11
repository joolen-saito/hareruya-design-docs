/**
 * M06-03 買取詳細のシード・確かめのための DB 操作。物理名はこのファイルの SQL の中にだけ書く。
 *
 * 読む（参照だけ）は lib/db.ts の query。書くのは、画面で作れない値だけ。依頼者の承認 2026-11-10 に従い、
 * E2E が画面（フロントの店頭買取査定申込）で作った「実行の印つき」の買取（申込者の姓・名に実行の印）と、
 * その買取に紐づく行にだけ、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す）で書く。
 * 共有のマスタ・メンバー・設定は書き換えない（メンバー・職業は、既にある行を指すだけ）。
 * 申込者の姓・名は、基本情報を設定する操作で書き換える。それ以降はその買取への書き込みはできない（最後に呼ぶ）。
 */
import { query } from "../lib/db";
import { RUN_MARK } from "../lib/run_marker";
import { writeTestData } from "./write_adapter";

const 印 = RUN_MARK;
const 親の確かめ = "select o.id, o.last_name, o.first_name from dtb_otc_buy_order o where o.id = $1::int";

function 数字(s: string | number): string {
  if (!/^\d+$/.test(String(s))) throw new Error(`番号が数字でない（${s}）`);
  return String(Number(s));
}
function 一件(n: number, 何: string): void {
  if (n !== 1) throw new Error(`${何}: 書き込んだ行が ${n} 行（1行のはず）`);
}

export function 受注IDを調べる(査定ID: string): string {
  const r = query("select id from dtb_otc_buy_order where assessment_id = $1", [査定ID]);
  if (r.length !== 1) throw new Error(`査定ID ${査定ID} の買取が ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}

function ログインIDのメンバーID(ログインID: string): string {
  const r = query("select id from dtb_member where login_id = $1", [ログインID]);
  if (r.length !== 1) throw new Error(`ログインID「${ログインID}」のメンバーが ${r.length} 人（1人のはず）`);
  return String(r[0].id);
}
function 名前のメンバーID(名前: string): string {
  const r = query("select id from dtb_member where name = $1", [名前]);
  if (r.length !== 1) throw new Error(`メンバー「${名前}」が ${r.length} 人（1人のはず）`);
  return String(r[0].id);
}

// ---------------------------------------------------------------- 書く（印つきの買取だけ）

/** フリーコメント・最終更新者（既存のメンバーのログインID）・更新日時（日本時間）を設定する */
export function 更新前の状態にする(受注ID: string, v: { コメント?: string; 最終更新者のログインID?: string; 更新日時?: string }): void {
  一件(writeTestData({
    理由: `買取 ${受注ID} のフリーコメント・最終更新者・更新日時を更新前の状態にする`,
    sql: `update dtb_otc_buy_order set
            free_comment = coalesce(nullif($2, ''), free_comment),
            member_id = coalesce((select m.id from dtb_member m where m.login_id = nullif($3, '')), member_id),
            update_date = coalesce((nullif($4, '')::timestamp) at time zone 'Asia/Tokyo', update_date)
          where id = $1::int`,
    params: [数字(受注ID), v.コメント ?? "", v.最終更新者のログインID ?? "", v.更新日時 ?? ""],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(受注ID)], 印, 最大行数: 1,
  }), "更新前の状態");
  if (v.最終更新者のログインID) ログインIDのメンバーID(v.最終更新者のログインID);
}

/** ステータス変更履歴を、日本時間の日時・既存のメンバー名で1件足す */
export function ステータス履歴を日時つきで足す(受注ID: string, 状態の番号: number, 管理者名: string, 日時: string): void {
  一件(writeTestData({
    理由: `買取 ${受注ID} にステータス（番号${状態の番号}）の変更履歴（変更者「${管理者名}」・${日時}）を足す`,
    sql: `insert into dtb_otc_buy_order_status_history (otc_buy_order_id, otc_buy_order_status_id, member_id, create_date)
          select o.id, $2::int, $3::int, ($4::timestamp) at time zone 'Asia/Tokyo' from dtb_otc_buy_order o where o.id = $1::int`,
    params: [数字(受注ID), 状態の番号, 数字(名前のメンバーID(管理者名)), 日時],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(受注ID)], 印, 最大行数: 1,
  }), "ステータス変更履歴");
}

/** 個別入力商品（商品規格なし＝実在庫未登録）を1件足す */
export function 未登録の個別入力商品を足す(受注ID: string, 名前: string, 数量: number, 買取金額: number, 販売金額: number): void {
  一件(writeTestData({
    理由: `買取 ${受注ID} に個別入力商品（${名前}・数量${数量}・買取金額${買取金額}）を足す`,
    sql: `insert into dtb_otc_buy_order_indivisual_input_product (otc_buy_order_id, name, price, sell_price, quantity)
          select o.id, $2, $3::int, $4::int, $5::int from dtb_otc_buy_order o where o.id = $1::int`,
    params: [数字(受注ID), 名前, 買取金額, 販売金額, 数量],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(受注ID)], 印, 最大行数: 1,
  }), "個別入力商品");
}

export type 基本情報 = {
  姓: string; 名: string; セイ: string; メイ: string; 電話番号: string; 職業: string; 生年月日: string; 返却サプライ: string;
  端末取引ID: number; 適格請求書: boolean; 申込日時: string; 成立日時: string;
};

/** 氏名・電話番号・職業・生年月日・返却サプライ・端末取引ID・適格請求書・申込日時・成立日時を設定する。最後の書き込みにする（姓・名から実行の印が消える） */
export function 基本情報を設定する(受注ID: string, v: 基本情報): void {
  const job = query("select id from mtb_job where name = $1", [v.職業]);
  if (job.length < 1) throw new Error(`職業「${v.職業}」が職業マスタに無い`);
  一件(writeTestData({
    理由: `買取 ${受注ID} の基本情報（氏名・電話番号・職業・生年月日・端末取引ID など）を設定する`,
    sql: `update dtb_otc_buy_order set last_name = $2, first_name = $3, last_name_kana = $4, first_name_kana = $5, tel_no = $6,
            job_id = (select min(j.id) from mtb_job j where j.name = $7), birth = $8::date, return_supply = $9, transaction_id = $10::int,
            qualified_invoice_issuer_flg = ($11 = 'true'),
            apply_date = ($12::timestamp) at time zone 'Asia/Tokyo', complete_date = ($13::timestamp) at time zone 'Asia/Tokyo'
          where id = $1::int`,
    params: [数字(受注ID), v.姓, v.名, v.セイ, v.メイ, v.電話番号, v.職業, v.生年月日, v.返却サプライ, v.端末取引ID, String(v.適格請求書), v.申込日時, v.成立日時],
    対象の確かめ: 親の確かめ, 確かめのparams: [数字(受注ID)], 印, 最大行数: 1,
  }), "基本情報");
}

// ---------------------------------------------------------------- 読む（参照だけ）

export type 買取の現状 = {
  ステータス: string; コメント: string | null; 最終更新者: string | null; 更新日時: number | null; 入庫日時: number | null; 入庫日時の表示: string | null;
};

export function 買取の現状(受注ID: string): 買取の現状 {
  const r = query(
    `select s.name as status, o.free_comment as c, m.name as member, extract(epoch from o.update_date)::text as updated,
            extract(epoch from o.restocked_date)::text as restocked,
            to_char(o.restocked_date at time zone 'Asia/Tokyo', 'YYYY/MM/DD HH24:MI:SS') as restocked_text
       from dtb_otc_buy_order o left join mtb_otc_buy_order_status s on s.id = o.otc_buy_order_status_id left join dtb_member m on m.id = o.member_id
      where o.id = $1::int`, [数字(受注ID)]);
  if (r.length !== 1) throw new Error(`買取 ${受注ID} が ${r.length} 件`);
  const x = r[0];
  return {
    ステータス: x.status ?? "", コメント: x.c, 最終更新者: x.member, 更新日時: x.updated === null ? null : Number(x.updated),
    入庫日時: x.restocked === null ? null : Number(x.restocked), 入庫日時の表示: x.restocked_text,
  };
}

export type 実在庫の現状 = { 数量: number; 小計: number };

/** 買取の実在庫情報（商品コードの商品規格）。無ければ null */
export function 実在庫の現状(受注ID: string, 商品コード: string): 実在庫の現状 | null {
  const r = query(
    `select s.quantity as q, s.subtotal as t from dtb_otc_buy_order_stock s join dtb_product_class pc on pc.id = s.product_class_id
      where s.otc_buy_order_id = $1::int and pc.product_code = $2`, [数字(受注ID), 商品コード]);
  if (r.length === 0) return null;
  if (r.length > 1) throw new Error(`買取 ${受注ID} の商品 ${商品コード} の実在庫が ${r.length} 件`);
  return { 数量: Number(r[0].q), 小計: Number(r[0].t) };
}

export type 実在庫履歴の行 = { 変更前: number | null; 変更後: number | null };

/** 買取の商品コードの実在庫履歴（古い順） */
export function 実在庫履歴(受注ID: string, 商品コード: string): 実在庫履歴の行[] {
  return query(
    `select h.before_quantity as b, h.after_quantity as a from dtb_otc_buy_order_stock_history h
       join dtb_otc_buy_order_stock s on s.id = h.otc_buy_order_stock_id join dtb_product_class pc on pc.id = s.product_class_id
      where s.otc_buy_order_id = $1::int and pc.product_code = $2 order by h.id`, [数字(受注ID), 商品コード])
    .map((r) => ({ 変更前: r.b === null ? null : Number(r.b), 変更後: r.a === null ? null : Number(r.a) }));
}

/** 商品コードの店舗在庫（ECCUBE在庫）の合計と在庫履歴の件数 */
export function 店舗在庫と履歴の件数(商品コード: string): { 在庫: number; 履歴件数: number } {
  const s = query(`select coalesce(sum(s.stock), 0)::text as n from dtb_product_stock s join dtb_product_class pc on pc.id = s.product_class_id where pc.product_code = $1`, [商品コード]);
  const h = query(`select count(*)::text as n from dtb_stock_history h join dtb_product_stock s on s.id = h.product_stock_id
                     join dtb_product_class pc on pc.id = s.product_class_id where pc.product_code = $1`, [商品コード]);
  return { 在庫: Number(s[0].n), 履歴件数: Number(h[0].n) };
}

/** 個別入力商品の現状（名前で特定）。商品コードは紐づけがなければ null */
export function 個別入力商品の現状(受注ID: string): { 名前: string; 商品コード: string | null }[] {
  return query(
    `select p.name as n, pc.product_code as c from dtb_otc_buy_order_indivisual_input_product p left join dtb_product_class pc on pc.id = p.product_class_id
      where p.otc_buy_order_id = $1::int order by p.id`, [数字(受注ID)]).map((r) => ({ 名前: r.n ?? "", 商品コード: r.c }));
}

// ---- シードが番号を控えるための読み取り ----

export function 実在庫IDを調べる(受注ID: string, 商品コード: string): string {
  const r = query(`select s.id from dtb_otc_buy_order_stock s join dtb_product_class pc on pc.id = s.product_class_id where s.otc_buy_order_id = $1::int and pc.product_code = $2`, [数字(受注ID), 商品コード]);
  if (r.length !== 1) throw new Error(`買取 ${受注ID} の商品 ${商品コード} の実在庫が ${r.length} 件（1件のはず）`);
  return String(r[0].id);
}
export function 規格と商品のID(商品コード: string): { 規格ID: string; 商品ID: string } {
  const r = query("select id, product_id from dtb_product_class where product_code = $1", [商品コード]);
  if (r.length !== 1) throw new Error(`商品コード ${商品コード} の商品規格が ${r.length} 件（1件のはず）`);
  return { 規格ID: String(r[0].id), 商品ID: String(r[0].product_id) };
}
export function 店舗在庫IDを調べる(商品コード: string): string {
  const r = query(`select min(s.id) as id from dtb_product_stock s join dtb_product_class pc on pc.id = s.product_class_id where pc.product_code = $1`, [商品コード]);
  if (!r[0]?.id) throw new Error(`商品コード ${商品コード} の店舗在庫が無い`);
  return String(r[0].id);
}
export function 個別入力商品のIDを調べる(受注ID: string): string[] {
  return query("select id from dtb_otc_buy_order_indivisual_input_product where otc_buy_order_id = $1::int order by id", [数字(受注ID)]).map((r) => String(r.id));
}
export function ステータス履歴のIDを調べる(受注ID: string): string[] {
  return query("select id from dtb_otc_buy_order_status_history where otc_buy_order_id = $1::int order by create_date, id", [数字(受注ID)]).map((r) => String(r.id));
}
export function 会員IDを調べる(受注ID: string): string | null {
  const r = query("select customer_id as id from dtb_otc_buy_order where id = $1::int", [数字(受注ID)]);
  return r[0]?.id ?? null;
}
