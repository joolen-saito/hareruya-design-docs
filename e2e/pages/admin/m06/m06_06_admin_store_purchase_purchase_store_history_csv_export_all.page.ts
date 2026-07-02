import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店頭買取管理「買取商品履歴 検索結果全件CSV出力」Page Object（M06-06）。
 * 納品ケース表 integration_test/e2e/m06_06_admin_store_purchase_purchase_store_history_csv_export_all_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m06-06_admin_store_purchase_purchase_store_history_csv_export_all.md / 観点表)由来
 * （オラクル独立性）。設計源は pf-eccube3(HareruyaEc) リバースだが、DB・挙動は刷新先 ec-cube-enterprise を正とし
 * 当該画面（route admin_otcbuyorder_history / Twig admin/OtcBuyOrder/history.twig）の存在を確認済み。
 * 実装の現挙動・Form制約・内部セッションキー名・ログ文言は期待値に流用しない。
 *
 * 本機能は買取商品履歴一覧（検索）上部の「CSVダウンロード」ドロップダウン内「検索結果全件取得」リンク押下で、
 * JSが隠し #export_type に all_export を入れ #result_form を POST 送信し、検索条件セッションに合致する全履歴を
 * StreamedResponse でダウンロードする。自動化はダウンロード発火・ファイル名・応答・UI部品・確認ダイアログ不在・
 * 未認証ガード・検索セッション欠如時のフラッシュ＆リダイレクトに限る。CSV各列の値・固定ヘッダ文言・行数・BOM/エンコードは実ファイルを開いて手動確認。
 *
 * セレクタは Twig / JS 由来の位置情報のみ:
 *  - 履歴一覧画面:        route admin_otcbuyorder_history = GET/POST /<route>/otcbuyorder/history（OtcBuyOrderHistoryController.php）
 *  - 検索フォーム:        #search_form（history.twig:33 action admin_otcbuyorder_history）
 *  - 検索ボタン:          .searchBtn（history.twig:151 / trans admin.purchase.store.history.form.search.button=「検索する」 messages.ja.yaml:5206）
 *  - 検索結果件数:        #result_list_main__header h3.box-title「検索結果 … 件 が該当しました」（history.twig:165-166）
 *  - 0件メッセージ:       「検索条件に該当するデータがありませんでした。」（history.twig:253-254）
 *  - 結果フォーム:        #result_form（history.twig:158 action admin_otcbuyorder_history_export, method post）
 *  - 隠し export_type:    #export_type（history.twig:159 name=export_type）
 *  - CSVドロップダウン:   #result_list__custom_csv_menu a.dropdown-toggle「CSVダウンロード」（history.twig:186-187）
 *  - 全件取得リンク:      a.export-link[data-type="all_export"]「検索結果全件取得」（history.twig:190）
 *  - JS挙動:              .export-link click → #export_type=data-type → #result_form.submit（otc-buy-order-history.js:20-24）
 *
 * ルート（OtcBuyOrderHistoryController.php）:
 *  - 全件CSV出力 admin_otcbuyorder_history_export = POST /<route>/otcbuyorder/history/export（:132-137。export_type=all_export）
 *    成功(StreamedResponse): Content-Type application/octet-stream / Content-Disposition attachment;
 *    filename=otc_buy_order_history_<YmdHis>.csv（OtcBuyOrderHistoryCsvExportService.php:100-102）
 *    検索セッション無: addError('条件に一致する商品がありません')（:179）→ redirect admin_otcbuyorder_history_page（:181-183）
 *  - ページ再表示 admin_otcbuyorder_history_page = GET /<route>/otcbuyorder/history/page/{page_no}（:69-90）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class StorePurchasePurchaseStoreHistoryCsvExportAllPage {
  readonly page: Page;
  readonly historyUrl: string; // 買取商品履歴一覧（検索の起点画面）
  readonly exportPath: string; // 全件CSV出力 POSTルート（直接アクセス検証用）

  readonly searchForm: Locator; // #search_form
  readonly searchButton: Locator; // .searchBtn（「検索する」）
  readonly resultCount: Locator; // 検索結果件数の見出し
  readonly noResult: Locator; // 0件メッセージ
  readonly resultForm: Locator; // #result_form（CSV出力フォーム）
  readonly exportTypeHidden: Locator; // #export_type（hidden）
  readonly csvDropdownToggle: Locator; // 「CSVダウンロード」ドロップダウン
  readonly allExportLink: Locator; // 「検索結果全件取得」（data-type=all_export）

  constructor(page: Page) {
    this.page = page;
    this.historyUrl = `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/history`;
    this.exportPath = `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/history/export`;

    this.searchForm = page.locator("#search_form");
    this.searchButton = page.locator("#search_form .searchBtn");
    this.resultCount = page.locator("#result_list_main__header .box-title");
    this.noResult = page.getByText("検索条件に該当するデータがありませんでした。");
    this.resultForm = page.locator("#result_form");
    this.exportTypeHidden = page.locator("#export_type");
    this.csvDropdownToggle = page.locator("#result_list__custom_csv_menu .dropdown-toggle");
    this.allExportLink = page.locator('.export-link[data-type="all_export"]');
  }

  /** 買取商品履歴一覧（検索の起点画面）を開く。 */
  async gotoHistory() {
    await this.page.goto(this.historyUrl);
  }

  /** 指定ページをセッション保存条件で再表示する（GET history/page/{page_no}）。 */
  async gotoHistoryPage(pageNo = 1) {
    await this.page.goto(`${this.historyUrl}/page/${pageNo}`);
  }

  /**
   * 全件CSV出力エンドポイントへ未認証で直接アクセスする（未認証ガード/URL直接アクセス検証用）。
   * export ルートは POST 専用（GETはメソッド不許可になりうる）ため、未認証ガードは POST で観測する。
   * 戻り値の応答で誘導/ステータスを判定する（GETでのページ遷移前提にしない）。
   */
  async postExportPath(exportType = "all_export") {
    return this.page.request.post(this.exportPath, {
      form: { export_type: exportType },
      maxRedirects: 0,
    });
  }

  /** 検索フォームを送信して一覧を表示させる（検索条件は任意。空のまま送れば全件検索）。 */
  async submitSearch() {
    await this.searchButton.click();
  }

  /**
   * 検索結果ブロック（件数見出し）が表示されていること＝検索成功の観測。
   * 設計どおり「検索結果 N 件 が該当しました」が描画されることを確認する（件数表示は仕様の表示メッセージ）。
   */
  async seeResultList() {
    await expect(this.resultCount).toContainText("検索結果");
    await expect(this.resultCount).toContainText("件");
    await expect(this.resultCount).toContainText("該当しました");
  }

  /** 「CSVダウンロード」ドロップダウンを開く。 */
  async openCsvDropdown() {
    await this.csvDropdownToggle.click();
  }

  /** ドロップダウン内に「検索結果全件取得」（all_export）が表示されること（位置情報＋ラベル）。 */
  async seeAllExportLink() {
    await this.openCsvDropdown();
    await expect(this.allExportLink).toBeVisible();
    await expect(this.allExportLink).toContainText("検索結果全件取得");
  }

  /**
   * 「検索結果全件取得」押下でダウンロード発火を待って Download を返す。
   * ドロップダウン内のリンクのため先にトグルを開く。JSが #export_type=all_export を入れ #result_form を submit する。
   */
  async downloadAllExport(): Promise<Download> {
    await this.openCsvDropdown();
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.allExportLink.click(),
    ]);
    return download;
  }
}
