import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 受注管理「カスタム配送CSVダウンロード」Page Object（配送カスタムCSV出力）。
 * 納品ケース表 integration_test/e2e/m05_05_admin_order_order_shipping_custom_csv_export_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m05-05_admin_order_order_shipping_custom_csv_export.md /
 * messages.ja.yaml)由来（オラクル独立性）。本機能は GET ダウンロードであり、CSVの中身
 * （ヘッダ=列表示名・配送ごと行分割・受注→配送フォールバック・rank昇順・検索条件一致・BOM/エンコーディング）は
 * 手動確認とする。自動化はダウンロード発火・ファイル名・Content-Type/Content-Disposition・404・遷移・UI部品に限る。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Order/index.twig）:
 *  - ドロップダウンボタン: button#customShippingCsvDownloadDropDown（index.twig:1174）
 *  - ボタン文言: trans admin.order.custom_shipping_csv.download=「カスタム配送CSVダウンロード」（index.twig:1176 / messages.ja.yaml:5535）
 *  - フォーマット名リンク: 各 ShippingCsvExtensions の url('admin_custom_export',{csvExtensionId})（index.twig:1179-1182）
 *  - 出力項目設定リンク: url('admin_setting_shop_csv_custom',{csvTypeId:CSV_TYPE_SHIPPING=4})、文言 trans admin.order.order.custom_csv.setting=「出力項目設定」（index.twig:1184-1186 / messages.ja.yaml:5537）
 *
 * ルート（src/Eccube/Controller）:
 *  - 受注一覧 admin_order = GET,POST /<route>/order（OrderController.php:136。ShippingCsvExtensions は :280 で配送Csv種別を渡す）
 *  - ダウンロード admin_custom_export = GET,POST /<route>/custom_csv/export/{csvExtensionId}（CustomExportCsvController.php:72。該当行が無ければ 404＝:75-77）
 *  - 設定 admin_setting_shop_csv_custom = GET /<route>/setting/shop/custom_csv/{csvTypeId}/{csvExtensionId}（CustomerCsvController.php:46）
 *  - 応答: Content-Type application/octet-stream（:103）/ Content-Disposition attachment; filename=shipping_{YmdHis}.csv（:102,104）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class OrderOrderShippingCustomCsvExportPage {
  readonly page: Page;
  readonly orderListUrl: string; // 受注一覧（admin_order）
  readonly settingUrlPrefix: string; // 配送カスタムCSV設定（csvTypeId=4=CSV_TYPE_SHIPPING）

  readonly dropdownToggle: Locator; // button#customShippingCsvDownloadDropDown（index.twig:1174）
  readonly dropdownMenu: Locator; // 当該ボタンの dropdown-menu（index.twig:1178）
  readonly formatLinks: Locator; // フォーマット名リンク（index.twig:1179-1182）
  readonly settingLink: Locator; // 出力項目設定リンク（index.twig:1184-1186）

  constructor(page: Page) {
    this.page = page;
    this.orderListUrl = `/${ECCUBE_ADMIN_ROUTE}/order`;
    // CSV_TYPE_SHIPPING=4（CsvType.php:47）。末尾 csvExtensionId は既定 null。
    this.settingUrlPrefix = `/${ECCUBE_ADMIN_ROUTE}/setting/shop/custom_csv/4`;

    this.dropdownToggle = page.locator("#customShippingCsvDownloadDropDown");
    this.dropdownMenu = page.locator(
      ".btn-group:has(#customShippingCsvDownloadDropDown) > .dropdown-menu"
    );
    // 実装trans文言を選択キーにしない（オラクル独立性）。設計由来のルートを href に含むことで識別する。
    this.formatLinks = this.dropdownMenu.locator(
      'a.dropdown-item[href*="custom_csv/export"]'
    );
    this.settingLink = this.dropdownMenu.locator(
      'a.dropdown-item[href*="setting/shop/custom_csv"]'
    );
  }

  async gotoOrderList() {
    await this.page.goto(this.orderListUrl);
  }

  /** ダウンロードURL（admin_custom_export）を任意の拡張IDで組み立てる。 */
  downloadUrl(csvExtensionId: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/custom_csv/export/${csvExtensionId}`;
  }

  /**
   * CSV操作UIが描画されているか（受注一覧 totalItemCount>0 が前提）。
   * 受注一覧テンプレートは {% if pagination and pagination.totalItemCount %} 配下にのみ
   * 当ドロップダウンを描画する（Order/index.twig:1094-1367）ため、受注0件では toggle が存在しない。
   */
  async isCsvUiPresent(): Promise<boolean> {
    return (await this.dropdownToggle.count()) > 0;
  }

  /** Bootstrap ドロップダウンを開く（リンクは開かないと不可視）。 */
  async openDropdown() {
    await this.dropdownToggle.click();
    await expect(this.dropdownMenu).toBeVisible();
  }

  /** 開いたドロップダウンに並ぶフォーマット名リンクの href 一覧（拡張定義のシードが無ければ空）。 */
  async formatLinkHrefs(): Promise<string[]> {
    const hrefs = await this.formatLinks.evaluateAll((els) =>
      els.map((e) => (e as HTMLAnchorElement).getAttribute("href") || "")
    );
    return hrefs.filter((h) => h.includes("custom_csv/export"));
  }

  /** 受注一覧にカスタム配送CSVダウンロードのドロップダウンボタンが表示されること。 */
  async seeDropdownButton() {
    await expect(this.dropdownToggle).toBeVisible();
  }

  /** フォーマット名リンク押下でダウンロードが発火すること。 */
  async clickFormatLinkAndWaitDownload(index = 0): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.formatLinks.nth(index).click(),
    ]);
    return download;
  }
}
