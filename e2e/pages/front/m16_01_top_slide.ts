/**
 * M16-01 本店のトップ画面（日本語サイト /ja/・英語サイト /en/）のスライドバナーの読み取り。セレクタはここだけに書く。
 *
 * 画面の作り（アプリのテンプレート Block/mv_carousel とバナーの取り出し方で確かめた。期待値はここに書かない）:
 * - スライドは「.p-hareruya-top__mv」の中の「[data-js-target=mv-slider]」に、バナー1件ごとに「.p-hareruya-carousel__slide」が並ぶ
 *   （リンク＝リンク先URL、img の src＝画像URL、alt＝画像alt属性）。表示するバナーが無いときは欄ごと出ない。
 * - 画面のスクリプト（slick）が、ぐるりと回すための複製（slick-cloned）を前後に足す。数えるのは複製でないものだけ。
 */
import { Locator, Page, expect } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export type サイト = "日本語" | "英語";
export type スライド = { 画像URL: string; 画像alt属性: string; リンク先URL: string };

export class TopSlidePage {
  constructor(readonly page: Page) { page.setDefaultNavigationTimeout(60_000); }

  get 欄(): Locator { return this.page.locator(".p-hareruya-top__mv"); }
  /** 複製でないスライド（上から順＝表示の順） */
  get スライド(): Locator { return this.page.locator('[data-js-target="mv-slider"] .p-hareruya-carousel__slide:not(.slick-cloned)'); }

  /** トップ画面を開き、画面の読み込み（ヘッダ）を待つ。スライドの欄があれば、画面のスクリプトが整えるのも待つ */
  async 開く(サイト: サイト): Promise<void> {
    const res = await this.page.goto(`${BASE_URL}/${サイト === "日本語" ? "ja" : "en"}/`, { timeout: 60_000 });
    if (!res || res.status() >= 400) throw new Error(`${サイト}サイトのトップ画面を開けない（応答 ${res?.status() ?? "なし"}）`);
    await this.page.waitForLoadState("load");
    await expect(this.page.locator("header a.p-hareruya-header__logo-link").first(), `${サイト}サイトのトップ画面のヘッダ`).toBeVisible({ timeout: 30_000 });
    if (await this.欄.count()) await this.page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => undefined);
  }

  /** 表示されたスライド（複製を除く。表示の順） */
  async スライドを読む(): Promise<スライド[]> {
    return this.スライド.evaluateAll((els) => els.map((e) => {
      const img = e.querySelector("img");
      const a = e.querySelector("a");
      return { 画像URL: img?.getAttribute("src") ?? "", 画像alt属性: img?.getAttribute("alt") ?? "", リンク先URL: a?.getAttribute("href") ?? "" };
    }));
  }

  /** 画像URLが url のスライドのリンク（複製を除く） */
  スライドのリンク(url: string): Locator {
    return this.スライド.filter({ has: this.page.locator(`img[src="${url.replace(/"/g, '\\"')}"]`) }).locator("a.p-hareruya-carousel__slide-link").first();
  }
}
