import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 商品管理「部門更新CSV登録」Page Object（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m03_35_admin_product_product_section_csv_import_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-35_admin_product_product_section_csv_import.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約(NotBlank/maxSize)は期待値に流用しない。
 * 取込後の dtb_product_class.section_id 一括更新・dtb_csv_import_history 追記は画面から直接観測できないため間接/手動。
 * 自動化はアップロード発火・取込結果フラッシュ・バリデーションエラー・画面表示・雛形ダウンロード発火に限る。
 *
 * セレクタは Twig＋Symfony Form `CsvImportType` の getBlockPrefix=`admin_csv_import`（Form/Type/Admin/CsvImportType.php:80-83）由来の位置情報のみ。
 * DOM/文言根拠（src/Eccube/Resource/template/admin/Product/）:
 *  - 画面: csv_product_section.twig は base_csv_upload.twig を継承（csv_product_section.twig:1）
 *  - フォーム: form#upload-form（base_csv_upload.twig:53 method=post action=url('admin_product_section_import') enctype=multipart）
 *  - ファイル入力: #admin_csv_import_import_file（base_csv_upload.twig:65 / blockPrefix admin_csv_import + import_file・CsvImportType.php:48,80-83。accept=.csv,text/csv,.tsv,text/tsv twig:20）
 *  - アップロードボタン: #upload-button trans admin.common.csv_upload=「CSVファイルをアップロード」(base_csv_upload.twig:73 / messages.ja.yaml:1547)
 *  - 雛形DL: a#download-template-button trans admin.common.csv_skeleton_download=「雛形ファイルダウンロード」(base_csv_upload.twig:83 / messages.ja.yaml:1548)
 *  - フォーマット表 必須バッジ: .badge.bg-primary + trans admin.common.required=「必須」(base_csv_upload.twig:101 / messages.ja.yaml:1528)。必須列=商品コード(getRequiredCsvHeader ProductSectionCsvController.php:194-199)
 *  - 履歴カード: trans admin.product.csv_import_history_title=「CSVインポート履歴」(csv_import_history.twig:6 / messages.ja.yaml:1788)
 *  - 件数プルダウン: #page_count_pulldown（csv_import_history.twig:10、option文言 admin.common.count=「%count%件」:12 / messages.ja.yaml:1536）
 *  - フラッシュ: 成功 .alert-success trans admin.register.complete=「登録が完了しました。」(alert.twig:21 / messages.ja.yaml:1773)／エラー .alert-danger(alert.twig:31-48)
 *  - 雛形ファイル名: product_section_update.csv（ProductSectionCsvController.php:58）
 *
 * ルート（ProductSectionCsvController.php）:
 *  - GET  /<route>/product/section/csv_upload   = admin_product_section_csv_upload（:69）
 *  - POST /<route>/product/section/import        = admin_product_section_import（:112）
 *  - GET  /<route>/product/section/csv_template  = admin_product_section_csv_template（:52）
 *
 * 不具合候補#1（付帯表4）: 設計書の機能名「部門更新CSV登録」に対し、刷新先の表示文言は
 *  admin.product.product_section_csv=「部門登録CSVアップロード」（messages.ja.yaml:1819）と乖離。
 *  画面表示確認は見出し文言の完全一致ではなく構造要素（ファイル入力/ボタン/履歴）で行う。
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductSectionCsvImportPage {
  readonly page: Page;
  readonly url: string; // 部門更新CSVアップロード画面
  readonly templateUrl: string; // 雛形DL（GET csv_template）= 未認証ガード確認にも使用
  readonly uploadRoute: RegExp; // 取込後リダイレクト先（csv_upload）

  readonly uploadForm: Locator; // form#upload-form（base_csv_upload.twig:53）
  readonly fileInput: Locator; // #admin_csv_import_import_file（base_csv_upload.twig:65）
  readonly uploadButton: Locator; // #upload-button（base_csv_upload.twig:73）
  readonly downloadTemplateButton: Locator; // a#download-template-button（base_csv_upload.twig:83）
  readonly requiredBadge: Locator; // .badge.bg-primary「必須」（base_csv_upload.twig:101）
  readonly historyTitle: Locator; // 「CSVインポート履歴」（csv_import_history.twig:6）
  readonly pageCountPulldown: Locator; // #page_count_pulldown（csv_import_history.twig:10）
  readonly successAlert: Locator; // .alert-success（alert.twig:21）
  readonly errorAlert: Locator; // .alert-danger（alert.twig:31-48）
  readonly modalDialog: Locator; // 送信前確認モーダル（仕様: 無し。base_csv_upload.twig に .modal.show 無し）
  readonly fileNameLabel: Locator; // ファイル選択後にファイル名を表示するカスタムラベル（custom-file-label・要実機確認）
  readonly loginId: Locator; // 未認証ガード時の管理ログインID欄（login.twig:26）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product/section/csv_upload`;
    this.templateUrl = `/${ECCUBE_ADMIN_ROUTE}/product/section/csv_template`;
    this.uploadRoute = new RegExp(`/${ECCUBE_ADMIN_ROUTE}/product/section/csv_upload(\\?|$)`);

    this.uploadForm = page.locator("#upload-form");
    this.fileInput = page.locator("#admin_csv_import_import_file");
    this.uploadButton = page.locator("#upload-button");
    this.downloadTemplateButton = page.locator("#download-template-button");
    this.requiredBadge = page.locator(".badge.bg-primary");
    this.historyTitle = page.getByText("CSVインポート履歴");
    this.pageCountPulldown = page.locator("#page_count_pulldown");
    // 取込検証エラーは inline ではなくフラッシュ（不具合候補#2）。成功/エラーはフラッシュ alert で出る。
    this.successAlert = page.locator(".alert-success");
    this.errorAlert = page.locator(".alert-danger");
    // 送信前確認モーダルは仕様上存在しない（フロント挙動: モーダル・ポップアップなし）。表示中モーダルを否定するための観測点。
    this.modalDialog = page.locator(".modal.show");
    // ファイル名表示ラベル（Bootstrap custom-file-label 想定。DOM id/クラスは要実機確認）。
    this.fileNameLabel = page.locator(".custom-file-label");
    this.loginId = page.locator("#login_id");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 履歴の表示件数を許容リスト内のクエリで指定して開く（page_count 反映確認用）。 */
  async gotoWithPageCount(pageCount: number, pageNo = 1) {
    await this.page.goto(`${this.url}?page_count=${pageCount}&page_no=${pageNo}`);
  }

  /** CSV をその場で生成して取込む（ファイル入力に setInputFiles → アップロードボタン押下）。 */
  async uploadCsv(content: string, filename = "e2e_section.csv") {
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

  /** ファイル選択だけ行う（送信しない）。ファイル名ラベル表示の観測用。 */
  async selectFile(content: string, filename = "e2e_section.csv") {
    await this.fileInput.setInputFiles({
      name: filename,
      mimeType: "text/csv",
      buffer: Buffer.from(content, "utf-8"),
    });
  }

  /** 雛形ダウンロードを発火し Download を返す（ファイル名検証用。内容は手動確認）。 */
  async downloadTemplate(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.downloadTemplateButton.click(),
    ]);
    return download;
  }

  /** アップロード画面の主要UI部品が仕様どおり表示されること。 */
  async seeUploadForm() {
    await expect(this.fileInput).toBeVisible();
    await expect(this.uploadButton).toBeVisible();
    await expect(this.downloadTemplateButton).toBeVisible();
  }
}
