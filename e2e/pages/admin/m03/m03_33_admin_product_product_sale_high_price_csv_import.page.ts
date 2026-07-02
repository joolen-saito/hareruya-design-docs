import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 商品管理「セール用高額商品価格変更CSVアップロード」Page Object（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m03_33_admin_product_product_sale_high_price_csv_import_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-33_admin_product_product_sale_high_price_csv_import.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約(NotBlank/maxSize)・ColumnDefinitions の桁/必須は期待値に流用しない。
 * 取込後の dtb_product_class / dtb_price_history / dtb_csv_import_history の原値照合は手動/間接（ケース表参照）。
 * 自動化はアップロード発火・取込結果メッセージ・バリデーションエラー・画面表示・履歴ページング・雛形DL発火に限る。
 *
 * セレクタは Twig＋Symfony Form `CsvImportType` の getBlockPrefix=`admin_csv_import`（Form/Type/Admin/CsvImportType.php:80-82）由来の位置情報のみ。
 * DOM/文言根拠:
 *  - 画面 Twig: src/Eccube/Resource/template/admin/Product/csv_product_sale_high_price.twig（base_csv_upload.twig を継承）
 *  - フォーム: form#upload-form（base_csv_upload.twig:53 method=post action=url(form_action_route=admin_product_sale_high_price_import) enctype=multipart）
 *  - ファイル入力(hidden custom-file-input): #admin_csv_import_import_file（base_csv_upload.twig:65 / blockPrefix=admin_csv_import + import_file）
 *  - アップロードボタン: #upload-button trans admin.common.csv_upload=「CSVファイルをアップロード」（base_csv_upload.twig:73-74 / messages.ja.yaml:1547）
 *  - 雛形ダウンロード: a#download-template-button trans admin.common.csv_skeleton_download=「雛形ファイルダウンロード」（base_csv_upload.twig:83 / messages.ja.yaml:1548）
 *  - フォーマット表 必須バッジ: span.badge.bg-primary trans admin.common.required=「必須」（base_csv_upload.twig:101 / messages.ja.yaml）。必須列は仕様(functions md 列表)由来＝商品コード・販売価格・買取価格・セールフラグ・スマレジ連携フラグ（帯URL・タグ(ID)は任意）。※刷新先実装(getRequiredCsvHeader)は3列のみ＝不具合候補#1
 *  - 履歴件数プルダウン: select#page_count_pulldown（csv_import_history.twig:10、option value=path(history_page_route,{page_no,page_count})）
 *  - カード見出し: csv_box_title=admin.product.sale_high_price_csv_upload_title=「セール用高額商品価格変更CSV」（messages.ja.yaml:1813）
 *  - フラッシュ: 成功 .alert.alert-success（alert.twig:22）/ エラー .alert.alert-danger（alert.twig:32,42）/ 警告(info) .alert.alert-warning（alert.twig:52）
 *    ※ controller の addSuccess/addError/addWarming(namespace 'admin') が eccube.admin.success/error/warning フラッシュへ積まれ default_frame.twig:200 で include される。
 *
 * ルート: admin_product_sale_high_price_csv_upload = GET /<route>/product/sale_high_price/csv_upload（Controller.php:65-66）
 *         admin_product_sale_high_price_import     = POST /<route>/product/sale_high_price/import（Controller.php:104-105、終了後 csv_upload へ常にリダイレクト）
 *         admin_product_sale_high_price_csv_template= GET /<route>/product/sale_high_price/csv_template（Controller.php:52-53 → sale_high_price_template.csv）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductSaleHighPriceCsvImportPage {
  readonly page: Page;
  readonly url: string;

  readonly uploadForm: Locator; // form#upload-form
  readonly fileInput: Locator; // #admin_csv_import_import_file（hidden。setInputFiles で投入）
  readonly uploadButton: Locator; // #upload-button（CSVファイルをアップロード）
  readonly downloadButton: Locator; // a#download-template-button（雛形ダウンロード）
  readonly pageCountSelect: Locator; // #page_count_pulldown（履歴件数プルダウン）
  readonly requiredBadges: Locator; // フォーマット表の必須バッジ
  readonly errorAlert: Locator; // .alert.alert-danger（取込/フォームエラーのフラッシュ）
  readonly successAlert: Locator; // .alert.alert-success（成功フラッシュ）
  readonly warningAlert: Locator; // .alert.alert-warning（info/警告フラッシュ）
  readonly cardTitle: Locator; // .card-title（CSVアップロード見出し等）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product/sale_high_price/csv_upload`;

    this.uploadForm = page.locator("#upload-form");
    this.fileInput = page.locator("#admin_csv_import_import_file");
    this.uploadButton = page.locator("#upload-button");
    this.downloadButton = page.locator("#download-template-button");
    this.pageCountSelect = page.locator("#page_count_pulldown");
    this.requiredBadges = page.locator(".badge.bg-primary");
    this.errorAlert = page.locator(".alert.alert-danger");
    this.successAlert = page.locator(".alert.alert-success");
    this.warningAlert = page.locator(".alert.alert-warning");
    this.cardTitle = page.locator(".card-title");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /**
   * CSV をその場で生成して取込む（hidden 入力に setInputFiles → アップロードボタン押下）。
   * 有効ヘッダ列順は仕様(functions md 列表)由来の7列＝商品コード,販売価格,買取価格,セールフラグ,帯URL,タグ(ID),スマレジ連携フラグ。
   * ※刷新先実装の getCsvHeader は5列のみ（買取価格・スマレジ連携フラグ欠落）＝不具合候補#1。期待ヘッダは実装に寄せず仕様で固定する。
   */
  async uploadCsv(fileName: string, content: string, mimeType = "text/csv") {
    await this.fileInput.setInputFiles({
      name: fileName,
      mimeType,
      buffer: Buffer.from(content, "utf-8"),
    });
    await this.uploadButton.click();
  }

  /** ファイル未選択のまま送信する（必須バリデーション確認用）。 */
  async submitWithoutFile() {
    await this.uploadButton.click();
  }

  /** アップロード画面の主要UI部品が仕様どおり表示されること。 */
  async seeUploadForm() {
    await expect(this.fileInput).toBeAttached();
    await expect(this.uploadButton).toBeVisible();
    await expect(this.downloadButton).toBeVisible();
  }

  /** 履歴件数プルダウンを変更し、ナビゲーションを待つ（JS が window.location.href を差し替える）。 */
  async changePageCount(count: number) {
    const option = this.pageCountSelect.locator(`option`, {
      hasText: `${count}件`,
    });
    const value = await option.getAttribute("value");
    await Promise.all([
      this.page.waitForURL(/page_count=/),
      this.pageCountSelect.selectOption(value ?? ""),
    ]);
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
