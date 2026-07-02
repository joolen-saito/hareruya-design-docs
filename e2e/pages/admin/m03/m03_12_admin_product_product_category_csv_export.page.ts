import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 商品管理「カテゴリ CSV 出力」Page Object。
 * 納品ケース表 integration_test/e2e/m03_12_admin_product_product_category_csv_export_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-12_admin_product_product_category_csv_export.md / messages.ja.yaml)由来
 * （オラクル独立性）。本機能はカテゴリ一覧のパンくず右にある GET リンクからのストリーミングダウンロードであり、
 * CSVの中身（ヘッダ列＝有効dtb_csv項目・行＝全カテゴリ・sort_no降順・対象商品数集計・空セル正規化・UTF-8/BOM/区切り）は
 * 手動確認とする。自動化はダウンロード発火・ファイル名・応答ヘッダ・UI部品（DLリンク/CSV設定リンク）・未認証ガードに限る。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Product/category.twig）。
 * CSSクラス(btn-primary)は将来変更余地があるため、ルート名由来の href を主セレクタとする（btn-primary はDOM根拠の補助）:
 *  - カテゴリ一覧: route admin_product_category = GET /<route>/product/category（CategoryController.php:67）
 *  - 「CSVダウンロード」リンク: 実装は href$="/product/category/export"（ルート admin_product_category_export 由来）。
 *      DOM根拠 a.btn.btn-primary（category.twig:243）／ラベル span trans admin.common.csv_download=「CSVダウンロード」（category.twig:245 / messages.ja.yaml:1546）
 *  - 「CSV出力項目設定」リンク: 実装は href*="/setting/shop/csv/"（category.twig:247）。
 *      設計書は id=カテゴリCSV種別の整数と規定（具体値は実装由来のためセレクタに固定しない）。
 *      ラベル span trans admin.setting.shop.csv_setting=「CSV出力項目設定」（category.twig:250 / messages.ja.yaml:2784）
 *
 * ルート（src/Eccube/Controller/Admin/Product/CategoryController.php）:
 *  - カテゴリ一覧 admin_product_category = GET /<route>/product/category（:67）
 *  - カテゴリCSV出力 admin_product_category_export = GET /<route>/product/category/export（:519）
 *    応答: Content-Type application/octet-stream / Content-Disposition attachment; filename=category_<YmdHis>.csv（:573-575）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductCategoryCsvExportPage {
  readonly page: Page;
  readonly categoryListUrl: string; // カテゴリ一覧（admin_product_category）
  readonly exportPath: string; // カテゴリCSV出力 GETルート（直接アクセス/ヘッダ検証用）

  readonly csvDownloadLink: Locator; // 「CSVダウンロード」リンク（category.twig:243-245）
  readonly csvSettingLink: Locator; // 「CSV出力項目設定」リンク（category.twig:247-250）
  readonly categoryEditLink: Locator; // カテゴリ編集リンク（route admin_product_category_edit / category.twig:417）。編集画面遷移用

  constructor(page: Page) {
    this.page = page;
    this.categoryListUrl = `/${ECCUBE_ADMIN_ROUTE}/product/category`;
    this.exportPath = `/${ECCUBE_ADMIN_ROUTE}/product/category/export`;

    // href の位置情報でリンクを特定（ラベルは trans キー由来であることを上記コメントで確認済み）。
    this.csvDownloadLink = page.locator(
      `a[href$="/product/category/export"]`
    );
    this.csvSettingLink = page.locator(`a[href*="/setting/shop/csv/"]`);
    // カテゴリツリーの編集リンク（route admin_product_category_edit 由来。末尾 /edit でルート特定）
    this.categoryEditLink = page.locator(
      `a[href*="/product/category/"][href$="/edit"]`
    );
  }

  async gotoList() {
    await this.page.goto(this.categoryListUrl);
  }

  /** カテゴリ一覧から最初のカテゴリ編集画面へ遷移する（編集画面でも同一DLリンクが出る確認用）。 */
  async gotoFirstCategoryEdit() {
    await this.gotoList();
    await this.categoryEditLink.first().click();
  }

  /** カテゴリCSV出力URLへ直接GETアクセスする（URL直接アクセス検証用）。 */
  async gotoExport() {
    await this.page.goto(this.exportPath);
  }

  /** 「CSVダウンロード」リンクを押下し、ダウンロード発火を待って Download を返す。 */
  async downloadCsv(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.csvDownloadLink.click(),
    ]);
    return download;
  }

  /** カテゴリ一覧のCSV関連UI部品が仕様どおり表示されること。 */
  async seeExportLinks() {
    await expect(this.csvDownloadLink).toBeVisible();
    await expect(this.csvSettingLink).toBeVisible();
  }
}
