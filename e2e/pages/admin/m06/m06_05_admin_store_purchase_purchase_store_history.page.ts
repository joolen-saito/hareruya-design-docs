import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店頭買取管理 > 買取商品履歴（検索／一覧／CSV）Page Object。
 * 期待結果は仕様(正本 functions/pf-eccube3/m06-05_admin_store_purchase_purchase_store_history.md / 観点表)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form 由来の位置情報のみ。挙動の合否は仕様で判定する。
 *
 * 画面実在: 刷新先 ec-cube-enterprise に route admin_otcbuyorder_history（GET/POST）・_page・_export が実在
 *   （OtcBuyOrderHistoryController.php:60-75,130-136 / template @admin/OtcBuyOrder/history.twig）。
 *
 * DOM id 根拠: Symfony Form の id は **getBlockPrefix()** 由来。本 Type は getBlockPrefix() を未定義のため、
 *   AbstractType::getBlockPrefix()=StringUtil::fqcnToBlockPrefix(static::class) が効き、FQCN末尾 `OtcBuyOrderHistoryType`
 *   → block prefix `otc_buy_order_history` となる（AbstractType.php:62 / StringUtil.php:52-57）。
 *   ※ Type が定義する getName()=`admin_otc_buy_order_history`（OtcBuyOrderHistoryType.php:179-182）は現行 Symfony では
 *     block prefix に使われない。実 DOM id は `#otc_buy_order_history_<field>`（form_widget 出力）。
 *   - assessment_id   → #otc_buy_order_history_assessment_id  （history.twig:44 / Type.php:81）
 *   - customer_name   → #otc_buy_order_history_customer_name  （history.twig:50 / Type.php:87）
 *   - customer_id     → #otc_buy_order_history_customer_id    （history.twig:58 / Type.php:84）
 *   - otc_buy_order_status（展開チェック6種）→ #otc_buy_order_history_otc_buy_order_status_0..5（history.twig:66 / Type.php:90-101,37-44）
 *   - shop（単一セレクト placeholder「店舗を選択」）→ #otc_buy_order_history_shop（history.twig:74 / Type.php:123-131 / messages.ja.yaml:5200）
 *   - assessment_member_name → #otc_buy_order_history_assessment_member_name（history.twig:80 / Type.php:132）
 *   - product_code    → #otc_buy_order_history_product_code   （history.twig:88 / Type.php:150）
 *   - product_name    → #otc_buy_order_history_product_name   （history.twig:94 / Type.php:147）
 *   - complete_date_from/to（日時 single_text）→ #otc_buy_order_history_complete_date_from/to（history.twig:103 / Type.php:103-122）
 *   - standard_price_from/to（整数）→ #otc_buy_order_history_standard_price_from/to（history.twig:111 / Type.php:141-144）
 *   - buy_price_from/to（整数）→ #otc_buy_order_history_buy_price_from/to（history.twig:121 / Type.php:135-138）
 *   - language（展開チェック3種 日本語/英語/その他言語）→ #otc_buy_order_history_language_0..2（history.twig:131 / Type.php:153-162）
 *   - condition（展開チェック4種 NM/SP/MP/HP）→ #otc_buy_order_history_condition_0..3（history.twig:139 / Type.php:163-173）
 *   検索ボタン「検索する」 trans admin.purchase.store.history.form.search.button（history.twig:151-152 / messages.ja.yaml:5206）。
 *   結果領域 #result_list（history.twig:161）。件数見出し box-title「検索結果 N 件 が該当しました」（history.twig:166）。
 *   0件メッセージ「検索条件に該当するデータがありませんでした。」（history.twig:254）。
 *   行チェック name=otcBuyOrderHistoryIds[]（history.twig:226）/ 全選択 #allCheck（history.twig:203）。
 *   CSV メニュー #result_list__custom_csv_menu（history.twig:186）/ a.export-link[data-type=check_export|all_export]（history.twig:189-190）/ hidden #export_type（history.twig:159）。
 *   タイトル「店頭買取管理」（history.twig:6 / messages.ja.yaml:5171）/ サブタイトル「買取商品履歴」（history.twig:7 / messages.ja.yaml:5173）。
 */
export class StorePurchasePurchaseStoreHistoryPage {
  readonly page: Page;
  readonly url: string; // 初回表示・検索POST（同一URL）
  readonly exportUrl: string; // CSV出力POST先

  // 検索フォーム
  readonly searchForm: Locator; // history.twig:33 #search_form
  readonly assessmentId: Locator; // history.twig:44
  readonly customerName: Locator; // history.twig:50
  readonly customerId: Locator; // history.twig:58
  readonly statusGroup: Locator; // history.twig:64 ステータス展開チェック群
  readonly statusChecks: Locator; // 6種チェック
  readonly shop: Locator; // history.twig:74 店舗セレクト
  readonly assessmentMemberName: Locator; // history.twig:80
  readonly productCode: Locator; // history.twig:88
  readonly productName: Locator; // history.twig:94
  readonly completeDateFrom: Locator; // history.twig:103
  readonly completeDateTo: Locator; // history.twig:103
  readonly standardPriceFrom: Locator; // history.twig:111
  readonly standardPriceTo: Locator; // history.twig:111
  readonly buyPriceFrom: Locator; // history.twig:121
  readonly buyPriceTo: Locator; // history.twig:121
  readonly languageChecks: Locator; // history.twig:131 言語3種
  readonly conditionChecks: Locator; // history.twig:139 状態4種
  readonly searchButton: Locator; // history.twig:151 「検索する」

  // 結果・CSV
  readonly resultArea: Locator; // history.twig:161 #result_list
  readonly resultHeader: Locator; // history.twig:166 box-title（検索結果 N 件）
  readonly allCheck: Locator; // history.twig:203 #allCheck
  readonly rowChecks: Locator; // history.twig:226 otcBuyOrderHistoryIds[]
  readonly csvMenu: Locator; // history.twig:186 CSVダウンロード
  readonly exportCheckedLink: Locator; // history.twig:189 選択した商品履歴取得
  readonly exportAllLink: Locator; // history.twig:190 検索結果全件取得

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/history`;
    this.exportUrl = `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/history/export`;

    const p = "#otc_buy_order_history";
    this.searchForm = page.locator("#search_form");
    this.assessmentId = page.locator(`${p}_assessment_id`);
    this.customerName = page.locator(`${p}_customer_name`);
    this.customerId = page.locator(`${p}_customer_id`);
    this.statusGroup = page.locator("#search_box__otc_buy_order_status");
    this.statusChecks = page.locator(
      'input[id^="otc_buy_order_history_otc_buy_order_status_"]'
    );
    this.shop = page.locator(`${p}_shop`);
    this.assessmentMemberName = page.locator(`${p}_assessment_member_name`);
    this.productCode = page.locator(`${p}_product_code`);
    this.productName = page.locator(`${p}_product_name`);
    this.completeDateFrom = page.locator(`${p}_complete_date_from`);
    this.completeDateTo = page.locator(`${p}_complete_date_to`);
    this.standardPriceFrom = page.locator(`${p}_standard_price_from`);
    this.standardPriceTo = page.locator(`${p}_standard_price_to`);
    this.buyPriceFrom = page.locator(`${p}_buy_price_from`);
    this.buyPriceTo = page.locator(`${p}_buy_price_to`);
    this.languageChecks = page.locator(
      'input[id^="otc_buy_order_history_language_"]'
    );
    this.conditionChecks = page.locator(
      'input[id^="otc_buy_order_history_condition_"]'
    );
    this.searchButton = page.locator("button.searchBtn");

    this.resultArea = page.locator("#result_list");
    this.resultHeader = page.locator("#result_list .box-title");
    this.allCheck = page.locator("#allCheck");
    this.rowChecks = page.locator('input[name="otcBuyOrderHistoryIds[]"]');
    this.csvMenu = page.locator("#result_list__custom_csv_menu");
    this.exportCheckedLink = page.locator(
      'a.export-link[data-type="check_export"]'
    );
    this.exportAllLink = page.locator('a.export-link[data-type="all_export"]');
  }

  async goto() {
    await this.page.goto(this.url);
  }

  async gotoPage(pageNo: number) {
    await this.page.goto(`${this.url}/page/${pageNo}`);
  }

  /** 検索ボタンを押す（POST 同一URL）。 */
  async clickSearch() {
    await this.searchButton.click();
  }

  /** 査定IDのみ指定して検索する（完全一致。0件再現等に使う）。 */
  async searchByAssessmentId(value: string) {
    await this.assessmentId.fill(value);
    await this.clickSearch();
  }

  /** 検索フォームの主要入力部品が仕様どおり表示されること。 */
  async seeSearchForm() {
    await expect(this.assessmentId).toBeVisible();
    await expect(this.customerName).toBeVisible();
    await expect(this.customerId).toBeVisible();
    await expect(this.productCode).toBeVisible();
    await expect(this.productName).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }

  /** 買取店舗セレクト・査定担当者名・日時/価格レンジ入力が仕様どおり表示されること（E2E-006）。 */
  async seeAdditionalSearchFields() {
    await expect(this.shop).toBeVisible();
    await expect(this.assessmentMemberName).toBeVisible();
    await expect(this.completeDateFrom).toBeVisible();
    await expect(this.completeDateTo).toBeVisible();
    await expect(this.standardPriceFrom).toBeVisible();
    await expect(this.standardPriceTo).toBeVisible();
    await expect(this.buyPriceFrom).toBeVisible();
    await expect(this.buyPriceTo).toBeVisible();
  }

  /** 0件時の仕様メッセージ表示。 */
  async seeNoResultMessage() {
    await expect(this.page.locator("body")).toContainText(
      "検索条件に該当するデータがありませんでした。"
    );
  }
}
