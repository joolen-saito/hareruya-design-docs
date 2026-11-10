/**
 * M03-27 グッズ商品CSV登録の続き（-b）の画面シード。実施不可の見直し（2026-11-10・11）で流せる見込みになったケース。正本: cases/M03-27_seed_data.tsv
 *
 * シードでの解釈（記録 review/M03-27_progress_2026-11-11_dev.md にも書く）:
 * - 「該当する商品があれば削除する」: 商品コード・商品名には実行の印 rc() を付けるので、前の回の商品には当たらない。消す操作はせず、
 *   印つきの値の商品が無いことを DB の参照で確かめる（あればシードを止める）。
 * - 「グッズ商品CSV取込履歴を0件にする（DB で削除）」: ほかの方の取込履歴も消すことになるので行わない。取込のファイル名に印を付け、
 *   そのファイル名の取込履歴が0件であることを確かめる。ケースの「取込履歴の件数」は、このファイル名の件数で読む（ケースの注記に残す）。
 * - S-M03-27-MASTER（DB シードで各マスタを投入）: 開発環境に既にあるものを使う。言語1・購入グループ「通常商品」・略称タグ1098・売上分析タグ8・9・
 *   タグ8・18・カードセット23 は開発環境にそのままある。対象カテゴリ（正本 2・12・27・177）は、開発環境ではグッズの親が番号2（名前は「スタンダード」）で、
 *   12・27 は無く 177 はグッズの親の下に無いので、2 とその子のカテゴリ3つに読み替える。対象外カテゴリ（正本 299）は、開発環境では 299 がグッズの親の下にあるので、
 *   グッズの親の下に無いカテゴリに読み替える。部門ID（正本 123456789012）は開発環境に無いので、開発環境の部門の番号1に読み替える。
 *   発送日目安（正本 1・736）はグッズ商品CSVの取込が読まない列（アプリの作り）なので、正本の値のまま入れる。
 * - スマレジ連携フラグはすべて0（スマレジは後回し。依頼者決定 2026-11-10）。フラグが0か空の行は、取込がスマレジに照会しない作り。
 * - 取込は画面（グッズ商品CSVアップロード画面）で行う。グッズ商品CSVには確認モーダルが無く、「CSVファイルをアップロード」で取り込まれる（前回の記録と同じ）。
 */
import fs from "node:fs";
import path from "node:path";
import { Browser } from "@playwright/test";
import { STATE_DIR } from "../config/env";
import { decodeCsvBytes, parseCsv } from "../lib/csv";
import { rc } from "../lib/run_marker";
import { defineSeed, reportSeedIssue } from "../lib/seeds";
import { withAdminSession } from "../lib/session";
import { CsvUploadPage } from "../pages/admin/m03_26_card_csv_upload";
import { downloadedBytes, topMessages } from "../pages/admin/m03_21_shelf_number";
import { ClassEditPage } from "../pages/admin/m03_09_class_edit";
import { M0327_ADMIN } from "./m03-27";
import {
  グッズでないカテゴリ, グッズのカテゴリか, グッズの子カテゴリ, グッズの取込履歴, 商品名のグッズ, 規格コードのグッズ, 正常値のマスタがあるか, 発送日目安にする, 発送日目安の番号,
} from "../db/m03_27_b";

const RUNTIME_DIR = path.join(STATE_DIR, "m03-27-b");
/** ケースの文のファイル名（正本の値）から、この回の実際のファイル名（印つき） */
export const ファイル名 = (正本: string): string => { const ext = path.extname(正本); return `${rc(path.basename(正本, ext))}${ext}`; };
export const ファイルの場所 = (正本: string): string => path.join(RUNTIME_DIR, ファイル名(正本));

/** 読み替えた値（MASTER のシードが決める） */
export const 読み替え = { 対象カテゴリ: [] as string[], 対象外カテゴリ: "", 部門: "1", 発送日目安: "" };

/** 共通の正常値（S-M03-27-CSV-DEFAULT。カテゴリ・部門は読み替えた値）。列名は雛形の見出し */
export function 正常値(): Record<string, string> {
  if (!読み替え.対象カテゴリ.length) throw new Error("S-M03-27-MASTER の読み替えがまだ済んでいない");
  return {
    "商品ID": "", "言語(ID)": "1", "商品公開ステータス": "1", "支店の商品公開ステータス": "1", "サイズ": "200", "重量": "148",
    "商品カテゴリ(ID)": 読み替え.対象カテゴリ.join(","), "購入グループ名称": "通常商品", "略称タグ(ID)": "1098", "売上分析タグ(ID)": "8,9",
    "タグ(ID)": "8,18", "発送日目安(ID)": "1,736", "カードセット(ID)": "23", "販売制限数": "5", "基準価格": "300", "販売価格": "15",
    "買取価格": "15", "原価単価": "300", "地域別販売制限": "1", "スマレジ連携フラグ": "0", "スマレジ商品コード": "", "部門ID": 読み替え.部門,
  };
}

// ---- S-M03-27-MASTER: 開発環境に既にあるマスタを使う（DB シードで投入しない） ----
defineSeed("S-M03-27-MASTER", async () => {
  if (読み替え.対象カテゴリ.length) return;
  const 子 = グッズの子カテゴリ(3);
  if (子.length !== 3) throw new Error(`S-M03-27-MASTER: グッズの親（番号2）の子のカテゴリが3つ無い（${子.join("・")}）`);
  const 対象 = ["2", ...子];
  for (const c of 対象) if (!グッズのカテゴリか(c)) throw new Error(`S-M03-27-MASTER: カテゴリ ${c} がグッズの親の下に無い`);
  const 対象外 = グッズでないカテゴリ();
  const r = 正常値のマスタがあるか([...対象, 対象外], 読み替え.部門);
  const 無い = Object.entries(r).filter(([, v]) => !v).map(([k]) => k);
  if (無い.length) throw new Error(`S-M03-27-MASTER: 開発環境に無いマスタ: ${無い.join("、")}（DB シードで投入しない決まり）`);
  const 目安 = 発送日目安の番号();
  if (!目安.length) throw new Error("S-M03-27-MASTER: 開発環境に発送日目安が無い");
  Object.assign(読み替え, { 対象カテゴリ: 対象, 対象外カテゴリ: 対象外, 発送日目安: 目安[目安.length - 1] });
  reportSeedIssue("S-M03-27-MASTER", `マスタは DB シードで投入せず、開発環境にあるものを使った。対象カテゴリ（正本 2・12・27・177）は ${対象.join("・")}、対象外カテゴリ（正本 299）は ${対象外}、部門ID（正本 123456789012）は ${読み替え.部門} に読み替えた（正本の外の補い）`);
});
defineSeed("S-M03-27-CSV-DEFAULT", { needs: ["S-M03-27-MASTER"] }, async () => { /* 値は 正常値() が持つ。ケース専用の CSV を作るときに入れる */ });

// ---- 雛形の見出し（1回の実行で1度だけ画面から取る） ----
let 雛形: { 見出し: string[]; BOM: boolean } | null = null;
async function 雛形を読む(browser: Browser): Promise<{ 見出し: string[]; BOM: boolean }> {
  if (雛形) return 雛形;
  雛形 = await withAdminSession(browser, M0327_ADMIN, async (page) => {
    const up = new CsvUploadPage(page, "グッズ商品");
    await up.open();
    const bytes = await downloadedBytes(await up.downloadTemplate());
    const rows = parseCsv(decodeCsvBytes(bytes));
    if (rows.length !== 1 || !rows[0].length) throw new Error("グッズ商品CSVの雛形が見出しの1行でない");
    return { 見出し: rows[0], BOM: bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf };
  });
  return 雛形;
}

/** 見出しに合わせて行を作り、ファイルに書く（書いていない列は空） */
export async function CSVを書く(browser: Browser, 正本のファイル名: string, 行: Record<string, string>[]): Promise<string> {
  const t = await 雛形を読む(browser);
  for (const r of 行) for (const k of Object.keys(r)) if (!t.見出し.includes(k)) throw new Error(`グッズ商品CSVの雛形に列「${k}」が無い（見出し: ${t.見出し.join("、")}）`);
  const cell = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
  const lines = [t.見出し.map(cell).join(","), ...行.map((r) => t.見出し.map((h) => cell(r[h] ?? "")).join(","))];
  fs.mkdirSync(RUNTIME_DIR, { recursive: true });
  const p = ファイルの場所(正本のファイル名);
  fs.writeFileSync(p, Buffer.concat([t.BOM ? Buffer.from([0xef, 0xbb, 0xbf]) : Buffer.alloc(0), Buffer.from(lines.join("\r\n") + "\r\n", "utf-8")]));
  return p;
}

/** シードの準備の取込（画面）。成功の表示が出てエラーが無いことを確かめる */
async function 準備の取込(browser: Browser, seedId: string, 正本のファイル名: string): Promise<void> {
  await withAdminSession(browser, M0327_ADMIN, async (page) => {
    const up = new CsvUploadPage(page, "グッズ商品");
    await up.open();
    await up.choose(ファイルの場所(正本のファイル名));
    const r = await up.pressUpload();
    if (!r || !r.sent) throw new Error(`${seedId}: 準備の取込の要求が送られない`);
    const m = await topMessages(page);
    if (m.エラー.length || !m.成功.length) throw new Error(`${seedId}: 準備の取込（${ファイル名(正本のファイル名)}）が成功しない: 成功「${m.成功.join(" / ")}」・エラー「${m.エラー.join(" / ")}」`);
  });
}

/** 前提: 印つきの名前・規格コードの商品が無い、印つきのファイル名の取込履歴が0件（消す操作はしない） */
function 無いことを確かめる(seedId: string, a: { 名前?: string[]; 規格コード?: string[]; ファイル?: string[] }): void {
  for (const n of a.名前 ?? []) if (商品名のグッズ(n).length) throw new Error(`${seedId}: 商品名「${n}」の商品がある（無いはず。消す操作はしない）`);
  for (const c of a.規格コード ?? []) if (規格コードのグッズ(c).length) throw new Error(`${seedId}: 規格コード「${c}」の商品がある（無いはず。消す操作はしない）`);
  for (const f of a.ファイル ?? []) { const n = グッズの取込履歴(ファイル名(f)); if (n) throw new Error(`${seedId}: ${ファイル名(f)} の取込履歴が ${n} 件ある（0件のはず）`); }
}

/** 取り込んだ1商品の商品IDを、規格コードで DB から読む（画面の商品一覧の検索と同じ値） */
function 商品IDを読む(seedId: string, 規格コード: string): { 商品ID: string; 規格ID: string } {
  const r = 規格コードのグッズ(規格コード);
  if (r.length !== 1) throw new Error(`${seedId}: 規格コード「${規格コード}」の規格が ${r.length} 件（1件のはず）`);
  return { 商品ID: r[0].商品ID, 規格ID: r[0].規格ID };
}

/** シード表の「1行だけ次の値」の既存商品の行（ほかの列は空） */
export const 既存の行 = (コード: string, 名日: string, 名英: string, extra: Record<string, string> = {}): Record<string, string> => ({
  "商品ID": "", "商品コード": rc(コード), "言語(ID)": "1", "商品公開ステータス": "1", "支店の商品公開ステータス": "1", "商品名(日)": rc(名日), "商品名(英)": rc(名英),
  "サイズ": "200", "重量": "148", "商品カテゴリ(ID)": "2", "購入グループ名称": "通常商品", "基準価格": "300", "販売価格": "300", "買取価格": "15",
  "スマレジ連携フラグ": "0", "スマレジ商品コード": "", "部門ID": "", ...extra,
});
/** 共通の正常値の新しい行（商品コード・名前は印つき） */
export const 新しい行 = (コード: string | null, 名日: string, 名英: string, extra: Record<string, string> = {}): Record<string, string> => ({
  ...正常値(), "商品コード": コード === null ? "" : rc(コード), "商品名(日)": 名日 === "" ? "" : rc(名日), "商品名(英)": 名英 === "" ? "" : rc(名英), ...extra,
});
/** 意図した誤りのほかで止まらないよう、共通の正常値に無い商品コードを足す（アプリは商品コードを必須とする。正本の外の補い） */
export const 補いの商品コード = (k: string): string => `M0327B-${k}`;

// ---- 新しい行だけのケース ----
type 新規の作り方 = { seed: string; ファイル: string; 名前: string[]; 規格コード?: string[]; 行: () => Record<string, string>[] };
const 必須13 = ["言語(ID)", "商品公開ステータス", "支店の商品公開ステータス", "商品名(日)", "商品名(英)", "サイズ", "重量", "商品カテゴリ(ID)", "購入グループ名称", "基準価格", "販売価格", "買取価格", "原価単価"];
export const 必須欠落の名前 = Array.from({ length: 13 }, (_, i) => `必須欠落${String(i + 1).padStart(2, "0")}`);

const 新規: 新規の作り方[] = [
  { seed: "S-M03-27-CASE-011", ファイル: "required-only-011.csv", 名前: ["必須項目グッズ-011"], 行: () => {
    const n = 正常値();
    const r: Record<string, string> = { "商品ID": "", "商品コード": "", "スマレジ連携フラグ": "0", "スマレジ商品コード": "", "部門ID": "" };
    for (const k of 必須13) r[k] = n[k];
    return [{ ...r, "商品名(日)": rc("必須項目グッズ-011"), "商品名(英)": rc("Required Only Goods-011") }];
  } },
  { seed: "S-M03-27-CASE-013", ファイル: "invalid-category-013.csv", 名前: ["対象外カテゴリグッズ"], 行: () => [新しい行(補いの商品コード("013"), "対象外カテゴリグッズ", "Invalid Category Goods-013", { "商品カテゴリ(ID)": 読み替え.対象外カテゴリ })] },
  { seed: "S-M03-27-CASE-014", ファイル: "missing-required-014.csv", 名前: 必須欠落の名前, 行: () => 必須13.map((k, i) => ({ ...新しい行(補いの商品コード(`014-${i + 1}`), 必須欠落の名前[i], `${必須欠落の名前[i]}-en`), [k]: "" })) },
  { seed: "S-M03-27-CASE-041", ファイル: "limit-5010-041.csv", 名前: [], 規格コード: ["OVER-0001-041", "OVER-5010-041"], 行: () => Array.from({ length: 5010 }, (_, i) => {
    const n = String(i + 1).padStart(4, "0");
    return 新しい行(`OVER-${n}-041`, `上限超過グッズ-${n}-041`, `Over Goods-${n}-041`);
  }) },
  { seed: "S-M03-27-CASE-048", ファイル: "mixed-valid-invalid-048.csv", 名前: ["混在正常グッズ", "混在不正グッズ"], 行: () => [
    新しい行(補いの商品コード("048-1"), "混在正常グッズ", "Mixed Valid Goods-048"),
    { ...新しい行(補いの商品コード("048-2"), "混在不正グッズ", "Mixed Invalid Goods-048"), "サイズ": "" }] },
  { seed: "S-M03-27-CASE-049", ファイル: "mixed-valid-invalid-049.csv", 名前: ["混在正常グッズ", "混在不正グッズ"], 行: () => [
    新しい行(補いの商品コード("049-1"), "混在正常グッズ", "Mixed Valid Goods-049"),
    { ...新しい行(補いの商品コード("049-2"), "混在不正グッズ", "Mixed Invalid Goods-049"), "サイズ": "" }] },
  { seed: "S-M03-27-CASE-050", ファイル: "multiple-errors-050.csv", 名前: ["対象外カテゴリグッズ"], 行: () => [
    新しい行(補いの商品コード("050-1"), "", "Name Empty Goods-050"),
    新しい行(補いの商品コード("050-2"), "対象外カテゴリグッズ", "Invalid Category Goods-050", { "商品カテゴリ(ID)": 読み替え.対象外カテゴリ })] },
  { seed: "S-M03-27-SALESTAG-064", ファイル: "m0327-064-salestag.csv", 名前: ["売上分析複数-M0327-064"], 規格コード: ["M0327-064-CODE"], 行: () => [
    新しい行("M0327-064-CODE", "売上分析複数-M0327-064", "M0327-064-SalesTags", { "商品カテゴリ(ID)": "2", "売上分析タグ(ID)": "8,9", "タグ(ID)": "" })] },
  { seed: "S-M03-27-TAG-065", ファイル: "m0327-065-tag.csv", 名前: ["タグ複数-M0327-065"], 規格コード: ["M0327-065-CODE"], 行: () => [
    新しい行("M0327-065-CODE", "タグ複数-M0327-065", "M0327-065-MultiTags", { "商品カテゴリ(ID)": "2", "タグ(ID)": "8,18", "売上分析タグ(ID)": "" })] },
  { seed: "S-M03-27-CATONE-073", ファイル: "cat-one-M0327-073.csv", 名前: ["カテゴリ単一-M0327-073"], 規格コード: ["GOODS-NEW-M0327-073"], 行: () => [
    新しい行("GOODS-NEW-M0327-073", "カテゴリ単一-M0327-073", "Category One-M0327-073", { "商品カテゴリ(ID)": "2", "基準価格": "300", "販売価格": "15", "買取価格": "15" })] },
  { seed: "S-M03-27-SALESONE-074", ファイル: "m0327-074-salestag.csv", 名前: ["売上分析単一-M0327-074"], 規格コード: ["M0327-074-CODE"], 行: () => [
    新しい行("M0327-074-CODE", "売上分析単一-M0327-074", "M0327-074-One", { "商品カテゴリ(ID)": "2", "売上分析タグ(ID)": "8", "タグ(ID)": "" })] },
  { seed: "S-M03-27-TAGONE-075", ファイル: "m0327-075-tag.csv", 名前: ["タグ単一-M0327-075"], 規格コード: ["M0327-075-CODE"], 行: () => [
    新しい行("M0327-075-CODE", "タグ単一-M0327-075", "M0327-075-One", { "商品カテゴリ(ID)": "2", "売上分析タグ(ID)": "", "タグ(ID)": "8" })] },
  { seed: "S-M03-27-REIMPORT-077", ファイル: "reimport-M0327-077.csv", 名前: ["再取込-M0327-077"], 規格コード: ["GOODS-NEW-M0327-077"], 行: () => [
    新しい行("GOODS-NEW-M0327-077", "再取込-M0327-077", "Reimport-M0327-077", { "商品カテゴリ(ID)": "2" })] },
  { seed: "S-M03-27-DUPROW-078", ファイル: "dup-rows-M0327-078.csv", 名前: ["重複行甲-M0327-078", "重複行乙-M0327-078"], 規格コード: ["GOODS-NEW-M0327-078"], 行: () => [
    新しい行("GOODS-NEW-M0327-078", "重複行甲-M0327-078", "Dup One-M0327-078", { "商品カテゴリ(ID)": "2" }),
    新しい行("GOODS-NEW-M0327-078", "重複行乙-M0327-078", "Dup Two-M0327-078", { "商品カテゴリ(ID)": "2" })] },
];
for (const a of 新規) {
  defineSeed(a.seed, { needs: ["S-M03-27-ADM", "S-M03-27-MASTER"] }, async ({ browser, notes }) => {
    無いことを確かめる(a.seed, { 名前: a.名前.map(rc), 規格コード: (a.規格コード ?? []).map(rc), ファイル: [a.ファイル] });
    await CSVを書く(browser, a.ファイル, a.行());
    // 073: カテゴリID 2 の祖先（親から最上位まで）。開発環境では 2 が最上位なので祖先は無い
    if (a.seed === "S-M03-27-CATONE-073") {
      notes.set("〔祖先カテゴリID-M0327-073〕", "（無い。カテゴリID 2 が最上位）");
      reportSeedIssue(a.seed, "開発環境ではカテゴリID 2 が最上位で、祖先のカテゴリは無い（〔祖先カテゴリID-M0327-073〕は「無い」と控えた）");
    }
  });
}

// ---- 既存の商品を作ってから更新の CSV を作るケース ----
type 既存の作り方 = {
  seed: string; 番号: string; 準備: { ファイル: string; 行: () => Record<string, string>[] };
  /** 控える商品IDの呼び名と、その規格コード（正本の値） */
  控え: { 呼び名: string; コード: string }[];
  /** 準備のあと画面で整える（032 のセール） */
  整える?: (browser: Browser, ids: Record<string, { 商品ID: string; 規格ID: string }>) => Promise<void>;
  /** 更新の CSV（ファイル名と、控えた商品IDから行を作る） */
  更新: { ファイル: string; 行: (ids: Record<string, { 商品ID: string; 規格ID: string }>) => Record<string, string>[] };
  無いはず?: { 名前?: string[]; 規格コード?: string[] };
};
const 既存の018 = () => 既存の行("GOODS-OLD-001-018", "更新前グッズ-018", "Before Goods-018", { "地域別販売制限": "2" });
const 既存の032 = () => 既存の行("GOODS-SALE-001-032", "更新前グッズ-032", "Before Goods-032", { "基準価格": "200", "販売価格": "200", "買取価格": "40" });
const 既存の035 = () => 既存の行("GOODS-OLD-001-035", "更新前グッズ-035", "Before Goods-035", { "規格画像": "img/goods/L/OLD/27001035.jpg" });
const 既存の036 = () => 既存の行("GOODS-OLD-001-036", "更新前グッズ-036", "Before Goods-036");
const 既存の037 = () => 既存の行("GOODS-OLD-001-037", "更新前グッズ-037", "Before Goods-037");
const 既存の038 = () => 既存の行("GOODS-OLD-001-038", "更新前グッズ-038", "Before Goods-038");
const 既存の071 = () => [
  既存の行("GOODS-OLD-M0327-071-A", "更新前グッズ-M0327-071A", "Before Goods-M0327-071A", { "基準価格": "100", "販売価格": "100" }),
  既存の行("GOODS-OLD-M0327-071-B", "更新前グッズ-M0327-071B", "Before Goods-M0327-071B", { "基準価格": "120", "販売価格": "120" })];
const 既存の072 = () => [{ ...新しい行("GOODS-OLD-M0327-072", "更新前グッズ-M0327-072", "Before Goods-M0327-072", { "商品カテゴリ(ID)": "2", "基準価格": "100", "販売価格": "100", "買取価格": "15" }) }];

const 既存: 既存の作り方[] = [
  { seed: "S-M03-27-CASE-018", 番号: "018", 準備: { ファイル: "m0327-018-base.csv", 行: () => [既存の018()] }, 控え: [{ 呼び名: "〔商品ID-M0327-018〕", コード: "GOODS-OLD-001-018" }],
    更新: { ファイル: "region-empty-018.csv", 行: (ids) => [{ ...既存の018(), "商品ID": ids["〔商品ID-M0327-018〕"].商品ID, "地域別販売制限": "" }] } },
  { seed: "S-M03-27-CASE-032", 番号: "032", 準備: { ファイル: "m0327-032-base.csv", 行: () => [既存の032()] }, 控え: [{ 呼び名: "〔商品ID-M0327-032〕", コード: "GOODS-SALE-001-032" }],
    整える: async (browser, ids) => {
      const id = ids["〔商品ID-M0327-032〕"];
      await withAdminSession(browser, M0327_ADMIN, async (page) => {
        const c = new ClassEditPage(page);
        await c.編集で開く(id.商品ID, id.規格ID);
        await c.セールフラグ.check();
        await c.販売価格.fill("150");
        const r = await c.登録を押す();
        if (!r.転送があった) throw new Error(`S-M03-27-CASE-032: 商品規格の登録（セールフラグ・販売価格150）が保存されない（${r.URL}）`);
      });
    },
    更新: { ファイル: "sale-update-032.csv", 行: (ids) => [{ ...既存の032(), "商品ID": ids["〔商品ID-M0327-032〕"].商品ID, "基準価格": "350", "販売価格": "999" }] } },
  { seed: "S-M03-27-CASE-035", 番号: "035", 準備: { ファイル: "m0327-035-base.csv", 行: () => [既存の035()] }, 控え: [{ 呼び名: "〔商品ID-M0327-035〕", コード: "GOODS-OLD-001-035" }],
    更新: { ファイル: "image-empty-035.csv", 行: (ids) => [{ ...既存の035(), "商品ID": ids["〔商品ID-M0327-035〕"].商品ID, "規格画像": "" }] } },
  { seed: "S-M03-27-CASE-036", 番号: "036", 準備: { ファイル: "m0327-036-base.csv", 行: () => [既存の036()] }, 控え: [{ 呼び名: "〔商品ID-M0327-036〕", コード: "GOODS-OLD-001-036" }],
    整える: async (_b, ids) => {
      // 発送日目安（正本 736）は画面で指定できないので、E2E の規格に DB で書き足す。開発環境に 736 は無いので、開発環境の発送日目安の番号に読み替える
      発送日目安にする("S-M03-27-CASE-036", ids["〔商品ID-M0327-036〕"].規格ID, 読み替え.発送日目安);
      reportSeedIssue("S-M03-27-CASE-036", `規格の発送日目安（正本 736）は画面で指定できないので DB で書き足した（E2E の規格だけ）。開発環境に 736 は無いので ${読み替え.発送日目安} に読み替えた（正本の外の補い）`);
    },
    更新: { ファイル: "shipping-only-036.csv", 行: (ids) => [{ ...既存の036(), "商品ID": ids["〔商品ID-M0327-036〕"].商品ID, "発送日目安(ID)": "1" }] } },
  { seed: "S-M03-27-CASE-037", 番号: "037", 準備: { ファイル: "m0327-037-base.csv", 行: () => [既存の037()] }, 控え: [{ 呼び名: "〔商品ID-M0327-037〕", コード: "GOODS-OLD-001-037" }],
    更新: { ファイル: "nonexistent-id-037.csv", 行: (ids) => [
      { ...既存の037(), "商品ID": "999999037", "商品コード": rc("GOODS-NONE-001-037"), "商品名(日)": rc("存在しない商品-037") },
      { ...既存の037(), "商品ID": ids["〔商品ID-M0327-037〕"].商品ID, "商品名(日)": rc("更新後グッズ-037") }] } },
  { seed: "S-M03-27-CASE-038", 番号: "038", 準備: { ファイル: "m0327-038-base.csv", 行: () => [既存の038()] }, 控え: [{ 呼び名: "〔商品ID-M0327-038〕", コード: "GOODS-OLD-001-038" }],
    更新: { ファイル: "duplicate-code-038.csv", 行: () => [新しい行("GOODS-OLD-001-038", "商品コード重複", "Duplicate Code-038")] }, 無いはず: { 名前: ["商品コード重複"] } },
  { seed: "S-M03-27-MULTIUPD-071", 番号: "071", 準備: { ファイル: "m0327-071-base.csv", 行: 既存の071 },
    控え: [{ 呼び名: "〔商品ID-M0327-071A〕", コード: "GOODS-OLD-M0327-071-A" }, { 呼び名: "〔商品ID-M0327-071B〕", コード: "GOODS-OLD-M0327-071-B" }],
    更新: { ファイル: "update-multi-M0327-071.csv", 行: (ids) => [
      新しい行("GOODS-OLD-M0327-071-A", "更新後グッズ-M0327-071A", "After Goods-M0327-071A", { "商品ID": ids["〔商品ID-M0327-071A〕"].商品ID, "商品カテゴリ(ID)": "2", "重量": "200", "基準価格": "250", "販売価格": "15", "買取価格": "15" }),
      新しい行("GOODS-OLD-M0327-071-B", "更新後グッズ-M0327-071B", "After Goods-M0327-071B", { "商品ID": ids["〔商品ID-M0327-071B〕"].商品ID, "商品カテゴリ(ID)": "2", "重量": "210", "基準価格": "350", "販売価格": "15", "買取価格": "15" })] } },
  { seed: "S-M03-27-NEWUPD-072", 番号: "072", 準備: { ファイル: "m0327-072-base.csv", 行: 既存の072 }, 控え: [{ 呼び名: "〔商品ID-M0327-072〕", コード: "GOODS-OLD-M0327-072" }],
    更新: { ファイル: "mix-M0327-072.csv", 行: (ids) => [
      新しい行("GOODS-NEW-M0327-072", "新規グッズ-M0327-072", "New Goods-M0327-072", { "商品カテゴリ(ID)": "2", "基準価格": "300", "販売価格": "15", "買取価格": "15" }),
      新しい行("GOODS-OLD-M0327-072", "更新後グッズ-M0327-072", "After Goods-M0327-072", { "商品ID": ids["〔商品ID-M0327-072〕"].商品ID, "商品カテゴリ(ID)": "2", "基準価格": "250", "販売価格": "15", "買取価格": "15" })] },
    無いはず: { 規格コード: ["GOODS-NEW-M0327-072"] } },
];
for (const a of 既存) {
  defineSeed(a.seed, { needs: ["S-M03-27-ADM", "S-M03-27-MASTER"] }, async ({ browser, notes }) => {
    無いことを確かめる(a.seed, { 規格コード: [...a.控え.map((c) => rc(c.コード)), ...(a.無いはず?.規格コード ?? []).map(rc)], 名前: (a.無いはず?.名前 ?? []).map(rc), ファイル: [a.準備.ファイル, a.更新.ファイル] });
    await CSVを書く(browser, a.準備.ファイル, a.準備.行());
    await 準備の取込(browser, a.seed, a.準備.ファイル);
    const ids: Record<string, { 商品ID: string; 規格ID: string }> = {};
    for (const c of a.控え) { ids[c.呼び名] = 商品IDを読む(a.seed, rc(c.コード)); notes.set(c.呼び名, ids[c.呼び名].商品ID); }
    if (a.整える) await a.整える(browser, ids);
    await CSVを書く(browser, a.更新.ファイル, a.更新.行(ids));
    reportSeedIssue(a.seed, `準備の取込（${ファイル名(a.準備.ファイル)}）は取込履歴を残す。正本の「取込履歴を0件にする（DB で削除）」は行わず、ケースの取込履歴はケースのファイル（${ファイル名(a.更新.ファイル)}）の件数で読む`);
  });
}
