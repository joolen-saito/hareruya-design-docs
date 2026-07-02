import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理「在庫分割結合情報CSV出力」Page Object。
 * 納品ケース表 integration_test/e2e/m04_14_admin_stock_stock_split_join_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m04-14_admin_stock_stock_split_join_csv_export.md / 基本設計仕様書(在庫管理機能))由来
 * （オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 *
 * 本機能は在庫分割結合一覧（M04-12）画面の「在庫分割結合CSV出力」リンク（検索実行後に表示）からのストリーミングダウンロード、
 * および GET ルート admin_stock_split_join_csv_export への直接アクセスである。入力フォームを持たず、検索条件はセッション
 * admin.stock.split_join.search から復元する（本ルートは検索必須ガードなし＝空セッション時は全件）。
 * CSVの中身（固定12列見出し・全件・並び順 s.id 昇順・分割/結合タイプ表示名・店舗/在庫区分・基準価格合計の四捨五入整数・
 * 登録日時 Y/m/d H:i・登録者氏名・0件時ヘッダ行のみ・文字コード SJIS-win）は手動確認とする。
 * 自動化はダウンロード発火・ファイル名・応答ヘッダ・出力リンク表示・未認証ガード・確認ダイアログ非表示に限る。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Stock/stock_split_join_index.twig）。
 * CSSクラス(btn-ec-conversion)は他ボタンと共用で将来変更余地があるため、ルート名由来の href を主セレクタとする:
 *  - 在庫分割結合一覧: route admin_stock_split_join_list = GET/POST /<route>/product/stock/split-join
 *      （StockSplitJoinController.php:90）
 *  - 「在庫分割結合CSV出力」リンク: href$="/product/stock/split-join/csv-export"
 *      （route admin_stock_split_join_csv_export 由来 / stock_split_join_index.twig:292。
 *       表示条件は stockSplitJoinSearchPerformed＝検索実行後のみ / index.twig:291）
 *      ラベル trans admin.stock.split_join.csv_export=「在庫分割結合CSV出力」
 *      （index.twig:292 / messages.ja.yaml:4656）
 *
 * ルート/応答（src/Eccube/Controller/Admin/Stock/StockSplitJoinController.php
 *   / src/Eccube/Service/Csv/Exporter/StockSplitJoinCsvExportService.php）:
 *  - CSV出力 admin_stock_split_join_csv_export = GET /<route>/product/stock/split-join/csv-export（Controller.php:210-211）
 *  - 応答: StreamedResponse / Content-Type application/octet-stream（Service.php:85）
 *      / Content-Disposition attachment; filename=stock_split_join_<YmdHis>.csv（Service.php:84,86）
 *  - 対象: セッション admin.stock.split_join.search の検索条件に一致する全件（Controller.php:213-219 / 並び=s.id 昇順 Service.php:59）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class StockStockSplitJoinCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // 在庫分割結合一覧（admin_stock_split_join_list・CSV出力リンクの起点）
  readonly exportPath: string; // CSV出力 GETルート（直接アクセス/ヘッダ検証用）

  readonly csvExportLink: Locator; // 「在庫分割結合CSV出力」リンク（index.twig:292・検索実行後に表示）
  readonly searchSubmit: Locator;  // 一覧の検索フォーム送信ボタン（検索実行＝「検索実行後」状態を作る）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/split-join`;
    this.exportPath = `/${ECCUBE_ADMIN_ROUTE}/product/stock/split-join/csv-export`;

    // href の位置情報でリンクを特定（ラベルは trans キー由来であることを上記コメントで確認済み）。
    this.csvExportLink = page.locator(
      `a[href$="/product/stock/split-join/csv-export"]`
    );
    // 検索フォーム（POST admin_stock_split_join_list）の検索ボタン（type=submit / label trans
    // admin.common.search＝「検索」 / stock_split_join_index.twig:280）。CSV登録ボタンは type=button のため非対象。要実機確認。
    this.searchSubmit = page.locator(
      `form[name="admin_search_stock_split_join"] button[type="submit"]`
    );
  }

  /** 在庫分割結合一覧（CSV出力リンクの起点画面）を開く。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /**
   * 在庫分割結合一覧で検索を実行して結果一覧へ遷移する（CSV出力リンクは検索実行後のみ表示）。
   * 仕様「検索を実行する」に忠実に、検索フォームを実際に送信して「検索実行後」状態を作る
   * （?resume 等の実装由来クエリには依存しない＝オラクル独立性）。条件未指定の送信は全件検索となり、
   * stockSplitJoinSearchPerformed=true で出力リンクが表示される（index.twig:291）。検索ボタンの
   * 具体セレクタは M04-12（一覧・検索）の責務でもあり、本機能では送信実行のみを行う。要実機確認。
   */
  async gotoListWithSearchPerformed() {
    await this.page.goto(this.listUrl);
    await Promise.all([
      this.page.waitForLoadState(),
      this.searchSubmit.click(),
    ]);
  }

  /** CSV出力URLへ直接GETアクセスする（URL直接アクセス検証用）。 */
  async gotoExport() {
    await this.page.goto(this.exportPath);
  }

  /** 「在庫分割結合CSV出力」リンクを押下し、ダウンロード発火を待って Download を返す。 */
  async downloadCsv(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.csvExportLink.click(),
    ]);
    return download;
  }

  /** 一覧のCSV出力UI部品が仕様どおり表示されること（検索実行後）。 */
  async seeExportLink() {
    await expect(this.csvExportLink).toBeVisible();
  }
}
