import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_FRONT_LOCALE, ECCUBE_FRONT_SHOP } from "../../../config/default.config";

/**
 * フロント 本店PC版グローバルナビ（F02-01）Page Object。
 * integration_test/e2e/f02_01_front_global_nav_global_nav_pc_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f02-01_front_global_nav_global_nav_pc.md（業務ルール・画面遷移・フロント挙動）由来。
 * ナビ・ECヘッダは本店各画面（`/{_locale}/`）の一部として描画される。
 * ec-cube-enterprise/pf-eccube3 の Twig は本リポジトリに未取込のため、表示文言・役割・URL で寄せる
 * （file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export class FrontGlobalNavPcPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly topUrl: string;
  readonly enTopUrl: string;

  readonly body: Locator;
  readonly logo: Locator;
  readonly searchForm: Locator;
  readonly searchKeyword: Locator;
  readonly searchButton: Locator;
  readonly cart: Locator;
  readonly langSwitch: Locator;
  readonly mypageMenu: Locator;
  readonly loginLink: Locator;
  readonly entryLink: Locator;

  constructor(page: Page, locale?: string) {
    this.page = page;
    const loc = locale ?? ECCUBE_FRONT_LOCALE;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${loc}${shop}`;
    this.topUrl = `${this.localePrefix}/`;
    this.enTopUrl = `/en${shop}/`;

    this.body = page.locator("body");
    this.logo = page.locator("a[href$='/'] img, .ec-headerTitle, [class*='logo']").first();
    this.searchForm = page.locator("form[role='search'], form[action*='search'], form:has(input[name*='product'])").first();
    this.searchKeyword = page.locator("input[name*='product'], input[type='search']").first();
    this.searchButton = page.getByRole("button", { name: /検索|Search/i }).first();
    this.cart = page.getByRole("link", { name: /カート|Cart/i }).first();
    this.langSwitch = page.getByRole("link", { name: /English|日本語|EN|JA/i }).first();
    this.mypageMenu = page.getByRole("link", { name: /マイページ|MyPage/i }).first();
    this.loginLink = page.getByRole("link", { name: /ログイン|Login/i }).first();
    this.entryLink = page.getByRole("link", { name: /会員登録|新規会員|Register/i }).first();
  }

  navItem(name: string | RegExp): Locator {
    return this.page.getByRole("link", { name }).first();
  }

  async gotoTop() {
    await this.page.goto(this.topUrl);
  }

  async gotoEnTop() {
    await this.page.goto(this.enTopUrl);
  }

  /** ECヘッダの主要導線（ロゴ・商品検索・カート）が表示されていること。 */
  async seeEcHeader() {
    await expect(this.body).toBeVisible();
    await expect(this.searchKeyword).toBeVisible();
    await expect(this.cart).toBeVisible();
  }
}
