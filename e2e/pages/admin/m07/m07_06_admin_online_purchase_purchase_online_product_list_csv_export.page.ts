import { Locator, Page, Download, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 ネット買取管理 買取商品一覧CSV出力 Page Object（一覧 /admin/purchase/list ＋ 買取詳細）。
 * 構造参考: ec-cube-enterprise/e2e-tests の既存 Page Object。本ファイルは設計書+Twig由来の未実行雛形。
 * 期待結果は仕様（functions/pf-eccube3/m07-06_...md / messages.ja.yaml）由来（オラクル独立性）。
 * セレクタは Twig 由来の位置情報のみ。合否は仕様で判定し、実装の現挙動を期待値にしない。
 *
 * DOM/セレクタ根拠（src/Eccube/Resource/template/admin/Purchase/...）:
 *  - 一覧フォーム #bulk_csv_export（CSRF隠しを内包）            : index.twig:162-163
 *  - ダウンロードトグル trans admin.common.download=「ダウンロード」: index.twig:167-168 / messages.ja.yaml:1459
 *  - 売却CSV #csvexport_product_list（formaction type=sale）     : index.twig:173 / 「買取商品一覧CSV」messages.ja.yaml:5252
 *  - キャンセルCSV #csv_export_product_cancel（type=notSale）    : index.twig:174 / 「買取商品（キャンセル）CSV」messages.ja.yaml:5258
 *  - 全選択 #allCheck                                           : index.twig:212
 *  - 行チェック .searched_buy_order_id[name="buyOrderIds[]"]    : index.twig:231
 *  - 詳細ボタン #csvexport_product_list（formaction type=sale） : detail.twig:314 / 「買取商品一覧CSV出力」messages.ja.yaml:5254
 *  - 詳細 隠し #buyOrderIds[name="buyOrderIds[]"]               : detail.twig:315
 */
export class AdminOnlinePurchasePurchaseOnlineProductListCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // 買取一覧（admin_purchase_list）

  // 一覧側
  readonly bulkForm: Locator; // #bulk_csv_export（index.twig:162）
  readonly downloadToggle: Locator; // 「ダウンロード」ドロップダウンのトグル（index.twig:167-168）
  readonly saleCsvItem: Locator; // #csvexport_product_list 売却CSV（index.twig:173）
  readonly cancelCsvItem: Locator; // #csv_export_product_cancel キャンセルCSV（index.twig:174）
  readonly allCheck: Locator; // #allCheck（index.twig:212）
  readonly rowCheckboxes: Locator; // .searched_buy_order_id（index.twig:231）

  // 詳細側
  readonly detailExportButton: Locator; // #csvexport_product_list（detail.twig:314）
  readonly detailBuyOrderIds: Locator; // #buyOrderIds hidden（detail.twig:315）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/purchase/list`;

    this.bulkForm = page.locator("#bulk_csv_export");
    this.downloadToggle = page.locator(
      "#result_list__custom_csv_menu button.dropdown-toggle"
    );
    this.saleCsvItem = page.locator("#csvexport_product_list");
    this.cancelCsvItem = page.locator("#csv_export_product_cancel");
    this.allCheck = page.locator("#allCheck");
    this.rowCheckboxes = page.locator(".searched_buy_order_id");

    // 詳細画面では #csvexport_product_list が送信ボタンとして存在する（同id・別ページ）。
    this.detailExportButton = page.locator("#csvexport_product_list");
    this.detailBuyOrderIds = page.locator("#buyOrderIds");
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  async gotoDetail(buyOrderId: number | string) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/purchase/${buyOrderId}/edit`);
  }

  /** 「ダウンロード」ドロップダウンを開く。 */
  async openDownloadMenu() {
    await this.downloadToggle.click();
  }

  /** 先頭の買取行チェックボックスを1件オンにする。 */
  async checkFirstRow() {
    await this.rowCheckboxes.first().check();
  }

  /** #allCheck をオンにして全行を一括選択する。 */
  async checkAll() {
    await this.allCheck.check();
  }

  /** 選択済み行数。 */
  async checkedCount(): Promise<number> {
    return this.rowCheckboxes.evaluateAll(
      (els) => els.filter((e) => (e as HTMLInputElement).checked).length
    );
  }

  /** 一覧で売却CSV（type=sale）を押下し、発火したダウンロードを返す。 */
  async exportSaleFromList(): Promise<Download> {
    await this.openDownloadMenu();
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.saleCsvItem.click(),
    ]);
    return download;
  }

  /** 一覧でキャンセルCSV（type=notSale）を押下し、発火したダウンロードを返す。 */
  async exportCancelFromList(): Promise<Download> {
    await this.openDownloadMenu();
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.cancelCsvItem.click(),
    ]);
    return download;
  }

  /** 買取詳細で「買取商品一覧CSV出力」を押下し、発火したダウンロードを返す。 */
  async exportFromDetail(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.detailExportButton.click(),
    ]);
    return download;
  }

  /** 一覧のダウンロードメニューに売却/キャンセルCSV項目が仕様どおり表示されること。 */
  async seeListCsvMenuItems() {
    await this.openDownloadMenu();
    await expect(this.saleCsvItem).toContainText("買取商品一覧CSV");
    await expect(this.cancelCsvItem).toContainText("買取商品（キャンセル）CSV");
  }

  /**
   * 買取詳細にCSV出力ボタンと隠しbuyOrderIdsが仕様どおり存在すること。
   * 仕様（利用者視点の入口・詳細）: 隠し入力は name="buyOrderIds[]" かつ「当該買取IDを値に持つ」。
   * expectedBuyOrderId を渡した場合は値が当該IDと一致することも検証する（対象ID誤りを検出）。
   */
  async seeDetailCsvButton(expectedBuyOrderId?: number | string) {
    await expect(this.detailExportButton).toContainText("買取商品一覧CSV出力");
    await expect(this.detailBuyOrderIds).toHaveAttribute("name", "buyOrderIds[]");
    if (expectedBuyOrderId !== undefined && expectedBuyOrderId !== "") {
      // 仕様: 当該買取IDを値に持つ（オラクルは設計書「当該買取のIDが隠しbuyOrderIds[]で送信される」）
      await expect(this.detailBuyOrderIds).toHaveValue(String(expectedBuyOrderId));
    }
  }
}
