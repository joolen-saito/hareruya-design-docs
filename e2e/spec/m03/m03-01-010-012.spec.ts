/** M03-01: 商品名の空白区切りAND・商品コードのカンマ区切りAND。 */
import { expect } from "@playwright/test";
import { caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { ProductSearchPage } from "../../pages/admin/product_search";
import { M0301_ADMIN } from "../../seeds/m03-01";
import "../../seeds/m03-01-010-012";

caseTest("IT-M03-01-010", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  await step(1, async () => {
    await search.open();
    await search.expectNoRetainedSearchConditions();
  });
  await step(2, async () => {
    await search.field("product_name").fill("青空 商品");
  });
  await step(3, async () => {
    await search.form.locator(".admin-product-search-submit").click();
  });
  await expected(async () => {
    const wantedId = notes.get("〔商品ID-M0301-010A〕");
    const excludedId = notes.get("〔商品ID-M0301-010B〕");
    const rows = page.locator('tr[id^="ex-product-"]');
    await expect.soft(rows, "両語を含む商品だけの1件").toHaveCount(1);
    await expect.soft(page.locator(`#ex-product-${wantedId}`), "青空と商品の両方を含む商品").toBeVisible();
    await expect.soft(page.locator(`#ex-product-${excludedId}`), "青空だけを含む商品は除外").toHaveCount(0);
    if (await rows.count() === 1) {
      await expect.soft(rows.first().locator("td:nth-child(2)"), "結果行の商品ID").toHaveText(wantedId);
      await expect.soft(rows.first().locator("td:nth-child(3) a"), "結果行の商品名").toHaveText("青空テスト商品-010");
    }
  });
});

caseTest("IT-M03-01-012", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  await step(1, async () => {
    await search.open();
    await search.expectNoRetainedSearchConditions();
  });
  await step(2, async () => {
    await search.ensureDetailVisible();
    await search.field("product_code").fill("M03ALPHA,BETA");
  });
  await step(3, async () => {
    await search.form.locator(".admin-product-search-submit").click();
  });
  await expected(async () => {
    const wantedId = notes.get("〔商品ID-M0301-012A〕");
    const excludedId = notes.get("〔商品ID-M0301-012B〕");
    const rows = page.locator('tr[id^="ex-product-"]');
    await expect.soft(rows, "両語を含むコードだけの1件").toHaveCount(1);
    await expect.soft(page.locator(`#ex-product-${wantedId}`), "M03ALPHAとBETAの両方を含むコード").toBeVisible();
    await expect.soft(page.locator(`#ex-product-${excludedId}`), "M03ALPHAだけを含むコードは除外").toHaveCount(0);
    if (await rows.count() === 1) {
      await expect.soft(rows.first().locator("td:nth-child(2)"), "結果行の商品ID").toHaveText(wantedId);
      await expect.soft(rows.first().locator("td:nth-child(4)"), "結果行の商品コード").toHaveText("M03ALPHABETA-012");
    }
  });
});
