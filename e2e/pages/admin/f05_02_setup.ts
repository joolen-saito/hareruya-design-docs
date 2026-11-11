/**
 * F05-02 ネット買取商品検索のシードが使う、管理画面の操作（商品管理の商品一覧で、商品名に語を含む商品の数を読む。読むだけ）。
 */
import { expect, Page } from "@playwright/test";
import { ProductSearchPage } from "./product_search";

/** 商品マスターの既定の絞り込み（公開状態・状態・高額商品）を外し、商品名に語を入れて検索し、結果の商品の行の数を返す */
export async function 商品名を含む商品の数(page: Page, 語: string): Promise<number> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.ensureDetailVisible();
  for (const field of ["status", "card_condition", "expensive"]) {
    for (const option of await search.choiceOptions(field)) {
      if (option.checked) await search.setChecked(field, option.value, false);
    }
    await expect.poll(() => search.checkedValues(field), "商品マスターの既定の絞り込みを外す").toEqual([]);
  }
  await search.field("product_name").fill(語);
  await search.submitAndWaitForResult();
  return page.locator('tr[id^="ex-product-"]').count();
}
