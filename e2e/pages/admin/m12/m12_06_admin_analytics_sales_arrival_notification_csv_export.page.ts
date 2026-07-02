import { Download, Locator, Page, expect } from "@playwright/test";
import { readFile } from "fs/promises";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 売上分析「入荷通知依頼 CSVダウンロード」Page Object。
 * 納品ケース表 integration_test/e2e/m12_06_admin_analytics_sales_arrival_notification_csv_export_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m12-06_admin_analytics_sales_arrival_notification_csv_export.md)由来
 * （オラクル独立性）。本機能は入荷通知依頼の検索結果一覧（M12-05）から GET リンクで CSV をダウンロードする。
 * CSVのヘッダ列順・先頭BOM・ファイル名は Playwright の download.path()/readFile で自動検証可能（readCsvText）。
 * 期待値は設計書（業務ルールのヘッダ列順・入出力のBOM/ファイル名）由来でオラクル独立。
 * CSV本文の各セル値・エンコード・抽出の一覧一致（行内容）は手動確認とする。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Analysis/product_request.twig）:
 *  - 検索フォーム: form#search_form（twig:24, method POST action=admin_analysis_product_request_search）
 *  - キーワード入力: #admin_analysis_product_request_multi（searchForm.multi twig:31 / blockPrefix=admin_analysis_product_request SearchProductRequestType.php:126・twig:16）
 *  - 検索実行ボタン: form#search_form 内 button.btn-ec-conversion[type=submit]（twig:110, trans admin.common.search=「検索」messages.ja.yaml:1446）
 *  - 検索結果ブロック: #result_list（twig:115, `searched` 時のみ描画 twig:114）
 *  - 「CSVダウンロード」リンク: a.btn-primary href=path('admin_analysis_product_request_export')（twig:121, trans admin.common.csv_download=「CSVダウンロード」messages.ja.yaml:1546。`searched and summary` 時のみ描画 twig:118）
 *  - 結果0件メッセージ: h3.box-title「検索条件に該当するデータがありませんでした。」（twig:153-154, `summary` が空のとき）
 *
 * ルート（src/Eccube/Controller/Admin/Analysis/ProductRequestController.php）:
 *  - 一覧 admin_analysis_product_request = GET /<route>/analysis/product-request（:46）
 *  - 検索 admin_analysis_product_request_search = POST /<route>/analysis/product-request/search（:62）
 *  - 出力 admin_analysis_product_request_export = GET /<route>/analysis/product-request/export（:92）
 *  - ファイル名 request_report_<YmdHis>.csv（ProductRequestCsvExportService.php:62）
 *
 * 設計書のパスは `analysis/request/export` だが実装は `analysis/product-request/export`（ケース表 付帯表4 #1）。
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class AnalyticsSalesArrivalNotificationCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // 入荷通知依頼集計画面（admin_analysis_product_request）
  readonly exportPath: string; // CSV出力 GET ルート（admin_analysis_product_request_export）

  readonly searchForm: Locator; // form#search_form（twig:24）
  readonly searchKeyword: Locator; // #admin_analysis_product_request_multi（twig:31）
  readonly searchButton: Locator; // 検索ボタン（twig:110）
  readonly resultList: Locator; // #result_list（twig:115）
  readonly csvDownloadLink: Locator; // 「CSVダウンロード」リンク（twig:121）
  readonly noData: Locator; // 結果0件メッセージ（twig:154）

  constructor(page: Page) {
    this.page = page;
    // 画面到達・要素特定のための実装ルート（locator/setup用であり期待値オラクルではない）。
    // 設計書のパスは概略 `analysis/request/export`、実装は `analysis/product-request/export`（付帯表4 #1＝要確認）。
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/analysis/product-request`;
    this.exportPath = `/${ECCUBE_ADMIN_ROUTE}/analysis/product-request/export`;

    this.searchForm = page.locator("#search_form");
    this.searchKeyword = page.locator("#admin_analysis_product_request_multi");
    this.searchButton = page.locator("#search_form button[type=submit]");
    this.resultList = page.locator("#result_list");
    // 文言は trans admin.common.csv_download（messages.ja.yaml:1546）由来。位置情報として name で特定する。
    this.csvDownloadLink = page.getByRole("link", { name: "CSVダウンロード" });
    this.noData = page.getByText("検索条件に該当するデータがありませんでした。");
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 検索フォームを送信して結果を描画する（キーワード未指定なら全件相当）。 */
  async search(keyword = "") {
    if (keyword) {
      await this.searchKeyword.fill(keyword);
    }
    await this.searchButton.click();
  }

  /** 一致のないキーワードで検索し、結果0件状態にする。 */
  async searchNoResult(keyword: string) {
    await this.searchKeyword.fill(keyword);
    await this.searchButton.click();
  }

  /** 「CSVダウンロード」を押し、ダウンロード発火を待って Download を返す（結果あり前提）。 */
  async downloadCsv(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.csvDownloadLink.click(),
    ]);
    return download;
  }

  /**
   * ダウンロードしたCSVの全文（BOM含む）をUTF-8文字列で返す。
   * ヘッダ列順・先頭BOM・ファイル名の自動検証用（オラクルは設計書由来）。
   * CSV本文の各セル値・エンコードの厳密判定は手動とする。
   */
  async readCsvText(download: Download): Promise<string> {
    const path = await download.path();
    return readFile(path, "utf-8");
  }

  /** 検索フォーム・検索ボタンが仕様どおり表示されること。 */
  async seeSearchForm() {
    await expect(this.searchForm).toBeVisible();
    await expect(this.searchKeyword).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }
}
