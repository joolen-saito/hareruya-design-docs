import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店頭買取管理「古物台帳入力用CSV出力」Page Object（M06-02）。
 * 納品ケース表 integration_test/e2e/m06_02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export_e2e_cases.md に対応（完全1:1ではない）。
 *
 * 期待結果は仕様(functions/pf-eccube3/m06-02_admin_store_purchase_otc_buy_order_old_goods_account_csv_export.md / 観点表)由来
 * （オラクル独立性）。設計源は pf-eccube3(HareruyaEc) リバースだが、刷新先 ec-cube-enterprise に同一画面が実在するため当該画面の
 * 存在を確認してE2E化した。実装の現挙動・Form制約・Cookie名は期待値に流用しない。
 *
 * 本機能は買取一覧（admin_otcbuyorder）の検索結果ヘッダにある「CSVダウンロード」ドロップダウン内
 * 「古物台帳入力用CSV」リンク（data-type=old_goods_account）押下で、JSが #export_type に値を代入し
 * #result_form（POST /otcbuyorder/export）を送信して StreamedResponse をダウンロードする機能。
 * 自動化はダウンロード発火・ファイル名・応答ヘッダ・UI部品（ドロップダウン/リンク/チェックボックス/allCheck）・
 * 確認ダイアログ不在・選択なしエラー/リダイレクト・未認証ガードに限る。
 * CSV各列値・住所/年齢/電話形式・数量集計・並び順・BOM/エンコードは実ファイルを開いて手動確認。
 *
 * セレクタは Twig/JS 由来の位置情報のみ:
 *  - 買取一覧:               route admin_otcbuyorder = GET/POST /<route>/otcbuyorder（OtcBuyOrderController.php:90-104）
 *  - CSVエクスポート:        route admin_otcbuyorder_export = POST /<route>/otcbuyorder/export（OtcBuyOrderController.php:162-169）
 *  - 検索フォーム:           #search_form（index.twig:35）/ 検索ボタン .searchBtn（index.twig:145 trans admin.purchase.store.form.search.button=「検索する」messages.ja.yaml:5185）
 *  - 結果フォーム:           #result_form（index.twig:152 action admin_otcbuyorder_export）
 *  - CSRFトークン(隠し):     #result_form input[name="_token"]（index.twig:153 / Constant::TOKEN_NAME='_token' Constant.php:41）
 *  - 出力種別(隠し):         #export_type（index.twig:154）
 *  - CSVダウンロードトグル:  #result_list__custom_csv_menu > a.dropdown-toggle「CSVダウンロード」（index.twig:181-182）
 *  - 古物台帳リンク:         a.export-link[data-type="old_goods_account"]「古物台帳入力用CSV」（index.twig:184）
 *  - 行チェック:             input[name="otcBuyOrderIds[]"]（index.twig:215）
 *  - 全選択チェック:         #allCheck（index.twig:200 / JS otc-buy-order.js:16-18 で [otcBuyOrderId] を一括トグル）
 *  - 0件メッセージ:          「検索条件に該当するデータがありませんでした。」（index.twig:241）
 *
 * 応答ヘッダ(処理フロー#8): Content-Type application/octet-stream / Content-Disposition attachment; filename=old_goods_account_<YmdHis>.csv。
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class StorePurchaseOtcBuyOrderOldGoodsAccountCsvExportPage {
  readonly page: Page;
  readonly listUrl: string; // 買取一覧（CSV出力の起点画面）
  readonly exportPath: string; // CSVエクスポート POSTルート（応答ヘッダ検証用）

  readonly searchForm: Locator; // #search_form（index.twig:35）
  readonly searchButton: Locator; // .searchBtn（index.twig:145）
  readonly resultForm: Locator; // #result_form（index.twig:152）
  // #result_form input[name="_token"]（index.twig:153）。設計はCSRF検証なしのため値はテスト入力に
  // 流用しない（付帯表4#1の乖離記録用に存在のみ保持）。
  readonly csrfToken: Locator;
  readonly exportTypeHidden: Locator; // #export_type（index.twig:154）
  readonly csvDropdownToggle: Locator; // 「CSVダウンロード」トグル（index.twig:181-182）
  readonly oldGoodsAccountLink: Locator; // 「古物台帳入力用CSV」（index.twig:184）
  readonly rowCheckboxes: Locator; // input[name="otcBuyOrderIds[]"]（index.twig:215）
  readonly allCheck: Locator; // #allCheck（index.twig:200）
  readonly noResultMessage: Locator; // 0件メッセージ（index.twig:241）

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder`;
    this.exportPath = `/${ECCUBE_ADMIN_ROUTE}/otcbuyorder/export`;

    this.searchForm = page.locator("#search_form");
    this.searchButton = page.locator(".searchBtn");
    this.resultForm = page.locator("#result_form");
    this.csrfToken = page.locator('#result_form input[name="_token"]');
    this.exportTypeHidden = page.locator("#export_type");
    this.csvDropdownToggle = page.locator(
      "#result_list__custom_csv_menu > a.dropdown-toggle"
    );
    this.oldGoodsAccountLink = page.locator(
      'a.export-link[data-type="old_goods_account"]'
    );
    this.rowCheckboxes = page.locator('input[name="otcBuyOrderIds[]"]');
    this.allCheck = page.locator("#allCheck");
    this.noResultMessage = page.getByText(
      "検索条件に該当するデータがありませんでした。"
    );
  }

  /** 買取一覧（CSV出力リンクの起点画面）を開く。 */
  async goto() {
    await this.page.goto(this.listUrl);
  }

  /** 検索フォームを送信して検索結果を表示する（条件は呼び出し側で事前入力。空送信で全件） */
  async search() {
    await this.searchButton.click();
  }

  /** 「CSVダウンロード」ドロップダウンを開く（中の項目を表示させる）。 */
  async openCsvDropdown() {
    await this.csvDropdownToggle.click();
  }

  /** 検索結果の先頭行のチェックボックスをオンにする。 */
  async checkFirstRow() {
    await this.rowCheckboxes.first().check();
  }

  /** 表頭の全選択チェックをオンにする（JSが [otcBuyOrderId] を一括トグル）。 */
  async checkAll() {
    await this.allCheck.check();
  }

  /**
   * 「古物台帳入力用CSV」押下でダウンロード発火を待って Download を返す。
   * ドロップダウン内のリンクのため先にトグルを開く。
   */
  async downloadViaLink(): Promise<Download> {
    await this.openCsvDropdown();
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.oldGoodsAccountLink.click(),
    ]);
    return download;
  }

  /** 検索結果が1件以上のときCSVダウンロード入口が表示されること（仕様: totalItemCount>0）。 */
  async seeCsvDownloadEntry() {
    await expect(this.csvDropdownToggle).toBeVisible();
    await this.openCsvDropdown();
    await expect(this.oldGoodsAccountLink).toBeVisible();
  }

  /** 検索結果の各行チェックボックスと表頭allCheckが表示されること。 */
  async seeRowSelectors() {
    await expect(this.rowCheckboxes.first()).toBeVisible();
    await expect(this.allCheck).toBeVisible();
  }
}
