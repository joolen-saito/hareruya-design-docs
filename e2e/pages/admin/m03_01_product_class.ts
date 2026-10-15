/** M03-01-009: 商品 C の NM 規格を、商品規格画面から SP 規格へ置き換える。 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";

type ReplaceClassValues = {
  productId: string;
  nmCode: string;
  spCode: string;
  japaneseLanguageId: string;
  sectionId: string;
};

/**
 * 未変更の商品編集画面から、画面の「規格設定」で規格一覧へ移動する（M03-01 の 007・009・019 で使う）。
 * 画面のスクリプトが読み込まれていれば、押すと編集の有無にかかわらず移動の確認（保存して移動／保存せずに移動）が出る。
 * 読み込み前に押すと確認を経ずに移動してしまい、実行ごとに画面の流れが変わるので、読み込みを待ってから押す。
 * 商品編集では何も変えていないので「保存せずに移動」を選ぶ（「保存して移動」は商品を保存してしまう）。
 */
export async function openClassListFromProductEdit(page: Page, productId: string): Promise<void> {
  await expect(page).toHaveURL(adminUrl(`/product/product/${productId}/edit`));
  await page.waitForLoadState("load");
  const setting = page.getByRole("link", { name: "規格設定", exact: true });
  await expect(setting).toHaveCount(1);
  await setting.click();
  const confirm = page.locator("#confirmFormChangeModal");
  await expect(confirm, "規格設定を押すと移動の確認が出る").toBeVisible();
  await confirm.getByRole("link", { name: "保存せずに移動", exact: true }).click();
  await expect(page).toHaveURL(adminUrl(`/product/product/class/${productId}`));
}

function activeRows(page: Page) {
  return page.locator("#ex-product_class tbody tr");
}

function rowWithCode(page: Page, code: string) {
  return activeRows(page).filter({ has: page.getByRole("cell", { name: code, exact: true }) });
}

/** 正本の明細値と、管理画面に実在する言語・状態・部門の選択肢だけを使う。 */
export async function replaceNmWithSpClass(
  page: Page,
  values: ReplaceClassValues,
  onWarning: (warning: string) => void,
): Promise<void> {
  const { productId, nmCode, spCode, japaneseLanguageId, sectionId } = values;
  await openClassListFromProductEdit(page, productId);
  await expect(activeRows(page), "C は CSV 取込時点で NM 規格が1件").toHaveCount(1);
  await expect(rowWithCode(page, nmCode), "C の元の NM 規格").toHaveCount(1);
  await expect(rowWithCode(page, nmCode).locator("td:nth-child(3)"), "元の規格状態").toHaveText("NM");

  await page.locator('#ex-product_class-header a[href$="/new"]').click();
  const form = page.locator("form#form");
  await expect(form).toBeVisible();

  const language = form.locator("#admin_product_class_Language");
  await chooseByLabel(language, "日本語");
  await expect(language, "商品CSVと同じ画面取得済み日本語ID").toHaveValue(japaneseLanguageId);

  const condition = form.locator("#admin_product_class_CardCondition");
  const spOption = condition.locator('option[data-code="SP"]');
  await expect(spOption, "画面のSP選択肢はスライトリープレイド").toHaveText("スライトリープレイド");
  const spValue = await spOption.getAttribute("value");
  if (!spValue) throw new Error("商品規格画面で SP の選択値を読めない");
  await condition.selectOption(spValue);

  await form.locator("#admin_product_class_code").fill(spCode);
  await form.locator("#admin_product_class_price02").fill("100");
  await form.locator("#admin_product_class_standard_price").fill("100");
  await form.locator("#admin_product_class_buy_price").fill("10");

  // 正本は「任意の部門」。共有シードで作った実在部門を、画面の選択肢と採番IDで照合する。
  const section = form.locator("#admin_product_class_Section");
  await chooseByLabel(section, "M03部門A");
  await expect(section, "部門の画面選択値と共有シードの採番ID").toHaveValue(sectionId);

  // 販売種別は画面で既定選択されるものをそのまま使う。未選択なら仕様外の値を補わない。
  const saleType = await form.locator("#admin_product_class_sale_type").inputValue();
  if (!saleType) throw new Error("商品規格画面で必須の販売種別が未選択。正本に指定がなく補えない");
  await chooseByLabel(form.locator("#admin_product_class_Status"), "公開");
  await form.getByRole("button", { name: "商品規格を登録" }).click();
  for (const warning of await expectSaved(page, `${spCode} の SP 商品規格登録`)) onWarning(warning);

  await page.getByRole("link", { name: "商品規格一覧", exact: true }).click();
  await expect(activeRows(page), "SP 登録後は NM と SP の2規格").toHaveCount(2);
  const nmRow = rowWithCode(page, nmCode);
  const spRow = rowWithCode(page, spCode);
  await expect(nmRow).toHaveCount(1);
  await expect(spRow).toHaveCount(1);
  await expect(spRow.locator("td:nth-child(3)"), "新規格は SP").toHaveText("SP");
  await expect(spRow.locator("td:first-child"), "新規格は公開").toHaveText("公開");

  await nmRow.getByRole("link", { name: "編集" }).click();
  await page.getByRole("link", { name: "商品規格を削除" }).click();
  const deleteModal = page.locator("#deleteConfirmModal");
  await expect(deleteModal).toBeVisible();
  await deleteModal.locator('a[data-method="delete"]').click();
  for (const warning of await expectSaved(page, `${nmCode} の NM 商品規格削除`)) onWarning(warning);
  await expect(activeRows(page), "C には SP 規格だけが残る").toHaveCount(1);
  await expect(rowWithCode(page, nmCode), "元の NM 規格は一覧に残らない").toHaveCount(0);
  await expect(rowWithCode(page, spCode), "SP 規格が残る").toHaveCount(1);
  await expect(rowWithCode(page, spCode).locator("td:nth-child(3)"), "残った規格の状態").toHaveText("SP");
}
