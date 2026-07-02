import { APIResponse, Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店頭買取管理「買取商品一覧CSV出力」Page Object（M06-12）。
 * 納品ケース表 integration_test/e2e/m06_12_admin_store_purchase_purchase_store_product_list_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m06-12_admin_store_purchase_purchase_store_product_list_csv_export.md
 * ＋Excel原典 買取商品一覧CSV出力項目 9列 / 設計md 例外処理・プロセスフロー)由来（オラクル独立性）。
 * 実装の現挙動・Form制約・Cookie名は期待値に流用しない。
 *
 * 本機能は「店頭買取管理 > 買取一覧」のCSVダウンロードメニュー内「買取商品一覧CSV」から、チェック選択した買取を
 * POST /<route>/otcbuyorder/export（export_type=otc_buy_order_product_list）へ送信して StreamedResponse で
 * CSV出力する bulk＋csv_export 機能（参照系・DB更新なし）。戻しリストCSV(M06-10)と異なり追加validationは無く、
 * 入口ガードは「選択0件＝選択必須エラー」のみ（OtcBuyOrderController.php:189-195）。
 * 自動化はダウンロード発火・ファイル名・応答ヘッダ・UI部品・選択必須エラーのCSV非出力・未認証ガードに限る。
 * CSV各列の値（商品コード/在庫増減数/商品名/基準価格/買取価格/言語ID/略称タグ/レアリティ/状態）の一致は手動。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig）:
 *  - 買取一覧:            route admin_otcbuyorder = GET/POST /<route>/otcbuyorder（OtcBuyOrderController.php:90-104）
 *  - 検索フォーム:        #search_form（index.twig:35 周辺）
 *  - 検索ボタン:          #search_form .searchBtn（index.twig:145 trans admin.purchase.store.form.search.button）
 *  - 結果セクション:       #result_list（index.twig:156、pagination 有時のみレンダリング）
 *  - 出力フォーム:         #result_form action admin_otcbuyorder_export（index.twig:152、常時レンダリング）
 *  - CSRFトークン:        #result_form input[name="_token"]（index.twig:153 Constant::TOKEN_NAME=_token）
 *  - export_type hidden:  #export_type（index.twig:154）
 *  - CSVダウンロードメニュー: #result_list__custom_csv_menu .dropdown-toggle（index.twig:181-182「CSVダウンロード」）
 *  - 買取商品一覧CSVリンク:  .export-link[data-type="otc_buy_order_product_list"]（index.twig:185「買取商品一覧CSV」）
 *      クリックで export_type を設定し result_form を submit（otc-buy-order.js。CSV系は未選択ガードなし）
 *  - 全選択:              #allCheck（index.twig:204 周辺）
 *  - 行チェックボックス:    input[name="otcBuyOrderIds[]"]（index.twig:215 周辺）
 *  - エラーフラッシュ:      .alert-danger（共通 alert.twig / app.flashes('eccube.admin.error')）
 *
 * ルート（src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php）:
 *  - 出力 admin_otcbuyorder_export = POST /<route>/otcbuyorder/export（:162-168）
 *    成功(StreamedResponse): Content-Type application/octet-stream / Content-Disposition attachment;
 *      filename=otc_buy_order_product_list_<YmdHis>.csv（OtcBuyOrderCsvExportService.php:123-128）
 *    選択なし: addError admin.purchase.online.csv_export.no_selection ＋ 一覧リダイレクト（:189-195）
 *    無効export_type: InvalidArgumentException（:177-184。UI操作では発生せず改ざん時のみ）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class StorePurchasePurchaseStoreProductListCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // 買取一覧（admin_otcbuyorder）
  readonly exportPath: string; // 出力POSTルート（admin_otcbuyorder_export）
  readonly exportType = "otc_buy_order_product_list"; // 買取商品一覧CSVのexport_type値（index.twig:185）

  readonly searchForm: Locator; // #search_form（index.twig:35 周辺）
  readonly searchButton: Locator; // 検索ボタン（index.twig:145）
  readonly resultList: Locator; // 検索結果セクション #result_list（index.twig:156）
  readonly resultForm: Locator; // #result_form（index.twig:152）
  readonly csrfTokenInput: Locator; // #result_form input[name=_token]（index.twig:153）
  readonly csvMenuToggle: Locator; // CSVダウンロードメニュー（index.twig:182）
  readonly productListCsvLink: Locator; // 買取商品一覧CSVリンク（index.twig:185）
  readonly allCheck: Locator; // 全選択（index.twig:204 周辺）
  readonly rowCheckboxes: Locator; // 行チェックボックス（index.twig:215 周辺）
  readonly errorAlert: Locator; // エラーフラッシュ .alert-danger

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder`;
    this.exportPath = `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/export`;

    this.searchForm = page.locator("#search_form");
    this.searchButton = this.searchForm.locator(".searchBtn");
    this.resultList = page.locator("#result_list");
    this.resultForm = page.locator("#result_form");
    this.csrfTokenInput = this.resultForm.locator('input[name="_token"]');
    this.csvMenuToggle = page.locator("#result_list__custom_csv_menu .dropdown-toggle");
    // 位置情報で特定（ラベル「買取商品一覧CSV」は data-type 由来であることを上記コメントで確認済み）。
    this.productListCsvLink = page.locator(
      `.export-link[data-type="${this.exportType}"]`
    );
    this.allCheck = page.locator("#allCheck");
    this.rowCheckboxes = page.locator('input[name="otcBuyOrderIds[]"]');
    this.errorAlert = page.locator(".alert-danger");
  }

  /** 買取一覧（買取商品一覧CSV出力の起点画面）を開く。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 一覧画面に到達していること（入口の表示確認）。 */
  async seeListScreen() {
    await expect(this.searchForm).toBeVisible();
  }

  /** 検索を1回実行する（空条件＝全件）。結果有無に依らず一覧URLに留まる。 */
  async runSearch() {
    await this.gotoList();
    await this.searchButton.click();
    await expect(this.page).toHaveURL(
      new RegExp(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder(/page/\\d+)?(\\?|$)`)
    );
  }

  /** 検索結果（対象データ）が表示されているか。SEED 未投入の判定に用いる。 */
  async hasResults(): Promise<boolean> {
    return (await this.rowCheckboxes.count()) > 0;
  }

  /** CSVダウンロードメニューを開く。 */
  async openCsvMenu() {
    await this.csvMenuToggle.click();
  }

  /** 先頭の買取行のチェックボックスを選択する（検索結果あり前提）。 */
  async selectFirstRow() {
    await this.rowCheckboxes.first().check();
  }

  /**
   * 「買取商品一覧CSV」を実行してダウンロード発火を待つ（検索結果あり・1件以上選択済み前提）。
   * リンククリックで JS が export_type を設定し result_form を submit する。
   */
  async exportProductListCsvViaUi(): Promise<Download> {
    await this.openCsvMenu();
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.productListCsvLink.click(),
    ]);
    return download;
  }

  /** #result_form の CSRF トークン値を読む（直接POST検証用）。 */
  async readCsrfToken(): Promise<string> {
    return (await this.csrfTokenInput.inputValue()).trim();
  }

  /**
   * 認証済みブラウザコンテキストのCookieを共有する request で出力POSTを送る（エラー分岐/応答ヘッダ検証用）。
   * 既定でリダイレクトを追従するため、選択なしエラー時は一覧HTML(200,text/html)、成功時はCSV添付(200,octet-stream)を返す。
   * @param ids otcBuyOrderIds[]（空配列＝選択なし）
   * @param token CSRFトークン
   * @param exportType 既定は本機能のexport_type。改ざん検証では無効値を渡す。
   */
  async postExport(
    ids: number[],
    token: string,
    exportType: string = this.exportType
  ): Promise<APIResponse> {
    const form: Record<string, string> = {
      export_type: exportType,
      _token: token,
    };
    ids.forEach((id, i) => {
      form[`otcBuyOrderIds[${i}]`] = String(id);
    });
    return this.page.request.post(this.exportPath, { form });
  }

  /** 応答が添付CSV（octet-stream/attachment）か。 */
  static isCsvAttachment(res: APIResponse): boolean {
    const h = res.headers();
    return (
      (h["content-type"] ?? "").includes("application/octet-stream") &&
      (h["content-disposition"] ?? "").includes("attachment")
    );
  }
}
