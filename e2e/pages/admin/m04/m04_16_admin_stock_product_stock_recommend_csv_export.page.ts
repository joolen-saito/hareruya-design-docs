import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫リコメンドCSV出力（M04-16）Page Object。
 * 納品ケース表 integration_test/e2e/m04_16_admin_stock_product_stock_recommend_csv_export_e2e_cases.md に対応。
 *
 * オラクル独立性: 期待結果(合否)は仕様(設計md/観点表/基本設計)由来。実装からはセレクタ(位置情報)のみ取得する。
 *
 * 仕様乖離(不具合候補#1): 設計md は本機能をコンソールバッチ(画面なし)と定めるが、
 * 刷新先 ec-cube-enterprise は在庫一覧画面からのブラウザCSVダウンロードとして実装している。
 * E2Eは刷新先のダウンロード挙動上で「CSV出力できること／失敗時は出力されないこと」を観測する。
 *
 * セレクタ根拠(Twig/Controller — 位置情報のみ):
 *  - 在庫一覧URL admin_stock_list ＝ /<admin>/product/stock（StockListController.php:94）
 *  - CSV出力URL admin_stock_list_recommend_csv ＝ /<admin>/product/stock/recommend-csv（StockListController.php:243）
 *  - 検索ボタン button[type=submit]「検索」（stock_list_index.twig:412 / trans admin.common.search）
 *  - リコメンドCSV出力リンク a[href*=recommend-csv]（stock_list_index.twig:443 / trans admin.stock.list.recommend_csv＝messages.ja.yaml:4452）
 *    ※ 出力系ボタンは {% if pagination is not empty %} 配下＝検索結果がある時のみ表示（stock_list_index.twig:439）
 *  - 失敗時フラッシュ .alert-danger（alert.twig:42。addError 'admin'→eccube.admin.error→alert.twig:41）
 *    文言 admin.stock.list.search_required_for_csv（messages.ja.yaml:4419／刷新先追加・不具合候補#2＝期待値は文言でなく「エラー表示＋処理未完了」で判定）
 */
export class StockProductStockRecommendCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // 在庫一覧
  readonly recommendCsvUrl: string; // 在庫リコメンドCSV出力(直接アクセス)

  readonly searchButton: Locator; // 検索ボタン（stock_list_index.twig:412）
  readonly recommendCsvLink: Locator; // 在庫リコメンドCSV出力リンク（stock_list_index.twig:443）
  readonly errorAlert: Locator; // 失敗時フラッシュ（alert.twig:42）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock`;
    this.recommendCsvUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/recommend-csv`;

    this.searchButton = page.getByRole("button", { name: "検索" });
    this.recommendCsvLink = page.locator('a[href*="recommend-csv"]');
    this.errorAlert = page.locator(".alert-danger");
  }

  async goto() {
    await this.page.goto(this.listUrl);
  }

  /** CSV出力URLへ直接アクセスする（URL直接アクセス／未検索時のガード確認）。 */
  async gotoRecommendCsvDirect() {
    await this.page.goto(this.recommendCsvUrl);
  }

  /** 在庫一覧で検索を実行し、検索条件をセッションに保持させる（出力リンク表示の前提）。 */
  async search() {
    await this.searchButton.click();
  }

  /** 検索実行後に在庫リコメンドCSV出力リンクが表示されること（仕様: 検索後に出力可）。 */
  async seeRecommendCsvLink() {
    await expect(this.recommendCsvLink).toBeVisible();
  }

  /** 検索前(初期表示)はCSV出力リンクが表示されないこと（仕様: 出力抑止）。 */
  async seeRecommendCsvLinkAbsent() {
    await expect(this.recommendCsvLink).toHaveCount(0);
  }

  /** リコメンドCSV出力リンク押下でダウンロードを取得する。 */
  async downloadViaLink() {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.recommendCsvLink.click(),
    ]);
    return download;
  }

  /** CSV出力URLへ直接アクセスしてダウンロードを取得する（検索済みセッション前提）。 */
  async downloadViaDirectUrl() {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.page.goto(this.recommendCsvUrl),
    ]);
    return download;
  }

  /** 失敗時にエラーメッセージが表示されること（仕様: 失敗時はエラー＋処理未完了）。 */
  async seeError() {
    await expect(this.errorAlert).toBeVisible();
  }

  /** 在庫一覧画面に滞留/遷移していること（失敗時の遷移）。 */
  async seeOnStockList() {
    await expect(this.page).toHaveURL(
      new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/stock(\\?|$)`)
    );
  }
}
