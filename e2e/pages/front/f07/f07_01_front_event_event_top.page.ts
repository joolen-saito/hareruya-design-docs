import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_FRONT_LOCALE, ECCUBE_FRONT_SHOP } from "../../../config/default.config";

/**
 * フロント イベント「イベント大会TOP」（F07-01）Page Object。
 * integration_test/e2e/f07_01_front_event_event_top_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f07-01_front_event_event_top.md（利用者視点の入口・処理フロー・
 * フロント挙動・表示メッセージ・画面遷移・バリデーション）由来。オラクル独立性を守る。
 * ec-cube-enterprise/pf-eccube3 の Twig は本リポジトリに未取込のため、セレクタは file:line 根拠が
 * 取れず（要実機確認）、URL・可視テキスト・要素の意味（role/構造）へ寄せる。未実行雛形。
 *
 * 本画面はログイン不要の公開閲覧画面（GET /{_locale}/events）。入力フォームは持たず、
 * 店舗切替セレクトと月・日付・イベントへのリンク押下のみで操作する。
 */
export class FrontEventTopPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly eventsUrl: string;

  // 由来: いずれも要実機確認（Twig未取込）。表示文言・URL・要素の意味で寄せる。
  readonly monthLabel: Locator; // 選択月ラベル「Y年n月」（表示メッセージ節・月表示）
  readonly calendar: Locator; // 月間カレンダー（曜日見出し・日付セル）
  readonly weekdayHeader: Locator; // 曜日見出し
  readonly shopSelect: Locator; // 店舗切替セレクト（フロント挙動: 変更で ?shop= 付き遷移）
  readonly monthNavLinks: Locator; // 前月・翌月タブ（date クエリ付きリンク）
  readonly pastToggle: Locator; // 「過去の大会を開く／閉じる」開閉見出し
  readonly modal: Locator; // モーダル・ポップアップ・トースト（本画面は表示しない）

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.eventsUrl = `${this.localePrefix}/events`;

    this.monthLabel = page.locator("body");
    this.calendar = page.locator('table, .calendar, [class*="calendar"], [class*="Calendar"]').first();
    this.weekdayHeader = page.locator("th, thead, [class*='week'], [class*='dow']").first();
    // 店舗切替セレクト。名称は shop 想定だが要実機確認。ロケール等の他セレクトと区別するため名称優先。
    this.shopSelect = page.locator('select[name*="shop"], select#shop, select[name*="store"], select').first();
    // 前月・翌月タブ。date クエリを含むリンクで寄せる（要実機確認）。
    this.monthNavLinks = page.locator('a[href*="date="]');
    this.pastToggle = page.getByText(/過去の大会/);
    this.modal = page.locator('.modal.show, [role="dialog"]:visible, .toast.show, [class*="popup"]:visible');
  }

  /** イベント大会TOPを開く（クエリ任意）。goto の Response を返し 404 等を判定できるようにする。 */
  async gotoTop(query = "") {
    return await this.page.goto(`${this.eventsUrl}${query}`);
  }

  /** 日別表示パスへアクセスする（GET /{_locale}/events/{eventId}/{eventDate}/）。 */
  async gotoDaily(eventId: string, eventDate: string) {
    return await this.page.goto(`${this.eventsUrl}/${eventId}/${eventDate}/`);
  }

  /** 現在日時から「Y年n月」ラベル文言を組む（当月既定表示の期待値。時刻固定しない）。 */
  static currentMonthLabel(now: Date = new Date()): string {
    return `${now.getFullYear()}年${now.getMonth() + 1}月`;
  }

  /** カレンダーと当月ラベルが表示されていること（初回表示の観測）。期待は処理フロー由来。 */
  async seeMonthlyCalendar(expectedMonthLabel: string) {
    await expect(this.calendar).toBeVisible();
    await expect(this.monthLabel).toContainText(expectedMonthLabel);
  }

  /** 前月・翌月への月切替リンク（date クエリ付き）が存在すること。 */
  async seeMonthNavLinks() {
    await expect(this.monthNavLinks.first()).toBeVisible();
  }

  /** 店舗切替セレクトが表示されていること。 */
  async seeShopSelect() {
    await expect(this.shopSelect).toBeVisible();
  }

  /** 本画面はモーダル・ポップアップ・トーストを表示しないこと。 */
  async seeNoModal() {
    await expect(this.modal).toHaveCount(0);
  }
}
