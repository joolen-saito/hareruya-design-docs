/** M05-26 の確認で使う、フロントのマイページの購入履歴・購入履歴詳細（出荷日の表示） */
import { expect, Page } from "@playwright/test";
import { frontLogin } from "../admin/m04_19_order_shortage";

export class 購入履歴の出荷日Page {
  constructor(private readonly page: Page) { page.setDefaultTimeout(60_000); }

  /** フロントにログインし、マイページの「購入履歴」を押して購入履歴一覧画面を開く */
  async ログインして購入履歴を開く(m: { メール: string; パスワード: string }): Promise<void> {
    await frontLogin(this.page, m);
    const link = this.page.locator('a[href$="/mypage/shopping_history"]:visible').first();
    await expect(link, "マイページの「購入履歴」").toBeVisible();
    await Promise.all([this.page.waitForURL(/\/mypage\/shopping_history/), link.click()]);
    await this.page.waitForLoadState("load");
  }

  /** 注文番号の行の「詳細を見る」を押して購入履歴詳細画面を開く */
  async 詳細を開く(注文番号: string): Promise<void> {
    const box = this.page.locator(".p-hareruya-history-list__box").filter({ hasText: 注文番号 }).first();
    await expect(box, `購入履歴一覧の注文番号 ${注文番号} の行`).toBeVisible();
    await Promise.all([this.page.waitForURL(/\/mypage\/shopping_history_detail\//), box.getByRole("link", { name: "詳細を見る" }).first().click()]);
    await this.page.waitForLoadState("load");
  }

  /** 購入履歴詳細画面の出荷日欄の表示（空欄なら空文字） */
  async 出荷日欄(): Promise<string> {
    const row = this.page.locator(".p-hareruya-history-detail__order-info-row").filter({ has: this.page.locator("dt", { hasText: /^\s*出荷日\s*$/ }) });
    await expect(row.first(), "購入履歴詳細の出荷日の行").toBeVisible();
    return ((await row.first().locator("dd").innerText()) ?? "").replace(/\s+/g, " ").trim();
  }

  /** 購入履歴詳細画面を開き直す */
  async 開き直す(): Promise<void> {
    await this.page.reload();
    await this.page.waitForLoadState("load");
  }
}
