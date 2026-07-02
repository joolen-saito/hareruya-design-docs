import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 商品管理 購入グループ管理 Page Object（m03-22_admin_product_product_sell_group）。
 * 同一Twig上の「一覧＋新規フォーム」「編集フォーム」「削除確認モーダル」を扱う。
 * 期待結果は仕様(functions/pf-eccube3/m03-22_admin_product_product_sell_group.md / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`product_sell_group`（ProductSellGroupType 既定）由来の位置情報のみ。
 *
 * URL（SellGroupController.php）:
 *  - GET  index(一覧+新規フォーム) : /%route%/product/sell_group           (:40)
 *  - GET  edit(編集フォーム)        : /%route%/product/sell_group/{id}      (:87)
 *  - POST create                    : /%route%/product/sell_group/create    (:58)
 *  - POST update                    : /%route%/product/sell_group/{id}/update (:108)
 *  - DELETE delete                  : /%route%/product/sell_group/{id}/delete (:138)
 *
 * DOM id 根拠（getBlockPrefix=product_sell_group）:
 *  - name(必須)            → #product_sell_group_name        (form_row form.name sell_group.twig:80)
 *  - name_en(必須)         → #product_sell_group_name_en     (sell_group.twig:81)
 *  - reservationFlg(任意)  → #product_sell_group_reservationFlg (sell_group.twig:82)
 *  - memo(任意)            → #product_sell_group_memo        (sell_group.twig:83)
 *  - Payments(展開複数)    → #product_sell_group_Payments_N  (sell_group.twig:84)
 *  - Deliveries(展開複数)  → #product_sell_group_Deliveries_N(sell_group.twig:85)
 *  - 送信ボタン「登録」trans admin.common.registration（sell_group.twig:184 / messages.ja.yaml:1436）
 *  - キャンセル「キャンセル」trans admin.common.cancel（編集時のみ sell_group.twig:176 / :1445）
 *  - カードヘッダ右「新規登録」trans admin.event.entry.register（sell_group.twig:74 / :5740）
 *  - 一覧名称リンク a.text-primary（sell_group.twig:111 url admin_product_sell_group_edit）
 *  - 編集行ハイライト tr.table-active（sell_group.twig:109）
 *  - 削除ボタン button[data-bs-target="#DeleteModal"]（sell_group.twig:130-138 data-url/data-message）
 *  - 削除モーダル #DeleteModal / p.modal-message（sell_group.twig:148-157）/ 確定 a[data-method="delete"]（:161）
 *  - フィールドエラー .invalid-feedback / .form-error-message（bootstrap_4_horizontal_layout 由来・要実機確認）
 */
export class ProductProductSellGroupPage {
  readonly page: Page;
  readonly listUrl: string; // 一覧＋新規フォーム

  readonly nameInput: Locator; // 名称(日) 必須
  readonly nameEnInput: Locator; // 名称(英) 必須
  readonly reservationFlg: Locator; // 予約商品フラグ チェック
  readonly memoInput: Locator; // メモ 任意
  readonly paymentsGroup: Locator; // 支払方法 チェック群（展開）
  readonly deliveriesGroup: Locator; // 配送方法 チェック群（展開）
  readonly submitButton: Locator; // 送信「登録」
  readonly cancelLink: Locator; // 「キャンセル」（編集時のみ）
  readonly newLink: Locator; // カードヘッダ右「新規登録」
  readonly formCard: Locator; // #sell-group-form-card（sell_group.twig:64）
  readonly listTable: Locator; // .sell-group-master-list（sell_group.twig:96）
  readonly nameLinks: Locator; // 一覧名称リンク（sell_group.twig:111）
  readonly activeRow: Locator; // 編集ハイライト行（sell_group.twig:109）
  readonly deleteModal: Locator; // #DeleteModal（sell_group.twig:148）
  readonly modalMessage: Locator; // p.modal-message（sell_group.twig:157）
  readonly modalConfirm: Locator; // 確定 a[data-method="delete"]（sell_group.twig:161）
  readonly fieldError: Locator; // フィールドエラー（要実機確認）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/product/sell_group`;

    this.nameInput = page.locator("#product_sell_group_name");
    this.nameEnInput = page.locator("#product_sell_group_name_en");
    this.reservationFlg = page.locator("#product_sell_group_reservationFlg");
    this.memoInput = page.locator("#product_sell_group_memo");
    this.paymentsGroup = page.locator("#product_sell_group_Payments");
    this.deliveriesGroup = page.locator("#product_sell_group_Deliveries");
    // 送信ボタンは type=submit form="form_sell_group"。文言は trans 由来（仕様）。
    this.submitButton = page.getByRole("button", { name: "登録" });
    this.cancelLink = page.getByRole("link", { name: "キャンセル" });
    this.newLink = page.getByRole("link", { name: "新規登録" });
    this.formCard = page.locator("#sell-group-form-card");
    this.listTable = page.locator(".sell-group-master-list");
    this.nameLinks = page.locator(".sell-group-master-list tbody a.text-primary");
    this.activeRow = page.locator(".sell-group-master-list tr.table-active");
    this.deleteModal = page.locator("#DeleteModal");
    this.modalMessage = page.locator("#DeleteModal p.modal-message");
    this.modalConfirm = page.locator('#DeleteModal a[data-method="delete"]');
    // フィールドエラー要素は form theme 依存。実機確認のうえ確定する（創作しない）。
    this.fieldError = page.locator(".invalid-feedback, .form-error-message");
  }

  editUrl(id: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/sell_group/${id}`;
  }

  /** 一覧の当該id行の名称リンク（入口導線の起点。href=admin_product_sell_group_edit）。 */
  nameLinkFor(id: number | string): Locator {
    return this.page.locator(
      `.sell-group-master-list tbody a.text-primary[href$="/sell_group/${id}"]`
    );
  }

  /** 一覧の当該id行（名称リンクのhrefで特定）。 */
  rowFor(id: number | string): Locator {
    return this.page.locator(".sell-group-master-list tbody tr", {
      has: this.page.locator(`a[href$="/sell_group/${id}"]`),
    });
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  async gotoEdit(id: number | string) {
    await this.page.goto(this.editUrl(id));
  }

  /** 新規/更新フォームへ名称を入力し送信する。 */
  async submitForm(name: string, nameEn: string) {
    await this.nameInput.fill(name);
    await this.nameEnInput.fill(nameEn);
    await this.submitButton.click();
  }

  /** 名称(日)のみ任意に空/値で送信する（必須検証用）。 */
  async submitNames(name: string, nameEn: string) {
    await this.nameInput.fill(name);
    await this.nameEnInput.fill(nameEn);
    await this.submitButton.click();
  }

  /** 指定行の削除ボタンを押し、確認モーダルを開く。 */
  async openDeleteModal(rowIndex = 0) {
    const button = this.page
      .locator('.sell-group-master-list tbody button[data-bs-target="#DeleteModal"]')
      .nth(rowIndex);
    await button.click();
  }

  /** 新規フォームの主要UI部品が仕様どおり表示されること。 */
  async seeNewForm() {
    await expect(this.nameInput).toBeVisible();
    await expect(this.nameEnInput).toBeVisible();
    await expect(this.reservationFlg).toBeVisible();
    await expect(this.memoInput).toBeVisible();
    await expect(this.paymentsGroup).toBeVisible();
    await expect(this.deliveriesGroup).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }
}
