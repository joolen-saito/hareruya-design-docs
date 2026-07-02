import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 ネット買取管理 — 買取情報編集（買取詳細）Page Object。
 * 画面タイプ: edit（GET admin_purchase_edit / POST admin_purchase_update）。
 *
 * 期待結果（合否）は仕様（正本md functions/pf-eccube3/m07-03_admin_online_purchase_purchase_online_buy_order_edit.md・
 * 観点表・ec-cube-enterprise確認値）由来とする（オラクル独立性）。本ファイルが実装から取るのはセレクタ（位置情報）のみ。
 *
 * セレクタ根拠（ec-cube-enterprise 現行ソース。行番号は src 基準）:
 *  - フォームDOM id は Symfony Form の getBlockPrefix 由来:
 *      PurchaseDetailType.getBlockPrefix='admin_purchase_detail'（PurchaseDetailType.php:440-442）
 *      BankAccountType.getBlockPrefix='admin_purchase_bank_account'（BankAccountType.php:95-97）
 *      QualifiedInvoiceIssuerAccountType.getBlockPrefix='admin_purchase_qualified_invoice_issuer_account'（QualifiedInvoiceIssuerAccountType.php:107-109）
 *  - フォーム: <form id="purchase_detail_form" action=admin_purchase_update>（detail.twig:129）/ form._token（detail.twig:131 → #admin_purchase_detail__token）
 *  - 保存ボタン: #save_btn trans admin.common.save=「保存」（detail.twig:899 / messages.ja.yaml:1434）
 *  - 一覧戻りリンク: a.c-baseLink href=admin_purchase_page（detail.twig:882, label admin.purchase.online.detail.footer.back_to_list:884）
 *  - 手動メール通知: #alert_no_assessment_send_mail（detail.twig:892）
 *  - 一括売却登録: #sell_btn formaction=admin_purchase_bulk_detail_sell（detail.twig:896）
 *  - 商品追加(選んで買取): #add_product data-bs-target=#searchProductModal（detail.twig:311）
 *  - 査定編集トグル: #edit_appraisal_switch（detail.twig:312）/ 依頼者編集トグル: #edit_customer_switch（detail.twig:728）
 *  - CSVボタン: #export_csv formaction=admin_purchase_csv_export（detail.twig:313）/ #csvexport_product_list（detail.twig:314）/ hidden #buyOrderIds（detail.twig:315）
 *  - まとめて買取アコーディオン: header[data-bs-target=#bulkPurchaseCollapse]（detail.twig:461）/ #bulkPurchaseCollapse（detail.twig:470）
 *  - 商品検索モーダル: #searchProductModal（detail.twig:909）/ モーダル内検索ボタン #searchProductModalButton（detail.twig:933）
 *  - 管理者メモ: #admin_purchase_detail_memo（detail.twig:349 form.memo）
 *  - 買取状況: #admin_purchase_detail_BuyOrderStatus（detail.twig:249 form.BuyOrderStatus）
 *  - 査定金額合計: #admin_purchase_detail_totalPrice（detail.twig:325 form.totalPrice readonly）
 *  - E-mail: #admin_purchase_detail_email（PurchaseDetailType add('email'):186）。依頼者ブロックの入力で、初期描画では編集ロック状態。
 *    編集するには依頼者編集トグル(#edit_customer_switch)を先に押下する（仕様: 依頼者編集フロー）。
 *  - 口座名義: #admin_purchase_bank_account_accountHolder / 口座番号: #admin_purchase_bank_account_accountNo（BankAccountType add）
 *  - 適格請求書 事業者フラグ: ChoiceType(expanded=true)（QualifiedInvoiceIssuerAccountType.php:54-64）のため実inputはラジオ
 *    #admin_purchase_qualified_invoice_issuer_account_qualifiedInvoiceIssuerFlg_0(=非事業者/off)・_1(=事業者/on)。
 *    choices配列は off→on の順（:60-63）だが index→value の対応は 要実機確認。
 *    登録番号: #admin_purchase_qualified_invoice_issuer_account_qualifiedInvoiceIssuerCode（QualifiedInvoiceIssuerAccountType add）
 *  - 実在庫増減: input[name^="admin_purchase_buy_order_stock"][name*="[diff_stock]"]
 *    （BuyOrderStockType.getBlockPrefix='admin_purchase_buy_order_stock':56-58 ／ diff_stock は PurchaseStockProductClassType.php:36）
 *
 * 注: 検証エラー表示はコントローラで main $form のエラーのみ addError('admin') でフラッシュし、口座/適格請求書は
 *     再描画(inline form_errors)で示す（PurchaseController.php:399-417）。本POMは flash/inline 双方を拾えるよう
 *     ページ本文テキストで期待メッセージを確認する（要実機確認: 表示位置・セレクタ）。
 */
export class AdminOnlinePurchasePurchaseOnlineBuyOrderEditPage {
  readonly page: Page;

  // 入力欄・トークン（admin_purchase_detail 空間）
  readonly form: Locator; // #purchase_detail_form
  readonly memo: Locator; // #admin_purchase_detail_memo
  readonly buyOrderStatus: Locator; // #admin_purchase_detail_BuyOrderStatus
  readonly totalPrice: Locator; // #admin_purchase_detail_totalPrice
  readonly email: Locator; // #admin_purchase_detail_email

  // 口座（admin_purchase_bank_account 空間）
  readonly accountHolder: Locator; // #admin_purchase_bank_account_accountHolder
  readonly accountNo: Locator; // #admin_purchase_bank_account_accountNo

  // 適格請求書（admin_purchase_qualified_invoice_issuer_account 空間）
  // expanded=true ラジオの実input。off=_0 / on(事業者)=_1（choices off→on順・要実機確認）。
  readonly qiIssuerFlgOff: Locator;
  readonly qiIssuerFlgOn: Locator;
  readonly qiIssuerCode: Locator;

  // 実在庫増減（admin_purchase_buy_order_stock 空間 / diff_stock）
  readonly stockDiffInput: Locator;

  // 操作・UI部品
  readonly saveButton: Locator; // #save_btn
  readonly backToListLink: Locator; // a.c-baseLink（admin_purchase_page）
  readonly manualMailLink: Locator; // #alert_no_assessment_send_mail
  readonly sellButton: Locator; // #sell_btn
  readonly addProductButton: Locator; // #add_product
  readonly appraisalSwitch: Locator; // #edit_appraisal_switch
  readonly customerSwitch: Locator; // #edit_customer_switch
  readonly csvExportButton: Locator; // #export_csv
  readonly csvProductListButton: Locator; // #csvexport_product_list
  readonly buyOrderIdsHidden: Locator; // #buyOrderIds
  readonly bulkPurchaseHeader: Locator; // data-bs-target=#bulkPurchaseCollapse
  readonly bulkPurchaseCollapse: Locator; // #bulkPurchaseCollapse
  readonly searchProductModal: Locator; // #searchProductModal
  readonly searchProductModalButton: Locator; // #searchProductModalButton

  constructor(page: Page) {
    this.page = page;

    this.form = page.locator("#purchase_detail_form");
    this.memo = page.locator("#admin_purchase_detail_memo");
    this.buyOrderStatus = page.locator("#admin_purchase_detail_BuyOrderStatus");
    this.totalPrice = page.locator("#admin_purchase_detail_totalPrice");
    this.email = page.locator("#admin_purchase_detail_email");

    this.accountHolder = page.locator("#admin_purchase_bank_account_accountHolder");
    this.accountNo = page.locator("#admin_purchase_bank_account_accountNo");

    this.qiIssuerFlgOff = page.locator(
      "#admin_purchase_qualified_invoice_issuer_account_qualifiedInvoiceIssuerFlg_0"
    );
    this.qiIssuerFlgOn = page.locator(
      "#admin_purchase_qualified_invoice_issuer_account_qualifiedInvoiceIssuerFlg_1"
    );
    this.qiIssuerCode = page.locator(
      "#admin_purchase_qualified_invoice_issuer_account_qualifiedInvoiceIssuerCode"
    );
    this.stockDiffInput = page.locator(
      'input[name^="admin_purchase_buy_order_stock"][name*="[diff_stock]"]'
    );

    this.saveButton = page.locator("#save_btn");
    this.backToListLink = page.locator("a.c-baseLink");
    this.manualMailLink = page.locator("#alert_no_assessment_send_mail");
    this.sellButton = page.locator("#sell_btn");
    this.addProductButton = page.locator("#add_product");
    this.appraisalSwitch = page.locator("#edit_appraisal_switch");
    this.customerSwitch = page.locator("#edit_customer_switch");
    this.csvExportButton = page.locator("#export_csv");
    this.csvProductListButton = page.locator("#csvexport_product_list");
    this.buyOrderIdsHidden = page.locator("#buyOrderIds");
    this.bulkPurchaseHeader = page.locator('[data-bs-target="#bulkPurchaseCollapse"]');
    this.bulkPurchaseCollapse = page.locator("#bulkPurchaseCollapse");
    this.searchProductModal = page.locator("#searchProductModal");
    this.searchProductModalButton = page.locator("#searchProductModalButton");
  }

  editUrl(id: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/purchase/${id}/edit`;
  }
  updateUrl(id: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/purchase/${id}/update`;
  }

  /** 買取詳細(編集GET)を開く。レスポンスを返す（HTTPステータス検査用）。 */
  async goto(id: number | string) {
    return await this.page.goto(this.editUrl(id));
  }

  /** 詳細画面の主要UI部品（保存ボタン・一覧戻り）が仕様どおり表示されること。 */
  async seeDetail() {
    await expect(this.saveButton).toBeVisible();
    await expect(this.backToListLink).toBeVisible();
  }

  /** フッタの操作部品が表示されること。 */
  async seeFooterButtons() {
    await expect(this.saveButton).toBeVisible();
    await expect(this.sellButton).toBeVisible();
    await expect(this.manualMailLink).toBeVisible();
    await expect(this.backToListLink).toBeVisible();
  }

  /** 買取情報ブロックの操作起点が表示されること。 */
  async seePurchaseInfoButtons() {
    await expect(this.addProductButton).toBeVisible();
    await expect(this.appraisalSwitch).toBeVisible();
    await expect(this.csvExportButton).toBeVisible();
  }

  async clickSave() {
    await this.saveButton.click();
  }

  async openSearchProductModal() {
    await this.addProductButton.click();
    await expect(this.searchProductModal).toBeVisible();
  }

  async toggleAppraisalEdit() {
    await this.appraisalSwitch.click();
  }

  /** 依頼者ブロック(会員・E-mail等)を編集可能にする。仕様: 依頼者編集トグルを押下してロック解除する。 */
  async enableCustomerEdit() {
    await this.customerSwitch.click();
  }

  /** 期待メッセージ（仕様文言）がページ本文に表示されること。表示位置(flash/inline)は要実機確認。 */
  async seeMessage(text: string) {
    await expect(this.page.locator("body")).toContainText(text);
  }
}
