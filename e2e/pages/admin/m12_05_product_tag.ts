/**
 * M12-05 のシードで、画面で作った商品に売上分析タグを付ける操作（商品登録編集画面）。セレクタはここだけに書く。
 * 商品登録編集画面を開き、割引率と販売制限が未選択なら選択肢の先頭を選び（保存に要る。M03-17 と同じ）、売上分析タグを選んで「商品を登録」を押す。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { expectSaved } from "./common";

export async function 売上分析タグを付ける(page: Page, 商品ID: string, タグ名: string, onIssue: (m: string) => void): Promise<void> {
  await page.goto(adminUrl(`/product/product/${商品ID}/edit`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form1");
  await expect(form, `商品ID ${商品ID} の商品登録編集画面`).toBeVisible();

  const discount = form.locator('select[name="admin_product[Discount]"]');
  if ((await discount.count()) === 1 && !(await discount.inputValue())) {
    const first = await discount.locator("option").evaluateAll((ns) => ns
      .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).find((o) => o.value !== ""));
    if (first) { await discount.selectOption(first.value); onIssue(`商品ID ${商品ID}: 割引率は選択肢の先頭の「${first.label}」を選んだ（保存に要る）`); }
  }
  const regions = form.locator('input[type="radio"][name="admin_product[RegionRestriction]"]');
  if ((await regions.count()) > 0 && (await form.locator('input[type="radio"][name="admin_product[RegionRestriction]"]:checked').count()) === 0) {
    await regions.first().check();
    onIssue(`商品ID ${商品ID}: 販売制限は選択肢の先頭を選んだ（保存に要る）`);
  }

  const select = form.locator('select[name="admin_product[TagSalesAnalysis][]"]');
  await expect(select, "売上分析タグ欄").toHaveCount(1);
  const labels = (await select.locator("option").allInnerTexts()).map((t) => t.trim());
  if (!labels.includes(タグ名)) throw new Error(`売上分析タグ欄に「${タグ名}」が無い（ある選択肢: ${labels.filter(Boolean).join("、")}）`);
  await select.selectOption([{ label: タグ名 }]);

  const save = form.locator('button[type="submit"]').filter({ hasText: /^\s*商品を登録\s*$/ });
  await expect(save, "「商品を登録」ボタン").toHaveCount(1);
  await Promise.all([page.waitForNavigation({ waitUntil: "load" }), save.click()]);
  for (const w of await expectSaved(page, `商品ID ${商品ID} に売上分析タグ「${タグ名}」を付けて「商品を登録」`)) onIssue(`商品ID ${商品ID}: 警告「${w}」`);
  await expect(select.locator("option:checked"), `商品ID ${商品ID} の登録後の売上分析タグ`).toHaveText([タグ名]);
}
