import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_SHOP,
} from "../../../config/default.config";

/**
 * フロント ネット買取「買取トップページ」（F05-01）Page Object。
 * integration_test/e2e/f05_01_front_online_purchase_buy_top_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f05-01_front_online_purchase_buy_top.md
 * （利用者視点の入口・フロント挙動・処理フロー・表示メッセージ・画面遷移）由来。
 * ec-cube-enterprise/pf-eccube3 の Twig は本リポジトリに未取込のため、セレクタは
 * URL・表示文言・要素の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export class FrontPurchaseTopPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly topUrl: string;
  readonly searchUrl: string;
  readonly cartUrl: string;

  readonly body: Locator;
  readonly heading: Locator;
  readonly purchasePageContainer: Locator;
  readonly productBlocks: Locator;
  readonly buyPrice: Locator;
  readonly addToCartButton: Locator;
  readonly productCard: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    // 利用者視点の入口（設計md）: GET /{_locale}/purchase/（buyステップを兼ねる入口）
    this.topUrl = `${this.localePrefix}/purchase/`;
    this.searchUrl = `${this.localePrefix}/purchase/search`;
    this.cartUrl = `${this.localePrefix}/purchase/cart`;

    this.body = page.locator("body");
    // 表示メッセージ節: 見出し「目玉買取商品」（要実機確認: pf-eccube3 Purchase/index.twig）
    this.heading = page.getByRole("heading", { name: /目玉買取商品/ }).first();
    // CSS・レイアウト節: 買取ページ用クラス purchase_page（要実機確認）
    this.purchasePageContainer = page.locator(".purchase_page, [class*='purchase_page']").first();
    // 買取商品ブロック（Block/purchase_product.twig）。Twig差分に備えクラス候補で拾う。
    this.productBlocks = page.locator(
      "[class*='purchase_product'], [class*='product_item'], .ec-shelfGrid__item"
    );
    // 各商品サブクラスの買取価格表示（要実機確認）
    this.buyPrice = page.locator("[class*='buy_price'], [class*='price']").first();
    // 「カートに追加」ボタン（買取カート追加はF05-05を正とする。非同期）
    this.addToCartButton = page.getByRole("button", { name: /カートに追加|買取カート/ }).first();
    // 目玉買取商品カード押下→買取商品詳細（F05-04）
    this.productCard = this.productBlocks.first();
  }

  async gotoTop() {
    await this.page.goto(this.topUrl);
  }

  async gotoSearch() {
    await this.page.goto(this.searchUrl);
  }

  async gotoCart() {
    await this.page.goto(this.cartUrl);
  }

  /** トップページが表示され、目玉買取商品の見出しが出ていること（期待は設計md表示メッセージ節由来）。 */
  async seeTop() {
    await expect(this.page).toHaveURL(/\/purchase\/?(?:\?|$)/);
    await expect(this.heading).toBeVisible();
  }
}
