import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店舗設定 > 店舗基本設定の店舗登録（SHOPマスター保存）Page Object（独立クラス形）。
 * 納品ケース表 integration_test/e2e/m10_15_admin_base_setting_setting_shop_register_e2e_cases.md に対応。
 *
 * 本機能は M10-01 と同一画面 /admin/setting/shop（shop_master.twig / ShopMasterType）の
 * 「登録」ボタンによる POST 保存（dtb_base_info 既定1行の更新）の観点を主とする。
 * 期待結果は仕様（正本 functions/pf-eccube3/m10-15_admin_base_setting_setting_shop_register.md / 観点表）由来（オラクル独立性）。
 * 設計源は pf-eccube3（リバース）。刷新先 ec-cube-enterprise との乖離は付帯表4（不具合候補）で管理。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`shop_master`（ShopMasterType.php:339-342）由来の位置情報のみ。
 * 本リポジトリでは Playwright を実行しない（構造参考のもとの未実行雛形）。
 *
 * ルート: admin_setting_shop = GET|POST /%eccube_admin_route%/setting/shop（ShopController.php:46）。
 *
 * DOM id 根拠（getBlockPrefix=shop_master）:
 *  - company_name → #shop_master_company_name（shop_master.twig:42 / FormType:55-65）
 *  - company_kana → #shop_master_company_kana（shop_master.twig:52 / FormType:287-305 カタカナRegex）
 *  - shop_name → #shop_master_shop_name（shop_master.twig:62 / FormType:66-74 NotBlank+Length stext_len）
 *  - shop_kana → #shop_master_shop_kana（shop_master.twig:72 / FormType カタカナRegex。店名フリガナ）
 *  - shop_name_eng → #shop_master_shop_name_eng（shop_master.twig:82 / FormType:75-87）
 *  - email01(送信元From) → #shop_master_email01（shop_master.twig:156 / FormType:129-135 NotBlank+Email）
 *  - email02(問い合わせ受付) → #shop_master_email02（shop_master.twig:186 / FormType:136-142）
 *  - email03(返信ReplyTo) → #shop_master_email03（shop_master.twig:166 / FormType:143-149）
 *  - email04(エラー受付ReturnPath) → #shop_master_email04（shop_master.twig:176 / FormType:150-156）
 *  - delivery_free_amount(送料無料条件 金額) → #shop_master_delivery_free_amount（shop_master.twig:310 / FormType:243-245 PriceType）
 *  - delivery_free_quantity → #shop_master_delivery_free_quantity（shop_master.twig:320 / FormType:246-254 Regex \d+）
 *  - option_nostock_hidden(在庫切れ非表示トグル) → #shop_master_option_nostock_hidden（shop_master.twig:392 / FormType:269）
 *  - 登録ボタン type=submit trans admin.common.registration=「登録」（shop_master.twig:439 / messages.ja.yaml:1436）
 *  - フィールドエラー .invalid-feedback（bootstrap_4_horizontal_layout.html.twig:53-63 form_errors）。
 *    オラクル独立性のため、エラーは対象フィールド近傍（同一入力グループ列 div.col）内の .invalid-feedback に限定する（fieldError()）。
 *  - 成功フラッシュ .alert-success（alert.twig:21-29 app.flashes('eccube.admin.success') / addSuccess admin.common.save_complete ShopController.php:87）
 *  - カード見出し .card-header span（基本情報 shop_master.twig:34 / 送料 :303 / 会員 :346 / 商品 :387 / 地図 :399）
 *
 * 刷新先未存在（付帯表4）: 緯度・経度欄／FAX欄は ShopMasterType に存在しないため Locator を定義しない。
 */
export class BaseSettingSettingShopRegisterPage {
  readonly page: Page;
  readonly url: string;

  readonly companyName: Locator; // 会社名
  readonly companyKana: Locator; // 会社名フリガナ（カタカナRegex）
  readonly shopName: Locator; // 店名（必須・Length stext_len）
  readonly shopKana: Locator; // 店名フリガナ（カタカナRegex）
  readonly shopNameEng: Locator; // 店名英語表記
  readonly email01: Locator; // 送信元メール（From）
  readonly email02: Locator; // 問い合わせ受付メール
  readonly email03: Locator; // 返信受付メール（ReplyTo）
  readonly email04: Locator; // 送信エラー受付メール（ReturnPath）
  readonly deliveryFreeAmount: Locator; // 送料無料条件（金額）PriceType
  readonly deliveryFreeQuantity: Locator; // 送料無料条件（数量）Regex \d+
  readonly optionNostockHidden: Locator; // 在庫切れ非表示トグル
  readonly registerButton: Locator; // 登録ボタン type=submit
  readonly fieldErrors: Locator; // .invalid-feedback（フィールドエラー）
  readonly successAlert: Locator; // .alert-success（成功フラッシュ）
  readonly cardHeaders: Locator; // .card-header span（カード見出し）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/setting/shop`;

    this.companyName = page.locator("#shop_master_company_name");
    this.companyKana = page.locator("#shop_master_company_kana");
    this.shopName = page.locator("#shop_master_shop_name");
    this.shopKana = page.locator("#shop_master_shop_kana");
    this.shopNameEng = page.locator("#shop_master_shop_name_eng");
    this.email01 = page.locator("#shop_master_email01");
    this.email02 = page.locator("#shop_master_email02");
    this.email03 = page.locator("#shop_master_email03");
    this.email04 = page.locator("#shop_master_email04");
    this.deliveryFreeAmount = page.locator("#shop_master_delivery_free_amount");
    this.deliveryFreeQuantity = page.locator("#shop_master_delivery_free_quantity");
    this.optionNostockHidden = page.locator("#shop_master_option_nostock_hidden");
    this.registerButton = page.getByRole("button", { name: "登録" });
    this.fieldErrors = page.locator(".invalid-feedback");
    this.successAlert = page.locator(".alert-success");
    this.cardHeaders = page.locator(".card-header span");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 何も変更せず登録（冪等な正常系保存）。検証成功→persist/flush→成功フラッシュ→同画面リダイレクト。 */
  async submit() {
    await this.registerButton.click();
  }

  /**
   * 指定フィールド近傍（同一入力グループ列 div.col）内のフィールドエラーに限定した Locator を返す。
   * オラクル独立性のため、別項目のエラーや seed 不備による誤検知を避ける。
   * shop_master.twig は各 form_widget(form.x)/form_errors(form.x) を同一の col 列内に描画する。
   */
  fieldError(field: Locator): Locator {
    return field
      .locator("xpath=ancestor::div[contains(@class,'col')][1]")
      .locator(".invalid-feedback");
  }

  /**
   * 店舗基本設定（保存）画面の基本要素が表示されること（仕様: 利用者視点の入口・フロント挙動）。
   * 基本情報カード見出し「店舗情報」（trans admin.setting.shop.shop.base_info=店舗情報 messages.ja.yaml:2802）を
   * 文言で特定して確認する（先頭カードの存在だけでは入口の同定にならないため）。見出し文言は正典フロント挙動の
   * 節構成（基本情報）由来であり、Form制約等の実装由来オラクルではない。
   */
  async seeForm() {
    await expect(this.cardHeaders.filter({ hasText: "店舗情報" }).first()).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }

  /** 保存成功＝成功フラッシュが表示されること（仕様: 処理フロー POST検証成功・入出力 成功時出力）。 */
  async seeSaveSuccess() {
    await expect(this.successAlert).toBeVisible();
  }
}
