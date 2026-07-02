import { Locator, Page, Download, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 商品管理 買取/販売価格履歴（検索・一覧・CSV出力） Page Object。
 * 納品ケース表 integration_test/e2e/m03_23_admin_product_product_buy_sale_price_history_e2e_cases.md に対応。
 * 期待結果は仕様(正本 functions/pf-eccube3/m03-23_admin_product_product_buy_sale_price_history.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`buy_sale_price_history_search`
 * （BuySalePriceHistorySearchType はクラス名由来。JS の #buy_sale_price_history_search_product_category_id で確認 buy_sale_price_history.twig:40）由来の位置情報のみ。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * DOM id / 文言 根拠:
 *  - 検索フォーム #search_form（buy_sale_price_history.twig:54、action=admin_product_buy_sale_price_history_search page_no=1）
 *  - 複合キーワード multi → #buy_sale_price_history_search_multi（twig:63 / BuySalePriceHistorySearchType.php:38）
 *  - 日付レンジ date_from/_to → #buy_sale_price_history_search_date_from / _date_to（twig:85,90 / Form:42-55）
 *  - 商品カテゴリ → #buy_sale_price_history_search_product_category_id（twig:99,40）
 *  - 表示ステータス → #buy_sale_price_history_search_product_status（twig:104 / Admin/SearchProductType:status ProductStatusType。choice 展開コンテナ id・要実機確認）
 *  - エキスパンション(セット) → #buy_sale_price_history_search_product_cardset（twig:111 / SearchProductType:cardset EntityType・要実機確認）
 *  - レアリティ → #buy_sale_price_history_search_product_rarity（twig:116 / SearchProductType:rarity EntityType・要実機確認）
 *  - 言語 → #buy_sale_price_history_search_product_language（twig:123 / SearchProductType:language ChoiceType・要実機確認）
 *  - 状態(card_condition) → #buy_sale_price_history_search_product_card_condition（twig:128 / SearchProductType:card_condition ChoiceType・要実機確認）
 *  - 箔(foil) → #buy_sale_price_history_search_product_foil（twig:135 / SearchProductType:foil ChoiceType・要実機確認）
 *  - プロモ(promotion) → #buy_sale_price_history_search_product_promotion（twig:140 / SearchProductType:promotion・要実機確認）
 *  - 販売価格(下限/上限) → #buy_sale_price_history_search_product_sell_price_from/_to（twig:163,168 / PriceType）
 *  - 買取価格(下限/上限) → #buy_sale_price_history_search_product_buy_price_from/_to（twig:179,184 / PriceType）
 *  - 基準価格(下限/上限) → #buy_sale_price_history_search_product_standard_price_from/_to（twig:149,154 / PriceType）
 *  注: 設計書（正本 md:49）は詳細検索の表示要素として「日付レンジ・カテゴリ・ステータス・エキスパンション・レアリティ・
 *      言語・状態・箔・プロモ・基準/販売/買取価格の各レンジ」を列挙。choice/entity 系は form_widget が id 付きコンテナ div で
 *      描画される想定だが widget 種別は要実機確認。
 *  - 検索ボタン「検索する」trans admin.purchase.store.form.search.button（twig:201-202 / messages.ja.yaml:5185。type=submit .btn-ec-conversion）
 *  - 詳細検索枠 #searchDetail（twig:79 collapse ec-collapse show＝初期表示で開く）
 *  - 件数見出し「検索結果　%count%件が該当しました」trans admin.product.buy_sale_price_history.search_result_count（twig:220 / messages.ja.yaml:1747）
 *  - 該当なし「検索条件に該当するデータがありません。」trans admin.product.buy_sale_price_history.no_data（twig:294 / messages.ja.yaml:1755）
 *  - CSVダウンロード「CSVダウンロード」trans admin.common.csv_download（twig:247 / messages.ja.yaml:1546。pagination.totalItemCount>0 のときのみ描画）
 *  - 価格 form_errors（twig:164）
 *  注: 親タイトル「商品管理」(twig:11)・サブタイトル「買取/販売価格履歴」(twig:12) は default_frame 側の出力先クラスが要実機確認のため、
 *      専用セレクタを創作せず spec ではテキスト存在で確認する。
 */
export class ProductProductBuySalePriceHistoryPage {
  readonly page: Page;
  readonly url: string; // 初期一覧 GET /{admin_route}/product/buy_sale_price_history
  readonly exportUrl: string; // CSV出力 GET .../export

  readonly searchForm: Locator; // #search_form
  readonly multi: Locator; // 複合キーワード
  readonly dateFrom: Locator; // 日付(開始)
  readonly dateTo: Locator; // 日付(終了)
  readonly categoryId: Locator; // 商品カテゴリ
  readonly status: Locator; // 表示ステータス
  readonly cardset: Locator; // エキスパンション(セット)
  readonly rarity: Locator; // レアリティ
  readonly language: Locator; // 言語
  readonly cardCondition: Locator; // 状態
  readonly foil: Locator; // 箔
  readonly promotion: Locator; // プロモ
  readonly sellPriceFrom: Locator; // 販売価格(下限)
  readonly sellPriceTo: Locator; // 販売価格(上限)
  readonly buyPriceFrom: Locator; // 買取価格(下限)
  readonly buyPriceTo: Locator; // 買取価格(上限)
  readonly standardPriceFrom: Locator; // 基準価格(下限)
  readonly standardPriceTo: Locator; // 基準価格(上限)
  readonly searchButton: Locator; // 「検索する」
  readonly searchDetail: Locator; // 詳細検索 collapse
  readonly searchClear: Locator; // 「検索条件をクリア」リンク
  readonly csvDownloadLink: Locator; // 「CSVダウンロード」（結果あり時のみ）
  readonly resultList: Locator; // 結果一覧コンテナ #result_list
  readonly resultTableHead: Locator; // 一覧表ヘッダ行
  readonly priceErrors: Locator; // 価格 form_errors

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/product/buy_sale_price_history`;
    this.exportUrl = `/${ECCUBE_ADMIN_ROUTE}/product/buy_sale_price_history/export`;

    this.searchForm = page.locator("#search_form");
    this.multi = page.locator("#buy_sale_price_history_search_multi");
    this.dateFrom = page.locator("#buy_sale_price_history_search_date_from");
    this.dateTo = page.locator("#buy_sale_price_history_search_date_to");
    this.categoryId = page.locator("#buy_sale_price_history_search_product_category_id");
    this.status = page.locator("#buy_sale_price_history_search_product_status");
    this.cardset = page.locator("#buy_sale_price_history_search_product_cardset");
    this.rarity = page.locator("#buy_sale_price_history_search_product_rarity");
    this.language = page.locator("#buy_sale_price_history_search_product_language");
    this.cardCondition = page.locator(
      "#buy_sale_price_history_search_product_card_condition"
    );
    this.foil = page.locator("#buy_sale_price_history_search_product_foil");
    this.promotion = page.locator("#buy_sale_price_history_search_product_promotion");
    this.sellPriceFrom = page.locator(
      "#buy_sale_price_history_search_product_sell_price_from"
    );
    this.sellPriceTo = page.locator(
      "#buy_sale_price_history_search_product_sell_price_to"
    );
    this.buyPriceFrom = page.locator(
      "#buy_sale_price_history_search_product_buy_price_from"
    );
    this.buyPriceTo = page.locator(
      "#buy_sale_price_history_search_product_buy_price_to"
    );
    this.standardPriceFrom = page.locator(
      "#buy_sale_price_history_search_product_standard_price_from"
    );
    this.standardPriceTo = page.locator(
      "#buy_sale_price_history_search_product_standard_price_to"
    );
    // 検索ボタンは id を持たないため、フォーム内の送信ボタンで特定（文言は trans 由来「検索する」）。
    this.searchButton = page.locator("#search_form button[type=submit]");
    this.searchDetail = page.locator("#searchDetail");
    // 「検索条件をクリア」リンク（trans admin.customer.clear_search「検索条件をクリア」 twig:193 a.search-clear）。
    this.searchClear = page.locator("#search_form a.search-clear");
    // CSVダウンロードは export ルートへのリンク（pagination.totalItemCount>0 のときのみ twig:247 で描画）。
    this.csvDownloadLink = page.locator(
      'a[href*="/product/buy_sale_price_history/export"]'
    );
    // 結果一覧コンテナと一覧表ヘッダ（pagination.totalItemCount>0 のときのみ描画 twig:216,251-266）。
    this.resultList = page.locator("#result_list");
    this.resultTableHead = page.locator("#result_list table thead");
    this.priceErrors = page.locator("#search_form .invalid-feedback, #search_form .text-danger");
  }

  /** 初期一覧を開く（GET 初期表示＝フォームのみ）。 */
  async goto() {
    await this.page.goto(this.url);
  }

  /** CSV出力URLへ直接アクセス（未検索時のリダイレクト検証用）。 */
  async gotoExport() {
    await this.page.goto(this.exportUrl);
  }

  /** 既定条件のまま検索POST（「検索する」押下）。 */
  async submitSearch() {
    await this.searchButton.click();
  }

  /** 複合キーワードで検索POST。 */
  async searchByKeyword(keyword: string) {
    await this.multi.fill(keyword);
    await this.searchButton.click();
  }

  /** 販売価格(下限)で検索POST（桁・数値バリデーション検証用）。 */
  async searchBySellPriceFrom(value: string) {
    await this.sellPriceFrom.fill(value);
    await this.searchButton.click();
  }

  /** CSVダウンロードリンクを押下し、download イベントを待つ。 */
  async exportAndWaitDownload(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.csvDownloadLink.click(),
    ]);
    return download;
  }

  /** 検索フォームの主要UI部品が仕様どおり表示されること。 */
  async seeSearchForm() {
    await expect(this.multi).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }

  /**
   * 詳細検索枠の各レンジ・選択が表示されること。
   * 設計書(正本 md:49)が列挙する詳細検索の表示要素を網羅して確認する。
   * 日付・価格は from/to の両端、属性選択は status/cardset/rarity/language/card_condition/foil/promotion。
   * choice/entity 系コンテナの widget 種別は要実機確認（form_widget の id 付きラッパ前提）。
   */
  async seeSearchDetail() {
    await expect(this.searchDetail).toBeVisible();
    // 日付レンジ（両端）
    await expect(this.dateFrom).toBeVisible();
    await expect(this.dateTo).toBeVisible();
    // カテゴリ・属性選択
    await expect(this.categoryId).toBeVisible();
    await expect(this.status).toBeVisible();
    await expect(this.cardset).toBeVisible();
    await expect(this.rarity).toBeVisible();
    await expect(this.language).toBeVisible();
    await expect(this.cardCondition).toBeVisible();
    await expect(this.foil).toBeVisible();
    await expect(this.promotion).toBeVisible();
    // 価格レンジ（基準/販売/買取の両端）
    await expect(this.standardPriceFrom).toBeVisible();
    await expect(this.standardPriceTo).toBeVisible();
    await expect(this.sellPriceFrom).toBeVisible();
    await expect(this.sellPriceTo).toBeVisible();
    await expect(this.buyPriceFrom).toBeVisible();
    await expect(this.buyPriceTo).toBeVisible();
  }

  /**
   * 件数見出し（検索結果　N件が該当しました）が表示されること。
   * 設計書由来オラクル trans admin.product.buy_sale_price_history.search_result_count
   * 「検索結果　%count%件が該当しました」(messages.ja.yaml:1747)。件数の数値は手動（件数厳密一致は対象外）。
   */
  async seeResultCountHeading() {
    await expect(this.page.getByText(/検索結果[\s\S]*件が該当しました/)).toBeVisible();
  }

  /**
   * 結果一覧表に商品コード〜登録者の列見出しが表示されること。
   * 設計書(正本 md:49「一覧表（商品コード〜登録者）」)由来オラクル。両端の列見出しで確認する。
   * 列見出し文言は trans admin.product.product_code「商品コード」(twig:254) と
   * admin.stock.move.registered_member「登録者」(twig:265)。中間列名はオラクル化しない。
   */
  async seeResultListColumns() {
    await expect(this.resultTableHead).toContainText("商品コード");
    await expect(this.resultTableHead).toContainText("登録者");
  }

  /**
   * 「検索条件をクリア」リンクで複合キーワード入力欄が空になること。
   * 設計書(フロント挙動JS md:50「『検索条件をクリア』リンクがテキスト・数値・date 入力を空にし…」)由来。
   */
  async clearSearchAndExpectEmptyKeyword(keyword: string) {
    await this.multi.fill(keyword);
    await expect(this.multi).toHaveValue(keyword);
    await this.searchClear.click();
    await expect(this.multi).toHaveValue("");
  }

  /** 価格(下限)に値を入れて検索POST（境界内正常値の検証エラー無しを確認するため）。 */
  async searchBySellPriceFromExpectNoError(value: string) {
    await this.sellPriceFrom.fill(value);
    await this.searchButton.click();
  }

  /** 該当なしメッセージが表示されること（trans admin.product.buy_sale_price_history.no_data）。 */
  async seeNoData() {
    await expect(
      this.page.getByText("検索条件に該当するデータがありません。")
    ).toBeVisible();
  }
}
