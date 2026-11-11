// 取り込み注記: 同じ部品を main 側も別に実装していたため、栗野側の版を別ファイルにした（栗野側のケース・シードがこちらを使う）。
/**
 * F02-02 本店のスマホ版ナビゲーション。画面上部固定エリア（ロゴ・ポイント・日英切替・メニュー・ナビの項目・カードセット・商品検索）、
 * 画面下部固定エリア（カート・お気に入り・詳細検索・カテゴリ・ログイン/マイページ）、画面下部エリア（バナー・サイトマップ・会社情報・お得な情報・ロゴ）。
 * 画面の作りはアプリのテンプレートで確かめた。期待値はここに書かない（ケースの spec が正本から確かめる）。
 */
import { Locator, Page, Request, expect } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const T = 30_000;
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const exact = (s: string) => new RegExp(`^\\s*${esc(s)}\\s*$`);

export type 言語 = "ja" | "en";
export type 開閉 = "サイトマップ" | "会社情報" | "お得な情報";
const 開閉の区画: Record<開閉, string> = { サイトマップ: "footer-nav-sitemap", 会社情報: "footer-nav-company", お得な情報: "footer-nav-promo" };

/** リンクを押して移った先 */
export type 移った先 = {
  /** 新しいタブで開いたか */
  新しいタブ: boolean;
  /** 移った先の画面のアドレス（読み込み・転送のあと） */
  アドレス: string;
  /** 新しいタブが最初に要求したアドレス（転送の前。新しいタブのときだけ） */
  要求したアドレス?: string;
  /** 同じタブで移ったときの応答の状態 */
  応答?: number;
  /** 移った先の画面（新しいタブならそのタブ） */
  画面: Page;
};

export class SpNavPage {
  constructor(readonly page: Page) {
    page.setDefaultTimeout(T);
    page.setDefaultNavigationTimeout(60_000);
  }

  path(): string { return new URL(this.page.url()).pathname; }

  async ECTOPを開く(言語: 言語 = "ja"): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}/${言語}/`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  async 商品一覧を開く(): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}/ja/products/search`, { timeout: 60_000 });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  async 最下部までスクロールする(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await this.page.waitForTimeout(500);
  }

  // ---- 画面上部固定エリア ----
  readonly 画面上部のロゴ = () => this.page.locator("header a.p-hareruya-header__logo-link").first();
  readonly ポイントの導線 = () => this.page.locator("header a.p-hareruya-header__point-link");
  readonly ポイントの数字 = () => this.page.locator("header .p-hareruya-header__point-value");
  readonly 日英切替 = () => this.page.locator("header a.p-hareruya-header__lang-btn").first();
  readonly メニュー表示ボタン = () => this.page.locator("header button[data-menu-toggle]").first();
  メニューの項目(名前: string | RegExp): Locator {
    return this.page.locator("[data-menu-dropdown] a.p-hareruya-header__menu-link").filter({
      has: this.page.locator(".p-hareruya-header__menu-text", { hasText: typeof 名前 === "string" ? exact(名前) : 名前 }),
    });
  }
  /** メニューの選手一覧の項目（表示名に関わらず、選手のアイコンの項目） */
  readonly メニューの選手一覧 = () => this.page.locator("[data-menu-dropdown] a.p-hareruya-header__menu-link").filter({ has: this.page.locator("i.icon-hareruya-player") });
  readonly メニューの項目の全部 = () => this.page.locator("[data-menu-dropdown] a.p-hareruya-header__menu-link");
  /** 画面上部のナビの項目（ショップ・買取・記事・イベント・店舗一覧） */
  ナビの項目(名前: string): Locator {
    return this.page.locator("header nav.p-hareruya-header__nav a.p-hareruya-header__nav-link", { hasText: exact(名前) });
  }
  readonly ナビの項目の全部 = () => this.page.locator("header nav.p-hareruya-header__nav .p-hareruya-header__nav-link");
  readonly デッキメニュー表示ボタン = () => this.page.locator("header button[data-deck-toggle]").first();
  デッキメニューの項目(名前: string): Locator {
    return this.page.locator("[data-deck-dropdown] a.p-hareruya-header__deck-link", { has: this.page.locator(".p-hareruya-header__deck-text", { hasText: exact(名前) }) });
  }
  readonly カードセット選択メニュー = () => this.page.locator("header button[data-search-category-toggle]").first();
  readonly 商品検索テキストボックス = () => this.page.locator("header #leftmenu_search_goods_name").first();

  // ---- 画面下部固定エリア ----
  private readonly 下のナビ = () => this.page.locator("nav.p-hareruya-bottom-nav");
  readonly カート = () => this.下のナビ().locator("a.p-hareruya-bottom-nav__link").filter({ has: this.page.locator("i.icon-hareruya-cart") }).first();
  readonly カートの商品数 = () => this.カート().locator(".p-hareruya-bottom-nav__badge");
  readonly お気に入り = () => this.下のナビ().locator("a.p-hareruya-bottom-nav__link").filter({ has: this.page.locator("i.icon-hareruya-favorite") }).first();
  readonly お気に入りの商品数 = () => this.お気に入り().locator(".p-hareruya-bottom-nav__badge");
  readonly 詳細検索アイコン = () => this.下のナビ().locator('button[data-modal-open="search"]').first();
  readonly カテゴリアイコン = () => this.下のナビ().locator('button[data-modal-open="category"]').first();
  readonly ログインマイページ = () => this.下のナビ().locator("a.p-hareruya-bottom-nav__link").filter({ has: this.page.locator("i.icon-hareruya-mypage") }).first();
  readonly 詳細検索モーダル = () => this.page.locator("#product-detailed-search-modal");
  readonly お気に入りのログインモーダル = () => this.page.locator("#favorite-login-modal");

  // ---- 画面下部エリア ----
  バナー(画像の名前: string): Locator { return this.page.locator("footer a.p-hareruya-footer__banner-link", { has: this.page.locator(`img[alt="${画像の名前}"]`) }).first(); }
  開閉ボタン(区画: 開閉): Locator { return this.page.locator(`footer button.js-footer-accordion-trigger[aria-controls="${開閉の区画[区画]}"]`); }
  開閉の項目(区画: 開閉, 名前: string): Locator {
    return this.page.locator(`#${開閉の区画[区画]} a.p-hareruya-footer__nav-link`, { hasText: exact(名前) });
  }
  readonly 画面最下部のロゴ = () => this.page.locator("footer a.p-hareruya-footer__logo").last();

  // ---- 操作 ----
  async 押す(l: Locator, 何: string): Promise<void> {
    await expect(l, `${何}（押す前）`).toHaveCount(1, { timeout: T });
    await l.scrollIntoViewIfNeeded({ timeout: T });
    await l.click({ timeout: T });
    await this.page.waitForTimeout(700); // 開閉・表示の切り替えの動きを待つ
  }

  /** リンクを押し、同じタブで移ったか新しいタブが開いたかを見て、移った先を返す */
  async 押して移った先(l: Locator, 何: string): Promise<移った先> {
    await expect(l, `${何}（押す前）`).toHaveCount(1, { timeout: T });
    await l.scrollIntoViewIfNeeded({ timeout: T });
    const ctx = this.page.context();
    const 要求: string[] = [];
    const onReq = (r: Request) => {
      try { const p = r.frame().page(); if (r.isNavigationRequest() && p && p !== this.page && r.frame() === p.mainFrame()) 要求.push(r.url()); } catch { /* 閉じたフレーム */ }
    };
    ctx.on("request", onReq);
    try {
      const tabP = ctx.waitForEvent("page", { timeout: 20_000 }).then((p) => ({ tab: p }), () => null);
      const navP = this.page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 60_000 }).then((r) => ({ res: r }), () => null);
      await l.click({ timeout: T });
      const first = await new Promise<{ tab: Page } | { res: Awaited<ReturnType<Page["waitForNavigation"]>> } | null>((resolve) => {
        let n = 0;
        for (const p of [tabP, navP] as Promise<{ tab: Page } | { res: Awaited<ReturnType<Page["waitForNavigation"]>> } | null>[]) {
          p.then((v) => { if (v) resolve(v); else if (++n === 2) resolve(null); });
        }
      });
      if (!first) throw new Error(`${何}を押しても、画面が移らず新しいタブも開かない`);
      if ("tab" in first) {
        const tab = first.tab;
        await tab.waitForLoadState("domcontentloaded", { timeout: 60_000 }).catch(() => undefined);
        await tab.waitForLoadState("load", { timeout: 20_000 }).catch(() => undefined);
        return { 新しいタブ: true, アドレス: tab.url(), 要求したアドレス: 要求[0], 画面: tab };
      }
      await this.page.waitForLoadState("load");
      return { 新しいタブ: false, アドレス: this.page.url(), 応答: first.res?.status(), 画面: this.page };
    } finally {
      ctx.off("request", onReq);
    }
  }

  /**
   * 要素が利用者に見えているか（表示されていて、閉じた開閉の区画・枠の外に隠れていない）。
   * 開閉の区画は、閉じても高さ0の枠の中に残る作りがあるので、祖先の枠の高さと重なりまで見る。見る前に要素の位置まで画面を動かす。
   */
  async 見えているか(l: Locator): Promise<boolean> {
    if ((await l.count()) === 0) return false;
    return l.first().evaluate((el) => {
      el.scrollIntoView({ block: "nearest" });
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return false;
      for (let e: Element | null = el; e; e = e.parentElement) {
        const s = getComputedStyle(e);
        if (s.display === "none" || s.visibility === "hidden" || Number(s.opacity) === 0) return false;
        if (e !== el && (s.overflowY !== "visible" || s.overflowX !== "visible")) {
          const pr = e.getBoundingClientRect();
          if (pr.height < 1 || pr.width < 1) return false;
          if (r.bottom <= pr.top || r.top >= pr.bottom) return false;
        }
      }
      return true;
    });
  }

  /** スマホ版ナビ（画面上部・メニュー・デッキメニュー・画面下部固定エリア）のリンクとボタンの、表示名・リンク先・見えているか */
  async ナビの導線(): Promise<{ 名前: string; リンク先: string; 見えている: boolean }[]> {
    const all = this.page.locator("header a, header button, [data-menu-dropdown] a, [data-deck-dropdown] a, nav.p-hareruya-bottom-nav a, nav.p-hareruya-bottom-nav button");
    const out: { 名前: string; リンク先: string; 見えている: boolean }[] = [];
    for (const l of await all.all()) {
      const 名前 = ((await l.textContent()) ?? "").replace(/\s+/g, " ").trim() || ((await l.getAttribute("aria-label")) ?? "");
      out.push({ 名前, リンク先: (await l.getAttribute("href")) ?? "", 見えている: await this.見えているか(l) });
    }
    return out;
  }

  async テキスト(l: Locator): Promise<string> { return ((await l.first().textContent({ timeout: T })) ?? "").replace(/\s+/g, " ").trim(); }

  /** 開いた画面の表示言語（html の lang） */
  async 表示言語(p: Page): Promise<string> {
    return (await p.locator("html").getAttribute("lang", { timeout: T }).catch(() => null)) ?? "";
  }

  /** 商品検索の候補リストの取得先への要求を記録しはじめる。止める関数を返す */
  候補の要求を記録する(): { 要求: string[]; 止める: () => void } {
    const 要求: string[] = [];
    const on = (r: Request) => { if (/\/products\/search\/unisuggest_api(\?|$)/.test(r.url())) 要求.push(r.url()); };
    this.page.on("request", on);
    return { 要求, 止める: () => this.page.off("request", on) };
  }
  /** 候補リストの取得先への要求のアドレスから、会員を識別する値（無ければ空） */
  会員を識別する値(要求: string): string { return new URL(要求).searchParams.get("loginid") ?? ""; }
  /** 商品検索テキストボックスに1文字ずつ入れる（入力のたびに候補を求める画面の作りに合わせる） */
  async 商品検索に入れる(語: string): Promise<void> {
    const box = this.商品検索テキストボックス();
    await expect(box, "商品検索テキストボックス").toBeVisible({ timeout: T });
    await box.click({ timeout: T });
    await box.pressSequentially(語, { delay: 100 });
  }
}
