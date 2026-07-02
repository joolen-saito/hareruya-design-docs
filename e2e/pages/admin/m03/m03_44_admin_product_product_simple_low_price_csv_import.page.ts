import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 商品管理「低価格帯カード価格変更CSV登録」Page Object（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m03_44_admin_product_product_simple_low_price_csv_import_e2e_cases.md に対応。
 *
 * 【重要】刷新先 ec-cube-enterprise に当該画面(Controller/Route/Twig/取込ハンドラ/MtbCsvImportType定数)が
 * 未実装である（ケース表 付帯表4 #1）。本Page Objectは「実装後に再利用する想定の雛形」であり、
 *  - URL/ルートは高額(m03_32)・基準価格 analog からの候補で、確定値は要実機確認（未実装）。
 *  - セレクタは高額(m03_32)と共有する base_csv_upload.twig ＋ CsvImportType の位置情報（実装後も共有見込みだが要確認）。
 * セレクタは創作せず、低価格帯専用の trans キー・CSV列ラベル・雛形ファイル名は `要実機確認`。
 *
 * 期待結果は仕様(基本設計「基準価格変更CSVアップロード/フォーマット」/ messages.ja.yaml)由来（オラクル独立性）。
 * 実装の現挙動・Form制約(NotBlank/maxSize)は期待値に流用しない。取込後の dtb_product_class 原値照合は手動/間接。
 *
 * セレクタは Twig＋Symfony Form `CsvImportType` の getBlockPrefix=`admin_csv_import`（Form/Type/Admin/CsvImportType.php:79-82）由来の位置情報のみ。
 * DOM/文言根拠（analog: 高額 m03_32 と同一の base_csv_upload.twig を使う想定）:
 *  - フォーム: form#upload-form（base_csv_upload.twig:53 method=post enctype=multipart action=url(form_action_route)）
 *  - ファイル入力: #admin_csv_import_import_file（base_csv_upload.twig:65 form_widget(form.import_file) class=custom-file-input / blockPrefix admin_csv_import + import_file）
 *  - アップロードボタン: #upload-button（base_csv_upload.twig:73 trans admin.common.csv_upload=「CSVファイルをアップロード」messages.ja.yaml:1547）
 *  - 雛形ダウンロード: a#download-template-button（base_csv_upload.twig:83 trans admin.common.csv_skeleton_download=「雛形ファイルダウンロード」messages.ja.yaml:1548）
 *  - ボックス見出し: h4.card-title csv_box_title（base_csv_upload.twig:58）※低価格帯専用 trans キー未実装=要実機確認
 *  - フォーマット表: th 項目名/説明（base_csv_upload.twig:87-109）＋必須バッジ span.badge trans admin.common.required=「必須」（base_csv_upload.twig:101 / messages.ja.yaml:1528）
 *  - 取込履歴: #page_count_pulldown（csv_import_history.twig:10 select。option value=path(history_page_route,{page_no,page_count})）／履歴テーブル（ファイル名・アップロード日時 Y-m-d H:i・作業者 csv_import_history.twig:30-35）
 *  - フラッシュ: .alert-success（alert.twig:22 eccube.admin.success ← addSuccess admin）／.alert-danger（alert.twig:42 eccube.admin.error ← addError admin）／.alert-warning（alert.twig:52 eccube.admin.warning ← addWarning admin：セール中アラート）
 *
 * ルート候補（要実機確認・未実装）: admin_product_simple_low_price_csv_upload（GET）／_import（POST）／_csv_template（GET）。
 * analog 確定値: 高額は admin_product_simple_high_price_csv_upload = GET /<route>/product/simple_high_price/csv_upload（ProductSimpleHighPriceCsvController.php:67）。
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductSimpleLowPriceCsvImportPage {
  readonly page: Page;
  readonly url: string; // 要実機確認（低価格帯専用ルート未実装。analog: product/simple_high_price/csv_upload）

  readonly fileInput: Locator; // #admin_csv_import_import_file（setInputFiles で投入）
  readonly uploadButton: Locator; // #upload-button（CSVファイルをアップロード）
  readonly downloadButton: Locator; // a#download-template-button（雛形ダウンロード）
  readonly uploadForm: Locator; // form#upload-form
  readonly boxTitle: Locator; // h4.card-title（低価格帯カード価格変更CSV：trans キー要実機確認）
  readonly requiredBadges: Locator; // フォーマット表 必須バッジ
  readonly pageCountPulldown: Locator; // #page_count_pulldown（履歴件数）
  readonly flashError: Locator; // .alert-danger（取込/フォームエラー）
  readonly flashSuccess: Locator; // .alert-success（登録完了）
  readonly flashWarning: Locator; // .alert-warning（セール中は基準価格/買取価格のみ更新の警告 等）

  constructor(page: Page) {
    this.page = page;
    // 要実機確認: 低価格帯専用ルートは未実装。実装後に確定する（analog の命名規則からの候補値）。
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product/simple_low_price/csv_upload`;

    this.fileInput = page.locator("#admin_csv_import_import_file");
    this.uploadButton = page.locator("#upload-button");
    this.downloadButton = page.locator("#download-template-button");
    this.uploadForm = page.locator("#upload-form");
    this.boxTitle = page.locator(".card-title");
    this.requiredBadges = page.locator(".badge");
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
   * CSV列定義（商品ID/言語ID/基準価格/買取価格/原価単価）は実装後に確定＝要実機確認（付帯表4 #2）。
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
