/**
 * M05-05 受注詳細カスタムCSV出力のシードが、画面で作った「実行の印つき」の受注・配送先・検索パターン・定義を整えるための DB 書き込み。
 * 依頼者の承認（2026-11-10「印つきデータは何でも」）の範囲で、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通して書く。
 *
 * 守ること:
 *  - 書き換えるのは、この実行の印を含む商品コードの明細を持つ受注（M05-01 の部品が画面で作った受注とその複製）の行、
 *    印つきの名前の検索パターン・カスタムCSV定義だけ。対象の確かめの SELECT が返す行は、どれも印を含む。
 *  - マスタ（カスタムCSVの項目表など）・設定・ほかの人のデータには書かない。
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

/** 受注の配送先の配送ID（昇順） */
export function 配送IDの一覧(受注ID: string): string[] {
  return query(`select id from dtb_shipping where order_id = $1::int and deleted_at is null order by id`, [受注ID]).map((r) => String(r.id));
}

/** 受注の受注明細ID（昇順） */
export function 受注明細IDの一覧(受注ID: string): string[] {
  return query(`select id from dtb_order_item where order_id = $1::int order by id`, [受注ID]).map((r) => String(r.id));
}

/** 受注の（スマレジ受注の）追加項目を設定する。印つきの受注だけ */
export function スマレジの追加項目を設定する(受注ID: string, v: { 小計値引き区分: string; クーポン値引き: number; メモ: string; 免税額: number }): void {
  writeTestData({
    理由: "スマレジ受注の追加項目を設定する",
    sql: `update dtb_order set subtotal_discount_division = $2::text, coupon_discount = $3::int, smaregi_memo = $4::text, tax_free = $5::int where id = $1::int`,
    params: [受注ID, v.小計値引き区分, v.クーポン値引き, v.メモ, v.免税額],
    ...受注の確かめ(受注ID), 最大行数: 1,
  });
}

function 列(表: string, 除く: string[]): string[] {
  const rows = query(`select column_name from information_schema.columns where table_schema = 'public' and table_name = $1 order by ordinal_position`, [表]);
  const cols = rows.map((r) => String(r.column_name)).filter((c) => !除く.includes(c));
  if (cols.length === 0) throw new Error(`表 ${表} の列を読めない`);
  return cols;
}

/** 受注の配送先を、お名前(姓)だけ変えて写し、配送先を1件足す。足した配送先の配送IDを返す */
export function 配送先を足す(受注ID: string, 姓: string): string {
  const before = new Set(配送IDの一覧(受注ID));
  const cols = 列("dtb_shipping", ["id", "name01"]);
  writeTestData({
    理由: "受注の配送先を写して配送先を足す",
    sql: `insert into dtb_shipping (${cols.join(", ")}, name01) select ${cols.map((c) => `s.${c}`).join(", ")}, $2::text from dtb_shipping s
           where s.order_id = $1::int and s.id = (select min(x.id) from dtb_shipping x where x.order_id = $1::int)`,
    params: [受注ID, 姓],
    ...受注の確かめ(受注ID), 最大行数: 1,
  });
  const added = 配送IDの一覧(受注ID).filter((id) => !before.has(id));
  if (added.length !== 1) throw new Error(`足した配送先を特定できない（受注ID ${受注ID}）`);
  return added[0];
}

/** 配送先（配送ID）のお名前(姓)を設定する。印つきの受注の配送先だけ */
export function 配送先の姓を設定する(受注ID: string, 配送ID: string, 姓: string): void {
  writeTestData({
    理由: "配送先のお名前(姓)を設定する",
    sql: `update dtb_shipping set name01 = $3::text where id = $2::int and order_id = $1::int`,
    params: [受注ID, 配送ID, 姓],
    ...受注の確かめ(受注ID), 最大行数: 1,
  });
}

/** 受注の配送先を無くす（受注明細は残す）。印つきの受注だけ */
export function 配送先を無くす(受注ID: string): void {
  writeTestData({
    理由: "受注明細の配送先の関連を外す",
    sql: `update dtb_order_item set shipping_id = null where order_id = $1::int`,
    params: [受注ID], ...受注の確かめ(受注ID), 最大行数: 30,
  });
  writeTestData({
    理由: "受注の配送先を消す",
    sql: `delete from dtb_shipping where order_id = $1::int`,
    params: [受注ID], ...受注の確かめ(受注ID), 最大行数: 5,
  });
}

/** 受注・配送先・カスタムCSV定義の更新日時を指定の値にする（日本時間「YYYY-MM-DD HH:MM:SS」）。印つきの受注と、印つきの名前の定義だけ */
export function 更新日時を設定する(受注ID: string, 定義ID: string, 日時: string): void {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(日時)) throw new Error(`日時の形が違う: ${日時}`);
  const t = `${日時}+09:00`;
  writeTestData({
    理由: "受注の更新日時を設定する", sql: `update dtb_order set update_date = $2::timestamptz where id = $1::int`,
    params: [受注ID, t], ...受注の確かめ(受注ID), 最大行数: 1,
  });
  writeTestData({
    理由: "配送先の更新日時を設定する", sql: `update dtb_shipping set update_date = $2::timestamptz where order_id = $1::int`,
    params: [受注ID, t], ...受注の確かめ(受注ID), 最大行数: 5,
  });
  writeTestData({
    理由: "カスタムCSV定義の更新日時を設定する", sql: `update dtb_csv_extension set update_date = $2::timestamptz where id = $1::int`,
    params: [定義ID, t],
    対象の確かめ: `select id as 定義ID, name as 名前 from dtb_csv_extension where id = $1::int`, 確かめのparams: [定義ID], 印, 最大行数: 1,
  });
}

/** 受注・受注明細・配送先・カスタムCSV定義（項目の並びを含む）の値・件数・更新日時の記録（読むだけ。比べるための文字列） */
export function 受注と定義の記録(受注ID: string, 定義ID: string): string {
  const one = (label: string, sql: string, p: string): string =>
    `${label}: ${JSON.stringify(query(sql, [p]).map((r) => r.j))}`;
  return [
    one("受注", `select to_jsonb(o)::text as j from dtb_order o where o.id = $1::int`, 受注ID),
    one("受注明細", `select to_jsonb(i)::text as j from dtb_order_item i where i.order_id = $1::int order by i.id`, 受注ID),
    one("配送先", `select to_jsonb(s)::text as j from dtb_shipping s where s.order_id = $1::int order by s.id`, 受注ID),
    one("定義", `select to_jsonb(e)::text as j from dtb_csv_extension e where e.id = $1::int`, 定義ID),
    one("定義の項目", `select to_jsonb(c)::text as j from dtb_csv_csv_extension c where c.csv_extension_id = $1::int order by c.csv_id`, 定義ID),
  ].join("\n");
}

/** 対応状況IDが対応状況マスタに無いこと（読むだけ） */
export function 対応状況が未登録か(対応状況ID: string): boolean {
  return query(`select id from mtb_order_status where id = $1::int`, [対応状況ID]).length === 0;
}

/**
 * 画面で保存した検索パターン（名前は印つき）の条件を、注文番号と、存在しない対応状況IDだけの組に書き換える。
 * 検索パターンは、検索フォームの値の連想配列を直列化した値で保存される（注文番号は文字列、対応状況は文字列の配列）。
 */
export function 検索パターンに存在しない対応状況を足す(名前: string, 注文番号: string, 対応状況ID: string): string {
  const rows = query(`select id from dtb_search_pattern where name = $1 and display_key = 'order' order by id desc limit 1`, [名前]);
  if (rows.length === 0) throw new Error(`検索パターン「${名前}」が無い`);
  const id = String(rows[0].id);
  const bytes = (s: string) => Buffer.byteLength(s, "utf8");
  const 直列化 = `a:2:{s:12:"order_number";s:${bytes(注文番号)}:"${注文番号}";s:6:"status";a:1:{i:0;s:${bytes(対応状況ID)}:"${対応状況ID}";}}`;
  writeTestData({
    理由: "検索パターンの条件に存在しない対応状況IDを足す",
    sql: `update dtb_search_pattern set pattern = convert_to($2::text, 'UTF8') where id = $1::int and display_key = 'order'`,
    params: [id, 直列化],
    対象の確かめ: `select id as 検索パターンID, name as 名前 from dtb_search_pattern where id = $1::int and display_key = 'order'`,
    確かめのparams: [id], 印, 最大行数: 1,
  });
  return id;
}

/** 検索パターンのリンク先の検索パターンID（名前で探す。読むだけ） */
export function 検索パターンID(名前: string): string {
  const rows = query(`select id from dtb_search_pattern where name = $1 and display_key = 'order' order by id desc limit 1`, [名前]);
  if (rows.length === 0) throw new Error(`検索パターン「${名前}」が無い`);
  return String(rows[0].id);
}
