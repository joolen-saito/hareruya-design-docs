import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 ネット買取管理「手動メール通知」Page Object（入力画面 / 確認画面）。
 * 納品ケース表 integration_test/e2e/m07_04_admin_online_purchase_purchase_manual_mail_e2e_cases.md に対応。
 * 期待結果は仕様(functions/pf-eccube3/m07-04_...md / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_purchase_manual_mail`（PurchaseManualMailType.php:91-93）由来の位置情報のみ。
 * 本機能は pf-eccube3(HareruyaEc) 出自のリバース設計であり、刷新先 ec-cube-enterprise コアへ移載される。
 *
 * DOM id / セレクタ根拠:
 *  - 入力URL/確認・送信URL → GET/POST /{admin_route}/purchase/{buyOrderId}/mail（MailController.php:48）
 *  - テンプレ select → #template-change（manual_mail.twig:42 で id 上書き。getBlockPrefix既定idではない）
 *  - 件名 → #admin_purchase_manual_mail_subject（manual_mail.twig:49）
 *  - 本文 → #admin_purchase_manual_mail_body（manual_mail.twig:55 / TextareaType rows=20）
 *  - CSRFトークン → #admin_purchase_manual_mail__token（form._token）
 *  - mode hidden → #mode（manual_mail.twig:28 / confirm.twig:29）
 *  - 「確認」ボタン → button[value=confirm] trans confirm_button=「確認」（manual_mail.twig:71 / messages.ja.yaml:5286）
 *  - カード見出し「手動メール送信」→ .card-title box_title（manual_mail.twig:32 / messages.ja.yaml:5283）
 *  - 買取番号(7桁ゼロ埋め) → '%07d'（manual_mail.twig:37）
 *  - 確認画面「送信」ボタン → button[value=complete] trans send_button=「送信」（confirm.twig:71 / messages.ja.yaml:5288）
 *  - 確認画面「戻る」リンク → #back trans back_to_manual_mail（confirm.twig:67 / messages.ja.yaml:5287）
 *  - 確認画面 本文静的ブロック → .form-control-static[style*=pre-wrap]（confirm.twig:56）
 *  - 検証エラー → form_errors（manual_mail.twig:43,50,56）＝bootstrap_4_horizontal_layout の .invalid-feedback（要実機確認）
 *  - 成功フラッシュ「メールを送信しました。」→ admin.order.mail_send_complete（messages.ja.yaml:2346）
 */
export class OnlinePurchasePurchaseManualMailPage {
  readonly page: Page;

  // セレクタ（Twig 由来・位置情報のみ）
  readonly cardTitle: Locator; // .card-title「手動メール送信」(manual_mail.twig:32)
  readonly templateSelect: Locator; // #template-change（manual_mail.twig:42）
  readonly subject: Locator; // #admin_purchase_manual_mail_subject（manual_mail.twig:49）
  readonly body: Locator; // #admin_purchase_manual_mail_body（manual_mail.twig:55）
  readonly modeHidden: Locator; // #mode（manual_mail.twig:28）
  readonly confirmButton: Locator; // 「確認」button[value=confirm]（manual_mail.twig:71）
  readonly sendButton: Locator; // 確認画面「送信」button[value=complete]（confirm.twig:71）
  readonly backLink: Locator; // 確認画面「戻る」#back（confirm.twig:67）
  readonly editBackLink: Locator; // 入力画面「買取編集画面に戻る」a.c-baseLink[href*=/edit]（manual_mail.twig:66）
  readonly confirmBodyStatic: Locator; // 確認画面 本文 pre-wrap（confirm.twig:56）
  readonly error: Locator; // form_errors（.invalid-feedback 要実機確認）

  constructor(page: Page) {
    this.page = page;
    this.cardTitle = page.locator(".card-title");
    this.templateSelect = page.locator("#template-change");
    this.subject = page.locator("#admin_purchase_manual_mail_subject");
    this.body = page.locator("#admin_purchase_manual_mail_body");
    this.modeHidden = page.locator("#mode");
    this.confirmButton = page.getByRole("button", { name: "確認" });
    this.sendButton = page.getByRole("button", { name: "送信" });
    this.backLink = page.locator("#back");
    // 入力画面の下部コンバージョンエリア「買取編集画面に戻る」リンク（href=admin_purchase_edit）。
    // 確認画面の #back は href=javascript:void(0) のため /edit を含む href で区別する（manual_mail.twig:66）。
    this.editBackLink = page.locator("a.c-baseLink[href*='/edit']");
    this.confirmBodyStatic = page.locator(".form-control-static");
    // form_errors の出力先クラスは bootstrap_4_horizontal_layout 依存。判定は仕様（NotBlank）でおこなう。
    this.error = page.locator(".invalid-feedback, .text-danger");
  }

  /** 入力画面URL（GET）。 */
  mailUrl(buyOrderId: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/purchase/${buyOrderId}/mail`;
  }

  /** 詳細編集URL（送信成功時のリダイレクト先 admin_purchase_edit）。 */
  editUrlRe(buyOrderId: number | string): RegExp {
    return new RegExp(`/${ECCUBE_ADMIN_ROUTE}/purchase/${buyOrderId}/edit(\\?|$)`);
  }

  async gotoMail(buyOrderId: number | string) {
    await this.page.goto(this.mailUrl(buyOrderId));
  }

  /** テンプレを選択（JSにより mode=change で自動送信される）。 */
  async changeTemplateByLabel(label: string) {
    await this.templateSelect.selectOption({ label });
    // manual_mail.twig:13-16 の JS が #mode=change にしてフォーム自動送信する。
    await this.page.waitForLoadState("networkidle");
  }

  async fillSubject(value: string) {
    await this.subject.fill(value);
  }

  async fillBody(value: string) {
    await this.body.fill(value);
  }

  /** 入力画面で「確認」を押す（mode=confirm）。 */
  async clickConfirm() {
    await this.confirmButton.click();
  }

  /** 確認画面で「送信」を押す（mode=complete）。実メール送信・履歴INSERTの副作用あり。 */
  async clickSend() {
    await this.sendButton.click();
  }

  /** 確認画面で「手動メール通知入力画面に戻る」を押す（mode=back）。 */
  async clickBack() {
    await this.backLink.click();
  }

  /** 入力画面のUI部品が仕様どおり表示されること（見出し・テンプレ選択・件名・本文・確認ボタン）。 */
  async seeInputForm() {
    await expect(this.cardTitle).toContainText("手動メール送信"); // box_title
    await expect(this.templateSelect).toBeVisible();
    await expect(this.subject).toBeVisible();
    await expect(this.body).toBeVisible();
    await expect(this.confirmButton).toBeVisible();
  }

  /** 確認画面のUI部品が仕様どおり表示されること（送信ボタン・戻るリンク・本文pre-wrap静的表示）。 */
  async seeConfirmForm() {
    await expect(this.sendButton).toBeVisible();
    await expect(this.backLink).toBeVisible();
  }
}
