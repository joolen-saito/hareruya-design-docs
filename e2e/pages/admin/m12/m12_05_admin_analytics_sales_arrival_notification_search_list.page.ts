import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 分析・集計 > 入荷通知依頼 一覧/検索 Page Object（未実行雛形）。
 * 画面: GET /{admin_route}/analysis/product-request（ProductRequestController.php:45 admin_analysis_product_request /
 *   @admin/Analysis/product_request.twig）／検索 POST /{admin_route}/analysis/product-request/search（:62 admin_analysis_product_request_search）。
 * 期待結果は仕様(正本 functions/pf-eccube3/m12-05_admin_analytics_sales_arrival_notification_search_list.md / 観点表 / 基本設計)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_analysis_product_request`（SearchProductRequestType.php:124-127）由来の位置情報のみ。
 *
 * 設計源(pf-eccube3 リバース) ⇔ 刷新先(ec-cube-enterprise) 乖離（ケース表 付帯表4）:
 *  - 入口URLが設計 `/analysis/request`・`/result` ↔ 実装 `/analysis/product-request`・`/.../search`（#1）。本POMは実装ルートを位置情報として用いる。
 *  - 購入状況/購入日/会員名並べ替え/行操作メニュー（規格編集・削除）が刷新先に無い（#2-6）。創作セレクタを置かない＝当該操作は手動/要実機確認。
 *  - 一覧は商品単位の集計表（商品ID/言語/商品名/通知待ち/削除カウント）であり、設計の依頼単位明細とは粒度が異なる（#5）。
 *
 * DOM id / セレクタ根拠（product_request.twig 基準）:
 *  - 検索フォーム form#search_form（twig:24, method=post action=admin_analysis_product_request_search）
 *  - サブタイトル「入荷通知依頼一覧」 admin.analysis.product_request（twig:6 / messages.ja.yaml:5854、default_frame の .c-pageTitle__subTitle へ出力）
 *  - 商品名(日/英)・会員名 multi → #admin_analysis_product_request_multi（twig:31）
 *  - 依頼日From → #admin_analysis_product_request_create_date_from（twig:48、初期値 当月初日）
 *  - 依頼日To → #admin_analysis_product_request_create_date_to（twig:48、初期値 当月末日）
 *  - 販売金額From → #admin_analysis_product_request_price_from（twig:56）/ To → #admin_analysis_product_request_price_to（twig:58）
 *  - 並べ替え sort_key(select) → #admin_analysis_product_request_sort_key（twig:77）
 *  - 昇順/降順(radio expanded) 昇順 → #admin_analysis_product_request_asc_desc_0（ASC, twig:82）/ 降順 → _asc_desc_1（DESC）
 *  - 表示件数 page_count → #admin_analysis_product_request_page_count（twig:88。設計フォームキーは limit＝乖離 付帯表4#7）
 *  - 売上分析タグ tag_sales_analysis(select2) → #admin_analysis_product_request_tag_sales_analysis（twig:97。設計キーは tagSalesAnalyses＝乖離 #8）
 *  - 詳細検索トグル [data-bs-toggle="collapse"][href="#searchDetail"]（twig:35）/ ブロック #searchDetail（twig:43）
 *  - 検索ボタン「検索」 admin.common.search（twig:110 / messages.ja.yaml:1446）= #search_form button[type="submit"]
 *  - 検索結果領域 #result_list（twig:115、searched=true のときのみ出力）
 *  - 一覧テーブル #result_list_main__list table.table（twig:125-127）
 *  - CSVダウンロード #result_list__menu a.btn-primary 「CSVダウンロード」 admin.common.csv_download（twig:121 / messages.ja.yaml:1546。M12-06委譲）
 *  - 0件見出し .box-title「検索条件に該当するデータがありませんでした。」（twig:154、ハードコード＝付帯表4#10）
 */
export class AnalyticsSalesArrivalNotificationSearchListPage {
  readonly page: Page;
  readonly listUrl: string;

  readonly subTitle: Locator; // .c-pageTitle__subTitle「入荷通知依頼一覧」
  readonly searchForm: Locator; // form#search_form
  readonly multi: Locator; // #admin_analysis_product_request_multi（商品名/会員名）
  readonly createDateFrom: Locator; // #..._create_date_from（依頼日From）
  readonly createDateTo: Locator; // #..._create_date_to（依頼日To）
  readonly priceFrom: Locator; // #..._price_from（販売金額From）
  readonly priceTo: Locator; // #..._price_to（販売金額To）
  readonly sortKey: Locator; // #..._sort_key（並べ替え）
  readonly ascRadio: Locator; // #..._asc_desc_0（昇順）
  readonly descRadio: Locator; // #..._asc_desc_1（降順）
  readonly pageCount: Locator; // #..._page_count（表示件数）
  readonly tagSalesAnalysis: Locator; // #..._tag_sales_analysis（売上分析タグ）
  readonly detailToggle: Locator; // 詳細検索トグル
  readonly detailBlock: Locator; // #searchDetail
  readonly searchButton: Locator; // 検索ボタン
  readonly resultList: Locator; // #result_list（検索結果領域）
  readonly resultTable: Locator; // 一覧テーブル
  readonly csvDownload: Locator; // CSVダウンロードリンク
  readonly emptyMessage: Locator; // 0件見出し

  constructor(page: Page) {
    this.page = page;
    // 実装ルート（位置情報）。設計URL `/analysis/request` との乖離は付帯表4#1。
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/analysis/product-request`;

    this.subTitle = page.locator(".c-pageTitle__subTitle");
    this.searchForm = page.locator("#search_form");
    this.multi = page.locator("#admin_analysis_product_request_multi");
    this.createDateFrom = page.locator(
      "#admin_analysis_product_request_create_date_from"
    );
    this.createDateTo = page.locator(
      "#admin_analysis_product_request_create_date_to"
    );
    this.priceFrom = page.locator("#admin_analysis_product_request_price_from");
    this.priceTo = page.locator("#admin_analysis_product_request_price_to");
    this.sortKey = page.locator("#admin_analysis_product_request_sort_key");
    this.ascRadio = page.locator("#admin_analysis_product_request_asc_desc_0");
    this.descRadio = page.locator("#admin_analysis_product_request_asc_desc_1");
    this.pageCount = page.locator("#admin_analysis_product_request_page_count");
    this.tagSalesAnalysis = page.locator(
      "#admin_analysis_product_request_tag_sales_analysis"
    );
    this.detailToggle = page.locator(
      '[data-bs-toggle="collapse"][href="#searchDetail"]'
    );
    this.detailBlock = page.locator("#searchDetail");
    this.searchButton = page.locator('#search_form button[type="submit"]');
    this.resultList = page.locator("#result_list");
    this.resultTable = page.locator("#result_list_main__list table.table");
    this.csvDownload = page.locator("#result_list__menu a.btn-primary");
    // 0件見出し（ハードコード文言。趣旨は仕様「該当データが無い旨」と一致＝付帯表4#10）。
    // 検索結果領域 #result_list 配下に限定（画面内の別 .box-title への誤一致回避）。
    this.emptyMessage = page.locator("#result_list .box-title");
  }

  async goto() {
    await this.page.goto(this.listUrl);
  }

  /** 既定条件のまま検索実行（POST）。 */
  async submitSearch() {
    await this.searchButton.click();
  }

  /** 商品名/会員名キーワードで検索実行。 */
  async searchByKeyword(keyword: string) {
    await this.multi.fill(keyword);
    await this.searchButton.click();
  }

  /** 販売金額Fromに値を入力して検索実行。 */
  async searchByPriceFrom(value: string) {
    await this.priceFrom.fill(value);
    await this.searchButton.click();
  }

  /** 依頼日From/Toを指定して検索実行。 */
  async searchByCreateDateRange(from: string, to: string) {
    await this.createDateFrom.fill(from);
    await this.createDateTo.fill(to);
    await this.searchButton.click();
  }

  /** 検索結果一覧の行ロケータ。 */
  resultRows(): Locator {
    return this.resultTable.locator("tbody tr");
  }

  /** 初期表示のUI部品が仕様どおり表示されていること。 */
  async seeSearchForm() {
    await expect(this.searchForm).toBeVisible();
    await expect(this.multi).toBeVisible();
    await expect(this.createDateFrom).toBeVisible();
    await expect(this.createDateTo).toBeVisible();
    await expect(this.priceFrom).toBeVisible();
    await expect(this.priceTo).toBeVisible();
    await expect(this.sortKey).toBeVisible();
    await expect(this.pageCount).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }
}
