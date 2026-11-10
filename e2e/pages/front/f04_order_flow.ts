/**
 * F04-02 の既存受注づくり（フロントで注文を確定する）。
 * 画面の作りは m04_19 の checkout と同じ（支払方法を選ぶと画面が再読み込みされる。確定のチェックのあと「注文する」を押すと完了画面へ移る）。
 * 違いは、店舗ページ（base）を指定できることと、支払方法を名称で指定できること。
 */
import { expect, Page } from "@playwright/test";
import { ShoppingPage, カートに入れる } from "./f04_shopping";

const PAYMENT = 'input[name="_shopping_order[Payment]"]';

/** 商品をカートに入れ、ご注文方法指定画面で支払方法を選んで注文を確定する。注文番号を返す */
export async function 注文を確定する(page: Page, base: string, 商品ID: string, 支払方法: string, what: string, 外部決済へ移る = false): Promise<string> {
  await カートに入れる(page, base, 商品ID, 1, `${what}: カートに入れる`);
  await new ShoppingPage(page).買い物かごから開く(base);
  const sp0 = new ShoppingPage(page);
  // 支払方法が見つからないときは、配送方法を店頭受取（店舗受取）側に切り替えて探し直す（配送方法ごとに選べる支払方法が違う）
  const readChoices = () => page.locator(PAYMENT).evaluateAll((ns) => ns.map((n) => ({
    value: (n as HTMLInputElement).value,
    label: ((n as HTMLInputElement).closest("label")?.textContent ?? "").replace(/\s+/g, " ").trim(),
    checked: (n as HTMLInputElement).checked,
  })));
  let choices = await readChoices();
  if (!choices.some((c) => c.label === 支払方法)) {
    const names = await sp0.配送方法の名前();
    const alt = names.find((n) => n === "店舗受取" || n === "店頭受取");
    if (alt) {
      const row = sp0.配送方法の選択肢.locator("xpath=ancestor::label[1]").filter({ hasText: new RegExp(`^\\s*${alt}\\s*$`) });
      if (await row.count() === 1 && !(await row.locator("input").isChecked())) {
        await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), row.locator("input").check({ force: true, timeout: 30_000 })]);
        await page.waitForLoadState("load");
      }
      choices = await readChoices();
    }
  }
  const pick = choices.find((c) => c.label === 支払方法);
  if (!pick) throw new Error(`${what}: 支払方法に「${支払方法}」が無い（ある選択肢: ${choices.map((c) => c.label).join("、")}。配送方法: ${(await sp0.配送方法の名前()).join("、")}）`);
  for (let i = 0; i < 3 && !(await page.locator(`${PAYMENT}[value="${pick.value}"]`).isChecked()); i++) {
    await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), page.locator(`${PAYMENT}[value="${pick.value}"]`).check({ force: true, timeout: 30_000 })]);
    await page.waitForLoadState("load");
  }
  await expect(page.locator(`${PAYMENT}[value="${pick.value}"]`), `${what}: 支払方法「${支払方法}」が選ばれた`).toBeChecked({ timeout: 30_000 });
  const accept = page.locator('input[name="_shopping_order[accept_order]"]');
  await expect(accept, `${what}: 「この内容で注文を確定します。」`).toHaveCount(1, { timeout: 30_000 });
  await accept.check({ force: true, timeout: 30_000 });
  const submit = page.locator("button[data-js-payment-submit]");
  await expect(submit, `${what}: 確定のチェックで注文のボタンが押せる`).toBeEnabled({ timeout: 30_000 });
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }), submit.click({ timeout: 30_000 })]);
  await page.waitForLoadState("load");
  if (外部決済へ移る && /\/shopping\/sln_card_payment/.test(page.url())) return "";
  if (!/\/shopping\/complete/.test(page.url())) {
    const errors = (await page.locator(".p-hareruya-message-box--error, .ec-alert-warning, .error, .c-hareruya-form-input__field-error--server").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    throw new Error(`${what}: 注文が確定しない（${page.url()}）: ${errors.join(" / ") || "画面にエラーの表示なし"}`);
  }
  const heading = page.getByText(/ご注文番号\s*\S+/).first();
  await expect(heading, `${what}: ご注文完了の画面のご注文番号`).toBeVisible({ timeout: 30_000 });
  const m = /ご注文番号\s*(\S+)/.exec((await heading.textContent()) ?? "");
  if (!m) throw new Error(`${what}: ご注文番号を読めない`);
  return m[1];
}
