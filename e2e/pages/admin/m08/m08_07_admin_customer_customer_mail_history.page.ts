import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 会員管理 メール送信履歴（M08-07）Page Object。
 * 納品ケース表 integration_test/e2e/m08_07_admin_customer_customer_mail_history_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/pf-eccube3/m08-07_admin_customer_customer_mail_history.md / 観点表)の挙動由来（オラクル独立性）。
 * pf-eccube3(HareruyaEcプラグイン)由来設計だが、刷新先 ec-cube-enterprise に同一画面
 * (route admin_customer_mail_history / Customer/mail_history.twig)が実在するためセレクタを導出した。
 * セレクタは Twig＋Symfony Form 由来の位置情報のみ。合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * URL: route admin_customer_mail_history = /%eccube_admin_route%/customer/mail/{id}/history
 *      （CustomerMailController.php:116。設計表記 /customer/{id}/mail_history とはパス構造が異なる＝不具合候補#1）。
 *
 * DOM id 根拠（src/Eccube/Resource/template/admin/Customer/mail_history.twig
 *  / Form/Type/Admin/CustomerMailHistoryType.php / Controller/Admin/Customer/CustomerMailController.php）:
 *  - フォーム            → #mail-history-form（twig:36 method=get action=admin_customer_mail_history）
 *  - テンプレート絞り込み → #template-change（twig:44 form_widget(form.mailTemplate,{'id':'template-change'})。
 *                          getBlockPrefix='admin_customer_mail_history'（Type.php:49-51）。GETクエリ名は admin_customer_mail_history[mailTemplate]。
 *                          change で #mail-history-form を submit（twig:12-16）。required=false（Type.php:33））
 *  - 絞り込みラベル       → trans admin.order.mail_template「テンプレート」（twig:40 / messages.ja.yaml:2343）
 *  - カード見出し         → .card-title（twig:29-31 trans admin.customer.send_mail_history「メール配信履歴」/ messages.ja.yaml:2567。設計名は「メール送信履歴」＝不具合候補#2）
 *  - 一覧テーブル         → table.table（twig:52）
 *  - 列見出し(送信日/通知メール/件名) → th（twig:54-56 trans admin.common.send_date:1660 / admin.common.mail_template.mail_subject:1661 / admin.common.mail_subject:1662）
 *  - 履歴行              → tbody tr（twig:58-86 for MailHistories）。並び順オラクルは設計の「新しい順＝送信日時(send_date)降順」(m08-07.md:92,132)で判定し、
 *                          実装の findBy ['id'=>'DESC']（CustomerMailController.php:135-137）はオラクルにしない（id DESC と send_date DESC はズレ得る＝不具合候補#7）
 *  - テンプレート無し表示  → trans admin.customer.not_mail_template「テンプレート無し」（twig:65 / messages.ja.yaml:2568）
 *  - 件名リンク(本文モーダル起動) → a.btn-link（twig:68 data-bs-target=#mailhistorybody_{id}）
 *  - 本文モーダル         → .modal[id^="mailhistorybody_"]（twig:69-83）本文 p（twig:74-76）
 *  - モーダル閉じる        → button[data-bs-dismiss="modal"]（twig:79 trans common.close「閉じる」/ messages.ja.yaml:14）
 *  - 戻るリンク           → a.c-baseLink（twig:101 url admin_customer_edit）span trans admin.customer.customer_registration「会員登録」（twig:103 / messages.ja.yaml:2530）
 */
export class CustomerCustomerMailHistoryPage {
  readonly page: Page;

  readonly searchForm: Locator; // #mail-history-form（twig:36）
  readonly templateSelect: Locator; // #template-change（twig:44）
  readonly cardTitle: Locator; // .card-title（twig:29-31）
  readonly historyTable: Locator; // table.table（twig:52）
  readonly headerCells: Locator; // thead th（twig:54-56）
  readonly historyRows: Locator; // tbody tr（twig:58-86）
  readonly subjectLinks: Locator; // a.btn-link（twig:68）
  readonly bodyModal: Locator; // .modal[id^="mailhistorybody_"]（twig:69）
  readonly modalCloseButton: Locator; // button[data-bs-dismiss=modal]（twig:79）
  readonly backLink: Locator; // a.c-baseLink（twig:101）

  constructor(page: Page) {
    this.page = page;
    this.searchForm = page.locator("#mail-history-form");
    this.templateSelect = page.locator("#template-change");
    this.cardTitle = page.locator(".card-title");
    this.historyTable = page.locator("table.table");
    this.headerCells = page.locator("table.table thead th");
    this.historyRows = page.locator("table.table tbody tr");
    this.subjectLinks = page.locator("table.table tbody a.btn-link");
    this.bodyModal = page.locator('.modal[id^="mailhistorybody_"]');
    this.modalCloseButton = this.bodyModal.locator('button[data-bs-dismiss="modal"]');
    this.backLink = page.locator("a.c-baseLink");
  }

  /** メール送信履歴画面（任意で mailTemplate 絞り込み付き）を表示する。HTTPレスポンスを返す。 */
  async goto(customerId: string | number, mailTemplateId?: string | number) {
    const base = `/${ECCUBE_ADMIN_ROUTE}/customer/mail/${customerId}/history`;
    const url =
      mailTemplateId !== undefined
        ? `${base}?${encodeURIComponent("admin_customer_mail_history[mailTemplate]")}=${mailTemplateId}`
        : base;
    return this.page.goto(url);
  }

  /** テンプレートを選択する（change で GET 自動送信＝絞り込み）。 */
  async selectTemplate(value: string) {
    await this.templateSelect.selectOption(value);
  }

  /** index 番目の件名リンクを押下し本文を開く。 */
  async openBody(index = 0) {
    await this.subjectLinks.nth(index).click();
  }

  /** 各履歴行の送信日セル（1列目）テキストを上から順に返す。新しい順（業務ルール）検証用。 */
  async getSendDateTexts(): Promise<string[]> {
    return this.historyRows.locator("td:nth-child(1)").allInnerTexts();
  }

  /** 各履歴行のテンプレート列（2列目）テキストを返す。絞り込み一貫性（当該テンプレートのみ）検証用。 */
  async getTemplateCellTexts(): Promise<string[]> {
    return this.historyRows.locator("td:nth-child(2)").allInnerTexts();
  }

  /** 絞り込みセレクトで現在選択中の option ラベルを返す。
   *  業務ルール「当該テンプレートの履歴のみ表示」(m08-07.md:93)の照合（表示テンプレ列＝選択ラベル）に使う。 */
  async getSelectedTemplateLabel(): Promise<string> {
    return (await this.templateSelect.locator("option:checked").innerText()).trim();
  }

  /** 一覧の見出し・絞り込みセレクトが仕様どおり表示されること。 */
  async seeListLayout() {
    await expect(this.templateSelect).toBeVisible();
    await expect(this.historyTable).toBeVisible();
    await expect(this.headerCells).toHaveCount(3); // 送信日 / 通知メール / 件名（twig:54-56）
  }
}
