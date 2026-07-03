import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント 会員「購入履歴詳細」（F06-07）Page Object。
 * integration_test/e2e/f06_07_front_member_mypage_order_history_detail_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f06-07_front_member_mypage_order_history_detail.md
 * （利用者視点の入口・処理フロー・判定順序・表示メッセージ・権限認可）由来。
 * ec-cube-enterprise/pf-eccube3 の Twig は本リポジトリに未取込のため、セレクタは
 * フロントTwig差分に耐えるよう URL・表示文言・要素の意味で寄せる（file:line 根拠が
 * 取れない箇所は要実機確認）。会員ログイン必須の参照画面。未実行雛形。
 */
export class FrontMemberMypageOrderHistoryDetailPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly loginUrl: string;
  readonly historyListUrl: string;

  readonly body: Locator;
  readonly heading: Locator;
  readonly pointNote: Locator;
  readonly receiptLink: Locator;
  readonly repurchaseButton: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    // 由来: 利用者視点の入口（GET /{_locale}/mypage/shopping_history/detail/{id}）
    this.loginUrl = `${this.localePrefix}/mypage/login`;
    this.historyListUrl = `${this.localePrefix}/mypage`;

    this.body = page.locator("body");
    // 由来: 表示メッセージ節（見出し「購入履歴詳細」）。文言は要実機確認。
    this.heading = page.getByText("購入履歴詳細", { exact: false }).first();
    // 由来: 表示メッセージ節（ポイント注記「※獲得ポイントは商品出荷時に有効になります。」）
    this.pointNote = page.getByText("獲得ポイントは商品出荷時に有効", { exact: false }).first();
    // 由来: 利用者視点の入口（領収書発行 printOrderReceipt）。文言/リンクは要実機確認。
    this.receiptLink = page
      .locator('a[href*="printOrderReceipt"], a:has-text("領収書")')
      .first();
    // 由来: フロント挙動（再購入操作「この注文商品をもう一度購入する」）
    this.repurchaseButton = page
      .locator('a:has-text("もう一度購入"), button:has-text("もう一度購入")')
      .first();
  }

  /** 注文IDから購入履歴詳細URLを組み立てる（パス受け取り）。 */
  detailUrl(orderId: string | number): string {
    return `${this.localePrefix}/mypage/shopping_history/detail/${orderId}`;
  }

  async gotoLoginPage() {
    await this.page.goto(this.loginUrl);
  }

  /** 注文IDを指定して購入履歴詳細URLへ直接アクセスする。 */
  async gotoDetail(orderId: string | number) {
    await this.page.goto(this.detailUrl(orderId));
  }

  async gotoHistoryList() {
    await this.page.goto(this.historyListUrl);
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

  /**
   * 購入履歴一覧の注文番号リンクから最初の詳細へ遷移する（一覧→詳細の入口）。
   * 注文が無い環境では詳細リンクが存在しないため false を返す（呼び出し側で skip する）。
   */
  async openFirstOrderDetail(): Promise<boolean> {
    await this.gotoHistoryList();
    const detailLink = this.page.locator('a[href*="shopping_history/detail/"]').first();
    if ((await detailLink.count()) === 0) {
      return false;
    }
    await detailLink.click();
    return true;
  }

  /** 未ログインで保護URLへアクセスした際に会員ログインへ誘導されること。期待は権限・認可節由来。 */
  async seeLoginRedirect() {
    await expect(this.page).toHaveURL(/\/mypage\/login(?:\?|$)/);
    await expect(this.page.locator('input[type="password"], input[name*="password"]').first()).toBeVisible();
  }

  /** 購入履歴詳細画面（見出し）が表示されていること。期待は表示メッセージ節由来。 */
  async seeDetailScreen() {
    await expect(this.heading).toBeVisible();
  }
}
