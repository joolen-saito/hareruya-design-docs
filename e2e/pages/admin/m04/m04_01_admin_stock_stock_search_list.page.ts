import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理 在庫検索/一覧（M04-01）Page Object。
 * 納品ケース表 integration_test/e2e/m04_01_admin_stock_stock_search_list_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/ec-cube-enterprise/m04-01_admin_stock_stock_search_list.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_search_stock_list`（SearchStockListType.php:496-500）由来の位置情報のみ。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * DOM id 根拠（getBlockPrefix=admin_search_stock_list）:
 *  - product_name     → #admin_search_stock_list_product_name（stock_list_index.twig:85 / SearchStockListType.php:97）
 *  - card_name        → #admin_search_stock_list_card_name（twig:90 / :105）
 *  - product_id       → #admin_search_stock_list_product_id（twig:103 / :113）
 *  - product_code     → #admin_search_stock_list_product_code（twig:108 / :118）
 *  - base_info        → #admin_search_stock_list_base_info（twig:96 / :123 店舗 select2）
 *  - base_price_from  → #admin_search_stock_list_base_price_from（twig:258 / :410 PriceType）
 *  - base_price_to    → #admin_search_stock_list_base_price_to（twig:263 / :417）
 *  - sell_price_from  → #admin_search_stock_list_sell_price_from（twig:272 / :264）
 *  - sell_price_to    → #admin_search_stock_list_sell_price_to（twig:277 / :271）
 *  - stock_from       → #admin_search_stock_list_stock_from（twig:323 / :278 IntegerType）
 *  - stock_to         → #admin_search_stock_list_stock_to（twig:328 / :289）
 *  - update_date_from → #admin_search_stock_list_update_date_from（twig:301相当 / :336 single_text）
 *  - update_date_to   → #admin_search_stock_list_update_date_to（twig:306相当 / :354）
 *  - pattern_name     → #admin_search_stock_list_pattern_name（twig:361 / :427）
 *  - 検索フォーム      → #searchStockListForm（twig:74 form name=admin_search_stock_list action=admin_stock_list）
 *  - 検索ボタン        → form 内 button[type=submit]（twig:412 trans admin.common.search=「検索」 messages.ja.yaml:1446）
 *  - 詳細検索トグル/枠  → [href="#searchDetailArea"]（twig:154 href属性は外側要素・要素種別は限定しない）/ #searchDetailArea（twig:160 collapse）
 *  - 検索条件保存ボタン → #savePatternBtn（twig:369）/ 削除ボタン #deletePatternBtn（twig:376）/ クリア #clearSearchBtn（twig:413）
 *  - 表示件数 select    → #page_count_pulldown（twig:462 値=admin_stock_list_page_count URL）
 *  - カスタムCSV select → #stock_csv_pulldown（twig:452）
 *  - 在庫リコメンドCSV  → a[href*="recommend-csv"]（twig:443 trans admin.stock.list.recommend_csv messages.ja.yaml:4452）
 *  - 在庫情報CSV        → a[href*="/stock/csv"]（twig:447 trans admin.stock.list.stock_info_csv messages.ja.yaml:4453）
 *  - 全選択 / 行チェック → #checkAll（twig:523）/ .row-check name=productStockIds[]（twig:573）
 *  - 在庫操作ボタン     → #bulkEditBtn(twig:480)/#stockMoveBtn(485)/#stockTransferBtn(490)/#stockSplitBtn(495)/#stockJoinBtn(499) 既定 disabled
 *  - 商品名→在庫編集    → a[href*="/stock-approval/new"]（twig:585 url admin_stock_approval_new）
 *  - 3点メニュー/変動履歴 → .js-stock-row-menu-btn（twig:625）/ a[href*="/stock/history"]（twig:633 url admin_stock_history）
 *  - 件数見出し         → 「検索結果：%count%件が該当しました」trans admin.common.search_result（twig:433 / messages.ja.yaml:1538）
 *  - 検索前/0件案内     → 「検索条件を入力して検索ボタンを押してください」trans admin.stock.list.search_first（twig:435,653 / messages.ja.yaml:4457）
 *  - 0件メッセージ      → 「検索条件に合致するデータが見つかりませんでした」trans admin.common.search_no_result（twig:648 / messages.ja.yaml:1542）
 *  - 範囲エラー         → 「上限金額は、下限金額より大きく設定してください」trans admin.common.price_range_error（messages.ja.yaml:1420 / SearchStockListType.php:462,468,474）
 *                        「終了日時は、開始日時より大きく設定してください」trans admin.common.date_range_error（messages.ja.yaml:1418 / :480）
 *  - パターン名未入力   → 「検索パターン名を入力して下さい。」trans admin.common.save_pattern.error.name_empty（messages.ja.yaml:1607 / StockListController.php:318）
 *  - CSV未検索          → 「検索条件を指定してからCSV出力してください。」trans admin.stock.list.search_required_for_csv（messages.ja.yaml:4419 / Controller.php:219,248,275）
 *  - 一括対象なし       → 「指定された在庫が見つかりませんでした。」trans admin.stock.bulk_approval.no_product_stocks（messages.ja.yaml:4245 / Controller.php:440）
 */
export class StockStockSearchListPage {
  readonly page: Page;
  readonly url: string; // 在庫一覧の入口 GET /{admin_route}/product/stock

  readonly searchForm: Locator;
  readonly productName: Locator;
  readonly cardName: Locator;
  readonly productId: Locator;
  readonly productCode: Locator;
  readonly baseInfo: Locator;
  readonly basePriceFrom: Locator;
  readonly basePriceTo: Locator;
  readonly sellPriceFrom: Locator;
  readonly sellPriceTo: Locator;
  readonly stockFrom: Locator;
  readonly stockTo: Locator;
  readonly updateDateFrom: Locator;
  readonly updateDateTo: Locator;
  readonly patternName: Locator;

  readonly searchButton: Locator;
  readonly detailToggle: Locator;
  readonly detailArea: Locator;
  readonly savePatternBtn: Locator;
  readonly deletePatternBtn: Locator;
  readonly clearSearchBtn: Locator;

  readonly pageCountPulldown: Locator;
  readonly stockCsvPulldown: Locator;
  readonly recommendCsvLink: Locator;
  readonly stockInfoCsvLink: Locator;

  readonly checkAll: Locator;
  readonly rowChecks: Locator;
  readonly bulkEditBtn: Locator;
  readonly stockMoveBtn: Locator;
  readonly stockTransferBtn: Locator;
  readonly stockSplitBtn: Locator;
  readonly stockJoinBtn: Locator;

  readonly firstProductLink: Locator;
  readonly firstRowMenuBtn: Locator;
  readonly firstStockHistoryLink: Locator;
  readonly error: Locator;
  // 見出し「在庫一覧」「検索」は default_frame / card-header 側の出力先クラスが要実機確認のため
  // 専用セレクタを創作せず、spec ではテキスト存在で確認する（trans messages.ja.yaml:4421-4425）。

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product/stock`;

    this.searchForm = page.locator("#searchStockListForm");
    this.productName = page.locator("#admin_search_stock_list_product_name");
    this.cardName = page.locator("#admin_search_stock_list_card_name");
    this.productId = page.locator("#admin_search_stock_list_product_id");
    this.productCode = page.locator("#admin_search_stock_list_product_code");
    this.baseInfo = page.locator("#admin_search_stock_list_base_info");
    this.basePriceFrom = page.locator("#admin_search_stock_list_base_price_from");
    this.basePriceTo = page.locator("#admin_search_stock_list_base_price_to");
    this.sellPriceFrom = page.locator("#admin_search_stock_list_sell_price_from");
    this.sellPriceTo = page.locator("#admin_search_stock_list_sell_price_to");
    this.stockFrom = page.locator("#admin_search_stock_list_stock_from");
    this.stockTo = page.locator("#admin_search_stock_list_stock_to");
    this.updateDateFrom = page.locator("#admin_search_stock_list_update_date_from");
    this.updateDateTo = page.locator("#admin_search_stock_list_update_date_to");
    this.patternName = page.locator("#admin_search_stock_list_pattern_name");

    this.searchButton = page.locator('#searchStockListForm button[type="submit"]');
    this.detailToggle = page.locator('[href="#searchDetailArea"]');
    this.detailArea = page.locator("#searchDetailArea");
    this.savePatternBtn = page.locator("#savePatternBtn");
    this.deletePatternBtn = page.locator("#deletePatternBtn");
    this.clearSearchBtn = page.locator("#clearSearchBtn");

    this.pageCountPulldown = page.locator("#page_count_pulldown");
    this.stockCsvPulldown = page.locator("#stock_csv_pulldown");
    this.recommendCsvLink = page.locator('a[href*="recommend-csv"]');
    this.stockInfoCsvLink = page.locator('a[href*="/product/stock/csv"]');

    this.checkAll = page.locator("#checkAll");
    this.rowChecks = page.locator(".row-check");
    this.bulkEditBtn = page.locator("#bulkEditBtn");
    this.stockMoveBtn = page.locator("#stockMoveBtn");
    this.stockTransferBtn = page.locator("#stockTransferBtn");
    this.stockSplitBtn = page.locator("#stockSplitBtn");
    this.stockJoinBtn = page.locator("#stockJoinBtn");

    this.firstProductLink = page
      .locator('a[href*="/stock-approval/new"]')
      .first();
    this.firstRowMenuBtn = page.locator(".js-stock-row-menu-btn").first();
    this.firstStockHistoryLink = page
      .locator('a[href*="/product/stock/history"]')
      .first();
    this.error = page.locator(".text-danger");
  }

  /** 在庫一覧を開く（GET /{admin_route}/product/stock 初期表示＝検索前は空一覧）。 */
  async goto() {
    await this.page.goto(this.url);
  }

  /** 詳細検索枠を開く（基準価格・販売価格・在庫数・更新日等は初期は collapse 内）。 */
  async openDetailSearch() {
    if (!(await this.detailArea.isVisible())) {
      await this.detailToggle.first().click();
      await expect(this.detailArea).toBeVisible();
    }
  }

  /** 既定条件のまま検索POST（「検索」押下）。 */
  async submitSearch() {
    await this.searchButton.click();
  }

  /** 商品名（部分一致）で検索POST。 */
  async searchByProductName(name: string) {
    await this.productName.fill(name);
    await this.searchButton.click();
  }

  /** 基準価格レンジで検索POST（From>To の相関エラー検証用）。 */
  async searchByBasePriceRange(from: string, to: string) {
    await this.openDetailSearch();
    await this.basePriceFrom.fill(from);
    await this.basePriceTo.fill(to);
    await this.searchButton.click();
  }

  /** 販売価格レンジで検索POST（From>To の相関エラー検証用）。 */
  async searchBySellPriceRange(from: string, to: string) {
    await this.openDetailSearch();
    await this.sellPriceFrom.fill(from);
    await this.sellPriceTo.fill(to);
    await this.searchButton.click();
  }

  /** 在庫数レンジで検索POST（From>To の相関エラー検証用）。 */
  async searchByStockRange(from: string, to: string) {
    await this.openDetailSearch();
    await this.stockFrom.fill(from);
    await this.stockTo.fill(to);
    await this.searchButton.click();
  }

  /** 更新日レンジで検索POST（終了<開始 の相関エラー検証用）。 */
  async searchByUpdateDateRange(from: string, to: string) {
    await this.openDetailSearch();
    await this.updateDateFrom.fill(from);
    await this.updateDateTo.fill(to);
    await this.searchButton.click();
  }

  /** 検索パターン名を入力（または空のまま）保存ボタンを押下。 */
  async savePattern(name: string) {
    if (name !== "") {
      await this.patternName.fill(name);
    }
    await this.savePatternBtn.click();
  }

  /** 基本検索フォームの主要UI部品が仕様どおり表示されること。 */
  async seeSearchForm() {
    await expect(this.productName).toBeVisible();
    await expect(this.cardName).toBeVisible();
    await expect(this.productId).toBeVisible();
    await expect(this.productCode).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }

  /** 件数見出し（検索結果：N件が該当しました）が表示されること。 */
  async seeResultCountHeading() {
    await expect(this.page.getByText("検索結果")).toBeVisible();
  }

  /** 検索前/0件の案内文が表示されること（trans admin.stock.list.search_first）。 */
  async seeSearchFirst() {
    await expect(
      this.page.getByText("検索条件を入力して検索ボタンを押してください").first()
    ).toBeVisible();
  }

  /** 0件メッセージ（trans admin.common.search_no_result）が表示されること。 */
  async seeNoResult() {
    await expect(
      this.page.getByText("検索条件に合致するデータが見つかりませんでした")
    ).toBeVisible();
  }

  /** 指定の文言が画面に表示されること（フラッシュ/フォームエラーの共通確認）。 */
  async seeMessage(text: string) {
    await expect(this.page.getByText(text).first()).toBeVisible();
  }
}
