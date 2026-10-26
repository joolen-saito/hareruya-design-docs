/** IT-M03-01-031: 正本に商品選択がない状態で一括編集ボタンを押し、遷移期待を確認する。 */
import { expect, caseTest } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { ProductSearchPage } from "../../pages/admin/product_search";
import { M0301_ADMIN } from "../../seeds/m03-01";
import "../../seeds/m03-01-030-033";

caseTest("IT-M03-01-031", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);

  await step(1, async () => {
    await search.open();
    await search.expectNoRetainedSearchConditions();
  });
  await step(2, async () => {
    await search.field("product_name").fill("一覧表示商品-031");
  });
  await step(3, async () => {
    await search.form.locator(".admin-product-search-submit").click();
    const id = notes.get("〔商品ID-M0301-031〕");
    await expect(page.locator('tr[id^="ex-product-"]'), "対象商品は1件").toHaveCount(1);
    await expect(page.locator(`#ex-product-${id} td:nth-child(3) a`), "対象の商品名").toHaveText("一覧表示商品-031");
  });
  await step(4, async () => {
    const form = page.locator("#form_bulk");
    await expect(form.locator('input[name="ids[]"]:checked'), "正本に商品選択手順はない").toHaveCount(0);
    const button = form.locator('button[formaction$="/product/edit_bulk_update_buy_price"]');
    await expect(button, "買取・基準価格一括編集ボタン").toHaveText("買取・基準価格一括編集");
    await button.click();
  });
  await expected(async () => {
    await expect(page, "買取・基準価格一括編集画面へ遷移").toHaveURL(adminUrl("/product/edit_bulk_update_buy_price"));
    await expect(page.locator("#product-class-form"), "買取・基準価格一括編集画面のフォーム").toBeVisible();
  });
});
