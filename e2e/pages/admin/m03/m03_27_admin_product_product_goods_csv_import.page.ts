import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 商品管理「グッズ商品CSV登録」Page Object。
 * 納品ケース表 integration_test/e2e/m03_27_admin_product_product_goods_csv_import_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-27_admin_product_product_goods_csv_import.md /
 * messages.ja.yaml)由来（オラクル独立性）。実装の Form 制約・現挙動・ファイル名接頭辞は期待値に流用しない。
 *
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_csv_import`（CsvImportType.php:80-83）由来の位置情報のみ:
 *  - import_file → #admin_csv_import_import_file（base_csv_upload.twig:65 form_widget(form.import_file)）
 *  - アップロードボタン → button#upload-button trans admin.common.csv_upload=「CSVファイルをアップロード」
 *      (base_csv_upload.twig:73-75 / messages.ja.yaml:1547)
 *  - アップロードカード見出し → h4.card-title = csv_box_title = admin.product.product_goods_csv_upload
 *      =「グッズ商品CSV登録」(base_csv_upload.twig:58 / GoodsCsvController.php:103 / messages.ja.yaml:1739)
 *  - フォーマット見出し → admin.common.csv_format=「CSVファイルフォーマット」(base_csv_upload.twig:82 / messages.ja.yaml:1549)
 *  - 必須バッジ → span.badge.bg-primary trans admin.common.required=「必須」(base_csv_upload.twig:101 / messages.ja.yaml:1528)
 *  - 雛形DL → a#download-template-button trans admin.common.csv_skeleton_download=「雛形ファイルダウンロード」
 *      (base_csv_upload.twig:83 / messages.ja.yaml:1548)
 *  - 取込履歴見出し → admin.product.csv_import_history_title=「CSVインポート履歴」(csv_import_history.twig:6 / messages.ja.yaml:1788)
 *  - 表示件数プルダウン → select#page_count_pulldown（csv_import_history.twig:10）
 *  - サブタイトル → span.c-pageTitle__subTitle（default_frame.twig:196・sub_title block）
 *  - フラッシュ成功 → .alert-success（alert.twig:22 / eccube.admin.success）／失敗 → .alert-danger（alert.twig:42 / eccube.admin.error）
 *  - 未認証ガード時の管理ログインID欄 → #login_id（login.twig:26）
 *
 * 表示文言（仕様＝messages.ja.yaml の値。実装に合わせて変えない）:
 *  - 成功: admin.common.csv_upload_complete=「CSVファイルをアップロードしました」(messages.ja.yaml:1409)
 *  - 形式不一致: admin.common.csv_invalid_format=「CSVのフォーマットが一致しません」(messages.ja.yaml:1561)
 *  - 行数超過: admin.csv.error.upload.maxrecord=「%maxRecord% 行を超えるCSVファイルは登録できません。」(messages.ja.yaml:1429)
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductGoodsCsvImportPage {
  readonly page: Page;
  readonly uploadUrl: string; // 画面表示/取込POST（admin_product_goods_csv_import / _upload = /<route>/product/product_goods_csv_upload）
  readonly templateUrl: string; // 雛形DL（admin_product_goods_csv_template = /<route>/product/product_goods/csv_template）

  readonly fileInput: Locator; // #admin_csv_import_import_file（base_csv_upload.twig:65）
  readonly fileLabel: Locator; // .custom-file-label（選択でファイル名表示 base_csv_upload.twig:25-27 JS）要実機確認
  readonly formatColumn: (name: string) => Locator; // フォーマット表の列名セル（base_csv_upload.twig:95-98 {{ key }}）
  readonly uploadButton: Locator; // #upload-button（base_csv_upload.twig:73）
  readonly uploadCardTitle: Locator; // h4.card-title「グッズ商品CSV登録」（base_csv_upload.twig:58）
  readonly formatCardTitle: Locator; // 「CSVファイルフォーマット」（base_csv_upload.twig:82）
  readonly requiredBadge: Locator; // span.badge「必須」（base_csv_upload.twig:101）
  readonly skeletonDownload: Locator; // a#download-template-button（base_csv_upload.twig:83）
  readonly historyTitle: Locator; // 「CSVインポート履歴」（csv_import_history.twig:6）
  readonly historyColFilename: Locator; // th「ファイル名」（csv_import_history.twig:24 / messages.ja.yaml:1789）
  readonly historyColUploadDate: Locator; // th「アップロード日時」（csv_import_history.twig:25 / messages.ja.yaml:1790）
  readonly historyColOperator: Locator; // th「作業者」（csv_import_history.twig:26 / messages.ja.yaml:1791）
  readonly pageCountPulldown: Locator; // select#page_count_pulldown（csv_import_history.twig:10）
  readonly subTitle: Locator; // span.c-pageTitle__subTitle（default_frame.twig:196）
  readonly successFlash: Locator; // .alert-success（alert.twig:22）
  readonly errorFlash: Locator; // .alert-danger（alert.twig:42）
  readonly loginId: Locator; // #login_id（login.twig:26）未認証ガード確認用

  constructor(page: Page) {
    this.page = page;
    this.uploadUrl = `/${ECCUBE_ADMIN_ROUTE}/product/product_goods_csv_upload`;
    this.templateUrl = `/${ECCUBE_ADMIN_ROUTE}/product/product_goods/csv_template`;

    this.fileInput = page.locator("#admin_csv_import_import_file");
    this.fileLabel = page.locator(".custom-file-label");
    // フォーマット表（CSVファイルフォーマット）に並ぶ列名セル。列名は設計書「CSV列(1行目の日本語ヘッダ名)」由来。
    this.formatColumn = (name: string) =>
      page.locator("td.text-nowrap", { hasText: name });
    this.uploadButton = page.locator("#upload-button");
    this.uploadCardTitle = page.getByRole("heading", { name: "グッズ商品CSV登録" });
    this.formatCardTitle = page.getByRole("heading", { name: "CSVファイルフォーマット" });
    this.requiredBadge = page.locator("span.badge", { hasText: "必須" });
    this.skeletonDownload = page.locator("#download-template-button");
    this.historyTitle = page.getByRole("heading", { name: "CSVインポート履歴" });
    // 取込履歴の列見出し（仕様＝messages.ja.yaml の値。ケース表「ファイル名・アップロード日時・作業者」由来）
    this.historyColFilename = page.getByRole("columnheader", { name: "ファイル名" });
    this.historyColUploadDate = page.getByRole("columnheader", { name: "アップロード日時" });
    this.historyColOperator = page.getByRole("columnheader", { name: "作業者" });
    this.pageCountPulldown = page.locator("#page_count_pulldown");
    this.subTitle = page.locator(".c-pageTitle__subTitle");
    this.successFlash = page.locator(".alert-success");
    this.errorFlash = page.locator(".alert-danger");
    this.loginId = page.locator("#login_id");
  }

  /** アップロード画面（GET）を表示する。 */
  async goto() {
    await this.page.goto(this.uploadUrl);
  }

  /** 取込履歴ページURL（page_no/page_count 付き）を直接開く。 */
  async gotoWithPaging(pageNo: number, pageCount: number) {
    await this.page.goto(`${this.uploadUrl}?page_no=${pageNo}&page_count=${pageCount}`);
  }

  /** 画面URLへ任意クエリ（不正値検証用）を付けて直接開く。 */
  async gotoWithQuery(query: string) {
    await this.page.goto(`${this.uploadUrl}?${query}`);
  }

  /** 表示件数プルダウンで現在選択されている件数ラベル（例「50件」）を返す。
   * 選択中optionは twig の {% if count == page_count %}selected{% endif %}（csv_import_history.twig:12）で決まる。 */
  async selectedPageCountLabel(): Promise<string> {
    return this.pageCountPulldown.evaluate(
      (el) => (el as HTMLSelectElement).selectedOptions[0]?.textContent?.trim() ?? ""
    );
  }

  /** インラインCSV内容をアップロードする（メモリ上のバッファをファイルとして渡す）。 */
  async uploadCsv(content: string, filename = "product_goods.csv") {
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

  /** 雛形ダウンロードリンクを押下し、ダウンロードイベントを取得する。 */
  async downloadTemplate() {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.skeletonDownload.click(),
    ]);
    return download;
  }

  /** アップロード画面のUI部品（ファイル選択・アップロードボタン）が仕様どおり表示されること。 */
  async seeUploadForm() {
    await expect(this.uploadCardTitle).toBeVisible();
    await expect(this.fileInput).toBeVisible();
    await expect(this.uploadButton).toBeVisible();
  }
}
