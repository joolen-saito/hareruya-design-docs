/**
 * M12-01・M12-02 のシードが、日次・月次の集計データを足すための DB 書き込み。
 * 足す先は、lib/store_create_ban.ts の E2Eの店舗 にぶら下がる集計行だけ（db/write_adapter.ts の writeTestData が、対象の確かめの行に印があることを確かめる。
 * 印は「店舗IDが E2Eの店舗 の表にある」こと）。元からある店舗・ほかの方の店舗には足さない。
 * 画面で作れない理由: 集計データは日次・月次の更新コマンドでしか作られず、画面に集計行を入れる操作が無い。集計行は消せない。
 * そこで、流すたびに、E2Eの店舗の集計行がほかに無い遠い将来の年（2101〜2500）に置く（正本の2026年は「読み替え」として残す）。
 * 店舗は読むだけ。物理名はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";
import { RUN_MARK } from "../lib/run_marker";
import { E2Eの店舗 } from "../lib/store_create_ban";
import { writeTestData } from "./write_adapter";

const E2E店舗ID = E2Eの店舗.map((s) => s.id);
const 印 = "E2Eの店舗";

const years = new Map<string, number>();
const reserved = new Set<number>();
/** 年（正本の2026年に当たる年）を控える／読む。キーはシードの控え（ケース番号など） */
export function 年を控える(キー: string, y: number): void { years.set(キー, y); }
export function 年を読む(キー: string): number {
  const y = years.get(キー);
  if (y === undefined) throw new Error(`集計の年「${キー}」が無い（そのシードを作っていない）`);
  return y;
}

/**
 * E2Eの店舗の日次・月次の集計行が、その年（と、正本が前の年を使うときは前の年）に1つも無い年を探す（2101〜2500。同じ流しの中で重ねない）。
 * 集計行は消せないので、使った年は次から避ける。見つからなければ止める。
 */
export function 空いている集計の年(キー: string, 前の年も = false): number {
  const used = new Set<number>(query(
    `select distinct extract(year from d)::int as y from (
       select summary_date as d from dtb_daily_summary where base_info_id = any(string_to_array($1, ',')::int[]) and summary_date >= date '2100-01-01'
       union all select summary_month as d from dtb_monthly_summary where base_info_id = any(string_to_array($1, ',')::int[]) and summary_month >= date '2100-01-01') t`,
    [E2E店舗ID.join(",")]).map((r) => Number(r.y)));
  const hash = [...キー].reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
  const start = 2102 + ((parseInt(RUN_MARK.slice(-3), 36) || 0) * 31 + hash) % 398;
  for (let i = 0; i < 398; i++) {
    const y = 2102 + ((start - 2102 + i) % 398);
    if (reserved.has(y) || used.has(y) || (前の年も && (reserved.has(y - 1) || used.has(y - 1)))) continue;
    reserved.add(y); if (前の年も) reserved.add(y - 1);
    return y;
  }
  throw new Error(`集計の年「${キー}」: E2Eの店舗の集計行が無い年が見つからない（2102年〜2499年）。集計行は消せないので止める`);
}

/** 正本の日付（2026年・2025年）を、読み替えた年 y に直す。2026→y、2025→y-1（正本の「前の年」） */
export function 読み替える(y: number, 正本の日付: string): string {
  return 正本の日付.replace(/^(\d{4})/, (_, a) => String(y + (Number(a) - 2026)));
}

/** 店舗の呼び名（正本の店名）→ 使う E2E の店舗の店舗ID・画面の表示名 */
const stores = new Map<string, { id: string; 店名: string }>();
export function 店舗を控える(名前: string, v: { id: string; 店名: string }): void { stores.set(名前, v); }
export function 店舗(名前: string): { id: string; 店名: string } {
  const v = stores.get(名前);
  if (!v) throw new Error(`店舗「${名前}」が無い（S-M12-01-STORES を作っていない）`);
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
    理由: `${種類 === "daily" ? "日次" : "月次"}の集計データ（店舗集計）を、E2Eの店舗に足す`,
    sql: `insert into ${table} (base_info_id, ${dateCol}, summary_sales_channel, gross_sales, total_cost, gross_profit, sale_quantity, sale_count, sale_average, purchase_count, purchase_amount, waste_cost, shortage_cost, create_date, update_date) values ${values.join(", ")}`,
    params,
    // 足す先の店舗IDが E2Eの店舗 の表にあることを確かめる（表に無い店舗は店名を返すので、印を含まず書き込みが止まる）
    対象の確かめ: `select b.id as 店舗ID, case when b.id = any(string_to_array($2, ',')::int[]) then '${印}' else b.shop_name end as 確認 from dtb_base_info b where b.id = any(string_to_array($1, ',')::int[])`,
    確かめのparams: [ids.join(","), E2E店舗ID.join(",")],
    印,
    最大行数: 10,
  });
}

export const 日次を足す = (行: 集計行[]) => 足す("daily", 行);
export const 月次を足す = (行: 集計行[]) => 足す("monthly", 行);
