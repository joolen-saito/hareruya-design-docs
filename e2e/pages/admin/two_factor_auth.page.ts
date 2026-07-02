import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../config/default.config";

/**
 * 管理画面 二段階認証 Page Object（追加認証 / 初回設定 / 本人再設定 の3画面）。
 * 期待結果は仕様(m01-02_admin_login_two_factor_auth.md / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_two_factor_auth`（TwoFactorAuthType.php:62-64）由来の位置情報のみ。
 *
 * DOM id 根拠:
 *  - device_token → #admin_two_factor_auth_device_token（two_factor_auth.twig:34 / set.twig:58 / edit.twig:87）
 *  - auth_key(hidden) → #admin_two_factor_auth_auth_key（set.twig:48 / edit.twig:51。追加認証画面は Controller.php:52 で remove）
 *  - 追加認証ボタン「認証」trans admin.setting.system.two_factor_auth.auth（two_factor_auth.twig:39 / messages.ja.yaml:3023）
 *  - 初回設定・本人再設定ボタン「登録」trans admin.common.registration（set.twig:63 / edit.twig:113 / messages.ja.yaml:1435）
 *  - エラー .text-danger（two_factor_auth.twig:28 / set.twig:53 / edit.twig:91）
 *  - 本人再設定 サブタイトル「システム設定」（edit.twig:16）/ 必須バッジ admin.common.required（edit.twig:81）/ card-title（edit.twig:58）
 */
export class AdminTwoFactorAuthPage {
  readonly page: Page;
  readonly authUrl: string; // 追加認証画面
  readonly setUrl: string; // 初回設定画面
  readonly editUrl: string; // 本人の再設定画面

  readonly deviceToken: Locator; // 6桁トークン入力欄（3画面共通 id）
  readonly authKeyHidden: Locator; // 秘密鍵候補 hidden（set/edit のみ）
  readonly authButton: Locator; // 追加認証「認証」
  readonly registerButton: Locator; // 初回設定/本人再設定「登録」
  readonly error: Locator; // .text-danger
  readonly heading: Locator; // h5「2段階認証」（ログインフレーム）
  readonly qrcode: Locator; // #qrcode 表示領域
  readonly editCardTitle: Locator; // 本人再設定 card-title（edit.twig:58）
  readonly editRequiredBadge: Locator; // 本人再設定 必須バッジ admin.common.required（edit.twig:81）
  // サブタイトル「システム設定」(edit.twig:16 sub_title block)は default_frame 側の出力先クラスが要実機確認のため
  // 専用セレクタを創作せず、spec ではテキスト存在で確認する。

  constructor(page: Page) {
    this.page = page;
    this.authUrl = `/${ECCUBE_ADMIN_ROUTE}/two_factor_auth/auth`;
    this.setUrl = `/${ECCUBE_ADMIN_ROUTE}/two_factor_auth/set`;
    this.editUrl = `/${ECCUBE_ADMIN_ROUTE}/setting/system/two_factor_auth/edit`;

    this.deviceToken = page.locator("#admin_two_factor_auth_device_token");
    this.authKeyHidden = page.locator("#admin_two_factor_auth_auth_key");
    this.authButton = page.getByRole("button", { name: "認証" });
    this.registerButton = page.getByRole("button", { name: "登録" });
    this.error = page.locator(".text-danger");
    this.heading = page.locator("h5");
    this.qrcode = page.locator("#qrcode");
    this.editCardTitle = page.locator(".card-title");
    this.editRequiredBadge = page.locator(".badge", { hasText: "必須" });
  }

  async gotoAuth() {
    await this.page.goto(this.authUrl);
  }
  async gotoSet() {
    await this.page.goto(this.setUrl);
  }
  async gotoEdit() {
    await this.page.goto(this.editUrl);
  }

  /** 隠し項目の秘密鍵候補（base32）をDOMから読む（初回設定・本人再設定）。 */
  async readAuthKey(): Promise<string> {
    return (await this.authKeyHidden.inputValue()).trim();
  }

  /** 追加認証画面でトークンを送信。 */
  async submitAuth(token: string) {
    await this.deviceToken.fill(token);
    await this.authButton.click();
  }

  /** 初回設定・本人再設定画面でトークンを送信。 */
  async submitRegister(token: string) {
    await this.deviceToken.fill(token);
    await this.registerButton.click();
  }

  /** 追加認証画面のUI部品が仕様どおり表示されること。 */
  async seeAuthForm() {
    await expect(this.heading).toContainText("2段階認証");
    await expect(this.deviceToken).toBeVisible();
    await expect(this.authButton).toBeVisible();
  }

  /** 初回設定画面のUI部品が仕様どおり表示されること。 */
  async seeSetForm() {
    await expect(this.heading).toContainText("2段階認証");
    await expect(this.qrcode).toBeVisible();
    await expect(this.deviceToken).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }
}
