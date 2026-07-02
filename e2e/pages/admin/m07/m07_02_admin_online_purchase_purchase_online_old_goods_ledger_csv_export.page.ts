import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 ネット買取管理「古物台帳入力用CSV出力」Page Object（M07-02）。
 * 納品ケース表 integration_test/e2e/m07_02_admin_online_purchase_purchase_online_old_goods_ledger_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 本機能は単独画面を持たず、買取一覧（admin_purchase_list）の検索結果の一括ダウンロードメニュー
 * 「古物台帳入力用CSV」（#csvexport）と、買取詳細（admin_purchase_edit）の「古物台帳入力用CSV出力」
 * （#export_csv）から、POST /<route>/purchase/csv_export で StreamedResponse をダウンロードする。
 *
 * 期待結果は仕様（functions/pf-eccube3/m07-02_..._csv_export.md / 観点表 / 基本設計）由来（オラクル独立性）。
 * 設計源は pf-eccube3(HareruyaEc) リバースだが、刷新先 ec-cube-enterprise に同一画面が実在するためE2E化した。
 * セレクタは Twig/JS 由来の位置情報のみ。実装の現挙動・Form制約・Cookie名は期待値に流用しない。
 * CSV各列値・点数/利用回数/前回利用日の集計・住所連結・年齢・並び順・BOM/エンコードは実ファイルを開いて手動確認。
 *
 * セレクタ根拠（ec-cube-enterprise）:
 *  - 一覧URL admin_purchase_list = GET /<route>/purchase/list（PurchaseController.php:121）
 *  - 検索 admin_purchase_search = POST /<route>/purchase/search（PurchaseController.php:143）
 *  - 詳細URL admin_purchase_edit = GET /<route>/purchase/{id}/edit（PurchaseController.php:199）
 *  - CSV出力 admin_purchase_csv_export = POST /<route>/purchase/csv_export（PurchaseController.php:535、CSRF検証なし）
 *  - 検索フォーム #search_form（index.twig）
 *  - 一括CSVフォーム #bulk_csv_export（index.twig:162）/ CSRFトークン hidden（index.twig:163・本ルートは未検証）
 *  - ダウンロードドロップダウン #result_list__custom_csv_menu のトグル button.dropdown-toggle「ダウンロード」（index.twig:166-169 / admin.common.download）
 *  - 「古物台帳入力用CSV」 #csvexport（index.twig:171、formaction admin_purchase_csv_export、trans admin.purchase.online.btn.csvexport=「古物台帳入力用CSV」messages.ja.yaml:5250）
 *  - 行チェック input.searched_buy_order_id（name=buyOrderIds[]、buyOrderId属性付、index.twig:231）
 *  - 行の詳細リンク a[href$="/edit"]（td#result_list_main__purchase_number--{id} 内 url('admin_purchase_edit') index.twig:234）
 *  - 全選択チェック #allCheck（index.twig:212 / JS purchase.js:2-5 で [buyOrderId] を一括トグル）
 *  - 未選択時のJS中断: purchase.js:13-19（#csvexport等で .searched_buy_order_id:checked==0 なら alert＋return false）
 *  - 詳細 出力ボタン #export_csv（detail.twig:313、formaction admin_purchase_csv_export、trans admin.purchase.online.detail.btn.csvexport=「古物台帳入力用CSV出力」messages.ja.yaml:5253）
 *  - 詳細 隠し #buyOrderIds（name=buyOrderIds[]、value=BuyOrder.id、detail.twig:315）
 *  - フラッシュエラー .alert-danger（alert.twig:42、addError(...,'admin')→flash 'eccube.admin.danger'）
 *
 * 応答ヘッダ(処理フロー#11-12): Content-Type application/octet-stream / Content-Disposition attachment; filename=purchase_<最小ID7桁>_<YmdHis>.csv（Service.php:101-107）。
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class OnlinePurchasePurchaseOnlineOldGoodsLedgerCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // 買取一覧（CSV出力の起点画面）
  readonly exportPath: string; // CSV出力 POSTルート（応答ヘッダ／直接POST検証用）

  readonly searchForm: Locator; // #search_form
  readonly searchButton: Locator; // 検索 submit（trans admin.common.search 系）
  readonly bulkForm: Locator; // #bulk_csv_export（index.twig:162）
  readonly downloadMenuToggle: Locator; // 「ダウンロード」ドロップダウン トグル（index.twig:167）
  readonly csvExportButton: Locator; // #csvexport「古物台帳入力用CSV」（index.twig:171）
  readonly rowCheckboxes: Locator; // input.searched_buy_order_id（index.twig:231）
  readonly allCheck: Locator; // #allCheck（index.twig:212）
  readonly error: Locator; // .alert-danger（alert.twig:42）
  readonly detailExportButton: Locator; // 詳細 #export_csv（detail.twig:313）
  readonly detailHiddenBuyOrderIds: Locator; // 詳細 #buyOrderIds（detail.twig:315）
  readonly rowDetailLinks: Locator; // 一覧の買取詳細リンク（index.twig:234 url('admin_purchase_edit')）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/purchase/list`;
    this.exportPath = `/${ECCUBE_ADMIN_ROUTE}/purchase/csv_export`;

    this.searchForm = page.locator("#search_form");
    this.searchButton = page.locator('#search_form button[type="submit"]', {
      hasText: "検索",
    });
    this.bulkForm = page.locator("#bulk_csv_export");
    this.downloadMenuToggle = page.locator(
      "#result_list__custom_csv_menu button.dropdown-toggle"
    );
    this.csvExportButton = page.locator("#csvexport");
    this.rowCheckboxes = page.locator("input.searched_buy_order_id");
    this.allCheck = page.locator("#allCheck");
    this.error = page.locator(".alert-danger");
    this.detailExportButton = page.locator("#export_csv");
    this.detailHiddenBuyOrderIds = page.locator("#buyOrderIds");
    // 詳細リンク: 一覧の買取番号セル内 admin_purchase_edit へのアンカー（index.twig:234）。
    this.rowDetailLinks = page.locator(
      'td[id^="result_list_main__purchase_number--"] a[href$="/edit"]'
    );
  }

  /** 買取一覧（CSV出力リンクの起点画面）を開く。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 買取詳細（編集）画面を開く。 */
  async gotoDetail(id: number | string) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/purchase/${id}/edit`);
  }

  /** 買取一覧で空条件のまま検索し、検索結果一覧（一括CSVフォーム）を表示する。 */
  async searchAll() {
    await this.gotoList();
    await this.searchButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /** 「ダウンロード」ドロップダウンを開く。 */
  async openDownloadMenu() {
    await this.downloadMenuToggle.click();
  }

  /** 先頭行のチェックボックスを選択する。 */
  async selectFirstRow() {
    await this.rowCheckboxes.first().check();
  }

  /** 先頭行チェックボックスの value（買取注文ID）を返す。ファイル名（最小ID）照合に使う。 */
  async firstRowBuyOrderId(): Promise<string> {
    const v = await this.rowCheckboxes.first().getAttribute("value");
    return v ?? "";
  }

  /** 一覧先頭行の買取詳細（編集）画面を、行の詳細リンク経由で開く。 */
  async openFirstDetail() {
    await this.rowDetailLinks.first().click();
    await this.page.waitForLoadState("networkidle");
  }

  /** 表頭の全選択チェックをオンにする（JSが [buyOrderId] を一括トグル）。 */
  async selectAll() {
    await this.allCheck.check();
  }

  /** 「古物台帳入力用CSV」（#csvexport）を押下する（ドロップダウンは事前に開くこと）。 */
  async clickCsvExport() {
    await this.csvExportButton.click();
  }

  /**
   * 一覧で「古物台帳入力用CSV」押下→ダウンロード発火を待って Download を返す。
   * ドロップダウン内のボタンのため先にトグルを開く。事前に1件以上選択しておくこと。
   */
  async downloadViaList(): Promise<Download> {
    await this.openDownloadMenu();
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.clickCsvExport(),
    ]);
    return download;
  }

  /** 詳細画面で「古物台帳入力用CSV出力」（#export_csv）押下→ダウンロード発火を待って返す。 */
  async downloadViaDetail(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.detailExportButton.click(),
    ]);
    return download;
  }

  /** 検索結果が1件以上のとき「ダウンロード」入口と「古物台帳入力用CSV」が表示されること（仕様: totalItemCount>0）。 */
  async seeCsvDownloadEntry() {
    await expect(this.downloadMenuToggle).toBeVisible();
    await this.openDownloadMenu();
    await expect(this.csvExportButton).toBeVisible();
  }

  /** 検索結果の各行チェックボックスと表頭allCheckが表示されること。 */
  async seeSelectionCheckboxes() {
    await expect(this.rowCheckboxes.first()).toBeVisible();
    await expect(this.allCheck).toBeVisible();
  }
}
