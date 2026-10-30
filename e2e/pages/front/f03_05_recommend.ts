/**
 * 公開側の商品詳細にある「あなたへのおすすめアイテム」枠（F03-05）。
 * 公開側の部品は機能ごとにファイルを分けている。
 */
import { Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export class FrontRecommend {
  constructor(readonly page: Page) {}

  /** 商品詳細を開く（店の入口は本店なら "/ja"） */
  async 商品詳細を開く(店の入口: string, 商品ID: string): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}${店の入口}/products/detail/${商品ID}`, { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }

  /** 画面上部の言語切替（日本語表示のとき「English」、英語表示のとき「日本語」）を押して、切り替わるのを待つ */
  async 言語を切り替える(): Promise<void> {
    const link = this.page.locator(".p-hareruya-header__nav-item--lang a").first();
    await link.waitFor({ state: "visible", timeout: 30_000 });
    await Promise.all([this.page.waitForNavigation({ waitUntil: "domcontentloaded" }), link.click()]);
    await this.page.waitForLoadState("load");
  }

  /** 表示言語（画面の言語の指定） */
  async 表示言語(): Promise<string> {
    return (await this.page.locator("html").getAttribute("lang")) ?? "";
  }

  /** おすすめ商品枠（見出しと、商品の一覧またはおすすめ商品なしの案内を含む） */
  get 枠(): Locator { return this.page.locator(".p-hareruya-product-detail__recommend"); }
  get 見出し(): Locator { return this.枠.locator("h2"); }
  get 商品カード(): Locator { return this.枠.locator(".p-hareruya-product-card"); }
  get おすすめ商品なしの案内(): Locator { return this.枠.locator(".p-hareruya-recommend-empty"); }

  /** おすすめ商品枠までスクロールする */
  async 枠までスクロールする(): Promise<void> {
    await this.枠.first().scrollIntoViewIfNeeded({ timeout: 30_000 });
    await this.page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
  }

  /** 画面に出ているインラインエラー・フラッシュ・トースト（枠の中のエラー表示を含む） */
  async エラーや通知の表示(): Promise<string[]> {
    const sel = [
      ".p-hareruya-product-detail__recommend .invalid-feedback", ".p-hareruya-product-detail__recommend .is-invalid", ".p-hareruya-product-detail__recommend [role=alert]",
      ".c-hareruya-form-error", ".p-hareruya-flash", ".p-hareruya-toast", ".toast", "[role=alert]", ".ec-alert-warning", ".alert",
    ].join(", ");
    return this.page.locator(sel).evaluateAll((ns) => ns
      .filter((n) => (n as HTMLElement).offsetParent !== null)
      .map((n) => (n.textContent ?? "").replace(/\s+/g, " ").trim()).filter(Boolean));
  }
}
