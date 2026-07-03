import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント 会員「退会（退会手続き）」（F06-21）Page Object。
 * integration_test/e2e/f06_21_front_member_mypage_withdraw_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f06-21_front_member_mypage_withdraw.md（利用者視点の入口・処理フロー・
 * 表示メッセージ・画面遷移・権限認可）由来。pf-eccube3 の Twig（Mypage/withdraw*.twig）は本リポジトリに
 * 未取込のため、セレクタはフロントTwig差分に耐えるよう URL・表示文言・フォーム要素の意味で寄せる
 * （file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 *
 * 破壊的注意: mode=complete（退会する押下・パスワード一致）は会員を論理削除し外部連携・メール送信を伴う。
 * 本Page Objectの submitWithdraw は「誤り/未入力パスワードでの非破壊検証」を主用途とし、正パスワードでの
 * 退会実行は要会員シード/隔離環境（spec 側で test.fixme）とする。
 */
export class FrontMemberWithdrawPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly loginUrl: string;
  readonly mypageUrl: string;
  readonly withdrawUrl: string;
  readonly withdrawCompleteUrl: string;

  readonly body: Locator;
  readonly heading: Locator;
  /** 退会確認画面の現在パスワード入力欄（フォームキー login_pass）。 */
  readonly passwordInput: Locator;
  /** 未認証誘導先（会員ログイン画面）のパスワード欄（誘導確認用）。 */
  readonly loginPasswordInput: Locator;
  /** 退会前画面の「退会手続きへ」ボタン（mode=confirm）。 */
  readonly proceedButton: Locator;
  /** 退会確認画面の「退会する」ボタン（mode=complete）。 */
  readonly withdrawButton: Locator;
  /** 退会前・退会確認画面の「戻る」リンク。 */
  readonly backLink: Locator;
  /** 退会完了画面の「ホームへ戻る」リンク。 */
  readonly homeLink: Locator;
  /** エラー枠（パスワード誤り／連携失敗）。Twig差分に備え文言と一般クラスで拾う。 */
  readonly errorArea: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.loginUrl = `${this.localePrefix}/mypage/login`;
    this.mypageUrl = `${this.localePrefix}/mypage`;
    this.withdrawUrl = `${this.localePrefix}/mypage/withdraw`;
    this.withdrawCompleteUrl = `${this.localePrefix}/mypage/withdraw_complete`;

    this.body = page.locator("body");
    // 見出し「退会」/「退会手続き」/「退会完了」。heading ロールと本文文言の双方で拾う（要実機確認）。
    this.heading = page.getByRole("heading", { name: /退会/ }).first();
    this.passwordInput = page
      .locator('input[type="password"][name*="login_pass"], input[type="password"][name*="password"], input[type="password"]')
      .first();
    this.loginPasswordInput = page
      .locator('input[type="password"], input[name*="login_pass"], input[name*="password"]')
      .first();
    this.proceedButton = page.getByRole("button", { name: /退会手続きへ/ }).first();
    this.withdrawButton = page.getByRole("button", { name: /退会する/ }).first();
    this.backLink = page.getByRole("link", { name: /戻る/ }).first();
    this.homeLink = page.getByRole("link", { name: /ホームへ戻る|ホーム/ }).first();
    this.errorArea = page.locator(".text-danger, .ec-errorMessage, .error, [class*='error']");
  }

  async gotoWithdraw() {
    await this.page.goto(this.withdrawUrl);
  }

  async gotoWithdrawComplete() {
    await this.page.goto(this.withdrawCompleteUrl);
  }

  async gotoLoginPage() {
    await this.page.goto(this.loginUrl);
  }

  /** 会員ログイン（資格情報は環境変数。会員ログイン機能を正とする）。 */
  async login() {
    await this.gotoLoginPage();
    const email = this.page
      .locator('input[type="email"], input[name*="login_email"], input[name*="email"]')
      .first();
    const password = this.page.locator('input[type="password"], input[name*="login_pass"], input[name*="password"]').first();
    await email.fill(ECCUBE_FRONT_USER);
    await password.fill(ECCUBE_FRONT_PASS);
    await this.page.getByRole("button", { name: /ログイン|Login/i }).first().click();
  }

  /** 退会前画面から「退会手続きへ」を押して退会確認画面（mode=confirm・非破壊）へ進む。 */
  async proceedToConfirm() {
    await this.gotoWithdraw();
    await this.proceedButton.click();
  }

  /**
   * 退会確認画面で現在パスワードを入力し「退会する」を押す。
   * 非破壊検証用途では誤り/未入力パスワードを渡す（照合不一致→退会しない）。
   */
  async submitWithdraw(password: string) {
    if (password) {
      await this.passwordInput.fill(password);
    }
    await this.withdrawButton.click();
  }

  /** 未ログインで退会系URLへアクセスした際、会員ログイン画面へ誘導されていること。 */
  async seeLoginRedirect() {
    await expect(this.page).toHaveURL(/\/mypage\/login(?:\?|$)/);
    await expect(this.loginPasswordInput).toBeVisible();
  }

  /** 退会前画面：見出し「退会」・注意文・「退会手続きへ」ボタンを表示していること（仕様：表示メッセージ節）。 */
  async seeWithdrawTopScreen() {
    await expect(this.body).toContainText("退会");
    await expect(this.proceedButton).toBeVisible();
  }

  /** 退会確認画面：見出し「退会手続き」・現在パスワード欄・「退会する」ボタンを表示していること。 */
  async seeConfirmScreen() {
    await expect(this.body).toContainText("退会手続き");
    await expect(this.passwordInput).toBeVisible();
    await expect(this.withdrawButton).toBeVisible();
  }
}
