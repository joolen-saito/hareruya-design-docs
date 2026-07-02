import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店頭買取管理「買取集計データCSV出力」（M06-09）Page Object。
 * 納品ケース表 integration_test/e2e/m06_09_admin_store_purchase_otc_buy_order_summary_csv_export_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/pf-eccube3/m06-09_admin_store_purchase_otc_buy_order_summary_csv_export.md / 観点表)の
 * 挙動由来（オラクル独立性）。i18n/Form制約/Cookie名は期待値に流用しない。
 * pf-eccube3 由来設計だが、刷新先 ec-cube-enterprise に同一画面が実在するためセレクタを導出した:
 *   - GET  admin_otcbuyorder_summary        = /<route>/otcbuyorder/summary（OtcBuyOrderSummaryController.php:49）
 *   - POST admin_otcbuyorder_summary_search = /<route>/otcbuyorder/summary/search（同:68）
 *   - POST admin_otcbuyorder_summary_export = /<route>/otcbuyorder/summary/export（同:113）
 * セレクタは Twig（admin/OtcBuyOrder/summary.twig）＋Symfony Form の
 * getBlockPrefix=`admin_otc_buy_order_summary`（OtcBuyOrderSummaryType.php:88-91）由来の位置情報のみ。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 */
export class StorePurchaseOtcBuyOrderSummaryCsvExportPage {
  readonly page: Page;

  readonly summaryUrl: string; // 買取集計データ画面（検索フォーム）
  readonly searchPath: string; // 検索POST
  readonly exportPath: string; // CSV出力POST

  // 検索フォーム（summary.twig:17 form#search_form）
  readonly searchForm: Locator; // #search_form（summary.twig:17）
  readonly dateFrom: Locator; // 集計日(開始)（summary.twig:28 / id=admin_otc_buy_order_summary_summary_date_from）
  readonly dateTo: Locator; // 集計日(終了)（summary.twig:28 / id=admin_otc_buy_order_summary_summary_date_to）
  readonly section: Locator; // 部門（summary.twig:38 / id=admin_otc_buy_order_summary_section）
  readonly shop: Locator; // 買取店舗（summary.twig:45 / id=admin_otc_buy_order_summary_shop）
  readonly searchButton: Locator; // 「検索する」（summary.twig:57-59 / trans admin.purchase.store.summary.form.search.button:5211）
  readonly resultList: Locator; // 検索後の結果領域（summary.twig:65,111 #result_list）
  readonly csvButton: Locator; // 「CSVダウンロード」（summary.twig:122 id=result_list_main__csv_menu・日別1行以上で描画）

  constructor(page: Page) {
    this.page = page;
    this.summaryUrl = `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/summary`;
    this.searchPath = `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/summary/search`;
    this.exportPath = `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/summary/export`;

    this.searchForm = page.locator("#search_form");
    this.dateFrom = page.locator("#admin_otc_buy_order_summary_summary_date_from");
    this.dateTo = page.locator("#admin_otc_buy_order_summary_summary_date_to");
    this.section = page.locator("#admin_otc_buy_order_summary_section");
    this.shop = page.locator("#admin_otc_buy_order_summary_shop");
    // 検索ボタンは #search_form 内の submit に限定（CSVダウンロードボタンと取り違えない）。
    this.searchButton = page.locator('#search_form button[type="submit"]');
    this.resultList = page.locator("#result_list").first();
    this.csvButton = page.locator("#result_list_main__csv_menu");
  }

  async gotoSummary() {
    await this.page.goto(this.summaryUrl);
  }

  /** 集計日(開始/終了)を入力して検索する。任意で部門・店舗は未選択のまま。 */
  async search(from: string, to: string) {
    await this.dateFrom.fill(from);
    await this.dateTo.fill(to);
    await this.searchButton.click();
  }

  /** 認証済みブラウザコンテキストのセッションを共有して export を直接POSTし、応答を返す。 */
  async postExport(maxRedirects = 0) {
    return this.page.request.post(this.exportPath, { maxRedirects });
  }

  /** 検索フォームが仕様どおり表示されること（集計日入力欄・検索ボタン）。 */
  async seeSearchForm() {
    await expect(this.dateFrom).toBeVisible();
    await expect(this.dateTo).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }

  /** 検索実行後に集計結果領域が表示されること（データ有無を問わず result_list が出る）。 */
  async seeResultArea() {
    await expect(this.resultList).toBeVisible();
  }
}
