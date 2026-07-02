import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 受注管理 出荷指示リスト検索（M05-19）Page Object。
 * 納品ケース表 integration_test/e2e/m05_19_admin_order_order_shipping_standby_list_search_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/pf-eccube3/m05-19_admin_order_order_shipping_standby_list_search.md / 観点表)の挙動由来（オラクル独立性）。
 * i18n リソース(messages.ja.yaml)の表示文言・Form制約(required等)は実装由来のためオラクルにせず、観測挙動で判定する。
 * pf-eccube3 由来の設計だが、刷新先 ec-cube-enterprise に同一画面(route admin_shipping_standby /
 * @admin/ShippingStandby/index.twig)が実在するためセレクタを導出した。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_shipping_standby`（ShippingStandbyType.php:88-91）由来の位置情報のみ。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * DOM id 根拠（getBlockPrefix=admin_shipping_standby）:
 *  - 検索フォーム      → #search_form（index.twig:122 form name=search_form action=admin_shipping_standby(page_no:1) method=POST）
 *  - standby_id        → #admin_shipping_standby_standby_id（index.twig:130 / ShippingStandbyType.php:67 IntegerType）
 *  - order_id          → #admin_shipping_standby_order_id（index.twig:135 / :71 IntegerType・画面ラベルは注文番号だが dtb_order.id 一致）
 *  - create_date_from  → #admin_shipping_standby_create_date_from（index.twig:144 / :39 DateTimeType single_text）
 *  - create_date_to    → #admin_shipping_standby_create_date_to（index.twig:149 / :46）
 *  - update_date_from  → #admin_shipping_standby_update_date_from（index.twig:159 / :53）
 *  - update_date_to    → #admin_shipping_standby_update_date_to（index.twig:164 / :60）
 *  - order_type        → #admin_shipping_standby_order_type（index.twig:176 / :75 EntityType expanded multiple → チェックボックス群）
 *  - 検索ボタン        → button[form="search_form"]（index.twig:195 trans admin.order.shipping_standby_search_multi=「検索する」 messages.ja.yaml:2479）
 *  - 検索条件クリア    → .search-clear（index.twig:184 trans admin.common.search_clear=「検索条件をクリア」 messages.ja.yaml:1545・共通 function.js が search-box-inner 内入力をクリア）
 *  - 検索カード見出し  → h3.card-title（index.twig:118 trans admin.order.shipping_standby_search=「出荷指示リスト検索」 messages.ja.yaml:2478）
 *  - 一覧ブロック      → #result_list（index.twig:202・`{% if pagination %}` で囲まれ初期表示は非描画）
 *  - 件数見出し        → #search_total_count（index.twig:208 trans admin.common.search_result messages.ja.yaml:1538・totalItemCount>0 時のみ）
 *  - 表示件数 select   → #page_count_pulldown（index.twig:214・結果有り時のみ・各 option value=/standby/page/1?page_count=…）
 *  - 一覧行            → tr[id^="result_list_main__item--"]（index.twig:242）
 *  - 行の編集リンク    → #result_list a[href*="/standby/"][href*="/edit"]（index.twig:244 route admin_shipping_standby_edit /standby/{id}/edit）
 *  ※ ページタイトル「出荷指示」(block title index.twig:15)・サブタイトル「受注管理」(block sub_title index.twig:16)は
 *    default_frame 側の出力先クラスが要実機確認のため専用セレクタを創作せず、spec ではテキスト存在で確認する。
 *  ※ 0件メッセージは trans admin.common.search_no_result=「検索条件に合致するデータが見つかりませんでした」(index.twig:317)。
 *    設計文言「検索条件に該当するデータがありませんでした。」と差異あり（不具合候補#2）。文言はオラクル化しない。
 */
export class OrderOrderShippingStandbyListSearchPage {
  readonly page: Page;
  readonly url: string; // 出荷指示リスト検索の入口 GET /{admin_route}/standby/search

  readonly searchForm: Locator;
  readonly standbyId: Locator;
  readonly orderId: Locator;
  readonly createDateFrom: Locator;
  readonly createDateTo: Locator;
  readonly updateDateFrom: Locator;
  readonly updateDateTo: Locator;
  readonly orderTypeBlock: Locator;

  readonly searchButton: Locator;
  readonly clearLink: Locator;
  readonly searchCardTitle: Locator;

  readonly resultList: Locator;
  readonly resultCount: Locator;
  readonly pageCountPulldown: Locator;
  readonly resultRows: Locator;
  readonly firstEditLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/standby/search`;

    this.searchForm = page.locator("#search_form");
    this.standbyId = page.locator("#admin_shipping_standby_standby_id");
    this.orderId = page.locator("#admin_shipping_standby_order_id");
    this.createDateFrom = page.locator("#admin_shipping_standby_create_date_from");
    this.createDateTo = page.locator("#admin_shipping_standby_create_date_to");
    this.updateDateFrom = page.locator("#admin_shipping_standby_update_date_from");
    this.updateDateTo = page.locator("#admin_shipping_standby_update_date_to");
    this.orderTypeBlock = page.locator("#admin_shipping_standby_order_type");

    this.searchButton = page.locator('button[form="search_form"]');
    this.clearLink = page.locator(".search-clear");
    this.searchCardTitle = page.locator("h3.card-title");

    this.resultList = page.locator("#result_list");
    this.resultCount = page.locator("#search_total_count");
    this.pageCountPulldown = page.locator("#page_count_pulldown");
    this.resultRows = page.locator('tr[id^="result_list_main__item--"]');
    this.firstEditLink = page
      .locator('#result_list a[href*="/standby/"][href*="/edit"]')
      .first();
  }

  /** 出荷指示リスト検索を開く（GET /{admin_route}/standby/search 初期表示）。 */
  async goto() {
    await this.page.goto(this.url);
  }

  /**
   * ページ番号指定で開く。設計「入口」表のページネーションのリンク
   * （pager.twig 由来＝同一ルートにクエリ page_no を付与した GET /{admin_route}/standby/search?page_no=N）を代表とする。
   * 別経路 /standby/page/{n}（route admin_shipping_standby_page）も設計入口表に定義あり（付帯表4参照）。
   */
  async gotoPage(pageNo: number) {
    await this.page.goto(`${this.url}?page_no=${pageNo}`);
  }

  /** 既定条件のまま検索POST（「検索する」押下）。 */
  async submitSearch() {
    await this.searchButton.click();
  }

  /** 出荷指示番号で絞り込み検索POST。 */
  async searchByStandbyId(standbyId: string) {
    await this.standbyId.fill(standbyId);
    await this.searchButton.click();
  }

  /** 「検索条件をクリア」押下（共通 function.js の .search-clear が search-box-inner 内入力を空にする）。 */
  async clearSearch() {
    await this.clearLink.click();
  }

  /** 検索フォームの主要UI部品が仕様どおり表示されること。 */
  async seeSearchForm() {
    await expect(this.standbyId).toBeVisible();
    await expect(this.orderId).toBeVisible();
    await expect(this.createDateFrom).toBeVisible();
    await expect(this.createDateTo).toBeVisible();
    await expect(this.updateDateFrom).toBeVisible();
    await expect(this.updateDateTo).toBeVisible();
    // ケース E2E-003 の確認対象「注文区分」を実装でも検証する（旧版は未検証だった）。
    // order_type は EntityType expanded multiple のチェックボックス群コンテナ（getBlockPrefix 由来 id）。
    await expect(this.orderTypeBlock).toBeAttached();
    await expect(this.searchButton).toBeVisible();
    await expect(this.clearLink).toBeVisible();
  }
}
