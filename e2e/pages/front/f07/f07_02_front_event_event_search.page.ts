import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_FRONT_LOCALE, ECCUBE_FRONT_SHOP } from "../../../config/default.config";

/**
 * フロント イベント「大会詳細検索（イベント検索）」（F07-02）Page Object。
 * integration_test/e2e/f07_02_front_event_event_search_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f07-02_front_event_event_search.md（画面・処理フロー・集計条件・表示メッセージ）由来。
 * ec-cube-enterprise/pf-eccube3 の Twig(Event/search.twig・Event/list.twig) は本リポジトリに未取込のため、
 * セレクタは URL・表示文言・フォーム要素の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 *
 * 本機能はログイン不要の公開検索画面。検索条件はGET送信でクエリへ載る。件数0件は HTTP404 として一覧本文を返す。
 */
export class FrontEventSearchPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly searchUrl: string;
  readonly listUrl: string;
  readonly eventsTopUrl: string;

  readonly heading: Locator;
  readonly body: Locator;
  readonly keywordInput: Locator; // 由来: Event/search.twig（クエリ term）要実機確認
  readonly dateFrom: Locator; // 由来: 開催日時（開始）name*=from 要実機確認
  readonly dateTo: Locator; // 由来: 開催日時（終了）name*=to 要実機確認
  readonly formatCheckboxes: Locator; // 由来: フォーマット formats[] 要実機確認
  readonly venueCheckboxes: Locator; // 由来: 開催場所 venues[] 要実機確認
  readonly weekdayCheckbox: Locator; // 由来: isWeekday 要実機確認
  readonly holidayCheckbox: Locator; // 由来: isHoliday 要実機確認
  readonly pastCheckbox: Locator; // 由来: isPast 要実機確認
  readonly searchButton: Locator; // 由来: 検索ボタン trans キー 要実機確認
  readonly resetButton: Locator; // 由来: リセットボタン 要実機確認
  readonly backButton: Locator; // 由来: 戻るボタン→/events 要実機確認
  readonly modal: Locator; // 日付ピッカー以外のモーダル/ポップアップ不在確認用
  readonly errorArea: Locator; // 入力バリデーションエラー枠（存在しない想定）

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.searchUrl = `${this.localePrefix}/events/search`;
    this.listUrl = `${this.localePrefix}/events/list`;
    this.eventsTopUrl = `${this.localePrefix}/events`;

    this.heading = page.getByRole("heading", { name: /イベント検索|Event Search/ }).first();
    this.body = page.locator("body");
    this.keywordInput = page
      .locator('input[name*="term"], input[name*="keyword"], input[type="search"], input[type="text"]')
      .first();
    this.dateFrom = page.locator('input[name*="from"], input[name*="start"]').first();
    this.dateTo = page.locator('input[name*="to"], input[name*="end"]').first();
    this.formatCheckboxes = page.locator('input[type="checkbox"][name*="format"]');
    this.venueCheckboxes = page.locator('input[type="checkbox"][name*="venue"]');
    this.weekdayCheckbox = page.locator('input[name*="isWeekday"], input[name*="weekday"]').first();
    this.holidayCheckbox = page.locator('input[name*="isHoliday"], input[name*="holiday"]').first();
    this.pastCheckbox = page.locator('input[name*="isPast"], input[name*="past"]').first();
    this.searchButton = page.getByRole("button", { name: /検索|Search/ }).first();
    this.resetButton = page.getByRole("button", { name: /リセット|Reset|クリア/ }).first();
    // 戻るはリンク/ボタンのどちらでも拾えるよう文言で寄せる。
    this.backButton = page.getByRole("link", { name: /戻る|Back/ }).first();
    this.modal = page.locator('[role="dialog"], .modal.show, .ec-modal, .toast');
    this.errorArea = page.locator(".text-danger, .ec-errorMessage, .error, [class*='invalid']");
  }

  async gotoSearchForm() {
    await this.page.goto(this.searchUrl);
  }

  async gotoEventsTop() {
    await this.page.goto(this.eventsTopUrl);
  }

  /** 結果一覧URLへ直接アクセスする。0件時は 404 応答となるため response を返す。 */
  async gotoList(query = "") {
    const url = query ? `${this.listUrl}?${query}` : this.listUrl;
    return this.page.goto(url);
  }

  async fillKeyword(keyword: string) {
    await this.keywordInput.fill(keyword);
  }

  async submitSearch() {
    await this.searchButton.click();
  }

  /** 検索フォームの主要UI部品が表示されていること（仕様：フロント挙動 表示要素）。 */
  async seeSearchForm() {
    await expect(this.heading).toBeVisible();
    await expect(this.keywordInput).toBeVisible();
    await expect(this.dateFrom).toBeVisible();
    await expect(this.dateTo).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }

  /** 結果一覧URLへ遷移していること（0件時404でもURLは events/list）。 */
  async expectOnListUrl() {
    await expect(this.page).toHaveURL(/\/events\/list(?:\?|$)/);
  }

  async expectOnEventsTopUrl() {
    await expect(this.page).toHaveURL(/\/events(?:\/|\?|$)/);
  }
}
