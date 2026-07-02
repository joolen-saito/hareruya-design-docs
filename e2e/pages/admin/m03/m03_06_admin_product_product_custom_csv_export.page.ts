import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 商品管理「カスタムデータ CSV ダウンロード（商品情報）」Page Object。
 * 納品ケース表 integration_test/e2e/m03_06_admin_product_product_custom_csv_export_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-06_admin_product_product_custom_csv_export.md / messages.ja.yaml)由来
 * （オラクル独立性）。本機能は GET ダウンロードであり、CSVの中身（列・行・rank順・検索条件一致）は手動確認とする。
 * 自動化はダウンロード発火・ファイル名・Content-Type・404・遷移・UI部品に限る。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Product/index.twig）:
 *  - プルダウン: select#csv_pulldown（index.twig:512）
 *  - 先頭オプション label: trans admin.product.custom_csv_export=「カスタムデータCSVダウンロード」（index.twig:513 / messages.ja.yaml:2049）
 *  - 拡張オプション: 各 ProductCsvExtensions の url('admin_product_all_csv_custom_export',{csvExtensionId})（index.twig:514-516）
 *  - 末尾オプション label: trans admin.setting.shop.custom_csv_setting=「カスタムCSV出力項目設定」、value=url('admin_setting_shop_csv_custom',{csvTypeId:1})（index.twig:517 / messages.ja.yaml:3901）
 *  - JS: #csv_pulldown change で値が非空なら window.location.href へ遷移（index.twig:118-123）
 *
 * ルート（src/Eccube/Controller）:
 *  - 商品一覧 admin_product = /<route>/product（ProductController.php:122）
 *  - ダウンロード admin_product_all_csv_custom_export = GET /<route>/product/product_all_csv_custom_export/{csvExtensionId}（ProductCsvController.php:211）
 *  - 設定 admin_setting_shop_csv_custom = /<route>/setting/shop/custom_csv/{csvTypeId}/{csvExtensionId}（CustomerCsvController.php:46）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductCustomCsvExportPage {
  readonly page: Page;
  readonly productListUrl: string; // 商品一覧（admin_product）
  readonly customCsvSettingPath: string; // 設定画面の固定先頭 /setting/shop/custom_csv/1

  readonly csvPulldown: Locator; // select#csv_pulldown（index.twig:512）
  readonly options: Locator; // 全 option（index.twig:513-517）

  constructor(page: Page) {
    this.page = page;
    this.productListUrl = `/${ECCUBE_ADMIN_ROUTE}/product`;
    // 設定オプションは csvTypeId=1（CsvType::CSV_TYPE_PRODUCT）固定（index.twig:517）。末尾 csvExtensionId は既定 null。
    this.customCsvSettingPath = `/${ECCUBE_ADMIN_ROUTE}/setting/shop/custom_csv/1`;

    this.csvPulldown = page.locator("#csv_pulldown");
    this.options = this.csvPulldown.locator("option");
  }

  async gotoProductList() {
    await this.page.goto(this.productListUrl);
  }

  /** ダウンロードURL（admin_product_all_csv_custom_export）を任意の拡張IDで組み立てる。 */
  downloadUrl(csvExtensionId: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/product_all_csv_custom_export/${csvExtensionId}`;
  }

  /**
   * プルダウンの拡張オプション（先頭の空値・末尾の設定オプションを除く）の value(=ダウンロードURL) 一覧。
   * シードされた商品CSV拡張が無ければ空配列になる（テスト側で skip 判定する）。
   */
  async extensionOptionValues(): Promise<string[]> {
    const values = await this.options.evaluateAll((opts) =>
      opts
        .map((o) => (o as HTMLOptionElement).value)
        .filter((v) => v && v.includes("product_all_csv_custom_export"))
    );
    return values;
  }

  /** 先頭オプション（空値・ラベル「カスタムデータCSVダウンロード」）の表示文言。 */
  async firstOptionLabel(): Promise<string> {
    return (await this.options.first().innerText()).trim();
  }

  /**
   * 末尾の設定オプション。実装の表示文言ではなく設計由来のルート（setting/shop/custom_csv）を
   * value に含むことで識別する（オラクル独立性: 翻訳文言を選択キーにしない）。
   */
  settingOption(): Locator {
    return this.csvPulldown.locator('option[value*="setting/shop/custom_csv"]');
  }

  /**
   * プルダウンで拡張オプションを選び、ダウンロード発火を待つ。
   * change ハンドラ（index.twig:118-123）が window.location.href へ遷移し、CSVが添付ダウンロードされる。
   */
  async selectExtensionAndWaitDownload(optionValue: string): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.csvPulldown.selectOption(optionValue),
    ]);
    return download;
  }

  /** 商品一覧にプルダウンと先頭オプションが仕様どおり表示されること。 */
  async seePulldown() {
    await expect(this.csvPulldown).toBeVisible();
    // 先頭オプションは設計書の「カスタムデータ CSV ダウンロード」相当。
    // オラクル独立性: 実装trans文言を固定せず、空白有無を許容する意味ベースの部分一致で判定（付帯表4#1）。
    await expect(this.options.first()).toHaveText(/カスタムデータ\s*CSV\s*ダウンロード/);
  }
}
