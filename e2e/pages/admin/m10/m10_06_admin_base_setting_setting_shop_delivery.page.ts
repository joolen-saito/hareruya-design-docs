import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店舗設定 — 配送方法管理（一覧 / 新規・編集 / 削除モーダル）Page Object。
 * 期待結果は仕様（正本 functions/pf-eccube3/m10-06_admin_base_setting_setting_shop_delivery.md
 * ＋テスト観点表）由来（オラクル独立性）。実装からはセレクタ（位置情報）のみを取得する。
 *
 * セレクタは Twig ＋ Symfony Form の getBlockPrefix=`delivery`（DeliveryType.php:152-155）由来。
 *   - name              → #delivery_name                         （delivery_edit.twig:534）
 *   - service_name      → #delivery_service_name                 （delivery_edit.twig:541）
 *   - service_name_en   → #delivery_service_name_en              （delivery_edit.twig:548。刷新先で追加・必須）
 *   - confirm_url       → #delivery_confirm_url                  （delivery_edit.twig:574）
 *   - payments          → #delivery_payments（チェックボックス群）（delivery_edit.twig:628）
 *   - delivery_fees     → #delivery_delivery_fees（コレクション）  （delivery_edit.twig:711-713）
 *   - visible           → #delivery_visible（表示/非表示 select）  （delivery_edit.twig:734）
 *   - _token            → #delivery__token                       （delivery_edit.twig:524）
 *   - 登録ボタン id=delivery-registration-button（type=button・JS送信）（delivery_edit.twig:738 / trans admin.common.registration=「登録」messages.ja.yaml:1436）
 *   - 新規入力ボタン a[href$="/setting/shop/delivery/new"]（delivery.twig:198）。文言は仕様「配送方法・配送料を新規入力」（実装文言「新規作成」は不具合候補#2でロケータに使わない）
 *   - 一覧編集リンク a[href$="/{id}/edit"]（delivery.twig:218）
 *   - 削除モーダル #DeleteModal・.modal-title=admin.common.delete_modal__title「削除します」（delivery.twig:276-283 / messages.ja.yaml:1592）
 *   - 削除トリガ a[data-bs-target="#DeleteModal"][data-url*="/{id}/delete"]（delivery.twig:236-238）
 *   - 並び替え確認モーダル #ConfirmModal（delivery.twig:249 / sort_confirm messages.ja.yaml:1404）
 *   - 戻るリンク a.c-baseLink → 一覧（delivery_edit.twig:726-727 / trans delivery_list）
 *
 * 注: 刷新先(ec-cube-enterprise)は設計書(pf-eccube3リバース)と差異が大きい（商品種別selectなし／
 * ショップ用メモ欄なし／全国一律送料「各都道府県に反映」ボタンなし／削除は物理削除＋表示/非表示トグル別建て）。
 * 乖離はケース表の不具合候補表に記載。テストは仕様どおりに書き、乖離は落ちて検出する方針。
 */
export class BaseSettingSettingShopDeliveryPage {
  readonly page: Page;
  readonly listUrl: string;
  readonly newUrl: string;

  // 一覧
  readonly newButton: Locator; // 「新規作成」（delivery.twig:198）
  readonly listIdHeader: Locator; // 列見出し「ID」（delivery.twig:207）
  readonly listNameHeader: Locator; // 列見出し「配送業者名」（delivery.twig:208 trans delivery.delivery_name）
  readonly deleteModal: Locator; // #DeleteModal（delivery.twig:276）

  // 編集（基本情報）
  readonly basicInfoHeader: Locator; // card-header「基本情報」（delivery_edit.twig:529 trans delivery.base_info）
  readonly name: Locator; // 配送業者名（必須）
  readonly serviceName: Locator; // 名称（必須）
  readonly serviceNameEn: Locator; // 名称(英)（必須・刷新先で追加）
  readonly confirmUrl: Locator; // 伝票No.URL（任意・URL形式）

  // 編集（支払・時間・送料）
  readonly paymentHeader: Locator; // card-header「取り扱う支払方法」（delivery_edit.twig:625 trans delivery.payment_method）
  readonly paymentCheckboxes: Locator; // 支払方法チェックボックス群（delivery_edit.twig:628）
  readonly deliveryTimeHeader: Locator; // card-header「お届け時間設定」（delivery_edit.twig:634 trans delivery.delivery_time_setting）
  readonly deliveryFeeHeader: Locator; // card-header「都道府県別送料設定」（delivery_edit.twig:658 trans delivery.delivery_fee_by_pref）

  readonly registerButton: Locator; // 「登録」（delivery_edit.twig:738）
  readonly backToListLink: Locator; // 一覧へ戻る（delivery_edit.twig:726）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/setting/shop/delivery`;
    this.newUrl = `/${ECCUBE_ADMIN_ROUTE}/setting/shop/delivery/new`;

    // 新規入力ボタンは href（位置情報＝セレクタ）で特定する。表示文言は仕様（設計書「配送方法・配送料を新規入力」）で
    // 検証し、実装文言「新規作成」をロケータ＝オラクルに混入させない（オラクル独立性）。
    this.newButton = page.locator(`a[href$="/setting/shop/delivery/new"]`);
    this.listIdHeader = page.locator(".sortable-container .list-group-item", { hasText: "ID" }).first();
    this.listNameHeader = page.locator(".sortable-container").getByText("配送業者名", { exact: true });
    this.deleteModal = page.locator("#DeleteModal");

    this.basicInfoHeader = page.locator(".card-header", { hasText: "基本情報" });
    this.name = page.locator("#delivery_name");
    this.serviceName = page.locator("#delivery_service_name");
    this.serviceNameEn = page.locator("#delivery_service_name_en");
    this.confirmUrl = page.locator("#delivery_confirm_url");

    // 支払方法ブロック見出しは仕様（設計書「支払方法設定」）を期待値にする。刷新先実装文言は「取り扱う支払方法」＝
    // 不具合候補#2。実装文言をオラクル化せず、仕様文言で書き乖離は落ちて検出する方針。
    this.paymentHeader = page.locator(".card-header", { hasText: "支払方法設定" });
    this.paymentCheckboxes = page.locator("#delivery_payments input[type=checkbox]");
    this.deliveryTimeHeader = page.locator(".card-header", { hasText: "お届け時間設定" });
    this.deliveryFeeHeader = page.locator(".card-header", { hasText: "都道府県別送料設定" });

    this.registerButton = page.locator("#delivery-registration-button");
    this.backToListLink = page.locator('a.c-baseLink[href$="/setting/shop/delivery"]');
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }
  async gotoNew() {
    await this.page.goto(this.newUrl);
  }
  async gotoEdit(id: string) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/setting/shop/delivery/${id}/edit`);
  }

  /** 一覧の当該IDの編集リンク（配送業者名 / 名称）。 */
  editLink(id: string): Locator {
    return this.page.locator(`a[href$="/setting/shop/delivery/${id}/edit"]`);
  }

  /** 一覧の当該IDの削除トリガ（削除モーダルを開く）。 */
  deleteTrigger(id: string): Locator {
    return this.page.locator(`a[data-bs-target="#DeleteModal"][data-url*="/setting/shop/delivery/${id}/delete"]`);
  }

  /** 新規/編集フォームへトークン入力（最低限の項目のみ。検証分岐の確認に使う）。 */
  async fillBasic(opts: { name?: string; serviceName?: string; serviceNameEn?: string; confirmUrl?: string }) {
    if (opts.name !== undefined) await this.name.fill(opts.name);
    if (opts.serviceName !== undefined) await this.serviceName.fill(opts.serviceName);
    if (opts.serviceNameEn !== undefined) await this.serviceNameEn.fill(opts.serviceNameEn);
    if (opts.confirmUrl !== undefined) await this.confirmUrl.fill(opts.confirmUrl);
  }

  /** 支払方法チェックボックスの先頭1件を選択（異常系で他の必須を成立させ対象項目のみを不正化するため）。 */
  async selectFirstPayment() {
    await this.paymentCheckboxes.first().check();
  }

  /**
   * 指定入力欄に紐づくバリデーションエラー（Symfony Form の .invalid-feedback）。
   * 期待を当該フィールドへスコープし「別の未入力エラーで偶然通る」ことを防ぐ（オラクル独立性）。
   * 要実機確認: Symfony Form は入力欄直後の form-group 内に .invalid-feedback を描画する（delivery_edit.twig:535）。
   */
  fieldError(input: Locator): Locator {
    return input.locator(
      'xpath=following::*[contains(concat(" ",normalize-space(@class)," ")," invalid-feedback ")][1]'
    );
  }

  /** 登録ボタン押下（type=button・JSで form を submit する）。 */
  async submitRegister() {
    await this.registerButton.click();
  }

  /** 一覧の主要UI（新規作成ボタン・列見出し）が仕様どおり表示されること。 */
  async seeListHeader() {
    await expect(this.newButton).toBeVisible();
    await expect(this.listNameHeader).toBeVisible();
  }

  /** 新規編集画面の基本情報ブロックが仕様どおり表示されること。 */
  async seeBasicInfoForm() {
    await expect(this.basicInfoHeader).toBeVisible();
    await expect(this.name).toBeVisible();
    await expect(this.serviceName).toBeVisible();
  }
}
