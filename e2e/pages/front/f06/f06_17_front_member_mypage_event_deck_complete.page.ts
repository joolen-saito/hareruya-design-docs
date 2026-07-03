import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント マイページ「大会に登録するデッキの確認・登録（デッキ登録完了画面）」（F06-17）Page Object。
 * integration_test/e2e/f06_17_front_member_mypage_event_deck_complete_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f06-17_front_member_mypage_event_deck_complete.md
 * （利用者視点の入口・処理フロー・表示メッセージ・画面遷移・権限認可）由来（オラクル独立）。
 * ec-cube-enterprise/pf-eccube3 の Twig（Mypage/deckentry_check.twig 等）は本リポジトリに未取込のため、
 * セレクタはフロントTwig差分に耐えるよう URL・表示文言・フォーム要素の意味で寄せる
 * （DOM構造・class名の file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export class FrontMemberMypageEventDeckCompletePage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly loginUrl: string;
  readonly mypageUrl: string;

  readonly body: Locator;
  readonly heading: Locator;
  readonly completionGuide: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.loginUrl = `${this.localePrefix}/mypage/login`;
    this.mypageUrl = `${this.localePrefix}/mypage`;

    this.body = page.locator("body");
    // 完了見出し「デッキ登録完了」/ English "Registration Complete"（表示メッセージ節・常時表示）。
    this.heading = page.getByText(/デッキ登録完了|Registration Complete/).first();
    this.completionGuide = page.getByText(/以下の内容でデッキ登録を行いました|has been registered/).first();
  }

  /** デッキ登録完了画面（GET /{_locale}/deckentry/{deckId}/check）。 */
  deckCheckUrl(deckId: string | number) {
    return `${this.localePrefix}/deckentry/${deckId}/check`;
  }

  /** デッキ編集画面（GET /{_locale}/deckentry/{eventDetailId}/edit）。 */
  deckEditUrl(eventDetailId: string | number) {
    return `${this.localePrefix}/deckentry/${eventDetailId}/edit`;
  }

  async gotoDeckCheck(deckId: string | number) {
    await this.page.goto(this.deckCheckUrl(deckId));
  }

  async gotoLoginPage() {
    await this.page.goto(this.loginUrl);
  }

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

  /** 完了画面の見出し・案内文が表示されていること（表示メッセージ節・常時表示）。 */
  async seeCompletionScreen() {
    await expect(this.heading).toBeVisible();
    await expect(this.completionGuide).toBeVisible();
  }

  /** 完了画面を表示せず会員ログイン画面へ誘導されていること（権限・認可：未ログイン）。 */
  async seeLoginRedirect() {
    await expect(this.page).toHaveURL(/\/mypage\/login(?:\?|$)/);
    await expect(this.page.locator('input[type="password"], input[name*="password"]').first()).toBeVisible();
  }
}
