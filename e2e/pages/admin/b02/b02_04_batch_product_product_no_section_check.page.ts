import { Locator, Page } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 部門未設定チェックバッチ（B02-04）UIレイヤ Page Object。
 * 納品ケース表 integration_test/e2e/b02_04_batch_product_product_no_section_check_e2e_cases.md に対応。
 *
 * 役割（重要）: バッチ結果（アラートメール）はUIに反映されない。本Page Objectは
 *  **抽出対象の入力条件（公開中かつ部門未設定／その否定）を商品一覧の検索条件（公開状態・部門）で観測する**
 *  ためのものであり、「バッチ結果のUI観測」ではない（付帯表1注記）。
 *  期待は仕様（抽出条件「公開中かつ部門未設定」正本md:40-43,83／IT-30,IT-16）由来（オラクル独立性）。
 *  ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * セレクタ根拠（Twig file:line／Form file:line。無ければ要実機確認）:
 *  src/Eccube/Resource/template/admin/Product/index.twig
 *  - 検索フォーム      → #search_form（twig:211 form action=admin_product）
 *  - 詳細検索枠        → #searchDetail（twig:231 collapse show・既定展開）
 *  - 公開状態 検索     → #admin_search_product_status（form name=admin_search_product + フィールド 'status' SearchProductType.php:100。ラベル admin.product.display_status=「公開状態」twig:264）
 *  - 部門 検索         → #admin_search_product_section（twig:56,404。ラベル admin.product.section twig:403）
 *  - 検索ボタン        → #search_form button.admin-product-search-submit（twig:445）
 *  - 結果行            → #search_form table tbody tr
 *  入口URL: GET /{admin_route}/product（admin_product, ProductController.php:122）。
 *  ※ 部門「未設定」の具体オプション値・行レベルの部門表示セレクタは要実機確認（付帯表1）。
 */
export class NoSectionCheckProductListPage {
  readonly page: Page;
  readonly url: string;
  readonly searchForm: Locator;
  readonly searchDetail: Locator;
  readonly statusField: Locator;
  readonly sectionField: Locator;
  readonly searchButton: Locator;
  readonly resultRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product`;
    this.searchForm = page.locator("#search_form"); // twig:211
    this.searchDetail = page.locator("#searchDetail"); // twig:231
    this.statusField = page.locator("#admin_search_product_status"); // SearchProductType.php:100 / twig:265
    this.sectionField = page.locator("#admin_search_product_section"); // twig:56,404
    this.searchButton = page.locator("#search_form button.admin-product-search-submit"); // twig:445
    this.resultRows = page.locator("#search_form table tbody tr");
  }

  /** 商品一覧を開く（GET /{admin_route}/product 初期表示）。 */
  async goto() {
    await this.page.goto(this.url);
  }
}
