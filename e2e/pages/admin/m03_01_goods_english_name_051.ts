/** IT-M03-01-051 用: 検索結果から商品編集を開き、CSV 登録後の英語名を読む。 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export async function expectGoodsEnglishName051(page: Page, productId: string, nameEn: string): Promise<void> {
  const row = page.locator(`#ex-product-${productId}`);
  await expect(row, `商品 ID ${productId} の検索結果行`).toBeVisible();
  await row.locator("td:nth-child(3) a").click();
  await expect(page).toHaveURL(adminUrl(`/product/product/${productId}/edit`));
  const englishName = page.locator("#form1 #admin_product_name_en");
  await expect(englishName, `商品 ID ${productId} の商品名(英)欄`).toHaveCount(1);
  await expect(englishName).toHaveAttribute("name", "admin_product[name_en]");
  await expect(englishName, `商品 ID ${productId} の商品名(英)は正本指定値と完全一致`).toHaveValue(nameEn);
}
