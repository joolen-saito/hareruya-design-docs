import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 カード管理 一括削除 Page Object（@admin/Card/index.twig：カード検索一覧＋一括削除）。
 * 納品ケース表 integration_test/e2e/m14_03_admin_card_card_bulk_delete_e2e_cases.md に対応。
 * 期待結果は仕様(functions/pf-eccube3/m14-03_admin_card_card_bulk_delete.md / integration-test-viewpoints.md)由来（オラクル独立性）。
 * セレクタは Twig 由来の位置情報のみ。Form制約・実装メッセージ文言は期待値に流用しない。
 *
 * 重要(仕様乖離): 設計書は pf-eccube3 / HareruyaEc プラグインのリバース。刷新先 ec-cube-enterprise では
 *  - ルートは設計の `POST /card/delete`(m14-03_admin_card_card_bulk_delete) ではなく
 *    `admin_card_bulk_delete`＝`/card/bulk_delete` を JS が `_method=DELETE` 注入で実行（index.twig:51-94, CardController.php:308）
 *  - 全選択は設計の `#allCheck` ではなく `#chose_all`（index.twig:404-406）
 *  - 成功フラッシュキーは設計 `admin.delete.complete` ではなく `admin.common.delete_complete`（CardController.php:355）
 *  - 未選択は設計「メッセージ無しで一覧へ」だが実装はJS `alert` で送信抑止（index.twig:57-60）
 *  - 支店連携通知（BranchUpdateService）は刷新先 bulkDelete に存在しない
 * これらは付帯表4(不具合候補)で管理し、テストは仕様どおりの観測（削除可否・削除実行の有無）を期待する。
 *
 * セレクタ根拠（src/Eccube/Resource/template/admin/Card/index.twig）:
 *  - 検索フォーム #admin_search_form（:176 form_start admin_card_list）
 *  - 検索ボタン button[type=submit]「検索」（:330 trans admin.common.search=「検索」 messages.ja.yaml:1446）
 *  - 検索結果件数 span.fw-bold（:332 trans admin.common.search_result messages.ja.yaml:1538）
 *  - 一括削除フォーム #form_bulk（:343 `{% if pagination.totalItemCount %}` :342）
 *  - 一括削除ボタン .btn-ec-delete.action-submit「一括削除」（:353-360 data-action=admin_card_bulk_delete / data-confirm :358）
 *  - 行チェック input[name="cardIds[]"]（:417-420 value=card.id）
 *  - 全選択 #chose_all（:404-406）
 *  - フラッシュ 成功 .alert-success / 失敗 .alert-danger（@admin/alert.twig:21-48 span.fw-bold）
 */
export class CardCardBulkDeletePage {
  readonly page: Page;
  readonly listUrl: string; // カード一覧 admin_card_list

  readonly searchForm: Locator; // #admin_search_form
  readonly searchKeyword: Locator; // フリーワード検索 searchForm.multi（index.twig:183）
  readonly searchButton: Locator; // 「検索」
  readonly searchResultCount: Locator; // 検索結果件数
  readonly bulkForm: Locator; // #form_bulk（結果あり時のみ）
  readonly bulkDeleteButton: Locator; // 「一括削除」
  readonly selectAll: Locator; // #chose_all 全選択
  readonly rowCheckboxes: Locator; // input[name="cardIds[]"]
  readonly resultTable: Locator; // 結果一覧テーブル
  readonly successAlert: Locator; // 成功フラッシュ
  readonly errorAlert: Locator; // 失敗フラッシュ

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/card`;

    this.searchForm = page.locator("#admin_search_form");
    // フリーワード検索フィールド（searchForm.multi）。Symfony フォーム命名で name は `..._search_card[multi]`。
    this.searchKeyword = this.searchForm.locator('input[name$="[multi]"]');
    this.searchButton = this.searchForm.getByRole("button", { name: "検索" });
    this.searchResultCount = page.locator("#admin_search_form span.fw-bold");
    this.bulkForm = page.locator("#form_bulk");
    this.bulkDeleteButton = page.locator("#form_bulk .btn-ec-delete.action-submit");
    this.selectAll = page.locator("#chose_all");
    this.rowCheckboxes = page.locator('input[name="cardIds[]"]');
    this.resultTable = page.locator("#form_bulk table");
    this.successAlert = page.locator(".alert-success");
    this.errorAlert = page.locator(".alert-danger");
  }

  async gotoList() {
    await this.page.goto(this.listUrl);
  }

  /** 検索フォームを送信して結果一覧を表示する（条件未指定で全件相当）。 */
  async submitSearch() {
    await this.searchButton.click();
  }

  /** カード一覧を開き検索結果を表示するまで。 */
  async openListWithResults() {
    await this.gotoList();
    await this.submitSearch();
  }

  /** ヒットしないキーワードで検索して結果0件状態にする（一括削除UIの非描画確認用）。 */
  async openListWithNoResults(keyword: string) {
    await this.gotoList();
    await this.searchKeyword.fill(keyword);
    await this.submitSearch();
  }

  /** 先頭行のカード選択チェックをオンにする。 */
  async checkFirstRow() {
    await this.rowCheckboxes.first().check();
  }

  /** 指定のカードIDの行チェックをオンにする（value=cardId）。 */
  async checkRowByCardId(cardId: string) {
    // 行チェック自体が value=cardId を持つ input なので value で直接指定する
    // （filter({has}) は子孫要素を探す指定で、input には子孫が無く 0 件になり破綻するため使わない）
    await this.page.locator(`input[name="cardIds[]"][value="${cardId}"]`).check();
  }

  /** 一括削除ボタンを押す（押下後の confirm/alert は呼び出し側で page.on('dialog') 制御）。 */
  async clickBulkDelete() {
    await this.bulkDeleteButton.click();
  }

  /** 一括削除フォーム（結果あり）が表示されていること。 */
  async seeBulkUi() {
    await expect(this.bulkForm).toBeVisible();
    await expect(this.bulkDeleteButton).toBeVisible();
    await expect(this.rowCheckboxes.first()).toBeVisible();
  }
}
