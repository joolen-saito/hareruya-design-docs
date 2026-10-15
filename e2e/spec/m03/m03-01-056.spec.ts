/** IT-M03-01-056: 商品検索結果の表示件数9選択肢。 */
import { expect } from "@playwright/test";
import { caseTest } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { PageCountOption, ProductPageCountPage } from "../../pages/admin/m03_01_page_count";
import { ProductSearchPage } from "../../pages/admin/product_search";
import { M0301_ADMIN } from "../../seeds/m03-01";
import "../../seeds/m03-01-056";

caseTest("IT-M03-01-056", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  const pageCount = new ProductPageCountPage(page);
  const id = notes.get("〔商品ID-M0301-056〕");
  let options: PageCountOption[] = [];

  await step(1, async () => {
    await search.open();
    await search.expectNoRetainedSearchConditions();
    await search.expectNoRetainedPageState();
  });
  await step(2, async () => {
    await search.field("product_name").fill("件数選択肢商品-056");
  });
  await step(3, async () => {
    await search.form.locator(".admin-product-search-submit").click();
    const rows = page.locator('tr[id^="ex-product-"]');
    await expect(rows, "件数選択肢商品-056 の検索結果は1件").toHaveCount(1);
    const row = page.locator(`#ex-product-${id}`);
    await expect(row.locator("td:nth-child(2)"), "採番IDの結果行").toHaveText(id);
    await expect(row.locator("td:nth-child(3) a"), "採番IDの商品名").toHaveText("件数選択肢商品-056");
    await expect(row.locator("td:nth-child(4)"), "採番IDの商品コード").toHaveText("M0301S-056");
  });
  await step(4, async () => { options = await pageCount.openAndReadOptions(); });
  await expected(async () => {
    const pathname = new URL(adminUrl("/product/page/1")).pathname;
    const wanted = ["10", "50", "100", "300", "500", "1000", "2000", "10000", "12000"]
      .map((count) => ({
        label: `${count}件`, pathname, query: `page_count=${count}`,
        enabled: true, displayed: true, selected: count === "10",
      }));
    expect(options.sort((a, b) => Number(new URLSearchParams(a.query).get("page_count")) - Number(new URLSearchParams(b.query).get("page_count"))),
      "表示件数は正本の9つだけで、名称・URL値・選択可否・既定10が一致する")
      .toEqual(wanted.sort((a, b) => Number(new URLSearchParams(a.query).get("page_count")) - Number(new URLSearchParams(b.query).get("page_count"))));
  });
});
