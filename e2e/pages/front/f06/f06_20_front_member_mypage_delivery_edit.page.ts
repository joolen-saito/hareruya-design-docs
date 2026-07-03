import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント 会員「配送先登録・編集」（F06-20）Page Object。
 * integration_test/e2e/f06_20_front_member_mypage_delivery_edit_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f06-20_front_member_mypage_delivery_edit.md（利用者視点の入口・
 * 処理フロー・フロント挙動・バリデーション・画面遷移・権限認可）由来であり、実装/POM由来の表示文言を
 * オラクル化しない。pf-eccube3 の Twig（Mypage/delivery.twig・delivery_edit.twig・delivery_confirm.twig）は
 * 本リポジトリに未取込のため、セレクタはフロントTwig差分に耐えるよう URL・表示文言・フォーム要素の意味で寄せる
 * （file:line 根拠が取れない箇所は要実機確認）。
 * 登録確定(POST …/confirm)・削除(DELETE …/delete)は配送先の保存・削除を伴う破壊的操作のため、
 * spec 側では test.fixme（要: 会員/配送先シード）で保留する。未実行雛形。
 */
export class FrontMemberMypageDeliveryEditPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly loginUrl: string;
  /** 配送先一覧（GET /{_locale}/mypage/delivery）。 */
  readonly deliveryUrl: string;
  /** 新規登録の編集画面（GET /{_locale}/mypage/delivery/new/edit）。 */
  readonly newEditUrl: string;
  /** 保護された会員機能URLの一例（未ログイン誘導の確認用）。 */
  readonly protectedUrl: string;

  readonly body: Locator;
  readonly loginPasswordInput: Locator;

  /** 「新規登録」リンク/ボタン（要実機確認）。 */
  readonly newRegisterLink: Locator;
  /** 「編集」リンク（要実機確認）。 */
  readonly editLink: Locator;
  /** 「削除」ボタン/リンク（要実機確認）。 */
  readonly deleteControl: Locator;

  /** 配送先名称。フォームキー addressName（mapped=false）（要実機確認）。 */
  readonly addressNameInput: Locator;
  /** 配送先氏名（姓）。フォームキー name[name01]（要実機確認）。 */
  readonly name01Input: Locator;
  /** 「確認画面へ」ボタン（要実機確認）。 */
  readonly toConfirmButton: Locator;
  /** 確認画面「登録する」ボタン（要実機確認）。 */
  readonly registerButton: Locator;
  /** 確認画面「戻る」ボタン（要実機確認）。 */
  readonly backButton: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.loginUrl = `${this.localePrefix}/mypage/login`;
    this.deliveryUrl = `${this.localePrefix}/mypage/delivery`;
    this.newEditUrl = `${this.localePrefix}/mypage/delivery/new/edit`;
    // 配送先一覧自体が保護URL。未ログイン誘導の確認に用いる。
    this.protectedUrl = `${this.localePrefix}/mypage/delivery`;

    this.body = page.locator("body");
    this.loginPasswordInput = page
      .locator('input[type="password"], input[name*="login_pass"], input[name*="password"]')
      .first();

    // 一覧の操作（新規登録/編集/削除）。文言・href の意味で寄せる（要実機確認）。
    this.newRegisterLink = page
      .locator('a[href*="/delivery/new/edit"]')
      .or(page.getByRole("link", { name: /新規登録|新規お届け先/ }))
      .first();
    this.editLink = page
      .locator('a[href*="/edit"]')
      .or(page.getByRole("link", { name: /編集/ }))
      .first();
    this.deleteControl = page
      .getByRole("button", { name: /削除/ })
      .or(page.getByRole("link", { name: /削除/ }))
      .first();

    // 編集画面の入力欄（配送先フォーム種別 customer_address 由来。name/id は要実機確認）。
    this.addressNameInput = page
      .locator('input[name*="address_name"], input[name*="addressName"]')
      .first();
    this.name01Input = page
      .locator('input[name*="name01"], input[name*="[name01]"], #customer_address_name_name01')
      .first();
    this.toConfirmButton = page
      .getByRole("button", { name: /確認画面へ|確認/ })
      .first();
    this.registerButton = page
      .getByRole("button", { name: /登録する|登録/ })
      .first();
    this.backButton = page
      .getByRole("button", { name: /戻る/ })
      .or(page.getByRole("link", { name: /戻る/ }))
      .first();
  }

  async gotoDelivery() {
    await this.page.goto(this.deliveryUrl);
  }

  async gotoNewEdit() {
    await this.page.goto(this.newEditUrl);
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

  /** 未ログインで配送先へアクセスした際、会員ログイン画面へ誘導されていること（権限認可）。 */
  async seeLoginRedirect() {
    await expect(this.page).toHaveURL(/\/mypage\/login(?:\?|$)/);
    await expect(this.loginPasswordInput).toBeVisible();
  }

  /** ログイン後の配送先一覧：会員の配送先と「新規登録」導線を表示していること（仕様：フロント挙動 表示要素）。 */
  async seeDeliveryList() {
    await expect(this.body).toContainText("配送先");
    await expect(this.newRegisterLink).toBeVisible();
  }

  /** 新規登録の編集フォーム：配送先名称・氏名欄と「確認画面へ」ボタンを表示していること。 */
  async seeNewEditForm() {
    await expect(this.addressNameInput).toBeVisible();
    await expect(this.name01Input).toBeVisible();
    await expect(this.toConfirmButton).toBeVisible();
  }
}
