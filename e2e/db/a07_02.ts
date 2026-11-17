/**
 * A07-02 ネット買取受注一覧取得（MTGバイヤーの API）の DB の参照と、画面で作れない値の書き込み。
 * 書き込みは、E2E が画面で作った買取（会員のメールアドレスに実行の印がある行）にだけ行う（db/write_adapter.ts → lib/db_write.ts。依頼者決定 2026-11-10）。
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

/** 会員のメールアドレスから会員ID（顧客ID）を読む（削除されていない会員が1人のはず） */
export function メールの会員ID(メール: string): string | null {
  const r = query("select id::text as id from dtb_customer where email = $1 and del_flg = 0 order by id", [メール]);
  if (r.length > 1) throw new Error(`メールアドレス ${メール} の会員が ${r.length} 人いる`);
  return (r[0]?.id as string | undefined) ?? null;
}

/** 買取状況の名前からステータスIDを読む（マスタ） */
export function 買取状況のID(名前: string): string | null {
  const r = query("select id::text as id from mtb_buy_order_status where name = $1", [名前]);
  return (r[0]?.id as string | undefined) ?? null;
}

/** 買取状況のマスタ（ID と名前）を読む */
export function 買取状況の一覧(): { ID: string; 名前: string }[] {
  return query("select id::text as id, name from mtb_buy_order_status order by id").map((r) => ({ ID: String(r.id), 名前: String(r.name) }));
}

/** 都道府県の名前があるか（マスタ） */
export function 都道府県がある(名前: string): boolean {
  return Number(query("select count(*) as n from mtb_pref where name = $1", [名前])[0]?.n ?? 0) === 1;
}

export type 買取の値 = { 番号: string; 申込日: string; 名: string; 姓: string; 電話: string | null; 郵便番号: string; 都道府県: string | null; 住所1: string | null; 住所2: string | null; メモ: string | null; 査定担当: string | null; 状況ID: string };

/** 買取の、API の応答のもとになる値を読む（応答と比べるため。確かめの材料） */
export function 買取の値を読む(番号: string): 買取の値 | null {
  const r = query(`select b.id::text as id, to_char(b.order_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD"T"HH24:MI:SS"+09:00"') as d,
    b.first_name, b.last_name, b.tel_no, b.zipcode, p.name as pref, b.addr01, b.addr02, b.memo, m.name as member, b.buy_order_status_id::text as st
    from dtb_buy_order b left join mtb_pref p on p.id = b.pref_id left join dtb_member m on m.id = b.member_id where b.id = $1::int`, [数字(番号)]);
  const x = r[0];
  if (!x) return null;
  const s = (v: unknown) => (v === null || v === undefined ? null : String(v));
  return { 番号: String(x.id), 申込日: String(x.d), 名: String(x.first_name), 姓: String(x.last_name), 電話: s(x.tel_no), 郵便番号: String(x.zipcode),
    都道府県: s(x.pref), 住所1: s(x.addr01), 住所2: s(x.addr02), メモ: s(x.memo), 査定担当: s(x.member), 状況ID: String(x.st) };
}

/** 印つきの買取の査定申込日（買取依頼日）を設定する（日時は「2026-08-20 10:15:30+09」の形） */
export function 申込日を設定する(番号: string, 印: string, 日時: string): void {
  一件(writeTestData({
    理由: `A07-02: 買取 ${番号} の査定申込日を ${日時} にする（画面では申込み時刻になり指定できない）`,
    sql: "update dtb_buy_order set order_date = $2::timestamptz where id = $1::int",
    params: [数字(番号), 日時], 対象の確かめ: 買取の確かめ, 確かめのparams: [数字(番号)], 印, 最大行数: 1,
  }), "査定申込日");
}

/** 印つきの買取の電話番号・郵便番号を、ハイフン付きの値にする（画面はハイフンなしで保存する） */
export function 電話と郵便番号を設定する(番号: string, 印: string, 電話: string, 郵便番号: string): void {
  一件(writeTestData({
    理由: `A07-02: 買取 ${番号} の電話番号を ${電話}・郵便番号を ${郵便番号} にする（ハイフン付きの値は画面で指定できない）`,
    sql: "update dtb_buy_order set tel_no = $2, zipcode = $3 where id = $1::int",
    params: [数字(番号), 電話, 郵便番号], 対象の確かめ: 買取の確かめ, 確かめのparams: [数字(番号)], 印, 最大行数: 1,
  }), "電話番号・郵便番号");
}

/** 印つきの買取の査定担当者を、E2E の試験管理者（管理者ID）にする。null なら紐づけを外す */
export function 査定担当者を設定する(番号: string, 印: string, 管理者ID: string | null): void {
  一件(writeTestData({
    理由: `A07-02: 買取 ${番号} の査定担当者を ${管理者ID === null ? "なし" : `管理者ID ${管理者ID}`} にする（画面で指定できない）`,
    sql: 管理者ID === null ? "update dtb_buy_order set member_id = null where id = $1::int" : "update dtb_buy_order set member_id = $2::int where id = $1::int",
    params: 管理者ID === null ? [数字(番号)] : [数字(番号), 数字(管理者ID)], 対象の確かめ: 買取の確かめ, 確かめのparams: [数字(番号)], 印, 最大行数: 1,
  }), "査定担当者");
}

/** 印つきの買取の買取状況を、名前のステータスにする（画面で指定できない状況） */
export function 買取状況を設定する(番号: string, 印: string, 状況: string): void {
  const id = 買取状況のID(状況);
  if (!id) throw new Error(`買取状況「${状況}」がマスタに無い`);
  一件(writeTestData({
    理由: `A07-02: 買取 ${番号} の買取状況を ${状況} にする（画面で指定できない）`,
    sql: "update dtb_buy_order set buy_order_status_id = $2::int where id = $1::int",
    params: [数字(番号), id], 対象の確かめ: 買取の確かめ, 確かめのparams: [数字(番号)], 印, 最大行数: 1,
  }), "買取状況");
}
