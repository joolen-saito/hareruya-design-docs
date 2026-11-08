/** M05-11 受注情報編集（商品画像の拡大）。正本: cases/M05-11_test_cases.tsv */
import { Browser, Page } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { test } from "@playwright/test";
import { 画像つきの販売中の商品 } from "../../db/m05_11_img";
import { OrderEditPage, 明細行 } from "../../pages/admin/m05_11_order_edit";
import "../../seeds/m05-11-m";
import { M0511_ADMIN_A, 店舗Aの店名 } from "../../seeds/m05-11";

const 注記 = () => test.info().annotations.push({ type: "手順の注記", description: "商品画像は画面から登録できないため、画像が登録済みの既存の販売中の商品で代えた（正本の外の補い）" });
const key = (n: string) => `〔受注番号-M0511-${n}〕`;
async function 開く(browser: Browser, page: Page, no: string): Promise<void> {
  await new OrderEditPage(page).openByOrderNo(no, await 店舗Aの店名(browser));
}

caseTest("IT-M05-11-106", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  注記();
  const code = 画像つきの販売中の商品().商品コード;
  await step(1, async () => { await 開く(browser, page, notes.get(key("106"))); });
  await step(2, async () => { await 明細行(page, code).locator("img.expand").first().click({ timeout: 20_000 }); });
  await expected(async () => { await expect.soft(page.locator("#ExpandedImage"), "拡大された商品画像").toBeVisible(); });
});

caseTest("IT-M05-11-107", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  注記();
  const code = 画像つきの販売中の商品().商品コード;
  await step(1, async () => { await 開く(browser, page, notes.get(key("107"))); });
  await step(2, async () => { await 明細行(page, code).locator("img.expand").first().click({ timeout: 20_000 }); });
  await step(3, async () => { await page.locator("#ExpandedImage").click({ timeout: 20_000 }); });
  await expected(async () => { await expect.soft(page.locator("#ExpandedImage"), "拡大された画像").toBeHidden(); });
});
