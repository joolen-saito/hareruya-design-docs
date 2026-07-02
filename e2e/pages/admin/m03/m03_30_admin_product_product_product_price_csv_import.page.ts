import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 商品管理「セール用価格変更CSV登録（アップロード）」Page Object（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m03_30_admin_product_product_product_price_csv_import_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-30_admin_product_product_product_price_csv_import.md / messages.ja.yaml)由来
 * （オラクル独立性）。実装の現挙動・Form制約(NotBlank/maxSize)・取込後のDB値は期待値に流用しない。
 * 自動化はアップロード発火・取込結果フラッシュ・バリデーションエラー・画面表示・雛形ダウンロード発火に限る。
 * 取込後の dtb_product_class / dtb_price_history / 取込履歴の原値照合・買取換算・セール区分決定は手動/間接。
 *
 * セレクタは Twig＋Symfony Form `CsvImportType` の getBlockPrefix=`admin_csv_import`
 * （src/Eccube/Form/Type/Admin/CsvImportType.php:80-83）由来の位置情報のみ。
 * テンプレートは csv_product_price.twig が base_csv_upload.twig を継承する構成
 * （src/Eccube/Resource/template/admin/Product/csv_product_price.twig:1-5 / base_csv_upload.twig）。
 *
 * DOM/文言根拠:
 *  - フォーム: form#upload-form（base_csv_upload.twig:53 method=post action=url('admin_product_product_price_import') enctype=multipart）
 *  - ファイル入力: #admin_csv_import_import_file（base_csv_upload.twig:65 form.import_file / blockPrefix=admin_csv_import + import_file。class custom-file-input）
 *  - CSRFトークン: #admin_csv_import__token（base_csv_upload.twig:54）
 *  - アップロードボタン: #upload-button trans admin.common.csv_upload=「CSVファイルをアップロード」（base_csv_upload.twig:73 / messages.ja.yaml:1547）
 *  - 雛形ダウンロード: a#download-template-button href=url('admin_product_product_price_csv_template') trans admin.common.csv_skeleton_download=「雛形ファイルダウンロード」（base_csv_upload.twig:83 / messages.ja.yaml:1548）
 *  - ボックス見出し csv_box_title=admin.product.product_price_csv_upload_title=「セール用価格変更CSV」（Controller.php:100 / base:58 / messages.ja.yaml:1800）
 *  - フォーマット見出し csv_format_title=admin.product.product_price_csv_format_title=「セール用価格変更CSVファイルフォーマット」（Controller.php:101 / base:82 / messages.ja.yaml:1801）
 *  - サブタイトル trans admin.product.product_price_csv=「セール用価格変更CSVアップロード」（csv_product_price.twig:5 / messages.ja.yaml:1799）
 *  - title block trans admin.product.product_management=「商品管理」（base:3 / messages.ja.yaml:1723）
 *  - フォーマット表必須バッジ: .badge trans admin.common.required（base:101）。必須列は設計書 CSVデータ列（md:131-135）由来＝商品ID/言語(ID)/販売価格/買取価格 の4列。
 *    （実装 getRequiredCsvHeader は セールフラグ を含む5列＝設計書「セールフラグは任意」と乖離。不具合候補#7。期待値は設計書由来の4列を用いる）
 *  - 取込結果/エラー/成功フラッシュ: .alert-danger / .alert-success（@admin/alert.twig:30,40 eccube.admin.error ← addError 'admin' / :21 eccube.admin.success ← addSuccess 'admin'）
 *  - 取込履歴一覧: csv_import_history.twig（ファイル名/日時/操作者）／ページ件数プルダウン #page_count_pulldown（csv_import_history.twig:10）
 *
 * ルート（ProductPriceCsvController.php）:
 *  - admin_product_product_price_csv_upload   = GET  /<route>/product/product_price/product_price_csv_upload（:75-76）
 *  - admin_product_product_price_csv_template  = GET  /<route>/product/product_price/csv_template（:58-59 → product_price_template.csv）
 *  - admin_product_product_price_import         = POST /<route>/product/product_price/import（:119-120 → 302 で upload へ）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductProductPriceCsvImportPage {
  readonly page: Page;
  readonly url: string;
  readonly importPathRe: RegExp; // 取込POST（admin_product_product_price_import）応答URL判定用

  readonly fileInput: Locator; // #admin_csv_import_import_file（custom-file-input。setInputFiles で投入）
  readonly fileLabel: Locator; // .custom-file-label（JSがファイル名を反映。要実機確認）
  readonly uploadButton: Locator; // #upload-button（CSVファイルをアップロード）
  readonly downloadButton: Locator; // a#download-template-button（雛形ダウンロード）
  readonly uploadForm: Locator; // form#upload-form
  readonly errorAlert: Locator; // .alert-danger（エラーフラッシュ）
  readonly successAlert: Locator; // .alert-success（成功フラッシュ）
  readonly formatCard: Locator; // フォーマット見出しを含むカード（必須バッジ等のスコープ。要実機確認）
  readonly boxTitle: Locator; // ボックス見出し「セール用価格変更CSV」（完全一致でフォーマット見出しと区別）
  readonly formatTitle: Locator; // フォーマット見出し「セール用価格変更CSVファイルフォーマット」
  readonly requiredBadges: Locator; // フォーマット表カード内の必須バッジ（全体 .badge ではなくカード内に限定）
  readonly pageCountPulldown: Locator; // #page_count_pulldown（取込履歴ページ件数）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product/product_price/product_price_csv_upload`;
    this.importPathRe = new RegExp(
      `/${ECCUBE_ADMIN_ROUTE}/product/product_price/import(\\?|$)`
    );

    this.fileInput = page.locator("#admin_csv_import_import_file");
    this.fileLabel = page.locator(".custom-file-label");
    this.uploadButton = page.locator("#upload-button");
    this.downloadButton = page.locator("#download-template-button");
    this.uploadForm = page.locator("#upload-form");
    this.errorAlert = page.locator(".alert-danger");
    this.successAlert = page.locator(".alert-success");
    // 見出しは完全一致で分離（box「セール用価格変更CSV」はformat「…ファイルフォーマット」の部分文字列のため exact 必須）。
    this.boxTitle = page.getByText("セール用価格変更CSV", { exact: true });
    this.formatTitle = page.getByText("セール用価格変更CSVファイルフォーマット", {
      exact: true,
    });
    // 必須バッジは「フォーマット表のカード」に限定（ページ全体 .badge での誤合格回避。カード根セレクタは要実機確認）。
    this.formatCard = page.locator(".card", {
      hasText: "セール用価格変更CSVファイルフォーマット",
    });
    this.requiredBadges = this.formatCard.locator(".badge");
    this.pageCountPulldown = page.locator("#page_count_pulldown");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /**
   * CSV をその場で生成して取込む（file 入力に setInputFiles → アップロードボタン押下）。
   * ヘッダ列順は getCsvHeader（Controller.php:193-204）の 7 列:
   *   商品ID,言語(ID),販売価格,買取価格,セールフラグ,帯URL,タグ(ID)
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
   * CSV をその場で生成して取込み、取込POST(import)の応答を返す。
   * 仕様の「HTTP302でアップロード画面へ戻る」を、リダイレクト後の最終URLだけでなく
   * POST応答そのものの status で検証できるようにする（302オラクル）。
   */
  async uploadCsvCaptureImport(fileName: string, content: string) {
    await this.fileInput.setInputFiles({
      name: fileName,
      mimeType: "text/csv",
      buffer: Buffer.from(content, "utf-8"),
    });
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (r) => this.importPathRe.test(r.url()) && r.request().method() === "POST"
      ),
      this.uploadButton.click(),
    ]);
    return response;
  }

  /** ファイル未選択のまま送信（必須バリデーション確認用）。 */
  async submitWithoutFile() {
    await this.uploadButton.click();
  }

  /** ファイル未選択のまま送信し、取込POST(import)の応答を返す（302検証用）。 */
  async submitWithoutFileCaptureImport() {
    const [response] = await Promise.all([
      this.page.waitForResponse(
        (r) => this.importPathRe.test(r.url()) && r.request().method() === "POST"
      ),
      this.uploadButton.click(),
    ]);
    return response;
  }

  /** セール用価格変更CSV登録画面の主要UI部品が仕様どおり表示されること。 */
  async seeUploadForm() {
    await expect(this.fileInput).toHaveCount(1); // custom-file-input は視覚的に隠れるため存在で確認
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
