/**
 * M12-01 日別・月別集計 集計一覧表示 のシードが、日次・月次の集計データを足すための DB 書き込み。
 * 足す先は、この実行の印つきの店舗にぶら下がる集計行だけ（db/write_adapter.ts の writeTestData が、対象の確かめの行に実行の印があることを確かめる）。
 * 画面で作れない理由: 集計データは日次・月次の更新コマンドでしか作られず、画面に集計行を入れる操作が無い。
 * 店舗は読むだけ（印つきの店舗は画面で作る）。物理名はこのファイルの SQL の中にだけ書く。
 */
import { RUN_MARK } from "../lib/run_marker";
import { writeTestData } from "./write_adapter";

/** 店舗の呼び名（正本の店名）→ 印つきの店舗ID・店名 */
const stores = new Map<string, { id: string; 店名: string }>();
export function 店舗を控える(名前: string, v: { id: string; 店名: string }): void { stores.set(名前, v); }
export function 店舗(名前: string): { id: string; 店名: string } {
  const v = stores.get(名前);
  if (!v) throw new Error(`印つきの店舗「${名前}」が無い（S-M12-01-STORES を作っていない）`);
  return v;
}

export type 集計の値 = {
  総売上: number; 原価: number; 粗利益高: number; 販売点数: number; 取引数: number; 取引単価: number;
  買取件数: number; 買取金額: number; 廃棄: number; 欠品: number;
};
export const ゼロ: 集計の値 = { 総売上: 0, 原価: 0, 粗利益高: 0, 販売点数: 0, 取引数: 0, 取引単価: 0, 買取件数: 0, 買取金額: 0, 廃棄: 0, 欠品: 0 };
export type 集計行 = { 店: string; 日または月: string; 値: 集計の値; 更新日時?: string };

/** 店舗集計の行を足す。日次は「YYYY-MM-DD」、月次は「YYYY-MM」（月初日として入れる） */
function 足す(種類: "daily" | "monthly", 行: 集計行[]): void {
  const table = 種類 === "daily" ? "dtb_daily_summary" : "dtb_monthly_summary";
  const dateCol = 種類 === "daily" ? "summary_date" : "summary_month";
  const params: (string | number)[] = [];
  const values = 行.map((r) => {
    const s = 店舗(r.店).id;
    const d = 種類 === "monthly" ? `${r.日または月}-01` : r.日または月;
    const t = r.更新日時 ?? "2026-03-01 00:00:00";
    const v = r.値;
    const base = params.length;
    params.push(s, d, v.総売上, v.原価, v.粗利益高, v.販売点数, v.取引数, v.取引単価, v.買取件数, v.買取金額, v.廃棄, v.欠品, t);
    const p = (i: number) => `$${base + i}`;
    return `(${p(1)}::int, ${p(2)}::date, 2, ${p(3)}::bigint, ${p(4)}::bigint, ${p(5)}::bigint, ${p(6)}::int, ${p(7)}::int, ${p(8)}::bigint, ${p(9)}::int, ${p(10)}::bigint, ${p(11)}::bigint, ${p(12)}::bigint, ${p(13)}::timestamptz, ${p(13)}::timestamptz)`;
  });
  const ids = [...new Set(行.map((r) => 店舗(r.店).id))];
  writeTestData({
    理由: `${種類 === "daily" ? "日次" : "月次"}の集計データ（店舗集計）を、印つきの店舗に足す`,
    sql: `insert into ${table} (base_info_id, ${dateCol}, summary_sales_channel, gross_sales, total_cost, gross_profit, sale_quantity, sale_count, sale_average, purchase_count, purchase_amount, waste_cost, shortage_cost, create_date, update_date) values ${values.join(", ")}`,
    params,
    対象の確かめ: `select b.id as 店舗ID, b.shop_name as 店名 from dtb_base_info b where b.id = any(string_to_array($1, ',')::int[])`,
    確かめのparams: [ids.join(",")],
    印: RUN_MARK,
    最大行数: 10,
  });
}

export const 日次を足す = (行: 集計行[]) => 足す("daily", 行);
export const 月次を足す = (行: 集計行[]) => 足す("monthly", 行);
