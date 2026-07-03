import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント 会員「ポイント履歴」（F06-10）Page Object。未実行雛形。
 * integration_test/e2e/f06_10_front_member_mypage_point_history_e2e_cases.md に対応。
 *
 * 期待結果（オラクル）は設計md functions/pf-eccube3/f06-10_front_member_mypage_point_history.md
 * （利用者視点の入口・フロント挙動・処理フロー・集計条件・表示メッセージ・エッジケース・画面遷移・権限認可）由来。
 * 実装挙動・POM文言はオラクル化しない。
 *
 * ec-cube-enterprise/pf-eccube3 の Twig（Mypage/point_history.twig）は本リポジトリに未取込のため、
 * セレクタは file:line 根拠が取れず「要実機確認」。フロントTwig差分に耐えるよう
 * URL・表示文言・要素の意味で寄せる（本店/支店・ロケールは config/default.config.ts）。
 */
export class FrontMemberPointHistoryPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly loginUrl: string;
  readonly mypageUrl: string;
  readonly historyUrl: string;

  readonly heading: Locator;
  readonly body: Locator;
  readonly memberName: Locator;
  readonly currentPoints: Locator;
  readonly expirePoints: Locator;
  readonly countArea: Locator;
  readonly pageSizeSelect: Locator;
  readonly historyList: Locator;
  readonly orderNumberLink: Locator;
  readonly mypageButton: Locator;
  readonly loginPasswordInput: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.loginUrl = `${this.localePrefix}/mypage/login`;
    this.mypageUrl = `${this.localePrefix}/mypage`;
    this.historyUrl = `${this.localePrefix}/mypage/point_history`;

    // 見出し「ポイント履歴一覧」。要実機確認: Mypage/point_history.twig の見出し文言。
    this.heading = page.getByRole("heading", { name: /ポイント履歴/ }).first();
    this.body = page.locator("body");
    // 会員氏名＋「様」。要実機確認: 氏名の表示位置。
    this.memberName = page.getByText(/様/).first();
    // 現在のポイント（常時表示）。ja「現在のポイント：」/ en「Current Points」。要実機確認。
    this.currentPoints = page.getByText(/現在のポイント|Current Points/).first();
    // 次に消失するポイント（失効見込みがある場合のみ）。ja「次に消失するポイント」/ en「Next Points to be Expired」。要実機確認。
    this.expirePoints = page
      .getByText(/次に消失するポイント|Next Points to be Expired/)
      .first();
    // 件数表示（常時）。ja「（総件数）件あります」/ en「Items」。要実機確認。
    this.countArea = page.getByText(/件あります|Items/).first();
    // 表示件数セレクト（10/20/50/100）。要実機確認: name（pageSize 反映用の隠し項目と連動）。
    this.pageSizeSelect = page
      .locator('select[name*="pageSize"], select[name*="disp_number"], select[id*="pageSize"]')
      .first();
    // 履歴一覧コンテナ（利用or獲得日・注文番号・ポイント・有効期限・備考）。要実機確認。
    this.historyList = page
      .locator("table, ul, .ec-historyRole, [class*='history']")
      .first();
    // 注文番号リンク（注文に紐づく履歴のみ・別タブで注文詳細）。要実機確認: 別タブ target と詳細URL。
    this.orderNumberLink = page
      .locator('a[href*="/mypage/shopping_history/detail/"], a[target="_blank"][href*="shopping_history"]')
      .first();
    // 「マイページ」ボタン（マイページトップへ戻る）。要実機確認: ボタン/リンク文言。
    this.mypageButton = page
      .getByRole("link", { name: /マイページ|My ?Page/i })
      .first();
    this.loginPasswordInput = page
      .locator('input[type="password"], input[name*="password"], input[name*="login_pass"]')
      .first();
  }

  async gotoPointHistory() {
    await this.page.goto(this.historyUrl);
  }

  async gotoPointHistoryPage(pageNo: number) {
    await this.page.goto(`${this.historyUrl}?page=${pageNo}`);
  }

  async gotoPointHistorySize(pageSize: number) {
    await this.page.goto(`${this.historyUrl}?pageSize=${pageSize}`);
  }

  async gotoLoginPage() {
    await this.page.goto(this.loginUrl);
  }

  async login() {
    await this.gotoLoginPage();
    const email = this.page
      .locator('input[type="email"], input[name*="login_email"], input[name*="email"]')
      .first();
    await email.fill(ECCUBE_FRONT_USER);
    await this.loginPasswordInput.fill(ECCUBE_FRONT_PASS);
    await this.page.getByRole("button", { name: /ログイン|Login/i }).first().click();
  }

  /** 未ログインで保護URLへアクセスすると会員ログイン画面へ誘導されること（エラー処理・権限認可）。 */
  async seeLoginRedirect() {
    await expect(this.page).toHaveURL(/\/mypage\/login(?:\?|$)/);
    await expect(this.loginPasswordInput).toBeVisible();
  }

  /** ログイン後、ポイント履歴一覧画面が表示されること（成功時出力）。 */
  async seePointHistoryScreen() {
    await expect(this.page).toHaveURL(/\/mypage\/point_history(?:\?|$)/);
    await expect(this.heading).toBeVisible();
  }
}
