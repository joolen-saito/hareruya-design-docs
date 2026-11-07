/** M14-10 フォーマットの設定が反映される公開側の画面（デッキ検索のトップ・イベント一覧）の操作と読み取り。セレクタはここだけ */
import { Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export const 前面 = (p: string): string => `${BASE_URL}/ja${p}`;

export class DeckSearchTop {
  constructor(readonly page: Page) {}
  async 開く(): Promise<number> {
    const res = await this.page.goto(前面("/deck/"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  /** 検索条件（デッキ詳細検索）のフォーマットの選択肢の表示名 */
  async 検索条件のフォーマット(): Promise<string[]> {
    return (await this.page.locator("form#search_block .deckSearch-top__format").evaluateAll((es) => es.map((e) => (e.closest("label")?.textContent ?? "").trim())));
  }
  /** フォーマットのメタゲームの区画（トップのランキング表示。メタゲームの画面へのリンクを持つ区画） */
  区画(フォーマットID: string): Locator {
    return this.page.locator(".deckSearch-top__metagame__wrapper").filter({ has: this.page.locator(`a[href$="/deck/${フォーマットID}/metagame/"]`) });
  }
  /** メタゲームの画面へのリンク（トップのどこかにあれば1以上） */
  メタ分布のリンク(フォーマットID: string): Locator { return this.page.locator(`a[href$="/deck/${フォーマットID}/metagame/"]`); }
  /** 採用デッキ数ランキングの行（アーキタイプ名とデッキ数） */
  ランキングの行(フォーマットID: string): Locator { return this.区画(フォーマットID).locator("a.deckSearch-top__archetype__link"); }
}

export class EventListFront {
  constructor(readonly page: Page) {}
  async 開く(): Promise<number> {
    const res = await this.page.goto(前面("/events/list"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  get モーダル(): Locator { return this.page.locator('[data-modal="event-search"]'); }
  async モーダルを開く(): Promise<void> {
    await this.page.locator('[data-modal-open="event-search"]:visible').first().click({ timeout: 20_000 });
    await this.モーダル.waitFor({ state: "visible", timeout: 20_000 });
  }
  /** 検索条件のフォーマットの選択肢の表示名 */
  async 検索条件のフォーマット(): Promise<string[]> {
    return this.モーダル.locator('input[name="formats[]"]').evaluateAll((es) => es.map((e) => (e.closest("label")?.textContent ?? "").trim()));
  }
  async フォーマットを選ぶ(表示名: string): Promise<void> {
    const box = this.モーダル.locator("label").filter({ has: this.page.locator('input[name="formats[]"]') }).filter({ hasText: 表示名 }).first();
    await box.click({ timeout: 20_000 });
  }
  async 検索する(): Promise<void> {
    await Promise.all([
      this.page.waitForResponse((r) => r.request().isNavigationRequest() && r.url().includes("/events/list"), { timeout: 60_000 }),
      this.モーダル.locator("[data-search-submit]").click({ timeout: 20_000 }),
    ]);
    await this.page.waitForLoadState("load");
  }
  /** いまのページに出ているイベント名 */
  async 表示中のイベント名(): Promise<string[]> {
    return (await this.page.locator("p.p-hareruya-event-card__title").allInnerTexts()).map((t) => t.trim());
  }
  /** 次のページが無くなるまで（または上限まで）たどって、出ているイベント名を集める */
  async 全ページのイベント名(上限 = 8): Promise<string[]> {
    const out: string[] = [];
    for (let i = 0; i < 上限; i++) {
      out.push(...(await this.表示中のイベント名()));
      const next = this.page.locator("li.p-hareruya-pagination__item--next a");
      if ((await next.count()) === 0) break;
      await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), next.first().click({ timeout: 20_000 })]);
    }
    return out;
  }
}
