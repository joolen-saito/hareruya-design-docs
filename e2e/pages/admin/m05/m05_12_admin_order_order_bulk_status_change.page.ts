import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 受注管理 対応状況一括変更（M05-12）Page Object。
 * 受注一覧画面内の一括操作領域（対応状況プルダウン＋決定ボタン）と確認モーダル（進捗・結果一覧）を扱う。
 * 納品ケース表 integration_test/e2e/m05_12_admin_order_order_bulk_status_change_e2e_cases.md に対応。
 *
 * 期待結果は仕様（正本 functions/ec-cube-enterprise/m05-12_admin_order_order_bulk_status_change.md /
 * 観点表 / messages.ja.yaml）由来（オラクル独立性）。実装の現挙動・Form制約値は期待値に流用しない。
 * セレクタは Twig 由来の位置情報のみ（ec-cube-enterprise 現行ソース・nl -ba 基準）。
 *
 * DOM/セレクタ根拠:
 *  - 受注一覧URL → GET /%route%/order（利用者視点の入口）
 *  - 各出荷行チェック → input[id^="check_"]（Order/index.twig:1249、JS :97-100。name=ids[]・value=出荷ID・data-update-status-url）
 *  - ヘッダ全選択 → #toggle_check_all（Order/index.twig:1231、JS :112-120）
 *  - 一括操作領域 → .btn-bulk-wrapper（Order/index.twig:1100・1108。0件時 d-none／1件以上で表示 JS toggleBtnBulk）
 *  - 一括操作見出し → trans admin.common.bulk_actions=「一括操作」（index.twig:1101 / messages.ja.yaml:1529）
 *  - 対応状況プルダウン → #option_bulk_status（index.twig:1110）。初期行 value="" trans admin.order.change_status=「対応状況の変更」（index.twig:1111 / messages.ja.yaml:2372）。選択肢は OrderStatuses を sort_no 順（index.twig:1112-1114）
 *  - 決定ボタン → #btn_bulk_status（progressModal・data-type=status・data-bulk-update=true）trans admin.common.decision=「決定」（index.twig:1117-1119 / messages.ja.yaml:1452）
 *  - 確認モーダル → #sentUpdateModal（index.twig:1370。出荷済にする確認モーダルと共用）
 *  - モーダル本文 → #sentUpdateModal .modal-message（index.twig:1378。処理中=admin.order.bulk_action__in_progress_message=「処理中...」messages.ja.yaml:2362 / 完了=admin.order.bulk_action__complete_message=「完了しました。」:2363）
 *  - 結果一覧 → #sentUpdateModal #bulkErrors（index.twig:1379。NOTICE=スキップ/遷移不可、ERROR=システムエラー confirmationModal_js.twig:105-117）。
 *    ※ DOM上 id="bulkErrors" は同一画面に2つ存在する（出荷済モーダル index.twig:1379／一括削除モーダル index.twig:1418）ため、必ず #sentUpdateModal 配下に限定する。
 *  - 進捗バー → #sentUpdateModal .progress（index.twig:1395、JS show/hide :69,120）
 *  - 実行ボタン → #bulkChange（index.twig:1401）
 *  - 閉じるボタン → #bulkChangeComplete trans admin.common.close=「閉じる」（index.twig:1402 / messages.ja.yaml:1450）。押下で admin_order?resume=1 へ（index.twig:289-291）
 *  - メール送信チェック → #notificationMail（index.twig:1383）。#bulk-options（index.twig:1380）は status フローで hide（confirmationModal_js.twig:68）
 *  - 更新エンドポイント → PUT /%route%/shipping/{id}/order_status（OrderController.php:472。送信データ order_status のみ・XHR＋トークン必須）
 */
export class OrderOrderBulkStatusChangePage {
  readonly page: Page;
  readonly listUrl: string; // 受注一覧（入口）

  // 一覧の選択UI
  readonly rowCheckboxes: Locator; // 各出荷行チェック input[id^="check_"]
  readonly toggleAll: Locator; // ヘッダ全選択 #toggle_check_all
  readonly bulkWrapper: Locator; // 一括操作領域 .btn-bulk-wrapper（0件 d-none）
  readonly bulkActionsLabel: Locator; // 一括操作見出し「一括操作」

  // 一括対応状況変更UI
  readonly statusSelect: Locator; // 対応状況プルダウン #option_bulk_status
  readonly decisionButton: Locator; // 決定ボタン #btn_bulk_status

  // 確認モーダル
  readonly modal: Locator; // #sentUpdateModal
  readonly modalMessage: Locator; // .modal-message（処理中/完了）
  readonly bulkErrors: Locator; // #bulkErrors（NOTICE/ERROR 結果一覧）
  readonly progressBar: Locator; // .progress（進捗バー）
  readonly completeCloseButton: Locator; // #bulkChangeComplete「閉じる」
  readonly mailOptionCheckbox: Locator; // #notificationMail（status一括では非表示）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/order`;

    this.rowCheckboxes = page.locator('input[id^="check_"]');
    this.toggleAll = page.locator("#toggle_check_all");
    this.bulkWrapper = page.locator(".btn-bulk-wrapper");
    this.bulkActionsLabel = page.getByText("一括操作", { exact: false });

    this.statusSelect = page.locator("#option_bulk_status");
    this.decisionButton = page.locator("#btn_bulk_status");

    this.modal = page.locator("#sentUpdateModal");
    this.modalMessage = page.locator("#sentUpdateModal .modal-message");
    // id="bulkErrors" は画面内に2つ存在する（出荷済モーダル/一括削除モーダル）ため #sentUpdateModal 配下に限定する。
    this.bulkErrors = page.locator("#sentUpdateModal #bulkErrors");
    this.progressBar = page.locator("#sentUpdateModal .progress");
    this.completeCloseButton = page.locator("#bulkChangeComplete");
    this.mailOptionCheckbox = page.locator("#notificationMail");
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /**
   * 更新エンドポイントへブラウザ遷移（GET）で直接アクセスする。
   * これは「未認証ガード（GETでも管理ログインへ誘導）」の確認専用。
   * XHR以外/トークン不正の PUT 異常応答（E2E-M05-12-040）は別途 request コンテキストで検証する。
   */
  async gotoUpdateEndpoint(shippingId: number | string) {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/shipping/${shippingId}/order_status`);
  }

  /** チェック済みの出荷行チェックボックス（input[id^="check_"]:checked）。子孫検索でなく自身を絞り込む。 */
  checkedRowCheckboxes(): Locator {
    return this.page.locator('input[id^="check_"]:checked');
  }

  /** 先頭の出荷行チェックを外す。 */
  async uncheckFirstRow() {
    await this.rowCheckboxes.first().uncheck();
  }

  /** ヘッダ全選択チェックの状態を返す（個別チェック変更で外れることの確認用）。 */
  async isSelectAllChecked(): Promise<boolean> {
    return this.toggleAll.isChecked();
  }

  /** 一覧に出荷行が1件以上あるか（form_bulk は totalItemCount>0 のときのみ描画される）。 */
  async hasRows(): Promise<boolean> {
    return (await this.rowCheckboxes.count()) > 0;
  }

  /** 先頭の出荷行チェックを入れる（クライアント側のみ・サーバ更新なし）。 */
  async checkFirstRow() {
    await this.rowCheckboxes.first().check();
  }

  /** ヘッダ全選択チェックを操作する。 */
  async toggleSelectAll() {
    await this.toggleAll.check();
  }

  /** ヘッダ全選択チェックをOFFにする（全行解除の確認用）。 */
  async toggleSelectAllOff() {
    await this.toggleAll.uncheck();
  }

  /** 各出荷行チェックボックスの更新先URL（data-update-status-url）。出荷ID単位であることの確認用。 */
  async firstRowUpdateStatusUrl(): Promise<string | null> {
    return this.rowCheckboxes.first().getAttribute("data-update-status-url");
  }

  /** 対応状況プルダウンで変更先を選ぶ（value=対応状況ID）。 */
  async selectStatus(value: string) {
    await this.statusSelect.selectOption(value);
  }

  /** 決定ボタンを押す（未選択ならアラート・選択済みなら確認モーダル）。 */
  async clickDecision() {
    await this.decisionButton.click();
  }

  /** 一覧の選択UI（ヘッダ全選択・行チェックボックス）が表示されること。 */
  async seeListSelectionControls() {
    await expect(this.toggleAll).toBeVisible();
    await expect(this.rowCheckboxes.first()).toBeVisible();
  }

  /** チェック後に一括操作領域（見出し・プルダウン・決定）が表示されること。 */
  async seeBulkArea() {
    await expect(this.bulkActionsLabel.first()).toBeVisible();
    await expect(this.statusSelect).toBeVisible();
    await expect(this.decisionButton).toBeVisible();
  }
}
