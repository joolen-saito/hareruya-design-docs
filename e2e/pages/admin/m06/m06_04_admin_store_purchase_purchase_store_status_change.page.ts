import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店頭買取管理 買取ステータス変更（M06-04）Page Object。
 * 納品ケース表 integration_test/e2e/m06_04_admin_store_purchase_purchase_store_status_change_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/pf-eccube3/m06-04_admin_store_purchase_purchase_store_status_change.md / 観点表)由来（オラクル独立性）。
 * i18nメッセージ文言・Form制約は実装由来のためオラクルにせず、観測挙動（表示要素・遷移先URL・フラッシュ領域の出現）で判定する。
 * 業務拒否文言「経理払出し待ちステータスの買取ではありません」・confirm文言は設計書本文に明記された値のみ採用する。
 * pf-eccube3 由来設計だが刷新先 ec-cube-enterprise に同一画面(admin_otcbuyorder_status / @admin/OtcBuyOrder/status.twig)が実在するためセレクタを導出した。
 * セレクタは Twig＋Symfony Form の block prefix 由来の位置情報のみ。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * DOM id 根拠（Symfony6 では DOM id/name は block prefix 由来。createForm(OtcBuyOrderStatusType::class) は
 *  名前未指定のため root block prefix = fqcnToBlockPrefix(OtcBuyOrderStatusType) = 'otc_buy_order_status'。
 *  ※ OtcBuyOrderStatusType.php:70-73 の getName()='admin_otc_buy_order_status' は Symfony6 では未使用で DOM id 根拠にならない）:
 *  - 変更後ステータス select → #otc_buy_order_status_otc_buy_order_status（status.twig:43 form_widget / OtcBuyOrderStatusType.php:50・要実機確認）
 *  - _token              → #otc_buy_order_status__token（status.twig:13 form_widget(form._token)・要実機確認）
 *  - 保存 button         → button[type=submit]「保存」（status.twig:70・素のテキスト）
 *  - カード見出し         → .card-header span「ステータス変更」（status.twig:19）
 *  - 戻るリンク           → a.c-baseLink → admin_otcbuyorder_detail「店頭買取詳細」（status.twig:60-63）
 *  - 詳細 経理払出し済     → button[form=update_status_account_team_paid]「経理払出し済」（detail.twig:471）
 *  - 詳細 入庫済みにする   → button[form=update_status_restocked]「入庫済みにする」（detail.twig:474）
 *  - 詳細 ステータス変更   → a → admin_otcbuyorder_status「ステータス変更」（detail.twig:478）
 *  - confirm文言          → 「経理払出し済みに変更します。よろしいですか？」（detail.twig:653）
 *  - フラッシュ           → .alert-success（alert.twig:22）/ .alert-danger（alert.twig:32）
 */
export class AdminStorePurchasePurchaseStoreStatusChangePage {
  readonly page: Page;

  // 変更後ステータスselect（status.twig:43 / id=otc_buy_order_status_otc_buy_order_status・block prefix由来・要実機確認）
  readonly statusSelect: Locator;
  // 保存ボタン（status.twig:70 button[type=submit]「保存」）
  readonly saveButton: Locator;
  // カード見出し「ステータス変更」（status.twig:19）
  readonly cardHeader: Locator;
  // 詳細へ戻るリンク（status.twig:60-63「店頭買取詳細」）
  readonly backToDetailLink: Locator;
  // フィールドエラー（status.twig:44 form_errors。出力クラスは bootstrap_4_horizontal_layout 依存＝要実機確認）
  readonly fieldError: Locator;
  // 成功フラッシュ（alert.twig:22）
  readonly flashSuccess: Locator;
  // エラーフラッシュ（alert.twig:32）
  readonly flashDanger: Locator;

  // 店頭買取詳細画面の3操作（detail.twig:471/474/478）
  readonly detailAccountTeamPaidButton: Locator; // 「経理払出し済」
  readonly detailRestockedButton: Locator; // 「入庫済みにする」
  readonly detailStatusChangeLink: Locator; // 「ステータス変更」

  constructor(page: Page) {
    this.page = page;

    this.statusSelect = page.locator("#otc_buy_order_status_otc_buy_order_status");
    this.saveButton = page.locator('button[type="submit"]:has-text("保存")');
    this.cardHeader = page.locator(".card-header span", { hasText: "ステータス変更" });
    this.backToDetailLink = page.getByRole("link", { name: "店頭買取詳細" });
    // 出力クラスは要実機確認。代表的なBootstrap検証クラスを候補にする（合否は「同画面滞留」で補強）。
    this.fieldError = page.locator(".invalid-feedback, .text-danger, .form-error-message");
    this.flashSuccess = page.locator(".alert-success");
    this.flashDanger = page.locator(".alert-danger");

    this.detailAccountTeamPaidButton = page.getByRole("button", { name: "経理払出し済" });
    this.detailRestockedButton = page.getByRole("button", { name: "入庫済みにする" });
    this.detailStatusChangeLink = page.getByRole("link", { name: "ステータス変更" });
  }

  statusUrl(otcBuyOrderId: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/status/${otcBuyOrderId}`;
  }

  detailUrl(otcBuyOrderId: number | string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/${otcBuyOrderId}`;
  }

  async gotoStatus(otcBuyOrderId: number | string) {
    await this.page.goto(this.statusUrl(otcBuyOrderId));
  }

  async gotoDetail(otcBuyOrderId: number | string) {
    await this.page.goto(this.detailUrl(otcBuyOrderId));
  }

  /** ステータス変更画面のUI部品が仕様どおり表示されること（査定番号・現在ステータス・select・保存）。 */
  async seeStatusForm() {
    await expect(this.cardHeader).toBeVisible();
    await expect(this.statusSelect).toBeVisible();
    await expect(this.saveButton).toBeVisible();
    await expect(this.page.locator("body")).toContainText("査定番号");
    await expect(this.page.locator("body")).toContainText("現在のステータス");
  }

  /** 変更後ステータスを value 指定で選んで保存する（破壊的）。 */
  async selectStatusByValue(value: string) {
    await this.statusSelect.selectOption(value);
  }

  /** 何も選択せず保存する（必須バリデーションの確認）。 */
  async save() {
    await this.saveButton.click();
  }

  /** プレースホルダ除く option の value 配列（数値ID昇順・廃止ID除外の確認用）。 */
  async optionValues(): Promise<string[]> {
    const values = await this.statusSelect.locator("option").evaluateAll((opts) =>
      opts.map((o) => (o as HTMLOptionElement).value).filter((v) => v !== "")
    );
    return values;
  }
}
