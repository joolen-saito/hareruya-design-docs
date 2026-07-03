import { Locator, Page, Response, expect } from "@playwright/test";
import { ECCUBE_FRONT_LOCALE, ECCUBE_FRONT_SHOP } from "../../../config/default.config";

/**
 * フロント 商品「商品詳細」（F03-02）Page Object。
 * integration_test/e2e/f03_02_front_product_product_detail_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f03-02_front_product_product_detail.md（入口・処理フロー・集計条件・Cookie）由来。
 * pf-eccube3 / ec-cube-enterprise の Twig（Product/detail.twig）は本リポジトリに未取込のため、
 * 表示要素セレクタは URL・HTTPステータス・表示文言の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export class FrontProductDetailPage {
  readonly page: Page;
  readonly localePrefix: string;

  readonly body: Locator;
  readonly productHeading: Locator; // 商品名見出し（要実機確認: Product/detail.twig）
  readonly priceTable: Locator; // 言語・コンディション別 価格・在庫の表（要実機確認）
  readonly cartButton: Locator; // カート追加操作（要実機確認）
  readonly favoriteButton: Locator; // お気に入りボタン（要実機確認）
  readonly restockButton: Locator; // 入荷通知操作（要実機確認）
  readonly buyLink: Locator; // 買取リンク（要実機確認）

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;

    this.body = page.locator("body");
    // Twig差分に耐えるよう見出し/主要部品は role・一般的なクラスの双方で拾う。文言はオラクル化しない。
    this.productHeading = page.getByRole("heading").first();
    this.priceTable = page.locator("table, .ec-productRole, [class*='product']").first();
    this.cartButton = page
      .getByRole("button", { name: /カート|cart/i })
      .or(page.locator("[class*='cart'] button, button[class*='cart']"))
      .first();
    this.favoriteButton = page.locator("[class*='favorite'], [class*='wishlist'], button[name*='favorite']").first();
    this.restockButton = page.locator("[class*='restock'], [class*='stock-notify'], [class*='arrival']").first();
    this.buyLink = page.getByRole("link", { name: /買取/ }).first();
  }

  /** 商品詳細URL。id は数値（経路上の制約）。 */
  detailUrl(id: string | number): string {
    return `${this.localePrefix}/products/detail/${id}`;
  }

  /** 言語・規格クエリ付きの商品詳細URL。 */
  detailUrlWithQuery(id: string | number, lang?: string, cls?: string): string {
    const params = new URLSearchParams();
    if (lang) params.set("lang", lang);
    if (cls) params.set("class", cls);
    const qs = params.toString();
    return `${this.detailUrl(id)}${qs ? `?${qs}` : ""}`;
  }

  /** 旧商品コードからの転送URL。 */
  forwardUrl(oldCode: string): string {
    return `${this.localePrefix}/forward/${oldCode}`;
  }

  async gotoDetail(id: string | number): Promise<Response | null> {
    return await this.page.goto(this.detailUrl(id));
  }

  async gotoDetailWithQuery(id: string | number, lang?: string, cls?: string): Promise<Response | null> {
    return await this.page.goto(this.detailUrlWithQuery(id, lang, cls));
  }

  async gotoForward(oldCode: string): Promise<Response | null> {
    return await this.page.goto(this.forwardUrl(oldCode));
  }

  /** 存在しない/非数値の商品IDは404となること。期待は処理フロー#2・エラー処理由来。 */
  async expectNotFound(id: string | number) {
    const resp = await this.gotoDetail(id);
    expect(resp?.status()).toBe(404);
  }

  /** 主要表示要素が表示されていること（要シード商品）。期待はフロント挙動「表示要素」由来。 */
  async seeMainElements() {
    await expect(this.productHeading).toBeVisible();
    await expect(this.priceTable).toBeVisible();
  }

  /** 閲覧履歴Cookie（history）が設定されていること。期待はCookie節由来（原値は検証しない）。 */
  async hasHistoryCookie(): Promise<boolean> {
    const cookies = await this.page.context().cookies();
    return cookies.some((c) => c.name === "history");
  }
}
