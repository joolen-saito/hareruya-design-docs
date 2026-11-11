/** F08-01 店頭買取査定申込前ログインのDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/** 会員の店頭買取査定申込み（どの店舗のものも）の、申込ごとの内容（全項目をまとめた文字列）。申込の古い順 */
export function 会員の査定申込みの内容(会員ID: string): { 申込ID: string; 内容: string }[] {
  return query(`select o.id::text as id, to_jsonb(o)::text as content from dtb_otc_buy_order o where o.customer_id = $1 order by o.id`, [会員ID])
    .map((r) => ({ 申込ID: r.id!, 内容: r.content ?? "" }));
}
