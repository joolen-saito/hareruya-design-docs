/** M15-07 デッキタグ一覧（メニュー）。ケースの正本: integration_test/casegen/cases/M15-07_test_cases.tsv */
import { Page } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { M1507_ADMIN } from "../../seeds/m15-07";

async function login(page: Page): Promise<void> {
  page.setDefaultTimeout(60_000);
  page.setDefaultNavigationTimeout(90_000);
  await loginAdmin(page, M1507_ADMIN);
}

caseTest("IT-M15-07-001", async ({ page, step, expected }) => {
  await login(page);
  await step(1, async () => {
    await page.goto(adminUrl("/"));
    await page.waitForLoadState("load");
    await page.locator("#nav-deck_management, a.c-mainNavArea__navItemTitle:has-text('デッキ管理')").first().click().catch(() => null);
    const リンク = page.getByRole("link", { name: "デッキタグ一覧", exact: true }).first();
    await expect(リンク, "メニューの「デッキタグ一覧」").toBeVisible();
    await Promise.all([page.waitForNavigation({ waitUntil: "load" }), リンク.click()]);
  });
  await expected(async () => {
    expect.soft(new URL(page.url()).pathname, "表示された画面のアドレス（MTGマスターデータ管理）").toMatch(/\/data\/mtg_master_data$/);
    await expect.soft(page.locator('select[name="entity"]'), "マスターの種類の選択欄").toBeVisible();
    expect.soft((await page.locator('select[name="entity"] option:checked').innerText()).trim(), "選択されているマスターの種類").toBe("デッキタグ");
  });
});
