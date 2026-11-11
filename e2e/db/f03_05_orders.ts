/**
 * F03-05 商品リコメンドのシードが、「実行の印つき」の受注・商品を整えるための DB 書き込み。
 * 依頼者の承認（2026-11-10「印つきデータは何でも」）の範囲で、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通して書く。
 *
 * 守ること:
 *  - 追加（写し）の親は、この実行の印つきのメールアドレスの会員が画面で注文した受注（基の受注）。書き換えるのは、そこから写した受注・明細と、
 *    印つきの商品コードを持つ商品だけ。対象の確かめの SELECT が返す行は、どれも印を含む（含まなければ writeTestData が書かずに止める）。
 *  - カード詳細・受注状況などのマスタは読むだけ（商品・受注から既存の行を指すだけで、マスタの行は書き換えない）。
 *  - 物理名（テーブル・カラム）はこのファイルの SQL の中にだけ書く。
 *
 * 理由: 受注日時（1日前・31日前など）・受注状況（処理中）・注文者の会員・明細の商品と数量は、フロントの注文の画面では
 * 思い通りに作れない（受注日時は注文した時刻、明細は1件ずつ注文を重ねる必要がある）。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";

const 印 = RUN_MARK.toUpperCase();
type Sql値 = string | number;

/** 受注状況の ID（アプリの定数。新規受付=1・入金済み=6・購入処理中=8） */
const 状態ID = { 新規受付: 1, 入金済み: 6, 処理中: 8 } as const;
export type 受注の状態 = keyof typeof 状態ID;

export type 注文の明細 = { 商品ID: string; 規格ID: string; 商品コード: string; 商品名: string; 単価: number; 数量: number };
export type 注文の定義 = {
  /** 注文者の会員ID（省略すると基の受注の会員のまま） */
  会員ID?: string;
  /** 日本時間の「2026-09-15 12:00:00」 */
  受注日時: string;
  状態: 受注の状態;
  明細: 注文の明細[];
};

function 日本時間(s: string): string {
  if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) throw new Error(`日時の形が違う: ${s}（YYYY-MM-DD HH:MM:SS）`);
  return `${s}+09:00`;
}

/** 表の列名（除く列を外す）を、information_schema から読む（参照だけ） */
function 列(表: string, 除く: string[]): string[] {
  const rows = query(`select column_name from information_schema.columns where table_schema = 'public' and table_name = $1 order by ordinal_position`, [表]);
  const cols = rows.map((r) => String(r.column_name)).filter((c) => !除く.includes(c));
  if (cols.length === 0) throw new Error(`表 ${表} の列を読めない`);
  return cols;
}

/** 受注が、この実行の印つきのメールアドレスの会員の注文であることを確かめる SELECT */
function 受注の確かめ(受注ID: string): { 対象の確かめ: string; 確かめのparams: Sql値[]; 印: string } {
  return {
    対象の確かめ: `select o.id as 受注ID, upper(o.email) as メール from dtb_order o where o.id = $1::int and upper(o.email) like $2`,
    確かめのparams: [受注ID, `%${印}%`],
    印,
  };
}

let 連番 = 0;

/**
 * 基の受注（印つきの会員が画面で注文した受注）を写して、受注日時・状態・注文者・明細を設定した受注を1件足す。新しい受注IDを返す。
 * 明細は、基の受注の商品の明細1件を写して、商品・規格・商品コード・商品名・単価・数量を書き換える。
 */
export function 注文を足す(基の受注ID: string, v: 注文の定義): string {
  if (v.明細.length === 0) throw new Error("明細が1件も無い注文は作らない");
  const 注文番号 = `F5${(Date.now() % 2176782336).toString(36)}${(連番++).toString(36)}`;
  const base = 受注の確かめ(基の受注ID);
  const oc = 列("dtb_order", ["id", "pre_order_id", "order_number"]);
  writeTestData({
    理由: "基の受注を写して受注を足す",
    sql: `insert into dtb_order (${oc.join(", ")}, order_number) select ${oc.map((c) => `s.${c}`).join(", ")}, $2::text from dtb_order s where s.id = $1::int`,
    params: [基の受注ID, 注文番号], ...base, 最大行数: 1,
  });
  const found = query(`select id from dtb_order where order_number = $1 and deleted_at is null order by id desc limit 1`, [注文番号]);
  if (found.length === 0) throw new Error(`写した受注（注文番号 ${注文番号}）が見つからない`);
  const 新 = String(found[0].id);

  const 会員 = v.会員ID ?? "";
  writeTestData({
    理由: "写した受注の受注日時・状態・注文者を設定する",
    sql: `update dtb_order set order_date = $2::timestamptz, order_status_id = $3::smallint,
            customer_id = case when $4::text = '' then customer_id else $4::int end where id = $1::int`,
    params: [新, 日本時間(v.受注日時), 状態ID[v.状態], 会員],
    対象の確かめ: `select o.id as 受注ID, upper(o.email) || coalesce(upper(c.email), '') as 確認 from dtb_order o
                    left join dtb_customer c on c.id = nullif($3::text, '')::int
                    where o.id = $1::int and upper(o.email) like $2 and ($3::text = '' or upper(c.email) like $2)`,
    確かめのparams: [新, `%${印}%`, 会員],
    印, 最大行数: 1,
  });

  const ic = 列("dtb_order_item", ["id", "order_id", "shipping_id", "product_id", "product_class_id", "product_name", "product_code", "price", "quantity"]);
  for (const m of v.明細) {
    writeTestData({
      理由: "基の受注の明細を写して、商品・単価・数量を設定する",
      sql: `insert into dtb_order_item (${ic.join(", ")}, order_id, shipping_id, product_id, product_class_id, product_name, product_code, price, quantity)
              select ${ic.map((c) => `s.${c}`).join(", ")}, $2::int, null, $3::int, $4::int, $5::text, $6::text, $7::numeric, $8::numeric
              from dtb_order_item s
              where s.id = (select min(x.id) from dtb_order_item x where x.order_id = $1::int and x.product_id is not null)`,
      params: [基の受注ID, 新, m.商品ID, m.規格ID, m.商品名, m.商品コード, m.単価, m.数量], ...base, 最大行数: 1,
    });
  }
  return 新;
}

/** 印つきの受注の、ある商品の明細を、別の印つきの商品の明細に置き換える（同時購入の実績を置き換える） */
export function 明細の商品を置き換える(受注ID: string, 旧商品ID: string, 新: Pick<注文の明細, "商品ID" | "規格ID" | "商品コード" | "商品名">): void {
  writeTestData({
    理由: "受注の明細の商品を別の印つきの商品に置き換える",
    sql: `update dtb_order_item set product_id = $3::int, product_class_id = $4::int, product_name = $5::text, product_code = $6::text
            where order_id = $1::int and product_id = $2::int`,
    params: [受注ID, 旧商品ID, 新.商品ID, 新.規格ID, 新.商品名, 新.商品コード],
    対象の確かめ: `select i.id as 明細ID, upper(i.product_code) as 商品コード from dtb_order_item i
                    where i.order_id = $1::int and i.product_id = $2::int and upper(i.product_code) like $3`,
    確かめのparams: [受注ID, 旧商品ID, `%${印}%`],
    印, 最大行数: 3,
  });
}

// ---- 商品のカード ----

export type カード詳細 = { 詳細ID: string; カードID: string };

/** 既存のカード詳細（マスタ。読むだけ）のうち、Foil の区分が一致するものを先頭から */
export function カード詳細の候補(foil: 0 | 1): カード詳細[] {
  const rows = query(`select id, card_id from mtb_card_detail where foil_flg = $1::int and card_id is not null order by id limit 200`, [foil]);
  return rows.map((r) => ({ 詳細ID: String(r.id), カードID: String(r.card_id) }));
}

/** 印つきの商品に、既存のカード詳細を指定する（商品の側の関連だけを書く。カードのマスタは書き換えない） */
export function 商品にカード詳細を指定する(商品ID: string, カード詳細ID: string): void {
  writeTestData({
    理由: "印つきの商品に既存のカード詳細を指定する",
    sql: `update dtb_product set card_detail_id = $2::int where id = $1::int`,
    params: [商品ID, カード詳細ID],
    対象の確かめ: `select c.id as 規格ID, upper(c.product_code) as 商品コード from dtb_product_class c where c.product_id = $1::int and upper(c.product_code) like $2`,
    確かめのparams: [商品ID, `%${印}%`],
    印, 最大行数: 1,
  });
}
