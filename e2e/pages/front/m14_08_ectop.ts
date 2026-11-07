/** M14-08 公開側のECTOP画面のカードセット選択メニュー（ヘッダーの検索欄）。セレクタはここだけ */
import { Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export class EctopCardsetMenu {
  constructor(readonly page: Page) {}
  /** 本店の日本語版PC画面でECTOP画面を開く */
  async 開く(): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}/ja/`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  get ボタン(): Locator { return this.page.locator("[data-search-category-toggle]:visible").first(); }
  get 表示中の名(): Locator { return this.page.locator("[data-search-category-text]:visible").first(); }
  async メニューを押す(): Promise<void> { await this.ボタン.click({ timeout: 20_000 }); }
  /** 選択肢の表示名（「カードセット」の見出し行を含む） */
  async 選択肢(): Promise<string[]> {
    return (await this.page.locator("[data-search-category-item]").evaluateAll((es) => es.map((e) => (e.textContent ?? "").trim())));
  }
  選択肢の行(名: string): Locator { return this.page.locator("[data-search-category-item]:visible").filter({ hasText: new RegExp(`^\\s*${名.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }); }
}
