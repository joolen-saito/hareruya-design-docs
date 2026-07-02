import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理「在庫警戒リストCSV出力」(M04-07) Page Object。
 *
 * 重要: 本機能は基本設計仕様書・Excel設計書で「Ph2で対応するため Ph1では実装しない」と明記された
 * 新規機能であり、刷新先 ec-cube-enterprise を横断検索（warning / 在庫警戒 / StockListCsvExport /
 * stock_warning）した結果、在庫警戒リスト専用の Controller・Route・CSV出力Service・出力画面(Twig)は
 * いずれも **未実装** であることを確認した（screenExists=false）。
 * したがって出力ボタン・出力URLのセレクタは実装から導出できず、**創作しない**＝すべて「要実機確認」。
 *
 * 近接実装（在庫一覧 M04-04/16 系。在庫警戒リストとは別物）:
 *  - StockListController.php:94 route admin_stock_list = /%eccube_admin_route%/product/stock（在庫一覧画面）
 *  - StockListController.php:213-237 route admin_stock_list_csv（在庫情報CSV出力。在庫警戒ではない）
 *  - stock_list_index.twig:443-457 の出力リンク群（リコメンド/在庫情報/カスタムCSV。在庫警戒ボタンは未存在）
 *  - StockListCsvExportService.php:65-96 exportBySearchInput / filename=stock_list_YmdHis.csv（参考構造）
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m04-07_*.md / Excel設計書)由来（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 * Ph2実装着手時に、確定したルート/画面/列定義に合わせて exportPath と各 Locator を確定する。
 */
export class AdminStockStockWarningCsvExportPage {
  readonly page: Page;

  // Ph2で確定する出力URL。route/path 未定義のため暫定値（要実機確認）。
  // 近接の在庫一覧ホスト画面（在庫警戒出力ボタンが Ph2 で並ぶ想定の画面）の参考URL。
  readonly hostListUrl: string; // 参考: 在庫一覧 admin_stock_list（StockListController.php:94）
  readonly exportPath: string; // 在庫警戒リストCSV出力URL = 要実機確認（Ph2でroute確定）

  // 在庫警戒リスト出力ボタン: Twig 未実装のため由来 file:line なし＝要実機確認（創作しない）。
  // Ph2実装後に出力ボタンの id / trans キーが確定したら getByRole 等へ差し替える。
  readonly csvExportButton: Locator; // 由来: 未実装（要実機確認）。Excel識別ID 3「在庫警戒リストCSV出力」

  constructor(page: Page) {
    this.page = page;
    // 参考ホスト画面（実在）。在庫警戒出力ボタンは未実装のためここに存在しない。
    this.hostListUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock`;
    // 専用ルート未定義。path セグメントは創作せず、未確定マーカーのみとする（実機確認まで使用しない）。
    // Ph2でルートが確定したら実機確認のうえ実パスへ差し替える（warning-csv 等の推測セグメントは置かない）。
    this.exportPath = `/${ECCUBE_ADMIN_ROUTE}/__REQUIRE_VERIFICATION__`;
    // ボタンの DOM id / trans キーは Twig 未実装で導出不可。下記文言は Excel設計書「識別ID 3
    // 在庫警戒リストCSV出力」＝仕様由来のラベル候補（DOMセレクタの創作ではない）。
    // Ph2で実ボタンの id / trans キーを実機確認後、確定セレクタへ差し替える。
    this.csvExportButton = page.getByRole("button", {
      name: "在庫警戒リストCSV出力",
    });
  }

  /** Ph2のホスト画面（在庫一覧）を開く。在庫警戒出力ボタンの設置先候補。 */
  async gotoHostList() {
    await this.page.goto(this.hostListUrl);
  }

  /**
   * 在庫警戒リストCSV出力ボタン押下でダウンロードを発火させる（Ph2想定）。
   * Ph1未実装のため未使用。Ph2実装後にセレクタを実機確認のうえ有効化する。
   */
  async downloadCsv() {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.csvExportButton.click(),
    ]);
    return download;
  }

  /** 出力ボタンが表示されること（Ph2想定。Ph1未実装では一致しない＝対象外）。 */
  async seeExportButton() {
    await expect(this.csvExportButton).toBeVisible();
  }
}
