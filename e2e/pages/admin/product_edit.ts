/** 商品登録編集（商品詳細/編集）画面の表示の読み取り。 */
import { expect, Page } from "@playwright/test";

/** 基本情報欄の「商品ID」の表示値（新規登録の画面には無い） */
export async function displayedProductId(page: Page): Promise<string> {
  const row = page.locator("#basicConfig .row").filter({ has: page.locator("span", { hasText: /^商品ID$/ }) });
  await expect(row, "商品詳細/編集画面の商品IDの行").toHaveCount(1);
  return ((await row.locator(".col p").first().textContent()) ?? "").trim();
}
