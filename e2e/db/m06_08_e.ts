/** M06-08 買取集計データ（追加分）の確認（参照だけ）。物理名はこのファイルの SQL の中にだけ書く */
import { query } from "../lib/db";

/**
 * 期間（日本時間の日付。両端を含む）の買取集計データのうち、指定の店舗（E2E の試験店舗）以外の店舗の件数。
 * 「全店舗のその期間の集計データは、書いた行だけ」を前提にするケースが、ほかの方の集計データが無いことを確かめるために使う。
 */
export function 期間のほかの店舗の集計の件数(開始: string, 終了: string, 除く店舗ID: string[]): number {
  for (const id of 除く店舗ID) if (!/^\d+$/.test(id)) throw new Error(`店舗IDが数字でない（${id}）`);
  const r = query(
    `select count(*)::text as n from dtb_otc_buy_order_summary
      where summary_date >= ($1)::timestamptz and summary_date < (($2)::timestamptz + interval '1 day')
        and base_info_id <> all (string_to_array($3, ',')::int[])`,
    [`${開始} 00:00:00+09`, `${終了} 00:00:00+09`, 除く店舗ID.join(",")]);
  return Number(r[0]?.n ?? "0");
}
