/**
 * F04-02 同梱の表示・国外配送の選択肢・支店の配送方法（共有の設定は書き換えず、成り立っていることをDBの参照で確かめるケース）。
 * 正本: cases/F04-02_test_cases.tsv
 */
import { Page } from "@playwright/test";
import { expect, caseTest, CaseCtx } from "../../lib/case";
import { frontLogin } from "../../pages/admin/m04_19_order_shortage";
import { ShoppingPage } from "../../pages/front/f04_shopping";
import { 同梱の状態の } from "../../seeds/f04-02-e";

const login = async (page: Page, seedId: string) => { await frontLogin(page, 同梱の状態の(seedId).会員); };
const reload = async (page: Page) => { await page.reload(); await page.waitForLoadState("load"); };

/** ご注文方法指定画面を開いて配送方法指定欄を確認し、同梱が表示されるかを確かめる */
function 同梱の表示(seedId: string, 表示される: boolean, 説明: string) {
  return async ({ page, step, expected }: CaseCtx) => {
    await login(page, seedId);
    const sp = new ShoppingPage(page);
    let names: string[] = [];
    await step(1, async () => { await sp.買い物かごから開く(); });
    await step(2, async () => { await expect(sp.配送方法の欄, "配送方法指定欄").toBeVisible({ timeout: 30_000 }); names = await sp.配送方法の名前(); });
    await expected(async () => {
      expect.soft(names.includes("同梱"), `配送方法指定欄に同梱が表示される（${説明}）`).toBe(表示される);
    });
  };
}
caseTest("IT-F04-02-026", 同梱の表示("S-F04-02-BUNDLE-POSTAL-026", true, "郵便振替の注文受領の受注がある"));
caseTest("IT-F04-02-028", 同梱の表示("S-F04-02-BUNDLE-CREDIT-028", false, "既存受注の支払方法がクレジットカード決済"));
caseTest("IT-F04-02-084", 同梱の表示("S-F04-02-BUNDLE-OLDSTATUS-084", false, "既存受注が発送済みだけ"));
caseTest("IT-F04-02-100", 同梱の表示("S-F04-02-BUNDLE-MIXED-OK-100", true, "発送済みのほかに注文受領・銀行振込の受注がある"));
caseTest("IT-F04-02-101", 同梱の表示("S-F04-02-BUNDLE-SPLIT-101", false, "ステータスと支払方法の条件を同じ受注が満たさない"));
caseTest("IT-F04-02-142", 同梱の表示("S-F04-02-CBBUNDLEVIEW-142", true, "注文受領・銀行振込の受注がある"));
caseTest("IT-F04-02-143", 同梱の表示("S-F04-02-CBBUNDLEVIEW-143", false, "既存受注の支払方法がクレジットカード決済"));
caseTest("IT-F04-02-144", 同梱の表示("S-F04-02-CBBUNDLEVIEW-144", false, "既存受注が発送済み"));
caseTest("IT-F04-02-145", 同梱の表示("S-F04-02-CBBUNDLEVIEW-145", false, "既存受注が発送済み・クレジットカード決済"));

/** 国外のお届け先を選んで配送方法指定欄を確認し、EMS と Small packet だけが選べて同梱が無いことを確かめる */
function 国外の配送方法(seedId: string, 配送先名称: string) {
  return async ({ page, step, expected }: CaseCtx) => {
    await login(page, seedId);
    const sp = new ShoppingPage(page);
    let names: string[] = [];
    await step(1, async () => { await sp.買い物かごから開く(); });
    await step(2, async () => { await sp.お届け先を選ぶ(配送先名称); });
    await step(3, async () => { await reload(page); await expect(sp.配送方法の欄, "配送方法指定欄").toBeVisible({ timeout: 30_000 }); names = await sp.配送方法の名前(); });
    await expected(async () => {
      expect.soft([...names].sort(), "配送方法指定欄の選択肢（EMS と Small packet の2つだけ）").toEqual(["EMS", "Small packet"]);
      expect.soft(names.includes("同梱"), "同梱が表示されない").toBe(false);
    });
  };
}
caseTest("IT-F04-02-146", 国外の配送方法("S-F04-02-CBBUNDLEVIEW-146", "海外F0402-CB146"));
caseTest("IT-F04-02-147", 国外の配送方法("S-F04-02-CBBUNDLEVIEW-147", "海外F0402-CB147"));
caseTest("IT-F04-02-148", 国外の配送方法("S-F04-02-CBBUNDLEVIEW-148", "海外F0402-CB148"));
caseTest("IT-F04-02-149", 国外の配送方法("S-F04-02-CBBUNDLEVIEW-149", "海外F0402-CB149"));

/** 支店（TC大阪）のご注文方法指定画面で、店舗受取だけが表示され同梱が表示されないことを確かめる */
function 支店の配送方法(seedId: string) {
  return async ({ page, step, expected }: CaseCtx) => {
    await login(page, seedId);
    const sp = new ShoppingPage(page);
    let names: string[] = [];
    await step(1, async () => { await sp.買い物かごから開く(同梱の状態の(seedId).店舗ページ); });
    await step(2, async () => { await expect(sp.配送方法の欄, "配送方法指定欄").toBeVisible({ timeout: 30_000 }); names = await sp.配送方法の名前(); });
    await expected(async () => {
      expect.soft(names, "配送方法指定欄の選択肢（店舗受取だけ）").toEqual(["店舗受取"]);
      expect.soft(names.includes("同梱"), "同梱が表示されない").toBe(false);
    });
  };
}
caseTest("IT-F04-02-150", 支店の配送方法("S-F04-02-CBBUNDLEBRANCH-150"));
caseTest("IT-F04-02-151", 支店の配送方法("S-F04-02-CBBUNDLEBRANCH-151"));
caseTest("IT-F04-02-152", 支店の配送方法("S-F04-02-CBBUNDLEBRANCH-152"));
caseTest("IT-F04-02-153", 支店の配送方法("S-F04-02-CBBUNDLEBRANCH-153"));
