import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 商品管理「高額商品価格変更CSV登録」Page Object（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m03_32_admin_product_product_simple_high_price_csv_import_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-32_admin_product_product_simple_high_price_csv_import.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約(NotBlank/maxSize)は期待値に流用しない。取込後の dtb_product_class 原値照合は手動/間接。
 * 自動化はアップロード発火・取込結果フラッシュ・バリデーションエラー・画面表示・雛形ダウンロード発火・履歴件数プルダウン遷移に限る。
 *
 * セレクタは Twig＋Symfony Form `CsvImportType` の getBlockPrefix=`admin_csv_import`（Form/Type/Admin/CsvImportType.php:79-82）由来の位置情報のみ。
 * DOM/文言根拠:
 *  - フォーム: form#upload-form（base_csv_upload.twig:53 method=post action=url(form_action_route=admin_product_simple_high_price_import) enctype=multipart）
 *  - ファイル入力: #admin_csv_import_import_file（base_csv_upload.twig:65 form_widget(form.import_file) class=custom-file-input / blockPrefix admin_csv_import + import_file）
 *  - アップロードボタン: #upload-button（base_csv_upload.twig:73 trans admin.common.csv_upload=「CSVファイルをアップロード」messages:1547）
 *  - 雛形ダウンロード: a#download-template-button（base_csv_upload.twig:83 url(admin_product_simple_high_price_csv_template) trans admin.common.csv_skeleton_download=「雛形ファイルダウンロード」messages:1548）
 *  - ボックス見出し: h4.card-title csv_box_title=admin.product.simple_high_price_csv_upload_title=「高額商品価格変更CSV」（base_csv_upload.twig:58 / messages:1805 / Controller:92）
 *  - フォーマット表見出し: csv_format_title=admin.product.simple_high_price_csv_format_title=「高額商品価格変更CSVファイルフォーマット」（base_csv_upload.twig:82 / messages:1806 / Controller:93）
 *  - フォーマット表: th 項目名/説明（base_csv_upload.twig:87-109）。行は headers(商品コード,基準価格)＋必須バッジ span.badge trans admin.common.required=「必須」（base_csv_upload.twig:101 / messages:1528 / Controller:91 csv_required_header_keys＝両列必須）
 *  - サブタイトル: admin.product.simple_high_price_csv=「高額商品価格変更CSVアップロード」（csv_product_simple_high_price.twig:5 / messages:1804）
 *  - タイトルblock: admin.product.product_management=「商品管理」（base_csv_upload.twig:3 / messages:1723）
 *  - 取込履歴: #page_count_pulldown（csv_import_history.twig select。option value=path(history_page_route,{page_no,page_count})）／履歴テーブル（ファイル名・アップロード日時 Y-m-d H:i・作業者）
 *  - フラッシュ: .alert-success（alert.twig:22 eccube.admin.success ← addSuccess admin）／.alert-danger（alert.twig:42 eccube.admin.error ← addError admin）／.alert-warning（alert.twig:52 eccube.admin.warning ← addWarning admin）
 *
 * ルート: admin_product_simple_high_price_csv_upload = GET /<route>/product/simple_high_price/csv_upload（Controller:67）
 *         admin_product_simple_high_price_import = POST /<route>/product/simple_high_price/import（Controller:112、処理後は常に csv_upload へ redirect:176）
 *         admin_product_simple_high_price_csv_template = GET /<route>/product/simple_high_price/csv_template → simple_high_price_template.csv（Controller:50-57）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductSimpleHighPriceCsvImportPage {
  readonly page: Page;
  readonly url: string;

  readonly fileInput: Locator; // #admin_csv_import_import_file（setInputFiles で投入）
  readonly uploadButton: Locator; // #upload-button（CSVファイルをアップロード）
  readonly downloadButton: Locator; // a#download-template-button（雛形ダウンロード）
  readonly uploadForm: Locator; // form#upload-form
  readonly boxTitle: Locator; // h4.card-title（高額商品価格変更CSV）
  readonly formatCard: Locator; // フォーマット表カード（#download-template-button を内包する .card / base_csv_upload.twig:80-112）
  readonly requiredBadges: Locator; // フォーマット表内の必須バッジ（base_csv_upload.twig:101 span.badge）
  readonly pageCountPulldown: Locator; // #page_count_pulldown（履歴件数）
  readonly flashError: Locator; // .alert-danger（取込/フォームエラー）
  readonly flashSuccess: Locator; // .alert-success（登録完了）
  readonly flashWarning: Locator; // .alert-warning（info/警告：セール中の基準価格のみ更新 等）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product/simple_high_price/csv_upload`;

    this.fileInput = page.locator("#admin_csv_import_import_file");
    this.uploadButton = page.locator("#upload-button");
    this.downloadButton = page.locator("#download-template-button");
    this.uploadForm = page.locator("#upload-form");
    this.boxTitle = page.locator(".card-title");
    // 必須バッジはフォーマット表カードに限定（画面全体の .badge ＝ナビ等の混入を排除）。
    // フォーマット表カードは #download-template-button を内包する .card（base_csv_upload.twig:80-112、バッジは:101）。
    this.formatCard = page.locator(".card").filter({ has: page.locator("#download-template-button") });
    this.requiredBadges = this.formatCard.locator(".badge");
    this.pageCountPulldown = page.locator("#page_count_pulldown");
    this.flashError = page.locator(".alert-danger");
    this.flashSuccess = page.locator(".alert-success");
    this.flashWarning = page.locator(".alert-warning");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /**
   * CSV をその場で生成して取込む（ファイル入力に setInputFiles → アップロードボタン押下）。
   * 既定ヘッダ列順は getCsvHeader（商品コード,基準価格）。Controller:184-190。
   */
  async uploadCsv(fileName: string, content: string) {
    await this.fileInput.setInputFiles({
      name: fileName,
      mimeType: "text/csv",
      buffer: Buffer.from(content, "utf-8"),
    });
    await this.uploadButton.click();
  }

  /** ファイル未選択のまま送信する（必須/フォーム不正の観測用）。 */
  async submitWithoutFile() {
    await this.uploadButton.click();
  }

  /**
   * フォームの隠しCSRFトークンを改ざんしてから CSV を送信する（CSRF検証失敗→フォーム不正の観測用）。
   * トークンは Symfony Form `CsvImportType`（blockPrefix admin_csv_import）の隠し input（name 末尾 [_token]）。
   * 具体セレクタは要実機確認のため form 内の hidden input（[_token]）を name 末尾一致で特定する。
   */
  async tamperCsrfAndUpload(fileName: string, content: string) {
    await this.fileInput.setInputFiles({
      name: fileName,
      mimeType: "text/csv",
      buffer: Buffer.from(content, "utf-8"),
    });
    const token = this.uploadForm.locator('input[type="hidden"][name$="[_token]"]').first();
    await token.evaluate((el) => {
      (el as HTMLInputElement).value = "invalid-csrf-token";
    });
    await this.uploadButton.click();
  }

  /** ファイル入力の accept 属性を返す（許容形式 .csv/.tsv の観測用）。 */
  async fileAcceptAttr(): Promise<string | null> {
    return this.fileInput.getAttribute("accept");
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
