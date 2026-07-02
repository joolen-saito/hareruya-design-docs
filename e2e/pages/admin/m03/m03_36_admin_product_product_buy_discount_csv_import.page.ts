import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 商品管理「買取減額率変更CSV登録」Page Object（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m03_36_admin_product_product_buy_discount_csv_import_e2e_cases.md に対応。
 *
 * 【重要・screenExists=false】刷新先 ec-cube-enterprise に本機能の専用画面・取込ハンドラ・雛形(type=buyDiscount)は存在しない。
 *  - 専用ルート /{admin_route}/product/product_buy_discount_csv_upload（GET/POST）が無い（Controller/Admin/Product/Csv/ 全走査、product_buy_discount grep ヒット0）。
 *  - admin_product_csv_template は type=buyDiscount を処理しない（CsvImportController.php に buyDiscount 分岐なし）。
 *  - 取込種別 mtb_csv_import_type.id=13「買取減額率変更登録」は刷新先にも存在する（MtbCsvImportType.php:40 PRODUCT_BUY_DISCOUNT_IMPORT_CSV_ID=13 / Version20251125141348.php:112）。ただし当該種別を処理する買取減額率CSV取込ハンドラへの配線は無い（取込経路は要確認）。
 *  - 買取減額率は移行先で dtb_product.buy_discount_id（Entity/Product.php:1217-1227 の MtbBuyDiscount 参照列）に統合され、
 *    現行の補助表 dtb_product_sub は廃止。専用2列CSV画面(商品ID・買取減額率(ID))に1:1対応する入口は刷新先に無い。
 * よって本Page Objectの URL・セレクタは設計書(pf-eccube3 HareruyaEc リバース)由来の「あるべき位置」を記すが、
 * 刷新先に該当DOMが無いため全て要実機確認。**創作（根拠なき発明）セレクタは置かない**：id系は共通CSVアップロードフォーム
 * (Symfony Form CsvImportType getBlockPrefix=admin_csv_import＝Form/Type/Admin/CsvImportType.php:80-83 / base_csv_upload.twig)
 * 由来の推定idを参考併記したものである。なお .text-danger / .alert-danger は範囲が広く誤検知し得る暫定コンテナ参照であり、
 * 専用画面が再実装された際に根拠DOM(id/role)へ必ず絞り込むこと（要実機確認）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m03-36_admin_product_product_buy_discount_csv_import.md)由来（オラクル独立性）。
 * 実装の現挙動・Form制約(NotBlank/CsvMimeType/csv_size)は期待値に流用しない。取込後の買取減額率原値照合は手動/間接。
 *
 * 参考セレクタ（共通CSVアップロード Symfony Form `CsvImportType` getBlockPrefix=`admin_csv_import`
 *   ＝Form/Type/Admin/CsvImportType.php:80-83 由来。専用画面が無いため要実機確認）:
 *  - フォーム: #upload-form（base_csv_upload.twig:53）
 *  - CSRFトークン: form._token（base_csv_upload.twig:54）
 *  - ファイル入力: #admin_csv_import_import_file（form_widget(form.import_file) base_csv_upload.twig:65、accept=.csv,text/csv,.tsv,text/tsv :20,65）
 *  - アップロードボタン: #upload-button（base_csv_upload.twig:73 trans admin.common.csv_upload=「CSVファイルをアップロード」messages.ja.yaml:1547）
 *  - 雛形ダウンロード: #download-template-button（base_csv_upload.twig:83 trans admin.common.csv_skeleton_download=「雛形ファイルダウンロード」messages.ja.yaml:1548）
 *  - 取込エラー一覧: .alert-danger ul li（import_errors base_csv_upload.twig:40-50 / trans admin.common.csv_import_error:1585）
 *  - フォームエラー: form_errors(form.import_file)（base_csv_upload.twig:67、.text-danger 相当）
 *  - インポート履歴: csv_import_history.twig:1-50（trans admin.product.csv_import_history_title:1788）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class ProductProductBuyDiscountCsvImportPage {
  readonly page: Page;
  readonly url: string; // GET/POST 画面（設計仕様。刷新先未存在＝要実機確認）
  readonly templateUrl: string; // 雛形ダウンロード（type=buyDiscount。刷新先未対応＝要実機確認）

  readonly fileInput: Locator; // #admin_csv_import_import_file（要実機確認・刷新先未存在）
  readonly uploadButton: Locator; // #upload-button（要実機確認）
  readonly downloadButton: Locator; // #download-template-button（雛形DL。要実機確認）
  readonly formError: Locator; // .text-danger（ファイル必須/MIME/サイズ等フォームエラー。要実機確認）
  readonly importErrors: Locator; // .alert-danger（取込エラー一覧。要実機確認）

  constructor(page: Page) {
    this.page = page;
    // 設計仕様のパス（pf-eccube3）。刷新先 ec-cube-enterprise には未存在のため到達不可の可能性（不具合候補#1）。
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product/product_buy_discount_csv_upload`;
    this.templateUrl = `/${ECCUBE_ADMIN_ROUTE}/product/product_csv_template/buyDiscount`;

    // 専用画面が無いため、いずれも「共通 base_csv_upload.twig 系で再実装された場合の推定」位置（要実機確認）。
    // 創作セレクタではなく共通フォーム由来の参考値。
    this.fileInput = page.locator("#admin_csv_import_import_file");
    this.uploadButton = page.locator("#upload-button");
    this.downloadButton = page.locator("#download-template-button");
    this.formError = page.locator(".text-danger");
    this.importErrors = page.locator(".alert-danger");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** CSV をその場で生成して取込む（ファイル入力に setInputFiles → アップロードボタン押下）。要実機確認(刷新先未存在)。 */
  async uploadCsv(fileName: string, content: string) {
    await this.fileInput.setInputFiles({
      name: fileName,
      mimeType: "text/csv",
      buffer: Buffer.from(content, "utf-8"),
    });
    await this.uploadButton.click();
  }

  /** 買取減額率変更CSV登録画面の主要UI部品が仕様どおり表示されること（要実機確認）。 */
  async seeUploadForm() {
    await expect(this.fileInput).toBeVisible();
    await expect(this.uploadButton).toBeVisible();
    await expect(this.downloadButton).toBeVisible();
  }

  /** 雛形ダウンロードを発火し Download を返す（ファイル名検証用。内容＝BOM/列名は手動確認）。要実機確認(type=buyDiscount 未対応)。 */
  async downloadTemplate(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.downloadButton.click(),
    ]);
    return download;
  }
}
