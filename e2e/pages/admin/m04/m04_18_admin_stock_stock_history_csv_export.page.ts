import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理「在庫履歴CSV出力」Page Object（M04-18）。
 * 納品ケース表 integration_test/e2e/m04_18_admin_stock_stock_history_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m04-18_admin_stock_stock_history_csv_export.md / 観点表)由来
 * （オラクル独立性）。実装の現挙動・固定ヘッダ列・ファイル名prefix(stock_history_)は期待値に流用しない。
 *
 * 本機能は在庫履歴一覧（admin_stock_history）の「CSVダウンロード」ボタンからの StreamedResponse ダウンロードであり、
 * 一覧に表示中の検索条件一致の全件（PaginationAll を hidden ids[]）をPOSTでCSV出力する
 * （検索条件は在庫履歴一覧側のセッション eccube.admin.stock.stock_history.search に従う）。
 * 自動化はダウンロード発火・応答ヘッダ（添付/.csv）・UI部品（ボタン表示/押下）・画面遷移なし・未認証ガードに限る。
 * CSV本文（列・値・文字コード・BOM・対象データ一致・検索条件反映・ファイル名prefix・0件時ヘッダ行のみ）は
 * 手動/間接または要実機(fixme)でケース表が全量管理する。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Stock/history.twig）。
 * ルート名由来の formaction / フォームIDを主セレクタとし、CSSクラスは補助に留める:
 *  - 在庫履歴一覧:     route admin_stock_history          = GET/POST /<route>/product/stock/history（StockHistoryController.php:64）
 *      画面タイトル trans admin.stock.history.title=「在庫履歴一覧」（history.twig:5 / messages.ja.yaml:4550）
 *  - 検索フォーム:      #search_form（history.twig:185, action=admin_stock_history）
 *      検索ボタン type=submit trans admin.common.search=「検索」（history.twig:555 / messages.ja.yaml:1446）
 *  - CSV出力フォーム:    #form_bulk（history.twig:595, method=POST）
 *      ※ pagination.totalItemCount>0（検索結果あり）のときのみ描画（history.twig:565）
 *      CSVボタン type=submit formaction=admin_stock_history_csv_export（history.twig:598）
 *        ラベル trans admin.common.csv_download=「CSVダウンロード」（history.twig:602 / messages.ja.yaml:1546）
 *        ※ has_search_disposal==true 時は formaction が admin_stock_history_disposal_csv_export に切替（history.twig:600）。
 *         本機能（在庫履歴CSV）は csv_export 側を起点とし、欠品履歴CSV（disposal）は別出力のため対象外。
 *      ※ 一覧の全件を hidden ids[] でPOST送信する実装だが（history.twig:604-606）、
 *         Form項目名 ids[] は実装由来のため期待値・依存に固定しない。CSV発火は「CSVダウンロード」ボタン押下→download で観測する。
 *  - エラーフラッシュ:   .alert-danger（共通 alert / addError('eccube.admin.error') StockHistoryController.php:446）
 *
 * ルート（src/Eccube/Controller/Admin/Stock/StockHistoryController.php）:
 *  - 在庫履歴CSV出力 admin_stock_history_csv_export = POST /<route>/product/stock/history/csv_export（:269）
 *    応答(StreamedResponse): CSV添付ダウンロード / filename=stock_history_<YmdHis>.csv（src/Eccube/Service/Csv/StockHistoryCsv.php:75。
 *      設計のprefixは product_stock_history_ であり乖離＝ケース表 付帯表4#3。filename prefixは実装観測値でありオラクルではない）
 *    対象ID空: addError(admin.stock_history.not_select)＋admin_stock_history_page へリダイレクト（:274-277,:444-450。
 *      trans キー未定義＝付帯表4#5）
 *
 * 設計（pf-eccube3）入口は GET /<route>/product/history/stock/export（付帯表4#1）。本POMが用いる
 * /product/stock/history・/product/stock/history/csv_export は実行系(刷新先)のナビゲーション錨であって値オラクルではない。
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class StockStockHistoryCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // 在庫履歴一覧（admin_stock_history＝CSV出力の起点）
  readonly exportPath: string; // 在庫履歴CSV出力 POSTルート（ヘッダ/直接アクセス検証用）

  readonly title: Locator; // 画面タイトル（h2/見出し）
  readonly searchForm: Locator; // 検索フォーム #search_form（history.twig:185）
  readonly productName: Locator; // 汎用ワード検索欄（0件検索の投入先。history.twig:192 / StockHistoryType getBlockPrefix=admin_stock_history）
  readonly searchButton: Locator; // 検索ボタン（history.twig:555）
  readonly csvExportForm: Locator; // CSV出力フォーム #form_bulk（history.twig:595）
  readonly csvExportButton: Locator; // CSVダウンロードボタン（history.twig:598-603）
  readonly errorAlert: Locator; // エラーフラッシュ .alert-danger

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/history`;
    this.exportPath = `/${ECCUBE_ADMIN_ROUTE}/product/stock/history/csv_export`;

    this.title = page.locator("h2");
    this.searchForm = page.locator("#search_form");
    this.productName = page.locator("#admin_stock_history_product_name");
    // 検索フォーム内の submit（CSV出力ボタン等と区別するためフォームスコープ＋文言で限定）
    this.searchButton = this.searchForm.getByRole("button", {
      name: "検索",
      exact: true,
    });
    this.csvExportForm = page.locator("#form_bulk");
    // formaction（ルート名由来）でCSV出力ボタンを特定（ラベルは trans キー由来であることをコメントで確認済み）
    this.csvExportButton = this.csvExportForm.locator(
      `button[type="submit"][formaction$="/product/stock/history/csv_export"]`
    );
    this.errorAlert = page.locator(".alert-danger");
  }

  /** 在庫履歴一覧（CSV出力ボタンの起点画面）を開く。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 在庫履歴CSV出力URLへ直接アクセスする（URL直接アクセス／未認証ガード検証用）。 */
  async gotoExport() {
    await this.page.goto(this.exportPath).catch(() => null);
  }

  /**
   * 在庫履歴一覧で検索を1回実行し、一覧（pagination）を確定させる。
   * 検索条件は在庫履歴一覧側のセッションに従う（本機能は入力フォームを持たない）。
   * 注: 欠品フィルタ無しの既定検索を実行し has_search_disposal==false を確定させる（history.twig:597）。
   *   前回セッションに欠品検索状態が残ると CSVボタンの formaction が disposal_csv_export に切替わるため、
   *   csvExportButton（formaction=csv_export 限定）の安定描画には disposal 状態の初期化が必要（要確認）。
   */
  async runSearch() {
    await this.gotoList();
    await this.searchButton.click();
    await expect(this.page).toHaveURL(
      new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/stock/history`)
    );
  }

  /**
   * 0件ヒットする検索（存在しない商品コード等）を実行する（要実機確認＝投入値の妥当性）。
   * 設計のエッジケース「該当0件＝ヘッダ行のみCSV」を検証する起点。
   */
  async runSearchNoMatch(keyword: string) {
    await this.gotoList();
    await this.productName.fill(keyword);
    await this.searchButton.click();
    await expect(this.page).toHaveURL(
      new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/stock/history`)
    );
  }

  /** 「CSVダウンロード」ボタンを押下し、ダウンロード発火を待って Download を返す（検索結果あり前提）。 */
  async downloadViaButton(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.csvExportButton.click(),
    ]);
    return download;
  }

  /** 在庫履歴一覧画面に到達していること（入口の表示確認）。 */
  async seeListScreen() {
    await expect(this.searchForm).toBeVisible();
  }
}
