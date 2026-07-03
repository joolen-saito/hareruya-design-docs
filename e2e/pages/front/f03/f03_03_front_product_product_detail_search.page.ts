import { Locator, Page, expect } from "@playwright/test";
import {
  ECCUBE_FRONT_LOCALE,
  ECCUBE_FRONT_SHOP,
} from "../../../config/default.config";

/**
 * フロント 商品「商品詳細検索」（F03-03）Page Object。
 * integration_test/e2e/f03_03_front_product_product_detail_search_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f03-03_front_product_product_detail_search.md
 * （利用者視点の入口・フロント挙動・処理フロー・入力項目・画面遷移）由来（オラクル独立性）。
 * 詳細検索フォームは検索条件が空のとき `/{_locale}/products/search` で表示され、GET で
 * 同一の商品一覧検索エンドポイント（F03-01）へ入力値をクエリとして送信する。
 * ec-cube-enterprise/pf-eccube3 の Twig（Product/search.twig 等）は本リポジトリに未取込のため、
 * セレクタはフロントTwig差分に耐えるよう URL・クエリ名・要素の意味で寄せる。
 * file:line 根拠が取れない箇所は要実機確認。未実行雛形。
 */
export class FrontProductDetailSearchPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly searchUrl: string;

  readonly body: Locator;
  readonly searchForm: Locator;
  readonly productNameInput: Locator;
  readonly categorySelect: Locator;
  readonly cardsetSelect: Locator;
  readonly searchButton: Locator;
  readonly colorsAndOr: Locator;
  readonly foilOptions: Locator;
  readonly hiddenSort: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.searchUrl = `${this.localePrefix}/products/search`;

    this.body = page.locator("body");
    // 詳細検索フォーム領域。送信先は商品一覧検索エンドポイント（GET）。要実機確認（セレクタ）。
    this.searchForm = page
      .locator('form[action*="products/search"], form[name*="search"], form')
      .first();
    // 商品名入力欄。クエリ`product`（入力項目節）。オートコンプリート無効・プレースホルダ表示。要実機確認。
    this.productNameInput = page
      .locator('input[name="product"], input[name*="product"], input[type="text"]')
      .first();
    // カテゴリ選択（クエリ`category`・単一選択）。要実機確認。
    this.categorySelect = page.locator('select[name="category"], select[name*="category"]').first();
    // カードセット選択（クエリ`cardset`・単一選択）。要実機確認。
    this.cardsetSelect = page.locator('select[name="cardset"], select[name*="cardset"]').first();
    // 検索実行ボタン。文言はTwigの trans キー由来（要実機確認）。
    this.searchButton = page
      .getByRole("button", { name: /検索|Search/i })
      .or(page.locator('button[type="submit"], input[type="submit"]'))
      .first();
    // 色のAND／OR切替（クエリ`colorsType`・ラジオ・既定OR）。要実機確認。
    this.colorsAndOr = page.locator('input[name="colorsType"], input[name*="colorsType"]');
    // フォイル展開選択（クエリ`foilFlg`・複数選択）。要実機確認。
    this.foilOptions = page.locator('input[name*="foilFlg"], input[name*="foil"]');
    // 隠しパラメータ（並び順 sort/order・カードID・タグ・セールフラグ）。要実機確認。
    this.hiddenSort = page.locator('input[type="hidden"][name="sort"], input[type="hidden"][name*="sort"]');
  }

  /** 検索条件なしで詳細検索フォームを開く（初期表示）。 */
  async gotoForm() {
    await this.page.goto(this.searchUrl);
  }

  /** クエリ付きで検索エンドポイントを開く（例: "product=テスト"）。 */
  async gotoWithQuery(query: string) {
    const sep = query.startsWith("?") ? "" : "?";
    await this.page.goto(`${this.searchUrl}${sep}${query}`);
  }

  /** 検索エンドポイント（/products/search 配下）に留まっていること。 */
  async expectOnSearchUrl() {
    await expect(this.page).toHaveURL(/\/products\/search(?:\/|\?|$)/);
  }

  /** 詳細検索フォームが表示されていること（商品名入力欄・検索ボタン）。「利用者視点の入口」由来。 */
  async seeSearchForm() {
    await expect(this.productNameInput).toBeVisible();
    await expect(this.searchButton).toBeVisible();
  }

  /** 商品名を入力して検索する（GET送信）。 */
  async searchByProductName(name: string) {
    await this.productNameInput.fill(name);
    await this.searchButton.click();
  }
}
