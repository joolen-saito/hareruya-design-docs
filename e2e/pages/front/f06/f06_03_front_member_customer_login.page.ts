import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント 会員「本店・支店で会員ログイン」（F06-03）Page Object。
 * integration_test/e2e/f06_03_front_member_customer_login_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f06-03_front_member_customer_login.md（画面・処理フロー・表示メッセージ）由来。
 * ec-cube-enterprise Twig は本リポジトリに未取込のため、セレクタはフロントTwig差分に耐えるよう
 * URL・表示文言・フォーム要素の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export class FrontMemberLoginPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly loginUrl: string;
  readonly logoutUrl: string;
  readonly mypageUrl: string;

  readonly heading: Locator;
  readonly body: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly rememberMe: Locator;
  readonly csrfToken: Locator;
  readonly loginButton: Locator;
  readonly entryButton: Locator;
  readonly forgotLink: Locator;
  readonly errorArea: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.loginUrl = `${this.localePrefix}/mypage/login`;
    this.logoutUrl = `${this.localePrefix}/logout`;
    this.mypageUrl = `${this.localePrefix}/mypage`;

    this.heading = page.getByRole("heading", { name: /ログイン/ }).first();
    this.body = page.locator("body");
    this.emailInput = page
      .locator('input[name*="login_email"]:visible, input[type="email"]:visible, input[name*="email"]:visible')
      .first();
    this.passwordInput = page
      .locator('input[name*="login_pass"]:visible, input[type="password"]:visible, input[name*="password"]:visible')
      .first();
    this.rememberMe = page.locator('input[name*="login_memory"], input[type="checkbox"][name*="memory"]').first();
    this.csrfToken = page.locator('input[type="hidden"][name="_csrf_token"], input[type="hidden"][name*="csrf"]').first();
    this.loginButton = page.getByRole("button", { name: /ログイン|Login/i }).first();
    this.entryButton = page.getByRole("link", { name: /会員登録|会員情報登録|登録/ }).first();
    this.forgotLink = page.getByRole("link", { name: /パスワードをお忘れ/ }).first();
    // 認証エラー枠（赤文字）。Twig差分に備え文言と一般的なエラークラスの双方で拾う。
    this.errorArea = page.locator(".text-danger, .ec-errorMessage, .error, [class*='error']");
  }

  async gotoLoginPage() {
    await this.page.goto(this.loginUrl);
  }

  async gotoMypage() {
    await this.page.goto(this.mypageUrl);
  }

  async logout() {
    await this.page.goto(this.logoutUrl);
  }

  async fillAndSubmit(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async login() {
    await this.gotoLoginPage();
    await this.fillAndSubmit(ECCUBE_FRONT_USER, ECCUBE_FRONT_PASS);
  }

  async seeLoginScreen() {
    await expect(this.heading).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.passwordInput).toBeVisible();
    await expect(this.loginButton).toBeVisible();
  }

  /** 認証失敗の共通文言(2行)を表示していること。期待文言は設計書「表示メッセージ」節由来。 */
  async seeAuthFailureMessage() {
    await expect(this.body).toContainText("ログインできませんでした");
    await expect(this.body).toContainText("入力内容に誤りがないかご確認ください");
    await expect(this.page).toHaveURL(/\/mypage\/login|\/login_check/);
  }
}
