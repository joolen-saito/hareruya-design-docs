import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 コンテンツ管理 メンテナンス管理（M09-09）Page Object。
 * 納品ケース表 integration_test/e2e/m09_09_admin_content_content_maintenance_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/ec-cube-enterprise/m09-09_admin_content_content_maintenance.md / 観点表)由来（オラクル独立性）。
 * セレクタは Twig 由来の位置情報のみ。合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 重要: メンテナンス有効化は公開側フロント(SHOP)を即時停止する破壊的操作。切替系メソッドは
 * 専用環境・専用時間帯での実行を前提とする（spec 側で ECCUBE_MAINTENANCE_TOGGLE_OK をガード）。
 *
 * セレクタ根拠（src/Eccube/Resource/template/admin/Content/maintenance.twig /
 *  Controller/Admin/Content/MaintenanceController.php / Service/SystemService.php /
 *  EventListener/MaintenanceListener.php / messages.ja.yaml）:
 *  - フォーム               → form[action$="content/maintenance"]（maintenance.twig:20 url('admin_content_maintenance')）
 *  - CSRFトークン(hidden)    → #form__token（maintenance.twig:21 form._token。createBuilder(FormType::class) 既定prefix=form）
 *  - カード見出し           → .card-title trans admin.content.maintenance__card_title「メンテナンスモード」(twig:28 / messages.ja.yaml:2756)
 *  - 説明文(改行 nl2br)      → span trans admin.content.maintenance_message(twig:34 / messages.ja.yaml:2757-2759)
 *  - 隠しフィールド(切替値)   → input[name="maintenance"] value=off(有効中 twig:40) / value=on(無効中 twig:43)
 *  - 無効化ボタン「無効にする」→ button.btn-ec-conversion trans maintenance_switch__off(twig:41 / messages.ja.yaml:2761) ※有効中に表示
 *  - 有効化ボタン「有効にする」→ button.btn-ec-conversion trans maintenance_switch__on(twig:44 / messages.ja.yaml:2760) ※無効中に表示
 *  - 有効化フラッシュ         → admin.content.maintenance_switch__on_message「メンテナンスモードを有効にしました。」(Controller.php:54 / messages.ja.yaml:2762)
 *  - 無効化フラッシュ         → admin.content.maintenance_switch__off_message「メンテナンスモードを無効にしました。」(Controller.php:60 / messages.ja.yaml:2763)
 *  - Cookie maintenance_token → 名称は設計書 Cookie節(:64,:310)が正典化した仕様値（実装確認は SystemService.php:27 MAINTENANCE_TOKEN_KEY）。
 *    付与時 Secure(設計書:311 / 実装 MaintenanceListener.php:49-54) / 破棄(設計書:312 / 実装 MaintenanceListener.php:42-45)。値は秘密情報のため判定に使わない。
 *  - CSRFトークン改変(判定順序#1) → #form__token を不正値へ改変送信→切替不発・再表示（設計書:142,:275）。
 * フラッシュ表示領域のクラスは default_frame 側のため専用セレクタを創作せず、body テキスト存在で確認する（要実機確認）。
 */
export class ContentContentMaintenancePage {
  readonly page: Page;
  readonly url: string;

  readonly cardTitle: Locator; // .card-title「メンテナンスモード」
  readonly description: Locator; // 説明文 span（nl2br）
  readonly maintenanceHidden: Locator; // input[name="maintenance"]（on/off）
  readonly enableButton: Locator; // 「有効にする」（無効中に表示）
  readonly disableButton: Locator; // 「無効にする」（有効中に表示）
  readonly switchButton: Locator; // btn-ec-conversion（状態に依らず一方のみ）
  readonly csrfToken: Locator; // #form__token（なりすまし対策トークン hidden）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/content/maintenance`;

    this.cardTitle = page.locator(".card-title");
    // 説明文 span は card-body 直下の最初の span（twig:34）。card-body 内の唯一の span。
    this.description = page.locator(".card-body span").first();
    this.maintenanceHidden = page.locator('input[name="maintenance"]');
    this.enableButton = page.getByRole("button", { name: "有効にする" });
    this.disableButton = page.getByRole("button", { name: "無効にする" });
    this.switchButton = page.locator("button.btn-ec-conversion");
    this.csrfToken = page.locator("#form__token");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 表示中の切替ボタンを押下（無効中＝有効にする／有効中＝無効にする）。破壊的。 */
  async clickEnable() {
    await this.enableButton.click();
  }

  async clickDisable() {
    await this.disableButton.click();
  }

  /** 隠しフィールド maintenance の現在値（on/off）を読む。 */
  async maintenanceValue(): Promise<string> {
    return (await this.maintenanceHidden.inputValue()).trim();
  }

  /**
   * 隠しフィールド maintenance を指定値へ改変して送信する（判定順序#4のエッジ検証用）。
   * CSRFトークンはフォーム内の form._token をそのまま送る。
   */
  async submitWithMaintenance(value: "on" | "off") {
    await this.maintenanceHidden.evaluate((el, v) => {
      (el as HTMLInputElement).value = v;
    }, value);
    await this.switchButton.click();
  }

  /**
   * なりすまし対策トークンを無効化して送信する（切替判定順序#1の検証用）。
   * 仕様: フォーム検証に失敗し、切り替えを行わず画面を再表示する＝状態は不変・成功フラッシュなし。
   * CSRF不正は切替を実行しないため非破壊（公開側を停止しない）。
   */
  async submitWithInvalidCsrf() {
    await this.csrfToken.evaluate((el) => {
      (el as HTMLInputElement).value = "invalid-csrf-token";
    });
    await this.switchButton.click();
  }

  /** メンテナンス管理画面のUI部品が仕様どおり表示されること（無効状態）。 */
  async seeDisabledStateForm() {
    await expect(this.cardTitle).toContainText("メンテナンスモード");
    await expect(this.enableButton).toBeVisible();
    await expect(this.maintenanceHidden).toHaveValue("on");
  }

  /** メンテナンス管理画面のUI部品が仕様どおり表示されること（有効状態）。 */
  async seeEnabledStateForm() {
    await expect(this.cardTitle).toContainText("メンテナンスモード");
    await expect(this.disableButton).toBeVisible();
    await expect(this.maintenanceHidden).toHaveValue("off");
  }
}
