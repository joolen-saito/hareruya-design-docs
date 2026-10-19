/**
 * 買取集計データ(検索入力)画面（メニュー「店頭買取管理」→「買取集計データ」）。
 * 部門の選択欄は複数選択で、画面では選択欄を飾る部品が重なって表示される。選択肢は元の選択欄の中にある。
 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export const buySummaryUrl = () => adminUrl("/otcbuyorder/summary");

export class BuySummarySearchPage {
  readonly 部門: Locator;
  readonly 小見出し: Locator;

  constructor(readonly page: Page) {
    this.部門 = page.locator('select[name="admin_otc_buy_order_summary[section][]"]');
    this.小見出し = page.locator(".c-pageTitle__subTitle");
  }

  async open(): Promise<void> {
    const res = await this.page.goto(buySummaryUrl());
    expect(res?.status() ?? 0, "買取集計データ(検索入力)画面の応答").toBeLessThan(400);
    await this.page.waitForLoadState("load");
    await expect(this.部門, "買取集計データ(検索入力)画面の部門の選択欄").toHaveCount(1);
  }

  /** 部門の選択欄の選択肢の名前（上から順） */
  async departmentChoices(): Promise<string[]> {
    return (await this.部門.locator("option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
  }
}
