import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 在庫分割結合登録/編集 Page Object（分割新規／結合新規／編集／承認の各画面）。
 * 納品ケース表 integration_test/e2e/m04_13_admin_stock_stock_split_join_register_edit_e2e_cases.md に対応。
 *
 * 期待結果は仕様（設計書 functions/ec-cube-enterprise/m04-13_admin_stock_stock_split_join_register_edit.md /
 * 観点表 / messages.ja.yaml）由来（オラクル独立性）。本Page Objectが保持するのは Twig＋Symfony Form 由来の
 * セレクタ（位置情報）のみで、Form/Type の必須・最大長・min/max 等の制約を期待値に流用しない。
 *
 * 画面とルート（%admin% = ECCUBE_ADMIN_ROUTE）:
 *  - 分割新規 GET /%admin%/product/stock/{productStockId}/split/new（admin_stock_split_new）
 *  - 分割登録 POST /%admin%/product/stock/{productStockId}/split/register（admin_stock_split_register・失敗時は新規画面再描画）
 *  - 分割編集 /%admin%/product/stock/split/{id}/edit（admin_stock_split_edit）
 *  - 分割承認 /%admin%/product/stock/split/{id}/approval（admin_stock_split_approval）
 *  - 結合新規 GET /%admin%/product/stock/{productStockId}/join/new（admin_stock_join_new）
 *  - 結合登録 POST /%admin%/product/stock/{productStockId}/join/register（admin_stock_join_register）
 *  - 結合編集 /%admin%/product/stock/join/{id}/edit（admin_stock_join_edit）
 *  - 結合承認 /%admin%/product/stock/join/{id}/approval（admin_stock_join_approval）
 *
 * セレクタ根拠（Twig file:line。素の input/textarea は Form 外のため name 属性。getBlockPrefix は
 * StockSplitNewType.php:53-55 / StockJoinNewType.php:52-55 / StockSplitJoinType.php:127-130）:
 *  - 分割数 input[name=split_quantity] / #split-source-stock-input（stock_split_new.twig:122 min=1 max=在庫 required）
 *  - 分割数メモ textarea[name="admin_stock_split_new[split_join_memo]"]（stock_split_new.twig:142）
 *  - 分割保存 button[form="form-split-register"] trans admin.common.save（stock_split_new.twig:168 / messages.ja.yaml:1434）
 *  - 分割元商品 見出し span trans admin.stock.split.source_product=「分割元商品」（stock_split_new.twig:92 / :4704）
 *  - 結合点数 input[name=destination_stock]（stock_join_new.twig:128 min=1 required・id無し）
 *  - 結合保存 button[form="form-join-register"]（stock_join_new.twig:174）
 *  - 結合先商品 見出し span trans admin.stock.join.destination_product=「結合先商品」（stock_join_new.twig:88 / :4749）
 *  - 必須バッジ badge trans admin.common.required=「必須」（stock_split_new.twig:107 / stock_join_new.twig:104 / :1528）
 *  - 却下メモ textarea[name=rejected_memo]（stock_split_approval.twig:184 / stock_join_approval.twig:216）
 *  - 承認/却下ボタン button[data-approval-mode]（stock_split_approval.twig:282-283 / stock_join_approval.twig:310-311。
 *    JSが hidden #form-split-approval-mode / #form-join-approval-mode に値を設定して submit する＝要実機確認）
 *  - フラッシュ .alert-success / .alert-danger（alert.twig:22,32）
 */
export class StockStockSplitJoinRegisterEditPage {
  readonly page: Page;

  // 分割新規
  readonly splitSourceProductTitle: Locator; // 「分割元商品」見出し
  readonly splitQuantity: Locator; // 分割数 input
  readonly splitMemo: Locator; // 分割メモ textarea
  readonly splitSubmit: Locator; // 分割 保存ボタン
  readonly splitRequiredBadge: Locator; // 分割数 必須バッジ

  // 結合新規
  readonly joinDestinationProductTitle: Locator; // 「結合先商品」見出し
  readonly joinDestinationStock: Locator; // 結合点数 input
  readonly joinMemo: Locator; // 結合メモ textarea
  readonly joinSubmit: Locator; // 結合 保存ボタン
  readonly joinRequiredBadge: Locator; // 結合数 必須バッジ

  // 承認・却下（共通）
  readonly rejectedMemo: Locator; // 却下理由 textarea
  readonly approveButton: Locator; // 承認ボタン data-approval-mode=approve
  readonly rejectButton: Locator; // 却下ボタン data-approval-mode=reject

  // フラッシュ
  readonly successFlash: Locator; // .alert-success
  readonly errorFlash: Locator; // .alert-danger

  constructor(page: Page) {
    this.page = page;

    this.splitSourceProductTitle = page.getByText("分割元商品", { exact: true });
    this.splitQuantity = page.locator('input[name="split_quantity"]'); // #split-source-stock-input
    this.splitMemo = page.locator('textarea[name="admin_stock_split_new[split_join_memo]"]');
    this.splitSubmit = page.locator('button[form="form-split-register"]');
    this.splitRequiredBadge = page.locator(".badge", { hasText: "必須" }).first();

    this.joinDestinationProductTitle = page.getByText("結合先商品", { exact: true });
    this.joinDestinationStock = page.locator('input[name="destination_stock"]');
    this.joinMemo = page.locator('textarea[name="split_join_memo"]').first();
    this.joinSubmit = page.locator('button[form="form-join-register"]');
    this.joinRequiredBadge = page.locator(".badge", { hasText: "必須" }).first();

    this.rejectedMemo = page.locator('textarea[name="rejected_memo"]');
    this.approveButton = page.locator('button[data-approval-mode="approve"]');
    this.rejectButton = page.locator('button[data-approval-mode="reject"]');

    this.successFlash = page.locator(".alert-success");
    this.errorFlash = page.locator(".alert-danger");
  }

  // ---- URL ----
  splitNewUrl(productStockId: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/stock/${productStockId}/split/new`;
  }
  joinNewUrl(productStockId: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/stock/${productStockId}/join/new`;
  }
  splitEditUrl(id: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/stock/split/${id}/edit`;
  }
  joinEditUrl(id: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/stock/join/${id}/edit`;
  }
  splitApprovalUrl(id: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/stock/split/${id}/approval`;
  }
  joinApprovalUrl(id: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/product/stock/join/${id}/approval`;
  }

  // ---- goto ----
  async gotoSplitNew(productStockId: string | number) {
    return this.page.goto(this.splitNewUrl(productStockId));
  }
  async gotoJoinNew(productStockId: string | number) {
    return this.page.goto(this.joinNewUrl(productStockId));
  }
  async gotoSplitEdit(id: string | number) {
    return this.page.goto(this.splitEditUrl(id));
  }
  async gotoJoinEdit(id: string | number) {
    return this.page.goto(this.joinEditUrl(id));
  }

  // ---- 分割新規 ----
  /** 分割新規画面の主要UI部品が仕様どおり表示されること。 */
  async seeSplitNewForm() {
    await expect(this.splitSourceProductTitle).toBeVisible();
    await expect(this.splitQuantity).toBeVisible();
    await expect(this.splitSubmit).toBeVisible();
  }

  async submitSplitRegister(quantity: string) {
    await this.splitQuantity.fill(quantity);
    await this.splitSubmit.click();
  }

  /**
   * クライアント側のHTML5検証（min/max/required）を回避してサーバ側判定を観測する。
   * 期待値（quantity_min / quantity_exceeds_stock）は設計書のサーバ側仕様由来であり、
   * input 属性（実装）は期待値に流用しない（オラクル独立性・不具合候補#2）。
   */
  async submitSplitRegisterServerSide(quantity: string) {
    await this.splitQuantity.evaluate((el) => {
      el.removeAttribute("min");
      el.removeAttribute("max");
      el.removeAttribute("required");
    });
    await this.splitQuantity.fill(quantity);
    await this.splitSubmit.click();
  }

  // ---- 結合新規 ----
  /** 結合新規画面の主要UI部品が仕様どおり表示されること。 */
  async seeJoinNewForm() {
    await expect(this.joinDestinationProductTitle).toBeVisible();
    await expect(this.joinDestinationStock).toBeVisible();
    await expect(this.joinSubmit).toBeVisible();
  }

  async submitJoinRegister(quantity: string) {
    await this.joinDestinationStock.fill(quantity);
    await this.joinSubmit.click();
  }

  /** クライアント検証を回避してサーバ側判定（destination_stock_min）を観測する。 */
  async submitJoinRegisterServerSide(quantity: string) {
    await this.joinDestinationStock.evaluate((el) => {
      el.removeAttribute("min");
      el.removeAttribute("required");
    });
    await this.joinDestinationStock.fill(quantity);
    await this.joinSubmit.click();
  }

  // ---- 承認・却下 ----
  async approve() {
    await this.approveButton.click();
  }
  async reject(memo: string) {
    if (memo.length > 0) {
      await this.rejectedMemo.fill(memo);
    }
    await this.rejectButton.click();
  }
}
