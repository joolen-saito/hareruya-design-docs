import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理「在庫移動実績入力用CSV出力」Page Object。
 * 納品ケース表 integration_test/e2e/m04_27_admin_stock_stock_move_result_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m04-27_admin_stock_stock_move_result_csv_export.md / 基本設計仕様書(在庫管理機能))由来
 * （オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 *
 * 本機能は在庫移動指示一覧（M04-25系・admin_stock_move_instruction_list）の検索実行後リストヘッダに表示される
 * 「在庫移動実績入力用CSVダウンロード」GETリンクから、ヘッダー行のみのCSV雛形をストリーミング配信する。
 * 入力フォーム・対象選択・確認ダイアログ・DB読み書きはない。
 * 自動化はダウンロード発火・ファイル名・応答ヘッダ・UI部品（出力リンク）・未認証ガード・確認ダイアログ非表示に限り、
 * CSV本文（4列固定ヘッダー・データ行なし・文字コードSJIS-win/UTF-8時BOM）は手動確認とする。
 *
 * セレクタ/ルート根拠（ec-cube-enterprise 現行ソース・nl -ba 基準）:
 *  - 一覧: route admin_stock_move_instruction_list = GET/POST /<route>/product/stock/move-instruction
 *      （StockMoveInstructionController.php:66）。出力リンクは pagination is not null（=検索実行後）でのみ描画
 *      （stock_move_instruction_index.twig:157-162）。
 *  - 「在庫移動実績入力用CSVダウンロード」リンク: href$="/product/stock/move-instruction/csv-template"
 *      （route admin_stock_move_instruction_csv_download_record 由来 / stock_move_instruction_index.twig:160）
 *      ラベル trans admin.stock.move_instruction.csv_download_record=「在庫移動実績入力用CSVダウンロード」
 *      （messages.ja.yaml:4967）。CSSクラス(btn-ec-conversion)は隣の送り状ボタンと共用のため href を主セレクタとする。
 *  - CSV出力 admin_stock_move_instruction_csv_download_record = GET /<route>/product/stock/move-instruction/csv-template
 *      （Controller.php:334-335）。StreamedResponse / Content-Type text/csv; charset=windows-31j（SJIS-win時・:358-359）
 *      / Content-Disposition attachment; filename=stock_move_instruction_record_template_<YmdHis>.csv（:340,360）。
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class StockStockMoveResultCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // 在庫移動指示一覧（出力リンクの起点・検索実行で描画）
  readonly exportPath: string; // CSV雛形出力 GETルート（直接アクセス/ヘッダ検証用）

  readonly csvDownloadLink: Locator; // 「在庫移動実績入力用CSVダウンロード」リンク（index.twig:160）
  readonly searchButton: Locator; // 一覧の検索ボタン（リスト描画のため・要実機確認）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/move-instruction`;
    this.exportPath = `/${ECCUBE_ADMIN_ROUTE}/product/stock/move-instruction/csv-template`;

    // href の位置情報でリンクを特定（ラベルは trans キー由来であることを上記コメントで確認済み）。
    this.csvDownloadLink = page.locator(
      `a[href$="/product/stock/move-instruction/csv-template"]`
    );
    // 検索ボタンは別機能（在庫移動指示一覧 M04-25）のフォーム部品であり、本機能の設計書・DOM(id/blockprefix)
    // 由来の確定セレクタ根拠を持たない（=ここでの button[type="submit"].first() は根拠なしの暫定プレースホルダ）。
    // この暫定セレクタを使う runSearch() 依存ケース(001/010/016/017)は spec で test.fixme 保留としており、
    // 実行前に M04-25 の検索Page Object（確定セレクタ）へ差し替えること（要実機確認）。
    this.searchButton = page.locator('button[type="submit"]').first();
  }

  /** 在庫移動指示一覧（出力リンクの起点画面）を開く。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /**
   * 検索を実行してリスト（出力リンク）を描画させる。
   * 出力リンクは pagination is not null（検索実行後）でのみ表示される（index.twig:157）。
   * 検索条件UIは別機能設計が正のため、ここでは既定条件で送信のみ行う（要実機確認）。
   */
  async runSearch() {
    await this.searchButton.click();
  }

  /** CSV出力URLへ直接GETアクセスする（URL直接アクセス検証用）。 */
  async gotoExport() {
    await this.page.goto(this.exportPath);
  }

  /** 「在庫移動実績入力用CSVダウンロード」リンクを押下し、ダウンロード発火を待って Download を返す。 */
  async downloadCsv(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.csvDownloadLink.click(),
    ]);
    return download;
  }

  /** 一覧のCSVダウンロードUI部品が仕様どおり表示されること。 */
  async seeDownloadLink() {
    await expect(this.csvDownloadLink).toBeVisible();
  }
}
