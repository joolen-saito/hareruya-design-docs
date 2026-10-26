/** M03-25 重複商品コード確認（確認前の画面）の画面操作 */
import { expect, Locator, Page } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export class DoublingCheckPage {
  /** 画面の本体（管理画面の共通の枠・上部の帯・左のメニューを除いた部分） */
  readonly 本体: Locator;
  readonly 重複確認する: Locator;

  constructor(readonly page: Page) {
    this.本体 = page.locator(".c-contentsArea__cols");
    this.重複確認する = this.本体.getByRole("link", { name: "重複確認する" });
  }

  /** 左のメニューの「商品管理」→「重複商品コード確認」から開く */
  async openFromMenu(): Promise<void> {
    await this.page.goto(adminUrl("/product"));
    const menu = this.page.locator('#nav-product a[href$="/product/pre_doubling_check"]');
    if (!(await menu.isVisible())) await this.page.locator('a[href="#nav-product"]').click();
    await expect(menu, "左のメニューの「重複商品コード確認」").toBeVisible();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), menu.click()]);
  }

  /** 画面の本体にある、利用者が入力・選択できる欄（隠し項目を除く）の数と種類 */
  async 入力欄(): Promise<string[]> {
    return this.本体.locator("input:not([type=hidden]), select, textarea").evaluateAll((nodes) => nodes
      .filter((n) => (n as HTMLElement).offsetParent !== null)
      .map((n) => `${n.tagName.toLowerCase()}${(n as HTMLInputElement).type ? `[type=${(n as HTMLInputElement).type}]` : ""}${(n as HTMLInputElement).name ? `[name=${(n as HTMLInputElement).name}]` : ""}`));
  }
}
