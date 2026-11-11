/**
 * F06-08 入荷待ち商品一覧（フロントのマイページ）の操作。セレクタ・アドレスはここだけに書く。正本: cases/F06-08_test_cases.tsv
 */
import { Locator, Page, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";
import { FRONT, FrontRestock } from "./f03_07_restock_notify";

export type 言語 = "ja" | "en";
const T = 30_000;

export class NotifyListPage {
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
  async ログアウトする(): Promise<void> {
    await this.page.goto(this.url("/logout"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  async 開く(): Promise<void> {
    await this.page.goto(this.url("/mypage/notifylist"), { timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
  async ログイン画面である(): Promise<boolean> { return (await this.page.locator("form#login_mypage").count()) > 0; }
  async 一覧画面である(): Promise<boolean> { return (await this.page.locator(".p-hareruya-notifylist").count()) > 0; }

  get 見出し(): Locator { return this.page.locator(".p-hareruya-notifylist__title h1"); }
  /** 入荷通知の案内（商品がある場合に出る説明文） */
  get 案内文(): Locator { return this.page.locator(".p-hareruya-notifylist__title p.c-hareruya-text"); }
  /** 入荷待ち商品が無いときの案内（情報の枠） */
  get 商品なしの案内(): Locator { return this.page.locator(".p-hareruya-notifylist__title .p-hareruya-message-box--info"); }
  get マイページボタン(): Locator { return this.page.locator(".p-hareruya-notifylist__button a"); }
  get 商品カード(): Locator { return this.page.locator(".p-hareruya-product-card--notifylist"); }
  async 商品名一覧(): Promise<string[]> {
    return (await this.page.locator(".p-hareruya-product-card--notifylist .p-hareruya-product-card__name-text").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }
  async 商品件数の表示(): Promise<string> {
    const c = this.page.locator(".p-hareruya-notifylist__header .p-hareruya-toolbar__count");
    return (await c.count()) === 0 ? "" : ((await c.first().innerText()) ?? "").replace(/\s+/g, " ").trim();
  }
  /** 一覧の本文（画面上部を含むページ内の主な領域）の文 */
  async 画面上部の文(): Promise<string> {
    return ((await this.page.locator(".p-hareruya-notifylist__title").innerText()) ?? "").replace(/\s+/g, " ").trim();
  }

  // ---- パンくず ----
  get パンくず現在地(): Locator { return this.page.locator(".p-hareruya-breadcrumb__current").first(); }
  async 現在地がリンクか(): Promise<boolean> {
    const cur = this.パンくず現在地;
    return (await cur.locator("a").count()) > 0 || (await cur.evaluate((e) => !!e.closest("a")));
  }
  get パンくずホーム(): Locator { return this.page.locator("a.p-hareruya-breadcrumb__link").first(); }
  async 現在地を押す(): Promise<void> {
    await this.パンくず現在地.evaluate((el) => el.scrollIntoView({ block: "center" }));
    await this.パンくず現在地.click({ timeout: 10_000 }).catch(() => undefined);
    await this.page.waitForTimeout(800);
    await this.page.waitForLoadState("load");
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

  // ---- 一覧の商品の表示（商品名の文で引く。入荷待ち商品の1表示＝商品・言語の組） ----
  商品の表示(商品名: string): Locator {
    return this.商品カード.filter({ has: this.page.locator(".p-hareruya-product-card__name-text", { hasText: 商品名 }) });
  }
  言語ラベル(表示: Locator): Locator { return 表示.locator(".c-hareruya-label--language"); }
  条件の行(表示: Locator): Locator { return 表示.locator(".p-hareruya-product-card__condition-item"); }
  /** 規格単位の解除ボタン（登録済みの通知の表示） */
  規格の解除ボタン(表示: Locator): Locator { return 表示.locator("button.notifyme-cancel"); }
  /** 商品・言語単位（まとめて入荷通知）の解除ボタン */
  まとめての解除ボタン(表示: Locator): Locator { return 表示.locator("button.js-notifylist-bulk-restock"); }
  /** 入荷通知のボタンすべて（解除でないものを含む） */
  通知のボタン(表示: Locator): Locator { return 表示.locator("button.p-hareruya-product-card__notify-btn"); }
  規格のボタン(商品規格ID: string): Locator { return this.page.locator(`button[data-productclass="${商品規格ID}"]`); }
  同名カード検索(表示: Locator): Locator { return 表示.locator(".p-hareruya-product-card__same-search a"); }
  商品画像のリンク(表示: Locator): Locator { return 表示.locator("a.p-hareruya-product-card__img-wrap"); }
  商品画像(表示: Locator): Locator { return 表示.locator("img.p-hareruya-product-card__img"); }
  商品名のリンク(表示: Locator): Locator { return 表示.locator("a.p-hareruya-product-card__name"); }
  /** 商品名の文（空白を除いたもの。「【Foil】」と商品名の間の改行・空白を無視して比べる） */
  async 商品名の文(表示: Locator): Promise<string> {
    return ((await 表示.locator(".p-hareruya-product-card__name-text").first().innerText()) ?? "").replace(/\s+/g, "");
  }
  /** 条件の行ごとの文（状態・価格・解除ボタンの文）。空白は1つにまとめる */
  async 条件の文(表示: Locator): Promise<string[]> {
    return (await this.条件の行(表示).allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }
  async 状態の文(表示: Locator): Promise<string[]> {
    return (await 表示.locator(".p-hareruya-product-card__condition-type").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }
  async 価格の文(表示: Locator): Promise<string[]> {
    return (await 表示.locator(".p-hareruya-product-card__price").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }
  /** 商品詳細画面で選ばれている言語（言語切替ボタンの選択中のもの） */
  async 詳細の選択中の言語(): Promise<string> {
    const b = this.page.locator(".c-hareruya-lang-btn.is-selected").first();
    return (await b.count()) === 0 ? "" : ((await b.getAttribute("data-language")) ?? "");
  }
  get 現在のURL(): URL { return new URL(this.page.url()); }
  async 再読み込みする(): Promise<void> {
    await this.page.reload({ timeout: 60_000 });
    await this.page.waitForLoadState("load");
  }
}

/** 商品詳細画面で、言語を指定して開く（シードの入荷通知の登録用）。通知ボタンの押し方は FrontRestock を使う */
export class 詳細画面 extends FrontRestock {
  async 言語を指定して開く(productId: string, 言語: "JP" | "EN"): Promise<void> {
    const res = await this.page.goto(`${FRONT}/products/detail/${productId}?lang=${言語}`);
    if ((res?.status() ?? 0) >= 400) throw new Error(`商品ID ${productId} の商品詳細画面の応答が ${res?.status()}`);
    await this.page.waitForLoadState("load");
  }
}
