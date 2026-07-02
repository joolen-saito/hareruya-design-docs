import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 商品管理「部門CSV登録」Page Object（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m03_20_admin_product_product_department_csv_import_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-20_admin_product_product_department_csv_import.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約(NotBlank/maxSize)は期待値に流用しない。取込後の mtb_section 原値照合は手動/間接。
 * 自動化はアップロード発火・取込結果メッセージ・バリデーションエラー・画面表示・雛形ダウンロード発火に限る。
 *
 * セレクタは Twig＋Symfony Form `CsvImportType` の getBlockPrefix=`admin_csv_import`（Form/Type/Admin/CsvImportType.php:80-83）由来の位置情報のみ。
 * DOM/文言根拠（src/Eccube/Resource/template/admin/Product/csv_department.twig）:
 *  - フォーム: form#upload-form（twig:66 method=post action=url('admin_product_department_csv_import') enctype=multipart）
 *  - ファイル入力(hidden d-none): #admin_csv_import_import_file（twig:71 / blockPrefix=admin_csv_import + import_file）
 *  - ファイル名表示: #admin_csv_import_import_file_name（twig:70 既定 trans admin.common.file_select_empty）
 *  - ファイル選択ボタン: #file-select（twig:69 trans admin.common.file_select=「ファイルを選択」messages:1553）
 *  - 一括登録ボタン: #upload-button（twig:74 trans admin.common.bulk_registration=「一括登録を実行」messages:1451）
 *  - 雛形ダウンロード: #download-button a href=url('admin_product_csv_template',{type:'department'})（twig:91 trans admin.common.csv_skeleton_download messages:1548）
 *  - エラー表示: .text-danger（twig:76 {% for error in errors %}）
 *  - カード見出し: trans admin.common.csv_upload=「CSVファイルをアップロード」（twig:60 messages:1547）
 *  - フォーマット表 必須バッジ: th .badge + trans admin.common.required（twig:101-103）
 *
 * ルート: admin_product_department_csv_import = GET,POST /<route>/product/department_csv_upload（CsvImportController.php:1077-1079）
 *         admin_product_csv_template (type=department) = GET /<route>/product/csv_template/{type}（CsvImportController.php:1205-1206 → department.csv）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductDepartmentCsvImportPage {
  readonly page: Page;
  readonly url: string;

  readonly fileInput: Locator; // #admin_csv_import_import_file（hidden d-none。setInputFiles で投入）
  readonly fileSelectButton: Locator; // #file-select
  readonly fileNameLabel: Locator; // #admin_csv_import_import_file_name
  readonly uploadButton: Locator; // #upload-button（一括登録を実行）
  readonly downloadButton: Locator; // #download-button（雛形ダウンロード a）
  readonly uploadForm: Locator; // form#upload-form
  readonly errors: Locator; // .text-danger（取込エラー一覧）
  readonly cardTitle: Locator; // trans admin.common.csv_upload 見出し
  readonly formatTable: Locator; // #ex-csv_section-format（CSVフォーマット表 twig:96）
  readonly requiredBadges: Locator; // フォーマット表の必須バッジ

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product/department_csv_upload`;

    this.fileInput = page.locator("#admin_csv_import_import_file");
    this.fileSelectButton = page.locator("#file-select");
    this.fileNameLabel = page.locator("#admin_csv_import_import_file_name");
    this.uploadButton = page.locator("#upload-button");
    this.downloadButton = page.locator("#download-button");
    this.uploadForm = page.locator("#upload-form");
    this.errors = page.locator(".text-danger");
    this.cardTitle = page.locator(".card-header");
    this.formatTable = page.locator("#ex-csv_section-format");
    this.requiredBadges = page.locator(".badge");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /**
   * CSV をその場で生成して取込む（hidden 入力に setInputFiles → 一括登録ボタン押下）。
   * ヘッダ既定列順は getDepartmentCsvHeader の trans 値順（部門ID,部門名,部門コード,免税区分,MTGBuyer表示フラグ）。
   */
  async uploadCsv(fileName: string, content: string) {
    await this.fileInput.setInputFiles({
      name: fileName,
      mimeType: "text/csv",
      buffer: Buffer.from(content, "utf-8"),
    });
    await this.uploadButton.click();
  }

  /**
   * 部門CSV登録画面の主要UI部品が仕様どおり表示されること。
   * ケース E2E-M03-20-001 はファイル選択・一括登録・雛形リンクに加えて
   * 「CSVフォーマット表」表示も期待するため、フォーマット表 #ex-csv_section-format も検証する。
   */
  async seeUploadForm() {
    await expect(this.fileSelectButton).toBeVisible();
    await expect(this.uploadButton).toBeVisible();
    await expect(this.downloadButton).toBeVisible();
    await expect(this.formatTable).toBeVisible();
  }

  /** 雛形ダウンロードを発火し Download を返す（ファイル名検証用。内容は手動確認）。 */
  async downloadTemplate(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.downloadButton.click(),
    ]);
    return download;
  }
}
