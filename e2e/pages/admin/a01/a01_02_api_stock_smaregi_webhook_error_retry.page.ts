import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * A01-02 スマレジ Webhook 連携エラー再連携 — UIレイヤ Page Object。
 * 構造参考: ec-cube-enterprise/e2e-tests。本ファイルは設計書(a01-02)＋Twg由来の未実行雛形。
 *
 * 観測対象:
 *  - 在庫検索一覧（admin_stock_list）の在庫数セル（再連携結果の在庫数反映）
 *  - 在庫変動履歴一覧（admin_stock_history）の在庫変動区分セル
 *    （「スマレジ連携（売上）」「スマレジ連携（返品）」「スマレジその他（調整）」の区別）
 *
 * 根拠 file:line（ec-cube-enterprise/src/Eccube）:
 *  - 在庫検索一覧ルート: Controller/Admin/Stock/StockListController.php:94（admin_stock_list = /%eccube_admin_route%/product/stock）
 *  - 在庫検索一覧Twig: Resource/template/admin/Stock/stock_list_index.twig（在庫数列 class=col-stock 定義:30 / 一覧テーブル class=table-stock-list:18）
 *  - 在庫変動履歴ルート: Controller/Admin/Stock/StockHistoryController.php:64（admin_stock_history = /%eccube_admin_route%/product/stock/history）
 *  - 在庫変動履歴Twig: Resource/template/admin/Stock/history.twig
 *      行: <tr id="ex-product-{{ Stock.id }}">（:659）
 *      区分セル: {{ Stock.stockChangeTypeDetail.StockChangeType.name }}/{{ Stock.stockChangeTypeDetail }}（:681）
 *      在庫(after)セル: {{ Stock.stock }}（:680）／増減: {{ Stock.stock_change_quantity }}（:680 近接）
 *  - 区分名定数: MtbStockChangeTypeDetail.php:54（SMAREGI_SYNC_ADJUST=38）／理由 SmaregiStockChangeApplier.php:247-249
 *
 * 注意: 在庫数セル・区分セルの「対象商品行」の特定には SEED（再連携済み商品・商品コード）が要る。
 * 在庫数セルの正確なtd位置・列順は静的に断定できないため一部 要実機確認（spec側は seed/HAS_CREDS で skip）。
 */

// 区分名（仕様 0202／SmaregiStockChangeApplier.php:247-249 由来の概念ラベル。表示文言の正は仕様）。
// 付帯表4 #2: applier の default 理由は 'スマレジ連携' で「スマレジ連携（調整）」固有理由が未確認＝021は要確認。
export const KUBUN_SALES = "スマレジ連携（売上）"; // E2E-019（売上02・減算）
export const KUBUN_RETURN = "スマレジ連携（返品）"; // E2E-020（返品12・加算）
export const KUBUN_ADJUST = "スマレジその他（調整）"; // E2E-021（在庫修正・要確認 付帯表4 #2）

export class AdminStockSmaregiRetryPage {
  readonly page: Page;
  readonly stockListUrl: string;
  readonly stockHistoryUrl: string;

  // --- 在庫検索一覧 ---
  readonly stockListTable: Locator; // stock_list_index.twig: class=table-stock-list（:18 CSS定義）
  readonly stockListProductCode: Locator; // 商品コード検索欄（searchForm.product_code: stock_list_index.twig:108）

  // --- 在庫変動履歴一覧 ---
  readonly historyTable: Locator; // history.twig 一覧テーブル（thead :616 / tbody :655）
  readonly historyRows: Locator; // history.twig:659 <tr id="ex-product-...">

  constructor(page: Page) {
    this.page = page;
    this.stockListUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock`; // StockListController.php:94
    this.stockHistoryUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/history`; // StockHistoryController.php:64

    this.stockListTable = page.locator("table.table-stock-list"); // stock_list_index.twig:18
    this.stockListProductCode = page.locator("#admin_search_stock_product_code"); // id 要実機確認（form_widget出力）
    this.historyTable = page.locator("table"); // history.twig 一覧テーブル（より厳密なid/classは要実機確認）
    this.historyRows = page.locator('tr[id^="ex-product-"]'); // history.twig:659
  }

  async gotoStockList() {
    await this.page.goto(this.stockListUrl);
  }

  async gotoStockHistory() {
    await this.page.goto(this.stockHistoryUrl);
  }

  /** 在庫検索一覧テーブルが表示されることを確認（到達確認）。 */
  async seeStockListTable() {
    await expect(this.stockListTable).toBeVisible();
  }

  /** 在庫変動履歴一覧テーブルが表示されることを確認（到達確認）。 */
  async seeStockHistoryTable() {
    await expect(this.historyRows.first()).toBeVisible();
  }

  /**
   * 在庫変動履歴に指定の区分名が表示されることを確認。
   * 区分セルは history.twig:681「{type.name}/{detail}」形式。表示文言の正は仕様(0202)。
   */
  async seeHistoryKubun(kubun: string) {
    await expect(this.historyTable).toContainText(kubun);
  }
}
