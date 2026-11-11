/**
 * M15-07 デッキタグ一覧（デッキ管理のメニュー）と、移った先の MTGマスターデータ管理画面の部品。セレクタはここだけに置く。
 *
 * 画面の表示名（アプリのメニューの設定・Twig・翻訳ファイルで確かめたもの）:
 * - 左のメニューの「デッキ管理」を押すと、その下に「デッキ一覧」「デッキタグ一覧」…が開く
 * - MTGマスターデータ管理画面は、上の区画の見出しが「MTGマスターデータ管理」、その下にマスターの種類の選択欄と「選択」ボタン
 */
import { expect, Locator, Page } from "@playwright/test";

const 文 = (t: string | null | undefined) => (t ?? "").replace(/\s+/g, " ").trim();

/** 管理画面の左のメニュー */
export class 管理メニュー {
  constructor(readonly page: Page) {}
  get デッキ管理(): Locator { return this.page.locator('a.c-mainNavArea__navItemTitle[href="#nav-deck_management"]'); }
  get デッキ管理の下(): Locator { return this.page.locator("#nav-deck_management"); }
  get デッキタグ一覧(): Locator { return this.デッキ管理の下.getByRole("link", { name: "デッキタグ一覧", exact: true }); }

  /** 「デッキ管理」を開いて（閉じていれば）、「デッキタグ一覧」を押す。移った先の読み込みを待つ */
  async デッキタグ一覧を押す(): Promise<void> {
    await this.page.waitForLoadState("load");
    if (!(await this.デッキタグ一覧.isVisible())) {
      await this.デッキ管理.click();
      await expect(this.デッキタグ一覧, "デッキ管理メニューの「デッキタグ一覧」").toBeVisible();
    }
    await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), this.デッキタグ一覧.click()]);
  }
}

/** MTGマスターデータ管理画面 */
export class MTGマスターデータ管理 {
  constructor(readonly page: Page) {}
  get 見出し(): Locator { return this.page.locator(".c-primaryCol .card-header span").first(); }
  get 種類の選択欄(): Locator { return this.page.locator('select[name="entity"]'); }
  async 選ばれている種類(): Promise<string> { return 文(await this.種類の選択欄.locator("option:checked").innerText()); }
}
