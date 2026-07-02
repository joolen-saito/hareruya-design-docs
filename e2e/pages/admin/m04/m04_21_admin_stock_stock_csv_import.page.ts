import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 在庫管理「在庫変更CSV登録」Page Object（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m04_21_admin_stock_stock_csv_import_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m04-21_admin_stock_stock_csv_import.md / 観点表 / 基本設計)由来
 * （オラクル独立性）。実装の現挙動・Form制約(NotBlank/Length/Count)・行数上限値・成功文言は期待値に流用しない。
 * 取込後の在庫数・履歴・入荷集計の原値照合は手動/間接。自動化は画面表示・UI部品・雛形DL発火・未認証誘導に限る。
 *
 * 重要（刷新先 ec-cube-enterprise は仕様から大きく乖離）:
 *  - 設計(pf-eccube3 HareruyaEc)は GET/POST 同一URL `/product/product_stock_csv_upload`・CSV2列(商品コード/在庫増減数)・
 *    変更理由キー `memo`・行数上限5010・成功文言「商品登録CSVファイルをアップロードしました。」。
 *  - 刷新先は GET `/product/stock/change/new`・POST `/product/stock/change/upload`・CSV3列(商品コード/在庫増減数/仕入単価)・
 *    在庫変動理由キー `stock_change_reason`・行数上限10000・承認ワークフロー(店舗/在庫場所/在庫変動区分/承認部署/承認通知先)・
 *    クライアントJS検証+AJAX事前検証+大量変動確認モーダル。
 *  - これらは付帯表4「不具合候補（仕様乖離）」に列挙。本POMはセレクタ(位置情報)のみ刷新先から取得し、合否は仕様で判定する。
 *
 * セレクタは Twig＋Symfony Form `StockChangeType` の getBlockPrefix=`admin_stock_change_csv_list`
 * （src/Eccube/Form/Type/Admin/StockChangeType.php:241-244）由来の位置情報のみ。
 * DOM/文言根拠（src/Eccube/Resource/template/admin/Stock/change.twig）:
 *  - フォーム: form#upload-form（change.twig:323 method=post action=url('admin_stock_change_csv_upload') enctype=multipart）
 *  - ファイル入力(hidden d-none): #admin_stock_change_csv_list_import_file（change.twig:406 / blockPrefix + import_file）
 *  - ファイル名表示: #admin_stock_change_csv_list_import_file_name（change.twig:405 既定 trans admin.common.file_select_empty=「選択されていません」messages:1560）
 *  - ファイル選択ボタン: #file-select（change.twig:404 trans admin.common.file_select=「ファイルを選択」messages:1553）
 *  - 登録ボタン: #upload-button（change.twig:409 初期 disabled / trans admin.common.bulk_registration=「一括登録を実行」messages:1451）
 *  - 雛形ダウンロード: #download-button a href=url('admin_stock_change_csv_template')（change.twig:423 trans admin.common.csv_skeleton_download=「雛形ファイルダウンロード」messages:1548）
 *  - 変更理由(在庫変動理由): #admin_stock_change_csv_list_stock_change_reason（change.twig:378 label admin.stock.change_csv.stock_change_reason=「在庫変動理由」messages:4920）
 *  - 店舗: #admin_stock_change_csv_list_change_base_info（change.twig:336）
 *  - 在庫場所: name="admin_stock_change_csv_list[change_stock_location_id]" ラジオ（change.twig:350）
 *  - 在庫変動区分: #admin_stock_change_csv_list_stock_change_type_detail（change.twig:364）
 *  - 承認部署: #admin_stock_change_csv_list_approval_department（change.twig:392）
 *  - 承認通知先メンバー: #admin_stock_change_csv_list_approval_notification_target_members（change.twig:396）
 *  - CSVフォーマット表: #ex-stock_change_csv-format（change.twig:427）／必須バッジ trans admin.common.required（change.twig:434 messages 経由）
 *  - 取込履歴 見出し: trans admin.stock.change_csv.history_title（change.twig:466 messages:4925）
 *  - クライアントCSV検証エラー領域: #csv-validate-errors / #csv-validate-error-list（change.twig:313-315）
 *  - 大量変動確認モーダル: #largeChangeConfirmModal（change.twig:291 初期 fade 非表示）
 *
 * ルート（src/Eccube/Controller/Admin/Stock/StockChangeCsvController.php）:
 *  - admin_stock_change_csv_list  = GET,POST /<route>/product/stock/change/new（:99 画面表示）
 *  - admin_stock_change_csv_upload= POST     /<route>/product/stock/change/upload（:148-152 アップロード）
 *  - admin_stock_change_csv_template= GET    /<route>/product/stock/change/csv-template（:431 filename=stock_change.csv :455）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class AdminStockStockCsvImportPage {
  readonly page: Page;
  readonly url: string; // 画面表示(GET)
  readonly uploadUrl: string; // アップロード(POST)
  readonly templateUrl: string; // 雛形ダウンロード(GET)

  readonly fileInput: Locator; // #admin_stock_change_csv_list_import_file（hidden d-none。setInputFiles で投入）
  readonly fileSelectButton: Locator; // #file-select
  readonly fileNameLabel: Locator; // #admin_stock_change_csv_list_import_file_name
  readonly uploadButton: Locator; // #upload-button（一括登録を実行。初期 disabled）
  readonly downloadButton: Locator; // #download-button（雛形ダウンロード a）
  readonly uploadForm: Locator; // form#upload-form
  readonly changeReason: Locator; // #admin_stock_change_csv_list_stock_change_reason（変更理由＝在庫変動理由）
  readonly changeBaseInfo: Locator; // #admin_stock_change_csv_list_change_base_info（店舗）
  readonly stockChangeTypeDetail: Locator; // #admin_stock_change_csv_list_stock_change_type_detail（在庫変動区分）
  readonly approvalDepartment: Locator; // #admin_stock_change_csv_list_approval_department（承認部署）
  readonly approvalMembers: Locator; // #admin_stock_change_csv_list_approval_notification_target_members（承認通知先）
  readonly formatTable: Locator; // #ex-stock_change_csv-format（CSVフォーマット表）
  readonly requiredBadges: Locator; // .badge（必須バッジ）
  readonly clientErrors: Locator; // #csv-validate-error-list（クライアント検証エラー一覧）
  readonly largeChangeModal: Locator; // #largeChangeConfirmModal（大量変動確認モーダル）
  readonly flash: Locator; // .alert（フラッシュ：成功/エラー）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product/stock/change/new`;
    this.uploadUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/change/upload`;
    this.templateUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/change/csv-template`;

    this.fileInput = page.locator("#admin_stock_change_csv_list_import_file");
    this.fileSelectButton = page.locator("#file-select");
    this.fileNameLabel = page.locator("#admin_stock_change_csv_list_import_file_name");
    this.uploadButton = page.locator("#upload-button");
    this.downloadButton = page.locator("#download-button");
    this.uploadForm = page.locator("#upload-form");
    this.changeReason = page.locator("#admin_stock_change_csv_list_stock_change_reason");
    this.changeBaseInfo = page.locator("#admin_stock_change_csv_list_change_base_info");
    this.stockChangeTypeDetail = page.locator("#admin_stock_change_csv_list_stock_change_type_detail");
    this.approvalDepartment = page.locator("#admin_stock_change_csv_list_approval_department");
    this.approvalMembers = page.locator("#admin_stock_change_csv_list_approval_notification_target_members");
    this.formatTable = page.locator("#ex-stock_change_csv-format");
    this.requiredBadges = page.locator(".badge");
    this.clientErrors = page.locator("#csv-validate-error-list");
    this.largeChangeModal = page.locator("#largeChangeConfirmModal");
    this.flash = page.locator(".alert");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /**
   * 在庫変更CSV登録画面の主要UI部品が仕様どおり表示されること。
   * 仕様(フロント挙動 表示要素): CSVファイル選択欄・変更理由欄・アップロードボタン・フォーマット表・雛形DLリンク・取込履歴一覧。
   */
  async seeUploadForm() {
    await expect(this.fileSelectButton).toBeVisible();
    await expect(this.uploadButton).toBeVisible(); // 「一括登録を実行」(刷新先文言)。仕様の「アップロードボタン」相当
    await expect(this.changeReason).toBeVisible(); // 変更理由欄(刷新先=在庫変動理由)
    await expect(this.downloadButton).toBeVisible(); // 雛形DLリンク
    await expect(this.formatTable).toBeVisible(); // ファイルフォーマット表
  }

  /** 雛形ダウンロードを発火し Download を返す（ファイル名検証用。内容は手動確認）。 */
  async downloadTemplate(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.downloadButton.click(),
    ]);
    return download;
  }

  /**
   * hidden 入力(#admin_stock_change_csv_list_import_file)へ CSV を投入し、登録ボタンを押下する。
   * 実処理は setInputFiles → #upload-button クリックのみ（file-select の change を明示発火させてはいない）。
   * 刷新先はクライアントJSで #upload-button の活性化・submit を制御するため、要実機化時は
   * file-select の change 発火やボタン活性待ちの追加が必要になり得る（要実機確認・実装挙動には寄せない）。
   */
  async uploadCsv(fileName: string, content: string) {
    await this.fileInput.setInputFiles({
      name: fileName,
      mimeType: "text/csv",
      buffer: Buffer.from(content, "utf-8"),
    });
    await this.uploadButton.click();
  }
}
