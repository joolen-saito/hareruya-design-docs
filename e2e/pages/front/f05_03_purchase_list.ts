/**
 * 公開側のネット買取商品一覧（F05-03）の画面操作。セレクタはここだけに書く。
 * モーダル・商品数・一覧本文は F05-02 の部品（PurchaseSearchPage）を使う。
 *
 * 画面の作り（アプリの Purchase/search.twig と Block の Twig で確かめた）:
 * - 検索条件が無いときは、アプリが検索サービスへ問い合わせない（一覧本文は読み込み中の表示のまま、ページ送りは空）。
 * - 絞り込みの並びの詳細検索: [data-filter="detail-search"][data-modal-open="purchase-search"]
 * - ページ送り: 上部・下部とも .purchase-list-unisearch-pager（項目は .p-hareruya-pagination__item）
 * - 買取スタイルのバナー（一覧の下）: .p-hareruya-purchase-banner__item。リンク先は user_data/purchase_net・user_data/purchase_store
 * - パンくず: .ec-searchnavRole__topicpath の .p-hareruya-breadcrumb__item。先頭はホーム（家のアイコン）
 */
import { Locator, Page } from "@playwright/test";
import { PurchaseSearchPage } from "./f05_02_purchase_search";

export class F0503買取一覧 {
  readonly 検索: PurchaseSearchPage;
  constructor(readonly page: Page) { this.検索 = new PurchaseSearchPage(page); }

  /** 一覧の検索フォーム（一覧の上の絞り込みを含む） */
  get 検索フォーム(): Locator { return this.page.locator("#purchase-search-form"); }
  /** 上部・下部のページ送りの項目（番号・前へ・次へ・省略の印） */
  get ページ送りの項目(): Locator { return this.page.locator(".purchase-list-unisearch-pager .p-hareruya-pagination__item"); }

  /** 画面の読み込みと、検索サービスへの問い合わせ（あれば）が落ち着くのを待つ */
  async 落ち着くのを待つ(): Promise<void> {
    await this.page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
    await this.page.waitForTimeout(1500);
  }

  /** 絞り込みの並びの「詳細検索」を押す。押せなければ画面上部の「詳細検索」を押す。押したのがどれかを返す */
  async 絞り込み領域の詳細検索を押す(): Promise<"絞り込み領域の詳細検索ボタン" | "画面上部の詳細検索ボタン"> {
    const 候補: ["絞り込み領域の詳細検索ボタン" | "画面上部の詳細検索ボタン", Locator][] = [
      ["絞り込み領域の詳細検索ボタン", this.page.locator('[data-filter="detail-search"][data-modal-open="purchase-search"]:visible').first()],
      ["画面上部の詳細検索ボタン", this.page.locator('.p-hareruya-header__nav-right-link[data-modal-open="purchase-search"]:visible').first()],
    ];
    for (const [名, button] of 候補) {
      if ((await button.count()) === 0) continue;
      try {
        await button.evaluate((e) => e.scrollIntoView({ block: "center" }));
        await button.click({ timeout: 8_000 });
        return 名;
      } catch {
        await this.page.evaluate(() => window.scrollTo(0, 0));
      }
    }
    throw new Error("ネット買取商品一覧で、絞り込みの並びの「詳細検索」を押せない");
  }

  // ---- パンくず ----
  /** パンくずの項目の表示（ホームは「🏠」、ほかは見える文字。現在地の項目の中の区切り「・」はそのまま） */
  async パンくずの項目(): Promise<string[]> {
    return this.page.locator(".ec-searchnavRole__topicpath .p-hareruya-breadcrumb__item").evaluateAll((lis) => lis.map((li) =>
      li.querySelector(".icon-hareruya-home") ? "🏠" : (li.textContent ?? "").replace(/\s+/g, "").trim()));
  }
  get パンくずのホーム(): Locator { return this.page.locator(".ec-searchnavRole__topicpath .p-hareruya-breadcrumb__link:has(.icon-hareruya-home)").first(); }

  /** パンくずの🏠を押して、画面が移るのを待つ */
  async パンくずのホームを押す(): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      this.パンくずのホーム.click({ timeout: 30_000 }),
    ]);
    await this.page.waitForLoadState("load");
  }

  // ---- 買取スタイルのバナー（ネット買取・店頭買取のリンク） ----
  買取スタイルのリンク(種別: "purchase_net" | "purchase_store"): Locator {
    return this.page.locator(`a.p-hareruya-purchase-banner__item[href*="${種別}"]`).first();
  }

  /** 買取スタイルのバナーを押して、画面が移るのを待つ */
  async 買取スタイルを押す(種別: "purchase_net" | "purchase_store"): Promise<void> {
    const link = this.買取スタイルのリンク(種別);
    await link.scrollIntoViewIfNeeded();
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: "domcontentloaded" }),
      link.click({ timeout: 30_000 }),
    ]);
    await this.page.waitForLoadState("load");
  }
}
