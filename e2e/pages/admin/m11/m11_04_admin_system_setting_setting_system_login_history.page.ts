import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 システム情報設定 > ログイン履歴 一覧/検索 Page Object。
 * 画面: GET/POST /{admin_route}/setting/system/login_history（LoginHistoryController.php:47-50 admin_setting_system_login_history /
 *   @admin/Setting/System/login_history.twig）。ページ送りは admin_setting_system_login_history_page（/{page_no}, page_no=\d+ :48）。
 * 期待結果は仕様(functions/ec-cube-enterprise/m11-04_admin_system_setting_setting_system_login_history.md / 観点表 / messages.ja.yaml)由来（オラクル独立性）。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`admin_search_login_history`（SearchLoginHistoryType.php:111-114）由来の位置情報のみ。
 *
 * DOM id / セレクタ根拠（login_history.twig は nl -ba 基準）:
 *  - 検索フォーム form#search_form（login_history.twig:35, method=post）
 *  - キーワード検索 multi → #admin_search_login_history_multi（twig:43 / SearchLoginHistoryType.php:43-49）
 *  - キーワードラベル「ログインID・IPアドレス」 admin.setting.system.login_history.multi_search_label（twig:42 / messages.ja.yaml:3112）
 *      ＋ヘルプアイコン label[data-bs-toggle="tooltip"] title=tooltip.setting.system.login_history.multi_search_label（twig:42 / messages.ja.yaml:3493）
 *  - 詳細検索リンク「詳細検索」 admin.common.search_detail（twig:46 / messages.ja.yaml:1537）= div[data-bs-toggle="collapse"][href="#searchDetail"]
 *  - 詳細検索ブロック #searchDetail（twig:50、has_errors 時 class に show 付与）
 *  - ログインID欄 user_name → #admin_search_login_history_user_name（twig:55 / Form:50-56）
 *  - IPアドレス欄 client_ip → #admin_search_login_history_client_ip（twig:62 / Form:57-63）
 *  - 期間(開始) → #admin_search_login_history_create_datetime_start（twig:74 / Form:70-86 single_text/datetimepicker）
 *  - 期間(終了) → #admin_search_login_history_create_datetime_end（twig:79 / Form:87-103）
 *  - ステータス(複数チェック expanded) 失敗0 → #admin_search_login_history_Status_0 / 成功1 → #admin_search_login_history_Status_1（twig:88 / Form:64-69）
 *  - 検索CSRFトークン → #admin_search_login_history__token（twig:36）
 *  - 検索ボタン「検索」 admin.common.search（twig:114 / messages.ja.yaml:1446）
 *  - 検索結果件数「検索結果：%count%件が該当しました」 admin.common.search_result（twig:116 / messages.ja.yaml:1538、pagination 有時のみ）
 *  - 表示件数プルダウン #page_count_pulldown（twig:132、option value=path admin_setting_system_login_history_page {page_no:1,page_count:N} twig:135）
 *  - 一覧テーブル table.table（twig:146）/ 列見出し ID admin.common.id(:1612) / ログインID ...login_history.user_name(:3116) /
 *      IPアドレス ...client_ip(:3117) / ログイン試行日 ...create_date(:3113) / ステータス ...status(:3118)（twig:149-153）
 *  - ステータスバッジ .badge（成功=badge-ec-blue / 失敗=badge-ec-red、文言は mtb_login_history_status.name「成功」「失敗」twig:172-173 / import_csv/ja:0=失敗,1=成功）
 *  - 検証エラー時メッセージ「検索条件に誤りがあります」 admin.common.search_invalid_condition（twig:190 / messages.ja.yaml:1541）
 *      ＋「検索条件を変えて、再度検索をお試しください」 admin.common.search_try_change_condition（twig:191 / :1543）
 *  - 0件メッセージ「検索条件に合致するデータが見つかりませんでした」 admin.common.search_no_result（twig:197 / messages.ja.yaml:1542）
 *  - ページタイトル「ログイン履歴」 admin.setting.system.login_history（twig:16 / default_frame.twig:196 h2.c-pageTitle__title / messages.ja.yaml:2794）
 *  - サブタイトル「システム設定」 admin.setting.system（twig:17 / default_frame.twig:196 .c-pageTitle__subTitle / messages.ja.yaml:2787。設計書用語「システム情報設定」と差異→付帯表4#1）
 */
export class SystemSettingSettingSystemLoginHistoryPage {
  readonly page: Page;
  readonly listUrl: string;

  readonly pageTitle: Locator; // h2.c-pageTitle__title「ログイン履歴」
  readonly subTitle: Locator; // .c-pageTitle__subTitle「システム設定」
  readonly searchForm: Locator; // form#search_form
  readonly keyword: Locator; // #admin_search_login_history_multi
  readonly keywordLabelHelp: Locator; // ヘルプアイコン付きラベル
  readonly detailToggle: Locator; // 詳細検索リンク
  readonly detailBlock: Locator; // #searchDetail
  readonly userName: Locator; // #admin_search_login_history_user_name
  readonly clientIp: Locator; // #admin_search_login_history_client_ip
  readonly dateStart: Locator; // #admin_search_login_history_create_datetime_start
  readonly dateEnd: Locator; // #admin_search_login_history_create_datetime_end
  readonly statusFail: Locator; // #admin_search_login_history_Status_0（失敗0）
  readonly statusSuccess: Locator; // #admin_search_login_history_Status_1（成功1）
  readonly searchButton: Locator; // 検索ボタン
  readonly searchResultCount: Locator; // 検索結果件数
  readonly pageCountPulldown: Locator; // #page_count_pulldown
  readonly table: Locator; // table.table
  readonly tableHead: Locator; // thead
  readonly statusBadges: Locator; // .badge（成功/失敗）
  readonly invalidMessage: Locator; // 検証エラー文言領域
  readonly emptyMessage: Locator; // 0件文言領域

  constructor(page: Page) {
    this.page = page;
    this.listUrl = `/${ECCUBE_ADMIN_ROUTE}/setting/system/login_history`;

    this.pageTitle = page.locator("h2.c-pageTitle__title");
    this.subTitle = page.locator(".c-pageTitle__subTitle");
    this.searchForm = page.locator("#search_form");
    this.keyword = page.locator("#admin_search_login_history_multi");
    this.keywordLabelHelp = page.locator('label[data-bs-toggle="tooltip"]');
    this.detailToggle = page.locator(
      '[data-bs-toggle="collapse"][href="#searchDetail"]'
    );
    this.detailBlock = page.locator("#searchDetail");
    this.userName = page.locator("#admin_search_login_history_user_name");
    this.clientIp = page.locator("#admin_search_login_history_client_ip");
    this.dateStart = page.locator(
      "#admin_search_login_history_create_datetime_start"
    );
    this.dateEnd = page.locator(
      "#admin_search_login_history_create_datetime_end"
    );
    this.statusFail = page.locator("#admin_search_login_history_Status_0");
    this.statusSuccess = page.locator("#admin_search_login_history_Status_1");
    this.searchButton = page.locator('#search_form button[type="submit"]');
    // 件数は検索ボタンと同じ .c-outsideBlock__contents 内の span.fw-bold.ms-2（twig:116）。
    // 詳細検索リンクの span.fw-bold（twig:46、ms-2 無し）を拾わないよう ms-2 で限定。
    this.searchResultCount = page.locator(
      ".c-outsideBlock__contents span.fw-bold.ms-2"
    );
    this.pageCountPulldown = page.locator("#page_count_pulldown");
    this.table = page.locator("table.table");
    this.tableHead = page.locator("table.table thead");
    this.statusBadges = page.locator("table.table tbody .badge");
    this.invalidMessage = page.locator(".c-primaryCol .card-body .text-muted");
    this.emptyMessage = page.locator(".c-primaryCol .card-body .text-muted");
  }

  async goto() {
    await this.page.goto(this.listUrl);
  }

  /** ページ送りGET（page_no をパスに指定）。 */
  async gotoPage(pageNo: number) {
    await this.page.goto(`${this.listUrl}/${pageNo}`);
  }

  /** 前回条件で再表示（resume=1）。 */
  async gotoResume() {
    await this.page.goto(`${this.listUrl}?resume=1`);
  }

  /** 表示件数を指定してページ送りGET（不正 page_count 観測用）。 */
  async gotoPageCount(pageNo: number, pageCount: string | number) {
    await this.page.goto(`${this.listUrl}/${pageNo}?page_count=${pageCount}`);
  }

  /** page_no を生文字列で指定してGET（非数値の到達不可観測用）。Response を返す。 */
  async gotoRawPage(pageNo: string) {
    return this.page.goto(`${this.listUrl}/${pageNo}`);
  }

  /** キーワード検索欄に入力して検索実行（POST）。 */
  async searchKeyword(keyword: string) {
    await this.keyword.fill(keyword);
    await this.searchButton.click();
  }

  /** 詳細検索ブロックを開く。 */
  async openDetail() {
    await this.detailToggle.click();
  }

  /** 詳細検索のログインID欄で検索実行（詳細検索を開いて入力→送信）。 */
  async searchUserName(value: string) {
    await this.openDetail();
    await this.userName.fill(value);
    await this.searchButton.click();
  }

  /** 表示件数プルダウンを末尾の選択肢へ変更（JSで件数付きURLへ遷移）。 */
  async changePageCountToLast(): Promise<string> {
    const options = this.pageCountPulldown.locator("option");
    const value = (await options.last().getAttribute("value")) || "";
    await this.pageCountPulldown.selectOption(value);
    return value;
  }

  /** 指定文言を含む行のロケータ（一覧本文）。 */
  rowContaining(text: string): Locator {
    return this.page.locator("table.table tbody tr", { hasText: text });
  }

  /** 一覧の初期UI部品が仕様どおり表示されていること。 */
  async seeListForm() {
    await expect(this.pageTitle).toContainText("ログイン履歴");
    await expect(this.keyword).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }
}
