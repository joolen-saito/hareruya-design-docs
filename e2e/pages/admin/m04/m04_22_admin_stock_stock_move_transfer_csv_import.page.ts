import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理 在庫移動・振替CSV登録（M04-22）Page Object。
 * 納品ケース表 integration_test/e2e/m04_22_admin_stock_stock_move_transfer_csv_import_e2e_cases.md に対応。
 * 期待結果は仕様(基本設計仕様書〔在庫管理機能 M04-22〕 / 正本 functions/ec-cube-enterprise/m04-22_admin_stock_stock_move_transfer_csv_import.md /
 * 観点表 / messages.ja.yaml)由来（オラクル独立性）。本Page Objectが保持するのは Twig＋Symfony Form 由来のセレクタ（位置情報）のみ。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 画面: 在庫移動振替一覧（GET /%admin%/product/stock/move_transfer・admin_stock_move_transfer）上の2モーダル。
 *  - 在庫移動CSV登録: POST .../move_transfer/move_csv_import（admin_stock_move_transfer_move_csv_import・StockMoveTransferController.php:224）
 *  - 在庫振替CSV登録: POST .../move_transfer/transfer_csv_import（admin_stock_move_transfer_transfer_csv_import・:318）
 *  - 雛形: GET .../move_csv_template（:586）/ .../transfer_csv_template（:610）
 *  両モーダルは index()（Controller.php:117-118）が描画する。登録ルートはPOST専用。
 *
 * DOM id 根拠（getBlockPrefix: move=StockMoveCsvImportType.php:125-127=stock_move_csv_import / transfer=StockTransferCsvImportType.php:161-164=stock_transfer_csv_import）:
 *  [移動モーダル] MoveTransfer/index.twig
 *   - 開くボタン  → button[data-bs-target="#stockMoveCsvRegisterModal"]（index.twig:463 trans admin.stock.move_transfer.csv_register_move messages.ja.yaml:5143）
 *   - モーダル    → #stockMoveCsvRegisterModal（index.twig:774）
 *   - 出庫元店舗  → #stock_move_csv_import_move_from_base_info（twig:791 / Form:48）
 *   - 入庫先店舗  → #stock_move_csv_import_move_to_base_info（twig:798 / Form:63）
 *   - 出庫元区分  → radio name="stock_move_csv_import[move_from_stock_location_id]"（twig:807 / Form:78）
 *   - 入庫先区分  → radio name="stock_move_csv_import[move_to_stock_location_id]"（twig:814 / Form:94）
 *   - ファイル    → #stock_move_csv_import_import_file（twig:826 d-none / Form:110）
 *   - ファイル選択 → #stockMoveCsvModalFileSelectBtn（twig:824 trans admin.common.file_select messages:1553）
 *   - ファイル名   → #stockMoveCsvModalFileName（twig:825 trans admin.common.file_select_empty=「選択されていません」 messages:1560）
 *   - 登録ボタン   → #stockMoveCsvModalSubmitBtn（twig:831 trans admin.common.registration=「登録」 messages:1436）
 *   - 雛形リンク   → a[href*="move_csv_template"]（twig:839 trans admin.common.csv_skeleton_download messages:1548）
 *  [振替モーダル] MoveTransfer/index.twig
 *   - 開くボタン  → button[data-bs-target="#stockTransferCsvRegisterModal"]（index.twig:464 trans ...csv_register_transfer messages:5144）
 *   - モーダル    → #stockTransferCsvRegisterModal（twig:866）
 *   - 店舗        → #stock_transfer_csv_import_transfer_base_info（twig:883 / Form:50）
 *   - 在庫区分    → radio name="stock_transfer_csv_import[transfer_stock_location_id]"（twig:895 / Form:65）
 *   - 承認所属    → #stock_transfer_csv_import_approval_department（twig:908 / Form:81）
 *   - 承認メンバー → #stock_transfer_csv_import_approval_notification_target_members（twig:912 / Form:88）
 *   - ファイル選択 → #stockTransferCsvModalFileSelectBtn（twig:922 trans admin.common.file_select messages:1553）
 *   - ファイル    → #stock_transfer_csv_import_import_file（twig:924 d-none / Form:105）
 *   - 登録ボタン   → #stockTransferCsvModalSubmitBtn（twig:928）
 *   - 雛形リンク   → a[href*="transfer_csv_template"]（twig:936）
 *  フラッシュ(成功 admin.register.complete=「登録が完了しました。」messages:1773 / 各CSVエラー messages:1429,2209,2217,2218)の
 *  表示領域セレクタは default_frame 側で確定できないため専用セレクタを創作せず、spec は本文テキスト存在で判定する（要実機確認）。
 */
export class StockStockMoveTransferCsvImportPage {
  readonly page: Page;
  readonly listUrl: string; // 在庫移動振替一覧（モーダルの親画面）
  readonly moveImportUrl: string; // 移動CSV登録（POST専用）
  readonly transferImportUrl: string; // 振替CSV登録（POST専用）
  readonly moveTemplateUrl: string; // 移動CSV雛形（GET）
  readonly transferTemplateUrl: string; // 振替CSV雛形（GET）

  // 移動モーダル
  readonly openMoveModalButton: Locator;
  readonly moveModal: Locator;
  readonly moveFromBaseInfo: Locator;
  readonly moveToBaseInfo: Locator;
  readonly moveFromLocationRadios: Locator;
  readonly moveToLocationRadios: Locator;
  readonly moveFileInput: Locator;
  readonly moveFileSelectButton: Locator;
  readonly moveFileName: Locator;
  readonly moveSubmitButton: Locator;
  readonly moveTemplateLink: Locator;

  // 振替モーダル
  readonly openTransferModalButton: Locator;
  readonly transferModal: Locator;
  readonly transferBaseInfo: Locator;
  readonly transferLocationRadios: Locator;
  readonly transferApprovalDepartment: Locator;
  readonly transferApprovalMembers: Locator;
  readonly transferFileInput: Locator;
  readonly transferFileSelectButton: Locator;
  readonly transferSubmitButton: Locator;
  readonly transferTemplateLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/move_transfer`;
    this.moveImportUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/move_transfer/move_csv_import`;
    this.transferImportUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/move_transfer/transfer_csv_import`;
    this.moveTemplateUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/move_transfer/move_csv_template`;
    this.transferTemplateUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/move_transfer/transfer_csv_template`;

    // 移動モーダル
    this.openMoveModalButton = page.locator(
      'button[data-bs-target="#stockMoveCsvRegisterModal"]'
    ); // index.twig:463
    this.moveModal = page.locator("#stockMoveCsvRegisterModal"); // index.twig:774
    this.moveFromBaseInfo = page.locator("#stock_move_csv_import_move_from_base_info"); // twig:791
    this.moveToBaseInfo = page.locator("#stock_move_csv_import_move_to_base_info"); // twig:798
    this.moveFromLocationRadios = page.locator(
      'input[name="stock_move_csv_import[move_from_stock_location_id]"]'
    ); // twig:807
    this.moveToLocationRadios = page.locator(
      'input[name="stock_move_csv_import[move_to_stock_location_id]"]'
    ); // twig:814
    this.moveFileInput = page.locator("#stock_move_csv_import_import_file"); // twig:826 (d-none)
    this.moveFileSelectButton = page.locator("#stockMoveCsvModalFileSelectBtn"); // twig:824 admin.common.file_select :1553
    this.moveFileName = page.locator("#stockMoveCsvModalFileName"); // twig:825
    this.moveSubmitButton = page.locator("#stockMoveCsvModalSubmitBtn"); // twig:831
    this.moveTemplateLink = this.moveModal.locator('a[href*="move_csv_template"]'); // twig:839

    // 振替モーダル
    this.openTransferModalButton = page.locator(
      'button[data-bs-target="#stockTransferCsvRegisterModal"]'
    ); // index.twig:464
    this.transferModal = page.locator("#stockTransferCsvRegisterModal"); // twig:866
    this.transferBaseInfo = page.locator("#stock_transfer_csv_import_transfer_base_info"); // twig:883
    this.transferLocationRadios = page.locator(
      'input[name="stock_transfer_csv_import[transfer_stock_location_id]"]'
    ); // twig:895
    this.transferApprovalDepartment = page.locator(
      "#stock_transfer_csv_import_approval_department"
    ); // twig:908
    this.transferApprovalMembers = page.locator(
      "#stock_transfer_csv_import_approval_notification_target_members"
    ); // twig:912
    this.transferFileInput = page.locator("#stock_transfer_csv_import_import_file"); // twig:924 (d-none)
    this.transferFileSelectButton = page.locator("#stockTransferCsvModalFileSelectBtn"); // twig:922 admin.common.file_select :1553
    this.transferSubmitButton = page.locator("#stockTransferCsvModalSubmitBtn"); // twig:928
    this.transferTemplateLink = this.transferModal.locator(
      'a[href*="transfer_csv_template"]'
    ); // twig:936
  }

  async goto() {
    await this.page.goto(this.listUrl);
  }

  /** 在庫移動CSV登録モーダルを開く（操作起点＝一覧の登録ボタン）。 */
  async openMoveModal() {
    await this.openMoveModalButton.click();
    await expect(this.moveModal).toBeVisible();
  }

  /** 在庫振替CSV登録モーダルを開く。 */
  async openTransferModal() {
    await this.openTransferModalButton.click();
    await expect(this.transferModal).toBeVisible();
  }

  /** 移動モーダルのUI部品が仕様どおり表示されること（出庫元/入庫先・在庫区分・ファイル・登録）。 */
  async seeMoveModalParts() {
    await expect(this.moveFromBaseInfo).toBeVisible();
    await expect(this.moveToBaseInfo).toBeVisible();
    await expect(this.moveFromLocationRadios.first()).toBeAttached();
    await expect(this.moveToLocationRadios.first()).toBeAttached();
    await expect(this.moveFileSelectButton).toBeVisible(); // ファイル選択ボタン（仕様 識別ID1-5）
    await expect(this.moveFileInput).toBeAttached(); // d-none のため visible ではなく attached
    await expect(this.moveSubmitButton).toBeVisible();
  }

  /** 振替モーダルのUI部品が仕様どおり表示されること（店舗・在庫区分・承認通知先・ファイル・登録）。 */
  async seeTransferModalParts() {
    await expect(this.transferBaseInfo).toBeVisible();
    await expect(this.transferLocationRadios.first()).toBeAttached();
    await expect(this.transferApprovalDepartment).toBeVisible();
    await expect(this.transferApprovalMembers).toBeVisible();
    await expect(this.transferFileSelectButton).toBeVisible(); // ファイル選択ボタン（仕様 識別ID1-5）
    await expect(this.transferFileInput).toBeAttached();
    await expect(this.transferSubmitButton).toBeVisible();
  }

  /** 雛形リンクのダウンロードを発火させ、Download を返す（ファイル名検証用）。 */
  async downloadMoveTemplate() {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.moveTemplateLink.click(),
    ]);
    return download;
  }

  async downloadTransferTemplate() {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.transferTemplateLink.click(),
    ]);
    return download;
  }
}
