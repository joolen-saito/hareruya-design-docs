import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント 会員「マイページ（トップ）」（F06-05）Page Object。
 * integration_test/e2e/f06_05_front_member_mypage_index_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f06-05_front_member_mypage_index.md（利用者視点の入口・処理フロー・
 * フロント挙動・権限認可）由来。pf-eccube3 の Twig（Mypage/index.twig）は本リポジトリに未取込のため、
 * セレクタはフロントTwig差分に耐えるよう URL・表示文言・要素の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export class FrontMemberMypageIndexPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly loginUrl: string;
  readonly mypageUrl: string;
  /** ヘッダー用保有ポイントを返す別エンドポイント（GET /{_locale}/mypage/point_in_header）。 */
  readonly pointInHeaderUrl: string;
  /** 保護された会員機能URLの一例（未ログイン誘導の確認用）。 */
  readonly protectedUrl: string;

  readonly body: Locator;
  readonly heading: Locator;
  readonly loginPasswordInput: Locator;
  /** 現在の保有ポイント表示（要実機確認：Mypage/index.twig のポイント表示欄）。 */
  readonly currentPoint: Locator;
  /** 各機能ブロックのリンク（購入履歴・入荷待ち商品一覧・お気に入り・ポイント履歴等）。 */
  readonly functionBlocks: Locator;
  /** 購入履歴ブロックのリンク（遷移確認の代表）。 */
  readonly shoppingHistoryLink: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.loginUrl = `${this.localePrefix}/mypage/login`;
    this.mypageUrl = `${this.localePrefix}/mypage`;
    this.pointInHeaderUrl = `${this.localePrefix}/mypage/point_in_header`;
    // 別の保護された会員機能URL（マイページトップ以外）。未ログイン誘導の確認に用いる。
    this.protectedUrl = `${this.localePrefix}/mypage/point_history`;

    this.body = page.locator("body");
    // 見出し「マイページ」。Twig差分に備え heading ロールと本文文言の双方で拾う（要実機確認）。
    this.heading = page.getByRole("heading", { name: /マイページ/ }).first();
    this.loginPasswordInput = page
      .locator('input[type="password"], input[name*="login_pass"], input[name*="password"]')
      .first();
    // 保有ポイント表示欄（要実機確認）。文言「ポイント」を含む領域で寄せる。
    this.currentPoint = page.getByText(/ポイント/).first();
    // 各機能ブロック＝/mypage 配下の会員機能への内部リンク（要実機確認）。
    this.functionBlocks = page.locator('a[href*="/mypage/"]');
    this.shoppingHistoryLink = page
      .locator('a[href*="/mypage/shopping_history"], a[href*="/mypage/history"]')
      .first();
  }

  async gotoMypage() {
    await this.page.goto(this.mypageUrl);
  }

  async gotoProtectedUrl() {
    await this.page.goto(this.protectedUrl);
  }

  async gotoLoginPage() {
    await this.page.goto(this.loginUrl);
  }

  /** 会員ログイン（資格情報は環境変数。会員ログイン機能を正とする）。 */
  async login() {
    await this.gotoLoginPage();
    const email = this.page
      .locator('input[type="email"], input[name*="login_email"], input[name*="email"]')
      .first();
    await email.fill(ECCUBE_FRONT_USER);
    await this.loginPasswordInput.fill(ECCUBE_FRONT_PASS);
    await this.page.getByRole("button", { name: /ログイン|Login/i }).first().click();
  }

  /** 未ログインでマイページ配下へアクセスした際、会員ログイン画面へ誘導されていること。 */
  async seeLoginRedirect() {
    await expect(this.page).toHaveURL(/\/mypage\/login(?:\?|$)/);
    await expect(this.loginPasswordInput).toBeVisible();
  }

  /** ログイン後のマイページトップ：見出しと各機能ブロックを表示していること（仕様：フロント挙動 表示要素）。 */
  async seeMypageScreen() {
    await expect(this.body).toContainText("マイページ");
    await expect(this.functionBlocks.first()).toBeVisible();
  }
}
