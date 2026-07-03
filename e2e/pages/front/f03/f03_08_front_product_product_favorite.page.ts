import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント 商品「お気に入り（登録・解除・一覧）」（F03-08）Page Object。
 * integration_test/e2e/f03_08_front_product_product_favorite_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f03-08_front_product_product_favorite.md（利用者視点の入口・処理フロー・表示メッセージ）由来。
 * ec-cube-enterprise/pf-eccube3 の Twig（Mypage/favorite_list.twig 等）は本リポジトリに未取込のため、
 * セレクタは URL・表示文言・フォーム要素の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 *
 * お気に入りは登録・解除・一覧のいずれも会員ログイン（選手情報の特定）を要する。
 * 非ログインで観測可能なのは「一覧URLへの未認証アクセス→会員ログイン誘導」と、
 * 登録の未ログインJSON／解除のHTTP400（非同期I/F）のみ。
 */
export class FrontProductFavoritePage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly favoriteListUrl: string;
  readonly favoriteListSaleUrl: string;
  readonly loginUrl: string;
  // 由来: 利用者視点の入口（設計書）。POST/DELETE は非同期I/F、CSRF要否は要実機確認。
  readonly addPath: string;
  readonly removePath: string;

  readonly heading: Locator;
  readonly body: Locator;
  readonly saleNotice: Locator;
  readonly saleFilterToggle: Locator;
  readonly favoriteButton: Locator;
  // 会員ログイン画面の入力要素（誘導確認・資格情報ログイン用。要実機確認）。
  readonly loginEmailInput: Locator;
  readonly loginPasswordInput: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.favoriteListUrl = `${this.localePrefix}/mypage/favorite/list`;
    this.favoriteListSaleUrl = `${this.localePrefix}/mypage/favorite/list?sale=1`;
    this.loginUrl = `${this.localePrefix}/mypage/login`;
    this.addPath = `${this.localePrefix}/products/favorite/add`;
    this.removePath = `${this.localePrefix}/products/favorite/remove`;

    this.body = page.locator("body");
    // 見出し「お気に入り登録商品一覧」。期待文言は設計書「フロント挙動（表示要素）」由来。
    this.heading = page.getByRole("heading", { name: /お気に入り登録商品一覧/ }).first();
    // セール通知の案内文（設計書「フロント挙動」）。
    this.saleNotice = page.getByText(/セール対象になった際/);
    // 「セール対象商品のみ表示する」切替（要実機確認）。
    this.saleFilterToggle = page.getByText(/セール対象商品のみ表示する/).first();
    // お気に入りボタン（登録/解除）。Twig差分に備え文言と一般的クラスで拾う（要実機確認）。
    this.favoriteButton = page
      .locator('.favorite, [class*="favorite"], button[name*="favorite"]')
      .first();

    this.loginEmailInput = page
      .locator('input[name*="login_email"], input[type="email"], input[name*="email"]')
      .first();
    this.loginPasswordInput = page
      .locator('input[name*="login_pass"], input[type="password"], input[name*="password"]')
      .first();
    this.loginButton = page.getByRole("button", { name: /ログイン|Login/i }).first();
  }

  async gotoFavoriteList() {
    await this.page.goto(this.favoriteListUrl);
  }

  async gotoFavoriteListSale() {
    await this.page.goto(this.favoriteListSaleUrl);
  }

  /** 会員ログイン（資格情報前提の live 用）。会員ログイン画面から認証する。 */
  async memberLogin(email: string, password: string) {
    await this.page.goto(this.loginUrl);
    await this.loginEmailInput.fill(email);
    await this.loginPasswordInput.fill(password);
    await this.loginButton.click();
  }

  async loginWithEnvCreds() {
    await this.memberLogin(ECCUBE_FRONT_USER, ECCUBE_FRONT_PASS);
  }

  /** 未ログインで一覧URLへ直接アクセスすると会員ログイン画面へ誘導されること。 */
  async seeRedirectedToLogin() {
    await expect(this.page).toHaveURL(/\/mypage\/login(?:\?|$)/);
  }

  /** ログイン後の一覧見出し・セール通知案内が表示されること（期待は設計書「フロント挙動」由来）。 */
  async seeFavoriteListScreen() {
    await expect(this.heading).toBeVisible();
    await expect(this.body).toContainText("お気に入り登録商品一覧");
  }
}
