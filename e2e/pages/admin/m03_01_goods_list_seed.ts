/** M03-01 のグッズ商品を商品マスター画面で照合し、正本指定時だけ同名商品を片付ける。 */
import { expect, Page } from "@playwright/test";
import { ProductSearchPage } from "./product_search";

/** CSV 取込後に商品コードで1件を特定し、画面が振った商品 ID を返す。 */
export async function readGoodsProductId(page: Page, code: string, name: string): Promise<string> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.ensureDetailVisible();
  await search.field("product_code").fill(code);
  await search.form.locator(".admin-product-search-submit").click();
  const rows = page.locator('tr[id^="ex-product-"]');
  await expect(rows, `${code} の検索結果は1件`).toHaveCount(1);
  const row = rows.first();
  await expect(row.locator("td:nth-child(3) a"), `${code} の商品名`).toHaveText(name);
  await expect(row.locator("td:nth-child(4)"), `${code} の商品コード`).toHaveText(code);
  await expect(row.locator("td:nth-child(5)"), `${code} の言語`).toHaveText("日本語");
  await expect(row.locator("td:nth-child(6)"), `${code} の規格状態`).toHaveText("NM");
  const id = (await row.locator("td:nth-child(2)").innerText()).trim();
  if (!/^\d+$/.test(id)) throw new Error(`${code} の採番商品 ID を画面から読めない: ${id}`);
  await expect(row, `${code} の採番 ID と結果行`).toHaveAttribute("id", `ex-product-${id}`);
  return id;
}

/** 正本が登録前の完全削除を命じたケースだけで使う。検索名に一致する商品以外は消さない。 */
export async function removeProductsMatchingName(page: Page, name: string, includeEnglish = false): Promise<void> {
  const search = new ProductSearchPage(page);
  const removedIds = new Set<string>();
  for (;;) {
    await search.open();
    await search.ensureDetailVisible();
    // 同名0件の確認では、既定の「公開・NM・高額商品除外」による見落としを避ける。
    for (const field of ["status", "card_condition", "expensive"]) {
      for (const option of await search.choiceOptions(field)) {
        if (option.checked) await search.setChecked(field, option.value, false);
      }
      await expect.poll(() => search.checkedValues(field), `${field} の絞り込みを外す`).toEqual([]);
    }
    await search.field("product_name").fill(name);
    await search.form.locator(".admin-product-search-submit").click();
    const rows = page.locator('tr[id^="ex-product-"]');
    const count = await rows.count();
    if (count === 0) {
      await expect(page.locator("#form_bulk"), `${name} の商品が残っていない`).toHaveCount(0);
      return;
    }
    for (const row of await rows.all()) {
      const id = (await row.locator("td:nth-child(2)").innerText()).trim();
      const nameLink = row.locator("td:nth-child(3) a");
      const actualName = (await nameLink.innerText()).trim();
      if (!/^\d+$/.test(id)) throw new Error(`${name} の清掃対象の商品 ID を画面で確認できない: ${id}`);
      if (!actualName.includes(name)) {
        if (!includeEnglish) throw new Error(`${name} の清掃対象を画面で確認できない: ID=${id}, 商品名=${actualName}`);
        const href = await nameLink.getAttribute("href");
        if (!href) throw new Error(`${name} の英語名確認用の商品編集リンクが無い: ID=${id}`);
        const detail = await page.context().newPage();
        try {
          await detail.goto(new URL(href, page.url()).toString());
          const englishName = detail.locator('#form1 input[name$="[name_en]"]');
          await expect(englishName, `${id} の商品名(英)`).toHaveCount(1);
          const value = await englishName.inputValue();
          if (!value.includes(name))
            throw new Error(`${name} の清掃対象を商品名(日/英)で確認できない: ID=${id}, 日=${actualName}, 英=${value}`);
        } finally {
          await detail.close();
        }
      }
      if (removedIds.has(id)) throw new Error(`${name} の商品 ID ${id} は完全削除後も残っている`);
      removedIds.add(id);
    }
    await page.locator("#trigger_check_all").check();
    const deleteButton = page.locator('#btn_bulk button[data-bs-target="#bulkDeleteModal"]');
    await expect(deleteButton, `${name} の完全削除操作`).toBeVisible();
    await deleteButton.click();
    const modal = page.locator("#bulkDeleteModal");
    await expect(modal).toBeVisible();
    await modal.locator("#bulkDelete").click();
    await expect(modal.locator("#bulkDeleteDone"), `${name} の削除処理完了`).toBeVisible();
    const errors = (await modal.locator("#bulkErrors li").allInnerTexts()).map((s) => s.trim()).filter(Boolean);
    if (errors.length > 0) throw new Error(`${name} を完全削除できない: ${errors.join(" / ")}`);
    await Promise.all([page.waitForEvent("load"), modal.locator("#bulkDeleteDone").click()]);
  }
}
