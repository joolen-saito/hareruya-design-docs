import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント マイページ「登録済クレジットカード」Page Object。
 * 期待結果は functions/ec-cube-enterprise/f06-19_front_member_mypage_credit_card.md 由来。
 * セレクタはフロントTwig差分に耐えるため、URL・表示文言・フォーム要素の意味で寄せる。
 */
export class FrontMemberMypageCreditCardPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly loginUrl: string;
  readonly cardUrl: string;

  readonly heading: Locator;
  readonly body: Locator;
  readonly cardNumberInput: Locator;
  readonly expMonthInput: Locator;
  readonly expYearInput: Locator;
  readonly tokenInput: Locator;
  readonly registerButton: Locator;
  readonly deleteButton: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.loginUrl = `${this.localePrefix}/mypage/login`;
    this.cardUrl = `${this.localePrefix}/mypage/sln_edit_card`;

    this.heading = page.getByText("登録済クレジットカード", { exact: false });
    this.body = page.locator("body");
    this.cardNumberInput = page
      .locator('input[name*="card_no"], input[name*="card_number"], input[name*="CardNo"]')
      .first();
    this.expMonthInput = page
      .locator('select[name*="month"], input[name*="month"], select[name*="Month"]')
      .first();
    this.expYearInput = page
      .locator('select[name*="year"], input[name*="year"], select[name*="Year"]')
      .first();
    this.tokenInput = page.locator('input[type="hidden"][name*="token"], input[type="hidden"][id*="token"]').first();
    this.registerButton = page
      .getByRole("button", { name: /カード情報登録|登録|更新/ })
      .first();
    this.deleteButton = page
      .getByRole("button", { name: /カード情報削除|削除/ })
      .first();
  }

  async gotoCardPage() {
    await this.page.goto(this.cardUrl);
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

  async seeCardScreen() {
    await expect(this.heading).toBeVisible();
    await expect(this.cardNumberInput).toBeVisible();
    await expect(this.expMonthInput).toBeVisible();
    await expect(this.expYearInput).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }

  async seeHelperTextsIfConfigured() {
    const helperTexts = [
      "ご本人名義のカードをご使用下さい。",
      "カード裏面の署名欄",
      "ご本人の誕生日の月日",
      "電話番号下4桁",
    ];
    for (const text of helperTexts) {
      const locator = this.body.getByText(text, { exact: false });
      const count = await locator.count();
      if (count > 0) {
        await expect(locator.first()).toBeVisible();
      }
    }
  }
}
