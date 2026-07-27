import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント カート「ご注文方法指定（注文情報の入力・確認・注文）」（F04-02）Page Object。
 * integration_test/e2e/f04_02_front_cart_shopping_order_method_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f04-02_front_cart_shopping_order_method.md
 * （利用者視点の入口・処理フロー・注文確定判定順序・表示メッセージ・画面遷移）由来。
 * ec-cube-enterprise/pf-eccube3 の Twig は本リポジトリに未取込のため、セレクタはフロントTwig差分に耐えるよう
 * URL・表示文言・フォーム要素の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 *
 * 本画面は会員ログイン＋ロック済みカート（商品投入）が前提の破壊的フローが中心。
 * 非破壊に走るのはカート未投入/未ロックでの購入手続きURL直接アクセス誘導のみ。
 */
export class FrontShoppingOrderMethodPage {
  readonly page: Page;
  readonly localePrefix: string;

  readonly shoppingUrl: string;
  readonly shoppingConfirmUrl: string;
  readonly shoppingErrorUrl: string;
  readonly cartUrl: string;
  readonly loginUrl: string;

  // 表示要素（Twig未取込につきセレクタは意味で寄せる。要実機確認）。
  readonly orderTotalLabel: Locator; // 合計(税込) / Order Total (tax incl.)
  readonly body: Locator;
  readonly emailInput: Locator; // 未ログイン誘導後のログイン画面判定用
  readonly passwordInput: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;

    this.shoppingUrl = `${this.localePrefix}/shopping`;
    this.shoppingConfirmUrl = `${this.localePrefix}/shopping/confirm`;
    this.shoppingErrorUrl = `${this.localePrefix}/shopping/shopping_error`;
    this.cartUrl = `${this.localePrefix}/cart`;
    this.loginUrl = `${this.localePrefix}/mypage/login`;

    this.body = page.locator("body");
    // 合計ラベル。表示メッセージ節「合計(税込)」/ index.en.twig「Order Total (tax incl.)」由来。
    this.orderTotalLabel = page.getByText(/合計\(税込\)|Order Total \(tax incl\.\)/).first();
    this.emailInput = page
      .locator('input[name*="login_email"], input[type="email"], input[name*="email"]')
      .first();
    this.passwordInput = page
      .locator('input[name*="login_pass"], input[type="password"], input[name*="password"]')
      .first();
  }

  // 到達クラス（e2e/config/screen-reachability.tsv）:
  //   /shopping                = transition-only（md:62,299-301。起点=/cart「購入手続きへ」）
  //   /shopping/confirm        = action-endpoint（md:67。POSTのみで画面ではない）
  //   /shopping/shopping_error = 要確認（md:68にGET入口／md:301に遷移先。直アクセス可否は未規定）
  // いずれも直接開く到達メソッドは置かない。正規到達は spec 側で reachVia()、
  // 直アクセスそのものが観点のときは directAccess(page, <url>, 理由) を使う。

  /** ログイン（要 ECCUBE_FRONT_USER/PASS）。会員前提ケースの準備で使用。 */
  async loginAsMember() {
    await this.page.goto(this.loginUrl);
    await this.emailInput.fill(ECCUBE_FRONT_USER);
    await this.passwordInput.fill(ECCUBE_FRONT_PASS);
    await this.page.getByRole("button", { name: /ログイン|Login/i }).first().click();
  }

  /** カート未ロック・空のとき買い物かごへ戻ること（処理フロー由来）。 */
  async seeBackToCart() {
    await expect(this.page).toHaveURL(/\/cart(?:\/|\?|$)/);
  }

  /** 未ログインかつ非会員未登録のときログイン画面へ誘導されること（権限・認可由来）。 */
  async seeLoginRedirect() {
    await expect(this.page).toHaveURL(/\/mypage\/login|\/login/);
  }

  /** ご注文方法指定の入力フォーム（合計(税込)を含む注文情報画面）が表示されていないこと。 */
  async seeNoOrderMethodForm() {
    await expect(this.orderTotalLabel).toHaveCount(0);
  }
}
