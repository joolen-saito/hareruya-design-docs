/**
 * M06-08 買取集計データ(検索入力) の、参照だけの DB 読み取り（書き込みは db/m06_09_prep.ts の試験店舗の入れ替えを使う）。
 * 物理名はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";

export type 部門 = { 部門ID: string; 部門コード: string; 部門名: string };

/** 部門名の部門（共有のマスタ。読むだけ） */
export function 部門を名前で探す(部門名: string): 部門[] {
  return query(`select id::text as id, code, name from mtb_section where name = $1 order by id`, [部門名])
    .map((r) => ({ 部門ID: r.id!, 部門コード: r.code ?? "", 部門名: r.name ?? "" }));
}

/** 名前が除く名前の外にある部門の先頭（部門IDの小さい順。共有のマスタ。読むだけ） */
export function 他の部門(除く名前: string[]): 部門 | null {
  const r = query(`select id::text as id, code, name from mtb_section where name <> all (string_to_array($1, '|')) order by id limit 1`, [除く名前.join("|")])[0];
  return r ? { 部門ID: r.id!, 部門コード: r.code ?? "", 部門名: r.name ?? "" } : null;
}

/** 店名の店舗の買取集計データを、店名・日時・部門・金額まで並べた文字列にする（検索の前後を比べる用。q は ctx.db.query） */
export function 集計の記録(q: typeof query, 店名: string[]): string[] {
  return q(
    `select b.shop_name as shop, to_char(s.summary_date at time zone 'Asia/Tokyo', 'YYYY-MM-DD HH24:MI:SS') as d, coalesce(s.section_id::text, '') as sec, s.buy_price as buy, s.sell_price as sell
       from dtb_otc_buy_order_summary s join dtb_base_info b on b.id = s.base_info_id
      where b.shop_name = any (string_to_array($1, '|')) order by b.shop_name, s.summary_date, s.section_id, s.buy_price`, [店名.join("|")])
    .map((r) => `${r.shop}/${r.d}/${r.sec}/${r.buy}/${r.sell}`);
}
