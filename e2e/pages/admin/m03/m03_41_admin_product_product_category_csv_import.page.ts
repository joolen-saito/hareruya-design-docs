import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 商品管理「カテゴリCSV登録」Page Object（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m03_41_admin_product_product_category_csv_import_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-41_admin_product_product_category_csv_import.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約(NotBlank/maxSize)は期待値に流用しない。
 * 取込後の dtb_category 原値照合は手動/間接。自動化はアップロード発火・取込結果メッセージ・
 * バリデーションエラー・画面表示・雛形ダウンロード発火に限る。
 *
 * セレクタは Twig＋Symfony Form `CsvImportType` の getBlockPrefix=`admin_csv_import`
 * （src/Eccube/Form/Type/Admin/CsvImportType.php:80-83）由来の位置情報のみ。
 * DOM/文言根拠（src/Eccube/Resource/template/admin/Product/csv_category.twig）:
 *  - フォーム: form#upload-form（twig:75 method=post action=url('admin_product_category_csv_import') enctype=multipart）
 *  - ファイル入力(d-none): #admin_csv_import_import_file（twig:80 / blockPrefix=admin_csv_import + import_file・accept text/csv,text/tsv）
 *  - ファイル名表示: #admin_csv_import_import_file_name（twig:79 既定 trans admin.common.file_select_empty=「選択されていません」messages:1560）
 *  - ファイル選択ボタン: #file-select（twig:78 trans admin.common.file_select=「ファイルを選択」messages:1553）
 *  - 一括登録ボタン: #upload-button（twig:83 trans admin.common.bulk_registration=「一括登録を実行」messages:1451）
 *  - 雛形ダウンロード: #download-button a href=url('admin_product_csv_template',{type:'category'})（twig:100 trans admin.common.csv_skeleton_download=「雛形ファイルダウンロード」messages:1548）
 *  - 取込エラー一覧: form 内 .text-danger（twig:84-86 {% for error in errors %}）
 *  - カード見出し: trans admin.common.csv_upload=「CSVファイルをアップロード」（twig:69 messages:1547）
 *  - フォーマット表: #ex-csv_category-format（twig:104）／必須バッジ th .badge + trans admin.common.required（twig:110-112）
 *  - フォーム検証エラー(ファイル未選択): form_errors(form.import_file)（twig:81。出力クラスは bootstrap_4_horizontal_layout 依存＝要実機確認）
 *
 * ルート: admin_product_category_csv_import = GET,POST /<route>/product/category_csv_upload（CsvImportController.php:673-675）
 *         admin_product_csv_template (type=category) = GET /<route>/product/csv_template/category（CsvImportController.php:1205-1213 → category.csv）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductCategoryCsvImportPage {
  readonly page: Page;
  readonly url: string;

  readonly fileInput: Locator; // #admin_csv_import_import_file（d-none。setInputFiles で投入）
  readonly fileSelectButton: Locator; // #file-select
  readonly fileNameLabel: Locator; // #admin_csv_import_import_file_name
  readonly uploadButton: Locator; // #upload-button（一括登録を実行）
  readonly downloadButton: Locator; // #download-button（雛形ダウンロード a）
  readonly uploadForm: Locator; // form#upload-form
  readonly csrfToken: Locator; // hidden CSRFトークン（form_widget(form._token) twig:76）
  readonly errors: Locator; // form 内 .text-danger（取込エラー一覧）
  readonly cardTitle: Locator; // trans admin.common.csv_upload 見出し（.card-header）
  readonly formatTable: Locator; // #ex-csv_category-format
  readonly requiredBadges: Locator; // フォーマット表の必須バッジ

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product/category_csv_upload`;

    this.fileInput = page.locator("#admin_csv_import_import_file");
    this.fileSelectButton = page.locator("#file-select");
    this.fileNameLabel = page.locator("#admin_csv_import_import_file_name");
    this.uploadButton = page.locator("#upload-button");
    this.downloadButton = page.locator("#download-button");
    this.uploadForm = page.locator("#upload-form");
    // 隠しCSRFトークン: form_widget(form._token) は name="admin_csv_import[_token]" / id="admin_csv_import__token"。
    this.csrfToken = this.uploadForm.locator('input[type="hidden"][name$="[_token]"]');
    this.errors = page.locator("#upload-form .text-danger");
    this.cardTitle = page.locator(".card-header");
    this.formatTable = page.locator("#ex-csv_category-format");
    this.requiredBadges = this.formatTable.locator(".badge");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /**
   * CSV をその場で生成して取込む（d-none 入力に setInputFiles → 一括登録ボタン押下）。
   * 必須ヘッダは「カテゴリ名」のみ（getCategoryCsvHeader CsvImportController.php:2014-2037）。
   * 列順は問わない（ヘッダ名一致でマップ。業務ルール）。
   */
  async uploadCsv(fileName: string, content: string) {
    await this.fileInput.setInputFiles({
      name: fileName,
      mimeType: "text/csv",
      buffer: Buffer.from(content, "utf-8"),
    });
    await this.uploadButton.click();
  }

  /** ファイル未選択のまま一括登録ボタンを押下（フォーム検証エラー観測用）。 */
  async submitWithoutFile() {
    await this.uploadButton.click();
  }

  /**
   * ファイル選択ボタン(#file-select)経由でファイルを選ぶ（送信しない・非破壊）。
   * #file-select クリックで d-none 入力の click＋change ハンドラが束ねられ、選択後に
   * #admin_csv_import_import_file_name ラベルが選択ファイル名へ更新される（twig:51-58）。
   * native file chooser を Playwright の filechooser で受ける。
   */
  async pickFileViaChooser(fileName: string, content: string) {
    const fileChooserPromise = this.page.waitForEvent("filechooser");
    await this.fileSelectButton.click();
    const chooser = await fileChooserPromise;
    await chooser.setFiles({
      name: fileName,
      mimeType: "text/csv",
      buffer: Buffer.from(content, "utf-8"),
    });
  }

  /** カテゴリCSV登録画面の主要UI部品が仕様どおり表示されること。 */
  async seeUploadForm() {
    await expect(this.fileSelectButton).toBeVisible();
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
