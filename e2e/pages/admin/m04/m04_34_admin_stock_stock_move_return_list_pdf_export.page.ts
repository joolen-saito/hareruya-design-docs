import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理「戻しリストPDF出力」Page Object。
 * 在庫移動・振替一覧で選択した在庫移動・振替情報から戻しリストHTMLを生成し、別ウィンドウ（ポップアップ）で
 * 表示してブラウザ印刷する機能。サーバは POST .../return_list_pdf_export を受け、JSONで {success, html|redirectUrl} を返す。
 *
 * 期待結果は仕様（正本 functions/ec-cube-enterprise/m04-34_admin_stock_stock_move_return_list_pdf_export.md /
 * 基本設計仕様書(在庫管理機能) / messages.ja.yaml）由来（オラクル独立性）。
 * セレクタは Twig＋ルート定義由来の位置情報のみ。Form/Type 制約は期待値に流用しない。
 *
 * 入口・セレクタ根拠（src/Eccube 現行ソース）:
 *  - 一覧画面 URL: ルート admin_stock_move_transfer = /%admin%/product/stock/move_transfer
 *    （StockMoveTransferController.php:106）
 *  - PDF出力ボタン: #stockMoveTransferReturnListPdfExport（index.twig:629 / trans
 *    admin.stock.move_transfer.action_return_list_pdf_export=「戻しリストPDF出力」 messages.ja.yaml:5135）
 *  - 行チェックボックス: input[name="ids[]"].js-move-transfer-row-check（index.twig:692）
 *  - 全選択チェック: #move_transfer_check_all（index.twig:653）
 *  - 隠しPDFフォーム: #form_stock_move_transfer_return_list_pdf（index.twig:974、action=ルート
 *    admin_stock_move_transfer_return_list_pdf_export）。CSRFトークン input name="_token"
 *    （Constant::TOKEN_NAME=_token / index.twig:975）
 *  - POSTエンドポイント: /%admin%/product/stock/move_transfer/return_list_pdf_export
 *    （StockMoveTransferController.php:455、methods=POST）
 *  - 未選択時 JS alert 文言: admin.stock.move_transfer.return_list_csv_export.no_selection
 *    =「1つ以上の在庫移動情報を選択してください。」（index.twig:199 / messages.ja.yaml:5139）
 *
 * 返却HTML（return_list.twig＝ポップアップ本文）根拠:
 *  - <title>「戻しリスト」 trans return_list.pdf_title（return_list.twig:6 / messages.ja.yaml:5136）
 *  - 印刷ボタン #printButton「印刷する」 trans admin.common.print（return_list.twig:11 / messages.ja.yaml:1467）
 *  - 列見出し No/棚番/言語/状態/略称/色R/数/商品名/価格/備考（return_list.twig:34-42 / admin.picking_item_list.*）
 */
export class StockStockMoveReturnListPdfExportPage {
  readonly page: Page;
  readonly listUrl: string; // 在庫移動・振替一覧
  readonly exportEndpoint: string; // POST 戻しリストPDF出力エンドポイント

  readonly pdfExportButton: Locator; // #stockMoveTransferReturnListPdfExport（index.twig:629）
  readonly rowChecks: Locator; // input[name="ids[]"].js-move-transfer-row-check（index.twig:692）
  readonly checkAll: Locator; // #move_transfer_check_all（index.twig:653）
  readonly pdfForm: Locator; // #form_stock_move_transfer_return_list_pdf（index.twig:974）
  readonly pdfFormToken: Locator; // 隠しフォーム内 _token（index.twig:975）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/move_transfer`;
    this.exportEndpoint = `/${ECCUBE_ADMIN_ROUTE}/product/stock/move_transfer/return_list_pdf_export`;

    this.pdfExportButton = page.locator("#stockMoveTransferReturnListPdfExport");
    this.rowChecks = page.locator(
      'input[name="ids[]"].js-move-transfer-row-check'
    );
    this.checkAll = page.locator("#move_transfer_check_all");
    this.pdfForm = page.locator("#form_stock_move_transfer_return_list_pdf");
    this.pdfFormToken = this.pdfForm.locator('input[name="_token"]');
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 一覧画面に「戻しリストPDF出力」ボタンが表示されること（操作起点・UI部品）。 */
  async seePdfExportButton() {
    await expect(this.pdfExportButton).toBeVisible();
  }

  /** 隠しPDFフォームのCSRFトークン値を取得する（位置情報のみ。直接POST検証で使う）。 */
  async readCsrfToken(): Promise<string> {
    return (await this.pdfFormToken.inputValue()).trim();
  }

  /** 一覧の先頭行チェックボックスの値（在庫移動・振替情報ID）を取得する（存在する場合）。 */
  async readFirstRowId(): Promise<string | null> {
    if ((await this.rowChecks.count()) === 0) return null;
    return await this.rowChecks.first().getAttribute("value");
  }

  /**
   * エンドポイントへ直接 POST して JSON を取得する（success/redirectUrl/html を観測）。
   * ids が空配列なら未選択（no_selection）相当、不正トークンなら CSRF 検証を観測できる。
   */
  async postExport(ids: string[], token: string) {
    const form: Record<string, string> = { _token: token };
    ids.forEach((id, i) => {
      form[`ids[${i}]`] = id;
    });
    return await this.page.request.post(this.exportEndpoint, { form });
  }
}
