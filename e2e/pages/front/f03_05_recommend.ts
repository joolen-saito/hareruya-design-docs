/**
 * 公開側の商品詳細にある「あなたへのおすすめアイテム」枠（F03-05）。
 * 公開側の部品は機能ごとにファイルを分けている。
 */
import { expect, Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

/** おすすめ商品枠のある画面。枠の外側の class が画面ごとに違う（Block/user_recommend_product.twig） */
export type 画面 = "商品詳細" | "マイページ" | "買い物かご";
const 枠のセレクタ: Record<画面, string> = {
  商品詳細: ".p-hareruya-product-detail__recommend",
  マイページ: ".p-hareruya-mypage__recommend",
  買い物かご: ".p-hareruya-checkout__recommend",
};

export type 表示された商品 = { 商品ID: string; 名前: string; Foilの装飾: boolean };

export class FrontRecommend {
  constructor(readonly page: Page, readonly 画面: 画面 = "商品詳細") {}

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
  get 枠(): Locator { return this.page.locator(枠のセレクタ[this.画面]); }
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

  /** マイページを開く（本店・日本語） */
  async マイページを開く(): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}/ja/mypage`, { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }

  /** 買い物かごを開く（本店・日本語） */
  async 買い物かごを開く(): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}/ja/cart`, { waitUntil: "domcontentloaded" });
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }

  /** 商品詳細の「カートに入れる」で、数量を入れられる先頭の規格の行に1点を入れる（未ログインでも使える） */
  async カートに1個入れる(商品ID: string, what: string): Promise<void> {
    const page = this.page;
    await this.商品詳細を開く("/ja", 商品ID);
    const form = page.locator(`form#productForm${商品ID}`);
    if ((await form.count()) !== 1) throw new Error(`${what}: 商品詳細の画面（商品ID ${商品ID}）にカートのフォームが無い`);
    const table = form.locator('[id^="priceTable-"]:visible');
    const qty = table.locator("tbody tr .qty-label:visible").first();
    await qty.waitFor({ state: "visible", timeout: 30_000 });
    await qty.fill("1");
    await qty.blur();
    const [res] = await Promise.all([
      page.waitForResponse((r) => r.url().includes(`/products/add_cart/${商品ID}`) && r.request().method() === "POST"),
      form.locator("button.add-cart").dispatchEvent("click"),
    ]);
    if (res.status() >= 400) throw new Error(`${what}: カートへの追加の応答が ${res.status()}`);
    const body = await res.json().catch(() => null) as { done?: boolean; messages?: string[] } | null;
    if (body && body.done === false) throw new Error(`${what}: カートに入れられない: ${(body.messages ?? []).join(" / ")}`);
  }

  /** 枠の描画を待つ（商品が出るか、おすすめ商品なしの案内が出るまで）。待たずに0件と数えて合格にしない */
  async 描画を待つ(): Promise<void> {
    await this.枠.first().waitFor({ state: "attached", timeout: 30_000 });
    await this.枠.first().locator(".p-hareruya-product-card, .p-hareruya-recommend-empty").first().waitFor({ state: "attached", timeout: 30_000 });
  }

  /** 枠の中の商品（複製された枠は除く）を、並びの順に */
  async 表示された商品(): Promise<表示された商品[]> {
    return this.枠.first().evaluate((root) => {
      const out: { 商品ID: string; 名前: string; Foilの装飾: boolean }[] = [];
      for (const card of Array.from(root.querySelectorAll(".p-hareruya-product-card"))) {
        if (card.closest(".slick-cloned")) continue;
        const a = card.querySelector("a.p-hareruya-product-card__name") as HTMLAnchorElement | null;
        const m = /\/products\/detail\/(\d+)/.exec(a?.getAttribute("href") ?? "");
        out.push({
          商品ID: m ? m[1] : "",
          名前: (card.querySelector(".p-hareruya-product-card__name-text")?.textContent ?? "").replace(/\s+/g, " ").trim(),
          Foilの装飾: !!card.querySelector(".p-hareruya-product-card__img-wrap.foilImg"),
        });
      }
      return out;
    });
  }

  /** 前送りのボタン（次の商品へ）と後送りのボタン（前の商品へ） */
  get 前送り(): Locator { return this.枠.first().locator(".p-hareruya-product-carousel__nav-next"); }
  get 後送り(): Locator { return this.枠.first().locator(".p-hareruya-product-carousel__nav-prev"); }

  private async 無効か(button: Locator): Promise<boolean> {
    return button.evaluate((b) => b.classList.contains("slick-disabled") || b.hasAttribute("disabled") || b.getAttribute("aria-disabled") === "true");
  }

  /** いま見えている先頭の商品の商品ID（画面に出ている枠の先頭） */
  async 先頭に見える商品ID(): Promise<string> {
    return this.枠.first().evaluate((root) => {
      const slide = root.querySelector(".slick-slide.slick-active:not(.slick-cloned)") ?? root.querySelector(".p-hareruya-product-carousel__item");
      const a = slide?.querySelector("a.p-hareruya-product-card__name") as HTMLAnchorElement | null;
      return /\/products\/detail\/(\d+)/.exec(a?.getAttribute("href") ?? "")?.[1] ?? "";
    });
  }

  /** 前送りボタンを1回押す（押せないときは false）。押したあと、先頭に見える商品が変わるのを待つ */
  async 前送りを押す(): Promise<boolean> {
    if ((await this.前送り.count()) === 0 || (await this.無効か(this.前送り))) return false;
    const before = await this.先頭に見える商品ID();
    await this.前送り.click();
    await expect.poll(() => this.先頭に見える商品ID(), { message: "前送りのあと、先頭に見える商品が変わる", timeout: 10_000 }).not.toBe(before);
    return true;
  }

  async 後送りを押す(): Promise<boolean> {
    if ((await this.後送り.count()) === 0 || (await this.無効か(this.後送り))) return false;
    const before = await this.先頭に見える商品ID();
    await this.後送り.click();
    await expect.poll(() => this.先頭に見える商品ID(), { message: "後送りのあと、先頭に見える商品が変わる", timeout: 10_000 }).not.toBe(before);
    return true;
  }

  /** 前送りが押せなくなるまで押し、並んだ商品を先頭から読む（最大10回） */
  async 前送りで最後まで見て読む(): Promise<表示された商品[]> {
    for (let i = 0; i < 10; i++) if (!(await this.前送りを押す())) break;
    return this.表示された商品();
  }
}
