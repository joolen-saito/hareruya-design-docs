/**
 * M03-26 カード商品CSV登録の続き（-b）の画面シード。実施不可の見直し（2026-11-10）で流せる見込みになった、新規の取込のケース。
 * 正本: cases/M03-26_seed_data.tsv
 *
 * シードでの解釈（記録 review/M03-26_progress_2026-11-10_dev.md にも書く）:
 * - S-M03-26-MASTER（各マスタ・商品カテゴリ階層・店舗・在庫場所を DB シードで登録）: 開発環境に既にあるマスタを使う。言語1・割引率5・買取減額率1・
 *   略称タグ2448・売上分析タグ28・29・タグ2・3・購入グループ「通常商品」は開発環境にそのままある（DB の参照で確かめる）。
 *   商品カテゴリは、開発環境では 177 が「1 > 159 > 176 > 177」の4階層目（正本は 1 の直下）。取込は指定したカテゴリの祖先も商品に付けるので、
 *   期待結果のカテゴリは「指定したカテゴリとその祖先」で読む（ケースの注記に残す）。
 * - カード詳細（正本は管理画面のカード登録で新しく作る）: カードのマスタを共有の開発環境に新しく作らない（親の決定）。開発環境に既にある、
 *   商品の付いていないカード詳細を DB の参照で選んで使い、〔カード詳細ID-M0326-…〕はその番号に読み替える。選ぶのは、取込が作る商品コードが
 *   既存の規格と重ならないもの（db/m03_26_b.ts）。正本の「状態EX」はカード詳細の属性に無いので読み替えない。取り込むと、そのカード詳細には商品が付く（次の回は別のものを選ぶ）。
 * - CSV のファイル名・商品名には実行の印 rc() を付ける（同じファイル名の取込履歴0件・同名の商品0件にするため。ケースは書式を確かめない）。
 * - CSV の列は、画面の「雛形ファイルダウンロード」で取った見出しに合わせる（雛形は30列。設計書の31列の「商品削除フラグ」は雛形に無い＝ M03-26 005 の不合格）。
 *   シード表が「その他は正常値」とする列は、MASTER の正常値（言語1・公開1・支店公開1・サイズ1・重量3・カテゴリ1,177・通常商品・割引率5・基準300・販売300・買取15・原価15・地域0）で埋める。
 */
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { STATE_DIR } from "../config/env";
import { decodeCsvBytes, parseCsv } from "../lib/csv";
import { rc, RUN_MARK } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { CsvUploadPage } from "../pages/admin/m03_26_card_csv_upload";
import { downloadedBytes } from "../pages/admin/m03_21_shelf_number";
import { M0326_ADMIN } from "./m03-26";
import { カード商品CSVの取込履歴, カード名の, カード詳細が無いか, カード詳細の商品, マスタに無いか, 商品が無いか, 商品の無いカード詳細, 正本のマスタがあるか } from "../db/m03_26_b";

const RUNTIME_DIR = path.join(STATE_DIR, "m03-26-b");
/** ケースの文のファイル名（正本の値）から、この回の実際のファイル名（印つき） */
export const ファイル名 = (正本: string): string => { const ext = path.extname(正本); return `${rc(path.basename(正本, ext))}${ext}`; };
export const ファイルの場所 = (正本: string): string => path.join(RUNTIME_DIR, ファイル名(正本));

/** 正常値（S-M03-26-MASTER の値）。列名は雛形の見出し */
export const 正常値: Record<string, string> = {
  "商品ID": "", "言語(ID)": "1", "商品公開ステータス": "1", "支店の商品公開ステータス": "1", "サイズ": "1", "重量": "3",
  "商品カテゴリ(ID)": "1,177", "購入グループ名称": "通常商品", "割引率(ID)": "5", "基準価格": "300", "販売価格": "300",
  "買取価格": "15", "原価単価": "15", "地域別販売制限": "0",
};

// ---- S-M03-26-MASTER: 開発環境に既にあるマスタを使う（DB シードで登録しない。番号がそろっているかを DB の参照で確かめる） ----
defineSeed("S-M03-26-MASTER", async () => {
  const r = 正本のマスタがあるか();
  const 無い = Object.entries(r).filter(([, v]) => !v).map(([k]) => k);
  if (無い.length) throw new Error(`S-M03-26-MASTER: 開発環境に無いマスタ: ${無い.join("、")}（DB シードで登録しない決まり）`);
  reportSeedIssue("S-M03-26-MASTER", "マスタは DB シードで登録せず、開発環境に既にある言語1・商品カテゴリ1・177・178・購入グループ「通常商品」・割引率5・買取減額率1・略称タグ2448・売上分析タグ28・29・タグ2・3を使った（177・178 は 1 の直下でなく 1 > 159 > 176 の下。正本の外の補い）。店舗・在庫場所も開発環境のもの");
});

// ---- 雛形の見出し（1回の実行で1度だけ画面から取る） ----
let 雛形: { 見出し: string[]; BOM: boolean } | null = null;
async function 雛形を読む(browser: import("@playwright/test").Browser): Promise<{ 見出し: string[]; BOM: boolean }> {
  if (雛形) return 雛形;
  雛形 = await withAdminSession(browser, M0326_ADMIN, async (page) => {
    const up = new CsvUploadPage(page, "カード商品");
    await up.open();
    const bytes = await downloadedBytes(await up.downloadTemplate());
    const rows = parseCsv(decodeCsvBytes(bytes));
    if (rows.length !== 1 || !rows[0].length) throw new Error("カード商品CSVの雛形が見出しの1行でない");
    return { 見出し: rows[0], BOM: bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf };
  });
  return 雛形;
}

/** 見出しに合わせて行を作り、ファイルに書く（区切りはカンマ、またはタブ） */
async function CSVを書く(browser: import("@playwright/test").Browser, 正本のファイル名: string, 行: Record<string, string>[], 区切り: "," | "\t" = ","): Promise<string> {
  const t = await 雛形を読む(browser);
  for (const r of 行) for (const k of Object.keys(r)) if (!t.見出し.includes(k)) throw new Error(`カード商品CSVの雛形に列「${k}」が無い（見出し: ${t.見出し.join("、")}）`);
  const cell = (v: string) => (区切り === "," ? (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v) : v);
  const lines = [t.見出し.map(cell).join(区切り), ...行.map((r) => t.見出し.map((h) => cell(r[h] ?? "")).join(区切り))];
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  const p = ファイルの場所(正本のファイル名);
  fs.writeFileSync(p, Buffer.concat([t.BOM ? Buffer.from([0xef, 0xbb, 0xbf]) : Buffer.alloc(0), Buffer.from(lines.join("\r\n") + "\r\n", "utf-8")]));
  return p;
}

// ---- カード詳細を選ぶ ----
const 選んだ = new Set<string>();
function カード詳細を選ぶ(seedId: string, n: number): string[] {
  const ずらし = parseInt(createHash("sha1").update(`${seedId}:${RUN_MARK}`).digest("hex").slice(0, 6), 16) % 200;
  const ids = 商品の無いカード詳細(n, ずらし, [...選んだ]);
  if (ids.length !== n) throw new Error(`${seedId}: 開発環境に、商品の付いていない使えるカード詳細が ${n} 件無い（${ids.length} 件）`);
  for (const id of ids) {
    if (!カード名の(id)) throw new Error(`${seedId}: カード詳細 ${id} にカードが付いていない`);
    選んだ.add(id);
  }
  reportSeedIssue(seedId, `カード詳細は新しく作らず、開発環境に既にある商品の付いていないカード詳細（${ids.join("・")}）を使った（正本の外の補い）`);
  return ids;
}

/** 取込の前の確かめ: そのファイル名の取込履歴が0件・選んだカード詳細に商品が無い */
function 前提を確かめる(seedId: string, 正本のファイル名: string[], カード詳細: string[]): void {
  for (const f of 正本のファイル名) {
    const n = カード商品CSVの取込履歴(ファイル名(f));
    if (n !== 0) throw new Error(`${seedId}: ${ファイル名(f)} の取込履歴が ${n} 件ある（0件のはず）`);
  }
  for (const id of カード詳細) if (カード詳細の商品(id).length) throw new Error(`${seedId}: カード詳細 ${id} に商品が付いている`);
}

type 作り方 = {
  番号: string;
  /** カード詳細の呼び名の末尾（1件なら [""]、2件なら ["A","B"]） */
  末尾: string[];
  /** 正本のファイル名と、行（カード詳細の番号を受け取って行を返す） */
  ファイル: { 名前: string; 区切り?: "," | "\t"; 行: (ids: string[]) => Record<string, string>[] }[];
};
const 名前 = (日: string, 英: string): Record<string, string> => ({ "商品名(日)": rc(日), "商品名(英)": rc(英) });
const 一行 = (ids: string[], extra: Record<string, string>, i = 0) => ({ ...正常値, "カード詳細(ID)": ids[i], ...extra });

export const 作り方の一覧: 作り方[] = [
  { 番号: "007", 末尾: [""], ファイル: [{ 名前: "new-card-007.csv", 行: (ids) => [一行(ids, { ...名前("結合試験カード-007", "Integration Card-007"), "買取減額率(ID)": "1", "略称タグ(ID)": "2448", "売上分析タグ(ID)": "28", "タグ(ID)": "2", "販売制限数": "25" })] }] },
  { 番号: "008", 末尾: [""], ファイル: [{ 名前: "new-card.tsv", 区切り: "\t", 行: (ids) => [一行(ids, 名前("タブ区切りカード", "タブ区切りカード"))] }] },
  { 番号: "009", 末尾: [""], ファイル: [{ 名前: "optional-empty.csv", 行: (ids) => [{ ...一行(ids, 名前("任意項目空カード-009", "Optional Empty Card-009")), "地域別販売制限": "" }] }] },
  { 番号: "010", 末尾: [""], ファイル: [{ 名前: "new-card-010.csv", 行: (ids) => [一行(ids, 名前("結合試験カード-010", "Integration Card-010"))] }] },
  { 番号: "011", 末尾: [""], ファイル: [{ 名前: "new-card-011.csv", 行: (ids) => [一行(ids, 名前("結合試験カード-011", "Integration Card-011"))] }] },
  { 番号: "014", 末尾: [""], ファイル: [{ 名前: "new-card-014.csv", 行: (ids) => [一行(ids, 名前("結合試験カード-014", "Integration Card-014"))] }] },
  { 番号: "015", 末尾: [""], ファイル: [{ 名前: "new-card-015.csv", 行: (ids) => [一行(ids, 名前("結合試験カード-015", "Integration Card-015"))] }] },
  { 番号: "045", 末尾: [""], ファイル: [{ 名前: "product-not-found.csv", 行: (ids) => [一行(ids, { ...名前("商品未登録確認-045", "Product Not Found-045"), "商品ID": "999999045" })] }] },
  { 番号: "047", 末尾: ["A", "B"], ファイル: [{ 名前: "rollback.csv", 行: (ids) => [
    一行(ids, { ...名前("ロールバック正常-047", "Rollback OK-047"), "販売価格": "300", "買取価格": "100" }, 0),
    一行(ids, { ...名前("ロールバック誤り-047", "Rollback NG-047"), "販売価格": "300", "買取価格": "301" }, 1)] }] },
  { 番号: "056", 末尾: [""], ファイル: [{ 名前: "M0326-056-split.csv", 行: (ids) => [一行(ids, { ...名前("M0326-056-商品", "M0326-056-Item"), "商品公開ステータス": "3", "支店の商品公開ステータス": "1", "買取価格": "100", "原価単価": "" })] }] },
  { 番号: "058", 末尾: [""], ファイル: [{ 名前: "M0326-058-empty.csv", 行: (ids) => [一行(ids, { ...名前("M0326-058-商品", "M0326-058-Item"), "買取価格": "100", "原価単価": "", "地域別販売制限": "" })] }] },
  { 番号: "059", 末尾: ["A", "B"], ファイル: [
    { 名前: "M0326-059-A.csv", 行: (ids) => [一行(ids, { ...名前("M0326-059-商品", "M0326-059-Item"), "買取価格": "100", "原価単価": "", "地域別販売制限": "1" }, 0)] },
    { 名前: "M0326-059-B.csv", 行: (ids) => [一行(ids, { ...名前("M0326-059-商品", "M0326-059-Item"), "買取価格": "100", "原価単価": "", "地域別販売制限": "2" }, 1)] }] },
  { 番号: "069", 末尾: ["A", "B"], ファイル: [{ 名前: "M0326-069-status12.csv", 行: (ids) => [
    一行(ids, { ...名前("M0326-069-商品A", "M0326-069-ItemA"), "商品公開ステータス": "1", "買取価格": "100", "原価単価": "" }, 0),
    一行(ids, { ...名前("M0326-069-商品B", "M0326-069-ItemB"), "商品公開ステータス": "2", "買取価格": "100", "原価単価": "" }, 1)] }] },
  { 番号: "073", 末尾: [""], ファイル: [{ 名前: "M0326-073-tags.csv", 行: (ids) => [一行(ids, { ...名前("結合試験カード-073", "Integration Card-073"), "買取減額率(ID)": "1", "略称タグ(ID)": "2448", "売上分析タグ(ID)": "28,29", "タグ(ID)": "2,3", "販売制限数": "25", "原価単価": "" })] }] },
  { 番号: "075", 末尾: [""], ファイル: [{ 名前: "M0326-075-equal.csv", 行: (ids) => [一行(ids, { ...名前("結合試験カード-075", "Integration Card-075"), "買取価格": "300", "原価単価": "" })] }] },
  { 番号: "077", 末尾: [""], ファイル: [{ 名前: "M0326-077-again.csv", 行: (ids) => [一行(ids, 名前("結合試験カード-077", "Integration Card-077"))] }] },
  { 番号: "079", 末尾: [""], ファイル: [{ 名前: "M0326-CB079-new.csv", 行: (ids) => [一行(ids, { ...名前("M0326-CB079-商品", "M0326-CB079-Item"), "基準価格": "400", "販売価格": "350", "買取価格": "120", "原価単価": "" })] }] },
  { 番号: "087", 末尾: ["A", "B"], ファイル: [{ 名前: "M0326-CB087-two.csv", 行: (ids) => [
    一行(ids, { ...名前("M0326-CB087-商品A", "M0326-CB087-ItemA"), "買取価格": "100", "原価単価": "" }, 0),
    一行(ids, { ...名前("M0326-CB087-商品B", "M0326-CB087-ItemB"), "買取価格": "100", "原価単価": "" }, 1)] }] },
];

const シード名: Record<string, string> = {
  "007": "NEW-007", "008": "TSV-008", "009": "OPTIONAL-009", "010": "NEW-010", "011": "NEW-011", "014": "NEW-014", "015": "NEW-015",
  "045": "LOOKUP-045", "047": "ROLLBACK-047", "056": "STATUSSPLIT-056", "058": "REGIONEMPTY-058", "059": "REGIONVAL-059",
  "069": "STATUS12-069", "073": "TAG2-073", "075": "EQUALPRICE-075", "077": "REIMPORT-077", "079": "CBNEW-079", "087": "CBTWO-087",
};

for (const a of 作り方の一覧) {
  const seedId = `S-M03-26-${シード名[a.番号]}`;
  defineSeed(seedId, { needs: ["S-M03-26-ADM"] }, async ({ browser, notes }) => {
    const ids = カード詳細を選ぶ(seedId, a.末尾.length);
    a.末尾.forEach((s, i) => notes.set(`〔カード詳細ID-M0326-${a.番号}${s}〕`, ids[i]));
    if (a.番号 === "045" && !商品が無いか("999999045")) throw new Error(`${seedId}: 商品ID 999999045 の商品がある（未登録のはず）`);
    前提を確かめる(seedId, a.ファイル.map((f) => f.名前), ids);
    for (const f of a.ファイル) await CSVを書く(browser, f.名前, f.行(ids), f.区切り);
  });
}

// ---- 029: 既存商品のカード詳細（A）と未登録のカード詳細（B） ----
// 正本は A の商品をグッズ商品CSV＋商品登録編集の「カード指定」で作る。ここでは A の商品をカード商品CSVの取込（1行）で作る（正本の外の補い。
// 「A を持つ商品がある」状態は同じ）。商品IDは画面に出ないので DB の参照で読んで控える。
export const 準備の取込 = new Map<string, string>();
defineSeed("S-M03-26-DUPLICATE-029", { needs: ["S-M03-26-ADM"] }, async ({ browser, notes }) => {
  const seedId = "S-M03-26-DUPLICATE-029";
  const [a, b] = カード詳細を選ぶ(seedId, 2);
  notes.set("〔カード詳細ID-M0326-029A〕", a);
  notes.set("〔カード詳細ID-M0326-029B〕", b);
  前提を確かめる(seedId, ["duplicate-and-valid.csv"], [a, b]);
  const 準備 = await CSVを書く(browser, "m0326-029-existing.csv", [{ ...正常値, ...名前("重複確認既存-029", "Duplicate Existing-029"), "カード詳細(ID)": a }]);
  await withAdminSession(browser, M0326_ADMIN, async (page) => {
    const up = new CsvUploadPage(page, "カード商品");
    await up.open();
    await up.choose(準備);
    const pressed = await up.pressUpload();
    if (pressed !== null) throw new Error(`${seedId}: 準備の取込で確認モーダルが開かない`);
    const r = await up.confirm();
    if (!r.sent) throw new Error(`${seedId}: 準備の取込の要求が送られない`);
  });
  const ps = カード詳細の商品(a);
  if (ps.length !== 1) throw new Error(`${seedId}: カード詳細 ${a} の商品が ${ps.length} 件（準備の取込で1件のはず）`);
  notes.set("〔商品ID-M0326-029〕", ps[0].商品ID);
  reportSeedIssue(seedId, `カード詳細 ${a} を持つ既存の商品（商品ID ${ps[0].商品ID}）は、グッズ商品CSV＋カード指定でなく、カード商品CSVの取込1行で作った（正本の外の補い）`);
  await CSVを書く(browser, "duplicate-and-valid.csv", [
    { ...正常値, ...名前("重複確認A-029", "Duplicate A-029"), "カード詳細(ID)": a },
    { ...正常値, ...名前("重複確認B-029", "Duplicate B-029"), "カード詳細(ID)": b }]);
});

// ---- 042: マスタに無い値の8ファイル ----
export const 誤りの項目 = ["言語(ID)", "商品カテゴリ(ID)", "割引率(ID)", "買取減額率(ID)", "略称タグ(ID)", "売上分析タグ(ID)", "タグ(ID)", "購入グループ名称"] as const;
defineSeed("S-M03-26-MASTER-ERROR-042", { needs: ["S-M03-26-ADM"] }, async ({ browser, notes }) => {
  const seedId = "S-M03-26-MASTER-ERROR-042";
  const 無い = マスタに無いか("999999042", "未登録グループ-042");
  const ある = Object.entries(無い).filter(([, v]) => !v).map(([k]) => k);
  if (ある.length) throw new Error(`${seedId}: マスタに 999999042・未登録グループ-042 があるもの: ${ある.join("、")}（シード表は DB から消すが、DB は書き換えない）`);
  const ids = カード詳細を選ぶ(seedId, 8);
  ids.forEach((id, i) => notes.set(`〔カード詳細ID-M0326-042${"ABCDEFGH"[i]}〕`, id));
  const files = 誤りの項目.map((_, i) => `master-error-0${i + 1}.csv`);
  前提を確かめる(seedId, files, ids);
  for (const [i, k] of 誤りの項目.entries()) {
    await CSVを書く(browser, files[i], [{ ...正常値, ...名前(`マスタ誤り-042-${i + 1}`, `Master Error-042-${i + 1}`), "カード詳細(ID)": ids[i], [k]: k === "購入グループ名称" ? "未登録グループ-042" : "999999042" }]);
  }
});

// ---- 043: 未登録のカード詳細 ----
defineSeed("S-M03-26-LOOKUP-043", { needs: ["S-M03-26-ADM"] }, async ({ browser }) => {
  const seedId = "S-M03-26-LOOKUP-043";
  if (!カード詳細が無いか("999999043")) throw new Error(`${seedId}: カード詳細 999999043 がある（シード表は DB から消すが、DB は書き換えない）`);
  前提を確かめる(seedId, ["card-detail-not-found.csv"], []);
  await CSVを書く(browser, "card-detail-not-found.csv", [{ ...正常値, ...名前("カード詳細未登録-043", "Card Detail Not Found-043"), "カード詳細(ID)": "999999043", "買取価格": "100", "原価単価": "90" }]);
});
