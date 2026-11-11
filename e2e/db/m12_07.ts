/**
 * M12-07 フォーマット売上分析 集計一覧表示 のシードが、集計月の受注を整えるための DB 参照・書き込み。
 * 書き込みは db/m12_08.ts（受注群を作る）と db/m05_01_order_write.ts（受注を整える）を通して、実行の印つきの受注にだけ行う
 * （依頼者の承認 2026-11-10「印つきデータは何でも」。db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） が印を確かめる）。
 * 共有のマスタ（売上分析タグ・配送方法・店舗）は読むだけ。物理名はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";
import { RUN_MARK } from "../lib/run_marker";
import { 受注を整える } from "./m05_01_order_write";
import { ケース情報, 受注の定め, 受注群を作る, 月の受注の数, 月の日数 } from "./m12_08";

export type { ケース情報 };

const infos = new Map<string, ケース情報>();
export function ケースを控える(ケース番号: string, v: ケース情報): void { infos.set(ケース番号, v); }
export function ケース情報を読む(ケース番号: string): ケース情報 {
  const v = infos.get(ケース番号);
  if (!v) throw new Error(`ケース ${ケース番号} のデータ情報が無い（そのシードを作っていない）`);
  return v;
}

const 閏年か = (年: number) => (年 % 4 === 0 && 年 % 100 !== 0) || 年 % 400 === 0;
const reserved = new Set<number>();

/**
 * 集計月に当たる、ほかの人の受注が無い月の年を探す（遠い将来の年。2101〜2500）。確かめる月は、集計月と、データを置く隣の月（[年の差, 月]）。
 * 見つからなければ止める（共有のデータは書き換えない）。
 */
export function 空いている年(ケース番号: string, v: { 月: number; データを置く月?: [number, number][]; 閏年のみ?: boolean; 非閏年のみ?: boolean }): number {
  const hash = [...ケース番号].reduce((a, c) => a * 31 + c.charCodeAt(0), 7);
  const start = 2101 + ((parseInt(RUN_MARK.slice(-3), 36) || 0) * 31 + hash) % 400;
  const checks: [number, number][] = [[0, v.月], ...(v.データを置く月 ?? [])];
  for (let i = 0; i < 400; i++) {
    const y = 2101 + ((start - 2101 + i) % 400);
    if (reserved.has(y)) continue;
    if (v.閏年のみ && !閏年か(y)) continue;
    if (v.非閏年のみ && 閏年か(y)) continue;
    if (checks.every(([dy, m]) => 月の受注の数(y + dy, m) === 0)) { reserved.add(y); return y; }
  }
  throw new Error(`ケース ${ケース番号}: ほかの人の受注が無い集計月が見つからない（2101年〜2500年のどの年の ${v.月} 月にも受注がある）。共有のデータは書き換えないので止める`);
}

/** 店頭受取の配送方法（共有のマスタ。読むだけ）。名前に「店頭」を含むことを確かめる */
function 店頭受取の配送方法(): { id: string; 名前: string } {
  const r = query(`select id, name from dtb_delivery where id = 6`);
  if (r.length === 0 || !String(r[0].name).includes("店頭")) throw new Error("配送方法ID 6 が「店頭受取」でない（店頭受取の配送方法を特定できない）");
  return { id: String(r[0].id), 名前: String(r[0].name) };
}

/** 通販として集計される受注か（本店の受注で、先頭の配送方法が店頭受取の系統でない。読むだけ） */
export function 通販の受注か(受注ID: string): boolean {
  const r = query(
    `select (o.base_info_id = 1 and s.delivery_id is not null and s.delivery_id not in (6, 7)) as ok
       from dtb_order o left join lateral (select delivery_id from dtb_shipping where order_id = o.id and deleted_at is null order by id limit 1) s on true
      where o.id = $1::int`, [受注ID]);
  return r[0]?.ok === "t" || r[0]?.ok === "true";
}

export type 定め = 受注の定め & { 店頭受取?: boolean };

/**
 * 基の受注（画面で作った印つきの受注。本店・宅配便）を写して、定めの受注を作る。
 * 店頭受取の受注は、配送先の配送方法を店頭受取にする（店舗として集計される）。宅配便の受注は、通販として集計されることを確かめる。
 */
export function 受注を作る(基の受注ID: string, ケース番号: string, 定め: 定め[], ctx: { タグID: string[]; カード商品ID: string }) {
  const 受注 = 受注群を作る(基の受注ID, ケース番号, 定め, ctx);
  const otc = 定め.some((d) => d.店頭受取) ? 店頭受取の配送方法() : null;
  for (const [i, d] of 定め.entries()) {
    if (d.店頭受取) 受注を整える(受注[i].受注ID, { 配送先: { 配送方法ID: otc!.id, 配送方法名: otc!.名前 } });
    else if (!通販の受注か(受注[i].受注ID)) throw new Error(`写した受注（受注ID ${受注[i].受注ID}）が通販として集計される受注でない（基の受注は本店の宅配便のはず）`);
  }
  return 受注;
}

export { 月の日数 };
