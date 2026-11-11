/**
 * M05-08 スタック用紙印刷の、シードの準備（実行の印つきの受注だけの書き込み）と、印刷後の受注の照会（参照だけ）。
 * 依頼者の承認（2026-11-10「印つきデータは何でも」）の範囲で、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通して書く。
 *
 * 守ること:
 *  - 書き換えるのは、この実行の印を含む商品コードの明細を持つ受注（画面で作った基の受注と、その複製）だけ。
 *    対象の確かめの SELECT が返す行は、どれも印を含む（含まなければ writeTestData が書かずに止める）。
 *  - 共有の設定（スタック用紙の印刷設定）・マスタは書き換えない。読むだけ。
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
    確かめのparams: [受注ID, `%${印}%`],
    印,
  };
}

/** ログインIDのメンバーのメンバーID（読むだけ） */
export function メンバーID(ログインID: string): string {
  const r = query(`select id from dtb_member where login_id = $1 order by id desc limit 1`, [ログインID]);
  if (r.length === 0) throw new Error(`ログインID「${ログインID}」のメンバーが無い`);
  return String(r[0].id);
}

/** 受注の担当者を、指定のメンバーにする（印つきの受注だけ。画面に担当者を指定する欄が無い） */
export function 担当者を設定(受注ID: string, メンバーID: string): void {
  writeTestData({
    理由: "受注の担当者を開始時の値（更新前担当者）にする（受注情報編集画面に担当者を指定する欄が無い）",
    sql: `update dtb_order set operator_id = $2::int where id = $1::int`, params: [受注ID, メンバーID], ...受注の確かめ(受注ID), 最大行数: 1,
  });
}

/** 受注の注文番号を未採番（NULL）にする（印つきの受注だけ。画面で未採番の受注は作れない） */
export function 注文番号を未採番にする(受注ID: string): void {
  writeTestData({
    理由: "注文番号が未採番（NULL）の受注にする（画面が必ず注文番号を振るので、画面では作れない）",
    sql: `update dtb_order set order_number = null where id = $1::int`, params: [受注ID], ...受注の確かめ(受注ID), 最大行数: 1,
  });
}

/** 受注の注文確定日を、日本時間の「YYYY-MM-DD HH:MM:SS」にする（印つきの受注だけ。入金待ちの受注の開始時の値） */
export function 注文確定日を設定(受注ID: string, 日時: string): void {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(日時)) throw new Error(`日時の形が違う: ${日時}`);
  writeTestData({
    理由: "入金待ちの受注の注文確定日を開始時の値にする（受注情報編集画面で注文確定日は指定できない）",
    sql: `update dtb_order set confirm_date = $2::timestamptz where id = $1::int`, params: [受注ID, `${日時}+09:00`], ...受注の確かめ(受注ID), 最大行数: 1,
  });
}

/** 支払方法の名前がマスタにあるか（読むだけ） */
export function 支払方法があるか(名前: string): boolean {
  return query(`select id from dtb_payment where payment_method = $1 limit 1`, [名前]).length > 0;
}

/** 対応状況の名前がマスタにあるか（読むだけ） */
export function 対応状況があるか(名前: string): boolean {
  return query(`select id from mtb_order_status where name = $1 limit 1`, [名前]).length > 0;
}

/** 受注の明細ID（最初の明細。読むだけ） */
export function 受注明細ID(受注ID: string): string {
  const r = query(`select id from dtb_order_item where order_id = $1::int order by id limit 1`, [受注ID]);
  if (r.length === 0) throw new Error(`受注ID ${受注ID} の明細が無い`);
  return String(r[0].id);
}

/** 受注の配送ID（最初の配送。読むだけ） */
export function 受注の配送ID(受注ID: string): string {
  const r = query(`select id from dtb_shipping where order_id = $1::int order by id limit 1`, [受注ID]);
  if (r.length === 0) throw new Error(`受注ID ${受注ID} の配送が無い`);
  return String(r[0].id);
}

export type スタック用紙の設定 = { 高額判定基準: string | null; 高額判定額: string | null };
/** スタック用紙印刷の設定（高額判定基準・高額判定額）の現在の値（共有の設定。読むだけ。基準は 0=販売価格） */
export function スタック用紙印刷の設定を読む(): スタック用紙の設定 {
  const v = (key: string) => query(`select option_value as v from mtb_option where option_key = $1 order by id desc limit 1`, [key])[0]?.v ?? null;
  return { 高額判定基準: v("stack_paper_judgment_price"), 高額判定額: v("stack_paper_threshold_price") };
}

export type 印刷後の受注 = {
  件数: number;
  対応状況: string | null;
  ブラウザ印刷フラグ: string | null;
  /** 注文確定日（日本時間の「YYYY-MM-DD HH:MM:SS」。未設定は null） */
  注文確定日: string | null;
  担当者ID: string | null;
  担当者名: string | null;
};

/** 受注の対応状況・ブラウザ印刷フラグ・注文確定日・担当者（読むだけ） */
export function 受注の印刷状態(受注ID: string): 印刷後の受注 {
  const rows = query(
    `select s.name as 対応状況, o.browser_print_flg::text as フラグ,
            to_char(o.confirm_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI:SS') as 確定日, o.operator_id::text as 担当者ID, m.name as 担当者名
       from dtb_order o
       left join mtb_order_status s on s.id = o.order_status_id
       left join dtb_member m on m.id = o.operator_id
      where o.id = $1::int`, [受注ID]);
  const r = rows[0];
  return { 件数: rows.length, 対応状況: r?.対応状況 ?? null, ブラウザ印刷フラグ: r?.フラグ ?? null, 注文確定日: r?.確定日 ?? null, 担当者ID: r?.担当者ID ?? null, 担当者名: r?.担当者名 ?? null };
}
