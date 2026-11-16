/**
 * 公開側の支店（/ja/<支店URL>/）での、入荷時通知まわりの画面操作（F03-07-004）。本店の操作は pages/front/f03_07_restock_notify.ts。
 * セレクタはここだけに書く（本店の画面と同じ部品のセレクタを、支店のアドレスで使う）。
 */
import { Locator, Page, expect } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { 一覧の描画を待つ } from "./f03_07_restock_notify";

export type 一覧の表示 = { 商品カード: number; 通知ボタン: number };
export type 詳細の表示 = { 応答: number; 商品名の表示: number; 通知ボタン: number };
export type 入荷待ちの表示 = { 応答: number; アドレス: string; メニューから開いた: boolean; 商品名: string[]; 通知ボタン: number };

/** 公開側の店（本店は 支店URL を空にする）の、入荷時通知が出る3画面を開いて読む */
export class ShopRestockScreens {
  readonly base: string;
  constructor(readonly page: Page, 支店URL = "") {
    this.base = 支店URL ? `${BASE_URL}/ja/${支店URL}` : `${BASE_URL}/ja`;
  }

  get ログインの入力欄(): Locator { return this.page.locator("form#login_mypage"); }

  /** 会員ログイン画面を開く。ログインの入力欄が出ていれば true（ログイン済みでマイページへ移ったときは false） */
  async ログイン画面を開く(): Promise<boolean> {
    await this.page.goto(`${this.base}/mypage/login`);
    await this.page.waitForLoadState("load");
    return (await this.ログインの入力欄.count()) > 0;
  }

  /** ログイン画面で、メールアドレスとパスワードを入れてログインする。ログイン画面のままなら落とす */
  async ログインする(mail: string, password: string): Promise<void> {
    const form = this.ログインの入力欄;
    await form.locator('input[name="login_email"]').fill(mail);
    await form.locator('input[name="login_pass"]').fill(password);
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), form.locator('button[type="submit"]').click({ noWaitAfter: true })]);
    await this.page.waitForLoadState("load");
    expect(new URL(this.page.url()).pathname, `会員ログイン（${mail}）後の画面がログイン画面のまま`).not.toMatch(/\/mypage\/login/);
  }

  async ログアウトする(): Promise<void> {
    await this.page.goto(`${this.base}/logout`);
    await this.page.waitForLoadState("load");
  }

  // ---- 商品一覧 ----
  async 一覧を開く(商品名: string): Promise<void> {
    const res = await this.page.goto(`${this.base}/products/search?product=${encodeURIComponent(商品名)}`);
    expect(res?.status() ?? 0, `商品一覧画面の応答（商品名「${商品名}」で絞り込み）`).toBeLessThan(400);
    // 商品カードは開いたあとに検索サービスから描くので、描き終わるまで待ってから数える
    await 一覧の描画を待つ(this.page);
  }
  一覧のカード(商品名: string): Locator { return this.page.locator(".p-hareruya-product-card").filter({ hasText: 商品名 }); }
  async 一覧を読む(商品名: string): Promise<一覧の表示> {
    const card = this.一覧のカード(商品名);
    return { 商品カード: await card.count(), 通知ボタン: await card.locator(".js-product-list-notify, button.notifyme, button.notifyme-cancel").count() };
  }

  // ---- 商品詳細 ----
  async 詳細を開いて読む(商品ID: string, 商品名: string): Promise<詳細の表示> {
    const res = await this.page.goto(`${this.base}/products/detail/${商品ID}`);
    await this.page.waitForLoadState("load");
    return {
      応答: res?.status() ?? 0,
      商品名の表示: await this.page.getByText(商品名).count(),
      通知ボタン: await this.page.locator("button.notifyme, button.notifyme-cancel, #bulk_restock_notice").count(),
    };
  }
  規格の通知ボタン(classId: string): Locator { return this.page.locator(`button[data-productclass="${classId}"]`); }

  // ---- マイページ＞入荷待ち商品 ----
  get 入荷待ち商品のメニュー(): Locator { return this.page.locator('a.p-hareruya-mypage__menu-link[href$="/mypage/notifylist"]'); }

  /** マイページを開き、メニューの「入荷待ち商品」を押して開く（メニューが無ければアドレスで開く）。画面の表示を読む */
  async 入荷待ち商品を開いて読む(): Promise<入荷待ちの表示> {
    await this.page.goto(`${this.base}/mypage/`);
    await this.page.waitForLoadState("load");
    const menu = this.入荷待ち商品のメニュー;
    const メニューから開いた = (await menu.count()) > 0;
    const res = メニューから開いた
      ? (await Promise.all([this.page.waitForNavigation({ waitUntil: "load" }), menu.first().click({ noWaitAfter: true })]))[0]
      : await this.page.goto(`${this.base}/mypage/notifylist`);
    await this.page.waitForLoadState("load");
    return {
      応答: res?.status() ?? 0, アドレス: new URL(this.page.url()).pathname, メニューから開いた,
      商品名: (await this.page.locator(".p-hareruya-product-card--notifylist .p-hareruya-product-card__name-text").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim()),
      通知ボタン: await this.page.locator("button.notifyme, button.notifyme-cancel, .js-notifylist-bulk-restock, .js-product-list-notify").count(),
    };
  }
}
