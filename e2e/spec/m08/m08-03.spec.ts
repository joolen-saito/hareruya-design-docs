/**
 * M08-03 会員のCSV出力。正本: cases/M08-03_test_cases.tsv
 * 実装しないケース（記録 review/M08-03_progress_*.md）: シードが会員の値（累計・日時など）をDBで設定するもの。
 * CSV出力項目設定（共有の設定）を書き換えるので、基盤が1本だけで流す。書き換える前の並びは .runs/m0803_csv_original.json に控え、afterAll で戻してDBの参照で確かめる。
 */
import { chromium, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { SETUP_ADMIN } from "../../config/env";
import { loginAdmin, withAdminSession } from "../../lib/session";
import { 会員CSVの出力項目の番号 } from "../../db/m08_03";
import { M08CustomerListPage } from "../../pages/admin/m08_customer_list";
import { 会員CSVPage, 控えがあるか, 控えへ戻す, 控えを捨てる } from "../../pages/admin/m08_03_csv";
import { M0803_ADMIN, メール, 姓 } from "../../seeds/m08-03";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const LOG = path.resolve(__dirname, "../../.runs/m0803_csv_restore.log");

test.afterAll(async ({}, testInfo) => {
  if (!控えがあるか()) return;
  // 戻す処理は、ケースの時間切れ・ブラウザの終了（「Test ended」）に当たらないよう、専用のブラウザで十分な時間をかけて行う（2026-11-12）。
  // 共有の設定を戻せなかったときは、必ずログに残し、この回を失敗にして報告させる（控えのファイルは残す）
  testInfo.setTimeout(900_000);
  const t = new Date().toISOString();
  const own = await chromium.launch();
  try {
    const r = await withAdminSession(own, SETUP_ADMIN, (page) => 控えへ戻す(page));
    const db = 会員CSVの出力項目の番号();
    const ok = !!r && JSON.stringify(r.控え) === JSON.stringify(db);
    fs.appendFileSync(LOG, `${t}\t元の出力項目へ戻した\t${ok ? "DBの参照で一致" : `不一致 控え=${r?.控え.join(",")} DB=${db.join(",")}`}\n`);
    if (ok) 控えを捨てる();
    else throw new Error(`共有の会員CSVの出力項目を元の並びへ戻したが、DBの参照と一致しない（控え=${r?.控え.join(",")} DB=${db.join(",")}）。控えのファイルは残してある`);
  } catch (e) {
    fs.appendFileSync(LOG, `${t}\t戻せなかった（控えのファイルは残してある）\t${String(e)}\n`);
    throw e;
  } finally {
    await own.close().catch(() => undefined);
  }
});

async function 検索する(ctx: Pick<CaseCtx, "page">, 語: string): Promise<M08CustomerListPage> {
  const list = new M08CustomerListPage(ctx.page);
  await list.open();
  await list.searchMulti(語);
  return list;
}
const col = (row: string[], n: number): string => (row[n - 1] ?? "").replace(/^\uFEFF/, "");

function 一件(k: string, 確認: (row: string[], id: string) => void) {
  return async (ctx: CaseCtx): Promise<void> => {
    const { page, notes, step, expected } = ctx;
    const id = notes.get(`〔会員ID-M0803-${k}〕`);
    await loginAdmin(page, M0803_ADMIN);
    const csv = new 会員CSVPage(page);
    let r: Awaited<ReturnType<会員CSVPage["CSVダウンロードを選ぶ"]>> = {};
    await step(1, async () => { await new M08CustomerListPage(page).open(); });
    await step(2, async () => { await new M08CustomerListPage(page).searchMulti(メール(k)); });
    await step(3, async () => { await csv.チェックする([id]); });
    await step(4, async () => { r = await csv.CSVダウンロードを選ぶ(); });
    let row: string[] | undefined;
    await step(5, async () => { row = r.行?.find((x) => col(x, 1) === id); });
    await expected(async () => {
      expect.soft(r.行 !== undefined, "CSVがダウンロードされた").toBe(true);
      expect.soft(row !== undefined, `会員ID ${id} で始まる行がある`).toBe(true);
      if (row) 確認(row, id);
    });
  };
}

caseTest("IT-M08-03-003", 一件("003", (row, id) => {
  expect.soft(row.length, `会員ID ${id} の行の項目数`).toBe(39);
  expect.soft(col(row, 1), "第1項目").toBe(id);
  expect.soft(col(row, 8), "第8項目").toBe(メール("003"));
  expect.soft(col(row, 30), "第30項目").toBe("M0803-003-ビル");
  expect.soft(col(row, 39), "第39項目").toBe("M0803-003-退会理由");
}));

caseTest("IT-M08-03-004", 一件("004", (row) => {
  const want: [number, string][] = [[22, "M0803-004-会社"], [23, "06"], [24, "9876"], [25, "5432"], [27, "M0803-004-メモ"], [28, "M0803-004-港区"], [29, "M0803-004-1-2-3"], [30, "M0803-004-ビル"], [31, "03"], [32, "1234"], [33, "5678"], [39, "M0803-004-退会理由"]];
  for (const [n, v] of want) expect.soft(col(row, n), `第${n}項目`).toBe(v);
}));

caseTest("IT-M08-03-005", 一件("005", (row) => {
  const want: [number, string][] = [[26, "弁護士"], [36, "27"], [37, "1"], [38, "1"]];
  for (const [n, v] of want) expect.soft(col(row, n), `第${n}項目`).toBe(v);
}));

caseTest("IT-M08-03-007", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const [a, b, c] = ["A", "B", "C"].map((x) => notes.get(`〔会員ID-M0803-007${x}〕`));
  await loginAdmin(page, M0803_ADMIN);
  const csv = new 会員CSVPage(page);
  let r: Awaited<ReturnType<会員CSVPage["CSVダウンロードを選ぶ"]>> = {};
  await step(1, async () => { await new M08CustomerListPage(page).open(); });
  await step(2, async () => { await new M08CustomerListPage(page).searchMulti(姓("007")); });
  await step(3, async () => { await csv.チェックする([a, b]); });
  await step(4, async () => { r = await csv.CSVダウンロードを選ぶ(); });
  let 数: Record<string, number> = {};
  await step(5, async () => { 数 = Object.fromEntries([a, b, c].map((id) => [id, (r.行 ?? []).filter((x) => col(x, 1) === id).length])); });
  const n = (id: string) => 数[id] ?? 0;
  await expected(async () => {
    expect.soft(r.行 !== undefined, "CSVがダウンロードされた").toBe(true);
    expect.soft(n(a), `会員ID ${a} の行の数`).toBe(1);
    expect.soft(n(b), `会員ID ${b} の行の数`).toBe(1);
    expect.soft(n(c), `会員ID ${c} の行の数（出力されない）`).toBe(0);
  });
});

caseTest("IT-M08-03-008", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const ids = ["A", "B", "C"].map((x) => notes.get(`〔会員ID-M0803-008${x}〕`));
  await loginAdmin(page, M0803_ADMIN);
  const csv = new 会員CSVPage(page);
  let r: Awaited<ReturnType<会員CSVPage["CSVダウンロードを選ぶ"]>> = {};
  await step(1, async () => { await new M08CustomerListPage(page).open(); });
  await step(2, async () => { await new M08CustomerListPage(page).searchMulti(姓("008")); });
  await step(3, async () => { await csv.見出しのチェック.check({ timeout: 30_000 }); });
  await step(4, async () => { r = await csv.CSVダウンロードを選ぶ(); });
  let 数: Record<string, number> = {};
  await step(5, async () => { 数 = Object.fromEntries(ids.map((id) => [id, (r.行 ?? []).filter((x) => col(x, 1) === id).length])); });
  await expected(async () => {
    expect.soft(r.行 !== undefined, "CSVがダウンロードされた").toBe(true);
    for (const id of ids) expect.soft(数[id] ?? 0, `会員ID ${id} の行の数`).toBe(1);
  });
});

caseTest("IT-M08-03-009", async (ctx) => {
  const { page, step, expected } = ctx;
  await loginAdmin(page, M0803_ADMIN);
  const csv = new 会員CSVPage(page);
  let r: Awaited<ReturnType<会員CSVPage["CSVダウンロードを選ぶ"]>> = {};
  await step(1, async () => { await new M08CustomerListPage(page).open(); });
  await step(2, async () => { await new M08CustomerListPage(page).searchMulti(メール("009")); });
  await step(3, async () => {
    for (const [id, on] of Object.entries(await csv.全部のチェック状態())) if (on) note(`チェックが入っていた: ${id}`);
    r = await csv.CSVダウンロードを選ぶ();
  });
  await expected(async () => {
    expect.soft(r.ダウンロードなし !== undefined, "CSVファイルがダウンロードされない").toBe(true);
    expect.soft((r.ダウンロードなし?.画面の文 ?? []).length, `エラーの表示（${(r.ダウンロードなし?.画面の文 ?? []).join(" / ")}）`).toBeGreaterThan(0);
  });
});

caseTest("IT-M08-03-010", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const ids = ["A", "B", "C"].map((x) => notes.get(`〔会員ID-M0803-010${x}〕`));
  await loginAdmin(page, M0803_ADMIN);
  const csv = new 会員CSVPage(page);
  let 状態: Record<string, boolean> = {};
  await step(1, async () => { await new M08CustomerListPage(page).open(); });
  await step(2, async () => { await new M08CustomerListPage(page).searchMulti(姓("010")); });
  await step(3, async () => { await csv.見出しのチェック.check({ timeout: 30_000 }); });
  await step(4, async () => { await csv.見出しのチェック.uncheck({ timeout: 30_000 }); });
  await step(5, async () => { 状態 = await csv.全部のチェック状態(); });
  await expected(async () => {
    for (const id of ids) expect.soft(状態[id], `会員ID ${id} のCSV出力チェック（チェックなし）`).toBe(false);
  });
});

caseTest("IT-M08-03-011", async (ctx) => {
  const { page, notes, step, expected } = ctx;
  const ids = "ABCDEFGHIJK".split("").map((x) => notes.get(`〔会員ID-M0803-011${x}〕`));
  await loginAdmin(page, M0803_ADMIN);
  const csv = new 会員CSVPage(page);
  let r: Awaited<ReturnType<会員CSVPage["CSVダウンロードを選ぶ"]>> = {};
  await step(1, async () => { await new M08CustomerListPage(page).open(); });
  await step(2, async () => { await new M08CustomerListPage(page).searchMulti(姓("011")); });
  await step(3, async () => {
    const sel = page.locator("#page_count_pulldown");
    const opt = (await sel.locator("option").evaluateAll((os) => os.map((o) => ({ v: (o as HTMLOptionElement).value, t: (o.textContent ?? "").trim() })))).find((o) => /^10(件)?$/.test(o.t));
    if (!opt) throw new Error("件数の選択肢に「10件」が無い");
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), sel.selectOption(opt.v)]);
    await page.waitForLoadState("load");
  });
  await step(4, async () => { await csv.見出しのチェック.check({ timeout: 30_000 }); });
  await step(5, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), page.locator(".pagination a", { hasText: /^\s*2\s*$/ }).first().click({ timeout: 30_000 })]);
    await page.waitForLoadState("load");
    for (const b of await page.locator('input[name="ids[]"]').all()) await b.check({ timeout: 30_000 });
  });
  await step(6, async () => { r = await csv.CSVダウンロードを選ぶ(); });
  let got: string[] = [];
  await step(7, async () => { got = ids.filter((id) => (r.行 ?? []).some((x) => col(x, 1) === id)); });
  await expected(async () => {
    expect.soft(r.行 !== undefined, "CSVがダウンロードされた").toBe(true);
    expect.soft(got.length, `CSVに出力された11件のうちの件数（${got.length}件。11件が同時には出力されない）`).toBeLessThan(11);
  });
});
