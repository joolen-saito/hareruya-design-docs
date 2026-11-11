/**
 * M09-10 が見る、公開側の支店トップページ（支店ECTOP。/ja/<支店URL>/）の部分: バナー画像・タイル・ヘッダーのナビゲーション、
 * と「もっと見る」・バナーから開く商品一覧の商品名。F01-02 の部品（pages/front/f01_02_branch.ts）と同じ画面で、M09-10 が見る部分だけを足した。
 * タイルの見出しは、フォーマット別特集・その他が「<タグの名称>のカード」（フォーマット別特集はタグの名称から「特集」を除く）、
 * 最新エキスパンションが「最新エキスパンション」、ピックアップ商品が「ピックアップ商品」。
 */
import { Locator, Page, expect } from "@playwright/test";
import { BASE_URL } from "../../config/env";

const exact = (t: string) => new RegExp(`^\\s*${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);

export class 支店トップ {
  constructor(readonly page: Page) {}

  async 開く(支店URL: string): Promise<number> {
    const res = await this.page.goto(`${BASE_URL}/ja/${支店URL}/`);
    await this.page.waitForLoadState("load");
    return res?.status() ?? 0;
  }
  async 開いている(): Promise<void> { await expect(this.page.locator("body.shop_top"), "支店ECTOPの画面").toBeAttached(); }

  get 商品の区画(): Locator { return this.page.locator("section.p-hareruya-branch-top__item-list"); }
  get バナー画像(): Locator { return this.商品の区画.locator("img.p-hareruya-branch-top__item-banner-img"); }
  get バナーのリンク(): Locator { return this.商品の区画.locator("a.p-hareruya-branch-top__item-banner-link"); }
  /** タイル（見出しのある区画。バナーの区画は見出しが無いので入らない）。画面の並び順 */
  get タイル(): Locator { return this.商品の区画.locator(".p-hareruya-feature-grid__item").filter({ has: this.page.locator("h2") }); }
  タイル見出し(見出し: string): Locator { return this.タイル.filter({ has: this.page.locator("h2", { hasText: exact(見出し) }) }); }
  タイルの商品(タイル: Locator): Locator { return タイル.locator(".p-hareruya-product-carousel__item"); }
  async タイルの見出しの並び(): Promise<string[]> { return (await this.タイル.locator("h2").allInnerTexts()).map((t) => t.trim()); }
  async タイルの商品名(タイル: Locator): Promise<string[]> {
    return (await this.タイルの商品(タイル).locator(".p-hareruya-product-card__name-text").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }
  もっと見る(タイル: Locator): Locator { return タイル.locator(".p-hareruya-section__more a"); }

  /** 画面上部のヘッダー（支店のナビゲーションを含む） */
  get ヘッダー(): Locator { return this.page.locator("header").first(); }
  /** ヘッダーの中で、文字がちょうど text の見えている要素の数 */
  async ヘッダーの表示数(text: string): Promise<number> {
    const all = this.ヘッダー.getByText(exact(text));
    let n = 0;
    for (const e of await all.all()) if (await e.isVisible()) n++;
    return n;
  }

  /** バナー画像のURL（画面の img の src） */
  async バナー画像のURL(): Promise<string> { return (await this.バナー画像.first().getAttribute("src")) ?? ""; }
}

/** 公開側の商品一覧（「もっと見る」・バナーから開いた先）に表示された商品名。読み込みと検索の問い合わせが落ち着くのを待ってから読む */
export async function 商品一覧の商品名(page: Page): Promise<string[]> {
  await page.waitForLoadState("load");
  await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
  await expect(page.locator(".product-list-unisearch-loading:visible"), "商品一覧の読み込み中の表示が消える").toHaveCount(0, { timeout: 30_000 }).catch(() => {});
  await page.waitForTimeout(1500);
  return (await page.locator(".p-hareruya-product-list__grid .p-hareruya-product-card__name-text").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
}

/** URL で開いた画像の中身（応答が200でなければ null） */
export async function 画像の中身(page: Page, url: string): Promise<{ status: number; body: Buffer | null }> {
  const res = await page.request.get(url, { failOnStatusCode: false });
  return { status: res.status(), body: res.ok() ? await res.body() : null };
}
