import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 受注管理「カスタム受注CSVダウンロード」Page Object。
 * 納品ケース表 integration_test/e2e/m05_03_admin_order_order_custom_csv_export_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m05-03_admin_order_order_custom_csv_export.md /
 * CustomExportCsvController.php / messages.ja.yaml)由来（オラクル独立性）。本機能は GET リンクの
 * CSVダウンロードであり、CSVの中身（列・データ行・rank順・検索条件一致・明細単位行数）は手動確認とする。
 * 自動化はダウンロード発火・ファイル名・HTTP応答・404・遷移・UI部品の表示に限る。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Order/index.twig）:
 *  - 受注一覧 admin_order = GET /<route>/order（OrderController.php:136）
 *  - ドロップダウンボタン: button#customOrderCsvDownloadDropDown（index.twig:1157）
 *    ラベル trans admin.order.custom_order_csv.download=「カスタム受注CSVダウンロード」（index.twig:1159 / messages.ja.yaml:5534）
 *  - 拡張リンク: 上記ボタンの兄弟 .dropdown-menu 内 a.dropdown-item[href*="custom_csv/export"]
 *    （index.twig:1162-1166 for CsvEx in OrderCsvExtensions / href=url('admin_custom_export',{csvExtensionId})）
 *  - 設定リンク: 同 .dropdown-menu 内 a[href*="setting/shop/custom_csv"]
 *    （index.twig:1167-1169 trans admin.order.order.custom_csv.setting=「出力項目設定」 messages.ja.yaml:5537）
 *
 * ルート（src/Eccube/Controller）:
 *  - ダウンロード admin_custom_export = GET,POST /<route>/custom_csv/export/{csvExtensionId}（CustomExportCsvController.php:72）
 *    拡張未検出は 404（同:75-77）。filename=order_{YmdHis}.csv（同:102）。
 *  - 設定 admin_setting_shop_csv_custom = GET /<route>/setting/shop/custom_csv/{csvTypeId}/{csvExtensionId}
 *    （CustomerCsvController.php:46。受注は csvTypeId=CSV_TYPE_ORDER=3 / CsvType.php:42）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class OrderOrderCustomCsvExportPage {
  readonly page: Page;
  readonly orderListUrl: string; // 受注一覧（admin_order）

  readonly customCsvDropdownButton: Locator; // button#customOrderCsvDownloadDropDown（index.twig:1157）
  readonly dropdownMenu: Locator; // 上記ボタンの兄弟 .dropdown-menu（index.twig:1161）
  readonly extensionLinks: Locator; // .dropdown-menu a[href*="custom_csv/export"]（index.twig:1163）
  readonly settingLink: Locator; // .dropdown-menu a[href*="setting/shop/custom_csv"]（index.twig:1167）

  constructor(page: Page) {
    this.page = page;
    this.orderListUrl = `/${ECCUBE_ADMIN_ROUTE}/order`;

    this.customCsvDropdownButton = page.locator("#customOrderCsvDownloadDropDown");
    // ボタン直後の dropdown-menu（同一 .btn-group 内）に項目が入る。
    this.dropdownMenu = page
      .locator("#customOrderCsvDownloadDropDown")
      .locator("xpath=following-sibling::div[contains(@class,'dropdown-menu')]");
    this.extensionLinks = this.dropdownMenu.locator(
      'a.dropdown-item[href*="custom_csv/export"]'
    );
    // 設定リンクは設計由来ルート（setting/shop/custom_csv）を href に含むことで識別（翻訳文言を選択キーにしない）。
    this.settingLink = this.dropdownMenu.locator('a[href*="setting/shop/custom_csv"]');
  }

  async gotoOrderList() {
    await this.page.goto(this.orderListUrl);
  }

  /** ダウンロードURL（admin_custom_export）を任意の拡張IDで組み立てる。 */
  downloadUrl(csvExtensionId: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/custom_csv/export/${csvExtensionId}`;
  }

  /** カスタム受注CSVダウンロードのドロップダウンを開く。 */
  async openDropdown() {
    await this.customCsvDropdownButton.click();
  }

  /**
   * ドロップダウン内の拡張ダウンロードリンクの href(=ダウンロードURL) 一覧。
   * シードされた受注CSV拡張が無ければ空配列（テスト側で skip 判定する）。
   */
  async extensionLinkHrefs(): Promise<string[]> {
    const hrefs = await this.extensionLinks.evaluateAll((els) =>
      els
        .map((e) => (e as HTMLAnchorElement).getAttribute("href") || "")
        .filter((h) => h.includes("custom_csv/export"))
    );
    return hrefs;
  }

  /**
   * 先頭の拡張ダウンロードリンクを押下し、ダウンロード発火を待つ。
   * 単純な GET リンクのため確認ダイアログは介在しない（仕様: フロント挙動）。
   */
  async clickExtensionAndWaitDownload(index = 0): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.extensionLinks.nth(index).click(),
    ]);
    return download;
  }

  /** 受注一覧にカスタム受注CSVダウンロードのドロップダウンボタンが表示されること。 */
  async seeCustomCsvDropdown() {
    await expect(this.customCsvDropdownButton).toBeVisible();
  }

  /** ドロップダウン末尾に「出力項目設定」リンクが表示されること（拡張0件でも常に出る）。 */
  async seeSettingLink() {
    await expect(this.settingLink).toHaveCount(1);
  }
}
