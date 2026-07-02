import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 商品管理「略称タグCSV出力」Page Object。
 * 納品ケース表 integration_test/e2e/m03_15_admin_product_product_storage_code_export_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-15_admin_product_product_storage_code_export.md / messages.ja.yaml)由来
 * （オラクル独立性）。本機能は略称タグ一覧画面のヘッダにある「CSV出力」リンク(GET)からのストリーミング
 * ダウンロードであり、CSVの中身（列 ID・名称・並び順／並び順 rank 昇順／登録済み全件／エンコード）は手動確認とする。
 * 自動化はダウンロード発火・ファイル名(日時を含む.csv)・UI部品・未認証ガード・直接GET発火に限る。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Product/storage_code.twig）:
 *  - 略称タグ一覧画面: route admin_product_storage_code = GET /<route>/product/storage（StorageCodeController.php:69）
 *  - 「CSV出力」リンク(a): storage_code.twig:61-63 href=path('admin_product_storage_code_export')
 *      文言 trans admin.product.csv.export=「CSV出力」（messages.ja.yaml:2149）
 *  - 「CSV入力」リンク(a): storage_code.twig:64-66 trans admin.product.csv.import=「CSV入力」（messages.ja.yaml:2148）
 *  - 未認証ガードのログインフォーム: #login_id（admin/login.twig:26）
 *
 * ルート（src/Eccube/Controller/Admin/Product/StorageCodeController.php）:
 *  - 略称タグCSV出力 admin_product_storage_code_export = GET /<route>/product/storage_code/export（:166-193）
 *    ヘッダ ['ID','名称','並び順']（:45）、rank 昇順 findBy([],['rank'=>'ASC'])（:173）、
 *    Content-Disposition attachment filename=storage_code_<YmdHis>.csv（:188-190）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductStorageCodeExportPage {
  readonly page: Page;
  readonly listUrl: string; // 略称タグ一覧（admin_product_storage_code）
  readonly exportPath: string; // CSV出力（GET admin_product_storage_code_export）

  readonly exportLink: Locator; // 「CSV出力」リンク（storage_code.twig:61-62）
  readonly importLink: Locator; // 「CSV入力」リンク（storage_code.twig:64-65）
  readonly loginId: Locator; // 未認証ガード時のログインID欄（login.twig:26）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/product/storage`;
    this.exportPath = `/${ECCUBE_ADMIN_ROUTE}/product/storage_code/export`;

    // 文言は trans admin.product.csv.export（messages.ja.yaml:2149）由来。位置情報として name で特定する。
    this.exportLink = page.getByRole("link", { name: "CSV出力" });
    this.importLink = page.getByRole("link", { name: "CSV入力" });
    this.loginId = page.locator("#login_id");
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 一覧の「CSV出力」リンク押下でダウンロードが発火するのを待ち、Download を返す。 */
  async exportViaLink(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.exportLink.click(),
    ]);
    return download;
  }

  /** CSV出力URLへ直接GETしてダウンロード発火を待つ（navigation は download に転換されるため reject は握りつぶす）。 */
  async gotoExportForDownload(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.page.goto(this.exportPath).catch(() => null),
    ]);
    return download;
  }

  /** 一覧ヘッダに「CSV出力」リンクが仕様どおり表示されること。 */
  async seeExportLink() {
    await expect(this.exportLink).toBeVisible();
  }
}
