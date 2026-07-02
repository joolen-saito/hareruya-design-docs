import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店舗設定 > 追加システム設定 Page Object（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m10_16_admin_base_setting_setting_shop_additional_system_e2e_cases.md に対応。
 * 期待結果は仕様（正本 pf-eccube3 md / 観点表 / 基本設計）由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`add_system`（AdditionalSystemFormType.php:246-248）由来の位置情報のみ。
 *   各フィールド名は MtbOption 定数の値（論理キー）と一致（MtbOption.php）。DOM id = `add_system_<論理キー>`。
 *
 * 画面/ルート（ec-cube-enterprise コア AdditionalSystemController.php）:
 *   - GET  /%admin%/setting/shop/additional_system        （表示）
 *   - POST /%admin%/setting/shop/additional_system/update  （保存→成功時 GET へ redirect）
 *
 * pf-eccube3 設計書（HareruyaEcプラグイン）と刷新先の乖離はケース表「付帯表4」に記録。テストは仕様どおりに書く。
 */
export class BaseSettingSettingShopAdditionalSystemPage {
  readonly page: Page;
  readonly url: string; // GET 表示
  readonly updateUrl: string; // POST 更新

  readonly form: Locator; // #point_form（additional_system.twig:13 method=post）
  readonly csrfToken: Locator; // #add_system__token（twig:16 form_widget(form._token)）
  readonly submitButton: Locator; // button[type=submit]（twig:264 trans admin.common.registration）
  readonly cardHeader: Locator; // カード見出し（twig:22 admin.setting.shop.add_system=「追加システム設定」）
  readonly requiredBadge: Locator; // 必須バッジ（twig:27 等 admin.common.required=「必須」）
  readonly fieldError: Locator; // span.invalid-feedback.d-block（Form/bootstrap_4_horizontal_layout.html.twig:55）
  readonly successAlert: Locator; // 成功フラッシュ（共通 default_frame・クラスは要実機確認）

  // 代表入力フィールド（DOM id = add_system_<論理キー>）
  readonly arrivalAlertMax: Locator; // twig:30 IntegerType（必須・0以上）
  readonly purchaseMailAddress: Locator; // twig:40 TextType（必須・メール形式）
  readonly orderTimingBorder: Locator; // twig:105 TextType（必須・hh:mm形式）
  readonly smaregiCategoryId: Locator; // twig:95 TextType（数字のみ）
  readonly sendNotificationArrivalMail: Locator; // twig:114 ChoiceType（送信/送信しない）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/setting/shop/additional_system`;
    this.updateUrl = `/${ECCUBE_ADMIN_ROUTE}/setting/shop/additional_system/update`;

    this.form = page.locator("#point_form");
    this.csrfToken = page.locator("#add_system__token");
    this.submitButton = page.locator('#point_form button[type="submit"]');
    this.cardHeader = page.locator(".card-header");
    this.requiredBadge = page.locator(".badge", { hasText: "必須" });
    this.fieldError = page.locator(".invalid-feedback");
    // 成功フラッシュの正確なセレクタは共通フレーム依存で要実機確認。spec ではテキスト存在も併用する。
    this.successAlert = page.locator(".alert-success");

    this.arrivalAlertMax = page.locator("#add_system_arrival_alert_max");
    this.purchaseMailAddress = page.locator("#add_system_purchase_mail_address");
    this.orderTimingBorder = page.locator("#add_system_order_timing_border");
    this.smaregiCategoryId = page.locator("#add_system_smaregi_category_id");
    this.sendNotificationArrivalMail = page.locator("#add_system_send_notification_arrival_mail");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 値を入力(または上書き)して送信する。空文字を渡すとクリアして送信する。 */
  async submitWith(field: Locator, value: string) {
    await field.fill(value);
    await this.submitButton.click();
  }

  /**
   * 検証失敗時に「当該フィールド近傍にエラーが出る」ことを確認する（正本md:257「フィールド近傍にエラー表示」由来）。
   * Symfony bootstrap レイアウトは不正入力欄に is-invalid を付与する（bootstrap_4_horizontal_layout.html.twig）。
   * 別フィールド/シード不備由来のエラーで誤って通らないよう、対象フィールド自体の不正状態で判定する。
   */
  async expectFieldInvalid(field: Locator) {
    await expect(field).toHaveClass(/is-invalid/);
  }

  /** 表示要素（カード見出し・フォーム・CSRFトークン・送信ボタン）が仕様どおり表示されること。 */
  async seeForm() {
    await expect(this.cardHeader).toContainText("追加システム設定");
    await expect(this.form).toBeVisible();
    await expect(this.csrfToken).toHaveCount(1); // 隠し項目（CSRFトークン）
    await expect(this.submitButton).toBeVisible();
  }
}
