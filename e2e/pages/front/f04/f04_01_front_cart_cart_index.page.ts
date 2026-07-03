import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_FRONT_LOCALE, ECCUBE_FRONT_SHOP } from "../../../config/default.config";

/**
 * フロント 買い物かご「カート」（F04-01）Page Object。
 * integration_test/e2e/f04_01_front_cart_cart_index_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f04-01_front_cart_cart_index.md（画面・処理フロー・表示メッセージ）由来。
 * ec-cube-enterprise/pf-eccube3 の Twig は本リポジトリに未取込のため、セレクタはフロントTwig差分に耐えるよう
 * URL・表示文言・フォーム要素の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export class FrontCartPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly cartUrl: string;
  readonly cartClearUrl: string;

  readonly heading: Locator;
  readonly body: Locator;
  readonly emptyMessage: Locator;
  readonly viewOtherLink: Locator;
  readonly subtotalLabel: Locator;
  readonly qtyInputs: Locator;
  readonly removeButtons: Locator;
  readonly clearCartLink: Locator;
  readonly updateButton: Locator;
  readonly checkoutButton: Locator;
  readonly freeShippingNotice: Locator;
  readonly errorArea: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.cartUrl = `${this.localePrefix}/cart`;
    this.cartClearUrl = `${this.localePrefix}/cart/clear`;

    this.heading = page.getByRole("heading", { name: /買い物かご|Shopping Cart/ }).first();
    this.body = page.locator("body");
    // 空カート案内。設計書「表示メッセージ」節の日本語文言（要実機確認：pf-eccube3 Cart/index.twig）。
    this.emptyMessage = page.getByText("現在、買い物かごには商品が入っておりません", { exact: false });
    this.viewOtherLink = page.getByRole("link", { name: /他の商品を見る/ }).first();
    this.subtotalLabel = page.getByText(/合計\s*\(税込\)|Subtotal/, { exact: false });
    // 数量入力欄 name="qty[商品規格ID]"（設計書フロント挙動。要実機確認）。
    this.qtyInputs = page.locator('input[name^="qty"]');
    // 各行の削除ボタン（data-method="put" のアンカー。要実機確認）。
    this.removeButtons = page.locator('a[data-method="put"], .ec-cartRow__delColumn a, [class*="del"] a');
    this.clearCartLink = page.getByRole("link", { name: /カート一括削除/ }).first();
    this.updateButton = page.locator('[name="update"], button[name="update"], input[name="update"]').first();
    this.checkoutButton = page.getByRole("button", { name: /購入手続きへ/ }).first();
    this.freeShippingNotice = page.getByText(/送料無料/, { exact: false }).first();
    this.errorArea = page.locator(".text-danger, .ec-errorMessage, .error, [class*='error']");
  }

  async gotoCart() {
    await this.page.goto(this.cartUrl);
  }

  async gotoCartClear() {
    await this.page.goto(this.cartClearUrl);
  }

  /** 買い物かご画面の見出しが表示されていること。期待は設計書「表示メッセージ」節（見出し）由来。 */
  async seeCartHeading() {
    await expect(this.heading).toBeVisible();
  }

  /** 空カート案内が表示されていること。期待文言は設計書「表示メッセージ」節（空カート）由来。 */
  async seeEmptyCart() {
    await expect(this.emptyMessage).toBeVisible();
  }
}
