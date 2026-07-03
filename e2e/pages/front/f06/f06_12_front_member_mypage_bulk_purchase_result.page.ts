import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント 会員「まとめて買取査定結果」（F06-12）Page Object。
 * integration_test/e2e/f06_12_front_member_mypage_bulk_purchase_result_e2e_cases.md に対応。
 *
 * 本画面は読み取り専用の一覧表示（GET /mypage/purchase_history/list/{id}）。
 * 期待結果は functions/pf-eccube3/f06-12_front_member_mypage_bulk_purchase_result.md
 *（概要・処理フロー・業務ルール・権限認可）由来。
 * ec-cube-enterprise / pf-eccube3 の Twig は本リポジトリに未取込のため、セレクタはフロントTwig差分に
 * 耐えるよう URL・表示文言・意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export class FrontMemberBulkPurchaseResultPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly loginUrl: string;

  readonly heading: Locator;
  readonly body: Locator;
  readonly passwordInput: Locator;
  readonly listHeaderRow: Locator;
  readonly detailRows: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.loginUrl = `${this.localePrefix}/mypage/login`;

    // 見出し「まとめて買取査定結果」。実DOM(h1/h2/h3)差分に耐えるよう文言で拾う（要実機確認）。
    this.heading = page.getByText("まとめて買取査定結果", { exact: false });
    this.body = page.locator("body");
    this.passwordInput = page
      .locator('input[type="password"], input[name*="password"]')
      .first();
    // 一覧見出し行・明細行（テーブル構造は要実機確認）。
    this.listHeaderRow = page.locator("table thead tr, table tr").first();
    this.detailRows = page.locator("table tbody tr");
  }

  /** まとめて買取査定結果URL（buy_order_id を渡す。非数字も検証用に許容）。 */
  resultUrl(id: string): string {
    return `${this.localePrefix}/mypage/purchase_history/list/${id}`;
  }

  async gotoResult(id: string) {
    await this.page.goto(this.resultUrl(id));
  }

  async gotoLoginPage() {
    await this.page.goto(this.loginUrl);
  }

  async login() {
    await this.gotoLoginPage();
    const email = this.page
      .locator('input[type="email"], input[name*="login_email"], input[name*="email"], input[name*="login_id"]')
      .first();
    const password = this.page.locator('input[type="password"], input[name*="password"]').first();
    await email.fill(ECCUBE_FRONT_USER);
    await password.fill(ECCUBE_FRONT_PASS);
    await this.page.getByRole("button", { name: /ログイン|Login/i }).click();
  }

  /** 未ログインで保護URLへアクセスすると会員ログイン画面へ誘導されること。 */
  async seeRedirectedToLogin() {
    await expect(this.page).toHaveURL(/\/mypage\/login(?:\?|$)/);
    await expect(this.passwordInput).toBeVisible();
  }

  /** 査定結果画面の見出しが表示されること（期待は設計書「フロント挙動」節由来）。 */
  async seeResultHeading() {
    await expect(this.heading).toBeVisible();
  }
}
