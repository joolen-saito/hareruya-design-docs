import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店舗設定 > 受注対応状況設定 Page Object（独立クラス形）。
 * 納品ケース表 integration_test/e2e/m10_11_admin_base_setting_setting_shop_order_status_e2e_cases.md に対応。
 * 期待結果は仕様（正本 functions/ec-cube-enterprise/m10-11_admin_base_setting_setting_shop_order_status.md / 観点表 / 基本設計）由来（オラクル独立性）。
 * 実装（Twig/Form/Controller）から取るのはセレクタ（位置情報）のみ。仕様乖離はケース表「付帯表4 不具合候補」に出し、テストは仕様どおりに書く。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * ルート: admin_setting_shop_order_status = GET|POST /%eccube_admin_route%/setting/shop/order_status
 *   （OrderStatusController.php:38）。createBuilder() は root フォーム名に FormType の block prefix 'form' を用いる
 *   （FormFactory.php:53 = getType(FormType::class)->getBlockPrefix()='form'）。CollectionType フィールド名 'OrderStatuses'。
 *
 * DOM id 根拠（root 名 'form' のため id は form_OrderStatuses_<index>_<field>）:
 *  - フォーム <form id="form">（order_status.twig:25）/ CSRF hidden input[name=_token]（order_status.twig:26）
 *  - 名称(マイページ) customer_order_status_name（mapped=false, TextType）→ #form_OrderStatuses_0_customer_order_status_name（twig:67 / OrderStatusSettingType.php:51）
 *  - 名称(受注管理)   name（TextType）                         → #form_OrderStatuses_0_name（twig:71 / OrderStatusSettingType.php:45）
 *  - 色               color（mapped=false, ColorType）           → #form_OrderStatuses_0_color（twig:76 class form-control-color / OrderStatusSettingType.php:58）
 *  - 件数表示         display_order_count（ToggleSwitchType=CheckboxType）→ #form_OrderStatuses_0_display_order_count（twig:81 / OrderStatusSettingType.php:65）
 *  - 登録ボタン       button[type=submit].btn-ec-conversion trans admin.common.registration=「登録」（twig:101 / messages.ja.yaml:1436付近）
 *  - カードヘッダ見出し「受注対応状況」trans admin.setting.shop.order_status.order_status（twig:30 / messages.ja.yaml:2979）＋質問アイコン i.fa-question-circle（twig:30）
 *  - 列ヘッダ ID/名称(マイページ)/名称(受注管理)/色/件数表示（twig:38,42,46,50,55 / messages.ja.yaml:2980-2984）
 *  - ID セル 参照表示のみ（twig:64 OrderStatus.vars.data.id。入力欄なし）
 *  - エラー表示 form_errors（bootstrap_4_horizontal_layout。クラスは .invalid-feedback / .text-danger いずれか＝要実機確認。文言の正は仕様）
 */
export class BaseSettingSettingShopOrderStatusPage {
  readonly page: Page;
  readonly url: string;

  readonly form: Locator; // #form（twig:25）
  readonly csrfToken: Locator; // input[name=_token]（twig:26）
  readonly registerButton: Locator; // 登録（twig:101）
  readonly cardHeader: Locator; // カードヘッダ（twig:28）
  readonly tooltipIcons: Locator; // 質問アイコン i.fa-question-circle（twig:30,42,50,55）
  readonly rows: Locator; // tbody の各ステータス行（twig:61-85）
  readonly successAlert: Locator; // 成功フラッシュ（共通 alert.twig）
  readonly errorMessages: Locator; // form_errors 領域（.invalid-feedback / .text-danger 要実機確認）

  // 仕様（設計書/観点表）由来の表示文言＝オラクル。実装に合わせて変えない。
  readonly title = "受注対応状況設定"; // admin.setting.shop.order_status_setting（messages.ja.yaml:2785）
  readonly subTitle = "基本情報設定"; // admin.setting.basic_info（messages.ja.yaml:2773）
  readonly cardLabel = "受注対応状況"; // admin.setting.shop.order_status.order_status（:2979）
  readonly saveComplete = "保存しました"; // admin.common.save_complete（:1398）
  readonly notBlankError = "入力されていません。"; // validators.ja.yaml:17（NotBlank）
  // 列ヘッダ文言（messages.ja.yaml:2980-2984）
  readonly columnHeaders = ["ID", "名称(マイページ)", "名称(受注管理)", "色", "件数表示"];

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/setting/shop/order_status`;

    this.form = page.locator("#form");
    this.csrfToken = page.locator('#form input[name="_token"]');
    this.registerButton = page.locator('#form button[type="submit"].btn-ec-conversion');
    this.cardHeader = page.locator("#form .card-header");
    this.tooltipIcons = page.locator("#form .card i.fa-question-circle");
    this.rows = page.locator("#form table tbody tr");
    this.successAlert = page.locator(".alert-success");
    // 厳密なエラークラスは要実機確認。文言（notBlankError）で観測するのを主とする。
    this.errorMessages = page.locator("#form .invalid-feedback, #form .text-danger");
  }

  // 行インデックス（既定 0＝sort_no 昇順の先頭行）でフィールドを引く。
  customerOrderStatusName(i = 0): Locator {
    return this.page.locator(`#form_OrderStatuses_${i}_customer_order_status_name`);
  }
  adminOrderStatusName(i = 0): Locator {
    return this.page.locator(`#form_OrderStatuses_${i}_name`);
  }
  color(i = 0): Locator {
    return this.page.locator(`#form_OrderStatuses_${i}_color`);
  }
  displayOrderCount(i = 0): Locator {
    return this.page.locator(`#form_OrderStatuses_${i}_display_order_count`);
  }
  idCell(i = 0): Locator {
    return this.rows.nth(i).locator("td").first();
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 画面の主要UI部品が仕様どおり表示されること。 */
  async seeForm() {
    await expect(this.adminOrderStatusName(0)).toBeVisible();
    await expect(this.customerOrderStatusName(0)).toBeVisible();
    await expect(this.color(0)).toBeVisible();
    await expect(this.displayOrderCount(0)).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }

  /** 5列の列ヘッダが左から ID/名称(マイページ)/名称(受注管理)/色/件数表示 で表示されること。 */
  async seeColumnHeaders() {
    const ths = this.page.locator("#form table thead th");
    await expect(ths).toHaveCount(this.columnHeaders.length);
    for (let i = 0; i < this.columnHeaders.length; i++) {
      await expect(ths.nth(i)).toContainText(this.columnHeaders[i]);
    }
  }

  /** 名称(受注管理)を上書き入力する（POST は破壊的＝呼び出し側で限定）。 */
  async fillAdminName(value: string, i = 0) {
    await this.adminOrderStatusName(i).fill(value);
  }

  /** 件数表示トグルを設定する。 */
  async setDisplayOrderCount(checked: boolean, i = 0) {
    await this.displayOrderCount(i).setChecked(checked);
  }

  /** 登録ボタンを押下して送信する（検証通過時は POST＝破壊的・マスタ更新）。 */
  async submit() {
    await this.registerButton.click();
  }

  /** 成功フラッシュ「保存しました」が表示されること（文言の正は仕様）。 */
  async seeSaveSuccess() {
    await expect(this.successAlert).toContainText(this.saveComplete);
  }

  /** 必須未入力エラー「入力されていません。」が表示されること（文言の正は仕様）。 */
  async seeNotBlankError() {
    await expect(this.page.locator("body")).toContainText(this.notBlankError);
  }
}
