import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理「在庫移動実績CSV登録（送り状No.一括登録）」Page Object（csv_import 画面）。
 * 納品ケース表 integration_test/e2e/m04_29_admin_stock_stock_move_result_csv_import_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/ec-cube-enterprise/m04-29_admin_stock_stock_move_result_csv_import.md /
 * 観点表 integration-test-viewpoints.md / 基本設計0202_在庫管理機能)由来（オラクル独立性）。
 * Form/Twig の制約（必須・maxlength・accept属性）は id/name のセレクタ確認にのみ使い、期待値へ流用しない。
 * 取込後の tracking_no・更新者・更新日時の原値照合、在庫数・移動ステータスの非更新確認は手動/間接（ケース表 付帯表2/3）。
 *
 * 画面構成: 本機能は単独画面ではなく、在庫移動指示一覧（admin_stock_move_instruction_list）上の
 * モーダル #csvRecordRegistrationModal から CSV を選択し POST する。取込結果は一覧へ resume=1 付きで
 * リダイレクトしフラッシュ（.alert）で表示する。
 *
 * セレクタ根拠（src/Eccube/Resource/template/admin/Stock/stock_move_instruction_index.twig）:
 *  - モーダル起動ボタン: button[data-bs-target="#csvRecordRegistrationModal"]（:68 trans admin.stock.move_instruction.csv_registration_button=「在庫移動実績CSV登録」messages.ja.yaml:4973）
 *  - モーダル: #csvRecordRegistrationModal（:276）
 *  - フォーム: form#csvRecordRegistrationForm（:287 method=post action=url('admin_stock_move_instruction_csv_tracking') enctype=multipart）
 *  - CSRFトークン hidden: input[name=<Constant::TOKEN_NAME>]（:288）
 *  - ファイル入力(hidden d-none): #csvRecordImportFile（:299 name=csv_file accept=text/csv,text/tsv,.csv,.tsv）
 *  - ファイル選択ボタン: #csvRecordFileSelect（:296 trans admin.common.file_select=「ファイルを選択」messages.ja.yaml:1553）
 *  - ファイル名表示: #csvRecordFileName（:297 既定 trans admin.common.file_select_empty=「選択されていません」messages.ja.yaml:1560）
 *  - 登録(アップロード)ボタン: #csvRecordUploadButton（:336 初期 disabled / trans admin.stock.move_instruction.tracking_register_button=「登録」messages.ja.yaml:4996）
 *  - リード文: csv_registration_modal_lead（:290 messages.ja.yaml:4974「CSVファイルを選択し、登録ボタンをクリックしてください。」）
 *  - 上書き注記: csv_registration_modal_overwrite_note（:282 messages.ja.yaml:4975「（既に在庫移動実績を登録している場合、上書きされます）」）
 *  - 登録上限注記: csv_registration_file_limit（:294 messages.ja.yaml:4976「（1ファイルの登録上限は10,000件です）」）
 *  - フォーマット表 見出し: csv_format_title（:303 messages.ja.yaml:4977「CSVファイルフォーマット」）
 *  - 必須バッジ: .badge.bg-primary（:314 移動指示ID / :326 送り状No. trans admin.common.required messages.ja.yaml:1545）
 *  - フラッシュ表示: .alert（@admin/default_frame のフラッシュバッグ。addSuccess/addError 出力先）
 *  - JS（:378-387）: #csvRecordImportFile の change で #csvRecordFileName を更新し #csvRecordUploadButton を活性化する。
 *
 * ルート（src/Eccube/Controller/Admin/Stock/StockMoveInstructionController.php）:
 *  - admin_stock_move_instruction_list    = GET,POST /<route>/product/stock/move-instruction（:66 一覧表示・モーダル設置）
 *  - admin_stock_move_instruction_csv_tracking = POST /<route>/product/stock/move-instruction/csv-tracking（:368 取込POST）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class AdminStockStockMoveResultCsvImportPage {
  readonly page: Page;
  readonly listUrl: string; // 一覧（モーダルの入口）GET
  readonly uploadUrl: string; // 取込 POST（admin_stock_move_instruction_csv_tracking）

  readonly openModalButton: Locator; // モーダル起動「在庫移動実績CSV登録」(:68)
  readonly modal: Locator; // #csvRecordRegistrationModal(:276)
  readonly uploadForm: Locator; // #csvRecordRegistrationForm(:287)
  readonly fileInput: Locator; // #csvRecordImportFile(:299 name=csv_file, hidden d-none)
  readonly fileSelectButton: Locator; // #csvRecordFileSelect(:296)
  readonly fileNameLabel: Locator; // #csvRecordFileName(:297)
  readonly uploadButton: Locator; // #csvRecordUploadButton(:336 初期 disabled)
  readonly formatTable: Locator; // フォーマット表(:305 table)
  readonly requiredBadges: Locator; // .badge.bg-primary（必須バッジ :314/:326）
  readonly flash: Locator; // .alert（フラッシュ：成功/エラー）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/move-instruction`;
    this.uploadUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/move-instruction/csv-tracking`;

    this.openModalButton = page.locator('button[data-bs-target="#csvRecordRegistrationModal"]');
    this.modal = page.locator("#csvRecordRegistrationModal");
    this.uploadForm = page.locator("#csvRecordRegistrationForm");
    this.fileInput = page.locator("#csvRecordImportFile");
    this.fileSelectButton = page.locator("#csvRecordFileSelect");
    this.fileNameLabel = page.locator("#csvRecordFileName");
    this.uploadButton = page.locator("#csvRecordUploadButton");
    this.formatTable = this.modal.locator("table");
    this.requiredBadges = this.modal.locator(".badge.bg-primary");
    this.flash = page.locator(".alert");
  }

  async goto() {
    await this.page.goto(this.listUrl);
  }

  /** 一覧の「在庫移動実績CSV登録」ボタンでモーダルを開く。 */
  async openModal() {
    await this.openModalButton.click();
    await expect(this.modal).toBeVisible();
  }

  /**
   * モーダルの主要UI部品が仕様どおり表示されること。
   * 仕様(利用者視点の入口/取込CSV仕様): CSVファイル選択欄・登録ボタン・フォーマット表（必須列）。
   */
  async seeModalForm() {
    await expect(this.fileSelectButton).toBeVisible();
    await expect(this.fileNameLabel).toBeVisible();
    await expect(this.uploadButton).toBeVisible();
    await expect(this.formatTable).toBeVisible();
  }

  /**
   * hidden 入力に CSV を投入し（change で登録ボタンが活性化）、登録ボタンを押下して取込POSTする。
   * 既定の MIME は text/csv。tsv を試す場合は mimeType/fileName を呼び出し側で指定する。
   */
  async uploadCsv(fileName: string, content: string, mimeType = "text/csv") {
    await this.openModal();
    await this.fileInput.setInputFiles({
      name: fileName,
      mimeType,
      buffer: Buffer.from(content, "utf-8"),
    });
    await this.uploadButton.click();
  }

  /** フラッシュに指定文言が表示されること（仕様由来の文言で判定）。 */
  async seeFlash(text: string) {
    await expect(this.flash.filter({ hasText: text })).toBeVisible();
  }
}
