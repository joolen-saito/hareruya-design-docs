/** F01-02 支店ECTOP（SALE中の商品の数量ボタン・商品名リンク）。正本: cases/F01-02_test_cases.tsv */
import { Page } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { rc } from "../../lib/run_marker";
import { BranchTopPage } from "../../pages/front/f01_02_branch";
import { 支店URL } from "../../seeds/f01-02";
import { test } from "@playwright/test";

const note = (m: string) => test.info().annotations.push({ type: "手順の注記", description: m });
/** SALE中の商品のカード（商品名で選ぶ） */
const card = (top: BranchTopPage, name: string) => top.SALE中.locator(".p-hareruya-product-card").filter({ hasText: rc(name) }).first();
const plus = (c: ReturnType<typeof card>) => c.getByRole("button", { name: /増やす|\+|plus/i }).or(c.locator("button.c-hareruya-btn-quantity").nth(1)).last();
const minus = (c: ReturnType<typeof card>) => c.locator("button.c-hareruya-btn-quantity").first();
const qty = (c: ReturnType<typeof card>) => c.locator("input.p-hareruya-product-card__quantity-input").first();

caseTest("IT-F01-02-024", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  const c = () => card(top, "セール基準商品-024");
  let 値 = "";
  await step(1, async () => { await top.open(支店URL("024")); await top.開いている(); await expect(c()).toBeVisible(); });
  await step(2, async () => { for (let i = 0; i < 6 && (await qty(c()).inputValue()) !== "1"; i++) await plus(c()).click({ timeout: 10_000 }); });
  await step(3, async () => {
    await minus(c()).click({ timeout: 8_000 }).catch(() => note("商品数が1のとき、マイナスボタンは押せない状態（非活性）だった"));
    値 = await qty(c()).inputValue();
  });
  await expected(async () => { expect.soft(値, "商品数の表示（在庫数の5）").toBe("5"); });
});

caseTest("IT-F01-02-026", async ({ page, step, expected }) => {
  const top = new BranchTopPage(page);
  const c = () => card(top, "セール基準商品-026");
  let 値 = "";
  await step(1, async () => { await top.open(支店URL("026")); await top.開いている(); await expect(c()).toBeVisible(); });
  await step(2, async () => { for (let i = 0; i < 8 && (await qty(c()).inputValue()) !== "5"; i++) await plus(c()).click({ timeout: 10_000 }); });
  await step(3, async () => {
    await plus(c()).click({ timeout: 8_000 }).catch(() => note("商品数が在庫数の5のとき、プラスボタンは押せない状態（非活性）だった"));
    値 = await qty(c()).inputValue();
  });
  await expected(async () => { expect.soft(値, "商品数の表示（1）").toBe("1"); });
});

caseTest("IT-F01-02-032", async ({ page, notes, step, expected }) => {
  const top = new BranchTopPage(page);
  const c = () => card(top, "セール基準商品-032");
  await step(1, async () => { await top.open(支店URL("032")); await top.開いている(); await expect(c()).toBeVisible(); });
  await step(2, async () => { await Promise.all([page.waitForURL(/\/products\/detail\/\d+/, { timeout: 30_000 }).catch(() => undefined), c().locator("a.p-hareruya-product-card__name").first().click({ timeout: 20_000 })]); await page.waitForLoadState("load"); });
  await expected(async () => {
    const id = notes.get("〔商品ID-F0102-032〕");
    expect.soft(new URL(page.url()).pathname, "遷移先（商品詳細画面）").toMatch(new RegExp(`/products/detail/${id}$`));
  });
});
void (null as unknown as Page);
