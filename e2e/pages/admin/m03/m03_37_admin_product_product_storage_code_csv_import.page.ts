import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 商品管理「略称タグ更新CSV登録（略称タグ登録CSVアップロード）」Page Object。
 * 納品ケース表 integration_test/e2e/m03_37_admin_product_product_storage_code_csv_import_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-37_admin_product_product_storage_code_csv_import.md /
 * messages.ja.yaml)由来（オラクル独立性）。実装の Form 制約・現挙動は期待値に流用しない。
 * 本機能は m03-16 と同一の取込画面（mtb_storage_code を ID/名称/並び順 で更新登録）を扱う「更新CSV登録」視点である。
 *
 * ルート構成（設計書「利用者視点の入口」どおり。GET表示とPOST送信を明確に区別＝乖離なし）:
 *  - 取込画面の表示は GET admin_product_storage_code_csv = /<route>/product/storage_code/csv（設計書:34）。
 *  - ファイル送信ボタンの取込は POST admin_product_storage_code_import = /<route>/product/storage_code/import（設計書:38）。
 *    本POMは表示 /csv と送信 /import を分けて持つ（同一画面のGET/POSTで仕様どおり）。
 *  - 一覧ヘッダ導線「CSV取込」（設計書:34）の表示文言は実装翻訳が admin.product.csv.import=「CSV入力」
 *    （storage_code.twig:64-65 / messages.ja.yaml:2148）。文言相違は付帯表4 要確認#2 で実機確認。
 *    セレクタは表示文言「CSV入力」をロケータ位置情報として用いるのみ（オラクルは仕様由来の挙動・遷移先）。
 *
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_csv_import`（CsvImportType.php:80-83）由来の位置情報のみ:
 *  - import_file → #admin_csv_import_import_file（csv_product_storage_code.twig:74）
 *  - アップロードボタン → #upload-button trans admin.common.csv_upload=「CSVファイルをアップロード」(twig:82-83 / messages.ja.yaml:1547)
 *  - 取込画面見出し h3 → trans admin.product.storage_code_csv_upload_title=「略称タグ登録CSVアップロード」(twig:42 / messages.ja.yaml:1786)
 *  - 雛形DL a#download-template-button → trans admin.common.csv_skeleton_download=「雛形ファイルダウンロード」(twig:92 / messages.ja.yaml:1548)
 *  - 一覧に戻る link → trans admin.common.csv_back_to_list=「一覧に戻る」(twig:43-44 / messages.ja.yaml:1584)
 *  - 一覧「CSV入力」link → trans admin.product.csv.import=「CSV入力」(storage_code.twig:64-65 / messages.ja.yaml:2148)
 *  - 成功フラッシュ → .alert-success（alert.twig:21-22）/ エラーフラッシュ → .alert-danger（alert.twig:31-32,41-42）
 *  - ファイル名ラベル → .custom-file-label（twig:27 JS で選択ファイル名を表示・要実機確認）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductStorageCodeCsvImportPage {
  readonly page: Page;
  readonly listUrl: string; // 略称タグ一覧（admin_product_storage_code = /<route>/product/storage）
  readonly csvUrl: string; // 取込画面表示（admin_product_storage_code_csv = /<route>/product/storage_code/csv）
  readonly importPath: string; // 取込POST（admin_product_storage_code_import = /<route>/product/storage_code/import）

  readonly importLink: Locator; // 一覧「CSV入力」リンク（storage_code.twig:64-65）
  readonly fileInput: Locator; // #admin_csv_import_import_file（twig:74）
  readonly uploadButton: Locator; // #upload-button（twig:82-83）
  readonly uploadTitle: Locator; // h3 取込画面見出し（twig:42）
  readonly subTitle: Locator; // サブタイトル「略称タグ管理」（twig:6 sub_title block）
  readonly formatTitle: Locator; // h4 CSVフォーマット表見出し（twig:91）
  readonly idOptionalNote: Locator; // フォーマ表ID列セル内 small.text-muted（twig:109-110 ID列の任意注記）
  readonly skeletonDownload: Locator; // a#download-template-button（twig:92）
  readonly backToListLink: Locator; // 「一覧に戻る」（twig:43-44）
  readonly fileLabel: Locator; // .custom-file-label（twig:27 選択ファイル名表示・要実機確認）
  readonly successAlert: Locator; // 成功フラッシュ .alert-success（alert.twig:21-22）
  readonly errorAlert: Locator; // エラーフラッシュ .alert-danger（alert.twig:31-32,41-42）
  readonly loginId: Locator; // 未認証ガード時の管理ログインID欄（login.twig:26）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/product/storage`;
    this.csvUrl = `/${ECCUBE_ADMIN_ROUTE}/product/storage_code/csv`;
    this.importPath = `/${ECCUBE_ADMIN_ROUTE}/product/storage_code/import`;

    this.importLink = page.getByRole("link", { name: "CSV入力" });
    this.fileInput = page.locator("#admin_csv_import_import_file");
    this.uploadButton = page.locator("#upload-button");
    this.uploadTitle = page.getByRole("heading", { name: "略称タグ登録CSVアップロード" });
    // サブタイトルは設計書「フロント挙動 表示要素」由来の文言「略称タグ管理」（オラクルは仕様文言）。
    this.subTitle = page.getByText("略称タグ管理", { exact: false });
    this.formatTitle = page.getByRole("heading", { name: "略称タグ登録CSVファイルフォーマット" });
    // フォーマ表のID列セルに置かれる注記（small.text-muted）。フッタ案内文(card-footer)と区別するため table 配下に限定。
    this.idOptionalNote = page.locator("table small.text-muted");
    this.skeletonDownload = page.locator("#download-template-button");
    this.backToListLink = page.getByRole("link", { name: "一覧に戻る" });
    this.fileLabel = page.locator(".custom-file-label");
    this.successAlert = page.locator(".alert-success");
    this.errorAlert = page.locator(".alert-danger");
    this.loginId = page.locator("#login_id");
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  async gotoCsv() {
    await this.page.goto(this.csvUrl);
  }

  /** 一覧の「CSV入力」リンクから取込画面へ遷移する。 */
  async openCsvViaListLink() {
    await this.gotoList();
    await this.importLink.click();
  }

  /** インラインCSV内容をアップロードする（メモリ上のバッファをファイルとして渡す）。 */
  async uploadCsv(content: string, filename = "storage_code.csv", mimeType = "text/csv") {
    await this.fileInput.setInputFiles({
      name: filename,
      mimeType,
      buffer: Buffer.from(content, "utf-8"),
    });
    await this.uploadButton.click();
  }

  /** 空（0バイト）ファイルをアップロードする（csv_invalid_format 確認）。 */
  async uploadEmptyFile(filename = "empty.csv") {
    await this.fileInput.setInputFiles({
      name: filename,
      mimeType: "text/csv",
      buffer: Buffer.from("", "utf-8"),
    });
    await this.uploadButton.click();
  }

  /** ファイルを選択せずアップロードボタンを押下する（必須バリデーション確認）。 */
  async submitWithoutFile() {
    await this.uploadButton.click();
  }

  /** 雛形ダウンロードリンクを押下し、ダウンロード発火（保存ダイアログ相当）を待ち受ける。
   *  仕様（利用者視点の入口・雛形DL）の「発火」を観測する。ファイル内容（ヘッダのみ）は手動確認。 */
  async downloadSkeleton() {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.skeletonDownload.click(),
    ]);
    return download;
  }

  /** 取込画面のUI部品（見出し・ファイル選択・アップロードボタン）が仕様どおり表示されること。 */
  async seeUploadForm() {
    await expect(this.uploadTitle).toBeVisible();
    await expect(this.fileInput).toBeVisible();
    await expect(this.uploadButton).toBeVisible();
  }
}
