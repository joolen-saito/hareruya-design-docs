/**
 * F06-04 パスワード再設定画面（/forgot/reset/{リセットキー}）・再設定完了画面・リセットキーのエラー画面の操作。
 * セレクタはここだけに書く（再発行画面・パンくず・エラー画面の読み取りは pages/front/f06_04_forgot.ts の ForgotPage）。正本: cases/F06-04_test_cases.tsv
 */
import { expect, Locator, Page, Request } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { ForgotPage } from "./f06_04_forgot";

const T = 30_000;

/** リセットキーのパスワード再発行用URL（メールに載るURLと同じ形） */
export const 再設定のURL = (キー: string): string => `${BASE_URL}/ja/forgot/reset/${キー}`;

export class ResetPage extends ForgotPage {
  constructor(page: Page) { super(page); }

  get フォーム(): Locator { return this.page.locator("form#form1"); }
  get メールアドレス欄(): Locator { return this.フォーム.locator('input[name="login_email"]'); }
  get パスワード欄(): Locator { return this.フォーム.locator('input[name="password[first]"]'); }
  get パスワード確認欄(): Locator { return this.フォーム.locator('input[name="password[second]"]'); }
  get 変更するボタン(): Locator { return this.フォーム.locator('button[type="submit"]'); }
  /** 新しいパスワード欄の下の「メールアドレスとは異なるパスワードを…」の注意 */
  get 同じ値の注意(): Locator { return this.フォーム.locator(".p-hareruya-entry__help-text", { hasText: "メールアドレスとは異なるパスワード" }); }

  async キーで開く(キー: string): Promise<void> { await this.URLを開く(再設定のURL(キー)); }

  /** メールアドレスと新しいパスワード（確認も同じ）を入れる */
  async 入れる(メール: string, パスワード: string): Promise<void> {
    await expect(this.メールアドレス欄, "パスワード再設定画面のメールアドレス欄").toBeVisible({ timeout: T });
    await this.メールアドレス欄.fill(メール);
    await this.パスワード欄.fill(パスワード);
    await this.パスワード確認欄.fill(パスワード);
  }
  /** 入力欄の字数の制限を通らない値を、画面の要素の値として直接入れる（開発者ツールで値を設定する手順の代わり） */
  async パスワードを直接入れる(パスワード: string): Promise<void> {
    for (const l of [this.パスワード欄, this.パスワード確認欄]) {
      await l.evaluate((e, v) => { const i = e as HTMLInputElement; i.removeAttribute("maxlength"); i.value = v; i.dispatchEvent(new Event("input", { bubbles: true })); }, パスワード);
    }
  }
  /** フォームの送信先のリセットキーを書き換える（開発者ツールでフォーム送信先URLを変える手順の代わり）。書き換えた送信先を返す */
  async 送信先のキーを変える(キー: string): Promise<string> {
    return this.フォーム.evaluate((f, k) => {
      const form = f as HTMLFormElement;
      const u = new URL(form.action || location.href, location.href);
      u.pathname = u.pathname.replace(/\/forgot\/reset\/[^/]*$/, `/forgot/reset/${k}`);
      form.setAttribute("action", u.toString());
      return form.action;
    }, キー);
  }
  /** 「変更する」を押し、移った先まで待つ。送った要求を返す */
  async 変更するを押す(): Promise<Request> {
    const [req] = await Promise.all([
      this.page.waitForRequest((r) => r.method() === "POST" && /\/forgot\/reset\//.test(r.url()), { timeout: 60_000 }),
      this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }),
      this.変更するボタン.click({ timeout: T }),
    ]);
    await this.page.waitForLoadState("load");
    return req;
  }

  // ---- 完了画面・エラー画面 ----
  get 完了画面である(): boolean { return /\/forgot\/resetcomplete\/?$/.test(this.path); }
  get 完了画面の戻る(): Locator { return this.page.locator(".p-hareruya-entry-complete__actions a").first(); }
  get エラー画面のトップページへ(): Locator { return this.page.locator(".p-hareruya-error__actions a").first(); }
  /** 「404 Page Not Found」の共通エラー画面か（見出し・本文に 404 や Not Found が出る） */
  async 見つからない画面か(): Promise<boolean> {
    const t = ((await this.page.locator("body").innerText().catch(() => "")) ?? "").slice(0, 3000);
    return /404|Not Found|ページが見つかりません/i.test(t);
  }
}
