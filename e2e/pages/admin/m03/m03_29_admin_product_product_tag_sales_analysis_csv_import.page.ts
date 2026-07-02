import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 商品管理「売上分析タグ更新CSVアップロード」Page Object（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m03_29_admin_product_product_tag_sales_analysis_csv_import_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-29_admin_product_product_tag_sales_analysis_csv_import.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約(NotBlank/maxSize)は期待値に流用しない。
 * 取込後の dtb_product_tag_sales_analysis 原値照合・履歴件数の厳密値は手動/間接。
 * 自動化はアップロード発火・取込結果フラッシュ・事前検証エラー・画面表示・雛形ダウンロード発火・履歴件数切替に限る。
 *
 * セレクタは Twig＋Symfony Form `CsvImportType` の getBlockPrefix=`admin_csv_import`（Form/Type/Admin/CsvImportType.php:78-81）由来の位置情報のみ。
 * DOM/文言根拠:
 *  - 共通テンプレート src/Eccube/Resource/template/admin/Product/base_csv_upload.twig
 *    - フォーム form#upload-form（:53 method=post action=url('admin_product_tag_sales_analysis_import') enctype=multipart）
 *    - ファイル入力 #admin_csv_import_import_file（:65 form.import_file class=custom-file-input accept=block import_file_accept / blockPrefix admin_csv_import + import_file）
 *    - ファイル名ラベル .custom-file-label（:27 JS でファイル名を表示。bootstrap_4 custom-file ウィジェット由来）
 *    - 送信ボタン #upload-button（:73 trans admin.common.csv_upload=「CSVファイルをアップロード」messages:1547）
 *    - アップロードカード見出し csv_box_title=admin.product.tag_sales_analysis_csv_upload_title=「売上分析タグ更新CSV」（:58 / messages:1840）
 *    - フォーマットカード見出し csv_format_title=admin.product.tag_sales_analysis_csv_format_title=「売上分析タグ更新CSVファイルフォーマット」（:82 / messages:1841）
 *    - 雛形DL #download-template-button（:83 trans admin.common.csv_skeleton_download=「雛形ファイルダウンロード」messages:1548）
 *    - フォーマット表 必須バッジ .badge + trans admin.common.required=「必須」（:101 / messages:1528。必須キーは「商品ID」のみ Controller getRequiredCsvHeader:192-197）
 *  - csv_tag_sales_analysis.twig: sub_title=admin.product.tag_sales_analysis_csv=「売上分析タグ更新CSVアップロード」（:5 / messages:1839）
 *  - csv_import_history.twig: 履歴見出し admin.product.csv_import_history_title=「CSVインポート履歴」（:6 / messages:1788） / 件数プルダウン #page_count_pulldown（:10）
 *  - フラッシュ alert.twig: 成功 .alert-success（:22） / エラー .alert-danger（:32,:42）
 *
 * ルート（TagSalesAnalysisCsvController.php）:
 *  - admin_product_tag_sales_analysis_csv_upload = GET /<route>/product/tag_sales_analysis/csv_upload（:67）
 *  - admin_product_tag_sales_analysis_import = POST /<route>/product/tag_sales_analysis/import（:110。成否問わず csv_upload へ 302）
 *  - admin_product_tag_sales_analysis_csv_template = GET /<route>/product/tag_sales_analysis/csv_template（:50 → product_tag_sales_analysis_template.csv）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductTagSalesAnalysisCsvImportPage {
  readonly page: Page;
  readonly url: string;

  readonly fileInput: Locator; // #admin_csv_import_import_file（custom-file-input。setInputFiles で投入）
  readonly fileNameLabel: Locator; // .custom-file-label（選択後にファイル名を表示）
  readonly uploadButton: Locator; // #upload-button（CSVファイルをアップロード）
  readonly downloadButton: Locator; // #download-template-button（雛形DL a）
  readonly uploadForm: Locator; // form#upload-form
  readonly inlineErrors: Locator; // .text-danger（form_errors(form.import_file) inline）
  readonly flashSuccess: Locator; // .alert-success（成功フラッシュ）
  readonly flashError: Locator; // .alert-danger（エラーフラッシュ）
  readonly uploadCardTitle: Locator; // アップロードカード見出し
  readonly formatCardTitle: Locator; // フォーマットカード見出し
  readonly historyTitle: Locator; // 取込履歴カード見出し
  readonly pageCountPulldown: Locator; // #page_count_pulldown（履歴件数プルダウン）
  readonly requiredBadges: Locator; // フォーマット表の必須バッジ
  readonly historyRows: Locator; // 取込履歴テーブルのデータ行（csv_import_history.twig:21,29,31）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product/tag_sales_analysis/csv_upload`;

    this.fileInput = page.locator("#admin_csv_import_import_file");
    this.fileNameLabel = page.locator(".custom-file-label");
    this.uploadButton = page.locator("#upload-button");
    this.downloadButton = page.locator("#download-template-button");
    this.uploadForm = page.locator("#upload-form");
    this.inlineErrors = page.locator(".text-danger");
    this.flashSuccess = page.locator(".alert-success");
    this.flashError = page.locator(".alert-danger");
    this.uploadCardTitle = page.locator(".card-title");
    this.formatCardTitle = page.locator(".card-title");
    this.historyTitle = page.locator(".card-title");
    this.pageCountPulldown = page.locator("#page_count_pulldown");
    this.requiredBadges = page.locator(".badge");
    // 取込履歴のデータ行（成功時のみ INSERT される履歴一覧。失敗時に件数が増えないことの観測用）。
    this.historyRows = page.locator(".table-striped tbody tr");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 履歴件数を指定して表示（page_no=1 固定。許容外の値はサーバ側で既定へ丸められる）。 */
  async gotoWithPageCount(pageCount: number) {
    await this.page.goto(`${this.url}?page_no=1&page_count=${pageCount}`);
  }

  /**
   * CSV をその場で生成して取込む（#admin_csv_import_import_file に setInputFiles → 送信）。
   * ヘッダ既定列順は getCsvHeader（商品ID, 売上分析タグ(ID)）。Controller TagSalesAnalysisCsvController.php:179-185。
   */
  async uploadCsv(fileName: string, content: string) {
    await this.fileInput.setInputFiles({
      name: fileName,
      mimeType: "text/csv",
      buffer: Buffer.from(content, "utf-8"),
    });
    await this.uploadButton.click();
  }

  /** ファイル選択のみ（送信しない。ファイル名ラベル表示の確認用）。 */
  async selectFile(fileName: string, content = "商品ID,売上分析タグ(ID)\n") {
    await this.fileInput.setInputFiles({
      name: fileName,
      mimeType: "text/csv",
      buffer: Buffer.from(content, "utf-8"),
    });
  }

  /** アップロード画面の主要UI部品が仕様どおり表示されること。 */
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
