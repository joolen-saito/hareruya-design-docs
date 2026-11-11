/** F06-23 お問い合わせ履歴（フロントのマイページ）の操作。セレクタ・アドレスはここだけに書く。正本: cases/F06-23_test_cases.tsv */
import { Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const T = 30_000;
export type 言語 = "ja" | "en";

/** お問い合わせ画面の件名の選択肢（種別ID＝選択肢の値と、表示の名前）。シードが使う種別を決めるのに使う */
export async function 件名の種別一覧(page: Page, 言: 言語): Promise<{ 種別ID: string; 名称: string }[]> {
  await page.goto(`${BASE_URL}/${言}/contact`, { timeout: 60_000 });
  await page.waitForLoadState("load");
  return page.locator("#contact_subject option").evaluateAll((os) => os
    .map((o) => ({ 種別ID: (o as HTMLOptionElement).value, 名称: (o.textContent ?? "").trim() })).filter((o) => o.種別ID !== "" && o.名称 !== ""));
}

export class ContactHistoryPage {
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
  async 開く(): Promise<void> {
    await this.page.goto(this.url("/contact/history"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  async 履歴画面である(): Promise<boolean> { return (await this.page.locator(".p-hareruya-history-list").count()) > 0 && /contact\/history/.test(this.path); }
  get パンくず(): Locator { return this.page.locator("nav.p-hareruya-breadcrumb"); }
  get パンくず現在地(): Locator { return this.page.locator(".p-hareruya-breadcrumb__current").first(); }
  async 現在地がリンクか(): Promise<boolean> {
    const cur = this.パンくず現在地;
    return (await cur.locator("a").count()) > 0 || (await cur.evaluate((e) => !!e.closest("a")));
  }
  get パンくずホーム(): Locator { return this.page.locator("a.p-hareruya-breadcrumb__link").first(); }
  get マイページへ戻る(): Locator { return this.page.locator(".p-hareruya-history-list__btn a").first(); }
  async 件数の表示(): Promise<string> {
    const c = this.page.locator(".p-hareruya-toolbar__count");
    return (await c.count()) === 0 ? "" : ((await c.first().innerText()) ?? "").replace(/\s+/g, " ").trim();
  }
  // ---- 一覧の行 ----
  get 一覧の行(): Locator { return this.page.locator(".p-hareruya-contact-list__item"); }
  /** 一覧の行（上から順）の問い合わせ日時・お問い合わせ種別・お問い合わせ番号 */
  async 行の内容(): Promise<{ 日時: string; 種別: string; 番号: string }[]> {
    const rows = this.一覧の行;
    const out: { 日時: string; 種別: string; 番号: string }[] = [];
    for (let i = 0; i < (await rows.count()); i++) {
      const r = rows.nth(i);
      const t = async (sel: string) => ((await r.locator(sel).first().innerText().catch(() => "")) ?? "").replace(/\s+/g, " ").trim();
      out.push({ 日時: await t(".p-hareruya-contact-list__date"), 種別: await t(".p-hareruya-contact-list__subject"), 番号: /(\d+)/.exec(await t(".p-hareruya-contact-list__number"))?.[1] ?? "" });
    }
    return out;
  }
  /** 一覧のうち、問い合わせ日時の表示が一致する行（無ければ undefined） */
  async 日時の行(日時: string): Promise<{ 日時: string; 種別: string; 番号: string } | undefined> {
    return (await this.行の内容()).find((r) => r.日時 === 日時);
  }
  /** 番号の行の、押す対象（種別・番号） */
  番号の行(番号: string): Locator {
    return this.一覧の行.filter({ has: this.page.locator(".p-hareruya-contact-list__number", { hasText: new RegExp(`[：:]\\s*${番号}\\s*[）)]`) }) });
  }
  get 行の種別(): string { return ".p-hareruya-contact-list__subject"; }
  get 行の番号(): string { return ".p-hareruya-contact-list__number"; }

  async 履歴なしの案内(): Promise<string> {
    const m = this.page.locator(".p-hareruya-history-list__title .p-hareruya-message-box--info");
    return (await m.count()) === 0 ? "" : ((await m.first().innerText()) ?? "").replace(/\s+/g, " ").trim();
  }
  /** 画面上部（見出しまわり）の文 */
  async 画面上部の文(): Promise<string> {
    const c = this.page.locator(".p-hareruya-history-list__container");
    return (await c.count()) === 0 ? "" : ((await c.first().innerText()) ?? "").replace(/\s+/g, " ").trim();
  }
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
