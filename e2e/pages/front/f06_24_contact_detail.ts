/**
 * F06-24 お問い合わせ履歴詳細（フロントのマイページ）の操作と、シードが使うお問い合わせ画面の送信。セレクタ・アドレスはここだけに書く。
 * 正本: cases/F06-24_test_cases.tsv
 * 一覧の画面の操作は F06-23 の部品（ContactHistoryPage）を引き継いで使う。
 */
import { Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { ContactHistoryPage, 言語 } from "./f06_23_contact_history";

const T = 30_000;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const 整える = (s: string | null | undefined) => (s ?? "").replace(/\s+/g, " ").trim();

export class ContactDetailPage extends ContactHistoryPage {
  constructor(page: Page, 言: 言語 = "ja") { super(page, 言); }

  /** 一覧の、お問い合わせ番号の行のリンク（行全体が詳細へのリンク） */
  番号のリンク(番号: string): Locator {
    return this.page.locator("a.p-hareruya-contact-list__link").filter({
      has: this.page.locator(".p-hareruya-contact-list__number", { hasText: new RegExp(`[：:]\\s*${esc(番号)}\\s*[）)]`) }),
    });
  }
  /** 一覧の先頭の行のお問い合わせ番号（無ければ空） */
  async 先頭の番号(): Promise<string> {
    const n = this.page.locator(".p-hareruya-contact-list__number").first();
    if ((await n.count()) === 0) return "";
    return /(\d+)/.exec(await n.innerText())?.[1] ?? "";
  }
  async 詳細画面である(): Promise<boolean> {
    return (await this.page.locator(".p-hareruya-history-detail--contact").count()) > 0 && /\/contact\/history\/\d+\/detail/.test(this.path);
  }
  /** アドレスのお問い合わせ番号を置き換えたアドレス */
  番号を置き換えたURL(番号: string): string {
    const u = new URL(this.page.url());
    u.pathname = u.pathname.replace(/(\/contact\/history\/)\d+(\/detail)/, `$1${番号}$2`);
    return u.toString();
  }
  /** アドレスを開く（応答の状態を返す） */
  async URLを開く(url: string): Promise<number> {
    const res = await this.page.goto(url, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  async ログアウトする(): Promise<void> {
    await this.page.goto(`${BASE_URL}/${this.言語}/logout`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }

  // ---- 詳細の画面の項目 ----
  get 詳細の枠(): Locator { return this.page.locator(".p-hareruya-history-detail--contact"); }
  get お問い合わせ情報(): Locator { return this.page.locator(".p-hareruya-contact-detail__header"); }
  get お問い合わせ時氏名(): Locator { return this.page.locator(".p-hareruya-contact-detail__name"); }
  get お問い合わせ内容(): Locator { return this.page.locator(".p-hareruya-contact-detail__text"); }
  get 戻る(): Locator { return this.page.locator(".p-hareruya-history-detail__btn a").first(); }
  /** 詳細の枠（パンくず・見出し・本文・戻る）の文。無ければ空 */
  async 詳細の枠の文(): Promise<string> {
    return (await this.詳細の枠.count()) === 0 ? "" : 整える(await this.詳細の枠.first().innerText());
  }
  /** 画面の本文（ヘッダー・フッターを含む、見えている文） */
  async 画面の文(): Promise<string> { return 整える(await this.page.locator("body").innerText()); }

  /** パンくずの現在表示中ページを押す。アドレスが変わったかを返す */
  async 現在地を押す(): Promise<boolean> {
    const before = this.page.url();
    await this.パンくず現在地.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await this.パンくず現在地.click({ timeout: 10_000 });
    await this.page.waitForTimeout(800);
    await this.page.waitForLoadState("load");
    return this.page.url() !== before;
  }

  /** 画面に出ているインラインのエラー・警告、フラッシュ、トースト（見えているものの文） */
  async エラーや通知の表示(): Promise<string[]> {
    const sel = [
      ".invalid-feedback", ".is-invalid", ".c-hareruya-form-error", ".form-error-message",
      ".p-hareruya-flash", ".p-hareruya-message-box--error", ".p-hareruya-message-box--warning", ".ec-alert-warning", ".alert",
      ".p-hareruya-toast", ".toast", "#hareruya-app-cart-popup", "[role=alert]",
    ].join(", ");
    return this.page.locator(sel).evaluateAll((ns) => ns
      .filter((n) => (n as HTMLElement).offsetParent !== null)
      .map((n) => (n.textContent ?? "").replace(/\s+/g, " ").trim()).filter(Boolean));
  }
}

// ---- お問い合わせ画面（シードがお問い合わせを送るのに使う） ----

/** お問い合わせ画面の件名の選択肢（表示の名前） */
export async function 件名の選択肢(page: Page, 言: 言語 = "ja"): Promise<string[]> {
  await page.goto(`${BASE_URL}/${言}/contact`, { timeout: 60_000 });
  await page.waitForLoadState("load");
  return (await page.locator("#contact_subject option").allInnerTexts()).map((t) => t.trim()).filter(Boolean);
}

export type 送るお問い合わせ = { 件名: string; 姓: string; 名: string; 電話番号: [string, string, string]; メール: string; 内容: string };

/**
 * 日本語版のお問い合わせ画面で件名・氏名・電話番号・メールアドレス・内容を入れ（店舗と付帯情報は入れない）、「確認画面へ」→ 確認画面の「送信」を押す。
 * 完了画面にならなければ落とす。ログインは呼び出し側で済ませておく。
 */
export async function お問い合わせを送る(page: Page, v: 送るお問い合わせ): Promise<void> {
  page.setDefaultTimeout(T);
  await page.goto(`${BASE_URL}/ja/contact`, { timeout: 60_000 });
  await page.waitForLoadState("load");
  const form = page.locator("form#contact-form");
  await form.locator("#contact_subject").selectOption({ label: v.件名 });
  await form.locator("#contact_name_name01").fill(v.姓);
  await form.locator("#contact_name_name02").fill(v.名);
  await form.locator("#contact_tel_tel01").fill(v.電話番号[0]);
  await form.locator("#contact_tel_tel02").fill(v.電話番号[1]);
  await form.locator("#contact_tel_tel03").fill(v.電話番号[2]);
  await form.locator("#contact_email").fill(v.メール);
  await form.locator("#contact_contents").fill(v.内容);
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), form.locator("#submitButton").click()]);
  await page.waitForLoadState("load");
  const complete = page.locator('form#contact-form button[name="mode"][value="complete"]');
  if ((await complete.count()) === 0) {
    const errs = (await page.locator(".invalid-feedback, .c-hareruya-form-error, .form-error-message, .is-error").allInnerTexts()).map(整える).filter(Boolean);
    throw new Error(`お問い合わせ画面の「確認画面へ」で確認画面にならない（${errs.join(" / ") || new URL(page.url()).pathname}）`);
  }
  await Promise.all([page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }), complete.click()]);
  await page.waitForLoadState("load");
  if (!/\/contact\/complete/.test(new URL(page.url()).pathname)) throw new Error(`お問い合わせの送信が完了画面にならない（${new URL(page.url()).pathname}）`);
}
