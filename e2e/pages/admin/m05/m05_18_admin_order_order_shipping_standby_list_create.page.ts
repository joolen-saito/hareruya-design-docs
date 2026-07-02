import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 受注管理 出荷指示リスト作成（M05-18）Page Object。
 * 納品ケース表 integration_test/e2e/m05_18_admin_order_order_shipping_standby_list_create_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/pf-eccube3/m05-18_admin_order_order_shipping_standby_list_create.md / 観点表)の挙動由来（オラクル独立性）。
 * i18n リソース(messages.ja.yaml)の表示文言は実装由来のためオラクルにせず、主オラクルは観測挙動（遷移先URL・送信成否・要素存在）に置く。
 * pf-eccube3(HareruyaEc プラグイン)由来設計だが、刷新先 ec-cube-enterprise コアに同一画面・同一ルートが実在するためセレクタを導出した。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_generate_shipping_standby`（GenerateShippingStandbyType.php:62-64）由来の位置情報のみ。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 画面・ルート根拠:
 *  - 一覧(生成フォーム同居)画面 → GET admin_shipping_standby = /{admin_route}/standby/search（ShippingStandbyController.php:92-96 / @admin/ShippingStandby/index.twig）
 *  - 生成POST → admin_order_generate_standby_list = POST /{admin_route}/order/generate/standby（OrderController.php:786）
 *  - 成功/失敗とも admin_shipping_standby へ302（OrderController.php:806,817,822）
 *
 * DOM id 根拠（getBlockPrefix=admin_generate_shipping_standby）:
 *  - 生成フォーム        → #generate_form（index.twig:44 action=admin_order_generate_standby_list）
 *  - 折りたたみトグル/枠  → a[href="#generateList"]（index.twig:55）/ #generateList（index.twig:58 collapse）
 *  - カード見出し「生成」 → #generate_form .card-title（index.twig:52）trans admin.order.shipping_standby_generate_list（messages.ja.yaml:2477）
 *  - 注文番号 始端/終端   → #admin_generate_shipping_standby_order_id_from（index.twig:68）/ #admin_generate_shipping_standby_order_id_to（index.twig:73）
 *  - 注文日時 始端/終端   → #admin_generate_shipping_standby_order_date_from（index.twig:87）/ #admin_generate_shipping_standby_order_date_to（index.twig:92）
 *  - 区切り「〜」         → span trans admin.common.separator__range（index.twig:71,90 / messages.ja.yaml:1534）
 *  - 送信ボタン「生成」   → #generate_form button[type="submit"]（index.twig:100）trans 同上
 *  ※ フラッシュ領域は default_frame 側の共通テンプレートで出力先クラスが要実機確認のため専用セレクタを創作せず、
 *    spec では本文テキストの存在で確認する（成功 admin.common.save_complete:1398 / 失敗 admin.common.save_error:1399）。
 *    フラッシュ文言は i18n 由来のため主オラクルにせず、主オラクルは「成功時のみ永続化／遷移先URL」に置く（要確認）。
 */
export class OrderOrderShippingStandbyListCreatePage {
  readonly page: Page;
  readonly listUrl: string; // 生成フォームが同居する出荷指示一覧 GET /{admin_route}/standby/search

  readonly generateForm: Locator;
  readonly collapseToggle: Locator;
  readonly collapseArea: Locator;
  readonly cardTitle: Locator;

  readonly orderIdFrom: Locator;
  readonly orderIdTo: Locator;
  readonly orderDateFrom: Locator;
  readonly orderDateTo: Locator;

  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/standby/search`;

    this.generateForm = page.locator("#generate_form");
    this.collapseToggle = page.locator('a[href="#generateList"]');
    this.collapseArea = page.locator("#generateList");
    this.cardTitle = page.locator("#generate_form .card-title");

    this.orderIdFrom = page.locator("#admin_generate_shipping_standby_order_id_from");
    this.orderIdTo = page.locator("#admin_generate_shipping_standby_order_id_to");
    this.orderDateFrom = page.locator("#admin_generate_shipping_standby_order_date_from");
    this.orderDateTo = page.locator("#admin_generate_shipping_standby_order_date_to");

    this.submitButton = page.locator('#generate_form button[type="submit"]');
  }

  /** 生成フォームが同居する出荷指示一覧を開く（GET admin_shipping_standby）。 */
  async goto() {
    await this.page.goto(this.listUrl);
  }

  /** 生成カードの折りたたみ（#generateList）を開く。既に開いていれば何もしない。 */
  async expandGenerateForm() {
    if (!(await this.collapseArea.evaluate((el) => el.classList.contains("show")))) {
      await this.collapseToggle.first().click();
      await expect(this.collapseArea).toBeVisible();
    }
  }

  /** 生成条件を入力して送信（未指定欄は触らない）。 */
  async submitGenerate(opts: {
    orderIdFrom?: string;
    orderIdTo?: string;
    orderDateFrom?: string;
    orderDateTo?: string;
  } = {}) {
    await this.expandGenerateForm();
    if (opts.orderIdFrom !== undefined) await this.orderIdFrom.fill(opts.orderIdFrom);
    if (opts.orderIdTo !== undefined) await this.orderIdTo.fill(opts.orderIdTo);
    if (opts.orderDateFrom !== undefined) await this.orderDateFrom.fill(opts.orderDateFrom);
    if (opts.orderDateTo !== undefined) await this.orderDateTo.fill(opts.orderDateTo);
    await this.submitButton.click();
  }

  /** 生成カードの主要UI部品（見出し「生成」・送信ボタン）が仕様どおり表示されること。 */
  async seeGenerateCard() {
    await expect(this.cardTitle).toContainText("生成");
    await expect(this.submitButton).toBeVisible();
  }

  /** 注文番号レンジの入力欄（始端・終端）が表示されること。 */
  async seeOrderIdRange() {
    await expect(this.orderIdFrom).toBeVisible();
    await expect(this.orderIdTo).toBeVisible();
  }

  /** 注文日時レンジの入力欄（始端・終端）が表示されること。 */
  async seeOrderDateRange() {
    await expect(this.orderDateFrom).toBeVisible();
    await expect(this.orderDateTo).toBeVisible();
  }
}
