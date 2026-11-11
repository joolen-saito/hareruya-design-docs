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


  // ---- イベント申込確認画面の、日程・支払方法まわり ----
  /** 選択済みの日程のカード（イベント名・開催日時・参加費の文） */
  選択済みのカード(日程ID: string): Locator { return this.page.locator(`label[for="event-${日程ID}"]`); }
  別日程のカード(日程ID: string): Locator { return this.page.locator(`label[for="alternative-event-${日程ID}"]`); }
  get 支払方法の選択(): Locator { return this.page.locator("#payment-method"); }
  get 支払方法の選択肢(): Locator { return this.page.locator("#payment-method option"); }
  get 支払説明を開くボタン(): Locator { return this.page.locator('button[data-js-modal-trigger="payment-help-modal"]'); }
  get 支払説明のモーダル(): Locator { return this.page.locator("#payment-help-modal"); }
  get キャンセルポリシーのリンク(): Locator { return this.page.locator('a[href*="#block_event_cancel_policy"]'); }
  get 申込確認のキャンセルボタン(): Locator { return this.page.locator(".p-hareruya-event-entry__payment-actions a", { hasText: "キャンセル" }); }

  /** 選択済みの日程のチェックを外す（ラベルを押す。別日程があるときだけ外せる） */
  async 選択済みの日程を外す(日程ID: string): Promise<void> {
    await this.選択済みのカード(日程ID).click({ timeout: 15_000 });
    await expect(this.日程チェック(日程ID), "選択済みの日程のチェックが外れた").not.toBeChecked();
  }
  async 別日程を選ぶ(日程ID: string): Promise<void> {
    await this.別日程のカード(日程ID).click({ timeout: 15_000 });
    await expect(this.page.locator(`#alternative-event-${日程ID}`), "別日程のチェックが入った").toBeChecked();
  }
  /** 支払方法を、名前（の一部）で選ぶ */
  async 支払方法を選ぶ(名前: string): Promise<void> {
    const v = await this.支払方法の選択肢.filter({ hasText: 名前 }).first().getAttribute("value", { timeout: 15_000 });
    if (v === null) throw new Error(`支払方法の選択肢に「${名前}」が無い`);
    await this.支払方法の選択.selectOption(v);
  }
  /** 開発者ツールで、支払方法の値を書き換える（必須の指定は外し、その値だけの選択肢にする。空文字も可） */
  async 支払方法の値を書き換える(値: string): Promise<void> {
    await this.支払方法の選択.evaluate((s, v) => {
      const sel = s as HTMLSelectElement;
      sel.removeAttribute("required");
      sel.innerHTML = "";
      const o = document.createElement("option");
      o.value = v; o.selected = true;
      sel.appendChild(o);
      sel.value = v;
    }, 値);
  }
  /** 開発者ツールで、送る要求の欄（name の値）を書き換える・足す。formSelector の中に隠し欄として足す */
  async 隠し欄を足す(フォーム: string, name: string, 値: string): Promise<void> {
    await this.page.locator(フォーム).evaluate((f, [n, v]) => {
      const i = document.createElement("input");
      i.type = "hidden"; i.name = n; i.value = v;
      f.appendChild(i);
    }, [name, 値]);
  }
  /** 開発者ツールで、主対象のイベント詳細ID（隠し欄）を書き換える */
  async 主対象を書き換える(値: string): Promise<void> {
    await this.page.locator('form#filter_form input[name="detail"]').evaluate((e, v) => { (e as HTMLInputElement).value = v; }, 値);
  }
  /** 外部の決済サイトへの移動（画面の移動）だけを止める。試験で決済サイトへ送らない（登録の応答までは通常どおり） */
  async 外部への移動を止める(): Promise<void> {
    const origin = new URL(BASE_URL).origin;
    await this.page.route((u) => u.origin !== origin, (r) => (r.request().isNavigationRequest() ? r.abort() : r.continue()));
  }

  // ---- 申込確定画面の表示 ----
  get 確定画面の日程カード(): Locator { return this.page.locator(".p-hareruya-event-confirm__event-list .c-hareruya-event-card"); }
  get 確定画面の合計金額(): Locator { return this.page.locator(".p-hareruya-event-confirm__total-card .c-hareruya-event-card__detail-value"); }
  get 確定画面の支払方法(): Locator { return this.page.locator(".p-hareruya-event-confirm__payment-method-value"); }
  get 確定画面の隠し支払方法(): Locator { return this.page.locator('#form-registration input[name="payment"]'); }
  /** 開発者ツールで、申込登録の要求の欄を書き換える・足す（申込確定画面） */
  async 確定画面の支払方法を書き換える(値: string): Promise<void> {
    await this.確定画面の隠し支払方法.evaluate((e, v) => { (e as HTMLInputElement).value = v; }, 値);
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
