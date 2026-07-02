import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理「在庫移動・振替情報CSV出力」Page Object。
 * 納品ケース表 integration_test/e2e/m04_10_admin_stock_stock_move_transfer_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m04-10_admin_stock_stock_move_transfer_csv_export.md / 基本設計仕様書(在庫管理機能))由来
 * （オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 *
 * 本機能は在庫移動・振替検索/一覧（M04-08）画面ヘッダの GET リンクからのストリーミングダウンロードであり、
 * CSVの中身（14列固定見出し・全件・登録日降順→ID降順・移動タイプ/在庫区分/ステータスの表示名解決・日時 Y/m/d H:i・
 * 基準価格合計の四捨五入整数・移動指示ID未登録時の空欄・移動点数集計・対象0件時の見出しのみ）は手動確認とする。
 * 自動化はダウンロード発火・ファイル名・応答ヘッダ・UI部品（出力リンク）・未認証ガード・確認ダイアログ非表示に限る。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Stock/MoveTransfer/index.twig）。
 * CSSクラス(btn-ec-conversion)は他ボタンと共用で将来変更余地があるため、ルート名由来の href を主セレクタとする:
 *  - 在庫移動・振替一覧: route admin_stock_move_transfer  = GET/POST /<route>/product/stock/move_transfer
 *      （StockMoveTransferController.php:106）
 *  - 「在庫移動振替CSV出力」リンク: href$="/product/stock/move_transfer/csv_export"
 *      （route admin_stock_move_transfer_csv_export 由来 / index.twig:627）
 *      ラベル trans admin.stock.move_transfer.action_move_transfer_csv_export=「在庫移動振替CSV出力」
 *      （index.twig:627 / messages.ja.yaml:5133）
 *
 * ルート/応答（src/Eccube/Controller/Admin/Stock/StockMoveTransferController.php
 *   / src/Eccube/Service/Csv/Exporter/StockMoveTransferListCsvExportService.php）:
 *  - CSV出力 admin_stock_move_transfer_csv_export = GET /<route>/product/stock/move_transfer/csv_export（Controller.php:413-414）
 *  - 応答: StreamedResponse / Content-Type application/octet-stream（Service.php:106）
 *      / Content-Disposition attachment; filename=stock_move_transfer_list_<YmdHis>.csv（Service.php:105,108-109）
 *  - 対象: セッション eccube.admin.stock.move_transfer.search の検索条件に一致する全件（Controller.php:424-430 / 並び=登録日降順→ID降順）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class StockStockMoveTransferCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // 在庫移動・振替検索/一覧（admin_stock_move_transfer・CSV出力リンクの起点）
  readonly exportPath: string; // CSV出力 GETルート（直接アクセス/ヘッダ検証用）

  readonly csvExportLink: Locator; // 「在庫移動振替CSV出力」リンク（index.twig:627）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/move_transfer`;
    this.exportPath = `/${ECCUBE_ADMIN_ROUTE}/product/stock/move_transfer/csv_export`;

    // href の位置情報でリンクを特定（ラベルは trans キー由来であることを上記コメントで確認済み）。
    this.csvExportLink = page.locator(
      `a[href$="/product/stock/move_transfer/csv_export"]`
    );
  }

  /** 在庫移動・振替検索/一覧（CSV出力リンクの起点画面）を開く。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** CSV出力URLへ直接GETアクセスする（URL直接アクセス検証用）。 */
  async gotoExport() {
    await this.page.goto(this.exportPath);
  }

  /** 「在庫移動振替CSV出力」リンクを押下し、ダウンロード発火を待って Download を返す。 */
  async downloadCsv(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.csvExportLink.click(),
    ]);
    return download;
  }

  /** 一覧のCSV出力UI部品が仕様どおり表示されること。 */
  async seeExportLink() {
    await expect(this.csvExportLink).toBeVisible();
  }
}
