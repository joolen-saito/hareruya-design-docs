import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店舗設定（基本情報）店舗一覧（モール／テナント店舗一覧） Page Object。
 * 画面: GET/POST /{admin_route}/mall/tenant（TenantController.php:80-83 admin_mall_tenant_index / @admin/mall/tenant/index.twig）。
 * 期待結果は仕様(functions/ec-cube-enterprise/m10-14_admin_base_setting_setting_shop_mall_shop_list.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`enterprise_admin_search_tenant`（src/Eccube/Form/Type/Admin/Enterprise/SearchTenantType.php:41-44）由来の位置情報のみ。
 *
 * DOM id / セレクタ根拠:
 *  - 検索テキスト（フィールド名 id・ラベルは翻訳上「店舗名」だが実装はID/店舗名兼用）
 *      → #enterprise_admin_search_tenant_id（index.twig:158 / src/Eccube/Form/Type/Admin/Enterprise/SearchTenantType.php:31,43）
 *  - 検索CSRFトークン → #enterprise_admin_search_tenant__token（index.twig:152）
 *  - 検索ラベル「店舗名」 enterprise.admin.shop.tenant.setting.search_title（index.twig:157 / messages.ja.yaml:3659）
 *  - 検索ボタン「検索」 admin.common.search（index.twig:165 / messages.ja.yaml:1446）
 *  - 検索結果件数「検索結果：%count%件が該当しました」 admin.common.search_result（index.twig:167-168 / messages.ja.yaml:1538）
 *  - ページタイトル「店舗一覧」 enterprise.admin.shop.mall.shop_list（index.twig:15 / default_frame.twig:196 h2.c-pageTitle__title / messages.ja.yaml:3628）
 *  - サブタイトル「基本情報設定」 admin.setting.basic_info（index.twig:16 / default_frame.twig:196 .c-pageTitle__subTitle / messages.ja.yaml:2773）
 *  - 一覧テーブル列見出し: ID admin.product.product_id__short(:1848) / 店名 enterprise.admin.shop.name(:3637) / 会社名 enterprise.admin.shop.company_name(:3638) / 公開 admin.setting.shop.shop.is_public_shop(:2813) / 開店 admin.setting.shop.shop.is_open_shop(:2816)（index.twig:211-216）
 *  - 行（テナント） tr[id^="ex-tenant-"]（index.twig:222）
 *  - 行チェックボックス #check_{id}（index.twig:224-226 name=ids[] data-delete-url）/ 全選択 #trigger_check_all（index.twig:208）
 *  - 店舗名リンク a[href*="/mall/tenant/detail/"]（index.twig:230-231）
 *  - 表示件数プルダウン #page_count_pulldown（index.twig:192-197）
 *  - 一括操作ツールバー #btn_bulk（既定 d-none、行チェックで表示 index.twig:183 / toggleBtnBulk）
 *  - 一括操作ラベル「一括操作」 admin.common.bulk_actions（index.twig:184 / messages.ja.yaml:1529）
 *  - 一括削除モーダル起動ボタン「削除」 admin.product.permanently_delete（index.twig:185-186 data-bs-target=#bulkDeleteModal / messages.ja.yaml:1854）
 *  - 削除確認モーダル #bulkDeleteModal（index.twig:268）/ タイトル「店舗を削除します」 enterprise.admin.tenant.logical_delete_delete__confirm_title（index.twig:272 / messages.ja.yaml:3663）
 *  - 確認メッセージ「店舗を削除してよろしいですか？」 ...logical_delete_delete__confirm_message（index.twig:276 / messages.ja.yaml:3664）
 *  - 削除実行ボタン #bulkDelete「削除」 ...logical_delete_delete（index.twig:284 / messages.ja.yaml:3662）/ 完了ボタン #bulkDeleteDone（index.twig:285）
 *  - 検索ゼロ件メッセージ「検索条件に合致するデータが見つかりませんでした」 admin.common.search_no_result（index.twig:260 / messages.ja.yaml:1542）
 *  - 削除成功フラッシュ「削除しました」 admin.common.delete_complete（TenantController.php:332 addSuccess / JSON message / messages.ja.yaml:1400）
 */
export class BaseSettingSettingShopMallShopListPage {
  readonly page: Page;
  readonly listUrl: string;

  readonly pageTitle: Locator; // h2.c-pageTitle__title「店舗一覧」
  readonly subTitle: Locator; // .c-pageTitle__subTitle「基本情報設定」
  readonly searchInput: Locator; // #enterprise_admin_search_tenant_id
  readonly searchToken: Locator; // #enterprise_admin_search_tenant__token
  readonly searchButton: Locator; // 検索
  readonly searchResultCount: Locator; // .fw-bold「検索結果：N件が該当しました」
  readonly table: Locator; // table.table
  readonly rows: Locator; // tr[id^="ex-tenant-"]
  readonly storeLinks: Locator; // 店舗名リンク
  readonly selectAll: Locator; // #trigger_check_all
  readonly pageCountPulldown: Locator; // #page_count_pulldown
  readonly bulkToolbar: Locator; // #btn_bulk
  readonly openDeleteModalButton: Locator; // 一括削除モーダル起動「削除」
  readonly deleteModal: Locator; // #bulkDeleteModal
  readonly deleteModalTitle: Locator; // モーダルタイトル
  readonly confirmDeleteButton: Locator; // #bulkDelete
  readonly doneButton: Locator; // #bulkDeleteDone
  readonly emptyMessage: Locator; // 検索ゼロ件メッセージ
  readonly successFlash: Locator; // .alert-success

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/mall/tenant`;

    this.pageTitle = page.locator("h2.c-pageTitle__title");
    this.subTitle = page.locator(".c-pageTitle__subTitle");
    this.searchInput = page.locator("#enterprise_admin_search_tenant_id");
    this.searchToken = page.locator("#enterprise_admin_search_tenant__token");
    this.searchButton = page.locator(
      '#search_form button[type="submit"]'
    );
    this.searchResultCount = page.locator(".c-outsideBlock .fw-bold");
    this.table = page.locator("table.table");
    this.rows = page.locator('tr[id^="ex-tenant-"]');
    this.storeLinks = page.locator('a[href*="/mall/tenant/detail/"]');
    this.selectAll = page.locator("#trigger_check_all");
    this.pageCountPulldown = page.locator("#page_count_pulldown");
    this.bulkToolbar = page.locator("#btn_bulk");
    this.openDeleteModalButton = page.locator(
      '#btn_bulk button[data-bs-target="#bulkDeleteModal"]'
    );
    this.deleteModal = page.locator("#bulkDeleteModal");
    this.deleteModalTitle = page.locator("#bulkDeleteModal .modal-title");
    this.confirmDeleteButton = page.locator("#bulkDelete");
    this.doneButton = page.locator("#bulkDeleteDone");
    this.emptyMessage = page.locator(".card-body .text-muted");
    this.successFlash = page.locator(".alert-success");
  }

  async goto() {
    await this.page.goto(this.listUrl);
  }

  /** ページ送りGET（page_no をパスに指定）。 */
  async gotoPage(pageNo: number) {
    await this.page.goto(`${this.listUrl}/page/${pageNo}`);
  }

  /** 検索テキストを入力して検索実行（POST）。 */
  async search(keyword: string) {
    await this.searchInput.fill(keyword);
    await this.searchButton.click();
  }

  rowById(id: string | number): Locator {
    return this.page.locator(`#ex-tenant-${id}`);
  }

  checkboxById(id: string | number): Locator {
    return this.page.locator(`#check_${id}`);
  }

  /** 行チェックボックスを選択する。 */
  async checkRow(id: string | number) {
    await this.checkboxById(id).check();
  }

  /** 一括削除モーダルを開く（行チェック→一括操作ツールバーの削除ボタン押下）。 */
  async openDeleteModal(id: string | number) {
    await this.checkRow(id);
    await this.openDeleteModalButton.click();
  }

  /** 単一テナントの論理削除 API（Ajax DELETE）。成功時 JSON を返す。 */
  async deleteViaApi(id: string | number) {
    const res = await this.page.request.delete(
      `${this.listUrl}/${id}/delete`
    );
    return res;
  }

  /** 一覧の初期UI部品が仕様どおり表示されていること。 */
  async seeListForm() {
    await expect(this.pageTitle).toContainText("店舗一覧");
    await expect(this.searchInput).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }
}
