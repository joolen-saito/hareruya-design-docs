import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_FRONT_LOCALE, ECCUBE_FRONT_SHOP } from "../../../config/default.config";

/**
 * フロント ネット買取「買取商品一覧（買取価格一覧）」（F05-03）Page Object。
 * integration_test/e2e/f05_03_front_online_purchase_buy_product_list_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f05-03_front_online_purchase_buy_product_list.md
 *（利用者視点の入口・処理フロー・表示メッセージ・業務ルール）由来（オラクル独立性）。
 * pf-eccube3 の買取一覧 Twig（Purchase/product_list.twig 等）は本リポジトリに未取込のため、
 * セレクタは URL・表示文言・フォーム要素の意味で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export class FrontPurchaseListPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly searchUrl: string;

  readonly body: Locator;
  readonly searchForm: Locator;
  readonly productCount: Locator;
  readonly sortLinks: Locator;
  readonly cartAddButton: Locator;
  readonly quantityInput: Locator;
  readonly pagination: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    // 利用者視点の入口: GET /{_locale}/purchase/search?（各検索条件）
    this.searchUrl = `${this.localePrefix}/purchase/search`;

    this.body = page.locator("body");
    // 画面下部の検索フォーム（買取一覧は検索フォームと同一エンドポイントが返す）。要実機確認。
    this.searchForm = page.locator("form").first();
    // 商品数「商品数: （件数）点」。上限超過時は「9999+」。表示文言で拾う。要実機確認。
    this.productCount = page.getByText(/商品数/);
    // 表示順リンク（色順／価格(高い順)／価格(安い順)）。要実機確認。
    this.sortLinks = page.getByRole("link", { name: /色順|価格\(高い順\)|価格\(安い順\)/ });
    // カート追加ボタン（買取価格が買取最低価格500円以上のとき表示）。要実機確認。
    this.cartAddButton = page.getByRole("button", { name: /カートに追加|カートへ追加/ });
    this.quantityInput = page.locator('input[name*="quantity"], input[type="number"]');
    this.pagination = page.locator("[class*='pagination'], .pagenation, nav[aria-label*='age']").first();
  }

  /** 検索条件付き一覧を開く。query は "?" を含まない `key=value&...` を渡す。 */
  async gotoList(query = "") {
    const url = query ? `${this.searchUrl}?${query}` : this.searchUrl;
    return this.page.goto(url);
  }

  /** 未ログインでも閲覧できること（権限・認可: 未ログイン閲覧可）＝ログイン画面へ誘導されない。 */
  async seeViewableWithoutLogin() {
    await expect(this.page).not.toHaveURL(/\/mypage\/login/);
    await expect(this.page).toHaveURL(/\/purchase\//);
  }

  /** 0件時の案内（表示メッセージ節・エラー処理節由来）。ページ全体はHTTP404。 */
  async seeNotFoundMessage() {
    await expect(this.body).toContainText("お探しのカードは見つかりませんでした");
  }

  /** 上限（9999）超過時の案内（表示メッセージ節由来）。実体は取得しない。 */
  async seeTooManyMessage() {
    await expect(this.body).toContainText(
      "ご指定の条件に一致する商品が多すぎます。さらに絞り込むための条件を追加してください。",
    );
  }

  /** 商品数「商品数: N点」の表示（表示メッセージ節・常時表示由来）。上限超過時は「9999+」。 */
  async seeProductCount() {
    await expect(this.productCount.first()).toBeVisible();
  }
}
