/** F06-11 買取履歴一覧（フロントのマイページ）の操作。セレクタ・アドレスはここだけに書く。正本: cases/F06-11_test_cases.tsv */
import { Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const T = 30_000;
export type 言語 = "ja" | "en";

export class PurchaseHistoryPage {
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
  async 履歴一覧を開く(): Promise<void> {
    await this.page.goto(this.url("/mypage/purchase_history"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  async マイページを開く(): Promise<void> {
    await this.page.goto(this.url("/mypage/"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  async ログイン画面である(): Promise<boolean> { return (await this.page.locator("form#login_mypage").count()) > 0; }
  async 履歴一覧画面である(): Promise<boolean> { return (await this.page.locator(".p-hareruya-history-list").count()) > 0 && /purchase_history/.test(this.path); }

  /** マイページの買取履歴へのリンク */
  get 買取履歴へのリンク(): Locator { return this.page.locator('a[href$="/mypage/purchase_history"]'); }
  get 履歴の行(): Locator { return this.page.locator(".p-hareruya-history-list__box"); }
  get 履歴なしの案内(): Locator { return this.page.locator(".p-hareruya-history-list__title .p-hareruya-message-box--info"); }
  /** 件数・表示範囲の文（ツールバー。無ければ空） */
  async 件数の表示(): Promise<string> {
    const c = this.page.locator(".p-hareruya-toolbar__count");
    return (await c.count()) === 0 ? "" : ((await c.first().innerText()) ?? "").replace(/\s+/g, " ").trim();
  }
  get マイページへ戻る(): Locator { return this.page.locator(".p-hareruya-history-list__btn a").first(); }

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
