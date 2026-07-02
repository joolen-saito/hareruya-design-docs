import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 イベント管理 > イベント一覧検索 Page Object（未実行雛形）。
 * 画面: admin_event_index ＝ GET/POST /{admin_route}/event（EventController.php:56 / @admin/Event/index.twig）。
 *   ページ送り admin_event_index_page ＝ /{admin_route}/event/page/{page_no}（EventController.php:57）。
 * 期待結果は仕様（正本 functions/pf-eccube3/m13-01_admin_event_event_search_list.md / 観点表 / 基本設計）由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_search_event`（SearchEventType.php:140-143）由来の位置情報のみ。
 *
 * 設計源(pf-eccube3 リバース) ⇔ 刷新先(ec-cube-enterprise) 乖離（ケース表 付帯表4）:
 *  - 入口URLが設計 `/event/list`(初期表示=結果非表示) ↔ 実装は GET `/event` で一覧を表示（#1）。本POMは実装ルートを位置情報として用いる。
 *  - 検索条件「会場(MtbVenue)」が刷新先に無く、店舗(base_info)に置換（#2/#3）。創作セレクタを置かない＝会場欄の確認は spec で fixme。
 *  - イベント名 multi に Length制約が無い（#9）／開催日は range/date_range_error 追加（#8）／件数・0件文言差（#4/#5）。
 *
 * DOM id / セレクタ根拠（index.twig / SearchEventType.php 基準）:
 *  - 検索フォーム form#search_form（index.twig:38, method=post action=admin_event_index）
 *  - イベント名(日/英/略称) multi → #admin_search_event_multi（SearchEventType.php:40 / index.twig:46。placeholder admin.event.multi_search_placeholder）
 *  - 開催日From → #admin_search_event_start_date_from（:44 / index.twig:65、初期値 -3ヶ月）
 *  - 開催日To → #admin_search_event_start_date_to（:62 / index.twig:70）
 *  - フォーマット(select) → #admin_search_event_formats（:79 / index.twig:77）
 *  - ルール適用度(select) → #admin_search_event_rel（:87 / index.twig:89）
 *  - 店舗(select2 multiple) → #admin_search_event_base_info（:95 / index.twig:84。spec=会場非該当・付帯表4#2/#3）
 *  - ソートキー/種別(hidden) → #admin_search_event_sortkey / _sorttype（:107-114 / index.twig:40-41）
 *  - 検索ボタン「検索」 admin.common.search（index.twig:100 / messages.ja.yaml:1446）= #search_form button[type="submit"]
 *  - 新規作成「新規作成」 admin.common.create__new（index.twig:55 / messages.ja.yaml:1454。href admin_event_create=/event/create）
 *  - 一覧テーブル table.table（index.twig:135）／行 tr#ex-event-{id}（index.twig:147、編集リンク href admin_event_edit index.twig:149）
 *  - 件数表示 admin.common.search_result（index.twig:101-103 / messages.ja.yaml:1538）
 *  - 0件見出し admin.common.search_no_result（index.twig:203 / messages.ja.yaml:1542）
 *  - 表示件数 #page_count_pulldown（index.twig:117）／ソート #sort_by_pulldown（index.twig:125、option eventName index.twig:127）
 *  - 削除確認モーダル #event_delete_{id}（index.twig:181）／確認文 admin.event.delete.confirm（index.twig:189 / messages.ja.yaml:5716）
 */
export class EventEventSearchListPage {
  readonly page: Page;
  readonly listUrl: string;

  readonly searchForm: Locator; // form#search_form
  readonly multi: Locator; // #admin_search_event_multi（イベント名）
  readonly startDateFrom: Locator; // #admin_search_event_start_date_from
  readonly startDateTo: Locator; // #admin_search_event_start_date_to
  readonly formats: Locator; // #admin_search_event_formats
  readonly rel: Locator; // #admin_search_event_rel
  readonly baseInfo: Locator; // #admin_search_event_base_info（店舗。spec=会場 付帯表4#2/#3）
  readonly sortkey: Locator; // #admin_search_event_sortkey（hidden）
  readonly searchButton: Locator; // 検索ボタン
  readonly createButton: Locator; // 新規作成ボタン（→ admin_event_create）
  readonly resultTable: Locator; // 一覧テーブル table.table
  readonly countMessage: Locator; // 件数表示
  readonly emptyMessage: Locator; // 0件見出し
  readonly pageCountPulldown: Locator; // 表示件数プルダウン
  readonly sortByPulldown: Locator; // ソートプルダウン

  constructor(page: Page) {
    this.page = page;
    // 実装ルート（位置情報）。設計URL `/event/list`(初期表示=結果非表示) との乖離は付帯表4#1。
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/event`;

    this.searchForm = page.locator("#search_form");
    this.multi = page.locator("#admin_search_event_multi");
    this.startDateFrom = page.locator("#admin_search_event_start_date_from");
    this.startDateTo = page.locator("#admin_search_event_start_date_to");
    this.formats = page.locator("#admin_search_event_formats");
    this.rel = page.locator("#admin_search_event_rel");
    this.baseInfo = page.locator("#admin_search_event_base_info");
    this.sortkey = page.locator("#admin_search_event_sortkey");
    this.searchButton = page.locator('#search_form button[type="submit"]');
    this.createButton = page.getByRole("link", { name: "新規作成" });
    this.resultTable = page.locator("table.table");
    // 件数表示専用に絞る。`#search_form .fw-bold` だけだと詳細検索トグル(span.fw-bold index.twig:51)にも
    // 一致するため、件数 span 固有の `.ms-2`（index.twig:102）で限定する（誤一致回避・付帯表4#4）。
    this.countMessage = page.locator("#search_form .fw-bold.ms-2");
    // 0件見出し（趣旨は仕様「該当データが無い旨」と一致＝文言差は付帯表4#5）。
    this.emptyMessage = page.locator(".card-body .text-muted.h5");
    this.pageCountPulldown = page.locator("#page_count_pulldown");
    this.sortByPulldown = page.locator("#sort_by_pulldown");
  }

  async goto() {
    await this.page.goto(this.listUrl);
  }

  /** 既定条件のまま検索実行（POST）。 */
  async submitSearch() {
    await this.searchButton.click();
  }

  /** イベント名キーワードで検索実行。 */
  async searchByKeyword(keyword: string) {
    await this.multi.fill(keyword);
    await this.searchButton.click();
  }

  /** 開催日From/Toを指定して検索実行。 */
  async searchByStartDateRange(from: string, to: string) {
    await this.startDateFrom.fill(from);
    await this.startDateTo.fill(to);
    await this.searchButton.click();
  }

  /** 検索結果一覧の行ロケータ。 */
  resultRows(): Locator {
    return this.resultTable.locator("tbody tr");
  }

  /** 指定キーワード（イベント名）を含む一覧行。検索結果に該当行が含まれることの検証用。 */
  resultRowsContaining(text: string): Locator {
    return this.resultRows().filter({ hasText: text });
  }

  /** 複数語すべて（AND）を含む一覧行。イベント名検索の語ごとAND結合の検証用（md:141）。 */
  resultRowsContainingAll(words: string[]): Locator {
    let rows = this.resultRows();
    for (const w of words) rows = rows.filter({ hasText: w });
    return rows;
  }

  /**
   * 一覧行のイベントID（tr#ex-event-{id}）を上から順に返す。
   * 既定ソート（ソートキー=default＝イベントID・並び順DESC md:148）の並び検証用。
   */
  async rowEventIds(): Promise<number[]> {
    return this.resultTable
      .locator('tbody tr[id^="ex-event-"]')
      .evaluateAll((rows) =>
        rows
          .map((r) => Number((r.id || "").replace("ex-event-", "")))
          .filter((n) => !Number.isNaN(n))
      );
  }

  /**
   * 指定イベント名の一覧行に紐づく操作メニューを開き「削除」を押す（行をシードIDで特定）。
   * 先頭行ではなく対象イベント行を狙うことで、別店舗/削除不可イベントの誤選択を避ける（付帯表4#10）。
   */
  async openDeleteForEvent(eventName: string) {
    const row = this.resultRowsContaining(eventName).first();
    await row.locator(".dropdown-menu-toggle").click();
    await row.getByRole("button", { name: "削除" }).click();
  }

  /** 初期表示のUI部品が仕様どおり表示されていること（会場欄は刷新先に無いため対象外＝付帯表4#2）。 */
  async seeSearchForm() {
    await expect(this.searchForm).toBeVisible();
    await expect(this.multi).toBeVisible();
    await expect(this.startDateFrom).toBeVisible();
    await expect(this.startDateTo).toBeVisible();
    await expect(this.formats).toBeVisible();
    await expect(this.rel).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }
}
