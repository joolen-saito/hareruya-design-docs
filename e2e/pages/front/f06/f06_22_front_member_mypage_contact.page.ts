import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント「お問い合わせ送信」（F06-22）Page Object。
 * integration_test/e2e/f06_22_front_member_mypage_contact_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f06-22_front_member_mypage_contact.md（利用者視点の入口・処理フロー・
 * フロント挙動・表示メッセージ・バリデーション）由来。pf-eccube3 の Twig（Contact/index.twig 等）は本
 * リポジトリに未取込のため、セレクタはフロントTwig差分に耐えるよう URL・表示文言・フォーム要素の意味で
 * 寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 *
 * 破壊的注意: mode=complete（送信をする）はお問い合わせメールを送信し dtb_contact に保存する。
 * 送信確定・完了画面到達・会員紐づけは要件名マスタ/会員シード・メール実送信のため spec では test.fixme。
 * お問い合わせ画面はログイン不要（会員は初期表示・紐づけのみ）。
 */
export class FrontMemberContactPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly loginUrl: string;
  readonly contactUrl: string;
  readonly contactCompleteUrl: string;

  readonly body: Locator;
  readonly heading: Locator;
  /** 件名（必須・件名マスタからの選択）。フォームキー subject。 */
  readonly subjectSelect: Locator;
  /** お問い合わせ時氏名（姓）。 */
  readonly nameSei: Locator;
  /** お問い合わせ時氏名（名）。 */
  readonly nameMei: Locator;
  /** メールアドレス（必須・メール厳格形式）。フォームキー email。 */
  readonly emailInput: Locator;
  /** 内容（必須・複数行）。フォームキー contents。 */
  readonly contentsTextarea: Locator;
  /** 「確認画面へ」ボタン（mode=confirm）。 */
  readonly confirmButton: Locator;
  /** 確認画面の「送信をする」ボタン（mode=complete・破壊的）。 */
  readonly sendButton: Locator;
  /** 「戻る」リンク。 */
  readonly backLink: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.loginUrl = `${this.localePrefix}/mypage/login`;
    this.contactUrl = `${this.localePrefix}/contact`;
    this.contactCompleteUrl = `${this.localePrefix}/contact/complete`;

    this.body = page.locator("body");
    // 見出し「お問い合わせ」。heading ロールと本文文言の双方で拾う（要実機確認）。
    this.heading = page.getByRole("heading", { name: /お問い合わせ/ }).first();
    this.subjectSelect = page.locator('select[name*="subject"]').first();
    this.nameSei = page.locator('input[name*="name"][name*="01"], input[name*="name01"], input[name*="[name][01]"]').first();
    this.nameMei = page.locator('input[name*="name"][name*="02"], input[name*="name02"], input[name*="[name][02]"]').first();
    this.emailInput = page
      .locator('input[type="email"], input[name*="email"]')
      .first();
    this.contentsTextarea = page.locator('textarea[name*="contents"], textarea[name*="body"], textarea').first();
    this.confirmButton = page.getByRole("button", { name: /確認画面へ|確認/ }).first();
    this.sendButton = page.getByRole("button", { name: /送信をする|送信する|送信/ }).first();
    this.backLink = page.getByRole("link", { name: /戻る/ }).first();
  }

  async gotoContact() {
    await this.page.goto(this.contactUrl);
  }

  async gotoContactComplete() {
    await this.page.goto(this.contactCompleteUrl);
  }

  async gotoLoginPage() {
    await this.page.goto(this.loginUrl);
  }

  /** 会員ログイン（資格情報は環境変数。会員ログイン機能を正とする）。お問い合わせ自体はログイン不要。 */
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

  /** お問い合わせ入力画面の主要フォーム要素が表示されていること（仕様：フロント挙動 表示要素）。 */
  async seeContactForm() {
    await expect(this.body).toContainText("お問い合わせ");
    await expect(this.emailInput).toBeVisible();
    await expect(this.contentsTextarea).toBeVisible();
    await expect(this.confirmButton).toBeVisible();
  }
}
