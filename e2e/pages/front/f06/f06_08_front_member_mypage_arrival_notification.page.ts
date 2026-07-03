import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント マイページ「入荷待ち商品一覧」（F06-08）Page Object。
 * integration_test/e2e/f06_08_front_member_mypage_arrival_notification_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f06-08_front_member_mypage_arrival_notification.md
 * （利用者視点の入口・フロント挙動・処理フロー・業務ルール）由来。
 * 本機能は参照系（利用者入力フォームなし）の会員ログイン必須画面。
 * pf-eccube3 の Twig（`Mypage/notify_request_list.twig`）は本リポジトリに未取込のため、
 * セレクタは URL・表示文言・リンクの意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export class FrontMemberMypageArrivalNotificationPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly loginUrl: string;
  readonly mypageUrl: string;
  readonly notifyListUrl: string;

  readonly heading: Locator;
  readonly body: Locator;
  readonly productDetailLinks: Locator;
  readonly cardSearchLinks: Locator;
  readonly backLink: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.loginUrl = `${this.localePrefix}/mypage/login`;
    this.mypageUrl = `${this.localePrefix}/mypage`;
    this.notifyListUrl = `${this.localePrefix}/mypage/notifylist`;

    // 見出し「入荷待ち商品一覧」。Twig差分に備え heading ロールと文言で拾う。
    this.heading = page.getByRole("heading", { name: /入荷待ち商品一覧/ }).first();
    this.body = page.locator("body");
    // 一覧の商品詳細リンク（/{_locale}/products/detail/{id}）。由来: notify_request_list.twig(要実機確認)
    this.productDetailLinks = page.locator('a[href*="/products/detail/"]');
    // 一覧のカード検索リンク（/{_locale}/products/search）。由来: notify_request_list.twig(要実機確認)
    this.cardSearchLinks = page.locator('a[href*="/products/search"]');
    // 「戻る」リンク→マイページトップ。由来: notify_request_list.twig(要実機確認)
    this.backLink = page.locator('a[href$="/mypage"], a[href*="/mypage"]').filter({ hasText: /戻る|マイページ/ }).first();
  }

  async gotoNotifyList() {
    await this.page.goto(this.notifyListUrl);
  }

  async gotoLoginPage() {
    await this.page.goto(this.loginUrl);
  }

  /** 会員ログイン（資格情報は環境変数）。ログイン画面の入力要素は意味で寄せる（要実機確認）。 */
  async login() {
    await this.gotoLoginPage();
    const email = this.page
      .locator('input[type="email"], input[name*="login_email"], input[name*="email"], input[name*="login_id"]')
      .first();
    const password = this.page.locator('input[type="password"], input[name*="password"]').first();
    await email.fill(ECCUBE_FRONT_USER);
    await password.fill(ECCUBE_FRONT_PASS);
    await this.page.getByRole("button", { name: /ログイン|Login/i }).first().click();
  }

  /** 未認証で保護URLへアクセスしたとき会員ログイン画面へ誘導されること。期待は権限・認可節由来。 */
  async seeRedirectedToLogin() {
    await expect(this.page).toHaveURL(/\/mypage\/login(?:\?|$)/);
    await expect(
      this.page.locator('input[type="password"], input[name*="password"]').first()
    ).toBeVisible();
  }

  /** ログイン後の一覧見出し。期待はフロント挙動（表示要素）節由来。 */
  async seeHeading() {
    await expect(this.heading).toBeVisible();
  }

  /** 入荷時に登録メールアドレスへ通知する旨の案内。期待は業務ルール（通知案内）由来。 */
  async seeArrivalNotificationGuide() {
    await expect(this.body).toContainText(/通知/);
  }

  /** 入荷通知登録の上限が拡張された旨の案内。期待は業務ルール（登録上限）由来。 */
  async seeRegistrationLimitGuide() {
    await expect(this.body).toContainText(/上限/);
  }

  /** 一覧画面が表示されマイページへ戻る導線を持つ。期待は入出力（成功時出力）＋画面遷移由来。 */
  async seeListScreen() {
    await expect(this.page).toHaveURL(/\/mypage\/notifylist(?:\?|$)/);
    await expect(this.heading).toBeVisible();
  }

  /** 専用モーダルを初期表示しないこと。期待はフロント挙動（モーダル無し）由来。 */
  async seeNoDedicatedModal() {
    await expect(this.page.locator(".modal.show")).toHaveCount(0);
  }
}
