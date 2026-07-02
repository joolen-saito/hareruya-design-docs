import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 データ管理 > 買取減額率一覧 Page Object（閲覧専用の矩形マトリクス表示画面）。
 *
 * 構造参考: ec-cube-enterprise/e2e-tests の既存 Page Object。本ファイルは設計書+Twig由来の未実行雛形。
 * 期待結果は仕様（正本 functions/pf-eccube3/m16-08_admin_data_data_buy_discount_list.md／観点表）由来（オラクル独立性）。
 * 実装から取るのはセレクタ（位置情報）のみ。仕様と実装の乖離は spec／ケース表「付帯表4」に出し、テストは仕様どおりに書く。
 *
 * セレクタ由来（src/Eccube より）:
 *  - 一覧URL（仕様の入口）: 設計書（md「利用者視点の入口」）= GET /{admin_route}/buy_discount（route admin_buy_discount_list）。
 *      ※ 刷新実装は BuyDiscountController.php:37 route admin_data_buy_discount = /%eccube_admin_route%/data/buy_discount で乖離。
 *        URLは入口（仕様）由来のオラクルとして扱い、設計入口パスを用いる。実装が /data/buy_discount に移設されていれば
 *        到達・URLアサーションが落ちて検出する（title/sub_title の乖離検出と同方針）。乖離はケース表「付帯表4#1」に記録。
 *  - 表本体: buy_discount.twig:49 <table class="table table-striped buy-discount-table">
 *  - 左端ヘッダ列「名称」: buy_discount.twig:52 <th>名称</th>（静的文言）
 *  - 列見出し（カード状態コード）: buy_discount.twig:53-55 {% for CardCondition %}<th>{{ CardCondition.code }}</th>
 *  - データ行: buy_discount.twig:59-72 {% for BuyDiscount %}<tr> ... </tr>
 *  - 行の第一データ列（名称）: buy_discount.twig:61 <td>{{ BuyDiscount.name }}</td>
 *  - 交差なしセルの固定文言「未定義」: buy_discount.twig:64-68 {% if ... is defined %}{{ rate }}{% else %}未定義{% endif %}
 *  - タイトル帯: default_frame.twig:196 .c-pageTitle__title = block('title')（buy_discount.twig:15 trans admin.data.buy_discount_management）
 *  - サブタイトル: default_frame.twig:196 .c-pageTitle__subTitle = block('sub_title')（buy_discount.twig:16 trans admin.data.data_management）
 *  - サイドナビ項目: buy_discount.twig:13 menus=['data_management','buy_discount_management']（子項目 trans admin.data.buy_discount_management）
 */
export class DataDataBuyDiscountListPage {
  readonly page: Page;
  readonly url: string;

  readonly tableWrapper: Locator; // buy_discount.twig:48 .table-responsive.with-border
  readonly table: Locator; // buy_discount.twig:49
  readonly headerCells: Locator; // thead の th 全体（buy_discount.twig:51-56）
  readonly nameHeader: Locator; // 左端ヘッダ「名称」（buy_discount.twig:52）
  readonly bodyRows: Locator; // tbody tr（buy_discount.twig:59-72）
  readonly firstColumnCells: Locator; // 各行の名称セル（buy_discount.twig:61）
  readonly pageTitle: Locator; // default_frame.twig:196 .c-pageTitle__title
  readonly subTitle: Locator; // default_frame.twig:196 .c-pageTitle__subTitle
  // サイドナビ親「データ管理」→子「買取減額率一覧」。リンク文言は trans admin.data.buy_discount_management。
  // ナビDOM構造（開閉トグル等）は default_frame 側で要実機確認のため、リンク文言で特定する。
  readonly navItem: Locator; // 要実機確認（リンク文言で特定）

  constructor(page: Page) {
    this.page = page;
    // 設計書「利用者視点の入口」由来のパス（オラクル）。実装が /data/buy_discount へ移設なら落ちて検出（付帯表4#1）。
    this.url = `/${ECCUBE_ADMIN_ROUTE}/buy_discount`;
    this.tableWrapper = page.locator(".table-responsive.with-border");
    this.table = page.locator("table.buy-discount-table");
    this.headerCells = this.table.locator("thead th");
    this.nameHeader = this.table.locator("thead th").first();
    this.bodyRows = this.table.locator("tbody tr");
    this.firstColumnCells = this.table.locator("tbody tr td:nth-child(1)");
    this.pageTitle = page.locator(".c-pageTitle__title");
    this.subTitle = page.locator(".c-pageTitle__subTitle");
    this.navItem = page.getByRole("link", { name: "買取減額率一覧" });
  }

  /** URL直接GETで一覧画面を開く。 */
  async goto() {
    await this.page.goto(this.url);
  }

  /** サイドナビ「データ管理」→「買取減額率一覧」から遷移する（ナビ開閉は要実機確認）。 */
  async gotoViaMenu() {
    await this.navItem.click();
  }

  /** 一覧表（矩形マトリクス）が表示されていること。 */
  async seeTable() {
    await expect(this.table).toBeVisible();
    await expect(this.nameHeader).toHaveText("名称");
  }

  /** 表ラッパー/表本体に設計どおりのレイアウトクラスが付与されていること。 */
  async seeLayoutClasses() {
    // 期待は仕様（フロント挙動 CSS・レイアウト: table-responsive with-border / table table-striped）由来。
    await expect(this.tableWrapper).toBeVisible();
    await expect(this.table).toHaveClass(/\btable-striped\b/);
    await expect(this.table).toHaveClass(/\btable\b/);
  }

  /** 交差なしセルに固定文言「未定義」が表示されること（要・欠損交差シード）。 */
  async seeUndefinedCell() {
    await expect(this.table.getByText("未定義").first()).toBeVisible();
  }

  /** 指定コードの列見出しが存在すること（要・カード状態マスタシード）。 */
  async seeColumnCode(code: string) {
    await expect(this.headerCells.filter({ hasText: code }).first()).toBeVisible();
  }

  /** 指定名称の行（左端セル）が存在すること（要・買取減額率マスタシード）。 */
  async seeRowName(name: string) {
    await expect(this.firstColumnCells.filter({ hasText: name }).first()).toBeVisible();
  }
}
