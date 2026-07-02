import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 分析・集計 > デッキ採用枚数集計（特集タグ編集CSVダウンロード） Page Object。
 * 画面: GET `/{admin_route}/analysis/used-card`（UsedCardController.php:39 admin_analysis_used_card /
 *   @admin/Analysis/used_card.twig）。送信は POST 同一パス（:52 admin_analysis_used_card_export）でCSVを直接ストリーミング出力。
 * 期待結果は仕様(functions/pf-eccube3/m12-10_admin_analysis_used_card.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_analysis_used_card`（SearchUsedCardType.php:74-76）由来の位置情報のみ。
 *
 * 重要（仕様乖離）: 設計書は「検索→集計結果画面→mode別CSV・出力条件のセッション保持」を定めるが、実装は
 *   単一フォーム→POSTで直接CSV出力のみ（結果画面・セッション保持・mode・CSRFトークンを持たない）。乖離はケース表 付帯表4 に記録。
 *
 * DOM id / セレクタ根拠（used_card.twig は実ソース行基準）:
 *  - 検索フォーム form#search_form（twig:28, method=post, action=admin_analysis_used_card_export）
 *  - 集計期間 開始日 start_date → #admin_analysis_used_card_start_date（twig:35,15 / SearchUsedCardType.php:43-49 DateType single_text）
 *  - 集計期間 終了日 end_date → #admin_analysis_used_card_end_date（twig:35,19 / Form:50-54）
 *  - フォーマット formats(EntityType multiple select2) → #admin_analysis_used_card_formats（twig:43,17 / Form:55-65）
 *  - 基本土地を含める include_basic(Checkbox) → #admin_analysis_used_card_include_basic（twig:51,20 / Form:66-69）
 *  - 集計期間ラベル「集計期間」 admin.analysis.used_card.form.date_range（twig:34 / messages.ja.yaml:5914）
 *  - フォーマットラベル「フォーマット」 admin.analysis.used_card.form.formats（twig:42 / :5915）
 *  - 基本土地ラベル「基本土地を含める」 admin.analysis.used_card.form.include_basic（Form:67 / :5916）
 *  - CSVダウンロードボタン「特集タグ編集CSVダウンロード」 admin.analysis.used_card.csv_download（twig:63 / :5917）
 *  - 条件クリア導線「検索条件をクリア」 admin.common.search_clear（a.search-clear twig:57 / :1545）
 *  - サブタイトル「特集タグ編集CSVダウンロード」 admin.analysis.used_card.page_sub_title（twig:6 / :5913）
 */
export class AnalysisUsedCardPage {
  readonly page: Page;
  readonly url: string;

  readonly searchForm: Locator; // form#search_form（twig:28）
  readonly startDate: Locator; // #admin_analysis_used_card_start_date
  readonly endDate: Locator; // #admin_analysis_used_card_end_date
  readonly formats: Locator; // #admin_analysis_used_card_formats（select2 multiple）
  readonly includeBasic: Locator; // #admin_analysis_used_card_include_basic
  readonly csvDownloadButton: Locator; // form内 button[type=submit]（twig:63、文言は実装由来＝非オラクル）
  readonly searchClearLink: Locator; // a.search-clear「検索条件をクリア」（twig:57）

  constructor(page: Page) {
    this.page = page;
    // 実装パスはハイフン `used-card`（UsedCardController.php:39）。設計書のアンダースコア表記とは差異（ケース表 付帯表4#4）。
    this.url = `/${ECCUBE_ADMIN_ROUTE}/analysis/used-card`;

    this.searchForm = page.locator("#search_form");
    this.startDate = page.locator("#admin_analysis_used_card_start_date");
    this.endDate = page.locator("#admin_analysis_used_card_end_date");
    this.formats = page.locator("#admin_analysis_used_card_formats");
    this.includeBasic = page.locator("#admin_analysis_used_card_include_basic");
    // 送信ボタンは form 内の type=submit（used_card.twig:63 <button type="submit">）で構造特定する。
    // 文言「特集タグ編集CSVダウンロード」は messages.ja.yaml:5917 由来＝実装オラクルのため
    // ロケータ・合否には用いない（オラクル独立性）。
    this.csvDownloadButton = page.locator("#search_form button[type='submit']");
    this.searchClearLink = page.locator("a.search-clear");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 検索フォームの主要UI部品が仕様どおり表示されること（利用者視点の入口・表示要素）。 */
  async seeSearchForm() {
    await expect(this.searchForm).toBeVisible();
    await expect(this.startDate).toBeVisible();
    await expect(this.formats).toBeVisible();
    await expect(this.csvDownloadButton).toBeVisible();
  }

  /** select2 の下地 <select multiple> の先頭オプションを1件選択する（フォーマット必須を満たす）。 */
  async selectFirstFormat() {
    const firstOption = this.formats.locator("option").first();
    // 選択肢0件（フォーマットマスタ未シード）を後続のDL待ちタイムアウトでなく明示検出する。
    await expect(firstOption).toBeAttached();
    const firstValue = await firstOption.getAttribute("value");
    if (firstValue) {
      await this.formats.selectOption(firstValue);
    }
  }

  /** CSVダウンロードボタンを押下する。 */
  async clickDownload() {
    await this.csvDownloadButton.click();
  }
}
