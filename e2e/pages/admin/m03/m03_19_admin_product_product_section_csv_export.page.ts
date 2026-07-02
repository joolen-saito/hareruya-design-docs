import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 商品管理「部門 CSV 出力」Page Object。
 * 納品ケース表 integration_test/e2e/m03_19_admin_product_product_section_csv_export_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-19_admin_product_product_section_csv_export.md / messages.ja.yaml)由来
 * （オラクル独立性）。本機能は部門一覧（および部門編集）画面ヘッダの GET リンクからのストリーミングダウンロードであり、
 * CSV の中身（5列固定見出し・全件・部門コード昇順・免税区分の整数出力・表示フラグ1/0・UTF-8/BOM/区切り・0件時見出しのみ）は
 * 手動確認とする。自動化はダウンロード発火・ファイル名・応答ヘッダ・UI部品（CSV出力/CSV入力リンク・編集画面の同リンク）・
 * 未認証ガード・確認ダイアログ非表示に限る。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Product/section.twig）。
 * CSSクラス(btn-csv/btn-primary)は将来変更余地があるため、ルート名由来の href を主セレクタとする:
 *  - 部門一覧:        route admin_product_section        = GET /<route>/product/section（SectionController.php:64）
 *  - 部門編集:        route admin_product_section_edit   = GET /<route>/product/section/{id}（SectionController.php:63）
 *  - 「CSV出力」リンク: href$="/product/section/export"（route admin_product_section_export 由来 / section.twig:44）
 *      ラベル trans admin.product.csv.export=「CSV出力」（section.twig:45 / messages.ja.yaml:2149）
 *  - 「CSV入力」リンク: href$="/product/section/master_csv_upload"（route admin_product_section_master_csv_upload / section.twig:47）
 *      ラベル trans admin.product.csv.import=「CSV入力」（section.twig:48 / messages.ja.yaml:2148）
 *
 * ルート（src/Eccube/Controller/Admin/Product/SectionController.php）:
 *  - 部門CSV出力 admin_product_section_export = GET /<route>/product/section/export（:199）
 *    応答: Content-Type application/octet-stream（:225）/ Content-Disposition attachment; filename=section_<YmdHis>.csv（:224-226）
 *    本文: EXPORT_HEADER（固定見出し）＋ findAllOrderByCode() の全件（部門コード昇順）（:202-221）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductSectionCsvExportPage {
  readonly page: Page;
  readonly sectionListUrl: string; // 部門一覧（admin_product_section）
  readonly exportPath: string; // 部門CSV出力 GETルート（直接アクセス/ヘッダ検証用）

  readonly csvExportLink: Locator; // 「CSV出力」リンク（section.twig:44-45）
  readonly csvImportLink: Locator; // 「CSV入力」リンク（section.twig:47-48）

  constructor(page: Page) {
    this.page = page;
    this.sectionListUrl = `/${ECCUBE_ADMIN_ROUTE}/product/section`;
    this.exportPath = `/${ECCUBE_ADMIN_ROUTE}/product/section/export`;

    // href の位置情報でリンクを特定（ラベルは trans キー由来であることを上記コメントで確認済み）。
    this.csvExportLink = page.locator(`a[href$="/product/section/export"]`);
    this.csvImportLink = page.locator(
      `a[href$="/product/section/master_csv_upload"]`
    );
  }

  /** 部門一覧（CSV出力リンクの起点画面）を開く。 */
  async gotoList() {
    await this.page.goto(this.sectionListUrl);
  }

  /** 部門編集画面を開く（一覧と同一テンプレート＝同じ CSV 出力リンクを持つ）。 */
  async gotoEdit(id: number) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/product/section/${id}`);
  }

  /** 部門CSV出力URLへ直接GETアクセスする（URL直接アクセス検証用）。 */
  async gotoExport() {
    await this.page.goto(this.exportPath);
  }

  /** 「CSV出力」リンクを押下し、ダウンロード発火を待って Download を返す。 */
  async downloadCsv(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.csvExportLink.click(),
    ]);
    return download;
  }

  /** 部門一覧のCSV関連UI部品が仕様どおり表示されること。 */
  async seeExportLinks() {
    await expect(this.csvExportLink).toBeVisible();
    await expect(this.csvImportLink).toBeVisible();
  }
}
