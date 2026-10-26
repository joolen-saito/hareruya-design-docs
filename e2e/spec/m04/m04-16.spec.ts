/**
 * M04-16 在庫リコメンドCSV出力。正本: cases/M04-16_test_cases.tsv
 *
 * 画面だけで準備できるケース 001・002・007・010 を実装した（記録 review/M04-16_progress_2026-10-21.md）。
 * - 003〜006・008 は、使用シード（一週前在庫・週間販売数などを「DBへ直接設定する」）を使うので実装しない。
 * - 009 は正本から除外されている（単体の観点。excluded_ut_cases.tsv）。
 *
 * 「TC東京」は店舗ID 1（親店舗）。店名は変えていない（シード S-M04-16-STORE-TC の注記）。試験管理者のデフォルト検索表示店舗は店舗ID 1 なので、
 * 正本が店舗を指定しない手順では、検索欄「店舗」は画面の初期値（店舗ID 1）のまま検索する。
 */
import { expect, Page, test } from "@playwright/test";
import { caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import {
  checkedCodes, checkRowsOfCode, csvButtonGroup, downloadRecommendCsv, listedCodes, openStockList, readCsvRows, recommendButton,
  resultCount, searchByCode, selectedShops,
} from "../../pages/admin/m04_16_recommend_csv";
import { M0416_ADMIN } from "../../seeds/m04-16";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };

/** 検索したときの画面の状態（店舗の欄・件数・行の商品コード）を注記に残す */
async function noteSearch(page: Page): Promise<void> {
  note(`検索欄「店舗」: ${JSON.stringify(await selectedShops(page))}・件数の表示: ${await resultCount(page)}・行の商品コード: ${JSON.stringify(await listedCodes(page))}`);
}

/** CSV の見出し行の「商品コード」の列で、データ行の商品コードを読む */
function codesOf(rows: string[][]): string[] {
  const i = (rows[0] ?? []).indexOf("商品コード");
  if (i < 0) throw new Error(`CSVの見出しに「商品コード」が無い: ${JSON.stringify(rows[0])}`);
  return rows.slice(1).map((r) => r[i]);
}

// ---- 001: 検索結果にボタンが出る ----

caseTest("IT-M04-16-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M0416_ADMIN);
  await step(1, async () => { await openStockList(page); });
  await step(2, async () => {
    await searchByCode(page, "REC-M04-16-A-001");
    await noteSearch(page);
  });
  let buttons: string[] = [];
  await step(3, async () => {
    buttons = (await csvButtonGroup(page).locator("a, select option:first-child").allInnerTexts()).map((t) => t.trim());
    note(`検索結果のボタン表示グループ: ${JSON.stringify(buttons)}`);
  });
  await expected(async () => {
    expect.soft(await listedCodes(page), "検索結果に REC-M04-16-A-001 が出ている（検索結果がある）").toEqual(["REC-M04-16-A-001"]);
    await expect(recommendButton(page), "検索結果に在庫リコメンドCSV出力ボタンが表示される").toBeVisible();
  });
});

// ---- 002: 検索条件に応じて出力し、チェックボックスは使わない ----

caseTest("IT-M04-16-002", async ({ page, step, expected }) => {
  let rows: string[][] = [];
  await loginAdmin(page, M0416_ADMIN);
  await step(1, async () => { await openStockList(page); });
  await step(2, async () => {
    await searchByCode(page, "REC-M04-16-A-002");
    await noteSearch(page);
  });
  await step(3, async () => {
    const n = await checkRowsOfCode(page, "REC-M04-16-A-002-1");
    note(`REC-M04-16-A-002-1 の行（${n}行。店舗・在庫区分ごと）にだけチェックを付けた`);
    expect([...new Set(await checkedCodes(page))], "チェックが付いているのは REC-M04-16-A-002-1 の行だけ").toEqual(["REC-M04-16-A-002-1"]);
  });
  await step(4, async () => { rows = await readCsvRows(await downloadRecommendCsv(page)); });
  await step(5, async () => { note(`CSVの行: ${JSON.stringify(rows)}`); });
  await expected(async () => {
    const codes = codesOf(rows);
    expect.soft([...codes].sort(), "データ行は検索条件に一致する REC-M04-16-A-002-1 と REC-M04-16-A-002-2 の2件").toEqual(["REC-M04-16-A-002-1", "REC-M04-16-A-002-2"]);
    expect.soft(codes, "REC-M04-16-B-002-1 は含まれない").not.toContain("REC-M04-16-B-002-1");
  });
});

// ---- 007: 言語ID ----

caseTest("IT-M04-16-007", async ({ page, step, expected }) => {
  let rows: string[][] = [];
  await loginAdmin(page, M0416_ADMIN);
  await step(1, async () => { await openStockList(page); });
  await step(2, async () => {
    await searchByCode(page, "REC-M04-16-LANG-007");
    await noteSearch(page);
  });
  await step(3, async () => { rows = await readCsvRows(await downloadRecommendCsv(page)); });
  await step(4, async () => { note(`CSVの行: ${JSON.stringify(rows)}`); });
  await expected(async () => {
    const head = rows[0] ?? [];
    const code = head.indexOf("商品コード");
    const lang = head.indexOf("言語ID");
    expect(lang, "CSVの見出しに「言語ID」がある").toBeGreaterThanOrEqual(0);
    const langOf = (c: string) => rows.slice(1).filter((r) => r[code] === c).map((r) => r[lang]);
    expect.soft(langOf("REC-M04-16-LANG-007-JP"), "日本語商品（REC-M04-16-LANG-007-JP）の言語IDは1").toEqual(["1"]);
    expect.soft(langOf("REC-M04-16-LANG-007-EN"), "英語商品（REC-M04-16-LANG-007-EN）の言語IDは2").toEqual(["2"]);
  });
});

// ---- 010: ヘッダ行と1件1行 ----

/** 設計書 0202 在庫リコメンドCSV出力 L0014〜L0028 の CSV出力項目（識別ID 1〜14 の項目名。前後の空白は除く） */
const DESIGN_HEADER = ["店舗名", "商品コード", "商品名(日)", "商品ID", "言語ID", "現在庫", "一週前在庫", "二週前在庫", "三週前在庫", "一月前在庫",
  "週間販売数", "週間入庫数", "月間販売数", "月間入庫数"];

caseTest("IT-M04-16-010", async ({ page, step, expected }) => {
  let rows: string[][] = [];
  await loginAdmin(page, M0416_ADMIN);
  await step(1, async () => { await openStockList(page); });
  await step(2, async () => {
    await searchByCode(page, "REC-M04-16-A-010");
    await noteSearch(page);
  });
  await step(3, async () => { rows = await readCsvRows(await downloadRecommendCsv(page)); });
  await step(4, async () => { note(`CSVの行: ${JSON.stringify(rows)}`); });
  await expected(async () => {
    expect.soft(rows[0], "先頭はヘッダ行（設計書のCSV出力項目の名前の行）").toEqual(DESIGN_HEADER);
    const codes = codesOf(rows);
    expect.soft(codes, "ヘッダ行のあとは REC-M04-16-A-010-1 と REC-M04-16-A-010-2 の2行だけ").toHaveLength(2);
    expect.soft(codes.filter((c) => c === "REC-M04-16-A-010-1"), "REC-M04-16-A-010-1 は1件1行").toHaveLength(1);
    expect.soft(codes.filter((c) => c === "REC-M04-16-A-010-2"), "REC-M04-16-A-010-2 は1件1行").toHaveLength(1);
  });
});
