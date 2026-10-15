/** M03-01-023/030/033: 部門未設定の検索、一覧の操作部、商品名リンクの遷移。 */
import { expect } from "@playwright/test";
import { caseTest } from "../../lib/case";
import { adminUrl, loginAdmin } from "../../lib/session";
import { ProductSearchPage } from "../../pages/admin/product_search";
import { M0301_ADMIN } from "../../seeds/m03-01";
import "../../seeds/m03-01-023";
import "../../seeds/m03-01-030-033";

caseTest("IT-M03-01-023", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  await step(1, async () => {
    await search.open();
    await search.expectNoRetainedSearchConditions();
  });
  await step(2, async () => {
    await search.field("product_name").fill("部門商品-023");
  });
  await step(3, async () => {
    await search.ensureDetailVisible();
    const unset = search.field("section").locator("option").filter({ hasText: /^未設定$/ });
    const sectionA = search.field("section").locator("option").filter({ hasText: /^M03部門A$/ });
    await expect(unset, "部門の未設定候補を選べる").toHaveCount(1);
    await expect(sectionA, "共有部門を選べる").toHaveCount(1);
    await expect(unset, "未設定候補は選択可能").toBeEnabled();
    await expect(sectionA, "共有部門は選択可能").toBeEnabled();
    await expect(sectionA, "共有部門の採番 ID と候補が一致").toHaveAttribute("value", notes.get("〔部門ID-M0301-共有〕"));
    const unsetValue = await unset.getAttribute("value");
    if (!unsetValue) throw new Error("部門『未設定』の値を画面から読めない");
    await search.chooseSelect2("section", "未設定");
    expect(await search.selectedValues("section"), "部門は未設定だけを選択").toEqual([unsetValue]);
  });
  await step(4, async () => {
    await search.form.locator(".admin-product-search-submit").click();
  });
  await expected(async () => {
    const idA = notes.get("〔商品ID-M0301-023A〕");
    const idB = notes.get("〔商品ID-M0301-023B〕");
    const rows = page.locator('tr[id^="ex-product-"]');
    await expect.soft(rows, "部門未設定の商品のみ1件").toHaveCount(1);
    await expect.soft(page.locator(`#ex-product-${idA}`), "部門未設定の商品 A は表示").toBeVisible();
    await expect.soft(page.locator(`#ex-product-${idB}`), "共有部門の商品 B は表示されない").toHaveCount(0);
    if (await rows.count() === 1) {
      await expect.soft(rows.first().locator("td:nth-child(2)"), "商品 A の採番 ID").toHaveText(idA);
      await expect.soft(rows.first().locator("td:nth-child(3) a"), "商品 A の名前").toHaveText("部門商品-023");
      await expect.soft(rows.first().locator("td:nth-child(4)"), "商品 A のコード").toHaveText("M0301S-023A");
    }
  });
});

caseTest("IT-M03-01-030", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  await step(1, async () => {
    await search.open();
    await search.expectNoRetainedSearchConditions();
  });
  await step(2, async () => {
    await search.field("product_name").fill("一覧表示商品-030");
  });
  await step(3, async () => {
    await search.form.locator(".admin-product-search-submit").click();
  });
  await step(4, async () => {
    await expect(page.locator("#form_bulk"), "商品マスターの検索結果操作部").toBeVisible();
  });
  await expected(async () => {
    const id = notes.get("〔商品ID-M0301-030〕");
    const rows = page.locator('tr[id^="ex-product-"]');
    await expect.soft(rows, "同名の商品は1件").toHaveCount(1);
    await expect.soft(page.locator(`#ex-product-${id}`), "対象の商品行が表示").toBeVisible();
    for (const name of ["在庫変更CSV出力", "在庫一括編集", "価格一括編集", "買取価格一括編集"]) {
      await expect.soft(page.locator("#form_bulk").getByText(name, { exact: true }), `${name} は操作部に表示されない`).toHaveCount(0);
    }
  });
});

caseTest("IT-M03-01-033", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  await step(1, async () => {
    await search.open();
    await search.expectNoRetainedSearchConditions();
  });
  await step(2, async () => {
    await search.field("product_name").fill("一覧表示商品-033");
  });
  await step(3, async () => {
    await search.form.locator(".admin-product-search-submit").click();
  });
  await step(4, async () => {
    const id = notes.get("〔商品ID-M0301-033〕");
    const rows = page.locator('tr[id^="ex-product-"]');
    await expect(rows, "商品名リンクを押す対象は1件").toHaveCount(1);
    const row = page.locator(`#ex-product-${id}`);
    await expect(row, "採番 ID に対応する行").toBeVisible();
    const nameLink = row.locator("td:nth-child(3) a");
    await expect(nameLink, "一覧表示商品-033 の商品名リンク").toHaveText("一覧表示商品-033");
    await nameLink.click();
  });
  await expected(async () => {
    const id = notes.get("〔商品ID-M0301-033〕");
    await expect.soft(page, "商品詳細・編集画面の URL").toHaveURL(adminUrl(`/product/product/${id}/edit`));
    await expect.soft(page.locator("#form1"), "商品詳細・編集の入力画面").toBeVisible();
    await expect.soft(page.locator('#form1 input[name$="[name]"]'), "選んだ商品の日本語名").toHaveValue("一覧表示商品-033");
  });
});
