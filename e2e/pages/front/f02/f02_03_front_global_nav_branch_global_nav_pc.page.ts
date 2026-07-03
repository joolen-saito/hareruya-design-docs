import { Locator, Page, Response, expect } from "@playwright/test";
import { ECCUBE_FRONT_LOCALE, ECCUBE_FRONT_SHOP } from "../../../config/default.config";

/**
 * フロント 支店PC版ナビゲーション（F02-03）Page Object。
 * integration_test/e2e/f02_03_front_global_nav_branch_global_nav_pc_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f02-03_front_global_nav_branch_global_nav_pc.md（処理フロー・画面遷移・エラー処理）由来。
 * 支店ナビは店舗紹介ページ（`/{_locale}/shoppage/{name}`）とイベント店舗文脈（`/{_locale}/events?shop={id}`）の一部として描画される。
 * ec-cube-enterprise/pf-eccube3 の Twig は本リポジトリに未取込のため、URL・表示要素の意味で寄せる
 * （file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 * 実在の店舗はシード依存のため、非破壊に走る 404 系のみ live 化する。
 */
export class FrontBranchGlobalNavPcPage {
  readonly page: Page;
  readonly localePrefix: string;

  readonly body: Locator;
  readonly shopHeader: Locator;
  readonly shopList: Locator;
  readonly sectionNav: Locator;

  constructor(page: Page, locale?: string) {
    this.page = page;
    const loc = locale ?? ECCUBE_FRONT_LOCALE;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${loc}${shop}`;

    this.body = page.locator("body");
    this.shopHeader = page.locator("header, [class*='shopHeader'], [class*='header']").first();
    this.shopList = page.locator("[class*='shop'], [class*='store']").first();
    this.sectionNav = page.locator("nav, [class*='nav'], [class*='side']").first();
  }

  shopUrl(name: string) {
    return `${this.localePrefix}/shoppage/${name}`;
  }

  eventsShopUrl(shopId: string) {
    return `${this.localePrefix}/events?shop=${shopId}`;
  }

  async gotoShop(name: string): Promise<Response | null> {
    return this.page.goto(this.shopUrl(name));
  }

  async gotoEventsShop(shopId: string): Promise<Response | null> {
    return this.page.goto(this.eventsShopUrl(shopId));
  }

  async expectShopNotFound(name: string) {
    const res = await this.gotoShop(name);
    expect(res?.status()).toBe(404);
  }

  async expectEventsShopNotFound(shopId: string) {
    const res = await this.gotoEventsShop(shopId);
    expect(res?.status()).toBe(404);
  }
}
