import { APIResponse, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 ネット買取管理「戻しリストPDF出力」Page Object（M07-09）。
 * 納品ケース表 integration_test/e2e/m07_09_admin_online_purchase_purchase_online_return_list_pdf_export_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m07-09_admin_online_purchase_purchase_online_return_list_pdf_export.md
 * ＋Excel原典 戻しリストPDF / 設計md 例外処理・プロセスフロー)由来（オラクル独立性）。
 * 実装の現挙動・Form制約・Cookie名は期待値に流用しない。
 *
 * 本機能は「ネット買取管理 > 買取一覧」のダウンロードメニュー内「戻しリストPDF」から、チェック選択した買取を
 * POST /<route>/purchase/pdf_export_return_list へ AJAX 送信し、JsonResponse{ok:true,html} のとき別ウィンドウへ
 * restock_list.twig（棚戻し用リスト＋「印刷する」ボタン）を描画する pdf_export 機能。
 * 自動化は UI部品・操作起点・未選択ガード・別ウィンドウ描画・各エラー分岐(ok:false)・CSRF拒否・未認証ガード・
 * POST専用GET405 に限る。帳票内容（仕訳/閾値/並び順/略称除去/サプライ表示）と window.print は手動。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Purchase/index.twig ／ restock_list.twig）:
 *  - 買取一覧:           route admin_purchase_list = GET /<route>/purchase/list（PurchaseController.php:121）
 *  - 検索フォーム:        #search_form（index.twig:47）
 *  - 検索ボタン:          #search_form button[type="submit"]（index.twig:144 trans admin.common.search「検索」messages.ja.yaml:1446）
 *  - 0件メッセージ:        「検索条件に該当するデータがありませんでした。」（index.twig:305）
 *  - 出力フォーム:         #bulk_csv_export（index.twig:162。検索結果1件以上のときのみレンダリング index.twig:161）
 *  - CSRFトークン:        #bulk_csv_export input[name="_token"]（index.twig:163 Constant::TOKEN_NAME=_token）
 *  - ダウンロードメニュー:  #result_list__custom_csv_menu .dropdown-toggle（index.twig:166-167 trans admin.common.download「ダウンロード」:1459）
 *  - 戻しリストPDFボタン:   #pdf_export_return_list（index.twig:176 trans admin.purchase.online.btn.pdf_export_return_list「戻しリストPDF」:5260）
 *      type="button" data-export-url。purchase.js:27-84 が #bulk_csv_export を AJAX POST（未選択は purchase.js:30 で alert ガード）
 *  - 全選択:              #allCheck（index.twig:212）
 *  - 行チェックボックス:    input[name="buyOrderIds[]"].searched_buy_order_id（index.twig:231）
 *  - 別ウィンドウ印刷ボタン: #printButton（restock_list.twig:11 trans admin.common.print「印刷する」:1467）
 *
 * PDF出力ルート（PurchaseController.php:668-701）:
 *  - POST /<route>/purchase/pdf_export_return_list（admin_purchase_pdf_export_return_list、methods POST）
 *    成功: json{ok:true, html}（restock_list.twig 描画文字列）
 *    選択なし: addError admin.purchase.online.csv_export.no_selection（messages.ja.yaml:5247）＋ json{ok:false, redirectUrl}（:680-683）
 *    検証NG: addError（BuyOrderRestockListService.php:102/113/118）＋ json{ok:false, redirectUrl}（:686-692）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class OnlinePurchasePurchaseOnlineReturnListPdfExportPage {
  readonly page: Page;
  readonly listUrl: string; // 買取一覧（admin_purchase_list）
  readonly searchPath: string; // 検索POST（admin_purchase_search）
  readonly pdfExportPath: string; // PDF出力POST（admin_purchase_pdf_export_return_list）

  readonly searchForm: Locator; // #search_form（index.twig:47）
  readonly searchButton: Locator; // 検索ボタン（index.twig:144）
  readonly noResultMessage: Locator; // 0件メッセージ（index.twig:305）
  readonly bulkForm: Locator; // #bulk_csv_export（index.twig:162）
  readonly csrfTokenInput: Locator; // _token（index.twig:163）
  readonly downloadMenuToggle: Locator; // ダウンロードメニュー（index.twig:167）
  readonly pdfExportButton: Locator; // #pdf_export_return_list（index.twig:176）
  readonly allCheck: Locator; // 全選択（index.twig:212）
  readonly rowCheckboxes: Locator; // 行チェックボックス（index.twig:231）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/purchase/list`;
    this.searchPath = `/${ECCUBE_ADMIN_ROUTE}/purchase/search`;
    this.pdfExportPath = `/${ECCUBE_ADMIN_ROUTE}/purchase/pdf_export_return_list`;

    this.searchForm = page.locator("#search_form");
    this.searchButton = this.searchForm.locator('button[type="submit"]');
    this.noResultMessage = page.getByText("検索条件に該当するデータがありませんでした。");
    this.bulkForm = page.locator("#bulk_csv_export");
    this.csrfTokenInput = this.bulkForm.locator('input[name="_token"]');
    this.downloadMenuToggle = page.locator("#result_list__custom_csv_menu .dropdown-toggle");
    this.pdfExportButton = page.locator("#pdf_export_return_list");
    this.allCheck = page.locator("#allCheck");
    this.rowCheckboxes = page.locator('input[name="buyOrderIds[]"]');
  }

  /** 買取一覧（戻しリストPDF出力の起点画面）を開く。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 一覧画面に到達していること（入口の表示確認）。 */
  async seeListScreen() {
    await expect(this.searchForm).toBeVisible();
  }

  /** 検索を1回実行する（空条件＝全件）。結果有無に依らず一覧に留まる。 */
  async runSearch() {
    await this.gotoList();
    await this.searchButton.click();
  }

  /** 検索結果（対象データ）が表示されているか。SEED-ELIGIBLE 未投入の判定に用いる。 */
  async hasResults(): Promise<boolean> {
    return (await this.rowCheckboxes.count()) > 0;
  }

  /** ダウンロードメニューを開く。 */
  async openDownloadMenu() {
    await this.downloadMenuToggle.click();
  }

  /** 先頭の買取行のチェックボックスを選択する（検索結果あり前提）。 */
  async selectFirstRow() {
    await this.rowCheckboxes.first().check();
  }

  /** #bulk_csv_export の CSRF トークン値を読む（検索結果1件以上のときのみ存在）。 */
  async readCsrfToken(): Promise<string> {
    return (await this.csrfTokenInput.inputValue()).trim();
  }

  /**
   * 戻しリストPDFを実行し、開く別ウィンドウ(popup)を返す（検索結果あり・1件以上選択済み前提）。
   * purchase.js:38 が window.open→AJAX→document.write で restock_list.twig を描画する。
   * popup の document.write 内容のセレクタ(#printButton)は要実機確認。
   */
  async exportPdfViaUi(): Promise<Page> {
    await this.openDownloadMenu();
    const [popup] = await Promise.all([
      this.page.waitForEvent("popup"),
      this.pdfExportButton.click(),
    ]);
    await popup.waitForLoadState("domcontentloaded").catch(() => {});
    return popup;
  }

  /**
   * 認証済みブラウザコンテキストのCookieを共有する request で PDF出力POSTを送る（エラー分岐/CSRF/未認証検証用）。
   * 当該ルートは JsonResponse を返すため、レスポンスJSONを直接判定できる。
   * @param ids buyOrderIds[]（空配列＝選択なし）
   * @param token _token（無効値を渡すとCSRF拒否）
   */
  async postPdfExport(ids: number[], token: string): Promise<APIResponse> {
    const form: Record<string, string> = { _token: token };
    ids.forEach((id, i) => {
      form[`buyOrderIds[${i}]`] = String(id);
    });
    return this.page.request.post(this.pdfExportPath, {
      form,
      failOnStatusCode: false,
    });
  }

  /** レスポンスが PDF用データ(ok:true かつ html あり)か。 */
  static async isPdfOk(res: APIResponse): Promise<boolean> {
    if (res.status() !== 200) {
      return false;
    }
    const ct = res.headers()["content-type"] ?? "";
    if (!ct.includes("application/json")) {
      return false;
    }
    try {
      const body = (await res.json()) as { ok?: boolean; html?: string };
      return body.ok === true && typeof body.html === "string" && body.html.length > 0;
    } catch {
      return false;
    }
  }
}
