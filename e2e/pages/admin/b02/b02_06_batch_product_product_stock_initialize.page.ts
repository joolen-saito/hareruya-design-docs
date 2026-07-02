import { Locator, Page } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 在庫初期化バッチ（B02-06）UIレイヤ Page Object。
 * 納品ケース表 integration_test/e2e/b02_06_batch_product_product_stock_initialize_e2e_cases.md に対応。
 *
 * 役割: バッチが作成する在庫減算履歴（変動区分・在庫変動理由・変動数）を、在庫承認画面の在庫変動履歴で観測する
 *  （E2E-003,004,021,022,023）。期待は仕様（業務ルール「変動区分＝受注（在庫減算）／メモ＝注文番号と価格を含む文言」
 *  正本md:90-92／副作用「在庫履歴の追加」正本md:116／IT-30,IT-16）由来（オラクル独立性）。
 *  ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * セレクタ根拠（Route file:line／Twig file:line。無ければ要実機確認）:
 *  到達経路＝在庫承認画面 route `admin_stock_approval_new`
 *   （GET /%eccube_admin_route%/product/stock/{productStockId}/stock-approval/new、StockApprovalController.php:54、テンプレート @admin/Stock/approval.twig）。
 *  在庫変動履歴セル（src/Eccube/Resource/template/admin/Stock/stock_change_history.twig）:
 *   - 変動区分セル      → admin.stock.edit.history.change_type_detail（twig:22-25。stock_change_type_detail_id の表示）
 *   - 在庫変動理由セル  → admin.stock.history.stock_change_reason_column（twig:40-46。stock_change_reason の表示）
 *   - 変動数セル        → admin.stock.edit.history.change_quantity（列描画は StockChangeHistoryRows、ビルダ StockApprovalController.php:240）
 *  ※ productStockId・行特定（個別td idなし）は要実機確認（付帯表1）。よって本Page Objectは到達経路の構築のみを担い、行照合は実機確認後に実装する。
 */
export class StockInitializeChangeHistoryPage {
  readonly page: Page;
  /** 在庫変動履歴行（stock_change_history.twig:33-46）。行特定は要実機確認。 */
  readonly historyRows: Locator;

  constructor(page: Page) {
    this.page = page;
    this.historyRows = page.locator("table tbody tr"); // stock_change_history.twig:33-46（行特定は要実機確認）
  }

  /**
   * 在庫承認画面（在庫変動履歴を含む）を開く。
   * route admin_stock_approval_new（StockApprovalController.php:54）。productStockId は SEED 依存＝要実機確認。
   */
  async goto(productStockId: string) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/stock/${productStockId}/stock-approval/new`);
  }
}
