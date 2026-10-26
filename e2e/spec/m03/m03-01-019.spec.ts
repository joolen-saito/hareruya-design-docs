/** IT-M03-01-019: 高額商品に関する相反する2条件を同時に指定する。 */
import { expect, caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { ProductSearchPage } from "../../pages/admin/product_search";
import { M0301_ADMIN } from "../../seeds/m03-01";
import "../../seeds/m03-01-019";

caseTest("IT-M03-01-019", async ({ page, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  await step(1, async () => {
    await search.open();
    await search.expectNoRetainedSearchConditions();
  });
  await step(2, async () => {
    await search.ensureDetailVisible();
    await search.setChecked("expensive", "1", true);
    await search.setChecked("expensive", "2", true);
    expect(await search.checkedChoices("expensive"), "画面の2つの高額商品条件を同時に指定").toEqual([
      { value: "1", label: "高額商品のみ表示" },
      { value: "2", label: "高額商品を除外する" },
    ]);
  });
  await step(3, async () => {
    await search.form.locator(".admin-product-search-submit").click();
  });
  await expected(async () => {
    await expect.soft(page.getByText("検索結果：0件が該当しました", { exact: true }), "検索結果は0件").toBeVisible();
    await expect.soft(page.getByText("検索条件に合致するデータが見つかりませんでした", { exact: true }), "該当商品なし").toBeVisible();
    await expect.soft(page.locator('tr[id^="ex-product-"]'), "商品一覧に結果行が無い").toHaveCount(0);
    await expect.soft(page.locator("#form_bulk"), "商品一覧自体が表示されない").toHaveCount(0);
  });
});
