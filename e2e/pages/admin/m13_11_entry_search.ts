/** M13-11 イベント申込登録（検索入力）の画面操作。セレクタはここだけに書く */
import { Locator, Page, expect } from "@playwright/test";
import { adminUrl } from "../../lib/session";

export class EntrySearchPage {
  constructor(readonly page: Page) {}
  get 検索イベント名() { return this.page.locator('#search_form [name="admin_search_event[multi]"]'); }
  get 店舗() { return this.page.locator("#admin_search_event_base_info"); }
  get 開催日From() { return this.page.locator('#search_form [name="admin_search_event[start_date_from]"]'); }
  get 開催日To() { return this.page.locator('#search_form [name="admin_search_event[start_date_to]"]'); }
  get 結果の行() { return this.page.locator("table.table tbody tr"); }

  async 開く(): Promise<void> {
    await this.page.goto(adminUrl("/entry_registration"));
    await this.page.waitForLoadState("load");
    await expect(this.検索イベント名, "イベント申込登録(検索入力)の検索イベント名の欄").toBeVisible();
  }
  async 日付を入れる(欄: Locator, 値: string): Promise<void> {
    if (値 === "") { await 欄.fill(""); return; }
    const type = await 欄.getAttribute("type");
    await 欄.fill(type === "date" ? 値.replace(/\//g, "-") : 値);
  }
  async 日付の値(欄: Locator): Promise<string> { return (await 欄.inputValue()).replace(/-/g, "/"); }
  /** 店舗を選ぶ。空の配列は「全店舗」（指定なし） */
  async 店舗を選ぶ(店舗名: string[]): Promise<void> {
    await this.店舗.selectOption(店舗名.map((label) => ({ label })));
    await this.店舗.evaluate((el) => { const j = (window as unknown as { jQuery?: (e: Element) => { trigger: (n: string) => void } }).jQuery; if (j) j(el).trigger("change"); });
  }
  async 選ばれている店舗(): Promise<string[]> {
    return this.店舗.evaluate((el) => [...(el as HTMLSelectElement).selectedOptions].map((o) => (o.textContent ?? "").trim()).filter(Boolean));
  }
  async 検索する(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.page.locator("#search_form button[type='submit']").click()]);
  }
  /** 開催日を空にして、店舗と検索イベント名で検索する */
  async 条件を入れて検索する(店舗名: string[], 語: string, from = "", to = ""): Promise<void> {
    await this.店舗を選ぶ(店舗名);
    await this.日付を入れる(this.開催日From, from);
    await this.日付を入れる(this.開催日To, to);
    await this.検索イベント名.fill(語);
    await this.検索する();
  }
  /** 結果表に出ているイベントID（行を束ねた先頭の欄） */
  async 表示されたイベントID(): Promise<string[]> {
    return (await this.結果の行.locator("td[rowspan]:first-child").allInnerTexts()).map((t) => t.trim()).filter((t) => /^\d+$/.test(t));
  }
  /** 「新規登録」ボタンの行き先の日程ID（上から） */
  async 新規登録ボタンの日程ID(): Promise<string[]> {
    const hrefs = await this.page.locator('table.table a[href*="/entry_registration/new/"]').evaluateAll((as) => as.map((a) => (a as HTMLAnchorElement).getAttribute("href") ?? ""));
    return hrefs.map((h) => /new\/(\d+)/.exec(h)?.[1] ?? "");
  }
  async 結果の表が表示されている(): Promise<boolean> { return (await this.結果の行.count()) > 0; }
  /** 結果表の日程の行数（1行＝1日程。新規登録ボタンの有無に関わらず数える） */
  async 日程の行数(): Promise<number> { return this.結果の行.count(); }
  日程の行(日程ID: string): Locator {
    return this.page.locator("table.table tbody tr").filter({ has: this.page.locator(`a[href$="/entry_registration/new/${日程ID}"]`) });
  }
  async ページを選ぶ(n: number): Promise<void> {
    await this.page.locator(".pagination").getByRole("link", { name: String(n), exact: true }).click({ timeout: 30_000 });
    await this.page.waitForLoadState("load");
  }
}
