import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 商品管理「略称タグCSV入力」Page Object。
 * 納品ケース表 integration_test/e2e/m03_16_admin_product_product_storage_code_import_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-16_admin_product_product_storage_code_import.md / messages.ja.yaml /
 * validators.ja.yaml)由来（オラクル独立性）。実装の Form 制約・現挙動は期待値に流用しない。
 *
 * 設計書と刷新先の URL 乖離（不具合候補#1）:
 *  - 設計書: 取込フォーム表示 GET /{admin_route}/product/storage_code/import
 *  - 刷新先: 表示GETは admin_product_storage_code_csv = /<route>/product/storage_code/csv（StorageCodeController.php:224）。
 *           /import は POST専用（:245）。本POMは実画面 /csv と POST /import を分けて持つ。
 *
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_csv_import`（CsvImportType.php:80-83）由来の位置情報のみ:
 *  - import_file → #admin_csv_import_import_file（csv_product_storage_code.twig:74）
 *  - アップロードボタン → button#upload-button trans admin.common.csv_upload=「CSVファイルをアップロード」(twig:82-83 / messages.ja.yaml:1547)
 *  - 取込画面見出し h3 → trans admin.product.storage_code_csv_upload_title=「略称タグ登録CSVアップロード」(twig:42 / messages.ja.yaml:1786)
 *  - 雛形DL a#download-template-button → trans admin.common.csv_skeleton_download=「雛形ファイルダウンロード」(twig:92 / messages.ja.yaml:1548)
 *  - 一覧に戻る link → trans admin.common.csv_back_to_list=「一覧に戻る」(twig:43-44 / messages.ja.yaml:1584)
 *  - 一覧「CSV入力」link → trans admin.product.csv.import=「CSV入力」(storage_code.twig:64-65 / messages.ja.yaml:2148)
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductStorageCodeImportPage {
  readonly page: Page;
  readonly listUrl: string; // 略称タグ一覧（admin_product_storage_code = /<route>/product/storage）
  readonly csvUrl: string; // 取込画面表示（admin_product_storage_code_csv = /<route>/product/storage_code/csv）
  readonly importPath: string; // 取込POST（admin_product_storage_code_import = /<route>/product/storage_code/import）

  readonly importLink: Locator; // 一覧「CSV入力」リンク（storage_code.twig:64-65）
  readonly fileInput: Locator; // #admin_csv_import_import_file（twig:74）
  readonly uploadButton: Locator; // #upload-button（twig:82-83）
  readonly uploadTitle: Locator; // h3 取込画面見出し（twig:42）
  readonly skeletonDownload: Locator; // a#download-template-button（twig:92）
  readonly backToListLink: Locator; // 「一覧に戻る」（twig:43-44）
  readonly errorAlert: Locator; // フラッシュ/フォームエラー（不具合候補#2：フラッシュ経路）
  readonly loginId: Locator; // 未認証ガード時の管理ログインID欄（login.twig:26）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/product/storage`;
    this.csvUrl = `/${ECCUBE_ADMIN_ROUTE}/product/storage_code/csv`;
    this.importPath = `/${ECCUBE_ADMIN_ROUTE}/product/storage_code/import`;

    this.importLink = page.getByRole("link", { name: "CSV入力" });
    this.fileInput = page.locator("#admin_csv_import_import_file");
    this.uploadButton = page.locator("#upload-button");
    this.uploadTitle = page.getByRole("heading", { name: "略称タグ登録CSVアップロード" });
    this.skeletonDownload = page.locator("#download-template-button");
    this.backToListLink = page.getByRole("link", { name: "一覧に戻る" });
    // 取込結果のエラーはフラッシュ(.alert-danger)またはフォームエラー(.invalid-feedback)で出る（不具合候補#2）。
    this.errorAlert = page.locator(".alert-danger, .invalid-feedback, .text-danger");
    this.loginId = page.locator("#login_id");
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  async gotoCsv() {
    await this.page.goto(this.csvUrl);
  }

  /** 一覧の「CSV入力」リンクから取込画面へ遷移する。 */
  async openCsvViaListLink() {
    await this.gotoList();
    await this.importLink.click();
  }

  /** インラインCSV内容をアップロードする（メモリ上のバッファをファイルとして渡す）。 */
  async uploadCsv(content: string, filename = "storage_code.csv") {
    await this.fileInput.setInputFiles({
      name: filename,
      mimeType: "text/csv",
      buffer: Buffer.from(content, "utf-8"),
    });
    await this.uploadButton.click();
  }

  /** ファイルを選択せずアップロードボタンを押下する（必須バリデーション確認）。 */
  async submitWithoutFile() {
    await this.uploadButton.click();
  }

  /** 取込画面のUI部品（ファイル選択・アップロードボタン）が仕様どおり表示されること。 */
  async seeUploadForm() {
    await expect(this.uploadTitle).toBeVisible();
    await expect(this.fileInput).toBeVisible();
    await expect(this.uploadButton).toBeVisible();
  }
}
