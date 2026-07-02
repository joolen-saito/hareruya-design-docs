import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 商品管理「セール用価格変更CSV登録」Page Object（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m03_31_admin_product_product_sale_price_csv_import_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-31_admin_product_product_sale_price_csv_import.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約(NotBlank/maxSize)は期待値に流用しない。
 * 取込後の dtb_product_class / dtb_product_tag / dtb_price_history の原値照合・支店連携通知は手動/間接（ブラウザ観測外）。
 * 自動化はアップロード発火・取込結果フラッシュ・取込中止エラー・画面表示・雛形ダウンロード発火に限る。
 *
 * セレクタは Twig＋Symfony Form `CsvImportType` の getBlockPrefix=`admin_csv_import`
 * （src/Eccube/Form/Type/Admin/CsvImportType.php:80-83）由来の位置情報のみ。
 * DOM/文言根拠（src/Eccube/Resource/template/admin/Product/base_csv_upload.twig を csv_product_price.twig が継承）:
 *  - フォーム: form#upload-form（base_csv_upload.twig:53 method=post action=url('admin_product_product_price_import') enctype=multipart）
 *  - ファイル入力: #admin_csv_import_import_file（base_csv_upload.twig:65 / blockPrefix=admin_csv_import + import_file。class custom-file-input）
 *  - アップロードボタン: #upload-button（base_csv_upload.twig:73 trans admin.common.csv_upload=「CSVファイルをアップロード」messages.ja.yaml:1547）
 *  - 雛形ダウンロード: a#download-template-button（base_csv_upload.twig:83 trans admin.common.csv_skeleton_download=「雛形ファイルダウンロード」messages.ja.yaml:1548）
 *  - カード見出し(取込): h4.card-title = csv_box_title = admin.product.product_price_csv_upload_title=「セール用価格変更CSV」（base_csv_upload.twig:58 / ProductPriceCsvController.php:100 / messages.ja.yaml:1800）
 *  - フォーマット表見出し: csv_format_title = admin.product.product_price_csv_format_title=「セール用価格変更CSVファイルフォーマット」（base_csv_upload.twig:82 / messages.ja.yaml:1801）
 *  - 必須バッジ: span.badge.bg-primary + trans admin.common.required=「必須」（base_csv_upload.twig:99-102）
 *    ※仕様の必須列は 商品ID/言語(ID)/販売価格/買取価格 の4列（m03-31_..._csv_import.md:117-121）。
 *      セールフラグは任意（同:121）。実装 getRequiredCsvHeader は5列でバッジ描画＝設計乖離（不具合候補#7）。
 *  - 取込履歴: h4.card-title = admin.product.csv_import_history_title=「CSVインポート履歴」（csv_import_history.twig:6 / messages.ja.yaml:1788）
 *  - フラッシュ(成功): .alert-success（alert.twig:22 app.flashes('eccube.admin.success')。include は default_frame.twig:200）
 *  - フラッシュ(エラー): .alert-danger（alert.twig:32/42 app.flashes('eccube.admin.danger'/'eccube.admin.error')）
 *
 * ルート（ProductPriceCsvController.php）:
 *  - admin_product_product_price_csv_upload = GET /<route>/product/product_price/product_price_csv_upload（:75）
 *  - admin_product_product_price_import     = POST /<route>/product/product_price/import（:119。upload-form の送信先）
 *  - admin_product_product_price_csv_template = GET /<route>/product/product_price/csv_template（:58 → product_price_template.csv）
 *  ※設計書(pf-eccube3)のパス /product/product_price_csv_upload とは異なる（不具合候補/要確認）。
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductSalePriceCsvImportPage {
  readonly page: Page;
  readonly url: string;

  readonly uploadForm: Locator; // form#upload-form（base_csv_upload.twig:53）
  readonly fileInput: Locator; // #admin_csv_import_import_file（base_csv_upload.twig:65）
  readonly uploadButton: Locator; // #upload-button（base_csv_upload.twig:73）
  readonly downloadButton: Locator; // a#download-template-button（base_csv_upload.twig:83）
  readonly requiredBadges: Locator; // span.badge.bg-primary（base_csv_upload.twig:101）
  readonly successAlert: Locator; // .alert-success（alert.twig:22）
  readonly errorAlert: Locator; // .alert-danger（alert.twig:32/42）
  readonly historyRows: Locator; // 取込履歴テーブルのデータ行（csv_import_history.twig:30-35。th「ファイル名」を持つ表に限定）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product/product_price/product_price_csv_upload`;

    this.uploadForm = page.locator("#upload-form");
    this.fileInput = page.locator("#admin_csv_import_import_file");
    this.uploadButton = page.locator("#upload-button");
    this.downloadButton = page.locator("#download-template-button");
    this.requiredBadges = page.locator("span.badge.bg-primary");
    this.successAlert = page.locator(".alert-success");
    this.errorAlert = page.locator(".alert-danger");
    // 取込履歴テーブルは見出しセル「ファイル名」を持つ表（フォーマット表と区別）。tbody 行の件数で記録有無を判定する。
    this.historyRows = page.locator(
      "table:has(th:has-text('ファイル名')) tbody tr"
    );
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /**
   * CSV をその場で生成して取込む（ファイル入力に setInputFiles → アップロードボタン押下）。
   * 列順はフォーマット表定義（商品ID,言語(ID),販売価格,買取価格,セールフラグ,帯URL,タグ(ID)）。
   * 取込中止（行検証エラー等）はトランザクションロールバックされ非破壊。
   */
  async uploadCsv(fileName: string, content: string) {
    await this.fileInput.setInputFiles({
      name: fileName,
      mimeType: "text/csv",
      buffer: Buffer.from(content, "utf-8"),
    });
    await this.uploadButton.click();
  }

  /** ファイル未選択のまま送信（必須バリデーション確認用）。 */
  async submitWithoutFile() {
    await this.uploadButton.click();
  }

  /** アップロード画面の主要UI部品が仕様どおり表示されること（見出し・ファイル選択・アップロードボタン）。 */
  async seeUploadForm() {
    await expect(this.page.getByText("セール用価格変更CSV").first()).toBeVisible(); // 取込カード見出し
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
