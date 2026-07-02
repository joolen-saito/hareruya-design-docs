import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫管理「在庫一括編集」Page Object。
 * 納品ケース表 integration_test/e2e/m04_03_admin_stock_stock_bulk_edit_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m04-03_admin_stock_stock_bulk_edit.md / 観点表)由来（オラクル独立性）。
 * 設計源は pf-eccube3 のリバース（直接更新型）であり、刷新先 ec-cube-enterprise は承認ワークフロー型で
 * 画面・入口・項目・メッセージが大きく異なる。乖離はケース表 付帯表4（不具合候補）に記載する。
 * 実装からはセレクタ・ルート（位置情報）のみを取り、合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * セレクタ根拠（src/Eccube/...・現行ソース）:
 *  - 編集画面ルート admin_stock_bulk_approval_new = /product/stock/stock-bulk-approval/new
 *    （StockBulkApprovalController.php:52、GET/POST で productStockIds[]/productStockId[] を受ける）
 *  - 登録(store)ルート admin_stock_bulk_approval_store = /product/stock/stock-bulk-approval/store
 *    （StockBulkApprovalController.php:89）
 *  - 在庫一覧(入口) admin_stock_list = /product/stock（StockListController.php:94）
 *  - フォーム #stock_bulk_approval_form（bulkapproval.twig:217、getBlockPrefix=form → DOM id 接頭辞 form_）
 *  - 隠し 在庫ID input[name="productStockId[]"]（bulkapproval.twig:220）
 *  - 在庫変動区分(全行共通) #form_stock_change_type_detail（.js-bulk-stock-change-type-detail-global bulkapproval.twig:242
 *    / StockBulkApprovalType.php:64 EntityType・NotBlank）
 *  - 承認通知先(部門) #form_approval_department（bulkapproval.twig:250 / Type.php:92）
 *  - 承認通知先メンバー #form_approval_notification_target_members（.js-bulk-approval-members bulkapproval.twig:258
 *    / Type.php:98 multiple・Count(min:1)）
 *  - 行: 在庫変動理由 #form_item_{i}_stock_change_reason（.js-bulk-stock-change-reason bulkapproval.twig:316
 *    / StockBulkApprovalItemType.php:52 NotBlank+Length(max)）
 *  - 行: 在庫増減数 #form_item_{i}_stock_change_quantity（.js-bulk-stock-change-quantity bulkapproval.twig:320
 *    / ItemType.php:60 NotBlank+Range）
 *  - 行: 仕入単価 #form_item_{i}_purchase_price（.js-bulk-purchase-price bulkapproval.twig:324 / ItemType.php:68）
 *  - 登録ボタン trans common.registration=「登録する」（bulkapproval.twig:353 / messages.ja.yaml:17 form=stock_bulk_approval_form）
 *  - 在庫一覧に戻る trans admin.stock.edit.back_to_stock_list=「在庫一覧に戻る」（bulkapproval.twig:345 / messages.ja.yaml:4235）
 *  - エラーフラッシュ .alert-danger（alert.twig:32,42）/ 成功フラッシュ .alert-success（alert.twig:22）
 *  - 在庫一覧の一括編集ボタン #bulkEditBtn trans admin.stock.list.bulk_edit=「在庫一括編集」
 *    （stock_list_index.twig:480 / messages.ja.yaml:4447。data-url=admin_stock_bulk_approval_new へ JS で POST）
 */
export class StockStockBulkEditPage {
  readonly page: Page;
  readonly newUrl: string; // 編集画面表示（GET/POST）
  readonly stockListUrl: string; // 在庫一覧（入口）

  readonly form: Locator; // #stock_bulk_approval_form
  readonly productStockIdHidden: Locator; // input[name="productStockId[]"]
  readonly changeTypeDetail: Locator; // #form_stock_change_type_detail（在庫変動区分・全行共通）
  readonly approvalDepartment: Locator; // #form_approval_department
  readonly notificationMembers: Locator; // #form_approval_notification_target_members（multiple）
  readonly registerButton: Locator; // 「登録する」
  readonly backToListLink: Locator; // 「在庫一覧に戻る」
  readonly error: Locator; // .alert-danger（フラッシュ）/ .invalid-feedback（行エラー）も併用
  readonly success: Locator; // .alert-success（フラッシュ）
  readonly rows: Locator; // 編集テーブルのデータ行
  readonly visibleModals: Locator; // 表示中のモーダル/トースト（仕様: 表示しない）

  constructor(page: Page) {
    this.page = page;
    this.newUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock/stock-bulk-approval/new`;
    this.stockListUrl = `/${ECCUBE_ADMIN_ROUTE}/product/stock`;

    this.form = page.locator("#stock_bulk_approval_form");
    this.productStockIdHidden = page.locator('input[name="productStockId[]"]');
    this.changeTypeDetail = page.locator("#form_stock_change_type_detail");
    this.approvalDepartment = page.locator("#form_approval_department");
    this.notificationMembers = page.locator(
      "#form_approval_notification_target_members"
    );
    this.registerButton = page.getByRole("button", { name: "登録する" });
    this.backToListLink = page.getByRole("link", { name: "在庫一覧に戻る" });
    this.error = page.locator(".alert-danger");
    this.success = page.locator(".alert-success");
    this.rows = page.locator("#stock_bulk_approval_form table tbody tr");
    // 仕様(フロント挙動): 本機能はモーダル・トーストを表示しない。表示中のものだけを対象に数える
    // （管理レイアウトに非表示テンプレートが含まれ得るため .show 限定で偽陽性を避ける）。
    this.visibleModals = page.locator(".modal.show, .toast.show");
  }

  /** 編集表 i 行目のセル群（表示列の本数確認に使う）。 */
  rowCells(i: number): Locator {
    return this.rows.nth(i).locator("td");
  }

  /** 在庫一覧（入口）を開く。 */
  async gotoStockList() {
    await this.page.goto(this.stockListUrl);
  }

  /** 在庫IDを GET クエリで渡して編集画面を直接開く。ids 空のときは未選択ガードの検証に使う。 */
  async gotoNew(productStockIds: number[]) {
    const qs = productStockIds
      .map((id) => `productStockIds[]=${id}`)
      .join("&");
    await this.page.goto(qs ? `${this.newUrl}?${qs}` : this.newUrl);
  }

  /**
   * 在庫一覧で1件チェックして「在庫一括編集」ボタン(#bulkEditBtn)を押下する。
   * 注: 在庫一覧の行チェックボックス name/セレクタは要実機確認（#stock_bulk_approval_form は
   *     編集画面側フォームのIDであり一覧チェックボックスではない＝混同しないこと。
   *     stock_list_index.twig:480 の #bulkEditBtn が productStockId[] を JS で POST する）。
   *     入口は到達手段としてのみ用い、合否は仕様（pf-eccube3）で判定する。
   */
  async openEditorFromList() {
    const checkbox = this.page
      .locator('.table-stock-list tbody input[type="checkbox"]')
      .first();
    await checkbox.check();
    await this.page.locator("#bulkEditBtn").click();
  }

  /** 在庫変動区分（全行共通）を選択肢のラベル一致で選ぶ。 */
  async selectChangeTypeByLabel(label: string) {
    await this.changeTypeDetail.selectOption({ label });
  }

  /** i 行目の入力。reason/quantity/purchasePrice を必要なものだけ埋める。 */
  async fillRow(
    i: number,
    values: { quantity?: string; reason?: string; purchasePrice?: string }
  ) {
    if (values.quantity !== undefined) {
      await this.page
        .locator(`#form_item_${i}_stock_change_quantity`)
        .fill(values.quantity);
    }
    if (values.reason !== undefined) {
      await this.page
        .locator(`#form_item_${i}_stock_change_reason`)
        .fill(values.reason);
    }
    if (values.purchasePrice !== undefined) {
      await this.page
        .locator(`#form_item_${i}_purchase_price`)
        .fill(values.purchasePrice);
    }
  }

  /** 在庫変動理由欄(i行目)の locator。required 属性検証等に使う。 */
  reasonInput(i: number): Locator {
    return this.page.locator(`#form_item_${i}_stock_change_reason`);
  }

  /** 在庫増減数欄(i行目)の locator。 */
  quantityInput(i: number): Locator {
    return this.page.locator(`#form_item_${i}_stock_change_quantity`);
  }

  async submit() {
    await this.registerButton.click();
  }

  /** 編集画面のUI部品（規格行の表・必須入力・登録ボタン）が表示されること。期待は仕様(フロント挙動/入力項目)由来。 */
  async seeEditForm() {
    await expect(this.form).toBeVisible();
    await expect(this.changeTypeDetail).toBeVisible();
    await expect(this.quantityInput(0)).toBeVisible();
    await expect(this.reasonInput(0)).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }
}
