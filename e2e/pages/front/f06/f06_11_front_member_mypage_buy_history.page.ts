import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント 会員「マイページ 買取履歴一覧」（F06-11）Page Object。
 * integration_test/e2e/f06_11_front_member_mypage_buy_history_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f06-11_front_member_mypage_buy_history.md
 * （利用者視点の入口・フロント挙動・表示メッセージ・画面遷移・権限認可）由来。
 * 本機能は参照専用（購入履歴一覧の表示のみ）で、入力フォーム・バリデーション・DB更新を持たない。
 * ec-cube-enterprise/pf-eccube3 の Twig は本リポジトリに未取込のため、セレクタはフロントTwig差分に耐えるよう
 * URL・表示文言・フォーム要素の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export class FrontMemberBuyHistoryPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly loginUrl: string;
  readonly mypageUrl: string;
  readonly listUrl: string;

  readonly heading: Locator;
  readonly body: Locator;
  readonly passwordInput: Locator;
  readonly pageSizeSelect: Locator;
  readonly countRange: Locator;
  readonly mypageButton: Locator;
  readonly orderIdLinks: Locator;
  readonly statusImages: Locator;
  readonly pagination: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.loginUrl = `${this.localePrefix}/mypage/login`;
    this.mypageUrl = `${this.localePrefix}/mypage`;
    this.listUrl = `${this.localePrefix}/mypage/purchase_history`;

    // 見出し「買取履歴一覧」。要実機確認（pf-eccube3 Mypage/purchase_history.twig）。
    this.heading = page.getByText("買取履歴一覧", { exact: false }).first();
    this.body = page.locator("body");
    this.passwordInput = page
      .locator('input[type="password"], input[name*="password"]')
      .first();
    // 表示件数セレクト。name はフロント実装依存のため意味で寄せる（要実機確認）。
    this.pageSizeSelect = page
      .locator('select[name*="pageSize"], select[name*="page_size"], select[name*="disp_number"]')
      .first();
    // 件数範囲・総件数の表示（例:「1~10件 / 25件あります」）。要実機確認。
    this.countRange = page.getByText(/件あります/).first();
    this.mypageButton = page.getByRole("link", { name: /マイページ/ }).first();
    // オーダーID・処理状態画像から詳細（/mypage/purchase_history/detail/{id}）への遷移リンク。
    this.orderIdLinks = page.locator('a[href*="/mypage/purchase_history/detail/"]');
    this.statusImages = page.locator('img[src*="status"], img[alt*="状態"], img[src*="buy_order_status"]');
    this.pagination = page.locator('.pagination, ul[class*="pageination"], nav[aria-label*="page"]').first();
  }

  async gotoList(query = "") {
    await this.page.goto(`${this.listUrl}${query}`);
  }

  async gotoLoginPage() {
    await this.page.goto(this.loginUrl);
  }

  async gotoMypage() {
    await this.page.goto(this.mypageUrl);
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

  /** 未ログインで保護URLへアクセスすると会員ログイン画面へ誘導されること（権限・認可／エラー処理）。 */
  async expectRedirectedToLogin() {
    await expect(this.page).toHaveURL(/\/mypage\/login(?:\?|$)/);
    await expect(this.passwordInput).toBeVisible();
  }

  /** 買取履歴一覧画面の主要表示要素（設計書「フロント挙動：表示要素」節）。 */
  async seeListScreen() {
    await expect(this.page).toHaveURL(/\/mypage\/purchase_history(?:\?|$)/);
    await expect(this.heading).toBeVisible();
    await expect(this.mypageButton).toBeVisible();
  }
}
