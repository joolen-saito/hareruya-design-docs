import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 商品管理「買取/販売価格履歴 CSV 出力」Page Object。
 * 納品ケース表 integration_test/e2e/m03_24_admin_product_product_buy_sale_price_history_csv_export_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-24_admin_product_product_buy_sale_price_history_csv_export.md /
 * BuySalePriceHistoryController.php / messages.ja.yaml)由来（オラクル独立性）。
 * 実装からはセレクタ・ルート（位置情報）のみを取り、合否は仕様で判定する。
 *
 * 本機能は買取/販売価格履歴一覧で検索を実行し、結果1件以上のとき結果ヘッダ右に出る通常リンク
 * 「CSVダウンロード」(GET) を押すと CSV がストリーム応答される。CSVの中身（列順・列値・SJIS-win・BOM・
 * 区切り文字・名称2列順入替）は手動確認とする。自動化はリンク表示/非表示・ダウンロード発火・ファイル名・
 * HTTP応答ヘッダ・セッション欠落時のリダイレクト＋フラッシュに限る。
 *
 * セレクタは Twig 由来の位置情報のみ
 * （src/Eccube/Resource/template/admin/Product/buy_sale_price_history.twig）:
 *  - 検索フォーム: form#search_form（buy_sale_price_history.twig:54。method=POST・action=admin_product_buy_sale_price_history_search page_no=1）
 *  - フリーワード入力: #buy_sale_price_history_search_multi（twig:63。Form getBlockPrefix=buy_sale_price_history_search 由来）
 *  - 検索ボタン: form#search_form button[type="submit"]（twig:201。trans admin.purchase.store.form.search.button=「検索する」messages.ja.yaml:5185）
 *  - 結果テーブル行: #result_list table tbody tr（twig:216,269）。件数の代理
 *  - CSVダウンロード: a[href*="buy_sale_price_history/export"]（twig:247。trans admin.common.csv_download=「CSVダウンロード」messages.ja.yaml:1546）。pagination.totalItemCount>0 のときのみ描画(twig:218)
 *  - データ無し: .text-muted（twig:294。trans admin.product.buy_sale_price_history.no_data=「検索条件に該当するデータがありません。」messages.ja.yaml:1755）
 *  - フラッシュ: .alert-danger（addError 'admin' namespace Controller.php:189 / admin フレームで描画）
 *
 * ルート（src/Eccube/Controller/Admin/Product/BuySalePriceHistoryController.php）:
 *  - 一覧 admin_product_buy_sale_price_history = GET/POST /<route>/product/buy_sale_price_history（Controller.php:103）
 *  - 出力 admin_product_buy_sale_price_history_export = GET /<route>/product/buy_sale_price_history/export（Controller.php:182）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductBuySalePriceHistoryCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // 買取/販売価格履歴一覧（admin_product_buy_sale_price_history）
  readonly exportUrl: string; // CSV 出力ルート（admin_product_buy_sale_price_history_export, GET）

  readonly searchForm: Locator; // form#search_form（twig:54）
  readonly multiInput: Locator; // #buy_sale_price_history_search_multi（twig:63）
  readonly searchButton: Locator; // 検索する submit（twig:201）
  readonly resultRows: Locator; // #result_list table tbody tr（twig:269）
  readonly csvDownloadLink: Locator; // 「CSVダウンロード」(twig:247)
  readonly noDataMessage: Locator; // データ無し .text-muted（twig:294）
  readonly dangerAlert: Locator; // フラッシュ .alert-danger（Controller.php:189）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/product/buy_sale_price_history`;
    this.exportUrl = `/${ECCUBE_ADMIN_ROUTE}/product/buy_sale_price_history/export`;

    this.searchForm = page.locator("#search_form");
    this.multiInput = page.locator("#buy_sale_price_history_search_multi");
    this.searchButton = page.locator('#search_form button[type="submit"]');
    this.resultRows = page.locator("#result_list table tbody tr");
    this.csvDownloadLink = page.locator(
      'a[href*="buy_sale_price_history/export"]'
    );
    this.noDataMessage = page.locator(".text-muted");
    this.dangerAlert = page.locator(".alert-danger");
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 検索条件を空のまま検索を実行（全件ヒット）。POST→/search/1 で結果が描画される。 */
  async searchAll() {
    await this.searchButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /** どの履歴にも一致しないフリーワードで検索を実行（0件想定）。 */
  async searchNoMatch(term: string) {
    await this.multiInput.fill(term);
    await this.searchButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /** 検索結果テーブルの行数（ヒット件数の代理。0 ならシード不足または0件検索）。 */
  async resultCount(): Promise<number> {
    return this.resultRows.count();
  }

  /**
   * 「CSVダウンロード」リンクを押し、ダウンロード発火を待つ。
   * 通常リンク(GET)のため遷移せずストリーム応答が添付ダウンロードされる。
   */
  async clickDownloadAndWait(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.csvDownloadLink.click(),
    ]);
    return download;
  }

  /** 「CSVダウンロード」リンクが仕様どおり表示されること（検索結果が正のとき）。 */
  async seeDownloadLink() {
    await expect(this.csvDownloadLink).toBeVisible();
    // 文言は trans admin.common.csv_download（messages.ja.yaml:1546）。
    await expect(this.csvDownloadLink).toContainText("CSVダウンロード");
  }
}
