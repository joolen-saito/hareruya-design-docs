/**
 * M06-09 買取集計データCSV出力 の、画面で作れない買取集計データを DB で整える書き込み（依頼者の承認 2026-11-10「印つきデータは何でも」）と、部門の参照。
 * 書き込みは db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） を通す。書く先は、画面で登録した試験店舗（店名が固定の M06-09 の試験店舗）の買取集計データだけ。
 * 対象の確かめは、その店舗の行（店名がその店舗の印を含む）。物理名はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";

export type 部門 = { 部門ID: string; 部門コード: string; 部門名: string };
export type 集計行 = {
  /** 集計日（日本時間の0時。例 "2026-09-01"）。時刻を付けるときは "2026-08-31 23:59:59" */
  日時: string;
  /** 部門ID。部門との紐づけなしは null */
  部門ID: string | null;
  買取金額: number;
  販売金額: number;
};

/** 部門名の部門（共有のマスタ。読むだけ）。無い・複数あるときは null / 配列 */
export function 部門を名前で探す(部門名: string): 部門[] {
  return query(`select id::text as id, code, name from mtb_section where name = $1 order by id`, [部門名])
    .map((r) => ({ 部門ID: r.id!, 部門コード: r.code ?? "", 部門名: r.name ?? "" }));
}

/** 店舗の買取集計データの件数（期間内） */
export function 集計データの件数(店舗ID: string, 開始: string, 終了の前日まで: string): number {
  return Number(query(
    `select count(*) as n from dtb_otc_buy_order_summary where base_info_id = $1::int and summary_date >= ($2)::timestamptz and summary_date < (($3)::timestamptz + interval '1 day')`,
    [店舗ID, `${開始} 00:00:00+09`, `${終了の前日まで} 00:00:00+09`])[0]?.n ?? 0);
}

const 日時のtz = (日時: string): string => {
  if (!/^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/.test(日時)) throw new Error(`日時の形が違う（${日時}）`);
  return `${日時.length === 10 ? `${日時} 00:00:00` : 日時}+09`;
};
const 対象の確かめ = "select s.shop_name as 印つきの名前 from dtb_base_info s where s.id = $1::int";

/** 試験店舗の、期間（日付。両端を含む）の買取集計データを消して、渡した行に入れ替える */
export function 集計データを入れ替える(店舗ID: string, 店名: string, 開始: string, 終了: string, 行: 集計行[]): void {
  if (!/^\d+$/.test(店舗ID)) throw new Error(`店舗IDが数字でない（${店舗ID}）`);
  writeTestData({
    理由: `試験店舗 ${店名}（${店舗ID}）の ${開始}〜${終了} の買取集計データを消して入れ直す（画面には買取集計データを登録する操作が無い）`,
    sql: "delete from dtb_otc_buy_order_summary where base_info_id = $1::int and summary_date >= ($2)::timestamptz and summary_date < (($3)::timestamptz + interval '1 day')",
    params: [店舗ID, `${開始} 00:00:00+09`, `${終了} 00:00:00+09`],
    対象の確かめ, 確かめのparams: [店舗ID], 印: 店名, 最大行数: 200,
  });
  for (const r of 行) 集計データを足す(店舗ID, 店名, r);
}

/** 試験店舗に買取集計データを1行足す */
export function 集計データを足す(店舗ID: string, 店名: string, r: 集計行): void {
  if (!/^\d+$/.test(店舗ID)) throw new Error(`店舗IDが数字でない（${店舗ID}）`);
  const n = writeTestData({
    理由: `試験店舗 ${店名}（${店舗ID}）に買取集計データ（${r.日時}・買取${r.買取金額}・販売${r.販売金額}）を足す`,
    sql: "insert into dtb_otc_buy_order_summary (section_id, sell_price, buy_price, base_info_id, summary_date) values (nullif($1, '')::int, $2::int, $3::int, $4::int, ($5)::timestamptz)",
    params: [r.部門ID ?? "", r.販売金額, r.買取金額, 店舗ID, 日時のtz(r.日時)],
    対象の確かめ, 確かめのparams: [店舗ID], 印: 店名, 最大行数: 1,
  });
  if (n !== 1) throw new Error(`買取集計データを足した行が ${n} 行（1行のはず）`);
}

/** 管理者のログインIDから管理者ID */
export function 管理者IDを探す(ログインID: string): string | null {
  return query(`select id::text as id from dtb_member where login_id = $1`, [ログインID])[0]?.id ?? null;
}
