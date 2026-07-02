import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店舗設定 > 特定商取引法（M10-02）Page Object。
 * 納品ケース表 integration_test/e2e/m10_02_admin_base_setting_setting_shop_tradelaw_e2e_cases.md に対応。
 * 期待結果は仕様（設計書 functions/pf-eccube3/m10-02_admin_base_setting_setting_shop_tradelaw.md ＋ 観点表 ＋
 * 基本設計＝刷新後要件）由来（オラクル独立性）。セレクタは Twig＋Symfony Form 由来の位置情報のみ。合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 重要（仕様乖離）: 設計源 pf-eccube3 は特商法を dtb_help の固定列（販売業者・メール・URL・TEL/FAX 3分割・都道府県・
 *  law_term01〜06）として持つが、刷新先 ec-cube-enterprise の当画面は dtb_tradelaw の「名称(name)・説明(description)」
 *  行コレクションの編集表である（TradeLawController.php:39-91 / TradeLawMallType.php / tradelaw.twig）。
 *  本POMは刷新先の実画面要素に対するセレクタのみを定義する。旧固定項目欄は刷新先に存在しない（ケース表 付帯表4）。
 *
 * DOM 根拠（admin/Setting/Shop/tradelaw.twig）:
 *  - フォーム本体 form_start/form_end（tradelaw.twig:21,79。ルート名なしのため id 非固定・要実機確認）
 *  - 見出し span「特定商取引法設定」（tradelaw.twig:28 trans admin.setting.shop.tradelaw_setting）
 *  - 表ヘッダ「名称」（tradelaw.twig:36 trans admin.setting.shop.trade_law.header.name）
 *  - 表ヘッダ「説明」（tradelaw.twig:38 trans admin.setting.shop.trade_law.header.description）
 *  - 各特商法行 tr#tradeLawRow_<loop.index>（tradelaw.twig:43。1始まり）
 *  - 名称入力欄 form_widget(TradeLaw.name)（tradelaw.twig:45 → Symfony id #TradeLaws_0_name 要実機確認）
 *  - 説明入力欄 form_widget(TradeLaw.description)（tradelaw.twig:49 → Symfony id #TradeLaws_0_description 要実機確認）
 *  - 名称/説明エラー form_errors（tradelaw.twig:46,50 → .invalid-feedback 相当・要実機確認）
 *  - 保存ボタン button[type=submit]（tradelaw.twig:68-69 trans admin.common.save="保存"）
 *
 * フロント参照（default/Help/tradelaw.twig）:
 *  - 見出し h1（Help/tradelaw.twig:15 trans front.tradelaw.title="特定商取引法に基づく表記"）
 *  - 行 dl（filter t.name and t.description Help/tradelaw.twig:20）／名称 dt label.ec-label（:24）／説明 dd（:25）
 *
 * 文言の正は仕様（設計書「表示メッセージ」＝成功フラッシュ「保存しました」相当）。i18n リソース値はオラクルにせず、
 * 設計書明記の文言・観測（フラッシュ領域の表示・該当URLへの遷移）で判定する。
 */
export class AdminBaseSettingSettingShopTradelawPage {
  readonly page: Page;
  readonly url: string; // GET/POST /<route>/setting/shop/tradelaw
  readonly frontUrl: string; // フロント参照 /help/tradelaw

  readonly cardHeading: Locator; // 見出し「特定商取引法設定」span（tradelaw.twig:28）
  readonly headerName: Locator; // 表ヘッダ「名称」th（tradelaw.twig:36）
  readonly headerDescription: Locator; // 表ヘッダ「説明」th（tradelaw.twig:38）
  readonly rows: Locator; // 特商法行 tr[id^=tradeLawRow_]（tradelaw.twig:43）
  readonly saveButton: Locator; // 保存ボタン（tradelaw.twig:68 trans admin.common.save）
  readonly errors: Locator; // 項目エラー（tradelaw.twig:46,50 form_errors・要実機確認）

  // フロント参照
  readonly frontHeading: Locator; // h1「特定商取引法に基づく表記」（Help/tradelaw.twig:15）
  readonly frontRows: Locator; // dl 行（Help/tradelaw.twig:21-27）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/setting/shop/tradelaw`;
    this.frontUrl = `/help/tradelaw`;

    this.cardHeading = page.locator(".card-header").filter({ hasText: "特定商取引法設定" });
    this.headerName = page.locator("thead th").filter({ hasText: "名称" });
    this.headerDescription = page.locator("thead th").filter({ hasText: "説明" });
    this.rows = page.locator('tr[id^="tradeLawRow_"]');
    this.saveButton = page.locator('button[type="submit"]').filter({ hasText: "保存" });
    // form_errors の出力クラスは bootstrap_4 テーマ依存（.invalid-feedback 等）。専用セレクタを創作せず広めに取る。
    this.errors = page.locator(".invalid-feedback, .text-danger, ul.list-unstyled li");

    this.frontHeading = page.getByRole("heading", { name: "特定商取引法に基づく表記" });
    this.frontRows = page.locator(".ec-borderedDefs dl");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  async gotoFront() {
    await this.page.goto(this.frontUrl);
  }

  /** index 行（1始まり tradeLawRow_<index>）の名称入力欄。 */
  nameInput(index = 1): Locator {
    // 行は page スコープの id で直接取得する（rows は既に tr に絞られた locator のため子孫探索では一致しない）。
    return this.page.locator(`#tradeLawRow_${index}`).locator('input[type="text"], input:not([type])').first();
  }

  /** index 行（1始まり）の説明テキストエリア。 */
  descriptionInput(index = 1): Locator {
    return this.page.locator(`#tradeLawRow_${index} textarea`).first();
  }

  /** index 行の説明を書き換えて保存する。 */
  async editDescriptionAndSave(value: string, index = 1) {
    await this.descriptionInput(index).fill(value);
    await this.saveButton.click();
  }

  /** index 行の名称を書き換えて保存する。 */
  async editNameAndSave(value: string, index = 1) {
    await this.nameInput(index).fill(value);
    await this.saveButton.click();
  }

  /**
   * index 行の名称・説明をともに書き換えて保存する。
   * フロント参照（/help/tradelaw）は name と description が両方非空の行のみ表示するため、
   * フロント反映確認では名称も非空にする必要がある（仕様: データ整合性・両値非空のみ表示）。
   */
  async editRowAndSave(name: string, description: string, index = 1) {
    await this.nameInput(index).fill(name);
    await this.descriptionInput(index).fill(description);
    await this.saveButton.click();
  }

  /** 編集画面の主要UI部品が仕様どおり表示されること。 */
  async seeEditForm() {
    await expect(this.cardHeading).toBeVisible();
    await expect(this.headerName).toBeVisible();
    await expect(this.headerDescription).toBeVisible();
    await expect(this.saveButton).toBeVisible();
  }
}
