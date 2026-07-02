import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 会員管理「手動メール通知」Page Object（作成画面 / 確認画面）。
 * 納品ケース表 integration_test/e2e/m08_08_admin_customer_customer_manual_mail_e2e_cases.md に対応。
 * 期待結果は仕様(functions/pf-eccube3/m08-08_admin_customer_customer_manual_mail.md / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_customer_manual_mail`（CustomerManualMailType.php:93-95）由来の位置情報のみ。
 * 本機能は pf-eccube3(HareruyaEc) 出自のリバース設計であり、刷新先 ec-cube-enterprise コア（CustomerMailController::manual_mail）へ移載済み。
 *
 * DOM id / セレクタ根拠（ec-cube-enterprise 現行ソース）:
 *  - 作成/確認/送信URL → GET/POST /{admin_route}/customer/manual_mail/{id}/{template_id}（CustomerMailController.php:150）
 *  - カード見出し「手動メール通知」→ .card-title trans admin.customer.manual_mail（mail_manual.twig:43-45 / messages.ja.yaml:2536）
 *      ※設計の見出しは「手動メール送信」で文言乖離あり（不具合候補#4）。判定は構造要素でおこなう。
 *  - テンプレ select → #template-change（mail_manual.twig:67 で id 上書き。getBlockPrefix既定idではない）
 *  - 件名 → #admin_customer_manual_mail_mail_subject（mail_manual.twig:78 / TextType NotBlank）
 *  - 本文 → #admin_customer_manual_mail_body（mail_manual.twig:85 / TextareaType rows=20 NotBlank+TwigLint）
 *  - CSRFトークン → #admin_customer_manual_mail__token（form._token mail_manual.twig:37）
 *  - mode hidden → #mode（mail_manual.twig:38 / mail_manual_confirm.twig:35）
 *  - 「確認」ボタン → #confirm trans admin.common.confirm=「確認」（mail_manual.twig:102 / messages.ja.yaml:1448）
 *  - 「会員編集に戻る」リンク → trans admin.customer.back_to_customer_edit=「会員編集に戻る」（mail_manual.twig:96 / messages.ja.yaml:2531）
 *  - 確認画面「メール送信」ボタン → #complete trans admin.customer.mail_send=「メール送信」（mail_manual_confirm.twig:96 / messages.ja.yaml:2566）
 *  - 確認画面「戻る」リンク → #back（mail_manual_confirm.twig:91）
 *  - 検証エラー → form_errors（mail_manual.twig:79,86）＝bootstrap_4_horizontal_layout の .invalid-feedback（要実機確認）
 *  - 成功フラッシュ「メール送信が完了しました。」→ admin.customer.manual_mail.success（messages.ja.yaml:2614 / Controller:201 addSuccess）
 */
export class CustomerCustomerManualMailPage {
  readonly page: Page;

  // セレクタ（Twig 由来・位置情報のみ）
  readonly cardTitle: Locator; // .card-title（mail_manual.twig:43）
  readonly templateSelect: Locator; // #template-change（mail_manual.twig:67）
  readonly subject: Locator; // #admin_customer_manual_mail_mail_subject（mail_manual.twig:78）
  readonly body: Locator; // #admin_customer_manual_mail_body（mail_manual.twig:85）
  readonly token: Locator; // #admin_customer_manual_mail__token（mail_manual.twig:37）
  readonly modeHidden: Locator; // #mode（mail_manual.twig:38）
  readonly confirmButton: Locator; // 「確認」#confirm（mail_manual.twig:102）
  readonly backToEditLink: Locator; // 「会員編集に戻る」link（mail_manual.twig:96）
  readonly sendButton: Locator; // 確認画面「メール送信」#complete（mail_manual_confirm.twig:96）
  readonly confirmBackLink: Locator; // 確認画面「戻る」#back（mail_manual_confirm.twig:91）
  readonly error: Locator; // form_errors（.invalid-feedback 要実機確認）

  constructor(page: Page) {
    this.page = page;
    this.cardTitle = page.locator(".card-title");
    this.templateSelect = page.locator("#template-change");
    this.subject = page.locator("#admin_customer_manual_mail_mail_subject");
    this.body = page.locator("#admin_customer_manual_mail_body");
    this.token = page.locator("#admin_customer_manual_mail__token");
    this.modeHidden = page.locator("#mode");
    this.confirmButton = page.locator("#confirm");
    this.backToEditLink = page.getByRole("link", { name: "会員編集に戻る" });
    this.sendButton = page.locator("#complete");
    this.confirmBackLink = page.locator("#back");
    // form_errors の出力先クラスは bootstrap_4_horizontal_layout 依存。合否は仕様（NotBlank）で判定する。
    this.error = page.locator(".invalid-feedback, .text-danger");
  }

  /** 作成画面URL（GET）。テンプレ未指定 or テンプレID付き。 */
  manualMailUrl(customerId: number | string, templateId?: number | string): string {
    const base = `/${ECCUBE_ADMIN_ROUTE}/customer/manual_mail/${customerId}`;
    return templateId !== undefined && templateId !== null ? `${base}/${templateId}` : base;
  }

  /** 会員編集URL（戻る/送信後リダイレクト先 admin_customer_edit）。 */
  editUrlRe(customerId: number | string): RegExp {
    return new RegExp(`/${ECCUBE_ADMIN_ROUTE}/customer/${customerId}/edit(\\?|$)`);
  }

  /** 作成画面URLにマッチする正規表現（テンプレID有無を許容）。 */
  manualMailUrlRe(customerId: number | string): RegExp {
    return new RegExp(`/${ECCUBE_ADMIN_ROUTE}/customer/manual_mail/${customerId}(/\\d+)?(\\?|$)`);
  }

  /** 作成画面URL（テンプレID付き）に厳密マッチする正規表現。検証失敗/送信後の「同じ作成画面へ戻る」検証用（テンプレIDが落ちないこと）。 */
  manualMailUrlReWithTemplate(customerId: number | string, templateId: number | string): RegExp {
    return new RegExp(`/${ECCUBE_ADMIN_ROUTE}/customer/manual_mail/${customerId}/${templateId}(\\?|$)`);
  }

  /** 作成画面URL（テンプレIDなし＝会員IDのみ）に厳密マッチする正規表現。未選択へ戻すJS遷移（070）検証用。 */
  manualMailUrlReNoTemplate(customerId: number | string): RegExp {
    return new RegExp(`/${ECCUBE_ADMIN_ROUTE}/customer/manual_mail/${customerId}(\\?|$)`);
  }

  /** 会員一覧の操作メニューから当該会員の手動メールリンク（href基準・ラベル/ドロップダウンは要実機確認）。 */
  manualMailLinkInList(customerId: number | string): Locator {
    return this.page.locator(`a[href*="customer/manual_mail/${customerId}"]`).first();
  }

  async gotoManualMail(customerId: number | string, templateId?: number | string) {
    await this.page.goto(this.manualMailUrl(customerId, templateId));
  }

  /** テンプレを選択（mail_manual.twig:16-21 の JS が template_id 付きURLへ遷移する）。 */
  async selectTemplateByLabel(label: string) {
    await this.templateSelect.selectOption({ label });
    await this.page.waitForLoadState("networkidle");
  }

  async selectTemplateByValue(value: string) {
    await this.templateSelect.selectOption(value);
    await this.page.waitForLoadState("networkidle");
  }

  /** テンプレ選択を未選択（先頭の空選択肢）へ戻す（mail_manual.twig:16-21 の JS が会員IDのみURLへ遷移する）。 */
  async deselectTemplate() {
    await this.templateSelect.selectOption({ index: 0 });
    await this.page.waitForLoadState("networkidle");
  }

  async fillSubject(value: string) {
    await this.subject.fill(value);
  }

  async fillBody(value: string) {
    await this.body.fill(value);
  }

  /** 作成画面で「確認」を押す（mode=confirm で確認画面へ）。 */
  async clickConfirm() {
    await this.confirmButton.click();
  }

  /** 確認画面で「メール送信」を押す（mode=complete）。実メール送信・履歴INSERTの副作用あり。 */
  async clickSend() {
    await this.sendButton.click();
  }

  /**
   * 作成画面の「常時表示」UI部品が仕様どおり表示されること（見出し・テンプレ選択・確認ボタン・戻るリンク）。
   * 件名・本文欄は設計上テンプレート選択時のみ表示（functions/...md:79,140 エッジケース）のためここでは検証しない。
   * 件名・本文の表示はテンプレ選択後を seeMailFields()、未選択時の非表示は seeMailFieldsHidden() で別途検証する（オラクル独立性）。
   */
  async seeInputForm() {
    await expect(this.cardTitle).toBeVisible();
    await expect(this.templateSelect).toBeVisible();
    await expect(this.confirmButton).toBeVisible();
    await expect(this.backToEditLink).toBeVisible();
  }

  /** テンプレート選択時は件名・本文入力欄が表示されること（仕様: 本文textareaはテンプレ選択時のみ）。 */
  async seeMailFields() {
    await expect(this.subject).toBeVisible();
    await expect(this.body).toBeVisible();
  }

  /** テンプレート未選択時は件名・本文入力欄を表示しないこと（仕様エッジケース functions/...md:140）。 */
  async seeMailFieldsHidden() {
    await expect(this.subject).toBeHidden();
    await expect(this.body).toBeHidden();
  }

  /** 確認画面のUI部品が仕様どおり表示されること（送信ボタン）。 */
  async seeConfirmForm() {
    await expect(this.sendButton).toBeVisible();
  }

  /** 送信成功フラッシュ（仕様: 「メール送信が完了しました。」）が表示されること。 */
  async seeSuccessFlash() {
    await expect(this.page.locator("body")).toContainText("メール送信が完了しました。");
  }
}
