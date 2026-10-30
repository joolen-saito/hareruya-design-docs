/**
 * 公開側の商品一覧（F03-01）。公開側の部品は機能ごとにファイルを分けている（F03-03・F03-07 など別の担当と二重に作らない）。
 * 商品詳細検索のモーダルそのものの操作は pages/front/f03_03_detail_search.ts を使う。
 */
import { Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export const 店舗の入口 = { 本店: "/ja", TC大阪支店: "/ja/osaka" } as const;

export class FrontProductList {
  constructor(readonly page: Page) {}

  /** 商品一覧を開く（検索条件なし）。shop は本店なら "/ja"、支店なら "/ja/osaka" */
  async open(shop: string, path = "/products/search"): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}${shop}${path}`, { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }

  /** 画面の読み込みと、検索サービスへの問い合わせ（あれば）が落ち着くのを待つ。商品が「無い」ことを数える前に呼ぶ */
  async 描画を待つ(): Promise<void> {
    await this.page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
    await this.page.waitForTimeout(1500);
  }

  // ---- パンくず ----
  パンくずのホーム(): Locator {
    return this.page.locator(".p-hareruya-breadcrumb__link[aria-label], .p-hareruya-breadcrumb__item:first-child .p-hareruya-breadcrumb__link").first();
  }
  async パンくずのホームを押す(): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      this.パンくずのホーム().click({ timeout: 30_000 }),
    ]);
    await this.page.waitForLoadState("load");
  }

  // ---- 検索エンジン向けの指定 ----
  /** HTMLのheadのロボット向け指定（meta robots）の内容 */
  async ロボット向け指定(): Promise<string[]> {
    return this.page.locator('head meta[name="robots"]').evaluateAll((ms) => ms.map((m) => (m as HTMLMetaElement).content));
  }

  // ---- 商品詳細検索の入口 ----
  画面上部の商品詳細検索(): Locator {
    return this.page.locator('.p-hareruya-header__nav-right-link[data-modal-open="search"]:visible').first();
  }
  /** 絞り込み領域（商品一覧の左の欄・SP版は絞り込みの並び）の詳細検索ボタン */
  絞り込み領域の詳細検索(): Locator {
    return this.page.locator('.p-hareruya-product-list__filter-detail-btn.js-product-detailed-search-open:visible, #product-list-detailed-search:visible').first();
  }
  async 絞り込み領域の詳細検索を押す(): Promise<"絞り込み領域の詳細検索ボタン" | "画面上部の詳細検索ボタン"> {
    await this.page.mouse.move(640, 400);
    const button = this.絞り込み領域の詳細検索();
    await button.waitFor({ state: "visible", timeout: 30_000 });
    await button.evaluate((e) => e.scrollIntoView({ block: "center" }));
    try {
      await button.click({ timeout: 8_000 });
      return "絞り込み領域の詳細検索ボタン";
    } catch {
      // 固定のヘッダーがボタンに重なって押せないときは、画面上部の入口を押す（F03-03 と同じ）
      await this.page.evaluate(() => window.scrollTo(0, 0));
      await this.画面上部の商品詳細検索().click({ timeout: 30_000 });
      return "画面上部の詳細検索ボタン";
    }
  }

  // ---- 表示されている部品（検索条件なしで開いたときの確認） ----
  get 検索フォーム(): Locator { return this.page.locator("form#frmSearch"); }
  get ログイン用フォーム(): Locator { return this.page.locator("form#favorite-login-form, form#notify-login-form"); }
  get 商品の一覧(): Locator { return this.page.locator(".p-hareruya-product-list__grid"); }
  get 商品カード(): Locator { return this.page.locator('[class*="p-hareruya-product-card"]:visible'); }
  get 商品数(): Locator { return this.page.locator(".p-hareruya-toolbar__count"); }
  get ページ送り(): Locator { return this.page.locator(".p-hareruya-pagination"); }
}
