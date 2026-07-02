import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 受注管理 メール一括通知／手動メール一括 Page Object
 * （一覧導線 / 一括手動メール入力画面 / 確認画面 の3面）。
 * 納品ケース表 integration_test/e2e/m05_06_admin_order_order_bulk_manual_mail_e2e_cases.md に対応。
 * 期待結果は仕様（正本 functions/pf-eccube3/m05-06_admin_order_order_bulk_manual_mail.md / 観点表 /
 * 移行先 ec-cube-enterprise messages.ja.yaml）由来（オラクル独立性）。実装の現挙動・Form制約値は期待値に流用しない。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`mail`（OrderManualMailAllType.php:106-109）由来の位置情報のみ。
 *
 * DOM id 根拠（ec-cube-enterprise 現行ソース・nl -ba 基準）:
 *  - 一覧 form_bulk → #form_bulk（index.twig:1095）
 *  - 一覧 配送行チェック → input[id^=check_]（index.twig:97）
 *  - 一覧「その他」ボタン → #otherDropDown（index.twig:1191 trans admin.order.other=「その他」messages.ja.yaml:5536）
 *  - 一覧「メール一括通知」リンク → #manualMailAll（index.twig:1196 trans admin.order.mail_bulk=「メール一括通知」messages.ja.yaml:2260）
 *  - 入力画面 テンプレ選択 → #mail_template（manual_mail_all.twig:81 form_row(form.template)）
 *  - 入力画面 件名 → #mail_subject（manual_mail_all.twig:82 form_row(form.subject)）
 *  - 入力画面 本文プレビュー → #mail_edit_box__body（manual_mail_all.twig:85）
 *  - 入力画面 送信先テーブル → #common_info_box（manual_mail_all.twig:101 admin.order.manual_mail_destination_info messages.ja.yaml:2515）
 *  - 入力画面 確認ボタン → button[name=mode][value=confirm] trans common.repeated_confirm=「確認」（manual_mail_all.twig:157-162 messages.ja.yaml:72）。テンプレ未確定で disabled（:161）
 *  - 入力画面 受注一覧へ戻る → trans admin.order.back_to_list=「受注一覧画面へ戻る」（manual_mail_all.twig:150 messages.ja.yaml:2516）
 *  - 確認画面 送信ボタン → #send_mail（manual_mail_all_confirm.twig:165 trans admin.order.mail_send=「送信」messages.ja.yaml:2345）
 *  - 確認画面 戻るリンク → trans admin.order.back_to_manual_mail_edit=「手動メール通知画面に戻る」（manual_mail_all_confirm.twig:156 messages.ja.yaml:2518）
 *  - 確認画面 本文プレビュー → pre（manual_mail_all_confirm.twig:97 previewBody）
 *  - 成功フラッシュ admin.order.mail_send_complete=「メールを送信しました。」（messages.ja.yaml:2346 / MailController.php:398）
 *  - 欠番エラー admin.order.mail_all.error.missing=「注文ID %s の注文情報を取得できませんでした。」（messages.ja.yaml:2519 / MailController.php:316-325）
 */
export class OrderOrderBulkManualMailPage {
  readonly page: Page;
  readonly listUrl: string; // 受注一覧
  readonly mailAllUrl: string; // 一括手動メール入力（テンプレ未選択）

  // 一覧導線
  readonly otherDropDown: Locator; // 「その他」ボタン
  readonly manualMailAllLink: Locator; // 「メール一括通知」リンク
  readonly bulkCheckboxes: Locator; // 配送行チェック input[id^=check_]
  readonly formBulk: Locator; // #form_bulk

  // 入力画面
  readonly templateSelect: Locator; // #mail_template
  readonly subject: Locator; // #mail_subject
  readonly bodyPreviewBox: Locator; // #mail_edit_box__body
  readonly destinationInfoBox: Locator; // #common_info_box
  readonly confirmButton: Locator; // 「確認」(mode=confirm)
  readonly backToListLink: Locator; // 「受注一覧画面へ戻る」

  // 確認画面
  readonly sendButton: Locator; // #send_mail「送信」(mode=complete)
  readonly backToEditLink: Locator; // 「手動メール通知画面に戻る」
  readonly confirmPreviewBody: Locator; // pre previewBody

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/order`;
    this.mailAllUrl = `/${ECCUBE_ADMIN_ROUTE}/order/manual_mail/mail_all`;

    this.otherDropDown = page.locator("#otherDropDown");
    this.manualMailAllLink = page.locator("#manualMailAll");
    this.bulkCheckboxes = page.locator('input[id^="check_"]');
    this.formBulk = page.locator("#form_bulk");

    this.templateSelect = page.locator("#mail_template");
    this.subject = page.locator("#mail_subject");
    this.bodyPreviewBox = page.locator("#mail_edit_box__body");
    this.destinationInfoBox = page.locator("#common_info_box");
    this.confirmButton = page.locator('button[name="mode"][value="confirm"]');
    this.backToListLink = page.getByRole("link", { name: "受注一覧画面へ戻る" });

    this.sendButton = page.locator("#send_mail");
    this.backToEditLink = page.getByRole("link", { name: "手動メール通知画面に戻る" });
    this.confirmPreviewBody = page.locator("pre");
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 入口URLへ ids[] 付きで直接アクセスする（入力画面 GET）。 */
  async gotoMailAll(shippingIds: Array<number | string>, templateId?: number | string) {
    const query = shippingIds.map((id) => `ids%5B%5D=${id}`).join("&");
    const base = templateId
      ? `${this.mailAllUrl}/${templateId}`
      : this.mailAllUrl;
    await this.page.goto(`${base}?${query}`);
  }

  /** ids 無しで入口URLへアクセスする（404 確認用）。 */
  async gotoMailAllWithoutIds() {
    await this.page.goto(this.mailAllUrl);
  }

  /** 一覧「その他」→「メール一括通知」を開く。 */
  async openOtherMenu() {
    await this.otherDropDown.click();
  }

  /** 一覧で「メール一括通知」を押す（未チェックなら alert・チェック済なら form_bulk を GET 送信）。 */
  async clickManualMailAll() {
    await this.manualMailAllLink.click();
  }

  /** 一覧導線（その他→メール一括通知リンク）が表示されること。 */
  async seeBulkMailEntry() {
    await this.openOtherMenu();
    await expect(this.manualMailAllLink).toBeVisible();
  }

  /** 入力画面のUI部品が仕様どおり表示されること。 */
  async seeInputForm() {
    await expect(this.templateSelect).toBeVisible();
    await expect(this.subject).toBeVisible();
    await expect(this.bodyPreviewBox).toBeVisible();
    await expect(this.destinationInfoBox).toBeVisible();
    await expect(this.confirmButton).toBeVisible();
    await expect(this.backToListLink).toBeVisible();
  }

  /** テンプレを選択する（change で別 templateId の入力画面へフルページ遷移する）。 */
  async selectTemplate(value: string) {
    await this.templateSelect.selectOption(value);
  }

  /** 件名を入力する。 */
  async fillSubject(value: string) {
    await this.subject.fill(value);
  }

  /** 入力画面で「確認」(mode=confirm) を押す。 */
  async submitConfirm() {
    await this.confirmButton.click();
  }

  /** 確認画面で「送信」(mode=complete) を押す。 */
  async submitSend() {
    await this.sendButton.click();
  }
}
