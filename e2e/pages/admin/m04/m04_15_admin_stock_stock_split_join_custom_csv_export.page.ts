import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 在庫管理「在庫分割結合情報カスタムCSV出力」Page Object（M04-15）。
 * 納品ケース表 integration_test/e2e/m04_15_admin_stock_stock_split_join_custom_csv_export_e2e_cases.md に対応。
 *
 * 重要（screenExists = false）: 刷新先 ec-cube-enterprise には在庫分割結合の「カスタムCSV出力」専用ルート・
 * 入口UI・出力サービスが**未実装**である（設計書「実装状況（重要・実装要確認）」と実装確認が一致）。
 *  - StockSplitJoinController（src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php）は固定列出力
 *    admin_stock_split_join_csv_export（:210-219, M04-14）のみで、csvExtensionId を受ける custom-csv ルートが無い。
 *  - 在庫分割結合一覧 stock_split_join_index.twig:292 は固定列リンク（trans admin.stock.split_join.csv_export
 *    「在庫分割結合CSV出力」, messages.ja.yaml:4656）のみで、カスタムCSV入口（プルダウン）は無い。
 *  - CSV種別マスタ CsvType::CSV_TYPE_STOCK_SPLIT=12（Entity/Master/CsvType.php:87）と CustomCsvType::CSV_TYPES
 *    （Form/Type/Admin/CustomCsvType.php:40）に枠はあるが、出力経路が無い。
 * したがってカスタムCSV出力のセレクタは**創作しない＝要実機確認**とし、実装する場合の倣い先（参照実装）を示すに留める。
 *
 * 期待結果は仕様（functions/ec-cube-enterprise/m04-15_admin_stock_stock_split_join_custom_csv_export.md / Excel原典）由来
 * （オラクル独立性）。本機能は GET ダウンロード想定であり、CSV の中身（列・並び・在庫分割結合ID昇順・結合データ一致）は
 * 手動確認とする。自動化はダウンロード発火・HTTP応答・添付配信・404・遷移・入口UIに限る（いずれも実装後に有効化）。
 *
 * 倣い先（参照実装・位置情報のみ）:
 *  - 在庫分割結合一覧 admin_stock_split_join_list = GET/POST /<route>/product/stock/split-join（StockSplitJoinController.php:90）
 *  - 固定列出力 admin_stock_split_join_csv_export = GET /<route>/product/stock/split-join/csv-export（同:210）
 *  - 参照: 在庫一覧カスタムCSV admin_stock_list_custom_csv = GET /<route>/product/stock/custom-csv/{csvExtensionId}
 *    （StockListController.php:270。不存在/種別不一致で404 :281-284。プルダウン #stock_csv_pulldown stock_list_index.twig:452）
 *  - 設定 admin_setting_shop_csv_custom = /<route>/setting/shop/custom_csv/{csvTypeId}（別機能・本書対象外）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class StockStockSplitJoinCustomCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // 在庫分割結合一覧（admin_stock_split_join_list・実在）

  // 在庫分割結合一覧の検索ボタン（実在・倣い先）。検索結果があると固定列CSV出力リンクが表示される
  // （stock_split_join_index.twig:291 if stockSplitJoinSearchPerformed → :292）。
  readonly searchButton: Locator;
  // 固定列CSV出力リンク（実在・M04-14。カスタムCSV入口ではない）。
  readonly fixedCsvExportLink: Locator;
  // カスタムCSV出力の入口（プルダウン/リンク）は未実装＝要実機確認。創作しないため Locator を定義しない。

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/split-join`;

    // 検索ボタンは submit（DOM id 無し。stock_split_join_index.twig:280）。文言オラクル化を避け type=submit で位置指定。
    this.searchButton = this.page.locator('form button[type="submit"]');
    // 固定列CSV出力リンクは href=route 由来で識別（admin_stock_split_join_csv_export, twig:292）。
    // 文言「在庫分割結合CSV出力」(messages.ja.yaml:4656)をオラクル化せず、ルート由来の href で位置指定する。
    this.fixedCsvExportLink = page.locator('a[href*="/product/stock/split-join/csv-export"]');
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /**
   * 設計書「利用者視点の入口」想定のカスタムCSV出力URL。
   * **未実装**（要追加）。在庫分割結合側に該当ルートは存在せず、設計書も「未実装・要追加」としか規定しないため、
   * 具体的なパスを創作しない（ルート創作禁止）。実装が追加された後、実在ルート定義（@Route name/path）を file:line で
   * 確認してから本メソッドを確定する。それまで呼び出しは失敗させ、誤った URL でのテスト成立を防ぐ。
   */
  plannedCustomCsvExportUrl(_csvExtensionId: number | string): string {
    throw new Error(
      "未確定: 在庫分割結合カスタムCSV出力ルートは刷新先に未実装（要追加）。パスを創作しない。" +
        "実装後に実在ルート(@Route path/name)を file:line で確認して確定すること。"
    );
  }

  /** 固定列出力URL（admin_stock_split_join_csv_export・実在。M04-14。比較・参考用）。 */
  fixedCsvExportUrl(): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/stock/split-join/csv-export`;
  }

  /** 在庫分割結合一覧で検索を実行する（固定列CSV出力リンク表示の前段。倣い先の挙動）。 */
  async submitSearch() {
    await Promise.all([
      this.page.waitForLoadState("networkidle"),
      this.searchButton.click(),
    ]);
  }

  /**
   * カスタムCSV出力（実装後）でフォーマットを選択しダウンロード発火を待つ想定。
   * 入口/ルートが未実装のため、実装後に在庫一覧方式（プルダウン change → 当該URLへ遷移）に倣って実装する。
   */
  async selectFormatAndWaitDownload(_optionValue: string): Promise<Download> {
    // 要実機確認: カスタムCSV入口（#stock_csv_pulldown 相当）未実装。実装後に倣い先 stock_list_index.twig:781 を参照。
    throw new Error("未実装: 在庫分割結合カスタムCSV出力の入口/ルートが刷新先に存在しない（要実機確認）");
  }

  /** 在庫分割結合一覧が表示されること（実在画面の到達確認）。 */
  async seeList() {
    await expect(this.page).toHaveURL(new RegExp(`/product/stock/split-join`));
  }
}
