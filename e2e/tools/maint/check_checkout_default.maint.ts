/**
 * 保守用の確かめ（ケースではない。注文は確定しない）。2026-11-16 依頼者指示。
 * 並び順を下げたあと、フロントのご注文手続きで最初に選ばれる配送方法と、選べる支払方法を読む。
 * 管理画面のログインが続けて通るかも時刻つきで読む。
 */
import { test } from "@playwright/test";
import { BASE_URL, SETUP_ADMIN } from "../../config/env";
import { 販売中の商品ID } from "../../db/m05_front_order";
import { hideDebugToolbar, loginAdmin } from "../../lib/session";
import { clearCart, frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { ensureBuyer, M05_BUYER } from "../../pages/front/m05_front_order";

test("管理画面ログインと、ご注文手続きの既定の配送方法・支払方法", async ({ browser }) => {
  test.setTimeout(900_000);
  for (let i = 1; i <= 3; i++) {
    const t0 = Date.now();
    const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
    try {
      await hideDebugToolbar(ctx);
      const p = await ctx.newPage();
      p.setDefaultTimeout(30_000);
      await loginAdmin(p, SETUP_ADMIN);
      console.log(`管理画面ログイン ${i}回目: ${((Date.now() - t0) / 1000).toFixed(1)}秒で通った`);
    } catch (e) { console.log(`管理画面ログイン ${i}回目: 失敗 ${((Date.now() - t0) / 1000).toFixed(1)}秒 ${String(e).slice(0, 120)}`); }
    finally { await ctx.close(); }
  }
  await ensureBuyer(browser);
  const ctx = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  try {
    await hideDebugToolbar(ctx);
    const page = await ctx.newPage();
    page.setDefaultTimeout(60_000);
    await frontLogin(page, M05_BUYER);
    await clearCart(page, () => undefined);
    const id = 販売中の商品ID();
    await page.goto(`${BASE_URL}/ja/products/detail/${id}`);
    await page.waitForLoadState("load");
    const form = page.locator(`form#productForm${id}`);
    const table = form.locator('[id^="priceTable-"]:visible');
    const qty = table.locator("tbody tr .qty-label:visible").first();
    await qty.fill("1"); await qty.blur();
    await Promise.all([
      page.waitForResponse((r) => r.url().includes(`/products/add_cart/${id}`) && r.request().method() === "POST"),
      form.locator("button.add-cart").dispatchEvent("click"),
    ]);
    await page.goto(`${BASE_URL}/ja/cart`);
    await page.waitForLoadState("load");
    await Promise.all([page.waitForURL(/\/shopping(\?.*)?$/, { waitUntil: "domcontentloaded" }), page.locator("a.p-hareruya-cart__checkout-btn").click()]);
    await page.waitForLoadState("load");
    const rd = async (name: string) => page.locator(`input[name="${name}"]`).evaluateAll((ns) => ns.map((n) => ({
      label: ((n as HTMLInputElement).closest("label")?.textContent ?? "").replace(/\s+/g, " ").trim(), checked: (n as HTMLInputElement).checked })));
    const d = await rd("_shopping_order[Shippings][0][Delivery]");
    const p = await rd("_shopping_order[Payment]");
    console.log(`確かめた時刻 ${new Date().toISOString()} 商品ID ${id}`);
    console.log(`配送方法（選ばれているもの: ${d.filter((x) => x.checked).map((x) => x.label).join("・") || "なし"}）: ${d.map((x) => x.label).join(" / ")}`);
    console.log(`支払方法: ${p.map((x) => x.label + (x.checked ? "(選択中)" : "")).join(" / ")}`);
    await clearCart(page, () => undefined);
  } finally { await ctx.close(); }
});
