import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 商品管理「割引率変更CSV登録」Page Object（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m03_34_admin_product_product_discount_csv_import_e2e_cases.md に対応。
 *
 * 【重要・screenExists=false】刷新先 ec-cube-enterprise に本機能の専用画面・取込ハンドラ・雛形(type=discount)は存在しない。
 *  - 専用ルート /{admin_route}/product/product_discount_csv_upload（GET/POST）が無い（Controller/Admin/Product/Csv/ 全走査で割引率専用なし）。
 *  - admin_product_csv_template は type=discount を処理しない（CsvImportController.php:1205- の分岐に discount 無し）。
 *  - 取込種別定数 MtbCsvImportType::PRODUCT_DISCOUNT_IMPORT_CSV_ID=10（Entity/Master/MtbCsvImportType.php:37）は未参照。
 *  - discount_id は移行先で dtb_product に統合され、包括「商品カードCSV」(CardCsvController.php:299-307 / csv_product_card_bulk.twig)に吸収（本画面とは別機能）。
 * よって本Page Objectの URL・セレクタは設計書(pf-eccube3 HareruyaEc リバース)由来の「あるべき位置」を記すが、
 * 刷新先に該当DOMが無いため全て要実機確認。**創作セレクタは置かず、既存の商品CSV取込画面(csv_category.twig 等)で実在するidを参考併記**する。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-34_admin_product_product_discount_csv_import.md)由来（オラクル独立性）。
 * 実装の現挙動・Form制約(NotBlank/CsvMimeType/csv_size)は期待値に流用しない。取込後の割引率原値照合は手動/間接。
 *
 * 参考セレクタ（既存の商品CSV取込画面 csv_category.twig / csv_class_name.twig / csv_product.twig 等に実在するid。
 *  hidden入力は Symfony Form `CsvImportType` getBlockPrefix=`admin_csv_import` 由来。本機能の専用画面が無いため要実機確認）:
 *  - ファイル入力(hidden): #admin_csv_import_import_file（csv_category.twig:52）
 *  - ファイル選択ボタン: #file-select（csv_category.twig:78。trans admin.common.file_select）
 *  - 一括/アップロードボタン: #upload-button（csv_category.twig:83）
 *  - 雛形ダウンロード: a#download-button（csv_category.twig:100。trans admin.common.csv_skeleton_download=「雛形ファイルダウンロード」。ただし type=discount 未対応）
 *    ※刷新後の共通 base_csv_upload.twig:83 は同リンクを #download-template-button としており別系統（再実装の方式により id が変わりうる＝要実機確認）。
 *  - エラー表示: .text-danger（{% for error in errors %}）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductDiscountCsvImportPage {
  readonly page: Page;
  readonly url: string; // GET/POST 画面（設計仕様。刷新先未存在＝要実機確認）
  readonly templateUrl: string; // 雛形ダウンロード（type=discount。刷新先未対応＝要実機確認）

  readonly fileInput: Locator; // #admin_csv_import_import_file（要実機確認・刷新先未存在）
  readonly fileSelectButton: Locator; // #file-select（要実機確認）
  readonly uploadButton: Locator; // #upload-button（要実機確認）
  readonly downloadButton: Locator; // #download-button（雛形DL。要実機確認）
  readonly errors: Locator; // .text-danger（取込エラー一覧。要実機確認）

  constructor(page: Page) {
    this.page = page;
    // 設計仕様のパス（pf-eccube3）。刷新先 ec-cube-enterprise には未存在のため到達不可の可能性（不具合候補#1）。
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product/product_discount_csv_upload`;
    this.templateUrl = `/${ECCUBE_ADMIN_ROUTE}/product/product_csv_template/discount`;

    // 専用画面が無いため、いずれも「再実装された場合の推定」位置（要実機確認）。創作セレクタではなく共通フォーム由来の参考値。
    this.fileInput = page.locator("#admin_csv_import_import_file");
    this.fileSelectButton = page.locator("#file-select");
    this.uploadButton = page.locator("#upload-button");
    // csv_category.twig 系は #download-button。刷新後 base_csv_upload.twig 系は #download-template-button。再実装方式により変わるため要実機確認。
    this.downloadButton = page.locator("#download-button, #download-template-button");
    this.errors = page.locator(".text-danger");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 雛形ダウンロードURLへ直接アクセスする（未認証ガード検証 E2E-052 等）。要実機確認(type=discount 未対応)。 */
  async gotoTemplate() {
    await this.page.goto(this.templateUrl);
  }

  /**
   * CSV をその場で生成して取込む（hidden 入力に setInputFiles → アップロードボタン押下）。要実機確認(刷新先未存在)。
   * mimeType は既定 text/csv。MIME不正検証(E2E-022)等で別MIMEを渡せるよう任意指定可能。
   */
  async uploadCsv(fileName: string, content: string, mimeType = "text/csv") {
    await this.fileInput.setInputFiles({
      name: fileName,
      mimeType,
      buffer: Buffer.from(content, "utf-8"),
    });
    await this.uploadButton.click();
  }

  /** 割引率変更CSV登録画面の主要UI部品が仕様どおり表示されること（要実機確認）。 */
  async seeUploadForm() {
    await expect(this.fileSelectButton).toBeVisible();
    await expect(this.uploadButton).toBeVisible();
    await expect(this.downloadButton).toBeVisible();
  }

  /** 雛形ダウンロードを発火し Download を返す（ファイル名検証用。内容＝BOM/列名は手動確認）。要実機確認(type=discount 未対応)。 */
  async downloadTemplate(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.downloadButton.click(),
    ]);
    return download;
  }
}
