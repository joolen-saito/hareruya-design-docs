import { Download, Locator, Page, Response, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 会員管理「顧客情報CSV出力」Page Object。
 * 納品ケース表 integration_test/e2e/m08_03_admin_customer_customer_csv_export_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m08-03_admin_customer_customer_csv_export.md / messages.ja.yaml)由来
 * （オラクル独立性）。本機能は会員一覧の「CSVダウンロード」から GET でストリーミング出力する CSV出力機能であり、
 * CSVの中身（標準項目＋拡張項目 point/identity_confirm_status_id/smaregi_id・郵便番号 postal_code 単一列・
 * 検索条件の反映・項目設定の反映）は手動確認とする。自動化はダウンロード発火・ファイル名・操作起点UI・
 * URL直接アクセス・画面遷移しないこと・未認証ガードに限る。
 *
 * セレクタは Twig 由来の位置情報のみ（src/Eccube/Resource/template/admin/Customer/index.twig）:
 *  - 会員一覧/検索フォーム: form#search_form（index.twig:41, method POST action=""）
 *  - キーワード(複合)入力: #search_customer_multi（searchForm.multi index.twig:49 / blockPrefix=search_customer。id は 要実機確認）
 *  - 検索実行ボタン: form#search_form 内 button[type=submit] trans admin.common.search=「検索」（index.twig:370）
 *  - 「CSVダウンロード」ドロップダウントグル: button trans admin.common.csv_download=「CSVダウンロード」（index.twig:410-411 / messages.ja.yaml:1546）
 *  - 会員CSV出力リンク: a.dropdown-item[href=url('admin_customer_export')]（index.twig:415、href=/<route>/customer/export）
 *
 * ルート（src/Eccube/Controller/Admin/Customer/CustomerController.php）:
 *  - 会員一覧 admin_customer = GET/POST /<route>/customer（:69）
 *  - 会員CSV出力 admin_customer_export = GET /<route>/customer/export（:281, methods=['GET']）
 *  - ファイル名 customer_<YmdHis>.csv（:343）／Content-Disposition=attachment（:344-345）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class CustomerCustomerCsvExportPage {
  readonly page: Page;
  readonly customerListUrl: string; // 会員一覧（admin_customer）
  readonly customerExportPath: string; // 会員CSV出力（admin_customer_export, GET）

  readonly searchForm: Locator; // form#search_form（index.twig:41）
  readonly searchKeyword: Locator; // #search_customer_multi（index.twig:49・id 要実機確認）
  readonly searchSubmit: Locator; // 検索ボタン（index.twig:370）
  readonly csvDownloadToggle: Locator; // 「CSVダウンロード」ドロップダウントグル（index.twig:410-411）
  readonly csvExportLink: Locator; // 会員CSV出力リンク（index.twig:415）

  constructor(page: Page) {
    this.page = page;
    this.customerListUrl = `/${ECCUBE_ADMIN_ROUTE}/customer`;
    this.customerExportPath = `/${ECCUBE_ADMIN_ROUTE}/customer/export`;

    this.searchForm = page.locator("#search_form");
    // blockPrefix=search_customer（SearchCustomerType。getBlockPrefix 非オーバーライド）。id は実機確認後に確定する。
    this.searchKeyword = page.locator("#search_customer_multi");
    this.searchSubmit = page.locator('#search_form button[type="submit"]');
    // 文言は trans admin.common.csv_download=「CSVダウンロード」（messages.ja.yaml:1546）由来。role=button でトグルを特定。
    this.csvDownloadToggle = page.getByRole("button", { name: "CSVダウンロード" });
    // 出力リンクは href=url('admin_customer_export')。位置情報として href の末尾で特定する（ドロップダウン内 a）。
    this.csvExportLink = page.locator(
      'a.dropdown-item[href$="/customer/export"]'
    );
  }

  async gotoList() {
    await this.page.goto(this.customerListUrl);
  }

  /** 検索フォームを送信し、直前の検索条件をセッションに確立する（キーワード未指定なら全件相当）。 */
  async search(keyword = "") {
    if (keyword) {
      await this.searchKeyword.fill(keyword);
    }
    await this.searchSubmit.click();
  }

  /** 「CSVダウンロード」ドロップダウンを開く（Bootstrap dropdown。開閉JSは 要実機確認）。 */
  async openCsvDropdown() {
    await this.csvDownloadToggle.click();
  }

  /** 会員一覧のドロップダウン経由でCSV出力リンクを押し、ダウンロード発火を待って Download を返す。 */
  async exportViaListAndWaitDownload(): Promise<Download> {
    await this.openCsvDropdown();
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.csvExportLink.click(),
    ]);
    return download;
  }

  /** 会員CSV出力URLへ直接GETアクセスし、ダウンロード発火を待って Download を返す。 */
  async exportViaDirectGetAndWaitDownload(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      // 添付応答のため goto は中断される（ナビゲーションは確定しない）。例外は無視する。
      this.page.goto(this.customerExportPath).catch(() => undefined),
    ]);
    return download;
  }

  /**
   * 会員CSV出力URLへ直接GETし、ダウンロードと併せて当該URLのHTTP応答も取得する。
   * HTTPステータス(IT-25)の判定に用いる。期待値は呼び出し側で仕様由来に保つ。
   */
  async exportViaDirectGetCapturing(): Promise<{
    download: Download;
    response: Response;
  }> {
    const responsePromise = this.page.waitForResponse((r) =>
      r.url().includes("/customer/export")
    );
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      // 添付応答のため goto は中断される（ナビゲーションは確定しない）。例外は無視する。
      this.page.goto(this.customerExportPath).catch(() => undefined),
    ]);
    const response = await responsePromise;
    return { download, response };
  }

  /** 会員一覧に「CSVダウンロード」操作起点（リンク）が存在することを確認する。 */
  async seeExportEntry() {
    await expect(this.csvExportLink).toHaveAttribute(
      "href",
      /\/customer\/export$/
    );
  }
}
