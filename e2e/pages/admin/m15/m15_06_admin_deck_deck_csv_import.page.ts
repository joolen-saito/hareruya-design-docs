import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 デッキ登録 CSV/TSV 取込（アップロード）画面 Page Object。
 * 納品ケース表 integration_test/e2e/m15_06_admin_deck_deck_csv_import_e2e_cases.md に対応。
 * 期待結果は仕様(pf-eccube3 m15-06_admin_deck_deck_csv_import.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_csv_import`（CsvImportType.php:80-83）由来の位置情報のみ。
 *
 * 刷新先（ec-cube-enterprise / DeckCsvController.php）:
 *  - GET/POST 取込 admin_deck_csv_import : /{admin_route}/deck/csv_import（同一ルートで描画と取込）
 *    描画テンプレート @admin/Deck/csv_import.twig（renderWithErrors）。
 *  旧設計(pf-eccube3)は GET/POST とも /deck/csvimport（アンダースコア無し。ケース表 付帯表4#1 の刷新差分）。
 *
 * DOM 根拠（csv_import.twig）:
 *  - アップロードフォーム #upload-form（twig:89 action=admin_deck_csv_import / form._token=#admin_csv_import__token twig:90）
 *  - ファイル選択トリガ #file-select（twig:92 trans admin.common.file_select messages.ja.yaml:1553）
 *  - 選択ファイル名表示 #admin_csv_import_import_file_name（twig:93 既定 admin.common.file_select_empty :1560）
 *  - ファイル input import_file → #admin_csv_import_import_file（twig:94 / CsvImportType.php:48,80。accept=text/csv,.csv・class d-none）
 *  - アップロードボタン #upload-button（twig:97 trans admin.common.csv_upload :1547。初期 disabled、JS が change で活性化 twig:47-62）
 *  - 取込フォーマット説明表 table.csv-format-table（twig:109。thead は getCsvHeader() の論理キー＝DeckCsvController.php:158-182）
 *  - 取込結果エラー .alert-danger（twig:71 controller errors 配列を描画）
 *  - 成功フラッシュ .alert-success（default_frame 共通アラート。addSuccess admin.common.csv_upload_complete :1409）
 */
export class DeckDeckCsvImportPage {
  readonly page: Page;
  readonly url: string; // GET/POST 同一ルート

  readonly fileInput: Locator; // ファイル選択 input（hidden d-none）
  readonly fileSelectButton: Locator; // 「ファイルを選択」トリガ
  readonly fileNameLabel: Locator; // 選択ファイル名表示
  readonly uploadButton: Locator; // 「CSVファイルをアップロード」
  readonly uploadForm: Locator; // #upload-form
  readonly formatTable: Locator; // フォーマット説明表
  readonly strictCheckbox: Locator; // 厳密チェック strict（設計 既定オン md:130。刷新先は未描画＝付帯表4#7）
  readonly errorAlert: Locator; // .alert-danger（取込エラー）
  readonly successFlash: Locator; // .alert-success（取込成功）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/deck/csv_import`;

    this.fileInput = page.locator("#admin_csv_import_import_file");
    this.fileSelectButton = page.locator("#file-select");
    this.fileNameLabel = page.locator("#admin_csv_import_import_file_name");
    this.uploadButton = page.locator("#upload-button");
    this.uploadForm = page.locator("#upload-form");
    this.formatTable = page.locator("table.csv-format-table");
    // Symfony Form getBlockPrefix=admin_csv_import（CsvImportType.php:80-83）＋ strict 子フィールド（設計 md:59,130）。
    this.strictCheckbox = page.locator("#admin_csv_import_strict");
    this.errorAlert = page.locator(".alert-danger");
    this.successFlash = page.locator(".alert-success");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /**
   * メモリ上の CSV をアップロードする（一時ファイル不要）。
   * 隠し input への setInputFiles で change イベントが発火し、JS が #upload-button を活性化する（twig:55-61）。
   */
  async uploadContent(name: string, content: string, mimeType = "text/csv") {
    await this.fileInput.setInputFiles({
      name,
      mimeType,
      buffer: Buffer.from(content, "utf-8"),
    });
    await this.uploadButton.click();
  }

  /** ローカルパスのファイルをアップロードする。 */
  async uploadFile(filePath: string) {
    await this.fileInput.setInputFiles(filePath);
    await this.uploadButton.click();
  }

  /** アップロード画面のUI部品が仕様どおり表示されること。 */
  async seeUploadForm() {
    await expect(this.fileSelectButton).toBeVisible();
    await expect(this.uploadButton).toBeVisible();
    await expect(this.formatTable).toBeVisible();
  }
}
