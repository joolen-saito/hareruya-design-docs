import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 日別/月別集計（集計一覧表示）Page Object。
 * 期待結果は仕様(functions/pf-eccube3/m12-01_admin_analytics_sales_daily_monthly_summary.md / 観点表)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_summary`（SummaryType.php:108-112）由来の位置情報のみ（合否は仕様で判定）。
 *
 * 画面タイプ: summary。集計数値（金額・件数・購買率・会員数 等）はDB/シード依存のため厳密検証は手動。
 * E2Eは検索フォームの表示要素・既定値・検索実行による結果一覧/合計行の出現・権限ガードを対象とする。
 *
 * 重要(仕様乖離): 設計書(pf-eccube3 / HareruyaEc プラグインのリバース)が定める入力項目
 *   「商品名(日/英)・商品コード(multi)」「利用端末(device_type)」「表示項目(注文 columns_order)」「表示項目(明細 columns_product)」
 *   および集計列「来客数・注文・リピート注文数・会員数・購買率(%)」は、刷新先 ec-cube-enterprise の本画面には存在しない。
 *   刷新先は「集計対象=通販/店舗別」のフィルタと、集計列「店舗名・総売上・原価・粗利益高・販売点数・取引数・取引単価(平均)・買取件数・買取金額・廃棄・欠品」を持つ別設計である。
 *   本POMは刷新先に実在するセレクタのみ定義し、設計書固有部品の不在は付帯表4(不具合候補)で要確認とする（創作しない）。
 *
 * DOM 根拠（ec-cube-enterprise 現行ソース）:
 *  - 検索フォーム #search_form action=admin_summary_result（summary.twig:145）
 *  - 検索枠アコーディオン トグル button[data-bs-target="#summarySearchDetail"]（summary.twig:147-158）／ パネル #summarySearchDetail（summary.twig:160）
 *  - 集計タイプ ラジオ（必須・expanded）name=admin_summary[summary_type]（SummaryType.php:43-51 / summary.twig:165）
 *      日次 value=daily（#admin_summary_summary_type_0）／ 月次 value=monthly（#admin_summary_summary_type_1）
 *  - 集計日From #admin_summary_summary_date_from（DateType single_text・必須 SummaryType.php:52-56 / summary.twig:172）
 *  - 集計日To   #admin_summary_summary_date_to（SummaryType.php:57-61 / summary.twig:172）
 *  - 検索ボタン submit trans admin.analysis.summary.search=「検索する」（summary.twig:207-209 / messages.ja.yaml:5605）
 *  - 集計結果リスト #result_list（summary.twig:215。{% if summary %} のため結果がある時のみ描画）
 *  - 集計日見出し th trans admin.analysis.summary.summary_date=「集計日」（summary.twig:230 / messages.ja.yaml:5600）
 *  - 合計行 trans admin.analysis.summary.grand_total=「総合計」（summary.twig:256 / messages.ja.yaml:5606）
 *  - CSVダウンロード #result_list_main__csv_menu（admin_summary_export。CSV内容はM12-02の範囲）（summary.twig:220）
 */
export class AnalyticsSalesDailyMonthlySummaryPage {
  readonly page: Page;
  readonly dailyUrl: string; // 日別集計エントリ（GET）
  readonly monthlyUrl: string; // 月別集計エントリ（GET）

  readonly searchForm: Locator; // #search_form
  readonly searchDetailToggle: Locator; // 検索枠表示・非表示トグル
  readonly searchDetailPanel: Locator; // #summarySearchDetail
  readonly summaryTypeGroup: Locator; // #admin_summary_summary_type
  readonly dailyRadio: Locator; // value=daily
  readonly monthlyRadio: Locator; // value=monthly
  readonly dateFrom: Locator; // #admin_summary_summary_date_from
  readonly dateTo: Locator; // #admin_summary_summary_date_to
  readonly searchButton: Locator; // 「検索する」
  readonly resultList: Locator; // #result_list（結果がある時のみ）
  readonly resultDateHeader: Locator; // 集計日 見出し
  readonly grandTotalCell: Locator; // 「総合計」
  readonly csvDownloadLink: Locator; // #result_list_main__csv_menu

  constructor(page: Page) {
    this.page = page;
    this.dailyUrl = `/${ECCUBE_ADMIN_ROUTE}/analysis/summary/daily`;
    this.monthlyUrl = `/${ECCUBE_ADMIN_ROUTE}/analysis/summary/monthly`;

    this.searchForm = page.locator("#search_form");
    this.searchDetailToggle = page.locator('[data-bs-target="#summarySearchDetail"]');
    this.searchDetailPanel = page.locator("#summarySearchDetail");
    this.summaryTypeGroup = page.locator("#admin_summary_summary_type");
    this.dailyRadio = page.locator('input[name="admin_summary[summary_type]"][value="daily"]');
    this.monthlyRadio = page.locator('input[name="admin_summary[summary_type]"][value="monthly"]');
    this.dateFrom = page.locator("#admin_summary_summary_date_from");
    this.dateTo = page.locator("#admin_summary_summary_date_to");
    this.searchButton = page.locator('#search_form button[type="submit"]');
    this.resultList = page.locator("#result_list");
    this.resultDateHeader = page.locator("#result_list th", { hasText: "集計日" });
    this.grandTotalCell = page.locator("#result_list td", { hasText: "総合計" });
    this.csvDownloadLink = page.locator("#result_list_main__csv_menu");
  }

  async gotoDaily() {
    await this.page.goto(this.dailyUrl);
  }

  async gotoMonthly() {
    await this.page.goto(this.monthlyUrl);
  }

  /** 検索フォームの基本部品（集計タイプ・集計日From/To・検索ボタン）が表示されること（仕様: フロント挙動 表示要素）。 */
  async seeSearchForm() {
    await expect(this.dailyRadio).toBeAttached();
    await expect(this.monthlyRadio).toBeAttached();
    await expect(this.dateFrom).toBeVisible();
    await expect(this.dateTo).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }

  /** 現在チェック中の集計タイプ値（daily/monthly）を返す。 */
  async checkedSummaryType(): Promise<string> {
    if (await this.dailyRadio.isChecked()) return "daily";
    if (await this.monthlyRadio.isChecked()) return "monthly";
    return "";
  }

  async dateFromValue(): Promise<string> {
    return (await this.dateFrom.inputValue()).trim();
  }

  async dateToValue(): Promise<string> {
    return (await this.dateTo.inputValue()).trim();
  }

  async fillDateFrom(value: string) {
    await this.dateFrom.fill(value);
  }

  async fillDateTo(value: string) {
    await this.dateTo.fill(value);
  }

  async clearDateFrom() {
    await this.dateFrom.fill("");
  }

  async clearDateTo() {
    await this.dateTo.fill("");
  }

  async submitSearch() {
    await this.searchButton.click();
  }

  /** 集計結果一覧と合計行が表示されること（仕様: 集計結果一覧と合計行を同一画面に表示）。 */
  async seeResultList() {
    await expect(this.resultList).toBeVisible();
    await expect(this.grandTotalCell).toBeVisible();
  }

  /** 集計結果一覧が表示されないこと（初期表示=集計結果は空 / 集計されない）。 */
  async expectNoResultList() {
    await expect(this.resultList).toHaveCount(0);
  }
}
