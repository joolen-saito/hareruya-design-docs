import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理「在庫情報CSV出力」Page Object（M04-04）。
 * 納品ケース表 integration_test/e2e/m04_04_admin_stock_stock_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m04-04_admin_stock_stock_csv_export.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約は期待値に流用しない。
 *
 * 本機能は在庫検索一覧（M04-01）の「在庫情報CSV出力」ボタン（GETリンク）からの StreamedResponse ダウンロードであり、
 * セッション admin.stock.list.search に保存された検索条件で全件をCSV出力する。自動化はダウンロード発火・ファイル名・
 * 応答ヘッダ・UI部品（ボタン表示/押下）・検索未実行時のエラー＆一覧リダイレクト・未認証ガードに限る。
 * CSV構造（0件時はヘッダ行のみ＝1行・ヘッダのカンマ区切り列数19）はダウンロードファイルから自動検証する
 * （期待値は設計書「出力列数19」:55 / 「対象0件＝ヘッダ行のみ」:103 由来）。
 * CSV各列の値・見出し文言・SJIS-win変換・削除レコード除外は実ファイルを開いて手動確認とする。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Stock/stock_list_index.twig）。
 * CSSクラス(btn-ec-conversion)は将来変更余地があるため、ルート名由来の href / フォームIDを主セレクタとする:
 *  - 在庫一覧:         route admin_stock_list      = GET/POST /<route>/product/stock（StockListController.php:94）
 *  - 「在庫情報CSV出力」: <a href="{{ url('admin_stock_list_csv') }}">（stock_list_index.twig:447）
 *      ラベル trans admin.stock.list.stock_info_csv=「在庫情報CSV出力」（stock_list_index.twig:448 / messages.ja.yaml:4453）
 *      ※ pagination が空でない（＝検索結果あり）場合のみ表示（stock_list_index.twig:439）
 *  - 検索ボタン:        #searchStockListForm 内 type=submit「検索」（stock_list_index.twig:74,412 / admin.common.search messages.ja.yaml:1446）
 *  - 商品コード入力:     searchForm.product_code（stock_list_index.twig:108 / 0件検索の入力。block prefix admin_search_stock_list=form name :74 → DOM id #admin_search_stock_list_product_code ※要実機確認）
 *  - 検索結果なし表示:    admin.common.search_no_result=「検索条件に合致するデータが見つかりませんでした」（stock_list_index.twig:648 / messages.ja.yaml:1542）
 *  - エラーフラッシュ:   .alert-danger（alert.twig:42 / app.flashes('eccube.admin.error')）
 *
 * ルート（src/Eccube/Controller/Admin/Stock/StockListController.php）:
 *  - 在庫情報CSV出力 admin_stock_list_csv = GET /<route>/product/stock/csv（:213）
 *    応答(StreamedResponse): Content-Type application/octet-stream（:97）/ Content-Disposition attachment; filename=stock_list_<YmdHis>.csv（:96-100）
 *    検索未実行/不整合: addError('admin.stock.list.search_required_for_csv')＋admin_stock_list へリダイレクト（:218-221,:227-232）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class StockStockCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // 在庫一覧（admin_stock_list）
  readonly exportPath: string; // 在庫情報CSV出力 GETルート（直接アクセス/ヘッダ検証用）

  readonly searchForm: Locator; // 検索フォーム #searchStockListForm（stock_list_index.twig:74）
  readonly searchButton: Locator; // 検索ボタン（stock_list_index.twig:412）
  readonly productCodeInput: Locator; // 商品コード入力（stock_list_index.twig:108）※block prefix由来id・要実機確認
  readonly csvExportLink: Locator; // 「在庫情報CSV出力」リンク（stock_list_index.twig:447-448）
  readonly noResultMessage: Locator; // 検索結果なし表示（stock_list_index.twig:648）
  readonly errorAlert: Locator; // エラーフラッシュ .alert-danger（alert.twig:42）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock`;
    this.exportPath = `/${ECCUBE_ADMIN_ROUTE}/product/stock/csv`;

    this.searchForm = page.locator("#searchStockListForm");
    // 検索フォーム内の submit（保存/クリア等と区別するためフォームスコープ＋文言で限定）
    this.searchButton = this.searchForm.getByRole("button", {
      name: "検索",
      exact: true,
    });
    // 商品コード入力（block prefix admin_search_stock_list 由来の DOM id）。placeholder でも代替特定可（要実機確認）。
    this.productCodeInput = page.locator("#admin_search_stock_list_product_code");
    // href の位置情報でリンクを特定（ラベルは trans キー由来であることを上記コメントで確認済み）。
    this.csvExportLink = page.locator(`a[href$="/product/stock/csv"]`);
    // 検索結果0件の表示（trans admin.common.search_no_result）。シード未投入の判定に用いる。
    this.noResultMessage = page.getByText("検索条件に合致するデータが見つかりませんでした");
    this.errorAlert = page.locator(".alert-danger");
  }

  /** 在庫一覧（CSV出力ボタンの起点画面）を開く。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 在庫情報CSV出力URLへ直接GETアクセスする（URL直接アクセス／エラー分岐検証用）。 */
  async gotoExport() {
    await this.page.goto(this.exportPath);
  }

  /**
   * 在庫一覧で検索を1回実行し、セッション admin.stock.list.search に検索条件を確定させる。
   * 空条件でも valid なら session に保存される（StockListController.php:140-141）。
   */
  async runSearch() {
    await this.gotoList();
    await this.searchButton.click();
    await expect(this.page).toHaveURL(
      new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/stock`)
    );
  }

  /**
   * 在庫一覧で「該当0件」となる検索（存在しない商品コード）を1回実行し、
   * セッション admin.stock.list.search に0件条件を確定させる。
   * 0件CSV（ヘッダ行のみ・19列）の構造検証用。UI操作のみでDBシード不要・べき等。
   */
  async runSearchNoHit(noHitCode = "E2E-M04-04-NO-HIT-CODE") {
    await this.gotoList();
    await this.productCodeInput.fill(noHitCode);
    await this.searchButton.click();
    await expect(this.page).toHaveURL(
      new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/stock`)
    );
  }

  /** 直近の検索が結果ありか（検索結果なし表示が出ていないか）。SEED-M04-04-STOCK 未投入判定に用いる。 */
  async hasSearchResults(): Promise<boolean> {
    return !(await this.noResultMessage.isVisible());
  }

  /** 「在庫情報CSV出力」ボタンを押下し、ダウンロード発火を待って Download を返す（検索結果あり前提）。 */
  async downloadViaButton(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.csvExportLink.click(),
    ]);
    return download;
  }

  /**
   * CSV出力URLへ直接GETしてダウンロード発火を待つ（URL直接アクセス検証用）。
   * 添付応答へのnavigationはダウンロード開始でgotoが中断されるため、その既知エラー
   * （Download is starting / net::ERR_ABORTED）のみ握りつぶし、それ以外（接続失敗等）は
   * 再送出してダウンロード未発火と切り分ける。
   */
  async downloadViaDirectGet(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.page.goto(this.exportPath).catch((e: unknown) => {
        const msg = e instanceof Error ? e.message : String(e);
        if (/Download is starting|ERR_ABORTED/i.test(msg)) return null; // 添付応答でnavigation中断＝想定内
        throw e; // 想定外のエラーは隠さない
      }),
    ]);
    return download;
  }

  /** 在庫一覧画面に到達していること（入口の表示確認）。 */
  async seeListScreen() {
    await expect(this.searchForm).toBeVisible();
  }
}
