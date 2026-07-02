import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 在庫管理「在庫情報カスタムCSV出力」Page Object。
 * 納品ケース表 integration_test/e2e/m04_05_admin_stock_product_stock_custom_csv_export_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m04-05_admin_stock_product_stock_custom_csv_export.md / 観点表)由来
 * （オラクル独立性）。messages.ja.yaml・twig は「セレクタ/位置情報」の出所として参照するのみで、
 * 翻訳文言・ファイル名・Content-Type 等の実装値は合否オラクルにしない。
 * 本機能は GET/POST ダウンロードであり、CSVの中身（列・行・rank順・検索条件一致）は手動確認とする。
 * 自動化はダウンロード発火・HTTP応答・添付配信・404・遷移・UI部品に限る。
 * ファイル名（実装位置情報）は stock_custom_{YmdHis}.csv（StockCustomCsvExportService.php:59）／設計route側は
 * stock_{YmdHis}.csv（CustomExportCsvController.php:102）だが、設計には命名規定が無いため合否のオラクルにしない。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Stock/stock_list_index.twig）:
 *  - 検索フォーム: #searchStockListForm（stock_list_index.twig:74、action=admin_stock_list）
 *  - 検索ボタン: button[type=submit] trans admin.common.search=「検索」（stock_list_index.twig:412 / messages.ja.yaml:1446）
 *  - プルダウン: select#stock_csv_pulldown（stock_list_index.twig:452。検索結果がある場合のみ表示 :439）
 *  - 先頭オプション label: trans admin.stock.list.custom_csv=「在庫情報カスタムCSV出力」value=""（:453 / messages.ja.yaml:4454）
 *  - 拡張オプション: 各 StockCsvExtensions の url('admin_stock_list_custom_csv',{csvExtensionId})（:454-456、label=CsvEx.name）
 *  - 末尾オプション label: trans admin.stock.list.custom_csv_settings=「出力項目設定」value=url('admin_setting_shop_csv_custom',{csvTypeId:CSV_TYPE_STOCK})（:457 / messages.ja.yaml:4456）
 *  - JS: #stock_csv_pulldown change で値が非空なら window.location.href=値 で当該URLへ遷移（stock_list_index.twig:781）
 *
 * ルート（src/Eccube/Controller）:
 *  - 在庫一覧 admin_stock_list = GET/POST /<route>/product/stock（StockListController.php:94）
 *  - 刷新UIのダウンロード admin_stock_list_custom_csv = GET /<route>/product/stock/custom-csv/{csvExtensionId}（StockListController.php:270。
 *    セッション検索条件が必須・GET限定。設計の入口と異なる＝不具合候補#1/#2）
 *  - 設計の入口 admin_custom_export = GET/POST /<route>/custom_csv/export/{csvExtensionId}（CustomExportCsvController.php:72。
 *    汎用・在庫種別対応・検索前提なし。設計書「利用者視点の入口」と一致）
 *  - 設定 admin_setting_shop_csv_custom = /<route>/setting/shop/custom_csv/{csvTypeId}（CustomerCsvController.php:46）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class StockProductStockCustomCsvExportPage {
  readonly page: Page;
  readonly stockListUrl: string; // 在庫一覧（admin_stock_list）

  readonly searchForm: Locator; // #searchStockListForm（stock_list_index.twig:74）
  readonly searchButton: Locator; // 検索ボタン（:412 trans admin.common.search）
  readonly csvPulldown: Locator; // select#stock_csv_pulldown（:452）
  readonly options: Locator; // 全 option（:453-457）

  constructor(page: Page) {
    this.page = page;
    this.stockListUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock`;

    this.searchForm = page.locator("#searchStockListForm");
    this.searchButton = this.searchForm.getByRole("button", { name: "検索", exact: true });
    this.csvPulldown = page.locator("#stock_csv_pulldown");
    this.options = this.csvPulldown.locator("option");
  }

  async gotoStockList() {
    await this.page.goto(this.stockListUrl);
  }

  /**
   * 在庫一覧で検索を実行する。刷新先はプルダウン表示・カスタムCSV出力ともに
   * セッション検索条件を必要とする（StockListController.php:273-278）ため、ダウンロード系の前段で呼ぶ。
   * 条件未指定で送信＝全件相当（検索結果が空なら呼び出し側で skip 判定する）。
   */
  async submitSearch() {
    // クリックでフォーム送信→再描画。待機開始がクリック前に即時解決しないよう、
    // クリック後に load/networkidle を待つ（検索結果再描画を確実に待機する）。
    await this.searchButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /** 刷新UIのダウンロードURL（admin_stock_list_custom_csv）。プルダウンの拡張オプションが指す。 */
  stockExportUrl(csvExtensionId: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/stock/custom-csv/${csvExtensionId}`;
  }

  /** 設計書「利用者視点の入口」のダウンロードURL（admin_custom_export・汎用・検索前提なし）。 */
  designExportUrl(csvExtensionId: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/custom_csv/export/${csvExtensionId}`;
  }

  /**
   * プルダウンの拡張オプション（先頭の空値・末尾の設定オプションを除く）の value(=ダウンロードURL) 一覧。
   * シードされた在庫CSV拡張が無ければ空配列になる（テスト側で skip 判定する）。
   */
  async extensionOptionValues(): Promise<string[]> {
    return this.options.evaluateAll((opts) =>
      opts
        .map((o) => (o as HTMLOptionElement).value)
        .filter((v) => v && v.includes("product/stock/custom-csv/"))
    );
  }

  /** プルダウンの拡張オプション value から csvExtensionId（末尾の数値）を取り出す。IDを創作しない。 */
  async extensionIds(): Promise<string[]> {
    const values = await this.extensionOptionValues();
    return values
      .map((v) => v.match(/custom-csv\/(\d+)/)?.[1])
      .filter((id): id is string => !!id);
  }

  /** 先頭オプション（空値・ラベル「在庫情報カスタムCSV出力」）の表示文言。 */
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
   * change ハンドラ（stock_list_index.twig:781）が当該URLへ遷移し、CSVが添付ダウンロードされる。
   */
  async selectExtensionAndWaitDownload(optionValue: string): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.csvPulldown.selectOption(optionValue),
    ]);
    return download;
  }

  /**
   * 在庫一覧にカスタムCSV出力用プルダウン（操作起点）が表示されること。
   * 観点表IT-25「UI部品」由来の観測。先頭は空値の見出しオプション（構造的に観測）で、
   * 翻訳文言（messages.ja.yaml の実装値）は合否オラクルにしない（オラクル独立性）。
   */
  async seePulldown() {
    await expect(this.csvPulldown).toBeVisible();
    // 先頭オプションは value="" の見出し（stock_list_index.twig:453）。実装文言は固定しない。
    await expect(this.options.first()).toHaveAttribute("value", "");
  }
}
