import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 フォーマット売上分析 集計一覧表示 Page Object（独立クラス形・未実行雛形）。
 * 期待結果は仕様(functions/pf-eccube3/m12-07_admin_analytics_sales_format_analysis_summary.md /
 * integration-test-viewpoints.md)由来（オラクル独立性）。実装の現挙動は期待値にしない。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_format_sales`
 * （FormatSalesType.php:86-90）由来の位置情報のみ。ボタン/見出し文言は trans キー由来であることを確認済み。
 * ec-cube-enterprise の Playwright は本リポジトリでは実行不可。構造参考のもとで生成した未実行雛形。
 *
 * 注意（仕様乖離・付帯表4参照）:
 *  - URLは設計書が `analysis/format_sales`・`/result` を示すが、刷新先実装は `analysis/format-sales`・`/search`。
 *    URL（位置情報）は実装値を用い、合否（表示・遷移）は仕様で判定する。
 *  - 集計対象チェックボックス(通販/全店舗)・「いずれか1つ以上必須」相関は設計書に無い実装独自要素（不具合候補#2）。
 *    spec のテスト対象は設計書記載のUI部品(集計月・検索・グラフ・表)に限定する。
 *
 * DOM/ルート根拠:
 *  - 初期表示: route admin_analysis_format_sales `GET /<route>/analysis/format-sales`（FormatSalesController.php:44）
 *  - 検索: route admin_analysis_format_sales_search `POST /<route>/analysis/format-sales/search`（同:64・form action twig:94）
 *  - 集計月入力欄: form_widget(searchForm.month)（twig:103）→ #admin_format_sales_month（getBlockPrefix admin_format_sales）
 *  - 検索ボタン: button[type=submit] trans admin.analysis.format_sales.search=「検索する」（twig:122-123 / messages.ja.yaml:5909）
 *  - サブタイトル: block sub_title trans admin.analysis.format_sales.page_sub_title=「フォーマット売上分析」（twig:6 / messages.ja.yaml:5906）
 *  - 集計結果コンテナ: #result_list（twig:130。{% if formats %} 配下＝検索成功時のみ描画）
 *  - 折れ線グラフ: canvas#formatSalesChart（twig:132）
 *  - 日別売上表ヘッダ「日」trans admin.analysis.format_sales.day（twig:146 / messages.ja.yaml:5910）・「合計」（twig:150）
 *  - 合計表 h5「合計」（twig:167）/ 平均表 h5「平均」（twig:188）
 *  - CSVダウンロード: a trans admin.common.csv_download=「CSVダウンロード」（twig:136-138 / messages.ja.yaml:1546。DL本体はM12-08）
 */
export class AnalyticsSalesFormatAnalysisSummaryPage {
  readonly page: Page;
  readonly indexUrl: string; // 初期表示(検索画面)
  readonly searchUrl: string; // 検索POSTエンドポイント

  readonly month: Locator; // 集計月入力欄 #admin_format_sales_month
  readonly searchButton: Locator; // 検索ボタン「検索する」
  readonly subTitle: Locator; // サブタイトル「フォーマット売上分析」
  readonly resultList: Locator; // #result_list（検索成功時のみ）
  readonly chart: Locator; // canvas#formatSalesChart（折れ線グラフ）
  readonly dailyTable: Locator; // 日別売上表（#result_list 内 1つ目のtable）
  readonly sumHeading: Locator; // h5「合計」
  readonly averageHeading: Locator; // h5「平均」
  readonly csvDownloadLink: Locator; // CSVダウンロードリンク

  constructor(page: Page) {
    this.page = page;
    this.indexUrl = `/${ECCUBE_ADMIN_ROUTE}/analysis/format-sales`;
    this.searchUrl = `/${ECCUBE_ADMIN_ROUTE}/analysis/format-sales/search`;

    this.month = page.locator("#admin_format_sales_month");
    this.searchButton = page.locator('button[type="submit"]', {
      hasText: "検索する",
    });
    this.subTitle = page.locator("body");
    this.resultList = page.locator("#result_list");
    this.chart = page.locator("#formatSalesChart");
    this.dailyTable = page.locator("#result_list table").first();
    this.sumHeading = page.locator("#result_list h5", { hasText: "合計" });
    this.averageHeading = page.locator("#result_list h5", { hasText: "平均" });
    this.csvDownloadLink = page.getByRole("link", { name: "CSVダウンロード" });
  }

  async goto() {
    await this.page.goto(this.indexUrl);
  }

  /** 集計月を入力して検索する（datetimepicker付きテキスト欄に直接値を入れる）。 */
  async search(month: string) {
    await this.month.fill(month);
    await this.searchButton.click();
  }

  /** 初期表示の検索フォーム部品が仕様どおり表示され、集計結果は出ていないこと。 */
  async seeSearchFormOnly() {
    await expect(this.month).toBeVisible();
    await expect(this.searchButton).toBeVisible();
    // 設計書「入力項目」: 集計月の初期値は空（functions/...summary.md:132）。
    // 実装は初回表示で当月を事前入力するため、仕様どおり空を期待し乖離（不具合候補#6）を検出する。
    await expect(this.month).toHaveValue("");
    await expect(this.resultList).toHaveCount(0); // 初期表示は集計結果を表示しない
  }

  /** 検索成功時に折れ線グラフと日別売上表・合計表・平均表が同一画面に表示されること。 */
  async seeAggregationResult() {
    await expect(this.resultList).toBeVisible();
    await expect(this.chart).toBeVisible(); // 折れ線グラフ canvas
    await expect(this.dailyTable).toBeVisible(); // 日別売上表
    await expect(this.sumHeading).toBeVisible(); // 合計表見出し
    await expect(this.averageHeading).toBeVisible(); // 平均表見出し
  }

  /** バリデーションエラー時は集計結果(グラフ・表)が表示されないこと（同一画面に滞留）。 */
  async seeNoResult() {
    await expect(this.resultList).toHaveCount(0);
    await expect(this.chart).toHaveCount(0);
  }
}
