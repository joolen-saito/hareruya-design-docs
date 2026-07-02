import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理「送り状CSV出力」Page Object。
 * 納品ケース表 integration_test/e2e/m04_28_admin_stock_stock_invoice_csv_export_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m04-28_admin_stock_stock_invoice_csv_export.md / messages.ja.yaml)由来
 * （オラクル独立性）。本機能は在庫移動指示一覧から、チェックした行の ids[] を隠しフォームで POST して
 * ストリーミング出力するダウンロードである。CSVの中身（23列・各列の値生成・注文者=移動元/配送先=移動先・
 * 文字コードSJIS-win・対象なし=ヘッダのみ・店舗情報欠落=空文字）は手動確認とする。
 * 自動化はダウンロード発火・ファイル名・UI部品・未選択アラート・POST専用ルート/未認証ガードに限る。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig）:
 *  - 在庫移動指示一覧/検索フォーム: form[name="admin_search_stock_move_instruction"]（twig:78, action=admin_stock_move_instruction_list）
 *  - 検索実行ボタン: 同フォーム内 button[type=submit]（twig:141, trans admin.common.search=「検索」）
 *  - 「送り状CSVダウンロード」ボタン: #stockMoveInstructionLabelsExport（twig:161, trans admin.stock.move_instruction.csv_download_invoice=「送り状CSVダウンロード」messages.ja.yaml:4968）
 *  - 各行チェックボックス: input.row-check[name="ids[]"]（twig:203, value=Item.id）
 *  - 表頭の全選択: #checkAll（twig:183, aria-label admin.common.select_all）
 *  - 送信用 隠しフォーム: #form_stock_move_instruction_label_csv（twig:343, method=post action=url('admin_stock_move_instruction_labels_export'), CSRFトークン hidden twig:344）
 *  - 未選択アラート文言: admin.stock.move_instruction.csv_invoice_select_rows=「送り状CSVを出力する在庫移動指示にチェックを入れてください。」（twig:411 / messages.ja.yaml:4969）
 *
 * ルート（src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php）:
 *  - 在庫移動指示一覧 admin_stock_move_instruction_list = GET/POST /<route>/product/stock/move-instruction（:66）
 *  - 送り状CSV出力 admin_stock_move_instruction_labels_export = POST /<route>/product/stock/move-instruction/labels（:317）
 *    CSRF検証後、ids[] が空配列なら NotFoundHttpException(404)（:323-326）。
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class StockStockInvoiceCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // 在庫移動指示一覧（admin_stock_move_instruction_list）
  readonly labelsExportPath: string; // POST 専用ルート（GET直アクセス検証用）

  readonly searchForm: Locator; // form[name="admin_search_stock_move_instruction"]（twig:78）
  readonly searchSubmit: Locator; // 検索ボタン（twig:141）
  readonly invoiceButton: Locator; // #stockMoveInstructionLabelsExport（twig:161）
  readonly rowChecks: Locator; // input.row-check[name="ids[]"]（twig:203）
  readonly checkAll: Locator; // #checkAll（twig:183）
  readonly hiddenForm: Locator; // #form_stock_move_instruction_label_csv（twig:343）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/move-instruction`;
    this.labelsExportPath = `/${ECCUBE_ADMIN_ROUTE}/product/stock/move-instruction/labels`;

    this.searchForm = page.locator('form[name="admin_search_stock_move_instruction"]');
    this.searchSubmit = this.searchForm.locator('button[type="submit"]');
    this.invoiceButton = page.locator("#stockMoveInstructionLabelsExport");
    this.rowChecks = page.locator('input.row-check[name="ids[]"]');
    this.checkAll = page.locator("#checkAll");
    this.hiddenForm = page.locator("#form_stock_move_instruction_label_csv");
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 検索フォームを送信して一覧結果を描画する（条件未指定で全件相当）。pagination が確定し各UI部品が出る。 */
  async search() {
    await this.searchSubmit.click();
  }

  /** 先頭の在庫移動指示行のチェックボックスをONにする（要: 1件以上の指示が存在）。 */
  async checkFirstRow() {
    await this.rowChecks.first().check();
  }

  /** 送り状CSVダウンロードボタンを押す（選択状態に依らず）。 */
  async clickInvoiceExport() {
    await this.invoiceButton.click();
  }

  /** 1件選択して送り状CSVダウンロードを押し、ダウンロード発火を待って Download を返す。 */
  async exportFirstAndWaitDownload(): Promise<Download> {
    await this.checkFirstRow();
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.invoiceButton.click(),
    ]);
    return download;
  }

  /** 一覧に送り状CSVダウンロードボタンが仕様どおり表示されること。 */
  async seeInvoiceButton() {
    await expect(this.invoiceButton).toBeVisible();
  }
}
