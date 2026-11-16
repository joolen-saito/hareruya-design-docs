/** F06-21 退会（退会前・退会確認・退会完了）の操作。セレクタ・アドレスはここだけに書く。正本: cases/F06-21_test_cases.tsv */
import { Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { 押して移るのを待つ } from "./nav_click";

const T = 30_000;

export class WithdrawPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(T); }
  get path(): string { return new URL(this.page.url()).pathname; }

  async ログインする(メール: string, パスワード: string): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/mypage/login`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    const form = this.page.locator("form#login_mypage");
    await form.locator("#login_email").fill(メール, { timeout: T });
    await form.locator("#login_pass").fill(パスワード, { timeout: T });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), form.locator("button[type=submit]").click({ timeout: T, noWaitAfter: true })]);
    await this.page.waitForLoadState("load");
  }
  async 退会前を開く(): Promise<void> { await this.開く("/ja/mypage/withdraw"); }
  async 退会完了を開く(): Promise<void> { await this.開く("/ja/mypage/withdraw_complete"); }
  async マイページを開く(): Promise<void> { await this.開く("/ja/mypage/"); }
  private async 開く(p: string): Promise<void> {
    await this.page.goto(`${BASE_URL}${p}`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  async ログイン画面である(): Promise<boolean> { return (await this.page.locator("form#login_mypage").count()) > 0; }

  // ---- 画面の判別 ----
  get 退会前の枠(): Locator { return this.page.locator('form[action$="/mypage/withdraw"] button[name="mode"][value="confirm"]'); }
  get 退会確認の枠(): Locator { return this.page.locator('button[name="mode"][value="complete"]'); }
  async 退会前画面である(): Promise<boolean> { return (await this.退会前の枠.count()) > 0; }
  async 退会確認画面である(): Promise<boolean> { return (await this.退会確認の枠.count()) > 0; }
  async 退会完了画面である(): Promise<boolean> { return /\/mypage\/withdraw_complete/.test(this.path) && (await this.page.locator("h1").count()) > 0; }

  // ---- ボタン・欄 ----
  get マイページのリンク(): Locator { return this.page.locator('a[href$="/mypage/withdraw"], a[href$="/mypage/withdraw/"]').first(); }
  get 退会手続きへ(): Locator { return this.退会前の枠; }
  get 戻る(): Locator { return this.page.locator(".p-hareruya-mypage__button a.c-hareruya-btn--primary").first(); }
  get パスワード欄(): Locator { return this.page.locator('input[type="password"]').first(); }
  get 退会する(): Locator { return this.退会確認の枠; }
  get ホームへ戻る(): Locator { return this.page.locator(".p-hareruya-entry-complete__actions a, .p-hareruya-mypage a.c-hareruya-btn").filter({ hasText: /ホーム/ }).first(); }
  async パスワードの下のエラー(): Promise<string> {
    const e = this.page.locator(".c-hareruya-form-input__field-error--server");
    return (await e.count()) === 0 ? "" : ((await e.first().innerText()) ?? "").replace(/\s+/g, " ").trim();
  }
  async 画面上部の文(): Promise<string> {
    const c = this.page.locator(".p-hareruya-mypage__container, .p-hareruya-mypage").first();
    return (await c.count()) === 0 ? "" : ((await c.innerText()) ?? "").replace(/\s+/g, " ").trim();
  }

  // ---- パンくず ----
  get パンくず(): Locator { return this.page.locator("nav.p-hareruya-breadcrumb"); }
  get パンくず現在地(): Locator { return this.page.locator(".p-hareruya-breadcrumb__current").first(); }
  async 現在地がリンクか(): Promise<boolean> {
    const cur = this.パンくず現在地;
    return (await cur.locator("a").count()) > 0 || (await cur.evaluate((e) => !!e.closest("a")));
  }
  get パンくずホーム(): Locator { return this.page.locator("a.p-hareruya-breadcrumb__link").first(); }
  /** パンくずの「マイページ」。設計のレイアウト図ではリンクでない文字の表示もありうる（識別ID 3-1 でリンク設定を解除）ので、リンクかどうかは問わず文字で探す */
  get パンくずのマイページ(): Locator { return this.page.locator("nav.p-hareruya-breadcrumb").getByText("マイページ", { exact: true }).first(); }

  async 押して遷移する(l: Locator): Promise<void> {
    // 押す操作だけを行い、移るのを待つ（押せているのに click の待ちが時間切れになり、移った先で押し直してしまうのを防ぐ。pages/front/nav_click.ts）
    await 押して移るのを待つ(this.page, l, { 直接送るときの注記: "正本の外の補い" });
  }
  /** 現在地を押そうとする（押せない・押しても遷移しない）。遷移したかを返す */
  async 現在地を押そうとする(): Promise<boolean> {
    const before = this.page.url();
    await this.パンくず現在地.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await this.パンくず現在地.click({ timeout: 10_000 }).catch(() => undefined);
    await this.page.waitForTimeout(800);
    await this.page.waitForLoadState("load");
    return this.page.url() !== before;
  }
}
