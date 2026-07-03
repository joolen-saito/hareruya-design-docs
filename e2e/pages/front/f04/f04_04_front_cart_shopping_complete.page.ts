import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_FRONT_LOCALE, ECCUBE_FRONT_SHOP } from "../../../config/default.config";

/**
 * フロント カート「決済〜購入完了（ご注文完了）」（F04-04）Page Object。
 * integration_test/e2e/f04_04_front_cart_shopping_complete_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f04-04_front_cart_shopping_complete.md
 * （利用者視点の入口・処理フロー・判定順序・表示メッセージ・画面遷移）由来。
 *
 * 購入完了画面（GET /{_locale}/shopping/complete）は注文確定を経た後にのみ正規表示される
 * 破壊的フローの終端。完了状態（セッションの受注ID）が無い直接アクセスはトップページへ戻る。
 * ec-cube-enterprise/pf-eccube3 の Twig（Shopping/complete.twig）は本リポジトリに未取込のため、
 * セレクタは URL・表示文言・要素の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export class FrontShoppingCompletePage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly topUrl: string;
  readonly completeUrl: string;
  readonly shoppingUrl: string;

  readonly heading: Locator;
  readonly body: Locator;
  readonly thanksMessage: Locator;
  readonly orderNumber: Locator;
  readonly errorArea: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.topUrl = `${this.localePrefix}/`;
    this.completeUrl = `${this.localePrefix}/shopping/complete`;
    this.shoppingUrl = `${this.localePrefix}/shopping`;

    // 完了見出し「ご注文完了」（要実機確認：Shopping/complete.twig）
    this.heading = page.getByRole("heading", { name: /ご注文完了/ }).first();
    this.body = page.locator("body");
    // 御礼「ご注文ありがとうございました。」（要実機確認）
    this.thanksMessage = page.getByText(/ご注文ありがとうございました/).first();
    // 注文番号（ご注文番号／TC注文番号）領域（要実機確認）
    this.orderNumber = page.getByText(/ご注文番号|TC注文番号|注文番号/).first();
    // 共通エラー画面のエラー文言枠（要実機確認：ロケールメッセージ）
    this.errorArea = page.locator(".ec-alert-warning, .alert, .error, [class*='error'], [class*='alert']");
  }

  async gotoComplete() {
    await this.page.goto(this.completeUrl);
  }

  /** 完了状態が無い直接アクセスはトップへ戻る（受注IDなし）。期待は処理フロー/画面遷移由来。 */
  async seeRedirectedToTop() {
    await expect(this.page).not.toHaveURL(/\/shopping\/complete/);
    await expect(this.heading).toHaveCount(0);
  }

  /** 購入完了画面の主要表示要素。期待文言は表示メッセージ節由来。 */
  async seeCompletionScreen() {
    await expect(this.heading).toBeVisible();
    await expect(this.thanksMessage).toBeVisible();
    await expect(this.orderNumber).toBeVisible();
  }

  async seeHeading() {
    await expect(this.heading).toBeVisible();
  }

  async seeThanks() {
    await expect(this.thanksMessage).toBeVisible();
  }

  async seeOrderNumber() {
    await expect(this.orderNumber).toBeVisible();
  }

  /** 受注ステータス想定外＝購入処理エラー画面。実文言は要実機確認（front.error.shopping_process）。 */
  async seeShoppingProcessError() {
    await expect(this.heading).toHaveCount(0);
    await expect(this.errorArea.first()).toBeVisible();
  }

  /** SPLINKS決済記録なし＝決済記録不整合エラー画面。実文言は要実機確認（front.error.no_sln_payment_record）。 */
  async seeNoSlnPaymentError() {
    await expect(this.heading).toHaveCount(0);
    await expect(this.errorArea.first()).toBeVisible();
  }
}
