import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_FRONT_LOCALE, ECCUBE_FRONT_SHOP } from "../../../config/default.config";

/**
 * フロント ネット買取「買取カート」（F05-05）Page Object。
 * integration_test/e2e/f05_05_front_online_purchase_buy_cart_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f05-05_front_online_purchase_buy_cart.md（画面・処理フロー・表示メッセージ）由来。
 * ec-cube-enterprise/pf-eccube3 の Twig（Purchase/cart.twig 等）は本リポジトリに未取込のため、
 * セレクタはフロントTwig差分に耐えるよう URL・表示文言・フォーム要素の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export class FrontPurchaseCartPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly cartUrl: string;
  readonly addUrl: string;
  readonly updateUrl: string;
  readonly purchaseTopUrl: string;
  readonly fillUrl: string;

  readonly heading: Locator;
  readonly body: Locator;
  readonly emptyMessage: Locator;
  readonly subtotalLabel: Locator;
  readonly qtyInputs: Locator;
  readonly recalcButton: Locator;
  readonly proceedButton: Locator;
  readonly backToListButton: Locator;
  readonly deleteLinks: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    // 利用者視点の入口（設計「利用者視点の入口」節）
    this.cartUrl = `${this.localePrefix}/purchase/cart`;
    this.addUrl = `${this.localePrefix}/purchase/add`;
    this.updateUrl = `${this.localePrefix}/purchase/update`;
    // ネット買取トップ（F05-01）・買取手続き（F05-06）。厳密パスは要実機確認。
    this.purchaseTopUrl = `${this.localePrefix}/purchase`;
    this.fillUrl = `${this.localePrefix}/purchase/fill`;

    // 見出し「買取希望品カート」（表示メッセージ節）。Twig未取込のため文言で寄せる（要実機確認）。
    this.heading = page.getByRole("heading", { name: /買取希望品カート/ }).first();
    this.body = page.locator("body");
    // 空カート案内文（表示メッセージ節・空カート）。
    this.emptyMessage = page.getByText(/現在、カートには商品が入っておりません/);
    // 小計(税込)（表示メッセージ節）。
    this.subtotalLabel = page.getByText(/小計\s*[（(]\s*税込\s*[)）]/);
    // 数量入力欄 qty[商品クラスID]（入力項目節）。要実機確認。
    this.qtyInputs = page.locator('input[name^="qty"], input[name*="quantity"]');
    // 再計算ボタン（フロント挙動：再計算ボタン）。要実機確認。
    this.recalcButton = page.getByRole("button", { name: /再計算|更新/ }).first();
    // 「買取手続きへ」「商品一覧へ戻る」ボタン（画面遷移節）。link/button 双方で拾う。
    this.proceedButton = page.getByRole("link", { name: /買取手続きへ/ }).first();
    this.backToListButton = page.getByRole("link", { name: /商品一覧へ戻る/ }).first();
    // 削除リンク（なりすまし対策トークン付き）。要実機確認。
    this.deleteLinks = page.getByRole("link", { name: /削除/ });
  }

  async gotoCart() {
    await this.page.goto(this.cartUrl);
  }

  /** カート画面（見出し）が表示されていること。ログイン画面へ誘導されない。 */
  async seeCartScreen() {
    await expect(this.page).toHaveURL(/\/purchase\/cart(?:\?|$)/);
    await expect(this.heading).toBeVisible();
  }

  /** 空カートの案内文（設計「表示メッセージ・空カート」節由来）が表示されていること。 */
  async seeEmptyCartMessage() {
    await expect(this.emptyMessage).toBeVisible();
  }

  /** 商品ありカートのUI部品（フロント挙動・表示要素節由来）が表示されていること。 */
  async seeCartWithItems() {
    await expect(this.subtotalLabel).toBeVisible();
    await expect(this.recalcButton).toBeVisible();
    await expect(this.proceedButton).toBeVisible();
    await expect(this.backToListButton).toBeVisible();
  }
}
