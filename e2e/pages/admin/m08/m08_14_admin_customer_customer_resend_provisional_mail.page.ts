import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 会員管理 > 会員登録仮登録完了メール再送（M08-14）Page Object。
 * 納品ケース表 integration_test/e2e/m08_14_admin_customer_customer_resend_provisional_mail_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/pf-eccube3/m08-14_admin_customer_customer_resend_provisional_mail.md / 観点表)由来（オラクル独立性）。
 * pf-eccube3(HareruyaEcプラグイン)由来の設計だが、刷新先 ec-cube-enterprise に同一操作
 * （会員一覧 admin_customer の行アクション「仮会員メール再送」→確認モーダル→admin_customer_resend）が実在するためセレクタを導出した。
 * セレクタは Twig 由来の位置情報のみ。合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 入口: 本機能は専用画面を持たず、会員一覧（admin_customer / Customer/index.twig）の各会員行の
 *       操作ドロップダウン内リンクから確認モーダルを開き、モーダルの送信リンクで再送する。
 *       再送リンクは会員ステータスが「仮会員(PROVISIONAL)」のときのみ表示される（index.twig:484-486）。
 *
 * セレクタ根拠（src/Eccube/Resource/template/admin/Customer/index.twig /
 *   Controller/Admin/Customer/CustomerController.php / Resource/template/admin/alert.twig /
 *   Resource/locale/messages.ja.yaml）:
 *  - 会員一覧URL              → GET /{admin_route}/customer（admin_customer）
 *  - 行アクションのドロップダウントグル → #result_list_main__menu_box_toggle--{id} .dropdown-menu-toggle（index.twig:480-481）
 *  - 再送リンク(メニュー内)    → #result_list_main__menu--{id} a[data-bs-target="#discontinuance_cus_{id}"]
 *                                trans admin.customer.resend「仮会員メール再送」(index.twig:485 / messages.ja.yaml:2557)
 *                                ※仮会員(PROVISIONAL)のみ表示（index.twig:484）
 *  - 確認モーダル              → #discontinuance_cus_{id}（index.twig:489）
 *  - モーダルタイトル          → trans admin.customer.resend_confirm_title「仮会員メールを再送します。」(index.twig:493 / messages.ja.yaml:2558)
 *  - モーダル本文              → trans admin.customer.resend_confirm_message「仮登録メールを再送してもよろしいですか？」(index.twig:499 / messages.ja.yaml:2559)
 *  - キャンセルボタン          → trans admin.common.cancel「キャンセル」(index.twig:502 / messages.ja.yaml:1445)
 *  - 送信リンク(再送実行)      → #discontinuance_cus_{id} a.btn-ec-delete[href*="/resend"] trans admin.common.send「送信」
 *                                (index.twig:504-506 / messages.ja.yaml:1447、href url('admin_customer_resend'))
 *  - 成功フラッシュ            → .alert-success（alert.twig:22。Controller.php:219 addSuccess('admin.common.send_complete')）
 *    ※成功文言は実装が admin.common.send_complete「メールを送信しました」を使用。設計書の参照キー
 *      admin.customer.resend.complete とは不一致（付帯表4 不具合候補#3）。期待結果は仕様「成功メッセージ表示＋会員一覧へ戻る」由来とし、
 *      文言一致ではなく成功フラッシュ表示＋一覧URLで判定する。
 */
export class CustomerCustomerResendProvisionalMailPage {
  readonly page: Page;
  readonly listUrl: string; // 会員一覧 admin_customer（再送の入口かつ再送成功後の戻り先）

  readonly successAlert: Locator; // .alert-success（再送完了フラッシュ）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/customer`;
    this.successAlert = page.locator(".alert-success");
  }

  async gotoCustomerList() {
    await this.page.goto(this.listUrl);
  }

  /** 指定会員IDの再送URL（直接アクセス用。404/トークン検証の確認に使う）。 */
  resendUrl(customerId: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/customer/${customerId}/resend`;
  }

  /** 指定会員行のドロップダウンから「仮会員メール再送」リンク（仮会員のみ存在）。 */
  resendMenuLink(customerId: number | string): Locator {
    return this.page.locator(
      `#result_list_main__menu--${customerId} a[data-bs-target="#discontinuance_cus_${customerId}"]`
    );
  }

  /** 指定会員の確認モーダル。 */
  confirmModal(customerId: number | string): Locator {
    return this.page.locator(`#discontinuance_cus_${customerId}`);
  }

  /** 確認モーダル内の送信（再送実行）リンク。 */
  modalSendLink(customerId: number | string): Locator {
    return this.confirmModal(customerId).locator("a.btn-ec-delete");
  }

  /** 確認モーダル内のキャンセルボタン（trans admin.common.cancel / index.twig:502）。 */
  modalCancelButton(customerId: number | string): Locator {
    return this.confirmModal(customerId).locator('[data-bs-dismiss="modal"], .btn-ec-sub');
  }

  /** 行アクションのドロップダウンを開く。 */
  async openRowMenu(customerId: number | string) {
    await this.page
      .locator(`#result_list_main__menu_box_toggle--${customerId} .dropdown-menu-toggle`)
      .click();
  }

  /** 再送リンクを押下し確認モーダルを開く。 */
  async openResendModal(customerId: number | string) {
    await this.openRowMenu(customerId);
    await this.resendMenuLink(customerId).click();
    await expect(this.confirmModal(customerId)).toBeVisible();
  }

  /** 確認モーダルの送信リンクを押下して再送を実行する。 */
  async submitResend(customerId: number | string) {
    await this.modalSendLink(customerId).click();
  }

  /**
   * 確認モーダルのキャンセルを押下し、再送せずに中断する。
   * 送信正常系（submitResend）に対する中断系の対。キャンセルでメール送信が起こらないこと
   * （成功フラッシュ不在・一覧に留まる）を呼び出し側で判定する。
   * キャンセルボタンのセレクタは Bootstrap 標準の dismiss / 共通サブボタン想定＝要実機確認。
   */
  async cancelResend(customerId: number | string) {
    await this.modalCancelButton(customerId).first().click();
  }

  /**
   * 再送実行前に「確認のうえ送信する」操作経路（確認ダイアログ＋送信コントロール）が存在すること。
   * 設計書(正本:74)は「本機能専用のモーダルは無い」と明記しており、表示される確認ダイアログは
   * 実装(共通の確認モーダル)由来である。よってモーダルのタイトル/本文の文言は期待結果（オラクル）に
   * しない（実装由来オラクル混入の除去）。仕様由来の観測点は「再送前に確認操作を経て送信できる」こと
   * のみとし、送信コントロールの存在で判定する。文言一致の確認は要確認（実装trans値・付帯表4#4）。
   */
  async seeConfirmStep(customerId: number | string) {
    await expect(this.confirmModal(customerId)).toBeVisible(); // 確認操作経路の存在
    await expect(this.modalSendLink(customerId)).toBeVisible(); // 送信（再送実行）コントロール
  }
}
