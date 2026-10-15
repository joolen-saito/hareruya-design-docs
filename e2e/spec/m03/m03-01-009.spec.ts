/** M03-01-009: 商品名・カテゴリ・状態の3条件 AND 検索。 */
import { expect } from "@playwright/test";
import { caseTest } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { ProductSearchPage } from "../../pages/admin/product_search";
import { M0301_ADMIN } from "../../seeds/m03-01";
import "../../seeds/m03-01-009";

caseTest("IT-M03-01-009", async ({ page, notes, step, expected }) => {
  await loginAdmin(page, M0301_ADMIN);
  const search = new ProductSearchPage(page);
  await step(1, async () => {
    await search.open();
    await search.expectNoRetainedSearchConditions();
  });
  await step(2, async () => {
    await search.field("product_name").fill("AND対象商品-009");
    await search.ensureDetailVisible();
    await search.chooseSelect2("category_id", "M03カテゴリA");
    expect(await search.selectedValues("category_id"), "指定したカテゴリは共有Aの採番ID").toEqual([
      notes.get("〔カテゴリID-M0301-共有A〕"),
    ]);
    const conditions = await search.choiceOptions("card_condition");
    const nm = conditions.filter((option) => option.label === "NM");
    if (nm.length !== 1) throw new Error(`状態 NM の画面選択肢が一意でない: ${JSON.stringify(conditions)}`);
    for (const condition of conditions) {
      if (condition.checked && condition.value !== nm[0].value)
        await search.setChecked("card_condition", condition.value, false);
    }
    await search.setChecked("card_condition", nm[0].value, true);
    expect(await search.checkedValues("card_condition"), "状態は NM だけを指定").toEqual([nm[0].value]);
  });
  await step(3, async () => {
    await search.form.locator(".admin-product-search-submit").click();
  });
  await expected(async () => {
    const a = notes.get("〔商品ID-M0301-009A〕");
    const b = notes.get("〔商品ID-M0301-009B〕");
    const c = notes.get("〔商品ID-M0301-009C〕");
    const rows = page.locator('tr[id^="ex-product-"]');
    await expect.soft(rows, "3条件すべてを満たす商品だけが1件").toHaveCount(1);
    await expect.soft(page.locator(`#ex-product-${a}`), "カテゴリA・NMの商品Aは表示").toBeVisible();
    await expect.soft(page.locator(`#ex-product-${b}`), "カテゴリB・NMの商品Bは除外").toHaveCount(0);
    await expect.soft(page.locator(`#ex-product-${c}`), "カテゴリA・SPの商品Cは除外").toHaveCount(0);
    if (await rows.count() === 1) {
      await expect.soft(rows.first().locator("td:nth-child(2)"), "結果の商品ID").toHaveText(a);
      await expect.soft(rows.first().locator("td:nth-child(3) a"), "結果の商品名").toHaveText("AND対象商品-009");
      await expect.soft(rows.first().locator("td:nth-child(4)"), "結果の商品コード").toHaveText("M0301S-009A");
      await expect.soft(rows.first().locator("td:nth-child(6)"), "結果の規格状態").toHaveText("NM");
    }
  });
});
