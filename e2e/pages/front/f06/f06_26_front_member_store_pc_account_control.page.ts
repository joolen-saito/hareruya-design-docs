import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント 会員/店舗「店頭PC用アカウントで通常会員と異なる制御」（F06-26）Page Object。
 * integration_test/e2e/f06_26_front_member_store_pc_account_control_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f06-26_front_member_store_pc_account_control.md（利用者視点の入口・
 * 処理フロー・表示メッセージ・権限認可・画面遷移）由来（オラクル独立性）。
 * pf-eccube3 の共通エラー画面 Twig は本リポジトリに未取込のため、セレクタは URL・表示文言の意味で寄せる
 * （file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 *
 * 本機能は横断アクセス制御（IP即時ログアウト＝応答後処理／機能遮断＝各機能の前処理）で、
 * 店内アカウント会員・許可IP設定・店頭フロント区分（dtb_customer_group.shop_front_flg）に依存する破壊的前提を含む。
 */
export class FrontStorePcAccountControlPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly loginUrl: string;
  readonly logoutUrl: string;
  /** 遮断対象フロント機能の例（会員情報変更）。要ログイン。 */
  readonly memberEditUrl: string;
  /** 遮断対象フロント機能の例（配送先登録）。要ログイン。 */
  readonly deliveryUrl: string;
  /** 遮断対象フロント機能の例（お問い合わせ）。非会員は制御対象外（通常表示）。 */
  readonly contactUrl: string;

  readonly body: Locator;
  /** 共通エラー画面タイトル「店頭用アカウントでは利用できません。」。要実機確認：共通エラー画面Twig。 */
  readonly errorTitle: Locator;
  readonly loginPasswordInput: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.loginUrl = `${this.localePrefix}/mypage/login`;
    this.logoutUrl = `${this.localePrefix}/logout`;
    this.memberEditUrl = `${this.localePrefix}/mypage/change`;
    this.deliveryUrl = `${this.localePrefix}/mypage/delivery`;
    this.contactUrl = `${this.localePrefix}/contact`;

    this.body = page.locator("body");
    // 共通エラー画面タイトル（表示文言はメッセージ節由来）。要実機確認：本文は空。
    this.errorTitle = page.getByText("店頭用アカウントでは利用できません");
    this.loginPasswordInput = page
      .locator('input[type="password"], input[name*="login_pass"], input[name*="password"]')
      .first();
  }

  async goto(url: string) {
    await this.page.goto(url);
  }

  /** 通常会員でログイン（資格情報は環境変数。会員ログイン機能を正とする）。 */
  async login() {
    await this.page.goto(this.loginUrl);
    const email = this.page
      .locator('input[type="email"], input[name*="login_email"], input[name*="email"]')
      .first();
    await email.fill(ECCUBE_FRONT_USER);
    await this.loginPasswordInput.fill(ECCUBE_FRONT_PASS);
    await this.page.getByRole("button", { name: /ログイン|Login/i }).first().click();
  }

  /** 共通エラー画面（店頭用アカウントでは利用できません。）が表示されていること（仕様：表示メッセージ節）。 */
  async seeStoreAccountError() {
    await expect(this.errorTitle).toBeVisible();
  }

  /** 共通エラー画面（店頭用アカウント遮断）が表示されていないこと（非会員・通常会員は制御対象外）。 */
  async seeNotBlocked() {
    await expect(this.errorTitle).toHaveCount(0);
  }
}
