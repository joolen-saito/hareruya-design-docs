/** IT-M03-01-019 の B 商品を、商品編集から NM 規格編集へ進めて高額商品にする。 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";
import { openClassListFromProductEdit } from "./m03_01_product_class";

/** B の検索結果行から画面を辿り、高額商品コードと必須の部門だけを変更する。 */
export async function set019HighPriceCode(
  page: Page,
  productId: string,
  productCode: string,
  highPriceCode: string,
): Promise<string[]> {
  const result = page.locator(`#ex-product-${productId}`);
  await expect(result, `${productCode} の検索結果行`).toBeVisible();
  await expect(result.locator("td:nth-child(3) a"), "B の商品名").toHaveText("高額条件商品-019");
  await expect(result.locator("td:nth-child(4)"), "B の商品コード").toHaveText(productCode);
  await result.locator("td:nth-child(3) a").click();
  await expect(page).toHaveURL(adminUrl(`/product/product/${productId}/edit`));

  await openClassListFromProductEdit(page, productId);

  const classes = page.locator("#ex-product_class tbody tr");
  await expect(classes, "B の規格は NM の1件だけ").toHaveCount(1);
  const nm = classes.first();
  await expect(nm.locator("td:first-child"), "B の規格は公開").toHaveText("公開");
  await expect(nm.locator("td:nth-child(3)"), "B の規格状態").toHaveText("NM");
  await expect(nm.locator("td:nth-child(5)"), "B の規格コード").toHaveText(productCode);
  await nm.getByRole("link", { name: "編集", exact: true }).click();

  const form = page.locator("form#form");
  const highPrice = form.locator("#admin_product_class_high_price_code");
  const section = form.locator("#admin_product_class_Section");
  await expect(form).toBeVisible();
  await expect(highPrice, "編集前の B は通常商品").toBeEmpty();
  await expect(form.locator("#admin_product_class_code"), "B の規格コードは変更しない").toHaveValue(productCode);
  await expect(form.locator("#admin_product_class_Status option:checked"), "B の規格は公開").toHaveText("公開");
  await expect(form.locator("#admin_product_class_CardCondition option:checked"), "B の規格状態は NM").toHaveAttribute("data-code", "NM");
  const sections = await section.locator("option").evaluateAll((options) => options
    .map((option) => option as HTMLOptionElement)
    .filter((option) => option.value !== "" && !option.disabled)
    .map((option) => ({ value: option.value, label: option.textContent?.trim() ?? "" }))
    .filter((option) => option.label !== ""));
  if (sections.length === 0) throw new Error("B の商品規格編集で必須の部門を画面から選べない");
  await highPrice.fill(highPriceCode);
  await section.selectOption(sections[0].value);
  await form.getByRole("button", { name: "商品規格を登録", exact: true }).click();
  const warnings = await expectSaved(page, "S-M03-01-DEPRECATED-019 の高額商品設定");
  await expect(page).toHaveURL(/\/product\/product\/class\/\d+\/edit\/\d+$/);
  await expect(highPrice, "B の高額商品コードが保存される").toHaveValue(highPriceCode);
  await expect(section, "画面で選んだ部門が保存される").toHaveValue(sections[0].value);
  await expect(form.locator("#admin_product_class_Status option:checked"), "B の公開状態を維持").toHaveText("公開");
  await expect(form.locator("#admin_product_class_CardCondition option:checked"), "B の NM 状態を維持").toHaveAttribute("data-code", "NM");
  return warnings;
}
