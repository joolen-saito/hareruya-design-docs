import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店頭買取管理 買取検索一覧（M06-01）Page Object。
 * 納品ケース表 integration_test/e2e/m06_01_admin_store_purchase_purchase_store_search_list_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/pf-eccube3/m06-01_admin_store_purchase_purchase_store_search_list.md / 観点表)の挙動由来（オラクル独立性）。
 * pf-eccube3(HareruyaEcプラグイン)由来の設計だが、刷新先 ec-cube-enterprise に同一画面
 * (admin_otcbuyorder / OtcBuyOrder/index.twig)が実在するためセレクタを導出した。
 * セレクタは Twig＋Symfony Form 由来の位置情報のみ。合否は仕様で判定する。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * DOM id 接頭辞の根拠（要実機確認）:
 *  OtcBuyOrderType は getBlockPrefix() を override せず、legacy の getName()='admin_otc_buy_order'
 *  (OtcBuyOrderType.php:209-212) を返すのみ。Symfony 4+ では getName は block prefix の決定に使われず、
 *  getBlockPrefix() 既定は StringUtil::fqcnToBlockPrefix(OtcBuyOrderType)='otc_buy_order' となる
 *  （Twig 内 data-target も '#'.getBlockPrefix() を使用＝index.twig レンダ id と一致 / Form:102,118,162,178）。
 *  よって本POMは id 接頭辞を `otc_buy_order_` と導出する。**実機で id 接頭辞(otc_buy_order_ か admin_otc_buy_order_ か)を要確認**。
 *
 * セレクタ根拠（src/Eccube/Resource/template/admin/OtcBuyOrder/index.twig / Form/Type/Admin/OtcBuyOrder/OtcBuyOrderType.php）:
 *  - 検索フォーム        → #search_form（index.twig:35 form name=search_form action=admin_otcbuyorder method=POST）
 *  - 査定ID             → #otc_buy_order_assessment_id（index.twig:46 / Form:93 TextType assessment_id）
 *  - 申込者名            → #otc_buy_order_name_multi（index.twig:52 / Form:149 name_multi）
 *  - 会員ID             → #otc_buy_order_customer_id（index.twig:60 / Form:152 IntegerType customer_id）
 *  - 商品名1〜3          → #otc_buy_order_product_name1..3（index.twig:70 / Form:199-203）
 *  - AND/OR選択(ラジオ)  → #otc_buy_order_product_name_select_0/_1（index.twig:77 / Form:188-197 0=AND 1=OR）
 *  - ステータス(select)  → #otc_buy_order_otc_buy_order_status（index.twig:86 / Form:130-142 placeholder admin.purchase.store.form.status.placeholder=「ステータスを選択」messages.ja.yaml:5180）
 *  - 買取店舗(select)    → #otc_buy_order_shop（index.twig:92 / Form:122-129 placeholder admin.purchase.store.form.shop.placeholder=「店舗を選択」messages.ja.yaml:5181）
 *  - 査定申込日時(開始)  → #otc_buy_order_application_date_from（index.twig:101 / Form:155-171 Range min 0003-01-01 minMessage form_error.out_of_range=「不正な日付です。」validators.ja.yaml:60）
 *  - 査定申込日時(終了)  → #otc_buy_order_application_date_to（index.twig:101 / Form:172-181）
 *  - 買取日時(開始/終了) → #otc_buy_order_complete_date_from / _to（index.twig:112 / Form:96-121）
 *  - 買取金額(下限/上限) → #otc_buy_order_price_from / _to（index.twig:123 / Form:143-148 TextType）
 *  - 棚戻し未完了のみ     → #otc_buy_order_restock_incomplete_only（index.twig:132 / Form:183-186 CheckboxType label「棚戻し未完了のみ表示」messages.ja.yaml:5190）
 *  - 検索ボタン         → #search_form .searchBtn（index.twig:145 trans admin.purchase.store.form.search.button=「検索する」messages.ja.yaml:5185）
 *  - 結果ブロック        → #result_list（index.twig:156 / pagination が真のときのみ描画）
 *  - 件数見出し          → #result_list_main__header .box-title（index.twig:161「検索結果 N 件 が該当しました」/ 仕様「集計条件」節）
 *  - 0件見出し          → .box-title「検索条件に該当するデータがありませんでした。」（index.twig:241 / 仕様「エッジケース」節）
 *  - 表示件数DD          → #result_list_main__pagemax_menu（index.twig:167 結果あり時のみ）
 *  - CSVダウンロードDD   → #result_list__custom_csv_menu（index.twig:181 結果あり時のみ）
 *  - 全選択              → #allCheck（index.twig:200）
 *  - 行チェックボックス  → input[name="otcBuyOrderIds[]"]（index.twig:215）
 *  - 結果テーブル        → #result_list_main__list table（index.twig:194-196）
 *  - 査定ID詳細リンク    → td[id^="result_list_main__id--"] a（index.twig:217-218 url admin_otcbuyorder_detail
 *                          ＝ /{admin_route}/otcbuyorder/{otcBuyOrderId}、otcBuyOrderId は \d+。OtcBuyOrderController.php:227-232）
 */
export class StorePurchasePurchaseStoreSearchListPage {
  readonly page: Page;
  readonly url: string; // 買取一覧の入口 GET /{admin_route}/otcbuyorder

  readonly searchForm: Locator;
  readonly assessmentId: Locator;
  readonly nameMulti: Locator;
  readonly customerId: Locator;
  readonly productName1: Locator;
  readonly productName2: Locator;
  readonly productName3: Locator;
  readonly productNameAnd: Locator; // AND ラジオ(value=0)
  readonly productNameOr: Locator; // OR ラジオ(value=1)
  readonly status: Locator;
  readonly shop: Locator;
  readonly applicationDateFrom: Locator;
  readonly applicationDateTo: Locator;
  readonly completeDateFrom: Locator;
  readonly completeDateTo: Locator;
  readonly priceFrom: Locator;
  readonly priceTo: Locator;
  readonly restockIncompleteOnly: Locator;
  readonly searchButton: Locator;

  readonly resultList: Locator;
  readonly countHeading: Locator; // 件数見出し/0件見出し（.box-title）
  readonly pageMaxMenu: Locator; // 表示件数ドロップダウン
  readonly csvMenu: Locator; // CSVダウンロードドロップダウン
  readonly allCheck: Locator;
  readonly rowCheckboxes: Locator;
  readonly resultTable: Locator;
  readonly detailLinks: Locator;

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder`;

    this.searchForm = page.locator("#search_form");
    this.assessmentId = page.locator("#otc_buy_order_assessment_id");
    this.nameMulti = page.locator("#otc_buy_order_name_multi");
    this.customerId = page.locator("#otc_buy_order_customer_id");
    this.productName1 = page.locator("#otc_buy_order_product_name1");
    this.productName2 = page.locator("#otc_buy_order_product_name2");
    this.productName3 = page.locator("#otc_buy_order_product_name3");
    this.productNameAnd = page.locator("#otc_buy_order_product_name_select_0");
    this.productNameOr = page.locator("#otc_buy_order_product_name_select_1");
    this.status = page.locator("#otc_buy_order_otc_buy_order_status");
    this.shop = page.locator("#otc_buy_order_shop");
    this.applicationDateFrom = page.locator("#otc_buy_order_application_date_from");
    this.applicationDateTo = page.locator("#otc_buy_order_application_date_to");
    this.completeDateFrom = page.locator("#otc_buy_order_complete_date_from");
    this.completeDateTo = page.locator("#otc_buy_order_complete_date_to");
    this.priceFrom = page.locator("#otc_buy_order_price_from");
    this.priceTo = page.locator("#otc_buy_order_price_to");
    this.restockIncompleteOnly = page.locator("#otc_buy_order_restock_incomplete_only");
    this.searchButton = page.locator("#search_form .searchBtn");

    this.resultList = page.locator("#result_list");
    this.countHeading = page.locator(".box-title");
    this.pageMaxMenu = page.locator("#result_list_main__pagemax_menu");
    this.csvMenu = page.locator("#result_list__custom_csv_menu");
    this.allCheck = page.locator("#allCheck");
    this.rowCheckboxes = page.locator('input[name="otcBuyOrderIds[]"]');
    this.resultTable = page.locator("#result_list_main__list table");
    this.detailLinks = page.locator('td[id^="result_list_main__id--"] a');
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 査定IDで検索実行（POST admin_otcbuyorder）。 */
  async searchByAssessmentId(value: string) {
    await this.assessmentId.fill(value);
    await this.searchButton.click();
  }

  /** 条件未指定で検索実行（全件相当）。 */
  async searchAll() {
    await this.searchButton.click();
  }

  /** 検索パネルの主要入力項目が仕様どおり表示されること（オラクル＝仕様「フロント挙動」節の項目）。 */
  async seeSearchPanel() {
    await expect(this.assessmentId).toBeVisible();
    await expect(this.nameMulti).toBeVisible();
    await expect(this.customerId).toBeVisible();
    await expect(this.productName1).toBeVisible();
    await expect(this.productName2).toBeVisible();
    await expect(this.productName3).toBeVisible();
    await expect(this.productNameAnd).toBeAttached();
    await expect(this.productNameOr).toBeAttached();
    await expect(this.status).toBeVisible();
    await expect(this.shop).toBeVisible();
    await expect(this.applicationDateFrom).toBeVisible();
    await expect(this.applicationDateTo).toBeVisible();
    await expect(this.completeDateFrom).toBeVisible();
    await expect(this.completeDateTo).toBeVisible();
    await expect(this.priceFrom).toBeVisible();
    await expect(this.priceTo).toBeVisible();
    await expect(this.restockIncompleteOnly).toBeAttached();
    await expect(this.searchButton).toBeVisible();
  }

  /** 結果テーブルの見出しが仕様の7列（査定ID/申込者/買取金額/買取店舗/査定担当者/最終更新者/ステータス）であること。 */
  async seeResultTableHeaders() {
    await expect(this.resultTable.first()).toBeVisible();
    const headers = ["査定ID", "申込者", "買取金額", "買取店舗", "査定担当者", "最終更新者", "ステータス"];
    for (const h of headers) {
      await expect(this.resultTable.first().locator("thead")).toContainText(h);
    }
  }
}
