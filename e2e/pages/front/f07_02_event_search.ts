/** F07-02 大会詳細検索（フロント。アドレスは /ja/events/list）の操作と読み取り */
import { Locator, Page, expect } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export type 条件 = { キーワード?: string; 下限?: string; 上限?: string; 平日?: boolean; 休日?: boolean; 過去?: boolean; 大型?: boolean; 無料?: boolean; カテゴリ?: ("beginner" | "casual" | "competitive" | "reservation")[] };

const ID: Record<string, string> = { 平日: "event-search-weekday", 休日: "event-search-holiday", 過去: "event-search-allow-past", 大型: "event-search-is-large", 無料: "event-search-is-free" };

export class EventSearchPage {
  constructor(readonly page: Page) {}
  async open(query = ""): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}/ja/events/list${query ? `?${query}` : ""}`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  get モーダル(): Locator { return this.page.locator('[data-modal="event-search"]'); }
  async モーダルを開く(): Promise<void> {
    await this.page.locator('[data-modal-open="event-search"]:visible').first().click({ timeout: 20_000 });
    await expect(this.モーダル, "詳細検索モーダル").toHaveClass(/is-visible/, { timeout: 20_000 });
  }
  /** 検索条件の欄を、書いた項目だけ設定する（チェック欄は、書いた値の状態にする） */
  async 条件を入れる(c: 条件): Promise<void> {
    const m = this.モーダル;
    if (c.キーワード !== undefined) await m.locator('input[name="term"]').fill(c.キーワード, { timeout: 20_000 });
    // 開催日時の欄は読み取り専用（カレンダーから選ぶ）。選んだのと同じ値を、欄へ直接入れる
    for (const [name, v] of [["from", c.下限], ["to", c.上限]] as const) {
      if (v !== undefined) await m.locator(`input[name="${name}"]`).evaluate((e, x) => { (e as HTMLInputElement).value = x; e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true })); }, v);
    }
    for (const [k, id] of Object.entries(ID)) {
      const want = (c as Record<string, boolean | undefined>)[k];
      if (want === undefined) continue;
      await this.チェックにする(id, want);
    }
    for (const cat of c.カテゴリ ?? []) await this.チェックにする(`event-search-category-${cat}`, true);
  }
  private async チェックにする(id: string, on: boolean): Promise<void> {
    const box = this.モーダル.locator(`#${id}`);
    if ((await box.isChecked()) !== on) await this.モーダル.locator(`label[for="${id}"]`).click({ timeout: 20_000 });
    expect(await box.isChecked(), `チェック欄 ${id}`).toBe(on);
  }
  async チェック状態(名: "平日" | "休日" | "過去" | "大型" | "無料"): Promise<boolean> { return this.モーダル.locator(`#${ID[名]}`).isChecked(); }
  /** 「検索」を押し、結果の画面が出るまで待つ。応答の状態を返す */
  async 検索する(): Promise<number> {
    const [res] = await Promise.all([
      this.page.waitForResponse((r) => r.request().isNavigationRequest() && r.url().includes("/events/list"), { timeout: 60_000 }),
      this.モーダル.locator("[data-search-submit]").click({ timeout: 20_000 }),
    ]);
    await this.page.waitForLoadState("load");
    return res.status();
  }
  /** 結果に出ている日程ID（上から） */
  async 結果の日程ID(): Promise<string[]> {
    const hrefs = await this.page.locator("a.p-hareruya-event-card__link").evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? ""));
    return hrefs.map((h) => /\/events\/(\d+)\/detail/.exec(h)?.[1] ?? h);
  }
  async 総件数の文字(): Promise<string> { return ((await this.page.locator(".p-hareruya-event-list__result-count").first().textContent()) ?? "").trim(); }
  get 結果なしの表示(): Locator { return this.page.locator(".p-hareruya-event-list__result-none"); }
}
