/** M05-11 受注情報編集（受注商品情報の価格帯・Foil・フレーム・状態EX・商品名のリンク）。正本: cases/M05-11_test_cases.tsv */
import { Browser, Page, test } from "@playwright/test";
import { caseTest, expect } from "../../lib/case";
import { loginAdmin } from "../../lib/session";
import { rc } from "../../lib/run_marker";
import { OrderEditPage, 明細行 } from "../../pages/admin/m05_11_order_edit";
import { 明細のコード } from "../../seeds/m05-11-l";
import { M0511_ADMIN_A, 店舗Aの店名 } from "../../seeds/m05-11";

const NO = "〔受注番号-M0511-共有PRODUCT〕";
// 共有シード（カード詳細4件・商品5点・EXの規格・在庫承認・注文）の作成に30分以上かかるので、この spec の制限時間を90分にする
test.beforeEach(async ({}, testInfo) => { testInfo.setTimeout(5_400_000); });
async function 開く(browser: Browser, page: Page, no: string): Promise<OrderEditPage> {
  const p = new OrderEditPage(page);
  await p.openByOrderNo(no, await 店舗Aの店名(browser));
  return p;
}

caseTest("IT-M05-11-078", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  let 区分: Record<string, string> = {};
  await step(1, async () => { await 開く(browser, page, notes.get(NO)); });
  await step(2, async () => {
    // 受注商品情報の表を上から順に読み、価格帯の見出しの行と商品の行から、商品ごとの区分を求める
    const rows = await page.locator("#table-form-field tr").evaluateAll((trs) => trs.map((tr) => ({
      item: tr.classList.contains("item_box"),
      text: (tr.textContent ?? "").replace(/\s+/g, " ").trim(),
      code: tr.querySelector("span.product-code")?.textContent?.trim() ?? "",
    })));
    let heading = "";
    for (const r of rows) {
      if (r.item) { if (r.code) 区分[r.code] = heading; } else if (/円/.test(r.text) && r.text.length < 40) heading = r.text;
    }
  });
  await expected(async () => {
    const h = (i: number) => 区分[rc(明細のコード[i])] ?? "（見つからない）";
    expect.soft([h(0), h(1)].every((x) => /0円.*980円未満/.test(x)), `価格0・979の商品の区分: ${h(0)} / ${h(1)}`).toBe(true);
    expect.soft([h(2), h(3)].every((x) => /980円.*4,?800円未満/.test(x)), `価格980・4799の商品の区分: ${h(2)} / ${h(3)}`).toBe(true);
    expect.soft(/4,?800円以上/.test(h(4)), `価格4800の商品の区分: ${h(4)}`).toBe(true);
  });
});

caseTest("IT-M05-11-079", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  const n: Record<string, { foil: number; frame: number; ex: number }> = {};
  await step(1, async () => { await 開く(browser, page, notes.get(NO)); });
  await step(2, async () => {
    for (const c of 明細のコード) {
      const row = 明細行(page, rc(c));
      n[c] = { foil: await row.locator(".foil-badge").count(), frame: await row.locator(".frame-badge").count(), ex: await row.locator(".condition-badge-EX").count() };
    }
  });
  await expected(async () => {
    const [p1, p2, p3, p4, p5] = 明細のコード.map((c) => n[c]);
    expect.soft([p1.foil > 0, p2.foil > 0, p3.foil > 0, p4.foil > 0, p5.foil > 0], "Foil の表示（Foil・特殊Foil の商品だけ）").toEqual([true, false, true, false, false]);
    expect.soft([p1.frame > 0, p2.frame > 0, p3.frame > 0, p4.frame > 0, p5.frame > 0], "フレームの表示（特殊フレームの商品だけ）").toEqual([false, false, false, true, false]);
    expect.soft([p1.ex > 0, p2.ex > 0, p3.ex > 0, p4.ex > 0, p5.ex > 0], "状態EXのアイコン（EXの商品だけ）").toEqual([false, false, false, false, true]);
  });
});

caseTest("IT-M05-11-081", async ({ page, browser, notes, step, expected }) => {
  await loginAdmin(page, M0511_ADMIN_A);
  await step(1, async () => { await 開く(browser, page, notes.get(NO)); });
  await step(2, async () => {
    const link = 明細行(page, rc(明細のコード[0])).locator('a[href*="/product/product/"]').first();
    const [popup] = await Promise.all([page.context().waitForEvent("page", { timeout: 30_000 }).catch(() => null), link.click({ timeout: 20_000 })]);
    if (popup) { await popup.waitForLoadState("load"); await page.goto(popup.url()); await popup.close(); } else await page.waitForLoadState("load");
  });
  await expected(async () => { expect.soft(new URL(page.url()).pathname, "遷移先（商品の商品編集画面）").toMatch(/\/product\/product\/\d+\/edit$/); });
});
