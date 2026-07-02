import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 受注対応状況の変更（M05-14）Page Object。
 * 納品ケース表 integration_test/e2e/m05_14_admin_order_order_status_change_e2e_cases.md に対応。
 *
 * 期待結果は仕様(正本 functions/ec-cube-enterprise/m05-14_admin_order_order_status_change.md / 観点表 /
 * messages.ja.yaml)由来（オラクル独立性）。本Page Objectが保持するのは Twig＋Symfony Form 由来のセレクタ
 * （位置情報）のみで、必須/制約は期待値に流用しない（制約の正は設計書・観点表）。
 * 本機能は ec-cube-enterprise を正典（カスタマイズ区分=標準）とし、刷新先に受注編集(admin_order_edit)が実在する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 画面・ルート（EditController.php:146-147）:
 *   GET  /%admin%/order/{id}/edit  既存受注の編集（詳細）画面（存在しない id は HTTP 404）
 *   POST /%admin%/order/{id}/edit （mode=status_change）対応状況変更を確定し同画面へリダイレクト
 *   GET  /%admin%/order/new        新規受注登録画面（対応状況プルダウン・変更操作を表示しない＝本機能対象外）
 *   GET  /%admin%/order            受注一覧（編集画面への到達口）
 *
 * DOM id / セレクタ根拠（Symfony Form getBlockPrefix=`order`。OrderType.php:380）:
 *  - 対応状況プルダウン OrderStatus → #order_OrderStatus（edit.twig:843 form_widget(form.OrderStatus)。
 *    Order.id ありのときのみ描画 edit.twig:842）。trans ラベル admin.order.order_status=「対応状況」(messages.ja.yaml:2323 / edit.twig:840)
 *  - 対応状況プルダウン項目エラー → form_errors(form.OrderStatus)（edit.twig:844。出力クラスは要実機確認のため
 *    spec では仕様文言テキストで確認する）
 *  - 現在のステータス表示 → div[title="現在のステータス"] の次セル（edit.twig:835-836 値 {{ Order.OrderStatus.name }}）
 *  - 対応状況変更ボタン → button.change-status（edit.twig:977。押下で mode=status_change にし action を
 *    /order/{id}/edit へ戻して送信 edit.twig:530-536）。実装の表示文言は「受注ステータス変更」だが仕様ラベルは
 *    「対応状況」（付帯表4#1）。位置情報として class を用い、期待値に実装文言を流用しない
 *  - 隠し mode → #form1 input[name="mode"]（edit.twig:790）
 *  - 受注編集リンク（一覧→編集の到達口）→ a.action-edit（index.twig:1256,1265 url admin_order_edit）
 *  - 成功フラッシュ → .alert-success（@admin/alert.twig）。文言は admin.order.save.complete=「保存しました」
 *    (messages.ja.yaml:2414) / admin.order.cancel.complete=「全キャンセルが完了しました。」(messages.ja.yaml:2412)
 *  - エラーフラッシュ → .alert-danger
 *  - 取消関連の確認ダイアログ → window.confirm（edit.twig:650,657,663。POMでは page.on('dialog') で扱う）
 */
export class OrderOrderStatusChangePage {
  readonly page: Page;
  readonly listUrl: string;

  readonly orderStatusSelect: Locator; // #order_OrderStatus（対応状況プルダウン）
  readonly currentStatusLabel: Locator; // 「現在のステータス」ラベルセル
  readonly currentStatusValue: Locator; // 現在のステータス表示名（ラベルの次セル）
  readonly changeStatusButton: Locator; // button.change-status（対応状況変更）
  readonly modeInput: Locator; // 隠し mode
  readonly successFlash: Locator; // .alert-success
  readonly errorFlash: Locator; // .alert-danger
  readonly firstOrderEditLink: Locator; // 一覧の受注編集リンク（先頭）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/order`;

    this.orderStatusSelect = page.locator("#order_OrderStatus");
    this.currentStatusLabel = page.locator('div[title="現在のステータス"]');
    this.currentStatusValue = this.currentStatusLabel.locator(
      "xpath=following-sibling::div[1]"
    );
    // 実装文言「受注ステータス変更」(edit.twig:977)に依存せず位置情報(class)で特定する（オラクル独立性）。
    this.changeStatusButton = page.locator("button.change-status");
    this.modeInput = page.locator('#form1 input[name="mode"]');
    this.successFlash = page.locator(".alert-success");
    this.errorFlash = page.locator(".alert-danger");
    this.firstOrderEditLink = page.locator("a.action-edit").first();
  }

  editUrl(id: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/order/${id}/edit`;
  }

  newUrl(): string {
    return `/${ECCUBE_ADMIN_ROUTE}/order/new`;
  }

  /** 受注編集（詳細）画面を開く。404確認等のため Response を返す。 */
  async gotoEdit(id: string | number) {
    return this.page.goto(this.editUrl(id));
  }

  /** 新規受注登録画面を開く。 */
  async gotoNew() {
    await this.page.goto(this.newUrl());
  }

  /** 受注一覧を開く。 */
  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 一覧の先頭受注の編集画面へ遷移する。受注が無ければ false（呼び出し側で skip）。 */
  async openFirstOrderEdit(): Promise<boolean> {
    await this.gotoList();
    if ((await this.firstOrderEditLink.count()) === 0) {
      return false;
    }
    await this.firstOrderEditLink.click();
    await expect(this.orderStatusSelect).toBeVisible();
    return true;
  }

  /** 対応状況変更のUI（現在のステータス・プルダウン・変更ボタン）が仕様どおり表示されること。 */
  async seeStatusChangeUi() {
    await expect(this.currentStatusLabel).toBeVisible();
    await expect(this.orderStatusSelect).toBeVisible();
    await expect(this.changeStatusButton).toBeVisible();
  }

  /** プルダウンの選択肢（value, ラベル）一覧を取得する。 */
  async statusOptions(): Promise<{ value: string; label: string }[]> {
    return this.orderStatusSelect.locator("option").evaluateAll((opts) =>
      (opts as HTMLOptionElement[])
        .filter((o) => o.value !== "")
        .map((o) => ({ value: o.value, label: (o.textContent || "").trim() }))
    );
  }

  /** 現在のステータスの表示名を取得する。 */
  async currentStatusText(): Promise<string> {
    return (await this.currentStatusValue.innerText()).trim();
  }

  /** value（OrderStatus id）で対応状況を選択する。 */
  async selectStatus(value: string) {
    await this.orderStatusSelect.selectOption(value);
  }

  /** 対応状況変更ボタンを押下して送信する（mode=status_change）。 */
  async clickChangeStatus() {
    await this.changeStatusButton.click();
  }

  /** 遷移先を選択して対応状況変更を送信する。 */
  async changeStatusTo(value: string) {
    await this.selectStatus(value);
    await this.clickChangeStatus();
  }

  /**
   * 許可されない遷移先を強制送信する（異常系）。
   * 仕様上、選択肢は遷移可能な集合に限定されプルダウンに不可遷移IDは出ない。
   * そこで DOM に不可遷移IDの option を追加して選択し送信する（強制送信の再現）。
   */
  async forceSelectAndSubmit(invalidStatusId: string) {
    await this.orderStatusSelect.evaluate((el, id) => {
      const sel = el as HTMLSelectElement;
      const opt = document.createElement("option");
      opt.value = id;
      opt.textContent = id;
      sel.appendChild(opt);
      sel.value = id;
    }, invalidStatusId);
    await this.clickChangeStatus();
  }

  /** 指定の文言が画面に表示されること（フラッシュ・項目エラーの共通確認）。 */
  async seeText(text: string) {
    await expect(this.page.getByText(text).first()).toBeVisible();
  }
}
