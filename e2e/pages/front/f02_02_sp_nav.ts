/**
 * F02-02 本店のスマホ版ナビゲーションの操作と読み取り（ヘッダ・メニュー・デッキメニュー・下部固定のナビ・フッタの開閉欄・バナー・カードセット選択）。
 * セレクタはここだけに書く。正本: cases/F02-02_test_cases.tsv
 * 画面の作り: Block/header.twig・mega_menu.twig・bottom_nav.twig・search_product.twig・footer.twig・footer_sitemap/company/promo.twig
 */
import { Locator, Page, expect, test } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const T = 30_000;

export type 言語 = "ja" | "en";
/** 押した結果の行き先。新しいタブで開いたときは、そのタブのアドレス */
export type 行き先 = { url: string; path: string; 新しいタブ: boolean; リンク先: string };

export class SpNavPage {
  constructor(readonly page: Page) {
    page.setDefaultTimeout(T);
    page.setDefaultNavigationTimeout(60_000);
  }

  path(): string { return new URL(this.page.url()).pathname; }

  // ---- 画面を開く ----
  async トップを開く(言語: 言語 = "ja"): Promise<void> { await this.開く(`/${言語}/`); }
  async 商品一覧を開く(): Promise<void> { await this.開く("/ja/products/search"); }
  async 開く(path: string): Promise<void> {
    const res = await this.page.goto(`${BASE_URL}${path}`, { timeout: 60_000 });
    expect(res?.status() ?? 0, `${path} の応答`).toBeLessThan(400);
    await this.page.waitForLoadState("load");
  }
  async 最下部までスクロールする(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(300);
  }

  // ---- ヘッダ ----
  readonly 上部のロゴ = () => this.page.locator("a.p-hareruya-header__logo-link:visible, a.p-hareruya-header__search-sticky-logo:visible").first();
  ヘッダのリンク(名前: string): Locator {
    return this.page.locator("header .p-hareruya-header__nav-link:visible").filter({ hasText: new RegExp(`^\\s*${名前}\\s*$`) }).first();
  }
  readonly 日英切替 = () => this.page.locator("a.p-hareruya-header__lang-btn:visible").first();
  readonly ポイント = () => this.page.locator("a.p-hareruya-header__point-link");
  readonly メニュー表示ボタン = () => this.page.locator("button[data-menu-toggle]").first();
  readonly メニューの欄 = () => this.page.locator("[data-menu-dropdown]").first();
  メニューの項目(名前: string): Locator {
    return this.page.locator("[data-menu-dropdown] a.p-hareruya-header__menu-link").filter({ has: this.page.locator(".p-hareruya-header__menu-text", { hasText: new RegExp(`^\\s*${名前}\\s*$`) }) }).first();
  }
  readonly デッキメニュー表示ボタン = () => this.page.locator("button[data-deck-toggle]:visible").first();
  デッキメニューの項目(名前: string): Locator {
    return this.page.locator("[data-deck-dropdown] a.p-hareruya-header__deck-link").filter({ hasText: new RegExp(`^\\s*${名前}\\s*$`) }).first();
  }

  // ---- 商品検索の欄（カードセット選択・詳細検索） ----
  readonly カードセット選択メニュー = () => this.page.locator("button[data-search-category-toggle]:visible").first();
  readonly カードセットの選択肢 = () => this.page.locator("[data-search-category-dropdown] [data-search-category-item]");
  カードセットの選択肢の(名前: string): Locator {
    return this.page.locator("[data-search-category-dropdown] [data-search-category-item]").filter({ hasText: new RegExp(`^\\s*${名前}\\s*$`) }).first();
  }
  /** 選択中のカードセットの表示。PC幅は選択メニューのボタンの文字、スマホ幅は検索欄の下の札（絞り込みの表示）に出る */
  readonly カードセットの選択中の名前 = () => this.page.locator("[data-search-category-text]:visible, [data-search-filter-area]:visible [data-search-filter-text]").first();
  readonly カードセットの選択中の値 = () => this.page.locator("input[data-search-category-input]").first();
  async 選択肢に出ているカードセット(): Promise<string[]> {
    return (await this.カードセットの選択肢().allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }
  readonly 詳細検索アイコン = () => this.page.locator('[data-modal-open="search"]:visible').first();
  readonly 詳細検索モーダル = () => this.page.locator("#product-detailed-search-modal");

  // ---- 下部固定のナビ ----
  readonly 下部のナビ = () => this.page.locator("nav.p-hareruya-bottom-nav");
  readonly お気に入り = () => this.page.locator('nav.p-hareruya-bottom-nav a[href*="/mypage/favorite"]').first();
  readonly お気に入りの商品数 = () => this.page.locator('nav.p-hareruya-bottom-nav a[href*="/mypage/favorite"] .p-hareruya-bottom-nav__badge');
  readonly お気に入りのログインモーダル = () => this.page.locator("#favorite-login-modal");
  readonly ログインマイページ = () => this.page.locator('nav.p-hareruya-bottom-nav a[href*="/mypage/login"], nav.p-hareruya-bottom-nav a[href$="/mypage"], nav.p-hareruya-bottom-nav a[href$="/mypage/"]').first();
  async モーダルが開いているか(l: Locator): Promise<boolean> {
    return l.evaluate((el) => el.classList.contains("is-active") || el.getAttribute("aria-hidden") === "false").catch(() => false);
  }

  // ---- フッタ ----
  readonly 最下部のロゴ = () => this.page.locator("footer a.p-hareruya-footer__logo").first();
  開閉ボタン(欄: "サイトマップ" | "会社情報" | "お得な情報"): Locator {
    const id = { サイトマップ: "footer-nav-sitemap", 会社情報: "footer-nav-company", お得な情報: "footer-nav-promo" }[欄];
    return this.page.locator(`footer button.p-hareruya-footer__nav-toggle[aria-controls="${id}"]`).first();
  }
  フッタの項目(欄: "サイトマップ" | "会社情報" | "お得な情報", 名前: string): Locator {
    const id = { サイトマップ: "footer-nav-sitemap", 会社情報: "footer-nav-company", お得な情報: "footer-nav-promo" }[欄];
    return this.page.locator(`#${id} a.p-hareruya-footer__nav-link`).filter({ hasText: new RegExp(`^\\s*${名前.replace(/[「」!]/g, (c) => `\\${c}`)}\\s*$`) }).first();
  }
  /**
   * フッタの開閉欄の項目が、欄の見えている範囲の中にあるか。閉じた欄は高さを0にしてはみ出しを隠す作り（CSS の max-height:0・overflow:hidden）で、
   * Playwright の「見えているか」は中のリンクを見えていると判断するため、欄の見えている範囲と項目の位置を比べる。開閉の動き（0.3秒）が終わるのを待ってから読む。
   */
  async 欄の中で見えているか(欄: "サイトマップ" | "会社情報" | "お得な情報", 名前: string): Promise<boolean> {
    await this.page.waitForTimeout(500);
    const item = this.フッタの項目(欄, 名前);
    if ((await item.count()) === 0) return false;
    return item.evaluate((el) => {
      const body = el.closest(".p-hareruya-footer__nav-body") as HTMLElement | null;
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return false;
      if (!body) return true;
      const b = body.getBoundingClientRect();
      return r.bottom > b.top + 0.5 && r.top < b.bottom - 0.5 && b.height >= 1;
    });
  }
  readonly 働こうの画像 = () => this.page.locator("footer .p-hareruya-footer__banner-main a.p-hareruya-footer__banner-link").first();
  バナー(先: "hareruya2" | "hareruya3"): Locator {
    return this.page.locator(`footer .p-hareruya-footer__banner-sub-list a.p-hareruya-footer__banner-link[href*="${先}"]`).first();
  }

  // ---- 押す ----
  /**
   * 要素を押す。下部固定のナビなどが重なって普通のクリックが通らないときは、クリックの操作を要素へ直接送る（注記「正本の外の補い」を残す）。
   */
  async 押す(l: Locator, 何: string): Promise<void> {
    await expect(l, 何).toBeVisible({ timeout: T });
    await l.scrollIntoViewIfNeeded().catch(() => undefined);
    try {
      await l.click({ timeout: 10_000 });
    } catch (e) {
      test.info().annotations.push({ type: "正本の外の補い", description: `「${何}」は画面の固定の欄が上に重なり、普通のクリックでは押せなかった。クリックの操作を要素へ直接送って続けた（${String(e).split("\n")[0].slice(0, 80)}）` });
      await l.dispatchEvent("click");
    }
  }

  /** リンクを押し、行き先（同じタブで移った先、または新しいタブで開いた先）を返す。新しいタブは読んだあと閉じる */
  async 押して行き先を読む(l: Locator, 何: string): Promise<行き先> {
    await expect(l, 何).toBeVisible({ timeout: T });
    const target = (await l.getAttribute("target")) ?? "";
    const href = (await l.getAttribute("href")) ?? "";
    const リンク先 = href ? new URL(href, this.page.url()).toString() : "";
    if (target === "_blank") {
      const popupP = this.page.context().waitForEvent("page", { timeout: T });
      await this.押す(l, 何);
      const popup = await popupP;
      await popup.waitForLoadState("domcontentloaded", { timeout: 45_000 }).catch(() => undefined);
      await popup.waitForURL((u) => u.toString() !== "about:blank", { timeout: 15_000 }).catch(() => undefined);
      const url = popup.url();
      await popup.close().catch(() => undefined);
      return { url, path: url.startsWith("http") ? new URL(url).pathname : "", 新しいタブ: true, リンク先 };
    }
    const before = this.page.url();
    const nav = this.page.waitForURL((u) => u.toString() !== before, { timeout: 60_000 }).catch(() => undefined);
    await this.押す(l, 何);
    await nav;
    await this.page.waitForLoadState("load");
    return { url: this.page.url(), path: this.path(), 新しいタブ: false, リンク先 };
  }
}

/** 比べるためのアドレス（問い合わせの部分を外し、末尾の / をそろえる） */
export function アドレスの本体(url: string): string {
  if (!/^https?:/.test(url)) return url;
  const u = new URL(url);
  return `${u.origin}${u.pathname.replace(/\/+$/, "")}`;
}
