import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 商品管理「棚番号更新CSV登録」Page Object（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m03_40_admin_product_product_shelf_number_csv_import_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-40_admin_product_product_shelf_number_csv_import.md / 観点表)由来
 * （オラクル独立性）。実装の現挙動・Form制約(NotBlank/maxSize)・messages.ja.yaml の打ち切り文言は期待値に流用しない
 * （messages.ja.yaml 等の実装値はセレクタ位置の根拠としてのみ参照し、期待文言として固定しない）。
 * 取込後の dtb_product_class.shelf_number_id 原値照合・dtb_csv_import_history INSERT は手動/間接。
 * 自動化はアップロード発火・取込結果フラッシュ・バリデーションエラー・画面表示・雛形ダウンロード発火に限る。
 *
 * セレクタは Twig＋Symfony Form `CsvImportType` の getBlockPrefix=`admin_csv_import`（Form/Type/Admin/CsvImportType.php:80-83）由来の位置情報のみ。
 * DOM/文言根拠:
 *  - 画面 Twig: csv_product_shelf_number_update.twig（base_csv_upload.twig を継承）
 *  - フォーム: form#upload-form（base_csv_upload.twig:53 method=post action=url('admin_product_shelf_number_csv_upload') enctype=multipart）
 *  - CSRFトークン: #admin_csv_import__token（base_csv_upload.twig:54 form._token）
 *  - ファイル入力: #admin_csv_import_import_file（base_csv_upload.twig:65 / blockPrefix=admin_csv_import + import_file / class custom-file-input。Bootstrap装飾で視覚的に隠れるため setInputFiles で投入し可視判定はしない）
 *  - アップロードボタン: #upload-button（base_csv_upload.twig:73 trans admin.common.csv_upload=「CSVファイルをアップロード」messages.ja.yaml:1547）
 *  - 雛形ダウンロード: a#download-template-button（base_csv_upload.twig:83 url('admin_product_shelf_number_csv_template') trans admin.common.csv_skeleton_download=「雛形ファイルダウンロード」messages.ja.yaml:1548）
 *  - カード見出し(アップロード): .card-title trans csv_box_title=admin.product.product_shelf_number_csv_upload_title（Controller:95 / messages.ja.yaml:1835）
 *  - カード見出し(フォーマット): .card-title trans csv_format_title=admin.product.product_shelf_number_csv_format_title（Controller:96 / messages.ja.yaml:1836）
 *  - フォーマット表 必須バッジ: th .badge + trans admin.common.required（base_csv_upload.twig:101-103。必須は商品コードのみ＝getRequiredCsvHeader Controller:196-201）
 *  - エラー: .alert-danger（@admin/alert.twig:42 eccube.admin.error。addError($msg,'admin')＋PRGリダイレクト後に取込画面で表示）
 *  - 成功: .alert-success（@admin/alert.twig:22 eccube.admin.success。addSuccess('admin.register.complete','admin')）
 *  - カスタムファイル名ラベル: .custom-file-label（base_csv_upload.twig JS で選択ファイル名を表示）
 *
 * ルート（ProductShelfNumberCsvController.php）:
 *  - admin_product_shelf_number_csv_import   = GET  /<route>/product/product_shelf_number_csv_import（:71 アップロード画面・フォーマット表・履歴）
 *  - admin_product_shelf_number_csv_upload   = POST /<route>/product/product_shelf_number_csv_upload（:114 取込→常に import 画面へリダイレクト）
 *  - admin_product_shelf_number_csv_template = GET  /<route>/product/shelf_number/csv_template（:54 product_shelf_number_template.csv）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductShelfNumberCsvImportPage {
  readonly page: Page;
  readonly url: string; // 取込画面(GET import)

  readonly uploadForm: Locator; // form#upload-form
  readonly fileInput: Locator; // #admin_csv_import_import_file（custom-file-input。setInputFiles で投入）
  readonly fileNameLabel: Locator; // .custom-file-label（JSで選択ファイル名表示）
  readonly uploadButton: Locator; // #upload-button（CSVファイルをアップロード）
  readonly downloadButton: Locator; // a#download-template-button（雛形ダウンロード）
  readonly cardTitles: Locator; // .card-title（アップロード/フォーマットの見出し）
  readonly requiredBadges: Locator; // フォーマット表の必須バッジ
  readonly errors: Locator; // .alert-danger（取込エラーフラッシュ）
  readonly success: Locator; // .alert-success（取込成功フラッシュ）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product/product_shelf_number_csv_import`;

    this.uploadForm = page.locator("#upload-form");
    this.fileInput = page.locator("#admin_csv_import_import_file");
    this.fileNameLabel = page.locator(".custom-file-label");
    this.uploadButton = page.locator("#upload-button");
    this.downloadButton = page.locator("#download-template-button");
    this.cardTitles = page.locator(".card-title");
    this.requiredBadges = page.locator(".badge");
    this.errors = page.locator(".alert-danger");
    this.success = page.locator(".alert-success");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /**
   * CSV をその場で生成して取込む（ファイル入力に setInputFiles → アップロードボタン押下）。
   * ヘッダ既定列順は getCsvHeader（商品コード,棚番号）。POST 後は仕様どおり取込画面(GET import)へリダイレクトされる。
   */
  async uploadCsv(fileName: string, content: string, mimeType = "text/csv") {
    await this.fileInput.setInputFiles({
      name: fileName,
      mimeType,
      buffer: Buffer.from(content, "utf-8"),
    });
    await this.uploadButton.click();
  }

  /** ファイル入力にだけ投入してカスタムラベルへのファイル名反映を確認する（送信しない＝非破壊）。 */
  async attachFileOnly(fileName: string, content: string, mimeType = "text/csv") {
    await this.fileInput.setInputFiles({
      name: fileName,
      mimeType,
      buffer: Buffer.from(content, "utf-8"),
    });
  }

  /** 棚番号更新CSV登録画面の主要UI部品が仕様どおり表示されること（ファイル入力は装飾で隠れるため attach 判定）。 */
  async seeUploadForm() {
    await expect(this.fileInput).toBeAttached();
    await expect(this.uploadButton).toBeVisible();
    await expect(this.downloadButton).toBeVisible();
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
