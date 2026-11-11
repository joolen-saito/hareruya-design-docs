/**
 * M05-20 出荷指示リスト編集のDB確認（参照）と、シードの準備の書き込み（実行の印つきの受注を持つ出荷指示リストだけ）。
 * 依頼者の承認（2026-11-10「印つきデータは何でも」）の範囲で、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通して書く。
 *
 * 守ること:
 *  - 書き換えるのは、この実行の印つきの商品コードの明細を持つ受注を含む出荷指示リストと、その受注・明細だけ
 *    （対象の確かめの SELECT が返す行は、どれも印を含む。含まなければ writeTestData が書かずに止める）。
 *  - 管理者・マスタ・設定には書かない。物理名（テーブル・カラム）はこのファイルの SQL の中にだけ書く。
 */
import { count, query } from "../lib/db";
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";

const 印 = RUN_MARK;

/** 出荷指示リストが登録されている件数 */
export function 出荷指示リストの件数(出荷指示リストID: string): number {
  return count(`select 1 from dtb_shipping_standby where id = $1`, [出荷指示リストID]);
}

/** 注文番号が from〜to（数字の範囲）にある受注のうち、指定の受注ID以外の件数（読むだけ。生成の前に、範囲に他の受注が入らないことを確かめる） */
export function 範囲内のほかの受注の件数(from: string, to: string, 自分の受注ID: string[]): number {
  return count(
    `select 1 from dtb_order where order_number ~ '^[0-9]{1,15}$' and deleted_at is null
        and (case when order_number ~ '^[0-9]{1,15}$' then order_number::bigint end) between $1::bigint and $2::bigint
        and not (id = any(string_to_array($3, ',')::int[]))`, [from, to, 自分の受注ID.join(",")]);
}

/** 出荷指示リストに含まれる受注ID（小さい順） */
export function 出荷指示リストの受注ID(出荷指示リストID: string): string[] {
  return query(`select order_id from dtb_order_shipping_standby where standby_id = $1::int order by order_id`, [出荷指示リストID]).map((r) => String(r.order_id));
}

export type 出荷指示リストの記録 = { 備考: string | null; 最終更新者ID: string; 登録日時: string | null; 更新日時: string | null };
/** 出荷指示リストの記録（無ければ null）。日時は日本時間 */
export function 出荷指示リストの記録を読む(出荷指示リストID: string): 出荷指示リストの記録 | null {
  const r = query(
    `select comment, member_id::text as m,
            to_char(create_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI:SS') as c,
            to_char(update_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI:SS') as u
       from dtb_shipping_standby where id = $1::int`, [出荷指示リストID])[0];
  if (!r) return null;
  return { 備考: r.comment, 最終更新者ID: String(r.m), 登録日時: r.c, 更新日時: r.u };
}

/** 受注の対応状況の名前・出荷指示日（日本時間の日付）・削除日時（読むだけ） */
export function 受注の状態を読む(受注ID: string): { 対応状況: string; 出荷指示日: string | null; 削除日時: string | null } | null {
  const r = query(
    `select s.name as a, to_char(o.commit_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD') as b, o.deleted_at::text as c
       from dtb_order o left join mtb_order_status s on s.id = o.order_status_id where o.id = $1::int`, [受注ID])[0];
  if (!r) return null;
  return { 対応状況: String(r.a), 出荷指示日: r.b, 削除日時: r.c };
}

/** 受注の明細（明細ID・商品名・数量・単価）を、文字列1つにまとめたもの（前後を比べる用） */
export function 受注明細の写し(受注IDs: string[]): string {
  const rows = query(
    `select id, order_id, product_name, quantity::text as q, price::text as p from dtb_order_item where order_id = any(string_to_array($1, ',')::int[]) order by id`, [受注IDs.join(",")]);
  return JSON.stringify(rows);
}

/** 受注の最初の明細の明細ID（読むだけ） */
export function 受注の明細ID(受注ID: string): string {
  const r = query(`select id from dtb_order_item where order_id = $1::int order by id limit 1`, [受注ID])[0];
  if (!r) throw new Error(`受注ID ${受注ID} の明細が無い`);
  return String(r.id);
}

/** 管理者IDの管理者がいる件数（読むだけ） */
export function 管理者の件数(管理者ID: string): number {
  return count(`select 1 from dtb_member where id = $1::int`, [管理者ID]);
}

/** ログインIDから管理者ID（読むだけ。無ければ null） */
export function 管理者IDを読む(ログインID: string): string | null {
  const r = query(`select id from dtb_member where login_id = $1 order by id desc limit 1`, [ログインID])[0];
  return r ? String(r.id) : null;
}

/** メールアドレスから会員ID（読むだけ） */
export function 会員IDを読む(メール: string): string {
  const r = query(`select id from dtb_customer where email = $1 and del_flg = 0 order by id desc limit 1`, [メール])[0];
  if (!r) throw new Error(`会員（${メール}）が見つからない`);
  return String(r.id);
}

/** 注文タイプの名前（ID順。読むだけ） */
export function 注文タイプの名前一覧(): string[] {
  return query(`select name from mtb_order_type order by id`).map((r) => String(r.name));
}

// ---------------------------------------------------------------- 書き込み（シードの準備）

type 値 = string | number;

/** 出荷指示リストが、この実行の印つきの商品の明細を持つ受注を含むことを確かめる SELECT */
function リストの確かめ(出荷指示リストID: string): { 対象の確かめ: string; 確かめのparams: 値[]; 印: string } {
  return {
    対象の確かめ: `select ss.id as 出荷指示リストID, i.product_code as 商品コード
                    from dtb_shipping_standby ss
                    join dtb_order_shipping_standby os on os.standby_id = ss.id
                    join dtb_order_item i on i.order_id = os.order_id
                   where ss.id = $1::int and i.product_code like $2`,
    確かめのparams: [出荷指示リストID, `%${印}%`],
    印,
  };
}

/** 受注が、この実行の印つきの商品の明細を持つことを確かめる SELECT */
function 受注の確かめ(受注ID: string): { 対象の確かめ: string; 確かめのparams: 値[]; 印: string } {
  return {
    対象の確かめ: `select o.id as 受注ID, i.product_code as 商品コード from dtb_order o join dtb_order_item i on i.order_id = o.id
                    where o.id = $1::int and i.product_code like $2`,
    確かめのparams: [受注ID, `%${印}%`],
    印,
  };
}

/** 日本時間の「2026-08-01 10:20:30」を時刻つきの値に直す */
function 日本時間(s: string): string {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) throw new Error(`日時の形が違う: ${s}（YYYY-MM-DD HH:MM:SS）`);
  return `${s}+09:00`;
}

/**
 * 印つきの出荷指示リストの、登録日・更新日（null で未設定）・最終更新者IDを設定する（画面で指定できないため）。
 * 指定しない項目は書き換えない。
 */
export function 出荷指示リストを整える(出荷指示リストID: string, v: { 登録日?: string | null; 更新日?: string | null; 最終更新者ID?: string }): void {
  const sets: string[] = [];
  const params: 値[] = [出荷指示リストID];
  const add = (col: string, val: string | null, cast: string) => {
    if (val === null) sets.push(`${col} = null`);
    else { params.push(val); sets.push(`${col} = $${params.length}${cast}`); }
  };
  if (v.登録日 !== undefined) add("create_date", v.登録日 === null ? null : 日本時間(v.登録日), "::timestamptz");
  if (v.更新日 !== undefined) add("update_date", v.更新日 === null ? null : 日本時間(v.更新日), "::timestamptz");
  if (v.最終更新者ID !== undefined) add("member_id", v.最終更新者ID, "::int");
  if (sets.length === 0) return;
  writeTestData({
    理由: "出荷指示リストの登録日・更新日・最終更新者を、シード表の値にする（画面で指定できない）",
    sql: `update dtb_shipping_standby set ${sets.join(", ")} where id = $1::int`, params, ...リストの確かめ(出荷指示リストID), 最大行数: 1,
  });
}

/** 印つきの受注の注文番号を未設定にする（画面で指定できない） */
export function 注文番号を空にする(受注ID: string): void {
  writeTestData({
    理由: "受注の注文番号を未設定にする（画面で指定できない）",
    sql: `update dtb_order set order_number = null where id = $1::int`, params: [受注ID], ...受注の確かめ(受注ID), 最大行数: 1,
  });
}

/** 印つきの受注の明細（印つきの商品の明細）の商品名・数量・単価を設定する */
export function 明細を整える(受注ID: string, v: { 商品名?: string; 数量?: number; 単価?: number }): void {
  const sets: string[] = [];
  const params: 値[] = [受注ID];
  if (v.商品名 !== undefined) { params.push(v.商品名); sets.push(`product_name = $${params.length}::text`); }
  if (v.数量 !== undefined) { params.push(v.数量); sets.push(`quantity = $${params.length}::numeric`); }
  if (v.単価 !== undefined) { params.push(v.単価); sets.push(`price = $${params.length}::numeric`); }
  if (sets.length === 0) return;
  params.push(`%${印}%`);
  writeTestData({
    理由: "受注の明細の数量・単価・商品名をシード表の値にする（画面で指定できない）",
    sql: `update dtb_order_item set ${sets.join(", ")} where order_id = $1::int and product_code like $${params.length}`, params, ...受注の確かめ(受注ID), 最大行数: 1,
  });
}
