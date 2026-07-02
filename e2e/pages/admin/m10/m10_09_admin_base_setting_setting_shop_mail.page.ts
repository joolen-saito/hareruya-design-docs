import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店舗基本設定（SHOPマスター）のメールアドレス4項目 Page Object。
 * 画面: GET/POST /{admin_route}/setting/shop（ShopController.php:45-46 admin_setting_shop / shop_master.twig）。
 * 期待結果は仕様(functions/pf-eccube3/m10-09_admin_base_setting_setting_shop_mail.md / 観点表)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`shop_master`（ShopMasterType.php:339-343）由来の位置情報のみ。
 *
 * DOM id 根拠（ShopMasterType.php:129-156 / shop_master.twig）:
 *  - email01(送信元/From)        → #shop_master_email01（shop_master.twig:156）
 *  - email03(返信受付/ReplyTo)   → #shop_master_email03（shop_master.twig:166）
 *  - email04(送信エラー/ReturnPath)→ #shop_master_email04（shop_master.twig:176）
 *  - email02(問い合わせ受付)      → #shop_master_email02（shop_master.twig:186）
 *  - 登録ボタン admin.common.registration「登録」（shop_master.twig:439 / messages.ja.yaml:1436）
 *  - 必須バッジ admin.common.required「必須」（shop_master.twig:153,163,173,183 / messages.ja.yaml:1528）
 *  - 成功フラッシュ .alert-success「保存しました」（alert.twig:21-24 / admin.common.save_complete messages.ja.yaml:1398）
 *  - フィールドエラー .invalid-feedback（bootstrap_4_horizontal_layout.html.twig:55 form_errors）
 *
 * 注意（オラクル独立性）: 実装ラベルは「問い合わせ専用/返信先/送信エラー通知…」へ改称（messages.ja.yaml:2840-2843）。
 * 設計（pf-eccube3）の文言と乖離するため、UI存在確認は id で行い、ラベル文言を期待値に流用しない。
 */
export class BaseSettingSettingShopMailPage {
  readonly page: Page;
  readonly url: string;

  readonly email01: Locator; // 送信元(From)
  readonly email02: Locator; // 問い合わせ受付
  readonly email03: Locator; // 返信受付(ReplyTo)
  readonly email04: Locator; // 送信エラー受付(ReturnPath)
  readonly registerButton: Locator; // 登録
  readonly successAlert: Locator; // .alert-success「保存しました」
  readonly fieldErrors: Locator; // .invalid-feedback
  readonly requiredBadges: Locator; // 必須バッジ

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/setting/shop`;

    this.email01 = page.locator("#shop_master_email01");
    this.email02 = page.locator("#shop_master_email02");
    this.email03 = page.locator("#shop_master_email03");
    this.email04 = page.locator("#shop_master_email04");
    this.registerButton = page.getByRole("button", { name: "登録" });
    this.successAlert = page.locator(".alert-success");
    this.fieldErrors = page.locator(".invalid-feedback");
    // 必須バッジは設計の仕様文言「必須」(admin.common.required)で位置特定する。
    this.requiredBadges = page.locator(".badge", { hasText: "必須" });
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** メール4欄を一括入力する。 */
  async fillEmails(e1: string, e2: string, e3: string, e4: string) {
    await this.email01.fill(e1);
    await this.email02.fill(e2);
    await this.email03.fill(e3);
    await this.email04.fill(e4);
  }

  async submit() {
    await this.registerButton.click();
  }

  /** 指定メール欄(1..4)の Locator を返す。 */
  emailField(n: 1 | 2 | 3 | 4): Locator {
    return [this.email01, this.email02, this.email03, this.email04][n - 1];
  }

  /**
   * 指定メール欄が属する行(.row)内の「必須」バッジを返す。
   * 仕様: メール4項目とも必須表示。実装は各メール欄の row 内に同一行で必須バッジを持つ
   * （存在確認は仕様文言「必須」で位置特定し、画面全体ではなく当該欄の近傍に限定する）。
   */
  requiredBadgeFor(n: 1 | 2 | 3 | 4): Locator {
    return this.emailField(n)
      .locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " row ")][1]')
      .locator(".badge", { hasText: "必須" });
  }

  /**
   * 指定メール欄が属する行(.row)内のフィールドエラー(.invalid-feedback)を返す。
   * 仕様: 検証失敗時は当該フィールドにエラー表示（文言はFW由来のためオラクル化しない）。
   */
  fieldErrorFor(n: 1 | 2 | 3 | 4): Locator {
    return this.emailField(n)
      .locator('xpath=ancestor::div[contains(concat(" ", normalize-space(@class), " "), " row ")][1]')
      .locator(".invalid-feedback");
  }

  /** メール各欄の現在値を読む（再表示値の間接確認）。 */
  async readEmails(): Promise<string[]> {
    return Promise.all([
      this.email01.inputValue(),
      this.email02.inputValue(),
      this.email03.inputValue(),
      this.email04.inputValue(),
    ]);
  }

  /** メール4入力欄が仕様どおり表示されていること。 */
  async seeMailFields() {
    await expect(this.email01).toBeVisible();
    await expect(this.email02).toBeVisible();
    await expect(this.email03).toBeVisible();
    await expect(this.email04).toBeVisible();
  }

  /** 保存完了フラッシュ「保存しました」が表示されること（仕様: admin.common.save_complete）。 */
  async seeSaveComplete() {
    await expect(this.successAlert).toContainText("保存しました");
  }

  /**
   * メール入力欄のDOM上の出現順を id 配列で返す（並び順の検証用）。
   * 設計の期待順は ["shop_master_email01","shop_master_email02","shop_master_email03","shop_master_email04"]。
   */
  async mailFieldOrder(): Promise<string[]> {
    return this.page
      .locator('input[id^="shop_master_email"]')
      .evaluateAll((els) => els.map((e) => (e as HTMLInputElement).id));
  }
}
