/** F04-02 支店（TC大阪＝トーナメントセンター 大阪）のご注文方法指定。正本: cases/F04-02_test_cases.tsv */
import { Page } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { unrc } from "../../lib/run_marker";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { 大阪の店舗ページ } from "../../pages/admin/f04_setup";
import { ShoppingPage } from "../../pages/front/f04_shopping";
import { 支店の状態の } from "../../seeds/f04-02-branch";

const login = async (page: Page, seedId: string) => { await frontLogin(page, 支店の状態の(seedId).会員); };
const text = async (page: Page, sel: string) => ((await page.locator(sel).first().innerText({ timeout: 20_000 })) ?? "").replace(/\s+/g, " ");

caseTest("IT-F04-02-020", async ({ page, step, expected }) => {
  await login(page, "S-F04-02-STORE-CARTS-020");
  const sp = new ShoppingPage(page);
  let honten: string[] = []; let osaka: string[] = [];
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { honten = (await sp.商品の行()).map((r) => unrc(r.商品名)); });
  await step(3, async () => { await sp.買い物かごから開く(大阪の店舗ページ); });
  await step(4, async () => { osaka = (await sp.商品の行()).map((r) => unrc(r.商品名)); });
  await expected(async () => {
    expect.soft(honten.length, "本店の商品欄の行数").toBe(1);
    expect.soft(honten.join(" "), "本店の商品欄の商品").toContain("F0402-TOKYO-020");
    expect.soft(osaka.length, "TC大阪の商品欄の行数").toBe(1);
    expect.soft(osaka.join(" "), "TC大阪の商品欄の商品").toContain("F0402-OSAKA-020");
  });
});

caseTest("IT-F04-02-051", async ({ page, step, expected }) => {
  await login(page, "S-F04-02-SMAREGI-051");
  const sp = new ShoppingPage(page);
  let pays: string[] = [];
  await step(1, async () => { await sp.買い物かごから開く(大阪の店舗ページ); });
  await step(2, async () => {
    pays = await page.locator('input[name="_shopping_order[Payment]"]').evaluateAll((ns) => ns.map((n) => ((n as HTMLInputElement).closest("label")?.textContent ?? "").replace(/\s+/g, " ").trim()));
  });
  await expected(async () => {
    expect.soft(pays.length, "支払方法の選択肢の数（表示されている）").toBeGreaterThan(0);
    expect.soft(pays, "支払方法に「試験スマレジ決済-051」が含まれない").not.toContain("試験スマレジ決済-051");
  });
});

caseTest("IT-F04-02-053", async ({ page, step, expected }) => {
  await login(page, "S-F04-02-BRANCH-053");
  const sp = new ShoppingPage(page);
  let pay = "";
  await step(1, async () => { await sp.買い物かごから開く(大阪の店舗ページ); });
  await step(2, async () => { pay = await text(page, "section:has(input[name='_shopping_order[Payment]'])"); });
  await expected(async () => {
    expect.soft(pay.includes("ポイント残高"), "お支払い方法欄に「ポイント残高」が表示される").toBe(false);
    expect.soft(pay.includes("ポイント使用"), "お支払い方法欄に「ポイント使用」が表示される").toBe(false);
    expect.soft(pay.includes("使用ポイント"), "お支払い方法欄に「使用ポイント」が表示される").toBe(false);
    expect.soft(await page.locator('[data-js-point-use]:visible, [data-js-point-input]:visible').count(), "ポイントの入力欄の表示数").toBe(0);
  });
});

caseTest("IT-F04-02-068", async ({ page, step, expected }) => {
  await login(page, "S-F04-02-BRANCH-068");
  const sp = new ShoppingPage(page);
  let aside = "";
  await step(1, async () => { await sp.買い物かごから開く(大阪の店舗ページ); });
  await step(2, async () => { aside = await text(page, "aside.p-hareruya-checkout__aside"); });
  await expected(async () => {
    for (const w of ["商品金額合計", "送料", "手数料", "ポイント使用", "内税", "ポイント残高", "ポイント発生"]) {
      expect.soft(aside.includes(w), `ご注文内容の確認欄に「${w}」が表示される`).toBe(false);
    }
    expect.soft(aside.includes("注文金額合計"), "ご注文内容の確認欄に「注文金額合計」が表示される").toBe(true);
  });
});
