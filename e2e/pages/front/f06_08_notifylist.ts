/**
 * F06-08 入荷待ち商品一覧（フロントのマイページ）の操作。セレクタ・アドレスはここだけに書く。正本: cases/F06-08_test_cases.tsv
 */
import { Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export type 言語 = "ja" | "en";
const T = 30_000;

export class NotifyListPage {
  constructor(readonly page: Page, readonly 言語: 言語 = "ja") { page.setDefaultTimeout(T); }
  get path(): string { return new URL(this.page.url()).pathname; }
  private url(p: string): string { return `${BASE_URL}/${this.言語}${p}`; }

  async ログインする(メール: string, パスワード: string): Promise<void> {
    await this.page.goto(this.url("/mypage/login"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    const form = this.page.locator("form#login_mypage");
    await form.locator("#login_email").fill(メール, { timeout: T });
    await form.locator("#login_pass").fill(パスワード, { timeout: T });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), form.locator("button[type=submit]").click({ timeout: T })]);
    await this.page.waitForLoadState("load");
  }
  async ログアウトする(): Promise<void> {
    await this.page.goto(this.url("/logout"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  async 開く(): Promise<void> {
    await this.page.goto(this.url("/mypage/notifylist"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  async ログイン画面である(): Promise<boolean> { return (await this.page.locator("form#login_mypage").count()) > 0; }
  async 一覧画面である(): Promise<boolean> { return (await this.page.locator(".p-hareruya-notifylist").count()) > 0; }

  get 見出し(): Locator { return this.page.locator(".p-hareruya-notifylist__title h1"); }
  /** 入荷通知の案内（商品がある場合に出る説明文） */
  get 案内文(): Locator { return this.page.locator(".p-hareruya-notifylist__title p.c-hareruya-text"); }
  /** 入荷待ち商品が無いときの案内（情報の枠） */
  get 商品なしの案内(): Locator { return this.page.locator(".p-hareruya-notifylist__title .p-hareruya-message-box--info"); }
  get マイページボタン(): Locator { return this.page.locator(".p-hareruya-notifylist__button a"); }
  get 商品カード(): Locator { return this.page.locator(".p-hareruya-product-card--notifylist"); }
  async 商品名一覧(): Promise<string[]> {
    return (await this.page.locator(".p-hareruya-product-card--notifylist .p-hareruya-product-card__name-text").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }
  async 商品件数の表示(): Promise<string> {
    const c = this.page.locator(".p-hareruya-notifylist__header .p-hareruya-toolbar__count");
    return (await c.count()) === 0 ? "" : ((await c.first().innerText()) ?? "").replace(/\s+/g, " ").trim();
  }
  /** 一覧の本文（画面上部を含むページ内の主な領域）の文 */
  async 画面上部の文(): Promise<string> {
    return ((await this.page.locator(".p-hareruya-notifylist__title").innerText()) ?? "").replace(/\s+/g, " ").trim();
  }

  // ---- パンくず ----
  get パンくず現在地(): Locator { return this.page.locator(".p-hareruya-breadcrumb__current").first(); }
  async 現在地がリンクか(): Promise<boolean> {
    const cur = this.パンくず現在地;
    return (await cur.locator("a").count()) > 0 || (await cur.evaluate((e) => !!e.closest("a")));
  }
  get パンくずホーム(): Locator { return this.page.locator("a.p-hareruya-breadcrumb__link").first(); }
  async 現在地を押す(): Promise<void> {
    await this.パンくず現在地.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await this.パンくず現在地.click({ timeout: 10_000 }).catch(() => undefined);
    await this.page.waitForTimeout(800);
    await this.page.waitForLoadState("load");
  }
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
