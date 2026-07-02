import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_ADMIN_ROUTE } from "../../../config/default.config";

/**
 * 管理画面 店舗設定 > 定休日カレンダー設定（M10-12）Page Object（独立クラス形）。
 * 納品ケース表 integration_test/e2e/m10_12_admin_base_setting_setting_shop_calendar_e2e_cases.md に対応。
 * 期待結果は仕様（正本 functions/ec-cube-enterprise/m10-12_admin_base_setting_setting_shop_calendar.md / 観点表 /
 * messages.ja.yaml・validators.ja.yaml）由来（オラクル独立性）。実装の現挙動・Form制約値は期待値に流用しない。
 * セレクタは Twig＋Symfony Form の getBlockPrefix=`calendar`（CalendarType.php:136-139）由来の位置情報のみ。
 * 本リポジトリでは Playwright を実行しない（構造参考のもとの未実行雛形）。
 *
 * ルート（CalendarController.php）:
 *  - admin_setting_shop_calendar      = GET|POST /%eccube_admin_route%/setting/shop/calendar（:46 初期表示・インライン更新）
 *  - admin_setting_shop_calendar_new  = GET|POST /%eccube_admin_route%/setting/shop/calendar/new（:47 新規作成 action）
 *  - admin_setting_shop_calendar_delete = DELETE /%eccube_admin_route%/setting/shop/calendar/{id}/delete（:132）
 *  成功（新規/インライン）後は admin_homepage へリダイレクト（:74,:107）。
 *
 * DOM id 根拠（getBlockPrefix=calendar。新規行・各既存行とも同一 CalendarType を使うため id が重複する＝付帯表4 不具合候補#1）:
 *  - title  → #calendar_title （calendar.twig:88 新規 form.title / :114 既存 forms[id].title）
 *  - holiday(DateType single_text) → #calendar_holiday （calendar.twig:93 新規 / :122 既存）
 *  - _token → #calendar__token （calendar.twig:84 新規 / :108 既存）
 *  重複回避のため、新規欄は新規行 #calendar_item_new（calendar.twig:82）配下、
 *  既存欄は #ex-calendar-{id}（calendar.twig:106）配下にスコープして取得する。
 *  - 新規送信ボタン type=submit（位置: 新規行 #calendar_item_new 配下 button[type=submit]）。
 *    期待文言オラクルは設計書（表示要素 :82「新規登録」ラベルの送信ボタン）由来。
 *    実装 Twig は admin.common.create__new=「新規作成」を描画（calendar.twig:99 / messages.ja.yaml:1454）＝設計書と不一致（付帯表4 不具合候補#7）。セレクタは位置情報のみで文言に依存しない。
 *  - 既存「決定」ボタン type=submit trans admin.common.decision=「決定」（calendar.twig:131 / messages.ja.yaml:1452）
 *  - 既存「キャンセル」ボタン .cancel trans admin.common.cancel=「キャンセル」（calendar.twig:132 / messages.ja.yaml:1445）
 *  - 鉛筆（編集トグル）a.edit-button data-id（calendar.twig:139 / JS calendar.twig:39-44）
 *  - 削除アイコン a[data-bs-target="#DeleteModal_{id}"]（calendar.twig:147）
 *  - 削除モーダル #DeleteModal_{id}（calendar.twig:152）。モーダル内削除リンク a.btn-ec-delete[data-method="delete"] + csrf_token_for_anchor（calendar.twig:169-170）
 *  - カード見出し（ツールチップ付）.card-header span trans admin.setting.shop.calendar_setting=「定休日カレンダー設定」
 *        （calendar.twig:59-60 / messages.ja.yaml:2786, tooltip :3481）
 *  - 一覧列見出し thead th: ID / タイトル / 日付（calendar.twig:74-76 / messages.ja.yaml:1612,2990,2991）
 *  - フィールドエラー .invalid-feedback（bootstrap_4_horizontal_layout.html.twig:53-63 非rootform時）
 *  - 成功フラッシュ .alert-success（@admin/alert.twig:22 app.flashes('eccube.admin.success')。addSuccess save_complete=「保存しました」/ delete_complete=「削除しました」）
 *
 * 表示文言（仕様正典・オラクル）:
 *  - 同日重複: 「同日の定休日が既に存在しているため、設定できません。」（messages.ja.yaml:2992 calendar.holiday.available_error / CalendarType.php:115）
 *  - 日付下限外: 「不正な日付です。」（validators.ja.yaml:60 form_error.out_of_range / CalendarType.php:68,89）
 *  - 保存成功: 「保存しました」（messages.ja.yaml:1398 admin.common.save_complete）
 *  - 削除成功: 「削除しました」（messages.ja.yaml:1400 admin.common.delete_complete）
 */
export class AdminBaseSettingSettingShopCalendarPage {
  readonly page: Page;
  readonly url: string;

  // 共通表示要素
  readonly cardHeader: Locator; // カード見出し（ツールチップ付「定休日カレンダー設定」）
  readonly tableHeaders: Locator; // 一覧 thead th（ID/タイトル/日付）
  readonly rows: Locator; // 既存定休日行 tr.calendar_list_item

  // 新規行（#calendar_item_new 配下にスコープ）
  readonly newRow: Locator;
  readonly newTitle: Locator; // 新規 タイトル入力
  readonly newHoliday: Locator; // 新規 日付入力（single_text）
  readonly newSubmit: Locator; // 「新規作成」ボタン
  readonly newError: Locator; // 新規行のフィールドエラー .invalid-feedback
  readonly newToken: Locator; // 新規行 CSRF 隠しフィールド #calendar__token（form._token）

  // フラッシュ（遷移先＝管理者ホーム）
  readonly successAlert: Locator; // .alert-success

  constructor(page: Page) {
    this.page = page;
    this.url = `/${ECCUBE_ADMIN_ROUTE}/setting/shop/calendar`;

    this.cardHeader = page.locator(".card-header");
    this.tableHeaders = page.locator("table thead th");
    this.rows = page.locator("tr.calendar_list_item");

    this.newRow = page.locator("#calendar_item_new");
    this.newTitle = page.locator("#calendar_item_new #calendar_title");
    this.newHoliday = page.locator("#calendar_item_new #calendar_holiday");
    this.newSubmit = page.locator('#calendar_item_new button[type="submit"]');
    this.newError = page.locator("#calendar_item_new .invalid-feedback");
    this.newToken = page.locator("#calendar_item_new #calendar__token");

    this.successAlert = page.locator(".alert-success");
  }

  async goto() {
    await this.page.goto(this.url);
  }

  /** 既存定休日行の件数。 */
  async rowCount(): Promise<number> {
    return await this.rows.count();
  }

  /** 新規行へタイトル・日付を入力して「新規作成」送信。 */
  async submitNew(title: string, holiday: string) {
    await this.newTitle.fill(title);
    await this.newHoliday.fill(holiday);
    await this.newSubmit.click();
  }

  /** 指定インデックスの既存行ロケータ。 */
  rowAt(index: number): Locator {
    return this.rows.nth(index);
  }

  /** 既存行（インデックス指定）の日付入力欄に保存済み値（YYYY-MM-DD）を読む。 */
  async readRowHoliday(index: number): Promise<string> {
    return (await this.rowAt(index).locator("#calendar_holiday").inputValue()).trim();
  }

  /** 既存行（インデックス指定）の鉛筆を押して編集ブロックを開く。 */
  async clickPencil(index: number) {
    await this.rowAt(index).locator("a.edit-button").click();
  }

  /** 既存行（インデックス指定）の「キャンセル」を押す。 */
  async clickCancel(index: number) {
    await this.rowAt(index).locator(".cancel").click();
  }

  /** 既存行（インデックス指定）でタイトル・日付を上書きして「決定」送信（インライン更新）。 */
  async submitInlineEdit(index: number, title: string | null, holiday: string | null) {
    const row = this.rowAt(index);
    if (title !== null) await row.locator("#calendar_title").fill(title);
    if (holiday !== null) await row.locator("#calendar_holiday").fill(holiday);
    await row.locator('.edit button[type="submit"]').click(); // 「決定」
  }

  /** 既存行（インデックス指定）の編集ブロック（.edit）/閲覧ブロック（.list）。 */
  editBlock(index: number): Locator {
    return this.rowAt(index).locator(".edit").first();
  }
  listBlock(index: number): Locator {
    return this.rowAt(index).locator(".list").first();
  }

  /** 既存行（インデックス指定）の CSRF 隠しフィールド #calendar__token（forms[id]._token）。 */
  rowToken(index: number): Locator {
    return this.rowAt(index).locator("#calendar__token");
  }

  /** 既存行（インデックス指定）の閲覧ブロックのタイトル span（プレーンテキスト表示）。 */
  rowTitleText(index: number): Locator {
    return this.rowAt(index).locator(".list span").first();
  }

  /** 既存行（インデックス指定）のフィールドエラー .invalid-feedback。 */
  rowError(index: number): Locator {
    return this.rowAt(index).locator(".invalid-feedback");
  }

  /** 既存行（インデックス指定）の削除確認モーダルを開く。 */
  async openDeleteModal(index: number) {
    await this.rowAt(index).locator('a[data-bs-target^="#DeleteModal_"]').click();
  }

  /** 開いている削除モーダル内の削除実行リンク。 */
  deleteConfirmLink(index: number): Locator {
    return this.rowAt(index).locator('a.btn-ec-delete[data-method="delete"]');
  }

  /** カード見出し（ツールチップ付）・一覧列見出し・新規行が仕様どおり表示されること。 */
  async seeScreen() {
    await expect(this.cardHeader).toContainText("定休日カレンダー設定");
    await expect(this.newTitle).toBeVisible();
    await expect(this.newHoliday).toBeVisible();
    await expect(this.newSubmit).toBeVisible();
  }
}
