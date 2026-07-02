import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店舗基本設定（SHOPマスター） — 送料無料条件（金額／数量） Page Object。
 * 画面タイプ: other（register_edit/crud。親フォーム「店舗基本設定」の「送料設定」ブロック内の2項目に限定）。
 *
 * 期待結果（合否）は仕様（正本md functions/pf-eccube3/m10-05_admin_base_setting_setting_shop_delivery_free_conditions.md・
 * 観点表 integration-test-viewpoints.md・基本設計）由来とする（オラクル独立性）。本ファイルが実装から取るのは
 * セレクタ（位置情報）のみであり、必須/最大長/制約/メッセージ文言を期待結果に流用しない。
 * 設計源は pf-eccube3（リバース）であり、画面・遷移・メッセージの正は設計書/観点表、永続化先は ec-cube-enterprise。
 *
 * セレクタ根拠（ec-cube-enterprise 現行ソース。行番号は src 基準）:
 *  - フォームDOM id は Symfony Form の getBlockPrefix='shop_master'（ShopMasterType.php:339-343）由来。
 *    delivery_free_amount → #shop_master_delivery_free_amount（PriceType ShopMasterType.php:246 / 親MoneyType PriceType.php:79-81。
 *      数値制約は Range(min=0, max=eccube_price_max) PriceType.php:45-62。Length 制約は無い）
 *    delivery_free_quantity → #shop_master_delivery_free_quantity（IntegerType+Regex/^\d+$/u ShopMasterType.php:249-257）
 *    _token → #shop_master__token
 *  画面（shop_master.twig）:
 *  - ルート: admin_setting_shop GET|POST /%eccube_admin_route%/setting/shop（ShopController.php:45）
 *  - 送料設定ボックス見出し: .card-header span trans admin.setting.shop.shop.option_delivery_fee=「送料設定」
 *      （shop_master.twig:303 / messages.ja.yaml:2846）
 *  - 金額ラベル: trans admin.setting.shop.shop.option_delivery_fee_free_amount=「送料無料条件（金額）」
 *      （shop_master.twig:307 / messages.ja.yaml:2847）
 *  - 金額入力: form_widget(form.delivery_free_amount)（shop_master.twig:310）/ form_errors（:311）
 *  - 数量ラベル: trans admin.setting.shop.shop.option_delivery_fee_free_quantity=「送料無料条件（数量）」
 *      （shop_master.twig:317 / messages.ja.yaml:2848）
 *  - 数量入力: form_widget(form.delivery_free_quantity)（shop_master.twig:320）/ form_errors（:321）
 *  - 登録ボタン: button[type=submit] trans admin.common.registration=「登録」（shop_master.twig:439 / messages.ja.yaml）
 *  - 成功フラッシュ: .alert-success（alert.twig:21、success フラッシュ用ブロック）。**合否は設計書「登録完了メッセージ（成功フラッシュ）」の
 *      出現＝.alert-success の可視で判定し、実装翻訳文言（admin.common.save_complete=「保存しました」）はオラクル化しない。**
 *  - 項目エラー: span.invalid-feedback.d-block（bootstrap_4_horizontal_layout.html.twig:55、form_theme shop_master.twig:18）
 */
export class BaseSettingSettingShopDeliveryFreeConditionsPage {
  readonly page: Page;
  readonly url: string;

  readonly deliveryFreeAmount: Locator; // #shop_master_delivery_free_amount（shop_master.twig:310）
  readonly deliveryFreeQuantity: Locator; // #shop_master_delivery_free_quantity（shop_master.twig:320）
  readonly registerButton: Locator; // 登録（shop_master.twig:439）
  readonly deliveryBoxHeader: Locator; // 送料設定 見出し（shop_master.twig:303）
  readonly amountLabel: Locator; // 送料無料条件（金額）ラベル（shop_master.twig:307）
  readonly quantityLabel: Locator; // 送料無料条件（数量）ラベル（shop_master.twig:317）
  readonly successFlash: Locator; // .alert-success（alert.twig:21）
  readonly fieldError: Locator; // .invalid-feedback（bootstrap_4_horizontal_layout.html.twig:55）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/setting/shop`;

    this.deliveryFreeAmount = page.locator("#shop_master_delivery_free_amount");
    this.deliveryFreeQuantity = page.locator("#shop_master_delivery_free_quantity");
    this.registerButton = page.getByRole("button", { name: "登録" });
    this.deliveryBoxHeader = page.locator(".card-header span", { hasText: "送料設定" });
    this.amountLabel = page.getByText("送料無料条件（金額）", { exact: false });
    this.quantityLabel = page.getByText("送料無料条件（数量）", { exact: false });
    this.successFlash = page.locator(".alert-success");
    this.fieldError = page.locator(".invalid-feedback");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 金額・数量を入力して登録（空文字はそのまま空送信＝任意項目のクリア）。 */
  async submit(amount: string, quantity: string) {
    await this.deliveryFreeAmount.fill(amount);
    await this.deliveryFreeQuantity.fill(quantity);
    await this.registerButton.click();
  }

  /** 送料設定ブロックの2項目（金額・数量）の入力欄と見出しが仕様どおり表示されること。 */
  async seeDeliveryFreeBlock() {
    await expect(this.deliveryBoxHeader).toBeVisible();
    await expect(this.amountLabel).toBeVisible();
    await expect(this.deliveryFreeAmount).toBeVisible();
    await expect(this.quantityLabel).toBeVisible();
    await expect(this.deliveryFreeQuantity).toBeVisible();
  }

  /**
   * 登録完了メッセージ（成功フラッシュ）が表示されること。
   * 合否は設計書「登録完了メッセージ」由来＝成功フラッシュ（.alert-success）の出現で判定する。
   * 実装翻訳文言（「保存しました」等）はオラクル化しない（オラクル独立性）。
   */
  async seeSaveSuccess() {
    await expect(this.successFlash).toBeVisible();
  }

  /** 検証エラー（項目エラー）が表示され、成功フラッシュは出ないこと。 */
  async seeValidationError() {
    await expect(this.fieldError.first()).toBeVisible();
    await expect(this.successFlash).toHaveCount(0);
  }
}
