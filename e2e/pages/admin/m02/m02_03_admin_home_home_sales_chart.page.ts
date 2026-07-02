import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 ホーム 売上状況グラフ Page Object（独立クラス形）。
 * 期待結果は仕様(m02-03_admin_home_home_sales_chart.md / 設計書フロント挙動・処理フロー)由来（オラクル独立性）。
 * セレクタは Twig 由来（src/Eccube/Resource/template/admin/index.twig）の位置情報のみ。
 * #loading・#chart-0/1/2・3タブは設計書「フロント挙動」が明示する仕様部品。
 *
 * DOM/ルート根拠:
 *  - ホーム: route admin_homepage `/<route>/`（AdminController.php:102）
 *  - グラフ用データ: route admin_homepage_sale `/<route>/sale_chart`（AdminController.php:210）
 *    XHR かつ CSRF妥当のときのみ200でJSON配列、否なら400 {"status":"NG"}（AdminController.php:213-214）
 *  - 売上状況カード #chart-statistics（index.twig:146）/ card-title sales_summary_title=「売上状況」（:149）
 *  - 3タブ #pills-weekly-tab(:182) #pills-monthly-tab(:185) #pills-year-tab(:188)
 *    文言 admin.home.sales_summary_weekly/monthly/yearly=週間/月間/年間（:183,186,189 / messages.ja.yaml:1691-1693）
 *  - タブペイン #pills-weekly(:200) #pills-monthly(:203) #pills-year(:206)
 *  - canvas #chart-0(:201) #chart-1(:204) #chart-2(:207)
 *  - 読み込み中 #loading（:196。JS .always で hide :97-98）
 *  - CSRFトークン meta[name="eccube-csrf-token"]（default_frame.twig:16）/ Ajaxヘッダ ECCUBE-CSRF-TOKEN（:83-85）
 */
export class HomeHomeSalesChartPage {
  readonly page: Page;
  readonly url: string; // ホーム画面
  readonly saleChartUrl: string; // グラフ用データ取得エンドポイント

  readonly chartStatistics: Locator; // 売上状況カード #chart-statistics
  readonly cardTitle: Locator; // カード見出し「売上状況」
  readonly weeklyTab: Locator; // #pills-weekly-tab「週間」
  readonly monthlyTab: Locator; // #pills-monthly-tab「月間」
  readonly yearTab: Locator; // #pills-year-tab「年間」
  readonly weeklyPane: Locator; // #pills-weekly
  readonly monthlyPane: Locator; // #pills-monthly
  readonly yearPane: Locator; // #pills-year
  readonly chart0: Locator; // #chart-0（週間canvas）
  readonly chart1: Locator; // #chart-1（月間canvas）
  readonly chart2: Locator; // #chart-2（年間canvas）
  readonly loading: Locator; // #loading
  readonly csrfMeta: Locator; // meta[name="eccube-csrf-token"]

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/`;
    this.saleChartUrl = `/${ECCUBE_ADMIN_ROUTE}/sale_chart`;

    this.chartStatistics = page.locator("#chart-statistics");
    this.cardTitle = page.locator("#chart-statistics .card-title");
    this.weeklyTab = page.locator("#pills-weekly-tab");
    this.monthlyTab = page.locator("#pills-monthly-tab");
    this.yearTab = page.locator("#pills-year-tab");
    this.weeklyPane = page.locator("#pills-weekly");
    this.monthlyPane = page.locator("#pills-monthly");
    this.yearPane = page.locator("#pills-year");
    this.chart0 = page.locator("#chart-0");
    this.chart1 = page.locator("#chart-1");
    this.chart2 = page.locator("#chart-2");
    this.loading = page.locator("#loading");
    this.csrfMeta = page.locator('meta[name="eccube-csrf-token"]');
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /**
   * ホームを開き、初回 sale_chart の応答を待って返す。
   * #loading は成功/失敗どちらでも .always() で隠れるため（index.twig:97-98）、
   * 「#loading 非表示」だけでは取得成功を保証できない。呼び出し側で応答ステータスを検証する。
   */
  async gotoAwaitingSaleChart() {
    const respPromise = this.page.waitForResponse((r) =>
      r.url().includes("/sale_chart")
    );
    await this.goto();
    return respPromise;
  }

  /**
   * sale_chart の応答を仕様上の失敗（HTTP400 / {"status":"NG"}）に固定する。
   * 失敗時フロント挙動（専用メッセージを出さず同一画面）の観測に用いる。
   * 期待値は設計書「API/バッチ結果（失敗時）」由来であり、stub内容は実行手段。
   */
  async stubSaleChartFailure() {
    await this.page.route("**/sale_chart", (route) =>
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({ status: "NG" }),
      })
    );
  }

  /** 売上状況カードのグラフ部品が仕様どおり配置されていること。 */
  async seeChartArea() {
    await expect(this.chartStatistics).toBeVisible();
    await expect(this.weeklyTab).toBeVisible();
    await expect(this.monthlyTab).toBeVisible();
    await expect(this.yearTab).toBeVisible();
    // canvas はタブ非活性側が hidden になり得るため attach 観点で確認する。
    await expect(this.chart0).toBeAttached();
    await expect(this.chart1).toBeAttached();
    await expect(this.chart2).toBeAttached();
    await expect(this.loading).toBeAttached();
  }

  /**
   * 初期表示で週間タブが選択済み（週間ペイン表示・月間/年間ペイン非表示）であること。
   * 期待値は設計書フロント挙動「初期状態は週間タブが選択済み」由来。
   * aria-selected等の実装属性ではなく、利用者に観測可能なペイン表示状態で判定する。
   */
  async seeInitialWeeklySelected() {
    await expect(this.weeklyPane).toBeVisible();
    await expect(this.monthlyPane).toBeHidden();
    await expect(this.yearPane).toBeHidden();
  }

  /** タブ文言が仕様（週間・月間・年間）どおりであること。 */
  async seeTabLabels() {
    await expect(this.weeklyTab).toContainText("週間");
    await expect(this.monthlyTab).toContainText("月間");
    await expect(this.yearTab).toContainText("年間");
  }

  /** 非同期取得完了で読み込み中インジケータが非表示になるまで待つ。 */
  async waitForLoadingHidden() {
    await expect(this.loading).toBeHidden();
  }

  async clickMonthlyTab() {
    await this.monthlyTab.click();
  }

  async clickYearTab() {
    await this.yearTab.click();
  }

  /** 画面の meta から CSRFトークンを読む（XHR成功取得の検証に使う）。 */
  async readCsrfToken(): Promise<string> {
    return (await this.csrfMeta.getAttribute("content")) ?? "";
  }
}
