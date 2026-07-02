import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 店頭買取管理「買取商品履歴 選択CSV出力」Page Object。
 * 納品ケース表 integration_test/e2e/m06_07_admin_store_purchase_purchase_store_history_select_csv_export_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m06-07_admin_store_purchase_purchase_store_history_select_csv_export.md /
 * OtcBuyOrderHistoryController.php / OtcBuyOrderHistoryCsvExportService.php / messages.ja.yaml)由来（オラクル独立性）。
 * 実装からはセレクタ・ルート（位置情報）のみを取り、合否は仕様で判定する。
 *
 * 本機能は買取商品履歴一覧で検索を実行し、結果1件以上のとき表示される「CSVダウンロード」ドロップダウン内の
 * 「選択した商品履歴取得」を、行チェックを付けた状態で押すと選択履歴のCSVがストリーム応答される。
 * CSVの中身（列順・列値・会員ID/申込者の空・買取日時形式・三位区切りなし・並び順・BOM/エンコーディング/区切り）は
 * 手動確認とする。自動化はメニュー表示・行チェック/全選択・ダウンロード発火・ファイル名・HTTP応答ヘッダ・
 * 未選択時のフラッシュ＋リダイレクトに限る。
 *
 * セレクタは Twig 由来の位置情報のみ
 * （src/Eccube/Resource/template/admin/OtcBuyOrder/history.twig）:
 *  - 検索フォーム: form#search_form（history.twig:33。method=POST・action=admin_otcbuyorder_history）
 *  - 検索ボタン: form#search_form button[type="submit"].searchBtn（twig:151。trans admin.purchase.store.history.form.search.button=「検索する」messages.ja.yaml:5206）
 *  - 出力フォーム: form#result_form（twig:158。method=POST・action=admin_otcbuyorder_history_export）
 *  - hidden export_type: #export_type（twig:159。JSが押下時に値を設定）
 *  - 全選択チェック: #allCheck（twig:203。JSが [otcBuyOrderHistoryId] 行チェックを一括ON/OFF）
 *  - 行チェック: input[name="otcBuyOrderHistoryIds[]"]（twig:226。id="otcBuyOrderHistoryIds[]" は全行重複のため name で特定）
 *  - CSVダウンロードドロップダウン: #result_list__custom_csv_menu（twig:186）
 *  - 「選択した商品履歴取得」: a.export-link[data-type="check_export"]（twig:189。JS: #export_type=check_export→#result_form submit）
 *  - 「検索結果全件取得」: a.export-link[data-type="all_export"]（twig:190。本書スコープ外）
 *  - 結果一覧: #result_list（twig:161）/ 結果行 tr[id^="result_list_main__item--"]（twig:224）
 *  - データ無し見出し: 「検索条件に該当するデータがありませんでした。」（twig:254。totalItemCount=0 時）
 *  - フラッシュ: .alert-danger（addError 'admin' namespace Controller.php:158 / admin フレームで描画。class は要実機確認）
 *
 * ルート（src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderHistoryController.php）:
 *  - 一覧 admin_otcbuyorder_history = GET/POST /<route>/otcbuyorder/history（Controller.php:60-65）
 *  - 一覧ページ admin_otcbuyorder_history_page = GET /<route>/otcbuyorder/history/page/{page_no}（Controller.php:68-73）
 *  - 出力 admin_otcbuyorder_history_export = POST /<route>/otcbuyorder/history/export（Controller.php:130-135）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class StorePurchasePurchaseStoreHistorySelectCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // 買取商品履歴一覧（admin_otcbuyorder_history）
  readonly exportUrl: string; // 選択CSV出力ルート（admin_otcbuyorder_history_export, POST）

  readonly searchForm: Locator; // form#search_form（twig:33）
  readonly searchButton: Locator; // 検索する submit（twig:151）
  readonly assessmentIdInput: Locator; // 査定番号欄（twig:42 静的wrapper #search_box__assessment_id 配下）
  readonly resultForm: Locator; // form#result_form（twig:158）
  readonly exportTypeHidden: Locator; // #export_type（twig:159）
  readonly allCheck: Locator; // #allCheck（twig:203）
  readonly rowCheckboxes: Locator; // input[name="otcBuyOrderHistoryIds[]"]（twig:226）
  readonly csvMenu: Locator; // #result_list__custom_csv_menu（twig:186）
  readonly checkExportLink: Locator; // 「選択した商品履歴取得」（twig:189）
  readonly allExportLink: Locator; // 「検索結果全件取得」（twig:190・スコープ外）
  readonly resultRows: Locator; // 結果行 tr[id^="result_list_main__item--"]（twig:224）
  readonly noDataHeading: Locator; // 「検索条件に該当するデータがありませんでした。」（twig:254）
  readonly dangerAlert: Locator; // フラッシュ .alert-danger（Controller.php:158）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/history`;
    this.exportUrl = `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/history/export`;

    this.searchForm = page.locator("#search_form");
    this.searchButton = page.locator('#search_form button[type="submit"]');
    this.assessmentIdInput = page.locator("#search_box__assessment_id input");
    this.resultForm = page.locator("#result_form");
    this.exportTypeHidden = page.locator("#export_type");
    this.allCheck = page.locator("#allCheck");
    this.rowCheckboxes = page.locator('input[name="otcBuyOrderHistoryIds[]"]');
    this.csvMenu = page.locator("#result_list__custom_csv_menu");
    this.checkExportLink = page.locator('a.export-link[data-type="check_export"]');
    this.allExportLink = page.locator('a.export-link[data-type="all_export"]');
    this.resultRows = page.locator('tr[id^="result_list_main__item--"]');
    this.noDataHeading = page.locator("#result_list_main__header");
    this.dangerAlert = page.locator(".alert-danger");
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 検索条件を空のまま検索を実行（全件ヒット）。POST→結果が描画される。 */
  async searchAll() {
    await this.searchButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /** 結果行数（ヒット件数の代理。0 ならシード不足または0件）。 */
  async resultCount(): Promise<number> {
    return this.resultRows.count();
  }

  /**
   * 査定番号にヒットしない値を入れて検索し、結果0件にする（0件時のメニュー非描画を確認するため）。
   * 0件時は twig:254「検索条件に該当するデータがありませんでした。」のみが描画され、CSVメニュー/行は描画されない。
   */
  async searchNoHit(value = "E2E-NO-MATCH-99999999") {
    await this.assessmentIdInput.fill(value);
    await this.searchButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /** CSVダウンロードのドロップダウンを開く（メニュー項目を可視化する）。 */
  async openCsvMenu() {
    await this.csvMenu.locator("a.dropdown-toggle").click();
  }

  /** 先頭の履歴行のチェックを付ける。 */
  async checkFirstRow() {
    await this.rowCheckboxes.first().check();
  }

  /**
   * 行を選択した状態で「選択した商品履歴取得」を押し、ダウンロード発火を待つ。
   * JS が #export_type=check_export を設定し #result_form を submit する（twig:189 / otc-buy-order-history.js）。
   */
  async clickCheckExportAndWaitDownload(): Promise<Download> {
    await this.openCsvMenu();
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.checkExportLink.click(),
    ]);
    return download;
  }

  /**
   * メニューを開いて「選択した商品履歴取得」を押すのみ（ダウンロード待ちはしない）。
   * 呼び出し側で page.waitForResponse / waitForEvent('download') と組み合わせ、ブラウザの実フォーム送信を観測する。
   */
  async openMenuAndClickCheckExport(): Promise<void> {
    await this.openCsvMenu();
    await this.checkExportLink.click();
  }

  /** 未選択のまま「選択した商品履歴取得」を押す（サーバ側でフラッシュ＋リダイレクトされる）。 */
  async clickCheckExportWithoutSelection() {
    await this.openCsvMenu();
    await this.checkExportLink.click();
    await this.page.waitForLoadState("networkidle");
  }

  /** 「選択した商品履歴取得」メニューが仕様どおり表示されること（検索結果が正のとき）。 */
  async seeCheckExportMenu() {
    await expect(this.checkExportLink).toHaveCount(1);
    // 文言は history.twig:189 の直書き「選択した商品履歴取得」。
    await expect(this.checkExportLink).toContainText("選択した商品履歴取得");
  }
}
