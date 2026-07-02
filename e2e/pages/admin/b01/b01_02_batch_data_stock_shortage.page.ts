import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 在庫切れバッチ（B01-02）UIレイヤ Page Object。
 * 納品ケース表 integration_test/e2e/b01_02_batch_data_stock_shortage_e2e_cases.md に対応。
 *
 * 役割（重要）: 本バッチの抽出結果(CSV)はUIに反映されない（ケース表 注記参照）。
 *  よって本Page Objectは「バッチ結果のUI観測」ではなく、**抽出対象の入力条件（在庫数=0／≥1）を
 *  在庫検索一覧(admin_stock_list)で観測する**ためのものである（付帯表1 E2E-015/016）。
 *  期待結果は仕様（抽出条件「在庫数0」＝正本md:117,123,133／IT-30,IT-16）由来（オラクル独立性）。
 *  ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * セレクタ根拠（Twig file:line のみ。無ければ要実機確認）:
 *  src/Eccube/Resource/template/admin/Stock/stock_list_index.twig
 *  - 検索フォーム      → #searchStockListForm（twig:74 form name=admin_search_stock_list action=admin_stock_list）
 *  - 在庫数 From/To     → #admin_search_stock_list_stock_from（twig:323）/ #admin_search_stock_list_stock_to（twig:328）
 *                        （getBlockPrefix=admin_search_stock_list / SearchStockListType.php:278,289。詳細検索 collapse #searchDetailArea twig:160 内）
 *  - 詳細検索トグル/枠   → [href="#searchDetailArea"]（twig:154）/ #searchDetailArea（twig:160 collapse）
 *  - 検索ボタン         → #searchStockListForm button[type=submit]（twig:412 trans admin.common.search=「検索」）
 *  - 結果行             → table tbody tr（twig:599 {% for Item in pagination %}）
 *  - 在庫数セル td.col-stock → twig:605 <td class="col-stock">。1行目div=在庫数(Item.stock|default(0)|number_format) twig:606 / 2行目div=総原価 twig:607
 *  - 0件メッセージ      → 「検索条件に合致するデータが見つかりませんでした」trans admin.common.search_no_result（twig:648 相当・要実機確認）
 *
 * 在庫一覧の入口URL: GET /{admin_route}/product/stock（admin_stock_list / m04_01 Page Object と同経路）。
 */
export class StockShortageStockListPage {
  readonly page: Page;
  readonly url: string;

  readonly searchForm: Locator;
  readonly detailToggle: Locator;
  readonly detailArea: Locator;
  readonly stockFrom: Locator;
  readonly stockTo: Locator;
  readonly searchButton: Locator;

  readonly resultRows: Locator;
  /** 在庫数セル（td.col-stock の1行目div＝在庫数。twig:605-606）。総原価(2行目div)は含めない。 */
  readonly stockCells: Locator;

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product/stock`;

    this.searchForm = page.locator("#searchStockListForm");
    this.detailToggle = page.locator('[href="#searchDetailArea"]');
    this.detailArea = page.locator("#searchDetailArea");
    this.stockFrom = page.locator("#admin_search_stock_list_stock_from"); // twig:323
    this.stockTo = page.locator("#admin_search_stock_list_stock_to"); // twig:328
    this.searchButton = page.locator('#searchStockListForm button[type="submit"]'); // twig:412

    this.resultRows = page.locator("#searchStockListForm table tbody tr"); // twig:599
    // td.col-stock(twig:605) の在庫数は1行目div(twig:606)。`> div`先頭で在庫数のみを取る。
    this.stockCells = page.locator("td.col-stock > div:first-child");
  }

  /** 在庫一覧を開く（GET /{admin_route}/product/stock 初期表示）。 */
  async goto() {
    await this.page.goto(this.url);
  }

  /** 詳細検索枠（在庫数From/To を含む collapse）を開く。 */
  async openDetailSearch() {
    if (!(await this.detailArea.isVisible())) {
      await this.detailToggle.first().click();
      await expect(this.detailArea).toBeVisible();
    }
  }

  /** 在庫数レンジで検索POST（在庫0観測なら from="0" to="0"、在庫1以上観測なら from="1"）。 */
  async searchByStockRange(from: string, to: string) {
    await this.openDetailSearch();
    await this.stockFrom.fill(from);
    await this.stockTo.fill(to);
    await this.searchButton.click();
  }

  /** 在庫数セルの値（カンマ除去・数値）を配列で取得する。在庫列のUI観測に用いる。 */
  async readStockValues(): Promise<number[]> {
    const texts = await this.stockCells.allInnerTexts();
    return texts.map((t) => Number(t.replace(/[,\s]/g, "")));
  }
}
