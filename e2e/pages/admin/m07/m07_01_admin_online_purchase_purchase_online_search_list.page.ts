import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 ネット買取管理 買取検索一覧（M07-01）Page Object。
 * 納品ケース表 integration_test/e2e/m07_01_admin_online_purchase_purchase_online_search_list_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/pf-eccube3/m07-01_admin_online_purchase_purchase_online_search_list.md / 観点表)の挙動由来（オラクル独立性）。
 * pf-eccube3(HareruyaEcプラグイン)由来の設計だが、刷新先 ec-cube-enterprise に同一画面
 * (admin_purchase_list / Purchase/index.twig)が実在するためセレクタを導出した。
 * セレクタは Twig＋Symfony Form 由来の位置情報のみ。合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * DOM id 接頭辞: Symfony Form getBlockPrefix()='admin_purchase_list'（PurchaseListType.php:188-191）。
 *  各フィールド id は `admin_purchase_list_<field>`。日付欄は EntityType の進捗ステータス名(MtbBuyOrderStatus::BUY_ORDER_STATUS)
 *  ＋'_date_from'/'_date_to'（DtbBuyOrderRepository.php:45-46 の DATE_FROM/DATE_TO 定数）で生成（PurchaseListType.php:90-115）。
 *
 * セレクタ根拠（src/Eccube/Resource/template/admin/Purchase/index.twig / Form/Type/Admin/Purchase/PurchaseListType.php / Controller/Admin/Purchase/PurchaseController.php）:
 *  - 検索フォーム        → #search_form（index.twig:47 form name=search_form action=admin_purchase_search page_no=1 method=POST）
 *  - 買取状況(select複数) → #admin_purchase_list_buy_order_status（index.twig:51-52 / Form:82-88 EntityType multiple＝select2 / label trans admin.purchase.online.form.buy_order_status.label=「買取状況」messages.ja.yaml:5217）
 *  - 買取番号            → #admin_purchase_list_purchase_number（index.twig:56-57 / Form:119 TextType・Length max eccube_stext_len:126）
 *  - 注文者名            → #admin_purchase_list_name_multi（index.twig:63-64 / Form:130 name_multi）
 *  - 利用回数(下限/上限)  → #admin_purchase_list_orderCountFrom / _orderCountTo（index.twig:71,76 / Form:158-169 IntegerType attr min=1）
 *  - 商品名1〜3          → #admin_purchase_list_product_name1..3（index.twig:89 / Form:178-182）
 *  - AND/OR選択(ラジオ)  → #admin_purchase_list_product_name_select_0/_1（index.twig:98 / Form:138-147 0=AND 1=OR）
 *  - 本人確認(チェック複数)→ input[name="admin_purchase_list[identityConfirmStatus][]"]（index.twig:103 / Form:149-156 expanded multiple）
 *  - 進捗日付(開始)       → #admin_purchase_list_request_date_from（index.twig:108-128 / Form:90-115。ORDERED の from のみ既定 -3month:110）
 *  - 棚戻し未完了のみ      → #admin_purchase_list_restock_incomplete_only（index.twig:133 / Form:171 CheckboxType）
 *  - 検索条件クリアボタン  → .search-clear（index.twig:143 trans admin.purchase.online.form.clear_search_conditions.label=「検索条件をクリア」messages.ja.yaml:5243）
 *  - 検索ボタン          → #search_form button[type=submit]（index.twig:144 trans admin.common.search=「検索」messages.ja.yaml:1446）
 *  - 件数見出し          → .fw-bold（index.twig:150 trans admin.common.search_result=「検索結果：%count%件が該当しました」messages.ja.yaml:1538。pagination 真のときのみ）
 *  - 結果ブロック         → #result_list_main（index.twig:206。pagination 真のときのみ描画＝POST検索/ページGET後）
 *  - 結果テーブル         → #result_list_main__list table（index.twig:207-209。totalItemCount>0 のときのみ）
 *  - 0件メッセージ        → 「検索条件に該当するデータがありませんでした。」（index.twig:305。pagination 真かつ 0 件のとき）
 *  - 表示件数プルダウン    → #page_count_pulldown（index.twig:182。change で admin_purchase_page {page_no:1, page_count} へ遷移:184）
 *  - CSVダウンロードDD    → #result_list__custom_csv_menu（index.twig:166。結果あり時のみ）
 *  - 並び順DD            → #result_list_main__sort_menu（index.twig:188。サブメニューに admin_purchase_page sort/order=ASC|DESC:197-198）
 *  - 全選択              → #allCheck（index.twig:212）
 *  - 行チェックボックス    → input[name="buyOrderIds[]"]（index.twig:231）
 *  - 買取番号詳細リンク    → td[id^="result_list_main__purchase_number--"] a（index.twig:233-234 url admin_purchase_edit＝/{admin_route}/purchase/{id}/edit。id は \d+。Controller:199）
 *  - 注文者名リンク        → .post_name（index.twig:243。氏名自動検索）
 */
export class OnlinePurchasePurchaseOnlineSearchListPage {
  readonly page: Page;
  readonly url: string; // 買取一覧の入口 GET /{admin_route}/purchase/list

  readonly searchForm: Locator;
  readonly buyOrderStatus: Locator;
  readonly purchaseNumber: Locator;
  readonly nameMulti: Locator;
  readonly orderCountFrom: Locator;
  readonly orderCountTo: Locator;
  readonly productName1: Locator;
  readonly productName2: Locator;
  readonly productName3: Locator;
  readonly productNameAnd: Locator; // AND ラジオ(value=0)
  readonly productNameOr: Locator; // OR ラジオ(value=1)
  readonly identityConfirmChecks: Locator; // 本人確認チェック群
  readonly requestDateFrom: Locator; // 買取依頼日(開始)。既定値 -3month
  readonly restockIncompleteOnly: Locator;
  readonly clearButton: Locator;
  readonly searchButton: Locator;

  readonly countHeading: Locator; // 件数見出し（pagination 真のとき）
  readonly resultBlock: Locator; // #result_list_main
  readonly resultTable: Locator;
  readonly pageCountPulldown: Locator;
  readonly csvMenu: Locator;
  readonly sortMenu: Locator;
  readonly allCheck: Locator;
  readonly rowCheckboxes: Locator;
  readonly purchaseNumberLinks: Locator;
  readonly nameLinks: Locator;
  readonly searchFormCsrfTokens: Locator; // 検索フォーム内の隠しCSRFトークン（無効化なら0件）
  readonly rowMenuEditLinks: Locator; // 行メニュー内の編集リンク（買取番号リンクとは別）
  readonly rowMenuDeleteLinks: Locator; // 行メニュー内の削除リンク
  readonly rowMenuMailLinks: Locator; // 行メニュー内のメール通知リンク

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/purchase/list`;

    this.searchForm = page.locator("#search_form");
    this.buyOrderStatus = page.locator("#admin_purchase_list_buy_order_status");
    this.purchaseNumber = page.locator("#admin_purchase_list_purchase_number");
    this.nameMulti = page.locator("#admin_purchase_list_name_multi");
    this.orderCountFrom = page.locator("#admin_purchase_list_orderCountFrom");
    this.orderCountTo = page.locator("#admin_purchase_list_orderCountTo");
    this.productName1 = page.locator("#admin_purchase_list_product_name1");
    this.productName2 = page.locator("#admin_purchase_list_product_name2");
    this.productName3 = page.locator("#admin_purchase_list_product_name3");
    this.productNameAnd = page.locator("#admin_purchase_list_product_name_select_0");
    this.productNameOr = page.locator("#admin_purchase_list_product_name_select_1");
    this.identityConfirmChecks = page.locator(
      'input[name="admin_purchase_list[identityConfirmStatus][]"]'
    );
    this.requestDateFrom = page.locator("#admin_purchase_list_request_date_from");
    this.restockIncompleteOnly = page.locator("#admin_purchase_list_restock_incomplete_only");
    this.clearButton = page.locator("#search_form .search-clear");
    this.searchButton = page.locator('#search_form button[type="submit"]');

    this.countHeading = page.locator("#search_form .fw-bold");
    this.resultBlock = page.locator("#result_list_main");
    this.resultTable = page.locator("#result_list_main__list table");
    this.pageCountPulldown = page.locator("#page_count_pulldown");
    this.csvMenu = page.locator("#result_list__custom_csv_menu");
    this.sortMenu = page.locator("#result_list_main__sort_menu");
    this.allCheck = page.locator("#allCheck");
    this.rowCheckboxes = page.locator('input[name="buyOrderIds[]"]');
    this.purchaseNumberLinks = page.locator(
      'td[id^="result_list_main__purchase_number--"] a'
    );
    this.nameLinks = page.locator(".post_name");
    // CSRF無効化(PurchaseListType.php:73 csrf_protection=false)の観測＝検索フォームにトークン隠し項目が無い。
    this.searchFormCsrfTokens = this.searchForm.locator(
      'input[type="hidden"][name*="_token"]'
    );
    // 行メニュー(index.twig:282-285 ul#result_list_main__menu--{id})内のリンク。買取番号リンク(:233-234)とは別。
    this.rowMenuEditLinks = page.locator(
      '[id^="result_list_main__menu--"] a[href*="/edit"]'
    );
    this.rowMenuDeleteLinks = page.locator(
      '[id^="result_list_main__menu--"] a[href*="/delete"]'
    );
    this.rowMenuMailLinks = page.locator(
      '[id^="result_list_main__menu--"] a[href*="manual_mail"]'
    );
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 買取番号で検索実行（POST admin_purchase_search）。 */
  async searchByPurchaseNumber(value: string) {
    await this.purchaseNumber.fill(value);
    await this.searchButton.click();
  }

  /** 条件未指定（既定の日付のみ）で検索実行。 */
  async searchAll() {
    await this.searchButton.click();
  }

  /** 検索パネルの主要入力項目が仕様どおり表示されること（オラクル＝仕様「フロント挙動／入力項目」節）。 */
  async seeSearchPanel() {
    await expect(this.buyOrderStatus).toBeAttached();
    await expect(this.purchaseNumber).toBeVisible();
    await expect(this.nameMulti).toBeVisible();
    await expect(this.productName1).toBeVisible();
    await expect(this.productName2).toBeVisible();
    await expect(this.productName3).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }

  /** 二次的な入力項目（AND/OR・本人確認・利用回数・棚戻し）が仕様どおり存在すること。 */
  async seeSecondaryInputs() {
    await expect(this.productNameAnd).toBeAttached();
    await expect(this.productNameOr).toBeAttached();
    await expect(this.orderCountFrom).toBeVisible();
    await expect(this.orderCountTo).toBeVisible();
    await expect(this.restockIncompleteOnly).toBeAttached();
    expect(await this.identityConfirmChecks.count()).toBeGreaterThan(0);
  }

  /** 結果テーブルの見出しが仕様の列（買取番号/買取依頼日/買取依頼者氏名/本人確認/買取詳細/箱数/買取状況/利用回数）であること。 */
  async seeResultTableHeaders() {
    await expect(this.resultTable.first()).toBeVisible();
    const headers = [
      "買取番号",
      "買取依頼日",
      "買取依頼者氏名",
      "本人確認",
      "買取詳細",
      "箱数",
      "買取状況",
      "利用回数",
    ];
    for (const h of headers) {
      await expect(this.resultTable.first().locator("thead")).toContainText(h);
    }
  }
}
