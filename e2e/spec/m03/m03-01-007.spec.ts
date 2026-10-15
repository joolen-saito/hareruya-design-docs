/** IT-M03-01-007: 初期条件で廃止商品と高額商品を除外する。 */
import { expect } from "@playwright/test";
import { caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { ProductSearchPage } from "../../pages/admin/product_search";
import { M0301_ADMIN } from "../../seeds/m03-01";
import "../../seeds/m03-01-007";

caseTest("IT-M03-01-007", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  await step(1, async () => {
    await search.open();
    await search.expectNoRetainedSearchConditions();
  });
  await step(2, async () => {
    await search.field("product_name").fill("公開状態商品-007");
  });
  await step(3, async () => {
    await search.form.locator(".admin-product-search-submit").click();
  });
  await expected(async () => {
    const publishedId = notes.get("〔商品ID-M0301-007A〕");
    const abolishedId = notes.get("〔商品ID-M0301-007B〕");
    const highPriceId = notes.get("〔商品ID-M0301-007C〕");
    const rows = page.locator('tr[id^="ex-product-"]');
    await expect.soft(rows, "公開状態の通常商品だけが1件表示される").toHaveCount(1);
    await expect.soft(page.locator(`#ex-product-${publishedId}`), "公開状態の通常商品").toBeVisible();
    await expect.soft(page.locator(`#ex-product-${abolishedId}`), "廃止商品は表示されない").toHaveCount(0);
    await expect.soft(page.locator(`#ex-product-${highPriceId}`), "高額商品は表示されない").toHaveCount(0);
    if (await rows.count() === 1) {
      await expect.soft(rows.first().locator("td:nth-child(2)"), "結果行の商品ID").toHaveText(publishedId);
      await expect.soft(rows.first().locator("td:nth-child(3) a"), "結果行の商品名").toHaveText("公開状態商品-007");
    }
  });
});
