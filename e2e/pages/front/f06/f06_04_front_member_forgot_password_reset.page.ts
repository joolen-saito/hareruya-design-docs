import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_FRONT_LOCALE, ECCUBE_FRONT_SHOP } from "../../../config/default.config";

/**
 * フロント 会員「パスワード再発行・再設定（パスワードをお忘れの方）」（F06-04）Page Object。
 * integration_test/e2e/f06_04_front_member_forgot_password_reset_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f06-04_front_member_forgot_password_reset.md（画面・処理フロー・表示メッセージ）由来。
 * ec-cube-enterprise/pf-eccube3 の Twig（Forgot/index・complete・reset・resetcomplete）は本リポジトリに未取込のため、
 * セレクタは URL・表示文言・フォーム要素の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。非ログイン機能。
 */
export class FrontForgotPasswordPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly forgotUrl: string;
  readonly completeUrl: string;

  readonly body: Locator;
  readonly forgotHeading: Locator; // 見出し「パスワードの再発行」
  readonly resetHeading: Locator; // 見出し「パスワード再設定」
  readonly emailInput: Locator; // 再発行: name=login_email（要実機確認）
  readonly resetEmailInput: Locator; // 再設定: name=email（要実機確認）
  readonly newPasswordInput: Locator;
  readonly newPasswordConfirmInput: Locator;
  readonly nextButton: Locator; // 「次のページへ」
  readonly changeButton: Locator; // 「変更する」
  readonly homeLink: Locator; // 「ホームへ戻る」
  readonly errorArea: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.forgotUrl = `${this.localePrefix}/forgot`;
    this.completeUrl = `${this.localePrefix}/forgot/complete`;

    this.body = page.locator("body");
    this.forgotHeading = page.getByRole("heading", { name: /パスワードの再発行/ }).first();
    this.resetHeading = page.getByRole("heading", { name: /パスワード再設定/ }).first();
    // 再発行画面のメール欄（Forgot/index.twig。フォームキー login_email・要実機確認）。
    this.emailInput = page
      .locator('input[name*="login_email"], input[type="email"], input[name*="email"]')
      .first();
    // 再設定画面の登録メール欄（Forgot/reset.twig。フォームキー email・要実機確認）。
    this.resetEmailInput = page.locator('input[name*="email"], input[type="email"]').first();
    this.newPasswordInput = page.locator('input[type="password"][name*="password"], input[type="password"]').first();
    this.newPasswordConfirmInput = page.locator('input[type="password"]').nth(1);
    this.nextButton = page.getByRole("button", { name: /次のページへ|次へ/ }).first();
    this.changeButton = page.getByRole("button", { name: /変更する|変更/ }).first();
    this.homeLink = page.getByRole("link", { name: /ホームへ戻る|ホーム|戻る/ }).first();
    // 項目別エラー枠。Twig差分に備え一般的なエラークラスで拾う（要実機確認）。
    this.errorArea = page.locator(".ec-errorMessage, .text-danger, .error, [class*='error']");
  }

  async gotoForgot() {
    await this.page.goto(this.forgotUrl);
  }

  async gotoComplete() {
    await this.page.goto(this.completeUrl);
  }

  /** 任意のリセットキーで再設定URLへ直接遷移する（不正キー検証・有効キー検証の双方に使用）。 */
  async gotoReset(resetKey: string) {
    await this.page.goto(`${this.localePrefix}/forgot/reset/${resetKey}`);
  }

  async submitForgot(email: string) {
    await this.emailInput.fill(email);
    await this.nextButton.click();
  }

  /** 再発行画面の初期表示（見出し・メール欄・「次のページへ」）。期待は設計書「フロント挙動（表示要素）」由来。 */
  async seeForgotScreen() {
    await expect(this.forgotHeading).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.nextButton).toBeVisible();
  }

  /** 再発行完了画面の送信完了案内。期待文言は設計書「表示メッセージ（再発行完了）」由来。 */
  async seeCompleteScreen() {
    await expect(this.body).toContainText("パスワード再発行メールの送信が完了しました");
  }

  /** 再設定URLがエラー画面（再設定フォーム非表示）であること。判定順序1/2 由来。 */
  async seeResetErrorScreen() {
    // 新パスワード入力フォームを表示しないこと（キー不正・有効会員取得不可の共通エラー画面）。
    await expect(this.resetHeading).toHaveCount(0);
    await expect(this.newPasswordInput).toHaveCount(0);
  }
}
