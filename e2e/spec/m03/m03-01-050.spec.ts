/** M03-01-050: 商品マスター(検索結果)の商品名リンクから、押した行の商品詳細/編集へ遷移する。 */
import { expect, caseTest } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { displayedProductId } from "../../pages/admin/product_edit";
import { ProductSearchPage } from "../../pages/admin/product_search";
import { M0301L_ADMIN } from "../../seeds/m03-01-050";

caseTest("IT-M03-01-050", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301L_ADMIN);
  const search = new ProductSearchPage(page);
  const idA = notes.get("〔商品ID-M0301-050A〕");
  const idB = notes.get("〔商品ID-M0301-050B〕");
  let shownId = "";
  await step(1, async () => {
    await search.open();
  });
  await step(2, async () => {
    await search.field("product_name").fill("連携遷移商品-001");
  });
  await step(3, async () => {
    await search.form.locator(".admin-product-search-submit").click();
    await expect(page.locator(`#ex-product-${idA}`), "商品Aの結果行").toBeVisible();
    await expect(page.locator(`#ex-product-${idB}`), "商品Bの結果行").toBeVisible();
  });
  await step(4, async () => {
    // リンクの中身は商品名の前後に空白・改行を含むので、空白を詰めたリンク名で特定する
    const link = page.locator('tr[id^="ex-product-"] td:nth-child(3)').getByRole("link", { name: "連携遷移商品-001A", exact: true });
    await expect(link, "商品名が「連携遷移商品-001A」の行の商品名リンク").toHaveCount(1);
    await link.click();
    await page.waitForLoadState("domcontentloaded");
  });
  await step(5, async () => {
    shownId = await displayedProductId(page);
  });
  await expected(async () => {
    await expect.soft(page, "押した行の商品詳細/編集画面").toHaveURL(adminUrl(`/product/product/${idA}/edit`));
    expect.soft(shownId, "商品IDの表示は押した行の商品ID").toBe(idA);
  });
});
