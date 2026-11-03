/** M14-10 フォーマット詳細(登録・編集・削除)の続き（統率の設定）。正本: cases/M14-10_test_cases.tsv */
import { Page } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { M1410_ADMIN } from "../../seeds/m14-10";

const f = (page: Page, n: string) => page.locator(`[name="admin_format[${n}]"]`);
const 開く = async (page: Page, id: string) => { await page.goto(adminUrl(`/format/${id}/edit`)); await page.waitForLoadState("load"); };

caseTest("IT-M14-10-002", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  const id = notes.get("〔フォーマットID-M1410-共有A〕");
  await step(1, async () => { await 開く(page, id); });
  await step(2, async () => { await f(page, "useCommandFlg").setChecked(false); });
  const 操作できた = { 算入: true, 上限: true, 下限: true };
  await step(3, async () => {
    const dis = async (n: string) => f(page, n).isDisabled();
    操作できた.算入 = !(await dis("commanderInMain"));
    操作できた.上限 = !(await dis("commandMaxCardCount"));
    操作できた.下限 = !(await dis("commandMinCardCount"));
    await f(page, "commandMaxCardCount").fill("3", { timeout: 3_000 }).catch(() => { 操作できた.上限 = false; });
    await f(page, "commandMinCardCount").fill("1", { timeout: 3_000 }).catch(() => { 操作できた.下限 = false; });
    await f(page, "commanderInMain").check({ timeout: 3_000 }).catch(() => { 操作できた.算入 = false; });
  });
  await expected(async () => {
    expect.soft(操作できた.算入, "統率のカードをメインボード枚数に含むを選択できた").toBe(false);
    expect.soft(操作できた.上限, "統率上限枚数を入力できた").toBe(false);
    expect.soft(操作できた.下限, "統率下限枚数を入力できた").toBe(false);
  });
});

caseTest("IT-M14-10-003", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  await step(1, async () => { await 開く(page, notes.get("〔フォーマットID-M1410-共有B〕")); });
  let 上限 = "", 下限 = "";
  await step(2, async () => { 上限 = await f(page, "commandMaxCardCount").inputValue(); 下限 = await f(page, "commandMinCardCount").inputValue(); });
  await expected(async () => {
    expect.soft(上限, "統率上限枚数の初期表示").toBe("2");
    expect.soft(下限, "統率下限枚数の初期表示").toBe("1");
  });
});

caseTest("IT-M14-10-042", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M1410_ADMIN);
  const id = notes.get("〔フォーマットID-M1410-042〕");
  await step(1, async () => { await 開く(page, id); });
  await step(2, async () => {
    await f(page, "useCommandFlg").setChecked(false);
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.locator('button[type="submit"]').filter({ hasText: /^\s*(更新|登録)\s*$/ }).first().click()]);
  });
  await step(3, async () => { await 開く(page, id); });
  await expected(async () => {
    expect.soft(await f(page, "commanderInMain").isChecked(), "統率のカードをメインボード枚数に含むが選択されている").toBe(false);
    expect.soft(await f(page, "commandMaxCardCount").inputValue(), "統率上限枚数の表示").toBe("");
    expect.soft(await f(page, "commandMinCardCount").inputValue(), "統率下限枚数の表示").toBe("");
  });
});
