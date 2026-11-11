/**
 * M03-40 棚番号更新CSV登録の続き（-x）のシード。仕分け直し（review/not_runnable_recheck_cases2.tsv）で流せる見込みになったケースの分。
 * 正本: cases/M03-40_seed_data.tsv
 *
 * 作り方:
 * - 棚番号（S-001-NNN・S-002-NNN など）: シード表は棚番号のマスタへ DB で直接入れると定めるが、棚番号のマスタは全員が使うので入れない。
 *   開発環境に既にある棚番号「S-001」「S-002」を、S-001-NNN・S-002-NNN（040 は S-M0340-CB040-OLD・NEW）と読み替える（正本の外の補い）。
 *   取込ファイルの棚番号名称の列も、読み替えた名前にする。どちらかが無ければ止める。未登録の棚番号名称（UNKNOWN-SHELF-…）は、マスタに無いことを確かめる。
 * - 商品: グッズ商品CSV登録で1件作り、商品規格登録編集画面で棚番号を選ぶ（pages/admin/m03_35_40_x.ts の 商品を作る）。CSVの部門IDは空のまま取り込み、
 *   棚番号を選んで登録するときに部門の欄が空なら選択肢の先頭を選ぶ（部門はケースが見ない。注記に残す）。
 *   商品コード・商品名には実行の印を付ける（依頼者決定 2026-10-28）。017・018 は正本で同じ商品コード 4018 を使うので、同じ実行で両方を作ると
 *   商品コードが重なり取込が重複の誤りになる。ケースの番号を足して別の商品コードにした（正本の外の補い）。
 * - 029 の「商品と商品規格は削除済み」: 規格が1件の商品は画面で削除済みにできない（シード表もDBへ直接設定と定める）。E2E が作った商品規格だけに、
 *   アプリの削除と同じ「廃止＋非表示」の印を DB で付ける（db/m03_08.ts の 規格を削除済みにする。持ち主の確かめつき）。商品の行には付けない。
 * - 007 の更新日時（2026-09-01 09:00 など）: 画面で指定できない。DB で書き換えず、取込の前に控えた値と比べる（正本の外の補い）。
 * - 取込ファイル: 試験端末（e2e/.state/m03-40-x/）に作る。ファイル名は拡張子の前に実行の印を付ける（開発環境の取込履歴は消せず、同名の履歴を0件にできない）。
 */
import fs from "node:fs";
import path from "node:path";
import { Browser } from "@playwright/test";
import { SETUP_ADMIN, STATE_DIR } from "../config/env";
import { 規格を削除済みにする } from "../db/m03_08";
import { 商品コードの規格の数, 棚番号の名前の数, 棚番号更新の取込履歴 } from "../db/m03_40_x";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { RUN_MARK, rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { CsvFile } from "../pages/admin/m03_38_product_status_csv";
import { 商品を作る } from "../pages/admin/m03_35_40_x";
import { SHELF_CSV_HEADERS } from "./m03-40";

// ---- 棚番号の読み替え ----

/** S-001-NNN の読み替え・S-002-NNN の読み替え（開発環境の既存の棚番号） */
export const 棚1 = "S-001";
export const 棚2 = "S-002";
let 棚を確かめた = false;
function 棚番号を確かめる(seedId: string): void {
  if (棚を確かめた) return;
  for (const n of [棚1, 棚2]) {
    if (棚番号の名前の数(n) !== 1) throw new Error(`${seedId}: 読み替えに使う棚番号「${n}」が開発環境の棚番号のマスタに1件ない（棚番号のマスタは全員が使うので足さない）`);
  }
  棚を確かめた = true;
}

// ---- 取込ファイル ----

const RUNTIME_DIR = path.join(STATE_DIR, "m03-40-x");
const files = new Map<string, CsvFile & { 内容の要約: string }>();

export function 印つきのファイル名(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot < 0 ? `${name}-${RUN_MARK}` : `${name.slice(0, dot)}-${RUN_MARK}${name.slice(dot)}`;
}

/** シードが作った取込ファイル（正本のファイル名で引く。名前・中身は印つき） */
export function m0340xFile(正本の名前: string): CsvFile & { 内容の要約: string } {
  const f = files.get(正本の名前);
  if (!f) throw new Error(`${正本の名前} は M03-40 の -x のシードがまだ作っていない`);
  return f;
}

function 置く(seedId: string, 正本の名前: string, bytes: Buffer, 内容の要約: string, mimeType = "text/csv"): CsvFile & { 内容の要約: string } {
  const name = 印つきのファイル名(正本の名前);
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  const file = path.join(RUNTIME_DIR, name);
  fs.writeFileSync(file, bytes);
  if (!fs.readFileSync(file).equals(bytes)) throw new Error(`${seedId}: ${file} を書いた中身と読み戻した中身が違う`);
  const n = 棚番号更新の取込履歴(name).length;
  if (n > 0) throw new Error(`${seedId}: 棚番号更新CSVの取込履歴に「${name}」が ${n} 件ある（0件のはず）`);
  const f = { name, bytes, mimeType, 内容の要約: `${内容の要約}（${bytes.length}バイト）` };
  files.set(正本の名前, f);
  return f;
}

/** 正規の見出しとデータ行（改行 LF・末尾に改行1個・BOM なし） */
function csv(rows: string[][], o: { sep?: string; eol?: string } = {}): Buffer {
  const sep = o.sep ?? ",";
  const eol = o.eol ?? "\n";
  return Buffer.from([SHELF_CSV_HEADERS.join(sep), ...rows.map((r) => r.join(sep))].join(eol) + eol, "utf-8");
}
const 要約 = (rows: string[][]): string => `見出し「${SHELF_CSV_HEADERS.join(",")}」＋データ ${rows.map((r) => `「${r.join(",")}」`).join("")}`;

function expectInSeed(seedId: string, words: string[]): void {
  const s = getSeed(seedId);
  const text = s["状態・属性"] + s.投入方法;
  for (const w of words) if (!text.includes(w)) throw new Error(`${seedId}: シード表に「${w}」が無い（書き写しの誤り）`);
}

function 控える(notes: Notes, seedId: string, 呼び名: string, 値: string): void {
  const s = getSeed(seedId);
  if (Notes.labelsIn(s["状態・属性"] + s.投入方法).includes(呼び名)) notes.set(呼び名, 値);
}

// ---- 商品 ----

export type 作った規格 = { 商品コード: string; 商品ID: string; 商品規格ID: string[] };
const 商品 = new Map<string, 作った規格>();

/** シードが作った商品（ケースの番号と正本の商品コードで引く） */
export function 商品の(nnn: string, 正本の商品コード: string): 作った規格 {
  const p = 商品.get(`${nnn}:${正本の商品コード}`);
  if (!p) throw new Error(`${nnn} の商品コード ${正本の商品コード} の商品はまだ作っていない`);
  return p;
}

/** 正本で、別のケースと同じ商品コードを使うもの（ケースの番号を足す） */
const 重なる商品コード = new Set(["4018"]);
export const 商品コードの = (nnn: string, 正本の商品コード: string): string =>
  重なる商品コード.has(正本の商品コード) ? rc(`${正本の商品コード}-${nnn}`) : rc(正本の商品コード);

async function 作る(browser: Browser, notes: Notes, seedId: string, nnn: string, 正本の商品コード: string, 棚番号: string, 呼び名: string, 規格の数: 1 | 2 = 1): Promise<作った規格> {
  棚番号を確かめる(seedId);
  const code = 商品コードの(nnn, 正本の商品コード);
  if (商品コードの規格の数(code) > 0) throw new Error(`${seedId}: 商品コード ${code} の商品規格が既にある`);
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const made = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return 商品を作る(page, { 商品コード: code, 商品名: rc(`M0340商品-${正本の商品コード}`), 部門ID: "", 規格の数, 棚番号 }, `${seedId}: 商品 ${code}`, issue);
  });
  const p = { 商品コード: code, ...made };
  商品.set(`${nnn}:${正本の商品コード}`, p);
  控える(notes, seedId, `〔商品ID-M0340-${呼び名}〕`, p.商品ID);
  if (規格の数 === 1) 控える(notes, seedId, `〔商品規格ID-M0340-${呼び名}〕`, p.商品規格ID[0]);
  if (重なる商品コード.has(正本の商品コード)) issue(`商品コード ${正本の商品コード} はほかのケースのシードも使うので、ケースの番号を足して ${code} にした（正本の外の補い）`);
  return p;
}

const 読み替えの注記 = (seedId: string, extra = ""): void =>
  reportSeedIssue(seedId, `棚番号のマスタは全員が使うので、シード表の棚番号を DB で入れず、開発環境の既存の棚番号「${棚1}」「${棚2}」で読み替えた（S-001-…→${棚1}・S-002-…→${棚2}）。取込ファイルの棚番号名称も読み替えた名前にした${extra}`);

/** 2商品（A=S-001・B=S-002）を作り、A→S-002・B→S-001 の取込ファイルを置く（004・005・006・007・019・020） */
function 二商品の入れ替え(nnn: string, codes: [string, string], 正本のファイル名: string): void {
  const seedId = `S-M03-40-DATA-${nnn}`;
  defineSeed(seedId, async ({ browser, notes }) => {
    expectInSeed(seedId, [正本のファイル名, `${codes[0]},S-002-${nnn}`, `${codes[1]},S-001-${nnn}`]);
    const a = await 作る(browser, notes, seedId, nnn, codes[0], 棚1, `${nnn}A`);
    const b = await 作る(browser, notes, seedId, nnn, codes[1], 棚2, `${nnn}B`);
    const rows = [[a.商品コード, 棚2], [b.商品コード, 棚1]];
    置く(seedId, 正本のファイル名, csv(rows), 要約(rows));
    読み替えの注記(seedId);
  });
}
二商品の入れ替え("004", ["34000401", "34000402"], "m0340-normal-004.csv");
二商品の入れ替え("005", ["34000501", "34000502"], "m0340-normal-005.csv");
二商品の入れ替え("006", ["34000601", "34000602"], "m0340-normal-006.csv");
二商品の入れ替え("007", ["34000701", "34000702"], "m0340-normal-007.csv");
二商品の入れ替え("019", ["34001901", "34001902"], "m0340-normal-019.csv");
二商品の入れ替え("020", ["34002001", "34002002"], "m0340-normal-020.csv");

defineSeed("S-M03-40-DATA-010", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  expectInSeed(id, ["m0340-lf-010.csvはLFで「4012,S-002-010」", "m0340-crlf-010.csvはCRLFで「4013,S-002-010」", "m0340-cr-010.csvはCRで「4014,S-002-010」"]);
  const a = await 作る(browser, notes, id, "010", "4012", 棚1, "010A");
  const b = await 作る(browser, notes, id, "010", "4013", 棚1, "010B");
  const c = await 作る(browser, notes, id, "010", "4014", 棚1, "010C");
  for (const [name, p, eol, label] of [["m0340-lf-010.csv", a, "\n", "LF"], ["m0340-crlf-010.csv", b, "\r\n", "CRLF"], ["m0340-cr-010.csv", c, "\r", "CR"]] as const) {
    const rows = [[p.商品コード, 棚2]];
    置く(id, name, csv(rows, { eol }), `${要約(rows)}・改行 ${label}`);
  }
  読み替えの注記(id);
});

defineSeed("S-M03-40-DATA-011", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  expectInSeed(id, ["m0340-bom-zwsp-011.csv", "BOM", "ゼロ幅スペース"]);
  const p = await 作る(browser, notes, id, "011", "34001101", 棚1, "011");
  // 棚番号名称の「S-」と残りの間にゼロ幅スペース（正本は「S-」と「002-011」の間。読み替えた名前「S-002」の「S-」と「002」の間）
  const text = `﻿${SHELF_CSV_HEADERS.join(",")}\n${p.商品コード},S-​002\n`;
  置く(id, "m0340-bom-zwsp-011.csv", Buffer.from(text, "utf-8"), `先頭に BOM・見出し＋データ「${p.商品コード},S-（ゼロ幅スペース）002」`);
  読み替えの注記(id, "。ゼロ幅スペースは、読み替えた名前の「S-」と「002」の間に入れた");
});

defineSeed("S-M03-40-DATA-012", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  expectInSeed(id, ["m0340-tab-012.tsv", "4016,S-002-012", "タブで区切る"]);
  const p = await 作る(browser, notes, id, "012", "4016", 棚1, "012");
  const rows = [[p.商品コード, 棚2]];
  置く(id, "m0340-tab-012.tsv", csv(rows, { sep: "\t" }), `${要約(rows)}・タブ区切り`, "text/tab-separated-values");
  読み替えの注記(id);
});

defineSeed("S-M03-40-DATA-015", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  expectInSeed(id, ["m0340-110000-015.csv", "4030,S-002-015", "110000"]);
  const p = await 作る(browser, notes, id, "015", "4030", 棚1, "015");
  const records = 110000;
  const text = `${SHELF_CSV_HEADERS.join(",")}\n${`${p.商品コード},${棚2}\n`.repeat(records)}`;
  置く(id, "m0340-110000-015.csv", Buffer.from(text, "utf-8"), `見出し＋データ「${p.商品コード},${棚2}」×${records}件`);
  読み替えの注記(id);
});

/**
 * 決まった大きさのファイル（見出し＋1行。「不可視文字除去後の正規データ」になるよう、データ行の棚番号名称の後ろをゼロ幅スペース（3バイト）で埋め、
 * 3で割った余りは改行を CRLF にして合わせる。埋め方は正本が決めていない。正本の外の補い）
 */
function 決まった大きさ(row: string[], size: number): Buffer {
  for (const [e1, e2] of [["\n", "\n"], ["\r\n", "\n"], ["\r\n", "\r\n"]]) {
    const base = Buffer.byteLength(`${SHELF_CSV_HEADERS.join(",")}${e1}${row.join(",")}${e2}`, "utf-8");
    const rest = size - base;
    if (rest < 0 || rest % 3 !== 0) continue;
    const b = Buffer.from(`${SHELF_CSV_HEADERS.join(",")}${e1}${row.join(",")}${"​".repeat(rest / 3)}${e2}`, "utf-8");
    if (b.length === size) return b;
  }
  throw new Error(`${size} バイトちょうどのファイルを作れない`);
}

defineSeed("S-M03-40-DATA-017", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  expectInSeed(id, ["m0340-size-max-017.csv=5242880バイト", "4018,S-002-017"]);
  const p = await 作る(browser, notes, id, "017", "4018", 棚1, "017");
  置く(id, "m0340-size-max-017.csv", 決まった大きさ([p.商品コード, 棚2], 5242880), `見出し＋データ「${p.商品コード},${棚2}」のあとをゼロ幅スペースで埋めた`);
  読み替えの注記(id, "。アプリのアップロードの上限は 5,000,000 バイト（Symfony の「5M」）");
});

defineSeed("S-M03-40-DATA-018", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  expectInSeed(id, ["m0340-size-over-018.csv=5242881バイト", "4018,S-002-018"]);
  const p = await 作る(browser, notes, id, "018", "4018", 棚1, "018");
  置く(id, "m0340-size-over-018.csv", 決まった大きさ([p.商品コード, 棚2], 5242881), `見出し＋データ「${p.商品コード},${棚2}」のあとをゼロ幅スペースで埋めた`);
  読み替えの注記(id);
});

defineSeed("S-M03-40-DATA-029", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  expectInSeed(id, ["m0340-unknown-product-029.csv", "999999,S-002-029", "m0340-deleted-product-029.csv", "4099,S-002-029", "削除済み"]);
  if (商品コードの規格の数("999999") > 0) throw new Error(`${id}: 未登録のはずの商品コード 999999 がある`);
  const p = await 作る(browser, notes, id, "029", "4099", 棚1, "029");
  規格を削除済みにする(`${id}: 商品コード ${p.商品コード} の規格`, p.商品規格ID);
  const unknown = [["999999", 棚2]];
  置く(id, "m0340-unknown-product-029.csv", csv(unknown), 要約(unknown));
  const deleted = [[p.商品コード, 棚2]];
  置く(id, "m0340-deleted-product-029.csv", csv(deleted), 要約(deleted));
  読み替えの注記(id, `。「商品と商品規格は削除済み」は、E2E が作った商品規格 ${p.商品規格ID.join("・")} だけにアプリの削除と同じ「廃止＋非表示」の印を DB で付けた（商品の行には付けていない）。未登録の商品コード 999999 は印を付けず、無いことを確かめた`);
});

defineSeed("S-M03-40-DATA-030", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  expectInSeed(id, ["m0340-unknown-shelf-030.csv", "34003001,UNKNOWN-SHELF-030", "UNKNOWN-SHELF-030は未登録"]);
  if (棚番号の名前の数("UNKNOWN-SHELF-030") > 0) throw new Error(`${id}: 未登録のはずの棚番号名称 UNKNOWN-SHELF-030 がある`);
  const p = await 作る(browser, notes, id, "030", "34003001", 棚1, "030");
  const rows = [[p.商品コード, "UNKNOWN-SHELF-030"]];
  置く(id, "m0340-unknown-shelf-030.csv", csv(rows), 要約(rows));
  読み替えの注記(id);
});

defineSeed("S-M03-40-DATA-031", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  expectInSeed(id, ["m0340-rollback-031.csv", "34003101,S-002-031", "999999,S-002-031", "34003102,S-001-031"]);
  if (商品コードの規格の数("999999") > 0) throw new Error(`${id}: 未登録のはずの商品コード 999999 がある`);
  const a = await 作る(browser, notes, id, "031", "34003101", 棚1, "031A");
  const b = await 作る(browser, notes, id, "031", "34003102", 棚2, "031B");
  const rows = [[a.商品コード, 棚2], ["999999", 棚2], [b.商品コード, 棚1]];
  置く(id, "m0340-rollback-031.csv", csv(rows), 要約(rows));
  読み替えの注記(id);
});

defineSeed("S-M03-40-DATA-032", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  expectInSeed(id, ["m0340-duplicate-032.csv", "「4022,S-001-032」「4022,S-002-032」"]);
  const p = await 作る(browser, notes, id, "032", "4022", 棚1, "032");
  const rows = [[p.商品コード, 棚1], [p.商品コード, 棚2]];
  置く(id, "m0340-duplicate-032.csv", csv(rows), 要約(rows));
  読み替えの注記(id);
});

/** 1×1画素の透明の PNG */
const PNG_1x1 = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");

defineSeed("S-M03-40-DATA-034", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  expectInSeed(id, ["m0340-size-over-034.csv=5242881バイト", "m0340-invalid-034.png=PNG形式", "m0340-110000-034.csv", "m0340-empty-product-code-034.csv=空,S-002-034",
    "m0340-unknown-product-034.csv=999999,S-002-034", "m0340-unknown-shelf-034.csv=34003401,UNKNOWN-SHELF-034"]);
  if (商品コードの規格の数("999999") > 0) throw new Error(`${id}: 未登録のはずの商品コード 999999 がある`);
  if (棚番号の名前の数("UNKNOWN-SHELF-034") > 0) throw new Error(`${id}: 未登録のはずの棚番号名称 UNKNOWN-SHELF-034 がある`);
  const p = await 作る(browser, notes, id, "034", "34003401", 棚1, "034");
  置く(id, "m0340-size-over-034.csv", 決まった大きさ([p.商品コード, 棚2], 5242881), `見出し＋データ「${p.商品コード},${棚2}」のあとをゼロ幅スペースで埋めた`);
  置く(id, "m0340-invalid-034.png", PNG_1x1, "1×1画素の透明の PNG", "image/png");
  const c4030 = rc("4030");
  置く(id, "m0340-110000-034.csv", Buffer.from(`${SHELF_CSV_HEADERS.join(",")}\n${`${c4030},${棚2}\n`.repeat(110000)}`, "utf-8"), `見出し＋データ「${c4030},${棚2}」×110000件`);
  for (const [name, rows] of [
    ["m0340-empty-product-code-034.csv", [["", 棚2]]],
    ["m0340-unknown-product-034.csv", [["999999", 棚2]]],
    ["m0340-unknown-shelf-034.csv", [[p.商品コード, "UNKNOWN-SHELF-034"]]],
  ] as const) 置く(id, name, csv(rows.map((r) => [...r])), 要約(rows.map((r) => [...r])));
  読み替えの注記(id, `。m0340-110000-034.csv の商品コード 4030 は ${c4030} にした（015 の商品と同じ値）`);
});

defineSeed("S-M03-40-DP-REPEAT-038", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  expectInSeed(id, ["m0340-repeat-038.csv", "M0340-038-A,S-002-038"]);
  const p = await 作る(browser, notes, id, "038", "M0340-038-A", 棚1, "038");
  const rows = [[p.商品コード, 棚2]];
  置く(id, "m0340-repeat-038.csv", csv(rows), 要約(rows));
  読み替えの注記(id);
});

defineSeed("S-M03-40-CBSHELF-040", async ({ browser, notes, seed }) => {
  const id = seed.シードID;
  expectInSeed(id, ["cbm0340-040.csv", "M0340-CB040-P,S-M0340-CB040-NEW", "稼働中の商品規格"]);
  const p = await 作る(browser, notes, id, "040", "M0340-CB040-P", 棚1, "040", 2);
  控える(notes, id, "〔商品規格ID-M0340-040A〕", p.商品規格ID[0]);
  控える(notes, id, "〔商品規格ID-M0340-040B〕", p.商品規格ID[1]);
  const rows = [[p.商品コード, 棚2]];
  置く(id, "cbm0340-040.csv", csv(rows), 要約(rows));
  reportSeedIssue(id, `棚番号のマスタは全員が使うので、S-M0340-CB040-OLD を「${棚1}」、S-M0340-CB040-NEW を「${棚2}」で読み替えた。同じ商品コードの2件目の規格は商品規格一覧の「新規作成」で足した（状態 EX）`);
});
