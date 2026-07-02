import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 商品管理「商品タグ更新CSV登録（アップロード）」Page Object。
 * 納品ケース表 integration_test/e2e/m03_28_admin_product_product_product_tag_csv_import_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-28_admin_product_product_product_tag_csv_import.md / messages.ja.yaml)由来
 * （オラクル独立性）。本機能の画面入力はCSVファイル1系統のみ。取込後のDB値（dtb_product_tag置換・履歴INSERT）は
 * ブラウザ観測外のため間接/手動とし、自動化は画面表示・取込結果フラッシュ・リダイレクト・雛形DL・履歴UI・権限に限る。
 *
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_csv_import`（CsvImportType.php:80-83）由来の位置情報のみ:
 *  - アップロードフォーム: form#upload-form（base_csv_upload.twig:53, method=post enctype=multipart action=url('admin_product_product_tag_import')）
 *  - CSRFトークン: #admin_csv_import__token（base_csv_upload.twig:54 form_widget(form._token)）
 *  - ファイル入力: #admin_csv_import_import_file（base_csv_upload.twig:65, FileType import_file / class=custom-file-input）
 *  - アップロードボタン: #upload-button（base_csv_upload.twig:73, type=submit / trans admin.common.csv_upload=「CSVファイルをアップロード」messages.ja.yaml:1547）
 *  - フォーマット説明カード見出し: trans csv_format_title=admin.product.product_tag_csv_format_title=「商品タグ更新CSVファイルフォーマット」(messages.ja.yaml:1796 / Controller.php:92)
 *  - 説明テーブル項目名セル: table thead trans admin.common.csv_item_name=「項目名」(base_csv_upload.twig:90 / :1550) / 行 key=「商品ID」「タグID」(Controller.php:178-181 getCsvHeader)
 *  - 必須バッジ: span.badge trans admin.common.required=「必須」(base_csv_upload.twig:101 / :1528。csv_required_header_keys=商品ID/タグID Controller.php:90,189-195)
 *  - 雛形DLリンク: #download-template-button（base_csv_upload.twig:83, url('admin_product_product_tag_csv_template') / trans admin.common.csv_skeleton_download=「雛形ファイルダウンロード」:1548）
 *  - 取込履歴カード見出し: trans admin.product.csv_import_history_title=「CSVインポート履歴」(csv_import_history.twig:6 / :1788)
 *  - 履歴ヘッダ: ファイル名/アップロード日時/作業者（csv_import_history.twig:24-26 / :1789-1791）
 *  - 件数プルダウン: #page_count_pulldown（csv_import_history.twig:10。option value=path(history_page_route,{page_no:1,page_count:count}) :12。change で window.location :53-56）
 *
 * ルート（ProductTagCsvController.php）:
 *  - アップロード画面 admin_product_product_tag_csv_upload = GET /<route>/product/product_tag_csv_upload（:67）
 *  - 取込 admin_product_product_tag_import = POST /<route>/product/product_tag/import（:110）
 *  - 雛形DL admin_product_product_tag_csv_template = GET /<route>/product/product_tag/csv_template（:50, product_tag_template.csv / application/octet-stream）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductProductTagCsvImportPage {
  readonly page: Page;
  readonly uploadUrl: string; // GET アップロード画面
  readonly importPath: string; // POST 専用ルート（GET直アクセス検証用）
  readonly templatePath: string; // GET 雛形DL

  readonly uploadForm: Locator; // form#upload-form（base_csv_upload.twig:53）
  readonly fileInput: Locator; // #admin_csv_import_import_file（:65）
  readonly uploadButton: Locator; // #upload-button（:73 type=submit）
  readonly templateLink: Locator; // #download-template-button（:83）
  readonly pageCountPulldown: Locator; // #page_count_pulldown（csv_import_history.twig:10）
  readonly requiredBadge: Locator; // span.badge「必須」（:101）
  readonly formatTitle: Locator; // フォーマット説明カード見出し（csv_format_title）
  readonly historyTitle: Locator; // 取込履歴カード見出し（csv_import_history.twig:6）

  constructor(page: Page) {
    this.page = page;
    this.uploadUrl = `/${ECCUBE_ADMIN_ROUTE}/product/product_tag_csv_upload`;
    this.importPath = `/${ECCUBE_ADMIN_ROUTE}/product/product_tag/import`;
    this.templatePath = `/${ECCUBE_ADMIN_ROUTE}/product/product_tag/csv_template`;

    this.uploadForm = page.locator("#upload-form");
    this.fileInput = page.locator("#admin_csv_import_import_file");
    this.uploadButton = page.locator("#upload-button");
    this.templateLink = page.locator("#download-template-button");
    this.pageCountPulldown = page.locator("#page_count_pulldown");
    // 文言は trans admin.common.required（messages.ja.yaml:1528）由来。位置情報として badge＋テキストで特定する。
    this.requiredBadge = page.locator("span.badge", { hasText: "必須" });
    // 文言は trans admin.product.product_tag_csv_format_title（:1796）由来。
    this.formatTitle = page.getByText("商品タグ更新CSVファイルフォーマット");
    // 文言は trans admin.product.csv_import_history_title（:1788）由来。
    this.historyTitle = page.getByText("CSVインポート履歴");
  }

  async gotoUpload() {
    await this.page.goto(this.uploadUrl);
  }

  /** 指定のCSVファイル（バッファ）を選択して取込フォームを送信する。 */
  async uploadCsv(file: { name: string; mimeType?: string; buffer: Buffer }) {
    await this.fileInput.setInputFiles({
      name: file.name,
      mimeType: file.mimeType ?? "text/csv",
      buffer: file.buffer,
    });
    await this.uploadButton.click();
  }

  /** 雛形DLリンクを押し、ダウンロード発火を待って Download を返す。 */
  async downloadTemplate(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.templateLink.click(),
    ]);
    return download;
  }

  /** 履歴の件数プルダウンで n 番目の選択肢を選び、JSによる遷移を待つ。 */
  async changePageCount(optionIndex = 1) {
    await this.pageCountPulldown.selectOption({ index: optionIndex });
  }

  /** アップロード画面の主要UI部品が仕様どおり表示されること。 */
  async seeUploadForm() {
    await expect(this.fileInput).toBeVisible();
    await expect(this.uploadButton).toBeVisible();
  }
}
