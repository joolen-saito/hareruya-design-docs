/** F06-26 店頭PC用アカウント制御の公開側の画面操作（共通エラー画面・ご注文方法指定・ログイン状態）。セレクタはここだけに書く */
import { expect, Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export class F0626Front {
  constructor(readonly page: Page) { page.setDefaultTimeout(30_000); }
  get path(): string { return new URL(this.page.url()).pathname; }

  /** マイページの購入履歴一覧のアドレスを開く。応答の状態を返す */
  async 購入履歴一覧を開く(): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}/ja/mypage/shopping_history`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  /** 共通エラー画面の見出しと本文 */
  get エラーの見出し(): Locator { return this.page.locator("h1.c-hareruya-heading--lev1").first(); }
  get エラーの本文(): Locator { return this.page.locator("h1.c-hareruya-heading--lev1 + p.c-hareruya-text").first(); }
  /** 購入履歴一覧の画面か（アドレスと、購入履歴の見出し） */
  async 購入履歴一覧である(): Promise<boolean> {
    return /\/mypage\/shopping_history\/?$/.test(this.path) && (await this.page.getByRole("heading", { name: /購入履歴/ }).count()) > 0;
  }

  /** ご注文方法指定画面の見出し（h2） */
  注文画面の見出し(名前: string): Locator {
    return this.page.locator("h2.c-hareruya-heading--lev3").filter({ hasText: new RegExp(`^\\s*${名前}\\s*$`) });
  }
  async 注文画面の見出しの一覧(): Promise<string[]> {
    return (await this.page.locator("h2.c-hareruya-heading--lev3").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }

  /** ログインしている印（画面にログアウトのリンクがある） */
  async ログイン中か(): Promise<boolean> {
    return (await this.page.locator('a[href$="/logout"]').count()) > 0;
  }

  /**
   * ご注文方法指定画面で、配送方法・支払方法は選ばれている既定のまま（標準のもの）、「この内容で注文を確定します。」に印を付けて注文を確定する。
   * 選ばれていた配送方法・支払方法の表示名と、完了画面の注文番号を返す
   */
  async 既定のまま注文を確定する(what: string): Promise<{ 配送方法: string; 支払方法: string; 注文番号: string }> {
    const 選択 = async (sel: string) => this.page.locator(`${sel}:checked`).first()
      .evaluate((n) => ((n as HTMLInputElement).closest("label")?.textContent ?? "").replace(/\s+/g, " ").trim()).catch(() => "");
    const 配送方法 = await 選択('input[name$="[Delivery]"]');
    const 支払方法 = await 選択('input[name="_shopping_order[Payment]"]');
    const accept = this.page.locator('input[name="_shopping_order[accept_order]"]');
    await expect(accept, `${what}: 「この内容で注文を確定します。」`).toHaveCount(1, { timeout: 30_000 });
    await accept.check({ force: true });
    const submit = this.page.locator("button[data-js-payment-submit]");
    await expect(submit, `${what}: 注文のボタンが押せる`).toBeEnabled({ timeout: 30_000 });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 120_000 }), submit.click({ noWaitAfter: true })]);
    await this.page.waitForLoadState("load");
    if (!/\/shopping\/complete/.test(this.page.url())) {
      const errors = (await this.page.locator(".p-hareruya-message-box--error, .ec-alert-warning, .c-hareruya-form-input__field-error--server").allTextContents()).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
      throw new Error(`${what}: 注文が確定しない（${this.page.url()}）: ${errors.join(" / ") || "画面にエラーの表示なし"}`);
    }
    const heading = this.page.getByText(/ご注文番号\s*\S+/).first();
    await expect(heading, `${what}: ご注文完了の画面のご注文番号`).toBeVisible({ timeout: 30_000 });
    const m = /ご注文番号\s*(\S+)/.exec((await heading.textContent()) ?? "");
    if (!m) throw new Error(`${what}: ご注文番号を読めない`);
    return { 配送方法, 支払方法, 注文番号: m[1] };
  }
}
