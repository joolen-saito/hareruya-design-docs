import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面ホーム ショップ状況カード Page Object（m02-04_admin_home_home_shop_status）。
 * 対象は管理ホーム（admin_homepage = `GET /%eccube_admin_route%/`）内の `#shop-statistical` ブロックのみ。
 * 期待結果は仕様(functions/ec-cube-enterprise/m02-04_admin_home_home_shop_status.md / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig（src/Eccube/Resource/template/admin/index.twig）と route（AdminController.php）由来の位置情報のみ。
 *
 * セレクタ根拠:
 *  - カード #shop-statistical（index.twig:218）
 *  - 見出し .card-title trans `admin.home.shop_status_title`=「ショップ状況」（index.twig:221 / messages.ja.yaml:1682）
 *  - 在庫切れ商品数 行リンク url `admin_homepage_nonstock`=/%route%/search_nonstock（index.twig:226 / AdminController.php:302）
 *    ラベル「在庫切れ商品数」`admin.home.shop_status_out_of_stock`（index.twig:232 / messages.ja.yaml:1683）件数 .h4（index.twig:235 number_format）
 *  - 取扱商品数 行リンク url `admin_product`=/%route%/product（index.twig:241）
 *    ラベル「取扱商品数」`admin.home.shop_status_products`（index.twig:247 / messages.ja.yaml:1684）件数 .h4（index.twig:250）
 *  - 会員数 行リンク url `admin_homepage_customer`=/%route%/search_customer（index.twig:256 / AdminController.php:319）
 *    ラベル「会員数」`admin.home.shop_status_customers`（index.twig:262 / messages.ja.yaml:1685）件数 .h4（index.twig:265）
 */
export class HomeHomeShopStatusPage {
  readonly page: Page;
  readonly homeUrl: string;
  readonly nonstockUrl: string; // 在庫切れ商品数リンクの直GET用
  readonly customerSearchUrl: string; // 会員数リンクの直GET用

  readonly card: Locator; // #shop-statistical（index.twig:218）
  readonly cardTitle: Locator; // 見出し「ショップ状況」（index.twig:221）
  readonly outOfStockLink: Locator; // 在庫切れ商品数 行リンク（index.twig:226）
  readonly productsLink: Locator; // 取扱商品数 行リンク（index.twig:241）
  readonly customersLink: Locator; // 会員数 行リンク（index.twig:256）
  readonly outOfStockCount: Locator; // 在庫切れ商品数 件数（index.twig:235）
  readonly productsCount: Locator; // 取扱商品数 件数（index.twig:250）
  readonly customersCount: Locator; // 会員数 件数（index.twig:265）
  readonly outOfStockIcon: Locator; // 在庫切れ商品数 行アイコン（index.twig:233 i.fa）
  readonly productsIcon: Locator; // 取扱商品数 行アイコン（index.twig:248 i.fa）
  readonly customersIcon: Locator; // 会員数 行アイコン（index.twig:263 i.fa）

  constructor(page: Page) {
    this.page = page;
    this.homeUrl = `/${ECCUBE_ADMIN_ROUTE}/`;
    this.nonstockUrl = `/${ECCUBE_ADMIN_ROUTE}/search_nonstock`;
    this.customerSearchUrl = `/${ECCUBE_ADMIN_ROUTE}/search_customer`;

    this.card = page.locator("#shop-statistical");
    this.cardTitle = this.card.locator(".card-title");
    // 行リンクは href の route 末尾で特定（ECCUBE_ADMIN_ROUTE 可変のため部分一致）。
    this.outOfStockLink = this.card.locator('a[href*="/search_nonstock"]');
    this.productsLink = this.card.locator('a[href$="/product"]');
    this.customersLink = this.card.locator('a[href*="/search_customer"]');
    // 件数は各行リンク内の .h4 span（number_format 適用後の桁区切り表示）。
    this.outOfStockCount = this.outOfStockLink.locator(".h4");
    this.productsCount = this.productsLink.locator(".h4");
    this.customersCount = this.customersLink.locator(".h4");
    // 各行のアイコン要素（設計書「フロント挙動＞表示要素＝各行はアイコン・ラベル・件数で構成」）。
    // 具体的な fa-* クラスは実装由来なのでオラクル化せず、アイコン要素 <i> の存在のみを判定する。
    this.outOfStockIcon = this.outOfStockLink.locator("i");
    this.productsIcon = this.productsLink.locator("i");
    this.customersIcon = this.customersLink.locator("i");
  }

  async goto() {
    await this.page.goto(this.homeUrl);
  }

  /** 在庫切れ商品数リンクを直接GET（リダイレクト先確認用）。 */
  async gotoNonstock() {
    await this.page.goto(this.nonstockUrl);
  }

  /** 会員数リンクを直接GET（リダイレクト先確認用）。 */
  async gotoCustomerSearch() {
    await this.page.goto(this.customerSearchUrl);
  }

  /** ショップ状況カードと見出しが仕様どおり表示されること。 */
  async seeCard() {
    await expect(this.card).toBeVisible();
    await expect(this.cardTitle).toContainText("ショップ状況");
  }

  /** カード内に3行のラベルが仕様どおり表示されること。 */
  async seeRows() {
    await expect(this.card).toContainText("在庫切れ商品数");
    await expect(this.card).toContainText("取扱商品数");
    await expect(this.card).toContainText("会員数");
  }

  /** 各行にアイコン要素が表示されること（設計書フロント挙動「各行はアイコン・ラベル・件数で構成」由来）。 */
  async seeRowIcons() {
    await expect(this.outOfStockIcon).toBeVisible();
    await expect(this.productsIcon).toBeVisible();
    await expect(this.customersIcon).toBeVisible();
  }

  /**
   * 件数が整数件数（桁区切り）として妥当に表示されること。
   * 仕様(業務ルール・計算「表示形式＝整数・桁区切りを適用」)由来のオラクル。
   * 0 または 1〜3桁＋「,3桁」の連結のみを許容し、`,` 単独や `1,,2`・`,123`・`12,3` 等の不正形は弾く。
   */
  async seeNumericCount(count: Locator) {
    await expect(count).toBeVisible();
    await expect(count).toHaveText(/^(0|[1-9]\d{0,2}(,\d{3})*)$/);
  }

  async clickOutOfStock() {
    await this.outOfStockLink.click();
  }
  async clickProducts() {
    await this.productsLink.click();
  }
  async clickCustomers() {
    await this.customersLink.click();
  }
}
