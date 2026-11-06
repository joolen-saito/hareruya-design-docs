/**
 * M15-08 アーキタイプ検索・一覧。ケースの正本: integration_test/casegen/cases/M15-08_test_cases.tsv
 * 実装しないケース（理由は記録 e2e/review/M15-08_progress_*.md）: DB での準備が要るシード（アーキタイプ・デッキの大量・削除済みなど）を使うもの。ここは 003 027 030 032 033。
 */
import { Page } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { M1508_ADMIN } from "../../seeds/m15-08";

async function login(page: Page): Promise<void> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(90_000);
  await loginAdmin(page, M1508_ADMIN);
}
const 入力欄 = (page: Page) => page.locator('[name="admin_search_archetype[multi]"]');
const 検索する = (page: Page) => page.locator("#admin_search_archetype button[type=submit]");
const 結果表 = (page: Page) => page.locator(".archetype-result-table");

async function 検索入力を開く(page: Page): Promise<void> {
  await page.goto(adminUrl("/archetype"));
  await page.waitForLoadState("load");
  await expect(検索する(page), "アーキタイプ管理(検索入力)画面").toBeVisible();
}

caseTest("IT-M15-08-003", async ({ page, step, expected }) => {
  await login(page);
  await step(1, async () => { await page.goto(adminUrl("/archetype/search/1")); await page.waitForLoadState("load"); });
  await step(2, async () => { await expect(検索する(page), "検索の操作").toBeVisible(); });
  await expected(async () => {
    expect.soft(await 入力欄(page).inputValue(), "アーキタイプ名の検索条件（空）").toBe("");
    expect.soft(await 結果表(page).count(), "アーキタイプ一覧の表の数").toBe(0);
    expect.soft(await page.locator(".pagination").count(), "ページ送りの数").toBe(0);
  });
});

caseTest("IT-M15-08-027", async ({ page, step, expected }) => {
  await login(page);
  await step(1, async () => { await 検索入力を開く(page); });
  await step(2, async () => { await 入力欄(page).fill("並べ替え"); });
  await step(3, async () => {
    await page.locator('[name="admin_search_archetype[sortOrder]"]').evaluate((e) => { (e as HTMLInputElement).value = "SIDEWAYS"; });
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), 検索する(page).click()]);
  });
  await expected(async () => {
    expect.soft(await page.locator(".alert-danger, .invalid-feedback, .form-error-message").count(), "並び順のエラー表示の数").toBeGreaterThan(0);
    expect.soft(await 入力欄(page).inputValue(), "アーキタイプ名の検索条件（空）").toBe("");
    expect.soft(await 結果表(page).count(), "アーキタイプ一覧の表の数").toBe(0);
  });
});

caseTest("IT-M15-08-030", async ({ page, step, expected }) => {
  await login(page);
  await step(1, async () => { await 検索入力を開く(page); });
  await step(2, async () => {
    await 入力欄(page).fill("不存在キーワード");
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), 検索する(page).click()]);
    await expect(page.getByText(/検索結果：\d+件が該当しました|検索条件に合致するデータが見つかりませんでした|該当/).first(), "検索結果の表示").toBeVisible();
  });
  await expected(async () => {
    expect.soft(await page.getByText("検索条件に合致するデータが見つかりませんでした").count(), "該当がない旨の表示の数").toBeGreaterThan(0);
    expect.soft(await 結果表(page).count(), "アーキタイプ一覧の表の数").toBe(0);
    expect.soft(await page.locator(".pagination").count(), "ページ送りの数").toBe(0);
  });
});

caseTest("IT-M15-08-032", async ({ page, step, expected }) => {
  await login(page);
  await step(1, async () => { await 検索入力を開く(page); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.getByRole("link", { name: "新規登録" }).first().click()]); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "表示された画面のアドレス").toMatch(/\/archetype\/new$/);
    await expect.soft(page.locator('[name="admin_archetype[nameJp]"]'), "アーキタイプ名(日)の入力欄").toBeVisible();
    await expect.soft(page.locator('button[type="submit"][form="admin_archetype"]').first(), "登録ボタン").toBeVisible();
  });
});

caseTest("IT-M15-08-033", async ({ page, step, expected }) => {
  await login(page);
  await step(1, async () => { await 検索入力を開く(page); });
  await step(2, async () => { await Promise.all([page.waitForNavigation({ waitUntil: "load" }), page.getByRole("link", { name: "CSV取り込み" }).click()]); });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "表示された画面のアドレス").toMatch(/\/archetype\/csv_import$/);
    await expect.soft(page.getByText("アーキタイプ登録CSVアップロード").first(), "画面の見出し").toBeVisible();
  });
});
