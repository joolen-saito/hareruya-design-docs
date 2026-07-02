import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 ネット買取管理 買取商品（キャンセル）CSV出力 Page Object。
 * 本機能は単独画面を持たず、買取一覧（admin_purchase_list）の検索結果一覧上の
 * 一括ダウンロードメニューから「買取商品（キャンセル）CSV」を出力する（POST専用ルート）。
 *
 * 期待結果は仕様（functions/ec-cube-enterprise/m07-07_...md / 基本設計 / 観点表）由来（オラクル独立性）。
 * セレクタは Twig 由来の位置情報のみ。合否は仕様で判定する。
 *
 * セレクタ根拠（src/Eccube/Resource/template/admin/Purchase/index.twig / ec-cube-enterprise）:
 *  - 一覧URL admin_purchase_list = /<route>/purchase/list（PurchaseController.php:121）
 *  - 検索フォーム #search_form（index.twig:47、action=admin_purchase_search）
 *  - 一括CSVフォーム #bulk_csv_export（index.twig:162、CSRFトークン hidden index.twig:163）
 *  - ダウンロードドロップダウン #result_list__custom_csv_menu のトグル（index.twig:166-169、文言 admin.common.download=「ダウンロード」）
 *  - 「買取商品（キャンセル）CSV」ボタン #csv_export_product_cancel（index.twig:174、
 *    formaction=path('admin_purchase_csv_export_product_list', {type:'notSale'})、trans admin.purchase.online.btn.csv_export_product_cancel=messages.ja.yaml:5258）
 *  - 行チェックボックス input.searched_buy_order_id（name=buyOrderIds[]、index.twig:231）
 *  - 全選択チェックボックス #allCheck（index.twig:212）
 *  - フラッシュエラー .alert-danger（admin/alert.twig:42、addError(...,'admin')→flash 'eccube.admin.error'）
 *
 * エクスポートのルート（POST専用、PurchaseController.php:594）:
 *  - /<route>/purchase/csv_export_product_list?type=notSale
 */
export class OnlinePurchasePurchaseOnlineProductCancelCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // 買取一覧（検索結果一覧）
  readonly exportUrl: string; // 買取商品（キャンセル）CSV出力（POST専用）

  readonly searchForm: Locator; // #search_form（index.twig:47）
  readonly searchButton: Locator; // 検索 submit（index.twig:144 / admin.common.search）
  readonly bulkForm: Locator; // #bulk_csv_export（index.twig:162）
  readonly downloadMenuToggle: Locator; // ダウンロードドロップダウン トグル（index.twig:167）
  readonly cancelCsvButton: Locator; // #csv_export_product_cancel（index.twig:174）
  readonly allCheck: Locator; // #allCheck（index.twig:212）
  readonly rowCheckboxes: Locator; // input.searched_buy_order_id（index.twig:231）
  readonly error: Locator; // .alert-danger（alert.twig:42）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/purchase/list`;
    this.exportUrl = `/${ECCUBE_ADMIN_ROUTE}/purchase/csv_export_product_list?type=notSale`;

    this.searchForm = page.locator("#search_form");
    this.searchButton = page.locator('#search_form button[type="submit"]', {
      hasText: "検索",
    });
    this.bulkForm = page.locator("#bulk_csv_export");
    this.downloadMenuToggle = page.locator(
      "#result_list__custom_csv_menu button.dropdown-toggle"
    );
    this.cancelCsvButton = page.locator("#csv_export_product_cancel");
    this.allCheck = page.locator("#allCheck");
    this.rowCheckboxes = page.locator("input.searched_buy_order_id");
    this.error = page.locator(".alert-danger");
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 買取一覧で空条件のまま検索し、検索結果一覧（一括CSVフォーム）を表示する。 */
  async searchAll() {
    await this.gotoList();
    await this.searchButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /** ダウンロードドロップダウンを開く。 */
  async openDownloadMenu() {
    await this.downloadMenuToggle.click();
  }

  /** 先頭行のチェックボックスを選択する。 */
  async selectFirstRow() {
    await this.rowCheckboxes.first().check();
  }

  /** 全選択チェックボックスをオンにする。 */
  async selectAll() {
    await this.allCheck.check();
  }

  /** 「買取商品（キャンセル）CSV」を押下する（ドロップダウンは事前に開くこと）。 */
  async clickCancelCsv() {
    await this.cancelCsvButton.click();
  }

  /** ダウンロードメニューに「買取商品（キャンセル）CSV」ボタンが表示されること（UI部品）。 */
  async seeCancelCsvButton() {
    await this.openDownloadMenu();
    await expect(this.cancelCsvButton).toBeVisible();
    // 文言は messages.ja.yaml:5258 由来（仕様）。
    await expect(this.cancelCsvButton).toContainText("買取商品（キャンセル）CSV");
  }

  /** 検索結果一覧に行チェックボックスと全選択チェックボックスが表示されること（UI部品）。 */
  async seeSelectionCheckboxes() {
    await expect(this.allCheck).toBeVisible();
    await expect(this.rowCheckboxes.first()).toBeVisible();
  }
}
