import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_FRONT_LOCALE, ECCUBE_FRONT_SHOP } from "../../../config/default.config";

/**
 * フロント 本店スマホ版ナビ（F02-02）Page Object。
 * integration_test/e2e/f02_02_front_global_nav_global_nav_sp_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f02-02_front_global_nav_global_nav_sp.md（業務ルール・画面遷移）由来。
 * スマホ版ナビは本店各画面（`/{_locale}/`）の一部として、画面幅により出し分けて描画される。
 * ec-cube-enterprise/pf-eccube3 の Twig は本リポジトリに未取込のため、表示文言・役割で寄せる
 * （file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export const SP_VIEWPORT = { width: 390, height: 844 };

export class FrontGlobalNavSpPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly topUrl: string;
  readonly enTopUrl: string;

  readonly body: Locator;
  readonly searchKeyword: Locator;
  readonly searchButton: Locator;

  constructor(page: Page, locale?: string) {
    this.page = page;
    const loc = locale ?? ECCUBE_FRONT_LOCALE;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${loc}${shop}`;
    this.topUrl = `${this.localePrefix}/`;
    this.enTopUrl = `/en${shop}/`;

    this.body = page.locator("body");
    this.searchKeyword = page.locator("input[name*='product'], input[type='search']").first();
    this.searchButton = page.getByRole("button", { name: /検索|Search/i }).first();
  }

  navItem(name: string | RegExp): Locator {
    return this.page.getByRole("link", { name }).first();
  }

  async useSpViewport() {
    await this.page.setViewportSize(SP_VIEWPORT);
  }

  async gotoTop() {
    await this.page.goto(this.topUrl);
  }

  async gotoEnTop() {
    await this.page.goto(this.enTopUrl);
  }
}
