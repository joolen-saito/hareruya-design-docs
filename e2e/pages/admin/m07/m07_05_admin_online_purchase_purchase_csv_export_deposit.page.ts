import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * ネット買取管理「入金CSV」出力 Page Object。
 * 納品ケース表 integration_test/e2e/m07_05_admin_online_purchase_purchase_csv_export_deposit_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m07-05_admin_online_purchase_purchase_csv_export_deposit.md /
 * PurchaseController.php / BuyOrderDepositCsvExportService.php / messages.ja.yaml)由来（オラクル独立性）。
 * 実装からはセレクタ・ルート（位置情報）のみを取り、合否は仕様で判定する。
 *
 * 本機能は買取一覧で検索を実行し、結果1件以上のとき表示される「ダウンロード」ドロップダウン内の
 * 「入金CSV」(#csvexport_deposit) を、行チェックを付けた状態で押すと入金CSVがストリーム応答される。
 * CSVの中身（列順・列値・空値・振込金額計算・BOM/エンコーディング/区切り文字・ファイル名内の値）は手動確認とする。
 * 自動化はメニュー表示・行チェック/全選択・ダウンロード発火・ファイル名書式・HTTP応答ヘッダ・
 * 未選択時のJSアラート抑止・空ID/不在IDのサーバ側フラッシュ＋リダイレクトに限る。
 *
 * セレクタは Twig 由来の位置情報のみ
 * （src/Eccube/Resource/template/admin/Purchase/index.twig / html/template/admin/assets/js/Purchase/purchase.js）:
 *  - 検索フォーム: form#search_form（index.twig:47。method=post・action=admin_purchase_search）
 *  - 検索ボタン: form#search_form button[type="submit"]（index.twig:144。trans admin.common.search=「検索」）
 *  - 出力フォーム: form#bulk_csv_export（index.twig:162。method=post・既定actionなし。pagination>0時のみ描画 index.twig:161）
 *  - ダウンロードドロップダウン: #result_list__custom_csv_menu（index.twig:166）／トグル .dropdown-toggle（index.twig:167）
 *  - 入金CSV: #csvexport_deposit（index.twig:172。formaction=admin_purchase_csv_export_deposit。trans admin.purchase.online.btn.csvexport_deposit=「入金CSV」 messages.ja.yaml:5251）
 *  - 全選択チェック: #allCheck（index.twig:212。JS purchase.js:2-5 が input[type=checkbox][buyOrderId] を一括ON/OFF）
 *  - 行チェック: input[name="buyOrderIds[]"].searched_buy_order_id（index.twig:231）
 *  - フラッシュ: .alert-danger（addError 'admin' namespace。class は要実機確認）
 *
 * ルート（src/Eccube/Controller/Admin/Purchase/PurchaseController.php）:
 *  - 一覧 admin_purchase_list = GET /<route>/purchase/list（:133）
 *  - 検索 admin_purchase_search = POST /<route>/purchase/search（:143）
 *  - 一覧ページ admin_purchase_page = GET /<route>/purchase/page/{page_no}（:144）
 *  - 入金CSV admin_purchase_csv_export_deposit = POST /<route>/purchase/csv_export_deposit（:564）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class OnlinePurchasePurchaseCsvExportDepositPage {
  readonly page: Page;
  readonly listUrl: string; // 買取一覧（admin_purchase_list）
  readonly exportUrl: string; // 入金CSV出力ルート（admin_purchase_csv_export_deposit, POST）

  readonly searchForm: Locator; // form#search_form（index.twig:47）
  readonly searchButton: Locator; // 検索 submit（index.twig:144）
  readonly bulkCsvForm: Locator; // form#bulk_csv_export（index.twig:162）
  readonly csvMenu: Locator; // #result_list__custom_csv_menu（index.twig:166）
  readonly depositCsvButton: Locator; // 入金CSV #csvexport_deposit（index.twig:172）
  readonly allCheck: Locator; // #allCheck（index.twig:212）
  readonly rowCheckboxes: Locator; // input[name="buyOrderIds[]"]（index.twig:231）
  readonly dangerAlert: Locator; // フラッシュ .alert-danger

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/purchase/list`;
    this.exportUrl = `/${ECCUBE_ADMIN_ROUTE}/purchase/csv_export_deposit`;

    this.searchForm = page.locator("#search_form");
    this.searchButton = page.locator('#search_form button[type="submit"]');
    this.bulkCsvForm = page.locator("#bulk_csv_export");
    this.csvMenu = page.locator("#result_list__custom_csv_menu");
    this.depositCsvButton = page.locator("#csvexport_deposit");
    this.allCheck = page.locator("#allCheck");
    this.rowCheckboxes = page.locator('input[name="buyOrderIds[]"]');
    this.dangerAlert = page.locator(".alert-danger");
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 買取一覧の指定ページ（admin_purchase_page = GET /<route>/purchase/page/{n}）を開く。範囲外ページで結果0件状態を作る。 */
  async gotoListPage(pageNo: number) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/purchase/page/${pageNo}`);
  }

  /** 現在表示中の各行チェックボックスの value（buyOrderId）を数値配列で返す。 */
  async rowCheckboxValues(): Promise<number[]> {
    const values = await this.rowCheckboxes.evaluateAll((els) =>
      els.map((e) => (e as HTMLInputElement).value)
    );
    return values
      .map((v) => parseInt(v, 10))
      .filter((n) => Number.isFinite(n));
  }

  /** 検索条件を空のまま検索を実行（全件ヒット）。POST→結果が描画される。 */
  async searchAll() {
    await this.searchButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /** 結果行チェックボックス数（ヒット件数の代理。0 ならシード不足または0件）。 */
  async resultCount(): Promise<number> {
    return this.rowCheckboxes.count();
  }

  /** ダウンロードのドロップダウンを開く（メニュー項目を可視化する）。 */
  async openCsvMenu() {
    await this.csvMenu.locator(".dropdown-toggle").click();
  }

  /** 先頭の買取注文行のチェックを付ける。 */
  async checkFirstRow() {
    await this.rowCheckboxes.first().check();
  }

  /**
   * 行を選択した状態で「入金CSV」を押し、ダウンロード発火を待つ。
   * #csvexport_deposit は formaction=admin_purchase_csv_export_deposit へ #bulk_csv_export を POST する。
   */
  async clickDepositCsvAndWaitDownload(): Promise<Download> {
    await this.openCsvMenu();
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.depositCsvButton.click(),
    ]);
    return download;
  }

  /**
   * メニューを開いて「入金CSV」を押すのみ（ダウンロード待ちはしない）。
   * 呼び出し側で page.waitForResponse / waitForEvent('download') と組み合わせ、ブラウザの実フォーム送信を観測する。
   */
  async openMenuAndClickDepositCsv(): Promise<void> {
    await this.openCsvMenu();
    await this.depositCsvButton.click();
  }

  /** 「入金CSV」が仕様どおり表示されること（検索結果が正のとき）。 */
  async seeDepositCsvMenu() {
    await this.openCsvMenu();
    await expect(this.depositCsvButton).toBeVisible();
    // 文言は trans admin.purchase.online.btn.csvexport_deposit=「入金CSV」（messages.ja.yaml:5251）。
    await expect(this.depositCsvButton).toContainText("入金CSV");
  }
}
