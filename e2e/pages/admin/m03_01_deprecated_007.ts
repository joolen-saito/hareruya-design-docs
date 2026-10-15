/** M03-01-007 の商品ID控えと、規格の高額商品設定を画面から行う。 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { GoodsCsvTemplate } from "./m03_01_goods_csv";
import { openClassListFromProductEdit } from "./m03_01_product_class";
import { ProductSearchPage } from "./product_search";

/** CSV形式欄に表示された公開ステータスの説明から「廃止」の値を読む。 */
export function abolishedGoodsStatusValue(template: GoodsCsvTemplate): string {
  const description = template.columns.find((column) => column.label === "商品公開ステータス")?.description;
  if (!description) throw new Error("商品公開ステータスの説明がCSV形式欄に無い");
  const choices = [...description.matchAll(/(\d+)\s*:\s*([^\d:]+)/g)]
    .map((match) => ({ value: match[1], label: match[2].trim() }));
  const abolished = choices.filter((choice) => choice.label === "廃止");
  if (abolished.length !== 1) throw new Error(`廃止を表す値をCSV形式欄から一意に読めない: ${description}`);
  return abolished[0].value;
}

/** 商品コードで検索し、画面の行に表示された採番IDを控える。 */
export async function readGoodsProductIdByCode(page: Page, code: string, name: string): Promise<string> {
  const search = new ProductSearchPage(page);
  await search.open();
  await search.ensureDetailVisible();
  await search.field("product_code").fill(code);
  await search.form.locator(".admin-product-search-submit").click();

  const rows = page.locator('tr[id^="ex-product-"]');
  await expect(rows, `${code} に対応する商品は1件だけ`).toHaveCount(1);
  await expect(page.locator("#form_bulk table.table tbody tr"), `${code} の規格は1件だけ`).toHaveCount(1);
  const row = rows.first();
  await expect(row.locator("td:nth-child(3) a"), `${code} の商品名`).toHaveText(name);
  await expect(row.locator("td:nth-child(4)"), `${code} の商品コード`).toHaveText(code);
  await expect(row.locator("td:nth-child(6)"), `${code} の規格状態`).toHaveText("NM");
  const id = (await row.locator("td:nth-child(2)").innerText()).trim();
  if (!/^\d+$/.test(id)) throw new Error(`${code} の採番商品IDを画面から読めない: ${id}`);
  await expect(row, `${code} の採番IDと結果行`).toHaveAttribute("id", `ex-product-${id}`);
  return id;
}

/** 商品検索結果から商品編集・規格設定・NM規格編集へ順に進み、高額商品コードを保存する。 */
export async function setGoodsHighPriceCode(page: Page, id: string, code: string, highPriceCode: string): Promise<void> {
  const foundId = await readGoodsProductIdByCode(page, code, "公開状態商品-007");
  if (foundId !== id) throw new Error(`${code} の採番商品IDが控えた値と違う: ${foundId} != ${id}`);
  await page.locator(`#ex-product-${id} td:nth-child(3) a`).click();
  await expect(page).toHaveURL(adminUrl(`/product/product/${id}/edit`));

  await openClassListFromProductEdit(page, id);

  const classes = page.locator("#ex-product_class tbody tr");
  await expect(classes, `${code} の商品規格は1件だけ`).toHaveCount(1);
  const nm = classes.first();
  await expect(nm.locator("td:nth-child(3)"), `${code} の規格状態`).toHaveText("NM");
  await expect(nm.locator("td:nth-child(5)"), `${code} の商品コード`).toHaveText(code);
  await nm.getByRole("link", { name: "編集", exact: true }).click();

  const form = page.locator("form#form");
  const highPrice = form.locator("#admin_product_class_high_price_code");
  await expect(highPrice, "編集前は通常商品").toBeEmpty();
  await highPrice.fill(highPriceCode);
  const section = form.locator("#admin_product_class_Section");
  const choices = await section.locator("option").evaluateAll((options) => options
    .map((option) => option as HTMLOptionElement)
    .filter((option) => option.value !== "" && !option.disabled)
    .map((option) => ({ value: option.value, label: option.textContent?.trim() ?? "" }))
    .filter((option) => option.label !== ""));
  if (choices.length === 0) throw new Error("商品規格登録編集の部門に選択できる値が無い");
  await section.selectOption(choices[0].value);
  await form.locator('#ex-conversion-action button[type="submit"]').click();
  await expect(page).toHaveURL(/\/product\/product\/class\/\d+\/edit\/\d+$/);
  await expect(highPrice, "高額商品コードが保存される").toHaveValue(highPriceCode);
  await expect(section, "画面で選んだ部門が保存される").toHaveValue(choices[0].value);
}
