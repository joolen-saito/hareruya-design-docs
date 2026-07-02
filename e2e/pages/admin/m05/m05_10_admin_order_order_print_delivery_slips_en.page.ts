import { APIResponse, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 受注管理「納品書印刷（英語）」Page Object。
 * 納品ケース表 integration_test/e2e/m05_10_admin_order_order_print_delivery_slips_en_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 【screenExists=true】刷新先 ec-cube-enterprise に本機能は実在する。
 *  - ルート admin_delivery_slips_export = GET,POST /<route>/order/print/delivery_slips/{lang}
 *      （lang=ja|en, OrderController.php:731）。ids が配列でない/空なら NotFoundHttpException＝HTTP404
 *      （OrderController.php:737-741）。en は delivery_slips.en.twig をレンダリング（:746）。
 *  - 入口は受注一覧 admin_order = /<route>/order（OrderController.php:136）。
 *
 * 期待結果は仕様（正本md functions/pf-eccube3/m05-10_admin_order_order_print_delivery_slips_en.md /
 *   設計HTML / テスト観点表）由来（オラクル独立性）。実装の現挙動・JS詳細は期待値に流用しない。
 * セレクタは Twig（DOM id）由来の位置情報のみ（file:line を併記）。創作セレクタは置かない。
 * 期待表示文言は設計書本文由来とし、messages.ja.yaml の翻訳値は固定オラクルにしない（オラクル独立性）。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 */
export class OrderOrderPrintDeliverySlipsEnPage {
  readonly page: Page;
  readonly listUrl: string; // 受注一覧（入口）admin_order

  // --- 受注一覧（入口）の要素 ---
  readonly formBulk: Locator; // 一括処理フォーム（index.twig:1095 id=form_bulk）
  readonly printEnButton: Locator; // 「納品書印刷（英語）」（セレクタ根拠 index.twig:1217 id=printDeliverySlipsEn）。表示文言は設計書「『納品書印刷（英語）』ボタン」由来
  readonly toggleCheckAll: Locator; // 一覧ヘッダ 全選択（index.twig:1231 id=toggle_check_all name=filter）
  readonly rowCheckboxes: Locator; // 各配送行チェック（index.twig:1249 name="ids[]" id=check_{Shipping.id}）

  // --- 英語納品書ページ（delivery_slips.en.twig）の要素 ---
  readonly slipPrintButton: Locator; // 「印刷する」（セレクタ根拠 delivery_slips.en.twig:24 id=printButton）。表示文言は設計書「共通印刷ボタン」由来

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/order`;

    this.formBulk = page.locator("#form_bulk");
    this.printEnButton = page.locator("#printDeliverySlipsEn");
    this.toggleCheckAll = page.locator("#toggle_check_all");
    this.rowCheckboxes = page.locator('input[name="ids[]"]');

    this.slipPrintButton = page.locator("#printButton");
  }

  /** 英語納品書の印刷URL（lang は経路パラメータ。requirements lang=ja|en）。 */
  printUrl(lang = "en"): string {
    return `/${ECCUBE_ADMIN_ROUTE}/order/print/delivery_slips/${lang}`;
  }

  /** 受注一覧（入口）を開く。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 受注一覧に英語印刷ボタンが仕様どおり表示されること（trans admin.order.print_delivery_slips_en）。 */
  async seePrintEnButton() {
    await expect(this.printEnButton).toBeVisible();
    await expect(this.printEnButton).toContainText("納品書印刷（英語）");
  }

  /** 先頭の配送行チェックボックスをオンにする（チェック済み正常系の前提）。 */
  async checkFirstShipping() {
    await this.rowCheckboxes.first().check();
  }

  /** 「納品書印刷（英語）」を押下する。 */
  async clickPrintEn() {
    await this.printEnButton.click();
  }

  /**
   * 配送行を1件チェックして英語印刷ボタンを押下し、開いた名前付き子ウィンドウ（newwin）を返す。
   * 仕様: チェック済みのとき空ウィンドウを開きフォームを英語印刷URLへPOSTする（利用者視点の入口・JS挙動）。
   */
  async clickPrintEnAndGetPopup(): Promise<Page> {
    await this.checkFirstShipping();
    const [popup] = await Promise.all([
      this.page.waitForEvent("popup"),
      this.clickPrintEn(),
    ]);
    await popup.waitForLoadState();
    return popup;
  }

  /**
   * 未チェックのまま英語印刷ボタンを押下し、表示された alert 文言を返す。
   * 仕様: 未チェック時はアラートを出して送信しない（preventIfNoCheckedBulkTarget / 一覧に留まる）。
   */
  async clickPrintEnExpectAlert(): Promise<string> {
    let message = "";
    this.page.once("dialog", async (dialog) => {
      message = dialog.message();
      await dialog.dismiss();
    });
    await this.clickPrintEn();
    // alert を確実に処理させるための短いアイドル待ち。
    await this.page.waitForTimeout(200);
    return message;
  }

  /** 英語印刷URLへ ids 配列を付けて POST する（セッションCookieは context 共有）。 */
  async requestPrintEnPost(ids: Array<number | string>): Promise<APIResponse> {
    const form: Record<string, string> = {};
    ids.forEach((id, i) => {
      form[`ids[${i}]`] = String(id);
    });
    return this.page.request.post(this.printUrl("en"), { form });
  }

  /** 英語印刷URLへ GET（クエリ文字列を任意に付与）。 */
  async requestPrintEnGet(query = ""): Promise<APIResponse> {
    return this.page.request.get(`${this.printUrl("en")}${query}`);
  }

  /** 英語納品書ページのUI（印刷ボタン・タイトル）が仕様どおり表示されること。 */
  async seeSlipPage(popup: Page) {
    await expect(popup).toHaveTitle("納品書"); // delivery_slips.en.twig:19 <title>納品書</title>
    await expect(popup.locator("#printButton")).toBeVisible(); // 印刷する
  }
}
