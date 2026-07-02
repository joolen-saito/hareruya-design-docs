import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 受注管理「出荷実績インポート登録」Page Object（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m05_26_admin_order_order_shipping_result_csv_import_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m05-26_admin_order_order_shipping_result_csv_import.md / 観点表 / 基本設計)由来
 * （オラクル独立性）。実装の現挙動・Form制約(NotBlank/File maxSize)・成功文言・ロック方式は期待値に流用しない。
 * 取込後の親注文状態・出荷日・送り状No.・配送コミット日時の原値照合は手動/間接。自動化は画面表示・UI部品・未認証誘導に限る。
 *
 * 重要（設計＝pf-eccube3 HareruyaEc プラグイン、刷新先 ec-cube-enterprise とで乖離あり。詳細はケース表 付帯表4）:
 *  - 設計の POST ルートは `/order/shipping_result_csv/upload`。刷新先は GET と同一 path
 *    `/order/shipping_result_csv/import`（methods=POST、route名 admin_shipping_result_csv_upload）
 *    （OrderCsvController.php:263）。
 *  - 設計のボタン文言は「CSV，TSVファイルのアップロード」。刷新先は「CSVファイルのアップロード」（twig:69 ハードコード）。
 *  - ロックは設計=MySQL GET_LOCK、刷新先=advisory lock（OrderRepository::isFree/getLock('registerShippingResult') :283,292）。
 *  - 列構成（CSV_HEADER :41-109）に住所3/配送先_住所3 等が含まれ、設計（プラグイン版の列一覧）と桁が食い違うリスク。
 *  本POMはセレクタ(位置情報)のみ刷新先から取得し、合否は仕様で判定する。
 *
 * セレクタ根拠の区別（創作防止）:
 *  - blockPrefix 由来は import_file 系のみ: `#admin_csv_import_import_file` / `#admin_csv_import_import_file_name`
 *    （Symfony Form `CsvImportType` getBlockPrefix=`admin_csv_import` + フィールド名。CsvImportType.php:80-83 / twig:54,53）。
 *  - それ以外（`#file-select` twig:52 / `#upload-button` twig:69 / `#file_format` twig:74 /
 *    `#file_format_box__header` twig:81）は Twig にハードコードされた id（blockPrefix 由来ではない）。
 *  - `.modal.show`（モーダル非表示確認）/ `.alert`（フラッシュ）/ `.text-danger`（errors ループ twig:59）は
 *    Bootstrap 由来の汎用クラスで当画面固有 id ではない＝要実機確認。
 * セレクタ(位置情報)は刷新先 Twig から取得し、合否(オラクル)は仕様で判定する。
 * DOM/文言根拠（src/Eccube/Resource/template/admin/Order/shipping_result_csv_import.twig）:
 *  - フォーム: form#upload-form（twig:45 method=post action=url('admin_shipping_result_csv_import') enctype=multipart）
 *  - ファイル入力(class d-none): #admin_csv_import_import_file（twig:54 / blockPrefix + import_file）
 *  - ファイル選択ボタン: #file-select（twig:52 trans admin.common.file_select=「ファイルを選択」messages:1553）
 *  - ファイル名表示: #admin_csv_import_import_file_name（twig:53 既定 trans admin.common.file_select_empty=「選択されていません」messages:1560）
 *  - CSV選択ラベル: trans admin.common.csv_select=「CSVファイルを選択」（twig:48 / messages:1552）
 *  - アップロードボタン: #upload-button（twig:69 文言「CSVファイルのアップロード」・初期 disabled 属性なし＝送信可）
 *  - フォーマット表カード: #file_format（twig:74）/ h3「出荷実績登録CSVファイルフォーマット」(twig:76)
 *  - フォーマット表ヘッダ行: #file_format_box__header / 各列 #file_format_box__header--{loop.index}（twig:81-84）
 *  - サーバ側エラー: .text-danger（twig:59 errors ループ）/ 警告: .text-warning（twig:63）
 *  - import_file のフォーム検証エラー: form_errors(form.import_file)（twig:55）
 *  - card-header「出荷実績CSVアップロード」(twig:43) / sub_title「出荷実績登録CSVアップロード」(twig:16) / title「出荷実績管理」(twig:15)
 *
 * ルート（src/Eccube/Controller/Admin/Order/OrderCsvController.php）:
 *  - admin_shipping_result_csv_import = GET  /<route>/order/shipping_result_csv/import（:237-243 画面表示）
 *  - admin_shipping_result_csv_upload = POST /<route>/order/shipping_result_csv/import（:263-264 アップロード）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class OrderOrderShippingResultCsvImportPage {
  readonly page: Page;
  readonly url: string; // 画面表示(GET)＝アップロード(POST)と同一 path

  readonly uploadForm: Locator; // form#upload-form
  readonly fileInput: Locator; // #admin_csv_import_import_file（class d-none。setInputFiles で投入）
  readonly fileSelectButton: Locator; // #file-select（ファイルを選択）
  readonly fileNameLabel: Locator; // #admin_csv_import_import_file_name（選択されていません）
  readonly uploadButton: Locator; // #upload-button（CSVファイルのアップロード）
  readonly formatCard: Locator; // #file_format（フォーマット表カード）
  readonly formatHeaderRow: Locator; // #file_format_box__header（フォーマット表ヘッダ行）
  readonly serverErrors: Locator; // .text-danger（errors ループ）
  readonly serverWarnings: Locator; // .text-warning（warnings ループ）
  readonly flash: Locator; // .alert（成功/エラーフラッシュ）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/order/shipping_result_csv/import`;

    this.uploadForm = page.locator("#upload-form");
    this.fileInput = page.locator("#admin_csv_import_import_file");
    this.fileSelectButton = page.locator("#file-select");
    this.fileNameLabel = page.locator("#admin_csv_import_import_file_name");
    this.uploadButton = page.locator("#upload-button");
    this.formatCard = page.locator("#file_format");
    this.formatHeaderRow = page.locator("#file_format_box__header");
    this.serverErrors = page.locator(".text-danger");
    this.serverWarnings = page.locator(".text-warning");
    this.flash = page.locator(".alert");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /**
   * 出荷実績CSVアップロード画面の主要UI部品が仕様どおり表示されること。
   * 仕様(フロント挙動 表示要素): アップロードカード（ファイル選択・送信ボタン）＋ 全列ヘッダ名を並べたフォーマット表。
   */
  async seeUploadForm() {
    await expect(this.fileSelectButton).toBeVisible(); // ファイル選択(1系)
    await expect(this.uploadButton).toBeVisible(); // 送信ボタン
    await expect(this.formatCard).toBeVisible(); // フォーマット表（列一覧のヒント）
  }

  /**
   * hidden 風(class d-none)の #admin_csv_import_import_file へ CSV/TSV を投入し、アップロードボタンを押下する。
   * 刷新先は #file-select クリック→ネイティブ input.click→change で活性化する JS 経路だが、
   * テストでは setInputFiles で直接投入する（要実機化時は file-select の change 発火が必要になり得る・要実機確認）。
   */
  async uploadFile(fileName: string, content: string, mimeType = "text/csv") {
    await this.fileInput.setInputFiles({
      name: fileName,
      mimeType,
      buffer: Buffer.from(content, "utf-8"),
    });
    await this.uploadButton.click();
  }
}
