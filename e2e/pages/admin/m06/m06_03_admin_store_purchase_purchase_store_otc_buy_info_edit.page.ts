import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店頭買取管理 — 買取詳細（買取情報の確認と保存） Page Object。
 * 納品ケース表 integration_test/e2e/m06_03_admin_store_purchase_purchase_store_otc_buy_info_edit_e2e_cases.md に対応。
 *
 * 期待結果は仕様(設計書 functions/pf-eccube3/m06-03_admin_store_purchase_purchase_store_otc_buy_info_edit.md /
 * 観点表 / messages.ja.yaml)由来（オラクル独立性）。本Page Objectが保持するのは Twig＋Symfony Form 由来の
 * セレクタ（位置情報）のみで、必須/最大長などの制約は期待値に流用しない（制約の正は設計書・観点表・基本設計）。
 * 設計源は pf-eccube3。刷新先 ec-cube-enterprise に同一画面が存在する（route=admin_otcbuyorder_detail）。
 *
 * 画面・ルート（OtcBuyOrderController.php）:
 *   GET  /%admin%/otcbuyorder/{id}                              買取詳細（存在しない id は HTTP 404 / :237-239）
 *   POST /%admin%/otcbuyorder/{id}/update                       保存（フリーコメント／在庫増減 / :502-550）
 *   POST /%admin%/otcbuyorder/{id}/account_team_paid            経理払出し済→買取完了（CSRF account_team_paid / :381-444）
 *   POST /%admin%/otcbuyorder/{id}/restocked                    入庫済み（CSRF restocked / :449-497）
 *   POST /%admin%/otcbuyorder/{id}/register-individual-stock/{individualProductId}  個別実在庫登録（CSRF register_individual_stock / :559-620）
 *   GET  /%admin%/otcbuyorder/status/{id}                       ステータス変更画面（:286-316）
 *
 * DOM id 根拠: Symfony Form getBlockPrefix=`otc_buy_order_detail`（OtcBuyOrderDetailType 既定。data_class=DtbOtcBuyOrder）。
 *  - フリーコメント freeComment → #otc_buy_order_detail_freeComment（detail.twig:425 form_widget(form.freeComment)）
 *  - CSRF _token → #otc_buy_order_detail__token（detail.twig:25 form_widget(form._token)）
 *  - 商品検索モーダルフォーム SearchProductType prefix=`admin_search_product`（detail.twig:619-620 JS / :445-446）
 *  - サブタイトル「買取詳細」（detail.twig:7 sub_title block。default_frame 出力先クラスは要実機確認のためテキスト確認）
 *  - カード見出し: 操作履歴(:31)/ステータス変更履歴(:123)/買取情報(:152)/実在庫情報(:263)/査定申込者情報(:358)
 *  - 査定合計金額ラベル(:155)・値 OtcBuyOrder.totalPrice|price(:156)
 *  - 増減数入力 number → input[name="stock_diff[{product_class_id}]"]（detail.twig:332）
 *  - 実在庫編集トグル「編集」 → #edit_stock_switch（detail.twig:264。編集時テキスト「編集解除」:683）
 *  - 表示用在庫表 #detail_stock_display（detail.twig:269）/ 編集用在庫表 #detail_stock_edit（detail.twig:306 初期 display:none）
 *  - 個別「実在庫情報登録」ボタン → .item-regist-button（detail.twig:234-242 data-bs-target=#registModal）
 *  - 実在庫登録モーダル → #registModal（detail.twig:437）/ モーダル検索ボタン → #searchProductModalButton（detail.twig:447 trans admin.common.search=「検索」messages.ja.yaml:検索）
 *  - フッタ操作: 保存 button[form="update_details"](:483) / 経理払出し済 button[form="update_status_account_team_paid"](:471) /
 *               入庫済みにする button[form="update_status_restocked"](:474) / ステータス変更 link href=admin_otcbuyorder_status(:477-480) / 店頭買取一覧 link(:462-465)
 *  - フラッシュ → .alert-success / .alert-danger（@admin/alert.twig:21-46。addSuccess/addError 'admin'）
 */
export class StorePurchasePurchaseStoreOtcBuyInfoEditPage {
  readonly page: Page;

  // フォーム/入力
  readonly freeComment: Locator; // #otc_buy_order_detail_freeComment（detail.twig:425）
  readonly saveButton: Locator; // フッタ「保存」（detail.twig:483 form=update_details）
  readonly accountTeamPaidButton: Locator; // フッタ「経理払出し済」（detail.twig:471）
  readonly restockedButton: Locator; // フッタ「入庫済みにする」（detail.twig:474）
  readonly statusChangeLink: Locator; // フッタ「ステータス変更」（detail.twig:479）
  readonly backToListLink: Locator; // フッタ「店頭買取一覧」（detail.twig:462-465）

  // 実在庫編集
  readonly editStockSwitch: Locator; // #edit_stock_switch（detail.twig:264）
  readonly stockDisplayTable: Locator; // #detail_stock_display（detail.twig:269）
  readonly stockEditTable: Locator; // #detail_stock_edit（detail.twig:306）

  // 個別実在庫登録モーダル
  readonly itemRegistButton: Locator; // .item-regist-button（detail.twig:234）
  readonly registModal: Locator; // #registModal（detail.twig:437）
  readonly modalSearchButton: Locator; // #searchProductModalButton（detail.twig:447）
  readonly modalSearchKeyword: Locator; // #admin_search_product_id（detail.twig:619 / form:445）

  // フラッシュ
  readonly successFlash: Locator; // .alert-success（alert.twig:21）
  readonly errorFlash: Locator; // .alert-danger（alert.twig:39）

  // 見出し
  readonly buyInfoCard: Locator; // 「買取情報」card-header（detail.twig:152）

  constructor(page: Page) {
    this.page = page;

    this.freeComment = page.locator("#otc_buy_order_detail_freeComment");
    this.saveButton = page.locator('button[form="update_details"]');
    this.accountTeamPaidButton = page.locator(
      'button[form="update_status_account_team_paid"]'
    );
    this.restockedButton = page.locator(
      'button[form="update_status_restocked"]'
    );
    this.statusChangeLink = page.getByRole("link", { name: "ステータス変更" });
    this.backToListLink = page.getByRole("link", { name: "店頭買取一覧" });

    this.editStockSwitch = page.locator("#edit_stock_switch");
    this.stockDisplayTable = page.locator("#detail_stock_display");
    this.stockEditTable = page.locator("#detail_stock_edit");

    this.itemRegistButton = page.locator(".item-regist-button").first();
    this.registModal = page.locator("#registModal");
    this.modalSearchButton = page.locator("#searchProductModalButton");
    this.modalSearchKeyword = page.locator("#admin_search_product_id");

    this.successFlash = page.locator(".alert-success");
    this.errorFlash = page.locator(".alert-danger");

    this.buyInfoCard = page.locator(".card-header", { hasText: "買取情報" });
  }

  detailUrl(id: string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/${id}`;
  }

  statusUrl(id: string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/status/${id}`;
  }

  async goto(id: string) {
    await this.page.goto(this.detailUrl(id));
  }

  /** 増減数入力欄（商品規格ID指定）。 */
  stockDiffInput(productClassId: string | number): Locator {
    return this.page.locator(`input[name="stock_diff[${productClassId}]"]`);
  }

  /** フリーコメントを入力して「保存」。 */
  async saveFreeComment(comment: string) {
    await this.freeComment.fill(comment);
    await this.saveButton.click();
  }

  /** 詳細画面の主要カード見出しが仕様どおり表示されること。 */
  async seeDetailCards() {
    for (const title of [
      "操作履歴",
      "ステータス変更履歴",
      "買取情報",
      "実在庫情報",
      "査定申込者情報",
    ]) {
      await expect(
        this.page.locator(".card-header", { hasText: title })
      ).toBeVisible();
    }
  }

  /** フッタの操作ボタン/リンクが仕様どおり表示されること。 */
  async seeFooterControls() {
    await expect(this.saveButton).toBeVisible();
    await expect(this.accountTeamPaidButton).toBeVisible();
    await expect(this.restockedButton).toBeVisible();
    await expect(this.statusChangeLink).toBeVisible();
    await expect(this.backToListLink).toBeVisible();
  }
}
