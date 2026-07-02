import { Locator, Page } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 販売期間集計バッチ（B02-01）UIレイヤ Page Object。
 * 納品ケース表 integration_test/e2e/b02_01_batch_product_product_sales_period_summary_e2e_cases.md に対応。
 *
 * 役割: 集計結果（期間別販売数）が商品一覧の販売数列に反映される範囲を観測する（E2E-017,018）。
 *  期待は仕様（概要「商品一覧画面に表示する販売数を反映」正本md:5／IT-30）由来（オラクル独立性）。
 *  ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * セレクタ根拠（Twig file:line／Form file:line。無ければ要実機確認）:
 *  src/Eccube/Resource/template/admin/Product/index.twig
 *  - 販売数列ヘッダ    → th 内 admin.product.list_order_quantity（twig:543＝「販売数」）
 *  - 販売数検索 From    → #admin_search_product_order_quantity_from（form name=admin_search_product + 'order_quantity_from' SearchProductType.php:299／twig:364）
 *  - 販売数検索 To      → #admin_search_product_order_quantity_to（SearchProductType.php:307／twig:369）
 *  - 検索ボタン        → #search_form button.admin-product-search-submit（twig:445）
 *  - 結果行            → #search_form table tbody tr
 *  入口URL: GET /{admin_route}/product（admin_product, ProductController.php:122）。
 *  ※ 販売数セルの値セレクタ（行レベルの販売数表示）は要実機確認（付帯表1）。反映先テーブルは dtb_sales_quantity か正本md記載列か要確認（付帯表4-1）。
 */
export class SalesPeriodSummaryProductListPage {
  readonly page: Page;
  readonly url: string;
  /** 販売数列ヘッダ（admin.product.list_order_quantity twig:543＝「販売数」）。 */
  readonly salesHeader: Locator;
  readonly orderQuantityFrom: Locator;
  readonly orderQuantityTo: Locator;
  readonly searchButton: Locator;
  readonly resultRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product`;
    this.salesHeader = page.locator("th", { hasText: "販売数" }); // twig:543
    this.orderQuantityFrom = page.locator("#admin_search_product_order_quantity_from"); // SearchProductType.php:299 / twig:364
    this.orderQuantityTo = page.locator("#admin_search_product_order_quantity_to"); // SearchProductType.php:307 / twig:369
    this.searchButton = page.locator("#search_form button.admin-product-search-submit"); // twig:445
    this.resultRows = page.locator("#search_form table tbody tr");
    // 販売数セルの値セレクタ（行レベル）は要実機確認のため未定義（付帯表1）。
  }

  /** 商品一覧を開く（GET /{admin_route}/product 初期表示）。 */
  async goto() {
    await this.page.goto(this.url);
  }
}
