import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_FRONT_LOCALE, ECCUBE_FRONT_SHOP } from "../../../config/default.config";

/**
 * フロント 本店トップページ表示（F01-01）Page Object。
 * integration_test/e2e/f01_01_front_top_home_main_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f01-01_front_top_home_main.md（画面・処理フロー・フロント挙動）由来。
 * ec-cube-enterprise/pf-eccube3 の Twig は本リポジトリに未取込のため、セレクタは URL・表示要素の意味で寄せる
 * （file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export class FrontTopHomeMainPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly topUrl: string;
  readonly enTopUrl: string;

  readonly body: Locator;
  readonly header: Locator;
  readonly footer: Locator;
  readonly globalNav: Locator;
  readonly loginModal: Locator;
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
    this.header = page.locator("header, .ec-layoutRole__header, [class*='header']").first();
    this.footer = page.locator("footer, .ec-layoutRole__footer, [class*='footer']").first();
    // グローバルナビ（ヘッダ内の主要導線）。Twig差分に備え役割/クラスの双方で拾う。
    this.globalNav = page.locator("nav, .ec-headerNav, [class*='navi'], [class*='nav']").first();
    // ログイン用モーダル（未ログイン・ログインを問わずページ内に用意）。表示済みとは限らないため存在で確認。
    this.loginModal = page.locator("[class*='modal'], [id*='modal'], [class*='login']").first();
    this.loginLink = page.getByRole("link", { name: /ログイン|Login/i }).first();
    this.entryLink = page.getByRole("link", { name: /会員登録|新規会員|Register/i }).first();
  }

  async gotoTop() {
    await this.page.goto(this.topUrl);
  }

  async gotoEnTop() {
    await this.page.goto(this.enTopUrl);
  }

  /** 本店TOPの共通レイアウト枠（ヘッダ・本文・フッタ）が表示されていること。 */
  async seeTopLayout() {
    await expect(this.body).toBeVisible();
    await expect(this.header).toBeVisible();
    await expect(this.footer).toBeVisible();
  }
}
