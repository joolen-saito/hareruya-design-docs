import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理 在庫分割結合検索/一覧 Page Object。
 * 構造参考: ec-cube-enterprise/e2e-tests の既存 Page Object。本ファイルは設計書+Twig由来の未実行雛形。
 *
 * 期待結果は仕様(正本 functions/ec-cube-enterprise/m04-12_admin_stock_stock_split_join_search_list.md /
 * 基本設計(在庫管理機能) / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_search_stock_split_join`
 * （SearchStockSplitJoinType.php:311-314）由来の位置情報のみ。合否は仕様で判定する。
 *
 * 画面/ルート: GET,POST /%admin%/product/stock/split-join（admin_stock_split_join_list）
 *   - StockSplitJoinController.php:90-170
 */
export class StockStockSplitJoinSearchListPage {
  readonly page: Page;
  readonly url: string;

  // ----- 検索フォーム（block prefix admin_search_stock_split_join） -----
  readonly productName: Locator; // 商品名（stock_split_join_index.twig:132 / form product_name）
  readonly productCode: Locator; // 商品コード（index.twig:137 / form product_code）
  readonly createDateStart: Locator; // 登録日From（index.twig:221 / create_date_start single_text）
  readonly createDateEnd: Locator; // 登録日To（index.twig:223 / create_date_end single_text）
  readonly searchButton: Locator; // 検索ボタン（index.twig:280 / trans admin.common.search=「検索」）
  readonly detailSearch: Locator; // 詳細検索 collapse（index.twig:214 id=detailSearchSplitJoin）
  readonly clearSearchLink: Locator; // 検索条件をクリア（index.twig:272 href ?clear=1）

  // ----- 一覧/結果領域 -----
  readonly resultCount: Locator; // 件数見出し（index.twig:297 trans admin.common.search_result）
  readonly noResult: Locator; // 0件メッセージ（index.twig:299 trans admin.common.search_no_result）
  readonly beforeSearchGuide: Locator; // 検索前案内（index.twig:399 trans admin.stock.split_join.search_first）
  readonly dateError: Locator; // 日付範囲エラー領域（index.twig:225 form_errors create_date_end）

  // ----- 入口ボタン/リンク -----
  readonly splitCsvRegisterButton: Locator; // 在庫分割CSV登録（index.twig:102 → #modalSplitCsv）
  readonly joinCsvRegisterButton: Locator; // 在庫結合CSV登録（index.twig:103 → #modalJoinCsv）
  readonly csvExportLink: Locator; // 在庫分割結合CSV出力（index.twig:292 / admin_stock_split_join_csv_export）
  readonly splitCsvModal: Locator; // 分割CSV登録モーダル（index.twig:420 id=modalSplitCsv）
  readonly joinCsvModal: Locator; // 結合CSV登録モーダル（index.twig:440 id=modalJoinCsv）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product/stock/split-join`;

    this.productName = page.locator("#admin_search_stock_split_join_product_name");
    this.productCode = page.locator("#admin_search_stock_split_join_product_code");
    this.createDateStart = page.locator("#admin_search_stock_split_join_create_date_start");
    this.createDateEnd = page.locator("#admin_search_stock_split_join_create_date_end");
    this.searchButton = page.getByRole("button", { name: "検索", exact: true });
    this.detailSearch = page.locator("#detailSearchSplitJoin");
    this.clearSearchLink = page.locator('a[href*="clear=1"]');

    this.resultCount = page.getByText("検索結果", { exact: false });
    this.noResult = page.getByText("検索条件に合致するデータが見つかりませんでした", {
      exact: false,
    });
    this.beforeSearchGuide = page.getByText(
      "検索条件を入力し、検索ボタンをクリックしてください。",
      { exact: false }
    );
    // 登録日エラーは詳細検索 collapse 内 form_errors(create_date_start/_end)（index.twig:225）に出る。
    // ページ全体の li を拾わないよう #detailSearchSplitJoin 配下に限定する（オラクルを欄付近に固定）。
    this.dateError = page.locator(
      "#detailSearchSplitJoin .invalid-feedback, #detailSearchSplitJoin .text-danger, #detailSearchSplitJoin li"
    );

    this.splitCsvRegisterButton = page.locator('[data-bs-target="#modalSplitCsv"]');
    this.joinCsvRegisterButton = page.locator('[data-bs-target="#modalJoinCsv"]');
    this.csvExportLink = page.getByRole("link", { name: "在庫分割結合CSV出力" });
    this.splitCsvModal = page.locator("#modalSplitCsv");
    this.joinCsvModal = page.locator("#modalJoinCsv");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** ?clear=1 のクリア結果（リダイレクト先）を直接たどる。 */
  async gotoClear() {
    await this.page.goto(`${this.url}?clear=1`);
  }

  /** ?resume=1 でセッションの検索条件を復元して再表示する（要: 事前POST検索）。Controller.php:111。 */
  async gotoResume() {
    await this.page.goto(`${this.url}?resume=1`);
  }

  /** 条件なしで検索を実行する（未選択＝全件。stockSplitJoinSearchPerformed=true）。 */
  async submitSearch() {
    await this.searchButton.click();
  }

  /** 商品名（部分一致）で検索する。 */
  async searchByProductName(name: string) {
    await this.productName.fill(name);
    await this.searchButton.click();
  }

  /** 商品コード（部分一致）で検索する。 */
  async searchByProductCode(code: string) {
    await this.productCode.fill(code);
    await this.searchButton.click();
  }

  /** 登録日 From/To を入力して検索する（From>To で日付範囲エラーを誘発できる）。 */
  async searchByCreateDateRange(start: string, end: string) {
    await this.createDateStart.fill(start);
    await this.createDateEnd.fill(end);
    await this.searchButton.click();
  }

  async openSplitCsvModal() {
    await this.splitCsvRegisterButton.click();
  }

  async openJoinCsvModal() {
    await this.joinCsvRegisterButton.click();
  }

  /** 検索フォームの主要部品が仕様どおり表示されること。 */
  async seeSearchForm() {
    await expect(this.productName).toBeVisible();
    await expect(this.productCode).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }

  /** 検索前状態: 案内文言が表示され、件数見出しが出ていないこと。 */
  async seeBeforeSearchState() {
    await expect(this.beforeSearchGuide).toBeVisible();
    await expect(this.resultCount).toHaveCount(0);
  }

  /** 検索実行済み（件数見出しまたは0件メッセージのいずれかが出ている）こと。 */
  async seeSearchPerformed() {
    const count = await this.resultCount.count();
    const noRes = await this.noResult.count();
    expect(count + noRes).toBeGreaterThan(0);
  }

  /** 0件メッセージが表示されること。 */
  async seeNoResult() {
    await expect(this.noResult).toBeVisible();
  }
}
