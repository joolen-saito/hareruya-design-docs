import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント 会員「会員情報変更」（F06-18）Page Object。
 * integration_test/e2e/f06_18_front_member_mypage_customer_edit_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f06-18_front_member_mypage_customer_edit.md（利用者視点の入口・
 * 処理フロー・フロント挙動・バリデーション・画面遷移・権限認可）由来であり、実装/POM由来の表示文言を
 * オラクル化しない。pf-eccube3 の Twig（Mypage/change.twig）は本リポジトリに未取込のため、セレクタは
 * フロントTwig差分に耐えるよう URL・表示文言・フォーム要素の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。
 * 会員情報の更新確定(POST /mypage/change の妥当送信)はスマレジ連携・会員情報更新を伴う破壊的操作のため、
 * spec 側では test.fixme（要: 会員シード/スマレジスタブ）で保留する。未実行雛形。
 */
export class FrontMemberMypageCustomerEditPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly loginUrl: string;
  /** 会員情報変更画面（GET/POST /{_locale}/mypage/change）。 */
  readonly changeUrl: string;
  /** 保護された会員機能URLの一例（未ログイン誘導の確認用）。 */
  readonly protectedUrl: string;

  readonly body: Locator;
  /** 見出し「会員情報変更」（要実機確認：Mypage/change.twig）。 */
  readonly heading: Locator;
  readonly loginPasswordInput: Locator;

  /** お名前（姓）。フォームキー name[name01]（要実機確認）。 */
  readonly name01Input: Locator;
  /** お名前（名）。フォームキー name[name02]（要実機確認）。 */
  readonly name02Input: Locator;
  /** メールアドレス（1欄目）。フォームキー email[first]（要実機確認）。 */
  readonly emailFirstInput: Locator;
  /** メールアドレス（確認欄）。フォームキー email[second]（要実機確認）。 */
  readonly emailSecondInput: Locator;
  /** MTG Companion登録名（英字姓）。フォームキー first_name_en（要実機確認）。 */
  readonly firstNameEnInput: Locator;
  /** 「変更する」ボタン（要実機確認）。 */
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.loginUrl = `${this.localePrefix}/mypage/login`;
    this.changeUrl = `${this.localePrefix}/mypage/change`;
    // 会員情報変更画面自体が保護URL。未ログイン誘導の確認に用いる。
    this.protectedUrl = `${this.localePrefix}/mypage/change`;

    this.body = page.locator("body");
    // 見出し「会員情報変更」。Twig差分に備え heading ロールと本文文言の双方で拾う（要実機確認）。
    this.heading = page.getByRole("heading", { name: /会員情報変更/ }).first();
    this.loginPasswordInput = page
      .locator('input[type="password"], input[name*="login_pass"], input[name*="password"]')
      .first();

    // 各編集欄（会員登録フォーム種別 entry 由来。name/id は要実機確認）。
    this.name01Input = page
      .locator('input[name*="name01"], input[name*="[name01]"], #entry_name_name01')
      .first();
    this.name02Input = page
      .locator('input[name*="name02"], input[name*="[name02]"], #entry_name_name02')
      .first();
    this.emailFirstInput = page
      .locator('input[name*="email][first]"], input[name*="email_first"], input[type="email"]')
      .first();
    this.emailSecondInput = page
      .locator('input[name*="email][second]"], input[name*="email_second"]')
      .first();
    this.firstNameEnInput = page
      .locator('input[name*="first_name_en"], #entry_first_name_en')
      .first();
    this.submitButton = page
      .getByRole("button", { name: /変更する|Register|更新/ })
      .first();
  }

  async gotoChange() {
    await this.page.goto(this.changeUrl);
  }

  async gotoProtectedUrl() {
    await this.page.goto(this.protectedUrl);
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
    await email.fill(ECCUBE_FRONT_USER);
    await this.loginPasswordInput.fill(ECCUBE_FRONT_PASS);
    await this.page.getByRole("button", { name: /ログイン|Login/i }).first().click();
  }

  /** 未ログインで会員情報変更へアクセスした際、会員ログイン画面へ誘導されていること（権限認可）。 */
  async seeLoginRedirect() {
    await expect(this.page).toHaveURL(/\/mypage\/login(?:\?|$)/);
    await expect(this.loginPasswordInput).toBeVisible();
  }

  /** ログイン後の会員情報変更画面：見出しと主要編集欄・「変更する」ボタンを表示していること（仕様：フロント挙動 表示要素）。 */
  async seeEditForm() {
    await expect(this.body).toContainText("会員情報変更");
    await expect(this.name01Input).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }
}
