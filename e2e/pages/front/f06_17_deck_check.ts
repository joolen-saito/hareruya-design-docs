/** F06-17 大会デッキ登録確認〜完了（フロント）の画面操作。セレクタはここだけに書く。正本: cases/F06-17_test_cases.tsv */
import { Locator, Page, Response } from "@playwright/test";
import { 前面 } from "./f06_16_deck_entry";

export class DeckCheckPage {
  constructor(readonly page: Page) {}

  /** 大会デッキ登録完了画面をアドレスで開く（デッキIDで） */
  async 開く(デッキID: string, 英語 = false): Promise<Response | null> {
    const res = await this.page.goto(英語 ? `${前面("").replace("/ja", "/en")}/deckentry/${デッキID}/check` : 前面(`/deckentry/${デッキID}/check`), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res;
  }
  async 表示されている(): Promise<boolean> { return (await this.page.locator(".p-hareruya-deckentry-check").count()) > 0; }

  get 見出し(): Locator { return this.page.locator(".p-hareruya-deckentry-check h1").first(); }
  get 大会名(): Locator { return this.page.locator(".p-hareruya-deckentry-check__event-title"); }
  get 大会情報(): Locator { return this.page.locator(".p-hareruya-deckentry-check__event-detail"); }
  get フォーマット単独項目(): Locator { return this.page.locator(".p-hareruya-deckentry-check__format"); }
  get フォーマット単独項目の値(): Locator { return this.page.locator(".p-hareruya-deckentry-check__format-value"); }
  /** メイン・統率・サイドの順の区画 */
  get 区画(): Locator { return this.page.locator(".p-hareruya-deckentry-check__board"); }
  区画の(名: "メインボード" | "統率領域" | "サイドボード"): Locator { return this.区画.filter({ has: this.page.locator(".p-hareruya-deckentry-check__board-title", { hasText: 名 }) }); }
  async 区画の内容(名: "メインボード" | "統率領域" | "サイドボード"): Promise<string> {
    return ((await this.区画の(名).locator(".p-hareruya-deckentry-check__board-list").innerText()) ?? "").trim();
  }
  async 区画の枚数表示(名: "メインボード" | "統率領域" | "サイドボード"): Promise<string> {
    return ((await this.区画の(名).locator(".p-hareruya-deckentry-check__board-count").innerText()) ?? "").trim();
  }
  async 区画のエラー(名: "メインボード" | "統率領域" | "サイドボード"): Promise<string> {
    const e = this.区画の(名).locator(".p-hareruya-deckentry-check__board-error");
    return (await e.count()) === 0 ? "" : ((await e.innerText()) ?? "").replace(/\s+/g, " ").trim();
  }
  get カード画像の項目(): Locator { return this.page.locator(".p-hareruya-deckentry-check__card-item"); }
  get 大会一覧に戻る(): Locator { return this.page.locator("a.p-hareruya-deckentry-check__btn", { hasText: "大会一覧に戻る" }); }
  get デッキ編集に戻る(): Locator { return this.page.locator("a.p-hareruya-deckentry-check__btn", { hasText: "デッキ編集に戻る" }); }
  get パンくずの現在ページ(): Locator { return this.page.locator(".p-hareruya-breadcrumb__current"); }
  get パンくずのホーム(): Locator { return this.page.locator(".p-hareruya-breadcrumb__link[aria-label]").first(); }
}
