/** F04-02 配送方法・支払方法の選択（共有の設定は書き換えず、表示中であることを前提にするケース）。正本: cases/F04-02_test_cases.tsv */
import { Page } from "@playwright/test";
import { expect, caseTest } from "../../lib/case";
import { 受注の備考 } from "../../db/f04_02";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { ShoppingPage } from "../../pages/front/f04_shopping";
import { 設定ありの状態の } from "../../seeds/f04-02-settings";

const login = async (page: Page, seedId: string) => { await frontLogin(page, 設定ありの状態の(seedId).会員); };
const DELIVERY = 'input[name="_shopping_order[Shippings][0][Delivery]"]';
const PAYMENT = 'input[name="_shopping_order[Payment]"]';
const message = (page: Page) => page.locator('textarea[name="_shopping_order[message]"]');
const contact = (page: Page) => page.locator('a[href*="contact"][href*="tctokyo"]');
const sameday = (page: Page) => page.locator('input[name="_shopping_order[pickup_today]"]');

async function 選ぶ(page: Page, sel: string, label: string): Promise<void> {
  const row = page.locator(sel).locator("xpath=ancestor::label[1]").filter({ hasText: new RegExp(`^\\s*${label}\\s*$`) });
  await expect(row, `「${label}」の選択肢`).toHaveCount(1, { timeout: 30_000 });
  const radio = row.locator(sel);
  if (await radio.isChecked()) return;
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), radio.check({ force: true, timeout: 30_000 })]);
  await page.waitForLoadState("load");
}
const checkedLabel = async (page: Page, sel: string) => (await page.locator(`${sel}:checked`).evaluateAll((ns) => ns.map((n) => ((n as HTMLInputElement).closest("label")?.textContent ?? "").replace(/\s+/g, " ").trim())))[0] ?? "";
const reload = async (page: Page) => { await page.reload(); await page.waitForLoadState("load"); };

caseTest("IT-F04-02-021", async ({ page, step, expected }) => {
  await login(page, "S-F04-02-PICKUP-021");
  const sp = new ShoppingPage(page);
  const seen: Record<string, { 備考: boolean; 問合せ: boolean; 当日: boolean }> = {};
  const read = async (k: string) => { seen[k] = { 備考: await message(page).isVisible(), 問合せ: await contact(page).first().isVisible(), 当日: await sameday(page).first().isVisible() }; };
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await 選ぶ(page, DELIVERY, "店頭受取"); });
  await step(3, async () => { await reload(page); await read("店頭受取"); });
  await step(4, async () => { await 選ぶ(page, DELIVERY, "スムーズ店頭受取"); });
  await step(5, async () => { await reload(page); await read("スムーズ店頭受取"); });
  await expected(async () => {
    for (const k of ["店頭受取", "スムーズ店頭受取"]) {
      expect.soft(seen[k]?.備考, `${k}: 備考欄が表示されている`).toBe(false);
      expect.soft(seen[k]?.問合せ, `${k}: お問合せフォームはこちらエリアが表示されている`).toBe(true);
      expect.soft(seen[k]?.当日, `${k}: 当日中に受け取りますチェックボックスが表示されている`).toBe(true);
    }
  });
});

caseTest("IT-F04-02-022", async ({ page, step, expected }) => {
  await login(page, "S-F04-02-EC-022");
  const sp = new ShoppingPage(page);
  let r = { 備考: false, 問合せ: true };
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await 選ぶ(page, DELIVERY, "ゆうパック"); });
  await step(3, async () => { await reload(page); r = { 備考: await message(page).isVisible(), 問合せ: await contact(page).first().isVisible() }; });
  await expected(async () => {
    expect.soft(r.備考, "備考欄が表示されている").toBe(true);
    expect.soft(r.問合せ, "お問合せフォームはこちらエリアが表示されている").toBe(false);
  });
});

caseTest("IT-F04-02-031", async ({ page, step, expected }) => {
  await login(page, "S-F04-02-EC-031");
  const sp = new ShoppingPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  let before = "";
  await step(2, async () => { await 選ぶ(page, DELIVERY, "ゆうパケット"); before = await checkedLabel(page, DELIVERY); await 選ぶ(page, DELIVERY, "ゆうパック"); });
  await expected(async () => {
    expect.soft(before, "変更前の配送方法").toBe("ゆうパケット");
    expect.soft(sp.パス, "再読み込みされたご注文方法指定画面").toBe("/ja/shopping");
    expect.soft(await checkedLabel(page, DELIVERY), "選択中の配送方法").toBe("ゆうパック");
  });
});

caseTest("IT-F04-02-034", async ({ page, step, expected }) => {
  await login(page, "S-F04-02-EC-034");
  const sp = new ShoppingPage(page);
  let d = "(欄なし)"; let t = "(欄なし)";
  await step(1, async () => { await sp.買い物かごから開く(); });
  const sel = (n: string) => page.locator(`select[name$="[${n}]"]`).first();
  await step(2, async () => {
    const lab = async (n: string) => ((await sel(n).count()) > 0 ? ((await sel(n).locator("option:checked").innerText()) ?? "").trim() : "(欄なし)");
    d = await lab("shipping_delivery_date"); t = await lab("DeliveryTime");
  });
  await expected(async () => {
    expect.soft(d, "配送希望日の初期値").toBe("指定なし");
    expect.soft(t, "お届け時間の初期値").toBe("指定なし");
  });
});

/** 開発者ツールで選択を解除して注文を確定しようとする（037・064） */
function 解除して確定(seed: string, sel: string): (c: Parameters<Parameters<typeof caseTest>[1]>[0]) => Promise<void> {
  return async ({ page, step, expected }) => {
    await login(page, seed);
    const sp = new ShoppingPage(page);
    await step(1, async () => { await sp.買い物かごから開く(); });
    await step(2, async () => { await page.locator(sel).evaluateAll((ns) => ns.forEach((n) => { (n as HTMLInputElement).checked = false; })); });
    await step(3, async () => { await page.locator('input[name="_shopping_order[accept_order]"]').check({ force: true, timeout: 20_000 }); });
    await step(4, async () => {
      // 開発者ツールからの送信なので、ブラウザの入力チェック（必須の選択）は外して送る
      await page.locator("button[data-js-payment-submit]").evaluate((b) => { (b as HTMLButtonElement).disabled = false; b.closest("form")?.setAttribute("novalidate", ""); document.querySelectorAll("[required]").forEach((e) => e.removeAttribute("required")); });
      await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 90_000 }), page.locator("button[data-js-payment-submit]").click({ timeout: 20_000 })]);
      await page.waitForLoadState("load");
    });
    await expected(async () => {
      expect.soft(sp.パス.includes("/shopping/complete"), "購入完了画面へ進んでいる").toBe(false);
      await expect(page.locator("h1").first(), "ご注文方法指定画面の見出し（再描画）").toContainText("注文方法の指定");
    });
  };
}
caseTest("IT-F04-02-037", 解除して確定("S-F04-02-EC-037", DELIVERY));
caseTest("IT-F04-02-064", 解除して確定("S-F04-02-EC-064", PAYMENT));

caseTest("IT-F04-02-061", async ({ page, step, expected }) => {
  await login(page, "S-F04-02-EC-061");
  const sp = new ShoppingPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await 選ぶ(page, PAYMENT, "銀行振込"); await 選ぶ(page, PAYMENT, "郵便振替"); });
  await expected(async () => {
    expect.soft(sp.パス, "再表示されたご注文方法指定画面").toBe("/ja/shopping");
    expect.soft(await checkedLabel(page, PAYMENT), "選択中の支払方法").toBe("郵便振替");
  });
});

caseTest("IT-F04-02-063", async ({ page, notes, step, expected }) => {
  await login(page, "S-F04-02-EC-063");
  const sp = new ShoppingPage(page);
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await message(page).fill("F04-02備考更新", { timeout: 20_000 }); });
  await step(3, async () => { await 選ぶ(page, PAYMENT, "銀行振込"); await 選ぶ(page, PAYMENT, "郵便振替"); });
  let saved = "";
  await step(4, async () => { saved = 受注の備考(notes.get("〔受注ID-F0402-063〕")); });
  await expected(async () => {
    expect(saved, "受注の備考欄").toBe("F04-02備考更新");
  });
});

caseTest("IT-F04-02-065", async ({ page, step, expected }) => {
  await login(page, "S-F04-02-EC-065");
  const sp = new ShoppingPage(page);
  const notice = page.locator("#notice-creditcard-payment");
  let credit = false; let bank = true;
  await step(1, async () => { await sp.買い物かごから開く(); });
  await step(2, async () => { await 選ぶ(page, PAYMENT, "クレジットカード決済"); });
  await step(3, async () => { credit = await page.locator("#about-3dsv2").isVisible(); });
  await step(4, async () => { await 選ぶ(page, PAYMENT, "銀行振込"); });
  await step(5, async () => { bank = await page.locator("#about-3dsv2").isVisible(); });
  void notice;
  await expected(async () => {
    expect.soft(credit, "クレジットカード決済で本人認証サービスリンクが表示されている").toBe(true);
    expect.soft(bank, "銀行振込で本人認証サービスリンクが表示されている").toBe(false);
  });
});
