import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 イベント管理 > イベント申込検索（一覧/検索）Page Object（未実行雛形）。
 * 画面: GET/POST /{admin_route}/event/entry（EntryController.php:93 admin_event_entry / @admin/Event/Entry/index.twig）。
 *   ページ送り GET /{admin_route}/event/entry/page/{page_no}（:94 admin_event_entry_page）。
 *   イベント詳細指定表示 GET /{admin_route}/event/entry/event_detail/{event_detail_id}（:95 admin_event_entry_event_detail）。
 * 期待結果は仕様(正本 functions/pf-eccube3/m13-06_admin_event_event_entry_management_search.md / 観点表 / 基本設計)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_search_event`（SearchEntryType.php:195-198）由来の位置情報のみ。
 * Form の required/Length/Range はセレクタ確認にのみ用い、期待結果へ流用しない。
 *
 * 設計源(pf-eccube3 リバース) ⇔ 刷新先(ec-cube-enterprise) 乖離（ケース表 付帯表4）:
 *  - 入口URLが設計 `/entry/list`・`/entry/search` ↔ 実装 `/event/entry`(GET/POST同一)（#1）。本POMは実装ルートを位置情報として用いる。
 *  - 検索モード値 entriedEvent/registedDeck ↔ event_entry/deck_registration（#2）。
 *  - DCIナンバー(dci_no)・確認済(confirm_flg) 欄は仕様(正本:92,168)に存在するが刷新先フォームに欠落（#3#4）。
 *    セレクタは blockprefix＋検索条件キー由来の仕様期待値とし、seeSearchInputs で存在を検証＝実装で落として欠落を検出する。
 *  - 初期表示挙動・並び順不正時の扱いが乖離（#5#6）。期待値は仕様どおり。
 *
 * DOM id / セレクタ根拠（index.twig 基準）:
 *  - 検索フォーム form#search_form（twig:237, method=post action=admin_event_entry）
 *  - イベント名 → #admin_search_event_event_name（twig:243）
 *  - 店舗(base_info, select2) → #admin_search_event_base_info（twig:256）
 *  - 申込状況(entry_status, select2) → #admin_search_event_entry_status（twig:261）
 *  - 支払方法(payment, select2) → #admin_search_event_payment（twig:268）
 *  - 支払番号 → #admin_search_event_payment_no（twig:273）
 *  - プレイヤー名 → #admin_search_event_player_name（twig:280）
 *  - 開催日時From → #admin_search_event_start_date_from（twig:287、初期値 当日0時）
 *  - 開催日時To → #admin_search_event_start_date_to（twig:292）
 *  - デッキ登録有無(expanded) → #admin_search_event_is_deck_registered（twig:301）
 *  - イベント詳細ID → #admin_search_event_event_detail_id（twig:306）
 *  - 検索種別(searchMode, radio expanded) → input[name="admin_search_event[searchMode]"] value=event_entry/deck_registration（twig:313）
 *  - 検索ボタン「検索」 admin.common.search（twig:324 / messages.ja.yaml:1446）= #search_form button[type="submit"]
 *  - イベント情報検索モーダルボタン admin.event.entry.search_event_info（twig:248）
 *  - 一覧テーブル table.table-sm（twig:390、totalItemCount>0 のとき）
 *  - 0件メッセージ admin.common.search_no_result「検索条件に合致するデータが見つかりませんでした」（twig:473 / messages.ja.yaml:1542）
 *  - 表示件数プルダウン #page_count_pulldown（twig:346）
 *  - CSVダウンロードメニュー #entryCsvDownloadDropDown / CSV出力リンク a[href*="event/entry/csv"]（twig:353-358 / admin_event_entry_csv_export）
 *  - ソートメニュー #result_list_main__sort_menu（twig:365）
 *  - デッキ表示ボタン #decklist（twig:381、window.open width=960 height=900 twig:62）
 *  - 一括編集リンク a[data-bs-target="#bulkUpdateModal"]（twig:344、申込モードのみ）
 *  - フォームエラー .invalid-feedback（form_errors 出力。具体要素は要実機確認）
 */
export class EventEventEntryManagementSearchPage {
  readonly page: Page;
  readonly listUrl: string;

  readonly searchForm: Locator; // form#search_form
  readonly eventName: Locator; // #admin_search_event_event_name
  readonly baseInfo: Locator; // #admin_search_event_base_info（店舗）
  readonly entryStatus: Locator; // #admin_search_event_entry_status（申込状況）
  readonly payment: Locator; // #admin_search_event_payment（支払方法）
  readonly paymentNo: Locator; // #admin_search_event_payment_no（支払番号）
  readonly playerName: Locator; // #admin_search_event_player_name（プレイヤー名）
  readonly startDateFrom: Locator; // #admin_search_event_start_date_from（開催日時From）
  readonly startDateTo: Locator; // #admin_search_event_start_date_to（開催日時To）
  readonly isDeckRegistered: Locator; // #admin_search_event_is_deck_registered（デッキ登録有無）
  // 仕様(正本:92,168)の入力項目。刷新先 SearchEntryType に欄が欠落（付帯表4#3#4 不具合候補）。
  // セレクタは blockprefix=admin_search_event ＋ 検索条件キー(dci_no/confirm_flg) から導く仕様期待値。
  readonly dciNo: Locator; // #admin_search_event_dci_no（DCIナンバー・仕様期待。実装欠落）
  readonly confirmFlg: Locator; // #admin_search_event_confirm_flg（確認済・仕様期待。実装欠落）
  readonly eventDetailId: Locator; // #admin_search_event_event_detail_id（イベント詳細ID）
  readonly searchModeRadios: Locator; // input[name="admin_search_event[searchMode]"]
  readonly searchModeEventEntry: Locator; // value=event_entry（イベント申込検索）
  readonly searchModeDeck: Locator; // value=deck_registration（デッキ登録検索）
  readonly searchButton: Locator; // #search_form button[type=submit]「検索」
  readonly searchEventInfoButton: Locator; // イベント情報検索モーダルボタン
  readonly resultTable: Locator; // 一覧テーブル table.table-sm
  readonly emptyMessage: Locator; // 0件メッセージ
  readonly pageCountPulldown: Locator; // #page_count_pulldown
  readonly csvMenu: Locator; // #entryCsvDownloadDropDown
  readonly csvExportLink: Locator; // CSV出力リンク
  readonly sortMenu: Locator; // #result_list_main__sort_menu
  readonly decklistButton: Locator; // #decklist
  readonly formError: Locator; // .invalid-feedback（要実機確認）

  constructor(page: Page) {
    this.page = page;
    // 実装ルート（位置情報）。設計URL `/entry/list` との乖離は付帯表4#1。
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/event/entry`;

    this.searchForm = page.locator("#search_form");
    this.eventName = page.locator("#admin_search_event_event_name");
    this.baseInfo = page.locator("#admin_search_event_base_info");
    this.entryStatus = page.locator("#admin_search_event_entry_status");
    this.payment = page.locator("#admin_search_event_payment");
    this.paymentNo = page.locator("#admin_search_event_payment_no");
    this.playerName = page.locator("#admin_search_event_player_name");
    this.startDateFrom = page.locator("#admin_search_event_start_date_from");
    this.startDateTo = page.locator("#admin_search_event_start_date_to");
    this.isDeckRegistered = page.locator("#admin_search_event_is_deck_registered");
    this.dciNo = page.locator("#admin_search_event_dci_no");
    this.confirmFlg = page.locator(
      '[id^="admin_search_event_confirm_flg"]'
    );
    this.eventDetailId = page.locator("#admin_search_event_event_detail_id");
    this.searchModeRadios = page.locator(
      'input[name="admin_search_event[searchMode]"]'
    );
    this.searchModeEventEntry = page.locator(
      'input[name="admin_search_event[searchMode]"][value="event_entry"]'
    );
    this.searchModeDeck = page.locator(
      'input[name="admin_search_event[searchMode]"][value="deck_registration"]'
    );
    this.searchButton = page.locator('#search_form button[type="submit"]');
    this.searchEventInfoButton = page.locator(
      'button[data-bs-target="#searchEventModal"]'
    );
    this.resultTable = page.locator(".c-primaryCol table.table-sm");
    // 0件メッセージ（仕様趣旨「該当データが無い旨」。文言は messages.ja.yaml:1542 由来）。
    this.emptyMessage = page.locator(".c-primaryCol .card-body .text-muted.h5");
    this.pageCountPulldown = page.locator("#page_count_pulldown");
    this.csvMenu = page.locator("#entryCsvDownloadDropDown");
    this.csvExportLink = page.locator('a[href*="event/entry/csv"]');
    this.sortMenu = page.locator("#result_list_main__sort_menu");
    this.decklistButton = page.locator("#decklist");
    this.formError = page.locator(".invalid-feedback");
  }

  async goto() {
    await this.page.goto(this.listUrl);
  }

  /** イベント詳細指定表示（特定日程の申込一覧）を開く。 */
  async gotoEventDetail(eventDetailId: number | string) {
    await this.page.goto(`${this.listUrl}/event_detail/${eventDetailId}`);
  }

  /** ページ送りURL（admin_event_entry_page）を開く。 */
  async gotoPage(pageNo: number, query = "") {
    await this.page.goto(`${this.listUrl}/page/${pageNo}${query}`);
  }

  /** 既定条件のまま検索実行（POST）。 */
  async submitSearch() {
    await this.searchButton.click();
  }

  /** イベント名キーワードで検索実行。 */
  async searchByEventName(keyword: string) {
    await this.eventName.fill(keyword);
    await this.searchButton.click();
  }

  /** デッキ登録検索モードを選んで検索実行。 */
  async searchAsDeckRegistration() {
    await this.searchModeDeck.check();
    await this.searchButton.click();
  }

  /** イベント詳細IDを入力して検索実行。 */
  async searchByEventDetailId(value: string) {
    await this.eventDetailId.fill(value);
    await this.searchButton.click();
  }

  /** 開催日時From/Toを入力して検索実行。 */
  async searchByDateRange(from: string, to: string) {
    await this.startDateFrom.fill(from);
    await this.startDateTo.fill(to);
    await this.searchButton.click();
  }

  /** デッキ表示ボタンを押下し、開いた別ウィンドウ（popup）を返す。 */
  async openDeckListPopup() {
    const [popup] = await Promise.all([
      this.page.waitForEvent("popup"),
      this.decklistButton.click(),
    ]);
    return popup;
  }

  /** 一覧の行ロケータ。 */
  resultRows(): Locator {
    return this.resultTable.locator("tbody tr");
  }

  /** 検索フォームの基本UI部品が仕様どおり表示されていること。 */
  async seeSearchForm() {
    await expect(this.searchForm).toBeVisible();
    await expect(this.eventName).toBeVisible();
    await expect(this.searchButton).toBeVisible();
    await expect(this.searchModeEventEntry).toHaveCount(1);
    await expect(this.searchModeDeck).toHaveCount(1);
  }

  /**
   * 各検索入力部品が仕様(正本:92,168)どおり表示されていること。
   * 期待は仕様由来。DCIナンバー・確認済は刷新先フォームに欠落（付帯表4#3#4 不具合候補）のため、
   * 本アサーションは実装で落ちて欠落を検出する（実装へ寄せて欠落を黙認しない）。
   */
  async seeSearchInputs() {
    await expect(this.eventName).toBeVisible();
    await expect(this.baseInfo).toHaveCount(1);
    await expect(this.entryStatus).toHaveCount(1);
    await expect(this.payment).toHaveCount(1);
    await expect(this.paymentNo).toBeVisible();
    await expect(this.playerName).toBeVisible();
    await expect(this.startDateFrom).toBeVisible();
    await expect(this.startDateTo).toBeVisible();
    await expect(this.isDeckRegistered).toHaveCount(1);
    await expect(this.eventDetailId).toBeVisible();
    // 仕様の入力項目（実装欠落＝不具合検出）。
    await expect(this.dciNo).toHaveCount(1);
    await expect(this.confirmFlg.first()).toHaveCount(1);
  }

  /** 検索結果（一覧テーブル または 0件メッセージ）のいずれかが描画されていること。 */
  async seeListOrEmpty() {
    const hasTable = (await this.resultTable.count()) > 0;
    const hasEmpty = (await this.emptyMessage.count()) > 0;
    expect(hasTable || hasEmpty).toBeTruthy();
  }
}
