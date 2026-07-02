import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 受注管理 出荷指示「納品書印刷（日本語）」Page Object
 * （出荷指示リスト編集画面の一括処理→新規ウィンドウHTML）。
 * 納品ケース表 integration_test/e2e/m05_22_admin_order_order_shipping_standby_print_delivery_slips_ja_e2e_cases.md に対応。
 *
 * 期待結果は仕様（正本md functions/pf-eccube3/m05-22_..._ja.md／観点表）由来（オラクル独立性）。
 * 設計源は pf-eccube3 のリバースだが、刷新先 ec-cube-enterprise に同等画面が実在する（screenExists=true）。
 * 実装からはセレクタ（位置情報）のみを取り、合否は仕様で判定する。Form制約・実装の現挙動を期待値に流用しない。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * セレクタ根拠（ec-cube-enterprise 現行ソース file:line）:
 *  - 出荷指示リスト一覧ルート admin_shipping_standby = /<route>/standby/search（ShippingStandbyController.php:93-95）
 *  - 編集画面ルート admin_shipping_standby_edit = /<route>/standby/{id}/edit（同:152）
 *  - 印刷ルート admin_shipping_standby_print_delivery_slips = GET|POST /<route>/standby/{id}/print/delivery/{lang}（同:393）
 *      list null → NotFoundHttpException（同:397-399）／order_ids空 → 404（同:401-405）／配送集合空 → 404（同:425-427）
 *  - 「納品書印刷（日本語）」ボタン #printDeliverySlipsJp（edit.twig:120）
 *      trans admin.order.print_delivery_slips_ja=「納品書印刷（日本語）」（messages.ja.yaml:2299）
 *  - 一括フォーム #form_bulk method=POST（edit.twig:113）。JS: window.open('','newwin')→
 *      action=url(admin_shipping_standby_print_delivery_slips,{id,lang:'ja'})→target=newwin→submit（edit.twig:21-27）
 *  - 全選択チェック #check-all（edit.twig:142）／各行チェック name=order_ids[{id}] id=check-{id}（edit.twig:157、初期 checked）
 *  - 印刷HTML: <title>納品書</title>（delivery_slips.ja.twig:19）/ 見出し admin.delivery_slips_ja=「納品書」（:36 / messages.ja.yaml:2436）
 *  - 帳票項目: 注文番号 admin.delivery_slips_ja.order_number（:42 / messages.ja.yaml:2437）/ 送り主 admin.delivery_slips_ja.sender（:67 / messages.ja.yaml:2440）
 *  - 印刷画面 #printButton（delivery_slips.ja.twig:25）trans admin.common.print=「印刷する」（messages.ja.yaml:1467）→ window.print()（:5-9）
 */
export class OrderOrderShippingStandbyPrintDeliverySlipsJaPage {
  readonly page: Page;
  readonly listUrl: string; // 出荷指示リスト一覧（操作起点の検索画面）

  readonly printJaButton: Locator; // #printDeliverySlipsJp 「納品書印刷（日本語）」
  readonly checkAll: Locator; // #check-all 全選択
  readonly orderCheckboxes: Locator; // 各行 input name=order_ids[{id}]
  readonly formBulk: Locator; // #form_bulk
  // 注: 印刷画面の #printButton / <title>納品書 は新規ウィンドウ（popup）側DOMに属するため、
  //   親ページのLocatorは定義しない。spec側で popup.locator("#printButton") 等を直接使う（誤認防止）。

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/standby/search`;

    this.printJaButton = page.locator("#printDeliverySlipsJp");
    this.checkAll = page.locator("#check-all");
    this.orderCheckboxes = page.locator('input[type="checkbox"][name^="order_ids"]');
    this.formBulk = page.locator("#form_bulk");
  }

  /** 出荷指示リスト編集画面（印刷の操作起点）を開く。 */
  async gotoEdit(standbyId: string | number) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/standby/${standbyId}/edit`);
  }

  /** 出荷指示リスト一覧（検索画面）を開く。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 印刷ルートへ order_ids 無しで直接アクセスし、応答を返す（404確認用）。 */
  async gotoPrintUrlWithoutIds(standbyId: string | number) {
    return await this.page.goto(
      `/${ECCUBE_ADMIN_ROUTE}/standby/${standbyId}/print/delivery/ja`
    );
  }

  /** 編集画面に「納品書印刷（日本語）」ボタンが表示されること（仕様: 表示要素・操作起点）。 */
  async seePrintJaButton() {
    await expect(this.printJaButton).toBeVisible();
  }

  /** 編集画面一覧の受注行チェックボックス数を返す（シード依存の有無判定用）。 */
  async checkboxCount(): Promise<number> {
    return await this.orderCheckboxes.count();
  }

  /** 全受注行のチェックをオフにする（仕様: チェック無しを止める alert は実装されない）。 */
  async uncheckAllOrders() {
    const n = await this.orderCheckboxes.count();
    for (let i = 0; i < n; i++) {
      await this.orderCheckboxes.nth(i).uncheck();
    }
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
