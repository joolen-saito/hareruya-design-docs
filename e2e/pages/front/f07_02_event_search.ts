/** F07-02 大会詳細検索（フロント。アドレスは /ja/events/list）の操作と読み取り */
import { Locator, Page, expect } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export type 条件 = { キーワード?: string; 下限?: string; 上限?: string; 平日?: boolean; 休日?: boolean; 過去?: boolean; 大型?: boolean; 無料?: boolean; カテゴリ?: ("beginner" | "casual" | "competitive" | "reservation")[]; フォーマットID?: string[]; 会場ID?: string[] };

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
    for (const id of c.フォーマットID ?? []) await this.チェックにする(`event-search-format-${id}`, true);
    for (const id of c.会場ID ?? []) await this.チェックにする(`event-search-venue-${id}`, true);
  }
  /** 詳細検索の「クリア」ボタンを押す（画面側が次の描画で欄を空にするので、少し待つ） */
  async クリアする(): Promise<void> {
    await this.モーダル.locator("[data-search-clear]").click({ timeout: 20_000 });
    await this.page.waitForTimeout(500);
  }
  /** 詳細検索のフォーマット・開催場所の選択肢（並び順のまま。値は番号） */
  async フォーマットの選択肢(): Promise<{ id: string; 名前: string }[]> { return this.選択肢("format"); }
  async 会場の選択肢(): Promise<{ id: string; 名前: string }[]> { return this.選択肢("venue"); }
  private async 選択肢(kind: "format" | "venue"): Promise<{ id: string; 名前: string }[]> {
    return this.モーダル.locator(`label[for^="event-search-${kind}-"]`).evaluateAll((ls, k) => ls.map((l) => ({
      id: (l.getAttribute("for") ?? "").replace(`event-search-${k}-`, ""), 名前: (l.textContent ?? "").replace(/\s+/g, " ").trim(),
    })), kind);
  }
  async 入力欄の文字(name: "term" | "from" | "to"): Promise<string> { return this.モーダル.locator(`input[name="${name}"]`).inputValue(); }
  async チェックされた選択肢(kind: "format" | "venue" | "category"): Promise<string[]> {
    return this.モーダル.locator(`input[name="${kind === "format" ? "formats" : kind === "venue" ? "venues" : "categories"}[]"]:checked`).evaluateAll((es) => es.map((e) => (e as HTMLInputElement).value));
  }
  /** 検索条件のボタン（チップ）の文字（左から） */
  async チップの文字(): Promise<string[]> {
    return (await this.page.locator("a.c-hareruya-tag--keyword-event .c-hareruya-tag__text").allInnerTexts()).map((t) => t.trim());
  }
  /** 検索条件のボタン（チップ）の「×」を押す（ボタンの名前＝「◯◯ を検索条件から外す」） */
  async チップを外す(ラベル: string): Promise<void> {
    await Promise.all([
      this.page.waitForResponse((r) => r.request().isNavigationRequest() && r.url().includes("/events/list"), { timeout: 60_000 }),
      this.page.locator(`a.c-hareruya-tag--keyword-event[aria-label="${ラベル} を検索条件から外す"]`).click({ timeout: 20_000 }),
    ]);
    await this.page.waitForLoadState("load");
  }
  /** 結果の日程のカード（日程IDで探す） */
  カード(日程ID: string): Locator {
    return this.page.locator("li.p-hareruya-event-card__item").filter({ has: this.page.locator(`a.p-hareruya-event-card__link[href$="/events/${日程ID}/detail"]`) });
  }
  async カードの文字(日程ID: string): Promise<string> { return ((await this.カード(日程ID).innerText()) ?? "").replace(/\s+/g, " ").trim(); }
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
