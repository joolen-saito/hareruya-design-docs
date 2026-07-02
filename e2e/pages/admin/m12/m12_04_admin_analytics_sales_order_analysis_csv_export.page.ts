import { Locator, Page, expect, Download, APIResponse } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 受注売上分析 CSVダウンロード（M12-04）Page Object。
 * 画面: 集計結果一覧（M12-03）の「CSVダウンロード」リンクから GET /{admin_route}/analysis/sales/export を起動する。
 *   一覧/検索: admin_analysis_sales（GET /analysis/sales）/ admin_analysis_sales_search（POST /analysis/sales/search）
 *   /  CSV出力: admin_analysis_sales_export（GET /analysis/sales/export）
 *   （SalesAnalysisController.php:43/62/97、@admin/Analysis/sales.twig）
 * 期待結果は仕様（正本 functions/pf-eccube3/m12-04_admin_analytics_sales_order_analysis_csv_export.md / 観点表）由来（オラクル独立性）。
 * 設計源は pf-eccube3（HareruyaEc リバース）。刷新先 ec-cube-enterprise との乖離はケース表「付帯表4（不具合候補）」で管理し、
 * テストは仕様どおりに書く（実装が違えば落ちて検出する）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_analysis_sales`（SalesType.php:253-256）由来の位置情報のみ。
 *
 * DOM id / セレクタ根拠（sales.twig は nl -ba 基準）:
 *  - 検索フォーム form#search_form（sales.twig:105, method=post action=admin_analysis_sales_search）
 *  - フリーワード検索 multi → #admin_analysis_sales_multi（sales.twig:108 / SalesType prefix admin_analysis_sales）
 *  - 検索ボタン「検索」 admin.common.search（sales.twig:243-244 button[type=submit].btn-ec-conversion / messages.ja.yaml:1446）
 *  - 検索結果件数 #search_total_count（sales.twig:252、searched 時のみ）
 *  - 結果一覧ブロック #result_list（sales.twig:255、summary に行がある時のみ）
 *  - CSVダウンロードリンク a.btn-ec-regular[href=path(admin_analysis_sales_export)]「CSVダウンロード」 admin.common.csv_download
 *      （sales.twig:260 / messages.ja.yaml:1546、#result_list 内＝summary 行がある時のみ表示）
 *
 * CSV出力（成功時）の観測ポイント（仕様 入出力節）:
 *  - ファイル名 sales_report_<YmdHis>.csv（SalesAnalysisCsvExporterService.php:58）
 *  - Content-Disposition: attachment（同:60）。ダウンロード発火＝画面遷移を伴わない（仕様 画面遷移節）。
 *  - BOM・ヘッダ行内容・列順・平均単価計算・全件出力（件数上限なし）は CSV 内部＝ブラウザ観測外につき手動（ケース表）。
 */
export class AnalyticsSalesOrderAnalysisCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // 集計結果一覧（CSVダウンロードリンクの入口）
  readonly exportUrl: string; // CSV出力エンドポイント

  readonly searchForm: Locator; // form#search_form
  readonly multi: Locator; // #admin_analysis_sales_multi
  readonly searchButton: Locator; // 検索ボタン
  readonly searchTotalCount: Locator; // #search_total_count
  readonly resultList: Locator; // #result_list
  readonly exportLink: Locator; // CSVダウンロードリンク

  // 仕様（入出力節）由来のファイル名パターン: sales_report_ + 出力日時(YmdHis=14桁) + .csv
  static readonly FILENAME_RE = /^sales_report_\d{14}\.csv$/;

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/analysis/sales`;
    this.exportUrl = `/${ECCUBE_ADMIN_ROUTE}/analysis/sales/export`;

    this.searchForm = page.locator("#search_form");
    this.multi = page.locator("#admin_analysis_sales_multi");
    this.searchButton = page.locator(
      '#search_form button[type="submit"]'
    );
    this.searchTotalCount = page.locator("#search_total_count");
    this.resultList = page.locator("#result_list");
    // href は path(admin_analysis_sales_export) で出力されるため末尾 /analysis/sales/export を含む。
    this.exportLink = page.locator(
      `#result_list a[href$="/analysis/sales/export"]`
    );
  }

  async goto() {
    await this.page.goto(this.listUrl);
  }

  /** 集計を実行して検索条件セッションを確立する（フリーワード任意）。検索ボタン押下で POST する。 */
  async search(keyword = "") {
    await this.goto();
    if (keyword) {
      await this.multi.fill(keyword);
    }
    await this.searchButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /** 一覧の「CSVダウンロード」リンク押下でダウンロードを発火させ、Download を返す。 */
  async downloadViaLink(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.exportLink.click(),
    ]);
    return download;
  }

  /** 検索条件セッションが確立済みの状態で CSV 出力を HTTP で取得する（URL 直接相当）。 */
  async requestExport(): Promise<APIResponse> {
    return this.page.request.get(this.exportUrl);
  }

  /** 検索実行後、CSVダウンロードリンクが表示されること（仕様 利用者視点の入口・UI部品）。 */
  async seeExportLink() {
    await expect(this.exportLink).toBeVisible();
    await expect(this.exportLink).toHaveText("CSVダウンロード");
  }
}
