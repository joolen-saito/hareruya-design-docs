import { Locator, Page } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 入荷通知リクエストキャンセルバッチ（B02-02）UIレイヤ Page Object。
 * 納品ケース表 integration_test/e2e/b02_02_batch_product_product_arrival_notification_cancel_e2e_cases.md に対応。
 *
 * 役割: 論理削除の副作用（入荷通知リクエストの deleted_at 設定）を、入荷待ち分析画面の
 *  「通知待ち（deleted_at IS NULL 集計）／削除」列で観測する（E2E-024）。
 *  期待は仕様（副作用「入荷通知リクエストの論理削除」正本md:106／IT-05）由来（オラクル独立性）。
 *  ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * セレクタ根拠（Twig file:line／Controller file:line）:
 *  src/Eccube/Resource/template/admin/Analysis/product_request.twig
 *  - 検索フォーム  → #search_form（twig:24 form name=search_form action=admin_analysis_product_request_search）
 *  - 検索ボタン    → #search_form button[type=submit]（twig:110 trans admin.common.search=「検索」）
 *  - 集計表ヘッダ  → th「通知待ち」（twig:133 相当）／th「削除」（twig:134 相当）
 *  - 集計表セル    → td 通知待ち=row.pending_count（twig:143）／td 削除=row.deleted_count（twig:144）。td 位置指定（個別idなし）。
 *  入口URL: GET /{admin_route}/analysis/product-request（admin_analysis_product_request, ProductRequestController.php:46）。
 *  検索POST: admin_analysis_product_request_search（ProductRequestController.php:62）。
 */
export class ArrivalNotificationAnalysisPage {
  readonly page: Page;
  readonly url: string;
  readonly searchForm: Locator;
  readonly searchButton: Locator;
  /** 集計表「通知待ち」列ヘッダ（twig:133 相当）。 */
  readonly pendingHeader: Locator;
  /** 集計表「削除」列ヘッダ（twig:134 相当）。 */
  readonly deletedHeader: Locator;
  /** 集計結果行（summary tbody tr）。 */
  readonly summaryRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/analysis/product-request`;
    this.searchForm = page.locator("#search_form"); // twig:24
    this.searchButton = page.locator('#search_form button[type="submit"]'); // twig:110
    this.pendingHeader = page.locator("th", { hasText: "通知待ち" }); // twig:133 相当
    this.deletedHeader = page.locator("th", { hasText: "削除" }); // twig:134 相当
    this.summaryRows = page.locator("table tbody tr");
  }

  /** 入荷待ち分析画面を開く（GET /{admin_route}/analysis/product-request 初期表示）。 */
  async goto() {
    await this.page.goto(this.url);
  }

  /** 検索を実行し集計表を表示する（既定条件で submit）。 */
  async search() {
    await this.searchButton.click();
  }
}
