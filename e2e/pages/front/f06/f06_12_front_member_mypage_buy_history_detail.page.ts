import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント 会員 マイページ「買取履歴詳細」（F06-12 / buy_history_detail）Page Object。
 * integration_test/e2e/f06_12_front_member_mypage_buy_history_detail_e2e_cases.md に対応。
 *
 * 期待結果は functions/pf-eccube3/f06-12_front_member_mypage_buy_history_detail.md
 * （利用者視点の入口・フロント挙動・処理フロー・業務ルール・表示メッセージ）由来。
 * 本機能は表示専用（参照のみ）で、承諾（売却可否の確定）は買取査定承諾機能（POST update/{id}）が正。
 * ec-cube-enterprise/pf-eccube3 の Twig は本リポジトリに未取込のため、セレクタは Twig 差分に耐えるよう
 * URL・表示文言・フォーム要素の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export class FrontMemberMypageBuyHistoryDetailPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly loginUrl: string;
  readonly mypageUrl: string;

  readonly heading: Locator;
  readonly body: Locator;
  readonly mypageButton: Locator;
  readonly statusImage: Locator;
  readonly acceptForm: Locator;
  readonly acceptButton: Locator;
  readonly acceptCsrfToken: Locator;
  readonly saleSelects: Locator;
  readonly productLinks: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.loginUrl = `${this.localePrefix}/mypage/login`;
    this.mypageUrl = `${this.localePrefix}/mypage`;

    this.heading = page.getByText("買取履歴詳細", { exact: false }).first();
    this.body = page.locator("body");
    this.mypageButton = page.getByRole("link", { name: /マイページ/ }).first();
    // 処理状態は状態識別子に対応する画像で表示（CSS・レイアウト節）。要実機確認。
    this.statusImage = page.locator('img[src*="status"], img[class*="status"], img[alt*="状態"]').first();
    // 承諾フォームの送信先は POST /{_locale}/mypage/purchase_history/update/{id}（画面遷移節）。
    this.acceptForm = page.locator('form[action*="purchase_history/update"]').first();
    this.acceptButton = page.getByRole("button", { name: /承諾確定|承諾/ }).first();
    this.acceptCsrfToken = this.acceptForm.locator('input[type="hidden"][name*="token"], input[type="hidden"][name*="csrf"]').first();
    // 売却可否のセレクト（売却する=1／売却しない=0）。連絡済み以外は disabled。
    this.saleSelects = page.locator('select[name*="sale"], select[name*="Sale"]');
    this.productLinks = page.locator('a[target="_blank"]');
  }

  detailUrl(id: string | number): string {
    return `${this.localePrefix}/mypage/purchase_history/detail/${id}`;
  }

  async gotoDetail(id: string | number) {
    await this.page.goto(this.detailUrl(id));
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

  /** 未ログイン→会員ログイン画面へ誘導されていること（権限・認可節）。 */
  async seeLoginRedirect() {
    await expect(this.page).toHaveURL(/\/mypage\/login|\/login/);
    await expect(
      this.page.locator('input[type="password"], input[name*="password"]').first(),
    ).toBeVisible();
  }

  /** 詳細画面の主要素（見出し・会員氏名＋様・マイページボタン）が表示されていること。 */
  async seeDetailScreen() {
    await expect(this.heading).toBeVisible();
    await expect(this.body).toContainText("様");
    await expect(this.mypageButton).toBeVisible();
  }
}
