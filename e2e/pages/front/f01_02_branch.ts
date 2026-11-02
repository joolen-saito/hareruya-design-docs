/** F01-02 支店ECTOP（フロントの支店トップページ）の操作。支店URLは /ja/<支店URL>/ */
import { Locator, Page, expect } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export class BranchTopPage {
  constructor(readonly page: Page) {}
  async open(支店URL: string): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}/ja/${支店URL}/`);
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  /** 見出し「今週の売れ筋商品」の区画 */
  get 今週の売れ筋(): Locator { return this.page.locator("section.p-hareruya-branch-top__best-sellers"); }
  /** 見出し「SALE中の商品」の区画 */
  get SALE中(): Locator { return this.page.locator("section.p-hareruya-section").filter({ has: this.page.getByRole("heading", { name: "SALE中の商品" }) }); }
  link(text: string): Locator { return this.page.getByRole("link", { name: text }); }
  async 開いている(): Promise<void> { await expect(this.page.locator("body.shop_top"), "支店ECTOPの画面").toBeAttached(); }
}
