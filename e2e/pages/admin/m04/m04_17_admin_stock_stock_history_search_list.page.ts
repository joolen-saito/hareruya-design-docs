import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理 在庫履歴検索/一覧 Page Object。
 * 納品ケース表 integration_test/e2e/m04_17_admin_stock_stock_history_search_list_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/pf-eccube3/m04-17_admin_stock_stock_history_search_list.md /
 * 観点表 / 基本設計)由来（オラクル独立性）。実装の現挙動・文言を期待値に流用しない。
 * セレクタは ec-cube-enterprise の Twig＋Symfony Form の getBlockPrefix=`admin_stock_history`
 * （StockHistoryType.php:580-583）由来の位置情報のみ。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 設計源(pf-eccube3 /product/history) と刷新先(ec-cube-enterprise /product/stock/history) は
 * 画面・URL・文言が異なる（価格履歴併記なし・0件文言相違等）。詳細はケース表 付帯表4 を参照。
 *
 * 正典(pf-eccube3)↔刷新先(ec-cube-enterprise)のフォームキー写像（合否オラクルは正典の意味づけ。idは実行系の位置情報）:
 *  - 汎用ワード: 正典 `multi` ↔ 刷新先 `product_name`（横断検索：商品名/カード名/商品コード/備考）
 *  - 日付(開始/終了): 正典 `date_from`/`date_to` ↔ 刷新先 `create_date_from`/`create_date_to`
 *  - 在庫変更理由: 正典 `stock_change_type_id` ↔ 刷新先 `stock_change_type_detail`（区分明細経由・スキーマ差）
 * 正典URLは入口 `/product/history`・検索 `/product/history/search/1`。本POMが用いる `/product/stock/history` は
 * 実行系(刷新先)のナビゲーション錨であって値オラクルではない（ケース表 前文・付帯表4 #1 参照）。
 *
 * DOM id 根拠（getBlockPrefix=admin_stock_history / 刷新先入口 admin_stock_history GET,POST /{admin_route}/product/stock/history）:
 *  - 検索フォーム #search_form（history.twig:185 action=admin_stock_history）
 *  - 汎用ワード product_name → #admin_stock_history_product_name（history.twig:192 / StockHistoryType.php:74）
 *  - 検索ボタン「検索」trans admin.common.search（history.twig:555 / messages.ja.yaml:1446）
 *  - 詳細検索枠 #searchDetail（history.twig:227 collapse。初期 has_search_details=true で show / Controller.php:144,177）
 *  - 詳細検索トグル aria-controls=searchDetail（history.twig:219-220）
 *  - 登録日 create_date_from/to → #admin_stock_history_create_date_from/_to（history.twig:240,251 / StockHistoryType.php:339,357）
 *  - 在庫変動区分 stock_change_type_detail → #admin_stock_history_stock_change_type_detail（history.twig:261 / :94）
 *  - 一覧データ行 tr[id^="ex-product-"]（history.twig:659）
 *  - 件数見出し trans admin.common.search_result（history.twig:557 / messages.ja.yaml:1538）
 *  - 0件見出し trans admin.common.search_no_result（history.twig:756 / messages.ja.yaml:1542）
 *  - 表示件数プルダウン #page_count_pulldown（history.twig:587。pagination かつ totalItemCount>0 時のみ描画）
 *  - 在庫CSV出力ボタン formaction=admin_stock_history_csv_export（history.twig:598）
 *  - 検索条件クリアリンク .search-clear（history.twig:550 trans admin.customer.clear_search）
 *  - 在庫履歴行の履歴元リンク `tr[id^="ex-product-"] a[target="_blank"]`（history.twig:670 url(getRouteNameBySourceType)）
 */
export class StockStockHistorySearchListPage {
  readonly page: Page;
  readonly url: string; // 一覧の入口 GET,POST /{admin_route}/product/stock/history

  readonly searchForm: Locator; // #search_form
  readonly productName: Locator; // 汎用ワード(商品名・カード名・商品コード)
  readonly searchButton: Locator; // 「検索」submit
  readonly searchDetail: Locator; // 詳細検索 collapse（初期 show）
  readonly searchDetailToggle: Locator; // 詳細検索トグル
  readonly createDateFrom: Locator; // 登録日(開始)
  readonly createDateTo: Locator; // 登録日(終了)
  readonly stockChangeTypeDetail: Locator; // 在庫変動区分(理由)
  readonly resultRows: Locator; // 一覧データ行
  readonly pageCountPulldown: Locator; // 表示件数 select
  readonly csvExportButton: Locator; // 在庫CSV出力ボタン
  readonly searchClear: Locator; // 検索条件クリアリンク（.search-clear）
  // 件数見出し/0件見出し/ページャは default_frame・部分テンプレ側の出力クラスが要実機確認のため
  // 専用セレクタを創作せず、spec ではテキスト/データ行数で確認する。

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product/stock/history`;

    this.searchForm = page.locator("#search_form");
    this.productName = page.locator("#admin_stock_history_product_name");
    this.searchButton = page.locator('#search_form button[type="submit"]');
    this.searchDetail = page.locator("#searchDetail");
    this.searchDetailToggle = page.locator('[aria-controls="searchDetail"]');
    this.createDateFrom = page.locator("#admin_stock_history_create_date_from");
    this.createDateTo = page.locator("#admin_stock_history_create_date_to");
    this.stockChangeTypeDetail = page.locator(
      "#admin_stock_history_stock_change_type_detail"
    );
    this.resultRows = page.locator('tr[id^="ex-product-"]');
    this.pageCountPulldown = page.locator("#page_count_pulldown");
    this.csvExportButton = page.locator(
      'button[formaction$="/product/stock/history/csv_export"]'
    );
    this.searchClear = page.locator(".search-clear");
  }

  /** 一覧を開く（GET /{admin_route}/product/stock/history 初期表示）。 */
  async goto() {
    await this.page.goto(this.url);
  }

  /** 既定条件のまま検索POST（「検索」押下）。 */
  async submitSearch() {
    await this.searchButton.click();
  }

  /** 汎用ワードで検索POST。 */
  async searchByKeyword(value: string) {
    await this.productName.fill(value);
    await this.searchButton.click();
  }

  /** 検索フォームの主要UI部品が仕様どおり表示されること（フロント挙動「上部に検索フォーム」）。 */
  async seeSearchForm() {
    await expect(this.productName).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }

  /** 詳細検索枠が開いて表示されていること（フロント挙動「初期で開いた詳細検索枠」）。 */
  async seeSearchDetailOpen() {
    await expect(this.searchDetail).toBeVisible();
  }

  /** 一覧にデータ行が表示されないこと（初期表示空・0件）。 */
  async seeListEmpty() {
    await expect(this.resultRows).toHaveCount(0);
  }

  /**
   * 検索条件クリアリンクを押下し、フォーム入力が初期化されること（フロント挙動「検索条件クリアのリンクでフォーム入力を初期化する」）。
   * オラクルは設計書由来（入力済み値→クリアで空に戻る）。実装文言・遷移先は期待値化しない。
   */
  async clearSearchAndExpectEmpty(value: string) {
    await this.productName.fill(value);
    await expect(this.productName).toHaveValue(value);
    await this.searchClear.click();
    await expect(this.productName).toHaveValue("");
  }

  /** 検索結果領域（件数見出しまたは該当なし見出し）が表示されること。 */
  async seeResultArea() {
    // 検索が成立し「同一画面に結果領域が表示された」ことを確認する。
    // オラクルは設計書「表示メッセージ」由来:
    //   件数見出し「検索結果 N 件 が該当しました」(>=1件) /
    //   0件見出し「検索条件に該当するデータがありませんでした。」(0件)。
    // いずれも正典文言由来。刷新先で0件文言が乖離する場合の厳密文言検証は E2E-013(fixme) で扱う。
    // bare "該当" 単独一致は誤検知しうるため、正典見出しの語形に絞った正規表現＋データ行で判定する。
    await expect(this.searchForm).toBeVisible(); // 同一画面に留まる（ログイン/404へ遷移していない）
    await expect(
      this.page
        .getByText(/検索結果[\s\S]{0,8}件/) // 件数見出し（正典「検索結果 N 件」）
        .or(this.resultRows.first()) // 在庫一覧のデータ行
        .or(this.page.getByText(/該当(しました|するデータ)/)) // 件数/0件見出しの正典共通語形
    ).toBeVisible();
  }
}
