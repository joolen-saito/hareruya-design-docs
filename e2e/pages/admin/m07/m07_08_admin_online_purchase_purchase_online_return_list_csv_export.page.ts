import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 ネット買取管理 > 買取一覧「戻しリストCSV」出力 Page Object（bulk/csv_export 型）。
 * 期待結果は仕様（基本設計 Excel／正本md m07-08／観点表）由来（オラクル独立性）。
 * セレクタは Twig 由来の位置情報のみ。messages.ja.yaml の文言は仕様文言の静的確認として併記する。
 *
 * 由来（src/Eccube/Resource/template/admin/Purchase/index.twig）:
 *  - 一覧URL admin_purchase_list = /admin/purchase/list（PurchaseController.php:121）
 *  - 出力ルート admin_purchase_csv_export_return_list = POST /admin/purchase/csv_export_return_list（PurchaseController.php:638）
 *  - 一括フォーム #bulk_csv_export（index.twig:162、CSRF hidden index.twig:163）
 *  - ダウンロードドロップダウン #result_list__custom_csv_menu .dropdown-toggle（index.twig:166-169、trans admin.common.download=「ダウンロード」 messages.ja.yaml:1459）
 *  - 戻しリストCSVボタン #csv_export_return_list（index.twig:175、trans admin.purchase.online.btn.csv_export_return_list=「戻しリストCSV」 messages.ja.yaml:5259）
 *  - 行チェックボックス input.searched_buy_order_id[name="buyOrderIds[]"]（index.twig:231）／全選択 #allCheck（index.twig:212）
 *  - エラー flash eccube.admin.error → .alert-danger（admin/alert.twig:41-49）
 *  - サブタイトル「買取一覧」（index.twig:7 / messages.ja.yaml:5216）
 */
export class OnlinePurchasePurchaseOnlineReturnListCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // 買取一覧（戻しリストCSV出力の入口）
  readonly exportRoute: string; // 戻しリストCSV出力ルート（POST専用）

  readonly downloadDropdownToggle: Locator; // 「ダウンロード」ドロップダウン
  readonly returnListCsvButton: Locator; // 「戻しリストCSV」ボタン #csv_export_return_list
  readonly rowCheckboxes: Locator; // 行チェックボックス buyOrderIds[]
  readonly allCheck: Locator; // 全選択 #allCheck
  readonly error: Locator; // .alert-danger（flash error）
  readonly subTitle: Locator; // サブタイトル領域（出力先クラスは要実機確認のためテキストで確認）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/purchase/list`;
    this.exportRoute = `/${ECCUBE_ADMIN_ROUTE}/purchase/csv_export_return_list`;

    this.downloadDropdownToggle = page.locator(
      "#result_list__custom_csv_menu .dropdown-toggle"
    );
    this.returnListCsvButton = page.locator("#csv_export_return_list");
    this.rowCheckboxes = page.locator(
      'input.searched_buy_order_id[name="buyOrderIds[]"]'
    );
    this.allCheck = page.locator("#allCheck");
    this.error = page.locator(".alert-danger");
    this.subTitle = page.locator("body");
  }

  async goto() {
    await this.page.goto(this.listUrl);
  }

  /** ダウンロードドロップダウンを開く。 */
  async openDownloadMenu() {
    await this.downloadDropdownToggle.click();
  }

  /** 指定インデックスの行チェックボックスを選択する（既定: 先頭1件）。 */
  async selectRow(index = 0) {
    await this.rowCheckboxes.nth(index).check();
  }

  /** 「戻しリストCSV」を押下する（ダウンロードドロップダウンを開いてから）。 */
  async clickReturnListCsv() {
    await this.openDownloadMenu();
    await this.returnListCsvButton.click();
  }

  /** 買取一覧画面のUI（サブタイトル）が仕様どおり表示されること。 */
  async seeListScreen() {
    await expect(this.subTitle).toContainText("買取一覧"); // messages.ja.yaml:5216
  }

  /** 「戻しリストCSV」ボタンが存在すること（検索結果1件以上が前提）。 */
  async seeReturnListCsvButton() {
    await this.openDownloadMenu();
    await expect(this.returnListCsvButton).toBeVisible();
  }
}
