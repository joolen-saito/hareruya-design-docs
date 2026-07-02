import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 会員管理 ポイント付与・ポイント履歴（M08-06）Page Object。
 * 納品ケース表 integration_test/e2e/m08_06_admin_customer_point_e2e_cases.md に対応。
 * 期待結果は仕様（正本 functions/pf-eccube3/m08-06_admin_customer_point.md / 観点表）の挙動由来（オラクル独立性）。
 * pf-eccube3(HareruyaEcプラグイン)由来の設計だが、刷新先 ec-cube-enterprise に同一画面
 * （admin_customer_point_select / admin_customer_point_history / admin_customer_point_update）が実在するためE2E化した。
 * 表示文言のうち i18n リソース(messages.ja.yaml)由来の語・Form 制約はオラクルにせず位置情報のみ用いる。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * セレクタ根拠（位置情報のみ）。DOM id は Symfony Form getBlockPrefix=`admin_customer_point`
 * （CustomerPointType.php:147-149）由来:
 *  - orderNumber → #admin_customer_point_orderNumber（point_update.twig:40）
 *  - pointChange → #admin_customer_point_pointChange（point_update.twig:51）
 *  - issueDate  → #admin_customer_point_issueDate（point_update.twig:62）
 *  - note(select)→ #admin_customer_point_note（point_update.twig:73）
 *  - _token     → #admin_customer_point__token（point_update.twig:20）
 *  - 「登録」ボタン trans admin.common.registration（point_update.twig:83）
 *  - エラー .form-error-message（bootstrap_4_horizontal_layout.html.twig:58）/ .invalid-feedback（:55）
 *  - 種別選択カード a.point-type-select（point_select.twig:14 granted / :23 purchase）
 *  - 履歴一覧 table（point_update.twig:111-152、注文番号列 :115）/ ポイント残高（:105）
 */
export class CustomerPointPage {
  readonly page: Page;

  // 入力欄・ボタン（履歴確認＝付与画面）
  readonly orderNumber: Locator; // 注文番号（point_update.twig:40 / 任意・8桁）
  readonly pointChange: Locator; // ポイント増減量（point_update.twig:51 / 設計:ポイント変動 必須）
  readonly issueDate: Locator; // 発行日（point_update.twig:62）
  readonly note: Locator; // 備考 select（point_update.twig:73 / 設計:任意）
  readonly registerButton: Locator; // 「登録」trans admin.common.registration（point_update.twig:83）
  readonly error: Locator; // 検証エラー .form-error-message（bootstrap_4_horizontal_layout.html.twig:58）
  readonly historyTable: Locator; // ポイント履歴一覧 table（point_update.twig:111）

  // 種別選択画面
  readonly typeCards: Locator; // a.point-type-select（point_select.twig:14,23）

  constructor(page: Page) {
    this.page = page;
    this.orderNumber = page.locator("#admin_customer_point_orderNumber");
    this.pointChange = page.locator("#admin_customer_point_pointChange");
    this.issueDate = page.locator("#admin_customer_point_issueDate");
    this.note = page.locator("#admin_customer_point_note");
    this.registerButton = page.getByRole("button", { name: "登録" });
    this.error = page.locator(".form-error-message");
    this.historyTable = page.locator("table");
    this.typeCards = page.locator("a.point-type-select");
  }

  // ---- URL（管理ルート接頭辞は環境可変。ECCUBE_ADMIN_ROUTE で組み立てる） ----
  selectUrl(customerId: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/customer/point/${customerId}/select`;
  }
  /** 種別: history | granted | purchase（GET 履歴確認。Controller.php:50 requirements） */
  historyUrl(customerId: string | number, type: string): string {
    return `/${ECCUBE_ADMIN_ROUTE}/customer/point/${customerId}/${type}`;
  }
  editUrl(customerId: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/customer/${customerId}/edit`;
  }

  async gotoSelect(customerId: string | number) {
    await this.page.goto(this.selectUrl(customerId));
  }
  async gotoHistory(customerId: string | number, type: string) {
    await this.page.goto(this.historyUrl(customerId, type));
  }
  async gotoCustomerEdit(customerId: string | number) {
    await this.page.goto(this.editUrl(customerId));
  }

  /**
   * 付与フォーム送信。入力する値はオラクルではなく操作データである。未指定の項目は触らない。
   * 設計の入力項目は「ポイント変動（必須）」「備考（任意）」のみ（正本 m08-06.md「入力項目」表）。
   * noteIndex を渡すと備考 select を位置（index）で選ぶ。文言('キャンペーン'等)はForm定数由来の
   * オラクルになり得るため、負系で他項目の必須エラーを排除する操作データとしては index で指定する。
   */
  async submitGrant(opts: {
    pointChange?: string;
    issueDate?: string;
    note?: string;
    noteIndex?: number;
    orderNumber?: string;
  }) {
    if (opts.orderNumber !== undefined)
      await this.orderNumber.fill(opts.orderNumber);
    if (opts.pointChange !== undefined)
      await this.pointChange.fill(opts.pointChange);
    if (opts.issueDate !== undefined)
      await this.issueDate.fill(opts.issueDate);
    if (opts.note !== undefined)
      await this.note.selectOption({ label: opts.note });
    if (opts.noteIndex !== undefined)
      await this.note.selectOption({ index: opts.noteIndex });
    await this.registerButton.click();
  }

  /** 種別選択画面に2つの種別カードが表示されること（仕様: 種別の選択画面）。 */
  async seeTypeSelect() {
    await expect(this.typeCards).toHaveCount(2);
  }

  /** 付与フォーム（入力欄＋登録ボタン）が表示されること（仕様: 付与フォーム表示）。 */
  async seeGrantForm() {
    await expect(this.pointChange).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }

  /** ポイント履歴一覧が表示されること（仕様: 履歴一覧）。 */
  async seeHistoryTable() {
    await expect(this.historyTable.first()).toBeVisible();
  }

  /** 履歴一覧の行数（追加の間接確認に用いる）。 */
  async historyRowCount(): Promise<number> {
    return this.historyTable.first().locator("tbody tr").count();
  }

  /**
   * 履歴一覧の見出し列数（注文番号列を含む複数列の構造確認に用いる）。
   * 列見出し文言は i18n リソース由来のためオラクル化せず、列構造の存在で間接確認する。
   */
  async historyHeaderColumnCount(): Promise<number> {
    return this.historyTable.first().locator("thead th").count();
  }
}
