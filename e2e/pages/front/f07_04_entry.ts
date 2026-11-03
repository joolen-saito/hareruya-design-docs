/** F07-04 イベント申込（フロント）の画面操作: イベント申込確認 → 申込確定 → 申込完了 */
import { Browser, BrowserContext, Locator, Page, Response, expect } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { hideDebugToolbar } from "../../lib/session";
import { frontLogin } from "../admin/m04_19_order_shortage";

export const 前面 = (p: string): string => `${BASE_URL}/ja${p}`;

/** 別のブラウザ（別のセッション）を開いて会員でログインする。閉じるのは呼び出し側（close） */
export async function 別のブラウザで会員としてログインする(browser: Browser, m: { メール: string; パスワード: string }): Promise<{ page: Page; context: BrowserContext }> {
  const context = await browser.newContext({ baseURL: BASE_URL, locale: "ja-JP", ignoreHTTPSErrors: true });
  await hideDebugToolbar(context);
  const page = await context.newPage();
  page.setDefaultTimeout(30_000);
  page.setDefaultNavigationTimeout(60_000);
  await frontLogin(page, m);
  return { page, context };
}

export class EventEntryPage {
  constructor(readonly page: Page) {}

  /** イベント申込確認画面を、アドレスで開く（遷移の途中の画面なので、会員としてログインしたブラウザで） */
  async 申込確認を開く(日程ID: string): Promise<Response | null> {
    const res = await this.page.goto(前面(`/events/${日程ID}/entry`), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res;
  }

  get 申込確認の本体(): Locator { return this.page.locator("form#filter_form"); }
  get 同意チェック(): Locator { return this.page.locator("#payment-confirm"); }
  get 支払いへ進むボタン(): Locator { return this.page.locator("button[data-js-event-entry-submit]"); }
  /** 申込確認画面の、日程のチェック欄（選択済みで変更できない場合は無効） */
  日程チェック(日程ID: string): Locator { return this.page.locator(`input[type="checkbox"][name="details[]"][value="${日程ID}"]`); }
  /** 別日程の同イベントとして並ぶ日程のチェック欄 */
  get 別日程のチェック(): Locator { return this.page.locator('input[id^="alternative-event-"]'); }
  get なりすまし対策トークン(): Locator { return this.page.locator('form#filter_form input[name="_token"]'); }

  async 同意して支払いへ進む(): Promise<Response | null> {
    await this.同意チェック.check({ timeout: 20_000 });
    const nav = this.page.waitForResponse((r) => r.request().method() === "POST" && /\/events\/confirm/.test(r.url()), { timeout: 45_000 }).catch(() => null);
    await this.支払いへ進むボタン.click({ timeout: 20_000 });
    const res = await nav;
    await this.page.waitForLoadState("load");
    return res;
  }

  // ---- 申込確定画面 ----
  get 申込するボタン(): Locator { return this.page.locator("#submit-button-forward"); }
  get 確定画面のトークン(): Locator { return this.page.locator('#form-registration input[name="_token"]'); }
  async 申込確定画面か(): Promise<boolean> { return (await this.申込するボタン.count()) > 0; }

  /** 「申込するボタン」を押し、申込登録の応答（状態と本文）を返す */
  async 申込するを押す(): Promise<{ status: number; json: Record<string, unknown> | null }> {
    const reg = this.申込登録の応答を待ち受ける();
    await this.申込するボタン.click({ timeout: 20_000 });
    return reg;
  }

  /**
   * 申込登録の応答を待ち受ける（ネットワークの記録を始める）。押したあとに await する。
   * 応答の本文は、完了画面へ移ってしまうと読めなくなるので、応答が届いた時点で読む。
   */
  申込登録の応答を待ち受ける(): Promise<{ status: number; json: Record<string, unknown> | null }> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.page.off("response", h); reject(new Error("申込登録の応答が60秒待っても届かない")); }, 60_000);
      const h = async (r: Response) => {
        if (r.request().method() !== "POST" || !/\/events\/register/.test(r.url())) return;
        this.page.off("response", h);
        clearTimeout(timer);
        let json: Record<string, unknown> | null = null;
        try { json = (await r.json()) as Record<string, unknown>; } catch { json = null; }
        resolve({ status: r.status(), json });
      };
      this.page.on("response", h);
    });
  }

  /** 開発者ツールで行うのと同じに、画面のなりすまし対策トークンの入力要素を消す・値を書き換える */
  async 申込確認のトークンを消す(): Promise<void> { await this.なりすまし対策トークン.evaluate((e) => e.remove()); }
  async 確定画面のトークンを消す(): Promise<void> { await this.確定画面のトークン.evaluate((e) => e.remove()); }
  async 確定画面のトークンを書き換える(値: string): Promise<void> { await this.確定画面のトークン.evaluate((e, v) => { (e as HTMLInputElement).value = v; }, 値); }

  /** 申込完了画面が表示されるまで待つ（無料の申込は、登録の応答のあと完了画面へ移る） */
  async 申込完了画面を待つ(): Promise<void> {
    await this.page.waitForURL(/\/events\/payment_complete/, { timeout: 60_000, waitUntil: "load" });
  }
  get 完了メッセージ(): Locator { return this.page.locator(".p-hareruya-event-complete__message-text").first(); }
  get デッキ登録ボタン(): Locator { return this.page.locator(".p-hareruya-event-complete__actions a", { hasText: "デッキ登録" }); }
  get イベント一覧に戻るボタン(): Locator { return this.page.locator(".p-hareruya-event-complete__actions a", { hasText: "イベント一覧" }); }
}

export async function 応答を読む(res: Response): Promise<{ status: number; json: Record<string, unknown> | null }> {
  let json: Record<string, unknown> | null = null;
  try { json = (await res.json()) as Record<string, unknown>; } catch { json = null; }
  return { status: res.status(), json };
}

/** 無料の日程の申込を、会員でログインしたブラウザで最後まで行う（確認 → 確定 → 完了）。別ブラウザの申込を先に済ませる手順で使う */
export async function 無料申込を完了する(page: Page, 日程ID: string): Promise<void> {
  const e = new EventEntryPage(page);
  await e.申込確認を開く(日程ID);
  await e.同意して支払いへ進む();
  expect(await e.申込確定画面か(), "申込確定画面へ進んだ").toBe(true);
  const r = await e.申込するを押す();
  expect(r.status, "申込登録の応答").toBeLessThan(400);
  await e.申込完了画面を待つ();
}
