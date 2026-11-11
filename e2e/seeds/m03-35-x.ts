/**
 * M03-35 部門更新CSV登録の続き（-x）のシード。仕分け直し（review/not_runnable_recheck_cases2.tsv）で流せる見込みになったケースの分。
 * 正本: cases/M03-35_seed_data.tsv
 *
 * 作り方:
 * - S-M03-35-SECTIONS（部門コード31・32・33の部門）: 部門のマスタは全員が使うので、新しく登録しない。開発環境に既にある部門のうち、
 *   有効でスマレジの部門と対応付いた3つ（部門コード 1030101・1030201・1030301）を、部門コード31・32・33の部門と読み替える（正本の外の補い）。
 *   部門更新CSVの取込は、部門を部門コードで探し、スマレジの部門と対応付いた部門だけを受け付ける作り（アプリのソースで確かめた）なので、
 *   取込ファイルの部門コードの列にも、読み替えた部門の部門コードを書く。どれかが無い・無効・スマレジと未対応なら止める。
 * - 商品: グッズ商品CSV登録で1件作り（部門ID・スマレジ連携フラグ0）、同じ商品コードの規格が2件要るときは商品規格一覧の「新規作成」で足す
 *   （pages/admin/m03_35_40_x.ts の 商品を作る）。商品コード・商品名には実行の印を付ける（依頼者決定 2026-10-28）。
 * - 取込ファイル: 試験端末（e2e/.state/m03-35-x/）に作る。ファイル名は拡張子の前に実行の印を付ける（開発環境の取込履歴は消せず、
 *   同名の履歴を0件にできないので、印つきの名前で0件にする）。中身の商品コードも印つき。
 * - 006（削除済みの作業者の履歴）・007（12件の履歴）: 取込履歴を DB で入れず、画面の取込（成功）で作る。正本の「部門更新CSVの取込履歴を全件削除」は
 *   ほかの方の履歴なので行わない（ケースは条件付き。記録に書く）。履歴の日時は指定できない（取り込んだ日時のまま）。
 *   006 の作業者は、実行の印つきの名前の試験管理者を作って取り込み、そのあとメンバー管理で削除する（E2E が作ったメンバーだけ）。
 */
import fs from "node:fs";
import path from "node:path";
import { Browser } from "@playwright/test";
import { SETUP_ADMIN, STATE_DIR } from "../config/env";
import { 商品コードの規格の数, 部門IDか部門コードが当たる部門の数, 部門コードの部門, 部門更新の取込履歴の数 } from "../db/m03_35_x";
import { getSeed } from "../lib/catalog";
import { Notes } from "../lib/notes";
import { RUN_MARK, rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { Account, adminUrl, withAdminSession } from "../lib/session";
import { ensureMember } from "../pages/admin/member";
import { 商品を作る } from "../pages/admin/m03_35_40_x";
import { encodeShiftJis } from "../pages/admin/m03_41_csv_file";
import { メンバーを削除する } from "../pages/admin/m05_20_standby";
import { SectionUpdateCsvPage, 取込ファイル } from "../pages/admin/m03_35_section_update_csv";
import { M0335_ADMIN } from "./m03-35";

// ---- 部門（S-M03-35-SECTIONS の読み替え） ----

export type 部門の記号 = "A" | "B" | "C";
/** 部門コード31・32・33の部門の読み替え（開発環境の既存の部門の部門コード） */
const 読み替えの部門コード: Record<部門の記号, string> = { A: "1030101", B: "1030201", C: "1030301" };
const 正本の部門コード: Record<部門の記号, string> = { A: "31", B: "32", C: "33" };
const 部門ID: Partial<Record<部門の記号, string>> = {};

/** 取込ファイルに書く部門コード（読み替えた部門の部門コード） */
export const 部門コードの = (k: 部門の記号): string => 読み替えの部門コード[k];
export function 部門IDの(k: 部門の記号): string {
  const id = 部門ID[k];
  if (!id) throw new Error(`部門${k}（部門コード${正本の部門コード[k]}の読み替え）をまだ確かめていない（S-M03-35-SECTIONS）`);
  return id;
}

defineSeed("S-M03-35-SECTIONS", async ({ notes, seed }) => {
  const parts: string[] = [];
  for (const k of ["A", "B", "C"] as 部門の記号[]) {
    const s = 部門コードの部門(読み替えの部門コード[k]);
    if (!s) throw new Error(`${seed.シードID}: 読み替えに使う部門コード ${読み替えの部門コード[k]} の部門が開発環境に無い（部門のマスタは全員が使うので足さない）`);
    if (!s.表示) throw new Error(`${seed.シードID}: 部門コード ${s.部門コード}（${s.部門名}）が有効でない`);
    if (!s.スマレジ連携) throw new Error(`${seed.シードID}: 部門コード ${s.部門コード}（${s.部門名}）がスマレジの部門と対応付いていない（部門更新CSVの取込が受け付けない）`);
    部門ID[k] = s.部門ID;
    notes.set(`〔部門ID-M0335-共有${k}〕`, s.部門ID);
    parts.push(`部門コード${正本の部門コード[k]}→部門ID ${s.部門ID}・部門コード ${s.部門コード}「${s.部門名}」`);
  }
  reportSeedIssue(seed.シードID, `部門のマスタは全員が使うので登録せず、開発環境の既存の部門（有効・スマレジの部門と対応付き）で読み替えた: ${parts.join("、")}。取込ファイルの部門コードも読み替えた値にした（正本の外の補い）`);
});

// ---- 取込ファイル ----

const RUNTIME_DIR = path.join(STATE_DIR, "m03-35-x");
const files = new Map<string, 取込ファイル>();

/** 正本のファイル名に実行の印を付けた名前（拡張子の前に付ける） */
export function 印つきのファイル名(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot < 0 ? `${name}-${RUN_MARK}` : `${name.slice(0, dot)}-${RUN_MARK}${name.slice(dot)}`;
}

/** シードが作った取込ファイル（正本のファイル名で引く。中身・名前は印つき） */
export function m0335xFile(正本の名前: string): 取込ファイル {
  const f = files.get(正本の名前);
  if (!f) throw new Error(`${正本の名前} は M03-35 の -x のシードがまだ作っていない`);
  return f;
}

const 見出し行 = "商品コード,部門コード(ID)";

function 置く(seedId: string, 正本の名前: string, bytes: Buffer, mimeType = "text/csv"): 取込ファイル {
  const name = 印つきのファイル名(正本の名前);
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  const file = path.join(RUNTIME_DIR, name);
  fs.writeFileSync(file, bytes);
  if (!fs.readFileSync(file).equals(bytes)) throw new Error(`${seedId}: ${file} を書いた中身と読み戻した中身が違う`);
  // 同名の履歴が0件（印つきの名前なので、前の実行の履歴には当たらない）
  const n = 部門更新の取込履歴の数(name);
  if (n > 0) throw new Error(`${seedId}: 部門更新CSVの取込履歴に「${name}」が ${n} 件ある（0件のはず）`);
  const f = { name, mimeType, buffer: bytes };
  files.set(正本の名前, f);
  return f;
}

/** 見出しとデータ行の UTF-8 の CSV（改行 LF・末尾に改行1個・BOM なし） */
const csv = (rows: string[][], sep = ","): Buffer => Buffer.from([見出し行.split(",").join(sep), ...rows.map((r) => r.join(sep))].join("\n") + "\n", "utf-8");

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

/** シードが作った商品（正本の商品コードで引く） */
export function 商品の(正本の商品コード: string): 作った規格 {
  const p = 商品.get(正本の商品コード);
  if (!p) throw new Error(`商品コード ${正本の商品コード} の商品はまだ作っていない`);
  return p;
}

async function 作る(browser: Browser, seedId: string, 正本の商品コード: string, 部門: 部門の記号, 規格の数: 1 | 2): Promise<作った規格> {
  const code = rc(正本の商品コード);
  if (商品コードの規格の数(code) > 0) throw new Error(`${seedId}: 商品コード ${code} の商品規格が既にある`);
  const issue = (m: string) => reportSeedIssue(seedId, m);
  const made = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    page.setDefaultTimeout(60_000);
    return 商品を作る(page, { 商品コード: code, 商品名: rc(`M0335商品-${正本の商品コード}`), 部門ID: 部門IDの(部門), 規格の数 }, `${seedId}: 商品 ${code}`, issue);
  });
  const p = { 商品コード: code, ...made };
  商品.set(正本の商品コード, p);
  return p;
}

/**
 * 「商品コードSEC-A-001-NNNの商品に商品規格2件があり部門ID=共有A／SEC-B-001-NNNの商品に商品規格1件があり部門ID=共有B」の商品を作り、
 * 商品ID・商品規格IDを控える（SEC-A の商品ID=〔商品ID-M0335-NNNA〕・規格〔…NNNA〕〔…NNNB〕、SEC-B の商品ID=〔商品ID-M0335-NNNB〕・規格〔…NNNC〕）。
 */
async function SECの組を作る(browser: Browser, notes: Notes, seedId: string, nnn: string): Promise<{ A: 作った規格; B: 作った規格 }> {
  expectInSeed(seedId, [`SEC-A-001-${nnn}の商品に商品規格2件`, `SEC-B-001-${nnn}の商品に商品規格1件`]);
  const A = await 作る(browser, seedId, `SEC-A-001-${nnn}`, "A", 2);
  const B = await 作る(browser, seedId, `SEC-B-001-${nnn}`, "B", 1);
  控える(notes, seedId, `〔商品ID-M0335-${nnn}A〕`, A.商品ID);
  控える(notes, seedId, `〔商品規格ID-M0335-${nnn}A〕`, A.商品規格ID[0]);
  控える(notes, seedId, `〔商品規格ID-M0335-${nnn}B〕`, A.商品規格ID[1]);
  控える(notes, seedId, `〔商品ID-M0335-${nnn}B〕`, B.商品ID);
  控える(notes, seedId, `〔商品規格ID-M0335-${nnn}C〕`, B.商品規格ID[0]);
  return { A, B };
}

/** 商品1件（規格1件）を作り、〔商品ID-M0335-NNN〕・〔商品規格ID-M0335-NNN〕（または接尾辞つき）を控える */
async function 一つ作る(browser: Browser, notes: Notes, seedId: string, 正本の商品コード: string, 部門: 部門の記号, 呼び名: string): Promise<作った規格> {
  expectInSeed(seedId, [正本の商品コード]);
  const p = await 作る(browser, seedId, 正本の商品コード, 部門, 1);
  控える(notes, seedId, `〔商品ID-M0335-${呼び名}〕`, p.商品ID);
  控える(notes, seedId, `〔商品規格ID-M0335-${呼び名}〕`, p.商品規格ID[0]);
  return p;
}

const needs = { needs: ["S-M03-35-SECTIONS"] };

/** SEC の組で、データが「SEC-A,32」「SEC-B,31」の正常のファイル */
function 正常のSECの組(nnn: string, 正本のファイル名: string): void {
  const seedId = `S-M03-35-CASE-${nnn}`;
  defineSeed(seedId, needs, async ({ browser, notes }) => {
    expectInSeed(seedId, [正本のファイル名, `SEC-A-001-${nnn},32`, `SEC-B-001-${nnn},31`]);
    const { A, B } = await SECの組を作る(browser, notes, seedId, nnn);
    置く(seedId, 正本のファイル名, csv([[A.商品コード, 部門コードの("B")], [B.商品コード, 部門コードの("A")]]));
  });
}
正常のSECの組("001", "m0335_normal-001.csv");
正常のSECの組("002", "m0335_normal-002.csv");
正常のSECの組("038", "m0335_normal-038.csv");
正常のSECの組("039", "m0335_normal-039.csv");
正常のSECの組("050", "m0335_repeat-050.csv");

/** 5MB を 5×1024×1024 バイトと読む（既存の 023 と同じ解釈。アプリの上限は Symfony の「5M」＝5,000,000 バイト） */
const 五MB = 5 * 1024 * 1024;

/**
 * 決まった大きさのファイル。見出しとデータ行のあとを、ゼロ幅空白（3バイト。取込で取り除かれる）で埋め、3で割った余りは改行を CRLF にして合わせる。
 * 埋める場所は最後のデータ行の部門コードの後ろ（正本は埋め方を決めていない。正本の外の補い）。
 */
function 決まった大きさ(rows: string[][], size: number): Buffer {
  for (let crlf = 0; crlf <= rows.length; crlf++) {
    const lines = [見出し行, ...rows.map((r) => r.join(","))];
    const eol = (i: number) => (i >= 1 && i <= crlf ? "\r\n" : "\n");
    const base = Buffer.byteLength(lines.map((l, i) => l + eol(i)).join(""), "utf-8");
    const rest = size - base;
    if (rest < 0 || rest % 3 !== 0) continue;
    const pad = "​".repeat(rest / 3);
    const text = lines.map((l, i) => (i === lines.length - 1 ? l + pad : l) + eol(i)).join("");
    const b = Buffer.from(text, "utf-8");
    if (b.length === size) return b;
  }
  throw new Error(`${size} バイトちょうどのファイルを作れない`);
}

defineSeed("S-M03-35-CASE-022", needs, async ({ browser, notes, seed }) => {
  expectInSeed(seed.シードID, ["m0335_oversize-022.csv", "5MB+1バイト"]);
  const { A, B } = await SECの組を作る(browser, notes, seed.シードID, "022");
  const f = 置く(seed.シードID, "m0335_oversize-022.csv", 決まった大きさ([[A.商品コード, 部門コードの("B")], [B.商品コード, 部門コードの("A")]], 五MB + 1));
  reportSeedIssue(seed.シードID, `m0335_oversize-022.csv の中身は正本に指定が無い。見出しと SEC-A→32・SEC-B→31 のデータ行のあとをゼロ幅空白で埋めて ${f.buffer.length} バイトにした`);
});

defineSeed("S-M03-35-CASE-049", needs, async ({ browser, notes, seed }) => {
  expectInSeed(seed.シードID, ["m0335_exact-049.csv", "SEC-A-001-049,32", "SEC-B-001-049,31"]);
  const { A, B } = await SECの組を作る(browser, notes, seed.シードID, "049");
  const f = 置く(seed.シードID, "m0335_exact-049.csv", 決まった大きさ([[A.商品コード, 部門コードの("B")], [B.商品コード, 部門コードの("A")]], 五MB));
  reportSeedIssue(seed.シードID, `ファイルサイズ上限と同じ大きさを 5MB＝5×1024×1024 バイトと読み、${f.buffer.length} バイトにした（データ行のあとをゼロ幅空白で埋め、余りは改行を CRLF にして合わせた）。アプリの上限は 5,000,000 バイト（Symfony の「5M」）`);
});

defineSeed("S-M03-35-CASE-033", needs, async ({ browser, notes, seed }) => {
  expectInSeed(seed.シードID, ["m0335_unknown_product-033.csv", "UNKNOWN-001-033,32", "UNKNOWN-001-033は未登録"]);
  await SECの組を作る(browser, notes, seed.シードID, "033");
  const unknown = rc("UNKNOWN-001-033");
  if (商品コードの規格の数(unknown) > 0) throw new Error(`${seed.シードID}: 未登録のはずの商品コード ${unknown} がある`);
  置く(seed.シードID, "m0335_unknown_product-033.csv", csv([[unknown, 部門コードの("B")]]));
});

defineSeed("S-M03-35-CASE-010", needs, async ({ browser, notes, seed }) => {
  expectInSeed(seed.シードID, ["m0335_sjis-010.csv", "Shift_JIS", "FMT-SJIS-001-010,32"]);
  const p = await 一つ作る(browser, notes, seed.シードID, "FMT-SJIS-001-010", "A", "010");
  const text = `${見出し行}\n${p.商品コード},${部門コードの("B")}\n`;
  置く(seed.シードID, "m0335_sjis-010.csv", encodeShiftJis(text));
});

defineSeed("S-M03-35-CASE-011", needs, async ({ browser, notes, seed }) => {
  expectInSeed(seed.シードID, ["m0335_tab-011.tsv", "タブ区切り"]);
  const p = await 一つ作る(browser, notes, seed.シードID, "FMT-TSV-001-011", "A", "011");
  置く(seed.シードID, "m0335_tab-011.tsv", csv([[p.商品コード, 部門コードの("B")]], "\t"), "text/tab-separated-values");
});

defineSeed("S-M03-35-CASE-012", needs, async ({ browser, notes, seed }) => {
  expectInSeed(seed.シードID, ["m0335_text-012.txt", "FMT-TXT-001-012,32", "カンマ区切り"]);
  const p = await 一つ作る(browser, notes, seed.シードID, "FMT-TXT-001-012", "A", "012");
  置く(seed.シードID, "m0335_text-012.txt", csv([[p.商品コード, 部門コードの("B")]]), "text/plain");
});

defineSeed("S-M03-35-CASE-014", needs, async ({ browser, notes, seed }) => {
  expectInSeed(seed.シードID, ["m0335_zwsp-014.csv", "FMT-直後", "ゼロ幅空白"]);
  const p = await 一つ作る(browser, notes, seed.シードID, "FMT-ZWSP-001-014", "A", "014");
  const z = "​";
  // 商品コードの「FMT-」の直後と、部門コードの1文字目と2文字目の間（正本の「32の3と2の間」を、読み替えた部門コードの先頭2文字の間と読む）
  const code = p.商品コード.replace(/^FMT-/, `FMT-${z}`);
  const sec = 部門コードの("B");
  const f = 置く(seed.シードID, "m0335_zwsp-014.csv", csv([[code, `${sec[0]}${z}${sec.slice(1)}`]]));
  reportSeedIssue(seed.シードID, `部門コードのゼロ幅空白は、読み替えた部門コード ${sec} の1文字目と2文字目の間に入れた（正本は「32の3と2の間」）。ファイルは ${f.buffer.length} バイト`);
});

defineSeed("S-M03-35-CASE-035", needs, async ({ browser, notes, seed }) => {
  expectInSeed(seed.シードID, ["m0335_unknown_department-035.csv", "TGT-DEPT-001-035,99", "部門ID・部門コード99は未登録"]);
  if (部門コードの部門("99")) throw new Error(`${seed.シードID}: 部門コード99の部門が開発環境にある（部門のマスタは全員が使うので消さない）`);
  const n = 部門IDか部門コードが当たる部門の数("99");
  if (n > 0) reportSeedIssue(seed.シードID, "部門コード99の部門は無いが、部門ID 99 の部門は開発環境にある（全員が使うマスタなので消さない）。部門更新CSVの取込は部門を部門コードで探すので、ケースの確かめには当たらない（正本の外の補い）");
  const p = await 一つ作る(browser, notes, seed.シードID, "TGT-DEPT-001-035", "A", "035");
  置く(seed.シードID, "m0335_unknown_department-035.csv", csv([[p.商品コード, "99"]]));
});

defineSeed("S-M03-35-CASE-036", needs, async ({ browser, notes, seed }) => {
  expectInSeed(seed.シードID, ["m0335_rollback-036.csv", "RB-A-036,32、RB-UNKNOWN-036,32、RB-B-036,32", "RB-UNKNOWN-036は未登録"]);
  const a = await 一つ作る(browser, notes, seed.シードID, "RB-A-036", "A", "036A");
  const b = await 一つ作る(browser, notes, seed.シードID, "RB-B-036", "A", "036B");
  const unknown = rc("RB-UNKNOWN-036");
  if (商品コードの規格の数(unknown) > 0) throw new Error(`${seed.シードID}: 未登録のはずの商品コード ${unknown} がある`);
  置く(seed.シードID, "m0335_rollback-036.csv", csv([[a.商品コード, 部門コードの("B")], [unknown, 部門コードの("B")], [b.商品コード, 部門コードの("B")]]));
});

defineSeed("S-M03-35-CASE-037", needs, async ({ browser, notes, seed }) => {
  expectInSeed(seed.シードID, ["m0335_duplicate-037.csv", "DUP-001-037,32、DUP-001-037,33"]);
  const p = await 一つ作る(browser, notes, seed.シードID, "DUP-001-037", "A", "037");
  置く(seed.シードID, "m0335_duplicate-037.csv", csv([[p.商品コード, 部門コードの("B")], [p.商品コード, 部門コードの("C")]]));
});

defineSeed("S-M03-35-CASE-043", needs, async ({ browser, notes, seed }) => {
  expectInSeed(seed.シードID, ["m0335_excel-043.xls", "FMT-XLS-001-043,32"]);
  const p = await 一つ作る(browser, notes, seed.シードID, "FMT-XLS-001-043", "A", "043");
  置く(seed.シードID, "m0335_excel-043.xls", csv([[p.商品コード, 部門コードの("B")]]), "application/vnd.ms-excel");
});

defineSeed("S-M03-35-GF-CASE-047", needs, async ({ browser, notes, seed }) => {
  expectInSeed(seed.シードID, ["m0335-047-a.dat", "M0335-047-A,32"]);
  const p = await 一つ作る(browser, notes, seed.シードID, "M0335-047-A", "A", "047");
  // 正本の手順3「送信されるファイルの種別を text/csv に書き換えて送る」は、選ぶときの種別を text/csv にして送ることで行う
  置く(seed.シードID, "m0335-047-a.dat", csv([[p.商品コード, 部門コードの("B")]]), "text/csv");
});

// ---- 取込履歴（006・007） ----

/** ある管理者で、部門更新CSV登録画面からファイルを取り込む（成功を確かめる） */
async function 取り込む(browser: Browser, account: Account, seedId: string, f: 取込ファイル): Promise<void> {
  await withAdminSession(browser, account, async (page) => {
    page.setDefaultTimeout(60_000);
    const u = new SectionUpdateCsvPage(page);
    await u.open();
    await u.choose(f);
    const r = await u.pressUpload();
    if (!r.sent) throw new Error(`${seedId}: ${f.name} の取込がブラウザの入力チェックで止まった`);
    const m = await u.messages();
    if (m.成功.length === 0 || m.エラー.length > 0) throw new Error(`${seedId}: ${f.name} の取込が成功しない（成功の帯: ${m.成功.join(" / ") || "なし"}、誤りの帯: ${m.エラー.join(" / ") || "なし"}）`);
  });
  const n = 部門更新の取込履歴の数(f.name);
  if (n !== 1) throw new Error(`${seedId}: ${f.name} の取込履歴が ${n} 件（1件のはず）`);
}

/** 006 の作業者（削除する試験管理者） */
export const 履歴担当の名前 = (): string => rc("履歴担当M0335A-006");

defineSeed("S-M03-35-CASE-006", needs, async ({ browser, seed }) => {
  const id = seed.シードID;
  expectInSeed(id, ["履歴担当M0335A-006", "削除済み", "m0335_deleted_operator-006.csv"]);
  const issue = (m: string) => reportSeedIssue(id, m);
  const p = await 作る(browser, id, "HIST-006", "A", 1);
  const f = 置く(id, "m0335_deleted_operator-006.csv", csv([[p.商品コード, 部門コードの("B")]]));
  const account: Account = { loginId: rc("m0335h006").toLowerCase(), password: "Passw0rd!M0335H6" };
  const 管理者ID = await withAdminSession(browser, SETUP_ADMIN, async (page) => {
    // 正本は所属店舗を指定しない。選べる店舗の先頭に所属させ、システム管理者の権限を付ける（S-M03-35-ADM と同じ作り方）
    await page.goto(adminUrl("/setting/system/member/new"));
    const stores = await page.locator('[name="admin_member[baseInfo]"] option').evaluateAll((os) => os
      .map((o) => o as HTMLOptionElement).filter((o) => o.value !== "").map((o) => o.textContent?.trim() ?? "").filter(Boolean));
    if (stores.length === 0) throw new Error(`${id}: メンバーに割り当てられる店舗が画面に無い`);
    return ensureMember(page, {
      名前: 履歴担当の名前(), 所属店舗: stores[0], ログインID: account.loginId, メールアドレス: `${account.loginId}@example.test`,
      パスワード: account.password, 権限: "システム管理者", デフォルト検索表示店舗: stores[0], 編集可能店舗: [stores[0]],
    });
  });
  await 取り込む(browser, account, id, f);
  await withAdminSession(browser, SETUP_ADMIN, (page) => メンバーを削除する(page, 管理者ID));
  issue(`作業者の管理者「${履歴担当の名前()}」（管理者ID ${管理者ID}。シード表の 356000006 は画面で指定できない）を作り、その管理者で ${f.name} を部門更新CSV登録画面から取り込んで（商品 ${p.商品コード} を部門A→部門B）履歴を作り、メンバー管理で削除した。履歴は DB で入れず、日時は取り込んだ日時のまま。ほかの方の部門更新の取込履歴は消していない（正本の「全件削除」は行わない）`);
});

defineSeed("S-M03-35-CASE-007", { needs: ["S-M03-35-SECTIONS", "S-M03-35-ADM"] }, async ({ browser, seed }) => {
  const id = seed.シードID;
  expectInSeed(id, ["m0335_history_01-007.csv〜m0335_history_12-007.csv", "12件"]);
  const p = await 作る(browser, id, "HIST-007", "A", 1);
  for (let i = 1; i <= 12; i++) {
    const n = String(i).padStart(2, "0");
    const f = 置く(id, `m0335_history_${n}-007.csv`, csv([[p.商品コード, 部門コードの(i % 2 === 1 ? "B" : "A")]]));
    await 取り込む(browser, M0335_ADMIN, id, f);
  }
  reportSeedIssue(id, `M03-35試験管理者で m0335_history_01〜12-007（印つき）を部門更新CSV登録画面から12回取り込んで履歴を作った（商品 ${p.商品コード} の部門を交互に変える）。日時は取り込んだ日時のまま。ほかの方の部門更新の取込履歴は消していない（正本の「全件削除」は行わない）ので、履歴はこのケースの12件だけではない`);
});
