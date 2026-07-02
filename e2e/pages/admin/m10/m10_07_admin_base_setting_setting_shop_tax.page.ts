import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店舗設定 — 税率設定（共通税率の一覧／新規登録／インライン編集／削除）Page Object。
 * 画面タイプ: other（list ＋ register/crud ＋ delete モーダル）。
 * 納品ケース表 integration_test/e2e/m10_07_admin_base_setting_setting_shop_tax_e2e_cases.md に対応。
 *
 * 期待結果（合否）は仕様（設計書 functions/pf-eccube3/m10-07_admin_base_setting_setting_shop_tax.md ＋ 観点表）由来とする
 * （オラクル独立性）。本ファイルが実装から取るのは **セレクタ（位置情報）のみ**で、必須/範囲/制約は期待結果へ流用しない。
 *
 * 重要（仕様乖離あり・付帯表4）: 設計源は pf-eccube3。刷新先 ec-cube-enterprise には設計書が定める
 *  「個別税率設定ブロック（商品別税率機能ラジオ＋上部『登録』＋edit_param 経路）」が無い（不具合候補#1）。
 *  削除は物理削除（#4）、編集はインライン mode=edit_inline（#5）、新規ボタンは「新規作成」(#5)、
 *  課税規則は select（#6）、タイトル/サブタイトルが逆（#7）。テストは仕様どおりに書き、乖離は失敗で検出する。
 *
 * セレクタ根拠（ec-cube-enterprise 現行ソース。行番号は src 基準）:
 *  - フォームDOM id は Symfony Form の getBlockPrefix='tax_rule'（TaxRuleType.php:112-114）由来。
 *    tax_rate→#tax_rule_tax_rate / rounding_type→#tax_rule_rounding_type(select RoundingTypeType.php:31) /
 *    apply_date→#tax_rule_apply_date / _token→#tax_rule__token。基本税率行は apply_date を remove（Controller.php:106）。
 *  一覧/新規（tax_rule.twig）:
 *  - 見出し: h2.c-pageTitle__title「税率設定」(default_frame.twig:196 / tax_rule.twig:15 admin.setting.shop.tax_setting messages.ja.yaml:2782)
 *  - サブ見出し: span.c-pageTitle__subTitle「基本情報設定」(default_frame.twig:196 / tax_rule.twig:16 admin.setting.basic_info:2773)
 *  - 新規税率欄: #tax_rule_tax_rate(tax_rule.twig:92) / #tax_rule_rounding_type(:98) / #tax_rule_apply_date(:102) / form._token(:88)
 *  - 新規登録ボタン: button[type=submit] trans admin.common.create__new「新規作成」(tax_rule.twig:108 / messages.ja.yaml:1454)
 *  - 税率一覧テーブル: table.table（:65）/ 明細行 tr.tax_rule_list_item#ex-tax_rule-{id}（:115）
 *  - 消費税率セル（list）: tr.tax_rule_list_item .list span（:130 `{{ TaxRule.tax_rate }}` ＋ %）
 *  - 適用日時セル（基本税率は固定文言）: 「基本税率設定」trans admin.setting.shop.tax.base_rate_setting（:151 / messages.ja.yaml:2924）
 *  - 削除アイコン（基本税率以外のみ）: a[data-bs-target="#DeleteModal_{id}"]（:169 `{% if not TaxRule.default_tax_rule %}` :166）
 *  - 削除モーダル: div.modal#DeleteModal_{id}（:174）/ 見出し h5「削除します」admin.common.delete_modal__title（:180 / messages.ja.yaml:1592）
 *  - 削除実行: a.btn-ec-delete[data-method=delete] href=admin_setting_shop_tax_delete（:191-193 / csrf_token_for_anchor）
 *  フラッシュ/エラー:
 *  - 成功フラッシュ: .alert-success（alert.twig:21-22）。保存=admin.common.save_complete「保存しました」(messages.ja.yaml:1398, Controller.php:89)
 *    削除=admin.common.delete_complete「削除しました」(messages.ja.yaml:1400, Controller.php:163)
 *  - 検証エラー: bootstrap_4_horizontal_layout.html.twig:55（rootformは .alert-danger / 子は .invalid-feedback）。
 *    表示位置はフォームテーマ依存のため専用セレクタは創作せず、主観測は「保存成功フラッシュが出ない／画面に留まる」とする。
 *
 * 注: 個別税率設定ブロック（商品別税率機能）は刷新先 Twig に存在しないためセレクタは creating せず `要実機確認`。
 */
export class BaseSettingSettingShopTaxPage {
  readonly page: Page;
  readonly url: string;

  readonly pageTitle: Locator; // h2「税率設定」
  readonly subTitle: Locator; // サブ「基本情報設定」
  readonly taxRate: Locator; // 新規 消費税率
  readonly roundingType: Locator; // 新規 課税規則（select）
  readonly applyDate: Locator; // 新規 適用日時
  readonly createButton: Locator; // 「新規作成」
  readonly listTable: Locator; // 税率一覧テーブル
  readonly listRows: Locator; // 明細行
  readonly successAlert: Locator; // 成功フラッシュ
  readonly formError: Locator; // 検証エラー（位置はテーマ依存）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/setting/shop/tax`;

    this.pageTitle = page.locator("h2.c-pageTitle__title");
    this.subTitle = page.locator(".c-pageTitle__subTitle");
    this.taxRate = page.locator("#tax_rule_tax_rate");
    this.roundingType = page.locator("#tax_rule_rounding_type");
    this.applyDate = page.locator("#tax_rule_apply_date");
    // 新規共通税率フォームの送信ボタン。設計書の下部ボタン文言は「登録」、実装は「新規作成」(付帯表4#5)で乖離するため、
    // ボタン文言（実装由来）をオラクル化せず、新規入力欄を含むフォーム配下の submit を構造で特定する。
    this.createButton = page.locator(
      'form:has(#tax_rule_tax_rate) button[type="submit"], form:has(#tax_rule_tax_rate) input[type="submit"]'
    );
    this.listTable = page.locator("table.table");
    this.listRows = page.locator("tr.tax_rule_list_item");
    this.successAlert = page.locator(".alert-success");
    this.formError = page.locator(".invalid-feedback, .alert-danger");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 削除モーダルのトリガー（基本税率以外の行のみ存在）。 */
  deleteTrigger(id: string | number): Locator {
    return this.page.locator(`a[data-bs-target="#DeleteModal_${id}"]`);
  }

  /** 削除確認モーダル本体（実装は確認モーダルあり＝設計と乖離・付帯表4#3）。 */
  deleteModal(id: string | number): Locator {
    return this.page.locator(`#DeleteModal_${id}`);
  }

  /** モーダル内の削除実行リンク（DELETEメソッドはeccube JSで誘発＝要実機確認）。 */
  deleteExec(id: string | number): Locator {
    return this.page.locator(`#DeleteModal_${id} a.btn-ec-delete`);
  }

  /** 明細行（id付き）。 */
  row(id: string | number): Locator {
    return this.page.locator(`#ex-tax_rule-${id}`);
  }

  /** 新規共通税率を入力して登録する（適用日時は YYYY-MM-DD HH:mm 形式の単一テキスト）。 */
  async submitNewTaxRule(taxRate: string, applyDate?: string) {
    await this.taxRate.fill(taxRate);
    if (applyDate !== undefined) {
      await this.applyDate.fill(applyDate);
    }
    await this.createButton.click();
  }

  /** 税率設定画面の主要UI部品が仕様どおり表示されること（共通税率設定ブロック）。 */
  async seeCommonTaxForm() {
    await expect(this.taxRate).toBeVisible();
    await expect(this.roundingType).toBeVisible();
    await expect(this.applyDate).toBeVisible();
    await expect(this.createButton).toBeVisible();
  }

  /** 見出し（税率設定・基本情報設定の両テキスト）が表示されること。位置の正否は付帯表4#7で要確認。 */
  async seeHeadings() {
    await expect(this.page.locator("body")).toContainText("税率設定");
    await expect(this.page.locator("body")).toContainText("基本情報設定");
  }
}
