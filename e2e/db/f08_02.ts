/** F08-02 店頭買取査定申込情報入力のDB確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く。会員・プレイヤー・店舗ごとの申込みは db/f08_05.ts を使う */
import { query } from "../lib/db";

/** 会員の店頭買取査定申込み（どの店舗のものも）の数と、査定番号の付いたものの数 */
export function 会員の査定申込みの数(会員ID: string): { 件数: number; 査定番号つき: number } {
  const r = query(
    `select count(*) as n, count(nullif(assessment_id, '')) as numbered from dtb_otc_buy_order where customer_id = $1`, [会員ID])[0];
  return { 件数: Number(r.n), 査定番号つき: Number(r.numbered) };
}
