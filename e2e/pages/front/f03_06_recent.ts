/**
 * 公開側の「最近チェックした商品」（F03-06）。本店ECTOP・商品一覧・商品詳細に出る。
 * 閲覧履歴は、商品IDをコンマでつないだ1つのCookieで持つ（本店・各支店で共通）。
 */
import { BrowserContext, Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export const 入口 = {
  本店: "/ja", TC大阪支店: "/ja/osaka", 本店英語版: "/en", TC大阪支店英語版: "/en/osaka",
} as const;

const HISTORY_COOKIE = "history";

/** ブラウザーのCookie編集にあたる操作: 閲覧履歴のCookieを商品IDの並びに設定する */
export async function 閲覧履歴を設定(context: BrowserContext, 商品ID: string[]): Promise<void> {
  await context.addCookies([{ name: HISTORY_COOKIE, value: 商品ID.join(","), url: BASE_URL }]);
}

/** 閲覧履歴のCookie（有効期限は秒。セッションCookieは -1） */
export async function 閲覧履歴のCookie(context: BrowserContext): Promise<{ value: string; expires: number } | undefined> {
  const c = (await context.cookies(BASE_URL)).find((x) => x.name === HISTORY_COOKIE);
  return c ? { value: c.value, expires: c.expires } : undefined;
}

export class FrontRecent {
  constructor(readonly page: Page) {}

  async open(path: string): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}${path}`, { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  async 商品詳細を開く(店の入口: string, 商品ID: string): Promise<number> {
    const s = await this.open(`${店の入口}/products/detail/${商品ID}`);
    // 詳細画面のスクリプトが閲覧履歴のCookieを更新するのを待つ
    await this.page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
    await this.page.waitForTimeout(1000);
    return s;
  }
  async 商品一覧を開く(店の入口: string): Promise<number> {
    const s = await this.open(`${店の入口}/products/search`);
    await this.描画を待つ();
    return s;
  }
  async 描画を待つ(): Promise<void> {
    await this.page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
    await this.page.waitForTimeout(1500);
  }

  /** 「最近チェックした商品」「Recently Viewed」の見出し */
  get 見出し(): Locator {
    return this.page.locator("h2").filter({ hasText: /^\s*(最近チェックした商品|Recently Viewed)\s*$/ });
  }
  /** 見出しを含むブロック（見出し・サムネイル一覧・履歴無しの表示を含む） */
  get ブロック(): Locator {
    return this.見出し.first().locator("xpath=ancestor::*[contains(@class,'__history') or contains(@class,'p-hareruya-section')][1]");
  }
  get 商品カード(): Locator { return this.ブロック.locator(".p-hareruya-product-card"); }

  async 見出しは表示されている(): Promise<boolean> {
    return (await this.見出し.count()) > 0 && (await this.見出し.first().isVisible());
  }
  /** 並んでいる商品名（表示順） */
  async 商品名の並び(): Promise<string[]> {
    return this.商品カード.locator(".p-hareruya-product-card__name-text").evaluateAll((ns) => ns.map((n) => (n.textContent ?? "").replace(/\s+/g, " ").trim()));
  }
  カード(商品名: string): Locator {
    return this.商品カード.filter({ has: this.page.locator(".p-hareruya-product-card__name-text", { hasText: new RegExp(`^\\s*${商品名.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`) }) });
  }
  /** ブロックの中の文（履歴が無い旨などを探す） */
  async ブロックの文(): Promise<string> {
    if ((await this.見出し.count()) === 0) return "";
    return ((await this.ブロック.first().innerText()) ?? "").replace(/\s+/g, " ").trim();
  }

  サムネイル画像(商品名: string): Locator { return this.カード(商品名).locator("img.p-hareruya-product-card__img").first(); }
  セールアイコン(商品名: string): Locator { return this.カード(商品名).locator(".p-hareruya-product-card__sale-label"); }
  カード言語(商品名: string): Locator { return this.カード(商品名).locator(".p-hareruya-product-card__language-label"); }
  商品名リンク(商品名: string): Locator { return this.カード(商品名).locator("a.p-hareruya-product-card__name"); }
  商品画像拡大(商品名: string): Locator { return this.カード(商品名).locator("button.p-hareruya-product-card__expand-icon, .p-hareruya-product-card__expand-icon").first(); }
  /** 商品画像そのもの（押すと拡大画像を表示する） */
  商品画像(商品名: string): Locator { return this.カード(商品名).locator("button.p-hareruya-product-card__img-wrap, a.p-hareruya-product-card__img-wrap").first(); }

  /** 拡大画像の表示（モーダル） */
  get 拡大画像(): Locator { return this.page.locator("#product-image-zoomer.is-active .p-imageZoomer__img"); }
}
