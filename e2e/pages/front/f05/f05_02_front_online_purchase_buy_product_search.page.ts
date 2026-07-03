import { Locator, Page, expect } from "@playwright/test";
import { ECCUBE_FRONT_LOCALE, ECCUBE_FRONT_SHOP } from "../../../config/default.config";

/**
 * フロント ネット買取「買取詳細検索」（F05-02）Page Object。
 * integration_test/e2e/f05_02_front_online_purchase_buy_product_search_e2e_cases.md に対応。
 * 期待結果は functions/pf-eccube3/f05-02_front_online_purchase_buy_product_search.md
 *（利用者視点の入口・処理フロー・入力項目・エッジケース・画面遷移）由来。
 * ec-cube-enterprise/pf-eccube3 の Twig は本リポジトリに未取込のため、セレクタは Twig 差分に耐えるよう
 * URL・表示文言・フォーム要素の意味（クエリキー）で寄せる（file:line 根拠が取れない箇所は要実機確認）。未実行雛形。
 */
export class FrontPurchaseSearchPage {
  readonly page: Page;
  readonly localePrefix: string;
  readonly searchUrl: string;
  readonly categoryUrl: string;

  readonly form: Locator;
  readonly body: Locator;
  readonly cardNameInput: Locator; // 由来: クエリ product（カード名テキスト入力、最大長255）要実機確認
  readonly categorySelect: Locator; // 由来: クエリ category（カテゴリプルダウン）要実機確認
  readonly cardsetSelect: Locator; // 由来: クエリ cardset（エキスパンション）要実機確認
  readonly searchButton: Locator; // 由来: 検索ボタン文言「検索」要実機確認
  readonly errorArea: Locator;

  constructor(page: Page) {
    this.page = page;
    const shop = ECCUBE_FRONT_SHOP ? `/${ECCUBE_FRONT_SHOP}` : "";
    this.localePrefix = `/${ECCUBE_FRONT_LOCALE}${shop}`;
    this.searchUrl = `${this.localePrefix}/purchase/search`;
    this.categoryUrl = `${this.localePrefix}/purchase/category`;

    this.form = page.locator("form").first();
    this.body = page.locator("body");
    // カード名入力はクエリ product に対応するテキスト入力。差分に備え name/型の双方で拾う。
    this.cardNameInput = page
      .locator('input[name*="product"], input[name="product"], input[type="text"]')
      .first();
    this.categorySelect = page.locator('select[name*="category"]').first();
    this.cardsetSelect = page.locator('select[name*="cardset"]').first();
    this.searchButton = page
      .getByRole("button", { name: /検索|Search/i })
      .or(page.locator('button[type="submit"], input[type="submit"]'))
      .first();
    // 本機能固有のエラー応答は持たない（設計書「エラー処理」）。汎用エラー枠で観測用に定義。
    this.errorArea = page.locator(".text-danger, .ec-errorMessage, .error, [class*='error']");
  }

  /** 検索フォームを表示する（クエリなし）。 */
  async gotoSearchForm() {
    return this.page.goto(this.searchUrl);
  }

  /** クエリ文字列付きで買取詳細検索エンドポイントを開く（GET）。 */
  async gotoSearchWithQuery(query: string) {
    return this.page.goto(`${this.searchUrl}${query.startsWith("?") ? "" : "?"}${query}`);
  }

  /** 商品カテゴリ一覧を表示する。 */
  async gotoCategory() {
    return this.page.goto(this.categoryUrl);
  }

  /** カード名を入力して検索ボタンを押下する（GET送信）。 */
  async searchByCardName(name: string) {
    await this.cardNameInput.fill(name);
    await this.searchButton.click();
  }

  /** 検索フォームが表示されていること（検索ボタンで代表判定）。期待は設計書「利用者視点の入口」由来。 */
  async seeSearchForm() {
    await expect(this.searchButton).toBeVisible();
  }
}
