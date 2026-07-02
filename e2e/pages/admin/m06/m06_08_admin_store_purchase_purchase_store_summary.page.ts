import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店頭買取管理 買取集計データ（検索・一覧表示）（M06-08）Page Object。
 * 納品ケース表 integration_test/e2e/m06_08_admin_store_purchase_purchase_store_summary_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/pf-eccube3/m06-08_admin_store_purchase_purchase_store_summary.md / 観点表)の挙動由来（オラクル独立性）。
 * i18n リソースの表示文言・Form制約(required)は実装由来のためオラクルにせず、観測挙動（一覧描画可否・遷移先URL・空メッセージ）で判定する。
 * pf-eccube3(HareruyaEc)由来の設計だが、刷新先 ec-cube-enterprise に同一画面が実在するためセレクタを導出した。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_otc_buy_order_summary`（OtcBuyOrderSummaryType.php:88-91）由来の位置情報のみ。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * DOM id 根拠（getBlockPrefix=admin_otc_buy_order_summary）:
 *  - 検索フォーム      → #search_form（summary.twig:17 form name=search_form method=post action=admin_otcbuyorder_summary_search）
 *  - summary_date_from → #admin_otc_buy_order_summary_summary_date_from（summary.twig:28 form_widget / OtcBuyOrderSummaryType.php:58-62 DateType single_text）
 *  - summary_date_to   → #admin_otc_buy_order_summary_summary_date_to（summary.twig:28 / :63-67）
 *  - section           → #admin_otc_buy_order_summary_section（summary.twig:38 / :75-80 EntityType multiple）
 *  - shop              → #admin_otc_buy_order_summary_shop（summary.twig:45 / :68-74 EntityType multiple）
 *  - 検索ボタン        → button.searchBtn trans admin.purchase.store.summary.form.search.button（summary.twig:57-58）
 *  - 検索結果ブロック  → #result_list（searched 真のみ描画。集計ブロック summary.twig:65 と日別ブロック summary.twig:111 で
 *                        同一id #result_list が2回出力されるため locator は2要素を返す。存在判定は .first()/count を用いる）
 *  - 集計見出し「集計」 → summary.twig:72 / 期間全体空メッセージ summary.twig:105
 *  - 日別見出し「日別」 → summary.twig:118 / 日別空メッセージ summary.twig:158
 *  - CSVダウンロード   → #result_list_main__csv_menu（summary.twig:122 / form action=admin_otcbuyorder_summary_export）
 *  - 部門未設定表示    → MtbSection::NO_SECTION「未設定」（summary.twig:93,146）
 */
export class StorePurchasePurchaseStoreSummaryPage {
  readonly page: Page;
  readonly url: string; // GET 初期表示
  readonly searchActionUrl: string; // POST 検索
  readonly exportActionUrl: string; // POST CSV出力

  readonly searchForm: Locator; // #search_form
  readonly dateFrom: Locator; // 集計日（開始）
  readonly dateTo: Locator; // 集計日（終了）
  readonly section: Locator; // 部門
  readonly shop: Locator; // 買取店舗
  readonly searchButton: Locator; // 検索ボタン
  readonly resultList: Locator; // 検索結果ブロック #result_list（集計/日別で2要素。存在判定は first()/count）
  readonly csvButton: Locator; // CSVダウンロード

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/summary`;
    this.searchActionUrl = `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/summary/search`;
    this.exportActionUrl = `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/summary/export`;

    this.searchForm = page.locator("#search_form");
    this.dateFrom = page.locator("#admin_otc_buy_order_summary_summary_date_from");
    this.dateTo = page.locator("#admin_otc_buy_order_summary_summary_date_to");
    this.section = page.locator("#admin_otc_buy_order_summary_section");
    this.shop = page.locator("#admin_otc_buy_order_summary_shop");
    this.searchButton = page.locator("#search_form button.searchBtn");
    this.resultList = page.locator("#result_list");
    this.csvButton = page.locator("#result_list_main__csv_menu");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 集計日の開始・終了を入力して検索する（select2の部門/店舗は未選択のまま）。 */
  async search(dateFrom: string, dateTo: string) {
    // select2 が input をオーバーレイするため、値はネイティブ input に直接 fill する。
    await this.dateFrom.fill(dateFrom);
    await this.dateTo.fill(dateTo);
    await this.searchButton.click();
  }

  /** 検索フォームの主要UI部品が仕様どおり表示されること。 */
  async seeSearchForm() {
    await expect(this.searchForm).toBeVisible();
    await expect(this.dateFrom).toBeVisible();
    await expect(this.dateTo).toBeVisible();
    await expect(this.section).toBeAttached();
    await expect(this.shop).toBeAttached();
    await expect(this.searchButton).toBeVisible();
  }

  /** GET初期表示では検索結果一覧ブロックを出さないこと（searched 偽）。 */
  async seeNoResultBlock() {
    await expect(this.resultList).toHaveCount(0);
  }
}
