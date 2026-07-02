import { APIResponse, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店頭買取管理「戻しリストPDF出力」Page Object（M06-11）。
 * 納品ケース表 integration_test/e2e/m06_11_admin_store_purchase_purchase_store_return_list_pdf_export_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m06-11_admin_store_purchase_purchase_store_return_list_pdf_export.md
 * ＋Excel原典 戻しリストPDFレイアウト)由来（オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 *
 * 本機能は「店頭買取管理 > 買取一覧」のCSVダウンロードメニュー内「戻しリストPDF」ボタンから、チェック選択した買取を
 * POST /<route>/otcbuyorder/restock-list/pdf（admin_otcbuyorder_restock_list_pdf）へ ajax 送信し、JSON で受けた
 * 印刷用HTML(@admin/Purchase/restock_list.twig)を別ウィンドウ(印刷ポップアップ)へ書き込んでPC印刷ダイアログで印刷する
 * print/pdf_export 機能。自動化は「印刷用データ発火(ok:true/html)・各エラー分岐のPDF非生成(ok:false/redirectUrl)＋
 * 一覧フラッシュ・未選択クライアントガード・UI部品・未認証ガード」に限る。PDF帳票の内容(金額閾値区分・並び順・
 * 棚番・商品名整形・基準価格・小計・実際の印刷)は手動（帳票内容厳密検査）。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig）:
 *  - 買取一覧:           route admin_otcbuyorder = GET/POST /<route>/otcbuyorder（OtcBuyOrderController.php:90-104）
 *  - 検索フォーム:        #search_form（index.twig:35）
 *  - 検索ボタン:          #search_form .searchBtn（index.twig:145）
 *  - 結果セクション:       #result_list（index.twig:156、pagination 有時のみ）/ 0件見出し（index.twig:241）
 *  - 出力フォーム:         #result_form（index.twig:152、$("#result_form").serialize() を POST：otc-buy-order.js:46）
 *  - CSRFトークン:        #result_form input[name="_token"]（index.twig:153 Constant::TOKEN_NAME=_token）
 *  - CSVダウンロードメニュー: #result_list__custom_csv_menu .dropdown-toggle（index.twig:181-182「CSVダウンロード」）
 *  - 戻しリストPDFボタン:    .export-link[data-type="otc_buy_order_restock_list_pdf"]（index.twig:187「戻しリストPDF」、data-export-url=path(admin_otcbuyorder_restock_list_pdf)）
 *      未選択クリックは alert（otc-buy-order.js:24-28）でPOSTせず＝出力抑止。選択ありは window.open→ajax POST→ok:true/htmlをpopupへwrite→#printButtonでprint（otc-buy-order.js:33-76）
 *  - 全選択:              #allCheck（index.twig:200）
 *  - 行チェックボックス:    input[name="otcBuyOrderIds[]"]（index.twig:215）
 *  - エラーフラッシュ:      .alert-danger（共通 alert.twig / app.flashes('eccube.admin.error')）
 *
 * 印刷ポップアップ（@admin/Purchase/restock_list.twig）:
 *  - タイトル「戻しリストPDF」（restock_list.twig:6 trans admin.purchase.online.btn.pdf_export_return_list / messages.ja.yaml:5260）
 *  - 印刷ボタン #printButton「印刷する」（restock_list.twig:11-13 trans admin.common.print / messages.ja.yaml:1467）
 *
 * ルート（src/Eccube/Controller/Admin/OtcBuyOrder/OtcBuyOrderController.php:625-666）:
 *  - PDF用データ admin_otcbuyorder_restock_list_pdf = POST のみ /<route>/otcbuyorder/restock-list/pdf。isTokenValid()（:635）。
 *    成功: json {ok:true, html}（:660-665）
 *    選択なし: addError admin.purchase.online.csv_export.no_selection（messages.ja.yaml:5247）＋ json {ok:false, redirectUrl}（:642-646）
 *    検証NG: 各エラーを addError ＋ json {ok:false, redirectUrl}（:648-658 / OtcBuyOrderRestockListService.php:90-135：
 *            「対象のデータが見つかりません。」「ID: %d は権限のない店舗のデータです。」「ID: %d は対象外のステータスです。」
 *            「複数店舗の買取情報を同時に処理することはできません。」）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class StorePurchasePurchaseStoreReturnListPdfExportPage {
  readonly page: Page;
  readonly listUrl: string; // 買取一覧（admin_otcbuyorder）
  readonly pdfPath: string; // PDF用データPOSTルート（admin_otcbuyorder_restock_list_pdf）
  readonly exportType = "otc_buy_order_restock_list_pdf"; // 戻しリストPDFの data-type 値

  readonly searchForm: Locator; // #search_form（index.twig:35）
  readonly searchButton: Locator; // 検索ボタン（index.twig:145）
  readonly resultList: Locator; // 検索結果セクション #result_list（index.twig:156）
  readonly noResultHeading: Locator; // 0件見出し（index.twig:241）
  readonly resultForm: Locator; // #result_form（index.twig:152）
  readonly csrfTokenInput: Locator; // #result_form input[name=_token]（index.twig:153）
  readonly csvMenuToggle: Locator; // CSVダウンロードメニュー（index.twig:182）
  readonly pdfButton: Locator; // 戻しリストPDFボタン（index.twig:187）
  readonly allCheck: Locator; // 全選択（index.twig:200）
  readonly rowCheckboxes: Locator; // 行チェックボックス（index.twig:215）
  readonly errorAlert: Locator; // エラーフラッシュ .alert-danger

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder`;
    this.pdfPath = `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/restock-list/pdf`;

    this.searchForm = page.locator("#search_form");
    this.searchButton = this.searchForm.locator(".searchBtn");
    this.resultList = page.locator("#result_list");
    this.noResultHeading = page.getByText("検索条件に該当するデータがありませんでした。");
    this.resultForm = page.locator("#result_form");
    this.csrfTokenInput = this.resultForm.locator('input[name="_token"]');
    this.csvMenuToggle = page.locator("#result_list__custom_csv_menu .dropdown-toggle");
    // 位置情報で特定（ラベル「戻しリストPDF」は data-type 由来であることを上記コメントで確認済み）。
    this.pdfButton = page.locator(
      `.export-link[data-type="${this.exportType}"]`
    );
    this.allCheck = page.locator("#allCheck");
    this.rowCheckboxes = page.locator('input[name="otcBuyOrderIds[]"]');
    this.errorAlert = page.locator(".alert-danger");
  }

  /** 買取一覧（戻しリストPDF出力の起点画面）を開く。 */
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
      new RegExp(`/${ECCUBE_ADMIN_ROUTE}/otcbuyorder`)
    );
  }

  /** 検索結果（対象データ）が表示されているか。SEED-M06-11-OTC 未投入の判定に用いる。 */
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

  /** #result_form の CSRF トークン値を読む（直接POST検証用）。 */
  async readCsrfToken(): Promise<string> {
    return (await this.csrfTokenInput.inputValue()).trim();
  }

  /**
   * 未選択のまま「戻しリストPDF」を押すとクライアント側ガード(alert)で送信が抑止される（otc-buy-order.js:24-28）。
   * dialog を捕捉して dismiss し、ポップアップが開かない＝印刷用データを生成しないことを主判定にする。
   * 返り値は alert 文言（実装由来＝オラクル化せず、出力抑止の主判定の補助のみに用いる）。
   */
  async clickPdfExpectingNoSelectionGuard(): Promise<string> {
    let dialogMessage = "";
    this.page.once("dialog", async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });
    await this.openCsvMenu();
    await this.pdfButton.click();
    // alert 処理が走り、ポップアップ(window.open)もページ遷移も発生しないことを呼び出し側で確認する。
    return dialogMessage;
  }

  /**
   * 対象を選択した状態で「戻しリストPDF」を押し、印刷ポップアップ(window.open)を待つ（検索結果あり・1件以上選択済み前提）。
   * 印刷用HTMLが ok:true で返ると JS が popup へ document.write する（otc-buy-order.js:50-53）。
   */
  async openPdfPopupViaUi(): Promise<Page> {
    await this.openCsvMenu();
    const [popup] = await Promise.all([
      this.page.context().waitForEvent("page"),
      this.pdfButton.click(),
    ]);
    await popup.waitForLoadState("domcontentloaded");
    return popup;
  }

  /**
   * 認証済みブラウザコンテキストのCookieを共有する request で PDF用データPOSTを送る（エラー分岐/成功の機械判定用）。
   * 応答は JSON: 成功 {ok:true, html}、失敗 {ok:false, redirectUrl}（OtcBuyOrderController.php:642-665）。
   * @param ids otcBuyOrderIds[]（空配列＝選択なし）
   */
  async postPdf(ids: number[], token: string): Promise<APIResponse> {
    const form: Record<string, string> = { _token: token };
    ids.forEach((id, i) => {
      form[`otcBuyOrderIds[${i}]`] = String(id);
    });
    return this.page.request.post(this.pdfPath, { form });
  }

  /**
   * CSRFトークンを欠落させて（_token を送らず）PDF用データPOSTを送る（CSRF欠落の検証用）。
   * isTokenValid()（OtcBuyOrderController.php:635）が選択チェックより先に走るため、トークン欠落時は処理されない。
   * 期待は観点表 IT-15（viewpoints:422「欠落または改ざん」）由来＝処理されずPDF非生成（ok:trueにならない＝副作用なし）。
   * 応答形態（4xx/redirect/文言）は実装依存のため判定しない（オラクル独立性・付帯表4 #6）。
   * @param ids otcBuyOrderIds[]（空配列でも可）
   */
  async postPdfWithoutToken(ids: number[]): Promise<APIResponse> {
    const form: Record<string, string> = {};
    ids.forEach((id, i) => {
      form[`otcBuyOrderIds[${i}]`] = String(id);
    });
    return this.page.request.post(this.pdfPath, { form });
  }

  /** PDF用データ応答のJSONを読む（{ok, html?, redirectUrl?}）。 */
  static async readJson(
    res: APIResponse
  ): Promise<{ ok?: boolean; html?: string; redirectUrl?: string }> {
    try {
      return (await res.json()) as {
        ok?: boolean;
        html?: string;
        redirectUrl?: string;
      };
    } catch {
      return {};
    }
  }
}
