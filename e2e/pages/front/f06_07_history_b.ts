/** F06-07 購入履歴詳細の表示の読み取り（-b）。セレクタはここだけに書く */
import { Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { HistoryDetailPage } from "./f06_07_history";

export class HistoryDetailViewPage extends HistoryDetailPage {
  constructor(page: Page) { super(page); }
  get path(): string { return new URL(this.page.url()).pathname; }
  /** 画面の本文（見出しの下）の文字 */
  async 本文(): Promise<string> { return (await this.page.locator("main, #main, .p-hareruya-history-detail").first().innerText()).replace(/\s+/g, " ").trim(); }
  /** 項目名（dt）に一致する行の値（dd）。無ければ null */
  async 項目の値(項目名: string): Promise<string | null> {
    const row = this.page.locator(".p-hareruya-history-detail__order-info-row").filter({ has: this.page.locator("dt", { hasText: new RegExp(`^\\s*${項目名}\\s*$`) }) });
    if ((await row.count()) === 0) return null;
    return (await row.first().locator("dd").innerText()).replace(/\s+/g, " ").trim();
  }
  get 領収書発行リンク(): Locator { return this.page.getByRole("link", { name: "領収書発行" }); }
  get マイページへ戻る(): Locator { return this.page.getByRole("link", { name: "マイページへ戻る" }); }
  get 送り主欄(): Locator { return this.page.locator("address.p-hareruya-history-detail__sender").first(); }
  get お届け先欄(): Locator { return this.page.locator("address.p-hareruya-history-detail__receiver").first(); }
  async 押して遷移する(l: Locator): Promise<void> {
    await l.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const nav = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 });
    try { await l.click({ timeout: 10_000 }); } catch { await l.dispatchEvent("click"); }
    await nav;
    await this.page.waitForLoadState("load");
  }
  async 直接開く(注文ID: string): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}/ja/mypage/shopping_history_detail/${注文ID}`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
}
