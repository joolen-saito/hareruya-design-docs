/** IT-M03-01-034: 商品検索結果の履歴メニューを1回目で表示し、2回目で閉じる。 */
import { expect } from "@playwright/test";
import { caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { ProductSearchPage } from "../../pages/admin/product_search";
import { M0301_ADMIN } from "../../seeds/m03-01";
import "../../seeds/m03-01-034";

caseTest("IT-M03-01-034", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  const id = notes.get("〔商品ID-M0301-034〕");
  const row = page.locator(`#ex-product-${id}`);
  const history = row.locator(".history_dropdown");
  const toggle = history.locator(`#dropdown_${id}`);
  const menu = history.locator("ul.dropdown-menu");
  const names = ["変動履歴", "NM変動履歴", "価格履歴", "NM価格履歴"];

  await step(1, async () => {
    await search.open();
    await search.expectNoRetainedSearchConditions();
  });
  await step(2, async () => {
    await search.field("product_name").fill("一覧表示商品-034");
  });
  await step(3, async () => {
    await search.form.locator(".admin-product-search-submit").click();
    await expect(page.locator('tr[id^="ex-product-"]'), "履歴メニュー確認用の商品は1件").toHaveCount(1);
    await expect(row.locator("td:nth-child(2)"), "控えた採番商品IDの行").toHaveText(id);
    await expect(row.locator("td:nth-child(3) a"), "履歴メニュー確認用の商品名").toHaveText("一覧表示商品-034");
    await expect(row.locator("td:nth-child(4)"), "履歴メニュー確認用の商品コード").toHaveText("LST3402-034");
  });
  await step(4, async () => {
    await expect(menu, "押下前の履歴メニューは非表示").toBeHidden();
    await toggle.click();
  });
  await step(5, async () => {
    await expect(menu, "1回目の押下で履歴メニューが表示").toBeVisible();
    for (const name of names) {
      await expect(menu.getByRole("link", { name, exact: true }), `${name} が表示`).toBeVisible();
    }
  });
  await step(6, async () => {
    await toggle.click();
  });
  await expected(async () => {
    await expect.soft(menu, "2回目の押下で履歴メニューが非表示").toBeHidden();
    for (const name of names) {
      await expect.soft(menu.getByRole("link", { name, exact: true }), `${name} の項目が非表示`).toBeHidden();
    }
  });
});
