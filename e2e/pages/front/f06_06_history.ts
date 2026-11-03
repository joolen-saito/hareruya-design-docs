/**
 * F06-06 購入履歴一覧（フロントのマイページ）の操作。セレクタ・アドレスはここだけに書く。正本: cases/F06-06_test_cases.tsv
 */
import { Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const T = 30_000;

export class HistoryListPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }
  get path(): string { return new URL(this.page.url()).pathname; }

  async 開く(): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/mypage/shopping_history`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  async 履歴一覧画面である(): Promise<boolean> { return (await this.page.locator(".p-hareruya-history-list--shopping").count()) > 0; }
  get 注文の枠(): Locator { return this.page.locator(".p-hareruya-history-list__box"); }
  /** 表示されている注文番号を上から */
  async 注文番号を上から(): Promise<string[]> {
    return (await this.注文の枠.locator("a.c-hareruya-link").allInnerTexts()).map((t) => t.trim());
  }
  /** 件数の表示（「件数: 11件」など）。ツールバーの文を返す */
  async 件数の表示(): Promise<string> {
    const c = this.page.locator(".p-hareruya-toolbar").first();
    return (await c.count()) === 0 ? "" : ((await c.innerText()) ?? "").replace(/\s+/g, " ").trim();
  }
  async 履歴なしの案内(): Promise<string> {
    const m = this.page.locator(".p-hareruya-message-box--info");
    return (await m.count()) === 0 ? "" : ((await m.first().innerText()) ?? "").replace(/\s+/g, " ").trim();
  }

  // ---- ページング・表示件数 ----
  /** 画面上部のページング */
  get 上のページング(): Locator { return this.page.locator(".p-hareruya-toolbar__pagination"); }
  /** 画面下部のページング */
  get 下のページング(): Locator { return this.page.locator(".p-hareruya-history-list__pagination-wrap--bottom"); }
  async 現在のページ(): Promise<string> {
    const c = this.page.locator(".p-hareruya-pagination__item--current .p-hareruya-pagination__number").first();
    return (await c.count()) === 0 ? "" : ((await c.innerText()) ?? "").trim();
  }
  async ページを押す(場所: Locator, ページ: number): Promise<void> {
    const l = 場所.locator(`a.p-hareruya-pagination__link[data-page="${ページ}"]`).first();
    await this.押して遷移する(l);
  }
  get 表示件数の選択欄(): Locator { return this.page.locator("#js-shopping-history-disp-number"); }
  async 表示件数を選ぶ(表示: string): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      this.表示件数の選択欄.selectOption({ label: 表示 }, { timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
  }
  async 表示件数の選択肢(): Promise<string[]> { return (await this.表示件数の選択欄.locator("option").allInnerTexts()).map((t) => t.trim()); }

  // ---- ボタン ----
  get マイページボタン(): Locator { return this.page.locator(".p-hareruya-history-list__btn a").first(); }

  async 押して遷移する(l: Locator): Promise<void> {
    await l.evaluate((el) => el.scrollIntoView({ block: "center" }));
    const nav = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 });
    try {
      await l.click({ timeout: 10_000 });
    } catch (e) {
      test.info().annotations.push({ type: "正本の外の補い", description: `この要素は固定ヘッダーが上に重なり、普通のクリックでは押せなかった。クリックの操作を要素へ直接送って続けた（${String(e).split("\n")[0].slice(0, 80)}）` });
      await l.dispatchEvent("click");
    }
    await nav;
    await this.page.waitForLoadState("load");
  }
}
