import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント 会員「購入履歴一覧」（F06-06）Page Object。
 * integration_test/e2e/f06_06_front_member_mypage_order_history_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f06-06_front_member_mypage_order_history.md
 * （利用者視点の入口・処理フロー・集計条件・エッジケース・画面遷移）由来。
 * ec-cube-enterprise/pf-eccube3 の Twig（Mypage/shopping_history.twig）は本リポジトリに未取込のため、
 * セレクタはフロントTwig差分に耐えるよう URL・表示文言・要素の意味で寄せる
 * （file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export class FrontMemberOrderHistoryPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly loginUrl: string;
  readonly historyUrl: string;

  readonly heading: Locator;
  readonly body: Locator;
  readonly countArea: Locator;
  readonly orderList: Locator;
  readonly orderNumberLink: Locator;
  readonly repurchaseButton: Locator;
  readonly loginPasswordInput: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.loginUrl = `${this.localePrefix}/mypage/login`;
    this.historyUrl = `${this.localePrefix}/mypage/shopping_history`;

    // 見出し「購入履歴一覧」。要実機確認: Mypage/shopping_history.twig の見出し文言。
    this.heading = page.getByRole("heading", { name: /購入履歴/ }).first();
    this.body = page.locator("body");
    // 件数表示（全件数・現在の表示範囲）。差分に備え「件」を含む領域で拾う。要実機確認。
    this.countArea = page.getByText(/件/).first();
    // 注文一覧コンテナ。要実機確認: 一覧のテーブル/リスト構造。
    this.orderList = page.locator("table, ul, .ec-historyRole, [class*='history']").first();
    // 注文番号リンク（詳細遷移用）。要実機確認: /shopping_history/detail/{id} への a。
    this.orderNumberLink = page.locator('a[href*="/shopping_history/detail/"]').first();
    // 「この注文内容で再度購入する」操作。要実機確認: ボタン文言。
    this.repurchaseButton = page
      .getByRole("button", { name: /この注文内容で再度購入する|再度購入|再購入/ })
      .first();
    this.loginPasswordInput = page
      .locator('input[type="password"], input[name*="password"], input[name*="login_pass"]')
      .first();
  }

  async gotoHistory() {
    await this.page.goto(this.historyUrl);
  }

  async gotoHistoryPage(pageNo: number) {
    await this.page.goto(`${this.historyUrl}?page=${pageNo}`);
  }

  async gotoDetail(orderId: number) {
    await this.page.goto(`${this.localePrefix}/mypage/shopping_history/detail/${orderId}`);
  }

  async gotoReceipt(orderId: number) {
    await this.page.goto(`${this.localePrefix}/mypage/shopping_history/printOrderReceipt/${orderId}`);
  }

  async gotoLoginPage() {
    await this.page.goto(this.loginUrl);
  }

  async login() {
    await this.gotoLoginPage();
    const email = this.page
      .locator('input[type="email"], input[name*="login_email"], input[name*="email"]')
      .first();
    await email.fill(ECCUBE_FRONT_USER);
    await this.loginPasswordInput.fill(ECCUBE_FRONT_PASS);
    await this.page.getByRole("button", { name: /ログイン|Login/i }).first().click();
  }

  /** 未ログインで保護URLへアクセスすると会員ログイン画面へ誘導されること（処理フロー#1・権限認可）。 */
  async seeLoginRedirect() {
    await expect(this.page).toHaveURL(/\/mypage\/login(?:\?|$)/);
    await expect(this.loginPasswordInput).toBeVisible();
  }

  /** ログイン後、購入履歴一覧画面が表示されること（成功時出力）。 */
  async seeHistoryScreen() {
    await expect(this.page).toHaveURL(/\/mypage\/shopping_history(?:\?|$)/);
    await expect(this.heading).toBeVisible();
  }
}
