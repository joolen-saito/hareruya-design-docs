import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 カードCSV登録（取込）アップロード画面 Page Object。
 * 納品ケース表 integration_test/e2e/m14_05_admin_card_card_csv_import_e2e_cases.md に対応。
 * 期待結果は仕様(pf-eccube3 m14-05_admin_card_card_csv_import.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_csv_import`（CsvImportType.php:80-83）由来の位置情報のみ。
 *
 * 刷新先ルート（ec-cube-enterprise / CardCsvController.php）:
 *  - GET アップロード画面 admin_card_csv_upload : /{admin_route}/card/csv_upload（描画 @admin/Card/csv_card.twig → @admin/Product/base_csv_upload.twig）
 *  - POST 取込 admin_card_csv_import          : /{admin_route}/card/import（form action）
 *  - 雛形DL admin_card_csv_template            : /{admin_route}/card/csv_template
 *  旧設計(pf-eccube3)は GET/POST とも /card/csvimport（ケース表 付帯表4#1 の刷新差分）。
 *
 * DOM 根拠:
 *  - ファイル選択 import_file → #admin_csv_import_import_file（base_csv_upload.twig:65 / CsvImportType.php:48,80）
 *  - アップロードボタン #upload-button（base_csv_upload.twig:73 trans admin.common.csv_upload messages.ja.yaml:1547）
 *  - アップロードフォーム #upload-form（base_csv_upload.twig:53 action=admin_card_csv_import）
 *  - 雛形DLボタン #download-template-button（base_csv_upload.twig:83 trans admin.common.csv_skeleton_download messages.ja.yaml:1548）
 *  - フォーマット表 table.table（base_csv_upload.twig:87）／必須バッジ .badge.bg-primary（base:101 trans admin.common.required messages.ja.yaml:1528）
 *  - 成功フラッシュ .alert-success（alert.twig:21-22）／エラーフラッシュ .alert-danger（alert.twig:32-42）
 */
export class CardCardCsvImportPage {
  readonly page: Page;
  readonly uploadUrl: string; // GET アップロード画面
  readonly importPostPath: string; // POST 取込パス（参照用）

  readonly fileInput: Locator; // ファイル選択 input
  readonly uploadButton: Locator; // 「CSVファイルをアップロード」
  readonly uploadForm: Locator; // #upload-form
  readonly templateDownloadButton: Locator; // 「雛形ファイルダウンロード」
  readonly formatTable: Locator; // フォーマット説明表
  readonly requiredBadge: Locator; // 必須バッジ
  readonly successFlash: Locator; // .alert-success
  readonly errorFlash: Locator; // .alert-danger

  constructor(page: Page) {
    this.page = page;
    this.uploadUrl = `/${ECCUBE_ADMIN_ROUTE}/card/csv_upload`;
    this.importPostPath = `/${ECCUBE_ADMIN_ROUTE}/card/import`;

    this.fileInput = page.locator("#admin_csv_import_import_file");
    this.uploadButton = page.locator("#upload-button");
    this.uploadForm = page.locator("#upload-form");
    this.templateDownloadButton = page.locator("#download-template-button");
    this.formatTable = page.locator("table.table");
    this.requiredBadge = page.locator(".badge.bg-primary", { hasText: "必須" });
    this.successFlash = page.locator(".alert-success");
    this.errorFlash = page.locator(".alert-danger");
  }

  async goto() {
    await this.page.goto(this.uploadUrl);
  }

  /** ファイルを選択してアップロードボタンを押下する。 */
  async upload(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
    await this.uploadButton.click();
  }

  /** ファイル未選択のまま送信する（必須バリデーション確認）。 */
  async submitWithoutFile() {
    await this.uploadButton.click();
  }

  /** アップロード画面のUI部品が仕様どおり表示されること。 */
  async seeUploadForm() {
    await expect(this.fileInput).toBeVisible();
    await expect(this.uploadButton).toBeVisible();
    await expect(this.formatTable).toBeVisible();
  }
}
