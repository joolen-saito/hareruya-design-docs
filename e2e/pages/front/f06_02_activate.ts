/**
 * F06-02 本会員登録（アクティベート用URL → 本登録完了／エラー画面）の操作。セレクタはここだけに書く。
 * 正本: cases/F06-02_test_cases.tsv
 */
import { expect, Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const TIMEOUT = 30_000;

export class ActivatePage {
  constructor(readonly page: Page) { page.setDefaultTimeout(TIMEOUT); }

  /** アクティベート用URLを開く。秘密鍵が undefined のときは、秘密鍵の部分を付けないURLを開く。応答の状態を返す */
  async open(秘密鍵?: string): Promise<number> {
    const url = 秘密鍵 === undefined ? `${BASE_URL}/ja/entry/activate` : `${BASE_URL}/ja/entry/activate/${秘密鍵}`;
    const res = await this.page.goto(url, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }

  get path(): string { return new URL(this.page.url()).pathname; }
  /** エラー画面の枠 */
  get エラー画面(): Locator { return this.page.locator(".p-hareruya-error"); }
  /** エラー画面の見出し（無ければ空） */
  async 見出し(): Promise<string> {
    const h = this.エラー画面.locator("h2").first();
    return (await h.count()) === 0 ? "" : ((await h.innerText()) ?? "").replace(/\s+/g, " ").trim();
  }
  get トップページへ(): Locator { return this.エラー画面.locator(".p-hareruya-error__actions a").first(); }

  /** 「トップページへ」を押して遷移する */
  async トップページへを押す(): Promise<void> {
    await expect(this.トップページへ, "エラー画面の「トップページへ」ボタン").toBeVisible({ timeout: TIMEOUT });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), this.トップページへ.click({ timeout: TIMEOUT })]);
    await this.page.waitForLoadState("load");
  }
}
