import { Locator, Page, Response, expect } from "@playwright/test";
import { ECCUBE_FRONT_LOCALE, ECCUBE_FRONT_SHOP } from "../../../config/default.config";

/**
 * フロント 支店トップページ表示（F01-02, 店舗紹介ページ）Page Object。
 * integration_test/e2e/f01_02_front_top_home_branch_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f01-02_front_top_home_branch.md（処理フロー・エラー処理）由来。
 * ec-cube-enterprise/pf-eccube3 の Twig は本リポジトリに未取込のため、URL・表示要素の意味で寄せる
 * （file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 * 実在の店舗識別名はシード依存のため、非破壊に走る 404 系のみ live 化する。
 */
export class FrontTopHomeBranchPage {
  readonly page: Page;
  readonly localePrefix: string;

  readonly body: Locator;
  readonly shopList: Locator;
  readonly sectionNav: Locator;

  constructor(page: Page, locale?: string) {
    this.page = page;
    const loc = locale ?? ECCUBE_FRONT_LOCALE;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${loc}${shop}`;

    this.body = page.locator("body");
    this.shopList = page.locator("[class*='shop'], [class*='store']").first();
    this.sectionNav = page.locator("nav, [class*='nav'], [class*='side']").first();
  }

  shopUrl(name: string) {
    return `${this.localePrefix}/shoppage/${name}`;
  }

  async gotoShop(name: string): Promise<Response | null> {
    return this.page.goto(this.shopUrl(name));
  }

  /** 店舗未存在・当該言語のページ要素なしのとき見つからない（HTTP404）で扱われること。 */
  async expectNotFound(name: string) {
    const res = await this.gotoShop(name);
    expect(res?.status()).toBe(404);
  }
}
