import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 受注詳細メール通知 Page Object（編集画面＋確認画面）。
 * 納品ケース表 integration_test/e2e/m05_15_admin_order_order_mail_e2e_cases.md に対応。
 *
 * 期待結果は仕様(設計書 functions/ec-cube-enterprise/m05-15_admin_order_order_mail.md / 観点表 /
 * messages.ja.yaml / validators.ja.yaml)由来（オラクル独立性）。本Page Objectが保持するのは
 * Twig＋Symfony Form 由来のセレクタ（位置情報）のみで、必須/最大長などの制約は期待値に流用しない
 * （制約の正は設計書・観点表）。刷新先 ec-cube-enterprise に同一画面が存在する（route=admin_order_mail）。
 *
 * 画面・ルート（MailController.php:68-69 / requirements id=\d+）:
 *   GET  /%admin%/order/{id}/mail   メール通知 編集画面（存在しない受注は param converter で HTTP404）
 *   POST /%admin%/order/{id}/mail   mode(change/confirm/complete/back) に応じて再描画・確認・送信
 *
 * DOM id 根拠: Symfony Form getBlockPrefix=`admin_order_mail`（OrderMailType.php:71-74）。
 *  - フォーム        → #order-mail-form（mail.twig:90 / mail_confirm.twig:81）
 *  - 隠し mode       → #mode（mail.twig:92 / mail_confirm.twig:83）
 *  - テンプレート select → #template-change（mail.twig:110 で id 上書き。name=admin_order_mail[template]）
 *  - 件名 mail_subject  → #admin_order_mail_mail_subject（mail.twig:122 form_widget）
 *  - 本文 tpl_data(hidden textarea) → #admin_order_mail_tpl_data（mail.twig:132 / JS :42 で参照）
 *  - 本文 ace エディタ → #editor（mail.twig:131。ace 内部入力は要実機確認）
 *  - 「送信内容を確認」ボタン → button[name=mode][value=confirm] trans admin.order.mail_confirm=「送信内容を確認」（mail.twig:151 / messages.ja.yaml:2342）
 *  - 「受注登録」リンク → a→admin_order_edit trans admin.order.order_registration=「受注登録」（mail.twig:145 / messages.ja.yaml:2256）
 *  - 送信先カード見出し「メール送信先」trans admin.order.mail_destination_info（mail.twig:56 / messages.ja.yaml:2340）
 *  - メール内容カード見出し「メール内容」trans admin.order.mail_mail_info（mail.twig:97 / messages.ja.yaml:2341）
 *  - 件名 必須バッジ admin.common.required=「必須」（mail.twig:119）
 *  - ツールチップ（title 属性）: 送信先 tooltip.order.mail_destination_info（mail.twig:56）/ テンプレ tooltip.order.mail_template（mail.twig:105）/ 件名 tooltip.order.mail_subject（mail.twig:116）
 *  - 件名エラー form_errors(form.mail_subject)（mail.twig:123）/ 本文エラー form_errors(form.tpl_data)（mail.twig:133）/ テンプレエラー form_errors(form.template)（mail.twig:111）
 *  - エラー表示領域（flash addError）→ .alert-danger（@admin/alert.twig）
 * 確認画面（mail_confirm.twig）:
 *  - 「メール通知」戻るリンク → #back trans admin.order.mail=「メール通知」（mail_confirm.twig:125 / messages.ja.yaml:2259）
 *  - 「送信」ボタン → button[name=mode][value=complete] trans admin.order.mail_send=「送信」（mail_confirm.twig:130 / messages.ja.yaml:2345）
 * 送信完了フラッシュ（遷移先 受注編集画面）: admin.order.mail_send_complete=「メールを送信しました。」（messages.ja.yaml:2346）→ .alert-success
 */
export class OrderOrderMailPage {
  readonly page: Page;

  // 受注編集画面（入口：メール送信履歴ブロック）
  readonly createMailLink: Locator; // 「メールを作成」→ admin_order_mail（edit.twig:1872）

  // 編集画面（mail.twig）
  readonly form: Locator; // #order-mail-form
  readonly modeInput: Locator; // #mode（hidden）
  readonly destinationCard: Locator; // 「メール送信先」カード見出し
  readonly destinationBody: Locator; // #mailTo（送信先カード本体・各参照項目）
  readonly destinationToggle: Locator; // 送信先カードの折りたたみトグル（mail.twig:58）
  readonly mailInfoCard: Locator; // 「メール内容」カード見出し
  readonly mailInfoBody: Locator; // #mailCreate（メール内容カード本体・mail.twig:101）
  readonly mailInfoToggle: Locator; // メール内容カードの折りたたみトグル（mail.twig:98）
  readonly templateSelect: Locator; // #template-change（テンプレ選択 / change で自動送信）
  readonly subjectInput: Locator; // #admin_order_mail_mail_subject（件名・必須）
  readonly subjectRequiredBadge: Locator; // 件名「必須」バッジ
  readonly bodyEditor: Locator; // #editor（ace。入力は要実機確認）
  readonly bodyTextarea: Locator; // #admin_order_mail_tpl_data（hidden 実体）
  readonly confirmButton: Locator; // 「送信内容を確認」
  readonly orderRegistrationLink: Locator; // 「受注登録」リンク → 受注編集画面
  readonly errorAlert: Locator; // .alert-danger（テンプレ本文読込失敗等）
  readonly subjectError: Locator; // 件名欄直下のエラー
  readonly bodyError: Locator; // 本文欄直下のエラー

  // 確認画面（mail_confirm.twig）
  readonly backLink: Locator; // #back（「メール通知」へ戻る）
  readonly sendButton: Locator; // 「送信」（mode=complete）
  readonly confirmBody: Locator; // #detail_box__tpl_data（本文を nl2br で確認表示・mail_confirm.twig:113-114）

  // 遷移先 受注編集画面
  readonly successFlash: Locator; // .alert-success（メールを送信しました。）

  constructor(page: Page) {
    this.page = page;

    this.createMailLink = page.getByRole("link", { name: "メールを作成" });

    this.form = page.locator("#order-mail-form");
    this.modeInput = page.locator("#mode");
    this.destinationCard = page.locator(".card-title", { hasText: "メール送信先" });
    this.destinationBody = page.locator("#mailTo");
    this.destinationToggle = page.locator('a[data-bs-toggle="collapse"][href="#mailTo"]');
    this.mailInfoCard = page.locator(".card-title", { hasText: "メール内容" });
    this.mailInfoBody = page.locator("#mailCreate");
    this.mailInfoToggle = page.locator('a[data-bs-toggle="collapse"][href="#mailCreate"]');
    this.templateSelect = page.locator("#template-change");
    this.subjectInput = page.locator("#admin_order_mail_mail_subject");
    this.subjectRequiredBadge = page.locator(".badge", { hasText: "必須" });
    this.bodyEditor = page.locator("#editor");
    this.bodyTextarea = page.locator("#admin_order_mail_tpl_data");
    this.confirmButton = page.locator('#order-mail-form button[name="mode"][value="confirm"]');
    this.orderRegistrationLink = page.getByRole("link", { name: "受注登録" });
    this.errorAlert = page.locator(".alert-danger");
    // 件名/本文の項目エラーは各 form_errors() 出力。位置は col 内のため bootstrap の .invalid-feedback / .text-danger を用いる（要実機確認）。
    this.subjectError = page.locator("#admin_order_mail_mail_subject ~ .invalid-feedback, #admin_order_mail_mail_subject ~ .text-danger");
    this.bodyError = page.locator("#detail_box__tpl_data .invalid-feedback, #detail_box__tpl_data .text-danger");

    this.backLink = page.locator("#back");
    this.sendButton = page.locator('#order-mail-form button[name="mode"][value="complete"]');
    this.confirmBody = page.locator("#detail_box__tpl_data");

    this.successFlash = page.locator(".alert-success");
  }

  mailUrl(id: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/order/${id}/mail`;
  }

  editUrl(id: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/order/${id}/edit`;
  }

  /** メール通知 編集画面を開く。404確認等のため Response を返す。 */
  async goto(id: string | number) {
    return this.page.goto(this.mailUrl(id));
  }

  /** 受注編集画面（メール作成リンクの入口）を開く。 */
  async gotoEdit(id: string | number) {
    return this.page.goto(this.editUrl(id));
  }

  /** 編集画面の主要UI部品が仕様どおり表示されること（フロント挙動・表示要素）。 */
  async seeEditForm() {
    await expect(this.destinationCard).toBeVisible();
    await expect(this.mailInfoCard).toBeVisible();
    await expect(this.templateSelect).toBeVisible();
    await expect(this.subjectInput).toBeVisible();
    await expect(this.bodyEditor).toBeVisible();
    await expect(this.confirmButton).toBeVisible();
  }

  /**
   * カードのヘッダ矢印トグルで本体が折りたたみ/展開されること（設計書 フロント挙動 CSS・レイアウト 由来）。
   * 初期は collapse show（展開）。トグル押下で aria-expanded／可視状態が切り替わることを確認する。
   */
  async toggleCard(toggle: Locator, body: Locator) {
    await expect(toggle).toBeVisible();
    await expect(body).toBeVisible(); // 初期は展開
    await toggle.click();
    await expect(body).toBeHidden(); // 折りたたみで非表示
    await toggle.click();
    await expect(body).toBeVisible(); // 再展開
  }

  /**
   * 送信先カードに、当該受注の参照項目（注文番号・購入金額・注文者・購入商品・対応状況）が表示されること。
   * 期待ラベルは設計書「表示要素（送信先情報）」由来（オラクル独立性。実装trans文言の固定参照ではなく仕様の表示項目）。
   */
  async seeDestinationDetails() {
    await expect(this.destinationBody).toBeVisible();
    await expect(this.destinationBody).toContainText("注文番号");
    await expect(this.destinationBody).toContainText("購入金額");
    await expect(this.destinationBody).toContainText("注文者");
    await expect(this.destinationBody).toContainText("購入商品");
    await expect(this.destinationBody).toContainText("対応状況");
  }

  /**
   * 確認画面が「件名・本文を編集不可で再表示」していること（設計書 処理フロー confirm 由来）。
   * 件名は編集不可（hidden再表示）で入力値が確認表示され、編集用の ace エディタ(#editor)は存在しない。
   */
  async seeConfirmReadonly(subject: string) {
    await expect(this.sendButton).toBeVisible(); // 確認画面の「送信」
    await expect(this.backLink).toBeVisible(); // 確認画面の「メール通知」戻るリンク
    await expect(this.bodyEditor).toHaveCount(0); // 編集用エディタは確認画面に無い＝編集不可
    await expect(this.subjectInput).not.toBeEditable(); // 件名は編集不可で再表示
    await expect(this.form).toContainText(subject); // 入力した件名が確認表示される
  }

  /**
   * テンプレートを option index で選択する（既定 index=1＝先頭の実テンプレ。index=0 はプレースホルダ）。
   * 選択で change イベント→ JS が #mode=change をセットしフォームを自動送信する（mail.twig:23-27）。
   * POST再描画を確実に待つため、selectOption とメール通知URLへの POST 応答を同時に待機する。
   */
  async selectTemplateByIndex(index = 1) {
    await Promise.all([
      this.page.waitForResponse(
        (r) =>
          r.url().includes("/order/") &&
          r.url().includes("/mail") &&
          r.request().method() === "POST"
      ),
      this.templateSelect.selectOption({ index }),
    ]);
    await this.page.waitForLoadState("load");
  }

  /** 件名を入力する。 */
  async fillSubject(text: string) {
    await this.subjectInput.fill(text);
  }

  /** 「送信内容を確認」を押す（mode=confirm）。 */
  async submitConfirm() {
    await this.confirmButton.click();
  }

  /** 確認画面で「送信」を押す（mode=complete）。 */
  async submitSend() {
    await this.sendButton.click();
  }

  /** 確認画面で「メール通知」（戻る）を押す（mode=back）。 */
  async clickBack() {
    await this.backLink.click();
  }
}
