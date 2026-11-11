/**
 * F06-04 パスワード再発行（再発行画面 → メール送信完了画面 → メールのURL → パスワード再設定画面／エラー画面）の操作。
 * セレクタはここだけに書く。正本: cases/F06-04_test_cases.tsv
 */
import { expect, Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { mailIds, waitForMailTo } from "../../lib/mail";

const TIMEOUT = 30_000;

export class ForgotPage {
  constructor(readonly page: Page) { page.setDefaultTimeout(TIMEOUT); }

  get path(): string { return new URL(this.page.url()).pathname; }
  get メール欄(): Locator { return this.page.locator('form#form1 input[name$="[login_email]"], form#form1 input[name="login_email"]').first(); }
  get 次のページへ(): Locator { return this.page.locator('form#form1 button[type="submit"]'); }

  async 再発行画面を開く(): Promise<void> {
    await this.page.goto(`${BASE_URL}/ja/forgot`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    await expect(this.メール欄, "パスワード再発行画面のメールアドレス欄").toBeVisible({ timeout: TIMEOUT });
  }
  get 再発行画面である(): Promise<boolean> { return this.メール欄.isVisible(); }
  get 見出し(): Locator { return this.page.locator("h1").first(); }

  /** メールアドレスを入れて「次のページへ」を押し、移った先の画面まで待つ */
  async 申し込む(メール: string): Promise<void> {
    await this.メール欄.fill(メール, { timeout: TIMEOUT });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), this.次のページへ.click({ timeout: TIMEOUT })]);
    await this.page.waitForLoadState("load");
  }
  /** 申し込む前にメールの番号を控え、申し込んだあとに届くその宛先のメールのURL（パスワード再設定画面）を返す */
  async 申し込んでメールのURLを読む(メール: string): Promise<string> {
    const before = await mailIds();
    await this.申し込む(メール);
    return this.メールのURL(メール, before);
  }
  async メールのURL(メール: string, before: Set<number>): Promise<string> {
    const mail = await waitForMailTo(メール, before);
    const url = /https?:\/\/[^\s"'<>]+\/forgot\/reset\/[^\s"'<>]+/.exec(mail.text)?.[0];
    if (!url) throw new Error(`宛先 ${メール} のメール（${mail.subject}）にパスワード再設定のURLが無い`);
    return url.replace(/&amp;/g, "&");
  }
  async URLを開く(url: string): Promise<void> {
    await this.page.goto(url, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }

  // ---- 送信完了画面 ----
  get 完了画面か(): boolean { return /\/forgot\/complete/.test(this.path); }
  get ホームへ戻る(): Locator { return this.page.locator(".p-hareruya-entry-complete__actions a").first(); }

  // ---- 再設定画面・エラー画面 ----
  get 新しいパスワード欄(): Locator { return this.page.locator('form#form1 input[type="password"]').first(); }
  get 再設定画面である(): Promise<boolean> { return this.新しいパスワード欄.isVisible(); }
  get エラー画面(): Locator { return this.page.locator(".p-hareruya-error"); }
  async エラーの見出し(): Promise<string> {
    const h = this.エラー画面.locator("h2").first();
    return (await h.count()) === 0 ? "" : ((await h.innerText()) ?? "").replace(/\s+/g, " ").trim();
  }
  async エラーの文(): Promise<string> {
    const p = this.エラー画面.locator("p").first();
    return (await p.count()) === 0 ? "" : ((await p.innerText()) ?? "").replace(/\s+/g, " ").trim();
  }
  /** エラー画面の「トップページへ」ボタン */
  get トップページへ(): Locator { return this.page.locator(".p-hareruya-error__actions a").first(); }
  /** 共通エラー画面（「404 Page Not Found」）が表示されているか */
  async 共通エラー404か(): Promise<boolean> {
    return /404 Page Not Found/.test((await this.page.locator("body").innerText()) ?? "");
  }

  // ---- 再設定画面の入力・送信 ----
  get 新しいパスワード確認欄(): Locator { return this.page.locator('form#form1 input[type="password"]').nth(1); }
  get 変更する(): Locator { return this.page.locator('form#form1 button[type="submit"]'); }
  async 再設定を入力する(メール: string, パスワード: string, 確認 = パスワード): Promise<void> {
    await this.メール欄.fill(メール, { timeout: TIMEOUT });
    await this.新しいパスワード欄.fill(パスワード, { timeout: TIMEOUT });
    await this.新しいパスワード確認欄.fill(確認, { timeout: TIMEOUT });
  }
  async 変更するを押す(): Promise<void> {
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), this.変更する.click({ timeout: TIMEOUT })]);
    await this.page.waitForLoadState("load");
  }
  async 再設定する(メール: string, パスワード: string): Promise<void> {
    await this.再設定を入力する(メール, パスワード);
    await this.変更するを押す();
  }
  /** パスワード再設定完了画面か */
  get 再設定完了画面か(): boolean { return /\/forgot\/resetcomplete/.test(this.path); }
  /** 完了画面の「戻る」ボタン */
  get 戻る(): Locator { return this.page.locator(".p-hareruya-entry-complete__actions a").first(); }
  /** 新しいパスワード欄の下の「メールアドレスとは異なるパスワードを設定してください。」の注意の数 */
  async 異なる文字列の注意の数(): Promise<number> {
    return this.page.locator(".p-hareruya-entry__help-text").filter({ hasText: "メールアドレスとは異なるパスワードを設定してください。" }).count();
  }

  // ---- パンくず ----
  get パンくず現在地(): Locator { return this.page.locator(".p-hareruya-breadcrumb__current").first(); }
  async 現在地がリンクか(): Promise<boolean> {
    const cur = this.パンくず現在地;
    return (await cur.locator("a").count()) > 0 || (await cur.evaluate((e) => !!e.closest("a")));
  }
  get パンくずホーム(): Locator { return this.page.locator("a.p-hareruya-breadcrumb__link").first(); }
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
