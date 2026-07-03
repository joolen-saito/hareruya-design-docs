import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント 会員「オンライン本人確認」（F06-13）Page Object。
 * integration_test/e2e/f06_13_front_member_mypage_online_identification_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f06-13_front_member_mypage_online_identification.md
 * （利用者視点の入口・フロント挙動・処理フロー・表示メッセージ・画面遷移）由来。
 * ec-cube-enterprise/pf-eccube3 の Twig は本リポジトリに未取込のため、セレクタは
 * URL・表示文言・フォーム要素の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 *
 * /mypage 配下は会員ログイン必須。撮影・申請はスマートフォン・タブレット限定
 * （カメラ撮影・オブジェクトストレージ保存・外部本人確認・申請完了メールを伴う）。
 */
export class FrontMemberOnlineIdentificationPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly loginUrl: string;
  readonly mypageUrl: string;
  readonly startUrl: string;
  readonly photographUrl: string;
  readonly completeUrl: string;

  readonly body: Locator;
  readonly startHeading: Locator;
  readonly identificationSelect: Locator;
  readonly photographButton: Locator;
  readonly agreementCheckbox: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.loginUrl = `${this.localePrefix}/mypage/login`;
    this.mypageUrl = `${this.localePrefix}/mypage`;
    this.startUrl = `${this.localePrefix}/mypage/identification`;
    this.photographUrl = `${this.localePrefix}/mypage/identification/photograph`;
    this.completeUrl = `${this.localePrefix}/mypage/identification/complete`;

    this.body = page.locator("body");
    // 見出しは表示文言由来（要実機確認：online_identification_start.twig）。
    this.startHeading = page.getByText("オンライン本人確認について", { exact: false });
    // 身分証種別の選択フォーム。フォームキー identification_select.identification（要実機確認）。
    this.identificationSelect = page
      .locator('select[name*="identification"], input[name*="identification"][type="radio"]')
      .first();
    this.photographButton = page.getByRole("button", { name: /撮影画面へ/ }).first();
    // 最新画像であることへの同意（撮影画面）。フォームキー identification_image 配下（要実機確認）。
    this.agreementCheckbox = page.locator('input[type="checkbox"]').first();
  }

  async gotoStartPage() {
    await this.page.goto(this.startUrl);
  }

  async gotoPhotographDirect() {
    await this.page.goto(this.photographUrl);
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

  /** スタート画面の主要表示要素（見出し・種別選択・撮影画面へ）を表示していること。 */
  async seeStartScreen() {
    await expect(this.startHeading).toBeVisible();
    await expect(this.identificationSelect).toBeVisible();
    await expect(this.photographButton).toBeVisible();
  }
}
