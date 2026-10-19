/**
 * M03-17 のシード・ケースで使う、商品マスターと商品登録編集（商品詳細/編集）画面の操作。
 * 商品の作成は M03-01 のグッズ商品CSV登録（pages/admin/m03_01_goods_register.ts）を使い、ここでは次だけを持つ。
 * - 商品コードで商品を探す（前の実行で残った商品があるかを見る）
 * - 商品マスター(検索結果)の商品名のリンクから商品登録編集画面を開き、割引率と販売制限を選んで「商品を登録」する
 * - 商品登録編集画面の売上分析タグ欄（複数選択）の選択肢を読む
 */
import { expect, Locator, Page } from "@playwright/test";
import { expectSaved } from "./common";
import { ProductSearchPage } from "./product_search";

/** 商品登録編集画面の売上分析タグ欄（複数選択） */
export const salesAnalysisTagSelect = (page: Page): Locator => page.locator('form#form1 select[name="admin_product[TagSalesAnalysis][]"]');

/** 売上分析タグ欄の選択肢の表示名（値の無い行を除く） */
export async function salesAnalysisTagOptions(page: Page): Promise<string[]> {
  const select = salesAnalysisTagSelect(page);
  await expect(select, "売上分析タグ欄").toHaveCount(1);
  return select.locator("option").evaluateAll((nodes) => nodes
    .filter((n) => (n as HTMLOptionElement).value !== "")
    .map((n) => (n.textContent ?? "").trim()));
}

/** 売上分析タグ欄で選ばれている売上分析タグの表示名 */
export async function selectedSalesAnalysisTags(page: Page): Promise<string[]> {
  return salesAnalysisTagSelect(page).evaluate((s) => Array.from((s as HTMLSelectElement).selectedOptions)
    .filter((o) => o.value !== "").map((o) => (o.textContent ?? "").trim()));
}

/**
 * 商品マスター(検索入力)で、既定でチェックされている絞り込み（公開状態・状態・高額商品）を外し、商品コードで検索する。
 * 検索結果の行のうち、商品コードがちょうど一致する行の商品IDを返す（無ければ空）。
 */
export async function productIdsByCode(page: Page, code: string): Promise<string[]> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.ensureDetailVisible();
  // 検索欄の項目と業務の呼び名の組。確かめの文には業務の呼び名だけを出す（M03-21 の商品マスターの絞り込みの外し方と同じ）
  const filters: [string, string][] = [["status", "公開ステータス"], ["card_condition", "状態"], ["expensive", "高額商品"]];
  for (const [field, 項目] of filters) {
    for (const option of await search.choiceOptions(field)) {
      if (option.checked) await search.setChecked(field, option.value, false);
    }
    await expect.poll(() => search.checkedValues(field), `検索の「${項目}」の絞り込みを外す`).toEqual([]);
  }
  await search.field("product_code").fill(code);
  await search.submitAndWaitForResult();
  const ids: string[] = [];
  for (const row of await page.locator('tr[id^="ex-product-"]').all()) {
    if ((await row.locator("td:nth-child(4)").innerText()).trim() === code) ids.push((await row.locator("td:nth-child(2)").innerText()).trim());
  }
  return ids;
}

/**
 * 商品マスター(検索結果)に出ている商品IDの行の商品名のリンクから商品登録編集画面を開き、
 * 割引率と販売制限でそれぞれ選択肢を1つ（先頭）選び、売上分析タグは何も選ばずに「商品を登録」を押す。
 * 選んだ値は、シードの問題の報告に渡す（報告に出す）。
 */
export async function saveFromSearchResult(page: Page, 商品ID: string, onIssue: (m: string) => void): Promise<void> {
  const link = page.locator(`tr#ex-product-${商品ID} td:nth-child(3) a`);
  await expect(link, `商品マスター(検索結果)の商品ID ${商品ID} の商品名のリンク`).toHaveCount(1);
  await Promise.all([page.waitForURL((u) => u.pathname.endsWith(`/product/product/${商品ID}/edit`)), link.click()]);
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `商品ID ${商品ID} の商品登録編集画面`).toBeVisible();

  const discount = form.locator('select[name="admin_product[Discount]"]');
  await expect(discount, "割引率の欄").toHaveCount(1);
  const discounts = await discount.locator("option").evaluateAll((nodes) => nodes
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).filter((o) => o.value !== ""));
  if (discounts.length === 0) throw new Error("割引率に選べる値が無い");
  await discount.selectOption(discounts[0].value);
  onIssue(`割引率に「${discounts[0].label}」を選んだ（正本: 選択肢を1つ）`);

  const regions = form.locator('input[type="radio"][name="admin_product[RegionRestriction]"]');
  if ((await regions.count()) === 0) throw new Error("販売制限に選べる値が無い");
  await regions.first().check();
  const regionLabel = await regions.first().evaluate((e) => (e as HTMLInputElement).labels?.item(0)?.textContent?.trim() ?? "");
  onIssue(`販売制限に「${regionLabel}」を選んだ（正本: 選択肢を1つ）`);

  const tags = await selectedSalesAnalysisTags(page);
  if (tags.length) throw new Error(`商品ID ${商品ID} の売上分析タグ欄に、すでに選ばれているタグがある（${tags.join("、")}）。正本は何も選ばない`);

  const save = form.locator('button[type="submit"]').filter({ hasText: /^\s*商品を登録\s*$/ });
  await expect(save, "「商品を登録」ボタン").toHaveCount(1);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), save.click()]);
  for (const warning of await expectSaved(page, `商品ID ${商品ID} の「商品を登録」`)) onIssue(warning);
}
