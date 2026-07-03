import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_SHOP,
} from "../../../config/default.config";

/**
 * フロント 商品「商品一覧」（F03-01）Page Object。
 * integration_test/e2e/f03_01_front_product_product_search_list_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f03-01_front_product_product_search_list.md
 * （利用者視点の入口・処理フロー・集計条件・表示メッセージ・画面遷移）由来（オラクル独立性）。
 * ec-cube-enterprise/pf-eccube3 の Twig（Product/product_list_unisearch.twig 等）は本リポジトリに
 * 未取込のため、セレクタはフロントTwig差分に耐えるよう URL・表示文言・要素の意味で寄せる。
 * file:line 根拠が取れない箇所は要実機確認。未実行雛形。
 */
export class FrontProductListPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly searchUrl: string;

  readonly body: Locator;
  readonly searchForm: Locator;
  readonly productCount: Locator;
  readonly productItems: Locator;
  readonly sortLinks: Locator;
  readonly pagination: Locator;
  readonly noResultMessage: Locator;
  readonly tooManyMessage: Locator;
  readonly loginModal: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.searchUrl = `${this.localePrefix}/products/search`;

    this.body = page.locator("body");
    // 検索フォーム領域（詳細検索フォームはF03-03を正典。ここでは存在確認のみ）。要実機確認。
    this.searchForm = page.locator('form[name*="search"], form[action*="products/search"], form').first();
    // 商品数「商品数:（件数）点」。表示メッセージ節（常時表示）由来。要実機確認（セレクタ）。
    this.productCount = page.locator("text=/商品数[:：]/").first();
    // 一覧に並ぶ商品（サムネイル・商品リンク）。Twig差分に備え複数候補で拾う。要実機確認。
    this.productItems = page.locator(
      '.ec-shelfGrid__item, .productlist-item, [class*="product_item"], a[href*="/products/detail/"]'
    );
    // 並び替えリンク（色順・価格高い順・価格安い順）。要実機確認。
    this.sortLinks = page.locator('a[href*="sort="], a[href*="order="]');
    // ページ送り。要実機確認。
    this.pagination = page.locator('.pagination, .ec-pager, a[href*="page="]');
    // 0件メッセージ（表示メッセージ節・エラー/警告インライン）由来。
    this.noResultMessage = page.locator("text=ご指定の条件に一致する商品が見つかりませんでした");
    // 上限超過メッセージ（表示メッセージ節）由来。改行を含む文言のため先頭句で拾う。
    this.tooManyMessage = page.locator("text=ご指定の条件に一致する商品が多すぎます");
    // ログイン用モーダル（フロント挙動節：商品一覧はログイン用モーダルを内包）。要実機確認。
    this.loginModal = page.locator('#login_modal, [class*="login"][class*="modal"], .modal').first();
  }

  /** 検索条件なしで商品一覧を開く（初期表示）。 */
  async gotoInitial() {
    await this.page.goto(this.searchUrl);
  }

  /** 検索条件クエリ付きで商品一覧を開く（例: "name=カード"）。 */
  async gotoWithQuery(query: string) {
    const sep = query.startsWith("?") ? "" : "?";
    await this.page.goto(`${this.searchUrl}${sep}${query}`);
  }

  /** 一覧URL（/products/search 配下）に留まっていること。 */
  async expectOnListUrl() {
    await expect(this.page).toHaveURL(/\/products\/search(?:\/|\?|$)/);
  }

  /** 検索フォーム（＝一覧の入口）が表示されていること。期待は「利用者視点の入口」由来。 */
  async seeSearchForm() {
    await expect(this.searchForm).toBeVisible();
  }

  /** 0件メッセージ（本店経路）を表示していること。期待文言は「表示メッセージ」節由来。 */
  async seeNoResultMessage() {
    await expect(this.body).toContainText("ご指定の条件に一致する商品が見つかりませんでした");
  }

  /** 上限超過メッセージを表示していること。期待文言は「表示メッセージ」節由来。 */
  async seeTooManyMessage() {
    await expect(this.body).toContainText("ご指定の条件に一致する商品が多すぎます");
    await expect(this.body).toContainText("さらに絞り込むための条件を追加してください");
  }

  /** 商品数「商品数:（件数）点」を表示していること。期待文言は「表示メッセージ」節由来。 */
  async seeProductCount() {
    await expect(this.body).toContainText("商品数");
  }
}
