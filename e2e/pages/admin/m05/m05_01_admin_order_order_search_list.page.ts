import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 受注管理 受注情報検索/一覧（M05-01）Page Object。
 * 納品ケース表 integration_test/e2e/m05_01_admin_order_order_search_list_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/pf-eccube3/m05-01_admin_order_order_search_list.md / 観点表)の挙動由来（オラクル独立性）。
 * i18n リソース(messages/validators.ja.yaml)の表示文言は実装由来のためオラクルにせず、観測挙動で判定する。
 * pf-eccube3 由来の設計だが、刷新先 ec-cube-enterprise に同一画面(admin_order / Order/index.twig)が実在するためセレクタを導出した。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_search_order`（SearchOrderType.php:464-466）由来の位置情報のみ。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * DOM id 根拠（getBlockPrefix=admin_search_order）:
 *  - 検索フォーム      → #search_form（index.twig:379 form name=search_form action=admin_order method=POST）
 *  - order_number      → #admin_search_order_order_number（index.twig:393 / SearchOrderType.php:75）
 *  - name_multi        → #admin_search_order_name_multi（index.twig:400 / :86 注文者名 複数語）
 *  - multi             → #admin_search_order_multi（index.twig相当 / :97 会社名・備考・商品コード）
 *  - shipping_multi    → #admin_search_order_shipping_multi（:108 配送複合）
 *  - kana              → #admin_search_order_kana（:152-167 注文者カナ Regex form_error.kana_only）
 *  - shipping_kana     → #admin_search_order_shipping_kana（:306-323 配送先カナ Regex form_error.kana_only）
 *  - pattern_name      → #admin_search_order_pattern_name（:298 検索パターン名）
 *  - pattern_id(hidden)→ #admin_search_order_pattern_id（:302）
 *  - 対応状況チェック群 → #admin_search_order_status（index.twig:440 ラベル横に件数リンク）
 *  - sortkey/sorttype  → .js-listSort-key / .js-listSort-type（index.twig:1058-1059 hidden）
 *  - 検索ボタン        → #search_submit（index.twig:1049 trans admin.order.search_submit_label=「検索する」 messages.ja.yaml:2415）
 *  - 検索条件クリア    → #search_clear（index.twig:933 trans admin.order.clear_search=「検索条件をクリア」 messages.ja.yaml:5529）
 *  - 検索条件保存      → #save_pattern（index.twig:431 trans admin.order.search_pattern_save=「検索条件保存」 messages.ja.yaml:5505）
 *  - 検索パターン削除  → #delete_pattern（index.twig:433 trans admin.order.search_pattern_delete messages.ja.yaml:5506・pattern_id 設定時のみ描画）
 *  - 詳細検索トグル/枠 → [data-bs-target="#searchDetail"]（index.twig:412）/ #searchDetail（index.twig:423 collapse）
 *  - 配送詳細トグル/枠 → [data-bs-target="#searchDetailDelivery"]（index.twig:968）/ #searchDetailDelivery（index.twig:980）
 *  - 件数見出し        → #search_total_count（index.twig:1055 trans admin.common.search_result=「検索結果：%count%件が該当しました」 messages.ja.yaml:1538）
 *  - ステータス件数링크 → a[href*="order_status_id="]（index.twig:452 url admin_order）
 *  - 並びアイコン      → .js-listSort（index.twig:1233-1240 data-sortkey 列ヘッダ・結果有り時のみ）
 *  - 表示件数 select   → #page_count_pulldown（index.twig:1125 値=admin_order_page count URL・結果有り時のみ）
 *  - 受注編集リンク    → a.action-edit（index.twig:1256,1265 url admin_order_edit /order/{id}/edit）
 *  - 一覧チェックボックス→ input[id^="check_"] name=ids[]（index.twig:1249）/ 全選択 #toggle_check_all（index.twig:112）
 *  - 一括操作ラッパ    → .btn-bulk-wrapper（index.twig:1100 既定 d-none・選択で表示連動）
 *  - 検索パターン링크   → a[id^="search_pattern_"]（index.twig:1078 url admin_order_search_pattern）
 *  ※ 以下の表示文言は i18n リソース(messages/validators.ja.yaml)由来のため、テストの合否判定（オラクル）には用いない。
 *    検証/エラーの主オラクルは観測挙動（件数見出し #search_total_count の有無＝一覧組立可否・遷移先URL）に置く。下記は実機確認用の参考（要確認）。
 *  - 検証失敗 空メッセージ → 「検索条件に誤りがあります」trans admin.common.search_invalid_condition（index.twig:1354 / messages.ja.yaml:1541・has_errors 時）
 *  - 0件メッセージ     → 「検索条件に合致するデータが見つかりませんでした」trans admin.common.search_no_result（index.twig:1362 / messages.ja.yaml:1542）
 *  - カナ検証エラー    → form_error.kana_only=「カタカナで入力してください。」（validators.ja.yaml:38）
 *  - パターン名未入力  → admin.order.save_pattern.error.name_empty=「検索パターン名を入力して下さい」（messages.ja.yaml:5526 / SearchOrderController.php:149）
 *  - 日付範囲エラー    → admin.common.date_range_error=「終了日時は、開始日時より大きく設定してください」（messages.ja.yaml:1418）
 *                        ※実装は trans('admin.product.date_range_error')（SearchOrderType.php:363）を用いるが当該キーは messages.ja.yaml に未定義（不具合候補#1）。期待文言は仕様由来でオラクル化し、描画文言は要実機確認。
 */
export class OrderOrderSearchListPage {
  readonly page: Page;
  readonly url: string; // 受注一覧の入口 GET /{admin_route}/order

  readonly searchForm: Locator;
  readonly orderNumber: Locator;
  readonly nameMulti: Locator;
  readonly multi: Locator;
  readonly shippingMulti: Locator;
  readonly kana: Locator;
  readonly shippingKana: Locator;
  readonly patternName: Locator;
  readonly statusBlock: Locator;

  readonly searchButton: Locator;
  readonly clearSearchBtn: Locator;
  readonly savePatternBtn: Locator;
  readonly deletePatternBtn: Locator;

  readonly detailToggle: Locator;
  readonly detailArea: Locator;
  readonly deliveryToggle: Locator;
  readonly deliveryArea: Locator;

  readonly resultCount: Locator;
  readonly statusCountLinks: Locator;
  readonly sortIcons: Locator;
  readonly pageCountPulldown: Locator;

  readonly firstOrderEditLink: Locator;
  readonly rowChecks: Locator;
  readonly bulkWrapper: Locator;
  readonly patternLinks: Locator;
  // 見出し「受注一覧」「受注管理」は default_frame 側の出力先クラスが要実機確認のため
  // 専用セレクタを創作せず、spec ではテキスト存在で確認する（trans messages.ja.yaml:2254-2255）。

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/order`;

    this.searchForm = page.locator("#search_form");
    this.orderNumber = page.locator("#admin_search_order_order_number");
    this.nameMulti = page.locator("#admin_search_order_name_multi");
    this.multi = page.locator("#admin_search_order_multi");
    this.shippingMulti = page.locator("#admin_search_order_shipping_multi");
    this.kana = page.locator("#admin_search_order_kana");
    this.shippingKana = page.locator("#admin_search_order_shipping_kana");
    this.patternName = page.locator("#admin_search_order_pattern_name");
    this.statusBlock = page.locator("#admin_search_order_status");

    this.searchButton = page.locator("#search_submit");
    this.clearSearchBtn = page.locator("#search_clear");
    this.savePatternBtn = page.locator("#save_pattern");
    this.deletePatternBtn = page.locator("#delete_pattern");

    this.detailToggle = page.locator('[data-bs-target="#searchDetail"]');
    this.detailArea = page.locator("#searchDetail");
    this.deliveryToggle = page.locator('[data-bs-target="#searchDetailDelivery"]');
    this.deliveryArea = page.locator("#searchDetailDelivery");

    this.resultCount = page.locator("#search_total_count");
    this.statusCountLinks = page.locator('a[href*="order_status_id="]');
    this.sortIcons = page.locator(".js-listSort");
    this.pageCountPulldown = page.locator("#page_count_pulldown");

    this.firstOrderEditLink = page.locator("a.action-edit").first();
    this.rowChecks = page.locator('input[id^="check_"]');
    this.bulkWrapper = page.locator(".btn-bulk-wrapper");
    this.patternLinks = page.locator('a[id^="search_pattern_"]');
  }

  /** 受注一覧を開く（GET /{admin_route}/order 初期表示）。 */
  async goto() {
    await this.page.goto(this.url);
  }

  /** セッション復元（他画面から戻る）GET /{admin_route}/order?resume=1。 */
  async gotoResume() {
    await this.page.goto(`${this.url}?resume=1`);
  }

  /** ステータス件数指定の入口 GET /{admin_route}/order?order_status_id={id}。 */
  async gotoByStatusId(statusId: number) {
    await this.page.goto(`${this.url}?order_status_id=${statusId}`);
  }

  /** 詳細検索枠を開く（パターン名・対応状況・各種日時等は初期は collapse 内）。 */
  async openDetailSearch() {
    if (!(await this.detailArea.evaluate((el) => el.classList.contains("show")))) {
      await this.detailToggle.first().click();
      await expect(this.detailArea).toBeVisible();
    }
  }

  /** 配送詳細検索枠を開く。 */
  async openDeliveryDetailSearch() {
    if (
      !(await this.deliveryArea.evaluate((el) => el.classList.contains("show")))
    ) {
      await this.deliveryToggle.first().click();
      await expect(this.deliveryArea).toBeVisible();
    }
  }

  /** 既定条件のまま検索POST（「検索する」押下）。POST再描画の完了まで待つ。 */
  async submitSearch() {
    await this.searchButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  /**
   * 指定の並びキー（data-sortkey）の列アイコンを押下して並び替え送信する。
   * 実装の並びアイコンは <a href="#" class="js-listSort"> で、クリックで hidden の
   * sortkey/sorttype を更新し #search_form を submit する（外部JS）。href="#" により
   * 一旦 URL に "#" が付くため、submit による再描画完了（networkidle）まで待ってから判定する。
   */
  async sortByKey(sortkey: string) {
    await this.page
      .locator(`.js-listSort[data-sortkey="${sortkey}"]`)
      .first()
      .click();
    await this.page.waitForLoadState("networkidle");
  }

  /** 注文番号（部分一致）で検索POST。 */
  async searchByOrderNumber(orderNumber: string) {
    await this.orderNumber.fill(orderNumber);
    await this.searchButton.click();
  }

  /**
   * 「検索条件をクリア」押下（共通 function.js の .search-clear が .input_search 等を空にする）。
   * 実装ではクリアボタン #search_clear は詳細検索枠 #searchDetail（collapse・既定非表示）内にあるため、
   * 先に詳細検索枠を開いてからクリックする。
   */
  async clearSearch() {
    await this.openDetailSearch();
    await this.clearSearchBtn.click();
  }

  /** 注文者カナへ入力して検索POST（カナ検証用）。詳細枠を開いてから入力する。 */
  async searchByKana(value: string) {
    await this.openDetailSearch();
    await this.kana.fill(value);
    await this.searchButton.click();
  }

  /** 配送先カナへ入力して検索POST（カナ検証用）。配送詳細枠を開いてから入力する。 */
  async searchByShippingKana(value: string) {
    await this.openDeliveryDetailSearch();
    await this.shippingKana.fill(value);
    await this.searchButton.click();
  }

  /** 検索パターン名を入力（または空のまま）保存ボタンを押下。 */
  async savePattern(name: string) {
    await this.openDetailSearch();
    if (name !== "") {
      await this.patternName.fill(name);
    }
    await this.savePatternBtn.click();
  }

  /** 基本検索フォームの主要UI部品が仕様どおり表示されること。 */
  async seeSearchForm() {
    await expect(this.orderNumber).toBeVisible();
    await expect(this.nameMulti).toBeVisible();
    await expect(this.multi).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }

  /** 件数見出し（検索結果：N件が該当しました）が表示されること。 */
  async seeResultCountHeading() {
    await expect(this.page.getByText("検索結果").first()).toBeVisible();
  }

  /** 指定の文言が画面に表示されること（フラッシュ/フォームエラー/空メッセージの共通確認）。 */
  async seeMessage(text: string) {
    await expect(this.page.getByText(text).first()).toBeVisible();
  }
}
