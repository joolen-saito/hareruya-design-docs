import { APIResponse, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 受注管理 出荷指示「納品書印刷（英語）」Page Object。
 * 納品ケース表 integration_test/e2e/m05_23_admin_order_order_shipping_standby_print_delivery_slips_en_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 【screenExists=true】刷新先 ec-cube-enterprise に本機能は実在する。
 *  - 入口は出荷指示リスト編集 admin_shipping_standby_edit = GET,POST /<route>/standby/{id}/edit
 *      （ShippingStandbyController.php:152）。
 *  - 印刷ルート admin_shipping_standby_print_delivery_slips
 *      = GET,POST /<route>/standby/{id}/print/delivery/{lang}（requirements id=\d+, lang=ja|en,
 *        ShippingStandbyController.php:393）。
 *      {id} 不存在で NotFound＝HTTP404（:397-399）、order_ids 空で HTTP404（:401-405）、
 *      配送ID集合が空で HTTP404（:425-427）。en は delivery_slips.en.twig をレンダリング（:432）。
 *
 * 期待結果は仕様（正本md functions/pf-eccube3/m05-23_admin_order_order_shipping_standby_print_delivery_slips_en.md /
 *   設計HTML / テスト観点表）由来（オラクル独立性）。実装の現挙動・JS詳細・Form制約・Cookie名は期待値に流用しない。
 * セレクタは Twig（DOM id / trans キー）由来の位置情報のみ（file:line を併記）。創作セレクタは置かない。
 * 期待表示文言は設計書本文由来とし、messages.ja.yaml の翻訳値は固定オラクルにしない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 */
export class OrderOrderShippingStandbyPrintDeliverySlipsEnPage {
  readonly page: Page;

  // --- 出荷指示リスト編集（入口）の要素 ---
  readonly formBulk: Locator; // 一括処理フォーム（edit.twig:113 id=form_bulk name=order_list）
  readonly printPickingListButton: Locator; // ピッキングリスト印刷（edit.twig:117 id=printPickingList）
  readonly printJaButton: Locator; // 納品書印刷（日本語）（edit.twig:120 id=printDeliverySlipsJp）
  readonly printEnButton: Locator; // 納品書印刷（英語）（edit.twig:123 id=printDeliverySlipsEn / trans admin.order.print_delivery_slips_en）
  readonly orderExportButton: Locator; // 出荷実績入力用CSV出力（edit.twig:126 id=orderExportForInput）
  readonly labelsExportButton: Locator; // 送り状CSV（edit.twig:129 id=labelsExport）
  readonly checkAll: Locator; // ヘッダ列一括選択（edit.twig:142 id=check-all）
  readonly rowCheckboxes: Locator; // 各受注行チェック（edit.twig:157 name="order_ids[{Order.id}]" 既定オン）

  // --- 英語納品書ページ（delivery_slips.en.twig）の要素 ---
  readonly slipPrintButton: Locator; // 印刷する（delivery_slips.en.twig:24 id=printButton / trans admin.common.print）

  constructor(page: Page) {
    this.page = page;

    this.formBulk = page.locator("#form_bulk");
    this.printPickingListButton = page.locator("#printPickingList");
    this.printJaButton = page.locator("#printDeliverySlipsJp");
    this.printEnButton = page.locator("#printDeliverySlipsEn");
    this.orderExportButton = page.locator("#orderExportForInput");
    this.labelsExportButton = page.locator("#labelsExport");
    this.checkAll = page.locator("#check-all");
    this.rowCheckboxes = page.locator('input[type="checkbox"][name^="order_ids"]');

    this.slipPrintButton = page.locator("#printButton");
  }

  /** 出荷指示リスト編集（入口）URL。 */
  editUrl(id: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/standby/${id}/edit`;
  }

  /** 英語納品書の印刷URL（lang は経路パラメータ。requirements lang=ja|en）。 */
  printUrl(id: number | string, lang = "en"): string {
    return `/${ECCUBE_ADMIN_ROUTE}/standby/${id}/print/delivery/${lang}`;
  }

  /** 出荷指示リスト編集（入口）を開く。 */
  async gotoEdit(id: number | string) {
    await this.page.goto(this.editUrl(id));
  }

  /** 編集画面に英語印刷ボタンが仕様どおり表示されること（trans admin.order.print_delivery_slips_en）。 */
  async seePrintEnButton() {
    await expect(this.printEnButton).toBeVisible();
    await expect(this.printEnButton).toContainText("納品書印刷（英語）");
  }

  /** 編集画面に受注行チェックボックスとヘッダ一括選択が表示されること（既定オン＝設計書「既定でオン」）。 */
  async seeRowCheckboxes() {
    await expect(this.checkAll).toBeVisible();
    await expect(this.rowCheckboxes.first()).toBeVisible();
    await expect(this.rowCheckboxes.first()).toBeChecked(); // 設計書: 各行先頭に既定でオン
  }

  /** form_bulk 内に一括出力ボタン群が並ぶこと（設計書: 一括用form_bulkに各出力ボタンが並ぶ）。 */
  async seeBulkButtons() {
    await expect(this.printPickingListButton).toBeVisible();
    await expect(this.printJaButton).toBeVisible();
    await expect(this.printEnButton).toBeVisible();
    await expect(this.orderExportButton).toBeVisible();
    await expect(this.labelsExportButton).toBeVisible();
  }

  /** 「納品書印刷（英語）」を押下する。 */
  async clickPrintEn() {
    await this.printEnButton.click();
  }

  /**
   * 既定オンのチェックを保持したまま英語印刷ボタンを押下し、開いた名前付き子ウィンドウ（newwin）を返す。
   * 仕様: 空ウィンドウを開き form_bulk を英語印刷URLへ POST する（利用者視点の入口・JS挙動）。
   */
  async clickPrintEnAndGetPopup(): Promise<Page> {
    const [popup] = await Promise.all([
      this.page.waitForEvent("popup"),
      this.clickPrintEn(),
    ]);
    await popup.waitForLoadState();
    return popup;
  }

  /** 全行のチェックを外す（エッジケース: order_ids が空になる前提）。 */
  async uncheckAllRows() {
    const count = await this.rowCheckboxes.count();
    for (let i = 0; i < count; i++) {
      await this.rowCheckboxes.nth(i).uncheck();
    }
  }

  /** 指定インデックスの受注行チェックを外す（一部解除の正常系用）。 */
  async uncheckRowAt(index: number) {
    await this.rowCheckboxes.nth(index).uncheck();
  }

  /**
   * ヘッダ一括選択（#check-all）を外す→全行が連動して外れる、戻す→全行が連動して入る、ことを確認する。
   * 仕様: ヘッダの#check-all は列一括選択と連動する（フロント挙動・表示要素）。
   */
  async seeCheckAllTogglesRows() {
    await expect(this.checkAll).toBeVisible();
    await this.checkAll.uncheck();
    const count = await this.rowCheckboxes.count();
    for (let i = 0; i < count; i++) {
      await expect(this.rowCheckboxes.nth(i)).not.toBeChecked();
    }
    await this.checkAll.check();
    for (let i = 0; i < count; i++) {
      await expect(this.rowCheckboxes.nth(i)).toBeChecked();
    }
  }

  /** 現在チェック中の受注行から order_ids（受注主キー）を収集する。 */
  async getCheckedOrderIds(): Promise<string[]> {
    return this.rowCheckboxes.evaluateAll((els) =>
      els
        .filter((el) => (el as HTMLInputElement).checked)
        .map((el) => (el as HTMLInputElement).getAttribute("name") || "")
        .map((n) => (n.match(/order_ids\[(\d+)\]/) || [])[1])
        .filter((v): v is string => !!v)
    );
  }

  /**
   * 「納品書印刷（英語）」を押下し、開いた名前付き子ウィンドウ（newwin）と
   * 子ウィンドウ内の印刷POST応答のHTTPステータスを返す（遷移観測。期待値は呼び出し側で判定）。
   * 仕様: 空ウィンドウを開き form_bulk を英語印刷URLへ POST → 子ウィンドウ内に応答（成功HTML/404）を表示する。
   */
  async clickPrintEnAndGetPopupResponse(): Promise<{ popup: Page; status: number }> {
    const popupPromise = this.page.waitForEvent("popup");
    await this.clickPrintEn();
    const popup = await popupPromise;
    const resp = await popup.waitForResponse((r) =>
      /\/standby\/\d+\/print\/delivery\/en/.test(r.url())
    );
    return { popup, status: resp.status() };
  }

  /**
   * 英語印刷URLへ order_ids（受注ID）を連想配列として POST する。
   * 仕様: order_ids は連想配列でキーが受注主キー（POST本文 order_ids[受注ID]）。
   */
  async requestPrintPost(
    id: number | string,
    orderIds: Array<number | string>,
    lang = "en"
  ): Promise<APIResponse> {
    const form: Record<string, string> = {};
    orderIds.forEach((oid) => {
      form[`order_ids[${oid}]`] = "on";
    });
    return this.page.request.post(this.printUrl(id, lang), { form });
  }

  /** 英語印刷URLへ GET（クエリ文字列を任意に付与）。 */
  async requestPrintGet(
    id: number | string,
    query = "",
    lang = "en"
  ): Promise<APIResponse> {
    return this.page.request.get(`${this.printUrl(id, lang)}${query}`);
  }

  /** 英語納品書ページのUI（タイトル・印刷ボタン）が仕様どおり表示されること。 */
  async seeSlipPage(popup: Page) {
    await expect(popup).toHaveTitle("納品書"); // delivery_slips.en.twig:19 <title>納品書</title>
    await expect(popup.locator("#printButton")).toBeVisible(); // 印刷する（trans admin.common.print）
  }
}
