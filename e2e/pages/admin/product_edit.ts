/** 商品登録編集（商品詳細/編集）画面の表示の読み取りと、正本が定めた項目だけを変える保存。 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

/** 基本情報欄の「商品ID」の表示値（新規登録の画面には無い） */
export async function displayedProductId(page: Page): Promise<string> {
  const row = page.locator("#basicConfig .row").filter({ has: page.locator("span", { hasText: /^商品ID$/ }) });
  await expect(row, "商品詳細/編集画面の商品IDの行").toHaveCount(1);
  return ((await row.locator(".col p").first().textContent()) ?? "").trim();
}

/** 商品登録編集（商品詳細/編集）画面を開き、読み込みを待つ */
export async function openProductEdit(page: Page, 商品ID: string): Promise<void> {
  await page.goto(adminUrl(`/product/product/${商品ID}/edit`));
  await page.waitForLoadState("load");
  await expect(page.locator("form#form1"), `商品ID ${商品ID} の商品詳細/編集画面`).toBeVisible();
}

/** 略称タグ欄（単一選択） */
export const shortTagSelect = (page: Page) => page.locator('form#form1 select[name="admin_product[StorageCode]"]');

/** 略称タグ欄の選択肢の表示名（未選択の行を除く） */
export async function shortTagOptions(page: Page): Promise<string[]> {
  const select = shortTagSelect(page);
  await expect(select, "略称タグ欄").toHaveCount(1);
  return select.locator("option").evaluateAll((nodes) => nodes
    .filter((n) => (n as HTMLOptionElement).value !== "")
    .map((n) => (n.textContent ?? "").trim()));
}

/** 略称タグ欄で選ばれている略称タグID（未選択なら空） */
export async function selectedShortTagId(page: Page): Promise<string> {
  return shortTagSelect(page).inputValue();
}

/**
 * 割引率で選択肢のいずれか（先頭）を選び、販売制限が選ばれていることを確かめて「商品を登録」する。略称タグ欄は触らない。
 * 選んだ値は onIssue に渡す（報告に出す）。
 */
export async function saveWithDiscount(page: Page, 商品ID: string, onIssue: (m: string) => void): Promise<void> {
  await openProductEdit(page, 商品ID);
  const form = page.locator("form#form1");
  const discount = form.locator('select[name="admin_product[Discount]"]');
  await expect(discount, "割引率の欄").toHaveCount(1);
  const options = await discount.locator("option").evaluateAll((nodes) => nodes
    .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).filter((o) => o.value !== ""));
  if (options.length === 0) throw new Error("割引率に選べる値が無い");
  await discount.selectOption(options[0].value);
  onIssue(`割引率に「${options[0].label}」を選んだ（正本: 選択肢のいずれか）`);
  await expect(form.locator('input[type="radio"][name="admin_product[RegionRestriction]"]:checked'), "販売制限が選ばれている").toHaveCount(1);
  await form.locator('button[type="submit"]').filter({ hasText: /^\s*商品を登録\s*$/ }).click();
  await page.waitForLoadState("load");
  for (const warning of await expectSaved(page, `商品ID ${商品ID} の「商品を登録」`)) onIssue(warning);
}
