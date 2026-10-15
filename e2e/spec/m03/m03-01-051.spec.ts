/** IT-M03-01-051: 日本語名には無い英語名の検索語で、甲の商品だけを得る。 */
import { expect } from "@playwright/test";
import { caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { ProductSearchPage } from "../../pages/admin/product_search";
import { M0301_ADMIN } from "../../seeds/m03-01";
import "../../seeds/m03-01-051";

caseTest("IT-M03-01-051", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  await step(1, async () => {
    await search.open();
    await search.expectNoRetainedSearchConditions();
  });
  await step(2, async () => {
    await search.field("product_name").fill("M0301-051-AzureWing");
  });
  await step(3, async () => {
    await search.form.locator(".admin-product-search-submit").click();
  });
  await expected(async () => {
    const wantedId = notes.get("〔商品ID-M0301-051A〕");
    const excludedId = notes.get("〔商品ID-M0301-051B〕");
    const rows = page.locator('tr[id^="ex-product-"]');
    await expect.soft(page.locator(".c-outsideBlock__contents.mb-5.text-center span.fw-bold"), "画面に表示された該当件数").toHaveText("検索結果：1件が該当しました");
    await expect.soft(rows, "英語名が一致する商品だけで該当件数1件").toHaveCount(1);
    await expect.soft(page.locator(`#ex-product-${wantedId}`), "英語名が一致する甲の商品").toBeVisible();
    await expect.soft(page.locator(`#ex-product-${excludedId}`), "英語名が異なる乙の商品は表示されない").toHaveCount(0);
    if (await rows.count() === 1) {
      await expect.soft(rows.first().locator("td:nth-child(2)"), "検索結果の採番商品ID").toHaveText(wantedId);
      await expect.soft(rows.first().locator("td:nth-child(3) a"), "検索結果の日本語名").toHaveText("英名照合甲-051");
      await expect.soft(rows.first().locator("td:nth-child(4)"), "検索結果の商品コード").toHaveText("M0301S-051A");
    }
  });
});
