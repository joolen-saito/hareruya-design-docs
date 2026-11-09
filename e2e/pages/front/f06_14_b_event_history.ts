/** F06-14 マイイベント・デッキ登録（フロントのマイページ）の一覧の読み取り・操作（イベント行ごと）。セレクタ・アドレスはここだけに書く */
import { Locator, Page } from "@playwright/test";
import { EventHistoryPage } from "./f06_14_event_history";

const norm = (t: string): string => t.replace(/\s+/g, " ").trim();

export class マイイベント extends EventHistoryPage {
  get 行すべて(): Locator { return this.page.locator("article.p-hareruya-deckentry-list__card"); }
  /** イベント名（部分一致）の行 */
  行(名: string): Locator {
    return this.行すべて.filter({ has: this.page.locator(".p-hareruya-deckentry-list__card-title-link", { hasText: 名 }) });
  }
  async 表示されたイベント名(): Promise<string[]> {
    return (await this.page.locator(".p-hareruya-deckentry-list__card-title-link").allInnerTexts()).map(norm);
  }
  /** 一覧の件数ラベルの件数（「2件」の2）。ラベルが無ければ null */
  async 件数ラベル(): Promise<number | null> {
    const l = this.page.locator(".p-hareruya-toolbar__count span");
    if ((await l.count()) === 0) return null;
    const m = /(\d+)/.exec(await l.first().innerText());
    return m ? Number(m[1]) : null;
  }
  get 見出し行(): Locator { return this.page.locator(".p-hareruya-deckentry-list__header"); }
  get ゼロ件案内(): Locator { return this.page.locator(".p-hareruya-message-box--info"); }

  /** 行の項目（見出しの文字が dt に含まれる項目）の値。無ければ null */
  async 項目(行: Locator, 見出し: string): Promise<string | null> {
    const r = 行.locator(".p-hareruya-deckentry-list__card-row").filter({ has: this.page.locator("dt", { hasText: 見出し }) });
    if ((await r.count()) === 0) return null;
    return norm(await r.first().locator("dd").innerText());
  }
  async 処理状態(行: Locator): Promise<string | null> { return this.項目(行, 処理状態の見出し(this.page)); }
  async デッキ登録状況(行: Locator): Promise<string | null> { return this.項目(行, デッキ登録の見出し(this.page)); }
  async フォーマットの表示(行: Locator): Promise<string[]> {
    return (await 行.locator(".p-hareruya-deckentry-list__format-badge").allInnerTexts()).map(norm);
  }
  デッキ登録編集のボタン(行: Locator): Locator { return 行.locator("a.p-hareruya-deckentry-list__card-btn"); }
  イベント名のリンク(行: Locator): Locator { return 行.locator(".p-hareruya-deckentry-list__card-title-link").first(); }

  ヘルプ(行: Locator): Locator { return 行.locator(".p-hareruya-deckentry-list__help-button"); }
  /** ヘルプアイコンにマウスカーソルを合わせ、ツールチップの文を返す（出ていなければ空） */
  async ヘルプのツールチップ(行: Locator): Promise<{ 表示: boolean; 文: string }> {
    await this.ヘルプ(行).first().scrollIntoViewIfNeeded();
    await this.ヘルプ(行).first().hover({ timeout: 20_000 });
    const tip = 行.locator(".p-hareruya-popover__body").first();
    await this.page.waitForTimeout(500);
    return { 表示: await tip.isVisible(), 文: norm(((await tip.textContent()) ?? "")) };
  }
  /** ヘルプを押す。別のタブで開いたときはそのタブを返す（無ければ同じタブの遷移） */
  async ヘルプを押す(行: Locator): Promise<Page> {
    const h = this.ヘルプ(行).first();
    await h.scrollIntoViewIfNeeded();
    const popup = this.page.context().waitForEvent("page", { timeout: 20_000 }).catch(() => null);
    await h.click({ timeout: 20_000 });
    const p = await popup;
    if (p) { await p.waitForLoadState("load").catch(() => undefined); return p; }
    await this.page.waitForLoadState("load");
    return this.page;
  }

  /** ヘッダーの言語切替で、英語の表示にする */
  async 英語に切り替える(): Promise<void> {
    const l = this.page.locator(".p-hareruya-header__nav-item--lang a").first();
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), l.click({ timeout: 20_000 })]);
    await this.page.waitForLoadState("load");
  }
}

const 英語か = (p: Page): boolean => /\/en\//.test(p.url());
const 処理状態の見出し = (p: Page): string => (英語か(p) ? "Status" : "処理状態");
const デッキ登録の見出し = (p: Page): string => (英語か(p) ? "Deck Registration" : "デッキ登録");
