import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 受注管理「納品書印刷（日本語）」Page Object（受注一覧の一括処理→新規ウィンドウHTML）。
 * 納品ケース表 integration_test/e2e/m05_09_admin_order_order_print_delivery_slips_ja_e2e_cases.md に対応。
 *
 * 期待結果は仕様（正本md functions/pf-eccube3/m05-09_admin_order_order_print_delivery_slips_ja.md／観点表）由来（オラクル独立性）。
 * 設計源は pf-eccube3 のリバースだが、刷新先 ec-cube-enterprise に同等画面が実在する（screenExists=true）。
 * 実装からはセレクタ（位置情報）のみを取り、合否は仕様で判定する。Form制約・実装の現挙動を期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * セレクタ根拠（ec-cube-enterprise 現行ソース file:line）:
 *  - 受注一覧ルート admin_order = /<route>/order（OrderController.php:136）
 *  - 「納品書印刷（日本語）」ボタン #printDeliverySlipsJp（Order/index.twig:1214）
 *      trans admin.order.print_delivery_slips_ja=「納品書印刷（日本語）」（messages.ja.yaml:2299）
 *  - 「納品書印刷（英語）」ボタン #printDeliverySlipsEn（Order/index.twig:1217 / messages.ja.yaml:2300）
 *  - 配送行チェックボックス input[id^="check_"] name=ids[]（Order/index.twig:1249）
 *  - 一括フォーム #form_bulk method=POST（Order/index.twig:1095）。JS: window.open('','newwin',…)→
 *      action=url(admin_delivery_slips_export,{lang:'ja'})→target=newwin→submit（Order/index.twig:170-176）
 *  - チェック無は alert("チェックボックスが選択されていません")（Order/index.twig:83-89,168-172）
 *  - 印刷ルート admin_delivery_slips_export = POST/GET /<route>/order/print/delivery_slips/{lang}
 *      （OrderController.php:731）。ids 非配列/空は NotFoundHttpException（OrderController.php:737-740）
 *  - 印刷HTML: <title>納品書</title>（delivery_slips.ja.twig:19）/ 見出し admin.delivery_slips_ja=「納品書」（:36 / messages.ja.yaml:2436）
 *  - 印刷画面 #printButton（delivery_slips.ja.twig:24）trans admin.common.print=「印刷する」（messages.ja.yaml:1467）→ window.print()（:5-9）
 */
export class OrderOrderPrintDeliverySlipsJaPage {
  readonly page: Page;
  readonly listUrl: string; // 受注一覧（操作起点）
  readonly printUrlJa: string; // 納品書印刷ルート（日本語）

  readonly printJaButton: Locator; // #printDeliverySlipsJp 「納品書印刷（日本語）」
  readonly printEnButton: Locator; // #printDeliverySlipsEn 「納品書印刷（英語）」
  readonly shippingCheckboxes: Locator; // input[id^="check_"] name=ids[]
  readonly formBulk: Locator; // #form_bulk
  // 注: 印刷画面の #printButton は新規ウィンドウ（popup）側DOMに属するため、ここ（親ページ）の
  //   Locatorは定義しない。spec側で popup.locator("#printButton") を直接使う（誤認防止・低指摘#7）。

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/order`;
    this.printUrlJa = `/${ECCUBE_ADMIN_ROUTE}/order/print/delivery_slips/ja`;

    this.printJaButton = page.locator("#printDeliverySlipsJp");
    this.printEnButton = page.locator("#printDeliverySlipsEn");
    this.shippingCheckboxes = page.locator('input[id^="check_"]');
    this.formBulk = page.locator("#form_bulk");
  }

  /** 受注一覧（納品書印刷の操作起点）を開く。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 印刷ルートへ ids 無しで直接アクセスし、応答を返す（404確認用）。 */
  async gotoPrintUrlWithoutIds() {
    return await this.page.goto(this.printUrlJa);
  }

  /** 先頭の配送行チェックボックスの value（配送ID＝ids[]値）を返す。 */
  async firstShippingId(): Promise<string | null> {
    return await this.shippingCheckboxes.first().getAttribute("value");
  }

  /** GETで妥当な配送ID配列（?ids[]=…）を直接渡して印刷ルートへアクセスし、応答を返す。 */
  async gotoPrintUrlWithIds(ids: string[]) {
    const qs = ids.map((id) => `ids[]=${encodeURIComponent(id)}`).join("&");
    return await this.page.goto(`${this.printUrlJa}?${qs}`);
  }

  /** 受注一覧に「納品書印刷（日本語）」ボタンが表示されること（仕様: 表示要素・操作起点）。 */
  async seePrintJaButton() {
    await expect(this.printJaButton).toBeVisible();
  }

  /** 受注一覧の配送行チェックボックス数を返す（シード依存の有無判定用）。 */
  async checkboxCount(): Promise<number> {
    return await this.shippingCheckboxes.count();
  }

  /** 先頭の配送行チェックボックスをチェックする。 */
  async checkFirstShipping() {
    await this.shippingCheckboxes.first().check();
  }

  /**
   * 「納品書印刷（日本語）」を押下し、開いた新規ウィンドウ（popup）を返す。
   * 仕様: window.open('','newwin')→#form_bulk action差替→target=newwin→submit。
   */
  async clickPrintJaAndGetPopup() {
    const popupPromise = this.page.context().waitForEvent("page");
    await this.printJaButton.click();
    const popup = await popupPromise;
    await popup.waitForLoadState();
    return popup;
  }
}
