import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 会員管理 オンライン本人確認（M08-10）Page Object。
 * 納品ケース表 integration_test/e2e/m08_10_admin_customer_customer_online_identification_e2e_cases.md に対応（完全1:1ではない）。
 * 期待結果は仕様(正本 functions/pf-eccube3/m08-10_admin_customer_customer_online_identification.md / 観点表)の挙動由来（オラクル独立性）。
 * pf-eccube3(HareruyaEcプラグイン)由来の設計だが、刷新先 ec-cube-enterprise では会員編集画面
 * (admin_customer_edit / Customer/edit.twig)のモーダルとして実在するためセレクタを導出した。
 * 本機能は単独画面を持たず、会員編集画面内の「オンライン本人確認」モーダル(#online_identification_detail)と
 * 確認済への変更 POST(admin_customer_identification_complete)で構成される。
 * セレクタは Twig＋Symfony Form 由来の位置情報のみ。合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * セレクタ根拠（src/Eccube/Resource/template/admin/Customer/edit.twig）:
 *  - モーダル開閉トリガ a[data-bs-target="#online_identification_detail"]（edit.twig:1057、{% if Customer.id %}内＝編集時のみ）
 *  - モーダル本体 #online_identification_detail（edit.twig:102）
 *  - モーダル見出し .modal-title「オンライン本人確認」（edit.twig:106 / trans admin.customer.online_identification messages.ja.yaml:2537）
 *  - 身分証画像枠 .expand-image / 未登録文言「登録データなし」（edit.twig:253-296 / trans admin.customer.identification_image.no_image messages.ja.yaml:2576）
 *  - 画像区分ラベル 本人の顔写真/表/裏/斜め（messages.ja.yaml:2572-2575）
 *  - 身分証有効期限入力 #admin_customer_Player_id_expiration_date（PlayerType.php:79-96 single_text / name=admin_customer[Player][id_expiration_date] edit.twig:91,310）
 *  - 取消ボタン「取消」（edit.twig:322 / trans admin.customer.identification.cancel messages.ja.yaml:2578）
 *  - 確認済に変更するリンク #submit_confirm「確認済に変更する」（edit.twig:323-324 / trans admin.customer.identification.update messages.ja.yaml:2579）
 *  - 確認済への変更 POST 先 admin_customer_identification_complete（CustomerEditController.php:194）
 */
export class CustomerCustomerOnlineIdentificationPage {
  readonly page: Page;

  // 会員編集画面（モーダルの入口。会員IDあり編集時のみオンライン本人確認ボタンを表示）
  // 由来: CustomerEditController（admin_customer_edit）/ ボタンは edit.twig:1057
  readonly openModalButton: Locator; // edit.twig:1057 data-bs-target=#online_identification_detail
  readonly modal: Locator; // edit.twig:102 #online_identification_detail
  readonly modalTitle: Locator; // edit.twig:106 .modal-title「オンライン本人確認」
  readonly idExpirationDate: Locator; // edit.twig:310 #admin_customer_Player_id_expiration_date（single_text）
  readonly images: Locator; // edit.twig:253.. .expand-image（身分証画像サムネイル）
  readonly cancelButton: Locator; // edit.twig:322「取消」
  readonly completeButton: Locator; // edit.twig:323 #submit_confirm「確認済に変更する」

  constructor(page: Page) {
    this.page = page;
    this.openModalButton = page.locator(
      'a[data-bs-target="#online_identification_detail"]'
    );
    this.modal = page.locator("#online_identification_detail");
    this.modalTitle = this.modal.locator(".modal-title");
    this.idExpirationDate = page.locator(
      "#admin_customer_Player_id_expiration_date"
    );
    this.images = this.modal.locator("img.expand-image");
    this.cancelButton = this.modal.getByRole("button", { name: "取消" });
    this.completeButton = page.locator("#submit_confirm");
  }

  /** 会員編集画面（編集時：会員IDあり）を開く。 */
  async gotoEdit(customerId: string | number) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/customer/${customerId}/edit`);
  }

  /** 会員新規登録画面（会員IDなし＝モーダル非表示の前提確認用）を開く。 */
  async gotoNew() {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/customer/new`);
  }

  /** オンライン本人確認モーダルを開く。 */
  async openModal() {
    await this.openModalButton.click();
  }

  /** 身分証有効期限を入力して「確認済に変更する」を押下（JSが隠しフォームでPOST送信する）。 */
  async submitComplete(idExpirationDate?: string) {
    await this.openModal();
    if (idExpirationDate !== undefined) {
      await this.idExpirationDate.fill(idExpirationDate);
    }
    await this.completeButton.click();
  }

  /** モーダル見出しが仕様どおり「オンライン本人確認」であること。 */
  async seeModalTitle() {
    await expect(this.modalTitle).toContainText("オンライン本人確認");
  }
}
