import { Download, Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 分析集計「デッキ採用枚数集計 ／ 特集タグ編集CSVダウンロード」Page Object。
 * 納品ケース表 integration_test/e2e/m12_09_admin_analysis_used_card_e2e_cases.md に対応。
 *
 * 期待結果は仕様(functions/pf-eccube3/m12-09_admin_analysis_used_card.md / 観点表 / 基本設計)由来（オラクル独立性）。
 * 設計書は pf-eccube3 のリバースであり、刷新先 ec-cube-enterprise の実装は CSVエクスポート画面として存在するが、
 * 設計の「集計結果表示画面」「セッション保持・引き継ぎ」「形式指定 /export/{mode}」「なりすまし対策トークン」が
 * 実装に無い（POSTで即CSV直ダウンロード／csrf_protection=false）＝ケース表 付帯表4（不具合候補）。
 * CSVの中身（列・順序・採用枚数集計値・件数）は手動確認とし、自動化はダウンロード発火・ファイル名・UI部品・
 * 必須バリデーション（出力条件未指定でフォーム再表示）・未認証ガードに限る。
 *
 * セレクタは Twig 由来の位置情報のみ。getBlockPrefix=`admin_analysis_used_card`（SearchUsedCardType.php:74-76）:
 *  - 検索フォーム: form#search_form（used_card.twig:28, method POST action=admin_analysis_used_card_export）
 *  - 開始日: #admin_analysis_used_card_start_date（used_card.twig:35 / JS used_card.twig:15。Form start_date DateType single_text）
 *  - 終了日: #admin_analysis_used_card_end_date（used_card.twig:35 / JS used_card.twig:19）
 *  - フォーマット選択: #admin_analysis_used_card_formats（used_card.twig:43 EntityType multiple select2 / JS used_card.twig:17）
 *  - 基本土地チェック: #admin_analysis_used_card_include_basic（used_card.twig:51 / JS used_card.twig:20）
 *  - CSVダウンロードボタン: button[type=submit].btn-ec-conversion（used_card.twig:63 / trans admin.analysis.used_card.csv_download=「特集タグ編集CSVダウンロード」messages.ja.yaml:5917）
 *  - サブタイトル: trans admin.analysis.used_card.page_sub_title（used_card.twig:6 / messages.ja.yaml:5913）
 *  - エラー表示: form_errors（used_card.twig:36,37,44,52）。bootstrap_4_horizontal レイアウト依存で具体クラスは要実機確認。
 *
 * ルート（src/Eccube/Controller/Admin/Analysis/UsedCardController.php）:
 *  - 画面表示 admin_analysis_used_card = GET /<route>/analysis/used-card（:39）
 *  - CSV出力  admin_analysis_used_card_export = POST /<route>/analysis/used-card（:52）
 *
 * 本ファイルは未実行の雛形。ec-cube-enterprise の Playwright は本リポジトリでは実行不可で構造参考のみ。
 */
export class AnalysisUsedCardPage {
  readonly page: Page;
  readonly url: string; // 画面表示（GET）／CSV出力POST先も同一パス

  readonly searchForm: Locator; // form#search_form（used_card.twig:28）
  readonly startDate: Locator; // #admin_analysis_used_card_start_date（used_card.twig:35）
  readonly endDate: Locator; // #admin_analysis_used_card_end_date（used_card.twig:35）
  readonly formats: Locator; // #admin_analysis_used_card_formats（used_card.twig:43 multiple select）
  readonly includeBasic: Locator; // #admin_analysis_used_card_include_basic（used_card.twig:51）
  readonly downloadButton: Locator; // CSVダウンロード（used_card.twig:63）
  readonly error: Locator; // form_errors（.invalid-feedback 要実機確認）

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/analysis/used-card`;

    this.searchForm = page.locator("#search_form");
    this.startDate = page.locator("#admin_analysis_used_card_start_date");
    this.endDate = page.locator("#admin_analysis_used_card_end_date");
    this.formats = page.locator("#admin_analysis_used_card_formats");
    this.includeBasic = page.locator("#admin_analysis_used_card_include_basic");
    // 位置情報（構造）で特定。検索フォーム内の送信ボタン（used_card.twig:63 button[type=submit].btn-ec-conversion）。
    // ボタン文言 trans admin.analysis.used_card.csv_download は messages 由来のためオラクル化せずセレクタにも使わない。
    this.downloadButton = this.searchForm.locator("button[type='submit']");
    // form_errors の実レンダリングクラスは要実機確認。位置情報として汎用クラスで仮置きする。
    this.error = page.locator(".invalid-feedback");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** フォーマット選択肢を index 指定で1件選ぶ（multiple select の下地要素に対して selectOption）。 */
  async selectFirstFormat() {
    await this.formats.selectOption({ index: 0 });
  }

  /** 集計期間（開始日・終了日）を入力する（DateType single_text=type=date。YYYY-MM-DD 書式）。 */
  async fillDateRange(startDate: string, endDate: string) {
    await this.startDate.fill(startDate);
    await this.endDate.fill(endDate);
  }

  /** CSVダウンロードボタンを押し、ダウンロード発火を待って Download を返す（有効条件前提）。 */
  async downloadAndWait(): Promise<Download> {
    const [download] = await Promise.all([
      this.page.waitForEvent("download"),
      this.downloadButton.click(),
    ]);
    return download;
  }

  /** CSVダウンロードボタンを押す（エラー/再表示経路の検証用。ダウンロードは待たない）。 */
  async clickDownload() {
    await this.downloadButton.click();
  }

  /** 出力条件の検索フォームのUI部品が仕様どおり表示されること。 */
  async seeSearchForm() {
    await expect(this.startDate).toBeVisible();
    await expect(this.endDate).toBeVisible();
    await expect(this.formats).toBeAttached(); // select2 化で本体は隠れ得るため attached で確認
    await expect(this.includeBasic).toBeAttached();
    await expect(this.downloadButton).toBeVisible();
  }
}
