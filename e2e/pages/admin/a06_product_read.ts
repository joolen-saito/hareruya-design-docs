/** A06 のケースが確かめる・シードが整える、商品規格登録編集画面の操作。セレクタはここだけに書く */
import { Dialog, expect, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";
import { chooseByLabel, expectSaved } from "./common";

/** 商品規格登録編集画面を開き、販売価格・基準価格の欄の値を読む（数字以外の桁区切りは外す） */
export async function 規格の価格を読む(page: Page, 商品ID: string, 規格ID: string): Promise<{ 販売価格: string; 基準価格: string }> {
  const res = await page.goto(adminUrl(`/product/product/class/${商品ID}/edit/${規格ID}`), { timeout: 60_000 });
  expect(res?.status() ?? 0, "商品規格登録編集画面の応答").toBeLessThan(400);
  await page.waitForLoadState("load");
  const v = async (sel: string) => (await page.locator(sel).inputValue({ timeout: 30_000 })).replace(/[,\s]/g, "").replace(/\.0+$/, "");
  return { 販売価格: await v("#admin_product_class_price02"), 基準価格: await v("#admin_product_class_standard_price") };
}

/**
 * 商品規格登録編集画面でセールフラグを付けて販売価格を入れ直し、「商品規格を登録」を押す（取込とカード指定のあと、販売価格が基準価格と同じ値になっていたため。2026-11-17 A06-18）。
 * スマレジ連携は「連携しない」、部門が未選択なら選択肢の先頭（m06_11_setup の 規格を整える と同じ）
 */
export async function 販売価格を入れ直す(page: Page, 商品ID: string, 規格ID: string, 販売価格: string, what: string, issue: (m: string) => void): Promise<void> {
  await page.goto(adminUrl(`/product/product/class/${商品ID}/edit/${規格ID}`), { timeout: 60_000 });
  await page.waitForLoadState("load");
  const form = page.locator("form#form");
  await expect(form, `${what}: 商品規格登録編集画面`).toBeVisible({ timeout: 30_000 });
  const smaregi = form.locator('[name="admin_product_class[smaregi_alignment_flg]"]');
  if ((await smaregi.count()) > 0) {
    if ((await smaregi.first().evaluate((n) => n.tagName)) === "SELECT") await chooseByLabel(smaregi.first(), "連携しない");
    else await form.getByLabel("連携しない", { exact: true }).check();
  }
  const section = form.locator("#admin_product_class_Section");
  if ((await section.count()) === 1 && !(await section.inputValue())) {
    const first = await section.locator("option").evaluateAll((ns) => ns.map((n) => (n as HTMLOptionElement).value).find((x) => x));
    if (!first) throw new Error(`${what}: 部門の選択肢が無い`);
    await section.selectOption(first);
    issue(`${what}: 部門が未選択だったので、選択肢の先頭を選んだ`);
  }
  // 販売価格は、セールフラグが付いていないと基準価格と同じ値で保存される（M03-30 と同じ作り）。基準価格と違う販売価格にするため、セールフラグを付ける
  await form.locator("#admin_product_class_sale_flg").check();
  await form.locator("#admin_product_class_price02").fill(販売価格);
  const on = (d: Dialog) => { issue(`${what}: 画面の確認「${d.message()}」をOKで閉じた`); void d.accept(); };
  page.on("dialog", on);
  try {
    await Promise.all([
      page.waitForNavigation({ waitUntil: "load", timeout: 180_000 }),
      page.getByRole("button", { name: "商品規格を登録", exact: true }).click({ noWaitAfter: true }),
    ]);
  } finally { page.off("dialog", on); }
  for (const w of await expectSaved(page, `${what}: 商品規格の登録`)) issue(`${what}: 警告「${w}」`);
  const now = await 規格の価格を読む(page, 商品ID, 規格ID);
  if (now.販売価格 !== 販売価格.replace(/\.0+$/, "")) throw new Error(`${what}: 販売価格を ${販売価格} に入れ直したが、画面の値が ${now.販売価格}`);
}
