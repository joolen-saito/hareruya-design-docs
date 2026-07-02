import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 商品管理 商品検索・一覧 Page Object。
 * 納品ケース表 integration_test/e2e/m03_01_admin_product_product_search_list_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/pf-eccube3/m03-01_admin_product_product_search_list.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_search_product`（SearchProductType.php:435-438）由来の位置情報のみ。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * DOM id 根拠（getBlockPrefix=admin_search_product）:
 *  - product_name → #admin_search_product_product_name（index.twig:216-217 / SearchProductType.php:74）
 *  - card_name    → #admin_search_product_card_name（index.twig:235-236 / :78）
 *  - product_id   → #admin_search_product_product_id（index.twig:242-243 / :82）
 *  - product_code → #admin_search_product_product_code（index.twig:249-250 / :86）
 *  - update_date_from → #admin_search_product_update_date_from（SearchProductType.php:315 single_text）
 *  - update_date_to   → #admin_search_product_update_date_to（SearchProductType.php:332 single_text）
 *  - sell_price_from  → #admin_search_product_sell_price_from（SearchProductType.php:225 PriceType / index.twig:329）
 *    ※ 桁上限超過時の検証エラーは設計書バリデーション節「金額系 Symfony 桁上限」由来。
 *      具体的な上限値（eccube_price_len）は実装由来のためオラクル化せず、明らかな桁超過入力で検証エラー文言のみを観測する。
 *  - sortkey/sorttype → 隠し入力（index.twig:457-458 / :395,:399）
 *  - 検索ボタン「検索する」trans admin.product.search_submit_label（index.twig:445-446 / messages.ja.yaml:1909）
 *  - 件数見出し「検索結果：%count%件が該当しました」trans admin.common.search_result（index.twig:451 / messages.ja.yaml:1538）
 *  - 0件「検索条件に合致するデータが見つかりませんでした」trans admin.common.search_no_result（index.twig:824 / messages.ja.yaml:1542）
 *  - 検証エラー「検索条件に誤りがあります」trans admin.common.search_invalid_condition（index.twig:817 / messages.ja.yaml:1541）
 *  - 詳細検索枠 #searchDetail（index.twig:231 collapse show＝初期表示で開く）
 *  - 表示件数プルダウン #page_count_pulldown（index.twig:503）/ 一覧表示データ #display_pulldown（index.twig:531）
 *  - ソートアイコン a.js-listSort[data-sortkey]（index.twig:554 product_id / :555 name）
 *  - 商品名リンク→商品編集 a[href*="/product/product/"]（index.twig:592 url admin_product_product_edit）
 */
export class ProductProductSearchListPage {
  readonly page: Page;
  readonly url: string; // 一覧の入口 GET /{admin_route}/product

  readonly searchForm: Locator; // #search_form（index.twig:211）
  readonly productName: Locator; // 商品名(日/英)
  readonly cardName: Locator; // カード名
  readonly productId: Locator; // ID
  readonly productCode: Locator; // コード
  readonly updateDateFrom: Locator; // 規格更新日(開始)
  readonly updateDateTo: Locator; // 規格更新日(終了)
  readonly sellPriceFrom: Locator; // 販売価格(開始)
  readonly searchButton: Locator; // 「検索する」
  readonly searchClear: Locator; // 検索条件クリア（.search-clear）
  readonly searchDetail: Locator; // 詳細検索 collapse
  readonly searchDetailToggle: Locator; // 詳細検索 collapse 開閉ボタン
  readonly pageCountPulldown: Locator; // 表示件数 select
  readonly displayPulldown: Locator; // 一覧表示データ select
  readonly sortByName: Locator; // 名前ソートアイコン
  readonly sortByProductId: Locator; // 商品IDソートアイコン
  readonly pagination: Locator; // ページネーション ul.pagination（pager.twig:12）
  readonly firstProductLink: Locator; // 一覧先頭の商品名リンク
  // 見出し「商品一覧」は default_frame 側のページ見出し出力先クラスが要実機確認のため
  // 専用セレクタを創作せず、spec ではテキスト存在で確認する（trans admin.product.product_list / messages.ja.yaml:1724）。

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product`;

    this.searchForm = page.locator("#search_form");
    this.productName = page.locator("#admin_search_product_product_name");
    this.cardName = page.locator("#admin_search_product_card_name");
    this.productId = page.locator("#admin_search_product_product_id");
    this.productCode = page.locator("#admin_search_product_product_code");
    this.updateDateFrom = page.locator("#admin_search_product_update_date_from");
    this.updateDateTo = page.locator("#admin_search_product_update_date_to");
    this.sellPriceFrom = page.locator("#admin_search_product_sell_price_from");
    this.searchButton = page.locator("button.admin-product-search-submit");
    this.searchClear = page.locator("a.search-clear"); // index.twig:418
    this.searchDetail = page.locator("#searchDetail");
    this.searchDetailToggle = page.locator(
      'button.admin-product-search-detail-toggle[data-bs-target="#searchDetail"]'
    ); // index.twig:223（aria-expanded を開閉で更新）
    this.pageCountPulldown = page.locator("#page_count_pulldown");
    this.displayPulldown = page.locator("#display_pulldown");
    this.sortByName = page.locator('a.js-listSort[data-sortkey="name"]');
    this.sortByProductId = page.locator('a.js-listSort[data-sortkey="product_id"]');
    this.pagination = page.locator("ul.pagination");
    this.firstProductLink = page
      .locator('#form_bulk table a[href*="/product/product/"]')
      .first();
  }

  /** 一覧を開く（GET /{admin_route}/product 初期表示）。 */
  async goto() {
    await this.page.goto(this.url);
  }

  /**
   * 既定条件のまま検索POST（「検索する」押下）。
   * 実装の初期GETは pagination=null で一覧/件数/プルダウンを描画しないため、
   * 一覧依存の観測は検索POST（処理フロー#5）で結果を組み立ててから行う。
   */
  async submitSearch() {
    await this.searchButton.click();
  }

  /** 商品名で検索POST（「検索する」押下）。 */
  async searchByProductName(name: string) {
    await this.productName.fill(name);
    await this.searchButton.click();
  }

  /** 販売価格(開始)で検索POST（金額系の桁上限検証用）。 */
  async searchBySellPriceFrom(value: string) {
    await this.sellPriceFrom.fill(value);
    await this.searchButton.click();
  }

  /** 規格更新日レンジで検索POST（相関エラー検証用）。 */
  async searchByUpdateDateRange(from: string, to: string) {
    await this.updateDateFrom.fill(from);
    await this.updateDateTo.fill(to);
    await this.searchButton.click();
  }

  /** 検索フォームの主要UI部品が仕様どおり表示されること。 */
  async seeSearchForm() {
    await expect(this.productName).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }

  /** 件数見出し（検索結果：N件が該当しました）が表示されること。 */
  async seeResultCountHeading() {
    await expect(this.page.getByText("検索結果")).toBeVisible();
  }

  /** 検索結果0件メッセージが表示されること（trans admin.common.search_no_result）。 */
  async seeNoResult() {
    await expect(
      this.page.getByText("検索条件に合致するデータが見つかりませんでした")
    ).toBeVisible();
  }

  /** POST検証エラーメッセージが表示されること（trans admin.common.search_invalid_condition）。 */
  async seeInvalidCondition() {
    await expect(this.page.getByText("検索条件に誤りがあります")).toBeVisible();
  }

  /** POST検証エラーメッセージが表示されないこと（正常入力＝バリデーション節 正常系）。 */
  async seeNoInvalidCondition() {
    await expect(this.page.getByText("検索条件に誤りがあります")).toHaveCount(0);
  }
}
