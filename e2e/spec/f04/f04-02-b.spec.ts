/** F04-02 複数配送設定（店舗基本設定＝共有の設定）を切り替えるケース。ケースの開始時に設定し、終わりに元の値へ戻してDBの参照で一致を確かめる。正本: cases/F04-02_test_cases.tsv */
import { test, Browser, Page } from "@playwright/test";
import { expect, caseTest, CaseBody } from "../../lib/case";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { 複数配送を元へ戻す, 複数配送を設定する } from "../../pages/admin/f04_multi_shipping";
import { ShoppingPage } from "../../pages/front/f04_shopping";
import { 処理中受注ID一覧 } from "../../db/f04_02";
import { 複数配送の状態の } from "../../seeds/f04-02-multi";

const note = (m: string) => { test.info().annotations.push({ type: "手順の注記", description: m }); };
const 案内領域 = (page: Page) => page.locator(".p-hareruya-cart__error, .p-hareruya-message-box--error, .p-hareruya-message-box--info, .p-hareruya-message-box").filter({ visible: true });

/** 設定を切り替えて本体を行い、必ず元の値へ戻す */
async function 設定のもとで(browser: Browser, on: boolean, body: () => Promise<void>): Promise<void> {
  const orig = await 複数配送を設定する(browser, on);
  note(`複数配送設定を${on ? "有効" : "無効"}にした（元の値は${orig ? "有効" : "無効"}。終わりに元へ戻してDBの参照で一致を確かめる）`);
  try { await body(); } finally { await 複数配送を元へ戻す(browser, orig); }
}

caseTest("IT-F04-02-007", async ({ page, browser, step, expected }) => {
  await 設定のもとで(browser, false, async () => {
    await frontLogin(page, 複数配送の状態の("S-F04-02-MULTI-OFF-007").会員);
    const sp = new ShoppingPage(page);
    await step(1, async () => { await sp.買い物かごから開く().catch(() => undefined); await page.waitForLoadState("load"); });
    await expected(async () => {
      expect(sp.パス, "遷移先の画面（買い物かご）").toBe("/ja/cart");
    });
  });
});

caseTest("IT-F04-02-008", async ({ page, browser, step, expected }) => {
  await 設定のもとで(browser, true, async () => {
    await frontLogin(page, 複数配送の状態の("S-F04-02-MULTI-ON-008").会員);
    const sp = new ShoppingPage(page);
    let first = 0; let again = 0;
    await step(1, async () => { await sp.買い物かごから開く(); });
    await step(2, async () => { first = await 案内領域(page).count(); });
    await step(3, async () => { await page.reload(); await page.waitForLoadState("load"); again = await 案内領域(page).count(); });
    await expected(async () => {
      expect.soft(first, "初回の案内領域の数（1以上＝表示）").toBeGreaterThan(0);
      expect.soft(again, "再読み込み後の案内領域の数（0＝表示されない）").toBe(0);
    });
  });
});

caseTest("IT-F04-02-095", async ({ page, browser, step, expected }) => {
  await 設定のもとで(browser, true, async () => {
    await frontLogin(page, 複数配送の状態の("S-F04-02-MULTI-ONE-095").会員);
    const sp = new ShoppingPage(page);
    let n = -1;
    await step(1, async () => { await sp.買い物かごから開く(); });
    await step(2, async () => { n = await 案内領域(page).count(); });
    await expected(async () => {
      expect(sp.パス, "表示中の画面（ご注文方法指定）").toBe("/ja/shopping");
      expect(n, "複数配送の案内領域の数（0＝表示されない）").toBe(0);
    });
  });
});

/** 166・173: 配送先1件（案内は表示対象でない）。複数配送の設定は 166=無効・173=有効 */
function 配送先1件(id: string, seed: string, on: boolean): CaseBody {
  return async ({ page, browser, notes, step, expected }) => {
    await 設定のもとで(browser, on, async () => {
      await frontLogin(page, 複数配送の状態の(seed).会員);
      const sp = new ShoppingPage(page);
      let n = -1; let orders: string[] = [];
      await step(1, async () => { await sp.買い物かごから開く(); });
      await step(2, async () => { n = await 案内領域(page).count(); });
      await step(3, async () => { orders = 処理中受注ID一覧(notes.get(`〔会員ID-F0402-${id}〕`)); });
      await expected(async () => {
        expect.soft(sp.パス, "表示された画面（買い物かごへ戻らずご注文方法指定）").toBe("/ja/shopping");
        expect.soft(orders.length, "会員の処理中受注の件数").toBe(1);
        expect.soft(n, "複数配送の案内領域の数（0＝表示されない）").toBe(0);
      });
    });
  };
}
caseTest("IT-F04-02-166", 配送先1件("166", "S-F04-02-CBMEMBEROFF1-166", false));
caseTest("IT-F04-02-173", 配送先1件("173", "S-F04-02-CBMEMBERON1-173", true));

caseTest("IT-F04-02-174", async ({ page, browser, notes, step, expected }) => {
  await 設定のもとで(browser, true, async () => {
    await frontLogin(page, 複数配送の状態の("S-F04-02-CBMEMBERONN-174").会員);
    const sp = new ShoppingPage(page);
    let first = 0; let again = 0; let orders: string[] = [];
    await step(1, async () => { await sp.買い物かごから開く(); });
    await step(2, async () => { first = await 案内領域(page).count(); });
    await step(3, async () => { await page.reload(); await page.waitForLoadState("load"); again = await 案内領域(page).count(); });
    await step(4, async () => { orders = 処理中受注ID一覧(notes.get("〔会員ID-F0402-174〕")); });
    await expected(async () => {
      expect.soft(orders.length, "会員の処理中受注の件数").toBe(1);
      expect.soft(first, "初回の案内領域の数（1以上＝表示）").toBeGreaterThan(0);
      expect.soft(again, "再読み込み後の案内領域の数（0＝表示されない）").toBe(0);
    });
  });
});

caseTest("IT-F04-02-175", async ({ page, browser, notes, step, expected }) => {
  await 設定のもとで(browser, false, async () => {
    await frontLogin(page, 複数配送の状態の("S-F04-02-CBMEMBEROFFN-175").会員);
    const sp = new ShoppingPage(page);
    let orders: string[] = [];
    await step(1, async () => { await sp.買い物かごから開く().catch(() => undefined); await page.waitForLoadState("load"); });
    await step(2, async () => { orders = 処理中受注ID一覧(notes.get("〔会員ID-F0402-175〕")); });
    await expected(async () => {
      expect.soft(sp.パス, "遷移先の画面（買い物かご）").toBe("/ja/cart");
      expect.soft(orders.length, "会員の処理中受注の件数").toBe(1);
    });
  });
});
