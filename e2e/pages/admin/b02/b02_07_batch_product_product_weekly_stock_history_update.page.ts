import { Locator, Page } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 週間在庫履歴更新バッチ（B02-07）UIレイヤ Page Object。
 * 納品ケース表 integration_test/e2e/b02_07_batch_product_product_weekly_stock_history_update_e2e_cases.md に対応。
 *
 * 役割（重要）: 週間在庫履歴の更新結果はUIに反映されない（付帯表1注記）。
 *  本Page Objectは「バッチ結果のUI観測」ではなく、**集計対象である商品在庫の在庫数を在庫検索一覧で観測する**
 *  ための入力条件確認用である（E2E-021）。期待は仕様（集計対象「商品在庫の在庫数」正本md:99,147／IT-30）由来（オラクル独立性）。
 *  ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * セレクタ根拠（Twig file:line）:
 *  src/Eccube/Resource/template/admin/Stock/stock_list_index.twig
 *  - 検索フォーム  → #searchStockListForm（twig:74 form name=admin_search_stock_list action=admin_stock_list）
 *  - 結果行        → #searchStockListForm table tbody tr
 *  - 在庫数セル    → td.col-stock の1行目div（twig:603-605 <td class="col-stock"><div>{{ Item.stock }}</div>）。2行目div=総原価は含めない。
 *  在庫一覧の入口URL: GET /{admin_route}/product/stock（admin_stock_list / stock_list_index.twig:74）。
 */
export class WeeklyStockHistoryStockListPage {
  readonly page: Page;
  readonly url: string;
  readonly searchForm: Locator;
  readonly resultRows: Locator;
  /** 在庫数セル（td.col-stock の1行目div＝在庫数。twig:603-605）。 */
  readonly stockCells: Locator;

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product/stock`;
    this.searchForm = page.locator("#searchStockListForm"); // twig:74
    this.resultRows = page.locator("#searchStockListForm table tbody tr");
    this.stockCells = page.locator("td.col-stock > div:first-child"); // twig:603-605
  }

  /** 在庫一覧を開く（GET /{admin_route}/product/stock 初期表示）。 */
  async goto() {
    await this.page.goto(this.url);
  }

  /** 在庫数セルの値（カンマ除去・数値）を配列で取得する。 */
  async readStockValues(): Promise<number[]> {
    const texts = await this.stockCells.allInnerTexts();
    return texts.map((t) => Number(t.replace(/[,\s]/g, "")));
  }
}
