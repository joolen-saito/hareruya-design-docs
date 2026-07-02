import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理「在庫移動指示リストエクスポート」Page Object。
 * 納品ケース表 integration_test/e2e/m04_25_admin_stock_stock_move_instruction_export_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m04-25_admin_stock_stock_move_instruction_export.md /
 * 基本設計仕様書(在庫管理機能))由来（オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 *
 * 本機能は在庫移動指示一覧（M04-24）画面ヘッダから起動する2系統のCSV出力（画面タイプ csv_export）:
 *  (A) 送り状CSVダウンロード: チェックした指示ID(ids[])を非表示フォームに詰めてPOST。CSRF検証あり。
 *      未選択時はJSの alert で送信を抑止。ids空/未指定でサーバ到達時は404。
 *  (B) 在庫移動実績入力用CSV雛形ダウンロード: ヘッダのみのCSVをGETで出力。
 * CSVの中身（送り状23列マッピング・雛形4列見出し・文字コード・固定値）は手動確認とする。
 * 自動化はダウンロード発火・ファイル名・HTTP応答・UI部品・未認証ガード・未選択アラート・確認ダイアログ非表示に限る。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig）:
 *  - 在庫移動指示一覧: route admin_stock_move_instruction_list
 *      = GET/POST /<route>/product/stock/move-instruction（StockMoveInstructionController.php:66）
 *  - 雛形DLリンク: a[href$="/product/stock/move-instruction/csv-template"]
 *      （index.twig:160 url('admin_stock_move_instruction_csv_download_record')）
 *      ラベル trans admin.stock.move_instruction.csv_download_record=「在庫移動実績入力用CSVダウンロード」
 *      （index.twig:160 / messages.ja.yaml:4967）
 *  - 送り状CSVボタン: #stockMoveInstructionLabelsExport（index.twig:161）
 *      ラベル trans admin.stock.move_instruction.csv_download_invoice=「送り状CSVダウンロード」
 *      （index.twig:161 / messages.ja.yaml:4968）
 *  - 行チェックボックス: input.row-check[name="ids[]"]（index.twig:203）／全選択 #checkAll（index.twig:183）
 *  - 送り状CSV送信用フォーム: #form_stock_move_instruction_label_csv（index.twig:343 action=admin_stock_move_instruction_labels_export, CSRF token index.twig:344）
 *  - 未選択アラート: index.twig:411-415（ids.length===0でalert＋return false）。
 *      文言 trans admin.stock.move_instruction.csv_invoice_select_rows は実装由来のため**期待値には用いない**
 *      （設計書未定義＝オラクル独立性。判定はアラート(dialog)の有無とダウンロード非発火のみ）。
 *
 * ルート/応答:
 *  - 送り状CSV admin_stock_move_instruction_labels_export = POST /<route>/product/stock/move-instruction/labels（Controller.php:317）
 *      応答 StreamedResponse / Content-Type application/octet-stream（Service.php:88）
 *      / Content-Disposition attachment; filename=stock_move_instruction_labels_<YmdHis>.csv（Service.php:87,89）
 *  - 雛形 admin_stock_move_instruction_csv_download_record = GET /<route>/product/stock/move-instruction/csv-template（Controller.php:334）
 *      応答 StreamedResponse / Content-Type text/csv; charset=...（SJIS-win時 windows-31j）（Controller.php:358-359）
 *      / Content-Disposition attachment; filename=stock_move_instruction_record_template_<YmdHis>.csv（Controller.php:340,360）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class StockStockMoveInstructionExportPage {
  readonly page: Page;
  readonly listUrl: string; // 在庫移動指示一覧（2系統のCSV出力の起点画面）
  readonly templatePath: string; // 雛形CSV GETルート（直接アクセス/ヘッダ検証用）
  readonly labelsPath: string; // 送り状CSV POSTルート（直接POST/404検証用）

  readonly templateLink: Locator; // 「在庫移動実績入力用CSVダウンロード」リンク（index.twig:160）
  readonly labelsButton: Locator; // 「送り状CSVダウンロード」ボタン（index.twig:161）
  readonly rowChecks: Locator; // 行チェックボックス name=ids[]（index.twig:203）
  readonly checkAll: Locator; // 全選択（index.twig:183）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/move-instruction`;
    this.templatePath = `/${ECCUBE_ADMIN_ROUTE}/product/stock/move-instruction/csv-template`;
    this.labelsPath = `/${ECCUBE_ADMIN_ROUTE}/product/stock/move-instruction/labels`;

    // href 末尾一致でリンクを特定（ラベルは trans キー由来であることを上記コメントで確認済み）。
    this.templateLink = page.locator(
      `a[href$="/product/stock/move-instruction/csv-template"]`
    );
    this.labelsButton = page.locator("#stockMoveInstructionLabelsExport");
    this.rowChecks = page.locator('input.row-check[name="ids[]"]');
    this.checkAll = page.locator("#checkAll");
  }

  /** 在庫移動指示一覧（CSV出力の起点画面）を開く。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 雛形CSVのURLへ直接GETアクセスする（URL直接アクセス検証用）。 */
  async gotoTemplate() {
    await this.page.goto(this.templatePath);
  }

  /** 「在庫移動実績入力用CSVダウンロード」リンクを押下し、ダウンロード発火を待って Download を返す。 */
  async downloadTemplate(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.templateLink.click(),
    ]);
    return download;
  }

  /** 先頭行のチェックを入れて「送り状CSVダウンロード」を押下し、ダウンロード発火を待って Download を返す。 */
  async downloadLabelsForFirstRow(): Promise<Download> {
    await this.rowChecks.first().check();
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.labelsButton.click(),
    ]);
    return download;
  }

  /** 一覧の2系統CSV出力UI部品が仕様どおり表示されること。 */
  async seeExportControls() {
    await expect(this.templateLink).toBeVisible();
    await expect(this.labelsButton).toBeVisible();
  }
}
