import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理「欠品履歴CSV出力」Page Object（M04-20）。
 * 納品ケース表 integration_test/e2e/m04_20_admin_stock_stock_shortage_history_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(Excel基本設計書 M04-20 / functions/ec-cube-enterprise/m04-20_admin_stock_stock_shortage_history_csv_export.md / 観点表)由来
 * （オラクル独立性）。実装の現挙動・Form制約・固定ヘッダ列・ファイル名prefixは期待値に流用しない。
 *
 * screenExists=true（刷新先 ec-cube-enterprise に画面・ルートが存在）。
 *  欠品履歴CSV出力は独立画面ではなく、在庫履歴一覧（admin_stock_history）を「欠品検索（disposal_search）」状態にしたときの
 *  「CSVダウンロード」ボタンが起点。has_search_disposal==true のとき formaction が
 *  admin_stock_history_disposal_csv_export（POST /<route>/product/stock/history/disposal/csv_export）へ切替わる（history.twig:597-601）。
 *  一覧の全件を hidden ids[] でPOST送信する（history.twig:604-606。Form項目名 ids[] は実装由来＝期待値に固定しない）。
 *
 * 自動化はダウンロード発火・添付（.csv）・画面遷移なし・ファイル名形式・UI部品（一覧入口/欠品検索でのCSVボタン表示/formaction）・
 * 未認証ガードに限る。CSV本文（列・値・対象データ一致・行順・文字コード）は手動/間接でケース表が管理する。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Stock/history.twig）。
 * DOM id は Symfony Form getBlockPrefix=`admin_stock_history`（StockHistoryType.php:580-583）から導出。
 *  - 在庫履歴一覧:   route admin_stock_history = GET/POST /<route>/product/stock/history（StockHistoryController.php:64）
 *      画面タイトル trans admin.stock.history.title=「在庫履歴一覧」（history.twig:5 / messages.ja.yaml:4550）
 *      サブタイトル trans admin.stock.history.stock_management=「在庫管理」（history.twig:6 / messages.ja.yaml:4551）
 *  - 検索フォーム:    #search_form（history.twig:185, action=admin_stock_history, method=post）
 *      欠品検索 form.disposal_search（ChoiceType expanded+multiple）→ チェックボックス
 *        #admin_stock_history_disposal_search_0（history.twig:261 / 選択肢 trans admin.stock.history.disposal_search_select=「欠品履歴一覧を表示」messages.ja.yaml:4559）
 *      検索ボタン type=submit trans admin.common.search=「検索」（history.twig:555 / messages.ja.yaml:1446）
 *  - CSV出力フォーム:  #form_bulk（history.twig:595, method=POST）
 *      ※ pagination.totalItemCount>0（検索結果あり）のときのみ描画（history.twig:565）
 *      CSVボタン type=submit、has_search_disposal==true 時 formaction=admin_stock_history_disposal_csv_export（history.twig:600）
 *        ラベル trans admin.common.csv_download=「CSVダウンロード」（history.twig:602 / messages.ja.yaml:1546）
 *  - エラーフラッシュ: .alert-danger（共通 alert / app.flashes('eccube.admin.error')）
 *
 * ルート（src/Eccube/Controller/Admin/Stock/StockHistoryController.php）:
 *  - 欠品履歴CSV出力 admin_stock_history_disposal_csv_export = POST /<route>/product/stock/history/disposal/csv_export（:318-319）
 *    正常: StreamedResponse（HTTP 200 / Content-Type text/csv;charset=windows-31j / Content-Disposition attachment; filename=stock_history_disposal_<YmdHis>.csv）
 *    対象ID空(ids無し/0以下のみ): responseNoStockHistoryIdError() → addError(admin.stock_history.not_select) ＋ admin_stock_history_page へリダイレクト（:327-328,:444-450）
 *    取得0件/変換結果空: StockHistoryDisposalCsv::exportCsv() が RuntimeException → addError ＋ リファラ or admin_stock_history へリダイレクト（:347-357）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class StockStockShortageHistoryCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // 在庫履歴一覧（欠品履歴CSV出力の起点）
  readonly disposalExportPath: string; // 欠品履歴CSV出力 POSTルート（直接アクセス/未認証ガード検証用）

  readonly title: Locator; // 画面タイトル h2（history.twig:5 / default_frame.twig:196）
  readonly searchForm: Locator; // 検索フォーム #search_form（history.twig:185）
  readonly disposalSearchCheckbox: Locator; // 欠品検索 #admin_stock_history_disposal_search_0（history.twig:261）
  readonly searchButton: Locator; // 検索ボタン（history.twig:555）
  readonly csvExportForm: Locator; // CSV出力フォーム #form_bulk（history.twig:595）
  readonly disposalCsvButton: Locator; // 欠品履歴CSVダウンロードボタン（history.twig:600-603）
  readonly errorAlert: Locator; // エラーフラッシュ .alert-danger

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/history`;
    this.disposalExportPath = `/${ECCUBE_ADMIN_ROUTE}/product/stock/history/disposal/csv_export`;

    // 画面タイトルは default_frame の見出し h2（複数 h2 描画に備え first で限定）。文言は spec 側で TITLE と照合。
    this.title = page.locator("h2").first();
    this.searchForm = page.locator("#search_form");
    // 欠品検索チェックボックス（getBlockPrefix admin_stock_history ＋ ChoiceType expanded の先頭 _0）
    this.disposalSearchCheckbox = page.locator(
      "#admin_stock_history_disposal_search_0"
    );
    // 検索フォーム内の submit（CSV出力ボタンと区別するためフォームスコープ＋文言で限定）
    this.searchButton = this.searchForm.getByRole("button", {
      name: "検索",
      exact: true,
    });
    this.csvExportForm = page.locator("#form_bulk");
    // formaction（ルート名由来）で欠品履歴CSV出力ボタンを特定（ラベルは trans admin.common.csv_download 由来）
    this.disposalCsvButton = this.csvExportForm.locator(
      `button[type="submit"][formaction$="/product/stock/history/disposal/csv_export"]`
    );
    this.errorAlert = page.locator(".alert-danger");
  }

  /** 在庫履歴一覧（欠品履歴CSV出力ボタンの起点画面）を開く。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 欠品履歴CSV出力URLへ直接アクセスする（URL直接アクセス／未認証ガード検証用。POST専用ルート）。 */
  async gotoDisposalExport() {
    await this.page.goto(this.disposalExportPath).catch(() => null);
  }

  /**
   * 在庫履歴一覧で「欠品検索」をONにして検索を1回実行し、欠品履歴一覧（has_search_disposal=true）を確定させる。
   * 欠品検索状態のとき CSV出力ボタンの formaction が欠品履歴CSV出力ルートへ切替わる（history.twig:597-601）。
   */
  async runDisposalSearch() {
    await this.gotoList();
    await this.disposalSearchCheckbox.check();
    await this.searchButton.click();
    await expect(this.page).toHaveURL(
      new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/stock/history`)
    );
  }

  /** 「CSVダウンロード」ボタン（欠品履歴側）を押下し、ダウンロード発火を待って Download を返す（欠品検索結果あり前提）。 */
  async downloadViaButton() {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.disposalCsvButton.click(),
    ]);
    return download;
  }

  /** 在庫履歴一覧画面（欠品履歴CSV出力の起点）に到達していること。 */
  async seeListScreen() {
    await expect(this.searchForm).toBeVisible();
  }

  /** 未認証で当該URLへアクセスすると管理ログイン画面へ誘導されること（仕様: 未認証ガード）。 */
  async seeRedirectedToLogin() {
    await expect(this.page).toHaveURL(new RegExp(`/${ECCUBE_ADMIN_ROUTE}/login`));
    await expect(this.page.locator("#login_id")).toBeVisible();
  }
}
