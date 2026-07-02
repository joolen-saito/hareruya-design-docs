import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * a01-01 スマレジ連携処理（Webhook受信→在庫更新）UIレイヤ観測用 Page Object。
 * ケース表 integration_test/e2e/a01_01_api_stock_smaregi_stock_sync_e2e_cases.md（付帯表1 E2E自動化(UI) 050-056）に対応。
 * Webhook受信の結果が管理画面（在庫検索一覧の在庫数・在庫変動履歴）に現れる範囲を観測する未実行雛形。
 *
 * セレクタ根拠（Twig file:line）:
 *  - 在庫検索一覧 在庫数セル: src/Eccube/Resource/template/admin/Stock/stock_list_index.twig:606
 *      `<div>{{ Item.stock|default(0)|number_format }}</div>`（同:579 に data-stock 属性 `{{ Item.stock|default(0) }}`）
 *  - 在庫変動履歴 変動数セル: src/Eccube/Resource/template/admin/Stock/history.twig:680 `<td>{{ Stock.stock_change_quantity }}</td>`
 *  - 在庫変動履歴 区分セル:   src/Eccube/Resource/template/admin/Stock/history.twig:681
 *      `<td>{{ Stock.stockChangeTypeDetail.StockChangeType.name }}/{{ Stock.stockChangeTypeDetail }}</td>`
 * ルート根拠:
 *  - 在庫検索一覧 admin_stock_list  `/%eccube_admin_route%/product/stock`         (StockListController.php:94)
 *  - 在庫変動履歴 admin_stock_history `/%eccube_admin_route%/product/stock/history` (StockHistoryController.php:64)
 *
 * 注意: 在庫数セル/履歴行は安定したidを持たない（div/td）。特定商品規格の行を狙う検索条件
 * （product_code 等）は SEED-A01-01-STOCK-KNOWN と区分マッピング（付帯表4#5・要実機確認）に依存するため、
 * 行レベルの厳密な特定は要実機確認。本Page Objectは URL/汎用Locator と観測メソッドを提供する。
 */
export class AdminSmaregiStockSyncPage {
  readonly page: Page;
  readonly stockListUrl: string;
  readonly stockHistoryUrl: string;

  // 在庫検索一覧 在庫数（stock_list_index.twig:606 / data-stock 属性 :579）。要実機確認: 行特定は検索条件に依存。
  readonly stockCells: Locator;
  // 在庫変動履歴 行（history.twig tbody の各 <tr>）。変動数:680 / 区分:681。
  readonly historyRows: Locator;
  readonly historyQuantityCells: Locator; // history.twig:680
  readonly historyTypeCells: Locator;     // history.twig:681

  constructor(page: Page) {
    this.page = page;
    this.stockListUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock`;          // admin_stock_list
    this.stockHistoryUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/history`; // admin_stock_history
    // data-stock 属性を持つ要素（stock_list_index.twig:579）。表示は :606 の数値。
    this.stockCells = page.locator("[data-stock]");
    this.historyRows = page.locator("#stockChangeHistory tbody tr, table tbody tr"); // 要実機確認: 履歴テーブルの絞り込み
    this.historyQuantityCells = this.historyRows.locator("td").nth(2); // 由来: history.twig:680（列位置は要実機確認）
    this.historyTypeCells = this.historyRows.locator("td").nth(3);     // 由来: history.twig:681（列位置は要実機確認）
  }

  /** 在庫検索一覧を開く。productCode 等の検索条件はクエリで渡す（行特定用・要実機確認）。 */
  async gotoStockList(query?: Record<string, string>) {
    const qs = query ? "?" + new URLSearchParams(query).toString() : "";
    await this.page.goto(`${this.stockListUrl}${qs}`);
  }

  /** 在庫変動履歴一覧を開く。product_code 等の検索条件はクエリで渡す。 */
  async gotoStockHistory(query?: Record<string, string>) {
    const qs = query ? "?" + new URLSearchParams(query).toString() : "";
    await this.page.goto(`${this.stockHistoryUrl}${qs}`);
  }

  /** 対象規格行の在庫数（data-stock 属性）を数値で読む。要実機確認: 行特定セレクタ。 */
  async readStock(rowSelector?: string): Promise<number> {
    const cell = rowSelector ? this.page.locator(rowSelector).locator("[data-stock]").first() : this.stockCells.first();
    const raw = await cell.getAttribute("data-stock");
    return Number((raw ?? "0").replace(/,/g, ""));
  }

  /** 在庫数が期待値（仕様由来: N±変動数量）と一致することを確認する。 */
  async seeStockEquals(expected: number, rowSelector?: string) {
    const actual = await this.readStock(rowSelector);
    expect(actual, "在庫検索一覧の在庫数が仕様の期待値と一致すること").toBe(expected);
  }

  /** 在庫変動履歴に新規行が無いこと（対象外区分・連携エラー時の負確認 055/056）。 */
  async seeNoNewHistoryRow(baselineCount: number) {
    await expect(this.historyRows, "在庫変動履歴に新規行が作成されないこと").toHaveCount(baselineCount);
  }

  /** 在庫変動履歴に対象行が存在し、変動数が期待値と一致すること（052/053）。要実機確認: 連携元ID列の特定。 */
  async seeHistoryQuantity(expectedQuantity: string) {
    await expect(this.historyQuantityCells, "在庫変動履歴の変動数が受信内容と一致すること").toContainText(expectedQuantity);
  }
}
