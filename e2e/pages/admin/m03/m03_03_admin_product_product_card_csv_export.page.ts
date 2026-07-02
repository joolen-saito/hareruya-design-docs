import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 商品管理「カード商品CSV出力」Page Object。
 * 納品ケース表 integration_test/e2e/m03_03_admin_product_product_card_csv_export_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-03_admin_product_product_card_csv_export.md / messages.ja.yaml)由来
 * （オラクル独立性）。本機能は商品一覧の一括フォーム(form_bulk)から POST するダウンロードであり、
 * CSVの中身（列・順序・値・規格行複製・検索条件一致・エンコード/BOM）は手動確認とする。
 * 自動化はダウンロード発火・ファイル名・UI部品・必須(ID未選択)エラー・例外時リダイレクト・権限に限る。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Product/index.twig）:
 *  - 商品一覧/検索フォーム: form#search_form（index.twig:211, action=admin_product）
 *  - キーワード(商品名)入力: #admin_search_product_product_name（searchForm.product_name index.twig:217 / blockPrefix=admin_search_product）
 *  - 検索実行ボタン: .admin-product-search-submit（index.twig:445, trans admin.product.search_submit_label）
 *  - 一括フォーム: form#form_bulk（index.twig:465, method POST action=""）
 *  - 「カード商品CSV出力」ボタン: form_bulk 内 button[type=submit] formaction=url('admin_product_card_csv_export')（index.twig:468-470 / trans admin.product.card_csv_export=「カード商品CSV出力」messages.ja.yaml:2045）
 *  - 各商品行チェックボックス: input[name="ids[]"] id=check_{Product.id}（index.twig:585）
 *  - 表頭の全選択: #trigger_check_all（index.twig:552, JS index.twig:131-138 で input[id^="check_"] を一括ON/OFF）
 *  - 検索結果0件メッセージ: trans admin.common.search_no_result=「検索条件に合致するデータが見つかりませんでした」（index.twig:824 / messages.ja.yaml:1542）
 *
 * ルート（src/Eccube/Controller）:
 *  - 商品一覧 admin_product = GET/POST /<route>/product（ProductController.php:122）
 *  - 一覧ページング admin_product_page = /<route>/product/page/{page_no}（ProductController.php:123）
 *  - カードCSV出力 admin_product_card_csv_export = POST /<route>/product/product_card_csv_export（ProductCsvController.php:61）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductCardCsvExportPage {
  readonly page: Page;
  readonly productListUrl: string; // 商品一覧（admin_product）
  readonly cardCsvExportPath: string; // POST 専用ルート（GET直アクセス検証用）

  readonly searchForm: Locator; // form#search_form（index.twig:211）
  readonly searchKeyword: Locator; // #admin_search_product_product_name（index.twig:217）
  readonly searchSubmit: Locator; // .admin-product-search-submit（index.twig:445）
  readonly bulkForm: Locator; // form#form_bulk（index.twig:465）
  readonly cardCsvButton: Locator; // 「カード商品CSV出力」ボタン（index.twig:468-470）
  readonly checkboxes: Locator; // input[name="ids[]"]（index.twig:585）
  readonly triggerCheckAll: Locator; // #trigger_check_all（index.twig:552）
  readonly noResult: Locator; // 検索0件メッセージ（index.twig:824）

  constructor(page: Page) {
    this.page = page;
    this.productListUrl = `/${ECCUBE_ADMIN_ROUTE}/product`;
    this.cardCsvExportPath = `/${ECCUBE_ADMIN_ROUTE}/product/product_card_csv_export`;

    this.searchForm = page.locator("#search_form");
    this.searchKeyword = page.locator("#admin_search_product_product_name");
    this.searchSubmit = page.locator(".admin-product-search-submit");
    this.bulkForm = page.locator("#form_bulk");
    // 文言は trans admin.product.card_csv_export（messages.ja.yaml:2045）由来。位置情報として name で特定する。
    this.cardCsvButton = page.getByRole("button", { name: "カード商品CSV出力" });
    this.checkboxes = page.locator('#form_bulk input[name="ids[]"]');
    this.triggerCheckAll = page.locator("#trigger_check_all");
    this.noResult = page.getByText("検索条件に合致するデータが見つかりませんでした");
  }

  async gotoList() {
    await this.page.goto(this.productListUrl);
  }

  /** 検索フォームを送信して一覧結果を描画する（キーワード未指定なら全件相当）。 */
  async search(keyword = "") {
    if (keyword) {
      await this.searchKeyword.fill(keyword);
    }
    await this.searchSubmit.click();
  }

  /** 一致のないキーワードで検索し、結果0件状態にする。 */
  async searchNoResult(keyword: string) {
    await this.searchKeyword.fill(keyword);
    await this.searchSubmit.click();
  }

  /** 先頭の商品チェックボックスをONにする。 */
  async checkFirstProduct() {
    await this.checkboxes.first().check();
  }

  /** 指定IDの商品チェックボックスをONにする。 */
  async checkProduct(id: number | string) {
    await this.page.locator(`#check_${id}`).check();
  }

  /** カード商品CSV出力を押す（選択済み前提）。ダウンロード発火を待って Download を返す。 */
  async exportAndWaitDownload(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.cardCsvButton.click(),
    ]);
    return download;
  }

  /** カード商品CSV出力を押す（エラー/リダイレクト経路の検証用）。 */
  async clickCardCsvExport() {
    await this.cardCsvButton.click();
  }

  /** 一覧の一括フォーム・CSV出力ボタンが仕様どおり表示されること。 */
  async seeBulkExportForm() {
    await expect(this.cardCsvButton).toBeVisible();
    await expect(this.checkboxes.first()).toBeVisible();
  }
}
