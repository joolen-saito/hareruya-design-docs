/**
 * 公開側の商品一覧と、そこから開く商品詳細検索モーダル（F03-03）。
 * 公開側の部品は機能ごとにファイルを分けている（F03-07 など別の担当と二重に作らない）。
 */
import { Locator, Page } from "@playwright/test";
import { BASE_URL } from "../../config/env";

export class FrontDetailSearch {
  readonly モーダル: Locator;
  readonly フォーム: Locator;
  readonly 閉じるボタン: Locator;
  constructor(readonly page: Page) {
    this.モーダル = page.locator("#product-detailed-search-modal");
    this.フォーム = page.locator("#product-detailed-search-form");
    this.閉じるボタン = page.locator('[data-modal-close="search"]');
  }

  /** 商品一覧を開く。shop は本店なら "/ja"、支店なら "/ja/<支店URL>"。階層カテゴリの選択欄が組み立つまで待つ */
  async openProductList(shop = "/ja"): Promise<void> {
    const res = await this.page.goto(`${BASE_URL}${shop}/products/search`, { waitUntil: "domcontentloaded" });
    if (!res || res.status() >= 400) throw new Error(`公開側の商品一覧（${shop}）を開けない（応答 ${res?.status()}）`);
    await this.page.locator('#product-detailed-search-form [data-product-search-category-selects] select').first().waitFor({ state: "attached" });
  }

  /** 画面で見えている「詳細検索」の入口（画面の幅で見えるものが変わる） */
  詳細検索の入口(): Locator {
    return this.page.locator('[data-modal-open="search"]:visible');
  }

  /** 商品一覧の中の「詳細検索」ボタン（PC版は左の欄、SP版は絞り込みの並び） */
  商品一覧の詳細検索ボタン(): Locator {
    return this.page.locator('#product-list-detailed-search:visible, .js-product-detailed-search-open:visible').first();
  }

  /**
   * 商品一覧の「詳細検索」を押す。固定のヘッダー（PC版）が商品一覧の左の欄のボタンに重なって押せないことがあるので、
   * 画面の中ほどへスクロールし、まず商品一覧の中のボタンを押す。それでも押せなければ、画面上部のナビゲーションの「詳細検索」を押す。
   * 押したのがどちらかを返す（記録の注記に使う）。
   */
  async 詳細検索を押す(): Promise<"商品一覧の詳細検索ボタン" | "画面上部の詳細検索ボタン"> {
    await this.page.mouse.move(640, 400);
    const button = this.商品一覧の詳細検索ボタン();
    await button.waitFor({ state: "visible", timeout: 30_000 });
    await button.evaluate((e) => e.scrollIntoView({ block: "center" }));
    try {
      await button.click({ timeout: 8_000 });
      return "商品一覧の詳細検索ボタン";
    } catch {
      await this.page.evaluate(() => window.scrollTo(0, 0));
      await this.page.locator('.p-hareruya-header__nav-right-link[data-modal-open="search"]:visible').first().click({ timeout: 30_000 });
      return "画面上部の詳細検索ボタン";
    }
  }

  /** 画面の下端（SP版のフッター）の詳細検索ボタン */
  フッターの詳細検索ボタン(): Locator {
    return this.page.locator('.p-hareruya-bottom-nav__search-btn[data-modal-open="search"]');
  }

  async モーダルが開いている(): Promise<boolean> {
    return this.モーダル.evaluate((e) => e.classList.contains("is-visible"));
  }

  /** 開閉の動きが終わるのを待ってから、モーダルが開いているかを返す */
  async 開閉後のモーダル(): Promise<boolean> {
    await this.page.waitForTimeout(700);
    return this.モーダルが開いている();
  }

  /** モーダルの外（背景）を押す。モーダルの本体に重ならない左上の端を押す */
  async モーダル外を押す(): Promise<void> {
    const box = await this.フォーム.boundingBox();
    const vp = this.page.viewportSize() ?? { width: 1280, height: 720 };
    const x = box && box.x > 8 ? Math.max(2, box.x / 2) : 2;
    const y = box && box.y > 8 ? Math.max(2, box.y / 2) : vp.height - 2;
    await this.page.mouse.click(x, y);
  }

  // ---- カテゴリの階層 ----

  カテゴリ選択欄(階層: number): Locator {
    return this.フォーム.locator(`[data-product-search-category-selects] select[data-category-level="${階層}"]`);
  }

  /** いま表示されているカテゴリ選択欄の数（階層の数） */
  async カテゴリ選択欄の数(): Promise<number> {
    return this.フォーム.locator("[data-product-search-category-selects] select").count();
  }

  /** その階層の選択肢の表示名（先頭の「指定しない」相当を除く） */
  async カテゴリの選択肢(階層: number): Promise<string[]> {
    const select = this.カテゴリ選択欄(階層);
    if ((await select.count()) === 0) return [];
    const options = (await select.locator("option").allInnerTexts()).map((t) => t.trim());
    const values = await select.locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
    return options.filter((_, i) => values[i] !== "");
  }

  async カテゴリを選ぶ(階層: number, 名称: string): Promise<void> {
    await this.カテゴリ選択欄(階層).selectOption({ label: 名称 });
    await this.page.waitForTimeout(300);
  }

  // ---- 入力欄 ----

  /** モーダルの項目の見出し（カテゴリ・カラー・カードタイプなど） */
  async 項目の見出し(): Promise<string[]> {
    return (await this.フォーム.locator("legend, label.c-hareruya-heading--lev3").allInnerTexts()).map((t) => t.replace(/\s+/g, " ").trim());
  }

  /** カードタイプの選択肢の表示名 */
  async カードタイプの選択肢(): Promise<string[]> {
    return (await this.フォーム.locator(".p-hareruya-search-form__card-type .p-hareruya-search-form__checkbox-inner").allInnerTexts()).map((t) => t.trim());
  }

  /** フォーマットの選択肢の表示名（先頭の「指定しない」を含む。上からの順） */
  async フォーマットの選択肢(): Promise<string[]> {
    return (await this.フォーム.locator("[data-search-format-radios] .c-hareruya-radio__label").allInnerTexts()).map((t) => t.trim());
  }

  /** イラストレーターの選択肢の表示名（上からの順。先頭の「指定しない」を除く） */
  async イラストレーターの選択肢(): Promise<string[]> {
    return this.選択肢(this.フォーム.locator(".p-hareruya-search-form__illustrator select"));
  }

  /** サブタイプの選択肢の表示名（上からの順。先頭の「指定しない」を除く） */
  async サブタイプの選択肢(): Promise<string[]> {
    return this.選択肢(this.フォーム.locator(".p-hareruya-search-form__subtype select"));
  }

  private async 選択肢(select: Locator): Promise<string[]> {
    const texts = (await select.locator("option").allInnerTexts()).map((t) => t.trim());
    const values = await select.locator("option").evaluateAll((os) => os.map((o) => (o as HTMLOptionElement).value));
    return texts.filter((_, i) => values[i] !== "");
  }

  /** 価格(From)・価格(To)の選択欄 */
  価格の選択欄(): { from: Locator; to: Locator } {
    const selects = this.フォーム.locator(".p-hareruya-search-form__price select");
    return { from: selects.nth(0), to: selects.nth(1) };
  }

  /** 選択欄で選ばれている選択肢の表示名 */
  async 選ばれている表示名(select: Locator): Promise<string> {
    return (await select.locator("option:checked").first().innerText()).trim();
  }
}
