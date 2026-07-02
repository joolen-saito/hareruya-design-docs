import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 出荷指示リスト詳細（備考編集・リスト削除）Page Object。
 * 納品ケース表 integration_test/e2e/m05_20_admin_order_order_shipping_standby_detail_edit_delete_e2e_cases.md に対応。
 *
 * 期待結果は仕様(設計書 functions/pf-eccube3/m05-20_..._edit_delete.md / 観点表 / messages.ja.yaml)由来
 * （オラクル独立性）。本Page Objectが保持するのは Twig＋Symfony Form 由来のセレクタ（位置情報）のみで、
 * 必須/最大長などの制約は期待値に流用しない（制約の正は設計書・観点表）。
 * 設計源は pf-eccube3（HareruyaEcプラグイン）。刷新先 ec-cube-enterprise に同名画面が存在する。
 *
 * 画面・ルート（ShippingStandbyController.php）:
 *   GET  /%admin%/standby/{id}/edit    詳細表示（存在しない id・明細無は HTTP 404 / :157-159）
 *   POST /%admin%/standby/{id}/update  備考保存（検証失敗→save_error＋編集へ :201-206／成功→save_complete＋同一詳細へ :223-225）
 *   DELETE /%admin%/standby/{id}/delete リスト削除（CSRF無効→403 :238／成功→delete_complete＋一覧へ :257-260）
 *
 * DOM id 根拠: Symfony Form getBlockPrefix=`admin_shipping_standby_edit`（ShippingStandbyCommentType.php:47-50）。
 *  - 備考 comment → #admin_shipping_standby_edit_comment（edit.twig:88 form_widget(form.comment)）
 *  - CSRF _token  → #admin_shipping_standby_edit__token（edit.twig:73 form_widget(form._token)）
 *  - 更新フォーム action=admin_shipping_standby_update（edit.twig:72）
 *  - 登録ボタン trans admin.common.registration=「登録」（edit.twig:94 / messages.ja.yaml:1436）
 *  - リスト削除リンク trans admin.order.shipping_standby_delete=「リスト削除」（edit.twig:97-99 data-method=delete + csrf_token_for_anchor / messages.ja.yaml:2484）
 *  - 出荷指示番号 #number_info_box__standby_id（edit.twig:77）/ 登録日時 :create_date(:78) / 更新日時 :update_date(:80) / 最終更新者 :member(:82)
 *  - 受注一覧 #result_list_main__list_body（edit.twig:137）/ 全チェック #check-all（:142）/ 注文番号リンク a→admin_order_edit（:159）
 *  - フラッシュ .alert-success / .alert-danger（@admin/alert.twig:22/:32）
 */
export class OrderOrderShippingStandbyDetailEditDeletePage {
  readonly page: Page;

  readonly comment: Locator; // 備考テキストエリア
  readonly csrfToken: Locator; // 更新フォーム CSRF（hidden）
  readonly registerButton: Locator; // 登録（備考保存）
  readonly deleteLink: Locator; // リスト削除リンク（data-method=delete）

  readonly standbyIdInfo: Locator; // 出荷指示番号
  readonly createDateInfo: Locator; // 登録日時
  readonly updateDateInfo: Locator; // 更新日時
  readonly memberInfo: Locator; // 最終更新者

  readonly orderListBody: Locator; // 受注一覧テーブル領域
  readonly orderRows: Locator; // 受注一覧の各行
  readonly orderCheckboxes: Locator; // 受注行のチェックボックス
  readonly checkAll: Locator; // 全選択チェック
  readonly firstOrderLink: Locator; // 先頭の注文番号リンク（→受注編集）

  readonly successFlash: Locator; // .alert-success
  readonly errorFlash: Locator; // .alert-danger

  constructor(page: Page) {
    this.page = page;

    this.comment = page.locator("#admin_shipping_standby_edit_comment");
    this.csrfToken = page.locator("#admin_shipping_standby_edit__token");
    this.registerButton = page.getByRole("button", { name: "登録" });
    this.deleteLink = page.getByRole("link", { name: "リスト削除" });

    this.standbyIdInfo = page.locator("#number_info_box__standby_id");
    this.createDateInfo = page.locator("#number_info_box__create_date");
    this.updateDateInfo = page.locator("#number_info_box__update_date");
    this.memberInfo = page.locator("#number_info_box__member");

    this.orderListBody = page.locator("#result_list_main__list_body");
    this.orderRows = page.locator('tr[id^="result_list_main__item--"]');
    this.orderCheckboxes = page.locator('input[type="checkbox"][name^="order_ids"]');
    this.checkAll = page.locator("#check-all");
    this.firstOrderLink = this.orderRows.first().locator('a[href*="/order/"]');

    // フラッシュは詳細/一覧いずれの画面でも @admin/alert.twig で描画される。
    this.successFlash = page.locator(".alert-success");
    this.errorFlash = page.locator(".alert-danger");
  }

  editUrl(id: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/standby/${id}/edit`;
  }

  updateUrl(id: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/standby/${id}/update`;
  }

  deleteUrl(id: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/standby/${id}/delete`;
  }

  listUrl(): string {
    // route=admin_shipping_standby（一覧入口）
    return `/${ECCUBE_ADMIN_ROUTE}/standby/search`;
  }

  /** 詳細画面を開く。404確認等のため Response を返す。 */
  async goto(id: string | number) {
    return this.page.goto(this.editUrl(id));
  }

  /** 詳細画面の主要UI部品が仕様どおり表示されること（フロント挙動・表示要素）。 */
  async seeDetail() {
    await expect(this.standbyIdInfo).toBeVisible();
    await expect(this.createDateInfo).toBeVisible();
    await expect(this.updateDateInfo).toBeVisible();
    await expect(this.memberInfo).toBeVisible();
    await expect(this.comment).toBeVisible();
    await expect(this.registerButton).toBeVisible();
    await expect(this.deleteLink).toBeVisible();
  }

  /** 受注一覧が表示され、各行のチェックが既定でONであること（フロント挙動）。 */
  async seeOrderListAllChecked() {
    await expect(this.orderListBody).toBeVisible();
    const count = await this.orderCheckboxes.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(this.orderCheckboxes.nth(i)).toBeChecked();
    }
  }

  /** 備考を入力して「登録」で保存送信する。 */
  async saveComment(text: string) {
    await this.comment.fill(text);
    await this.registerButton.click();
  }

  /** 保存完了フラッシュ（仕様文言）が表示されること。 */
  async seeSaveComplete(message: string) {
    await expect(this.successFlash).toContainText(message);
  }

  /** 保存失敗フラッシュ（仕様文言）が表示されること。 */
  async seeSaveError(message: string) {
    await expect(this.errorFlash).toContainText(message);
  }

  /** 削除完了フラッシュ（仕様文言）が表示されること。 */
  async seeDeleteComplete(message: string) {
    await expect(this.successFlash).toContainText(message);
  }
}
