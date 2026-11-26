/**
 * M04-30 のシードが使う、商品規格登録編集画面の操作（シード表「取り込みで作られた規格の行を開き、商品規格登録編集画面で基準価格(円)・
 * スマレジ商品コードを入れ、公開状態で「公開」を選び、そのほかの必須項目に任意の値を入れて登録ボタンを押す」）。
 * スマレジ連携フラグは「連携しない」のまま登録する（「連携する」で登録すると、アプリが外部のスマレジの商品APIを呼ぶため。
 * 連携フラグはシードが E2E の行だけ DB で書く。2026-11-10 依頼者「スマレジは後回し」）。
 */
import { expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";

type Issue = (m: string) => void;

export async function 規格にスマレジ商品コードを入れて公開する(
  page: Page, a: { 商品ID: string; 規格ID: string; 基準価格: number; スマレジ商品コード: string | null }, what: string, issue: Issue,
): Promise<void> {
  await page.goto(adminUrl(`/product/product/class/${a.商品ID}/edit/${a.規格ID}`));
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録編集画面`).toBeVisible();
  const off = form.locator('input[name="admin_product_class[smaregi_alignment_flg]"][value="0"]');
  await expect(off, `${what}: スマレジ連携フラグの「連携しない」`).toHaveCount(1);
  await off.check();
  const section = form.locator("#admin_product_class_Section");
  if ((await section.count()) && !(await section.inputValue())) {
    const first = await section.locator("option").evaluateAll((nodes) => nodes
      .map((n) => ({ value: (n as HTMLOptionElement).value, label: (n.textContent ?? "").trim() })).find((o) => o.value !== ""));
    if (!first) throw new Error(`${what}: 部門に選べる値が無い`);
    await section.selectOption(first.value);
    issue(`${what}: 部門は選択肢の先頭の「${first.label}」を選んだ（シード表: そのほかの必須項目は任意の値）`);
  }
  await form.locator('[name="admin_product_class[standard_price]"]').fill(String(a.基準価格));
  // カード指定のある商品はスマレジ商品コードが自動採番で入力できない（disabled）。入力できるときだけ入れる（できないときは呼び出し側が E2E の行だけ DB で書く）
  const コード欄 = form.locator('[name="admin_product_class[smaregi_product_code]"]');
  const コード入力可 = await コード欄.isEnabled();
  if (コード入力可) await コード欄.fill(a.スマレジ商品コード ?? "");
  await chooseByLabel(form.locator("#admin_product_class_Status"), "公開");
  await Promise.all([page.waitForNavigation({ waitUntil: "load", timeout: 120_000 }), page.getByRole("button", { name: "商品規格を登録", exact: true }).click({ noWaitAfter: true })]);
  for (const w of await expectSaved(page, `${what}: 商品規格の登録`)) issue(`${what}: 警告「${w}」`);
  if (コード入力可) await expect(form.locator('[name="admin_product_class[smaregi_product_code]"]'), `${what}: 登録後のスマレジ商品コード`).toHaveValue(a.スマレジ商品コード ?? "");
  else issue(`${what}: カード指定のある商品のスマレジ商品コードは自動採番で画面から入力できない（入力欄が disabled）ので入力しなかった`);
}
