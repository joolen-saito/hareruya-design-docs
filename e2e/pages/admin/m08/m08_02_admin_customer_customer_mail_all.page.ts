import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 会員管理 > メール一括送信 Page Object（入力 / 確認 / 完了 の3画面）。
 * 納品ケース表 integration_test/e2e/m08_02_admin_customer_customer_mail_all_e2e_cases.md に対応。
 * 期待結果は仕様（正本md m08-02_admin_customer_customer_mail_all.md / 観点表）由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_customer_mail`（CustomerMailType.php:71-74）由来の位置情報のみ。
 *
 * 入口は会員一覧（別機能）から: チェックボックス選択→「その他」ドロップダウン→「メール一括送信」(target-action JS が
 * 選択 ids[] を POST /customer/mail へ送る)。本ルートは POST 専用のため URL 直接 GET では到達できない。
 *
 * DOM id / セレクタ根拠:
 *  - 入口チェックボックス input[name="ids[]"]（Customer/index.twig:452。各行 #check-{id}）
 *  - 入口リンク a.target-action「メール一括送信」（index.twig:427 / messages.ja.yaml:1519 admin.common.email_sending）
 *  - 入口「その他」ドロップダウン（index.twig:422-423 / messages.ja.yaml:1520 admin.common.other）
 *  - subject → #admin_customer_mail_subject（mail.twig:67）
 *  - body(hidden) → #admin_customer_mail_body、編集UIは ace editor #editor（mail.twig:75-76。submit時にJSで #editor→hidden body へコピー mail.twig:32）
 *  - 確認ボタン #confirm「送信内容を確認」trans admin.order.mail_confirm（mail.twig:98 / messages.ja.yaml:2342）
 *  - 確認画面 送信ボタン #complete「メール送信」trans admin.customer.mail_send（mail_confirm.twig:104 / messages.ja.yaml:2566）
 *  - 確認画面 戻る #back（mail_confirm.twig:99 trans admin.customer.mail）
 *  - 確認画面 配信対象者「配信対象者」trans admin.customer.mail_customer_info（mail_confirm.twig:73 / messages.ja.yaml:2613）
 *  - 確認画面 件名/本文表示（mail_confirm.twig:49 / :57）・対象会員行 tr#ex-customer-{id}（mail_confirm.twig:86）
 *  - 完了画面 文言「メール送信完了しました」（mail_complete.twig:16・ハードコード／不具合候補#3）
 */
export class CustomerCustomerMailAllPage {
  readonly page: Page;
  readonly customerListUrl: string; // 会員一覧（入口・別機能）

  // 入口（会員一覧）
  readonly customerCheckboxes: Locator; // input[name="ids[]"]
  readonly otherDropdownToggle: Locator; // 「その他」ドロップダウン
  readonly mailAllLink: Locator; // a.target-action「メール一括送信」

  // 入力画面（mail.twig）
  readonly subject: Locator; // #admin_customer_mail_subject
  readonly bodyHidden: Locator; // #admin_customer_mail_body (hidden)
  readonly bodyEditorInput: Locator; // #editor 内 ace のテキスト入力（要実機確認）
  readonly idsHidden: Locator; // #admin_customer_mail_ids (hidden・選択会員ID保持。mail.twig:50 / mail_confirm.twig:35)
  readonly confirmButton: Locator; // #confirm

  // 確認画面（mail_confirm.twig）
  readonly completeButton: Locator; // #complete
  readonly backButton: Locator; // #back

  constructor(page: Page) {
    this.page = page;
    this.customerListUrl = `/${ECCUBE_ADMIN_ROUTE}/customer`;

    this.customerCheckboxes = page.locator('input[name="ids[]"]');
    this.otherDropdownToggle = page.getByRole("button", { name: "その他" });
    this.mailAllLink = page.locator("a.target-action", { hasText: "メール一括送信" });

    this.subject = page.locator("#admin_customer_mail_subject");
    this.bodyHidden = page.locator("#admin_customer_mail_body");
    // ace editor は内部に非表示の textarea.ace_text-input を持つ（要実機確認）。
    this.bodyEditorInput = page.locator("#editor .ace_text-input");
    this.idsHidden = page.locator("#admin_customer_mail_ids");
    this.confirmButton = page.locator("#confirm");

    this.completeButton = page.locator("#complete");
    this.backButton = page.locator("#back");
  }

  async gotoCustomerList() {
    await this.page.goto(this.customerListUrl);
  }

  /**
   * 会員一覧で先頭の会員を選択し「メール一括送信」を起動して入力画面へ遷移する（入口・別機能依存）。
   * 選択した会員ID（input[name="ids[]"] の value＝会員ID／Customer/index.twig:452）を返し、
   * 確認画面で「選択IDが保持され対象会員が選択会員と一致する」ことの検証に用いる。
   */
  async startMailAllFromList(): Promise<string | null> {
    const first = this.customerCheckboxes.first();
    const selectedId = await first.getAttribute("value");
    await first.check();
    await this.otherDropdownToggle.click();
    await this.mailAllLink.click();
    return selectedId;
  }

  /**
   * 会員一覧で先頭から count 件の会員を選択し「メール一括送信」を起動して入力画面へ遷移する。
   * 設計書「複数会員への一括送信」の検証用。選択した会員ID配列を返す。
   */
  async startMailAllFromListMultiple(count = 2): Promise<string[]> {
    const ids: string[] = [];
    for (let i = 0; i < count; i++) {
      const cb = this.customerCheckboxes.nth(i);
      const value = await cb.getAttribute("value");
      if (value) ids.push(value);
      await cb.check();
    }
    await this.otherDropdownToggle.click();
    await this.mailAllLink.click();
    return ids;
  }

  /** 件名を入力する。 */
  async fillSubject(value: string) {
    await this.subject.fill(value);
  }

  /** 本文を ace editor 経由で入力する（submit時にJSが hidden body へコピーする・要実機確認）。 */
  async fillBody(value: string) {
    await this.bodyEditorInput.fill(value);
  }

  /** 件名・本文を入力する（空文字は当該欄を空のままにする）。 */
  async fillForm(subject: string, body: string) {
    if (subject !== "") {
      await this.fillSubject(subject);
    }
    if (body !== "") {
      await this.fillBody(body);
    }
  }

  /** 入力画面で「送信内容を確認」を押下する。 */
  async clickConfirm() {
    await this.confirmButton.click();
  }

  /** 確認画面で「送信」（メール送信）を押下する。 */
  async clickComplete() {
    await this.completeButton.click();
  }

  /** 確認画面から入力画面へ戻る。 */
  async clickBack() {
    await this.backButton.click();
  }

  /** 入力画面のUI部品が仕様どおり表示されること（件名欄・本文エディタ・確認ボタン）。 */
  async seeInputForm() {
    await expect(this.subject).toBeVisible();
    await expect(this.page.locator("#editor")).toBeVisible();
    await expect(this.confirmButton).toBeVisible();
  }

  /** 確認画面に到達していること（送信ボタンと配信対象者一覧）。 */
  async seeConfirmScreen() {
    await expect(this.completeButton).toBeVisible();
    await expect(this.page.locator("body")).toContainText("配信対象者");
  }

  /**
   * 確認画面が入力内容を「変更不可」で表示していること（設計書: 確認画面は入力欄を変更不可で表示）。
   * 実装は件名を hidden 化（mail_confirm.twig:50）し本文をテキスト表示（:57）するため、
   * 入力画面の編集UI（ace editor #editor）が露出していないこと＝編集不可をブラウザ観測する。
   */
  async seeConfirmReadonly() {
    await expect(this.page.locator("#editor")).toHaveCount(0); // 本文編集UIが無い＝変更不可
    await expect(this.confirmButton).toHaveCount(0); // 入力画面の確認ボタンが無い＝確認画面である
  }

  /** 確認画面に「選択した会員」が配信対象として一覧表示されること（findByIds の結果＝選択ID由来）。 */
  async seeSelectedCustomerInTargets(customerId: string) {
    await expect(this.page.locator(`tr#ex-customer-${customerId}`)).toBeVisible();
  }
}
