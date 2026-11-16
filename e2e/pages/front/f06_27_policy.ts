/** F06-27 パスワード設定（ポリシー違反用）画面の操作。アドレス・セレクタはここだけに書く。正本: cases/F06-27_test_cases.tsv */
import { Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export type 変更を押した結果 = {
  /** 「変更する」の送信がサーバーへ送られたか（画面が移ったか） */
  送った: boolean;
  /** 押したあとに画面に出ている入力の誤りの文（サーバー・画面のスクリプトのどちらでも） */
  誤りの文: string[];
  /** ブラウザの入力チェックが止めた項目（必須の欄が空など） */
  止めた項目: string[];
};

export class PolicyPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(30_000); }
  get path(): string { return new URL(this.page.url()).pathname; }
  /** パスワード設定（ポリシー違反用）画面のアドレスを直接開く */
  async 直接開く(): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/mypage/password_change`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  /** パスワード設定（ポリシー違反用）画面が表示されているか（新しいパスワードの入力欄がある） */
  async 設定画面である(): Promise<boolean> {
    return (await this.page.locator('form input[type="password"]').count()) > 0 && /password_change\/?$/.test(this.path);
  }
  get フォーム(): Locator { return this.page.locator("form#password-change-form"); }
  get パスワード欄(): Locator { return this.フォーム.locator("input[type=password]").nth(0); }
  get 確認欄(): Locator { return this.フォーム.locator("input[type=password]").nth(1); }
  get 変更するボタン(): Locator { return this.フォーム.locator("button[type=submit]"); }
  get 完了の文(): Locator { return this.page.getByText("パスワードを変更しました。"); }
  /** パスワード変更完了画面か（アドレスと完了の文） */
  async 完了画面である(): Promise<boolean> {
    return /\/mypage\/password_change_complete\/?$/.test(this.path) && (await this.完了の文.count()) > 0;
  }
  /** 画面の「TOPへ戻る」（アプリの完了画面の表示名は「TOPページへ戻る」） */
  get TOPへ戻る(): Locator { return this.page.getByRole("link", { name: /^\s*TOP(ページ)?へ戻る\s*$/ }); }
  /** マイページ画面か（/ja/mypage） */
  マイページである(): boolean { return /^\/ja\/mypage\/?$/.test(this.path); }
  /** 本店のTOP画面か（/ja/ または /ja） */
  TOPである(): boolean { return /^\/ja\/?$/.test(this.path); }

  /** パスワードとパスワード(確認)に値を入れて「変更する」を押す。送られたか・止められたかを返す（止められても投げない） */
  async 変更を押す(新: string, 確認: string): Promise<変更を押した結果> {
    await this.パスワード欄.fill(新);
    await this.確認欄.fill(確認);
    const before = this.page.url();
    const nav = this.page.waitForNavigation({ waitUntil: "load", timeout: 15_000 }).then(() => true).catch(() => false);
    await this.変更するボタン.click();
    const 送った = (await nav) || this.page.url() !== before;
    await this.page.waitForLoadState("load");
    const 誤りの文 = (await this.page.locator("form#password-change-form [role=alert], form#password-change-form .c-hareruya-form-input__field-error--server, form#password-change-form .form-error-message, form#password-change-form .ec-errorMessage")
      .allInnerTexts().catch(() => [] as string[])).map((t) => t.replace(/\s+/g, " ").trim()).filter(Boolean);
    const 止めた項目 = (await this.フォーム.count()) > 0
      ? await this.フォーム.locator("input[type=password]").evaluateAll((els) => els.filter((e) => !(e as HTMLInputElement).checkValidity())
        .map((e) => `${(e as HTMLInputElement).name}（${(e as HTMLInputElement).validationMessage}）`))
      : [];
    return { 送った, 誤りの文: [...new Set(誤りの文)], 止めた項目 };
  }

  /** ログアウトする。見えているログアウトのリンクを押し、無ければログアウトのアドレスを開く。どちらで行ったかを返す */
  async ログアウトする(): Promise<"リンク" | "アドレス"> {
    const l = this.page.locator('a[href$="/logout"]:visible').first();
    if ((await l.count()) > 0) {
      await Promise.all([this.page.waitForNavigation({ waitUntil: "load", timeout: 60_000 }), l.click({ noWaitAfter: true })]);
      return "リンク";
    }
    await this.page.goto(`${BASE_URL}/ja/logout`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return "アドレス";
  }
  /** 会員情報変更画面のアドレスを開く */
  async 会員情報変更を開く(): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/mypage/change`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  /** マイページ画面のアドレスを開く */
  async マイページを開く(): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/mypage`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  /** ブラウザの「戻る」 */
  async 戻る(): Promise<void> {
    await this.page.goBack({ waitUntil: "load", timeout: 60_000 });
  }
}
