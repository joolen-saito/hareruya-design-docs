import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_PASS,
  ECCUBE_FRONT_SHOP,
  ECCUBE_FRONT_USER,
} from "../../../config/default.config";

/**
 * フロント 会員「お気に入り登録商品一覧」（F06-09）Page Object。
 * integration_test/e2e/f06_09_front_member_mypage_favorite_product_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f06-09_front_member_mypage_favorite_product.md
 * （利用者視点の入口・フロント挙動・表示メッセージ・画面遷移・権限認可）由来。
 * pf-eccube3 の Twig（Mypage/favorite_list.twig）は本リポジトリに未取込のため、
 * セレクタはフロントTwig差分に耐えるよう URL・表示文言・要素の意味で寄せる
 * （file:line 根拠が取れない箇所は要実機確認）。本ファイルは未実行雛形。
 */
export class FrontMemberMypageFavoriteProductPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly loginUrl: string;
  readonly mypageUrl: string;
  readonly favoriteUrl: string;

  readonly heading: Locator;
  readonly body: Locator;
  readonly saleNotice: Locator;
  readonly itemCount: Locator;
  readonly saleToggle: Locator;
  readonly sortLinks: Locator;
  readonly mypageButton: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.loginUrl = `${this.localePrefix}/mypage/login`;
    this.mypageUrl = `${this.localePrefix}/mypage`;
    this.favoriteUrl = `${this.localePrefix}/mypage/favorite/list`;

    // 見出し「お気に入り登録商品一覧」。由来: 設計書 表示要素（Mypage/favorite_list.twig 見出し・要実機確認）。
    this.heading = page.getByText("お気に入り登録商品一覧", { exact: false });
    this.body = page.locator("body");
    // セール通知案内文。由来: 設計書 表示メッセージ（常時表示・要実機確認）。
    this.saleNotice = page.getByText(
      /セール対象になった際|become on sale/,
      { exact: false },
    );
    // 商品数「商品数: N 点」/「Items: N」。由来: 設計書 表示メッセージ（常時表示・要実機確認）。
    this.itemCount = page.getByText(/商品数|Items/, { exact: false }).first();
    // 「セール対象商品のみ表示する」切替（画像 sale_all.png/sale_available.png）。由来: 設計書 フロント挙動/画面遷移（要実機確認）。
    this.saleToggle = page
      .locator(
        'a[href*="sale="], img[src*="sale_all"], img[src*="sale_available"]',
      )
      .first();
    // 表示順リンク（登録順・価格(高い順)・価格(安い順)）。由来: 設計書 表示要素/画面遷移（要実機確認）。
    this.sortLinks = page.locator('a[href*="sort="]');
    // 「マイページ」ボタン。由来: 設計書 画面遷移（マイページトップへ戻る・要実機確認）。
    this.mypageButton = page
      .getByRole("link", { name: /マイページ|My Page/i })
      .first();
  }

  async gotoFavoriteList(query = "") {
    await this.page.goto(`${this.favoriteUrl}${query}`);
  }

  async gotoLoginPage() {
    await this.page.goto(this.loginUrl);
  }

  async login() {
    await this.gotoLoginPage();
    const email = this.page
      .locator(
        'input[name*="login_email"], input[type="email"], input[name*="email"]',
      )
      .first();
    const password = this.page
      .locator('input[name*="login_pass"], input[type="password"], input[name*="password"]')
      .first();
    await email.fill(ECCUBE_FRONT_USER);
    await password.fill(ECCUBE_FRONT_PASS);
    await this.page.getByRole("button", { name: /ログイン|Login/i }).click();
  }

  /** 未ログインで保護URLへアクセスするとログイン画面へ誘導されること。期待は設計書 権限・認可/エラー処理 由来。 */
  async expectLoginRedirect() {
    await expect(this.page).toHaveURL(/\/mypage\/login(?:\?|$)/);
    await expect(
      this.page.locator('input[type="password"], input[name*="password"]').first(),
    ).toBeVisible();
    // お気に入り一覧の見出しは表示されないこと（会員機能を出さずに誘導）。
    await expect(this.heading).toHaveCount(0);
  }

  /** お気に入り一覧の主要表示要素。期待は設計書 表示要素 由来。 */
  async seeFavoriteListScreen() {
    await expect(this.heading).toBeVisible();
    await expect(this.body).toContainText("様");
    await expect(this.mypageButton).toBeVisible();
  }

  /** セール通知案内文（常時表示）。期待は設計書 表示メッセージ 由来。 */
  async seeSaleNotice() {
    await expect(this.saleNotice).toBeVisible();
  }

  /** 商品数の表示（商品数: N 点 / Items: N）。期待は設計書 表示メッセージ 由来。 */
  async seeItemCount() {
    await expect(this.itemCount).toBeVisible();
  }

  /** セール絞り込み切替が存在し、クエリ sale= を付与できること。期待は設計書 画面遷移/集計条件 由来。 */
  async seeSaleToggle() {
    await expect(this.saleToggle).toBeVisible();
  }

  /** 表示順リンクが存在すること。期待は設計書 表示要素/画面遷移 由来。 */
  async seeSortLinks() {
    expect(await this.sortLinks.count()).toBeGreaterThan(0);
  }
}
