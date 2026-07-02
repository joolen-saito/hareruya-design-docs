import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 トップ売上状況（ダッシュボードの売上状況ブロック）Page Object。
 * 期待結果は仕様(m02-02_admin_home_home_sales_status.md / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig 由来の位置情報のみ（合否は仕様で判定）。
 *
 * 画面タイプ: summary/status。集計数値（金額・件数・除外反映）はDB依存のため手動。
 * E2Eはウィジェット表示・タブ切替・グラフ用データの非同期取得可否（XHR＋CSRF）を対象とする。
 *
 * DOM 根拠（ec-cube-enterprise 現行ソース nl -ba 基準）:
 *  - 売上状況カード #chart-statistics（admin/index.twig:146）
 *  - カード見出し .card-title trans admin.home.sales_summary_title=「売上状況」（index.twig:149 / messages.ja.yaml:1686。親は<span>でリンクではない）
 *  - サマリラベル sales_summary_this_month/today/yesterday（index.twig:160,168,176 / messages.ja.yaml:1688-1690）
 *  - サマリ値 .h3 sales_summary_value=「%amount% / %count% 件」（index.twig:158,166,174 / messages.ja.yaml:1687）
 *  - タブ #pills-weekly-tab/#pills-monthly-tab/#pills-year-tab（index.twig:182,185,188 / messages.ja.yaml:1691-1693）
 *  - タブペイン #pills-weekly/#pills-monthly/#pills-year（index.twig:200,203,206）
 *  - グラフ canvas #chart-0/#chart-1/#chart-2（index.twig:201,204,207）
 *  - 読み込み中 #loading（index.twig:196。取得完了で .always→hide index.twig:97-99）
 *  - グラフ用データ route admin_homepage_sale = GET /%eccube_admin_route%/sale_chart（AdminController.php:210）
 *    非XHR/不正CSRF時は json(['status'=>'NG'],400)（AdminController.php:213-215）
 */
export class AdminHomeHomeSalesStatusPage {
  readonly page: Page;
  readonly homeUrl: string; // ホーム（admin_homepage）
  readonly saleChartUrl: string; // グラフ用データ（admin_homepage_sale）

  readonly salesCard: Locator; // #chart-statistics
  readonly cardTitle: Locator; // 売上状況カード見出し（.card-title）
  readonly thisMonthLabel: Locator; // 「今月の売上金額 / 売上件数」
  readonly todayLabel: Locator; // 「今日の売上金額 / 売上件数」
  readonly yesterdayLabel: Locator; // 「昨日の売上金額 / 売上件数」
  readonly weeklyTab: Locator; // #pills-weekly-tab
  readonly monthlyTab: Locator; // #pills-monthly-tab
  readonly yearTab: Locator; // #pills-year-tab
  readonly monthlyPane: Locator; // #pills-monthly
  readonly chart0: Locator; // #chart-0 週間
  readonly chart1: Locator; // #chart-1 月間
  readonly chart2: Locator; // #chart-2 年間
  readonly loading: Locator; // #loading
  readonly summaryValues: Locator; // サマリ値 .h3（#chart-statistics 内）

  constructor(page: Page) {
    this.page = page;
    this.homeUrl = `/${ECCUBE_ADMIN_ROUTE}/`;
    this.saleChartUrl = `/${ECCUBE_ADMIN_ROUTE}/sale_chart`;

    this.salesCard = page.locator("#chart-statistics");
    this.cardTitle = this.salesCard.locator(".card-title");
    this.thisMonthLabel = page.getByText("今月の売上金額 / 売上件数");
    this.todayLabel = page.getByText("今日の売上金額 / 売上件数");
    this.yesterdayLabel = page.getByText("昨日の売上金額 / 売上件数");
    this.weeklyTab = page.locator("#pills-weekly-tab");
    this.monthlyTab = page.locator("#pills-monthly-tab");
    this.yearTab = page.locator("#pills-year-tab");
    this.monthlyPane = page.locator("#pills-monthly");
    this.chart0 = page.locator("#chart-0");
    this.chart1 = page.locator("#chart-1");
    this.chart2 = page.locator("#chart-2");
    this.loading = page.locator("#loading");
    this.summaryValues = this.salesCard.locator(".h3");
  }

  async goto() {
    await this.page.goto(this.homeUrl);
  }

  /** 売上状況カードのウィジェットが仕様どおり表示されること（カード見出し・サマリ・タブ・canvas）。 */
  async seeSalesCard() {
    await expect(this.cardTitle).toContainText("売上状況");
    await expect(this.thisMonthLabel).toBeVisible();
    await expect(this.todayLabel).toBeVisible();
    await expect(this.yesterdayLabel).toBeVisible();
    await expect(this.weeklyTab).toBeVisible();
    await expect(this.monthlyTab).toBeVisible();
    await expect(this.yearTab).toBeVisible();
    await expect(this.chart0).toBeAttached();
    await expect(this.chart1).toBeAttached();
    await expect(this.chart2).toBeAttached();
  }

  /**
   * ホームを開き、グラフ用データ取得XHR（admin_homepage_sale）の応答を待つ。
   * 仕様: 成功時は週間・月間・年間の3区間に対応するJSON配列が返る（設計書 API/バッチ結果・成功時）。
   */
  async gotoAndWaitSaleChart() {
    const waitResp = this.page.waitForResponse((r) =>
      r.url().includes("/sale_chart")
    );
    await this.goto();
    const resp = await waitResp;
    return resp;
  }

  /**
   * グラフ用データURLへ「通常GET（XHRヘッダなし）」で要求する。
   * 仕様: XMLHttpRequest かつ CSRF妥当でない場合、グラフ用データ（JSON配列）は得られない。
   * page.request はログイン済セッションのCookieを共有しつつ X-Requested-With を付与しない。
   */
  async requestSaleChartWithoutXhr() {
    return this.page.request.get(this.saleChartUrl);
  }

  /**
   * グラフ用データURLへ「XHRヘッダあり・CSRFトークンなし」で要求する。
   * 仕様: XMLHttpRequest かつ CSRF妥当の双方を満たさないとグラフ用データを返さない。
   * CSRF条件の負例（XHR側は満たすがCSRFが欠落）を検証する。
   * 注: CSRFトークンの項目名は実装由来オラクルになるため固定せず「付与しない」ことで欠落を表現する。
   * X-Requested-With は XHR を表す標準ヘッダ（観点「XMLHttpRequest」由来の刺激＝入力であり期待値ではない）。
   */
  async requestSaleChartXhrWithoutCsrf() {
    return this.page.request.get(this.saleChartUrl, {
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });
  }

  /** 月間タブを押下する（同一ページ内の表示切替。追加のサーバ問い合わせは行わない）。 */
  async clickMonthlyTab() {
    await this.monthlyTab.click();
  }
}
