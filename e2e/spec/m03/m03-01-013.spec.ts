/** IT-M03-01-013: 商品IDの完全一致検索。 */
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { ProductSearchPage } from "../../pages/admin/product_search";
import { M0301_ADMIN } from "../../seeds/m03-01";
import "../../seeds/m03-01-013";

caseTest("IT-M03-01-013", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  await step(1, async () => {
    await search.open();
    await search.expectNoRetainedSearchConditions();
  });
  await step(2, async () => {
    await search.ensureDetailVisible();
    await search.field("product_id").fill(notes.get("〔商品ID-M0301-013〕"));
  });
  await step(3, async () => {
    await search.form.locator(".admin-product-search-submit").click();
  });
  await expected(async () => {
    const id = notes.get("〔商品ID-M0301-013〕");
    const rows = page.locator('tr[id^="ex-product-"]');
    await expect.soft(rows, "ID完全一致の検索結果は1件だけ").toHaveCount(1);
    await expect.soft(page.locator(`#ex-product-${id}`), "採番IDの商品だけ表示").toBeVisible();
    if (await rows.count() === 1) {
      await expect.soft(rows.first().locator("td:nth-child(2)"), "結果行のID").toHaveText(id);
    }
  });
});
