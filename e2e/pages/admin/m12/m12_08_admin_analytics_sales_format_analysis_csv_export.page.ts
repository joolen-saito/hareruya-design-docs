import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 フォーマット売上分析 CSVダウンロード Page Object（未実行雛形・構造参考のみ）。
 *
 * 期待結果は仕様（正本 functions/pf-eccube3/m12-08_admin_analytics_sales_format_analysis_csv_export.md
 * ／観点表 integration-test-viewpoints.md）由来（オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 * セレクタ（位置情報のみ）は ec-cube-enterprise の Twig＋Symfony Form 由来。
 *
 * 画面構成（M12-07 検索画面と同居。CSV出力は検索結果の送信導線として配置）:
 *  - 入口GET   : /{admin_route}/analysis/format-sales      （src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:44）
 *  - 検索POST  : /{admin_route}/analysis/format-sales/search（src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:64）
 *  - 出力(実装): /{admin_route}/analysis/format-sales/export（src/Eccube/Controller/Admin/Analysis/FormatSalesController.php:98＝ハイフン・GET）
 *    ※ 設計書(pf-eccube3)は POST /analysis/format_sales/export（アンダースコア）を正とする。刷新先はハイフン・GET・セッション参照で乖離（付帯表4 #1/#2）。
 *    ※ exportUrl は仕様URL（アンダースコア）を保持しオラクル独立性を担保する（テストを実装に寄せない）。
 *
 * DOM id は Symfony Form getBlockPrefix=`admin_format_sales`
 * （src/Eccube/Form/Type/Admin/Analysis/FormatSalesType.php:87-90）から導出:
 *  - month              → #admin_format_sales_month              （format_sales.twig:103 / FormatSalesType.php:40）
 *  - mail_order_enabled → #admin_format_sales_mail_order_enabled （format_sales.twig:111 / FormatSalesType.php:48・実装独自＝設計書未記載）
 *  - store_enabled      → #admin_format_sales_store_enabled      （format_sales.twig:115 / FormatSalesType.php:52・実装独自＝設計書未記載）
 */
export class AnalyticsSalesFormatAnalysisCsvExportPage {
  readonly page: Page;
  readonly indexUrl: string; // 集計（M12-07）画面の入口
  readonly exportUrl: string; // CSV出力エンドポイント

  // 仕様由来のファイル名プレフィックス（入出力: 成功時出力）。実装は `format_sales_` で乖離（付帯表4 #3）。
  static readonly EXPECTED_FILENAME_RE = /^format_sales_report_\d{14}\.csv$/;

  readonly month: Locator; // 集計月入力（format_sales.twig:103）
  readonly mailOrderEnabled: Locator; // 集計対象(通販) 実装独自（format_sales.twig:111）
  readonly storeEnabled: Locator; // 集計対象(全店舗) 実装独自（format_sales.twig:115）
  readonly searchButton: Locator; // 「検索する」 trans admin.analysis.format_sales.search（format_sales.twig:122 / messages.ja.yaml:5909）
  readonly csvDownloadLink: Locator; // 「CSVダウンロード」 trans admin.common.csv_download（format_sales.twig:136-139 / messages.ja.yaml:1546）
  readonly resultList: Locator; // 検索後にのみ出力される結果領域 #result_list（format_sales.twig:130）

  constructor(page: Page) {
    this.page = page;
    this.indexUrl = `/${ECCUBE_ADMIN_ROUTE}/analysis/format-sales`;
    // 仕様(pf-eccube3)由来のアンダースコアURLを保持（オラクル独立性）。実装のハイフンURLには寄せない（付帯表4 #1）。
    this.exportUrl = `/${ECCUBE_ADMIN_ROUTE}/analysis/format_sales/export`;

    this.month = page.locator("#admin_format_sales_month");
    this.mailOrderEnabled = page.locator("#admin_format_sales_mail_order_enabled");
    this.storeEnabled = page.locator("#admin_format_sales_store_enabled");
    // ボタン文言は trans キー由来（検索＝5909）。CSVダウンロードはリンク（a要素）。
    this.searchButton = page.getByRole("button", { name: "検索する" });
    this.csvDownloadLink = page.getByRole("link", { name: "CSVダウンロード" });
    this.resultList = page.locator("#result_list");
  }

  /** 集計（検索）画面を開く。 */
  async goto() {
    await this.page.goto(this.indexUrl);
  }

  /** export エンドポイントへ直接アクセスする（URL直接アクセス検証用）。 */
  async gotoExport() {
    await this.page.goto(this.exportUrl);
  }

  /**
   * 集計月を設定して検索を実行する。集計月未指定なら画面初期値（当月）のまま検索する。
   * 検索後は CSVダウンロード導線が出る（formats は売上分析タグ＋その他で常に非空）。
   */
  async search(month?: string) {
    if (month !== undefined) {
      await this.month.fill(month);
    }
    await this.searchButton.click();
  }

  /** 検索結果にCSVダウンロード導線が表示されること（仕様: 集計フォームの送信ボタンとして配置）。 */
  async seeCsvDownloadAvailable() {
    await expect(this.csvDownloadLink).toBeVisible();
  }

  /** CSVダウンロードを押下し、発火した Download を返す（内容検証は手動）。 */
  async clickCsvDownload(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.csvDownloadLink.click(),
    ]);
    return download;
  }
}
