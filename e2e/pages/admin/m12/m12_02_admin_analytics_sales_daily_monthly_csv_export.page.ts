import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 日別/月別集計 CSVダウンロード Page Object（未実行雛形）。
 * 納品ケース表 integration_test/e2e/m12_02_admin_analytics_sales_daily_monthly_csv_export_e2e_cases.md に対応。
 *
 * 期待結果は仕様（正本 functions/pf-eccube3/m12-02_admin_analytics_sales_daily_monthly_csv_export.md／観点表）由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_summary`（SummaryType.php:109-112）由来の位置情報のみ。
 * 設計源は pf-eccube3（HareruyaEc プラグイン）のリバース。刷新先 ec-cube-enterprise との乖離（ファイル名・ヘッダ列・
 * 表示項目固定・セッション空時の挙動）はケース表「付帯表4」に出し、テストは仕様どおりに書く。
 *
 * DOM/位置情報 根拠（ec-cube-enterprise 現行ソース）:
 *  - 集計画面(日次) GET /analysis/summary/daily（SummaryController.php:62）
 *  - 集計画面(月次) GET /analysis/summary/monthly（SummaryController.php:72）
 *  - CSV出力 GET /analysis/summary/export（SummaryController.php:157 admin_summary_export）
 *  - 検索フォーム #search_form（summary.twig:145 action=admin_summary_result POST）
 *  - 集計種別ラジオ name="admin_summary[summary_type]"（summary.twig:89 / SummaryType.php:43-51 expanded）
 *  - 集計開始日 #admin_summary_summary_date_from（summary.twig:90 / SummaryType.php:52-56 single_text）
 *  - 集計終了日 #admin_summary_summary_date_to（summary.twig:91 / SummaryType.php:57-61）
 *  - 検索ボタン #search_form button[type=submit]（summary.twig:206-210 trans admin.analysis.summary.search）
 *  - 集計結果一覧 #result_list（summary.twig:215。{% if summary %} で検索後のみ描画）
 *  - CSVダウンロードリンク #result_list_main__csv_menu（summary.twig:220 文言「CSVダウンロード」）
 */
export class AnalyticsSalesDailyMonthlyCsvExportPage {
  readonly page: Page;
  readonly dailyUrl: string;
  readonly monthlyUrl: string;
  readonly exportUrl: string;

  readonly searchForm: Locator; // #search_form（summary.twig:145）
  readonly summaryTypeRadios: Locator; // name=admin_summary[summary_type]（summary.twig:89）
  readonly dateFrom: Locator; // #admin_summary_summary_date_from（summary.twig:90）
  readonly dateTo: Locator; // #admin_summary_summary_date_to（summary.twig:91）
  readonly searchButton: Locator; // #search_form 内 submit（summary.twig:206-210）
  readonly resultList: Locator; // #result_list（summary.twig:215）
  readonly csvLink: Locator; // #result_list_main__csv_menu（summary.twig:220）

  constructor(page: Page) {
    this.page = page;
    this.dailyUrl = `/${ECCUBE_ADMIN_ROUTE}/analysis/summary/daily`;
    this.monthlyUrl = `/${ECCUBE_ADMIN_ROUTE}/analysis/summary/monthly`;
    this.exportUrl = `/${ECCUBE_ADMIN_ROUTE}/analysis/summary/export`;

    this.searchForm = page.locator("#search_form");
    this.summaryTypeRadios = page.locator(
      'input[name="admin_summary[summary_type]"]'
    );
    this.dateFrom = page.locator("#admin_summary_summary_date_from");
    this.dateTo = page.locator("#admin_summary_summary_date_to");
    this.searchButton = page.locator('#search_form button[type="submit"]');
    this.resultList = page.locator("#result_list");
    this.csvLink = page.locator("#result_list_main__csv_menu");
  }

  async gotoDaily() {
    await this.page.goto(this.dailyUrl);
  }
  async gotoMonthly() {
    await this.page.goto(this.monthlyUrl);
  }

  /**
   * 日次集計画面を開き、初期プリセット日付（当月）のまま検索を実行する。
   * 検索が成立すると検索条件セッション（VIEW_KEY）が保存され、結果一覧とCSVダウンロードリンクが描画される。
   */
  async searchDaily() {
    await this.gotoDaily();
    await this.searchButton.click();
  }

  /**
   * 月別集計画面を開き、初期プリセット日付のまま検索を実行する。
   * 仕様（機能名「日別/月別集計」）：月別でも同一の検索→出力導線が成立する。
   */
  async searchMonthly() {
    await this.gotoMonthly();
    await this.searchButton.click();
  }

  /** 集計結果一覧にCSVダウンロードリンクが表示されること（仕様：検索実行後に出力導線が出る）。 */
  async seeCsvLink() {
    await expect(this.csvLink).toBeVisible();
    await expect(this.csvLink).toContainText("CSVダウンロード");
  }

  /** CSVダウンロードリンクを押下し、ダウンロード発火を待つ（画面遷移は伴わない＝仕様）。 */
  async downloadCsv() {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.csvLink.click(),
    ]);
    return download;
  }
}
