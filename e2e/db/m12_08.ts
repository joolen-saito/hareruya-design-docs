/**
 * M12-08 フォーマット売上分析 CSVダウンロード のシードが、集計月の受注を整えるための DB 書き込みと参照。
 * 依頼者の承認（2026-11-10「印つきデータは何でも」）の範囲で、db/write_adapter.ts の writeTestData（lib/db_write.ts の窓口を通す） だけを通して書く。
 *
 * 守ること:
 *  - 書き込む先は、この実行の印つきの受注（画面でシードが作った受注の複製）と、その受注の明細・明細と売上分析タグの紐付けだけ。
 *    対象の確かめの SELECT が返す行は、どれも印つきの商品コードを持つ（持たなければ writeTestData が書かずに止める）。
 *  - 売上分析タグ・カード・商品・店舗などの共有のマスタは読むだけ（足さない・消さない・書き換えない）。
 *  - 集計月は、ほかの人の受注が1件も無い月（遠い将来の年の同じ月）を探して使う。見つからなければ止める。
 *  - 物理名（テーブル・カラム）はこのファイルの SQL の中にだけ書く。
 */
import { query } from "../lib/db";
import { writeTestData } from "./write_adapter";
import { RUN_MARK } from "../lib/run_marker";
import { 受注の整え, 受注を整える, 受注を複製する } from "./m05_01_order_write";

const 印 = RUN_MARK;
const TOKEN = RUN_MARK.slice(-5).toUpperCase().padStart(5, "0");
const pad = (n: number) => String(n).padStart(2, "0");

// ---------------------------------------------------------------- ケースごとの情報（シードが決め、ケースが読む）

export type 作った明細 = { 明細ID: string; 単価: number; 数量: number };
export type 作った受注 = { 受注ID: string; 明細: 作った明細[] };
export type ケース情報 = {
  /** 集計月（YYYY-MM）。シード表の月に当たる、ほかの人の受注が無い月 */
  集計月: string;
  日数: number;
  /** 売上分析タグの名称・ID（既存の共有マスタから選んだもの。タグ1がシード表の「スタンダード」・「M1208-CBnnn-TAG」、タグ2が「モダン」に当たる） */
  タグ名: string[];
  タグID: string[];
  受注: 作った受注[];
};
const infos = new Map<string, ケース情報>();

export function ケースを控える(ケース番号: string, v: ケース情報): void { infos.set(ケース番号, v); }
export function ケース情報を読む(ケース番号: string): ケース情報 {
  const v = infos.get(ケース番号);
  if (!v) throw new Error(`ケース ${ケース番号} のデータ情報が無い（そのシードを作っていない）`);
  return v;
}

// ---------------------------------------------------------------- 集計月の確保（読むだけ）

export function 月の日数(年: number, 月: number): number {
  return new Date(Date.UTC(年, 月, 0)).getUTCDate();
}
function 閏年か(年: number): boolean { return (年 % 4 === 0 && 年 % 100 !== 0) || 年 % 400 === 0; }

function 月の範囲(年: number, 月: number): [string, string] {
  const next = 月 === 12 ? [年 + 1, 1] : [年, 月 + 1];
  return [`${年}-${pad(月)}-01 00:00:00+09`, `${next[0]}-${pad(next[1])}-01 00:00:00+09`];
}
/** 月の受注の数（削除済みも数える。読むだけ） */
export function 月の受注の数(年: number, 月: number): number {
  const [a, b] = 月の範囲(年, 月);
  return Number(query(`select count(*)::text as n from dtb_order where order_date >= $1::timestamptz and order_date < $2::timestamptz`, [a, b])[0]?.n ?? "1");
}

const reserved = new Set<number>();
/**
 * 「月」に当たる、ほかの人の受注が無い月の年を探す。確かめる月は、集計月と、データを置く隣の月（[年の差, 月] の組）。
 * 開始の年は、実行の印とケース番号から決める（同時に走るほかのケースと同じ年を同時に選びにくくする）。
 */
export function 空いている年を探す(ケース番号: string, v: { 月: number; データを置く月?: [number, number][]; 閏年のみ?: boolean }): number {
  const seed = (parseInt(RUN_MARK.slice(-3), 36) || 0) * 31 + Number(ケース番号);
  const start = 2101 + (seed % 120);
  const checks: [number, number][] = [[0, v.月], ...(v.データを置く月 ?? [])];
  for (let i = 0; i < 400; i++) {
    const y = 2101 + ((start - 2101 + i) % 400);
    if (reserved.has(y)) continue;
    if (v.閏年のみ && !閏年か(y)) continue;
    if (checks.every(([dy, m]) => 月の受注の数(y + dy, m) === 0)) { reserved.add(y); return y; }
  }
  throw new Error(`ケース ${ケース番号}: ほかの人の受注が無い集計月が見つからない（2101年〜2500年のどの年の ${v.月} 月にも受注がある）。共有のデータは書き換えないので止める`);
}

/** 売上分析タグ（共有のマスタ。読むだけ）。名称も表示順も重複しない先頭の n 件（表示順の順） */
export function 使う売上分析タグ(n: number): { id: string; 名称: string }[] {
  const rows = query(
    `select t.id as id, t.name as name from mtb_tag_sales_analysis t
      where (select count(*) from mtb_tag_sales_analysis x where x.name = t.name) = 1
        and (select count(*) from mtb_tag_sales_analysis x where x."rank" = t."rank") = 1
        and t.name not in ('日', '合計', 'その他', 'その他(カード)')
      order by t."rank", t.id limit ${Math.floor(n)}`);
  if (rows.length < n) throw new Error(`売上分析タグ（名称・表示順が重複しないもの）が ${rows.length} 件しか無い（${n} 件要る）。売上分析タグは共有のマスタなので足さずに止める`);
  return rows.map((r) => ({ id: String(r.id), 名称: String(r.name) }));
}

/** カード詳細を持つ商品（シードが画面で作ったカード商品）の商品ID（読むだけ） */
export function カード商品ID(カード詳細ID: string): string {
  const r = query(`select p.id as id from dtb_product p where p.card_detail_id = $1::int order by p.id desc limit 1`, [カード詳細ID]);
  if (r.length === 0) throw new Error(`カード詳細ID ${カード詳細ID} を指す商品が無い（S-M12-08-REF が作る）`);
  return String(r[0].id);
}

// ---------------------------------------------------------------- 受注の作り（印つきの受注の複製・整え）

type Sql値 = string | number;
const 状態の候補: Record<"新規受付" | "入金済み" | "キャンセル", string[]> = { 新規受付: ["新規受付", "注文受領"], 入金済み: ["入金済み"], キャンセル: ["キャンセル"] };

export type 明細の定め = { 単価: number; 数量: number; タグ?: 1 | 2; カード?: boolean };
export type 受注の定め = {
  /** 受注日（YYYY-MM-DD。12:00 にする） */
  日: string;
  状態: "新規受付" | "入金済み" | "キャンセル";
  明細: 明細の定め[];
  /** スマレジ由来の受注にする（スマレジ取引IDを入れる） */
  スマレジ由来?: boolean;
  /** この受注の引き渡し後の受注（定めの並びの番号）。引き渡し済みの元EC受注 */
  引き渡し先?: number;
};

function 明細の確かめ(明細ID: string): { 対象の確かめ: string; 確かめのparams: Sql値[]; 印: string } {
  return {
    対象の確かめ: `select oi.id as 明細ID, oi.product_code as 商品コード from dtb_order_item oi where oi.id = $1::int and oi.product_code like $2`,
    確かめのparams: [明細ID, `%${印}%`], 印,
  };
}
function 受注の確かめ(受注ID: string): { 対象の確かめ: string; 確かめのparams: Sql値[]; 印: string } {
  return {
    対象の確かめ: `select o.id as 受注ID, i.product_code as 商品コード from dtb_order o join dtb_order_item i on i.order_id = o.id where o.id = $1::int and i.product_code like $2`,
    確かめのparams: [受注ID, `%${印}%`], 印,
  };
}
function 列(表: string, 除く: string[]): string[] {
  const rows = query(`select column_name from information_schema.columns where table_schema = 'public' and table_name = $1 order by ordinal_position`, [表]);
  const cols = rows.map((r) => String(r.column_name)).filter((c) => !除く.includes(c));
  if (cols.length === 0) throw new Error(`表 ${表} の列を読めない`);
  return cols;
}
function 商品の明細ID(受注ID: string): string[] {
  return query(`select id from dtb_order_item where order_id = $1::int and product_id is not null order by id`, [受注ID]).map((r) => String(r.id));
}

/** 印つきの明細の単価・数量（と、あれば商品）を設定する */
export function 明細を整える(明細ID: string, v: { 単価: number; 数量: number; 商品ID?: string }): void {
  writeTestData({
    理由: "受注明細の単価・数量・商品を、シード表の値にする",
    sql: `update dtb_order_item set price = $1::numeric, quantity = $2::numeric, product_id = coalesce(nullif($3::text, '')::int, product_id) where id = $4::int`,
    params: [v.単価, v.数量, v.商品ID ?? "", 明細ID], ...明細の確かめ(明細ID), 最大行数: 1,
  });
}

/** 印つきの明細に売上分析タグを紐づける */
export function タグを紐づける(明細ID: string, タグID: string): void {
  writeTestData({
    理由: "受注明細と売上分析タグの紐付けを足す",
    sql: `insert into dtb_order_item_tag_sales_analysis (order_item_id, tag_sales_analysis_id) values ($1::int, $2::int)`,
    params: [明細ID, タグID], ...明細の確かめ(明細ID), 最大行数: 1,
  });
}

/** 印つきの受注の最初の商品明細を写して、明細を1件足す。足した明細IDを返す */
export function 明細を足す(受注ID: string): string {
  const before = new Set(商品の明細ID(受注ID));
  const cols = 列("dtb_order_item", ["id"]);
  writeTestData({
    理由: "受注明細を足す（受注明細を足す画面の操作に代えて、印つきの受注の明細を写す）",
    sql: `insert into dtb_order_item (${cols.join(", ")}) select ${cols.map((c) => `s.${c}`).join(", ")} from dtb_order_item s
           where s.id = (select min(x.id) from dtb_order_item x where x.order_id = $1::int and x.product_id is not null and x.product_code like $2)`,
    params: [受注ID, `%${印}%`], ...受注の確かめ(受注ID), 最大行数: 1,
  });
  const added = 商品の明細ID(受注ID).filter((id) => !before.has(id));
  if (added.length !== 1) throw new Error(`足した明細を1件に決められない（受注ID ${受注ID}）`);
  return added[0];
}

/** 足した明細に、単価・数量・売上分析タグを設定して足す（ケースの手順の中で明細を足すとき） */
export function 明細を追加する(受注ID: string, v: { 単価: number; 数量: number; タグID?: string }): string {
  const id = 明細を足す(受注ID);
  明細を整える(id, { 単価: v.単価, 数量: v.数量 });
  if (v.タグID) タグを紐づける(id, v.タグID);
  return id;
}

/**
 * 基の受注（画面で作った印つきの受注）を写して、定めの受注を作る。
 * 注文番号は「H＋実行の印の下5桁＋ケース番号3桁＋連番2桁」（11文字。受注の注文番号の列の上限）。
 */
export function 受注群を作る(基の受注ID: string, ケース番号: string, 定め: 受注の定め[], ctx: { タグID: string[]; カード商品ID: string }): 作った受注[] {
  const out: 作った受注[] = [];
  for (const [i, d] of 定め.entries()) {
    const 注文番号 = `H${TOKEN}${ケース番号}${pad(i + 1)}`;
    const id = 受注を複製する(基の受注ID, 注文番号);
    const 整え: 受注の整え = { 受注日: `${d.日} 12:00:00`, 対応状況: 状態の候補[d.状態] };
    if (d.スマレジ由来) 整え.スマレジ取引ID = `M1208-${ケース番号}-${RUN_MARK}-${i + 1}`;
    受注を整える(id, 整え);

    const ids = 商品の明細ID(id);
    if (ids.length === 0) throw new Error(`写した受注（${注文番号}）に商品の明細が無い`);
    const 明細: 作った明細[] = [];
    for (const [j, m] of d.明細.entries()) {
      const mid = j < ids.length ? ids[j] : 明細を足す(id);
      明細を整える(mid, { 単価: m.単価, 数量: m.数量, ...(m.カード ? { 商品ID: ctx.カード商品ID } : {}) });
      if (m.タグ) タグを紐づける(mid, ctx.タグID[m.タグ - 1]);
      明細.push({ 明細ID: mid, 単価: m.単価, 数量: m.数量 });
    }
    // 基の受注の商品明細が定めより多いときは、余りを写しではなく0円にして集計に入れない（基は1件のはず）
    for (const extra of ids.slice(d.明細.length)) 明細を整える(extra, { 単価: 0, 数量: 0 });
    out.push({ 受注ID: id, 明細 });
  }
  for (const [i, d] of 定め.entries()) {
    if (d.引き渡し先 !== undefined) 受注を整える(out[i].受注ID, { 引渡し後の受注ID: out[d.引き渡し先].受注ID });
  }
  return out;
}

// ---------------------------------------------------------------- 集計月の記録（読むだけ。CSVダウンロードの前後の比較用）

/**
 * 集計月の受注・受注明細・売上分析タグの紐付けと、紐づく売上分析タグの、全レコードと全カラムの値（JSON の文字列）。
 * 集計月はほかの人の受注が無い月なので、月の範囲の受注の全件が対象。
 */
export function 集計月の記録(集計月: string): string[] {
  const [y, m] = 集計月.split("-").map(Number);
  const [a, b] = 月の範囲(y, m);
  const inMonth = `o.order_date >= $1::timestamptz and o.order_date < $2::timestamptz`;
  const orders = query(`select to_jsonb(o)::text as j from dtb_order o where ${inMonth} order by o.id`, [a, b]).map((r) => `受注 ${r.j}`);
  const items = query(`select to_jsonb(i)::text as j from dtb_order_item i join dtb_order o on o.id = i.order_id where ${inMonth} order by i.id`, [a, b]).map((r) => `受注明細 ${r.j}`);
  const links = query(
    `select to_jsonb(l)::text as j from dtb_order_item_tag_sales_analysis l join dtb_order_item i on i.id = l.order_item_id join dtb_order o on o.id = i.order_id
      where ${inMonth} order by l.order_item_id, l.tag_sales_analysis_id`, [a, b]).map((r) => `売上分析タグの紐付け ${r.j}`);
  const tags = query(
    `select to_jsonb(t)::text as j from mtb_tag_sales_analysis t where t.id in (
       select l.tag_sales_analysis_id from dtb_order_item_tag_sales_analysis l join dtb_order_item i on i.id = l.order_item_id join dtb_order o on o.id = i.order_id where ${inMonth}) order by t.id`,
    [a, b]).map((r) => `売上分析タグ ${r.j}`);
  return [...orders, ...items, ...links, ...tags];
}

/** 明細の商品ID（読むだけ） */
export function 明細の商品ID(明細ID: string): string {
  const r = query(`select product_id as id from dtb_order_item where id = $1::int`, [明細ID]);
  if (r.length === 0 || !r[0].id) throw new Error(`明細ID ${明細ID} の商品が無い`);
  return String(r[0].id);
}
