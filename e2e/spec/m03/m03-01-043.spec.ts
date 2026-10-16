/** IT-M03-01-043: 未登録の表示件数を選ぶ。 */
import { expect } from "@playwright/test";
import { caseTest } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { ProductPageCountPage } from "../../pages/admin/m03_01_page_count";
import { ProductSearchPage } from "../../pages/admin/product_search";
import { M0301_ADMIN } from "../../seeds/m03-01";
import "../../seeds/m03-01-page-config";
import "../../seeds/m03-01-paging";

caseTest("IT-M03-01-043", async ({ page, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  const pageCount = new ProductPageCountPage(page);
  await step(1, async () => {
    await search.open();
    await search.expectNoRetainedSearchConditions();
    await expect(page, "新規セッションにページ番号・表示件数のURL指定がない").toHaveURL(adminUrl("/product"));
  });
  await step(2, () => search.submitAndWaitForResult());
  await step(3, () => pageCount.selectInjectedCount777());
  await expected(async () => {
    expect(await pageCount.selectedCountAfterInvalidSelection(), "777件は保持されず既定の10件で表示される")
      .toEqual({ label: "10件", pageCount: "10" });
  });
});
