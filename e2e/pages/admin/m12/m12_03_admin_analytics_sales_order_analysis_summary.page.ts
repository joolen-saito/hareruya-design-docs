import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 受注/売上分析（集計一覧表示）Page Object。
 * 期待結果は仕様(functions/pf-eccube3/m12-03_admin_analytics_sales_order_analysis_summary.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_analysis_sales`（SalesType.php:253-256）由来の位置情報のみ。
 *
 * 画面: GET /{admin_route}/analysis/sales（初期検索画面）／ POST /{admin_route}/analysis/sales/search（集計実行・同一画面に結果）。
 *   ※設計(pf-eccube3)は集計実行を /analysis/sales/result と記すが、刷新先実装の route は admin_analysis_sales_search
 *     （sales.twig:105 form action / SalesAnalysisController.php:62）＝不具合候補（付帯表4 #1）。POSTは検索ボタン押下で発火する。
 *
 * DOM id 根拠（getBlockPrefix=admin_analysis_sales）:
 *  - multi            → #admin_analysis_sales_multi（sales.twig:108 / placeholder admin.analysis.sales.form.multi.placeholder messages.ja.yaml:5869）
 *  - summary_date_from/to → #admin_analysis_sales_summary_date_from / _summary_date_to（sales.twig:157）
 *  - date_type(ラジオ) → name="admin_analysis_sales[date_type]" value=order_date/...（sales.twig:172 / SalesType.php:113-121, 既定 order_date）
 *  - summary_type(セレクト) → #admin_analysis_sales_summary_type（sales.twig:164 / SalesType.php:122-130, 既定 product_id）
 *  - sort_key(セレクト)  → #admin_analysis_sales_sort_key（sales.twig:181 / SalesType.php:131-139, 既定 summary_type）
 *  - asc_desc(ラジオ)   → name="admin_analysis_sales[asc_desc]" value=ASC/DESC（sales.twig:182 / SalesType.php:140-151, 既定 ASC）
 *  - page_count(セレクト)→ #admin_analysis_sales_page_count（sales.twig:189 / SalesType.php:152-158）
 *  - category_id(セレクト)→ #admin_analysis_sales_category_id（sales.twig:196）
 *  - card_condition(複数チェック)→ name="admin_analysis_sales[card_condition][]"（sales.twig:202）
 *  - tag_sales_analysis/cardset(複数セレクト)→ #admin_analysis_sales_tag_sales_analysis / _cardset（sales.twig:210,215）
 *  - price_from/to・quantity_from/to → #admin_analysis_sales_price_from/_price_to/_quantity_from/_quantity_to（sales.twig:223,231）
 *  - 検索ボタン「検索」trans admin.common.search（sales.twig:243 / messages.ja.yaml:1446）
 *  - 詳細検索トグル → aria-controls="salesSearchDetail"（sales.twig:115）/ 詳細容器 #salesSearchDetail（sales.twig:126）
 *  - 「検索条件をクリア」trans admin.common.search_clear（sales.twig:240 / messages.ja.yaml:1545）
 *  - 結果件数 #search_total_count（sales.twig:252）/ 結果一覧 #result_list__list table（sales.twig:264-265）
 *  - 0件見出し admin.common.search_no_result（sales.twig:313 / messages.ja.yaml:1542）
 *  - CSVダウンロード link admin.common.csv_download（sales.twig:260 / messages.ja.yaml:1546・本体は M12-04）
 *  - 結果列見出し 商品コード/商品名/カテゴリ/平均単価/数量/合計/件数（sales.twig:269-277 / messages.ja.yaml:5896-5902）
 */
export class AnalyticsSalesOrderAnalysisSummaryPage {
  readonly page: Page;
  readonly url: string;

  readonly searchForm: Locator; // #search_form（sales.twig:105）
  readonly multi: Locator; // 汎用ワード
  readonly detailToggle: Locator; // 詳細検索トグル（collapse）
  readonly detail: Locator; // #salesSearchDetail
  readonly summaryDateFrom: Locator; // 集計日From
  readonly summaryDateTo: Locator; // 集計日To
  readonly summaryType: Locator; // 集計単位（select）
  readonly sortKey: Locator; // 並べ替え（select）
  readonly pageCount: Locator; // 表示件数（select）
  readonly categoryId: Locator; // カテゴリ（select）
  readonly cardCondition: Locator; // 状態（カード状態 複数チェック）
  readonly tagSalesAnalysis: Locator; // 売上分析タグ（select）
  readonly cardset: Locator; // カードセット（select）
  readonly priceFrom: Locator; // 平均単価From
  readonly priceTo: Locator; // 平均単価To
  readonly quantityFrom: Locator; // 数量From
  readonly quantityTo: Locator; // 数量To
  readonly searchButton: Locator; // 検索
  readonly searchClearLink: Locator; // 検索条件をクリア

  readonly resultSection: Locator; // #result_list
  readonly resultCount: Locator; // #search_total_count
  readonly resultTable: Locator; // #result_list__list table
  readonly noResultHeading: Locator; // 0件見出し
  readonly csvDownloadLink: Locator; // CSVダウンロード

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/analysis/sales`;

    this.searchForm = page.locator("#search_form");
    this.multi = page.locator("#admin_analysis_sales_multi");
    this.detailToggle = page.locator('[aria-controls="salesSearchDetail"]');
    this.detail = page.locator("#salesSearchDetail");
    this.summaryDateFrom = page.locator("#admin_analysis_sales_summary_date_from");
    this.summaryDateTo = page.locator("#admin_analysis_sales_summary_date_to");
    this.summaryType = page.locator("#admin_analysis_sales_summary_type");
    this.sortKey = page.locator("#admin_analysis_sales_sort_key");
    this.pageCount = page.locator("#admin_analysis_sales_page_count");
    this.categoryId = page.locator("#admin_analysis_sales_category_id");
    // 状態（card_condition）は expanded=true の複数チェック（sales.twig:202 / SalesType.php:167-173）。先頭要素で存在確認。
    this.cardCondition = page.locator('input[name="admin_analysis_sales[card_condition][]"]').first();
    this.tagSalesAnalysis = page.locator("#admin_analysis_sales_tag_sales_analysis");
    this.cardset = page.locator("#admin_analysis_sales_cardset");
    this.priceFrom = page.locator("#admin_analysis_sales_price_from");
    this.priceTo = page.locator("#admin_analysis_sales_price_to");
    this.quantityFrom = page.locator("#admin_analysis_sales_quantity_from");
    this.quantityTo = page.locator("#admin_analysis_sales_quantity_to");
    // 検索ボタンはフォーム内の submit（詳細トグルは type=button のため type 指定で限定する）。
    this.searchButton = page.locator('#search_form button[type="submit"]');
    this.searchClearLink = page.getByRole("link", { name: "検索条件をクリア" });

    this.resultSection = page.locator("#result_list");
    this.resultCount = page.locator("#search_total_count");
    this.resultTable = page.locator("#result_list__list table");
    this.noResultHeading = page.getByText("検索条件に合致するデータが見つかりませんでした");
    this.csvDownloadLink = page.getByRole("link", { name: "CSVダウンロード" });
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 使用日付ラジオ（value=order_date 等）。 */
  dateTypeRadio(value: string): Locator {
    return this.page.locator(`input[name="admin_analysis_sales[date_type]"][value="${value}"]`);
  }

  /** 昇順/降順ラジオ（value=ASC/DESC）。 */
  ascDescRadio(value: string): Locator {
    return this.page.locator(`input[name="admin_analysis_sales[asc_desc]"][value="${value}"]`);
  }

  /** 結果テーブルの列見出し（th）。 */
  resultHeader(name: string): Locator {
    return this.resultTable.locator("thead th", { hasText: name });
  }

  /** 結果テーブル tbody の最終行（合計行）。 */
  totalRow(): Locator {
    return this.resultTable.locator("tbody tr").last();
  }

  /** 検索を実行する（POST /analysis/sales/search）。 */
  async submitSearch() {
    await this.searchButton.click();
  }

  /** 初期表示の検索フォーム主要部品が表示されること（仕様: 検索条件アコーディオン・検索ボタン）。 */
  async seeSearchForm() {
    await expect(this.searchForm).toBeVisible();
    await expect(this.multi).toBeVisible();
    await expect(this.detail).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }
}
