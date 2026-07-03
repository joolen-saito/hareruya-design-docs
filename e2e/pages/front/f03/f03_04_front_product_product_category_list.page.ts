import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_FRONT_LOCALE, ECCUBE_FRONT_SHOP } from "../../../config/default.config";

/**
 * フロント 商品「カテゴリ一覧」（F03-04）Page Object。
 * integration_test/e2e/f03_04_front_product_product_category_list_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f03-04_front_product_product_category_list.md
 * （利用者視点の入口・フロント挙動 表示要素・処理フロー・画面遷移）由来。
 * ec-cube-enterprise/pf-eccube3 の Twig（Product/category.twig）は本リポジトリに未取込のため、
 * セレクタは URL・表示文言・リンク先の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export class FrontProductCategoryListPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly categoryUrl: string;

  readonly heading: Locator;
  readonly body: Locator;
  // 商品一覧の検索エンドポイントへ向くリンク（カードセット/レアリティ/パック・ボックス/カテゴリ共通の導線）。
  readonly searchLinks: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    // 由来: 利用者視点の入口 GET /{_locale}/products/category（要実機確認：ルート bind）
    this.categoryUrl = `${this.localePrefix}/products/category`;

    // 由来: フロント挙動 表示要素「商品カテゴリ一覧」の見出し（要実機確認：category.twig）
    this.heading = page.getByRole("heading", { name: /商品カテゴリ一覧|カテゴリ/ }).first();
    this.body = page.locator("body");
    // 由来: 各リンクは商品一覧の検索エンドポイント /{_locale}/products/search へ遷移（要実機確認）
    this.searchLinks = page.locator('a[href*="/products/search"]');
  }

  async gotoCategoryList() {
    await this.page.goto(this.categoryUrl);
  }

  /** カテゴリ一覧画面（見出し）が表示されていること。期待は設計書 表示要素節由来。 */
  async seeCategoryListScreen() {
    await expect(this.heading).toBeVisible();
  }

  /** 商品一覧検索へのリンクが1件以上あること。期待は設計書 表示要素/JS挙動由来。 */
  async seeSearchLinks() {
    await expect(this.searchLinks.first()).toBeVisible();
  }

  /** 先頭の一覧リンクを押下し、商品一覧の検索エンドポイントへ遷移すること。 */
  async clickFirstSearchLink() {
    await this.searchLinks.first().click();
  }
}
