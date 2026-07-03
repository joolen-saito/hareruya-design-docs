import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント 会員 マイページ「予約済み大会一覧」（F06-14）Page Object。
 * integration_test/e2e/f06_14_front_member_mypage_event_reserved_list_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f06-14_front_member_mypage_event_reserved_list.md
 * （利用者視点の入口・フロント挙動・表示メッセージ・画面遷移）由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の Twig（Mypage/event_history.twig）は本リポジトリに未取込のため、
 * セレクタはフロントTwig差分に耐えるよう URL・表示文言・要素の意味で寄せる（file:line 根拠が
 * 取れない箇所は要実機確認）。本機能は参照のみの表示専用画面で、入力フォームを持たない。未実行雛形。
 */
export class FrontMemberEventReservedListPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly loginUrl: string;
  readonly eventsUrl: string;
  readonly deckEntryListUrl: string;
  readonly mypageUrl: string;

  readonly heading: Locator;
  readonly body: Locator;
  readonly emptyMessage: Locator;
  readonly deckButton: Locator;
  readonly mypageButton: Locator;
  readonly eventNameLink: Locator;
  readonly paymentHelp: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    // 利用者視点の入口（設計書）: 一覧・ログイン・デッキ登録一覧・マイページトップ。
    this.loginUrl = `${this.localePrefix}/mypage/login`;
    this.eventsUrl = `${this.localePrefix}/mypage/events`;
    this.deckEntryListUrl = `${this.localePrefix}/mypage/deckentry_list`;
    this.mypageUrl = `${this.localePrefix}/mypage`;

    // 見出し「予約済み大会一覧」。要実機確認: Mypage/event_history.twig の見出し要素。
    this.heading = page.getByRole("heading", { name: /予約済み大会一覧|Scheduled Events/i }).first();
    this.body = page.locator("body");
    // 0件案内。設計書「表示メッセージ」節（日本語/英語）。
    this.emptyMessage = page.getByText(/予約済みの大会はありません|no scheduled events/i).first();
    // 「デッキ登録」ボタン → /{_locale}/mypage/deckentry_list。
    this.deckButton = page.getByRole("link", { name: /デッキ登録|Deck/i }).first();
    // 「マイページ」ボタン → /{_locale}/mypage。
    this.mypageButton = page.getByRole("link", { name: /マイページ|My Page/i }).first();
    // 各申込行のイベント名リンク → /{_locale}/events/{id}（イベント詳細）。
    this.eventNameLink = page.locator('a[href*="/events/"]').first();
    // 決済中の決済案内ヘルプリンク（ツールチップ）。要実機確認。
    this.paymentHelp = page.getByText(/決済が中断されました|payment procedure has been interrupted/i).first();
  }

  async gotoEventsList() {
    await this.page.goto(this.eventsUrl);
  }

  async gotoLoginPage() {
    await this.page.goto(this.loginUrl);
  }

  /** 会員ログイン（資格情報は ECCUBE_FRONT_USER/PASS）。f06_19 の手法に倣う。 */
  async login() {
    await this.gotoLoginPage();
    const email = this.page
      .locator('input[type="email"], input[name*="login_email"], input[name*="email"], input[name*="login_id"]')
      .first();
    const password = this.page.locator('input[type="password"], input[name*="password"]').first();
    await email.fill(ECCUBE_FRONT_USER);
    await password.fill(ECCUBE_FRONT_PASS);
    await this.page.getByRole("button", { name: /ログイン|Login/i }).click();
  }

  /** 一覧画面の静的部品（見出し・遷移ボタン）が表示されていること。申込件数に依存しない。 */
  async seeListScreen() {
    await expect(this.heading).toBeVisible();
    await expect(this.deckButton).toBeVisible();
    await expect(this.mypageButton).toBeVisible();
  }

  /** 未認証で保護URLへアクセスすると会員ログインへ誘導されること。 */
  async seeLoginGuidance() {
    await expect(this.page).toHaveURL(/\/mypage\/login(?:\?|$)/);
    await expect(this.page.locator('input[type="password"], input[name*="password"]').first()).toBeVisible();
  }
}
