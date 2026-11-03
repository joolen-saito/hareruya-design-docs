/** M14-10 フォーマット詳細(登録・編集・削除)。正本: cases/M14-10_test_cases.tsv */
import { caseTest, expect } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { M1410_ADMIN } from "../../seeds/m14-10";

const f = (page: import("@playwright/test").Page, n: string) => page.locator(`[name="admin_format[${n}]"]`);
const 削除ボタン = (page: import("@playwright/test").Page) => page.locator('a.btn-ec-delete[data-bs-target="#DeleteModal"]');

caseTest("IT-M14-10-001", async ({ page, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  await step(1, async () => { await page.goto(adminUrl("/format/new")); await page.waitForLoadState("load"); });
  let 日数 = "", 統率算入 = true;
  await step(2, async () => { 日数 = await f(page, "MetaRange").inputValue(); 統率算入 = await f(page, "commanderInMain").isChecked(); });
  await expected(async () => {
    expect.soft(日数, "メタゲーム分析日数の初期表示").toBe("14");
    expect.soft(統率算入, "統率のカードをメインボード枚数に含むが選択されている").toBe(false);
  });
});

caseTest("IT-M14-10-004", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  await step(1, async () => { await page.goto(adminUrl(`/format/${notes.get("〔フォーマットID-M1410-共有A〕")}/edit`)); await page.waitForLoadState("load"); });
  const v: Record<string, string> = {};
  await step(2, async () => {
    for (const n of ["nameJp", "nameEn", "code", "rank", "mainMaxCardCount", "mainMinCardCount", "sideMaxCardCount", "sideMinCardCount", "MetaRange", "RuleJp", "RuleEn"]) v[n] = await f(page, n).inputValue();
  });
  await expected(async () => {
    expect.soft(v["nameJp"], "フォーマット名(日)").toBe("編集前フォーマット");
    expect.soft(v["nameEn"], "フォーマット名(英)").toBe("Before Format");
    expect.soft(v["code"], "フォーマットコード").toBe("BEFORE_1");
    expect.soft(v["rank"], "並び順").toBe("50");
    expect.soft([v["mainMaxCardCount"], v["mainMinCardCount"], v["sideMaxCardCount"], v["sideMinCardCount"]], "メイン上限・メイン下限・サイド上限・サイド下限").toEqual(["60", "40", "15", "0"]);
    expect.soft(v["MetaRange"], "メタゲーム分析日数").toBe("14");
    expect.soft([v["RuleJp"], v["RuleEn"]], "ルール説明(日)・(英)").toEqual(["編集前ルール", "Before rule"]);
  });
});

caseTest("IT-M14-10-005", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  let 新規 = -1, 編集 = -1;
  await step(1, async () => { await page.goto(adminUrl("/format/new")); await page.waitForLoadState("load"); 新規 = await 削除ボタン(page).count(); });
  await step(2, async () => { await page.goto(adminUrl(`/format/${notes.get("〔フォーマットID-M1410-共有A〕")}/edit`)); await page.waitForLoadState("load"); 編集 = await 削除ボタン(page).count(); });
  await expected(async () => {
    expect.soft(新規, "新規登録状態の削除ボタンの数").toBe(0);
    expect.soft(編集, "登録済みフォーマットの削除ボタンの数").toBeGreaterThan(0);
  });
});

caseTest("IT-M14-10-040", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  await step(1, async () => { await page.goto(adminUrl(`/format/${notes.get("〔フォーマットID-M1410-共有A〕")}/edit`)); await page.waitForLoadState("load"); });
  await step(2, async () => {
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator("a.c-baseLink").filter({ hasText: "フォーマット" }).first().click()]);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "表示された画面のアドレス（フォーマット一覧）").toMatch(/\/format(\/\d+)?$/);
    expect.soft(await page.locator('a.btn[href$="/format/new"]').count(), "フォーマット一覧の「新規登録」").toBeGreaterThan(0);
  });
});
