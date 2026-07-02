import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 イベント管理 > イベント申込登録検索 Page Object（未実行雛形）。
 * 入口は「イベント申込一覧」画面 /admin/event/entry（route admin_event_entry / EntryController.php:93）。
 * イベント検索は同画面内のモーダル #searchEventModal（index.twig:484）で行い、結果断片
 * @admin/Event/Entry/search_event_modal_list.twig を #searchEventModalList（index.twig:531）へ非同期挿入する。
 *
 * 期待結果は仕様(functions/pf-eccube3/m13-11_admin_event_event_entry_search.md / 観点表)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_entry_event_modal`（SearchEntryEventModalType.php:110-113）由来の位置情報のみ。
 *
 * 設計源(pf-eccube3)と刷新先(ec-cube-enterprise)の乖離はケース表 付帯表4 を参照（URL/メソッド・直接検索応答・非同期でない時の分岐）。
 *
 * DOM id / セレクタ根拠:
 *  - モーダル起動ボタン「イベント情報を検索＞」 trans admin.event.entry.search_event_info（index.twig:248 / messages.ja.yaml:5756）
 *  - モーダル #searchEventModal（index.twig:484）/ タイトル #searchEventModalLabel trans admin.event.entry.search_event_modal_title（index.twig:488 / messages.ja.yaml:5757）
 *  - 検索フォーム #searchEventModalForm（index.twig:492, method GET）
 *  - event_name → #admin_entry_event_modal_event_name（index.twig:497, placeholder admin.event.entry.event_name_placeholder messages.ja.yaml:5755）
 *  - base_info → #admin_entry_event_modal_base_info（index.twig:504）
 *  - start_date_from → #admin_entry_event_modal_start_date_from（index.twig:514）
 *  - start_date_to → #admin_entry_event_modal_start_date_to（index.twig:519）
 *  - 検索ボタン #searchEventModalButton data-url=admin_entry_event_html（index.twig:527, trans admin.common.search messages.ja.yaml:1446）
 *  - 結果リスト #searchEventModalList（index.twig:531）/ 結果テーブル見出し #search_event_modal_box__body_inner_header（list.twig:11）
 *  - 決定ボタン .set-event data-url=admin_entry_search_event_by_id（list.twig:42-48, trans admin.common.decision messages.ja.yaml:1452）
 *  - 0件 admin.common.search_no_result（list.twig:73 / messages.ja.yaml:1542）
 *  - 入力エラー .alert.alert-danger（list.twig:2、日付範囲は admin.common.date_range_error messages.ja.yaml:1418）
 *  - ページャ #event_pagination（list.twig:65-69 pager.twig / route admin_entry_event_html_page）
 */
export class EventEventEntrySearchPage {
  readonly page: Page;
  readonly url: string; // イベント申込一覧（モーダルの入口）

  readonly openModalButton: Locator; // 「イベント情報を検索＞」
  readonly modal: Locator; // #searchEventModal
  readonly modalTitle: Locator; // #searchEventModalLabel
  readonly modalForm: Locator; // #searchEventModalForm
  readonly eventName: Locator; // #admin_entry_event_modal_event_name
  readonly baseInfo: Locator; // #admin_entry_event_modal_base_info
  readonly startDateFrom: Locator; // #admin_entry_event_modal_start_date_from
  readonly startDateTo: Locator; // #admin_entry_event_modal_start_date_to
  readonly searchButton: Locator; // #searchEventModalButton
  readonly resultList: Locator; // #searchEventModalList
  readonly resultTableHeader: Locator; // #search_event_modal_box__body_inner_header
  readonly decisionButtons: Locator; // .set-event（「決定」）
  readonly emptyMessage: Locator; // 0件メッセージ
  readonly formError: Locator; // .alert-danger（入力エラー）
  readonly pager: Locator; // #event_pagination

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/event/entry`;

    this.openModalButton = page.locator(
      '[data-bs-target="#searchEventModal"]'
    ); // index.twig:248
    this.modal = page.locator("#searchEventModal"); // index.twig:484
    this.modalTitle = page.locator("#searchEventModalLabel"); // index.twig:488
    this.modalForm = page.locator("#searchEventModalForm"); // index.twig:492
    this.eventName = page.locator("#admin_entry_event_modal_event_name"); // index.twig:497
    this.baseInfo = page.locator("#admin_entry_event_modal_base_info"); // index.twig:504
    this.startDateFrom = page.locator(
      "#admin_entry_event_modal_start_date_from"
    ); // index.twig:514
    this.startDateTo = page.locator("#admin_entry_event_modal_start_date_to"); // index.twig:519
    this.searchButton = page.locator("#searchEventModalButton"); // index.twig:527
    this.resultList = page.locator("#searchEventModalList"); // index.twig:531
    this.resultTableHeader = page.locator(
      "#search_event_modal_box__body_inner_header"
    ); // list.twig:11
    this.decisionButtons = this.resultList.locator(".set-event"); // list.twig:42-48
    this.emptyMessage = this.resultList.getByText(
      "検索条件に合致するデータが見つかりませんでした"
    ); // list.twig:73 / messages.ja.yaml:1542
    this.formError = this.resultList.locator(".alert-danger"); // list.twig:2
    this.pager = page.locator("#event_pagination"); // list.twig:65-69
  }

  /** イベント申込一覧画面を開く。 */
  async goto() {
    await this.page.goto(this.url);
  }

  /** 検索エンドポイントHTML断片へ直接アクセス（未ログイン誘導の確認用）。 */
  async gotoSearchEventEndpoint() {
    await this.page.goto(`/${ECCUBE_ADMIN_ROUTE}/event/entry/search_event`);
  }

  /** 「イベント情報を検索＞」を押してモーダルを開く。 */
  async openModal() {
    await this.openModalButton.click();
    await expect(this.modal).toBeVisible();
  }

  /**
   * モーダルの検索フォーム部品が仕様どおり表示されること。
   * 設計書フロント挙動「入力（キーワード・期間）」由来＝イベント名・開催日・検索ボタンのみを必須観測とする。
   * 店舗(base_info)フィルタは設計書に記載が無い実装由来項目のため、本関数では必須観測に含めない（オラクル独立性・付帯表4#4）。
   */
  async seeSearchForm() {
    await expect(this.eventName).toBeVisible();
    await expect(this.startDateFrom).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }

  /** キーワードでイベントを検索する。 */
  async searchByEventName(keyword: string) {
    await this.eventName.fill(keyword);
    await this.searchButton.click();
  }

  /** 開催日の範囲（From / To）を指定して検索する。値の書式は単一テキストの date 入力。 */
  async searchByDateRange(from: string, to: string) {
    await this.startDateFrom.fill(from);
    await this.startDateTo.fill(to);
    await this.searchButton.click();
  }

  /** イベント名＋開始日(From)を指定して検索する（開始日条件の確認）。 */
  async searchByNameAndStartDate(name: string, from: string) {
    await this.eventName.fill(name);
    await this.startDateFrom.fill(from);
    await this.searchButton.click();
  }

  /** 条件を入力せず検索する（任意項目の確認）。 */
  async searchWithoutConditions() {
    await this.searchButton.click();
  }

  /** 検索結果一覧（テーブル見出し）が表示されること。 */
  async seeResultList() {
    await expect(this.resultTableHeader).toBeVisible();
  }

  /** 検索結果一覧または0件メッセージのいずれかが表示されること。 */
  async seeResultOrEmpty() {
    await expect(
      this.resultTableHeader.or(this.emptyMessage).first()
    ).toBeVisible();
  }

  /** 結果一覧の先頭行の「決定」ボタンを押す（直接検索＝イベント1件確定）。 */
  async clickFirstDecision() {
    await this.decisionButtons.first().click();
  }
}
