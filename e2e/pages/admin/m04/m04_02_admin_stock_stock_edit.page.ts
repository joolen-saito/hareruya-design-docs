import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫編集（在庫承認）画面 Page Object。
 * 納品ケース表 integration_test/e2e/m04_02_admin_stock_stock_edit_e2e_cases.md に対応。
 *
 * 期待結果は仕様(設計書 functions/ec-cube-enterprise/m04-02_admin_stock_stock_edit.md / 観点表 / messages.ja.yaml)由来
 * （オラクル独立性）。本Page Objectが保持するのは Twig＋Symfony Form 由来のセレクタ（位置情報）のみ。
 *
 * 画面: GET /%admin%/product/stock/{productStockId}/stock-approval/new（admin_stock_approval_new）
 *       POST /%admin%/product/stock/{productStockId}/stock-approval/store（admin_stock_approval_store・失敗時は同画面再描画）
 *
 * DOM id 根拠: Symfony Form getBlockPrefix=`admin_stock_approval_new`（StockApprovalType.php:283-286）。
 *  - stock_change_type_detail   → #admin_stock_approval_new_stock_change_type_detail（approval.twig:73 / form_widget :574）
 *  - stock_change_reason        → #admin_stock_approval_new_stock_change_reason（approval.twig:154 / form_widget :587）
 *  - stock_change_quantity      → #admin_stock_approval_new_stock_change_quantity（approval.twig:74 / form_widget :600）
 *  - purchase_price             → #admin_stock_approval_new_purchase_price（approval.twig:75 / form_widget :610）
 *  - approval_department        → #admin_stock_approval_new_approval_department（approval.twig:236 / form_widget :632）
 *  - approval_notification_target_members → #admin_stock_approval_new_approval_notification_target_members（approval.twig:197 / form_widget :636。select2で初期化されネイティブselectは非表示）
 *  - 登録ボタン: button[form="stock_approval_form"]（approval.twig:664 trans `common.registration`=「登録する」 messages.ja.yaml:17）
 *  - 在庫情報カード見出し: trans `admin.stock.edit.card_title`=「在庫情報」（approval.twig:429 / messages.ja.yaml:4232）
 *  - 在庫変動内容カード見出し: trans `admin.stock.form.title`=「在庫変動内容」（approval.twig:561 / messages.ja.yaml:4525）
 *  - 在庫変動履歴セクション: #stockChangeHistory（stock_change_history.twig:14）/ 見出し trans `admin.stock.edit.history.title`=「在庫変動履歴」（:5 / messages.ja.yaml:4236）
 *  - 在庫一覧へ戻る: link trans `admin.stock.edit.back_to_stock_list`=「在庫一覧に戻る」（approval.twig:657 / messages.ja.yaml:4235）
 *  - 成功フラッシュ: .alert-success（alert.twig:22）/ 失敗・権限フラッシュ: .alert-danger（alert.twig:32,42）
 */
export class StockStockEditPage {
  readonly page: Page;

  readonly form: Locator; // #stock_approval_form（approval.twig:423）
  readonly stockChangeType: Locator; // 在庫変動区分（必須・入庫/廃棄のみ）
  readonly stockChangeReason: Locator; // 在庫変動理由（必須・最大長）
  readonly stockChangeQuantity: Locator; // 在庫増減数（必須・範囲）
  readonly purchasePrice: Locator; // 仕入単価（任意・範囲。廃棄選択時はJSでdisabled）
  readonly approvalDepartment: Locator; // 承認通知先（部署絞り込み）
  readonly notificationMembers: Locator; // 承認通知先メンバー（必須・Count>=1・select2）
  readonly submitButton: Locator; // 登録ボタン（form属性で本フォームに紐づく）

  readonly infoCardTitle: Locator; // 「在庫情報」カード見出し
  readonly formCardTitle: Locator; // 「在庫変動内容」カード見出し
  readonly historySection: Locator; // #stockChangeHistory
  readonly historyTitle: Locator; // 「在庫変動履歴」見出し
  readonly backToListLink: Locator; // 「在庫一覧に戻る」

  readonly successFlash: Locator; // .alert-success（保存しました）
  readonly errorFlash: Locator; // .alert-danger（保存に失敗しました／権限なし）

  constructor(page: Page) {
    this.page = page;

    this.form = page.locator("#stock_approval_form");
    this.stockChangeType = page.locator("#admin_stock_approval_new_stock_change_type_detail");
    this.stockChangeReason = page.locator("#admin_stock_approval_new_stock_change_reason");
    this.stockChangeQuantity = page.locator("#admin_stock_approval_new_stock_change_quantity");
    this.purchasePrice = page.locator("#admin_stock_approval_new_purchase_price");
    this.approvalDepartment = page.locator("#admin_stock_approval_new_approval_department");
    this.notificationMembers = page.locator(
      "#admin_stock_approval_new_approval_notification_target_members"
    );
    this.submitButton = page.locator('button[form="stock_approval_form"]');

    this.infoCardTitle = page.locator(".card-title", { hasText: "在庫情報" });
    this.formCardTitle = page.locator(".card-title", { hasText: "在庫変動内容" });
    this.historySection = page.locator("#stockChangeHistory");
    this.historyTitle = page.locator(".card-title", { hasText: "在庫変動履歴" });
    this.backToListLink = page.getByRole("link", { name: "在庫一覧に戻る" });

    this.successFlash = page.locator(".alert-success");
    this.errorFlash = page.locator(".alert-danger");
  }

  newUrl(productStockId: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/stock/${productStockId}/stock-approval/new`;
  }

  /** 在庫承認（編集）画面を開く。404確認のため Response を返す。 */
  async goto(productStockId: string | number) {
    return this.page.goto(this.newUrl(productStockId));
  }

  /** 編集フォームの主要UI部品が仕様どおり表示されること。 */
  async seeEditForm() {
    await expect(this.infoCardTitle).toBeVisible();
    await expect(this.formCardTitle).toBeVisible();
    await expect(this.stockChangeType).toBeVisible();
    await expect(this.stockChangeReason).toBeVisible();
    await expect(this.stockChangeQuantity).toBeVisible();
    await expect(this.purchasePrice).toBeVisible();
    // 承認部署（必須・絞り込み用）も設計書のフォーム項目（approval.twig:624-633）。
    await expect(this.approvalDepartment).toBeVisible();
    // 承認通知先メンバーは select2 でネイティブselectが非表示になるため存在で確認する。
    await expect(this.notificationMembers).toBeAttached();
    await expect(this.submitButton).toBeVisible();
  }

  /**
   * 在庫変動区分を区分名キーワード（「入庫」/「廃棄」）で選択する。
   * 選択肢ラベルは prefix絵文字 + 区分名 + '/' + 子区分名（StockApprovalType.php:99-105）。
   * 区分名はマスタ（mtb_stock_change_type）由来のため、選択はラベル文言一致に依存する（要実機確認）。
   */
  async selectChangeType(keyword: "入庫" | "廃棄") {
    const value = await this.stockChangeType
      .locator("option", { hasText: keyword })
      .first()
      .getAttribute("value");
    await this.stockChangeType.selectOption(value ?? "");
  }

  async fillReason(text: string) {
    await this.stockChangeReason.fill(text);
  }

  async fillQuantity(value: string) {
    await this.stockChangeQuantity.fill(value);
  }

  async fillPurchasePrice(value: string) {
    await this.purchasePrice.fill(value);
  }

  async submit() {
    await this.submitButton.click();
  }
}
