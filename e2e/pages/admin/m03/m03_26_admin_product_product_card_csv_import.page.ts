import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 商品管理「カード商品CSV登録」Page Object。
 * 納品ケース表 integration_test/e2e/m03_26_admin_product_product_card_csv_import_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-26_admin_product_product_card_csv_import.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約(NotBlank/eccube_csv_size)は期待値に流用しない。
 * 画面タイプ csv_import: アップロード発火・取込結果フラッシュ・事前検証エラー・雛形ダウンロード発火/ファイル名・
 * 履歴一覧の表示/ページサイズ変更を自動化対象とし、取込後のDB値（商品・規格・カテゴリ・在庫・価格履歴）や
 * temp一時ファイルの移動/削除・ログ出力はブラウザ観測外のため手動/対象外（ケース表 付帯表2/2b参照）。
 *
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_csv_import`（CsvImportType.php:80-83）由来の位置情報のみ:
 *  - import_file → #admin_csv_import_import_file（base_csv_upload.twig:65 form_widget(form.import_file)）
 *  - アップロードフォーム → #upload-form（base_csv_upload.twig:53）
 *  - アップロードボタン → #upload-button（base_csv_upload.twig:73 / trans admin.common.csv_upload=「CSVファイルをアップロード」messages.ja.yaml:1547）
 *  - 雛形ダウンロード → #download-template-button（base_csv_upload.twig:83 / trans admin.common.csv_skeleton_download=「雛形ファイルダウンロード」messages.ja.yaml:1548）
 *  - フォーマット表 見出し →「項目名」「説明」（base_csv_upload.twig:90-91 / messages.ja.yaml:1550,1551）
 *  - 必須バッジ → .badge（base_csv_upload.twig:101 / trans admin.common.required=「必須」messages.ja.yaml:1528）
 *  - 取込履歴 件数プルダウン → #page_count_pulldown（csv_import_history.twig:10）
 *  - 取込履歴 見出し →「ファイル名」「アップロード日時」「作業者」（csv_import_history.twig:24-26 / messages.ja.yaml:1789-1791）
 *  - フラッシュ → .alert-success / .alert-danger（alert.twig:21-49。addSuccess/addError由来）
 *
 * ルート（CardCsvController.php）:
 *  - GET アップロード画面 admin_product_card_csv_import = /<route>/product/product_card_csv_upload（:83）
 *  - POST 取込 admin_product_card_csv_upload = /<route>/product/product_card_csv_upload（:127）
 *  - GET 雛形 admin_product_card_csv_template = /<route>/product/product_card/csv_template → product_card.csv（:70）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductCardCsvImportPage {
  readonly page: Page;
  readonly uploadUrl: string; // GET アップロード画面（POST取込も同パス・別ルート）
  readonly templateUrl: string; // GET 雛形ダウンロード

  readonly fileInput: Locator; // #admin_csv_import_import_file（base_csv_upload.twig:65）
  readonly uploadForm: Locator; // #upload-form（base_csv_upload.twig:53）
  readonly uploadButton: Locator; // #upload-button（base_csv_upload.twig:73 / csv_upload）
  readonly downloadTemplateLink: Locator; // #download-template-button（base_csv_upload.twig:83）
  readonly fileLabel: Locator; // .custom-file-label（要素はSymfonyフォームテーマ生成・base_csv_upload.twig:27 JS が next('.custom-file-label') にファイル名表示。要実機確認）
  readonly requiredBadge: Locator; // .badge「必須」（base_csv_upload.twig:101）
  readonly historyTitle: Locator; // card-title「CSVインポート履歴」（csv_import_history.twig:6）
  readonly pageCountPulldown: Locator; // #page_count_pulldown（csv_import_history.twig:10）
  readonly successAlert: Locator; // .alert-success（alert.twig:22）
  readonly errorAlert: Locator; // .alert-danger（alert.twig:32,42）
  readonly historyRows: Locator; // 履歴テーブルのデータ行（件数の間接確認用）

  constructor(page: Page) {
    this.page = page;
    this.uploadUrl = `/${ECCUBE_ADMIN_ROUTE}/product/product_card_csv_upload`;
    this.templateUrl = `/${ECCUBE_ADMIN_ROUTE}/product/product_card/csv_template`;

    this.fileInput = page.locator("#admin_csv_import_import_file");
    this.uploadForm = page.locator("#upload-form");
    this.uploadButton = page.locator("#upload-button");
    this.downloadTemplateLink = page.locator("#download-template-button");
    this.fileLabel = page.locator(".custom-file-label");
    this.requiredBadge = page.locator(".badge", { hasText: "必須" });
    this.historyTitle = page.getByText("CSVインポート履歴");
    this.pageCountPulldown = page.locator("#page_count_pulldown");
    this.successAlert = page.locator(".alert-success");
    this.errorAlert = page.locator(".alert-danger");
    // 履歴テーブルのデータ行。フォーマット説明表も同じ .table-responsive table 構造のため、
    // 件数プルダウン(#page_count_pulldown)を内包する履歴カードに限定する（csv_import_history.twig）。
    // さらに空時の no_result 行（td[colspan]）を除外し、純粋な履歴データ行数のみを数える
    // （履歴+1の検出を空行で相殺させないため）。
    const historyCard = page.locator(".card", { has: page.locator("#page_count_pulldown") });
    this.historyRows = historyCard
      .locator("tbody tr")
      .filter({ hasNot: page.locator("td[colspan]") });
  }

  async gotoUpload() {
    await this.page.goto(this.uploadUrl);
  }

  /** ファイル入力にローカルCSVをセットする（送信はしない）。 */
  async selectFile(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
  }

  /** バッファ内容のCSVを擬似ファイルとしてセットする（in-test生成の不正CSV等）。 */
  async selectFileBuffer(name: string, content: string | Buffer) {
    await this.fileInput.setInputFiles({
      name,
      mimeType: "text/csv",
      buffer: typeof content === "string" ? Buffer.from(content) : content,
    });
  }

  /** アップロードボタンを押下して送信する。 */
  async submit() {
    await this.uploadButton.click();
  }

  /** CSVファイルを選択して送信する。 */
  async uploadFile(filePath: string) {
    await this.selectFile(filePath);
    await this.submit();
  }

  /** ファイル未選択のまま送信する（必須エラー経路）。 */
  async submitWithoutFile() {
    await this.submit();
  }

  /** 雛形ダウンロードを押下し、ダウンロード発火を待って Download を返す。 */
  async downloadTemplate(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.downloadTemplateLink.click(),
    ]);
    return download;
  }

  /** 履歴の表示件数プルダウンを変更する（window.location.href 差し替え＝遷移）。 */
  async changePageCount(count: number) {
    await this.pageCountPulldown.selectOption({ label: this.countLabel(count) });
  }

  /** csv_import_history.twig:12 の option ラベル trans admin.common.count（%count%件）を組み立てる。 */
  private countLabel(count: number): string {
    return `${count}件`;
  }

  /** アップロード画面の主要UI部品が仕様どおり表示されること。 */
  async seeUploadForm() {
    await expect(this.fileInput).toBeVisible();
    await expect(this.uploadButton).toBeVisible();
  }

  /** フォーマット説明表（項目名/説明の見出し）が表示されること。 */
  async seeFormatTable() {
    await expect(this.page.getByRole("columnheader", { name: "項目名" })).toBeVisible();
    await expect(this.page.getByRole("columnheader", { name: "説明" })).toBeVisible();
  }

  /** 取込履歴テーブル（ファイル名/アップロード日時/作業者）が表示されること。 */
  async seeHistoryTable() {
    await expect(this.historyTitle).toBeVisible();
    await expect(this.page.getByRole("columnheader", { name: "ファイル名" })).toBeVisible();
    await expect(this.page.getByRole("columnheader", { name: "アップロード日時" })).toBeVisible();
    await expect(this.page.getByRole("columnheader", { name: "作業者" })).toBeVisible();
  }
}
