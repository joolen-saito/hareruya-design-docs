/** F06-14 マイイベント・デッキ登録（フロントのマイページ）の操作。セレクタ・アドレスはここだけに書く。正本: cases/F06-14_test_cases.tsv */
import { Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { 押して移るのを待つ } from "./nav_click";

const T = 30_000;

export class EventHistoryPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }
  get path(): string { return new URL(this.page.url()).pathname; }

  async ログインする(メール: string, パスワード: string): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/mypage/login`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    const form = this.page.locator("form#login_mypage");
    await form.locator("#login_email").fill(メール, { timeout: T });
    await form.locator("#login_pass").fill(パスワード, { timeout: T });
    // 押す操作だけを待ち（noWaitAfter）、ログイン後に移るのは waitForNavigation で待つ（移り先の ECTOP が重く、click の待ちが時間切れになったため）
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 90_000 }), form.locator("button[type=submit]").click({ timeout: T, noWaitAfter: true })]);
    await this.page.waitForLoadState("load");
  }
  async 開く(): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/mypage/event_history`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  async ログイン画面である(): Promise<boolean> { return (await this.page.locator("form#login_mypage").count()) > 0; }
  async 履歴画面である(): Promise<boolean> { return /\/mypage\/event_history/.test(this.path) && (await this.page.locator("h1").count()) > 0; }

  get イベントを探す(): Locator { return this.page.locator('a[href$="/events"]').filter({ hasText: /イベントを探す/ }).first(); }
  get マイページへ戻る(): Locator { return this.page.getByRole("link", { name: "マイページへ戻る" }).first(); }
  get パンくず現在地(): Locator { return this.page.locator(".p-hareruya-breadcrumb__current").first(); }
  async 現在地がリンクか(): Promise<boolean> {
    const cur = this.パンくず現在地;
    return (await cur.locator("a").count()) > 0 || (await cur.evaluate((e) => !!e.closest("a")));
  }
  get パンくずホーム(): Locator { return this.page.locator("a.p-hareruya-breadcrumb__link").first(); }

  async 押して遷移する(l: Locator): Promise<void> {
    // 押す操作だけを行い、移るのを待つ（押せているのに click の待ちが時間切れになり、移った先で押し直してしまうのを防ぐ。pages/front/nav_click.ts）
    await 押して移るのを待つ(this.page, l, { 直接送るときの注記: "正本の外の補い" });
  }
}
