import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 会員管理 — ポイント付与・ポイント履歴 Page Object（種別選択 / ポイント履歴・付与 の2画面）。
 * 画面タイプ: other（register_edit 寄り：履歴一覧＋付与フォーム）。
 *
 * 期待結果（合否）は仕様（正本md functions/pf-eccube3/m08-05_admin_customer_point.md・観点表・基本設計）由来
 * とする（オラクル独立性）。本ファイルが実装から取るのはセレクタ（位置情報）のみ。設計書(pf-eccube3リバース)と
 * ec-cube-enterprise実装の乖離（POSTパス・必須項目・項目名・type=history）は納品ケース表の付帯表4で管理する。
 *
 * セレクタ根拠（ec-cube-enterprise 現行ソース。行番号は src 基準）:
 *  - ルート（CustomerPointController.php）:
 *      種別選択 admin_customer_point_select = GET /customer/point/{id}/select（:38）
 *      履歴/付与 admin_customer_point_history = GET /customer/point/{id}/{type}（:50, type=history|granted|purchase）
 *      付与POST  admin_customer_point_update  = POST /customer/point/{id}/{type}（:51, type=granted|purchase）
 *      ※設計書は POST .../update/{type} と記すが実装は .../{type}（不具合候補#1）
 *  - フォームDOM id は getBlockPrefix='admin_customer_point'（CustomerPointType.php:147-150）由来:
 *      orderNumber → #admin_customer_point_orderNumber（point_update.twig:40）
 *      pointChange → #admin_customer_point_pointChange（point_update.twig:51）
 *      note(select)→ #admin_customer_point_note（point_update.twig:73）
 *      issueDate   → #admin_customer_point_issueDate（point_update.twig:62, single_text date）
 *      _token      → #admin_customer_point__token（point_update.twig:20）
 *  - 付与フォーム: <form id="customer_address_form" action=admin_customer_point_update>（point_update.twig:17）
 *  - 登録ボタン: button[type=submit] trans admin.common.registration=「登録」（point_update.twig:83 / messages.ja.yaml:1436）
 *  - 履歴一覧: table.table-striped（point_update.twig:111）/ 見出し 注文番号 admin.common.order_number（:115 / messages.ja.yaml:1664）
 *  - 種別選択カード: a.point-type-select（point_select.twig:14 granted / :23 purchase）
 *  - 戻りリンク: a.c-baseLink href=admin_customer_edit（point_update.twig:165 / point_select.twig:40）
 *  - 成功フラッシュ: admin.common.save_complete=「保存しました」（Controller.php:92 / messages.ja.yaml:1398）
 * 注: 各項目の検証エラー表示は form_errors のinline描画（point_update.twig:41,52,63,74）。実描画クラスは要実機確認のため
 *     エラー専用セレクタを創作せず、spec では「成功フラッシュ非表示＋付与画面に留まる」で失敗を判定する。
 */
export class AdminCustomerPointPage {
  readonly page: Page;

  // フォーム入力（種別 granted/purchase の履歴画面）
  readonly orderNumber: Locator; // 注文番号（任意） point_update.twig:40
  readonly pointChange: Locator; // ポイント増減量（必須） point_update.twig:51
  readonly note: Locator; // 備考（ChoiceType select） point_update.twig:73
  readonly issueDate: Locator; // ポイント発行日（single_text date） point_update.twig:62
  readonly registerButton: Locator; // 登録ボタン point_update.twig:83
  readonly form: Locator; // form#customer_address_form point_update.twig:17

  // 表示要素
  readonly typeSelectCards: Locator; // 種別選択カード point_select.twig:14,23
  readonly historyTable: Locator; // 履歴一覧 table.table-striped point_update.twig:111
  readonly historyRows: Locator; // 履歴行 tbody tr point_update.twig:123-150
  readonly successFlash: Locator; // 成功フラッシュ「保存しました」 messages.ja.yaml:1398

  constructor(page: Page) {
    this.page = page;
    this.orderNumber = page.locator("#admin_customer_point_orderNumber");
    this.pointChange = page.locator("#admin_customer_point_pointChange");
    this.note = page.locator("#admin_customer_point_note");
    this.issueDate = page.locator("#admin_customer_point_issueDate");
    this.registerButton = page.locator(
      'form#customer_address_form button[type="submit"]'
    );
    this.form = page.locator("form#customer_address_form");
    this.typeSelectCards = page.locator("a.point-type-select");
    this.historyTable = page.locator("table.table-striped");
    this.historyRows = page.locator("table.table-striped tbody tr");
    this.successFlash = page.getByText("保存しました");
  }

  // ===== URL（実装ルート由来。POSTは画面のform actionが送信する） =====
  selectUrl(customerId: string | number): string {
    return `/${ECCUBE_ADMIN_ROUTE}/customer/point/${customerId}/select`;
  }
  historyUrl(customerId: string | number, type = "granted"): string {
    return `/${ECCUBE_ADMIN_ROUTE}/customer/point/${customerId}/${type}`;
  }

  async gotoSelect(customerId: string | number) {
    await this.page.goto(this.selectUrl(customerId));
  }
  async gotoHistory(customerId: string | number, type = "granted") {
    await this.page.goto(this.historyUrl(customerId, type));
  }

  /** 種別選択画面で先頭（付与）の種別カードを押下する。 */
  async clickFirstTypeCard() {
    await this.typeSelectCards.first().click();
  }

  /**
   * ポイントを付与する。期待結果（合否）は仕様由来。
   * note/issueDate は実装が必須（不具合候補#2）のため、付与を成立させる場合は値を渡す。
   * バリデーション失敗ケースでは増減量のみ操作し、必須未充足の失敗を仕様どおり観測する。
   */
  async grant(opts: {
    pointChange?: string;
    note?: string;
    issueDate?: string;
    orderNumber?: string;
  }) {
    if (opts.pointChange !== undefined)
      await this.pointChange.fill(opts.pointChange);
    if (opts.orderNumber !== undefined)
      await this.orderNumber.fill(opts.orderNumber);
    if (opts.issueDate !== undefined) await this.issueDate.fill(opts.issueDate);
    if (opts.note !== undefined)
      await this.note.selectOption({ label: opts.note });
    await this.registerButton.click();
  }

  /** 種別選択画面のUI部品が仕様どおり表示されること（2つの種別カード）。 */
  async seeTypeSelect() {
    await expect(this.typeSelectCards).toHaveCount(2);
  }

  /** ポイント履歴画面のUI部品（付与フォーム＋履歴一覧）が表示されること。 */
  async seeHistoryWithForm() {
    await expect(this.form).toBeVisible();
    await expect(this.pointChange).toBeVisible();
    await expect(this.registerButton).toBeVisible();
    await expect(this.historyTable).toBeVisible();
  }
}
